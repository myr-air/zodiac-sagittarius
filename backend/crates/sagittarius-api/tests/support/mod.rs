#![allow(dead_code)]

use axum::Router;
use sqlx::PgPool;
use uuid::Uuid;

pub const OWNER_ID: &str = "018f4e81-77a4-7b8f-b3bd-0d0f493ac561";
pub const ORGANIZER_ID: &str = "018f4e81-77a4-7b8f-b3bd-0d0f493ac562";
pub const TRAVELER_ID: &str = "018f4e81-77a4-7b8f-b3bd-0d0f493ac563";
pub const VIEWER_ID: &str = "018f4e81-77a4-7b8f-b3bd-0d0f493ac564";
pub const TRIP_ID: &str = "018f4e80-5788-7de0-a45c-8a555d17fc2d";
pub const PLAN_ID: &str = "018f4e82-3000-7c00-b111-000000000001";
pub const ITEM_ID: &str = "018f4e83-5410-7d8b-8f25-fd52c5e7bd1f";

pub fn app(pool: PgPool) -> Router {
    sagittarius_api::api::router(sagittarius_api::app::AppState::with_pool(pool))
}

pub async fn seed_trip(pool: &PgPool) {
    let trip_id = Uuid::parse_str(TRIP_ID).unwrap();
    let owner_id = Uuid::parse_str(OWNER_ID).unwrap();
    let organizer_id = Uuid::parse_str(ORGANIZER_ID).unwrap();
    let traveler_id = Uuid::parse_str(TRAVELER_ID).unwrap();
    let viewer_id = Uuid::parse_str(VIEWER_ID).unwrap();
    let plan_id = Uuid::parse_str(PLAN_ID).unwrap();
    let item_id = Uuid::parse_str(ITEM_ID).unwrap();

    let mut tx = pool.begin().await.unwrap();
    sqlx::query("set constraints all deferred")
        .execute(&mut *tx)
        .await
        .unwrap();
    sqlx::query(
        "insert into trips (
           id, name, destination_label, start_date, end_date, join_id, join_password_hash,
           active_plan_variant_id, owner_member_id
         )
         values (
           $1, 'Hong Kong + Shenzhen Trip', 'Hong Kong + Shenzhen', '2025-05-15',
           '2025-05-20', 'HK-SZ-2025', $2, $3, $4
         )",
    )
    .bind(trip_id)
    .bind(sagittarius_api::app::auth::hash_secret_for_tests(
        "dim-sum-run",
    ))
    .bind(plan_id)
    .bind(owner_id)
    .execute(&mut *tx)
    .await
    .unwrap();
    sqlx::query(
        "insert into trip_members (id, trip_id, display_name, role, color)
         values
           ($1, $2, 'Aom', 'owner', '#0f766e'),
           ($3, $2, 'Beam', 'organizer', '#2563eb'),
           ($4, $2, 'Nam', 'traveler', '#f97316'),
           ($5, $2, 'Family', 'viewer', '#64748b')",
    )
    .bind(owner_id)
    .bind(trip_id)
    .bind(organizer_id)
    .bind(traveler_id)
    .bind(viewer_id)
    .execute(&mut *tx)
    .await
    .unwrap();
    sqlx::query(
        "insert into plan_variants (id, trip_id, name, kind, description)
         values ($1, $2, 'Main', 'main', 'Primary plan')",
    )
    .bind(plan_id)
    .bind(trip_id)
    .execute(&mut *tx)
    .await
    .unwrap();
    sqlx::query(
        "insert into itinerary_items (
           id, trip_id, plan_variant_id, day, sort_order, start_time, activity, activity_type,
           place, map_link, duration_minutes, transportation, note, created_by, version
         )
         values (
           $1, $2, $3, '2025-05-16', 100, '08:30', 'Dim Dim Sum', 'food',
           'The Elements', 'https://maps.google.com', 60, 'walk', 'breakfast', $4, 4
         )",
    )
    .bind(item_id)
    .bind(trip_id)
    .bind(plan_id)
    .bind(owner_id)
    .execute(&mut *tx)
    .await
    .unwrap();
    tx.commit().await.unwrap();
}

pub async fn claim_member(pool: &PgPool, member_id: &str, password: &str, access_status: &str) {
    sqlx::query(
        "update trip_members
         set claim_password_hash = $1, claimed_at = now(), access_status = $2
         where id = $3",
    )
    .bind(sagittarius_api::app::auth::hash_secret_for_tests(password))
    .bind(access_status)
    .bind(Uuid::parse_str(member_id).unwrap())
    .execute(pool)
    .await
    .unwrap();
}
