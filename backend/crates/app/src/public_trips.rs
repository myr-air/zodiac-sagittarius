use rand::RngCore;
use time::{Duration, OffsetDateTime};
use uuid::Uuid;

use sagittarius_db::models::{NewAccountPlanVariant, NewAccountTrip, NewAccountTripOwnerMember};
use sagittarius_db::{self as db, PgPool};
use sagittarius_domain::errors::ServiceError;
use sagittarius_domain::types::{AccountTripCreateResponse, PublicTripCreateInput, TripSummary};

use crate::auth::{self, create_session};
use crate::destination_geo::fill_destination_geo_from_label;

const DEFAULT_OWNER_COLOR: &str = "#0f766e";
const DEFAULT_OWNER_DISPLAY_NAME: &str = "Guest";
const DEFAULT_ORIGIN_LABEL: &str = "Bangkok, Thailand";
const DEFAULT_ORIGIN_CITY: &str = "Bangkok";
const DEFAULT_ORIGIN_COUNTRY: &str = "Thailand";
const DEFAULT_ORIGIN_COUNTRY_CODE: &str = "TH";
const DEFAULT_TIMEZONE: &str = "Asia/Bangkok";
const MAX_TRIP_TEXT_LENGTH: usize = 120;
const JOIN_ID_SUFFIX_ALPHABET: &[u8] = b"0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

pub async fn create_public_trip(
    pool: &PgPool,
    input: PublicTripCreateInput,
) -> Result<AccountTripCreateResponse, ServiceError> {
    let destination = validate_destination(&input.destination)?;
    let now = OffsetDateTime::now_utc();
    let start_date = now.date();
    let end_date = (now + Duration::days(7)).date();
    let join_id = allocate_join_id(pool, &destination).await?;
    let join_password = auth::generate_session_token();
    let join_password_hash = auth::hash_secret(&join_password)?;

    // Best-effort destination geo from label — never invent Thailand on destination fields.
    // Trip-level defaultTimezone may still fall back to Asia/Bangkok (origin product default).
    let geo = fill_destination_geo_from_label(&destination).await;
    let destination_cities = geo.cities;
    let countries = geo.countries;

    let trip_id = Uuid::now_v7();
    let owner_member_id = Uuid::now_v7();
    let active_plan_variant_id = Uuid::now_v7();

    let mut tx = pool.begin().await?;
    db::account_queries::defer_constraints(&mut tx).await?;
    let trip = db::account_queries::insert_account_trip(
        &mut tx,
        NewAccountTrip {
            id: trip_id,
            name: &destination,
            origin_label: DEFAULT_ORIGIN_LABEL,
            origin_city: DEFAULT_ORIGIN_CITY,
            origin_country: DEFAULT_ORIGIN_COUNTRY,
            origin_country_code: DEFAULT_ORIGIN_COUNTRY_CODE,
            destination_label: &destination,
            destination_cities: &destination_cities,
            countries: &countries,
            party_size: 1,
            default_timezone: DEFAULT_TIMEZONE,
            start_date,
            end_date,
            join_id: &join_id,
            join_password_hash: &join_password_hash,
            main_trip_plan_id: active_plan_variant_id,
            owner_member_id,
        },
    )
    .await
    .map_err(map_trip_insert_error)?;
    db::account_queries::insert_account_owner_member(
        &mut tx,
        NewAccountTripOwnerMember {
            id: owner_member_id,
            trip_id,
            user_id: None,
            display_name: DEFAULT_OWNER_DISPLAY_NAME,
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
            status: "main",
            description: "Primary plan",
        },
    )
    .await?;
    // Guest owners have no account user_id; account_audit_events.user_id is NOT NULL.
    let member_session = create_session(&mut tx, trip_id, owner_member_id).await?;
    tx.commit().await?;

    Ok(AccountTripCreateResponse {
        trip: TripSummary::from(trip),
        owner_member_id,
        member_session,
        join_password: Some(join_password),
    })
}

fn validate_destination(destination: &str) -> Result<String, ServiceError> {
    let trimmed = destination.trim();
    if trimmed.is_empty() || trimmed.chars().count() > MAX_TRIP_TEXT_LENGTH {
        return Err(ServiceError::InvalidRequest("destination"));
    }
    Ok(trimmed.to_string())
}

#[allow(dead_code)] // thin wrapper kept for call sites that don't have a label
pub(crate) fn generate_join_id() -> String {
    generate_join_id_from_label("trip")
}

/// Trip join id: `{yymm}-{SLUG4}-{suffix4}`
/// - `yymm` — UTC year/month of create
/// - `SLUG4` — 4 uppercase alnum chars from trip name (padded with `X`)
/// - `suffix4` — 4 chars from `0-9A-Z` (month-scoped count, else random)
pub(crate) fn generate_join_id_from_label(label: &str) -> String {
    let now = OffsetDateTime::now_utc();
    generate_join_id_parts(label, now, None)
}

/// Allocate join id using the month-scoped trip count (falls back to random on error).
pub(crate) async fn allocate_join_id(
    pool: &PgPool,
    trip_name: &str,
) -> Result<String, ServiceError> {
    let now = OffsetDateTime::now_utc();
    let yymm = format!(
        "{:02}{:02}",
        now.year().rem_euclid(100),
        u8::from(now.month())
    );
    let seq = match db::trip_queries::count_trips_with_join_yymm(pool, &yymm).await {
        Ok(count) if count >= 0 => Some(count as u64),
        _ => None,
    };
    Ok(generate_join_id_parts(trip_name, now, seq))
}

/// Test/helper: build join id with fixed clock and optional month-scoped sequence.
pub(crate) fn generate_join_id_parts(
    label: &str,
    now: OffsetDateTime,
    month_seq: Option<u64>,
) -> String {
    let yymm = format!(
        "{:02}{:02}",
        now.year().rem_euclid(100),
        u8::from(now.month())
    );
    let slug = slug4_from_name(label);
    let suffix = match month_seq {
        Some(seq) => encode_base36_4(seq),
        None => random_suffix4(),
    };
    format!("{yymm}-{slug}-{suffix}")
}

fn slug4_from_name(name: &str) -> String {
    let letters: String = name
        .chars()
        .filter(|c| c.is_ascii_alphanumeric())
        .map(|c| c.to_ascii_uppercase())
        .collect();
    let mut slug: String = letters.chars().take(4).collect();
    while slug.len() < 4 {
        slug.push('X');
    }
    if slug.chars().all(|c| c == 'X') {
        "TRIP".to_string()
    } else {
        slug
    }
}

fn encode_base36_4(value: u64) -> String {
    let mut n = value % 36u64.pow(4);
    let mut out = [b'0'; 4];
    for i in (0..4).rev() {
        out[i] = JOIN_ID_SUFFIX_ALPHABET[(n % 36) as usize];
        n /= 36;
    }
    String::from_utf8(out.to_vec()).expect("base36 alphabet is ascii")
}

fn random_suffix4() -> String {
    let mut bytes = [0u8; 4];
    rand::rng().fill_bytes(&mut bytes);
    bytes
        .iter()
        .map(|b| JOIN_ID_SUFFIX_ALPHABET[(*b as usize) % JOIN_ID_SUFFIX_ALPHABET.len()] as char)
        .collect()
}

fn map_trip_insert_error(error: sqlx::Error) -> ServiceError {
    let duplicate_join_id = matches!(
        &error,
        sqlx::Error::Database(database_error)
            if database_error.code().as_deref() == Some("23505")
                && database_error.constraint() == Some("trips_join_id_key")
    );
    if duplicate_join_id {
        ServiceError::TripJoinIdAlreadyExists
    } else {
        ServiceError::database(error)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use time::{Date, Month, PrimitiveDateTime, Time};

    fn fixed_now() -> OffsetDateTime {
        let date = Date::from_calendar_date(2026, Month::July, 20).unwrap();
        PrimitiveDateTime::new(date, Time::MIDNIGHT).assume_utc()
    }

    #[test]
    fn join_id_format_yymm_slug_suffix() {
        let id = generate_join_id_parts("Japan Autumn Loop", fixed_now(), Some(10));
        assert_eq!(id, "2607-JAPA-000A");
    }

    #[test]
    fn join_id_slug_pads_short_names() {
        let id = generate_join_id_parts("CM", fixed_now(), Some(0));
        assert_eq!(id, "2607-CMXX-0000");
    }

    #[test]
    fn join_id_slug_falls_back_when_empty() {
        let id = generate_join_id_parts("!!!", fixed_now(), Some(1));
        assert_eq!(id, "2607-TRIP-0001");
    }

    #[test]
    fn join_id_random_suffix_matches_alphabet() {
        let id = generate_join_id_from_label("Chiang Mai");
        let re = regex_lite_join_id();
        assert!(
            re(&id),
            "expected yymm-SLUG-xxxx, got {id}"
        );
    }

    fn regex_lite_join_id() -> impl Fn(&str) -> bool {
        |s: &str| {
            let parts: Vec<&str> = s.split('-').collect();
            if parts.len() != 3 {
                return false;
            }
            let (yymm, slug, suffix) = (parts[0], parts[1], parts[2]);
            yymm.len() == 4
                && yymm.chars().all(|c| c.is_ascii_digit())
                && slug.len() == 4
                && slug.chars().all(|c| c.is_ascii_uppercase() || c.is_ascii_digit())
                && suffix.len() == 4
                && suffix
                    .bytes()
                    .all(|b| JOIN_ID_SUFFIX_ALPHABET.contains(&b))
                && s.chars().all(|c| !c.is_ascii_lowercase())
        }
    }
}
