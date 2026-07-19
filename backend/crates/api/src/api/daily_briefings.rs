use axum::Json;
use axum::Router;
use axum::extract::{Path, State};
use axum::routing::{get, patch};
use serde_json::Value as JsonValue;
use time::Date;
use uuid::Uuid;

use crate::api::extractors::BearerToken;
use crate::app;
use crate::app::AppState;
use crate::api::error::ApiError;
use crate::domain::patches::PatchDailyBriefingRequest;
use crate::domain::types::TripDailyBriefing;

pub fn routes() -> Router<AppState> {
    Router::new()
        .route(
            "/trips/{trip_id}/daily-briefings",
            get(list_daily_briefings),
        )
        .route(
            "/trips/{trip_id}/daily-briefings/{date}",
            patch(patch_daily_briefing),
        )
}

#[utoipa::path(
    get,
    path = "/trips/{trip_id}/daily-briefings",
    params(
        ("trip_id" = String, Path, description = "Trip id")
    ),
    responses(
        (status = 200, description = "Daily briefings listed", body = JsonValue)
    ),
    tag = "daily_briefings"
)]
pub async fn list_daily_briefings(
    State(state): State<AppState>,
    Path(trip_id): Path<Uuid>,
    BearerToken(session_token): BearerToken,
) -> Result<Json<Vec<TripDailyBriefing>>, ApiError> {
    let briefings = app::daily_briefings::list_daily_briefings(
        &state.pool,
        trip_id,
        &session_token,
        state.daily_briefing_weather_fetch,
    )
    .await?;

    Ok(Json(briefings))
}

#[utoipa::path(
    patch,
    path = "/trips/{trip_id}/daily-briefings/{date}",
    params(
        ("trip_id" = String, Path, description = "Trip id"),
        ("date" = String, Path, description = "Briefing date (YYYY-MM-DD)")
    ),
    request_body = JsonValue,
    responses(
        (status = 200, description = "Daily briefing updated", body = JsonValue)
    ),
    tag = "daily_briefings"
)]
pub async fn patch_daily_briefing(
    State(state): State<AppState>,
    Path((trip_id, date)): Path<(Uuid, Date)>,
    BearerToken(session_token): BearerToken,
    Json(request): Json<PatchDailyBriefingRequest>,
) -> Result<Json<TripDailyBriefing>, ApiError> {
    let briefing = app::daily_briefings::patch_daily_briefing(
        &state.pool,
        trip_id,
        date,
        &session_token,
        request,
    )
    .await?;

    Ok(Json(briefing))
}
