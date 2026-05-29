use time::OffsetDateTime;
use uuid::Uuid;

use crate::db::PgPool;
use crate::db::models::{TripAuthRecord, TripMemberAuthRecord};

pub async fn find_trip_by_join_id(
    pool: &PgPool,
    join_id: &str,
) -> Result<Option<TripAuthRecord>, sqlx::Error> {
    sqlx::query_as::<_, TripAuthRecord>(
        "select
           id, name, destination_label, start_date, end_date, join_id, join_password_hash,
           active_plan_variant_id, owner_member_id
         from trips
         where join_id = $1 and deleted_at is null",
    )
    .bind(join_id)
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
