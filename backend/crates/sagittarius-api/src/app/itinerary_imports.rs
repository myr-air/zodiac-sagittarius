use serde::Deserialize;
use serde_json::{Value, json};
use std::process::Stdio;
use std::time::Duration;
use tokio::io::AsyncWriteExt;
use tokio::process::Command;
use uuid::Uuid;

use crate::app::auth;
use crate::db;
use crate::db::PgPool;
use crate::domain::errors::ServiceError;
use crate::domain::patches::ImportItineraryRequest;
use crate::domain::types::{
    ItineraryImportDocument, ItineraryImportItem, ItineraryImportTrip, PlanVariantSummary, TripRole,
};

const IMPORT_SCHEMA: &str = "joii.itinerary.export";
const IMPORT_VERSION: i32 = 1;

pub async fn import_itinerary(
    pool: &PgPool,
    trip_id: Uuid,
    session_token: &str,
    request: ImportItineraryRequest,
) -> Result<ItineraryImportDocument, ServiceError> {
    request.validate()?;
    let token_hash = auth::hash_session_token(session_token)?;
    let session = db::queries::find_active_member_session(pool, trip_id, &token_hash)
        .await?
        .ok_or(ServiceError::Unauthenticated)?;
    if !can_import_itinerary(session.role) {
        return Err(ServiceError::Forbidden);
    }

    let (trip, plan_variants) = tokio::try_join!(
        db::queries::find_trip_by_id(pool, trip_id),
        db::queries::list_plan_variants(pool, trip_id),
    )?;
    let trip = trip.ok_or(ServiceError::NotFound)?;
    let active_plan_variant_id =
        trip.active_plan_variant_id
            .ok_or(ServiceError::InvalidRequest(
                "trip has no active plan variant",
            ))?;
    let trip_context = ItineraryImportTrip {
        id: trip.id,
        name: trip.name.clone(),
        destination_label: trip.destination_label.clone(),
        start_date: trip.start_date,
        end_date: trip.end_date,
        active_plan_variant_id,
        main_trip_plan_id: active_plan_variant_id,
        trip_plans: plan_variants
            .into_iter()
            .map(PlanVariantSummary::from)
            .collect(),
    };

    let mode = request.mode.as_deref().unwrap_or("auto");
    if mode != "ai" {
        if let Ok(document) = parse_json_import(&request.content, &trip_context) {
            return Ok(document);
        }
        if mode == "json" {
            return Err(ServiceError::InvalidRequest(
                "import content must be itinerary JSON",
            ));
        }
    }

    convert_with_ai_provider(&request, &trip_context).await
}

fn parse_json_import(
    content: &str,
    trip_context: &ItineraryImportTrip,
) -> Result<ItineraryImportDocument, ServiceError> {
    let mut document: ItineraryImportDocument = serde_json::from_str(content)
        .map_err(|_| ServiceError::InvalidRequest("import content must be valid JSON"))?;
    if document.schema != IMPORT_SCHEMA || document.version != IMPORT_VERSION {
        return Err(ServiceError::InvalidRequest(
            "unsupported itinerary import schema",
        ));
    }

    document.source = "json".to_string();
    document.trip = trip_context.clone();
    normalize_items(&mut document.items)?;
    Ok(document)
}

async fn convert_with_ai_provider(
    request: &ImportItineraryRequest,
    trip_context: &ItineraryImportTrip,
) -> Result<ItineraryImportDocument, ServiceError> {
    match std::env::var("SAGITTARIUS_AI_PROVIDER")
        .unwrap_or_else(|_| "openrouter".to_string())
        .trim()
    {
        "" | "openrouter" => convert_with_openrouter(request, trip_context).await,
        "agy" | "antigravity-cli" => convert_with_antigravity_cli(request, trip_context).await,
        _ => Err(ServiceError::InvalidRequest(
            "unsupported itinerary ai provider",
        )),
    }
}

fn can_import_itinerary(role: TripRole) -> bool {
    matches!(role, TripRole::Owner | TripRole::Organizer)
}

async fn convert_with_openrouter(
    request: &ImportItineraryRequest,
    trip_context: &ItineraryImportTrip,
) -> Result<ItineraryImportDocument, ServiceError> {
    let api_key = std::env::var("OPENROUTER_API_KEY")
        .map_err(|_| ServiceError::InvalidRequest("OPENROUTER_API_KEY is required"))?;
    let model = std::env::var("OPENROUTER_MODEL").unwrap_or_else(|_| "openai/gpt-5.2".to_string());

    let client = reqwest::Client::new();
    let mut builder = client
        .post("https://openrouter.ai/api/v1/chat/completions")
        .bearer_auth(api_key)
        .json(&openrouter_request(&model, request, trip_context));

    if let Ok(site_url) = std::env::var("OPENROUTER_SITE_URL") {
        builder = builder.header("HTTP-Referer", site_url);
    }
    if let Ok(site_name) = std::env::var("OPENROUTER_SITE_NAME") {
        builder = builder.header("X-Title", site_name);
    }

    let response = builder
        .send()
        .await
        .map_err(|_| ServiceError::InvalidRequest("openrouter import request failed"))?;
    if !response.status().is_success() {
        return Err(ServiceError::InvalidRequest(
            "openrouter import request failed",
        ));
    }

    let response: OpenRouterResponse = response
        .json()
        .await
        .map_err(|_| ServiceError::InvalidRequest("openrouter response was invalid"))?;
    let content = response
        .choices
        .first()
        .map(|choice| choice.message.content.trim())
        .filter(|content| !content.is_empty())
        .ok_or(ServiceError::InvalidRequest(
            "openrouter response was empty",
        ))?;
    parse_ai_import_document(
        content,
        trip_context,
        "openrouter response was not itinerary JSON",
    )
}

async fn convert_with_antigravity_cli(
    request: &ImportItineraryRequest,
    trip_context: &ItineraryImportTrip,
) -> Result<ItineraryImportDocument, ServiceError> {
    ensure_antigravity_cli_allowed()?;

    let bin = std::env::var("ANTIGRAVITY_CLI_BIN").unwrap_or_else(|_| "agy".to_string());
    let timeout_seconds = std::env::var("ANTIGRAVITY_CLI_TIMEOUT_SECONDS")
        .ok()
        .and_then(|value| value.parse::<u64>().ok())
        .unwrap_or(45);

    let mut command = Command::new(&bin);
    command
        .kill_on_drop(true)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());

    let mut child = command
        .spawn()
        .map_err(|_| ServiceError::InvalidRequest("antigravity cli failed to start"))?;

    if let Some(mut stdin) = child.stdin.take() {
        stdin
            .write_all(itinerary_conversion_prompt(request, trip_context).as_bytes())
            .await
            .map_err(|_| ServiceError::InvalidRequest("antigravity cli stdin failed"))?;
    }

    let output = tokio::time::timeout(
        Duration::from_secs(timeout_seconds),
        child.wait_with_output(),
    )
    .await
    .map_err(|_| ServiceError::InvalidRequest("antigravity cli timed out"))?
    .map_err(|_| ServiceError::InvalidRequest("antigravity cli failed"))?;

    if !output.status.success() {
        return Err(ServiceError::InvalidRequest("antigravity cli failed"));
    }

    let stdout = String::from_utf8(output.stdout)
        .map_err(|_| ServiceError::InvalidRequest("antigravity cli output was invalid"))?;
    parse_ai_import_document(
        stdout.trim(),
        trip_context,
        "antigravity cli output was not itinerary JSON",
    )
}

fn ensure_antigravity_cli_allowed() -> Result<(), ServiceError> {
    let env = std::env::var("SAGITTARIUS_ENV").unwrap_or_default();
    if matches!(env.trim(), "production" | "staging") {
        return Err(ServiceError::InvalidRequest(
            "antigravity cli is development-only",
        ));
    }
    Ok(())
}

fn parse_ai_import_document(
    content: &str,
    trip_context: &ItineraryImportTrip,
    error: &'static str,
) -> Result<ItineraryImportDocument, ServiceError> {
    let json_content = extract_json_object(content).ok_or(ServiceError::InvalidRequest(error))?;
    let mut document: ItineraryImportDocument =
        serde_json::from_str(json_content).map_err(|_| ServiceError::InvalidRequest(error))?;
    if document.schema != IMPORT_SCHEMA || document.version != IMPORT_VERSION {
        return Err(ServiceError::InvalidRequest(error));
    }
    document.source = "ai".to_string();
    document.trip = trip_context.clone();
    normalize_items(&mut document.items)?;
    Ok(document)
}

fn extract_json_object(content: &str) -> Option<&str> {
    let trimmed = content.trim();
    if trimmed.starts_with('{') && trimmed.ends_with('}') {
        return Some(trimmed);
    }

    let start = trimmed.find('{')?;
    let end = trimmed.rfind('}')?;
    if start >= end {
        return None;
    }
    Some(&trimmed[start..=end])
}

fn openrouter_request(
    model: &str,
    request: &ImportItineraryRequest,
    trip_context: &ItineraryImportTrip,
) -> Value {
    json!({
        "model": model,
        "messages": [
            {
                "role": "system",
                "content": "Convert travel itinerary text into strict Joii itinerary JSON. Return JSON only. Do not invent dates outside the trip window. Use activityType only from travel, food, shopping, attraction, experience, stay."
            },
            {
                "role": "user",
                "content": itinerary_conversion_prompt(request, trip_context)
            }
        ],
        "response_format": {
            "type": "json_schema",
            "json_schema": {
                "name": "joii_itinerary_import",
                "strict": true,
                "schema": itinerary_json_schema()
            }
        }
    })
}

fn itinerary_conversion_prompt(
    request: &ImportItineraryRequest,
    trip_context: &ItineraryImportTrip,
) -> String {
    format!(
        "Return JSON only, with schema {IMPORT_SCHEMA} and version {IMPORT_VERSION}. Convert travel itinerary text into strict Joii itinerary JSON. Do not invent dates outside the trip window. Use activityType only from travel, food, shopping, attraction, experience, stay.\n\nTrip: {} ({}) from {} to {}. Active plan: {}. File name: {}. Content type: {}.\n\nSource text:\n{}",
        trip_context.name,
        trip_context.destination_label,
        trip_context.start_date,
        trip_context.end_date,
        trip_context.active_plan_variant_id,
        request.file_name.as_deref().unwrap_or("unknown"),
        request.content_type.as_deref().unwrap_or("text/plain"),
        request.content
    )
}

fn itinerary_json_schema() -> Value {
    let trip_schema = json!({
        "type": "object",
        "additionalProperties": false,
        "required": ["id", "name", "destinationLabel", "startDate", "endDate", "activePlanVariantId", "mainTripPlanId"],
        "properties": {
            "id": { "type": "string" },
            "name": { "type": "string" },
            "destinationLabel": { "type": "string" },
            "startDate": { "type": "string" },
            "endDate": { "type": "string" },
            "activePlanVariantId": { "type": "string" },
            "mainTripPlanId": { "type": "string" },
            "tripPlans": {
                "type": "array",
                "items": {
                    "type": "object",
                    "additionalProperties": false,
                    "required": ["id", "tripId", "name", "kind", "status", "description", "version"],
                    "properties": {
                        "id": { "type": "string" },
                        "tripId": { "type": "string" },
                        "name": { "type": "string" },
                        "kind": { "type": "string" },
                        "status": { "type": "string" },
                        "description": { "type": "string" },
                        "version": { "type": "integer" }
                    }
                }
            }
        }
    });
    let coordinates_schema = json!({
        "type": ["object", "null"],
        "additionalProperties": false,
        "required": ["lat", "lng"],
        "properties": {
            "lat": { "type": "number" },
            "lng": { "type": "number" }
        }
    });
    let item_schema = json!({
        "type": "object",
        "additionalProperties": false,
        "required": ["id", "day", "sortOrder", "startTime", "activity", "activityType", "place", "linkLabel", "mapLink", "durationMinutes", "transportation", "details", "advisories", "note"],
        "properties": {
            "id": { "type": "string" },
            "pathGroupId": { "type": ["string", "null"] },
            "pathId": { "type": ["string", "null"] },
            "pathName": { "type": ["string", "null"] },
            "pathRole": { "enum": ["main", "alternative", null] },
            "parentItemId": { "type": ["string", "null"] },
            "itemKind": { "enum": ["travel", "activity", "lodging", "meal", "note", "preparation", "foodRecommendation", null] },
            "timeMode": { "enum": ["scheduled", "flexible", null] },
            "isPlanBlock": { "type": ["boolean", "null"] },
            "status": { "enum": ["idea", "planned", "booked", "confirmed", "done", "skipped", null] },
            "priority": { "enum": ["low", "normal", "high", "must", null] },
            "day": { "type": "string" },
            "sortOrder": { "type": "integer" },
            "startTime": { "type": "string" },
            "endTime": { "type": ["string", "null"] },
            "endOffsetDays": { "type": ["integer", "null"] },
            "activity": { "type": "string" },
            "activityType": { "enum": ["travel", "food", "shopping", "attraction", "experience", "stay"] },
            "place": { "type": "string" },
            "linkLabel": { "type": "string" },
            "mapLink": { "type": "string" },
            "coordinates": coordinates_schema,
            "address": { "type": ["string", "null"] },
            "durationMinutes": { "type": ["integer", "null"] },
            "transportation": { "type": "string" },
            "details": { "type": "object" },
            "advisories": { "type": "array" },
            "note": { "type": "string" }
        }
    });
    let record_item_schema = json!({
        "type": "object",
        "additionalProperties": true
    });
    let records_schema = json!({
        "type": "object",
        "additionalProperties": false,
        "required": ["expenses", "bookingDocs", "stopNotes", "tasks"],
        "properties": {
            "expenses": {
                "type": "array",
                "items": record_item_schema
            },
            "bookingDocs": {
                "type": "array",
                "items": record_item_schema
            },
            "stopNotes": {
                "type": "array",
                "items": record_item_schema
            },
            "tasks": {
                "type": "array",
                "items": record_item_schema
            }
        }
    });
    json!({
        "type": "object",
        "additionalProperties": false,
        "required": ["schema", "version", "exportedAt", "trip", "items"],
        "properties": {
            "schema": { "const": IMPORT_SCHEMA },
            "version": { "const": IMPORT_VERSION },
            "exportedAt": { "type": "string" },
            "trip": trip_schema,
            "items": {
                "type": "array",
                "items": item_schema
            },
            "records": records_schema
        }
    })
}

fn normalize_items(items: &mut [ItineraryImportItem]) -> Result<(), ServiceError> {
    for (index, item) in items.iter_mut().enumerate() {
        if item.id.trim().is_empty() {
            item.id = format!("import-item-{}", index + 1);
        }
        if item.sort_order <= 0 {
            item.sort_order = ((index + 1) * 100) as i32;
        }
        validate_activity_type(&item.activity_type)?;
        if let Some(path_role) = &item.path_role {
            if !matches!(path_role.as_str(), "main" | "alternative") {
                return Err(ServiceError::InvalidRequest("unsupported path role"));
            }
        }
        validate_item_kind(&item.item_kind)?;
        validate_time_mode(&item.time_mode)?;
        validate_status(&item.status)?;
        validate_priority(&item.priority)?;
        if item.end_offset_days < 0 {
            return Err(ServiceError::InvalidRequest(
                "end offset days cannot be negative",
            ));
        }
    }
    Ok(())
}

fn validate_activity_type(value: &str) -> Result<(), ServiceError> {
    if matches!(
        value,
        "travel" | "food" | "shopping" | "attraction" | "experience" | "stay"
    ) {
        return Ok(());
    }
    Err(ServiceError::InvalidRequest("unsupported activity type"))
}

fn validate_item_kind(value: &str) -> Result<(), ServiceError> {
    if matches!(
        value,
        "travel" | "activity" | "lodging" | "meal" | "note" | "preparation" | "foodRecommendation"
    ) {
        return Ok(());
    }
    Err(ServiceError::InvalidRequest("unsupported item kind"))
}

fn validate_time_mode(value: &str) -> Result<(), ServiceError> {
    if matches!(value, "scheduled" | "flexible") {
        return Ok(());
    }
    Err(ServiceError::InvalidRequest("unsupported time mode"))
}

fn validate_status(value: &str) -> Result<(), ServiceError> {
    if matches!(
        value,
        "idea" | "planned" | "booked" | "confirmed" | "done" | "skipped"
    ) {
        return Ok(());
    }
    Err(ServiceError::InvalidRequest(
        "unsupported import item status",
    ))
}

fn validate_priority(value: &str) -> Result<(), ServiceError> {
    if matches!(value, "low" | "normal" | "high" | "must") {
        return Ok(());
    }
    Err(ServiceError::InvalidRequest(
        "unsupported import item priority",
    ))
}

#[derive(Debug, Deserialize)]
struct OpenRouterResponse {
    choices: Vec<OpenRouterChoice>,
}

#[derive(Debug, Deserialize)]
struct OpenRouterChoice {
    message: OpenRouterMessage,
}

#[derive(Debug, Deserialize)]
struct OpenRouterMessage {
    content: String,
}

#[cfg(test)]
mod tests {
    use super::itinerary_json_schema;

    #[test]
    fn ai_import_schema_preserves_trip_plans_and_plan_scoped_records() {
        let schema = itinerary_json_schema();

        assert_eq!(
            schema["properties"]["trip"]["properties"]["tripPlans"]["type"],
            "array"
        );
        assert_eq!(
            schema["properties"]["records"]["required"],
            serde_json::json!(["expenses", "bookingDocs", "stopNotes", "tasks"])
        );

        for bucket in ["expenses", "bookingDocs", "stopNotes", "tasks"] {
            assert_eq!(
                schema["properties"]["records"]["properties"][bucket]["type"],
                "array"
            );
            assert_eq!(
                schema["properties"]["records"]["properties"][bucket]["items"]["type"],
                "object"
            );
        }
    }
}
