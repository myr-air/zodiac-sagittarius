use time::{Duration, OffsetDateTime};
use uuid::Uuid;

use crate::account_mappers::{
    account_todo_from_record, account_trip_from_record, account_trip_stats_from_record,
    format_timestamp,
};
use crate::destination_geo::fill_destination_geo_from_label;
use sagittarius_db::models::{
    NewAccountAuditEvent, NewAccountPlanVariant, NewAccountTrip, NewAccountTripOwnerMember,
};
use sagittarius_db::{self as db, PgPool};
use sagittarius_domain::errors::ServiceError;
use sagittarius_domain::types::{
    AccountExplorerSummary, AccountTodoSummary, AccountTripCreateResponse, AccountTripStats,
    AccountTripSummary, MemberSession, TripCity, TripSummary,
};

use super::auth::{authenticate_user_session, generate_secure_token};
use super::{
    AccountTripCreateInput, DEFAULT_OWNER_COLOR, MAX_JOIN_ID_LENGTH, MAX_JOIN_PASSWORD_LENGTH,
    MAX_TRIP_TEXT_LENGTH, MAX_TRIP_TIMEZONE_LENGTH, MIN_JOIN_PASSWORD_LENGTH,
    is_unique_violation_on_constraint,
};

const DEFAULT_ORIGIN_LABEL: &str = "Bangkok, Thailand";
const DEFAULT_ORIGIN_CITY: &str = "Bangkok";
const DEFAULT_ORIGIN_COUNTRY: &str = "Thailand";
const DEFAULT_ORIGIN_COUNTRY_CODE: &str = "TH";
const DEFAULT_TIMEZONE: &str = "Asia/Bangkok";
const DEFAULT_OWNER_DISPLAY_NAME: &str = "Guest";
const DEFAULT_TRIP_DURATION_DAYS: i64 = 7;

pub async fn create_trip(
    pool: &PgPool,
    session_token: &str,
    input: AccountTripCreateInput,
) -> Result<AccountTripCreateResponse, ServiceError> {
    let user_id = authenticate_user_session(pool, session_token).await?;
    let profile = db::account_queries::get_user_profile(pool, user_id)
        .await?
        .ok_or(ServiceError::Unauthenticated)?;
    let name = match input.name.as_deref() {
        Some(name) => validate_trip_text(name, "trip name")?,
        None => match input.destination_label.as_deref() {
            Some(destination) => validate_trip_text(destination, "trip name")?,
            None => {
                return Err(ServiceError::InvalidRequest(
                    "name or destination label is required",
                ));
            }
        },
    };
    let destination_label = match input.destination_label.as_deref() {
        Some(label) if !label.trim().is_empty() => {
            validate_trip_text(label, "destination label")?
        }
        Some(_) | None => name.clone(),
    };
    let origin_label = match input.origin_label.as_deref() {
        Some(value) => validate_trip_text(value, "origin label")?,
        None => match (
            profile.home_city.as_deref().filter(|v| !v.trim().is_empty()),
            profile
                .home_country
                .as_deref()
                .filter(|v| !v.trim().is_empty()),
        ) {
            (Some(city), Some(country)) => format!("{city}, {country}"),
            (Some(city), None) => city.to_string(),
            (None, Some(country)) => country.to_string(),
            (None, None) => DEFAULT_ORIGIN_LABEL.to_string(),
        },
    };
    let origin_city = match input.origin_city.as_deref() {
        Some(value) => validate_trip_text(value, "origin city")?,
        None => profile
            .home_city
            .as_deref()
            .filter(|v| !v.trim().is_empty())
            .unwrap_or(DEFAULT_ORIGIN_CITY)
            .to_string(),
    };
    let origin_country = match input.origin_country.as_deref() {
        Some(value) => validate_trip_text(value, "origin country")?,
        None => profile
            .home_country
            .as_deref()
            .filter(|v| !v.trim().is_empty())
            .unwrap_or(DEFAULT_ORIGIN_COUNTRY)
            .to_string(),
    };
    let origin_country_code = match input.origin_country_code.as_deref() {
        Some(value) => validate_country_code(value, "origin country code")?,
        None => DEFAULT_ORIGIN_COUNTRY_CODE.to_string(),
    };
    // Best-effort destination geo from label when cities/countries omitted — never invent Thailand.
    // Explicit destination_cities / countries in the request still win. Origin Bangkok defaults
    // and trip-level defaultTimezone may still fall back to Asia/Bangkok.
    let needs_destination_geo = input
        .destination_cities
        .as_ref()
        .map_or(true, |cities| cities.is_empty())
        || input
            .countries
            .as_ref()
            .map_or(true, |countries| countries.is_empty());
    let geo = if needs_destination_geo {
        Some(fill_destination_geo_from_label(&destination_label).await)
    } else {
        None
    };
    let destination_cities = match input.destination_cities.as_ref() {
        Some(cities) if !cities.is_empty() => validate_trip_cities(cities)?,
        _ => geo
            .as_ref()
            .expect("destination geo fill when cities omitted")
            .cities
            .clone(),
    };
    let countries = match input.countries.as_ref() {
        Some(countries) if !countries.is_empty() => validate_trip_countries(countries)?,
        _ => geo
            .as_ref()
            .expect("destination geo fill when countries omitted")
            .countries
            .clone(),
    };
    let party_size = validate_party_size(input.party_size.unwrap_or(1))?;
    let timezone_candidate = input
        .default_timezone
        .as_deref()
        .filter(|value| !value.trim().is_empty())
        .or_else(|| {
            destination_cities
                .first()
                .map(|city| city.timezone.as_str())
                .filter(|tz| !tz.trim().is_empty())
        })
        .or_else(|| {
            let tz = profile.timezone.trim();
            if tz.is_empty() {
                None
            } else {
                Some(tz)
            }
        })
        .unwrap_or(DEFAULT_TIMEZONE);
    let default_timezone = validate_trip_text_with_len(
        timezone_candidate,
        MAX_TRIP_TIMEZONE_LENGTH,
        "default timezone",
    )?;
    let owner_display_name = match input.owner_display_name.as_deref() {
        Some(value) => validate_trip_text(value, "owner display name")?,
        None => {
            let from_profile = profile.display_name.trim();
            if from_profile.is_empty() {
                DEFAULT_OWNER_DISPLAY_NAME.to_string()
            } else {
                validate_trip_text(from_profile, "owner display name")?
            }
        }
    };
    let join_id = match input.join_id.as_deref() {
        Some(join_id) => validate_join_id(join_id)?,
        None => crate::public_trips::allocate_join_id(pool, &name).await?,
    };
    let join_password = match input.join_password.as_deref() {
        Some(join_password) => validate_join_password(join_password)?,
        None => crate::auth::generate_session_token(),
    };

    let now = OffsetDateTime::now_utc();
    let start_date = input.start_date.unwrap_or_else(|| now.date());
    let end_date = input
        .end_date
        .unwrap_or_else(|| (now + Duration::days(DEFAULT_TRIP_DURATION_DAYS)).date());
    if start_date > end_date {
        return Err(ServiceError::InvalidRequest(
            "start date must be on or before end date",
        ));
    }

    let trip_id = Uuid::now_v7();
    let owner_member_id = Uuid::now_v7();
    let active_plan_variant_id = Uuid::now_v7();
    let join_password_hash = crate::auth::hash_secret(&join_password)?;
    let mut tx = pool.begin().await?;

    db::account_queries::defer_constraints(&mut tx).await?;
    let trip = db::account_queries::insert_account_trip(
        &mut tx,
        NewAccountTrip {
            id: trip_id,
            name: &name,
            origin_label: &origin_label,
            origin_city: &origin_city,
            origin_country: &origin_country,
            origin_country_code: &origin_country_code,
            destination_label: &destination_label,
            destination_cities: &destination_cities,
            countries: &countries,
            party_size,
            default_timezone: &default_timezone,
            start_date,
            end_date,
            join_id: &join_id,
            join_password_hash: &join_password_hash,
            main_trip_plan_id: active_plan_variant_id,
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
            user_id: Some(user_id),
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
            status: "main",
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
        join_password: Some(join_password),
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

async fn create_member_session(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    trip_id: Uuid,
    member_id: Uuid,
) -> Result<MemberSession, ServiceError> {
    let session_token = generate_secure_token();
    let session_token_hash = crate::auth::hash_session_token(&session_token)?;
    let created_at = OffsetDateTime::now_utc();
    let policy = db::queries::find_member_session_policy(tx, trip_id, member_id)
        .await?
        .ok_or(ServiceError::Unauthenticated)?;
    let expires_at = crate::auth::member_session_expires_at(
        policy.role,
        policy.start_date,
        policy.end_date,
        created_at,
    )?;

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
pub(super) fn validate_trip_text(value: &str, field: &'static str) -> Result<String, ServiceError> {
    validate_trip_text_with_len(value, MAX_TRIP_TEXT_LENGTH, field)
}

fn validate_trip_text_with_len(
    value: &str,
    max_len: usize,
    field: &'static str,
) -> Result<String, ServiceError> {
    let trimmed = value.trim();
    if trimmed.is_empty() || trimmed.chars().count() > max_len {
        return Err(ServiceError::InvalidRequest(field));
    }

    Ok(trimmed.to_string())
}

fn validate_party_size(value: i32) -> Result<i32, ServiceError> {
    if !(1..=999).contains(&value) {
        return Err(ServiceError::InvalidRequest("party size"));
    }

    Ok(value)
}

fn validate_trip_countries(countries: &[String]) -> Result<Vec<String>, ServiceError> {
    let mut normalized = Vec::new();
    for country in countries {
        let trimmed = validate_trip_text(country, "country")?;
        if !normalized
            .iter()
            .any(|existing: &String| existing.eq_ignore_ascii_case(&trimmed))
        {
            normalized.push(trimmed);
        }
    }
    if normalized.is_empty() || normalized.len() > 12 {
        return Err(ServiceError::InvalidRequest("countries"));
    }
    Ok(normalized)
}

fn validate_trip_cities(cities: &[TripCity]) -> Result<Vec<TripCity>, ServiceError> {
    if cities.is_empty() || cities.len() > 12 {
        return Err(ServiceError::InvalidRequest("destination cities"));
    }

    cities
        .iter()
        .map(|city| {
            let latitude = city.latitude;
            let longitude = city.longitude;
            if !latitude.is_finite()
                || !longitude.is_finite()
                || !(-90.0..=90.0).contains(&latitude)
                || !(-180.0..=180.0).contains(&longitude)
            {
                return Err(ServiceError::InvalidRequest("destination city coordinates"));
            }

            Ok(TripCity {
                city: validate_trip_text(&city.city, "destination city")?,
                country: validate_trip_text(&city.country, "destination city country")?,
                country_code: validate_country_code(
                    &city.country_code,
                    "destination city country code",
                )?,
                timezone: validate_trip_text(&city.timezone, "destination city timezone")?,
                latitude,
                longitude,
            })
        })
        .collect()
}

fn validate_country_code(value: &str, field: &'static str) -> Result<String, ServiceError> {
    let normalized = value.trim().to_ascii_uppercase();
    if normalized.len() != 2
        || !normalized
            .chars()
            .all(|character| character.is_ascii_alphabetic())
    {
        return Err(ServiceError::InvalidRequest(field));
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
fn map_account_trip_insert_error(error: sqlx::Error) -> ServiceError {
    let duplicate_join_id = is_unique_violation_on_constraint(&error, "trips_join_id_key");
    let database_error = ServiceError::database(error);
    if duplicate_join_id {
        ServiceError::TripJoinIdAlreadyExists
    } else {
        database_error
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use sqlx::error::{DatabaseError, ErrorKind};
    use std::borrow::Cow;
    use std::error::Error;
    use std::fmt;

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
