use sqlx::FromRow;
use time::{Date, OffsetDateTime};
use uuid::Uuid;

use crate::domain::types::{
    AccountSessionKind, ClaimableMember, ExpenseItemSummary, ItineraryCoordinates,
    ItineraryItemSummary, PlanVariantSummary, StopNoteSummary, SuggestionSummary,
    TripMemberAccessStatus, TripMemberSummary, TripRole, TripSummary, TripTaskSummary,
};

#[derive(Debug, Clone, FromRow)]
pub struct TripAuthRecord {
    pub id: Uuid,
    pub name: String,
    pub destination_label: String,
    pub countries: Vec<String>,
    pub start_date: Date,
    pub end_date: Date,
    pub join_id: String,
    pub join_password_hash: String,
    pub active_plan_variant_id: Option<Uuid>,
    pub owner_member_id: Uuid,
    pub version: i64,
}

impl From<TripAuthRecord> for TripSummary {
    fn from(record: TripAuthRecord) -> Self {
        Self {
            id: record.id,
            name: record.name,
            destination_label: record.destination_label,
            countries: record.countries,
            start_date: record.start_date,
            end_date: record.end_date,
            join_id: record.join_id,
            active_plan_variant_id: record.active_plan_variant_id,
            owner_member_id: record.owner_member_id,
            version: record.version,
        }
    }
}

#[derive(Debug, Clone, FromRow)]
pub struct TripMemberAuthRecord {
    pub id: Uuid,
    pub trip_id: Uuid,
    pub display_name: String,
    pub role: TripRole,
    pub access_status: TripMemberAccessStatus,
    pub claim_password_hash: Option<String>,
    pub claimed_at: Option<OffsetDateTime>,
    pub color: String,
}

impl From<TripMemberAuthRecord> for ClaimableMember {
    fn from(record: TripMemberAuthRecord) -> Self {
        Self {
            id: record.id,
            trip_id: record.trip_id,
            display_name: record.display_name,
            role: record.role,
            access_status: record.access_status,
            color: record.color,
            claimed_at: record.claimed_at.map(|dt| dt.to_string()),
        }
    }
}

#[derive(Debug, Clone, FromRow)]
pub struct AuthenticatedMemberSessionRecord {
    pub trip_id: Uuid,
    pub member_id: Uuid,
    pub role: TripRole,
}

#[derive(Debug, Clone, FromRow)]
pub struct MemberSessionPolicyRecord {
    pub role: TripRole,
    pub start_date: Date,
    pub end_date: Date,
}

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
    pub destination_label: &'a str,
    pub countries: &'a [String],
    pub start_date: Date,
    pub end_date: Date,
    pub join_id: &'a str,
    pub join_password_hash: &'a str,
    pub active_plan_variant_id: Uuid,
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
    pub kind: &'a str,
    pub description: &'a str,
}

pub struct NewPlanVariant<'a> {
    pub id: Uuid,
    pub trip_id: Uuid,
    pub name: &'a str,
    pub kind: &'a str,
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

pub struct NewItineraryItem<'a> {
    pub id: Uuid,
    pub trip_id: Uuid,
    pub plan_variant_id: Uuid,
    pub path_group_id: Option<&'a str>,
    pub path_id: Option<&'a str>,
    pub path_name: Option<&'a str>,
    pub path_role: Option<&'a str>,
    pub day: Date,
    pub sort_order: i32,
    pub start_time: Option<&'a str>,
    pub activity: &'a str,
    pub activity_type: &'a str,
    pub place: &'a str,
    pub map_link: &'a str,
    pub address: Option<&'a str>,
    pub latitude: Option<f64>,
    pub longitude: Option<f64>,
    pub duration_minutes: Option<i32>,
    pub transportation: &'a str,
    pub note: &'a str,
    pub created_by: Uuid,
}

pub struct NewTripMember<'a> {
    pub id: Uuid,
    pub trip_id: Uuid,
    pub display_name: &'a str,
    pub role: TripRole,
    pub color: &'a str,
    pub claim_password_hash: Option<&'a str>,
}

#[derive(Debug, Clone, FromRow)]
pub struct AccountTripRecord {
    pub id: Uuid,
    pub name: String,
    pub destination_label: String,
    pub countries: Vec<String>,
    pub start_date: Date,
    pub end_date: Date,
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

#[derive(Debug, Clone, FromRow)]
pub struct TripMemberRecord {
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

impl From<TripMemberRecord> for TripMemberSummary {
    fn from(record: TripMemberRecord) -> Self {
        Self {
            id: record.id,
            trip_id: record.trip_id,
            display_name: record.display_name,
            role: record.role,
            access_status: record.access_status,
            presence: record.presence,
            color: record.color,
            user_id: record.user_id,
            claimed_at: record.claimed_at,
            last_seen_at: record.last_seen_at,
        }
    }
}

#[derive(Debug, Clone, FromRow)]
pub struct PlanVariantRecord {
    pub id: Uuid,
    pub trip_id: Uuid,
    pub name: String,
    pub kind: String,
    pub description: String,
    pub version: i64,
}

impl From<PlanVariantRecord> for PlanVariantSummary {
    fn from(record: PlanVariantRecord) -> Self {
        Self {
            id: record.id,
            trip_id: record.trip_id,
            name: record.name,
            kind: record.kind,
            description: record.description,
            version: record.version,
        }
    }
}

#[derive(Debug, Clone, FromRow)]
pub struct ItineraryItemRecord {
    pub id: Uuid,
    pub trip_id: Uuid,
    pub plan_variant_id: Uuid,
    pub path_group_id: Option<String>,
    pub path_id: Option<String>,
    pub path_name: Option<String>,
    pub path_role: Option<String>,
    pub day: Date,
    pub sort_order: i32,
    pub start_time: String,
    pub activity: String,
    pub activity_type: String,
    pub place: String,
    pub link_label: String,
    pub map_link: String,
    pub address: Option<String>,
    pub latitude: Option<f64>,
    pub longitude: Option<f64>,
    pub duration_minutes: Option<i32>,
    pub transportation: String,
    pub advisories: serde_json::Value,
    pub note: String,
    pub created_by: Uuid,
    pub updated_at: String,
    pub version: i64,
}

#[derive(Debug, Clone, FromRow)]
pub struct TripDailyBriefingRecord {
    pub trip_id: Uuid,
    pub briefing_date: Date,
    pub location_key: String,
    pub location_label: String,
    pub coordinates: Option<serde_json::Value>,
    pub weather: Option<serde_json::Value>,
    pub holiday: Option<serde_json::Value>,
    pub festival: Option<serde_json::Value>,
    pub facts: Option<serde_json::Value>,
    pub outfit_advice: Option<serde_json::Value>,
    pub manual_overrides: serde_json::Value,
    pub updated_at: OffsetDateTime,
    pub version: i64,
}

impl From<ItineraryItemRecord> for ItineraryItemSummary {
    fn from(record: ItineraryItemRecord) -> Self {
        let coordinates = match (record.latitude, record.longitude) {
            (Some(lat), Some(lng)) => Some(ItineraryCoordinates { lat, lng }),
            _ => None,
        };

        Self {
            id: record.id,
            trip_id: record.trip_id,
            plan_variant_id: record.plan_variant_id,
            path_group_id: record.path_group_id,
            path_id: record.path_id,
            path_name: record.path_name,
            path_role: record.path_role,
            day: record.day,
            sort_order: record.sort_order,
            start_time: record.start_time,
            activity: record.activity,
            activity_type: record.activity_type,
            place: record.place,
            link_label: record.link_label,
            map_link: record.map_link,
            coordinates,
            address: record.address,
            duration_minutes: record.duration_minutes,
            transportation: record.transportation,
            advisories: record.advisories,
            note: record.note,
            created_by: record.created_by,
            updated_at: record.updated_at,
            version: record.version,
        }
    }
}

#[derive(Debug, Clone, FromRow)]
pub struct SuggestionRecord {
    pub id: Uuid,
    pub trip_id: Uuid,
    pub plan_variant_id: Uuid,
    pub proposer_id: Uuid,
    pub r#type: String,
    pub target_item_id: Option<Uuid>,
    pub proposed_patch: serde_json::Value,
    pub source_version: Option<i64>,
    pub status: String,
    pub created_at: String,
}

impl From<SuggestionRecord> for SuggestionSummary {
    fn from(record: SuggestionRecord) -> Self {
        Self {
            id: record.id,
            trip_id: record.trip_id,
            plan_variant_id: record.plan_variant_id,
            proposer_id: record.proposer_id,
            r#type: record.r#type,
            target_item_id: record.target_item_id,
            proposed_patch: record.proposed_patch,
            source_version: record.source_version,
            status: record.status,
            created_at: record.created_at,
        }
    }
}

pub struct NewSuggestion<'a> {
    pub id: Uuid,
    pub trip_id: Uuid,
    pub plan_variant_id: Uuid,
    pub proposer_id: Uuid,
    pub r#type: &'a str,
    pub target_item_id: Option<Uuid>,
    pub proposed_patch: serde_json::Value,
    pub source_version: Option<i64>,
}

#[derive(Debug, Clone, FromRow)]
pub struct TripTaskRecord {
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

impl From<TripTaskRecord> for TripTaskSummary {
    fn from(record: TripTaskRecord) -> Self {
        Self {
            id: record.id,
            trip_id: record.trip_id,
            title: record.title,
            status: record.status,
            visibility: record.visibility,
            kind: record.kind,
            created_by: record.created_by,
            assignee_id: record.assignee_id,
            related_item_id: record.related_item_id,
            version: record.version,
        }
    }
}

pub struct NewTripTask<'a> {
    pub id: Uuid,
    pub trip_id: Uuid,
    pub title: &'a str,
    pub visibility: &'a str,
    pub kind: Option<&'a str>,
    pub created_by: Uuid,
    pub assignee_id: Option<Uuid>,
    pub related_item_id: Option<Uuid>,
}

#[derive(Debug, Clone, FromRow)]
pub struct StopNoteRecord {
    pub id: Uuid,
    pub trip_id: Uuid,
    pub itinerary_item_id: Uuid,
    pub author_id: Uuid,
    pub body: String,
    pub created_at: String,
    pub updated_at: String,
    pub version: i64,
}

impl From<StopNoteRecord> for StopNoteSummary {
    fn from(record: StopNoteRecord) -> Self {
        Self {
            id: record.id,
            trip_id: record.trip_id,
            item_id: record.itinerary_item_id,
            author_id: record.author_id,
            body: record.body,
            created_at: record.created_at,
            updated_at: record.updated_at,
            version: record.version,
        }
    }
}

pub struct NewStopNote<'a> {
    pub id: Uuid,
    pub trip_id: Uuid,
    pub itinerary_item_id: Uuid,
    pub author_id: Uuid,
    pub body: &'a str,
}

#[derive(Debug, Clone, FromRow)]
pub struct ExpenseSplitRecord {
    pub paid_by: Uuid,
    pub amount_minor: i32,
    pub splits: serde_json::Value,
}

#[derive(Debug, Clone, FromRow)]
pub struct ExpenseRecord {
    pub id: Uuid,
    pub trip_id: Uuid,
    pub title: String,
    pub amount_minor: i32,
    pub currency: String,
    pub paid_by: Uuid,
    pub category: String,
    pub splits: serde_json::Value,
    pub itinerary_item_id: Option<Uuid>,
    pub version: i64,
}

impl From<ExpenseRecord> for ExpenseItemSummary {
    fn from(record: ExpenseRecord) -> Self {
        Self {
            id: record.id,
            trip_id: record.trip_id,
            title: record.title,
            amount_minor: record.amount_minor,
            currency: record.currency,
            paid_by: record.paid_by,
            category: record.category,
            splits: record.splits,
            itinerary_item_id: record.itinerary_item_id,
            version: record.version,
        }
    }
}

pub struct NewExpense<'a> {
    pub id: Uuid,
    pub trip_id: Uuid,
    pub title: &'a str,
    pub amount_minor: i32,
    pub currency: &'a str,
    pub paid_by: Uuid,
    pub category: &'a str,
    pub splits: serde_json::Value,
    pub itinerary_item_id: Option<Uuid>,
}

#[derive(Debug, Clone, FromRow)]
pub struct RealtimeEventRecord {
    pub id: Uuid,
    pub trip_id: Uuid,
    pub aggregate_type: String,
    pub event_type: String,
    pub aggregate_id: Uuid,
    pub version: i64,
    pub payload: serde_json::Value,
    pub client_mutation_id: Option<String>,
    pub created_by: Option<Uuid>,
    pub created_at: String,
}

pub struct NewRealtimeEvent<'a> {
    pub trip_id: Uuid,
    pub aggregate_type: &'a str,
    pub event_type: &'a str,
    pub aggregate_id: Uuid,
    pub version: i64,
    pub payload: serde_json::Value,
    pub client_mutation_id: Option<&'a str>,
    pub created_by: Option<Uuid>,
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    fn itinerary_record(latitude: Option<f64>, longitude: Option<f64>) -> ItineraryItemRecord {
        ItineraryItemRecord {
            id: Uuid::now_v7(),
            trip_id: Uuid::now_v7(),
            plan_variant_id: Uuid::now_v7(),
            path_group_id: None,
            path_id: None,
            path_name: None,
            path_role: None,
            day: Date::from_calendar_date(2026, time::Month::May, 29).unwrap(),
            sort_order: 1,
            start_time: "09:00".to_string(),
            activity: "Breakfast".to_string(),
            activity_type: "food".to_string(),
            place: "Central".to_string(),
            link_label: String::new(),
            map_link: String::new(),
            address: Some("Hong Kong".to_string()),
            latitude,
            longitude,
            duration_minutes: Some(45),
            transportation: "walk".to_string(),
            advisories: json!([]),
            note: "Bring cash".to_string(),
            created_by: Uuid::now_v7(),
            updated_at: "2026-05-29T00:00:00Z".to_string(),
            version: 1,
        }
    }

    #[test]
    fn itinerary_summary_includes_coordinates_only_when_both_parts_exist() {
        let with_coordinates =
            ItineraryItemSummary::from(itinerary_record(Some(22.3), Some(114.2)));
        assert_eq!(with_coordinates.coordinates.unwrap().lat, 22.3);

        let missing_longitude = ItineraryItemSummary::from(itinerary_record(Some(22.3), None));
        assert!(missing_longitude.coordinates.is_none());
    }
}
