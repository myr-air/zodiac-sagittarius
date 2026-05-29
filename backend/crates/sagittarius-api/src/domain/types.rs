use serde::{Deserialize, Serialize};
use serde_json::Value;
use sqlx::Type;
use time::Date;
use uuid::Uuid;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
#[sqlx(type_name = "text", rename_all = "lowercase")]
pub enum TripRole {
    Owner,
    Organizer,
    Traveler,
    Viewer,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Capability {
    ViewPlan,
    EditItinerary,
    ReviewSuggestions,
    CreateSuggestion,
    ViewExpenses,
    EditExpenses,
    ManagePeople,
    CreateSharedTask,
    CreatePrivateTask,
    UpdateOwnPrivateTask,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
#[sqlx(type_name = "text", rename_all = "lowercase")]
pub enum TripMemberAccessStatus {
    Active,
    Disabled,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MemberSession {
    pub trip_id: Uuid,
    pub member_id: Uuid,
    pub session_token: String,
    pub created_at: String,
    pub expires_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TripSummary {
    pub id: Uuid,
    pub name: String,
    pub destination_label: String,
    pub start_date: Date,
    pub end_date: Date,
    pub join_id: String,
    pub active_plan_variant_id: Option<Uuid>,
    pub owner_member_id: Uuid,
    pub version: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ClaimableMember {
    pub id: Uuid,
    pub trip_id: Uuid,
    pub display_name: String,
    pub role: TripRole,
    pub access_status: TripMemberAccessStatus,
    pub color: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct JoinTripResponse {
    pub trip: TripSummary,
    pub claimable_members: Vec<ClaimableMember>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TripMemberSummary {
    pub id: Uuid,
    pub trip_id: Uuid,
    pub display_name: String,
    pub role: TripRole,
    pub access_status: TripMemberAccessStatus,
    pub presence: String,
    pub color: String,
    pub user_id: Option<Uuid>,
    pub claimed_at: Option<String>,
    pub last_seen_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PlanVariantSummary {
    pub id: Uuid,
    pub trip_id: Uuid,
    pub name: String,
    pub kind: String,
    pub description: String,
    pub version: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ItineraryCoordinates {
    pub lat: f64,
    pub lng: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ItineraryItemSummary {
    pub id: Uuid,
    pub trip_id: Uuid,
    pub plan_variant_id: Uuid,
    pub day: Date,
    pub sort_order: i32,
    pub start_time: Option<String>,
    pub activity: String,
    pub activity_type: String,
    pub place: String,
    pub link_label: String,
    pub map_link: String,
    pub coordinates: Option<ItineraryCoordinates>,
    pub address: Option<String>,
    pub duration_minutes: Option<i32>,
    pub transportation: String,
    pub advisories: Value,
    pub note: String,
    pub created_by: Uuid,
    pub updated_at: String,
    pub version: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SuggestionSummary {
    pub id: Uuid,
    pub trip_id: Uuid,
    pub plan_variant_id: Uuid,
    pub proposer_id: Uuid,
    pub r#type: String,
    pub target_item_id: Option<Uuid>,
    pub proposed_patch: Value,
    pub source_version: Option<i64>,
    pub status: String,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TripTaskSummary {
    pub id: Uuid,
    pub trip_id: Uuid,
    pub title: String,
    pub status: String,
    pub visibility: String,
    pub kind: Option<String>,
    pub created_by: Uuid,
    pub assignee_id: Option<Uuid>,
    pub related_item_id: Option<Uuid>,
    pub version: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SettlementSuggestion {
    pub from: Uuid,
    pub to: Uuid,
    pub amount: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExpenseSummary {
    pub group_spend: f64,
    pub net_by_member: std::collections::BTreeMap<Uuid, f64>,
    pub current_user_net_label: String,
    pub settlement_suggestions: Vec<SettlementSuggestion>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TripCockpit {
    pub trip: TripSummary,
    pub members: Vec<TripMemberSummary>,
    pub plan_variants: Vec<PlanVariantSummary>,
    pub itinerary_items: Vec<ItineraryItemSummary>,
    pub suggestions: Vec<SuggestionSummary>,
    pub tasks: Vec<TripTaskSummary>,
    pub expense_summary: Option<ExpenseSummary>,
}
