use axum::{Json, extract::State, http::StatusCode};
use serde::Serialize;
use tokio::time::{Duration, timeout};

use crate::app::AppState;

#[derive(Serialize)]
pub struct HealthResponse {
    status: &'static str,
}

pub async fn liveness() -> &'static str {
    "ok"
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
