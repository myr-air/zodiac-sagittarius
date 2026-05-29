use argon2::password_hash::{PasswordHash, SaltString, rand_core::OsRng};
use argon2::{Argon2, PasswordHasher, PasswordVerifier};
use base64::{Engine as _, engine::general_purpose::URL_SAFE_NO_PAD};
use rand::RngCore;
use time::format_description::well_known::Rfc3339;
use time::{Duration, OffsetDateTime};
use uuid::Uuid;

use crate::db::models::{
    AccountProfileRecord, NewTrustedDevice, NewUser, NewUserEmail, NewUserSession, PasskeyRecord,
    TrustedDeviceRecord,
};
use crate::db::{self, PgPool};
use crate::domain::errors::ServiceError;
use crate::domain::types::{
    AccountProfile, AccountSession, AccountSessionKind, AccountSettings, EmailLoginStartResponse,
    PasskeyChallengeResponse, PasskeySummary, TrustedDeviceSummary,
};

const CHALLENGE_TTL: Duration = Duration::minutes(10);
const PASSKEY_CHALLENGE_TTL: Duration = Duration::minutes(5);
const TEMPORARY_SESSION_TTL: Duration = Duration::days(1);
const TRUSTED_SESSION_TTL: Duration = Duration::days(30);
const SESSION_TOKEN_SALT: &[u8] = b"sagittarius-account-session-token";
const DEFAULT_TRUSTED_DEVICE_LABEL: &str = "Trusted device";

pub async fn start_email_login(
    pool: &PgPool,
    email: &str,
) -> Result<EmailLoginStartResponse, ServiceError> {
    let normalized_email = normalize_email(email)?;
    let challenge_id = Uuid::now_v7();
    let dev_code = deterministic_dev_code(&normalized_email);
    let code_hash = hash_secret(&dev_code)?;
    let expires_at = OffsetDateTime::now_utc() + CHALLENGE_TTL;

    db::account_queries::insert_email_login_challenge(
        pool,
        challenge_id,
        &normalized_email,
        &code_hash,
        expires_at,
    )
    .await?;

    Ok(EmailLoginStartResponse {
        challenge_id,
        expires_at: format_timestamp(expires_at),
        dev_code,
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
    let challenge = db::account_queries::lock_email_login_challenge(&mut tx, challenge_id)
        .await?
        .ok_or(ServiceError::Unauthenticated)?;
    let now = OffsetDateTime::now_utc();

    if challenge.id != challenge_id
        || challenge.consumed_at.is_some()
        || challenge.expires_at <= now
    {
        return Err(ServiceError::Unauthenticated);
    }

    if !verify_secret(code.trim(), &challenge.code_hash) {
        return Err(ServiceError::Unauthenticated);
    }

    db::account_queries::consume_email_login_challenge(&mut tx, challenge_id, now).await?;
    let user_id = find_or_create_user(&mut tx, &challenge.normalized_email, now).await?;
    let kind = if trust_device {
        AccountSessionKind::Trusted
    } else {
        AccountSessionKind::Temporary
    };
    let trusted_device_id = if trust_device {
        let trusted_device_id = Uuid::now_v7();
        let label = normalized_device_label(device_label);
        db::account_queries::insert_trusted_device(
            &mut tx,
            NewTrustedDevice {
                id: trusted_device_id,
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
        &mut tx,
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
    tx.commit().await?;

    Ok(AccountSession {
        user_id,
        session_token,
        kind,
        created_at: format_timestamp(now),
        expires_at: format_timestamp(expires_at),
    })
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

pub async fn load_settings(
    pool: &PgPool,
    session_token: &str,
) -> Result<AccountSettings, ServiceError> {
    let user_id = authenticate_user_session(pool, session_token).await?;
    let profile = db::account_queries::get_user_profile(pool, user_id)
        .await?
        .ok_or(ServiceError::Unauthenticated)?;
    let passkeys = db::account_queries::list_passkeys(pool, user_id).await?;
    let trusted_devices = db::account_queries::list_trusted_devices(pool, user_id).await?;

    Ok(AccountSettings {
        profile: account_profile_from_record(profile),
        passkeys: passkeys
            .into_iter()
            .map(passkey_summary_from_record)
            .collect(),
        trusted_devices: trusted_devices
            .into_iter()
            .map(trusted_device_summary_from_record)
            .collect(),
    })
}

pub async fn start_passkey_registration(
    pool: &PgPool,
    session_token: &str,
) -> Result<PasskeyChallengeResponse, ServiceError> {
    let user_id = authenticate_user_session(pool, session_token).await?;
    let challenge_id = Uuid::now_v7();
    let challenge = generate_secure_token();
    let expires_at = OffsetDateTime::now_utc() + PASSKEY_CHALLENGE_TTL;

    db::account_queries::insert_webauthn_challenge(
        pool,
        challenge_id,
        user_id,
        &challenge,
        "register",
        expires_at,
    )
    .await?;

    Ok(PasskeyChallengeResponse {
        challenge_id,
        challenge,
        expires_at: format_timestamp(expires_at),
    })
}

pub async fn logout_user_session(pool: &PgPool, session_token: &str) -> Result<(), ServiceError> {
    authenticate_user_session(pool, session_token).await?;
    let session_token_hash = hash_session_token(session_token)?;
    db::account_queries::revoke_user_session(pool, &session_token_hash).await?;

    Ok(())
}

async fn find_or_create_user(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    normalized_email: &str,
    verified_at: OffsetDateTime,
) -> Result<Uuid, ServiceError> {
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

fn normalize_email(email: &str) -> Result<String, ServiceError> {
    let normalized = email.trim().to_ascii_lowercase();
    if is_valid_email(&normalized) {
        Ok(normalized)
    } else {
        Err(ServiceError::InvalidRequest("email is invalid"))
    }
}

fn is_valid_email(email: &str) -> bool {
    let Some((local, domain)) = email.split_once('@') else {
        return false;
    };
    !local.is_empty()
        && !domain.is_empty()
        && domain.contains('.')
        && !domain.starts_with('.')
        && !domain.ends_with('.')
        && !email.chars().any(char::is_whitespace)
        && email.matches('@').count() == 1
}

fn deterministic_dev_code(normalized_email: &str) -> String {
    let mut hash = 0xcbf29ce484222325u64;
    for byte in normalized_email.as_bytes().iter().copied() {
        hash ^= u64::from(byte);
        hash = hash.wrapping_mul(0x100000001b3);
    }

    format!("{:06}", hash % 1_000_000)
}

fn hash_secret(secret: &str) -> Result<String, ServiceError> {
    let salt = SaltString::generate(&mut OsRng);
    hash_secret_with_salt_string(secret, &salt)
}

fn hash_secret_with_salt(secret: &str, salt: &[u8]) -> Result<String, ServiceError> {
    let salt = SaltString::encode_b64(salt).map_err(|_| ServiceError::InvalidRequest("salt"))?;
    hash_secret_with_salt_string(secret, &salt)
}

fn hash_secret_with_salt_string(secret: &str, salt: &SaltString) -> Result<String, ServiceError> {
    Argon2::default()
        .hash_password(secret.as_bytes(), salt)
        .map(|hash| hash.to_string())
        .map_err(|_| ServiceError::InvalidRequest("secret could not be hashed"))
}

fn verify_secret(secret: &str, hash: &str) -> bool {
    let Ok(parsed_hash) = PasswordHash::new(hash) else {
        return false;
    };

    Argon2::default()
        .verify_password(secret.as_bytes(), &parsed_hash)
        .is_ok()
}

fn generate_session_token() -> String {
    generate_secure_token()
}

fn generate_secure_token() -> String {
    let mut bytes = [0u8; 32];
    rand::rng().fill_bytes(&mut bytes);
    URL_SAFE_NO_PAD.encode(bytes)
}

fn hash_session_token(session_token: &str) -> Result<String, ServiceError> {
    hash_secret_with_salt(session_token, SESSION_TOKEN_SALT)
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

fn normalized_device_label(device_label: &str) -> String {
    let label = device_label.trim();
    if label.is_empty() {
        DEFAULT_TRUSTED_DEVICE_LABEL.to_string()
    } else {
        label.to_string()
    }
}

fn account_profile_from_record(record: AccountProfileRecord) -> AccountProfile {
    AccountProfile {
        id: record.id,
        display_name: record.display_name,
        avatar_color: record.avatar_color,
        locale: record.locale,
        timezone: record.timezone,
        primary_email: record.primary_email,
    }
}

fn trusted_device_summary_from_record(record: TrustedDeviceRecord) -> TrustedDeviceSummary {
    TrustedDeviceSummary {
        id: record.id,
        label: record.label,
        user_agent: record.user_agent,
        created_at: format_timestamp(record.created_at),
        last_seen_at: record.last_seen_at.map(format_timestamp),
    }
}

fn passkey_summary_from_record(record: PasskeyRecord) -> PasskeySummary {
    PasskeySummary {
        id: record.id,
        nickname: record.nickname,
        created_at: format_timestamp(record.created_at),
        last_used_at: record.last_used_at.map(format_timestamp),
    }
}

fn format_timestamp(timestamp: OffsetDateTime) -> String {
    timestamp
        .format(&Rfc3339)
        .expect("rfc3339 timestamp should format")
}
