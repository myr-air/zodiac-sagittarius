use uuid::Uuid;

use crate::PgPool;
use crate::models::{NewTripTask, TripTaskRecord};
use sagittarius_domain::uuid_values::unique_uuids;

pub async fn list_visible_tasks(
    pool: &PgPool,
    trip_id: Uuid,
    member_id: Uuid,
) -> Result<Vec<TripTaskRecord>, sqlx::Error> {
    sqlx::query_as::<_, TripTaskRecord>(
        "select
           id, trip_id, trip_plan_id, title, status, visibility, kind, created_by, assignee_id,
           related_item_id, version
         from trip_tasks
         where trip_id = $1
           and deleted_at is null
           and (visibility = 'shared' or created_by = $2 or assignee_id = $2)
         order by updated_at desc, title",
    )
    .bind(trip_id)
    .bind(member_id)
    .fetch_all(pool)
    .await
}

pub async fn insert_task(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    task: NewTripTask<'_>,
) -> Result<TripTaskRecord, sqlx::Error> {
    sqlx::query_as::<_, TripTaskRecord>(
        "insert into trip_tasks (
           id, trip_id, trip_plan_id, title, status, visibility, kind, created_by, assignee_id, related_item_id,
           version
         )
         values ($1, $2, $3, $4, 'open', $5, $6, $7, $8, $9, 1)
         returning
           id, trip_id, trip_plan_id, title, status, visibility, kind, created_by, assignee_id,
           related_item_id, version",
    )
    .bind(task.id)
    .bind(task.trip_id)
    .bind(task.trip_plan_id)
    .bind(task.title)
    .bind(task.visibility)
    .bind(task.kind)
    .bind(task.created_by)
    .bind(task.assignee_id)
    .bind(task.related_item_id)
    .fetch_one(&mut **tx)
    .await
}

pub async fn lock_task(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    task_id: Uuid,
) -> Result<Option<TripTaskRecord>, sqlx::Error> {
    sqlx::query_as::<_, TripTaskRecord>(
        "select
           id, trip_id, trip_plan_id, title, status, visibility, kind, created_by, assignee_id,
           related_item_id, version
         from trip_tasks
         where id = $1 and deleted_at is null
         for update",
    )
    .bind(task_id)
    .fetch_optional(&mut **tx)
    .await
}

pub async fn update_task(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    task_id: Uuid,
    patch: &sagittarius_domain::patches::TaskPatch,
    trip_plan_id: Option<Uuid>,
    next_version: i64,
) -> Result<Option<TripTaskRecord>, sqlx::Error> {
    sqlx::query_as::<_, TripTaskRecord>(
        "update trip_tasks
         set title = coalesce($2, title),
             status = coalesce($3, status),
             assignee_id = case when $4 then $5 else assignee_id end,
             related_item_id = case when $6 then $7 else related_item_id end,
             trip_plan_id = $8,
             version = $9,
             updated_at = now()
         where id = $1 and deleted_at is null
         returning
           id, trip_id, trip_plan_id, title, status, visibility, kind, created_by, assignee_id,
           related_item_id, version",
    )
    .bind(task_id)
    .bind(patch.title.as_deref())
    .bind(patch.status.as_deref())
    .bind(patch.assignee_id.is_some())
    .bind(patch.assignee_id.unwrap_or(None))
    .bind(patch.related_item_id.is_some())
    .bind(patch.related_item_id.unwrap_or(None))
    .bind(trip_plan_id)
    .bind(next_version)
    .fetch_optional(&mut **tx)
    .await
}

pub async fn task_ids_exist_for_trip(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    trip_id: Uuid,
    task_ids: &[Uuid],
) -> Result<bool, sqlx::Error> {
    if task_ids.is_empty() {
        return Ok(true);
    }

    let existing_count = sqlx::query_scalar::<_, i64>(
        "select count(distinct id)
         from trip_tasks
         where trip_id = $1 and id = any($2) and deleted_at is null",
    )
    .bind(trip_id)
    .bind(task_ids)
    .fetch_one(&mut **tx)
    .await?;

    Ok(existing_count == unique_uuid_count(task_ids))
}

pub async fn task_trip_plan_ids_for_trip(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    trip_id: Uuid,
    task_ids: &[Uuid],
) -> Result<Vec<Option<Uuid>>, sqlx::Error> {
    if task_ids.is_empty() {
        return Ok(Vec::new());
    }

    sqlx::query_scalar(
        "select distinct trip_plan_id
         from trip_tasks
         where trip_id = $1 and id = any($2) and deleted_at is null",
    )
    .bind(trip_id)
    .bind(task_ids)
    .fetch_all(&mut **tx)
    .await
}

fn unique_uuid_count(ids: &[Uuid]) -> i64 {
    unique_uuids(ids).len() as i64
}
