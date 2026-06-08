use axum::{Json, extract::State, http::StatusCode};
use serde::Serialize;
use tokio::time::{Duration, timeout};

use crate::app::AppState;

#[derive(Serialize)]
pub struct HealthResponse {
    status: &'static str,
}

#[derive(Serialize)]
pub struct VersionResponse {
    #[serde(rename = "buildSha")]
    build_sha: &'static str,
    #[serde(rename = "buildTime")]
    build_time: &'static str,
    environment: &'static str,
    #[serde(rename = "schemaVersion")]
    schema_version: &'static str,
    service: &'static str,
    version: &'static str,
}

pub async fn liveness() -> &'static str {
    "ok"
}

pub async fn version() -> Json<VersionResponse> {
    Json(VersionResponse {
        build_sha: option_env!("SAGITTARIUS_BUILD_SHA").unwrap_or("unavailable"),
        build_time: option_env!("SAGITTARIUS_BUILD_TIME").unwrap_or("unavailable"),
        environment: option_env!("SAGITTARIUS_ENVIRONMENT").unwrap_or("local"),
        schema_version: "0019_photo_album_links",
        service: env!("CARGO_PKG_NAME"),
        version: env!("CARGO_PKG_VERSION"),
    })
}

pub async fn readiness(State(state): State<AppState>) -> (StatusCode, Json<HealthResponse>) {
    let check = timeout(
        Duration::from_secs(2),
        sqlx::query_scalar::<_, i32>("select 1").fetch_one(&state.pool),
    )
    .await;

    match check {
        Ok(Ok(1)) => (StatusCode::OK, Json(HealthResponse { status: "ready" })),
        Ok(_) | Err(_) => (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(HealthResponse { status: "unready" }),
        ),
    }
}
