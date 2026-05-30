use axum::extract::{Path, State};
use axum::{Json, http::StatusCode};
use uuid::Uuid;

use crate::api::extractors::BearerToken;
use crate::app;
use crate::app::AppState;
use crate::domain::errors::ServiceError;
use crate::domain::patches::{CreateTaskRequest, PatchTaskRequest};
use crate::domain::types::TripTaskSummary;

pub async fn create_task(
    State(state): State<AppState>,
    Path(trip_id): Path<Uuid>,
    BearerToken(session_token): BearerToken,
    Json(request): Json<CreateTaskRequest>,
) -> Result<(StatusCode, Json<TripTaskSummary>), ServiceError> {
    let task = app::tasks::create_task(
        &state.pool,
        &state.realtime,
        trip_id,
        &session_token,
        request,
    )
    .await?;

    Ok((StatusCode::CREATED, Json(task)))
}

pub async fn patch_task(
    State(state): State<AppState>,
    Path((trip_id, task_id)): Path<(Uuid, Uuid)>,
    BearerToken(session_token): BearerToken,
    Json(request): Json<PatchTaskRequest>,
) -> Result<Json<TripTaskSummary>, ServiceError> {
    let task = app::tasks::patch_task(
        &state.pool,
        &state.realtime,
        trip_id,
        task_id,
        &session_token,
        request,
    )
    .await?;

    Ok(Json(task))
}
