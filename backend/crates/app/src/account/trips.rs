use time::OffsetDateTime;
use uuid::Uuid;

use crate::account_mappers::{
    account_todo_from_record, account_trip_from_record, account_trip_stats_from_record,
    format_timestamp,
};
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

pub async fn create_trip(
    pool: &PgPool,
    session_token: &str,
    input: AccountTripCreateInput,
) -> Result<AccountTripCreateResponse, ServiceError> {
    let user_id = authenticate_user_session(pool, session_token).await?;
    let name = validate_trip_text(&input.name, "trip name")?;
    let origin_label = validate_trip_text(&input.origin_label, "origin label")?;
    let origin_city = validate_trip_text(&input.origin_city, "origin city")?;
    let origin_country = validate_trip_text(&input.origin_country, "origin country")?;
    let origin_country_code =
        validate_country_code(&input.origin_country_code, "origin country code")?;
    let destination_cities = validate_trip_cities(&input.destination_cities)?;
    let countries = validate_trip_countries(&input.countries)?;
    let party_size = validate_party_size(input.party_size.unwrap_or(1))?;
    let timezone_candidate = input
        .default_timezone
        .as_deref()
        .filter(|value| !value.trim().is_empty())
        .or_else(|| {
            destination_cities
                .first()
                .map(|city| city.timezone.as_str())
        })
        .unwrap_or("Asia/Bangkok");
    let default_timezone = validate_trip_text_with_len(
        timezone_candidate,
        MAX_TRIP_TIMEZONE_LENGTH,
        "default timezone",
    )?;
    let destination_cities_label = destination_cities
        .iter()
        .map(|city| city.city.as_str())
        .collect::<Vec<_>>()
        .join(", ");
    let countries_label = countries.join(", ");
    let destination_label = validate_trip_text(
        if input.destination_label.trim().is_empty() {
            if destination_cities_label.is_empty() {
                &countries_label
            } else {
                &destination_cities_label
            }
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
            start_date: input.start_date,
            end_date: input.end_date,
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
