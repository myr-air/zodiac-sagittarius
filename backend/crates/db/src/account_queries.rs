use sqlx::types::Json;
use time::OffsetDateTime;
use uuid::Uuid;

use crate::PgPool;
use crate::models::{
    AccountProfileRecord, AccountTodoRecord, AccountTripRecord, AccountTripStatsRecord,
    AccountVaultItemRecord, ActiveUserSessionRecord, EmailLoginChallengeRecord,
    NewAccountAuditEvent, NewAccountPlanVariant, NewAccountTrip, NewAccountTripOwnerMember,
    NewAccountVaultItem, NewEmailLoginOutbox, NewTrustedDevice, NewUser, NewUserEmail,
    NewUserSession, PasskeyCredentialRecord, PasskeyRecord, PasswordLoginUserRecord,
    TripAuthRecord, TrustedDeviceRecord, UserEmailRecord,
};
use sagittarius_domain::types::{TripMemberAccessStatus, TripRole};

#[derive(Debug, Clone, sqlx::FromRow)]
pub struct OwnerTransferMemberRecord {
    pub id: Uuid,
    pub user_id: Option<Uuid>,
    pub user_disabled_at: Option<OffsetDateTime>,
    #[sqlx(try_from = "String")]
    pub role: TripRole,
    #[sqlx(try_from = "String")]
    pub access_status: TripMemberAccessStatus,
}

pub async fn insert_email_login_challenge(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    id: Uuid,
    normalized_email: &str,
    code_hash: &str,
    expires_at: OffsetDateTime,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        "insert into email_login_challenges (id, normalized_email, code_hash, expires_at)
         values ($1, $2, $3, $4)",
    )
    .bind(id)
    .bind(normalized_email)
    .bind(code_hash)
    .bind(expires_at)
    .execute(&mut **tx)
    .await?;

    Ok(())
}

pub async fn lock_email_login_challenge(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    challenge_id: Uuid,
) -> Result<Option<EmailLoginChallengeRecord>, sqlx::Error> {
    sqlx::query_as::<_, EmailLoginChallengeRecord>(
        "select id, normalized_email, code_hash, attempt_count, expires_at, locked_at, consumed_at
         from email_login_challenges
         where id = $1
         for update",
    )
    .bind(challenge_id)
    .fetch_optional(&mut **tx)
    .await
}

pub async fn find_email_login_challenge(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    challenge_id: Uuid,
) -> Result<Option<EmailLoginChallengeRecord>, sqlx::Error> {
    sqlx::query_as::<_, EmailLoginChallengeRecord>(
        "select id, normalized_email, code_hash, attempt_count, expires_at, locked_at, consumed_at
         from email_login_challenges
         where id = $1",
    )
    .bind(challenge_id)
    .fetch_optional(&mut **tx)
    .await
}

pub async fn lock_email_login_start_for_email(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    normalized_email: &str,
) -> Result<(), sqlx::Error> {
    sqlx::query("select pg_advisory_xact_lock(hashtextextended($1, 0))")
        .bind(normalized_email)
        .execute(&mut **tx)
        .await?;

    Ok(())
}

pub async fn lock_active_email_login_challenge_for_email(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    normalized_email: &str,
    now: OffsetDateTime,
) -> Result<Option<EmailLoginChallengeRecord>, sqlx::Error> {
    sqlx::query_as::<_, EmailLoginChallengeRecord>(
        "select id, normalized_email, code_hash, attempt_count, expires_at, locked_at, consumed_at
         from email_login_challenges
         where normalized_email = $1
           and consumed_at is null
           and expires_at > $2
         order by created_at desc
         limit 1
         for update",
    )
    .bind(normalized_email)
    .bind(now)
    .fetch_optional(&mut **tx)
    .await
}

pub async fn insert_email_login_outbox(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    message: NewEmailLoginOutbox<'_>,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        "insert into email_login_outbox (id, challenge_id, normalized_email, code, expires_at)
         values ($1, $2, $3, $4, $5)",
    )
    .bind(message.id)
    .bind(message.challenge_id)
    .bind(message.normalized_email)
    .bind(message.code)
    .bind(message.expires_at)
    .execute(&mut **tx)
    .await?;

    Ok(())
}

pub async fn find_email_login_outbox_code_for_challenge(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    challenge_id: Uuid,
) -> Result<String, sqlx::Error> {
    sqlx::query_scalar(
        "select code
         from email_login_outbox
         where challenge_id = $1",
    )
    .bind(challenge_id)
    .fetch_one(&mut **tx)
    .await
}

pub async fn record_email_login_failed_attempt(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    challenge_id: Uuid,
    lock_after_attempts: i32,
    locked_at: OffsetDateTime,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        "update email_login_challenges
         set
           attempt_count = attempt_count + 1,
           locked_at = case
             when attempt_count + 1 >= $2 then coalesce(locked_at, $3)
             else locked_at
           end
         where id = $1",
    )
    .bind(challenge_id)
    .bind(lock_after_attempts)
    .bind(locked_at)
    .execute(&mut **tx)
    .await?;

    Ok(())
}

pub async fn consume_email_login_challenge(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    challenge_id: Uuid,
    consumed_at: OffsetDateTime,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        "update email_login_challenges
         set consumed_at = $2
         where id = $1",
    )
    .bind(challenge_id)
    .bind(consumed_at)
    .execute(&mut **tx)
    .await?;

    Ok(())
}

pub async fn insert_user_email_or_resume(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    user_email: NewUserEmail<'_>,
) -> Result<UserEmailRecord, sqlx::Error> {
    sqlx::query_as::<_, UserEmailRecord>(
        "with upserted as (
           insert into user_emails (id, user_id, email, normalized_email, verified_at)
           values ($1, $2, $3, $4, $5)
           on conflict (normalized_email) do update
           set
             normalized_email = excluded.normalized_email,
             verified_at = coalesce(user_emails.verified_at, excluded.verified_at)
           returning user_id, verified_at
         )
         select upserted.user_id, users.disabled_at, upserted.verified_at
         from upserted
         join users on users.id = upserted.user_id",
    )
    .bind(user_email.id)
    .bind(user_email.user_id)
    .bind(user_email.email)
    .bind(user_email.normalized_email)
    .bind(user_email.verified_at)
    .fetch_one(&mut **tx)
    .await
}

pub async fn insert_user(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    user: NewUser<'_>,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        "insert into users (id, display_name, avatar_color)
         values ($1, $2, $3)",
    )
    .bind(user.id)
    .bind(user.display_name)
    .bind(user.avatar_color)
    .execute(&mut **tx)
    .await?;

    Ok(())
}

pub async fn find_user_email_record(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    normalized_email: &str,
) -> Result<Option<UserEmailRecord>, sqlx::Error> {
    sqlx::query_as::<_, UserEmailRecord>(
        "select ue.user_id, u.disabled_at, ue.verified_at
         from user_emails ue
         join users u on u.id = ue.user_id
         where ue.normalized_email = $1",
    )
    .bind(normalized_email)
    .fetch_optional(&mut **tx)
    .await
}

pub async fn verify_user_email_for_normalized_email_if_unverified(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    normalized_email: &str,
    verified_at: OffsetDateTime,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        "update user_emails
         set verified_at = $2
         where normalized_email = $1 and verified_at is null",
    )
    .bind(normalized_email)
    .bind(verified_at)
    .execute(&mut **tx)
    .await?;

    Ok(())
}

pub async fn list_verified_user_emails_for_user(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    user_id: Uuid,
) -> Result<Vec<String>, sqlx::Error> {
    sqlx::query_scalar(
        "select normalized_email
         from user_emails
         where user_id = $1 and verified_at is not null
         order by created_at asc, id asc",
    )
    .bind(user_id)
    .fetch_all(&mut **tx)
    .await
}

pub async fn find_password_login_user_for_email(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    normalized_email: &str,
) -> Result<Option<PasswordLoginUserRecord>, sqlx::Error> {
    sqlx::query_as::<_, PasswordLoginUserRecord>(
        "select ue.user_id, u.password_hash, u.disabled_at
         from user_emails ue
         join users u on u.id = ue.user_id
         where ue.normalized_email = $1
         for update of u",
    )
    .bind(normalized_email)
    .fetch_optional(&mut **tx)
    .await
}

pub async fn update_user_password_hash(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    user_id: Uuid,
    password_hash: &str,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        "update users
         set password_hash = $2, updated_at = now()
         where id = $1",
    )
    .bind(user_id)
    .bind(password_hash)
    .execute(&mut **tx)
    .await?;

    Ok(())
}

pub async fn delete_user(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    user_id: Uuid,
) -> Result<(), sqlx::Error> {
    sqlx::query("delete from users where id = $1")
        .bind(user_id)
        .execute(&mut **tx)
        .await?;

    Ok(())
}

pub async fn insert_trusted_device(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    device: NewTrustedDevice<'_>,
) -> Result<Uuid, sqlx::Error> {
    let trusted_device_id = sqlx::query_scalar(
        "insert into trusted_devices (id, user_id, label, created_at, last_seen_at)
         values ($1, $2, $3, $4, $5)
         on conflict (user_id, label) where revoked_at is null
         do update set last_seen_at = excluded.last_seen_at
         returning id",
    )
    .bind(device.id)
    .bind(device.user_id)
    .bind(device.label)
    .bind(device.created_at)
    .bind(device.last_seen_at)
    .fetch_one(&mut **tx)
    .await?;

    Ok(trusted_device_id)
}

pub async fn insert_user_session(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    session: NewUserSession<'_>,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        "insert into user_sessions (
           id, user_id, trusted_device_id, session_token_hash, kind, created_at, expires_at
         )
         values ($1, $2, $3, $4, $5, $6, $7)",
    )
    .bind(session.id)
    .bind(session.user_id)
    .bind(session.trusted_device_id)
    .bind(session.session_token_hash)
    .bind(session.kind.as_str())
    .bind(session.created_at)
    .bind(session.expires_at)
    .execute(&mut **tx)
    .await?;

    Ok(())
}

pub async fn find_active_user_session(
    pool: &PgPool,
    session_token_hash: &str,
) -> Result<Option<ActiveUserSessionRecord>, sqlx::Error> {
    sqlx::query_as::<_, ActiveUserSessionRecord>(
        "select s.user_id
         from user_sessions s
         join users u on u.id = s.user_id
         left join trusted_devices td on td.id = s.trusted_device_id
         where s.session_token_hash = $1
           and s.revoked_at is null
           and s.expires_at > now()
           and u.disabled_at is null
           and (s.trusted_device_id is null or td.revoked_at is null)",
    )
    .bind(session_token_hash)
    .fetch_optional(pool)
    .await
}

pub async fn find_active_user_session_in_tx(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    session_token_hash: &str,
) -> Result<Option<ActiveUserSessionRecord>, sqlx::Error> {
    sqlx::query_as::<_, ActiveUserSessionRecord>(
        "select s.user_id
         from user_sessions s
         join users u on u.id = s.user_id
         left join trusted_devices td on td.id = s.trusted_device_id
         where s.session_token_hash = $1
           and s.revoked_at is null
           and s.expires_at > now()
           and u.disabled_at is null
           and (s.trusted_device_id is null or td.revoked_at is null)",
    )
    .bind(session_token_hash)
    .fetch_optional(&mut **tx)
    .await
}

pub async fn lock_active_user(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    user_id: Uuid,
) -> Result<Option<Uuid>, sqlx::Error> {
    sqlx::query_scalar::<_, Uuid>(
        "select id
         from users
         where id = $1
           and disabled_at is null
         for update",
    )
    .bind(user_id)
    .fetch_optional(&mut **tx)
    .await
}

pub async fn get_user_profile(
    pool: &PgPool,
    user_id: Uuid,
) -> Result<Option<AccountProfileRecord>, sqlx::Error> {
    sqlx::query_as::<_, AccountProfileRecord>(
        "select
           u.id,
           u.display_name,
           u.avatar_color,
           u.locale,
           u.timezone,
           u.home_city,
           u.home_country,
           primary_email.email as primary_email
         from users u
         left join lateral (
           select email
           from user_emails
           where user_id = u.id and verified_at is not null
           order by created_at asc, id asc
           limit 1
         ) primary_email on true
         where u.id = $1
           and u.disabled_at is null",
    )
    .bind(user_id)
    .fetch_optional(pool)
    .await
}

pub async fn update_user_profile(
    pool: &PgPool,
    user_id: Uuid,
    display_name: &str,
    avatar_color: &str,
    locale: &str,
    timezone: &str,
    home_city: Option<&str>,
    home_country: Option<&str>,
) -> Result<Option<AccountProfileRecord>, sqlx::Error> {
    sqlx::query_as::<_, AccountProfileRecord>(
        "with updated as (
           update users
           set display_name = $2,
               avatar_color = $3,
               locale = $4,
               timezone = $5,
               home_city = $6,
               home_country = $7,
               updated_at = now()
           where id = $1
             and disabled_at is null
           returning id, display_name, avatar_color, locale, timezone, home_city, home_country
         )
         select
           updated.id,
           updated.display_name,
           updated.avatar_color,
           updated.locale,
           updated.timezone,
           updated.home_city,
           updated.home_country,
           primary_email.email as primary_email
         from updated
         left join lateral (
           select email
           from user_emails
           where user_id = updated.id and verified_at is not null
           order by created_at asc, id asc
           limit 1
         ) primary_email on true",
    )
    .bind(user_id)
    .bind(display_name)
    .bind(avatar_color)
    .bind(locale)
    .bind(timezone)
    .bind(home_city)
    .bind(home_country)
    .fetch_optional(pool)
    .await
}

pub async fn list_trusted_devices(
    pool: &PgPool,
    user_id: Uuid,
) -> Result<Vec<TrustedDeviceRecord>, sqlx::Error> {
    sqlx::query_as::<_, TrustedDeviceRecord>(
        "select id, label, user_agent, created_at, last_seen_at
         from trusted_devices
         where user_id = $1
           and revoked_at is null
         order by coalesce(last_seen_at, created_at) desc, created_at desc, id asc",
    )
    .bind(user_id)
    .fetch_all(pool)
    .await
}

pub async fn revoke_trusted_device_for_user(
    pool: &PgPool,
    user_id: Uuid,
    trusted_device_id: Uuid,
) -> Result<u64, sqlx::Error> {
    let result = sqlx::query(
        "update trusted_devices
         set revoked_at = now()
         where id = $1
           and user_id = $2
           and revoked_at is null",
    )
    .bind(trusted_device_id)
    .bind(user_id)
    .execute(pool)
    .await?;

    Ok(result.rows_affected())
}

pub async fn list_passkeys(
    pool: &PgPool,
    user_id: Uuid,
) -> Result<Vec<PasskeyRecord>, sqlx::Error> {
    sqlx::query_as::<_, PasskeyRecord>(
        "select id, nickname, created_at, last_used_at
         from webauthn_credentials
         where user_id = $1
         order by coalesce(last_used_at, created_at) desc, created_at desc, id asc",
    )
    .bind(user_id)
    .fetch_all(pool)
    .await
}

pub async fn list_account_trips(
    pool: &PgPool,
    user_id: Uuid,
) -> Result<Vec<AccountTripRecord>, sqlx::Error> {
    sqlx::query_as::<_, AccountTripRecord>(
        "select
           trips.id,
           trips.name,
           trips.origin_label,
           trips.origin_city,
           trips.origin_country,
           trips.origin_country_code,
           trips.destination_label,
           trips.destination_cities,
           trips.countries,
           trips.party_size,
           trips.default_timezone,
           trips.start_date,
           trips.end_date,
           trip_members.role,
           trip_members.id as member_id,
           trips.owner_member_id,
           coalesce(trip_members.claimed_at, trip_members.created_at) as joined_at
         from trip_members
         join trips on trips.id = trip_members.trip_id
         where trip_members.user_id = $1
           and trip_members.access_status = 'active'
           and trips.deleted_at is null
         order by coalesce(trip_members.claimed_at, trip_members.created_at) desc,
                  trips.created_at desc,
                  trips.id asc",
    )
    .bind(user_id)
    .fetch_all(pool)
    .await
}

pub async fn get_account_trip_stats(
    pool: &PgPool,
    user_id: Uuid,
) -> Result<AccountTripStatsRecord, sqlx::Error> {
    sqlx::query_as::<_, AccountTripStatsRecord>(
        "select
           count(trip_members.id) filter (
             where trip_members.access_status = 'active'
               and trips.deleted_at is null
           ) as trips_total,
           count(trip_members.id) filter (
             where trip_members.role = 'owner'
               and trip_members.access_status = 'active'
               and trips.deleted_at is null
           ) as trips_owned,
           count(trip_members.id) filter (
             where trip_members.access_status = 'active'
               and trips.deleted_at is null
           ) as active_trips,
           (
             select count(account_audit_events.id)
             from account_audit_events
             where account_audit_events.actor_user_id = $1
               and account_audit_events.event_type = 'member.claimed_account'
           ) as temp_claims_completed
         from trip_members
         join trips on trips.id = trip_members.trip_id
         where trip_members.user_id = $1",
    )
    .bind(user_id)
    .fetch_one(pool)
    .await
}

pub async fn list_account_todos(
    pool: &PgPool,
    user_id: Uuid,
) -> Result<Vec<AccountTodoRecord>, sqlx::Error> {
    sqlx::query_as::<_, AccountTodoRecord>(
        "select
           tasks.id,
           tasks.trip_id,
           trips.name as trip_name,
           tasks.title,
           tasks.status,
           tasks.visibility,
           tasks.kind,
           tasks.assignee_id,
           tasks.related_item_id,
           tasks.version
         from trip_members me
         join trips on trips.id = me.trip_id
         join trip_tasks tasks on tasks.trip_id = me.trip_id
         where me.user_id = $1
           and me.access_status = 'active'
           and trips.deleted_at is null
           and tasks.deleted_at is null
           and (tasks.visibility = 'shared' or tasks.created_by = me.id or tasks.assignee_id = me.id)
         order by
           case tasks.status when 'open' then 0 else 1 end,
           tasks.updated_at desc,
           tasks.title asc",
    )
    .bind(user_id)
    .fetch_all(pool)
    .await
}

pub async fn list_account_vault_items(
    pool: &PgPool,
    user_id: Uuid,
) -> Result<Vec<AccountVaultItemRecord>, sqlx::Error> {
    sqlx::query_as::<_, AccountVaultItemRecord>(
        "select
           item.id,
           item.trip_id,
           trips.name as trip_name,
           item.kind,
           item.title,
           item.detail,
           item.external_url,
           item.source,
           item.created_at
         from (
           select
             account_vault_items.id,
             account_vault_items.trip_id,
             account_vault_items.kind,
             account_vault_items.title,
             account_vault_items.detail,
             account_vault_items.external_url,
             'vault'::text as source,
             account_vault_items.created_at
           from account_vault_items
           where account_vault_items.user_id = $1
             and account_vault_items.deleted_at is null
           union all
           select
             itinerary_items.id,
             itinerary_items.trip_id,
             'note'::text as kind,
             itinerary_items.activity as title,
             itinerary_items.note as detail,
             null::text as external_url,
             'itinerary'::text as source,
             itinerary_items.updated_at as created_at
           from trip_members me
           join itinerary_items on itinerary_items.trip_id = me.trip_id
           join trips visible_trips on visible_trips.id = me.trip_id
           where me.user_id = $1
             and me.access_status = 'active'
             and visible_trips.deleted_at is null
             and itinerary_items.deleted_at is null
             and btrim(itinerary_items.note) <> ''
         ) item
         left join trips on trips.id = item.trip_id
         order by item.created_at desc, item.title asc",
    )
    .bind(user_id)
    .fetch_all(pool)
    .await
}

pub async fn account_has_active_trip_membership(
    pool: &PgPool,
    user_id: Uuid,
    trip_id: Uuid,
) -> Result<bool, sqlx::Error> {
    sqlx::query_scalar(
        "select exists (
           select 1
           from trip_members
           join trips on trips.id = trip_members.trip_id
           where trip_members.user_id = $1
             and trip_members.trip_id = $2
             and trip_members.access_status = 'active'
             and trips.deleted_at is null
         )",
    )
    .bind(user_id)
    .bind(trip_id)
    .fetch_one(pool)
    .await
}

pub async fn find_active_account_member_id_in_tx(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    user_id: Uuid,
    trip_id: Uuid,
) -> Result<Option<Uuid>, sqlx::Error> {
    sqlx::query_scalar(
        "select trip_members.id
         from trip_members
         join trips on trips.id = trip_members.trip_id
         where trip_members.user_id = $1
           and trip_members.trip_id = $2
           and trip_members.access_status = 'active'
           and trips.deleted_at is null
         limit 1",
    )
    .bind(user_id)
    .bind(trip_id)
    .fetch_optional(&mut **tx)
    .await
}

pub async fn insert_account_vault_item(
    pool: &PgPool,
    item: NewAccountVaultItem<'_>,
) -> Result<AccountVaultItemRecord, sqlx::Error> {
    sqlx::query_as::<_, AccountVaultItemRecord>(
        "with inserted as (
           insert into account_vault_items (id, user_id, trip_id, kind, title, detail, external_url)
           values ($1, $2, $3, $4, $5, $6, $7)
           returning id, trip_id, kind, title, detail, external_url, created_at
         )
         select
           inserted.id,
           inserted.trip_id,
           trips.name as trip_name,
           inserted.kind,
           inserted.title,
           inserted.detail,
           inserted.external_url,
           'vault'::text as source,
           inserted.created_at
         from inserted
         left join trips on trips.id = inserted.trip_id",
    )
    .bind(item.id)
    .bind(item.user_id)
    .bind(item.trip_id)
    .bind(item.kind)
    .bind(item.title)
    .bind(item.detail)
    .bind(item.external_url)
    .fetch_one(pool)
    .await
}

pub async fn insert_webauthn_challenge(
    pool: &PgPool,
    id: Uuid,
    user_id: Uuid,
    challenge: &str,
    purpose: &str,
    expires_at: OffsetDateTime,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        "insert into webauthn_challenges (id, user_id, challenge, purpose, expires_at)
         values ($1, $2, $3, $4, $5)",
    )
    .bind(id)
    .bind(user_id)
    .bind(challenge)
    .bind(purpose)
    .bind(expires_at)
    .execute(pool)
    .await?;

    Ok(())
}

pub async fn lock_webauthn_challenge(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    challenge_id: Uuid,
    purpose: &str,
    now: OffsetDateTime,
) -> Result<Option<(Uuid, String)>, sqlx::Error> {
    sqlx::query_as::<_, (Uuid, String)>(
        "select user_id, challenge
         from webauthn_challenges
         where id = $1
           and purpose = $2
           and consumed_at is null
           and expires_at > $3
         for update",
    )
    .bind(challenge_id)
    .bind(purpose)
    .bind(now)
    .fetch_optional(&mut **tx)
    .await
}

pub async fn consume_webauthn_challenge(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    challenge_id: Uuid,
    consumed_at: OffsetDateTime,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        "update webauthn_challenges
         set consumed_at = $2
         where id = $1",
    )
    .bind(challenge_id)
    .bind(consumed_at)
    .execute(&mut **tx)
    .await?;

    Ok(())
}

pub async fn insert_webauthn_credential(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    id: Uuid,
    user_id: Uuid,
    credential_id: &str,
    public_key: serde_json::Value,
    nickname: &str,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        "insert into webauthn_credentials (id, user_id, credential_id, public_key, nickname)
         values ($1, $2, $3, $4, $5)",
    )
    .bind(id)
    .bind(user_id)
    .bind(credential_id)
    .bind(public_key)
    .bind(nickname)
    .execute(&mut **tx)
    .await?;

    Ok(())
}

pub async fn list_passkey_credential_ids_for_email(
    pool: &PgPool,
    normalized_email: &str,
) -> Result<Option<(Uuid, Vec<String>)>, sqlx::Error> {
    sqlx::query_as::<_, (Uuid, Vec<String>)>(
        "select users.id, coalesce(
             array_agg(webauthn_credentials.credential_id order by webauthn_credentials.created_at desc)
               filter (where webauthn_credentials.credential_id is not null),
             array[]::text[]
         )
         from user_emails
         join users on users.id = user_emails.user_id
         left join webauthn_credentials on webauthn_credentials.user_id = users.id
         where user_emails.normalized_email = $1
           and user_emails.verified_at is not null
           and users.disabled_at is null
         group by users.id",
    )
    .bind(normalized_email)
    .fetch_optional(pool)
    .await
}

pub async fn lock_passkey_credential(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    credential_id: &str,
) -> Result<Option<PasskeyCredentialRecord>, sqlx::Error> {
    sqlx::query_as::<_, PasskeyCredentialRecord>(
        "select id, user_id, credential_id, public_key, sign_count
         from webauthn_credentials
         where credential_id = $1
         for update",
    )
    .bind(credential_id)
    .fetch_optional(&mut **tx)
    .await
}

pub async fn update_passkey_credential_usage(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    credential_id: &str,
    sign_count: i64,
    last_used_at: OffsetDateTime,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        "update webauthn_credentials
         set sign_count = $2,
             last_used_at = $3
         where credential_id = $1",
    )
    .bind(credential_id)
    .bind(sign_count)
    .bind(last_used_at)
    .execute(&mut **tx)
    .await?;

    Ok(())
}

pub async fn revoke_user_session(
    pool: &PgPool,
    session_token_hash: &str,
) -> Result<u64, sqlx::Error> {
    let result = sqlx::query(
        "update user_sessions
         set revoked_at = now()
         where session_token_hash = $1
           and revoked_at is null",
    )
    .bind(session_token_hash)
    .execute(pool)
    .await?;

    Ok(result.rows_affected())
}

pub async fn defer_constraints(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
) -> Result<(), sqlx::Error> {
    sqlx::query("set constraints all deferred")
        .execute(&mut **tx)
        .await?;

    Ok(())
}

pub async fn insert_account_trip(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    trip: NewAccountTrip<'_>,
) -> Result<TripAuthRecord, sqlx::Error> {
    sqlx::query_as::<_, TripAuthRecord>(
        "insert into trips (
           id,
           name,
           origin_label,
           origin_city,
           origin_country,
           origin_country_code,
           destination_label,
           destination_cities,
           countries,
           party_size,
           default_timezone,
           start_date,
           end_date,
           join_id,
           join_password_hash,
           main_trip_plan_id,
           owner_member_id
         )
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
         returning
           id,
           name,
           origin_label,
           origin_city,
           origin_country,
           origin_country_code,
           destination_label,
           destination_cities,
           countries,
           party_size,
           default_timezone,
           start_date,
           end_date,
           join_id,
           join_password_hash,
           main_trip_plan_id,
           owner_member_id,
           version",
    )
    .bind(trip.id)
    .bind(trip.name)
    .bind(trip.origin_label)
    .bind(trip.origin_city)
    .bind(trip.origin_country)
    .bind(trip.origin_country_code)
    .bind(trip.destination_label)
    .bind(Json(trip.destination_cities.to_vec()))
    .bind(trip.countries)
    .bind(trip.party_size)
    .bind(trip.default_timezone)
    .bind(trip.start_date)
    .bind(trip.end_date)
    .bind(trip.join_id)
    .bind(trip.join_password_hash)
    .bind(trip.main_trip_plan_id)
    .bind(trip.owner_member_id)
    .fetch_one(&mut **tx)
    .await
}

pub async fn insert_account_owner_member(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    member: NewAccountTripOwnerMember<'_>,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        "insert into trip_members (
           id, trip_id, user_id, display_name, role, access_status, claimed_at, color
         )
         values ($1, $2, $3, $4, 'owner', 'active', $5, $6)",
    )
    .bind(member.id)
    .bind(member.trip_id)
    .bind(member.user_id)
    .bind(member.display_name)
    .bind(member.claimed_at)
    .bind(member.color)
    .execute(&mut **tx)
    .await?;

    Ok(())
}

pub async fn insert_account_plan_variant(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    plan_variant: NewAccountPlanVariant<'_>,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        "insert into trip_plans (id, trip_id, name, status, description)
         values ($1, $2, $3, $4, $5)",
    )
    .bind(plan_variant.id)
    .bind(plan_variant.trip_id)
    .bind(plan_variant.name)
    .bind(plan_variant.status)
    .bind(plan_variant.description)
    .execute(&mut **tx)
    .await?;

    Ok(())
}

pub async fn insert_account_audit_event(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    event: NewAccountAuditEvent,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        "insert into account_audit_events (
           id, user_id, trip_id, actor_user_id, actor_member_id, event_type, payload
         )
         values ($1, $2, $3, $4, $5, $6, $7)",
    )
    .bind(event.id)
    .bind(event.user_id)
    .bind(event.trip_id)
    .bind(event.actor_user_id)
    .bind(event.actor_member_id)
    .bind(event.event_type)
    .bind(event.payload)
    .execute(&mut **tx)
    .await?;

    Ok(())
}

pub async fn get_member_user_id(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    trip_id: Uuid,
    member_id: Uuid,
) -> Result<Option<Uuid>, sqlx::Error> {
    let row: (Option<Uuid>,) = sqlx::query_as(
        "select user_id
         from trip_members
         where trip_id = $1 and id = $2",
    )
    .bind(trip_id)
    .bind(member_id)
    .fetch_one(&mut **tx)
    .await?;

    Ok(row.0)
}

pub async fn link_member_to_account_user(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    trip_id: Uuid,
    member_id: Uuid,
    user_id: Uuid,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        "update trip_members
         set user_id = $1,
             claimed_at = coalesce(claimed_at, now()),
             updated_at = now()
         where trip_id = $2 and id = $3",
    )
    .bind(user_id)
    .bind(trip_id)
    .bind(member_id)
    .execute(&mut **tx)
    .await?;

    Ok(())
}

pub async fn lock_current_owner_member(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    trip_id: Uuid,
) -> Result<Option<OwnerTransferMemberRecord>, sqlx::Error> {
    sqlx::query_as::<_, OwnerTransferMemberRecord>(
        "select
           trip_members.id,
           trip_members.user_id,
           users.disabled_at as user_disabled_at,
           trip_members.role,
           trip_members.access_status
         from trip_members
         left join users on users.id = trip_members.user_id
         where trip_members.trip_id = $1 and trip_members.role = 'owner'
         for update of trip_members",
    )
    .bind(trip_id)
    .fetch_optional(&mut **tx)
    .await
}

pub async fn lock_owner_transfer_target_member(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    trip_id: Uuid,
    member_id: Uuid,
) -> Result<Option<OwnerTransferMemberRecord>, sqlx::Error> {
    sqlx::query_as::<_, OwnerTransferMemberRecord>(
        "select
           trip_members.id,
           trip_members.user_id,
           users.disabled_at as user_disabled_at,
           trip_members.role,
           trip_members.access_status
         from trip_members
         left join users on users.id = trip_members.user_id
         where trip_members.trip_id = $1 and trip_members.id = $2
         for update of trip_members",
    )
    .bind(trip_id)
    .bind(member_id)
    .fetch_optional(&mut **tx)
    .await
}

pub async fn update_trip_member_role(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    trip_id: Uuid,
    member_id: Uuid,
    role: TripRole,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        "update trip_members
         set role = $1,
             updated_at = now()
         where trip_id = $2 and id = $3",
    )
    .bind(role.as_str())
    .bind(trip_id)
    .bind(member_id)
    .execute(&mut **tx)
    .await?;

    Ok(())
}

pub async fn update_trip_owner_member(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    trip_id: Uuid,
    owner_member_id: Uuid,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        "update trips
         set owner_member_id = $1,
             updated_at = now(),
             version = version + 1
         where id = $2",
    )
    .bind(owner_member_id)
    .bind(trip_id)
    .execute(&mut **tx)
    .await?;

    Ok(())
}
