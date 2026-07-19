use sqlx::FromRow;
use uuid::Uuid;

use sagittarius_domain::types::TripTaskSummary;

#[derive(Debug, Clone, FromRow)]
pub struct TripTaskRecord {
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

impl From<TripTaskRecord> for TripTaskSummary {
    fn from(record: TripTaskRecord) -> Self {
        Self {
            id: record.id,
            trip_id: record.trip_id,
            trip_plan_id: record.trip_plan_id,
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
    pub trip_plan_id: Option<Uuid>,
    pub title: &'a str,
    pub visibility: &'a str,
    pub kind: Option<&'a str>,
    pub created_by: Uuid,
    pub assignee_id: Option<Uuid>,
    pub related_item_id: Option<Uuid>,
}

