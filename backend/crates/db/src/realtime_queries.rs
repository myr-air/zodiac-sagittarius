use uuid::Uuid;

use crate::models::{NewRealtimeEvent, RealtimeEventRecord};

pub async fn realtime_event_exists_for_client_mutation(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    trip_id: Uuid,
    created_by: Uuid,
    client_mutation_id: &str,
) -> Result<bool, sqlx::Error> {
    sqlx::query_scalar(
        "select exists (
           select 1
           from realtime_events
           where trip_id = $1 and created_by = $2 and client_mutation_id = $3
         )",
    )
    .bind(trip_id)
    .bind(created_by)
    .bind(client_mutation_id)
    .fetch_one(&mut **tx)
    .await
}

pub async fn insert_realtime_event(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    event: NewRealtimeEvent<'_>,
) -> Result<RealtimeEventRecord, sqlx::Error> {
    sqlx::query_as::<_, RealtimeEventRecord>(
        "insert into realtime_events (
           id, trip_id, aggregate_type, event_type, aggregate_id, version, payload,
           client_mutation_id, created_by
         )
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         returning
           id, trip_id, aggregate_type, event_type, aggregate_id, version, payload,
           client_mutation_id, created_by, created_at::text as created_at",
    )
    .bind(Uuid::now_v7())
    .bind(event.trip_id)
    .bind(event.aggregate_type)
    .bind(event.event_type)
    .bind(event.aggregate_id)
    .bind(event.version)
    .bind(event.payload)
    .bind(event.client_mutation_id)
    .bind(event.created_by)
    .fetch_one(&mut **tx)
    .await
}
