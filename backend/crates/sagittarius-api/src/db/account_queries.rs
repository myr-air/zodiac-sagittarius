use time::OffsetDateTime;
use uuid::Uuid;

use crate::db::PgPool;
use crate::db::models::{
    AccountProfileRecord, ActiveUserSessionRecord, EmailLoginChallengeRecord, NewEmailLoginOutbox,
    NewTrustedDevice, NewUser, NewUserEmail, NewUserSession, PasskeyRecord, TrustedDeviceRecord,
    UserEmailRecord,
};

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
           returning user_id
         )
         select upserted.user_id, users.disabled_at
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
) -> Result<(), sqlx::Error> {
    sqlx::query(
        "insert into trusted_devices (id, user_id, label, created_at, last_seen_at)
         values ($1, $2, $3, $4, $5)",
    )
    .bind(device.id)
    .bind(device.user_id)
    .bind(device.label)
    .bind(device.created_at)
    .bind(device.last_seen_at)
    .execute(&mut **tx)
    .await?;

    Ok(())
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
    .bind(session.kind)
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
