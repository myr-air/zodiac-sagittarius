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
pub const ALT_PLAN_ID: &str = "018f4e82-3000-7c00-b111-000000000002";
pub const ITEM_ID: &str = "018f4e83-5410-7d8b-8f25-fd52c5e7bd1f";
pub const STOP_NOTE_ID: &str = "018f4e83-5410-7d8b-8f25-fd52c5e7bd30";
pub const EXPENSE_ID: &str = "018f4e86-1111-7000-8000-000000000001";

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

pub async fn create_session(pool: &PgPool, member_id: &str) -> String {
    set_trip_dates(pool, "2026-06-01", "2026-06-30").await;
    let token = format!("test-token-{member_id}");
    sqlx::query(
        "insert into trip_member_sessions (
           id, trip_id, member_id, session_token_hash, expires_at
         )
         values (gen_random_uuid(), $1, $2, $3, now() + interval '30 days')",
    )
    .bind(Uuid::parse_str(TRIP_ID).unwrap())
    .bind(Uuid::parse_str(member_id).unwrap())
    .bind(sagittarius_api::app::auth::hash_session_token_for_tests(
        &token,
    ))
    .execute(pool)
    .await
    .unwrap();

    token
}

pub async fn create_session_with_expiry(
    pool: &PgPool,
    member_id: &str,
    expires_at: time::OffsetDateTime,
) -> String {
    let token = format!("test-token-{member_id}-{}", expires_at.unix_timestamp());
    sqlx::query(
        "insert into trip_member_sessions (
           id, trip_id, member_id, session_token_hash, expires_at
         )
         values (gen_random_uuid(), $1, $2, $3, $4)",
    )
    .bind(Uuid::parse_str(TRIP_ID).unwrap())
    .bind(Uuid::parse_str(member_id).unwrap())
    .bind(sagittarius_api::app::auth::hash_session_token_for_tests(
        &token,
    ))
    .bind(expires_at)
    .execute(pool)
    .await
    .unwrap();

    token
}

pub async fn set_trip_dates(pool: &PgPool, start_date: &str, end_date: &str) {
    sqlx::query(
        "update trips
         set start_date = $1::date, end_date = $2::date
         where id = $3",
    )
    .bind(start_date)
    .bind(end_date)
    .bind(Uuid::parse_str(TRIP_ID).unwrap())
    .execute(pool)
    .await
    .unwrap();
}

pub async fn stored_member_session_expires_at(
    pool: &PgPool,
    session_token: &str,
) -> time::OffsetDateTime {
    sqlx::query_scalar(
        "select expires_at
         from trip_member_sessions
         where session_token_hash = $1",
    )
    .bind(sagittarius_api::app::auth::hash_session_token_for_tests(
        session_token,
    ))
    .fetch_one(pool)
    .await
    .unwrap()
}

pub async fn seed_tasks(pool: &PgPool) {
    sqlx::query(
        "insert into trip_tasks (
           id, trip_id, title, status, visibility, kind, created_by, assignee_id
         )
         values
           (gen_random_uuid(), $1, 'Buy eSIM', 'open', 'private', 'prep', $2, $2),
           (gen_random_uuid(), $1, 'Book Peak Tram', 'done', 'shared', 'booking', $3, $3),
           (gen_random_uuid(), $1, 'Private owner task', 'open', 'private', 'prep', $3, $3)",
    )
    .bind(Uuid::parse_str(TRIP_ID).unwrap())
    .bind(Uuid::parse_str(TRAVELER_ID).unwrap())
    .bind(Uuid::parse_str(ORGANIZER_ID).unwrap())
    .execute(pool)
    .await
    .unwrap();
}

pub async fn seed_stop_note(pool: &PgPool) {
    sqlx::query(
        "insert into stop_notes (id, trip_id, itinerary_item_id, author_id, body, version)
         values ($1, $2, $3, $4, 'Bring printed booking voucher', 2)",
    )
    .bind(Uuid::parse_str(STOP_NOTE_ID).unwrap())
    .bind(Uuid::parse_str(TRIP_ID).unwrap())
    .bind(Uuid::parse_str(ITEM_ID).unwrap())
    .bind(Uuid::parse_str(TRAVELER_ID).unwrap())
    .execute(pool)
    .await
    .unwrap();
}

pub async fn seed_expense(pool: &PgPool) {
    let owner_id = Uuid::parse_str(OWNER_ID).unwrap();
    let traveler_id = Uuid::parse_str(TRAVELER_ID).unwrap();
    sqlx::query(
        "insert into expenses (
           id, trip_id, title, amount_minor, currency, paid_by, category, splits, itinerary_item_id
         )
         values ($1, $2, 'Dim sum breakfast', 24000, 'HKD', $3, 'food', $4, $5)",
    )
    .bind(Uuid::parse_str(EXPENSE_ID).unwrap())
    .bind(Uuid::parse_str(TRIP_ID).unwrap())
    .bind(owner_id)
    .bind(serde_json::json!({
        owner_id.to_string(): 12000,
        traveler_id.to_string(): 12000
    }))
    .bind(Uuid::parse_str(ITEM_ID).unwrap())
    .execute(pool)
    .await
    .unwrap();
}

pub async fn insert_event(pool: &PgPool, event_type: &str) -> Uuid {
    let id = Uuid::now_v7();
    sqlx::query(
        "insert into realtime_events (
           id, trip_id, aggregate_type, event_type, aggregate_id, version, payload, created_by
         )
         values ($1, $2, 'task', $3, gen_random_uuid(), 1, '{}'::jsonb, $4)",
    )
    .bind(id)
    .bind(Uuid::parse_str(TRIP_ID).unwrap())
    .bind(event_type)
    .bind(Uuid::parse_str(ORGANIZER_ID).unwrap())
    .execute(pool)
    .await
    .unwrap();
    id
}

pub async fn seed_suggestion(pool: &PgPool, source_version: i64) -> Uuid {
    seed_suggestion_for_plan(pool, PLAN_ID, source_version).await
}

pub async fn seed_plan_variant(pool: &PgPool) -> Uuid {
    let plan_id = Uuid::parse_str(ALT_PLAN_ID).unwrap();
    sqlx::query(
        "insert into plan_variants (id, trip_id, name, kind, description)
         values ($1, $2, 'Alternate', 'draft', 'Alternate plan')",
    )
    .bind(plan_id)
    .bind(Uuid::parse_str(TRIP_ID).unwrap())
    .execute(pool)
    .await
    .unwrap();
    plan_id
}

pub async fn seed_other_trip_item(pool: &PgPool) -> Uuid {
    let trip_id = Uuid::parse_str("018f4e80-5788-7de0-a45c-8a555d17fc2e").unwrap();
    let owner_id = Uuid::parse_str("018f4e81-77a4-7b8f-b3bd-0d0f493ac565").unwrap();
    let plan_id = Uuid::parse_str("018f4e82-3000-7c00-b111-000000000003").unwrap();
    let item_id = Uuid::parse_str("018f4e83-5410-7d8b-8f25-fd52c5e7bd20").unwrap();

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
           $1, 'Macau Side Trip', 'Macau', '2025-05-21', '2025-05-22',
           'MO-2025', $2, $3, $4
         )",
    )
    .bind(trip_id)
    .bind(sagittarius_api::app::auth::hash_secret_for_tests(
        "egg-tart-run",
    ))
    .bind(plan_id)
    .bind(owner_id)
    .execute(&mut *tx)
    .await
    .unwrap();
    sqlx::query(
        "insert into trip_members (id, trip_id, display_name, role, color)
         values ($1, $2, 'Other Owner', 'owner', '#0f766e')",
    )
    .bind(owner_id)
    .bind(trip_id)
    .execute(&mut *tx)
    .await
    .unwrap();
    sqlx::query(
        "insert into plan_variants (id, trip_id, name, kind, description)
         values ($1, $2, 'Other Main', 'main', 'Other trip plan')",
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
           $1, $2, $3, '2025-05-21', 100, '10:00', 'Egg Tart', 'food',
           'Taipa', 'https://maps.google.com', 30, 'walk', 'other trip item', $4, 1
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

    item_id
}

pub async fn seed_suggestion_for_plan(
    pool: &PgPool,
    plan_variant_id: &str,
    source_version: i64,
) -> Uuid {
    let id = Uuid::now_v7();
    sqlx::query(
        "insert into suggestions (
           id, trip_id, plan_variant_id, proposer_id, type, target_item_id, proposed_patch,
           source_version, status
         )
         values ($1, $2, $3, $4, 'edit', $5, $6, $7, 'pending')",
    )
    .bind(id)
    .bind(Uuid::parse_str(TRIP_ID).unwrap())
    .bind(Uuid::parse_str(plan_variant_id).unwrap())
    .bind(Uuid::parse_str(TRAVELER_ID).unwrap())
    .bind(Uuid::parse_str(ITEM_ID).unwrap())
    .bind(serde_json::json!({"note":"approved note"}))
    .bind(source_version)
    .execute(pool)
    .await
    .unwrap();
    id
}
