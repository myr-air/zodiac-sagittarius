use time::OffsetDateTime;
use uuid::Uuid;

use crate::PgPool;
use crate::models::{
    AuthenticatedMemberSessionRecord, MemberSessionPolicyRecord, NewTripMember,
    TripMemberAuthRecord, TripMemberRecord,
};
use sagittarius_domain::uuid_values::unique_uuids;

pub async fn list_claimable_members(
    pool: &PgPool,
    trip_id: Uuid,
) -> Result<Vec<TripMemberAuthRecord>, sqlx::Error> {
    sqlx::query_as::<_, TripMemberAuthRecord>(
        "select
           id, trip_id, display_name, role, access_status, claim_password_hash, claimed_at, color
         from trip_members
         where trip_id = $1 and access_status = 'active'
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

pub async fn find_member_session_policy(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    trip_id: Uuid,
    member_id: Uuid,
) -> Result<Option<MemberSessionPolicyRecord>, sqlx::Error> {
    sqlx::query_as::<_, MemberSessionPolicyRecord>(
        "select m.role, t.start_date, t.end_date
         from trip_members m
         join trips t on t.id = m.trip_id
         where m.trip_id = $1
           and m.id = $2
           and m.access_status = 'active'
           and t.deleted_at is null",
    )
    .bind(trip_id)
    .bind(member_id)
    .fetch_optional(&mut **tx)
    .await
}

pub async fn extend_member_session_expiry(
    pool: &PgPool,
    trip_id: Uuid,
    member_id: Uuid,
    token_hash: &str,
    expires_at: OffsetDateTime,
) -> Result<u64, sqlx::Error> {
    let result = sqlx::query(
        "update trip_member_sessions
         set expires_at = greatest(expires_at, $4)
         where trip_id = $1
           and member_id = $2
           and session_token_hash = $3
           and revoked_at is null
           and expires_at > now()",
    )
    .bind(trip_id)
    .bind(member_id)
    .bind(token_hash)
    .bind(expires_at)
    .execute(pool)
    .await?;

    Ok(result.rows_affected())
}

pub async fn insert_trip_join_session(
    pool: &PgPool,
    join_session_id: Uuid,
    trip_id: Uuid,
    token_hash: &str,
    expires_at: OffsetDateTime,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        "insert into trip_join_sessions (id, trip_id, join_session_token_hash, expires_at)
         values ($1, $2, $3, $4)",
    )
    .bind(join_session_id)
    .bind(trip_id)
    .bind(token_hash)
    .bind(expires_at)
    .execute(pool)
    .await?;

    Ok(())
}

pub async fn revoke_active_trip_join_invite_tokens(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    trip_id: Uuid,
) -> Result<u64, sqlx::Error> {
    let result = sqlx::query(
        "update trip_join_invite_tokens
         set revoked_at = now()
         where trip_id = $1
           and revoked_at is null
           and expires_at > now()",
    )
    .bind(trip_id)
    .execute(&mut **tx)
    .await?;

    Ok(result.rows_affected())
}

pub async fn insert_trip_join_invite_token(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    invite_token_id: Uuid,
    trip_id: Uuid,
    token_hash: &str,
    created_by: Uuid,
    expires_at: OffsetDateTime,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        "insert into trip_join_invite_tokens (id, trip_id, token_hash, created_by, expires_at)
         values ($1, $2, $3, $4, $5)",
    )
    .bind(invite_token_id)
    .bind(trip_id)
    .bind(token_hash)
    .bind(created_by)
    .bind(expires_at)
    .execute(&mut **tx)
    .await?;

    Ok(())
}

pub async fn find_active_trip_join_invite_token(
    pool: &PgPool,
    token_hash: &str,
) -> Result<Option<Uuid>, sqlx::Error> {
    sqlx::query_scalar::<_, Uuid>(
        "select trip_id
         from trip_join_invite_tokens
         where token_hash = $1
           and revoked_at is null
           and expires_at > now()",
    )
    .bind(token_hash)
    .fetch_optional(pool)
    .await
}

pub async fn find_active_trip_join_session(
    pool: &PgPool,
    trip_id: Uuid,
    token_hash: &str,
) -> Result<Option<Uuid>, sqlx::Error> {
    sqlx::query_scalar::<_, Uuid>(
        "select trip_id
         from trip_join_sessions
         where trip_id = $1
           and join_session_token_hash = $2
           and consumed_at is null
           and expires_at > now()",
    )
    .bind(trip_id)
    .bind(token_hash)
    .fetch_optional(pool)
    .await
}

pub async fn consume_trip_join_session(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    trip_id: Uuid,
    token_hash: &str,
) -> Result<u64, sqlx::Error> {
    let result = sqlx::query(
        "update trip_join_sessions
         set consumed_at = now()
         where trip_id = $1
           and join_session_token_hash = $2
           and consumed_at is null
           and expires_at > now()",
    )
    .bind(trip_id)
    .bind(token_hash)
    .execute(&mut **tx)
    .await?;

    Ok(result.rows_affected())
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
         join trips t on t.id = s.trip_id
         where s.trip_id = $1
           and s.session_token_hash = $2
           and s.revoked_at is null
           and s.expires_at > now()
           and m.access_status = 'active'
           and t.deleted_at is null",
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
         join trips t on t.id = s.trip_id
         where s.trip_id = $1
           and s.session_token_hash = $2
           and s.revoked_at is null
           and s.expires_at > now()
           and m.access_status = 'active'
           and t.deleted_at is null",
    )
    .bind(trip_id)
    .bind(token_hash)
    .fetch_optional(&mut **tx)
    .await
}

pub async fn find_unexpired_member_session_in_tx(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    trip_id: Uuid,
    token_hash: &str,
) -> Result<Option<AuthenticatedMemberSessionRecord>, sqlx::Error> {
    sqlx::query_as::<_, AuthenticatedMemberSessionRecord>(
        "select s.trip_id, s.member_id, m.role
         from trip_member_sessions s
         join trip_members m on m.id = s.member_id and m.trip_id = s.trip_id
         join trips t on t.id = s.trip_id
         where s.trip_id = $1
           and s.session_token_hash = $2
           and s.revoked_at is null
           and s.expires_at > now()
           and t.deleted_at is null",
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

pub async fn insert_trip_member(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    member: NewTripMember<'_>,
) -> Result<TripMemberRecord, sqlx::Error> {
    sqlx::query_as::<_, TripMemberRecord>(
        "insert into trip_members (
           id, trip_id, display_name, role, color, claim_password_hash, claimed_at
         )
         values ($1, $2, $3, $4, $5, $6, case when $6::text is null then null else now() end)
         returning
           id, trip_id, display_name, role, access_status, presence, color, user_id,
           claimed_at::text as claimed_at, last_seen_at::text as last_seen_at",
    )
    .bind(member.id)
    .bind(member.trip_id)
    .bind(member.display_name)
    .bind(member.role.as_str())
    .bind(member.color)
    .bind(member.claim_password_hash)
    .fetch_one(&mut **tx)
    .await
}

pub async fn update_trip_member(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    trip_id: Uuid,
    member_id: Uuid,
    patch: &sagittarius_domain::patches::PatchMemberRequest,
    claim_password_hash: Option<&str>,
) -> Result<Option<TripMemberRecord>, sqlx::Error> {
    sqlx::query_as::<_, TripMemberRecord>(
        "update trip_members
         set display_name = coalesce($3, display_name),
             role = coalesce($4, role),
             access_status = coalesce($5, access_status),
             claim_password_hash = coalesce($6, claim_password_hash),
             claimed_at = case when $6::text is null then claimed_at else now() end,
             updated_at = now()
         where trip_id = $1 and id = $2
         returning
           id, trip_id, display_name, role, access_status, presence, color, user_id,
           claimed_at::text as claimed_at, last_seen_at::text as last_seen_at",
    )
    .bind(trip_id)
    .bind(member_id)
    .bind(patch.display_name.as_deref())
    .bind(patch.role.map(|role| role.as_str()))
    .bind(patch.access_status.map(|status| status.as_str()))
    .bind(claim_password_hash)
    .fetch_optional(&mut **tx)
    .await
}

pub async fn update_member_presence(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    trip_id: Uuid,
    member_id: Uuid,
    presence: &str,
) -> Result<Option<TripMemberRecord>, sqlx::Error> {
    sqlx::query_as::<_, TripMemberRecord>(
        "update trip_members
         set presence = $3, last_seen_at = now(), updated_at = now()
         where trip_id = $1 and id = $2
         returning
           id, trip_id, display_name, role, access_status, presence, color, user_id,
           claimed_at::text as claimed_at, last_seen_at::text as last_seen_at",
    )
    .bind(trip_id)
    .bind(member_id)
    .bind(presence)
    .fetch_optional(&mut **tx)
    .await
}

pub async fn reset_member_claim(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    trip_id: Uuid,
    member_id: Uuid,
) -> Result<Option<TripMemberRecord>, sqlx::Error> {
    sqlx::query_as::<_, TripMemberRecord>(
        "update trip_members
         set claim_password_hash = null, claimed_at = null, updated_at = now()
         where trip_id = $1 and id = $2 and role <> 'owner'
         returning
           id, trip_id, display_name, role, access_status, presence, color, user_id,
           claimed_at::text as claimed_at, last_seen_at::text as last_seen_at",
    )
    .bind(trip_id)
    .bind(member_id)
    .fetch_optional(&mut **tx)
    .await
}

pub async fn revoke_member_sessions_for_member(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    trip_id: Uuid,
    member_id: Uuid,
) -> Result<u64, sqlx::Error> {
    let result = sqlx::query(
        "update trip_member_sessions
         set revoked_at = now()
         where trip_id = $1 and member_id = $2 and revoked_at is null",
    )
    .bind(trip_id)
    .bind(member_id)
    .execute(&mut **tx)
    .await?;

    Ok(result.rows_affected())
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

pub async fn trip_member_ids_exist(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    trip_id: Uuid,
    member_ids: &[Uuid],
) -> Result<bool, sqlx::Error> {
    if member_ids.is_empty() {
        return Ok(true);
    }

    let existing_count = sqlx::query_scalar::<_, i64>(
        "select count(distinct id)
         from trip_members
         where trip_id = $1 and id = any($2) and access_status = 'active'",
    )
    .bind(trip_id)
    .bind(member_ids)
    .fetch_one(&mut **tx)
    .await?;

    Ok(existing_count == unique_uuid_count(member_ids))
}

fn unique_uuid_count(ids: &[Uuid]) -> i64 {
    unique_uuids(ids).len() as i64
}
