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
    EditBookings,
    ManagePhotoAlbums,
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
    pub trusted_device_id: Option<Uuid>,
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
    pub home_city: Option<String>,
    pub home_country: Option<String>,
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

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct TripCity {
    pub city: String,
    pub country: String,
    pub country_code: String,
    pub timezone: String,
    pub latitude: f64,
    pub longitude: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TripSummary {
    pub id: Uuid,
    pub name: String,
    pub origin_label: String,
    pub origin_city: String,
    pub origin_country: String,
    pub origin_country_code: String,
    pub destination_label: String,
    pub destination_cities: Vec<TripCity>,
    pub countries: Vec<String>,
    pub party_size: i32,
    pub default_timezone: String,
    pub start_date: Date,
    pub end_date: Date,
    pub join_id: String,
    pub active_plan_variant_id: Option<Uuid>,
    pub main_trip_plan_id: Option<Uuid>,
    pub owner_member_id: Uuid,
    pub version: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AccountTripCreateResponse {
    pub trip: TripSummary,
    pub owner_member_id: Uuid,
    pub member_session: MemberSession,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AccountTripSummary {
    pub id: Uuid,
    pub name: String,
    pub origin_label: String,
    pub origin_city: String,
    pub origin_country: String,
    pub origin_country_code: String,
    pub destination_label: String,
    pub destination_cities: Vec<TripCity>,
    pub countries: Vec<String>,
    pub party_size: i32,
    pub default_timezone: String,
    pub start_date: Date,
    pub end_date: Date,
    pub role: TripRole,
    pub member_id: Uuid,
    pub owner_member_id: Uuid,
    pub joined_at: String,
    pub is_owner: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AccountTripStats {
    pub trips_total: i64,
    pub trips_owned: i64,
    pub active_trips: i64,
    pub temp_claims_completed: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AccountExplorerSummary {
    pub upcoming_trips: i64,
    pub owned_trips: i64,
    pub destination_count: i64,
    pub next_trip: Option<AccountTripSummary>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AccountTodoSummary {
    pub id: Uuid,
    pub trip_id: Uuid,
    pub trip_name: String,
    pub title: String,
    pub status: String,
    pub visibility: String,
    pub kind: Option<String>,
    pub assignee_id: Option<Uuid>,
    pub related_item_id: Option<Uuid>,
    pub version: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AccountVaultItemSummary {
    pub id: Uuid,
    pub trip_id: Option<Uuid>,
    pub trip_name: Option<String>,
    pub kind: String,
    pub title: String,
    pub detail: String,
    pub external_url: Option<String>,
    pub source: String,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AccountMemberClaimResponse {
    pub trip_id: Uuid,
    pub member_id: Uuid,
    pub user_id: Uuid,
    pub role: TripRole,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OwnerTransferResponse {
    pub trip_id: Uuid,
    pub previous_owner_member_id: Uuid,
    pub new_owner_member_id: Uuid,
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
    pub claimed_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct JoinTripResponse {
    pub trip: TripSummary,
    pub claimable_members: Vec<ClaimableMember>,
    pub join_session_token: String,
    pub expires_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct JoinInviteTokenResponse {
    pub token: String,
    pub expires_at: String,
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
    pub status: String,
    pub description: String,
    pub version: i64,
}

pub type TripPlanSummary = PlanVariantSummary;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ItineraryCoordinates {
    pub lat: f64,
    pub lng: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BriefingCoordinates {
    pub lat: f64,
    pub lng: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BriefingSourceMeta {
    pub source: String,
    pub source_url: Option<String>,
    pub fetched_at: Option<String>,
    pub expires_at: Option<String>,
    pub confidence: String,
    pub unavailable_reason: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WeatherBriefingBlock {
    pub condition_code: String,
    pub condition_label: String,
    pub temperature_max_celsius: Option<f64>,
    pub temperature_min_celsius: Option<f64>,
    pub humidity_percent: Option<i32>,
    pub wind_speed_kph: Option<f64>,
    pub rain_chance_percent: Option<i32>,
    pub meta: BriefingSourceMeta,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TextBriefingBlock {
    pub title: String,
    pub body: String,
    pub meta: BriefingSourceMeta,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DailyBriefingOverrides {
    pub outfit_advice: Option<String>,
    pub festival_note: Option<String>,
    pub facts_note: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TripDailyBriefing {
    pub trip_id: Uuid,
    pub date: Date,
    pub location_key: String,
    pub location_label: String,
    pub coordinates: Option<BriefingCoordinates>,
    pub weather: Option<WeatherBriefingBlock>,
    pub holiday: Option<TextBriefingBlock>,
    pub festival: Option<TextBriefingBlock>,
    pub facts: Option<TextBriefingBlock>,
    pub outfit_advice: Option<TextBriefingBlock>,
    pub manual_overrides: DailyBriefingOverrides,
    pub updated_at: String,
    pub version: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ItineraryItemSummary {
    pub id: Uuid,
    pub trip_id: Uuid,
    pub plan_variant_id: Uuid,
    pub path_group_id: Option<String>,
    pub path_id: Option<String>,
    pub path_name: Option<String>,
    pub path_role: Option<String>,
    pub parent_item_id: Option<Uuid>,
    pub item_kind: String,
    pub time_mode: String,
    pub is_plan_block: bool,
    pub status: String,
    pub priority: String,
    pub day: Date,
    pub sort_order: i32,
    pub start_time: String,
    pub end_time: Option<String>,
    pub end_offset_days: i32,
    pub activity: String,
    pub activity_type: String,
    pub place: String,
    pub link_label: String,
    pub map_link: String,
    pub coordinates: Option<ItineraryCoordinates>,
    pub address: Option<String>,
    pub duration_minutes: Option<i32>,
    pub transportation: String,
    pub details: Value,
    pub advisories: Value,
    pub note: String,
    pub created_by: Uuid,
    pub updated_at: String,
    pub version: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ItineraryImportTrip {
    pub id: Uuid,
    pub name: String,
    pub destination_label: String,
    pub start_date: Date,
    pub end_date: Date,
    pub active_plan_variant_id: Uuid,
    pub main_trip_plan_id: Uuid,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ItineraryImportItem {
    pub id: String,
    pub path_group_id: Option<String>,
    pub path_id: Option<String>,
    pub path_name: Option<String>,
    pub path_role: Option<String>,
    #[serde(default)]
    pub parent_item_id: Option<String>,
    #[serde(default = "default_import_item_kind")]
    pub item_kind: String,
    #[serde(default = "default_import_time_mode")]
    pub time_mode: String,
    #[serde(default)]
    pub is_plan_block: bool,
    #[serde(default = "default_import_status")]
    pub status: String,
    #[serde(default = "default_import_priority")]
    pub priority: String,
    pub day: Date,
    pub sort_order: i32,
    pub start_time: String,
    #[serde(default)]
    pub end_time: Option<String>,
    #[serde(default)]
    pub end_offset_days: i32,
    pub activity: String,
    pub activity_type: String,
    pub place: String,
    pub link_label: String,
    pub map_link: String,
    pub coordinates: Option<ItineraryCoordinates>,
    pub address: Option<String>,
    pub duration_minutes: Option<i32>,
    pub transportation: String,
    #[serde(default = "empty_object")]
    pub details: Value,
    pub advisories: Value,
    pub note: String,
}

fn empty_object() -> Value {
    serde_json::json!({})
}

fn default_import_item_kind() -> String {
    "activity".to_string()
}

fn default_import_time_mode() -> String {
    "scheduled".to_string()
}

fn default_import_status() -> String {
    "idea".to_string()
}

fn default_import_priority() -> String {
    "normal".to_string()
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ItineraryImportDocument {
    pub schema: String,
    pub version: i32,
    #[serde(default)]
    pub source: String,
    pub exported_at: String,
    pub trip: ItineraryImportTrip,
    pub items: Vec<ItineraryImportItem>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LocalizedText {
    pub en: String,
    pub th: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PlanSuggestionSummary {
    pub id: Uuid,
    pub trip_id: Uuid,
    pub plan_check_id: Uuid,
    pub severity: String,
    pub scope: String,
    pub target_item_ids: Vec<Uuid>,
    pub explanation: LocalizedText,
    pub recommended_action: LocalizedText,
    pub action_kind: Option<String>,
    pub action_payload: Value,
    pub status: String,
    pub snoozed_until: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    pub version: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PlanCheckSummary {
    pub id: Uuid,
    pub trip_id: Uuid,
    pub created_by: Uuid,
    pub itinerary_fingerprint: String,
    pub stale: bool,
    pub status: String,
    pub language_metadata: Value,
    pub created_at: String,
    pub completed_at: Option<String>,
    pub version: i64,
    pub suggestions: Vec<PlanSuggestionSummary>,
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
    pub trip_plan_id: Option<Uuid>,
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
pub struct StopNoteSummary {
    pub id: Uuid,
    pub trip_id: Uuid,
    pub trip_plan_id: Option<Uuid>,
    pub item_id: Uuid,
    pub author_id: Uuid,
    pub body: String,
    pub created_at: String,
    pub updated_at: String,
    pub version: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SettlementSuggestion {
    pub from: Uuid,
    pub to: Uuid,
    pub amount: f64,
    pub currency: String,
    pub last_reminded_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExpenseSummary {
    pub group_spend: f64,
    pub settlement_currency: String,
    pub net_by_member: std::collections::BTreeMap<Uuid, f64>,
    pub current_user_net_label: String,
    pub settlement_suggestions: Vec<SettlementSuggestion>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExpenseItemSummary {
    pub id: Uuid,
    pub trip_id: Uuid,
    pub trip_plan_id: Option<Uuid>,
    pub title: String,
    pub amount_minor: i32,
    pub currency: String,
    pub exchange_rate_to_settlement_currency: f64,
    pub notes: String,
    pub receipt_url: Option<String>,
    pub line_items: Value,
    pub comments: Value,
    pub paid_by: Uuid,
    pub category: String,
    pub splits: Value,
    pub itinerary_item_id: Option<Uuid>,
    pub version: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BookingDocExternalLinkSummary {
    pub id: Uuid,
    pub label: String,
    pub url: String,
    pub provider: Option<String>,
    pub access_note: Option<String>,
}

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

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PhotoAlbumLinkSummary {
    pub id: Uuid,
    pub trip_id: Uuid,
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
    pub created_by: Uuid,
    pub updated_at: String,
    pub version: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TripCockpit {
    pub trip: TripSummary,
    pub members: Vec<TripMemberSummary>,
    pub plan_variants: Vec<PlanVariantSummary>,
    pub trip_plans: Vec<TripPlanSummary>,
    pub itinerary_items: Vec<ItineraryItemSummary>,
    pub suggestions: Vec<SuggestionSummary>,
    pub latest_plan_check: Option<PlanCheckSummary>,
    pub tasks: Vec<TripTaskSummary>,
    pub stop_notes: Vec<StopNoteSummary>,
    pub expenses: Vec<ExpenseItemSummary>,
    pub expense_summary: Option<ExpenseSummary>,
    pub booking_docs: Vec<BookingDocSummary>,
    pub photo_album_links: Vec<PhotoAlbumLinkSummary>,
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
                home_city: Some("Bangkok".to_string()),
                home_country: Some("Thailand".to_string()),
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

        let session = AccountSession {
            user_id,
            session_token: "session-token".to_string(),
            kind: AccountSessionKind::Trusted,
            trusted_device_id: Some(credential_id),
            created_at: "2026-05-30T00:00:00Z".to_string(),
            expires_at: "2026-05-31T00:00:00Z".to_string(),
        };
        let value = serde_json::to_value(session).unwrap();
        assert_eq!(value["userId"], user_id.to_string());
        assert_eq!(value["sessionToken"], "session-token");
        assert_eq!(value["kind"], "trusted");
        assert_eq!(value["trustedDeviceId"], credential_id.to_string());
        assert_eq!(value["createdAt"], "2026-05-30T00:00:00Z");
        assert_eq!(value["expiresAt"], "2026-05-31T00:00:00Z");

        let email_login_start = EmailLoginStartResponse {
            challenge_id: credential_id,
            expires_at: "2026-05-30T00:05:00Z".to_string(),
        };
        let value = serde_json::to_value(email_login_start).unwrap();
        assert_eq!(value["challengeId"], credential_id.to_string());
        assert_eq!(value["expiresAt"], "2026-05-30T00:05:00Z");
        assert!(value.get("devCode").is_none());

        let passkey_challenge = PasskeyChallengeResponse {
            challenge_id: credential_id,
            challenge: "challenge-payload".to_string(),
            expires_at: "2026-05-30T00:05:00Z".to_string(),
        };
        let value = serde_json::to_value(passkey_challenge).unwrap();
        assert_eq!(value["challengeId"], credential_id.to_string());
        assert_eq!(value["challenge"], "challenge-payload");
        assert_eq!(value["expiresAt"], "2026-05-30T00:05:00Z");

        let trip_id = Uuid::parse_str("018f4e80-0000-7000-a000-000000000003").unwrap();
        let member_id = Uuid::parse_str("018f4e80-0000-7000-a000-000000000004").unwrap();
        let owner_member_id = Uuid::parse_str("018f4e80-0000-7000-a000-000000000005").unwrap();
        let new_owner_member_id = Uuid::parse_str("018f4e80-0000-7000-a000-000000000006").unwrap();
        let plan_variant_id = Uuid::parse_str("018f4e80-0000-7000-a000-000000000007").unwrap();
        let start_date = Date::from_calendar_date(2026, time::Month::June, 1).unwrap();
        let end_date = Date::from_calendar_date(2026, time::Month::June, 8).unwrap();
        let chiang_mai = TripCity {
            city: "Chiang Mai".to_string(),
            country: "Thailand".to_string(),
            country_code: "TH".to_string(),
            timezone: "Asia/Bangkok".to_string(),
            latitude: 18.7883,
            longitude: 98.9853,
        };

        let account_trip = AccountTripSummary {
            id: trip_id,
            name: "Chiang Mai".to_string(),
            origin_label: "Bangkok, Thailand".to_string(),
            origin_city: "Bangkok".to_string(),
            origin_country: "Thailand".to_string(),
            origin_country_code: "TH".to_string(),
            destination_label: "Chiang Mai".to_string(),
            destination_cities: vec![chiang_mai.clone()],
            countries: vec!["Thailand".to_string()],
            party_size: 4,
            default_timezone: "Asia/Bangkok".to_string(),
            start_date,
            end_date,
            role: TripRole::Owner,
            member_id,
            owner_member_id,
            joined_at: "2026-05-30T02:00:00Z".to_string(),
            is_owner: true,
        };
        let value = serde_json::to_value(account_trip).unwrap();
        assert_eq!(value["originLabel"], "Bangkok, Thailand");
        assert_eq!(value["destinationLabel"], "Chiang Mai");
        assert_eq!(value["destinationCities"][0]["city"], "Chiang Mai");
        assert_eq!(value["countries"], serde_json::json!(["Thailand"]));
        assert_eq!(value["partySize"], 4);
        assert_eq!(value["defaultTimezone"], "Asia/Bangkok");
        assert_eq!(
            value["startDate"],
            serde_json::to_value(start_date).unwrap()
        );
        assert_eq!(value["endDate"], serde_json::to_value(end_date).unwrap());
        assert_eq!(value["memberId"], member_id.to_string());
        assert_eq!(value["ownerMemberId"], owner_member_id.to_string());
        assert_eq!(value["joinedAt"], "2026-05-30T02:00:00Z");
        assert_eq!(value["isOwner"], true);

        let account_trip_stats = AccountTripStats {
            trips_total: 3,
            trips_owned: 1,
            active_trips: 2,
            temp_claims_completed: 4,
        };
        let value = serde_json::to_value(account_trip_stats).unwrap();
        assert_eq!(value["tripsTotal"], 3);
        assert_eq!(value["tripsOwned"], 1);
        assert_eq!(value["activeTrips"], 2);
        assert_eq!(value["tempClaimsCompleted"], 4);

        let member_claim = AccountMemberClaimResponse {
            trip_id,
            member_id,
            user_id,
            role: TripRole::Traveler,
        };
        let value = serde_json::to_value(member_claim).unwrap();
        assert_eq!(value["tripId"], trip_id.to_string());
        assert_eq!(value["memberId"], member_id.to_string());
        assert_eq!(value["userId"], user_id.to_string());
        assert_eq!(value["role"], "traveler");

        let owner_transfer = OwnerTransferResponse {
            trip_id,
            previous_owner_member_id: owner_member_id,
            new_owner_member_id,
        };
        let value = serde_json::to_value(owner_transfer).unwrap();
        assert_eq!(value["tripId"], trip_id.to_string());
        assert_eq!(value["previousOwnerMemberId"], owner_member_id.to_string());
        assert_eq!(value["newOwnerMemberId"], new_owner_member_id.to_string());

        let account_trip_create = AccountTripCreateResponse {
            trip: TripSummary {
                id: trip_id,
                name: "Chiang Mai".to_string(),
                origin_label: "Bangkok, Thailand".to_string(),
                origin_city: "Bangkok".to_string(),
                origin_country: "Thailand".to_string(),
                origin_country_code: "TH".to_string(),
                destination_label: "Chiang Mai".to_string(),
                destination_cities: vec![chiang_mai],
                countries: vec!["Thailand".to_string()],
                party_size: 4,
                default_timezone: "Asia/Bangkok".to_string(),
                start_date,
                end_date,
                join_id: "CM2026".to_string(),
                active_plan_variant_id: Some(plan_variant_id),
                main_trip_plan_id: Some(plan_variant_id),
                owner_member_id,
                version: 1,
            },
            owner_member_id,
            member_session: MemberSession {
                trip_id,
                member_id: owner_member_id,
                session_token: "member-session-token".to_string(),
                created_at: "2026-05-30T02:00:00Z".to_string(),
                expires_at: "2026-06-06T02:00:00Z".to_string(),
            },
        };
        let value = serde_json::to_value(account_trip_create).unwrap();
        assert_eq!(value["trip"]["originCity"], "Bangkok");
        assert_eq!(value["trip"]["destinationLabel"], "Chiang Mai");
        assert_eq!(value["trip"]["countries"], serde_json::json!(["Thailand"]));
        assert_eq!(value["trip"]["partySize"], 4);
        assert_eq!(value["trip"]["defaultTimezone"], "Asia/Bangkok");
        assert_eq!(value["ownerMemberId"], owner_member_id.to_string());
        assert_eq!(
            value["memberSession"]["memberId"],
            owner_member_id.to_string()
        );
        assert_eq!(
            value["memberSession"]["sessionToken"],
            "member-session-token"
        );
    }
}
