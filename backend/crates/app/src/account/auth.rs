use base64::{Engine as _, engine::general_purpose::URL_SAFE_NO_PAD};
use rand::RngCore;
use sha2::{Digest, Sha256};
use time::{Duration, OffsetDateTime};
use uuid::Uuid;

use crate::account_email::{ensure_email_domain_is_allowed, normalize_email};
use crate::account_mappers::format_timestamp;
use sagittarius_db::models::{
    NewEmailLoginOutbox, NewTrustedDevice, NewUser, NewUserEmail, NewUserSession,
};
use sagittarius_db::{self as db, PgPool};
use sagittarius_domain::errors::ServiceError;
use sagittarius_domain::types::{AccountSession, AccountSessionKind, EmailLoginStartResponse};

use super::{
    CHALLENGE_TTL, DEFAULT_TRUSTED_DEVICE_LABEL, EMAIL_LOGIN_CODE_SALT, MAX_ACCOUNT_PASSWORD_LENGTH,
    MAX_EMAIL_LOGIN_ATTEMPTS, MAX_TRUSTED_DEVICE_LABEL_LENGTH, MIN_ACCOUNT_PASSWORD_LENGTH,
    PASSWORD_LOGIN_ATTEMPT_SCOPE, PASSWORD_LOGIN_LOCK_MINUTES, PASSWORD_LOGIN_MAX_ATTEMPTS,
    PasswordLoginFlow, PasswordLoginInput, SESSION_TOKEN_SALT, TEMPORARY_SESSION_TTL,
    TRUSTED_SESSION_TTL,
};

pub async fn start_email_login(
    pool: &PgPool,
    email_delivery: &crate::email::EmailDelivery,
    email: &str,
) -> Result<EmailLoginStartResponse, ServiceError> {
    let normalized_email = normalize_email(email)?;
    let now = OffsetDateTime::now_utc();
    let mut tx = pool.begin().await?;

    db::account_queries::lock_email_login_start_for_email(&mut tx, &normalized_email).await?;
    if let Some(active_challenge) =
        db::account_queries::lock_active_email_login_challenge_for_email(
            &mut tx,
            &normalized_email,
            now,
        )
        .await?
    {
        if active_challenge.locked_at.is_some()
            || active_challenge.attempt_count >= MAX_EMAIL_LOGIN_ATTEMPTS
        {
            return Err(ServiceError::Unauthenticated);
        }
        let code = db::account_queries::find_email_login_outbox_code_for_challenge(
            &mut tx,
            active_challenge.id,
        )
        .await?;
        tx.commit().await?;
        email_delivery
            .send_login_code(
                &normalized_email,
                &code,
                active_challenge.id,
                &format_timestamp(active_challenge.expires_at),
            )
            .await?;
        return Ok(EmailLoginStartResponse {
            challenge_id: active_challenge.id,
            expires_at: format_timestamp(active_challenge.expires_at),
        });
    }

    let challenge_id = Uuid::now_v7();
    let code = generate_email_login_code();
    let code_hash = hash_email_login_code(challenge_id, &code);
    let expires_at = now + CHALLENGE_TTL;

    db::account_queries::insert_email_login_challenge(
        &mut tx,
        challenge_id,
        &normalized_email,
        &code_hash,
        expires_at,
    )
    .await?;
    db::account_queries::insert_email_login_outbox(
        &mut tx,
        NewEmailLoginOutbox {
            id: Uuid::now_v7(),
            challenge_id,
            normalized_email: &normalized_email,
            code: &code,
            expires_at,
        },
    )
    .await?;
    tx.commit().await?;

    email_delivery
        .send_login_code(
            &normalized_email,
            &code,
            challenge_id,
            &format_timestamp(expires_at),
        )
        .await?;

    Ok(EmailLoginStartResponse {
        challenge_id,
        expires_at: format_timestamp(expires_at),
    })
}

pub async fn finish_email_login(
    pool: &PgPool,
    challenge_id: Uuid,
    code: &str,
    trust_device: bool,
    device_label: &str,
) -> Result<AccountSession, ServiceError> {
    let mut tx = pool.begin().await?;
    let challenge = db::account_queries::find_email_login_challenge(&mut tx, challenge_id)
        .await?
        .ok_or(ServiceError::Unauthenticated)?;

    db::account_queries::lock_email_login_start_for_email(&mut tx, &challenge.normalized_email)
        .await?;
    let challenge = db::account_queries::lock_email_login_challenge(&mut tx, challenge_id)
        .await?
        .ok_or(ServiceError::Unauthenticated)?;
    ensure_email_domain_is_allowed(&challenge.normalized_email)?;
    let now = OffsetDateTime::now_utc();

    if challenge.id != challenge_id
        || challenge.consumed_at.is_some()
        || challenge.locked_at.is_some()
        || challenge.attempt_count >= MAX_EMAIL_LOGIN_ATTEMPTS
        || challenge.expires_at <= now
    {
        return Err(ServiceError::Unauthenticated);
    }

    if !verify_email_login_code(challenge_id, code.trim(), &challenge.code_hash) {
        db::account_queries::record_email_login_failed_attempt(
            &mut tx,
            challenge_id,
            MAX_EMAIL_LOGIN_ATTEMPTS,
            now,
        )
        .await?;
        tx.commit().await?;
        return Err(ServiceError::Unauthenticated);
    }

    db::account_queries::consume_email_login_challenge(&mut tx, challenge_id, now).await?;
    let user_id = find_or_create_user(&mut tx, &challenge.normalized_email, now).await?;
    let session = create_user_session(&mut tx, user_id, trust_device, device_label, now).await?;
    tx.commit().await?;

    Ok(session)
}

pub async fn finish_password_login(
    pool: &PgPool,
    input: PasswordLoginInput,
) -> Result<AccountSession, ServiceError> {
    let normalized_email = normalize_email(&input.email)?;
    let password = validate_account_password(&input.password)?;
    let now = OffsetDateTime::now_utc();
    let mut tx = pool.begin().await?;

    db::account_queries::lock_email_login_start_for_email(&mut tx, &normalized_email).await?;
    let existing =
        db::account_queries::find_password_login_user_for_email(&mut tx, &normalized_email).await?;
    let user_id = match input.flow {
        PasswordLoginFlow::Login => {
            enforce_auth_attempt_not_locked(
                &mut tx,
                PASSWORD_LOGIN_ATTEMPT_SCOPE,
                &normalized_email,
                now,
            )
            .await?;
            let record = existing.ok_or(ServiceError::Unauthenticated)?;
            if record.disabled_at.is_some() {
                return Err(ServiceError::Forbidden);
            }
            let Some(stored_hash) = record.password_hash else {
                return Err(ServiceError::Unauthenticated);
            };
            if !crate::auth::verify_secret(&password, &stored_hash) {
                record_auth_failed_attempt(
                    &mut tx,
                    PASSWORD_LOGIN_ATTEMPT_SCOPE,
                    &normalized_email,
                    PASSWORD_LOGIN_MAX_ATTEMPTS,
                    PASSWORD_LOGIN_LOCK_MINUTES,
                    now,
                )
                .await?;
                tx.commit().await?;
                return Err(ServiceError::Unauthenticated);
            }
            db::queries::clear_auth_attempt(
                &mut tx,
                PASSWORD_LOGIN_ATTEMPT_SCOPE,
                &normalized_email,
            )
            .await?;
            record.user_id
        }
        PasswordLoginFlow::Register => {
            if let Some(record) = existing {
                if record.disabled_at.is_some() {
                    return Err(ServiceError::Forbidden);
                }
                if record.password_hash.is_some() {
                    return Err(ServiceError::Unauthenticated);
                }
                let password_hash = crate::auth::hash_secret(&password)?;
                db::account_queries::update_user_password_hash(
                    &mut tx,
                    record.user_id,
                    &password_hash,
                )
                .await?;
                record.user_id
            } else {
                let user_id = find_or_create_user(&mut tx, &normalized_email, now).await?;
                let password_hash = crate::auth::hash_secret(&password)?;
                db::account_queries::update_user_password_hash(&mut tx, user_id, &password_hash)
                    .await?;
                user_id
            }
        }
    };

    let session = create_user_session(
        &mut tx,
        user_id,
        input.trust_device,
        &input.device_label,
        now,
    )
    .await?;
    tx.commit().await?;

    Ok(session)
}

pub async fn authenticate_user_session(
    pool: &PgPool,
    session_token: &str,
) -> Result<Uuid, ServiceError> {
    let session_token_hash = hash_session_token(session_token)?;
    let session = db::account_queries::find_active_user_session(pool, &session_token_hash)
        .await?
        .ok_or(ServiceError::Unauthenticated)?;

    Ok(session.user_id)
}
pub async fn logout_user_session(pool: &PgPool, session_token: &str) -> Result<(), ServiceError> {
    authenticate_user_session(pool, session_token).await?;
    let session_token_hash = hash_session_token(session_token)?;
    db::account_queries::revoke_user_session(pool, &session_token_hash).await?;

    Ok(())
}

pub(super) async fn create_user_session(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    user_id: Uuid,
    trust_device: bool,
    device_label: &str,
    now: OffsetDateTime,
) -> Result<AccountSession, ServiceError> {
    let kind = if trust_device {
        AccountSessionKind::Trusted
    } else {
        AccountSessionKind::Temporary
    };
    let trusted_device_id = if trust_device {
        let label = normalized_device_label(device_label)?;
        let trusted_device_id = db::account_queries::insert_trusted_device(
            tx,
            NewTrustedDevice {
                id: Uuid::now_v7(),
                user_id,
                label: &label,
                created_at: now,
                last_seen_at: now,
            },
        )
        .await?;
        Some(trusted_device_id)
    } else {
        None
    };

    let session_token = generate_session_token();
    let session_token_hash = hash_session_token(&session_token)?;
    let expires_at = now
        + match kind {
            AccountSessionKind::Temporary => TEMPORARY_SESSION_TTL,
            AccountSessionKind::Trusted => TRUSTED_SESSION_TTL,
        };

    db::account_queries::insert_user_session(
        tx,
        NewUserSession {
            id: Uuid::now_v7(),
            user_id,
            trusted_device_id,
            session_token_hash: &session_token_hash,
            kind,
            created_at: now,
            expires_at,
        },
    )
    .await?;

    Ok(AccountSession {
        user_id,
        session_token,
        kind,
        trusted_device_id,
        created_at: format_timestamp(now),
        expires_at: format_timestamp(expires_at),
    })
}

async fn find_or_create_user(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    normalized_email: &str,
    verified_at: OffsetDateTime,
) -> Result<Uuid, ServiceError> {
    if let Some(existing) =
        db::account_queries::find_user_email_record(tx, normalized_email).await?
    {
        if existing.disabled_at.is_some() {
            return Err(ServiceError::Forbidden);
        }
        if existing.verified_at.is_none() {
            db::account_queries::verify_user_email_for_normalized_email_if_unverified(
                tx,
                normalized_email,
                verified_at,
            )
            .await?;
        }
        return Ok(existing.user_id);
    }

    let user_id = Uuid::now_v7();
    db::account_queries::insert_user(
        tx,
        NewUser {
            id: user_id,
            display_name: display_name_from_email(normalized_email),
            avatar_color: avatar_color_for_email(normalized_email),
        },
    )
    .await?;
    let record = db::account_queries::insert_user_email_or_resume(
        tx,
        NewUserEmail {
            id: Uuid::now_v7(),
            user_id,
            email: normalized_email,
            normalized_email,
            verified_at,
        },
    )
    .await?;

    if record.user_id != user_id {
        db::account_queries::delete_user(tx, user_id).await?;
    }

    if record.disabled_at.is_some() {
        return Err(ServiceError::Forbidden);
    }

    Ok(record.user_id)
}
fn generate_email_login_code() -> String {
    let mut bytes = [0u8; 4];
    rand::rng().fill_bytes(&mut bytes);
    format!("{:06}", u32::from_le_bytes(bytes) % 1_000_000)
}

fn generate_session_token() -> String {
    generate_secure_token()
}

pub(super) fn generate_secure_token() -> String {
    let mut bytes = [0u8; 32];
    rand::rng().fill_bytes(&mut bytes);
    URL_SAFE_NO_PAD.encode(bytes)
}
fn validate_account_password(password: &str) -> Result<String, ServiceError> {
    let trimmed = password.trim();
    if trimmed.len() < MIN_ACCOUNT_PASSWORD_LENGTH || trimmed.len() > MAX_ACCOUNT_PASSWORD_LENGTH {
        return Err(ServiceError::InvalidRequest("password is invalid"));
    }

    Ok(trimmed.to_string())
}

async fn enforce_auth_attempt_not_locked(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    scope: &str,
    attempt_key: &str,
    now: OffsetDateTime,
) -> Result<(), ServiceError> {
    let attempt = db::queries::lock_auth_attempt(tx, scope, attempt_key).await?;
    if attempt
        .locked_until
        .is_some_and(|locked_until| locked_until > now)
    {
        return Err(ServiceError::TooManyRequests);
    }
    Ok(())
}

async fn record_auth_failed_attempt(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    scope: &str,
    attempt_key: &str,
    max_attempts: i32,
    lock_minutes: i64,
    now: OffsetDateTime,
) -> Result<(), ServiceError> {
    db::queries::record_auth_failed_attempt(
        tx,
        scope,
        attempt_key,
        max_attempts,
        now + Duration::minutes(lock_minutes),
    ).await?;
    Ok(())
}
pub(super) fn hash_session_token(session_token: &str) -> Result<String, ServiceError> {
    Ok(hash_secret_digest(
        SESSION_TOKEN_SALT,
        session_token.as_bytes(),
    ))
}

fn hash_email_login_code(challenge_id: Uuid, code: &str) -> String {
    let mut bytes = Vec::with_capacity(16 + code.len());
    bytes.extend_from_slice(challenge_id.as_bytes());
    bytes.extend_from_slice(code.as_bytes());
    hash_secret_digest(EMAIL_LOGIN_CODE_SALT, &bytes)
}

fn verify_email_login_code(challenge_id: Uuid, code: &str, expected_hash: &str) -> bool {
    constant_time_eq(
        hash_email_login_code(challenge_id, code).as_bytes(),
        expected_hash.as_bytes(),
    )
}

fn hash_secret_digest(salt: &[u8], secret: &[u8]) -> String {
    let mut hasher = Sha256::new();
    hasher.update(salt);
    hasher.update(secret);
    URL_SAFE_NO_PAD.encode(hasher.finalize())
}

fn constant_time_eq(left: &[u8], right: &[u8]) -> bool {
    let max_len = left.len().max(right.len());
    let mut diff = left.len() ^ right.len();
    for index in 0..max_len {
        let left_byte = left.get(index).copied().unwrap_or(0);
        let right_byte = right.get(index).copied().unwrap_or(0);
        diff |= usize::from(left_byte ^ right_byte);
    }
    diff == 0
}

fn display_name_from_email(normalized_email: &str) -> &str {
    normalized_email
        .split_once('@')
        .map(|(local, _)| local)
        .filter(|local| !local.is_empty())
        .unwrap_or("Traveler")
}

fn avatar_color_for_email(normalized_email: &str) -> &'static str {
    const COLORS: [&str; 6] = [
        "#0f766e", "#2563eb", "#f97316", "#64748b", "#7c3aed", "#be123c",
    ];
    let index = normalized_email
        .bytes()
        .fold(0usize, |total, byte| total.wrapping_add(byte as usize))
        % COLORS.len();
    COLORS[index]
}

fn normalized_device_label(device_label: &str) -> Result<String, ServiceError> {
    let label = device_label.trim();
    let label = if label.is_empty() {
        DEFAULT_TRUSTED_DEVICE_LABEL
    } else {
        label
    };

    if label.len() <= MAX_TRUSTED_DEVICE_LABEL_LENGTH {
        Ok(label.to_string())
    } else {
        Err(ServiceError::InvalidRequest(
            "trusted device label is too long",
        ))
    }
}
