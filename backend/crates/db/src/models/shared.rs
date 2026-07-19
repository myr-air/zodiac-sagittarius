use sqlx::FromRow;
use uuid::Uuid;

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

