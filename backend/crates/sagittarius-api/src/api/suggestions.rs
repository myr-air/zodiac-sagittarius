use axum::extract::{Path, State};
use axum::{Json, http::StatusCode};
use serde::Deserialize;
use uuid::Uuid;

use crate::api::extractors::BearerToken;
use crate::app;
use crate::app::AppState;
use crate::domain::errors::ServiceError;
use crate::domain::patches::CreateSuggestionRequest;
use crate::domain::types::SuggestionSummary;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PatchSuggestionRequest {
    pub status: SuggestionResolutionStatus,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum SuggestionResolutionStatus {
    Approved,
    Rejected,
}

pub async fn create_suggestion(
    State(state): State<AppState>,
    Path(trip_id): Path<Uuid>,
    BearerToken(session_token): BearerToken,
    Json(request): Json<CreateSuggestionRequest>,
) -> Result<(StatusCode, Json<SuggestionSummary>), ServiceError> {
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
) -> Result<Json<SuggestionSummary>, ServiceError> {
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
) -> Result<Json<SuggestionSummary>, ServiceError> {
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

pub async fn patch_suggestion(
    State(state): State<AppState>,
    Path((trip_id, suggestion_id)): Path<(Uuid, Uuid)>,
    BearerToken(session_token): BearerToken,
    Json(request): Json<PatchSuggestionRequest>,
) -> Result<Json<SuggestionSummary>, ServiceError> {
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
