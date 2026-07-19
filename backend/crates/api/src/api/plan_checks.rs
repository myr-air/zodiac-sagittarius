use axum::{
    Json, Router,
    extract::{Path, Query, State},
    routing::{get, patch, post},
};
use serde::Deserialize;
use serde_json::Value as JsonValue;
use uuid::Uuid;

use crate::api::extractors::BearerToken;
use crate::app::{self, AppState};
use crate::api::error::ApiError;
use crate::domain::types::{PlanCheckSummary, PlanSuggestionSummary};

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PatchPlanSuggestionRequest {
    pub expected_version: i64,
    pub status: String,
    pub snoozed_until: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PlanCheckQuery {
    pub trip_plan_id: Option<Uuid>,
}

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/trips/{trip_id}/plan-checks", post(run_plan_check))
        .route(
            "/trips/{trip_id}/plan-checks/latest",
            get(latest_plan_check),
        )
        .route(
            "/trips/{trip_id}/plan-suggestions/{suggestion_id}",
            patch(patch_plan_suggestion),
        )
}

#[utoipa::path(
    post,
    path = "/trips/{trip_id}/plan-checks",
    params(
        ("trip_id" = String, Path, description = "Trip id"),
        ("trip_plan_id" = Option<String>, Query, description = "Optional trip plan id")
    ),
    responses(
        (status = 200, description = "Plan check run", body = JsonValue)
    ),
    tag = "plan_checks"
)]
pub async fn run_plan_check(
    State(state): State<AppState>,
    Path(trip_id): Path<Uuid>,
    Query(query): Query<PlanCheckQuery>,
    BearerToken(session_token): BearerToken,
) -> Result<Json<PlanCheckSummary>, ApiError> {
    Ok(Json(
        app::plan_checks::run_plan_check(&state.pool, trip_id, &session_token, query.trip_plan_id)
            .await?,
    ))
}

#[utoipa::path(
    get,
    path = "/trips/{trip_id}/plan-checks/latest",
    params(
        ("trip_id" = String, Path, description = "Trip id"),
        ("trip_plan_id" = Option<String>, Query, description = "Optional trip plan id")
    ),
    responses(
        (status = 200, description = "Latest plan check", body = JsonValue)
    ),
    tag = "plan_checks"
)]
pub async fn latest_plan_check(
    State(state): State<AppState>,
    Path(trip_id): Path<Uuid>,
    Query(query): Query<PlanCheckQuery>,
    BearerToken(session_token): BearerToken,
) -> Result<Json<Option<PlanCheckSummary>>, ApiError> {
    Ok(Json(
        app::plan_checks::latest_plan_check(
            &state.pool,
            trip_id,
            &session_token,
            query.trip_plan_id,
        )
        .await?,
    ))
}

#[utoipa::path(
    patch,
    path = "/trips/{trip_id}/plan-suggestions/{suggestion_id}",
    params(
        ("trip_id" = String, Path, description = "Trip id"),
        ("suggestion_id" = String, Path, description = "Plan suggestion id")
    ),
    request_body = JsonValue,
    responses(
        (status = 200, description = "Plan suggestion updated", body = JsonValue)
    ),
    tag = "plan_checks"
)]
pub async fn patch_plan_suggestion(
    State(state): State<AppState>,
    Path((trip_id, suggestion_id)): Path<(Uuid, Uuid)>,
    BearerToken(session_token): BearerToken,
    Json(request): Json<PatchPlanSuggestionRequest>,
) -> Result<Json<PlanSuggestionSummary>, ApiError> {
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
