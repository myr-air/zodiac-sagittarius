use serde::Serialize;
use serde_json::Value;
use uuid::Uuid;

#[derive(Clone, Default)]
pub struct RealtimeHub;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct EventEnvelope {
    pub id: Uuid,
    pub trip_id: Uuid,
    pub aggregate_type: String,
    pub event_type: String,
    pub aggregate_id: Uuid,
    pub version: i64,
    pub payload: Value,
    pub client_mutation_id: Option<String>,
    pub created_by: Option<Uuid>,
    pub created_at: String,
}

impl RealtimeHub {
    pub async fn publish(&self, _event: EventEnvelope) {}
}
