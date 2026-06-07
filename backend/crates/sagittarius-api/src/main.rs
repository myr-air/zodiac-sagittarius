use uuid::Uuid;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    if std::path::Path::new("backend/.env").exists() {
        dotenvy::from_filename("backend/.env").ok();
    } else {
        dotenvy::dotenv().ok();
    }

    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env().unwrap_or_else(|_| "info".into()),
        )
        .init();
    let database_url = std::env::var("DATABASE_URL").map_err(|_| {
        std::io::Error::new(std::io::ErrorKind::NotFound, "DATABASE_URL must be set")
    })?;
    let bind_addr =
        std::env::var("SAGITTARIUS_BIND_ADDR").unwrap_or_else(|_| "127.0.0.1:5181".to_string());

    let pool = sqlx::postgres::PgPoolOptions::new()
        .connect(&database_url)
        .await?;

    if is_sample_seed_enabled() {
        if let Err(error) = seed_sample_trip_data(&pool).await {
            tracing::warn!(
                error = %error,
                "seed sample trip data failed; continuing without sample data"
            );
        } else {
            tracing::info!("seed sample trip data applied");
        }
    }

    let listener = tokio::net::TcpListener::bind(&bind_addr).await?;
    let app = sagittarius_api::api::router(sagittarius_api::app::AppState::with_pool(pool));

    tracing::info!(
        contract_version = sagittarius_api::backend_contract_version(),
        bind_addr,
        "sagittarius-api listening"
    );
    println!(
        "sagittarius-api {} listening on {bind_addr}",
        sagittarius_api::backend_contract_version()
    );

    axum::serve(listener, app).await?;

    Ok(())
}

fn should_seed_sample_data_for_env(env: &str) -> bool {
    matches!(env, "development" | "staging")
}

fn is_sample_seed_enabled() -> bool {
    let seed_flag = std::env::var("SAGITTARIUS_SEED_SAMPLE_DATA")
        .map(|value| {
            matches!(
                value.to_ascii_lowercase().as_str(),
                "1" | "true" | "yes" | "on"
            )
        })
        .unwrap_or(false);
    if !seed_flag {
        return false;
    }

    let runtime_env = std::env::var("SAGITTARIUS_ENV").unwrap_or_default();
    should_seed_sample_data_for_env(&runtime_env)
}

async fn seed_sample_trip_data(pool: &sqlx::PgPool) -> Result<(), sqlx::Error> {
    const TRIP_ID: &str = "018f4e80-5788-7de0-a45c-8a555d17fc2d";
    const OWNER_ID: &str = "018f4e81-77a4-7b8f-b3bd-0d0f493ac561";
    const ORGANIZER_ID: &str = "018f4e81-77a4-7b8f-b3bd-0d0f493ac562";
    const TRAVELER_ID: &str = "018f4e81-77a4-7b8f-b3bd-0d0f493ac563";
    const VIEWER_ID: &str = "018f4e81-77a4-7b8f-b3bd-0d0f493ac564";
    const PLAN_ID: &str = "018f4e82-3000-7c00-b111-000000000001";
    const ITEM_ID: &str = "018f4e83-5410-7d8b-8f25-fd52c5e7bd1f";
    const TASK_ESIM_ID: &str = "018f4e85-2222-7000-8000-000000000001";
    const TASK_PEAK_TRAM_ID: &str = "018f4e85-2222-7000-8000-000000000002";
    const EXPENSE_ID: &str = "018f4e86-1111-7000-8000-000000000001";

    let trip_id = Uuid::parse_str(TRIP_ID).expect("static uuid");
    let owner_id = Uuid::parse_str(OWNER_ID).expect("static uuid");
    let organizer_id = Uuid::parse_str(ORGANIZER_ID).expect("static uuid");
    let traveler_id = Uuid::parse_str(TRAVELER_ID).expect("static uuid");
    let viewer_id = Uuid::parse_str(VIEWER_ID).expect("static uuid");
    let plan_id = Uuid::parse_str(PLAN_ID).expect("static uuid");
    let item_id = Uuid::parse_str(ITEM_ID).expect("static uuid");

    let mut tx = pool.begin().await?;
    sqlx::query(
        "insert into trips (
           id, name, destination_label, countries, start_date, end_date, join_id, join_password_hash,
           active_plan_variant_id, owner_member_id
         )
         values (
           $1, 'Hong Kong + Shenzhen Trip', 'Hong Kong + Shenzhen', $2, '2026-06-18',
           '2026-06-23', 'HK-SZ-2025', $3, $4, $5
         )
         on conflict (join_id) do update
         set name = excluded.name,
             destination_label = excluded.destination_label,
             countries = excluded.countries,
             start_date = excluded.start_date,
             end_date = excluded.end_date,
             join_password_hash = excluded.join_password_hash,
             active_plan_variant_id = excluded.active_plan_variant_id,
             owner_member_id = excluded.owner_member_id,
             updated_at = now()",
    )
    .bind(trip_id)
    .bind(vec!["HK".to_string(), "CN".to_string()])
    .bind(sagittarius_api::app::auth::hash_secret_for_tests(
        "seed-trip-pass",
    ))
    .bind(plan_id)
    .bind(owner_id)
    .execute(&mut *tx)
    .await?;

    sqlx::query("set constraints all deferred")
        .execute(&mut *tx)
        .await?;

    sqlx::query(
        "insert into trip_members (id, trip_id, display_name, role, color, access_status, claim_password_hash, claimed_at)
         values
           ($1, $5, 'Aom', 'owner', '#0f766e', 'active', null, null),
           ($2, $5, 'Beam', 'organizer', '#2563eb', 'active', null, null),
           ($3, $5, 'Nam', 'traveler', '#f97316', 'active', null, null),
           ($4, $5, 'Family', 'viewer', '#64748b', 'active', null, null)
         on conflict (id, trip_id) do update
         set display_name = excluded.display_name,
             role = excluded.role,
             color = excluded.color,
             access_status = excluded.access_status,
             claim_password_hash = excluded.claim_password_hash,
             claimed_at = excluded.claimed_at,
             updated_at = now()",
    )
    .bind(owner_id)
    .bind(organizer_id)
    .bind(traveler_id)
    .bind(viewer_id)
    .bind(trip_id)
    .execute(&mut *tx)
    .await?;

    sqlx::query(
        "insert into plan_variants (id, trip_id, name, kind, description)
         values ($1, $2, 'Main', 'main', 'Primary plan')
         on conflict (id, trip_id) do nothing",
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
         )
         on conflict (id, trip_id) do nothing",
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

    sqlx::query(
        "insert into trip_tasks (
           id, trip_id, title, status, visibility, kind, created_by, assignee_id
         )
         values
           ($4, $1, 'Buy eSIM', 'open', 'private', 'prep', $2, $2),
           ($5, $1, 'Book Peak Tram', 'done', 'shared', 'booking', $3, $3)
         on conflict (id) do update
         set title = excluded.title,
             status = excluded.status,
             visibility = excluded.visibility,
             kind = excluded.kind,
             assignee_id = excluded.assignee_id,
             updated_at = now()",
    )
    .bind(trip_id)
    .bind(traveler_id)
    .bind(organizer_id)
    .bind(Uuid::parse_str(TASK_ESIM_ID).expect("static uuid"))
    .bind(Uuid::parse_str(TASK_PEAK_TRAM_ID).expect("static uuid"))
    .execute(&mut *tx)
    .await?;

    sqlx::query(
        "insert into expenses (
           id, trip_id, title, amount_minor, currency, paid_by, category, splits
         )
         values (
           $4, $1, 'Dim sum breakfast', 24000, 'HKD', $2, 'food',
           $3::jsonb
         )
         on conflict (id) do update
         set title = excluded.title,
             amount_minor = excluded.amount_minor,
             currency = excluded.currency,
             paid_by = excluded.paid_by,
             category = excluded.category,
             splits = excluded.splits,
             updated_at = now()",
    )
    .bind(trip_id)
    .bind(owner_id)
    .bind(serde_json::json!({
        owner_id.to_string(): 12000,
        traveler_id.to_string(): 12000
    }))
    .bind(Uuid::parse_str(EXPENSE_ID).expect("static uuid"))
    .execute(&mut *tx)
    .await?;

    tx.commit().await
}
