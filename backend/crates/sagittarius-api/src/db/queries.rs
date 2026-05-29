use time::OffsetDateTime;
use uuid::Uuid;

use crate::db::PgPool;
use crate::db::models::{
    AuthenticatedMemberSessionRecord, ExpenseSplitRecord, ItineraryItemRecord, NewRealtimeEvent,
    NewSuggestion, NewTripTask, PlanVariantRecord, RealtimeEventRecord, SuggestionRecord,
    TripAuthRecord, TripMemberAuthRecord, TripMemberRecord, TripTaskRecord,
};

pub async fn find_trip_by_join_id(
    pool: &PgPool,
    join_id: &str,
) -> Result<Option<TripAuthRecord>, sqlx::Error> {
    sqlx::query_as::<_, TripAuthRecord>(
        "select
           id, name, destination_label, start_date, end_date, join_id, join_password_hash,
           active_plan_variant_id, owner_member_id, version
         from trips
         where join_id = $1 and deleted_at is null",
    )
    .bind(join_id)
    .fetch_optional(pool)
    .await
}

pub async fn find_trip_by_id(
    pool: &PgPool,
    trip_id: Uuid,
) -> Result<Option<TripAuthRecord>, sqlx::Error> {
    sqlx::query_as::<_, TripAuthRecord>(
        "select
           id, name, destination_label, start_date, end_date, join_id, join_password_hash,
           active_plan_variant_id, owner_member_id, version
         from trips
         where id = $1 and deleted_at is null",
    )
    .bind(trip_id)
    .fetch_optional(pool)
    .await
}

pub async fn list_claimable_members(
    pool: &PgPool,
    trip_id: Uuid,
) -> Result<Vec<TripMemberAuthRecord>, sqlx::Error> {
    sqlx::query_as::<_, TripMemberAuthRecord>(
        "select
           id, trip_id, display_name, role, access_status, claim_password_hash, claimed_at, color
         from trip_members
         where trip_id = $1 and access_status = 'active' and claim_password_hash is null
         order by created_at, display_name",
    )
    .bind(trip_id)
    .fetch_all(pool)
    .await
}

pub async fn lock_member(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    trip_id: Uuid,
    member_id: Uuid,
) -> Result<Option<TripMemberAuthRecord>, sqlx::Error> {
    sqlx::query_as::<_, TripMemberAuthRecord>(
        "select
           id, trip_id, display_name, role, access_status, claim_password_hash, claimed_at, color
         from trip_members
         where trip_id = $1 and id = $2
         for update",
    )
    .bind(trip_id)
    .bind(member_id)
    .fetch_optional(&mut **tx)
    .await
}

pub async fn set_member_claim_password(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    trip_id: Uuid,
    member_id: Uuid,
    password_hash: &str,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        "update trip_members
         set claim_password_hash = $1, claimed_at = coalesce(claimed_at, now()), updated_at = now()
         where trip_id = $2 and id = $3",
    )
    .bind(password_hash)
    .bind(trip_id)
    .bind(member_id)
    .execute(&mut **tx)
    .await?;

    Ok(())
}

pub async fn insert_member_session(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    session_id: Uuid,
    trip_id: Uuid,
    member_id: Uuid,
    token_hash: &str,
    created_at: OffsetDateTime,
    expires_at: OffsetDateTime,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        "insert into trip_member_sessions (
           id, trip_id, member_id, session_token_hash, created_at, expires_at
         )
         values ($1, $2, $3, $4, $5, $6)",
    )
    .bind(session_id)
    .bind(trip_id)
    .bind(member_id)
    .bind(token_hash)
    .bind(created_at)
    .bind(expires_at)
    .execute(&mut **tx)
    .await?;

    Ok(())
}

pub async fn revoke_member_session(
    pool: &PgPool,
    trip_id: Uuid,
    token_hash: &str,
) -> Result<u64, sqlx::Error> {
    let result = sqlx::query(
        "update trip_member_sessions
         set revoked_at = now()
         where trip_id = $1 and session_token_hash = $2 and revoked_at is null",
    )
    .bind(trip_id)
    .bind(token_hash)
    .execute(pool)
    .await?;

    Ok(result.rows_affected())
}

pub async fn find_active_member_session(
    pool: &PgPool,
    trip_id: Uuid,
    token_hash: &str,
) -> Result<Option<AuthenticatedMemberSessionRecord>, sqlx::Error> {
    sqlx::query_as::<_, AuthenticatedMemberSessionRecord>(
        "select s.trip_id, s.member_id, m.role
         from trip_member_sessions s
         join trip_members m on m.id = s.member_id and m.trip_id = s.trip_id
         where s.trip_id = $1
           and s.session_token_hash = $2
           and s.revoked_at is null
           and s.expires_at > now()
           and m.access_status = 'active'",
    )
    .bind(trip_id)
    .bind(token_hash)
    .fetch_optional(pool)
    .await
}

pub async fn find_active_member_session_in_tx(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    trip_id: Uuid,
    token_hash: &str,
) -> Result<Option<AuthenticatedMemberSessionRecord>, sqlx::Error> {
    sqlx::query_as::<_, AuthenticatedMemberSessionRecord>(
        "select s.trip_id, s.member_id, m.role
         from trip_member_sessions s
         join trip_members m on m.id = s.member_id and m.trip_id = s.trip_id
         where s.trip_id = $1
           and s.session_token_hash = $2
           and s.revoked_at is null
           and s.expires_at > now()
           and m.access_status = 'active'",
    )
    .bind(trip_id)
    .bind(token_hash)
    .fetch_optional(&mut **tx)
    .await
}

pub async fn list_trip_members(
    pool: &PgPool,
    trip_id: Uuid,
) -> Result<Vec<TripMemberRecord>, sqlx::Error> {
    sqlx::query_as::<_, TripMemberRecord>(
        "select
           id, trip_id, display_name, role, access_status, presence, color, user_id,
           claimed_at::text as claimed_at, last_seen_at::text as last_seen_at
         from trip_members
         where trip_id = $1
         order by created_at, display_name",
    )
    .bind(trip_id)
    .fetch_all(pool)
    .await
}

pub async fn list_plan_variants(
    pool: &PgPool,
    trip_id: Uuid,
) -> Result<Vec<PlanVariantRecord>, sqlx::Error> {
    sqlx::query_as::<_, PlanVariantRecord>(
        "select id, trip_id, name, kind, description, version
         from plan_variants
         where trip_id = $1
         order by created_at, name",
    )
    .bind(trip_id)
    .fetch_all(pool)
    .await
}

pub async fn plan_variant_exists_for_trip(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    trip_id: Uuid,
    plan_variant_id: Uuid,
) -> Result<bool, sqlx::Error> {
    sqlx::query_scalar(
        "select exists (
           select 1
           from plan_variants
           where trip_id = $1 and id = $2
         )",
    )
    .bind(trip_id)
    .bind(plan_variant_id)
    .fetch_one(&mut **tx)
    .await
}

pub async fn list_itinerary_items(
    pool: &PgPool,
    trip_id: Uuid,
) -> Result<Vec<ItineraryItemRecord>, sqlx::Error> {
    sqlx::query_as::<_, ItineraryItemRecord>(
        "select
           id, trip_id, plan_variant_id, day, sort_order,
           to_char(start_time, 'HH24:MI') as start_time,
           activity, activity_type, place, link_label, map_link, address,
           latitude::float8 as latitude, longitude::float8 as longitude,
           duration_minutes, transportation, advisories, note, created_by,
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
           id, trip_id, plan_variant_id, day, sort_order,
           to_char(start_time, 'HH24:MI') as start_time,
           activity, activity_type, place, link_label, map_link, address,
           latitude::float8 as latitude, longitude::float8 as longitude,
           duration_minutes, transportation, advisories, note, created_by,
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
    patch: &crate::domain::patches::ItineraryItemPatch,
    next_version: i64,
) -> Result<Option<ItineraryItemRecord>, sqlx::Error> {
    sqlx::query_as::<_, ItineraryItemRecord>(
        "update itinerary_items
         set start_time = coalesce($2::time, start_time),
             duration_minutes = coalesce($3, duration_minutes),
             activity = coalesce($4, activity),
             activity_type = coalesce($5, activity_type),
             place = coalesce($6, place),
             map_link = coalesce($7, map_link),
             transportation = coalesce($8, transportation),
             note = coalesce($9, note),
             version = $10,
             updated_at = now()
         where id = $1 and deleted_at is null
         returning
           id, trip_id, plan_variant_id, day, sort_order,
           to_char(start_time, 'HH24:MI') as start_time,
           activity, activity_type, place, link_label, map_link, address,
           latitude::float8 as latitude, longitude::float8 as longitude,
           duration_minutes, transportation, advisories, note, created_by,
           updated_at::text as updated_at, version",
    )
    .bind(item_id)
    .bind(patch.start_time.as_deref())
    .bind(patch.duration_minutes)
    .bind(patch.activity.as_deref())
    .bind(patch.activity_type.as_deref())
    .bind(patch.place.as_deref())
    .bind(patch.map_link.as_deref())
    .bind(patch.transportation.as_deref())
    .bind(patch.note.as_deref())
    .bind(next_version)
    .fetch_optional(&mut **tx)
    .await
}

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

pub async fn list_suggestions(
    pool: &PgPool,
    trip_id: Uuid,
) -> Result<Vec<SuggestionRecord>, sqlx::Error> {
    sqlx::query_as::<_, SuggestionRecord>(
        "select
           id, trip_id, plan_variant_id, proposer_id, type, target_item_id, proposed_patch,
           source_version, status, created_at::text as created_at
         from suggestions
         where trip_id = $1
         order by created_at desc",
    )
    .bind(trip_id)
    .fetch_all(pool)
    .await
}

pub async fn insert_suggestion(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    suggestion: NewSuggestion<'_>,
) -> Result<SuggestionRecord, sqlx::Error> {
    sqlx::query_as::<_, SuggestionRecord>(
        "insert into suggestions (
           id, trip_id, plan_variant_id, proposer_id, type, target_item_id, proposed_patch,
           source_version, status
         )
         values ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
         returning
           id, trip_id, plan_variant_id, proposer_id, type, target_item_id, proposed_patch,
           source_version, status, created_at::text as created_at",
    )
    .bind(suggestion.id)
    .bind(suggestion.trip_id)
    .bind(suggestion.plan_variant_id)
    .bind(suggestion.proposer_id)
    .bind(suggestion.r#type)
    .bind(suggestion.target_item_id)
    .bind(suggestion.proposed_patch)
    .bind(suggestion.source_version)
    .fetch_one(&mut **tx)
    .await
}

pub async fn lock_suggestion(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    suggestion_id: Uuid,
) -> Result<Option<SuggestionRecord>, sqlx::Error> {
    sqlx::query_as::<_, SuggestionRecord>(
        "select
           id, trip_id, plan_variant_id, proposer_id, type, target_item_id, proposed_patch,
           source_version, status, created_at::text as created_at
         from suggestions
         where id = $1
         for update",
    )
    .bind(suggestion_id)
    .fetch_optional(&mut **tx)
    .await
}

pub async fn update_suggestion_status(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    suggestion_id: Uuid,
    status: &str,
    resolved_by: Uuid,
) -> Result<Option<SuggestionRecord>, sqlx::Error> {
    sqlx::query_as::<_, SuggestionRecord>(
        "update suggestions
         set status = $2, resolved_at = now(), resolved_by = $3
         where id = $1
         returning
           id, trip_id, plan_variant_id, proposer_id, type, target_item_id, proposed_patch,
           source_version, status, created_at::text as created_at",
    )
    .bind(suggestion_id)
    .bind(status)
    .bind(resolved_by)
    .fetch_optional(&mut **tx)
    .await
}

pub async fn list_visible_tasks(
    pool: &PgPool,
    trip_id: Uuid,
    member_id: Uuid,
) -> Result<Vec<TripTaskRecord>, sqlx::Error> {
    sqlx::query_as::<_, TripTaskRecord>(
        "select
           id, trip_id, title, status, visibility, kind, created_by, assignee_id,
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
           id, trip_id, title, status, visibility, kind, created_by, assignee_id, related_item_id,
           version
         )
         values ($1, $2, $3, 'open', $4, $5, $6, $7, $8, 1)
         returning
           id, trip_id, title, status, visibility, kind, created_by, assignee_id,
           related_item_id, version",
    )
    .bind(task.id)
    .bind(task.trip_id)
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
           id, trip_id, title, status, visibility, kind, created_by, assignee_id,
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
    patch: &crate::domain::patches::TaskPatch,
    next_version: i64,
) -> Result<Option<TripTaskRecord>, sqlx::Error> {
    sqlx::query_as::<_, TripTaskRecord>(
        "update trip_tasks
         set title = coalesce($2, title),
             status = coalesce($3, status),
             assignee_id = case when $4 then $5 else assignee_id end,
             related_item_id = case when $6 then $7 else related_item_id end,
             version = $8,
             updated_at = now()
         where id = $1 and deleted_at is null
         returning
           id, trip_id, title, status, visibility, kind, created_by, assignee_id,
           related_item_id, version",
    )
    .bind(task_id)
    .bind(patch.title.as_deref())
    .bind(patch.status.as_deref())
    .bind(patch.assignee_id.is_some())
    .bind(patch.assignee_id.unwrap_or(None))
    .bind(patch.related_item_id.is_some())
    .bind(patch.related_item_id.unwrap_or(None))
    .bind(next_version)
    .fetch_optional(&mut **tx)
    .await
}

pub async fn trip_member_exists(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    trip_id: Uuid,
    member_id: Uuid,
) -> Result<bool, sqlx::Error> {
    sqlx::query_scalar(
        "select exists (
           select 1
           from trip_members
           where trip_id = $1 and id = $2 and access_status = 'active'
         )",
    )
    .bind(trip_id)
    .bind(member_id)
    .fetch_one(&mut **tx)
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

pub async fn list_expense_splits(
    pool: &PgPool,
    trip_id: Uuid,
) -> Result<Vec<ExpenseSplitRecord>, sqlx::Error> {
    sqlx::query_as::<_, ExpenseSplitRecord>(
        "select paid_by, amount_minor, splits
         from expenses
         where trip_id = $1 and deleted_at is null
         order by created_at",
    )
    .bind(trip_id)
    .fetch_all(pool)
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
