use sqlx::FromRow;
use time::{Date, OffsetDateTime};
use uuid::Uuid;

use sagittarius_domain::types::{
    ClaimableMember, TripMemberAccessStatus, TripMemberSummary, TripRole,
};

#[derive(Debug, Clone, FromRow)]
pub struct TripMemberAuthRecord {
    pub id: Uuid,
    pub trip_id: Uuid,
    pub display_name: String,
    #[sqlx(try_from = "String")]
    pub role: TripRole,
    #[sqlx(try_from = "String")]
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
    #[sqlx(try_from = "String")]
    pub role: TripRole,
}

#[derive(Debug, Clone, FromRow)]
pub struct MemberSessionPolicyRecord {
    #[sqlx(try_from = "String")]
    pub role: TripRole,
    pub start_date: Date,
    pub end_date: Date,
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
pub struct TripMemberRecord {
    pub id: Uuid,
    pub trip_id: Uuid,
    pub display_name: String,
    #[sqlx(try_from = "String")]
    pub role: TripRole,
    #[sqlx(try_from = "String")]
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

