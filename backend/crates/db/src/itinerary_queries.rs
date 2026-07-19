use uuid::Uuid;

use crate::PgPool;
use crate::models::{ItineraryItemRecord, NewItineraryItem};
use sagittarius_domain::uuid_values::unique_uuids;

pub async fn list_itinerary_items(
    pool: &PgPool,
    trip_id: Uuid,
) -> Result<Vec<ItineraryItemRecord>, sqlx::Error> {
    sqlx::query_as::<_, ItineraryItemRecord>(
        "select
           id, trip_id, trip_plan_id, path_group_id, path_id, path_name, path_role,
           parent_item_id, item_kind, time_mode, is_plan_block, status, priority,
           day, sort_order,
           coalesce(to_char(start_time, 'HH24:MI'), '') as start_time,
           to_char(end_time, 'HH24:MI') as end_time,
           end_offset_days,
           activity, activity_type, activity_subtype, place, map_link, address,
           latitude::float8 as latitude, longitude::float8 as longitude,
           duration_minutes, transportation, details, note, created_by,
           updated_at::text as updated_at, version
         from itinerary_items
         where trip_id = $1 and deleted_at is null
         order by day, sort_order, created_at",
    )
    .bind(trip_id)
    .fetch_all(pool)
    .await
}

pub async fn lock_itinerary_item(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    item_id: Uuid,
) -> Result<Option<ItineraryItemRecord>, sqlx::Error> {
    sqlx::query_as::<_, ItineraryItemRecord>(
        "select
           id, trip_id, trip_plan_id, path_group_id, path_id, path_name, path_role,
           parent_item_id, item_kind, time_mode, is_plan_block, status, priority,
           day, sort_order,
           coalesce(to_char(start_time, 'HH24:MI'), '') as start_time,
           to_char(end_time, 'HH24:MI') as end_time,
           end_offset_days,
           activity, activity_type, activity_subtype, place, map_link, address,
           latitude::float8 as latitude, longitude::float8 as longitude,
           duration_minutes, transportation, details, note, created_by,
           updated_at::text as updated_at, version
         from itinerary_items
         where id = $1 and deleted_at is null
         for update",
    )
    .bind(item_id)
    .fetch_optional(&mut **tx)
    .await
}

pub async fn update_itinerary_item(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    item_id: Uuid,
    patch: &sagittarius_domain::patches::ItineraryItemPatch,
    next_version: i64,
) -> Result<Option<ItineraryItemRecord>, sqlx::Error> {
    sqlx::query_as::<_, ItineraryItemRecord>(
        "update itinerary_items
         set path_group_id = coalesce($2, path_group_id),
             path_id = coalesce($3, path_id),
             path_name = coalesce($4, path_name),
             path_role = coalesce($5, path_role),
             parent_item_id = case when $6 then $7 else parent_item_id end,
             item_kind = coalesce($8, item_kind),
             time_mode = coalesce($9, time_mode),
             is_plan_block = coalesce($10, is_plan_block),
             status = coalesce($11, status),
             priority = coalesce($12, priority),
             day = coalesce($13, day),
             start_time = case when $14 then $15::time else start_time end,
             end_time = case when $16 then $17::time else end_time end,
             end_offset_days = coalesce($18, end_offset_days),
             duration_minutes = case when $19 then $20 else duration_minutes end,
             activity = coalesce($21, activity),
             activity_type = coalesce($22, activity_type),
             activity_subtype = case when $23 then $24 else activity_subtype end,
             place = coalesce($25, place),
             map_link = coalesce($26, map_link),
             address = case when $27 then $28 else address end,
             latitude = case when $29 then $30 else latitude end,
             longitude = case when $31 then $32 else longitude end,
             transportation = coalesce($33, transportation),
             details = coalesce($34, details),
             note = coalesce($35, note),
             version = $36,
             updated_at = now()
         where id = $1 and deleted_at is null
         returning
           id, trip_id, trip_plan_id, path_group_id, path_id, path_name, path_role,
           parent_item_id, item_kind, time_mode, is_plan_block, status, priority,
           day, sort_order,
           coalesce(to_char(start_time, 'HH24:MI'), '') as start_time,
           to_char(end_time, 'HH24:MI') as end_time,
           end_offset_days,
           activity, activity_type, activity_subtype, place, map_link, address,
           latitude::float8 as latitude, longitude::float8 as longitude,
           duration_minutes, transportation, details, note, created_by,
           updated_at::text as updated_at, version",
    )
    .bind(item_id)
    .bind(patch.path_group_id.as_deref())
    .bind(patch.path_id.as_deref())
    .bind(patch.path_name.as_deref())
    .bind(patch.path_role.as_deref())
    .bind(patch.parent_item_id.is_some())
    .bind(patch.parent_item_id.unwrap_or(None))
    .bind(patch.item_kind.as_deref())
    .bind(patch.time_mode.as_deref())
    .bind(patch.is_plan_block)
    .bind(patch.status.as_deref())
    .bind(patch.priority.as_deref())
    .bind(patch.day)
    .bind(patch.start_time.is_some())
    .bind(patch.start_time.as_ref().and_then(|value| value.as_deref()))
    .bind(patch.end_time.is_some())
    .bind(patch.end_time.as_ref().and_then(|value| value.as_deref()))
    .bind(patch.end_offset_days)
    .bind(patch.duration_minutes.is_some())
    .bind(patch.duration_minutes.flatten())
    .bind(patch.activity.as_deref())
    .bind(patch.activity_type.as_deref())
    .bind(patch.activity_subtype.is_some())
    .bind(
        patch
            .activity_subtype
            .as_ref()
            .and_then(|value| value.as_deref()),
    )
    .bind(patch.place.as_deref())
    .bind(patch.map_link.as_deref())
    .bind(patch.address.is_some())
    .bind(patch.address.as_ref().and_then(|value| value.as_deref()))
    .bind(patch.latitude.is_some())
    .bind(patch.latitude.flatten())
    .bind(patch.longitude.is_some())
    .bind(patch.longitude.flatten())
    .bind(patch.transportation.as_deref())
    .bind(patch.details.as_ref())
    .bind(patch.note.as_deref())
    .bind(next_version)
    .fetch_optional(&mut **tx)
    .await
}

pub async fn update_itinerary_child_path_fields(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    trip_id: Uuid,
    parent_item_id: Uuid,
    path_group_id: Option<&str>,
    path_id: Option<&str>,
    path_name: Option<&str>,
    path_role: Option<&str>,
) -> Result<Vec<ItineraryItemRecord>, sqlx::Error> {
    sqlx::query_as::<_, ItineraryItemRecord>(
        "update itinerary_items
         set path_group_id = $3,
             path_id = $4,
             path_name = $5,
             path_role = $6,
             version = version + 1,
             updated_at = now()
         where trip_id = $1
           and parent_item_id = $2
           and deleted_at is null
         returning
           id, trip_id, trip_plan_id, path_group_id, path_id, path_name, path_role,
           parent_item_id, item_kind, time_mode, is_plan_block, status, priority,
           day, sort_order,
           coalesce(to_char(start_time, 'HH24:MI'), '') as start_time,
           to_char(end_time, 'HH24:MI') as end_time,
           end_offset_days,
           activity, activity_type, activity_subtype, place, map_link, address,
           latitude::float8 as latitude, longitude::float8 as longitude,
           duration_minutes, transportation, details, note, created_by,
           updated_at::text as updated_at, version",
    )
    .bind(trip_id)
    .bind(parent_item_id)
    .bind(path_group_id)
    .bind(path_id)
    .bind(path_name)
    .bind(path_role)
    .fetch_all(&mut **tx)
    .await
}

pub async fn next_itinerary_sort_order(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    trip_id: Uuid,
    plan_variant_id: Uuid,
    day: time::Date,
) -> Result<i32, sqlx::Error> {
    let max_sort_order: Option<i32> = sqlx::query_scalar(
        "select max(sort_order)
         from itinerary_items
         where trip_id = $1
           and trip_plan_id = $2
           and day = $3
           and deleted_at is null",
    )
    .bind(trip_id)
    .bind(plan_variant_id)
    .bind(day)
    .fetch_one(&mut **tx)
    .await?;

    Ok(max_sort_order.unwrap_or(0) + 100)
}

pub async fn next_itinerary_child_sort_order(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    trip_id: Uuid,
    parent_item_id: Uuid,
) -> Result<i32, sqlx::Error> {
    let parent_sort_order: i32 = sqlx::query_scalar(
        "select sort_order
         from itinerary_items
         where trip_id = $1
           and id = $2
           and deleted_at is null",
    )
    .bind(trip_id)
    .bind(parent_item_id)
    .fetch_one(&mut **tx)
    .await?;

    let max_child_sort_order: Option<i32> = sqlx::query_scalar(
        "select max(sort_order)
         from itinerary_items
         where trip_id = $1
           and parent_item_id = $2
           and deleted_at is null",
    )
    .bind(trip_id)
    .bind(parent_item_id)
    .fetch_one(&mut **tx)
    .await?;

    Ok(max_child_sort_order.unwrap_or(parent_sort_order) + 10)
}

pub async fn insert_itinerary_item(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    item: NewItineraryItem<'_>,
) -> Result<ItineraryItemRecord, sqlx::Error> {
    sqlx::query_as::<_, ItineraryItemRecord>(
        "insert into itinerary_items (
           id, trip_id, trip_plan_id, path_group_id, path_id, path_name, path_role,
           parent_item_id, item_kind, time_mode, is_plan_block, status, priority,
           day, sort_order, start_time, end_time, end_offset_days, activity, activity_type,
           activity_subtype, place, map_link, address, latitude, longitude, duration_minutes, transportation,
           details, note, created_by, version
         )
         values (
           $1, $2, $3, $4, $5, $6, $7,
           $8, $9, $10, $11, $12, $13,
           $14, $15, $16::time, $17::time, $18, $19, $20,
           $21, $22, $23, $24, $25, $26, $27, $28,
           $29, $30, $31, 1
         )
         returning
           id, trip_id, trip_plan_id, path_group_id, path_id, path_name, path_role,
           parent_item_id, item_kind, time_mode, is_plan_block, status, priority,
           day, sort_order,
           coalesce(to_char(start_time, 'HH24:MI'), '') as start_time,
           to_char(end_time, 'HH24:MI') as end_time,
           end_offset_days,
           activity, activity_type, activity_subtype, place, map_link, address,
           latitude::float8 as latitude, longitude::float8 as longitude,
           duration_minutes, transportation, details, note, created_by,
           updated_at::text as updated_at, version",
    )
    .bind(item.id)
    .bind(item.trip_id)
    .bind(item.trip_plan_id)
    .bind(item.path_group_id)
    .bind(item.path_id)
    .bind(item.path_name)
    .bind(item.path_role)
    .bind(item.parent_item_id)
    .bind(item.item_kind)
    .bind(item.time_mode)
    .bind(item.is_plan_block)
    .bind(item.status)
    .bind(item.priority)
    .bind(item.day)
    .bind(item.sort_order)
    .bind(item.start_time)
    .bind(item.end_time)
    .bind(item.end_offset_days)
    .bind(item.activity)
    .bind(item.activity_type)
    .bind(item.activity_subtype)
    .bind(item.place)
    .bind(item.map_link)
    .bind(item.address)
    .bind(item.latitude)
    .bind(item.longitude)
    .bind(item.duration_minutes)
    .bind(item.transportation)
    .bind(item.details)
    .bind(item.note)
    .bind(item.created_by)
    .fetch_one(&mut **tx)
    .await
}

pub async fn delete_itinerary_item(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    item_id: Uuid,
    next_version: i64,
) -> Result<Option<ItineraryItemRecord>, sqlx::Error> {
    sqlx::query_as::<_, ItineraryItemRecord>(
        "update itinerary_items
         set deleted_at = now(), version = $2, updated_at = now()
         where id = $1 and deleted_at is null
         returning
           id, trip_id, trip_plan_id, path_group_id, path_id, path_name, path_role,
           parent_item_id, item_kind, time_mode, is_plan_block, status, priority,
           day, sort_order,
           coalesce(to_char(start_time, 'HH24:MI'), '') as start_time,
           to_char(end_time, 'HH24:MI') as end_time,
           end_offset_days,
           activity, activity_type, activity_subtype, place, map_link, address,
           latitude::float8 as latitude, longitude::float8 as longitude,
           duration_minutes, transportation, details, note, created_by,
           updated_at::text as updated_at, version",
    )
    .bind(item_id)
    .bind(next_version)
    .fetch_optional(&mut **tx)
    .await
}

pub async fn reorder_itinerary_items(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    trip_id: Uuid,
    plan_variant_id: Uuid,
    day: time::Date,
    item_ids: &[Uuid],
) -> Result<Vec<ItineraryItemRecord>, sqlx::Error> {
    let mut rows = Vec::with_capacity(item_ids.len());
    for (index, item_id) in item_ids.iter().enumerate() {
        let sort_order = ((index + 1) * 100) as i32;
        let row = sqlx::query_as::<_, ItineraryItemRecord>(
            "update itinerary_items
             set sort_order = $5, version = version + 1, updated_at = now()
             where id = $1
               and trip_id = $2
               and trip_plan_id = $3
               and day = $4
               and deleted_at is null
             returning
               id, trip_id, trip_plan_id, path_group_id, path_id, path_name, path_role,
               parent_item_id, item_kind, time_mode, is_plan_block, status, priority,
               day, sort_order,
               coalesce(to_char(start_time, 'HH24:MI'), '') as start_time,
               to_char(end_time, 'HH24:MI') as end_time,
               end_offset_days,
               activity, activity_type, activity_subtype, place, map_link, address,
               latitude::float8 as latitude, longitude::float8 as longitude,
               duration_minutes, transportation, details, note, created_by,
               updated_at::text as updated_at, version",
        )
        .bind(item_id)
        .bind(trip_id)
        .bind(plan_variant_id)
        .bind(day)
        .bind(sort_order)
        .fetch_optional(&mut **tx)
        .await?;

        if let Some(row) = row {
            rows.push(row);
        }
    }

    Ok(rows)
}

pub async fn itinerary_item_reorder_scope(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    trip_id: Uuid,
    plan_variant_id: Uuid,
    day: time::Date,
) -> Result<Vec<(Uuid, Option<Uuid>)>, sqlx::Error> {
    sqlx::query_as(
        "select id, parent_item_id
         from itinerary_items
         where trip_id = $1
           and trip_plan_id = $2
           and day = $3
           and deleted_at is null",
    )
    .bind(trip_id)
    .bind(plan_variant_id)
    .bind(day)
    .fetch_all(&mut **tx)
    .await
}

pub async fn itinerary_item_exists_for_trip(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    trip_id: Uuid,
    item_id: Uuid,
) -> Result<bool, sqlx::Error> {
    sqlx::query_scalar(
        "select exists (
           select 1
           from itinerary_items
           where trip_id = $1 and id = $2 and deleted_at is null
         )",
    )
    .bind(trip_id)
    .bind(item_id)
    .fetch_one(&mut **tx)
    .await
}

pub async fn itinerary_item_plan_variant_id_for_trip(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    trip_id: Uuid,
    item_id: Uuid,
) -> Result<Option<Uuid>, sqlx::Error> {
    sqlx::query_scalar(
        "select trip_plan_id
         from itinerary_items
         where trip_id = $1 and id = $2 and deleted_at is null",
    )
    .bind(trip_id)
    .bind(item_id)
    .fetch_optional(&mut **tx)
    .await
}

pub async fn itinerary_item_path_fields_for_trip(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    trip_id: Uuid,
    item_id: Uuid,
) -> Result<
    Option<(
        Option<String>,
        Option<String>,
        Option<String>,
        Option<String>,
    )>,
    sqlx::Error,
> {
    sqlx::query_as(
        "select path_group_id, path_id, path_name, path_role
         from itinerary_items
         where trip_id = $1 and id = $2 and deleted_at is null",
    )
    .bind(trip_id)
    .bind(item_id)
    .fetch_optional(&mut **tx)
    .await
}

pub async fn itinerary_item_parent_for_trip(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    trip_id: Uuid,
    item_id: Uuid,
) -> Result<Option<(Uuid, time::Date, Option<Uuid>, bool)>, sqlx::Error> {
    sqlx::query_as(
        "select trip_plan_id, day, parent_item_id, is_plan_block
         from itinerary_items
         where trip_id = $1 and id = $2 and deleted_at is null",
    )
    .bind(trip_id)
    .bind(item_id)
    .fetch_optional(&mut **tx)
    .await
}

pub async fn itinerary_item_has_children(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    trip_id: Uuid,
    item_id: Uuid,
) -> Result<bool, sqlx::Error> {
    let child_count: i64 = sqlx::query_scalar(
        "select count(*)
         from itinerary_items
         where trip_id = $1
           and parent_item_id = $2
           and deleted_at is null",
    )
    .bind(trip_id)
    .bind(item_id)
    .fetch_one(&mut **tx)
    .await?;

    Ok(child_count > 0)
}

pub async fn itinerary_item_ids_exist_for_trip(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    trip_id: Uuid,
    item_ids: &[Uuid],
) -> Result<bool, sqlx::Error> {
    if item_ids.is_empty() {
        return Ok(true);
    }

    let existing_count = sqlx::query_scalar::<_, i64>(
        "select count(distinct id)
         from itinerary_items
         where trip_id = $1 and id = any($2) and deleted_at is null",
    )
    .bind(trip_id)
    .bind(item_ids)
    .fetch_one(&mut **tx)
    .await?;

    Ok(existing_count == unique_uuid_count(item_ids))
}

fn unique_uuid_count(ids: &[Uuid]) -> i64 {
    unique_uuids(ids).len() as i64
}
