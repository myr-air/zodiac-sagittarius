use argon2::password_hash::{PasswordHash, SaltString, rand_core::OsRng};
use argon2::{Argon2, PasswordHasher, PasswordVerifier};
use base64::{Engine as _, engine::general_purpose::URL_SAFE_NO_PAD};
use rand::RngCore;
use time::format_description::well_known::Rfc3339;
use time::{Duration, OffsetDateTime};
use uuid::Uuid;

use crate::db;
use crate::db::PgPool;
use crate::domain::errors::ServiceError;
use crate::domain::types::{
    ClaimableMember, JoinTripResponse, MemberSession, TripMemberAccessStatus, TripSummary,
};

const TEST_SECRET_SALT: &[u8] = b"sagittarius-test-salt";
const SESSION_TOKEN_SALT: &[u8] = b"sagittarius-session-token";
const SESSION_TTL: Duration = Duration::days(30);

pub fn hash_secret_for_tests(secret: &str) -> String {
    hash_secret_with_salt(secret, TEST_SECRET_SALT).expect("static test salt should hash")
}

pub fn verify_secret(secret: &str, hash: &str) -> bool {
    let Ok(parsed_hash) = PasswordHash::new(hash) else {
        return false;
    };

    Argon2::default()
        .verify_password(secret.as_bytes(), &parsed_hash)
        .is_ok()
}

pub async fn join_trip(
    pool: &PgPool,
    join_id: &str,
    trip_password: &str,
) -> Result<JoinTripResponse, ServiceError> {
    let normalized_join_id = join_id.trim().to_ascii_uppercase();
    let trip = db::queries::find_trip_by_join_id(pool, &normalized_join_id)
        .await?
        .ok_or(ServiceError::NotFound)?;

    if !verify_secret(trip_password, &trip.join_password_hash) {
        return Err(ServiceError::Unauthenticated);
    }

    let claimable_members = db::queries::list_claimable_members(pool, trip.id)
        .await?
        .into_iter()
        .map(ClaimableMember::from)
        .collect();

    Ok(JoinTripResponse {
        trip: TripSummary::from(trip),
        claimable_members,
    })
}

pub async fn claim_member(
    pool: &PgPool,
    trip_id: Uuid,
    member_id: Uuid,
    participant_password: &str,
) -> Result<MemberSession, ServiceError> {
    let mut tx = pool.begin().await?;
    let member = db::queries::lock_member(&mut tx, trip_id, member_id)
        .await?
        .ok_or(ServiceError::NotFound)?;

    if member.access_status == TripMemberAccessStatus::Disabled {
        return Err(ServiceError::Forbidden);
    }

    match member.claim_password_hash.as_deref() {
        Some(_) => {
            return Err(ServiceError::InvalidRequest(
                "member has already been claimed",
            ));
        }
        None => {
            let password_hash = hash_secret(participant_password)?;
            db::queries::set_member_claim_password(&mut tx, trip_id, member_id, &password_hash)
                .await?;
        }
    }

    let session = create_session(&mut tx, trip_id, member_id).await?;
    tx.commit().await?;

    Ok(session)
}

pub async fn login_member(
    pool: &PgPool,
    trip_id: Uuid,
    member_id: Uuid,
    participant_password: &str,
) -> Result<MemberSession, ServiceError> {
    let mut tx = pool.begin().await?;
    let member = db::queries::lock_member(&mut tx, trip_id, member_id)
        .await?
        .ok_or(ServiceError::NotFound)?;

    if member.access_status == TripMemberAccessStatus::Disabled {
        return Err(ServiceError::Forbidden);
    }

    let password_hash = member
        .claim_password_hash
        .as_deref()
        .ok_or(ServiceError::Unauthenticated)?;

    if !verify_secret(participant_password, password_hash) {
        return Err(ServiceError::Unauthenticated);
    }

    let session = create_session(&mut tx, trip_id, member_id).await?;
    tx.commit().await?;

    Ok(session)
}

pub async fn logout_session(
    pool: &PgPool,
    trip_id: Uuid,
    session_token: Option<&str>,
) -> Result<(), ServiceError> {
    let Some(session_token) = session_token else {
        return Ok(());
    };

    let token_hash = hash_session_token(session_token)?;
    db::queries::revoke_member_session(pool, trip_id, &token_hash).await?;

    Ok(())
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

fn generate_session_token() -> String {
    let mut bytes = [0u8; 32];
    rand::rng().fill_bytes(&mut bytes);
    URL_SAFE_NO_PAD.encode(bytes)
}

pub(crate) fn hash_session_token(session_token: &str) -> Result<String, ServiceError> {
    hash_secret_with_salt(session_token, SESSION_TOKEN_SALT)
}

pub fn hash_session_token_for_tests(session_token: &str) -> String {
    hash_session_token(session_token).expect("static session token salt should hash")
}

async fn create_session(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    trip_id: Uuid,
    member_id: Uuid,
) -> Result<MemberSession, ServiceError> {
    let session_token = generate_session_token();
    let session_token_hash = hash_session_token(&session_token)?;
    let created_at = OffsetDateTime::now_utc();
    let expires_at = created_at + SESSION_TTL;

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
        created_at: format_timestamp(created_at)?,
        expires_at: format_timestamp(expires_at)?,
    })
}

fn format_timestamp(timestamp: OffsetDateTime) -> Result<String, ServiceError> {
    timestamp
        .format(&Rfc3339)
        .map_err(|_| ServiceError::InvalidRequest("timestamp could not be formatted"))
}
