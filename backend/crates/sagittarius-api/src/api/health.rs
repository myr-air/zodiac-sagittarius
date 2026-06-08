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
    environment: String,
    #[serde(rename = "schemaVersion")]
    schema_version: &'static str,
    service: &'static str,
    version: &'static str,
}

pub async fn liveness() -> &'static str {
    "ok"
}

pub async fn version() -> Json<VersionResponse> {
    let version_environment = std::env::var("SAGITTARIUS_ENVIRONMENT").ok();
    let runtime_environment = std::env::var("SAGITTARIUS_ENV").ok();

    Json(VersionResponse {
        build_sha: option_env!("SAGITTARIUS_BUILD_SHA").unwrap_or("unavailable"),
        build_time: option_env!("SAGITTARIUS_BUILD_TIME").unwrap_or("unavailable"),
        environment: resolve_version_environment(
            version_environment.as_deref(),
            runtime_environment.as_deref(),
        ),
        schema_version: "0019_photo_album_links",
        service: env!("CARGO_PKG_NAME"),
        version: env!("CARGO_PKG_VERSION"),
    })
}

fn resolve_version_environment(primary: Option<&str>, fallback: Option<&str>) -> String {
    primary
        .and_then(non_empty)
        .or_else(|| fallback.and_then(non_empty))
        .unwrap_or("local")
        .to_string()
}

fn non_empty(value: &str) -> Option<&str> {
    let trimmed = value.trim();
    if trimmed.is_empty() {
        None
    } else {
        Some(trimmed)
    }
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

#[cfg(test)]
mod tests {
    use super::resolve_version_environment;

    #[test]
    fn resolves_runtime_environment_before_defaulting_to_local() {
        assert_eq!(
            resolve_version_environment(Some("production"), Some("staging")),
            "production",
        );
        assert_eq!(
            resolve_version_environment(None, Some("staging")),
            "staging"
        );
        assert_eq!(
            resolve_version_environment(Some(" "), Some("staging")),
            "staging"
        );
        assert_eq!(resolve_version_environment(None, None), "local");
    }
}
