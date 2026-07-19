use uuid::Uuid;

use crate::PgPool;
use crate::models::{NewStopNote, StopNoteRecord};
use sagittarius_domain::uuid_values::unique_uuids;

pub async fn list_stop_notes(
    pool: &PgPool,
    trip_id: Uuid,
) -> Result<Vec<StopNoteRecord>, sqlx::Error> {
    sqlx::query_as::<_, StopNoteRecord>(
        "select
           id, trip_id, trip_plan_id, itinerary_item_id, author_id, body,
           created_at::text as created_at, updated_at::text as updated_at, version
         from stop_notes
         where trip_id = $1 and deleted_at is null
         order by created_at asc",
    )
    .bind(trip_id)
    .fetch_all(pool)
    .await
}

pub async fn insert_stop_note(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    note: NewStopNote<'_>,
) -> Result<StopNoteRecord, sqlx::Error> {
    sqlx::query_as::<_, StopNoteRecord>(
        "insert into stop_notes (id, trip_id, trip_plan_id, itinerary_item_id, author_id, body, version)
         values ($1, $2, $3, $4, $5, $6, 1)
         returning
           id, trip_id, trip_plan_id, itinerary_item_id, author_id, body,
           created_at::text as created_at, updated_at::text as updated_at, version",
    )
    .bind(note.id)
    .bind(note.trip_id)
    .bind(note.trip_plan_id)
    .bind(note.itinerary_item_id)
    .bind(note.author_id)
    .bind(note.body)
    .fetch_one(&mut **tx)
    .await
}

pub async fn lock_stop_note(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    note_id: Uuid,
) -> Result<Option<StopNoteRecord>, sqlx::Error> {
    sqlx::query_as::<_, StopNoteRecord>(
        "select
           id, trip_id, trip_plan_id, itinerary_item_id, author_id, body,
           created_at::text as created_at, updated_at::text as updated_at, version
         from stop_notes
         where id = $1 and deleted_at is null
         for update",
    )
    .bind(note_id)
    .fetch_optional(&mut **tx)
    .await
}

pub async fn update_stop_note(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    note_id: Uuid,
    body: &str,
    trip_plan_id: Option<Uuid>,
    next_version: i64,
) -> Result<Option<StopNoteRecord>, sqlx::Error> {
    sqlx::query_as::<_, StopNoteRecord>(
        "update stop_notes
         set body = $2,
             trip_plan_id = $3,
             version = $4,
             updated_at = now()
         where id = $1 and deleted_at is null
         returning
           id, trip_id, trip_plan_id, itinerary_item_id, author_id, body,
           created_at::text as created_at, updated_at::text as updated_at, version",
    )
    .bind(note_id)
    .bind(body)
    .bind(trip_plan_id)
    .bind(next_version)
    .fetch_optional(&mut **tx)
    .await
}

pub async fn delete_stop_note(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    note_id: Uuid,
    next_version: i64,
) -> Result<Option<StopNoteRecord>, sqlx::Error> {
    sqlx::query_as::<_, StopNoteRecord>(
        "update stop_notes
         set deleted_at = now(), version = $2, updated_at = now()
         where id = $1 and deleted_at is null
         returning
           id, trip_id, trip_plan_id, itinerary_item_id, author_id, body,
           created_at::text as created_at, updated_at::text as updated_at, version",
    )
    .bind(note_id)
    .bind(next_version)
    .fetch_optional(&mut **tx)
    .await
}

pub async fn stop_note_ids_exist_for_trip(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    trip_id: Uuid,
    note_ids: &[Uuid],
) -> Result<bool, sqlx::Error> {
    if note_ids.is_empty() {
        return Ok(true);
    }

    let existing_count = sqlx::query_scalar::<_, i64>(
        "select count(distinct id)
         from stop_notes
         where trip_id = $1 and id = any($2) and deleted_at is null",
    )
    .bind(trip_id)
    .bind(note_ids)
    .fetch_one(&mut **tx)
    .await?;

    Ok(existing_count == unique_uuid_count(note_ids))
}

pub async fn stop_note_trip_plan_ids_for_trip(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    trip_id: Uuid,
    note_ids: &[Uuid],
) -> Result<Vec<Option<Uuid>>, sqlx::Error> {
    if note_ids.is_empty() {
        return Ok(Vec::new());
    }

    sqlx::query_scalar(
        "select distinct trip_plan_id
         from stop_notes
         where trip_id = $1 and id = any($2) and deleted_at is null",
    )
    .bind(trip_id)
    .bind(note_ids)
    .fetch_all(&mut **tx)
    .await
}

fn unique_uuid_count(ids: &[Uuid]) -> i64 {
    unique_uuids(ids).len() as i64
}
