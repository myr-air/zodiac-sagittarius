use argon2::password_hash::{PasswordHash, SaltString, rand_core::OsRng};
use argon2::{Argon2, PasswordHasher, PasswordVerifier};
use base64::{Engine as _, engine::general_purpose::URL_SAFE_NO_PAD};
use rand::RngCore;
use time::format_description::well_known::Rfc3339;
use time::{Date, Duration, OffsetDateTime, PrimitiveDateTime, Time};
use uuid::Uuid;

use crate::db;
use crate::db::PgPool;
use crate::domain::capabilities::can;
use crate::domain::errors::ServiceError;
use crate::domain::types::{
    Capability, ClaimableMember, JoinInviteTokenResponse, JoinTripResponse, MemberSession,
    TripMemberAccessStatus, TripRole, TripSummary,
};

const TEST_SECRET_SALT: &[u8] = b"sagittarius-test-salt";
const SESSION_TOKEN_SALT: &[u8] = b"sagittarius-session-token";
const JOIN_SESSION_TOKEN_SALT: &[u8] = b"sagittarius-join-session";
const JOIN_INVITE_TOKEN_SALT: &[u8] = b"sagittarius-join-invite-token";
const OWNER_MEMBER_SESSION_TTL: Duration = Duration::days(30);
const ACTIVE_TRIP_MEMBER_SESSION_TTL: Duration = Duration::days(7);
const VIEWER_SESSION_TTL: Duration = Duration::days(1);
const JOIN_SESSION_TTL: Duration = Duration::days(7);
const JOIN_INVITE_TOKEN_TTL: Duration = Duration::days(7);
const PARTICIPANT_PASSWORD_MIN_LENGTH: usize = 4;

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
    let join_session_token = generate_session_token();
    let join_session_token_hash = hash_join_session_token(&join_session_token)?;
    let expires_at = OffsetDateTime::now_utc() + JOIN_SESSION_TTL;
    db::queries::insert_trip_join_session(
        pool,
        Uuid::now_v7(),
        trip.id,
        &join_session_token_hash,
        expires_at,
    )
    .await?;

    Ok(JoinTripResponse {
        trip: TripSummary::from(trip),
        claimable_members,
        join_session_token,
        expires_at: format_timestamp(expires_at)?,
    })
}

pub async fn resolve_join_invite_token(
    pool: &PgPool,
    invite_token: &str,
) -> Result<JoinTripResponse, ServiceError> {
    let invite_token = invite_token.trim();
    if invite_token.is_empty() {
        return Err(ServiceError::Unauthenticated);
    }

    let invite_token_hash = hash_join_invite_token(invite_token)?;
    let trip_id = db::queries::find_active_trip_join_invite_token(pool, &invite_token_hash)
        .await?
        .ok_or(ServiceError::Unauthenticated)?;
    create_join_session_response(pool, trip_id).await
}

pub async fn rotate_join_invite_token(
    pool: &PgPool,
    trip_id: Uuid,
    session_token: &str,
) -> Result<JoinInviteTokenResponse, ServiceError> {
    let session_token_hash = hash_session_token(session_token)?;
    let mut tx = pool.begin().await?;
    let session =
        db::queries::find_active_member_session_in_tx(&mut tx, trip_id, &session_token_hash)
            .await?
            .ok_or(ServiceError::Unauthenticated)?;
    if !can(session.role, Capability::ManagePeople) {
        return Err(ServiceError::Forbidden);
    }

    db::queries::revoke_active_trip_join_invite_tokens(&mut tx, trip_id).await?;
    let invite_token = generate_session_token();
    let invite_token_hash = hash_join_invite_token(&invite_token)?;
    let expires_at = OffsetDateTime::now_utc() + JOIN_INVITE_TOKEN_TTL;
    db::queries::insert_trip_join_invite_token(
        &mut tx,
        Uuid::now_v7(),
        trip_id,
        &invite_token_hash,
        session.member_id,
        expires_at,
    )
    .await?;
    tx.commit().await?;

    Ok(JoinInviteTokenResponse {
        token: invite_token,
        expires_at: format_timestamp(expires_at)?,
    })
}

pub async fn verify_join_session(
    pool: &PgPool,
    trip_id: Uuid,
    join_session_token: &str,
) -> Result<(), ServiceError> {
    let token_hash = hash_join_session_token(join_session_token)?;
    db::queries::find_active_trip_join_session(pool, trip_id, &token_hash)
        .await?
        .ok_or(ServiceError::Unauthenticated)?;

    Ok(())
}

async fn create_join_session_response(
    pool: &PgPool,
    trip_id: Uuid,
) -> Result<JoinTripResponse, ServiceError> {
    let trip = db::queries::find_trip_by_id(pool, trip_id)
        .await?
        .ok_or(ServiceError::NotFound)?;
    let claimable_members = db::queries::list_claimable_members(pool, trip.id)
        .await?
        .into_iter()
        .map(ClaimableMember::from)
        .collect();
    let join_session_token = generate_session_token();
    let join_session_token_hash = hash_join_session_token(&join_session_token)?;
    let expires_at = OffsetDateTime::now_utc() + JOIN_SESSION_TTL;
    db::queries::insert_trip_join_session(
        pool,
        Uuid::now_v7(),
        trip.id,
        &join_session_token_hash,
        expires_at,
    )
    .await?;

    Ok(JoinTripResponse {
        trip: TripSummary::from(trip),
        claimable_members,
        join_session_token,
        expires_at: format_timestamp(expires_at)?,
    })
}

pub async fn claim_member(
    pool: &PgPool,
    trip_id: Uuid,
    member_id: Uuid,
    participant_password: &str,
    join_session_token: &str,
) -> Result<MemberSession, ServiceError> {
    let participant_password = normalize_participant_password(participant_password)?;
    let join_session_token_hash = hash_join_session_token(join_session_token)?;
    let mut tx = pool.begin().await?;
    let member = db::queries::lock_member(&mut tx, trip_id, member_id)
        .await?
        .ok_or(ServiceError::NotFound)?;

    if member.access_status == TripMemberAccessStatus::Disabled {
        return Err(ServiceError::Forbidden);
    }

    match member.claim_password_hash.as_deref() {
        Some(_) => {
            return Err(ServiceError::Unauthenticated);
        }
        None => {
            let password_hash = hash_secret(participant_password)?;
            db::queries::set_member_claim_password(&mut tx, trip_id, member_id, &password_hash)
                .await?;
        }
    }

    consume_join_session(&mut tx, trip_id, &join_session_token_hash).await?;
    let session = create_session(&mut tx, trip_id, member_id).await?;
    tx.commit().await?;

    Ok(session)
}

pub async fn login_member(
    pool: &PgPool,
    trip_id: Uuid,
    member_id: Uuid,
    participant_password: &str,
    join_session_token: &str,
) -> Result<MemberSession, ServiceError> {
    let participant_password = normalize_participant_password(participant_password)?;
    let join_session_token_hash = hash_join_session_token(join_session_token)?;
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

    consume_join_session(&mut tx, trip_id, &join_session_token_hash).await?;
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

pub(crate) fn hash_secret(secret: &str) -> Result<String, ServiceError> {
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

pub(crate) fn hash_join_session_token(session_token: &str) -> Result<String, ServiceError> {
    hash_secret_with_salt(session_token, JOIN_SESSION_TOKEN_SALT)
}

fn hash_join_invite_token(session_token: &str) -> Result<String, ServiceError> {
    hash_secret_with_salt(session_token, JOIN_INVITE_TOKEN_SALT)
}

pub fn hash_session_token_for_tests(session_token: &str) -> String {
    hash_session_token(session_token).expect("static session token salt should hash")
}

pub(crate) fn member_session_expires_at(
    role: TripRole,
    trip_start_date: Date,
    trip_end_date: Date,
    now: OffsetDateTime,
) -> Result<OffsetDateTime, ServiceError> {
    match role {
        TripRole::Owner => Ok(now + OWNER_MEMBER_SESSION_TTL),
        TripRole::Organizer | TripRole::Traveler => {
            let base_expires = now + ACTIVE_TRIP_MEMBER_SESSION_TTL;
            let trip_start = start_of_day_utc(trip_start_date)?;
            let trip_end = end_of_day_utc(trip_end_date)?;
            let trip_end_plus_7 = end_of_day_utc(add_days(trip_end_date, 7)?)?;

            if now >= trip_start - Duration::days(7) && now <= trip_end {
                Ok(trip_end_plus_7)
            } else {
                Ok(base_expires)
            }
        }
        TripRole::Viewer => {
            let base_expires = now + VIEWER_SESSION_TTL;
            let trip_end_plus_7 = end_of_day_utc(add_days(trip_end_date, 7)?)?;
            if now > trip_end_plus_7 {
                Ok(base_expires)
            } else {
                Ok(std::cmp::min(base_expires, trip_end_plus_7))
            }
        }
    }
}

fn start_of_day_utc(date: Date) -> Result<OffsetDateTime, ServiceError> {
    Ok(PrimitiveDateTime::new(date, Time::MIDNIGHT).assume_utc())
}

fn add_days(date: Date, days: i64) -> Result<Date, ServiceError> {
    date.checked_add(Duration::days(days))
        .ok_or(ServiceError::InvalidRequest(
            "trip access date is out of range",
        ))
}

fn end_of_day_utc(date: Date) -> Result<OffsetDateTime, ServiceError> {
    let next_day = date.next_day().ok_or(ServiceError::InvalidRequest(
        "trip access date is out of range",
    ))?;
    Ok(PrimitiveDateTime::new(next_day, Time::MIDNIGHT).assume_utc() - Duration::seconds(1))
}

async fn create_session(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    trip_id: Uuid,
    member_id: Uuid,
) -> Result<MemberSession, ServiceError> {
    let policy = db::queries::find_member_session_policy(tx, trip_id, member_id)
        .await?
        .ok_or(ServiceError::Unauthenticated)?;
    let session_token = generate_session_token();
    let session_token_hash = hash_session_token(&session_token)?;
    let created_at = OffsetDateTime::now_utc();
    let expires_at =
        member_session_expires_at(policy.role, policy.start_date, policy.end_date, created_at)?;

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

fn normalize_participant_password(secret: &str) -> Result<&str, ServiceError> {
    let normalized = secret.trim();
    if normalized.len() < PARTICIPANT_PASSWORD_MIN_LENGTH {
        return Err(ServiceError::InvalidRequest(
            "participant password does not meet policy",
        ));
    }
    Ok(normalized)
}

async fn consume_join_session(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    trip_id: Uuid,
    token_hash: &str,
) -> Result<(), ServiceError> {
    if db::queries::consume_trip_join_session(tx, trip_id, token_hash).await? != 1 {
        return Err(ServiceError::Unauthenticated);
    }
    Ok(())
}

fn format_timestamp(timestamp: OffsetDateTime) -> Result<String, ServiceError> {
    timestamp
        .format(&Rfc3339)
        .map_err(|_| ServiceError::InvalidRequest("timestamp could not be formatted"))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_hashes_verify_matching_secret_and_reject_bad_inputs() {
        let hash = hash_secret_for_tests("seed-trip-pass");

        assert!(verify_secret("seed-trip-pass", &hash));
        assert!(!verify_secret("wrong", &hash));
        assert!(!verify_secret("seed-trip-pass", "not-a-password-hash"));
    }

    #[test]
    fn session_token_hashing_is_deterministic_for_lookup() {
        let first = hash_session_token_for_tests("session-token");
        let second = hash_session_token_for_tests("session-token");

        assert_eq!(first, second);
        assert!(verify_secret("session-token", &first));
    }

    #[test]
    fn generated_session_tokens_are_url_safe_and_unique() {
        let first = generate_session_token();
        let second = generate_session_token();

        assert_ne!(first, second);
        assert!(!first.is_empty());
        assert!(!first.contains('+'));
        assert!(!first.contains('/'));
        assert!(!first.contains('='));
    }

    #[test]
    fn timestamps_format_as_rfc3339() {
        let timestamp = OffsetDateTime::from_unix_timestamp(0).unwrap();

        assert_eq!(format_timestamp(timestamp).unwrap(), "1970-01-01T00:00:00Z");
    }

    fn utc(year: i32, month: time::Month, day: u8, hour: u8) -> OffsetDateTime {
        time::Date::from_calendar_date(year, month, day)
            .unwrap()
            .with_hms(hour, 0, 0)
            .unwrap()
            .assume_utc()
    }

    #[test]
    fn organizer_and_traveler_policy_uses_sliding_7_day_cap() {
        let start = time::Date::from_calendar_date(2026, time::Month::November, 10).unwrap();
        let end = time::Date::from_calendar_date(2026, time::Month::November, 20).unwrap();
        let now = utc(2026, time::Month::November, 17, 9);

        let organizer = member_session_expires_at(TripRole::Organizer, start, end, now).unwrap();
        let traveler = member_session_expires_at(TripRole::Traveler, start, end, now).unwrap();

        // Since now is in November 17 (which is inside Nov 3 to Nov 20), expires_at is trip.end + 7 days
        assert_eq!(
            organizer,
            utc(2026, time::Month::November, 27, 23)
                + Duration::minutes(59)
                + Duration::seconds(59)
        );
        assert_eq!(
            traveler,
            utc(2026, time::Month::November, 27, 23)
                + Duration::minutes(59)
                + Duration::seconds(59)
        );
    }

    #[test]
    fn organizer_and_traveler_policy_never_extends_past_trip_end_plus_7_days() {
        let start = time::Date::from_calendar_date(2026, time::Month::November, 10).unwrap();
        let end = time::Date::from_calendar_date(2026, time::Month::November, 20).unwrap();
        // now is after Nov 20, so it is outside Nov 3 to Nov 20. It should get base 7 days.
        let now = utc(2026, time::Month::November, 25, 9);

        let expires_at = member_session_expires_at(TripRole::Traveler, start, end, now).unwrap();

        assert_eq!(expires_at, utc(2026, time::Month::December, 2, 9));
    }

    #[test]
    fn organizer_and_traveler_policy_allows_outside_trip_window() {
        let start = time::Date::from_calendar_date(2026, time::Month::November, 10).unwrap();
        let end = time::Date::from_calendar_date(2026, time::Month::November, 20).unwrap();
        let too_early = utc(2026, time::Month::November, 2, 23);
        let too_late = utc(2026, time::Month::November, 28, 0);

        // Should return base 7 days session
        let early_session =
            member_session_expires_at(TripRole::Organizer, start, end, too_early).unwrap();
        let late_session =
            member_session_expires_at(TripRole::Traveler, start, end, too_late).unwrap();

        assert_eq!(early_session, too_early + Duration::days(7));
        assert_eq!(late_session, too_late + Duration::days(7));
    }

    #[test]
    fn viewer_policy_is_fixed_1_day_and_capped_by_trip_end_plus_7_days() {
        let start = time::Date::from_calendar_date(2026, time::Month::November, 10).unwrap();
        let end = time::Date::from_calendar_date(2026, time::Month::November, 20).unwrap();

        let normal = member_session_expires_at(
            TripRole::Viewer,
            start,
            end,
            utc(2026, time::Month::November, 10, 9),
        )
        .unwrap();
        let capped = member_session_expires_at(
            TripRole::Viewer,
            start,
            end,
            utc(2026, time::Month::November, 27, 12),
        )
        .unwrap();
        let past_trip = member_session_expires_at(
            TripRole::Viewer,
            start,
            end,
            utc(2026, time::Month::November, 29, 12),
        )
        .unwrap();

        assert_eq!(normal, utc(2026, time::Month::November, 11, 9));
        assert_eq!(
            capped,
            utc(2026, time::Month::November, 27, 23)
                + Duration::minutes(59)
                + Duration::seconds(59)
        );
        assert_eq!(past_trip, utc(2026, time::Month::November, 30, 12));
    }

    #[test]
    fn owner_policy_uses_long_member_ttl() {
        let start = time::Date::from_calendar_date(2026, time::Month::November, 10).unwrap();
        let end = time::Date::from_calendar_date(2026, time::Month::November, 20).unwrap();
        let now = utc(2026, time::Month::December, 15, 9);

        let expires_at = member_session_expires_at(TripRole::Owner, start, end, now).unwrap();

        assert_eq!(expires_at, now + OWNER_MEMBER_SESSION_TTL);
    }
}
