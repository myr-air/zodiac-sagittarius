use base64::{Engine as _, engine::general_purpose::URL_SAFE_NO_PAD};
use p256::ecdsa::signature::Verifier;
use p256::ecdsa::{Signature, VerifyingKey};
use rand::RngCore;
use serde_json::Value;
use sha2::{Digest, Sha256};
use time::format_description::well_known::Rfc3339;
use time::{Duration, OffsetDateTime};
use uuid::Uuid;

use crate::db::models::{
    AccountProfileRecord, AccountTodoRecord, AccountTripRecord, AccountTripStatsRecord,
    AccountVaultItemRecord, NewAccountAuditEvent, NewAccountPlanVariant, NewAccountTrip,
    NewAccountTripOwnerMember, NewAccountVaultItem, NewEmailLoginOutbox, NewTrustedDevice, NewUser,
    NewUserEmail, NewUserSession, PasskeyRecord, TrustedDeviceRecord,
};
use crate::db::{self, PgPool};
use crate::domain::errors::ServiceError;
use crate::domain::types::{
    AccountExplorerSummary, AccountMemberClaimResponse, AccountProfile, AccountSession,
    AccountSessionKind, AccountSettings, AccountTodoSummary, AccountTripCreateResponse,
    AccountTripStats, AccountTripSummary, AccountVaultItemSummary, EmailLoginStartResponse,
    MemberSession, OwnerTransferResponse, PasskeyChallengeResponse, PasskeyCredentialDescriptor,
    PasskeyLoginStartResponse, PasskeySummary, TripMemberAccessStatus, TripRole, TripSummary,
    TrustedDeviceSummary,
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
const MIN_ACCOUNT_PASSWORD_LENGTH: usize = 8;
const MAX_ACCOUNT_PASSWORD_LENGTH: usize = 256;
const MAX_TRUSTED_DEVICE_LABEL_LENGTH: usize = 120;
const MAX_ACCOUNT_DISPLAY_NAME_LENGTH: usize = 80;
const MAX_ACCOUNT_LOCALE_LENGTH: usize = 32;
const MAX_ACCOUNT_TIMEZONE_LENGTH: usize = 64;
const MAX_TRIP_TEXT_LENGTH: usize = 120;
const MAX_JOIN_ID_LENGTH: usize = 32;
const MIN_JOIN_PASSWORD_LENGTH: usize = 8;
const MAX_JOIN_PASSWORD_LENGTH: usize = 256;
const MEMBER_SESSION_TTL: Duration = Duration::days(30);
const DEFAULT_OWNER_COLOR: &str = "#0f766e";
const PASSKEY_ALLOWED_ORIGINS: &[&str] = &["localhost", "127.0.0.1", "0.0.0.0"];
const WEBAUTHN_FLAG_USER_PRESENT: u8 = 0x01;
const WEBAUTHN_FLAG_USER_VERIFIED: u8 = 0x04;
const WEBAUTHN_FLAG_ATTESTED_CREDENTIAL_DATA: u8 = 0x40;

pub struct AccountTripCreateInput {
    pub name: String,
    pub destination_label: String,
    pub countries: Vec<String>,
    pub start_date: time::Date,
    pub end_date: time::Date,
    pub owner_display_name: String,
    pub join_id: String,
    pub join_password: String,
}

pub struct AccountSettingsUpdateInput {
    pub display_name: String,
    pub avatar_color: String,
    pub locale: String,
    pub timezone: String,
}

pub struct AccountVaultItemCreateInput {
    pub trip_id: Option<Uuid>,
    pub kind: String,
    pub title: String,
    pub detail: String,
    pub external_url: Option<String>,
}

pub struct PasskeyRegistrationFinishInput {
    pub challenge_id: Uuid,
    pub credential_id: String,
    pub client_data_json: String,
    pub attestation_object: String,
    pub nickname: String,
}

pub struct PasskeyLoginFinishInput {
    pub challenge_id: Uuid,
    pub credential_id: String,
    pub client_data_json: String,
    pub authenticator_data: String,
    pub signature: String,
    pub trust_device: bool,
    pub device_label: String,
}

pub struct PasswordLoginInput {
    pub flow: PasswordLoginFlow,
    pub email: String,
    pub password: String,
    pub trust_device: bool,
    pub device_label: String,
}

pub enum PasswordLoginFlow {
    Login,
    Register,
}

pub async fn start_email_login(
    pool: &PgPool,
    email_delivery: &crate::app::email::EmailDelivery,
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
            let record = existing.ok_or(ServiceError::Unauthenticated)?;
            if record.disabled_at.is_some() {
                return Err(ServiceError::Forbidden);
            }
            let Some(stored_hash) = record.password_hash else {
                return Err(ServiceError::Unauthenticated);
            };
            if !crate::app::auth::verify_secret(&password, &stored_hash) {
                return Err(ServiceError::Unauthenticated);
            }
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
                let password_hash = crate::app::auth::hash_secret(&password)?;
                db::account_queries::update_user_password_hash(
                    &mut tx,
                    record.user_id,
                    &password_hash,
                )
                .await?;
                record.user_id
            } else {
                let user_id = find_or_create_user(&mut tx, &normalized_email, now).await?;
                let password_hash = crate::app::auth::hash_secret(&password)?;
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

async fn create_user_session(
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
        let trusted_device_id = Uuid::now_v7();
        let label = normalized_device_label(device_label)?;
        db::account_queries::insert_trusted_device(
            tx,
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
    let countries = validate_trip_countries(&input.countries)?;
    let countries_label = countries.join(", ");
    let destination_label = validate_trip_text(
        if input.destination_label.trim().is_empty() {
            &countries_label
        } else {
            &input.destination_label
        },
        "destination label",
    )?;
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
            countries: &countries,
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

pub async fn create_trip_member_session(
    pool: &PgPool,
    session_token: &str,
    trip_id: Uuid,
) -> Result<MemberSession, ServiceError> {
    let user_id = authenticate_user_session(pool, session_token).await?;
    let mut tx = pool.begin().await?;
    let member_id =
        db::account_queries::find_active_account_member_id_in_tx(&mut tx, user_id, trip_id)
            .await?
            .ok_or(ServiceError::Forbidden)?;
    let member_session = create_member_session(&mut tx, trip_id, member_id).await?;

    tx.commit().await?;

    Ok(member_session)
}

pub async fn load_stats(
    pool: &PgPool,
    session_token: &str,
) -> Result<AccountTripStats, ServiceError> {
    let user_id = authenticate_user_session(pool, session_token).await?;
    let stats = db::account_queries::get_account_trip_stats(pool, user_id).await?;

    Ok(account_trip_stats_from_record(stats))
}

pub async fn load_explorer(
    pool: &PgPool,
    session_token: &str,
) -> Result<AccountExplorerSummary, ServiceError> {
    let user_id = authenticate_user_session(pool, session_token).await?;
    let trips = db::account_queries::list_account_trips(pool, user_id).await?;
    let stats = db::account_queries::get_account_trip_stats(pool, user_id).await?;
    let destination_count = trips
        .iter()
        .map(|trip| trip.destination_label.to_lowercase())
        .collect::<std::collections::BTreeSet<_>>()
        .len() as i64;

    Ok(AccountExplorerSummary {
        upcoming_trips: stats.active_trips,
        owned_trips: stats.trips_owned,
        destination_count,
        next_trip: trips.into_iter().next().map(account_trip_from_record),
    })
}

pub async fn list_todos(
    pool: &PgPool,
    session_token: &str,
) -> Result<Vec<AccountTodoSummary>, ServiceError> {
    let user_id = authenticate_user_session(pool, session_token).await?;
    let todos = db::account_queries::list_account_todos(pool, user_id).await?;

    Ok(todos.into_iter().map(account_todo_from_record).collect())
}

pub async fn list_vault_items(
    pool: &PgPool,
    session_token: &str,
) -> Result<Vec<AccountVaultItemSummary>, ServiceError> {
    let user_id = authenticate_user_session(pool, session_token).await?;
    let items = db::account_queries::list_account_vault_items(pool, user_id).await?;

    Ok(items
        .into_iter()
        .map(account_vault_item_from_record)
        .collect())
}

pub async fn create_vault_item(
    pool: &PgPool,
    session_token: &str,
    input: AccountVaultItemCreateInput,
) -> Result<AccountVaultItemSummary, ServiceError> {
    let user_id = authenticate_user_session(pool, session_token).await?;
    let kind = match input.kind.as_str() {
        "note" | "file" => input.kind,
        _ => return Err(ServiceError::InvalidRequest("vault item kind is invalid")),
    };
    let title = validate_trip_text(&input.title, "vault title")?;
    let detail = input.detail.trim().chars().take(2000).collect::<String>();
    let external_url = input
        .external_url
        .as_deref()
        .map(str::trim)
        .filter(|value| !value.is_empty());
    if let Some(trip_id) = input.trip_id {
        let has_membership =
            db::account_queries::account_has_active_trip_membership(pool, user_id, trip_id).await?;
        if !has_membership {
            return Err(ServiceError::Forbidden);
        }
    }
    let record = db::account_queries::insert_account_vault_item(
        pool,
        NewAccountVaultItem {
            id: Uuid::now_v7(),
            user_id,
            trip_id: input.trip_id,
            kind: &kind,
            title: &title,
            detail: &detail,
            external_url,
        },
    )
    .await?;

    Ok(account_vault_item_from_record(record))
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

pub async fn update_settings(
    pool: &PgPool,
    session_token: &str,
    input: AccountSettingsUpdateInput,
) -> Result<AccountSettings, ServiceError> {
    let user_id = authenticate_user_session(pool, session_token).await?;
    let display_name = validate_account_text(
        &input.display_name,
        MAX_ACCOUNT_DISPLAY_NAME_LENGTH,
        "display name is invalid",
    )?;
    let avatar_color = validate_avatar_color(&input.avatar_color)?;
    let locale = validate_account_text(
        &input.locale,
        MAX_ACCOUNT_LOCALE_LENGTH,
        "locale is invalid",
    )?;
    let timezone = validate_account_text(
        &input.timezone,
        MAX_ACCOUNT_TIMEZONE_LENGTH,
        "timezone is invalid",
    )?;

    db::account_queries::update_user_profile(
        pool,
        user_id,
        &display_name,
        &avatar_color,
        &locale,
        &timezone,
    )
    .await?
    .ok_or(ServiceError::Unauthenticated)?;

    load_settings(pool, session_token).await
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

pub async fn finish_passkey_registration(
    pool: &PgPool,
    session_token: &str,
    input: PasskeyRegistrationFinishInput,
) -> Result<PasskeySummary, ServiceError> {
    let session_token_hash = hash_session_token(session_token)?;
    let now = OffsetDateTime::now_utc();
    let mut tx = pool.begin().await?;
    let user_id = db::account_queries::find_active_user_session_in_tx(&mut tx, &session_token_hash)
        .await?
        .ok_or(ServiceError::Unauthenticated)?
        .user_id;
    let (_, expected_challenge) =
        db::account_queries::lock_webauthn_challenge(&mut tx, input.challenge_id, "register", now)
            .await?
            .filter(|(challenge_user_id, _)| *challenge_user_id == user_id)
            .ok_or(ServiceError::Unauthenticated)?;

    let origin = verify_client_data_json(
        &input.client_data_json,
        "webauthn.create",
        &expected_challenge,
    )?;
    let credential_public_key =
        parse_registration_attestation(&input.attestation_object, &input.credential_id, &origin)?;
    let nickname = validate_account_text(&input.nickname, 80, "passkey nickname is invalid")?;
    let credential_record_id = Uuid::now_v7();
    db::account_queries::insert_webauthn_credential(
        &mut tx,
        credential_record_id,
        user_id,
        &input.credential_id,
        serde_json::json!({
            "alg": "ES256",
            "coseKey": URL_SAFE_NO_PAD.encode(&credential_public_key),
        }),
        &nickname,
    )
    .await
    .map_err(map_passkey_insert_error)?;
    db::account_queries::consume_webauthn_challenge(&mut tx, input.challenge_id, now).await?;
    tx.commit().await?;

    Ok(PasskeySummary {
        id: credential_record_id,
        nickname,
        created_at: format_timestamp(now),
        last_used_at: None,
    })
}

pub async fn start_passkey_login(
    pool: &PgPool,
    email: &str,
) -> Result<PasskeyLoginStartResponse, ServiceError> {
    let normalized_email = normalize_email(email)?;
    let (user_id, credential_ids) =
        db::account_queries::list_passkey_credential_ids_for_email(pool, &normalized_email)
            .await?
            .filter(|(_, credential_ids)| !credential_ids.is_empty())
            .ok_or(ServiceError::Unauthenticated)?;
    let challenge_id = Uuid::now_v7();
    let challenge = generate_secure_token();
    let expires_at = OffsetDateTime::now_utc() + PASSKEY_CHALLENGE_TTL;

    db::account_queries::insert_webauthn_challenge(
        pool,
        challenge_id,
        user_id,
        &challenge,
        "login",
        expires_at,
    )
    .await?;

    Ok(PasskeyLoginStartResponse {
        challenge_id,
        challenge,
        expires_at: format_timestamp(expires_at),
        allow_credentials: credential_ids
            .into_iter()
            .map(|credential_id| PasskeyCredentialDescriptor { credential_id })
            .collect(),
    })
}

pub async fn finish_passkey_login(
    pool: &PgPool,
    input: PasskeyLoginFinishInput,
) -> Result<AccountSession, ServiceError> {
    let now = OffsetDateTime::now_utc();
    let mut tx = pool.begin().await?;
    let (challenge_user_id, expected_challenge) =
        db::account_queries::lock_webauthn_challenge(&mut tx, input.challenge_id, "login", now)
            .await?
            .ok_or(ServiceError::Unauthenticated)?;
    let credential = db::account_queries::lock_passkey_credential(&mut tx, &input.credential_id)
        .await?
        .filter(|credential| credential.user_id == challenge_user_id)
        .ok_or(ServiceError::Unauthenticated)?;
    db::account_queries::lock_active_user(&mut tx, credential.user_id)
        .await?
        .ok_or(ServiceError::Unauthenticated)?;

    let origin =
        verify_client_data_json(&input.client_data_json, "webauthn.get", &expected_challenge)?;
    let authenticator_data = decode_base64url(&input.authenticator_data)?;
    verify_authenticator_data(&authenticator_data, &origin, false)?;
    let signature = decode_base64url(&input.signature)?;
    let sign_count = parse_authenticator_sign_count(&authenticator_data)?;
    verify_passkey_signature(
        &credential.public_key,
        &authenticator_data,
        &input.client_data_json,
        &signature,
    )?;
    if credential.sign_count > 0 && sign_count <= credential.sign_count {
        return Err(ServiceError::Unauthenticated);
    }

    db::account_queries::update_passkey_credential_usage(
        &mut tx,
        &credential.credential_id,
        sign_count,
        now,
    )
    .await?;
    db::account_queries::consume_webauthn_challenge(&mut tx, input.challenge_id, now).await?;
    let session = create_user_session(
        &mut tx,
        credential.user_id,
        input.trust_device,
        &input.device_label,
        now,
    )
    .await?;
    tx.commit().await?;

    Ok(session)
}

pub async fn revoke_trusted_device(
    pool: &PgPool,
    session_token: &str,
    trusted_device_id: Uuid,
) -> Result<(), ServiceError> {
    let user_id = authenticate_user_session(pool, session_token).await?;
    let rows =
        db::account_queries::revoke_trusted_device_for_user(pool, user_id, trusted_device_id)
            .await?;
    if rows == 0 {
        return Err(ServiceError::NotFound);
    }

    Ok(())
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

fn validate_trip_countries(countries: &[String]) -> Result<Vec<String>, ServiceError> {
    let mut normalized = Vec::new();
    for country in countries {
        let trimmed = validate_trip_text(country, "country")?;
        if !normalized.iter().any(|existing: &String| existing.eq_ignore_ascii_case(&trimmed)) {
            normalized.push(trimmed);
        }
    }
    if normalized.is_empty() || normalized.len() > 12 {
        return Err(ServiceError::InvalidRequest("countries"));
    }
    Ok(normalized)
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

fn validate_account_password(password: &str) -> Result<String, ServiceError> {
    let trimmed = password.trim();
    if trimmed.len() < MIN_ACCOUNT_PASSWORD_LENGTH || trimmed.len() > MAX_ACCOUNT_PASSWORD_LENGTH {
        return Err(ServiceError::InvalidRequest("password is invalid"));
    }

    Ok(trimmed.to_string())
}

fn map_account_trip_insert_error(error: sqlx::Error) -> ServiceError {
    let duplicate_join_id = is_unique_violation_on_constraint(&error, "trips_join_id_key");
    let database_error = ServiceError::Database(error);
    duplicate_join_id
        .then_some(ServiceError::TripJoinIdAlreadyExists)
        .unwrap_or(database_error)
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

fn validate_account_text(
    value: &str,
    max_length: usize,
    field: &'static str,
) -> Result<String, ServiceError> {
    let trimmed = value.trim();
    if trimmed.is_empty() || trimmed.chars().count() > max_length {
        return Err(ServiceError::InvalidRequest(field));
    }

    Ok(trimmed.to_string())
}

fn validate_avatar_color(value: &str) -> Result<String, ServiceError> {
    let trimmed = value.trim();
    let bytes = trimmed.as_bytes();
    if bytes.len() == 7
        && bytes[0] == b'#'
        && bytes[1..].iter().all(|byte| byte.is_ascii_hexdigit())
    {
        return Ok(trimmed.to_ascii_lowercase());
    }

    Err(ServiceError::InvalidRequest("avatar color is invalid"))
}

fn verify_client_data_json(
    encoded_client_data_json: &str,
    expected_type: &str,
    expected_challenge: &str,
) -> Result<String, ServiceError> {
    let client_data_json = decode_base64url(encoded_client_data_json)?;
    let value: Value = serde_json::from_slice(&client_data_json)
        .map_err(|_| ServiceError::InvalidRequest("client data json is invalid"))?;
    let challenge =
        value
            .get("challenge")
            .and_then(Value::as_str)
            .ok_or(ServiceError::InvalidRequest(
                "client data challenge is invalid",
            ))?;
    let credential_type = value
        .get("type")
        .and_then(Value::as_str)
        .ok_or(ServiceError::InvalidRequest("client data type is invalid"))?;
    let origin =
        value
            .get("origin")
            .and_then(Value::as_str)
            .ok_or(ServiceError::InvalidRequest(
                "client data origin is invalid",
            ))?;
    if challenge != expected_challenge || credential_type != expected_type {
        return Err(ServiceError::Unauthenticated);
    }
    if allowed_passkey_origin(origin).is_none() {
        return Err(ServiceError::Unauthenticated);
    }

    Ok(origin.to_string())
}

fn parse_registration_attestation(
    encoded_attestation_object: &str,
    expected_credential_id: &str,
    origin: &str,
) -> Result<Vec<u8>, ServiceError> {
    let attestation_object = decode_base64url(encoded_attestation_object)?;
    let value: serde_cbor::Value = serde_cbor::from_slice(&attestation_object)
        .map_err(|_| ServiceError::InvalidRequest("attestation object is invalid"))?;
    let auth_data = cbor_map_text_bytes(&value, "authData").ok_or(ServiceError::InvalidRequest(
        "authenticator data is invalid",
    ))?;
    parse_registration_authenticator_data(auth_data, expected_credential_id, origin)
}

fn parse_registration_authenticator_data(
    auth_data: &[u8],
    expected_credential_id: &str,
    origin: &str,
) -> Result<Vec<u8>, ServiceError> {
    const ATTESTED_CREDENTIAL_DATA_OFFSET: usize = 37;
    const AAGUID_LENGTH: usize = 16;
    verify_authenticator_data(auth_data, origin, true)?;
    if auth_data.len() < ATTESTED_CREDENTIAL_DATA_OFFSET + AAGUID_LENGTH + 2 {
        return Err(ServiceError::InvalidRequest(
            "authenticator data is invalid",
        ));
    }

    let credential_length_offset = ATTESTED_CREDENTIAL_DATA_OFFSET + AAGUID_LENGTH;
    let credential_id_length = u16::from_be_bytes([
        auth_data[credential_length_offset],
        auth_data[credential_length_offset + 1],
    ]) as usize;
    let credential_id_offset = credential_length_offset + 2;
    let credential_public_key_offset = credential_id_offset + credential_id_length;
    if auth_data.len() <= credential_public_key_offset {
        return Err(ServiceError::InvalidRequest(
            "authenticator data is invalid",
        ));
    }

    let credential_id =
        URL_SAFE_NO_PAD.encode(&auth_data[credential_id_offset..credential_public_key_offset]);
    if credential_id != expected_credential_id {
        return Err(ServiceError::Unauthenticated);
    }
    let credential_public_key = auth_data[credential_public_key_offset..].to_vec();
    cose_es256_verifying_key(&credential_public_key)?;

    Ok(credential_public_key)
}

fn parse_authenticator_sign_count(authenticator_data: &[u8]) -> Result<i64, ServiceError> {
    if authenticator_data.len() < 37 {
        return Err(ServiceError::InvalidRequest(
            "authenticator data is invalid",
        ));
    }
    Ok(u32::from_be_bytes([
        authenticator_data[33],
        authenticator_data[34],
        authenticator_data[35],
        authenticator_data[36],
    ]) as i64)
}

fn verify_authenticator_data(
    authenticator_data: &[u8],
    origin: &str,
    require_attested_credential_data: bool,
) -> Result<(), ServiceError> {
    if authenticator_data.len() < 37 {
        return Err(ServiceError::InvalidRequest(
            "authenticator data is invalid",
        ));
    }
    let rp_id = allowed_passkey_origin(origin).ok_or(ServiceError::Unauthenticated)?;
    let expected_rp_id_hash = Sha256::digest(rp_id.as_bytes());
    if authenticator_data[..32] != expected_rp_id_hash[..] {
        return Err(ServiceError::Unauthenticated);
    }
    let flags = authenticator_data[32];
    if flags & WEBAUTHN_FLAG_USER_PRESENT == 0 {
        return Err(ServiceError::Unauthenticated);
    }
    if flags & WEBAUTHN_FLAG_USER_VERIFIED == 0 {
        return Err(ServiceError::Unauthenticated);
    }
    if require_attested_credential_data && flags & WEBAUTHN_FLAG_ATTESTED_CREDENTIAL_DATA == 0 {
        return Err(ServiceError::Unauthenticated);
    }

    Ok(())
}

fn allowed_passkey_origin(origin: &str) -> Option<String> {
    let (scheme, rest) = origin.split_once("://")?;
    if scheme != "http" && scheme != "https" {
        return None;
    }
    let host = rest.split('/').next().unwrap_or("");
    let host = host.split(':').next().unwrap_or(host).to_ascii_lowercase();
    if host.is_empty() {
        return None;
    }

    let allowed = std::env::var("PASSKEY_ALLOWED_ORIGINS")
        .map(|value| {
            value
                .split(',')
                .map(|entry| entry.trim().to_ascii_lowercase())
                .filter(|entry| !entry.is_empty())
                .collect::<Vec<_>>()
        })
        .unwrap_or_else(|_| {
            PASSKEY_ALLOWED_ORIGINS
                .iter()
                .copied()
                .map(ToString::to_string)
                .collect::<Vec<_>>()
        });

    let wildcard_allowed = allowed.iter().any(|entry| entry == "*" || entry == &host);
    let subdomain_allowed = allowed.iter().any(|entry| {
        entry.starts_with("*.")
            && host.ends_with(&entry["*.".len()..])
            && host.len() > entry.len() - 2
    });

    (wildcard_allowed || subdomain_allowed).then_some(host)
}

fn verify_passkey_signature(
    public_key: &Value,
    authenticator_data: &[u8],
    encoded_client_data_json: &str,
    signature: &[u8],
) -> Result<(), ServiceError> {
    let cose_key =
        public_key
            .get("coseKey")
            .and_then(Value::as_str)
            .ok_or(ServiceError::InvalidRequest(
                "passkey public key is invalid",
            ))?;
    let verifying_key = cose_es256_verifying_key(&decode_base64url(cose_key)?)?;
    let client_data_json = decode_base64url(encoded_client_data_json)?;
    let client_data_hash = Sha256::digest(client_data_json);
    let mut signed_data = Vec::with_capacity(authenticator_data.len() + client_data_hash.len());
    signed_data.extend_from_slice(authenticator_data);
    signed_data.extend_from_slice(&client_data_hash);
    let signature = Signature::from_der(signature).map_err(|_| ServiceError::Unauthenticated)?;
    verifying_key
        .verify(&signed_data, &signature)
        .map_err(|_| ServiceError::Unauthenticated)
}

fn cose_es256_verifying_key(cose_key: &[u8]) -> Result<VerifyingKey, ServiceError> {
    let value: serde_cbor::Value = serde_cbor::from_slice(cose_key)
        .map_err(|_| ServiceError::InvalidRequest("passkey public key is invalid"))?;
    let x = cbor_map_int_bytes(&value, -2)
        .filter(|bytes| bytes.len() == 32)
        .ok_or(ServiceError::InvalidRequest(
            "passkey public key is invalid",
        ))?;
    let y = cbor_map_int_bytes(&value, -3)
        .filter(|bytes| bytes.len() == 32)
        .ok_or(ServiceError::InvalidRequest(
            "passkey public key is invalid",
        ))?;
    if cbor_map_int_integer(&value, 1) != Some(2)
        || cbor_map_int_integer(&value, 3) != Some(-7)
        || cbor_map_int_integer(&value, -1) != Some(1)
    {
        return Err(ServiceError::InvalidRequest(
            "passkey public key is invalid",
        ));
    }
    let mut sec1 = Vec::with_capacity(65);
    sec1.push(0x04);
    sec1.extend_from_slice(x);
    sec1.extend_from_slice(y);

    VerifyingKey::from_sec1_bytes(&sec1)
        .map_err(|_| ServiceError::InvalidRequest("passkey public key is invalid"))
}

fn cbor_map_text_bytes<'a>(value: &'a serde_cbor::Value, key: &str) -> Option<&'a [u8]> {
    let serde_cbor::Value::Map(map) = value else {
        return None;
    };
    map.iter().find_map(|(candidate_key, candidate_value)| {
        if matches!(candidate_key, serde_cbor::Value::Text(text) if text == key) {
            if let serde_cbor::Value::Bytes(bytes) = candidate_value {
                Some(bytes.as_slice())
            } else {
                None
            }
        } else {
            None
        }
    })
}

fn cbor_map_int_bytes(value: &serde_cbor::Value, key: i128) -> Option<&[u8]> {
    let serde_cbor::Value::Map(map) = value else {
        return None;
    };
    map.iter().find_map(|(candidate_key, candidate_value)| {
        if matches!(candidate_key, serde_cbor::Value::Integer(integer) if *integer == key) {
            if let serde_cbor::Value::Bytes(bytes) = candidate_value {
                Some(bytes.as_slice())
            } else {
                None
            }
        } else {
            None
        }
    })
}

fn cbor_map_int_integer(value: &serde_cbor::Value, key: i128) -> Option<i128> {
    let serde_cbor::Value::Map(map) = value else {
        return None;
    };
    map.iter().find_map(|(candidate_key, candidate_value)| {
        if matches!(candidate_key, serde_cbor::Value::Integer(integer) if *integer == key) {
            if let serde_cbor::Value::Integer(integer) = candidate_value {
                Some(*integer)
            } else {
                None
            }
        } else {
            None
        }
    })
}

fn decode_base64url(value: &str) -> Result<Vec<u8>, ServiceError> {
    URL_SAFE_NO_PAD
        .decode(value)
        .map_err(|_| ServiceError::InvalidRequest("base64url value is invalid"))
}

fn map_passkey_insert_error(error: sqlx::Error) -> ServiceError {
    let duplicate_passkey =
        is_unique_violation_on_constraint(&error, "webauthn_credentials_credential_id_idx");
    duplicate_passkey
        .then_some(ServiceError::InvalidRequest(
            "passkey credential already exists",
        ))
        .unwrap_or(ServiceError::Database(error))
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
        countries: record.countries,
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

fn account_todo_from_record(record: AccountTodoRecord) -> AccountTodoSummary {
    AccountTodoSummary {
        id: record.id,
        trip_id: record.trip_id,
        trip_name: record.trip_name,
        title: record.title,
        status: record.status,
        visibility: record.visibility,
        kind: record.kind,
        assignee_id: record.assignee_id,
        related_item_id: record.related_item_id,
        version: record.version,
    }
}

fn account_vault_item_from_record(record: AccountVaultItemRecord) -> AccountVaultItemSummary {
    AccountVaultItemSummary {
        id: record.id,
        trip_id: record.trip_id,
        trip_name: record.trip_name,
        kind: record.kind,
        title: record.title,
        detail: record.detail,
        external_url: record.external_url,
        source: record.source,
        created_at: format_timestamp(record.created_at),
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
    use p256::ecdsa::SigningKey;
    use sqlx::error::{DatabaseError, ErrorKind};
    use std::borrow::Cow;
    use std::collections::BTreeMap;
    use std::env;
    use std::error::Error;
    use std::fmt;
    use std::panic::{self, AssertUnwindSafe};
    use std::sync::Mutex;

    static PASSKEY_ORIGIN_ALLOWLIST_MUTEX: Mutex<()> = Mutex::new(());

    #[test]
    fn account_trip_insert_error_falls_back_to_database_error() {
        let error = map_account_trip_insert_error(sqlx::Error::RowNotFound);
        assert!(error.to_string().starts_with("database error"));
    }

    #[test]
    fn account_trip_insert_error_maps_duplicate_join_id() {
        let error = map_account_trip_insert_error(unique_database_error("trips_join_id_key"));
        assert!(matches!(error, ServiceError::TripJoinIdAlreadyExists));
    }

    #[test]
    fn passkey_insert_error_falls_back_to_database_error() {
        let error = map_passkey_insert_error(sqlx::Error::RowNotFound);
        assert!(error.to_string().starts_with("database error"));
    }

    #[test]
    fn passkey_insert_error_maps_duplicate_credential() {
        let error = map_passkey_insert_error(unique_database_error(
            "webauthn_credentials_credential_id_idx",
        ));
        assert!(matches!(
            error,
            ServiceError::InvalidRequest("passkey credential already exists")
        ));
    }

    #[test]
    fn fake_database_error_exposes_sqlx_database_error_contract() {
        let mut error = FakeDatabaseError {
            constraint: "constraint_name",
        };

        assert_eq!(error.message(), "fake unique violation");
        assert_eq!(error.code().as_deref(), Some("23505"));
        assert_eq!(error.constraint(), Some("constraint_name"));
        assert_eq!(error.kind(), ErrorKind::UniqueViolation);
        assert_eq!(error.as_error().to_string(), "fake unique violation");
        assert_eq!(error.as_error_mut().to_string(), "fake unique violation");
        assert_eq!(
            Box::new(error).into_error().to_string(),
            "fake unique violation"
        );
    }

    fn with_passkey_origin_allowlist<R>(value: &str, test: impl FnOnce() -> R) -> R {
        let _guard = PASSKEY_ORIGIN_ALLOWLIST_MUTEX.lock().unwrap();
        let previous = env::var("PASSKEY_ALLOWED_ORIGINS").ok();
        // SAFETY: test code is single-threaded and the process-wide env is restored before returning.
        unsafe {
            env::set_var("PASSKEY_ALLOWED_ORIGINS", value);
        }
        let result = panic::catch_unwind(AssertUnwindSafe(test));
        match previous {
            Some(raw) => {
                // SAFETY: restoring the env is intentionally scoped to this test helper.
                unsafe {
                    env::set_var("PASSKEY_ALLOWED_ORIGINS", raw);
                }
            }
            None => {
                // SAFETY: restoring the env is intentionally scoped to this test helper.
                unsafe {
                    env::remove_var("PASSKEY_ALLOWED_ORIGINS");
                }
            }
        }
        match result {
            Ok(value) => value,
            Err(payload) => panic::resume_unwind(payload),
        }
    }

    #[test]
    fn passkey_origin_uses_explicit_allowed_origins() {
        with_passkey_origin_allowlist("example.com,127.0.0.1", || {
            assert_eq!(
                allowed_passkey_origin("https://example.com:5180/path"),
                Some("example.com".to_string())
            );
            assert_eq!(
                allowed_passkey_origin("http://127.0.0.1:5180"),
                Some("127.0.0.1".to_string())
            );
            assert_eq!(allowed_passkey_origin("https://localhost:5180"), None);
        });
    }

    #[test]
    fn passkey_origin_respects_subdomain_wildcards() {
        with_passkey_origin_allowlist("*.example.test,localhost", || {
            assert_eq!(
                allowed_passkey_origin("https://foo.example.test"),
                Some("foo.example.test".to_string())
            );
            assert_eq!(allowed_passkey_origin("https://example.test"), None);
        });
    }

    #[test]
    fn passkey_origin_rejects_invalid_or_empty_values() {
        with_passkey_origin_allowlist("", || {
            assert_eq!(allowed_passkey_origin("https://localhost:5180"), None);
            assert_eq!(allowed_passkey_origin("ftp://127.0.0.1:5180"), None);
            assert_eq!(allowed_passkey_origin("localhost"), None);
        });
    }

    #[test]
    fn passkey_authenticator_data_validation_accepts_valid_registration() {
        let signing_key = SigningKey::from_slice(&[7; 32]).unwrap();
        let credential_id = b"unit-passkey-credential";
        let mut auth_data = passkey_authenticator_data(8, 0x45);
        auth_data.extend_from_slice(&[0; 16]);
        auth_data.extend_from_slice(&(credential_id.len() as u16).to_be_bytes());
        auth_data.extend_from_slice(credential_id);
        auth_data.extend_from_slice(&cose_key(&signing_key));
        let encoded_credential_id = URL_SAFE_NO_PAD.encode(credential_id);

        assert_eq!(
            parse_registration_authenticator_data(
                &auth_data,
                &encoded_credential_id,
                "http://localhost:5180",
            )
            .unwrap(),
            cose_key(&signing_key)
        );
        assert_eq!(parse_authenticator_sign_count(&auth_data).unwrap(), 8);
    }

    #[test]
    fn passkey_authenticator_data_validation_rejects_wrong_rp_and_flags() {
        assert!(
            verify_authenticator_data(
                &passkey_authenticator_data(0, 0x05),
                "https://evil.example.test",
                false,
            )
            .is_err()
        );
        assert!(
            verify_authenticator_data(
                &passkey_authenticator_data(0, 0x05),
                "http://127.0.0.1:5180",
                false,
            )
            .is_err()
        );
        assert!(
            verify_authenticator_data(
                &passkey_authenticator_data(0, 0x04),
                "http://localhost:5180",
                false,
            )
            .is_err()
        );
        assert!(
            verify_authenticator_data(
                &passkey_authenticator_data(0, 0x01),
                "http://localhost:5180",
                true,
            )
            .is_err()
        );
        assert!(
            verify_authenticator_data(
                &passkey_authenticator_data(0, 0x41),
                "http://localhost:5180",
                true,
            )
            .is_err()
        );
    }

    #[test]
    fn passkey_authenticator_data_validation_covers_malformed_shapes() {
        assert!(parse_authenticator_sign_count(&[0; 36]).is_err());
        assert!(verify_authenticator_data(&[0; 36], "http://localhost:5180", false).is_err());

        let mut short_registration = passkey_authenticator_data(0, 0x45);
        assert!(
            parse_registration_authenticator_data(
                &short_registration,
                "credential",
                "http://localhost:5180",
            )
            .is_err()
        );

        short_registration.extend_from_slice(&[0; 16]);
        short_registration.extend_from_slice(&1_u16.to_be_bytes());
        assert!(
            parse_registration_authenticator_data(
                &short_registration,
                "credential",
                "http://localhost:5180",
            )
            .is_err()
        );

        short_registration.push(b'x');
        short_registration.push(0);
        assert!(
            parse_registration_authenticator_data(
                &short_registration,
                "different",
                "http://localhost:5180",
            )
            .is_err()
        );
    }

    #[test]
    fn passkey_cbor_helpers_handle_non_maps_and_values() {
        let not_map = serde_cbor::Value::Bool(false);
        assert!(cbor_map_text_bytes(&not_map, "authData").is_none());
        assert!(cbor_map_int_bytes(&not_map, -2).is_none());
        assert!(cbor_map_int_integer(&not_map, 1).is_none());

        let map = serde_cbor::Value::Map(
            [
                (
                    serde_cbor::Value::Text("authData".to_string()),
                    serde_cbor::Value::Bytes(vec![1, 2, 3]),
                ),
                (
                    serde_cbor::Value::Integer(-2),
                    serde_cbor::Value::Bytes(vec![4, 5, 6]),
                ),
                (serde_cbor::Value::Integer(1), serde_cbor::Value::Integer(2)),
            ]
            .into_iter()
            .collect(),
        );
        assert_eq!(
            cbor_map_text_bytes(&map, "authData"),
            Some([1, 2, 3].as_slice())
        );
        assert_eq!(cbor_map_int_bytes(&map, -2), Some([4, 5, 6].as_slice()));
        assert_eq!(cbor_map_int_integer(&map, 1), Some(2));

        let wrong_value_types = serde_cbor::Value::Map(
            [
                (
                    serde_cbor::Value::Text("authData".to_string()),
                    serde_cbor::Value::Integer(1),
                ),
                (
                    serde_cbor::Value::Integer(-2),
                    serde_cbor::Value::Integer(2),
                ),
                (
                    serde_cbor::Value::Integer(1),
                    serde_cbor::Value::Bytes(vec![3]),
                ),
            ]
            .into_iter()
            .collect(),
        );
        assert!(cbor_map_text_bytes(&wrong_value_types, "authData").is_none());
        assert!(cbor_map_int_bytes(&wrong_value_types, -2).is_none());
        assert!(cbor_map_int_integer(&wrong_value_types, 1).is_none());
    }

    fn passkey_authenticator_data(sign_count: u32, flags: u8) -> Vec<u8> {
        let mut auth_data = vec![0; 37];
        auth_data[..32].copy_from_slice(&Sha256::digest(b"localhost"));
        auth_data[32] = flags;
        auth_data[33..37].copy_from_slice(&sign_count.to_be_bytes());
        auth_data
    }

    fn cose_key(signing_key: &SigningKey) -> Vec<u8> {
        let encoded_point = signing_key.verifying_key().to_encoded_point(false);
        let mut map = BTreeMap::new();
        map.insert(serde_cbor::Value::Integer(1), serde_cbor::Value::Integer(2));
        map.insert(
            serde_cbor::Value::Integer(3),
            serde_cbor::Value::Integer(-7),
        );
        map.insert(
            serde_cbor::Value::Integer(-1),
            serde_cbor::Value::Integer(1),
        );
        map.insert(
            serde_cbor::Value::Integer(-2),
            serde_cbor::Value::Bytes(encoded_point.x().unwrap().to_vec()),
        );
        map.insert(
            serde_cbor::Value::Integer(-3),
            serde_cbor::Value::Bytes(encoded_point.y().unwrap().to_vec()),
        );
        serde_cbor::to_vec(&serde_cbor::Value::Map(map)).unwrap()
    }

    fn unique_database_error(constraint: &'static str) -> sqlx::Error {
        sqlx::Error::Database(Box::new(FakeDatabaseError { constraint }))
    }

    #[derive(Debug)]
    struct FakeDatabaseError {
        constraint: &'static str,
    }

    impl fmt::Display for FakeDatabaseError {
        fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
            formatter.write_str("fake unique violation")
        }
    }

    impl Error for FakeDatabaseError {}

    impl DatabaseError for FakeDatabaseError {
        fn message(&self) -> &str {
            "fake unique violation"
        }

        fn code(&self) -> Option<Cow<'_, str>> {
            Some(Cow::Borrowed("23505"))
        }

        fn as_error(&self) -> &(dyn Error + Send + Sync + 'static) {
            self
        }

        fn as_error_mut(&mut self) -> &mut (dyn Error + Send + Sync + 'static) {
            self
        }

        fn into_error(self: Box<Self>) -> Box<dyn Error + Send + Sync + 'static> {
            self
        }

        fn constraint(&self) -> Option<&str> {
            Some(self.constraint)
        }

        fn kind(&self) -> ErrorKind {
            ErrorKind::UniqueViolation
        }
    }
}
