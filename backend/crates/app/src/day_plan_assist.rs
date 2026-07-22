use std::collections::HashMap;
use std::sync::Arc;

use serde::Deserialize;
use serde_json::{Value, json};
use tokio::sync::Mutex;
use uuid::Uuid;

use crate::auth;
use crate::itinerary;
use sagittarius_db as db;
use sagittarius_db::PgPool;
use sagittarius_domain::capabilities::can;
use sagittarius_domain::errors::ServiceError;
use sagittarius_domain::patches::{
    CreateItineraryItemRequest, ItineraryItemPatch, PatchItineraryItemRequest,
    ReorderItineraryItemsRequest,
};
use sagittarius_domain::types::{
    Capability, DayPlanAssistMode, DayPlanAssistOption, DayPlanAssistOptionStatus,
    DayPlanAssistOptionStatusRow, DayPlanAssistRequest, DayPlanAssistResolutionRequest,
    DayPlanAssistResolutionResponse, DayPlanAssistResponse,
};
use sagittarius_realtime::RealtimeHub;

const STUB_PROVIDER: &str = "stub";
const PROVIDER_ENV: &str = "SAGITTARIUS_DAY_PLAN_ASSIST_PROVIDER";

const DIRECT_CONTEXT_KEYS: &[&str] = &["day", "stops", "mapPins"];
const INDIRECT_CONTEXT_KEYS: &[&str] = &[
    "trip",
    "mainPlanId",
    "selectedPlanId",
    "otherDays",
    "members",
    "constraints",
    "linkedBookings",
    "linkedEstimates",
    "linkedCommitments",
    "priorOutcomes",
];

/// In-process store of suggestion batches so Accept/Reject can resolve options
/// without a DB migration (sufficient for same-process contract tests + stub).
#[derive(Clone, Default)]
pub struct DayPlanAssistBatchStore {
    inner: Arc<Mutex<HashMap<Uuid, StoredBatch>>>,
}

#[derive(Debug, Clone)]
struct StoredBatch {
    trip_id: Uuid,
    options: Vec<StoredOption>,
}

#[derive(Debug, Clone)]
struct StoredOption {
    id: Uuid,
    status: DayPlanAssistOptionStatus,
    proposed_mutations: Vec<Value>,
}

impl DayPlanAssistBatchStore {
    async fn insert(&self, batch_id: Uuid, batch: StoredBatch) {
        self.inner.lock().await.insert(batch_id, batch);
    }

    async fn with_batch_mut<T>(
        &self,
        batch_id: Uuid,
        f: impl FnOnce(&mut StoredBatch) -> Result<T, ServiceError>,
    ) -> Result<T, ServiceError> {
        let mut guard = self.inner.lock().await;
        let batch = guard.get_mut(&batch_id).ok_or(ServiceError::NotFound)?;
        f(batch)
    }
}

pub async fn day_plan_assist(
    pool: &PgPool,
    batches: &DayPlanAssistBatchStore,
    trip_id: Uuid,
    session_token: &str,
    request: DayPlanAssistRequest,
) -> Result<DayPlanAssistResponse, ServiceError> {
    validate_request(&request)?;

    let token_hash = auth::hash_session_token(session_token)?;
    let session = db::queries::find_active_member_session(pool, trip_id, &token_hash)
        .await?
        .ok_or(ServiceError::Unauthenticated)?;
    if !can(session.role, Capability::EditItinerary) {
        return Err(ServiceError::Forbidden);
    }

    let packed = pack_context(&request)?;
    let options = match provider_name().as_str() {
        STUB_PROVIDER => stub_options(&request),
        "" | "openrouter" => openrouter_options(&request, &packed).await?,
        _ => {
            return Err(ServiceError::InvalidRequest(
                "unsupported day plan assist provider",
            ));
        }
    };

    let options = normalize_options(options)?;
    let batch_id = Uuid::now_v7();
    batches
        .insert(
            batch_id,
            StoredBatch {
                trip_id: session.trip_id,
                options: options
                    .iter()
                    .map(|option| StoredOption {
                        id: option.id,
                        status: DayPlanAssistOptionStatus::Open,
                        proposed_mutations: option.proposed_mutations.clone(),
                    })
                    .collect(),
            },
        )
        .await;

    Ok(DayPlanAssistResponse {
        batch_id,
        trip_id: session.trip_id,
        day: request.day,
        plan_variant_id: request.plan_variant_id,
        mode: request.mode,
        options,
    })
}

pub async fn accept_option(
    pool: &PgPool,
    realtime: &RealtimeHub,
    batches: &DayPlanAssistBatchStore,
    trip_id: Uuid,
    batch_id: Uuid,
    option_id: Uuid,
    session_token: &str,
    request: DayPlanAssistResolutionRequest,
) -> Result<DayPlanAssistResolutionResponse, ServiceError> {
    validate_resolution_request(&request)?;
    require_edit_itinerary(pool, trip_id, session_token).await?;

    let proposed = batches
        .with_batch_mut(batch_id, |batch| {
            if batch.trip_id != trip_id {
                return Err(ServiceError::NotFound);
            }
            let option = batch
                .options
                .iter()
                .find(|row| row.id == option_id)
                .ok_or(ServiceError::NotFound)?;
            if option.status != DayPlanAssistOptionStatus::Open {
                return Err(ServiceError::InvalidRequest(
                    "day plan assist option is not open",
                ));
            }
            Ok(option.proposed_mutations.clone())
        })
        .await?;

    apply_proposed_mutations(
        pool,
        realtime,
        trip_id,
        session_token,
        &request.client_mutation_id,
        &proposed,
    )
    .await?;

    let options = batches
        .with_batch_mut(batch_id, |batch| {
            for row in &mut batch.options {
                if row.id == option_id {
                    row.status = DayPlanAssistOptionStatus::Accepted;
                } else if row.status == DayPlanAssistOptionStatus::Open {
                    row.status = DayPlanAssistOptionStatus::Rejected;
                }
            }
            Ok(status_rows(batch))
        })
        .await?;

    Ok(DayPlanAssistResolutionResponse {
        batch_id,
        trip_id,
        option_id,
        status: DayPlanAssistOptionStatus::Accepted,
        options,
        applied_mutations: proposed,
    })
}

pub async fn reject_option(
    pool: &PgPool,
    batches: &DayPlanAssistBatchStore,
    trip_id: Uuid,
    batch_id: Uuid,
    option_id: Uuid,
    session_token: &str,
    request: DayPlanAssistResolutionRequest,
) -> Result<DayPlanAssistResolutionResponse, ServiceError> {
    validate_resolution_request(&request)?;
    require_edit_itinerary(pool, trip_id, session_token).await?;

    let options = batches
        .with_batch_mut(batch_id, |batch| {
            if batch.trip_id != trip_id {
                return Err(ServiceError::NotFound);
            }
            let option = batch
                .options
                .iter_mut()
                .find(|row| row.id == option_id)
                .ok_or(ServiceError::NotFound)?;
            if option.status != DayPlanAssistOptionStatus::Open {
                return Err(ServiceError::InvalidRequest(
                    "day plan assist option is not open",
                ));
            }
            option.status = DayPlanAssistOptionStatus::Rejected;
            Ok(status_rows(batch))
        })
        .await?;

    Ok(DayPlanAssistResolutionResponse {
        batch_id,
        trip_id,
        option_id,
        status: DayPlanAssistOptionStatus::Rejected,
        options,
        applied_mutations: Vec::new(),
    })
}

fn status_rows(batch: &StoredBatch) -> Vec<DayPlanAssistOptionStatusRow> {
    batch
        .options
        .iter()
        .map(|row| DayPlanAssistOptionStatusRow {
            id: row.id,
            status: row.status,
        })
        .collect()
}

async fn require_edit_itinerary(
    pool: &PgPool,
    trip_id: Uuid,
    session_token: &str,
) -> Result<(), ServiceError> {
    let token_hash = auth::hash_session_token(session_token)?;
    let session = db::queries::find_active_member_session(pool, trip_id, &token_hash)
        .await?
        .ok_or(ServiceError::Unauthenticated)?;
    if !can(session.role, Capability::EditItinerary) {
        return Err(ServiceError::Forbidden);
    }
    Ok(())
}

fn validate_resolution_request(
    request: &DayPlanAssistResolutionRequest,
) -> Result<(), ServiceError> {
    if request.client_mutation_id.trim().is_empty() {
        return Err(ServiceError::InvalidRequest(
            "clientMutationId is required",
        ));
    }
    Ok(())
}

async fn apply_proposed_mutations(
    pool: &PgPool,
    realtime: &RealtimeHub,
    trip_id: Uuid,
    session_token: &str,
    client_mutation_id: &str,
    mutations: &[Value],
) -> Result<(), ServiceError> {
    for (index, mutation) in mutations.iter().enumerate() {
        apply_proposed_mutation(
            pool,
            realtime,
            trip_id,
            session_token,
            &format!("{client_mutation_id}-apply-{index}"),
            mutation,
        )
        .await?;
    }
    Ok(())
}

async fn apply_proposed_mutation(
    pool: &PgPool,
    realtime: &RealtimeHub,
    trip_id: Uuid,
    session_token: &str,
    client_mutation_id: &str,
    mutation: &Value,
) -> Result<(), ServiceError> {
    let op = mutation
        .get("op")
        .and_then(|value| value.as_str())
        .ok_or(ServiceError::InvalidRequest(
            "proposed mutation missing op",
        ))?;

    match op {
        "patch" => {
            let item_id = mutation_uuid(mutation, "itemId")?;
            let patch_value = mutation.get("patch").cloned().ok_or(
                ServiceError::InvalidRequest("proposed patch mutation missing patch"),
            )?;
            let patch: ItineraryItemPatch = serde_json::from_value(patch_value).map_err(|_| {
                ServiceError::InvalidRequest("proposed patch mutation was invalid")
            })?;
            let expected_version = current_item_version(pool, trip_id, item_id).await?;
            itinerary::patch_itinerary_item(
                pool,
                realtime,
                trip_id,
                item_id,
                session_token,
                PatchItineraryItemRequest {
                    client_mutation_id: client_mutation_id.to_string(),
                    expected_version,
                    patch,
                },
            )
            .await?;
        }
        "create" => {
            let mut body = mutation.clone();
            if let Some(obj) = body.as_object_mut() {
                obj.remove("op");
                obj.insert(
                    "clientMutationId".to_string(),
                    Value::String(client_mutation_id.to_string()),
                );
            }
            let request: CreateItineraryItemRequest =
                serde_json::from_value(body).map_err(|_| {
                    ServiceError::InvalidRequest("proposed create mutation was invalid")
                })?;
            itinerary::create_itinerary_item(pool, realtime, trip_id, session_token, request)
                .await?;
        }
        "delete" => {
            let item_id = mutation_uuid(mutation, "itemId")?;
            itinerary::delete_itinerary_item(pool, realtime, trip_id, item_id, session_token)
                .await?;
        }
        "reorder" => {
            let mut body = mutation.clone();
            if let Some(obj) = body.as_object_mut() {
                obj.remove("op");
                obj.insert(
                    "clientMutationId".to_string(),
                    Value::String(client_mutation_id.to_string()),
                );
            }
            let request: ReorderItineraryItemsRequest =
                serde_json::from_value(body).map_err(|_| {
                    ServiceError::InvalidRequest("proposed reorder mutation was invalid")
                })?;
            itinerary::reorder_itinerary_items(pool, realtime, trip_id, session_token, request)
                .await?;
        }
        _ => {
            return Err(ServiceError::InvalidRequest(
                "unsupported day plan assist mutation op",
            ));
        }
    }
    Ok(())
}

fn mutation_uuid(mutation: &Value, key: &str) -> Result<Uuid, ServiceError> {
    mutation
        .get(key)
        .and_then(|value| value.as_str())
        .and_then(|raw| Uuid::parse_str(raw).ok())
        .ok_or(ServiceError::InvalidRequest(
            "proposed mutation missing itemId",
        ))
}

async fn current_item_version(
    pool: &PgPool,
    trip_id: Uuid,
    item_id: Uuid,
) -> Result<i64, ServiceError> {
    let mut tx = pool.begin().await?;
    let existing = db::queries::lock_itinerary_item(&mut tx, item_id)
        .await?
        .ok_or(ServiceError::NotFound)?;
    if existing.trip_id != trip_id {
        return Err(ServiceError::NotFound);
    }
    let version = existing.version;
    tx.commit().await?;
    Ok(version)
}

fn provider_name() -> String {
    std::env::var(PROVIDER_ENV)
        .unwrap_or_else(|_| "openrouter".to_string())
        .trim()
        .to_ascii_lowercase()
}

fn validate_request(request: &DayPlanAssistRequest) -> Result<(), ServiceError> {
    if request.client_mutation_id.trim().is_empty() {
        return Err(ServiceError::InvalidRequest(
            "clientMutationId is required",
        ));
    }
    if request.selected_fields.is_empty() {
        return Err(ServiceError::InvalidRequest(
            "selectedFields must not be empty",
        ));
    }
    Ok(())
}

/// Validate and return the packed direct/indirect context for the provider prompt.
fn pack_context(request: &DayPlanAssistRequest) -> Result<Value, ServiceError> {
    let direct = request
        .context
        .direct
        .as_object()
        .ok_or(ServiceError::InvalidRequest("context.direct must be an object"))?;
    for key in DIRECT_CONTEXT_KEYS {
        if !direct.contains_key(*key) {
            return Err(ServiceError::InvalidRequest(
                "context.direct is missing a required key",
            ));
        }
    }

    let indirect = request
        .context
        .indirect
        .as_object()
        .ok_or(ServiceError::InvalidRequest(
            "context.indirect must be an object",
        ))?;
    for key in INDIRECT_CONTEXT_KEYS {
        if !indirect.contains_key(*key) {
            return Err(ServiceError::InvalidRequest(
                "context.indirect is missing a required key",
            ));
        }
    }

    Ok(json!({
        "direct": request.context.direct.clone(),
        "indirect": request.context.indirect.clone(),
        "day": request.day,
        "planVariantId": request.plan_variant_id,
        "selectedItemIds": request.selected_item_ids,
        "selectedFields": request.selected_fields,
        "mapPins": request.map_pins,
        "mode": request.mode,
    }))
}

fn stub_options(request: &DayPlanAssistRequest) -> Vec<DayPlanAssistOption> {
    let affects = request.selected_item_ids.clone();
    let primary = affects.first().copied();

    match request.mode {
        DayPlanAssistMode::Suggest => vec![
            DayPlanAssistOption {
                id: Uuid::now_v7(),
                label: "A".to_string(),
                title: "Plan A · Keep order + buffer".to_string(),
                summary: "Keep stop order; add transfer buffer.".to_string(),
                why: "Packed day stops and geo pins support a modest buffer without reordering."
                    .to_string(),
                affects_item_ids: affects.clone(),
                proposed_mutations: primary
                    .map(|item_id| {
                        vec![json!({
                            "op": "patch",
                            "itemId": item_id,
                            "patch": { "durationMinutes": 90 }
                        })]
                    })
                    .unwrap_or_default(),
            },
            DayPlanAssistOption {
                id: Uuid::now_v7(),
                label: "B".to_string(),
                title: "Plan B · Food-first".to_string(),
                summary: "Bias the morning toward food stops.".to_string(),
                why: "Indirect constraints and prior outcomes favor fewer aggressive transfers."
                    .to_string(),
                affects_item_ids: affects.clone(),
                proposed_mutations: Vec::new(),
            },
            DayPlanAssistOption {
                id: Uuid::now_v7(),
                label: "C".to_string(),
                title: "Plan C · Easy transfer".to_string(),
                summary: "Prefer shorter walking legs between pins.".to_string(),
                why: "Map pins and mobility constraints make an easy-transfer plan valid."
                    .to_string(),
                affects_item_ids: affects,
                proposed_mutations: Vec::new(),
            },
        ],
        DayPlanAssistMode::AutoRoute => vec![
            DayPlanAssistOption {
                id: Uuid::now_v7(),
                label: "A".to_string(),
                title: "Route fill · Walk + MTR".to_string(),
                summary: "Fill From/To/By using walk and MTR legs.".to_string(),
                why: "Auto-route uses day map pins to propose transit legs without mutating yet."
                    .to_string(),
                affects_item_ids: affects.clone(),
                proposed_mutations: primary
                    .map(|item_id| {
                        vec![json!({
                            "op": "patch",
                            "itemId": item_id,
                            "patch": { "transportation": "mtr" }
                        })]
                    })
                    .unwrap_or_default(),
            },
            DayPlanAssistOption {
                id: Uuid::now_v7(),
                label: "B".to_string(),
                title: "Route fill · Taxi buffer".to_string(),
                summary: "Fill transfer gaps with short taxi legs.".to_string(),
                why: "Geo spacing between stops favors taxi when walking would be long."
                    .to_string(),
                affects_item_ids: affects,
                proposed_mutations: Vec::new(),
            },
        ],
    }
}

async fn openrouter_options(
    request: &DayPlanAssistRequest,
    packed: &Value,
) -> Result<Vec<DayPlanAssistOption>, ServiceError> {
    let completed = crate::openrouter::chat_completion_json(crate::openrouter::ChatCompletionRequest {
        messages: vec![
            crate::openrouter::ChatMessage {
                role: "system",
                content: openrouter_system_prompt(request.mode),
            },
            crate::openrouter::ChatMessage {
                role: "user",
                content: packed.to_string(),
            },
        ],
        temperature: 0.2,
        json_object: true,
        response_format: None,
        user_agent: None,
    })
    .await
    .map_err(|err| match err {
        ServiceError::InvalidRequest(msg) if msg.contains("openrouter") => {
            ServiceError::InvalidRequest("openrouter day plan assist request failed")
        }
        other => other,
    })?;

    parse_openrouter_options(&completed.content, request)
}

fn openrouter_system_prompt(mode: DayPlanAssistMode) -> String {
    format!(
        "You are Joii day-plan assist ({mode}). Return strict JSON with an `options` array of 1 to 3 plans. Each option must include id (uuid), label, title, summary, why (non-empty explainability), affectsItemIds, and proposedMutations. Do not apply mutations; only propose them. Mode `{mode}`: for suggest vary day plans; for autoRoute fill From/To/By transport legs.",
        mode = mode.as_str()
    )
}

fn parse_openrouter_options(
    content: &str,
    request: &DayPlanAssistRequest,
) -> Result<Vec<DayPlanAssistOption>, ServiceError> {
    let payload: OpenRouterOptionsPayload = serde_json::from_str(content).map_err(|_| {
        ServiceError::InvalidRequest("openrouter response was not day plan assist JSON")
    })?;

    let mut options = Vec::new();
    for raw in payload.options.into_iter().take(3) {
        let why = raw.why.unwrap_or_default();
        if why.trim().is_empty() {
            continue;
        }
        options.push(DayPlanAssistOption {
            id: raw.id.unwrap_or_else(Uuid::now_v7),
            label: non_empty_or(raw.label, "A"),
            title: non_empty_or(raw.title, "Suggested plan"),
            summary: raw.summary.unwrap_or_default(),
            why,
            affects_item_ids: if raw.affects_item_ids.is_empty() {
                request.selected_item_ids.clone()
            } else {
                raw.affects_item_ids
            },
            proposed_mutations: raw.proposed_mutations,
        });
    }

    if options.is_empty() {
        return Err(ServiceError::InvalidRequest(
            "openrouter returned no valid day plan options with why",
        ));
    }
    Ok(options)
}

fn non_empty_or(value: Option<String>, fallback: &str) -> String {
    value
        .filter(|s| !s.trim().is_empty())
        .unwrap_or_else(|| fallback.to_string())
}

fn normalize_options(options: Vec<DayPlanAssistOption>) -> Result<Vec<DayPlanAssistOption>, ServiceError> {
    let options: Vec<_> = options
        .into_iter()
        .filter(|option| !option.why.trim().is_empty())
        .take(3)
        .collect();
    if options.is_empty() {
        return Err(ServiceError::InvalidRequest(
            "day plan assist must return at least one option with why",
        ));
    }
    Ok(options)
}

#[derive(Debug, Deserialize)]
struct OpenRouterOptionsPayload {
    options: Vec<OpenRouterOptionRaw>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct OpenRouterOptionRaw {
    id: Option<Uuid>,
    label: Option<String>,
    title: Option<String>,
    summary: Option<String>,
    why: Option<String>,
    #[serde(default)]
    affects_item_ids: Vec<Uuid>,
    #[serde(default)]
    proposed_mutations: Vec<Value>,
}
