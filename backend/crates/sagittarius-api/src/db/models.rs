use sqlx::FromRow;
use time::{Date, OffsetDateTime};
use uuid::Uuid;

use crate::domain::types::{ClaimableMember, TripMemberAccessStatus, TripRole, TripSummary};

#[derive(Debug, Clone, FromRow)]
pub struct TripAuthRecord {
    pub id: Uuid,
    pub name: String,
    pub destination_label: String,
    pub start_date: Date,
    pub end_date: Date,
    pub join_id: String,
    pub join_password_hash: String,
    pub active_plan_variant_id: Option<Uuid>,
    pub owner_member_id: Uuid,
}

impl From<TripAuthRecord> for TripSummary {
    fn from(record: TripAuthRecord) -> Self {
        Self {
            id: record.id,
            name: record.name,
            destination_label: record.destination_label,
            start_date: record.start_date,
            end_date: record.end_date,
            join_id: record.join_id,
            active_plan_variant_id: record.active_plan_variant_id,
            owner_member_id: record.owner_member_id,
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
        }
    }
}
