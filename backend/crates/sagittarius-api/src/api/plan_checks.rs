use axum::{
    Json,
    extract::{Path, State},
};
use serde::Deserialize;
use uuid::Uuid;

use crate::api::extractors::BearerToken;
use crate::app::{self, AppState};
use crate::domain::errors::ServiceError;
use crate::domain::types::{PlanCheckSummary, PlanSuggestionSummary};

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PatchPlanSuggestionRequest {
    pub expected_version: i64,
    pub status: String,
    pub snoozed_until: Option<String>,
}

pub async fn run_plan_check(
    State(state): State<AppState>,
    Path(trip_id): Path<Uuid>,
    BearerToken(session_token): BearerToken,
) -> Result<Json<PlanCheckSummary>, ServiceError> {
    Ok(Json(
        app::plan_checks::run_plan_check(&state.pool, trip_id, &session_token).await?,
    ))
}

pub async fn latest_plan_check(
    State(state): State<AppState>,
    Path(trip_id): Path<Uuid>,
    BearerToken(session_token): BearerToken,
) -> Result<Json<Option<PlanCheckSummary>>, ServiceError> {
    Ok(Json(
        app::plan_checks::latest_plan_check(&state.pool, trip_id, &session_token).await?,
    ))
}

pub async fn patch_plan_suggestion(
    State(state): State<AppState>,
    Path((trip_id, suggestion_id)): Path<(Uuid, Uuid)>,
    BearerToken(session_token): BearerToken,
    Json(request): Json<PatchPlanSuggestionRequest>,
) -> Result<Json<PlanSuggestionSummary>, ServiceError> {
    Ok(Json(
        app::plan_checks::patch_plan_suggestion(
            &state.pool,
            trip_id,
            suggestion_id,
            &session_token,
            &request.status,
            request.snoozed_until,
            request.expected_version,
        )
        .await?,
    ))
}
