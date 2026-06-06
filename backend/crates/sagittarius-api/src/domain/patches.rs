use serde::{Deserialize, Deserializer, Serialize};
use serde_json::Value;
use time::Date;
use uuid::Uuid;

use crate::domain::errors::ServiceError;
use crate::domain::types::{TripMemberAccessStatus, TripRole};

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PatchItineraryItemRequest {
    pub client_mutation_id: String,
    pub expected_version: i64,
    pub patch: ItineraryItemPatch,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PatchTripRequest {
    pub client_mutation_id: String,
    pub expected_version: i64,
    pub name: Option<String>,
    pub destination_label: Option<String>,
    pub countries: Option<Vec<String>>,
    pub start_date: Option<Date>,
    pub end_date: Option<Date>,
    pub active_plan_variant_id: Option<Uuid>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateItineraryItemRequest {
    pub client_mutation_id: String,
    pub plan_variant_id: Uuid,
    pub path_group_id: Option<String>,
    pub path_id: Option<String>,
    pub path_name: Option<String>,
    pub path_role: Option<String>,
    pub day: Date,
    pub start_time: Option<String>,
    pub activity: String,
    pub activity_type: String,
    pub place: String,
    pub map_link: Option<String>,
    pub address: Option<String>,
    pub latitude: Option<f64>,
    pub longitude: Option<f64>,
    pub duration_minutes: Option<i32>,
    pub transportation: Option<String>,
    pub note: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreatePlanVariantRequest {
    pub client_mutation_id: String,
    pub name: String,
    pub kind: String,
    pub description: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PatchPlanVariantRequest {
    pub client_mutation_id: String,
    pub expected_version: i64,
    pub patch: PlanVariantPatch,
}

#[derive(Debug, Clone, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PlanVariantPatch {
    pub name: Option<String>,
    pub kind: Option<String>,
    pub description: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PublishPlanVariantRequest {
    pub client_mutation_id: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReorderItineraryItemsRequest {
    pub client_mutation_id: String,
    pub plan_variant_id: Uuid,
    pub day: Date,
    pub item_ids: Vec<Uuid>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ImportItineraryRequest {
    pub file_name: Option<String>,
    pub content_type: Option<String>,
    pub mode: Option<String>,
    pub content: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateStopNoteRequest {
    pub client_mutation_id: String,
    pub itinerary_item_id: Uuid,
    pub body: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PatchStopNoteRequest {
    pub client_mutation_id: String,
    pub expected_version: i64,
    pub body: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateExpenseRequest {
    pub client_mutation_id: String,
    pub title: String,
    pub amount_minor: i32,
    pub currency: Option<String>,
    pub exchange_rate_to_settlement_currency: Option<f64>,
    pub notes: Option<String>,
    pub receipt_url: Option<String>,
    pub line_items: Option<Value>,
    pub comments: Option<Value>,
    pub paid_by: Uuid,
    pub category: String,
    pub splits: Value,
    pub itinerary_item_id: Option<Uuid>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PatchExpenseRequest {
    pub client_mutation_id: String,
    pub expected_version: i64,
    pub title: Option<String>,
    pub amount_minor: Option<i32>,
    pub currency: Option<String>,
    pub exchange_rate_to_settlement_currency: Option<f64>,
    pub notes: Option<String>,
    pub receipt_url: Option<String>,
    pub line_items: Option<Value>,
    pub comments: Option<Value>,
    pub paid_by: Option<Uuid>,
    pub category: Option<String>,
    pub splits: Option<Value>,
    #[serde(default, deserialize_with = "deserialize_nullable_uuid_patch")]
    pub itinerary_item_id: Option<Option<Uuid>>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RecordExpenseReminderRequest {
    pub client_mutation_id: String,
    pub from: Uuid,
    pub to: Uuid,
    pub amount_minor: i32,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateMemberRequest {
    pub display_name: String,
    pub role: TripRole,
    pub color: String,
    pub participant_password: Option<String>,
}

#[derive(Debug, Clone, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PatchMemberRequest {
    pub display_name: Option<String>,
    pub role: Option<TripRole>,
    pub access_status: Option<TripMemberAccessStatus>,
    pub participant_password: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdatePresenceRequest {
    pub client_mutation_id: String,
    pub presence: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PatchDailyBriefingRequest {
    pub client_mutation_id: String,
    pub expected_version: i64,
    pub outfit_advice: Option<Option<String>>,
    pub festival_note: Option<Option<String>>,
    pub facts_note: Option<Option<String>>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateSuggestionRequest {
    pub client_mutation_id: String,
    pub r#type: String,
    pub target_item_id: Option<Uuid>,
    pub plan_variant_id: Uuid,
    pub source_version: Option<i64>,
    pub proposed_patch: Value,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateTaskRequest {
    pub client_mutation_id: String,
    pub title: String,
    pub visibility: String,
    pub kind: Option<String>,
    pub assignee_id: Option<Uuid>,
    pub related_item_id: Option<Uuid>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PatchTaskRequest {
    pub client_mutation_id: String,
    pub expected_version: i64,
    pub patch: TaskPatch,
}

#[derive(Debug, Clone, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TaskPatch {
    pub title: Option<String>,
    pub status: Option<String>,
    #[serde(default, deserialize_with = "deserialize_nullable_uuid_patch")]
    pub assignee_id: Option<Option<Uuid>>,
    #[serde(default, deserialize_with = "deserialize_nullable_uuid_patch")]
    pub related_item_id: Option<Option<Uuid>>,
}

impl CreateTaskRequest {
    pub fn validate(&self) -> Result<(), ServiceError> {
        validate_client_mutation_id(&self.client_mutation_id)?;
        validate_task_title(&self.title)?;
        validate_task_visibility(&self.visibility)?;
        if let Some(kind) = &self.kind {
            validate_task_kind(kind)?;
        }

        Ok(())
    }
}

impl PatchTaskRequest {
    pub fn validate(&self) -> Result<(), ServiceError> {
        validate_client_mutation_id(&self.client_mutation_id)?;
        self.patch.validate()
    }
}

impl PatchDailyBriefingRequest {
    pub fn validate(&self) -> Result<(), ServiceError> {
        validate_client_mutation_id(&self.client_mutation_id)?;
        validate_optional_override(&self.outfit_advice, "outfitAdvice")?;
        validate_optional_override(&self.festival_note, "festivalNote")?;
        validate_optional_override(&self.facts_note, "factsNote")?;
        Ok(())
    }
}

impl CreateItineraryItemRequest {
    pub fn validate(&self) -> Result<(), ServiceError> {
        validate_client_mutation_id(&self.client_mutation_id)?;
        if let Some(start_time) = &self.start_time {
            validate_hh_mm(start_time)?;
        }
        validate_required_text(&self.activity, "activity is required")?;
        validate_activity_type(&self.activity_type)?;
        if let Some(path_role) = &self.path_role {
            validate_path_role(path_role)?;
        }
        validate_required_text(&self.place, "place is required")?;
        if self
            .duration_minutes
            .is_some_and(|duration_minutes| duration_minutes <= 0)
        {
            return Err(ServiceError::InvalidRequest(
                "duration_minutes must be greater than zero",
            ));
        }
        validate_coordinates(self.latitude, self.longitude)?;

        Ok(())
    }
}

impl ReorderItineraryItemsRequest {
    pub fn validate(&self) -> Result<(), ServiceError> {
        validate_client_mutation_id(&self.client_mutation_id)?;
        if self.item_ids.is_empty() {
            return Err(ServiceError::InvalidRequest("item_ids are required"));
        }

        Ok(())
    }
}

impl ImportItineraryRequest {
    pub fn validate(&self) -> Result<(), ServiceError> {
        let mode = self.mode.as_deref().unwrap_or("auto");
        if !matches!(mode, "auto" | "json" | "ai") {
            return Err(ServiceError::InvalidRequest("unsupported import mode"));
        }
        if self.content.trim().is_empty() {
            return Err(ServiceError::InvalidRequest("import content is required"));
        }
        if self.content.len() > 120_000 {
            return Err(ServiceError::InvalidRequest("import content is too large"));
        }
        Ok(())
    }
}

impl CreatePlanVariantRequest {
    pub fn validate(&self) -> Result<(), ServiceError> {
        validate_client_mutation_id(&self.client_mutation_id)?;
        validate_required_text(&self.name, "plan variant name is required")?;
        validate_plan_variant_kind(&self.kind)?;
        if let Some(description) = &self.description {
            validate_sized_text(description, "plan variant description is too long")?;
        }

        Ok(())
    }
}

impl PatchPlanVariantRequest {
    pub fn validate(&self) -> Result<(), ServiceError> {
        validate_client_mutation_id(&self.client_mutation_id)?;
        self.patch.validate()
    }
}

impl PlanVariantPatch {
    pub fn validate(&self) -> Result<(), ServiceError> {
        if let Some(name) = &self.name {
            validate_required_text(name, "plan variant name is required")?;
        }
        if let Some(kind) = &self.kind {
            validate_plan_variant_kind(kind)?;
        }
        if let Some(description) = &self.description {
            validate_sized_text(description, "plan variant description is too long")?;
        }

        Ok(())
    }
}

impl PublishPlanVariantRequest {
    pub fn validate(&self) -> Result<(), ServiceError> {
        validate_client_mutation_id(&self.client_mutation_id)
    }
}

impl CreateStopNoteRequest {
    pub fn validate(&self) -> Result<(), ServiceError> {
        validate_client_mutation_id(&self.client_mutation_id)?;
        validate_stop_note_body(&self.body)
    }
}

impl PatchStopNoteRequest {
    pub fn validate(&self) -> Result<(), ServiceError> {
        validate_client_mutation_id(&self.client_mutation_id)?;
        validate_stop_note_body(&self.body)
    }
}

impl CreateExpenseRequest {
    pub fn validate(&self) -> Result<(), ServiceError> {
        validate_client_mutation_id(&self.client_mutation_id)?;
        validate_required_text(&self.title, "expense title is required")?;
        validate_amount_minor(self.amount_minor)?;
        if let Some(currency) = &self.currency {
            validate_required_text(currency, "expense currency is required")?;
        }
        if let Some(notes) = &self.notes {
            validate_sized_text(notes, "expense notes are too long")?;
        }
        if let Some(receipt_url) = &self.receipt_url {
            validate_required_text(receipt_url, "expense receipt link is required")?;
        }
        validate_exchange_rate(self.exchange_rate_to_settlement_currency)?;
        validate_line_items(self.line_items.as_ref())?;
        validate_comments(self.comments.as_ref())?;
        validate_expense_category(&self.category)?;
        validate_expense_splits_total(&self.splits, self.amount_minor)
    }
}

impl PatchExpenseRequest {
    pub fn validate(&self) -> Result<(), ServiceError> {
        validate_client_mutation_id(&self.client_mutation_id)?;
        if let Some(title) = &self.title {
            validate_required_text(title, "expense title is required")?;
        }
        if let Some(amount_minor) = self.amount_minor {
            validate_amount_minor(amount_minor)?;
        }
        if let Some(currency) = &self.currency {
            validate_required_text(currency, "expense currency is required")?;
        }
        if let Some(notes) = &self.notes {
            validate_sized_text(notes, "expense notes are too long")?;
        }
        if let Some(receipt_url) = &self.receipt_url {
            validate_required_text(receipt_url, "expense receipt link is required")?;
        }
        validate_exchange_rate(self.exchange_rate_to_settlement_currency)?;
        validate_line_items(self.line_items.as_ref())?;
        validate_comments(self.comments.as_ref())?;
        if let Some(category) = &self.category {
            validate_expense_category(category)?;
        }
        if let Some(splits) = &self.splits {
            validate_splits(splits)?;
        }
        if let (Some(amount_minor), Some(splits)) = (self.amount_minor, &self.splits) {
            validate_expense_splits_total(splits, amount_minor)?;
        }
        if self.title.is_none()
            && self.amount_minor.is_none()
            && self.currency.is_none()
            && self.exchange_rate_to_settlement_currency.is_none()
            && self.notes.is_none()
            && self.receipt_url.is_none()
            && self.line_items.is_none()
            && self.comments.is_none()
            && self.paid_by.is_none()
            && self.category.is_none()
            && self.splits.is_none()
            && self.itinerary_item_id.is_none()
        {
            return Err(ServiceError::InvalidRequest("expense patch is empty"));
        }

        Ok(())
    }
}

impl RecordExpenseReminderRequest {
    pub fn validate(&self) -> Result<(), ServiceError> {
        validate_client_mutation_id(&self.client_mutation_id)?;
        if self.amount_minor <= 0 {
            return Err(ServiceError::InvalidRequest(
                "expense reminder amount_minor must be greater than zero",
            ));
        }
        Ok(())
    }
}

impl CreateMemberRequest {
    pub fn validate(&self) -> Result<(), ServiceError> {
        validate_required_text(&self.display_name, "member display name is required")?;
        validate_member_role(self.role)?;
        validate_required_text(&self.color, "member color is required")?;
        if let Some(password) = &self.participant_password {
            validate_participant_password(password)?;
        }

        Ok(())
    }
}

impl PatchMemberRequest {
    pub fn validate(&self) -> Result<(), ServiceError> {
        if let Some(display_name) = &self.display_name {
            validate_required_text(display_name, "member display name is required")?;
        }
        if let Some(role) = self.role {
            validate_member_role(role)?;
        }
        if let Some(password) = &self.participant_password {
            validate_participant_password(password)?;
        }
        if self.display_name.is_none()
            && self.role.is_none()
            && self.access_status.is_none()
            && self.participant_password.is_none()
        {
            return Err(ServiceError::InvalidRequest("member patch is empty"));
        }

        Ok(())
    }
}

#[derive(Debug, Clone, Default, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ItineraryItemPatch {
    pub path_group_id: Option<String>,
    pub path_id: Option<String>,
    pub path_name: Option<String>,
    pub path_role: Option<String>,
    pub day: Option<Date>,
    pub start_time: Option<String>,
    pub duration_minutes: Option<i32>,
    pub activity: Option<String>,
    pub activity_type: Option<String>,
    pub place: Option<String>,
    pub map_link: Option<String>,
    #[serde(default, deserialize_with = "deserialize_nullable_string_patch")]
    pub address: Option<Option<String>>,
    #[serde(default, deserialize_with = "deserialize_nullable_f64_patch")]
    pub latitude: Option<Option<f64>>,
    #[serde(default, deserialize_with = "deserialize_nullable_f64_patch")]
    pub longitude: Option<Option<f64>>,
    pub transportation: Option<String>,
    pub note: Option<String>,
}

impl ItineraryItemPatch {
    pub fn validate(&self) -> Result<(), ServiceError> {
        if let Some(start_time) = &self.start_time {
            validate_hh_mm(start_time)?;
        }

        if self
            .duration_minutes
            .is_some_and(|duration_minutes| duration_minutes <= 0)
        {
            return Err(ServiceError::InvalidRequest(
                "duration_minutes must be greater than zero",
            ));
        }

        if let Some(activity_type) = &self.activity_type {
            validate_activity_type(activity_type)?;
        }

        if let Some(path_role) = &self.path_role {
            validate_path_role(path_role)?;
        }
        validate_coordinate_patch(self.latitude, self.longitude)?;

        Ok(())
    }
}

impl TaskPatch {
    pub fn validate(&self) -> Result<(), ServiceError> {
        if let Some(title) = &self.title {
            validate_task_title(title)?;
        }

        if let Some(status) = &self.status {
            validate_task_status(status)?;
        }

        if self.title.is_none()
            && self.status.is_none()
            && self.assignee_id.is_none()
            && self.related_item_id.is_none()
        {
            return Err(ServiceError::InvalidRequest("task patch is empty"));
        }

        Ok(())
    }
}

fn validate_hh_mm(value: &str) -> Result<(), ServiceError> {
    let Some((hour, minute)) = value.split_once(':') else {
        return Err(ServiceError::InvalidRequest("start_time must be HH:MM"));
    };

    if hour.len() != 2 || minute.len() != 2 {
        return Err(ServiceError::InvalidRequest("start_time must be HH:MM"));
    }

    let hour = hour
        .parse::<u8>()
        .map_err(|_| ServiceError::InvalidRequest("start_time must be HH:MM"))?;
    let minute = minute
        .parse::<u8>()
        .map_err(|_| ServiceError::InvalidRequest("start_time must be HH:MM"))?;

    if hour > 23 || minute > 59 {
        return Err(ServiceError::InvalidRequest("start_time must be HH:MM"));
    }

    Ok(())
}

fn validate_activity_type(value: &str) -> Result<(), ServiceError> {
    match value {
        "travel" | "food" | "shopping" | "attraction" | "experience" | "stay" => Ok(()),
        _ => Err(ServiceError::InvalidRequest("activity_type is invalid")),
    }
}

fn validate_path_role(value: &str) -> Result<(), ServiceError> {
    match value {
        "main" | "alternative" => Ok(()),
        _ => Err(ServiceError::InvalidRequest("path_role is invalid")),
    }
}

fn validate_client_mutation_id(value: &str) -> Result<(), ServiceError> {
    if value.trim().is_empty() {
        return Err(ServiceError::InvalidRequest(
            "client_mutation_id is required",
        ));
    }

    Ok(())
}

fn validate_stop_note_body(value: &str) -> Result<(), ServiceError> {
    if value.trim().is_empty() {
        return Err(ServiceError::InvalidRequest("stop note body is required"));
    }

    Ok(())
}

fn validate_task_title(value: &str) -> Result<(), ServiceError> {
    validate_required_text(value, "task title is required")
}

fn validate_required_text(value: &str, message: &'static str) -> Result<(), ServiceError> {
    if value.trim().is_empty() {
        return Err(ServiceError::InvalidRequest(message));
    }

    validate_sized_text(value, "text is too long")
}

fn validate_sized_text(value: &str, message: &'static str) -> Result<(), ServiceError> {
    if value.chars().count() > 500 {
        return Err(ServiceError::InvalidRequest(message));
    }

    Ok(())
}

fn validate_optional_override(
    value: &Option<Option<String>>,
    field: &'static str,
) -> Result<(), ServiceError> {
    if let Some(Some(text)) = value {
        validate_sized_text(text, field)?;
    }
    Ok(())
}

fn validate_task_visibility(value: &str) -> Result<(), ServiceError> {
    match value {
        "private" | "shared" => Ok(()),
        _ => Err(ServiceError::InvalidRequest("task visibility is invalid")),
    }
}

fn validate_task_status(value: &str) -> Result<(), ServiceError> {
    match value {
        "open" | "done" => Ok(()),
        _ => Err(ServiceError::InvalidRequest("task status is invalid")),
    }
}

fn validate_amount_minor(value: i32) -> Result<(), ServiceError> {
    if value < 0 {
        return Err(ServiceError::InvalidRequest(
            "amount_minor must be zero or greater",
        ));
    }

    Ok(())
}

fn validate_exchange_rate(value: Option<f64>) -> Result<(), ServiceError> {
    let Some(rate) = value else {
        return Ok(());
    };
    if !rate.is_finite() || rate <= 0.0 {
        return Err(ServiceError::InvalidRequest(
            "expense exchange rate must be greater than zero",
        ));
    }

    Ok(())
}

fn validate_expense_category(value: &str) -> Result<(), ServiceError> {
    match value {
        "food" | "transport" | "tickets" | "stay" | "shopping" | "settlement" => Ok(()),
        _ => Err(ServiceError::InvalidRequest("expense category is invalid")),
    }
}

fn validate_splits(value: &Value) -> Result<(), ServiceError> {
    if !value.is_object() {
        return Err(ServiceError::InvalidRequest(
            "expense splits must be an object",
        ));
    }

    Ok(())
}

fn validate_line_items(value: Option<&Value>) -> Result<(), ServiceError> {
    let Some(value) = value else {
        return Ok(());
    };
    if !value.is_array() {
        return Err(ServiceError::InvalidRequest(
            "expense line items must be an array",
        ));
    }

    Ok(())
}

fn validate_comments(value: Option<&Value>) -> Result<(), ServiceError> {
    let Some(value) = value else {
        return Ok(());
    };
    if !value.is_array() {
        return Err(ServiceError::InvalidRequest(
            "expense comments must be an array",
        ));
    }

    Ok(())
}

pub(crate) fn validate_expense_splits_total(
    value: &Value,
    amount_minor: i32,
) -> Result<(), ServiceError> {
    validate_splits(value)?;
    let mut total_minor = 0_i64;
    for (member_id, share) in value.as_object().expect("validated splits object") {
        if Uuid::parse_str(member_id).is_err() {
            return Err(ServiceError::InvalidRequest(
                "expense split member is invalid",
            ));
        }
        let Some(share_minor) = split_share_minor(share) else {
            return Err(ServiceError::InvalidRequest(
                "expense split amount must be numeric",
            ));
        };
        if share_minor < 0 {
            return Err(ServiceError::InvalidRequest(
                "expense split amount must be zero or greater",
            ));
        }
        total_minor += share_minor;
    }
    if total_minor != i64::from(amount_minor) {
        return Err(ServiceError::InvalidRequest(
            "expense splits must equal amount_minor",
        ));
    }

    Ok(())
}

fn split_share_minor(value: &Value) -> Option<i64> {
    value
        .as_i64()
        .or_else(|| value.as_f64().map(|number| number.round() as i64))
}

fn validate_plan_variant_kind(value: &str) -> Result<(), ServiceError> {
    match value {
        "main" | "backup" | "draft" | "split" => Ok(()),
        _ => Err(ServiceError::InvalidRequest("plan variant kind is invalid")),
    }
}

fn validate_member_role(role: TripRole) -> Result<(), ServiceError> {
    if role == TripRole::Owner {
        return Err(ServiceError::InvalidRequest(
            "owner role must use ownership transfer",
        ));
    }

    Ok(())
}

fn validate_participant_password(value: &str) -> Result<(), ServiceError> {
    if value.trim().len() < 4 {
        return Err(ServiceError::InvalidRequest(
            "participant password must be at least 4 characters",
        ));
    }

    Ok(())
}

fn validate_task_kind(value: &str) -> Result<(), ServiceError> {
    match value {
        "prep" | "booking" => Ok(()),
        _ => Err(ServiceError::InvalidRequest("task kind is invalid")),
    }
}

fn validate_coordinate_patch(
    latitude: Option<Option<f64>>,
    longitude: Option<Option<f64>>,
) -> Result<(), ServiceError> {
    if latitude.is_some() != longitude.is_some() {
        return Err(ServiceError::InvalidRequest(
            "latitude and longitude must be provided together",
        ));
    }

    match (latitude, longitude) {
        (Some(Some(lat)), Some(Some(lng))) => validate_coordinates(Some(lat), Some(lng)),
        (Some(None), Some(None)) | (None, None) => Ok(()),
        _ => Err(ServiceError::InvalidRequest(
            "latitude and longitude must be provided together",
        )),
    }
}

fn validate_coordinates(latitude: Option<f64>, longitude: Option<f64>) -> Result<(), ServiceError> {
    if latitude.is_some() != longitude.is_some() {
        return Err(ServiceError::InvalidRequest(
            "latitude and longitude must be provided together",
        ));
    }
    if latitude.is_some_and(|value| !(-90.0..=90.0).contains(&value))
        || longitude.is_some_and(|value| !(-180.0..=180.0).contains(&value))
    {
        return Err(ServiceError::InvalidRequest("coordinates are out of range"));
    }
    Ok(())
}

fn deserialize_nullable_string_patch<'de, D>(
    deserializer: D,
) -> Result<Option<Option<String>>, D::Error>
where
    D: Deserializer<'de>,
{
    Option::<String>::deserialize(deserializer).map(Some)
}

fn deserialize_nullable_f64_patch<'de, D>(deserializer: D) -> Result<Option<Option<f64>>, D::Error>
where
    D: Deserializer<'de>,
{
    Option::<f64>::deserialize(deserializer).map(Some)
}

fn deserialize_nullable_uuid_patch<'de, D>(
    deserializer: D,
) -> Result<Option<Option<Uuid>>, D::Error>
where
    D: Deserializer<'de>,
{
    Option::<Uuid>::deserialize(deserializer).map(Some)
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    fn invalid_message(result: Result<(), ServiceError>) -> &'static str {
        match result {
            Err(ServiceError::InvalidRequest(message)) => message,
            other => panic!("expected invalid request, got {other:?}"),
        }
    }

    #[test]
    #[should_panic(expected = "expected invalid request")]
    fn invalid_message_panics_for_non_invalid_request() {
        invalid_message(Ok(()));
    }

    #[test]
    fn itinerary_patch_accepts_valid_time_activity_type_and_duration() {
        let patch = ItineraryItemPatch {
            start_time: Some("09:30".to_string()),
            duration_minutes: Some(45),
            activity_type: Some("experience".to_string()),
            ..ItineraryItemPatch::default()
        };

        assert!(patch.validate().is_ok());
    }

    #[test]
    fn itinerary_patch_rejects_bad_time_shapes_and_ranges() {
        for value in ["0930", "9:30", "09:3", "aa:30", "09:bb", "24:00", "23:60"] {
            let patch = ItineraryItemPatch {
                start_time: Some(value.to_string()),
                ..ItineraryItemPatch::default()
            };

            assert_eq!(
                invalid_message(patch.validate()),
                "start_time must be HH:MM"
            );
        }
    }

    #[test]
    fn itinerary_patch_rejects_bad_duration_and_activity_type() {
        let bad_duration = ItineraryItemPatch {
            duration_minutes: Some(0),
            ..ItineraryItemPatch::default()
        };
        assert_eq!(
            invalid_message(bad_duration.validate()),
            "duration_minutes must be greater than zero"
        );

        let bad_type = ItineraryItemPatch {
            activity_type: Some("museum".to_string()),
            ..ItineraryItemPatch::default()
        };
        assert_eq!(
            invalid_message(bad_type.validate()),
            "activity_type is invalid"
        );
    }

    #[test]
    fn task_create_validation_covers_required_fields_and_enums() {
        let valid = CreateTaskRequest {
            client_mutation_id: "task-create".to_string(),
            title: "Book ferry".to_string(),
            visibility: "shared".to_string(),
            kind: Some("booking".to_string()),
            assignee_id: None,
            related_item_id: None,
        };
        assert!(valid.validate().is_ok());

        let mut missing_mutation = valid.clone();
        missing_mutation.client_mutation_id = "  ".to_string();
        assert_eq!(
            invalid_message(missing_mutation.validate()),
            "client_mutation_id is required"
        );

        let mut missing_title = valid.clone();
        missing_title.title = " ".to_string();
        assert_eq!(
            invalid_message(missing_title.validate()),
            "task title is required"
        );

        let mut bad_visibility = valid.clone();
        bad_visibility.visibility = "team".to_string();
        assert_eq!(
            invalid_message(bad_visibility.validate()),
            "task visibility is invalid"
        );

        let mut bad_kind = valid;
        bad_kind.kind = Some("errand".to_string());
        assert_eq!(invalid_message(bad_kind.validate()), "task kind is invalid");
    }

    #[test]
    fn task_patch_validation_covers_status_empty_and_nullable_uuid_fields() {
        let assignee = Uuid::now_v7();
        let patch: PatchTaskRequest = serde_json::from_value(json!({
            "clientMutationId": "task-patch",
            "expectedVersion": 3,
            "patch": {
                "title": " Updated title ",
                "status": "done",
                "assigneeId": assignee,
                "relatedItemId": null
            }
        }))
        .unwrap();
        assert_eq!(patch.expected_version, 3);
        assert_eq!(patch.patch.assignee_id, Some(Some(assignee)));
        assert_eq!(patch.patch.related_item_id, Some(None));
        assert!(patch.validate().is_ok());

        let empty_patch = PatchTaskRequest {
            client_mutation_id: "task-patch-empty".to_string(),
            expected_version: 1,
            patch: TaskPatch::default(),
        };
        assert_eq!(
            invalid_message(empty_patch.validate()),
            "task patch is empty"
        );

        let bad_status = PatchTaskRequest {
            client_mutation_id: "task-patch-bad-status".to_string(),
            expected_version: 1,
            patch: TaskPatch {
                status: Some("blocked".to_string()),
                ..TaskPatch::default()
            },
        };
        assert_eq!(
            invalid_message(bad_status.validate()),
            "task status is invalid"
        );
    }

    #[test]
    fn expense_create_rejects_splits_that_do_not_match_amount_minor() {
        let member = Uuid::now_v7();
        let valid = CreateExpenseRequest {
            client_mutation_id: "expense-create".to_string(),
            title: "Dinner".to_string(),
            amount_minor: 10_000,
            currency: Some("HKD".to_string()),
            exchange_rate_to_settlement_currency: None,
            notes: None,
            receipt_url: None,
            line_items: None,
            comments: None,
            paid_by: member,
            category: "food".to_string(),
            splits: json!({ member.to_string(): 10_000 }),
            itinerary_item_id: None,
        };
        assert!(valid.validate().is_ok());

        let mut mismatched = valid;
        mismatched.splits = json!({ member.to_string(): 9_999 });
        assert_eq!(
            invalid_message(mismatched.validate()),
            "expense splits must equal amount_minor"
        );
    }

    #[test]
    fn expense_patch_rejects_splits_that_do_not_match_amount_minor_when_both_are_present() {
        let member = Uuid::now_v7();
        let valid = PatchExpenseRequest {
            client_mutation_id: "expense-patch".to_string(),
            expected_version: 2,
            title: None,
            amount_minor: Some(10_000),
            currency: None,
            exchange_rate_to_settlement_currency: None,
            notes: None,
            receipt_url: None,
            line_items: None,
            comments: None,
            paid_by: None,
            category: None,
            splits: Some(json!({ member.to_string(): 10_000 })),
            itinerary_item_id: None,
        };
        assert!(valid.validate().is_ok());

        let mut mismatched = valid;
        mismatched.splits = Some(json!({ member.to_string(): 9_999 }));
        assert_eq!(
            invalid_message(mismatched.validate()),
            "expense splits must equal amount_minor"
        );
    }

    #[test]
    fn expense_requests_reject_invalid_exchange_rates() {
        let member = Uuid::now_v7();
        let create = CreateExpenseRequest {
            client_mutation_id: "expense-create".to_string(),
            title: "Dinner".to_string(),
            amount_minor: 10_000,
            currency: Some("CNY".to_string()),
            exchange_rate_to_settlement_currency: Some(0.0),
            notes: None,
            receipt_url: None,
            line_items: None,
            comments: None,
            paid_by: member,
            category: "food".to_string(),
            splits: json!({ member.to_string(): 10_000 }),
            itinerary_item_id: None,
        };
        assert_eq!(
            invalid_message(create.validate()),
            "expense exchange rate must be greater than zero"
        );

        let patch = PatchExpenseRequest {
            client_mutation_id: "expense-patch".to_string(),
            expected_version: 2,
            title: None,
            amount_minor: None,
            currency: None,
            exchange_rate_to_settlement_currency: Some(-1.0),
            notes: None,
            receipt_url: None,
            line_items: None,
            comments: None,
            paid_by: None,
            category: None,
            splits: None,
            itinerary_item_id: None,
        };
        assert_eq!(
            invalid_message(patch.validate()),
            "expense exchange rate must be greater than zero"
        );
    }
}
