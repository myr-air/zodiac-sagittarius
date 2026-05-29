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

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
#[sqlx(type_name = "text", rename_all = "lowercase")]
pub enum AccountSessionKind {
    Temporary,
    Trusted,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AccountSession {
    pub user_id: Uuid,
    pub session_token: String,
    pub kind: AccountSessionKind,
    pub created_at: String,
    pub expires_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AccountProfile {
    pub id: Uuid,
    pub display_name: String,
    pub avatar_color: String,
    pub locale: String,
    pub timezone: String,
    pub primary_email: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TrustedDeviceSummary {
    pub id: Uuid,
    pub label: String,
    pub user_agent: String,
    pub created_at: String,
    pub last_seen_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PasskeySummary {
    pub id: Uuid,
    pub nickname: String,
    pub created_at: String,
    pub last_used_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AccountSettings {
    pub profile: AccountProfile,
    pub passkeys: Vec<PasskeySummary>,
    pub trusted_devices: Vec<TrustedDeviceSummary>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EmailLoginStartResponse {
    pub challenge_id: Uuid,
    pub expires_at: String,
    pub dev_code: String,
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
    pub start_time: String,
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

#[cfg(test)]
mod account_type_tests {
    use super::*;

    #[test]
    fn account_session_kind_serializes_as_camel_case() {
        assert_eq!(
            serde_json::to_value(AccountSessionKind::Temporary).unwrap(),
            serde_json::json!("temporary")
        );
        assert_eq!(
            serde_json::to_value(AccountSessionKind::Trusted).unwrap(),
            serde_json::json!("trusted")
        );
    }

    #[test]
    fn account_dtos_serialize_with_camel_case_fields() {
        let user_id = Uuid::parse_str("018f4e80-0000-7000-a000-000000000001").unwrap();
        let credential_id = Uuid::parse_str("018f4e80-0000-7000-a000-000000000002").unwrap();
        let settings = AccountSettings {
            profile: AccountProfile {
                id: user_id,
                display_name: "Aom".to_string(),
                avatar_color: "#0f766e".to_string(),
                locale: "th-TH".to_string(),
                timezone: "Asia/Bangkok".to_string(),
                primary_email: Some("aom@example.com".to_string()),
            },
            passkeys: vec![PasskeySummary {
                id: credential_id,
                nickname: "MacBook".to_string(),
                created_at: "2026-05-30T00:00:00Z".to_string(),
                last_used_at: None,
            }],
            trusted_devices: vec![TrustedDeviceSummary {
                id: credential_id,
                label: "MacBook".to_string(),
                user_agent: "Safari".to_string(),
                created_at: "2026-05-30T00:00:00Z".to_string(),
                last_seen_at: Some("2026-05-30T01:00:00Z".to_string()),
            }],
        };

        let value = serde_json::to_value(settings).unwrap();
        assert_eq!(value["profile"]["displayName"], "Aom");
        assert_eq!(value["profile"]["primaryEmail"], "aom@example.com");
        assert_eq!(value["trustedDevices"][0]["userAgent"], "Safari");
        assert_eq!(value["passkeys"][0]["lastUsedAt"], serde_json::Value::Null);
    }
}
