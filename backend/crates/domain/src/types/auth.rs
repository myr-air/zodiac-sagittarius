use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum TripRole {
    Owner,
    Organizer,
    Traveler,
    Viewer,
}

impl TripRole {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Owner => "owner",
            Self::Organizer => "organizer",
            Self::Traveler => "traveler",
            Self::Viewer => "viewer",
        }
    }
}

impl TryFrom<String> for TripRole {
    type Error = String;

    fn try_from(value: String) -> Result<Self, Self::Error> {
        match value.as_str() {
            "owner" => Ok(Self::Owner),
            "organizer" => Ok(Self::Organizer),
            "traveler" => Ok(Self::Traveler),
            "viewer" => Ok(Self::Viewer),
            _ => Err(value),
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Capability {
    ViewPlan,
    EditItinerary,
    ReviewSuggestions,
    CreateSuggestion,
    ViewExpenses,
    CreateExpense,
    EditExpenses,
    ManagePeople,
    ManageTripPlans,
    CreateSharedTask,
    CreatePrivateTask,
    UpdateOwnPrivateTask,
    EditBookings,
    ManagePhotoAlbums,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum TripMemberAccessStatus {
    Active,
    Disabled,
}

impl TripMemberAccessStatus {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Active => "active",
            Self::Disabled => "disabled",
        }
    }
}

impl TryFrom<String> for TripMemberAccessStatus {
    type Error = String;

    fn try_from(value: String) -> Result<Self, Self::Error> {
        match value.as_str() {
            "active" => Ok(Self::Active),
            "disabled" => Ok(Self::Disabled),
            _ => Err(value),
        }
    }
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

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum AccountSessionKind {
    Temporary,
    Trusted,
}

impl AccountSessionKind {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Temporary => "temporary",
            Self::Trusted => "trusted",
        }
    }
}

impl TryFrom<String> for AccountSessionKind {
    type Error = String;

    fn try_from(value: String) -> Result<Self, Self::Error> {
        match value.as_str() {
            "temporary" => Ok(Self::Temporary),
            "trusted" => Ok(Self::Trusted),
            _ => Err(value),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AccountSession {
    pub user_id: Uuid,
    pub session_token: String,
    pub kind: AccountSessionKind,
    pub trusted_device_id: Option<Uuid>,
    pub created_at: String,
    pub expires_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EmailLoginStartResponse {
    pub challenge_id: Uuid,
    pub expires_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PasskeyChallengeResponse {
    pub challenge_id: Uuid,
    pub challenge: String,
    pub expires_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PasskeyCredentialDescriptor {
    pub credential_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PasskeyLoginStartResponse {
    pub challenge_id: Uuid,
    pub challenge: String,
    pub expires_at: String,
    pub allow_credentials: Vec<PasskeyCredentialDescriptor>,
}
