use std::collections::HashSet;

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
    pub party_size: Option<i32>,
    pub default_timezone: Option<String>,
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
    pub parent_item_id: Option<Uuid>,
    pub item_kind: Option<String>,
    pub time_mode: Option<String>,
    pub is_plan_block: Option<bool>,
    pub status: Option<String>,
    pub priority: Option<String>,
    pub day: Date,
    pub start_time: Option<String>,
    pub end_time: Option<String>,
    pub end_offset_days: Option<i32>,
    pub activity: String,
    pub activity_type: String,
    pub place: String,
    pub map_link: Option<String>,
    pub address: Option<String>,
    pub latitude: Option<f64>,
    pub longitude: Option<f64>,
    pub duration_minutes: Option<i32>,
    pub transportation: Option<String>,
    pub details: Option<Value>,
    pub note: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreatePlanVariantRequest {
    pub client_mutation_id: String,
    pub name: String,
    pub kind: Option<String>,
    pub status: Option<String>,
    pub description: Option<String>,
    pub source_trip_plan_id: Option<Uuid>,
    pub creation_mode: Option<String>,
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
    pub status: Option<String>,
    pub description: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PublishPlanVariantRequest {
    pub client_mutation_id: String,
    pub previous_main_next_status: Option<String>,
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
    pub trip_plan_id: Option<Uuid>,
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
    pub trip_plan_id: Option<Uuid>,
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
    pub trip_plan_id: Option<Uuid>,
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

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateBookingDocRequest {
    pub client_mutation_id: String,
    pub trip_plan_id: Option<Uuid>,
    pub r#type: String,
    pub title: String,
    pub status: String,
    pub visibility: String,
    pub owner_member_id: Option<Uuid>,
    pub provider_name: Option<String>,
    pub confirmation_code: Option<String>,
    pub starts_at: Option<String>,
    pub ends_at: Option<String>,
    pub timezone: Option<String>,
    pub price_amount: Option<f64>,
    pub currency: Option<String>,
    pub traveler_ids: Vec<Uuid>,
    pub external_links: Vec<CreateBookingDocExternalLinkRequest>,
    pub related_itinerary_item_ids: Vec<Uuid>,
    pub related_task_ids: Vec<Uuid>,
    pub related_expense_ids: Vec<Uuid>,
    pub note_ids: Vec<Uuid>,
    pub notes: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateBookingDocExternalLinkRequest {
    pub id: Option<Uuid>,
    pub label: String,
    pub url: String,
    pub provider: Option<String>,
    pub access_note: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PatchBookingDocRequest {
    pub client_mutation_id: String,
    pub expected_version: i64,
    pub patch: BookingDocPatch,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreatePhotoAlbumLinkRequest {
    pub client_mutation_id: String,
    pub title: String,
    pub provider: String,
    pub url: String,
    pub access: String,
    pub owner_member_id: Option<Uuid>,
    pub related_itinerary_item_ids: Vec<Uuid>,
    pub day: Option<String>,
    pub description: Option<String>,
    pub access_note: Option<String>,
    pub cover_url: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PatchPhotoAlbumLinkRequest {
    pub client_mutation_id: String,
    pub expected_version: i64,
    pub patch: PhotoAlbumLinkPatch,
}

#[derive(Debug, Clone, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PhotoAlbumLinkPatch {
    pub title: Option<String>,
    pub provider: Option<String>,
    pub url: Option<String>,
    pub access: Option<String>,
    #[serde(default, deserialize_with = "deserialize_nullable_uuid_patch")]
    pub owner_member_id: Option<Option<Uuid>>,
    pub related_itinerary_item_ids: Option<Vec<Uuid>>,
    #[serde(default, deserialize_with = "deserialize_nullable_string_patch")]
    pub day: Option<Option<String>>,
    #[serde(default, deserialize_with = "deserialize_nullable_string_patch")]
    pub description: Option<Option<String>>,
    #[serde(default, deserialize_with = "deserialize_nullable_string_patch")]
    pub access_note: Option<Option<String>>,
    #[serde(default, deserialize_with = "deserialize_nullable_string_patch")]
    pub cover_url: Option<Option<String>>,
}

#[derive(Debug, Clone, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BookingDocPatch {
    pub r#type: Option<String>,
    pub title: Option<String>,
    pub status: Option<String>,
    pub visibility: Option<String>,
    #[serde(default, deserialize_with = "deserialize_nullable_uuid_patch")]
    pub owner_member_id: Option<Option<Uuid>>,
    #[serde(default, deserialize_with = "deserialize_nullable_string_patch")]
    pub provider_name: Option<Option<String>>,
    #[serde(default, deserialize_with = "deserialize_nullable_string_patch")]
    pub confirmation_code: Option<Option<String>>,
    #[serde(default, deserialize_with = "deserialize_nullable_string_patch")]
    pub starts_at: Option<Option<String>>,
    #[serde(default, deserialize_with = "deserialize_nullable_string_patch")]
    pub ends_at: Option<Option<String>>,
    #[serde(default, deserialize_with = "deserialize_nullable_string_patch")]
    pub timezone: Option<Option<String>>,
    #[serde(default, deserialize_with = "deserialize_nullable_f64_patch")]
    pub price_amount: Option<Option<f64>>,
    #[serde(default, deserialize_with = "deserialize_nullable_string_patch")]
    pub currency: Option<Option<String>>,
    pub traveler_ids: Option<Vec<Uuid>>,
    pub external_links: Option<Vec<CreateBookingDocExternalLinkRequest>>,
    pub related_itinerary_item_ids: Option<Vec<Uuid>>,
    pub related_task_ids: Option<Vec<Uuid>>,
    pub related_expense_ids: Option<Vec<Uuid>>,
    pub note_ids: Option<Vec<Uuid>>,
    #[serde(default, deserialize_with = "deserialize_nullable_string_patch")]
    pub notes: Option<Option<String>>,
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

impl CreateBookingDocRequest {
    pub fn validate(&self) -> Result<(), ServiceError> {
        validate_client_mutation_id(&self.client_mutation_id)?;
        validate_booking_doc_type(&self.r#type)?;
        validate_booking_doc_title(&self.title)?;
        validate_booking_doc_status(&self.status)?;
        validate_booking_doc_visibility(&self.visibility)?;
        validate_booking_doc_price_amount(self.price_amount)?;
        if let Some(currency) = &self.currency {
            validate_booking_doc_currency(currency)?;
        }
        validate_unique_booking_doc_external_link_ids(&self.external_links)?;
        for link in &self.external_links {
            link.validate()?;
        }

        Ok(())
    }
}

impl CreateBookingDocExternalLinkRequest {
    pub fn validate(&self) -> Result<(), ServiceError> {
        validate_booking_doc_link_label(&self.label)?;
        validate_booking_doc_url(&self.url)
    }
}

impl PatchBookingDocRequest {
    pub fn validate(&self) -> Result<(), ServiceError> {
        validate_client_mutation_id(&self.client_mutation_id)?;
        self.patch.validate()
    }
}

impl CreatePhotoAlbumLinkRequest {
    pub fn validate(&self) -> Result<(), ServiceError> {
        validate_client_mutation_id(&self.client_mutation_id)?;
        validate_photo_album_title(&self.title)?;
        validate_photo_album_provider(&self.provider)?;
        validate_photo_album_url(&self.url)?;
        validate_photo_album_access(&self.access)?;
        if let Some(day) = &self.day {
            validate_iso_date(day, "day is invalid")?;
        }
        if let Some(cover_url) = &self.cover_url {
            validate_photo_album_url(cover_url)?;
        }
        Ok(())
    }
}

impl PatchPhotoAlbumLinkRequest {
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
        if let Some(end_time) = &self.end_time {
            validate_hh_mm(end_time)?;
        }
        if self
            .end_offset_days
            .is_some_and(|offset| !(0..=7).contains(&offset))
        {
            return Err(ServiceError::InvalidRequest(
                "end_offset_days must be between 0 and 7",
            ));
        }
        validate_required_text(&self.activity, "activity is required")?;
        if let Some(item_kind) = &self.item_kind {
            validate_item_kind(item_kind)?;
        }
        if let Some(time_mode) = &self.time_mode {
            validate_time_mode(time_mode)?;
        }
        if let Some(status) = &self.status {
            validate_item_status(status)?;
        }
        if let Some(priority) = &self.priority {
            validate_item_priority(priority)?;
        }
        validate_activity_type(&self.activity_type)?;
        if let Some(path_role) = &self.path_role {
            validate_path_role(path_role)?;
        }
        validate_optional_map_link(self.map_link.as_deref())?;
        if self
            .duration_minutes
            .is_some_and(|duration_minutes| duration_minutes <= 0)
        {
            return Err(ServiceError::InvalidRequest(
                "duration_minutes must be greater than zero",
            ));
        }
        validate_coordinates(self.latitude, self.longitude)?;
        validate_optional_details(self.details.as_ref())?;

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
        validate_plan_status_input(self.kind.as_deref(), self.status.as_deref())?;
        if let Some(description) = &self.description {
            validate_sized_text(description, "plan variant description is too long")?;
        }
        if let Some(creation_mode) = &self.creation_mode {
            match creation_mode.as_str() {
                "blank" | "duplicate-current" | "import" => {}
                _ => {
                    return Err(ServiceError::InvalidRequest(
                        "trip plan creation mode is invalid",
                    ));
                }
            }
        }

        Ok(())
    }

    pub fn effective_status(&self) -> &str {
        effective_plan_status(self.kind.as_deref(), self.status.as_deref()).unwrap_or("draft")
    }

    pub fn effective_kind(&self) -> &str {
        legacy_kind_for_plan_status(self.effective_status())
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
        validate_plan_status_input(self.kind.as_deref(), self.status.as_deref())?;
        if let Some(description) = &self.description {
            validate_sized_text(description, "plan variant description is too long")?;
        }

        Ok(())
    }

    pub fn effective_status(&self) -> Option<&str> {
        effective_plan_status(self.kind.as_deref(), self.status.as_deref())
    }

    pub fn effective_kind(&self) -> Option<&str> {
        self.effective_status().map(legacy_kind_for_plan_status)
    }
}

impl PublishPlanVariantRequest {
    pub fn validate(&self) -> Result<(), ServiceError> {
        validate_client_mutation_id(&self.client_mutation_id)?;
        if let Some(status) = &self.previous_main_next_status {
            validate_plan_status(status)?;
            if status == "main" {
                return Err(ServiceError::InvalidRequest(
                    "previous main next status cannot be main",
                ));
            }
        }
        Ok(())
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
    #[serde(default, deserialize_with = "deserialize_nullable_uuid_patch")]
    pub parent_item_id: Option<Option<Uuid>>,
    pub item_kind: Option<String>,
    pub time_mode: Option<String>,
    pub is_plan_block: Option<bool>,
    pub status: Option<String>,
    pub priority: Option<String>,
    pub day: Option<Date>,
    #[serde(default, deserialize_with = "deserialize_nullable_string_patch")]
    pub start_time: Option<Option<String>>,
    #[serde(default, deserialize_with = "deserialize_nullable_string_patch")]
    pub end_time: Option<Option<String>>,
    pub end_offset_days: Option<i32>,
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
    pub details: Option<Value>,
    pub note: Option<String>,
}

impl ItineraryItemPatch {
    pub fn validate(&self) -> Result<(), ServiceError> {
        if let Some(Some(start_time)) = &self.start_time {
            validate_hh_mm(start_time)?;
        }
        if let Some(Some(end_time)) = &self.end_time {
            validate_hh_mm(end_time)?;
        }
        if self
            .end_offset_days
            .is_some_and(|offset| !(0..=7).contains(&offset))
        {
            return Err(ServiceError::InvalidRequest(
                "end_offset_days must be between 0 and 7",
            ));
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
        if let Some(item_kind) = &self.item_kind {
            validate_item_kind(item_kind)?;
        }
        if let Some(time_mode) = &self.time_mode {
            validate_time_mode(time_mode)?;
        }
        if let Some(status) = &self.status {
            validate_item_status(status)?;
        }
        if let Some(priority) = &self.priority {
            validate_item_priority(priority)?;
        }
        validate_optional_map_link(self.map_link.as_deref())?;
        validate_coordinate_patch(self.latitude, self.longitude)?;
        validate_optional_details(self.details.as_ref())?;

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

impl BookingDocPatch {
    pub fn validate(&self) -> Result<(), ServiceError> {
        if self.is_empty() {
            return Err(ServiceError::InvalidRequest("booking doc patch is empty"));
        }
        if let Some(value) = &self.r#type {
            validate_booking_doc_type(value)?;
        }
        if let Some(value) = &self.title {
            validate_booking_doc_title(value)?;
        }
        if let Some(value) = &self.status {
            validate_booking_doc_status(value)?;
        }
        if let Some(value) = &self.visibility {
            validate_booking_doc_visibility(value)?;
        }
        if let Some(Some(value)) = self.price_amount {
            validate_booking_doc_price_amount(Some(value))?;
        }
        if let Some(Some(value)) = &self.currency {
            validate_booking_doc_currency(value)?;
        }
        if let Some(links) = &self.external_links {
            validate_unique_booking_doc_external_link_ids(links)?;
            for link in links {
                link.validate()?;
            }
        }

        Ok(())
    }

    fn is_empty(&self) -> bool {
        self.r#type.is_none()
            && self.title.is_none()
            && self.status.is_none()
            && self.visibility.is_none()
            && self.owner_member_id.is_none()
            && self.provider_name.is_none()
            && self.confirmation_code.is_none()
            && self.starts_at.is_none()
            && self.ends_at.is_none()
            && self.timezone.is_none()
            && self.price_amount.is_none()
            && self.currency.is_none()
            && self.traveler_ids.is_none()
            && self.external_links.is_none()
            && self.related_itinerary_item_ids.is_none()
            && self.related_task_ids.is_none()
            && self.related_expense_ids.is_none()
            && self.note_ids.is_none()
            && self.notes.is_none()
    }
}

impl PhotoAlbumLinkPatch {
    pub fn validate(&self) -> Result<(), ServiceError> {
        if self.is_empty() {
            return Err(ServiceError::InvalidRequest("photo album patch is empty"));
        }
        if let Some(value) = &self.title {
            validate_photo_album_title(value)?;
        }
        if let Some(value) = &self.provider {
            validate_photo_album_provider(value)?;
        }
        if let Some(value) = &self.url {
            validate_photo_album_url(value)?;
        }
        if let Some(value) = &self.access {
            validate_photo_album_access(value)?;
        }
        if let Some(Some(value)) = &self.day {
            validate_iso_date(value, "day is invalid")?;
        }
        if let Some(Some(value)) = &self.cover_url {
            validate_photo_album_url(value)?;
        }
        Ok(())
    }

    fn is_empty(&self) -> bool {
        self.title.is_none()
            && self.provider.is_none()
            && self.url.is_none()
            && self.access.is_none()
            && self.owner_member_id.is_none()
            && self.related_itinerary_item_ids.is_none()
            && self.day.is_none()
            && self.description.is_none()
            && self.access_note.is_none()
            && self.cover_url.is_none()
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

fn validate_item_kind(value: &str) -> Result<(), ServiceError> {
    match value {
        "travel" | "activity" | "lodging" | "meal" | "note" | "preparation"
        | "foodRecommendation" => Ok(()),
        _ => Err(ServiceError::InvalidRequest("item_kind is invalid")),
    }
}

fn validate_time_mode(value: &str) -> Result<(), ServiceError> {
    match value {
        "scheduled" | "flexible" => Ok(()),
        _ => Err(ServiceError::InvalidRequest("time_mode is invalid")),
    }
}

fn validate_item_status(value: &str) -> Result<(), ServiceError> {
    match value {
        "idea" | "planned" | "booked" | "confirmed" | "done" | "skipped" => Ok(()),
        _ => Err(ServiceError::InvalidRequest("status is invalid")),
    }
}

fn validate_item_priority(value: &str) -> Result<(), ServiceError> {
    match value {
        "low" | "normal" | "high" | "must" => Ok(()),
        _ => Err(ServiceError::InvalidRequest("priority is invalid")),
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

fn validate_booking_doc_type(value: &str) -> Result<(), ServiceError> {
    match value {
        "flight" | "train" | "public_transport" | "hotel" | "insurance" | "passport" | "visa"
        | "activity_ticket" | "other" => Ok(()),
        _ => Err(ServiceError::InvalidRequest("type is invalid")),
    }
}

fn validate_booking_doc_status(value: &str) -> Result<(), ServiceError> {
    match value {
        "draft" | "needs_action" | "booked" | "confirmed" | "paid" | "cancelled" | "expired" => {
            Ok(())
        }
        _ => Err(ServiceError::InvalidRequest("status is invalid")),
    }
}

fn validate_booking_doc_visibility(value: &str) -> Result<(), ServiceError> {
    match value {
        "shared" | "sensitive" | "private" => Ok(()),
        _ => Err(ServiceError::InvalidRequest("visibility is invalid")),
    }
}

fn validate_booking_doc_title(value: &str) -> Result<(), ServiceError> {
    let trimmed = value.trim();
    if trimmed.is_empty() || trimmed.len() > 180 {
        return Err(ServiceError::InvalidRequest("title is invalid"));
    }
    Ok(())
}

fn validate_booking_doc_currency(value: &str) -> Result<(), ServiceError> {
    let trimmed = value.trim();
    if trimmed.len() != 3 || !trimmed.chars().all(|c| c.is_ascii_uppercase()) {
        return Err(ServiceError::InvalidRequest("currency is invalid"));
    }
    Ok(())
}

fn validate_booking_doc_price_amount(value: Option<f64>) -> Result<(), ServiceError> {
    if value.is_some_and(|amount| !amount.is_finite() || amount < 0.0) {
        return Err(ServiceError::InvalidRequest(
            "priceAmount must be finite and zero or greater",
        ));
    }
    Ok(())
}

fn validate_booking_doc_link_label(value: &str) -> Result<(), ServiceError> {
    let trimmed = value.trim();
    if trimmed.is_empty() || trimmed.len() > 80 {
        return Err(ServiceError::InvalidRequest(
            "external link label is invalid",
        ));
    }
    Ok(())
}

fn validate_booking_doc_url(value: &str) -> Result<(), ServiceError> {
    let trimmed = value.trim();
    validate_http_url(trimmed, "external link URL is invalid")
}

fn validate_photo_album_title(value: &str) -> Result<(), ServiceError> {
    let trimmed = value.trim();
    if trimmed.is_empty() || trimmed.len() > 180 {
        return Err(ServiceError::InvalidRequest("photo album title is invalid"));
    }
    Ok(())
}

fn validate_photo_album_provider(value: &str) -> Result<(), ServiceError> {
    match value {
        "google_photos" | "icloud" | "google_drive" | "dropbox" | "onedrive" | "custom" => Ok(()),
        _ => Err(ServiceError::InvalidRequest(
            "photo album provider is invalid",
        )),
    }
}

fn validate_photo_album_access(value: &str) -> Result<(), ServiceError> {
    match value {
        "view_only" | "collaborative" | "upload_request" => Ok(()),
        _ => Err(ServiceError::InvalidRequest(
            "photo album access is invalid",
        )),
    }
}

fn validate_photo_album_url(value: &str) -> Result<(), ServiceError> {
    validate_http_url(value.trim(), "photo album URL is invalid")
}

fn validate_iso_date(value: &str, message: &'static str) -> Result<(), ServiceError> {
    let value = value.trim();
    let mut parts = value.split('-');
    let (Some(year), Some(month), Some(day), None) =
        (parts.next(), parts.next(), parts.next(), parts.next())
    else {
        return Err(ServiceError::InvalidRequest(message));
    };
    let year = year
        .parse::<i32>()
        .map_err(|_| ServiceError::InvalidRequest(message))?;
    let month = month
        .parse::<u8>()
        .map_err(|_| ServiceError::InvalidRequest(message))?;
    let day = day
        .parse::<u8>()
        .map_err(|_| ServiceError::InvalidRequest(message))?;
    Date::from_calendar_date(
        year,
        time::Month::try_from(month).map_err(|_| ServiceError::InvalidRequest(message))?,
        day,
    )
    .map(|_| ())
    .map_err(|_| ServiceError::InvalidRequest(message))
}

fn validate_optional_map_link(value: Option<&str>) -> Result<(), ServiceError> {
    let Some(trimmed) = value.map(str::trim).filter(|value| !value.is_empty()) else {
        return Ok(());
    };
    validate_http_url(trimmed, "map link URL is invalid")
}

fn validate_http_url(value: &str, message: &'static str) -> Result<(), ServiceError> {
    let parsed = value
        .parse::<http::Uri>()
        .map_err(|_| ServiceError::InvalidRequest(message))?;
    if !matches!(parsed.scheme_str(), Some("http" | "https"))
        || parsed.host().is_none_or(str::is_empty)
        || value.len() > 2048
    {
        return Err(ServiceError::InvalidRequest(message));
    }
    Ok(())
}

fn validate_unique_booking_doc_external_link_ids(
    links: &[CreateBookingDocExternalLinkRequest],
) -> Result<(), ServiceError> {
    let mut seen = HashSet::new();
    for link in links {
        if let Some(id) = link.id
            && !seen.insert(id)
        {
            return Err(ServiceError::InvalidRequest(
                "booking doc external link ids must be unique",
            ));
        }
    }
    Ok(())
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

fn validate_optional_details(value: Option<&Value>) -> Result<(), ServiceError> {
    let Some(value) = value else {
        return Ok(());
    };
    if !value.is_object() {
        return Err(ServiceError::InvalidRequest("details must be an object"));
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

fn validate_plan_status_input(
    kind: Option<&str>,
    status: Option<&str>,
) -> Result<(), ServiceError> {
    if let Some(kind) = kind {
        validate_plan_variant_kind(kind)?;
    }
    if let Some(status) = status {
        validate_plan_status(status)?;
    }
    if let (Some(kind), Some(status)) = (kind, status) {
        let kind_status = status_for_legacy_kind(kind)?;
        if kind_status != status {
            return Err(ServiceError::InvalidRequest(
                "trip plan status does not match legacy kind",
            ));
        }
    }
    Ok(())
}

fn effective_plan_status<'a>(kind: Option<&'a str>, status: Option<&'a str>) -> Option<&'a str> {
    status.or_else(|| kind.and_then(|value| status_for_legacy_kind(value).ok()))
}

fn validate_plan_status(value: &str) -> Result<(), ServiceError> {
    match value {
        "main" | "backup" | "draft" | "proposal" => Ok(()),
        _ => Err(ServiceError::InvalidRequest("trip plan status is invalid")),
    }
}

fn validate_plan_variant_kind(value: &str) -> Result<(), ServiceError> {
    status_for_legacy_kind(value).map(|_| ())
}

fn status_for_legacy_kind(value: &str) -> Result<&'static str, ServiceError> {
    match value {
        "main" => Ok("main"),
        "backup" => Ok("backup"),
        "draft" => Ok("draft"),
        "split" => Ok("proposal"),
        _ => Err(ServiceError::InvalidRequest("plan variant kind is invalid")),
    }
}

fn legacy_kind_for_plan_status(value: &str) -> &'static str {
    match value {
        "proposal" => "split",
        "main" => "main",
        "backup" => "backup",
        _ => "draft",
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
            start_time: Some(Some("09:30".to_string())),
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
                start_time: Some(Some(value.to_string())),
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

    fn valid_booking_doc_request() -> CreateBookingDocRequest {
        CreateBookingDocRequest {
            client_mutation_id: "booking-create".to_string(),
            r#type: "flight".to_string(),
            title: "Flight to Chiang Mai".to_string(),
            status: "booked".to_string(),
            visibility: "shared".to_string(),
            owner_member_id: None,
            provider_name: Some("Nok Air".to_string()),
            confirmation_code: Some("ABC123".to_string()),
            starts_at: Some("2026-06-07T02:00:00Z".to_string()),
            ends_at: Some("2026-06-07T04:00:00Z".to_string()),
            timezone: Some("Asia/Bangkok".to_string()),
            price_amount: Some(2500.0),
            currency: Some("THB".to_string()),
            traveler_ids: vec![Uuid::now_v7()],
            external_links: vec![CreateBookingDocExternalLinkRequest {
                id: None,
                label: "Airline booking".to_string(),
                url: "https://example.com/booking".to_string(),
                provider: Some("Nok Air".to_string()),
                access_note: None,
            }],
            related_itinerary_item_ids: Vec::new(),
            related_task_ids: Vec::new(),
            related_expense_ids: Vec::new(),
            note_ids: Vec::new(),
            notes: Some("Window seat".to_string()),
        }
    }

    #[test]
    fn booking_doc_create_rejects_invalid_external_link_url() {
        for url in ["ftp://example.com/booking", "https://", "http://"] {
            let mut request = valid_booking_doc_request();
            request.external_links[0].url = url.to_string();

            assert_eq!(
                invalid_message(request.validate()),
                "external link URL is invalid"
            );
        }
    }

    #[test]
    fn booking_doc_requests_reject_duplicate_external_link_ids() {
        let duplicate_id = Uuid::now_v7();
        let mut create = valid_booking_doc_request();
        create.external_links = vec![
            CreateBookingDocExternalLinkRequest {
                id: Some(duplicate_id),
                label: "Drive".to_string(),
                url: "https://drive.google.com/booking".to_string(),
                provider: Some("Google Drive".to_string()),
                access_note: None,
            },
            CreateBookingDocExternalLinkRequest {
                id: Some(duplicate_id),
                label: "Airline".to_string(),
                url: "https://example.com/booking".to_string(),
                provider: Some("Airline".to_string()),
                access_note: None,
            },
        ];
        assert_eq!(
            invalid_message(create.validate()),
            "booking doc external link ids must be unique"
        );

        let patch = PatchBookingDocRequest {
            client_mutation_id: "booking-patch-links".to_string(),
            expected_version: 2,
            patch: BookingDocPatch {
                external_links: Some(create.external_links),
                ..BookingDocPatch::default()
            },
        };
        assert_eq!(
            invalid_message(patch.validate()),
            "booking doc external link ids must be unique"
        );
    }

    #[test]
    fn booking_doc_create_rejects_invalid_type() {
        let mut request = valid_booking_doc_request();
        request.r#type = "rental_car".to_string();

        assert_eq!(invalid_message(request.validate()), "type is invalid");
    }

    #[test]
    fn booking_doc_create_rejects_invalid_currency() {
        let mut request = valid_booking_doc_request();
        request.currency = Some("usd".to_string());

        assert_eq!(invalid_message(request.validate()), "currency is invalid");
    }

    #[test]
    fn booking_doc_create_rejects_negative_price_amount() {
        let mut request = valid_booking_doc_request();
        request.price_amount = Some(-1.0);

        assert_eq!(
            invalid_message(request.validate()),
            "priceAmount must be finite and zero or greater"
        );
    }

    #[test]
    fn booking_doc_requests_reject_non_finite_price_amount() {
        let mut create = valid_booking_doc_request();
        create.price_amount = Some(f64::INFINITY);
        assert_eq!(
            invalid_message(create.validate()),
            "priceAmount must be finite and zero or greater"
        );

        let patch = PatchBookingDocRequest {
            client_mutation_id: "booking-patch".to_string(),
            expected_version: 2,
            patch: BookingDocPatch {
                price_amount: Some(Some(f64::NAN)),
                ..BookingDocPatch::default()
            },
        };
        assert_eq!(
            invalid_message(patch.validate()),
            "priceAmount must be finite and zero or greater"
        );
    }

    #[test]
    fn booking_doc_patch_rejects_empty_patch() {
        let request = PatchBookingDocRequest {
            client_mutation_id: "booking-patch-empty".to_string(),
            expected_version: 2,
            patch: BookingDocPatch::default(),
        };

        assert_eq!(
            invalid_message(request.validate()),
            "booking doc patch is empty"
        );
    }
}
