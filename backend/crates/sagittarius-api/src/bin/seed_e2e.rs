use sqlx::postgres::PgPoolOptions;
use uuid::Uuid;

const TRIP_ID: &str = "018f4e80-5788-7de0-a45c-8a555d17fc2d";
const OWNER_ID: &str = "018f4e81-77a4-7b8f-b3bd-0d0f493ac561";
const ORGANIZER_ID: &str = "018f4e81-77a4-7b8f-b3bd-0d0f493ac562";
const TRAVELER_ID: &str = "018f4e81-77a4-7b8f-b3bd-0d0f493ac563";
const VIEWER_ID: &str = "018f4e81-77a4-7b8f-b3bd-0d0f493ac564";
const PLAN_ID: &str = "018f4e82-3000-7c00-b111-000000000001";
const ITEM_ID: &str = "018f4e83-5410-7d8b-8f25-fd52c5e7bd1f";

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let database_url = std::env::var("DATABASE_URL").map_err(|_| {
        std::io::Error::new(std::io::ErrorKind::NotFound, "DATABASE_URL must be set")
    })?;
    guard_test_database(&database_url)?;

    let pool = PgPoolOptions::new().connect(&database_url).await?;
    sqlx::raw_sql(
        "drop schema public cascade;
         create schema public;
         create extension if not exists pgcrypto;",
    )
    .execute(&pool)
    .await?;
    sqlx::raw_sql(include_str!("../../../../migrations/0001_backend_vertical_slice.sql"))
        .execute(&pool)
        .await?;

    seed_trip(&pool).await?;
    seed_tasks(&pool).await?;

    println!("seeded local e2e trip HK-SZ-2025 in sagittarius_test");
    Ok(())
}

fn guard_test_database(database_url: &str) -> Result<(), Box<dyn std::error::Error>> {
    if database_url.contains("sagittarius_test") {
        return Ok(());
    }

    Err("refusing to reset a database URL that does not contain sagittarius_test".into())
}

async fn seed_trip(pool: &sqlx::PgPool) -> Result<(), sqlx::Error> {
    let trip_id = Uuid::parse_str(TRIP_ID).expect("static uuid");
    let owner_id = Uuid::parse_str(OWNER_ID).expect("static uuid");
    let organizer_id = Uuid::parse_str(ORGANIZER_ID).expect("static uuid");
    let traveler_id = Uuid::parse_str(TRAVELER_ID).expect("static uuid");
    let viewer_id = Uuid::parse_str(VIEWER_ID).expect("static uuid");
    let plan_id = Uuid::parse_str(PLAN_ID).expect("static uuid");
    let item_id = Uuid::parse_str(ITEM_ID).expect("static uuid");

    let mut tx = pool.begin().await?;
    sqlx::query("set constraints all deferred")
        .execute(&mut *tx)
        .await?;
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
    .await?;
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
    .await?;
    sqlx::query(
        "insert into plan_variants (id, trip_id, name, kind, description)
         values ($1, $2, 'Main', 'main', 'Primary plan')",
    )
    .bind(plan_id)
    .bind(trip_id)
    .execute(&mut *tx)
    .await?;
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
    .await?;
    tx.commit().await
}

async fn seed_tasks(pool: &sqlx::PgPool) -> Result<(), sqlx::Error> {
    sqlx::query(
        "insert into trip_tasks (
           id, trip_id, title, status, visibility, kind, created_by, assignee_id
         )
         values
           (gen_random_uuid(), $1, 'Buy eSIM', 'open', 'private', 'prep', $2, $2),
           (gen_random_uuid(), $1, 'Book Peak Tram', 'done', 'shared', 'booking', $3, $3)",
    )
    .bind(Uuid::parse_str(TRIP_ID).expect("static uuid"))
    .bind(Uuid::parse_str(TRAVELER_ID).expect("static uuid"))
    .bind(Uuid::parse_str(ORGANIZER_ID).expect("static uuid"))
    .execute(pool)
    .await?;
    Ok(())
}
