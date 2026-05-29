use base64::{Engine as _, engine::general_purpose::URL_SAFE_NO_PAD};
use rand::RngCore;
use sha2::{Digest, Sha256};
use time::format_description::well_known::Rfc3339;
use time::{Duration, OffsetDateTime};
use uuid::Uuid;

use crate::db::models::{
    AccountProfileRecord, AccountTripRecord, AccountTripStatsRecord, NewAccountAuditEvent,
    NewAccountPlanVariant, NewAccountTrip, NewAccountTripOwnerMember, NewEmailLoginOutbox,
    NewTrustedDevice, NewUser, NewUserEmail, NewUserSession, PasskeyRecord, TrustedDeviceRecord,
};
use crate::db::{self, PgPool};
use crate::domain::errors::ServiceError;
use crate::domain::types::{
    AccountMemberClaimResponse, AccountProfile, AccountSession, AccountSessionKind,
    AccountSettings, AccountTripCreateResponse, AccountTripStats, AccountTripSummary,
    EmailLoginStartResponse, MemberSession, OwnerTransferResponse, PasskeyChallengeResponse,
    PasskeySummary, TripMemberAccessStatus, TripRole, TripSummary, TrustedDeviceSummary,
};

const CHALLENGE_TTL: Duration = Duration::minutes(10);
const PASSKEY_CHALLENGE_TTL: Duration = Duration::minutes(5);
const TEMPORARY_SESSION_TTL: Duration = Duration::days(1);
const TRUSTED_SESSION_TTL: Duration = Duration::days(30);
const EMAIL_LOGIN_CODE_SALT: &[u8] = b"sagittarius-email-login-code";
const SESSION_TOKEN_SALT: &[u8] = b"sagittarius-account-session-token";
const DEFAULT_TRUSTED_DEVICE_LABEL: &str = "Trusted device";
const MAX_EMAIL_LOGIN_ATTEMPTS: i32 = 5;
const MAX_EMAIL_LENGTH: usize = 254;
const MAX_TRUSTED_DEVICE_LABEL_LENGTH: usize = 120;
const MAX_TRIP_TEXT_LENGTH: usize = 120;
const MAX_JOIN_ID_LENGTH: usize = 32;
const MIN_JOIN_PASSWORD_LENGTH: usize = 8;
const MAX_JOIN_PASSWORD_LENGTH: usize = 256;
const MEMBER_SESSION_TTL: Duration = Duration::days(30);
const DEFAULT_OWNER_COLOR: &str = "#0f766e";

pub struct AccountTripCreateInput {
    pub name: String,
    pub destination_label: String,
    pub start_date: time::Date,
    pub end_date: time::Date,
    pub owner_display_name: String,
    pub join_id: String,
    pub join_password: String,
}

pub async fn start_email_login(
    pool: &PgPool,
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
        tx.commit().await?;
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
    let challenge = db::account_queries::lock_email_login_challenge(&mut tx, challenge_id)
        .await?
        .ok_or(ServiceError::Unauthenticated)?;
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
    let kind = if trust_device {
        AccountSessionKind::Trusted
    } else {
        AccountSessionKind::Temporary
    };
    let trusted_device_id = if trust_device {
        let trusted_device_id = Uuid::now_v7();
        let label = normalized_device_label(device_label)?;
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

pub async fn create_trip(
    pool: &PgPool,
    session_token: &str,
    input: AccountTripCreateInput,
) -> Result<AccountTripCreateResponse, ServiceError> {
    let user_id = authenticate_user_session(pool, session_token).await?;
    let name = validate_trip_text(&input.name, "trip name")?;
    let destination_label = validate_trip_text(&input.destination_label, "destination label")?;
    let owner_display_name = validate_trip_text(&input.owner_display_name, "owner display name")?;
    let join_id = validate_join_id(&input.join_id)?;
    let join_password = validate_join_password(&input.join_password)?;

    if input.start_date > input.end_date {
        return Err(ServiceError::InvalidRequest(
            "start date must be on or before end date",
        ));
    }

    let trip_id = Uuid::now_v7();
    let owner_member_id = Uuid::now_v7();
    let active_plan_variant_id = Uuid::now_v7();
    let now = OffsetDateTime::now_utc();
    let join_password_hash = crate::app::auth::hash_secret(&join_password)?;
    let mut tx = pool.begin().await?;

    db::account_queries::defer_constraints(&mut tx).await?;
    let trip = db::account_queries::insert_account_trip(
        &mut tx,
        NewAccountTrip {
            id: trip_id,
            name: &name,
            destination_label: &destination_label,
            start_date: input.start_date,
            end_date: input.end_date,
            join_id: &join_id,
            join_password_hash: &join_password_hash,
            active_plan_variant_id,
            owner_member_id,
        },
    )
    .await
    .map_err(map_account_trip_insert_error)?;
    db::account_queries::insert_account_owner_member(
        &mut tx,
        NewAccountTripOwnerMember {
            id: owner_member_id,
            trip_id,
            user_id,
            display_name: &owner_display_name,
            color: DEFAULT_OWNER_COLOR,
            claimed_at: now,
        },
    )
    .await?;
    db::account_queries::insert_account_plan_variant(
        &mut tx,
        NewAccountPlanVariant {
            id: active_plan_variant_id,
            trip_id,
            name: "Main",
            kind: "main",
            description: "Primary plan",
        },
    )
    .await?;
    let member_session = create_member_session(&mut tx, trip_id, owner_member_id).await?;
    db::account_queries::insert_account_audit_event(
        &mut tx,
        NewAccountAuditEvent {
            id: Uuid::now_v7(),
            user_id,
            trip_id,
            actor_user_id: user_id,
            actor_member_id: owner_member_id,
            event_type: "trip.created",
            payload: serde_json::json!({}),
        },
    )
    .await?;
    tx.commit().await?;

    Ok(AccountTripCreateResponse {
        trip: TripSummary::from(trip),
        owner_member_id,
        member_session,
    })
}

pub async fn list_trips(
    pool: &PgPool,
    session_token: &str,
) -> Result<Vec<AccountTripSummary>, ServiceError> {
    let user_id = authenticate_user_session(pool, session_token).await?;
    let trips = db::account_queries::list_account_trips(pool, user_id).await?;

    Ok(trips.into_iter().map(account_trip_from_record).collect())
}

pub async fn load_stats(
    pool: &PgPool,
    session_token: &str,
) -> Result<AccountTripStats, ServiceError> {
    let user_id = authenticate_user_session(pool, session_token).await?;
    let stats = db::account_queries::get_account_trip_stats(pool, user_id).await?;

    Ok(account_trip_stats_from_record(stats))
}

pub async fn claim_member(
    pool: &PgPool,
    session_token: &str,
    trip_id: Uuid,
    member_id: Uuid,
    member_session_token: &str,
) -> Result<AccountMemberClaimResponse, ServiceError> {
    let user_id = authenticate_user_session(pool, session_token).await?;
    let member_session_token_hash = crate::app::auth::hash_session_token(member_session_token)?;
    let mut tx = pool.begin().await?;
    let member_session = db::queries::find_unexpired_member_session_in_tx(
        &mut tx,
        trip_id,
        &member_session_token_hash,
    )
    .await?
    .ok_or(ServiceError::Unauthenticated)?;

    if member_session.member_id != member_id {
        return Err(ServiceError::Unauthenticated);
    }

    let member = db::queries::lock_member(&mut tx, trip_id, member_id)
        .await?
        .ok_or(ServiceError::NotFound)?;

    if member.access_status == TripMemberAccessStatus::Disabled {
        return Err(ServiceError::Forbidden);
    }

    if db::account_queries::get_member_user_id(&mut tx, trip_id, member_id)
        .await?
        .is_some()
    {
        return Err(ServiceError::IdentityAlreadyLinked);
    }

    db::account_queries::link_member_to_account_user(&mut tx, trip_id, member_id, user_id).await?;
    db::account_queries::insert_account_audit_event(
        &mut tx,
        NewAccountAuditEvent {
            id: Uuid::now_v7(),
            user_id,
            trip_id,
            actor_user_id: user_id,
            actor_member_id: member_id,
            event_type: "member.claimed_account",
            payload: serde_json::json!({}),
        },
    )
    .await?;
    tx.commit().await?;

    Ok(AccountMemberClaimResponse {
        trip_id,
        member_id,
        user_id,
        role: member.role,
    })
}

pub async fn transfer_trip_owner(
    pool: &PgPool,
    session_token: &str,
    trip_id: Uuid,
    target_member_id: Uuid,
) -> Result<OwnerTransferResponse, ServiceError> {
    let session_token_hash = hash_session_token(session_token)?;
    let mut tx = pool.begin().await?;

    db::account_queries::defer_constraints(&mut tx).await?;
    let user_id = db::account_queries::find_active_user_session_in_tx(&mut tx, &session_token_hash)
        .await?
        .ok_or(ServiceError::Unauthenticated)?
        .user_id;
    let current_owner = db::account_queries::lock_current_owner_member(&mut tx, trip_id)
        .await?
        .ok_or(ServiceError::Forbidden)?;

    if current_owner.access_status != TripMemberAccessStatus::Active
        || current_owner.user_id != Some(user_id)
    {
        return Err(ServiceError::Forbidden);
    }

    if target_member_id == current_owner.id {
        return Err(ServiceError::OwnerTransferInvalid);
    }

    let target_member =
        db::account_queries::lock_owner_transfer_target_member(&mut tx, trip_id, target_member_id)
            .await?
            .ok_or(ServiceError::OwnerTransferInvalid)?;

    let Some(target_user_id) = target_member.user_id else {
        return Err(ServiceError::OwnerTransferInvalid);
    };

    if target_member.access_status != TripMemberAccessStatus::Active
        || target_member.user_disabled_at.is_some()
    {
        return Err(ServiceError::OwnerTransferInvalid);
    }

    db::account_queries::update_trip_member_role(
        &mut tx,
        trip_id,
        current_owner.id,
        TripRole::Organizer,
    )
    .await?;
    db::account_queries::update_trip_member_role(
        &mut tx,
        trip_id,
        target_member.id,
        TripRole::Owner,
    )
    .await?;
    db::account_queries::update_trip_owner_member(&mut tx, trip_id, target_member.id).await?;
    db::account_queries::insert_account_audit_event(
        &mut tx,
        NewAccountAuditEvent {
            id: Uuid::now_v7(),
            user_id: target_user_id,
            trip_id,
            actor_user_id: user_id,
            actor_member_id: current_owner.id,
            event_type: "owner.transferred",
            payload: serde_json::json!({}),
        },
    )
    .await?;
    tx.commit().await?;

    Ok(OwnerTransferResponse {
        trip_id,
        previous_owner_member_id: current_owner.id,
        new_owner_member_id: target_member.id,
    })
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
    if normalized.len() <= MAX_EMAIL_LENGTH && is_valid_email(&normalized) {
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

fn generate_email_login_code() -> String {
    let mut bytes = [0u8; 4];
    rand::rng().fill_bytes(&mut bytes);
    format!("{:06}", u32::from_le_bytes(bytes) % 1_000_000)
}

fn generate_session_token() -> String {
    generate_secure_token()
}

fn generate_secure_token() -> String {
    let mut bytes = [0u8; 32];
    rand::rng().fill_bytes(&mut bytes);
    URL_SAFE_NO_PAD.encode(bytes)
}

async fn create_member_session(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    trip_id: Uuid,
    member_id: Uuid,
) -> Result<MemberSession, ServiceError> {
    let session_token = generate_secure_token();
    let session_token_hash = crate::app::auth::hash_session_token(&session_token)?;
    let created_at = OffsetDateTime::now_utc();
    let expires_at = created_at + MEMBER_SESSION_TTL;

    db::queries::insert_member_session(
        tx,
        Uuid::now_v7(),
        trip_id,
        member_id,
        &session_token_hash,
        created_at,
        expires_at,
    )
    .await?;

    Ok(MemberSession {
        trip_id,
        member_id,
        session_token,
        created_at: format_timestamp(created_at),
        expires_at: format_timestamp(expires_at),
    })
}

fn validate_trip_text(value: &str, field: &'static str) -> Result<String, ServiceError> {
    let trimmed = value.trim();
    if trimmed.is_empty() || trimmed.chars().count() > MAX_TRIP_TEXT_LENGTH {
        return Err(ServiceError::InvalidRequest(field));
    }

    Ok(trimmed.to_string())
}

fn validate_join_id(join_id: &str) -> Result<String, ServiceError> {
    let normalized = join_id.trim().to_ascii_uppercase();
    if normalized.is_empty() || normalized.chars().count() > MAX_JOIN_ID_LENGTH {
        return Err(ServiceError::InvalidRequest("join id is invalid"));
    }

    Ok(normalized)
}

fn validate_join_password(join_password: &str) -> Result<String, ServiceError> {
    let trimmed = join_password.trim();
    if trimmed.len() < MIN_JOIN_PASSWORD_LENGTH || trimmed.len() > MAX_JOIN_PASSWORD_LENGTH {
        return Err(ServiceError::InvalidRequest("join password is invalid"));
    }

    Ok(trimmed.to_string())
}

fn map_account_trip_insert_error(error: sqlx::Error) -> ServiceError {
    let duplicate_join_id = is_unique_violation_on_constraint(&error, "trips_join_id_key");
    let mut mapped_error = ServiceError::Database(error);
    if duplicate_join_id {
        mapped_error = ServiceError::TripJoinIdAlreadyExists;
    }
    mapped_error
}

fn is_unique_violation_on_constraint(error: &sqlx::Error, constraint: &str) -> bool {
    matches!(error, sqlx::Error::Database(database_error) if database_error.code().as_deref() == Some("23505") && database_error.constraint() == Some(constraint))
}

fn hash_session_token(session_token: &str) -> Result<String, ServiceError> {
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

fn account_trip_from_record(record: AccountTripRecord) -> AccountTripSummary {
    let is_owner = record.member_id == record.owner_member_id;

    AccountTripSummary {
        id: record.id,
        name: record.name,
        destination_label: record.destination_label,
        start_date: record.start_date,
        end_date: record.end_date,
        role: record.role,
        member_id: record.member_id,
        owner_member_id: record.owner_member_id,
        joined_at: format_timestamp(record.joined_at),
        is_owner,
    }
}

fn account_trip_stats_from_record(record: AccountTripStatsRecord) -> AccountTripStats {
    AccountTripStats {
        trips_total: record.trips_total,
        trips_owned: record.trips_owned,
        active_trips: record.active_trips,
        temp_claims_completed: record.temp_claims_completed,
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn account_trip_insert_error_falls_back_to_database_error() {
        let error = map_account_trip_insert_error(sqlx::Error::RowNotFound);
        assert!(error.to_string().starts_with("database error"));
    }
}
