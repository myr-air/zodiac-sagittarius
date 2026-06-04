use axum::Json;
use axum::extract::{Path, State};
use time::Date;
use uuid::Uuid;

use crate::api::extractors::BearerToken;
use crate::app;
use crate::app::AppState;
use crate::domain::errors::ServiceError;
use crate::domain::patches::PatchDailyBriefingRequest;
use crate::domain::types::TripDailyBriefing;

pub async fn list_daily_briefings(
    State(state): State<AppState>,
    Path(trip_id): Path<Uuid>,
    BearerToken(session_token): BearerToken,
) -> Result<Json<Vec<TripDailyBriefing>>, ServiceError> {
    let briefings =
        app::daily_briefings::list_daily_briefings(&state.pool, trip_id, &session_token).await?;

    Ok(Json(briefings))
}

pub async fn patch_daily_briefing(
    State(state): State<AppState>,
    Path((trip_id, date)): Path<(Uuid, Date)>,
    BearerToken(session_token): BearerToken,
    Json(request): Json<PatchDailyBriefingRequest>,
) -> Result<Json<TripDailyBriefing>, ServiceError> {
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
