use sqlx::{FromRow, types::Json};
use time::{Date, OffsetDateTime};
use uuid::Uuid;

use sagittarius_domain::types::{AccountSessionKind, TripCity, TripRole};

#[derive(Debug, Clone, FromRow)]
pub struct EmailLoginChallengeRecord {
    pub id: Uuid,
    pub normalized_email: String,
    pub code_hash: String,
    pub attempt_count: i32,
    pub expires_at: OffsetDateTime,
    pub locked_at: Option<OffsetDateTime>,
    pub consumed_at: Option<OffsetDateTime>,
}

#[derive(Debug, Clone, FromRow)]
pub struct AuthAttemptLockRecord {
    pub attempt_count: i32,
    pub locked_until: Option<OffsetDateTime>,
}

#[derive(Debug, Clone, FromRow)]
pub struct UserEmailRecord {
    pub user_id: Uuid,
    pub disabled_at: Option<OffsetDateTime>,
    pub verified_at: Option<OffsetDateTime>,
}

#[derive(Debug, Clone, FromRow)]
pub struct PasswordLoginUserRecord {
    pub user_id: Uuid,
    pub password_hash: Option<String>,
    pub disabled_at: Option<OffsetDateTime>,
}

pub struct NewUser<'a> {
    pub id: Uuid,
    pub display_name: &'a str,
    pub avatar_color: &'a str,
}

pub struct NewUserEmail<'a> {
    pub id: Uuid,
    pub user_id: Uuid,
    pub email: &'a str,
    pub normalized_email: &'a str,
    pub verified_at: OffsetDateTime,
}

pub struct NewEmailLoginOutbox<'a> {
    pub id: Uuid,
    pub challenge_id: Uuid,
    pub normalized_email: &'a str,
    pub code: &'a str,
    pub expires_at: OffsetDateTime,
}

pub struct NewTrustedDevice<'a> {
    pub id: Uuid,
    pub user_id: Uuid,
    pub label: &'a str,
    pub created_at: OffsetDateTime,
    pub last_seen_at: OffsetDateTime,
}

pub struct NewUserSession<'a> {
    pub id: Uuid,
    pub user_id: Uuid,
    pub trusted_device_id: Option<Uuid>,
    pub session_token_hash: &'a str,
    pub kind: AccountSessionKind,
    pub created_at: OffsetDateTime,
    pub expires_at: OffsetDateTime,
}

pub struct NewAccountTrip<'a> {
    pub id: Uuid,
    pub name: &'a str,
    pub origin_label: &'a str,
    pub origin_city: &'a str,
    pub origin_country: &'a str,
    pub origin_country_code: &'a str,
    pub destination_label: &'a str,
    pub destination_cities: &'a [TripCity],
    pub countries: &'a [String],
    pub party_size: i32,
    pub default_timezone: &'a str,
    pub start_date: Date,
    pub end_date: Date,
    pub join_id: &'a str,
    pub join_password_hash: &'a str,
    pub main_trip_plan_id: Uuid,
    pub owner_member_id: Uuid,
}

pub struct NewAccountTripOwnerMember<'a> {
    pub id: Uuid,
    pub trip_id: Uuid,
    pub user_id: Uuid,
    pub display_name: &'a str,
    pub color: &'a str,
    pub claimed_at: OffsetDateTime,
}

pub struct NewAccountPlanVariant<'a> {
    pub id: Uuid,
    pub trip_id: Uuid,
    pub name: &'a str,
    pub status: &'a str,
    pub description: &'a str,
}

pub struct NewAccountAuditEvent {
    pub id: Uuid,
    pub user_id: Uuid,
    pub trip_id: Uuid,
    pub actor_user_id: Uuid,
    pub actor_member_id: Uuid,
    pub event_type: &'static str,
    pub payload: serde_json::Value,
}

#[derive(Debug, Clone, FromRow)]
pub struct AccountTripRecord {
    pub id: Uuid,
    pub name: String,
    pub origin_label: String,
    pub origin_city: String,
    pub origin_country: String,
    pub origin_country_code: String,
    pub destination_label: String,
    pub destination_cities: Json<Vec<TripCity>>,
    pub countries: Vec<String>,
    pub party_size: i32,
    pub default_timezone: String,
    pub start_date: Date,
    pub end_date: Date,
    #[sqlx(try_from = "String")]
    pub role: TripRole,
    pub member_id: Uuid,
    pub owner_member_id: Uuid,
    pub joined_at: OffsetDateTime,
}

#[derive(Debug, Clone, FromRow)]
pub struct AccountTripStatsRecord {
    pub trips_total: i64,
    pub trips_owned: i64,
    pub active_trips: i64,
    pub temp_claims_completed: i64,
}

#[derive(Debug, Clone, FromRow)]
pub struct AccountTodoRecord {
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

#[derive(Debug, Clone, FromRow)]
pub struct AccountVaultItemRecord {
    pub id: Uuid,
    pub trip_id: Option<Uuid>,
    pub trip_name: Option<String>,
    pub kind: String,
    pub title: String,
    pub detail: String,
    pub external_url: Option<String>,
    pub source: String,
    pub created_at: OffsetDateTime,
}

pub struct NewAccountVaultItem<'a> {
    pub id: Uuid,
    pub user_id: Uuid,
    pub trip_id: Option<Uuid>,
    pub kind: &'a str,
    pub title: &'a str,
    pub detail: &'a str,
    pub external_url: Option<&'a str>,
}

#[derive(Debug, Clone, FromRow)]
pub struct ActiveUserSessionRecord {
    pub user_id: Uuid,
}

#[derive(Debug, Clone, FromRow)]
pub struct AccountProfileRecord {
    pub id: Uuid,
    pub display_name: String,
    pub avatar_color: String,
    pub locale: String,
    pub timezone: String,
    pub home_city: Option<String>,
    pub home_country: Option<String>,
    pub primary_email: Option<String>,
}

#[derive(Debug, Clone, FromRow)]
pub struct TrustedDeviceRecord {
    pub id: Uuid,
    pub label: String,
    pub user_agent: String,
    pub created_at: OffsetDateTime,
    pub last_seen_at: Option<OffsetDateTime>,
}

#[derive(Debug, Clone, FromRow)]
pub struct PasskeyRecord {
    pub id: Uuid,
    pub nickname: String,
    pub created_at: OffsetDateTime,
    pub last_used_at: Option<OffsetDateTime>,
}

#[derive(Debug, Clone, FromRow)]
pub struct PasskeyCredentialRecord {
    pub id: Uuid,
    pub user_id: Uuid,
    pub credential_id: String,
    pub public_key: serde_json::Value,
    pub sign_count: i64,
}

