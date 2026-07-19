use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[cfg_attr(feature = "openapi", derive(utoipa::ToSchema))]
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

