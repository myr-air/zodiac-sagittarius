use sqlx::postgres::PgPoolOptions;
use uuid::Uuid;

const TRIP_ID: &str = "018f4e80-5788-7de0-a45c-8a555d17fc2d";
const OWNER_ID: &str = "018f4e81-77a4-7b8f-b3bd-0d0f493ac561";
const ORGANIZER_ID: &str = "018f4e81-77a4-7b8f-b3bd-0d0f493ac562";
const TRAVELER_ID: &str = "018f4e81-77a4-7b8f-b3bd-0d0f493ac563";
const VIEWER_ID: &str = "018f4e81-77a4-7b8f-b3bd-0d0f493ac564";
const PLAN_ID: &str = "018f4e82-3000-7c00-b111-000000000001";
const ITEM_ID: &str = "018f4e83-5410-7d8b-8f25-fd52c5e7bd1f";
const STOP_NOTE_ID: &str = "018f4e83-5410-7d8b-8f25-fd52c5e7bd30";
const TASK_ID: &str = "018f4e85-2222-7000-8000-000000000001";
const EXPENSE_ID: &str = "018f4e86-1111-7000-8000-000000000001";
const BOOKING_FLIGHT_ID: &str = "018f4e87-1111-7000-8000-000000000001";
const BOOKING_HOTEL_ID: &str = "018f4e87-1111-7000-8000-000000000002";

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
    for migration in [
        include_str!("../../../../migrations/0001_backend_vertical_slice.sql"),
        include_str!("../../../../migrations/0002_account_identity.sql"),
        include_str!("../../../../migrations/0003_trip_join_sessions.sql"),
        include_str!("../../../../migrations/0004_account_password_auth.sql"),
        include_str!("../../../../migrations/0005_account_portal.sql"),
        include_str!("../../../../migrations/0006_trip_countries.sql"),
        include_str!("../../../../migrations/0007_stop_notes.sql"),
        include_str!("../../../../migrations/0008_trip_daily_briefings.sql"),
        include_str!("../../../../migrations/0009_trip_join_invite_tokens.sql"),
        include_str!("../../../../migrations/0010_itinerary_activity_paths.sql"),
        include_str!("../../../../migrations/0011_expense_reminders.sql"),
        include_str!("../../../../migrations/0012_expense_exchange_rates.sql"),
        include_str!("../../../../migrations/0013_expense_receipts_itemization.sql"),
        include_str!("../../../../migrations/0014_expense_notes.sql"),
        include_str!("../../../../migrations/0015_expense_comments.sql"),
        include_str!("../../../../migrations/0016_place_geocode_cache.sql"),
        include_str!("../../../../migrations/0017_booking_docs.sql"),
    ] {
        sqlx::raw_sql(migration).execute(&pool).await?;
    }

    seed_trip(&pool).await?;
    seed_tasks(&pool).await?;
    seed_stop_notes(&pool).await?;
    seed_expenses(&pool).await?;
    seed_booking_docs(&pool).await?;

    println!("seeded local e2e trip HK-SZ-2025 in sagittarius_test");
    Ok(())
}

async fn seed_stop_notes(pool: &sqlx::PgPool) -> Result<(), sqlx::Error> {
    sqlx::query(
        "insert into stop_notes (id, trip_id, itinerary_item_id, author_id, body)
         values ($1, $2, $3, $4, 'Meet outside exit B after breakfast')",
    )
    .bind(Uuid::parse_str(STOP_NOTE_ID).expect("static uuid"))
    .bind(Uuid::parse_str(TRIP_ID).expect("static uuid"))
    .bind(Uuid::parse_str(ITEM_ID).expect("static uuid"))
    .bind(Uuid::parse_str(TRAVELER_ID).expect("static uuid"))
    .execute(pool)
    .await?;
    Ok(())
}

async fn seed_expenses(pool: &sqlx::PgPool) -> Result<(), sqlx::Error> {
    let owner_id = Uuid::parse_str(OWNER_ID).expect("static uuid");
    let traveler_id = Uuid::parse_str(TRAVELER_ID).expect("static uuid");
    sqlx::query(
        "insert into expenses (
           id, trip_id, title, amount_minor, currency, paid_by, category, splits, itinerary_item_id
         )
         values ($1, $2, 'Dim sum breakfast', 24000, 'HKD', $3, 'food', $4, $5)",
    )
    .bind(Uuid::parse_str(EXPENSE_ID).expect("static uuid"))
    .bind(Uuid::parse_str(TRIP_ID).expect("static uuid"))
    .bind(owner_id)
    .bind(serde_json::json!({
        owner_id.to_string(): 12000,
        traveler_id.to_string(): 12000
    }))
    .bind(Uuid::parse_str(ITEM_ID).expect("static uuid"))
    .execute(pool)
    .await?;
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
           $1, 'Hong Kong + Shenzhen Trip', 'Hong Kong + Shenzhen', '2026-06-18',
           '2026-06-23', 'HK-SZ-2025', $2, $3, $4
         )",
    )
    .bind(trip_id)
    .bind(sagittarius_api::app::auth::hash_secret_for_tests(
        "seed-trip-pass",
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
           $1, $2, $3, '2026-06-19', 100, '08:30', 'Dim Dim Sum', 'food',
           'The Elements', 'https://maps.google.com', 60, 'walk', 'breakfast', $4, 4
         )",
    )
    .bind(item_id)
    .bind(trip_id)
    .bind(plan_id)
    .bind(owner_id)
    .execute(&mut *tx)
    .await?;
    sqlx::query(
        "update trip_members
         set claim_password_hash = $1, claimed_at = now()
         where id = $2",
    )
    .bind(sagittarius_api::app::auth::hash_secret_for_tests(
        "beam-pass-2026",
    ))
    .bind(organizer_id)
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
           ($4, $1, 'Book Peak Tram', 'done', 'shared', 'booking', $3, $3)",
    )
    .bind(Uuid::parse_str(TRIP_ID).expect("static uuid"))
    .bind(Uuid::parse_str(TRAVELER_ID).expect("static uuid"))
    .bind(Uuid::parse_str(ORGANIZER_ID).expect("static uuid"))
    .bind(Uuid::parse_str(TASK_ID).expect("static uuid"))
    .execute(pool)
    .await?;
    Ok(())
}

async fn seed_booking_docs(pool: &sqlx::PgPool) -> Result<(), sqlx::Error> {
    let trip_id = Uuid::parse_str(TRIP_ID).expect("static uuid");
    let owner_id = Uuid::parse_str(OWNER_ID).expect("static uuid");
    let organizer_id = Uuid::parse_str(ORGANIZER_ID).expect("static uuid");
    let traveler_id = Uuid::parse_str(TRAVELER_ID).expect("static uuid");
    let flight_id = Uuid::parse_str(BOOKING_FLIGHT_ID).expect("static uuid");
    let hotel_id = Uuid::parse_str(BOOKING_HOTEL_ID).expect("static uuid");
    let item_id = Uuid::parse_str(ITEM_ID).expect("static uuid");
    let task_id = Uuid::parse_str(TASK_ID).expect("static uuid");
    let expense_id = Uuid::parse_str(EXPENSE_ID).expect("static uuid");
    let note_id = Uuid::parse_str(STOP_NOTE_ID).expect("static uuid");

    let mut tx = pool.begin().await?;
    sqlx::query(
        "insert into booking_docs (
           id, trip_id, type, title, status, visibility, owner_member_id, provider_name,
           confirmation_code, starts_at, ends_at, timezone, price_minor, currency, notes, created_by
         )
         values
           (
             $1, $2, 'flight', 'HK Express flight to Hong Kong', 'confirmed', 'sensitive',
             $3, 'HK Express', 'UO-2026', '2026-06-18T03:45:00Z', '2026-06-18T06:30:00Z',
             'Asia/Hong_Kong', 184500, 'HKD', 'Boarding pass is in Drive; check passport names.', $4
           ),
           (
             $5, $2, 'hotel', 'Tsim Sha Tsui hotel voucher', 'booked', 'shared',
             $4, 'Harbour Stay', 'HS-1842', '2026-06-18T07:00:00Z', '2026-06-23T04:00:00Z',
             'Asia/Hong_Kong', 520000, 'HKD', 'Pay at property; breakfast included.', $4
           )",
    )
    .bind(flight_id)
    .bind(trip_id)
    .bind(owner_id)
    .bind(organizer_id)
    .bind(hotel_id)
    .execute(&mut *tx)
    .await?;

    sqlx::query(
        "insert into booking_doc_external_links (
           id, trip_id, booking_doc_id, label, url, provider, access_note, sort_order
         )
         values
           (gen_random_uuid(), $1, $2, 'Airline booking', 'https://www.hkexpress.com', 'HK Express', 'Use confirmation code UO-2026', 0),
           (gen_random_uuid(), $1, $3, 'Hotel voucher', 'https://drive.google.com', 'Google Drive', 'Shared trip folder', 0)",
    )
    .bind(trip_id)
    .bind(flight_id)
    .bind(hotel_id)
    .execute(&mut *tx)
    .await?;

    sqlx::query(
        "insert into booking_doc_travelers (trip_id, booking_doc_id, member_id)
         values ($1, $2, $4), ($1, $2, $5), ($1, $3, $4), ($1, $3, $5)",
    )
    .bind(trip_id)
    .bind(flight_id)
    .bind(hotel_id)
    .bind(owner_id)
    .bind(traveler_id)
    .execute(&mut *tx)
    .await?;

    sqlx::query(
        "insert into booking_doc_itinerary_items (trip_id, booking_doc_id, itinerary_item_id)
         values ($1, $2, $3), ($1, $4, $3)",
    )
    .bind(trip_id)
    .bind(flight_id)
    .bind(item_id)
    .bind(hotel_id)
    .execute(&mut *tx)
    .await?;

    sqlx::query(
        "insert into booking_doc_tasks (trip_id, booking_doc_id, task_id)
         values ($1, $2, $3)",
    )
    .bind(trip_id)
    .bind(hotel_id)
    .bind(task_id)
    .execute(&mut *tx)
    .await?;

    sqlx::query(
        "insert into booking_doc_expenses (trip_id, booking_doc_id, expense_id)
         values ($1, $2, $3)",
    )
    .bind(trip_id)
    .bind(hotel_id)
    .bind(expense_id)
    .execute(&mut *tx)
    .await?;

    sqlx::query(
        "insert into booking_doc_stop_notes (trip_id, booking_doc_id, stop_note_id)
         values ($1, $2, $3)",
    )
    .bind(trip_id)
    .bind(flight_id)
    .bind(note_id)
    .execute(&mut *tx)
    .await?;

    tx.commit().await
}
