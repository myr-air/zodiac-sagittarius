use time::OffsetDateTime;
use uuid::Uuid;

use crate::db::PgPool;
use crate::db::models::{
    AuthenticatedMemberSessionRecord, ExpenseSplitRecord, ItineraryItemRecord, PlanVariantRecord,
    SuggestionRecord, TripAuthRecord, TripMemberAuthRecord, TripMemberRecord, TripTaskRecord,
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
