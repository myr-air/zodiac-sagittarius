use time::{Duration, OffsetDateTime};
use uuid::Uuid;

use sagittarius_db::models::{NewAccountPlanVariant, NewAccountTrip, NewAccountTripOwnerMember};
use sagittarius_db::{self as db, PgPool};
use sagittarius_domain::errors::ServiceError;
use sagittarius_domain::types::{
    AccountTripCreateResponse, PublicTripCreateInput, TripCity, TripSummary,
};

use crate::auth::{self, create_session};

const DEFAULT_OWNER_COLOR: &str = "#0f766e";
const DEFAULT_OWNER_DISPLAY_NAME: &str = "Guest";
const DEFAULT_TIMEZONE: &str = "Asia/Bangkok";
const MAX_TRIP_TEXT_LENGTH: usize = 120;

pub async fn create_public_trip(
    pool: &PgPool,
    input: PublicTripCreateInput,
) -> Result<AccountTripCreateResponse, ServiceError> {
    let destination = validate_destination(&input.destination)?;
    let now = OffsetDateTime::now_utc();
    let start_date = now.date();
    let end_date = (now + Duration::days(7)).date();
    let join_id = generate_join_id();
    let join_password = auth::generate_session_token();
    let join_password_hash = auth::hash_secret(&join_password)?;

    let destination_cities = vec![TripCity {
        city: destination.clone(),
        country: "Thailand".to_string(),
        country_code: "TH".to_string(),
        timezone: DEFAULT_TIMEZONE.to_string(),
        latitude: 0.0,
        longitude: 0.0,
    }];
    let countries = vec!["Thailand".to_string()];

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
            origin_label: "Bangkok, Thailand",
            origin_city: "Bangkok",
            origin_country: "Thailand",
            origin_country_code: "TH",
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
    })
}

fn validate_destination(destination: &str) -> Result<String, ServiceError> {
    let trimmed = destination.trim();
    if trimmed.is_empty() || trimmed.chars().count() > MAX_TRIP_TEXT_LENGTH {
        return Err(ServiceError::InvalidRequest("destination"));
    }
    Ok(trimmed.to_string())
}

fn generate_join_id() -> String {
    Uuid::now_v7()
        .simple()
        .to_string()
        .chars()
        .take(12)
        .collect::<String>()
        .to_ascii_uppercase()
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
