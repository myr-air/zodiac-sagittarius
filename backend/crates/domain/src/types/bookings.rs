use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[cfg_attr(feature = "openapi", derive(utoipa::ToSchema))]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BookingDocExternalLinkSummary {
    pub id: Uuid,
    pub label: String,
    pub url: String,
    pub provider: Option<String>,
    pub access_note: Option<String>,
}

#[cfg_attr(feature = "openapi", derive(utoipa::ToSchema))]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BookingDocSummary {
    pub id: Uuid,
    pub trip_id: Uuid,
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
    pub external_links: Vec<BookingDocExternalLinkSummary>,
    pub related_itinerary_item_ids: Vec<Uuid>,
    pub related_task_ids: Vec<Uuid>,
    pub related_expense_ids: Vec<Uuid>,
    pub note_ids: Vec<Uuid>,
    pub notes: Option<String>,
    pub created_by: Uuid,
    pub updated_at: String,
    pub version: i64,
}

