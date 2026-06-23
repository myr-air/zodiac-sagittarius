use time::{Date, OffsetDateTime};
use uuid::Uuid;

use crate::db::PgPool;
use crate::db::models::{
    AuthAttemptLockRecord, AuthenticatedMemberSessionRecord, ExpenseRecord, ExpenseReminderRecord,
    ExpenseSplitRecord, ItineraryItemRecord, MemberSessionPolicyRecord, NewExpense,
    NewExpenseReminder, NewItineraryItem, NewPlanCheck, NewPlanSuggestion, NewPlanVariant,
    NewRealtimeEvent, NewStopNote, NewSuggestion, NewTripMember, NewTripTask,
    PlaceGeocodeCacheRecord, PlanCheckRecord, PlanSuggestionRecord, PlanVariantRecord,
    RealtimeEventRecord, StopNoteRecord, SuggestionRecord, TripAuthRecord, TripDailyBriefingRecord,
    TripMemberAuthRecord, TripMemberRecord, TripTaskRecord,
};
use crate::domain::uuid_values::unique_uuids;

pub async fn lock_auth_attempt(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    scope: &str,
    attempt_key: &str,
) -> Result<AuthAttemptLockRecord, sqlx::Error> {
    sqlx::query_as::<_, AuthAttemptLockRecord>(
        "insert into auth_attempt_locks (scope, attempt_key)
         values ($1, $2)
         on conflict (scope, attempt_key) do update
         set updated_at = auth_attempt_locks.updated_at
         returning attempt_count, locked_until",
    )
    .bind(scope)
    .bind(attempt_key)
    .fetch_one(&mut **tx)
    .await
}

pub async fn record_auth_failed_attempt(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    scope: &str,
    attempt_key: &str,
    max_attempts: i32,
    locked_until: OffsetDateTime,
) -> Result<AuthAttemptLockRecord, sqlx::Error> {
    sqlx::query_as::<_, AuthAttemptLockRecord>(
        "update auth_attempt_locks
         set attempt_count = attempt_count + 1,
             locked_until = case
               when attempt_count + 1 >= $3 then greatest(coalesce(locked_until, $4), $4)
               else locked_until
             end,
             updated_at = now()
         where scope = $1 and attempt_key = $2
         returning attempt_count, locked_until",
    )
    .bind(scope)
    .bind(attempt_key)
    .bind(max_attempts)
    .bind(locked_until)
    .fetch_one(&mut **tx)
    .await
}

pub async fn clear_auth_attempt(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    scope: &str,
    attempt_key: &str,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        "delete from auth_attempt_locks
         where scope = $1 and attempt_key = $2",
    )
    .bind(scope)
    .bind(attempt_key)
    .execute(&mut **tx)
    .await?;

    Ok(())
}

pub async fn find_trip_by_join_id(
    pool: &PgPool,
    join_id: &str,
) -> Result<Option<TripAuthRecord>, sqlx::Error> {
    sqlx::query_as::<_, TripAuthRecord>(
        "select
           id, name, origin_label, origin_city, origin_country, origin_country_code,
           destination_label, destination_cities, countries, party_size, default_timezone,
           start_date, end_date, join_id, join_password_hash,
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
           id, name, origin_label, origin_city, origin_country, origin_country_code,
           destination_label, destination_cities, countries, party_size, default_timezone,
           start_date, end_date, join_id, join_password_hash,
           active_plan_variant_id, owner_member_id, version
         from trips
         where id = $1 and deleted_at is null",
    )
    .bind(trip_id)
    .fetch_optional(pool)
    .await
}

pub async fn lock_trip(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    trip_id: Uuid,
) -> Result<Option<TripAuthRecord>, sqlx::Error> {
    sqlx::query_as::<_, TripAuthRecord>(
        "select
           id, name, origin_label, origin_city, origin_country, origin_country_code,
           destination_label, destination_cities, countries, party_size, default_timezone,
           start_date, end_date, join_id, join_password_hash,
           active_plan_variant_id, owner_member_id, version
         from trips
         where id = $1 and deleted_at is null
         for update",
    )
    .bind(trip_id)
    .fetch_optional(&mut **tx)
    .await
}

pub async fn update_trip_metadata(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    trip_id: Uuid,
    patch: &crate::domain::patches::PatchTripRequest,
    version: i64,
) -> Result<Option<TripAuthRecord>, sqlx::Error> {
    sqlx::query_as::<_, TripAuthRecord>(
        "update trips
         set name = coalesce($2, name),
             destination_label = coalesce($3, destination_label),
             countries = coalesce($4, countries),
             start_date = coalesce($5, start_date),
             end_date = coalesce($6, end_date),
             active_plan_variant_id = coalesce($7, active_plan_variant_id),
             party_size = coalesce($8, party_size),
             default_timezone = coalesce($9, default_timezone),
             version = $10,
             updated_at = now()
         where id = $1 and deleted_at is null
         returning
           id, name, origin_label, origin_city, origin_country, origin_country_code,
           destination_label, destination_cities, countries, party_size, default_timezone,
           start_date, end_date, join_id, join_password_hash,
           active_plan_variant_id, owner_member_id, version",
    )
    .bind(trip_id)
    .bind(patch.name.as_deref())
    .bind(patch.destination_label.as_deref())
    .bind(patch.countries.as_ref())
    .bind(patch.start_date)
    .bind(patch.end_date)
    .bind(patch.active_plan_variant_id)
    .bind(patch.party_size)
    .bind(patch.default_timezone.as_deref())
    .bind(version)
    .fetch_optional(&mut **tx)
    .await
}

pub async fn update_trip_active_plan_variant(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    trip_id: Uuid,
    active_plan_variant_id: Uuid,
    version: i64,
) -> Result<Option<TripAuthRecord>, sqlx::Error> {
    sqlx::query_as::<_, TripAuthRecord>(
        "update trips
         set active_plan_variant_id = $2,
             version = $3,
             updated_at = now()
         where id = $1 and deleted_at is null
         returning
           id, name, origin_label, origin_city, origin_country, origin_country_code,
           destination_label, destination_cities, countries, party_size, default_timezone,
           start_date, end_date, join_id, join_password_hash,
           active_plan_variant_id, owner_member_id, version",
    )
    .bind(trip_id)
    .bind(active_plan_variant_id)
    .bind(version)
    .fetch_optional(&mut **tx)
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
    .bind(member.role)
    .bind(member.color)
    .bind(member.claim_password_hash)
    .fetch_one(&mut **tx)
    .await
}

pub async fn update_trip_member(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    trip_id: Uuid,
    member_id: Uuid,
    patch: &crate::domain::patches::PatchMemberRequest,
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
    .bind(patch.role)
    .bind(patch.access_status)
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

pub async fn list_plan_variants(
    pool: &PgPool,
    trip_id: Uuid,
) -> Result<Vec<PlanVariantRecord>, sqlx::Error> {
    sqlx::query_as::<_, PlanVariantRecord>(
        "select id, trip_id, name, kind,
           coalesce(status, case
             when kind = 'split' then 'proposal'
             when kind in ('main', 'draft', 'backup') then kind
             else 'draft'
           end) as status,
           description, version
         from plan_variants
         where trip_id = $1
         order by created_at, name",
    )
    .bind(trip_id)
    .fetch_all(pool)
    .await
}

pub async fn lock_plan_variant(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    plan_variant_id: Uuid,
) -> Result<Option<PlanVariantRecord>, sqlx::Error> {
    sqlx::query_as::<_, PlanVariantRecord>(
        "select id, trip_id, name, kind,
           coalesce(status, case
             when kind = 'split' then 'proposal'
             when kind in ('main', 'draft', 'backup') then kind
             else 'draft'
           end) as status,
           description, version
         from plan_variants
         where id = $1
         for update",
    )
    .bind(plan_variant_id)
    .fetch_optional(&mut **tx)
    .await
}

pub async fn insert_plan_variant(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    plan_variant: NewPlanVariant<'_>,
) -> Result<PlanVariantRecord, sqlx::Error> {
    sqlx::query_as::<_, PlanVariantRecord>(
        "insert into plan_variants (id, trip_id, name, kind, status, description)
         values ($1, $2, $3, $4, $5, $6)
         returning id, trip_id, name, kind,
           coalesce(status, case
             when kind = 'split' then 'proposal'
             when kind in ('main', 'draft', 'backup') then kind
             else 'draft'
           end) as status,
           description, version",
    )
    .bind(plan_variant.id)
    .bind(plan_variant.trip_id)
    .bind(plan_variant.name)
    .bind(plan_variant.kind)
    .bind(plan_variant.status)
    .bind(plan_variant.description)
    .fetch_one(&mut **tx)
    .await
}

pub async fn update_plan_variant(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    plan_variant_id: Uuid,
    patch: &crate::domain::patches::PlanVariantPatch,
    version: i64,
) -> Result<Option<PlanVariantRecord>, sqlx::Error> {
    sqlx::query_as::<_, PlanVariantRecord>(
        "update plan_variants
         set name = coalesce($2, name),
             kind = coalesce($3, kind),
             status = coalesce($4, status),
             description = coalesce($5, description),
             version = $6,
             updated_at = now()
         where id = $1
         returning id, trip_id, name, kind,
           coalesce(status, case
             when kind = 'split' then 'proposal'
             when kind in ('main', 'draft', 'backup') then kind
             else 'draft'
           end) as status,
           description, version",
    )
    .bind(plan_variant_id)
    .bind(patch.name.as_deref().map(str::trim))
    .bind(patch.effective_kind())
    .bind(patch.effective_status())
    .bind(patch.description.as_deref().map(str::trim))
    .bind(version)
    .fetch_optional(&mut **tx)
    .await
}

pub async fn update_plan_variant_status(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    plan_variant_id: Uuid,
    kind: &str,
    status: &str,
    version: i64,
) -> Result<Option<PlanVariantRecord>, sqlx::Error> {
    sqlx::query_as::<_, PlanVariantRecord>(
        "update plan_variants
         set kind = $2,
             status = $3,
             version = $4,
             updated_at = now()
         where id = $1
         returning id, trip_id, name, kind,
           coalesce(status, case
             when kind = 'split' then 'proposal'
             when kind in ('main', 'draft', 'backup') then kind
             else 'draft'
           end) as status,
           description, version",
    )
    .bind(plan_variant_id)
    .bind(kind)
    .bind(status)
    .bind(version)
    .fetch_optional(&mut **tx)
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

pub async fn active_plan_variant_id_for_trip(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    trip_id: Uuid,
) -> Result<Option<Uuid>, sqlx::Error> {
    sqlx::query_scalar(
        "select active_plan_variant_id
         from trips
         where id = $1 and deleted_at is null",
    )
    .bind(trip_id)
    .fetch_optional(&mut **tx)
    .await
}

pub async fn list_itinerary_items(
    pool: &PgPool,
    trip_id: Uuid,
) -> Result<Vec<ItineraryItemRecord>, sqlx::Error> {
    sqlx::query_as::<_, ItineraryItemRecord>(
        "select
           id, trip_id, plan_variant_id, path_group_id, path_id, path_name, path_role,
           parent_item_id, item_kind, time_mode, is_plan_block, status, priority,
           day, sort_order,
           coalesce(to_char(start_time, 'HH24:MI'), '') as start_time,
           to_char(end_time, 'HH24:MI') as end_time,
           end_offset_days,
           activity, activity_type, activity_subtype, place, link_label, map_link, address,
           latitude::float8 as latitude, longitude::float8 as longitude,
           duration_minutes, transportation, details, advisories, note, created_by,
           updated_at::text as updated_at, version
         from itinerary_items
         where trip_id = $1 and deleted_at is null
         order by day, sort_order, created_at",
    )
    .bind(trip_id)
    .fetch_all(pool)
    .await
}

pub async fn list_trip_daily_briefings(
    pool: &PgPool,
    trip_id: Uuid,
) -> Result<Vec<TripDailyBriefingRecord>, sqlx::Error> {
    sqlx::query_as::<_, TripDailyBriefingRecord>(
        "select distinct on (briefing_date)
           trip_id, briefing_date, location_key, location_label, coordinates,
           weather, holiday, festival, facts, outfit_advice, manual_overrides,
           updated_at, version
         from trip_daily_briefings
         where trip_id = $1
         order by briefing_date, updated_at desc, location_key",
    )
    .bind(trip_id)
    .fetch_all(pool)
    .await
}

pub async fn find_place_geocode_cache(
    pool: &PgPool,
    normalized_query: &str,
) -> Result<Option<PlaceGeocodeCacheRecord>, sqlx::Error> {
    sqlx::query_as::<_, PlaceGeocodeCacheRecord>(
        "select
           normalized_query, query, country_codes, display_name, source,
           latitude::float8 as latitude, longitude::float8 as longitude
         from place_geocode_cache
         where normalized_query = $1",
    )
    .bind(normalized_query)
    .fetch_optional(pool)
    .await
}

pub async fn upsert_place_geocode_cache(
    pool: &PgPool,
    normalized_query: &str,
    query: &str,
    country_codes: &[String],
    display_name: &str,
    source: &str,
    latitude: f64,
    longitude: f64,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        "insert into place_geocode_cache (
           normalized_query, query, country_codes, display_name, source, latitude, longitude
         )
         values ($1, $2, $3, $4, $5, $6, $7)
         on conflict (normalized_query)
         do update set
           query = excluded.query,
           country_codes = excluded.country_codes,
           display_name = excluded.display_name,
           source = excluded.source,
           latitude = excluded.latitude,
           longitude = excluded.longitude,
           updated_at = now()",
    )
    .bind(normalized_query)
    .bind(query)
    .bind(country_codes)
    .bind(display_name)
    .bind(source)
    .bind(latitude)
    .bind(longitude)
    .execute(pool)
    .await?;

    Ok(())
}

pub async fn upsert_trip_daily_briefing_shell(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    trip_id: Uuid,
    briefing_date: Date,
    location_key: &str,
    location_label: &str,
    coordinates: Option<&serde_json::Value>,
) -> Result<TripDailyBriefingRecord, sqlx::Error> {
    sqlx::query_as::<_, TripDailyBriefingRecord>(
        "insert into trip_daily_briefings (
           trip_id, briefing_date, location_key, location_label, coordinates
         )
         values ($1, $2, $3, $4, $5)
         on conflict (trip_id, briefing_date, location_key)
         do update set
           location_label = excluded.location_label,
           coordinates = coalesce(excluded.coordinates, trip_daily_briefings.coordinates)
         returning
           trip_id, briefing_date, location_key, location_label, coordinates,
           weather, holiday, festival, facts, outfit_advice, manual_overrides,
           updated_at, version",
    )
    .bind(trip_id)
    .bind(briefing_date)
    .bind(location_key)
    .bind(location_label)
    .bind(coordinates)
    .fetch_one(&mut **tx)
    .await
}

pub async fn patch_trip_daily_briefing_overrides(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    trip_id: Uuid,
    briefing_date: Date,
    expected_version: i64,
    manual_overrides: &serde_json::Value,
) -> Result<Option<TripDailyBriefingRecord>, sqlx::Error> {
    sqlx::query_as::<_, TripDailyBriefingRecord>(
        "update trip_daily_briefings
         set manual_overrides = $4,
             version = version + 1,
             updated_at = now()
         where id = (
           select id
           from trip_daily_briefings
           where trip_id = $1 and briefing_date = $2
           order by updated_at desc, location_key
           limit 1
         )
           and version = $3
         returning
           trip_id, briefing_date, location_key, location_label, coordinates,
           weather, holiday, festival, facts, outfit_advice, manual_overrides,
           updated_at, version",
    )
    .bind(trip_id)
    .bind(briefing_date)
    .bind(expected_version)
    .bind(manual_overrides)
    .fetch_optional(&mut **tx)
    .await
}

pub async fn update_trip_daily_briefing_weather(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    trip_id: Uuid,
    briefing_date: Date,
    location_key: &str,
    weather: &serde_json::Value,
    outfit_advice: &serde_json::Value,
) -> Result<Option<TripDailyBriefingRecord>, sqlx::Error> {
    sqlx::query_as::<_, TripDailyBriefingRecord>(
        "update trip_daily_briefings
         set weather = $4,
             outfit_advice = $5,
             updated_at = now()
         where trip_id = $1
           and briefing_date = $2
           and location_key = $3
         returning
           trip_id, briefing_date, location_key, location_label, coordinates,
           weather, holiday, festival, facts, outfit_advice, manual_overrides,
           updated_at, version",
    )
    .bind(trip_id)
    .bind(briefing_date)
    .bind(location_key)
    .bind(weather)
    .bind(outfit_advice)
    .fetch_optional(&mut **tx)
    .await
}

pub async fn lock_itinerary_item(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    item_id: Uuid,
) -> Result<Option<ItineraryItemRecord>, sqlx::Error> {
    sqlx::query_as::<_, ItineraryItemRecord>(
        "select
           id, trip_id, plan_variant_id, path_group_id, path_id, path_name, path_role,
           parent_item_id, item_kind, time_mode, is_plan_block, status, priority,
           day, sort_order,
           coalesce(to_char(start_time, 'HH24:MI'), '') as start_time,
           to_char(end_time, 'HH24:MI') as end_time,
           end_offset_days,
           activity, activity_type, activity_subtype, place, link_label, map_link, address,
           latitude::float8 as latitude, longitude::float8 as longitude,
           duration_minutes, transportation, details, advisories, note, created_by,
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
           id, trip_id, plan_variant_id, path_group_id, path_id, path_name, path_role,
           parent_item_id, item_kind, time_mode, is_plan_block, status, priority,
           day, sort_order,
           coalesce(to_char(start_time, 'HH24:MI'), '') as start_time,
           to_char(end_time, 'HH24:MI') as end_time,
           end_offset_days,
           activity, activity_type, activity_subtype, place, link_label, map_link, address,
           latitude::float8 as latitude, longitude::float8 as longitude,
           duration_minutes, transportation, details, advisories, note, created_by,
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
           id, trip_id, plan_variant_id, path_group_id, path_id, path_name, path_role,
           parent_item_id, item_kind, time_mode, is_plan_block, status, priority,
           day, sort_order,
           coalesce(to_char(start_time, 'HH24:MI'), '') as start_time,
           to_char(end_time, 'HH24:MI') as end_time,
           end_offset_days,
           activity, activity_type, activity_subtype, place, link_label, map_link, address,
           latitude::float8 as latitude, longitude::float8 as longitude,
           duration_minutes, transportation, details, advisories, note, created_by,
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
           and plan_variant_id = $2
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
           id, trip_id, plan_variant_id, path_group_id, path_id, path_name, path_role,
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
           id, trip_id, plan_variant_id, path_group_id, path_id, path_name, path_role,
           parent_item_id, item_kind, time_mode, is_plan_block, status, priority,
           day, sort_order,
           coalesce(to_char(start_time, 'HH24:MI'), '') as start_time,
           to_char(end_time, 'HH24:MI') as end_time,
           end_offset_days,
           activity, activity_type, activity_subtype, place, link_label, map_link, address,
           latitude::float8 as latitude, longitude::float8 as longitude,
           duration_minutes, transportation, details, advisories, note, created_by,
           updated_at::text as updated_at, version",
    )
    .bind(item.id)
    .bind(item.trip_id)
    .bind(item.plan_variant_id)
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
           id, trip_id, plan_variant_id, path_group_id, path_id, path_name, path_role,
           parent_item_id, item_kind, time_mode, is_plan_block, status, priority,
           day, sort_order,
           coalesce(to_char(start_time, 'HH24:MI'), '') as start_time,
           to_char(end_time, 'HH24:MI') as end_time,
           end_offset_days,
           activity, activity_type, activity_subtype, place, link_label, map_link, address,
           latitude::float8 as latitude, longitude::float8 as longitude,
           duration_minutes, transportation, details, advisories, note, created_by,
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
               and plan_variant_id = $3
               and day = $4
               and deleted_at is null
             returning
               id, trip_id, plan_variant_id, path_group_id, path_id, path_name, path_role,
               parent_item_id, item_kind, time_mode, is_plan_block, status, priority,
               day, sort_order,
               coalesce(to_char(start_time, 'HH24:MI'), '') as start_time,
               to_char(end_time, 'HH24:MI') as end_time,
               end_offset_days,
               activity, activity_type, activity_subtype, place, link_label, map_link, address,
               latitude::float8 as latitude, longitude::float8 as longitude,
               duration_minutes, transportation, details, advisories, note, created_by,
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
           and plan_variant_id = $2
           and day = $3
           and deleted_at is null",
    )
    .bind(trip_id)
    .bind(plan_variant_id)
    .bind(day)
    .fetch_all(&mut **tx)
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

pub async fn find_latest_plan_check(
    pool: &PgPool,
    trip_id: Uuid,
    trip_plan_id: Option<Uuid>,
) -> Result<Option<PlanCheckRecord>, sqlx::Error> {
    sqlx::query_as::<_, PlanCheckRecord>(
        "select
           id, trip_id, trip_plan_id, created_by, itinerary_fingerprint, language_metadata,
           status, created_at::text as created_at, completed_at::text as completed_at, version
         from plan_checks
         where trip_id = $1
           and ($2::uuid is null or trip_plan_id = $2)
         order by created_at desc
         limit 1",
    )
    .bind(trip_id)
    .bind(trip_plan_id)
    .fetch_optional(pool)
    .await
}

pub async fn list_plan_suggestions(
    pool: &PgPool,
    plan_check_id: Uuid,
) -> Result<Vec<PlanSuggestionRecord>, sqlx::Error> {
    sqlx::query_as::<_, PlanSuggestionRecord>(
        "select
           id, trip_id, plan_check_id, severity, scope, target_item_ids,
           explanation_i18n, recommended_action_i18n, action_kind, action_payload,
           status, snoozed_until::text as snoozed_until,
           created_at::text as created_at, updated_at::text as updated_at, version
         from plan_suggestions
         where plan_check_id = $1
         order by
           case severity when 'critical' then 0 when 'warning' then 1 else 2 end,
           created_at,
           id",
    )
    .bind(plan_check_id)
    .fetch_all(pool)
    .await
}

pub async fn insert_plan_check(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    check: NewPlanCheck<'_>,
) -> Result<PlanCheckRecord, sqlx::Error> {
    sqlx::query_as::<_, PlanCheckRecord>(
        "insert into plan_checks (
           id, trip_id, trip_plan_id, created_by, itinerary_fingerprint, language_metadata,
           status, completed_at
         )
         values ($1, $2, $3, $4, $5, $6, 'complete', now())
         returning
           id, trip_id, trip_plan_id, created_by, itinerary_fingerprint, language_metadata,
           status, created_at::text as created_at, completed_at::text as completed_at, version",
    )
    .bind(check.id)
    .bind(check.trip_id)
    .bind(check.trip_plan_id)
    .bind(check.created_by)
    .bind(check.itinerary_fingerprint)
    .bind(check.language_metadata)
    .fetch_one(&mut **tx)
    .await
}

pub async fn insert_plan_suggestion(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    suggestion: NewPlanSuggestion<'_>,
) -> Result<PlanSuggestionRecord, sqlx::Error> {
    sqlx::query_as::<_, PlanSuggestionRecord>(
        "insert into plan_suggestions (
           id, trip_id, plan_check_id, severity, scope, target_item_ids,
           explanation_i18n, recommended_action_i18n, action_kind, action_payload
         )
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         returning
           id, trip_id, plan_check_id, severity, scope, target_item_ids,
           explanation_i18n, recommended_action_i18n, action_kind, action_payload,
           status, snoozed_until::text as snoozed_until,
           created_at::text as created_at, updated_at::text as updated_at, version",
    )
    .bind(suggestion.id)
    .bind(suggestion.trip_id)
    .bind(suggestion.plan_check_id)
    .bind(suggestion.severity)
    .bind(suggestion.scope)
    .bind(suggestion.target_item_ids)
    .bind(suggestion.explanation_i18n)
    .bind(suggestion.recommended_action_i18n)
    .bind(suggestion.action_kind)
    .bind(suggestion.action_payload)
    .fetch_one(&mut **tx)
    .await
}

pub async fn lock_plan_suggestion(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    suggestion_id: Uuid,
) -> Result<Option<PlanSuggestionRecord>, sqlx::Error> {
    sqlx::query_as::<_, PlanSuggestionRecord>(
        "select
           id, trip_id, plan_check_id, severity, scope, target_item_ids,
           explanation_i18n, recommended_action_i18n, action_kind, action_payload,
           status, snoozed_until::text as snoozed_until,
           created_at::text as created_at, updated_at::text as updated_at, version
         from plan_suggestions
         where id = $1
         for update",
    )
    .bind(suggestion_id)
    .fetch_optional(&mut **tx)
    .await
}

pub async fn update_plan_suggestion_status(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    suggestion_id: Uuid,
    status: &str,
    snoozed_until: Option<&str>,
    next_version: i64,
) -> Result<Option<PlanSuggestionRecord>, sqlx::Error> {
    sqlx::query_as::<_, PlanSuggestionRecord>(
        "update plan_suggestions
         set status = $2,
             snoozed_until = $3::timestamptz,
             version = $4,
             updated_at = now()
         where id = $1
         returning
           id, trip_id, plan_check_id, severity, scope, target_item_ids,
           explanation_i18n, recommended_action_i18n, action_kind, action_payload,
           status, snoozed_until::text as snoozed_until,
           created_at::text as created_at, updated_at::text as updated_at, version",
    )
    .bind(suggestion_id)
    .bind(status)
    .bind(snoozed_until)
    .bind(next_version)
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
    patch: &crate::domain::patches::TaskPatch,
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

pub async fn itinerary_item_plan_variant_id_for_trip(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    trip_id: Uuid,
    item_id: Uuid,
) -> Result<Option<Uuid>, sqlx::Error> {
    sqlx::query_scalar(
        "select plan_variant_id
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
        "select plan_variant_id, day, parent_item_id, is_plan_block
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

pub async fn list_expense_splits(
    pool: &PgPool,
    trip_id: Uuid,
    trip_plan_id: Option<Uuid>,
) -> Result<Vec<ExpenseSplitRecord>, sqlx::Error> {
    sqlx::query_as::<_, ExpenseSplitRecord>(
        "select paid_by, amount_minor, currency, exchange_rate_to_settlement_currency, category, splits
         from expenses
         where trip_id = $1
           and ($2::uuid is null or trip_plan_id = $2)
           and deleted_at is null
         order by created_at",
    )
    .bind(trip_id)
    .bind(trip_plan_id)
    .fetch_all(pool)
    .await
}

pub async fn list_expense_reminders(
    pool: &PgPool,
    trip_id: Uuid,
    trip_plan_id: Option<Uuid>,
) -> Result<Vec<ExpenseReminderRecord>, sqlx::Error> {
    sqlx::query_as::<_, ExpenseReminderRecord>(
        "select
           id, trip_id, trip_plan_id, from_member_id, to_member_id, amount_minor,
           to_char(last_reminded_at at time zone 'UTC', 'YYYY-MM-DD\"T\"HH24:MI:SS\"Z\"') as last_reminded_at,
           version
         from expense_reminders
         where trip_id = $1
           and ($2::uuid is null or trip_plan_id = $2)
         order by updated_at",
    )
    .bind(trip_id)
    .bind(trip_plan_id)
    .fetch_all(pool)
    .await
}

pub async fn upsert_expense_reminder(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    reminder: NewExpenseReminder,
) -> Result<ExpenseReminderRecord, sqlx::Error> {
    sqlx::query_as::<_, ExpenseReminderRecord>(
        "insert into expense_reminders (
           id, trip_id, trip_plan_id, from_member_id, to_member_id, amount_minor, created_by
         )
         values ($1, $2, $3, $4, $5, $6, $7)
         on conflict (trip_id, trip_plan_id, from_member_id, to_member_id, amount_minor)
         do update set
           last_reminded_at = now(),
           updated_at = now(),
           created_by = excluded.created_by,
           version = expense_reminders.version + 1
         returning
           id, trip_id, trip_plan_id, from_member_id, to_member_id, amount_minor,
           to_char(last_reminded_at at time zone 'UTC', 'YYYY-MM-DD\"T\"HH24:MI:SS\"Z\"') as last_reminded_at,
           version",
    )
    .bind(reminder.id)
    .bind(reminder.trip_id)
    .bind(reminder.trip_plan_id)
    .bind(reminder.from_member_id)
    .bind(reminder.to_member_id)
    .bind(reminder.amount_minor)
    .bind(reminder.created_by)
    .fetch_one(&mut **tx)
    .await
}

pub async fn list_expenses(
    pool: &PgPool,
    trip_id: Uuid,
) -> Result<Vec<ExpenseRecord>, sqlx::Error> {
    sqlx::query_as::<_, ExpenseRecord>(
        "select
           id, trip_id, trip_plan_id, title, amount_minor, currency, exchange_rate_to_settlement_currency, notes, receipt_url, line_items, comments, paid_by, category, splits,
           itinerary_item_id, version
         from expenses
         where trip_id = $1 and deleted_at is null
         order by created_at",
    )
    .bind(trip_id)
    .fetch_all(pool)
    .await
}

pub async fn insert_expense(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    expense: NewExpense<'_>,
) -> Result<ExpenseRecord, sqlx::Error> {
    sqlx::query_as::<_, ExpenseRecord>(
        "insert into expenses (
           id, trip_id, trip_plan_id, title, amount_minor, currency, exchange_rate_to_settlement_currency, notes, receipt_url, line_items, comments, paid_by, category, splits,
           itinerary_item_id, version
         )
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 1)
         returning
           id, trip_id, trip_plan_id, title, amount_minor, currency, exchange_rate_to_settlement_currency, notes, receipt_url, line_items, comments, paid_by, category, splits,
           itinerary_item_id, version",
    )
    .bind(expense.id)
    .bind(expense.trip_id)
    .bind(expense.trip_plan_id)
    .bind(expense.title)
    .bind(expense.amount_minor)
    .bind(expense.currency)
    .bind(expense.exchange_rate_to_settlement_currency)
    .bind(expense.notes)
    .bind(expense.receipt_url)
    .bind(expense.line_items)
    .bind(expense.comments)
    .bind(expense.paid_by)
    .bind(expense.category)
    .bind(expense.splits)
    .bind(expense.itinerary_item_id)
    .fetch_one(&mut **tx)
    .await
}

pub async fn lock_expense(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    expense_id: Uuid,
) -> Result<Option<ExpenseRecord>, sqlx::Error> {
    sqlx::query_as::<_, ExpenseRecord>(
        "select
           id, trip_id, trip_plan_id, title, amount_minor, currency, exchange_rate_to_settlement_currency, notes, receipt_url, line_items, comments, paid_by, category, splits,
           itinerary_item_id, version
         from expenses
         where id = $1 and deleted_at is null
         for update",
    )
    .bind(expense_id)
    .fetch_optional(&mut **tx)
    .await
}

pub async fn update_expense(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    expense_id: Uuid,
    patch: &crate::domain::patches::PatchExpenseRequest,
    trip_plan_id: Option<Uuid>,
    next_version: i64,
) -> Result<Option<ExpenseRecord>, sqlx::Error> {
    sqlx::query_as::<_, ExpenseRecord>(
        "update expenses
         set title = coalesce($2, title),
             amount_minor = coalesce($3, amount_minor),
             currency = coalesce($4, currency),
             exchange_rate_to_settlement_currency = coalesce($5, exchange_rate_to_settlement_currency),
             notes = coalesce($6, notes),
             receipt_url = coalesce($7, receipt_url),
             line_items = coalesce($8, line_items),
             comments = coalesce($9, comments),
             paid_by = coalesce($10, paid_by),
             category = coalesce($11, category),
             splits = coalesce($12, splits),
             itinerary_item_id = case when $13 then $14 else itinerary_item_id end,
             trip_plan_id = $15,
             version = $16,
             updated_at = now()
         where id = $1 and deleted_at is null
         returning
           id, trip_id, trip_plan_id, title, amount_minor, currency, exchange_rate_to_settlement_currency, notes, receipt_url, line_items, comments, paid_by, category, splits,
           itinerary_item_id, version",
    )
    .bind(expense_id)
    .bind(patch.title.as_deref())
    .bind(patch.amount_minor)
    .bind(patch.currency.as_deref())
    .bind(patch.exchange_rate_to_settlement_currency)
    .bind(patch.notes.as_deref())
    .bind(patch.receipt_url.as_deref())
    .bind(patch.line_items.as_ref())
    .bind(patch.comments.as_ref())
    .bind(patch.paid_by)
    .bind(patch.category.as_deref())
    .bind(patch.splits.as_ref())
    .bind(patch.itinerary_item_id.is_some())
    .bind(patch.itinerary_item_id.unwrap_or(None))
    .bind(trip_plan_id)
    .bind(next_version)
    .fetch_optional(&mut **tx)
    .await
}

pub async fn delete_expense(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    expense_id: Uuid,
    next_version: i64,
) -> Result<Option<ExpenseRecord>, sqlx::Error> {
    sqlx::query_as::<_, ExpenseRecord>(
        "update expenses
         set deleted_at = now(), version = $2, updated_at = now()
         where id = $1 and deleted_at is null
         returning
           id, trip_id, trip_plan_id, title, amount_minor, currency, exchange_rate_to_settlement_currency, notes, receipt_url, line_items, comments, paid_by, category, splits,
           itinerary_item_id, version",
    )
    .bind(expense_id)
    .bind(next_version)
    .fetch_optional(&mut **tx)
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

pub async fn expense_ids_exist_for_trip(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    trip_id: Uuid,
    expense_ids: &[Uuid],
) -> Result<bool, sqlx::Error> {
    if expense_ids.is_empty() {
        return Ok(true);
    }

    let existing_count = sqlx::query_scalar::<_, i64>(
        "select count(distinct id)
         from expenses
         where trip_id = $1 and id = any($2) and deleted_at is null",
    )
    .bind(trip_id)
    .bind(expense_ids)
    .fetch_one(&mut **tx)
    .await?;

    Ok(existing_count == unique_uuid_count(expense_ids))
}

pub async fn expense_trip_plan_ids_for_trip(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    trip_id: Uuid,
    expense_ids: &[Uuid],
) -> Result<Vec<Option<Uuid>>, sqlx::Error> {
    if expense_ids.is_empty() {
        return Ok(Vec::new());
    }

    sqlx::query_scalar(
        "select distinct trip_plan_id
         from expenses
         where trip_id = $1 and id = any($2) and deleted_at is null",
    )
    .bind(trip_id)
    .bind(expense_ids)
    .fetch_all(&mut **tx)
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
