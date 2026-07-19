use serde::Serialize;
use serde_json::Value;
use sqlx::PgPool;
use tokio::sync::broadcast;
use uuid::Uuid;

use sagittarius_db::models::RealtimeEventRecord;

#[derive(Clone)]
pub struct RealtimeHub {
    sender: broadcast::Sender<RealtimeEvent>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RealtimeEvent {
    pub event_id: Uuid,
    pub trip_id: Uuid,
    #[serde(rename = "type")]
    pub event_type: String,
    pub aggregate_id: Uuid,
    pub version: i64,
    pub client_mutation_id: Option<String>,
    pub actor_member_id: Option<Uuid>,
    pub occurred_at: String,
    pub payload: Value,
}

impl Default for RealtimeHub {
    fn default() -> Self {
        let (sender, _) = broadcast::channel(1024);
        Self { sender }
    }
}

impl RealtimeHub {
    pub fn with_capacity(capacity: usize) -> Self {
        let (sender, _) = broadcast::channel(capacity);
        Self { sender }
    }

    pub fn subscribe(&self) -> broadcast::Receiver<RealtimeEvent> {
        self.sender.subscribe()
    }

    pub async fn publish(&self, event: RealtimeEvent) {
        let _ = self.sender.send(event);
    }
}

impl From<RealtimeEventRecord> for RealtimeEvent {
    fn from(record: RealtimeEventRecord) -> Self {
        Self {
            event_id: record.id,
            trip_id: record.trip_id,
            event_type: record.event_type,
            aggregate_id: record.aggregate_id,
            version: record.version,
            client_mutation_id: record.client_mutation_id,
            actor_member_id: record.created_by,
            occurred_at: record.created_at,
            payload: record.payload,
        }
    }
}

pub async fn load_events_after(
    pool: &PgPool,
    trip_id: Uuid,
    after_event_id: Option<Uuid>,
) -> Result<Vec<RealtimeEvent>, sqlx::Error> {
    let rows = sqlx::query_as::<_, RealtimeEventRecord>(
        "select
           id, trip_id, aggregate_type, event_type, aggregate_id, version, payload,
           client_mutation_id, created_by, created_at::text as created_at
         from realtime_events
         where trip_id = $1
           and ($2::uuid is null or id > $2)
         order by id asc
         limit 500",
    )
    .bind(trip_id)
    .bind(after_event_id)
    .fetch_all(pool)
    .await?;

    Ok(rows.into_iter().map(RealtimeEvent::from).collect())
}
