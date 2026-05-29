use serde::{Deserialize, Serialize};
use sqlx::Type;
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
