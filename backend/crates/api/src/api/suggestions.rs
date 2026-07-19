use axum::extract::{Path, State};
use axum::routing::{patch, post};
use axum::{Json, Router, http::StatusCode};
use serde::Deserialize;
use uuid::Uuid;
use utoipa::ToSchema;

use crate::api::extractors::BearerToken;
use crate::app;
use crate::app::AppState;
use crate::api::error::ApiError;
use crate::domain::patches::CreateSuggestionRequest;
use crate::domain::types::SuggestionSummary;

#[derive(ToSchema, Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PatchSuggestionRequest {
    pub status: SuggestionResolutionStatus,
}

#[derive(ToSchema, Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum SuggestionResolutionStatus {
    Approved,
    Rejected,
}

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/trips/{trip_id}/suggestions", post(create_suggestion))
        .route(
            "/trips/{trip_id}/suggestions/{suggestion_id}",
            patch(patch_suggestion),
        )
}

#[utoipa::path(
    post,
    path = "/trips/{trip_id}/suggestions",
    params(
        ("trip_id" = String, Path, description = "Trip id")
    ),
    request_body = CreateSuggestionRequest,
    responses(
        (status = 201, description = "Suggestion created", body = SuggestionSummary)
    ),
    tag = "suggestions"
)]
pub async fn create_suggestion(
    State(state): State<AppState>,
    Path(trip_id): Path<Uuid>,
    BearerToken(session_token): BearerToken,
    Json(request): Json<CreateSuggestionRequest>,
) -> Result<(StatusCode, Json<SuggestionSummary>), ApiError> {
    let suggestion = app::suggestions::create_suggestion(
        &state.pool,
        &state.realtime,
        trip_id,
        &session_token,
        request,
    )
    .await?;

    Ok((StatusCode::CREATED, Json(suggestion)))
}

pub async fn approve_suggestion(
    State(state): State<AppState>,
    Path((trip_id, suggestion_id)): Path<(Uuid, Uuid)>,
    BearerToken(session_token): BearerToken,
) -> Result<Json<SuggestionSummary>, ApiError> {
    let suggestion = app::suggestions::approve_suggestion(
        &state.pool,
        &state.realtime,
        trip_id,
        suggestion_id,
        &session_token,
    )
    .await?;

    Ok(Json(suggestion))
}

pub async fn reject_suggestion(
    State(state): State<AppState>,
    Path((trip_id, suggestion_id)): Path<(Uuid, Uuid)>,
    BearerToken(session_token): BearerToken,
) -> Result<Json<SuggestionSummary>, ApiError> {
    let suggestion = app::suggestions::reject_suggestion(
        &state.pool,
        &state.realtime,
        trip_id,
        suggestion_id,
        &session_token,
    )
    .await?;

    Ok(Json(suggestion))
}

#[utoipa::path(
    patch,
    path = "/trips/{trip_id}/suggestions/{suggestion_id}",
    params(
        ("trip_id" = String, Path, description = "Trip id"),
        ("suggestion_id" = String, Path, description = "Suggestion id")
    ),
    request_body = PatchSuggestionRequest,
    responses(
        (status = 200, description = "Suggestion resolved", body = SuggestionSummary)
    ),
    tag = "suggestions"
)]
pub async fn patch_suggestion(
    State(state): State<AppState>,
    Path((trip_id, suggestion_id)): Path<(Uuid, Uuid)>,
    BearerToken(session_token): BearerToken,
    Json(request): Json<PatchSuggestionRequest>,
) -> Result<Json<SuggestionSummary>, ApiError> {
    let suggestion = match request.status {
        SuggestionResolutionStatus::Approved => {
            app::suggestions::approve_suggestion(
                &state.pool,
                &state.realtime,
                trip_id,
                suggestion_id,
                &session_token,
            )
            .await?
        }
        SuggestionResolutionStatus::Rejected => {
            app::suggestions::reject_suggestion(
                &state.pool,
                &state.realtime,
                trip_id,
                suggestion_id,
                &session_token,
            )
            .await?
        }
    };

    Ok(Json(suggestion))
}
