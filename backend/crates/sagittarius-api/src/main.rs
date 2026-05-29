#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    tracing_subscriber::fmt().with_env_filter("info").init();
    let database_url = std::env::var("DATABASE_URL").map_err(|_| {
        std::io::Error::new(std::io::ErrorKind::NotFound, "DATABASE_URL must be set")
    })?;
    let bind_addr =
        std::env::var("SAGITTARIUS_BIND_ADDR").unwrap_or_else(|_| "127.0.0.1:5181".to_string());

    let pool = sqlx::postgres::PgPoolOptions::new()
        .connect(&database_url)
        .await?;
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
