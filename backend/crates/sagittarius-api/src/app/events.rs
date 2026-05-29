use serde_json::Value;
use uuid::Uuid;

use crate::db;
use crate::db::models::NewRealtimeEvent;
use crate::domain::errors::ServiceError;
use crate::realtime::EventEnvelope;

pub struct EventWrite<'a> {
    pub trip_id: Uuid,
    pub aggregate_type: &'a str,
    pub event_type: &'a str,
    pub aggregate_id: Uuid,
    pub version: i64,
    pub payload: Value,
    pub client_mutation_id: Option<&'a str>,
    pub created_by: Option<Uuid>,
}

pub async fn insert(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    event: EventWrite<'_>,
) -> Result<EventEnvelope, ServiceError> {
    let record = match db::queries::insert_realtime_event(
        tx,
        NewRealtimeEvent {
            trip_id: event.trip_id,
            aggregate_type: event.aggregate_type,
            event_type: event.event_type,
            aggregate_id: event.aggregate_id,
            version: event.version,
            payload: event.payload,
            client_mutation_id: event.client_mutation_id,
            created_by: event.created_by,
        },
    )
    .await
    {
        Ok(record) => record,
        Err(error) if is_unique_violation(&error) => return Err(ServiceError::VersionConflict),
        Err(error) => return Err(error.into()),
    };

    Ok(EventEnvelope {
        id: record.id,
        trip_id: record.trip_id,
        aggregate_type: record.aggregate_type,
        event_type: record.event_type,
        aggregate_id: record.aggregate_id,
        version: record.version,
        payload: record.payload,
        client_mutation_id: record.client_mutation_id,
        created_by: record.created_by,
        created_at: record.created_at,
    })
}

fn is_unique_violation(error: &sqlx::Error) -> bool {
    matches!(
        error,
        sqlx::Error::Database(database_error)
            if database_error.code().as_deref() == Some("23505")
    )
}
