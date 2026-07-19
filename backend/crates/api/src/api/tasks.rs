use axum::extract::{Path, State};
use axum::routing::{patch, post};
use axum::{Json, Router, http::StatusCode};
use uuid::Uuid;

use crate::api::extractors::BearerToken;
use crate::app;
use crate::app::AppState;
use crate::api::error::ApiError;
use crate::domain::patches::{CreateTaskRequest, PatchTaskRequest};
use crate::domain::types::TripTaskSummary;

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/trips/{trip_id}/tasks", post(create_task))
        .route("/trips/{trip_id}/tasks/{task_id}", patch(patch_task))
}

#[utoipa::path(
    post,
    path = "/trips/{trip_id}/tasks",
    params(
        ("trip_id" = String, Path, description = "Trip id")
    ),
    request_body = CreateTaskRequest,
    responses(
        (status = 201, description = "Task created", body = TripTaskSummary)
    ),
    tag = "tasks"
)]
pub async fn create_task(
    State(state): State<AppState>,
    Path(trip_id): Path<Uuid>,
    BearerToken(session_token): BearerToken,
    Json(request): Json<CreateTaskRequest>,
) -> Result<(StatusCode, Json<TripTaskSummary>), ApiError> {
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

#[utoipa::path(
    patch,
    path = "/trips/{trip_id}/tasks/{task_id}",
    params(
        ("trip_id" = String, Path, description = "Trip id"),
        ("task_id" = String, Path, description = "Task id")
    ),
    request_body = PatchTaskRequest,
    responses(
        (status = 200, description = "Task updated", body = TripTaskSummary)
    ),
    tag = "tasks"
)]
pub async fn patch_task(
    State(state): State<AppState>,
    Path((trip_id, task_id)): Path<(Uuid, Uuid)>,
    BearerToken(session_token): BearerToken,
    Json(request): Json<PatchTaskRequest>,
) -> Result<Json<TripTaskSummary>, ApiError> {
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
