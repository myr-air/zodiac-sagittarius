use axum::Json;
use axum::Router;
use axum::extract::{Path, State};
use axum::routing::post;
use uuid::Uuid;

use crate::api::error::ApiError;
use crate::api::extractors::BearerToken;
use crate::app;
use crate::app::AppState;
use crate::domain::types::{
    DayPlanAssistRequest, DayPlanAssistResolutionRequest, DayPlanAssistResolutionResponse,
    DayPlanAssistResponse,
};

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/trips/{trip_id}/day-plan-assist", post(day_plan_assist))
        .route(
            "/trips/{trip_id}/day-plan-assist/batches/{batch_id}/options/{option_id}/accept",
            post(accept_option),
        )
        .route(
            "/trips/{trip_id}/day-plan-assist/batches/{batch_id}/options/{option_id}/reject",
            post(reject_option),
        )
}

#[utoipa::path(
    post,
    path = "/trips/{trip_id}/day-plan-assist",
    params(
        ("trip_id" = String, Path, description = "Trip id")
    ),
    request_body = DayPlanAssistRequest,
    responses(
        (status = 200, description = "Day plan assist options", body = DayPlanAssistResponse)
    ),
    tag = "day_plan_assist"
)]
pub async fn day_plan_assist(
    State(state): State<AppState>,
    Path(trip_id): Path<Uuid>,
    BearerToken(session_token): BearerToken,
    Json(request): Json<DayPlanAssistRequest>,
) -> Result<Json<DayPlanAssistResponse>, ApiError> {
    Ok(Json(
        app::day_plan_assist::day_plan_assist(
            &state.pool,
            &state.day_plan_assist_batches,
            trip_id,
            &session_token,
            request,
        )
        .await?,
    ))
}

#[utoipa::path(
    post,
    path = "/trips/{trip_id}/day-plan-assist/batches/{batch_id}/options/{option_id}/accept",
    params(
        ("trip_id" = String, Path, description = "Trip id"),
        ("batch_id" = String, Path, description = "Suggestion batch id"),
        ("option_id" = String, Path, description = "Option id to accept")
    ),
    request_body = DayPlanAssistResolutionRequest,
    responses(
        (status = 200, description = "Accepted option applied", body = DayPlanAssistResolutionResponse)
    ),
    tag = "day_plan_assist"
)]
pub async fn accept_option(
    State(state): State<AppState>,
    Path((trip_id, batch_id, option_id)): Path<(Uuid, Uuid, Uuid)>,
    BearerToken(session_token): BearerToken,
    Json(request): Json<DayPlanAssistResolutionRequest>,
) -> Result<Json<DayPlanAssistResolutionResponse>, ApiError> {
    Ok(Json(
        app::day_plan_assist::accept_option(
            &state.pool,
            &state.realtime,
            &state.day_plan_assist_batches,
            trip_id,
            batch_id,
            option_id,
            &session_token,
            request,
        )
        .await?,
    ))
}

#[utoipa::path(
    post,
    path = "/trips/{trip_id}/day-plan-assist/batches/{batch_id}/options/{option_id}/reject",
    params(
        ("trip_id" = String, Path, description = "Trip id"),
        ("batch_id" = String, Path, description = "Suggestion batch id"),
        ("option_id" = String, Path, description = "Option id to reject")
    ),
    request_body = DayPlanAssistResolutionRequest,
    responses(
        (status = 200, description = "Option rejected", body = DayPlanAssistResolutionResponse)
    ),
    tag = "day_plan_assist"
)]
pub async fn reject_option(
    State(state): State<AppState>,
    Path((trip_id, batch_id, option_id)): Path<(Uuid, Uuid, Uuid)>,
    BearerToken(session_token): BearerToken,
    Json(request): Json<DayPlanAssistResolutionRequest>,
) -> Result<Json<DayPlanAssistResolutionResponse>, ApiError> {
    Ok(Json(
        app::day_plan_assist::reject_option(
            &state.pool,
            &state.day_plan_assist_batches,
            trip_id,
            batch_id,
            option_id,
            &session_token,
            request,
        )
        .await?,
    ))
}
