use axum::Json;
use axum::Router;
use axum::extract::{Path, State};
use axum::routing::{patch, post};
use uuid::Uuid;

use crate::api::extractors::BearerToken;
use crate::app;
use crate::app::AppState;
use crate::api::error::ApiError;
use crate::domain::patches::{CreateStopNoteRequest, PatchStopNoteRequest};
use crate::domain::types::StopNoteSummary;

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/trips/{trip_id}/stop-notes", post(create_stop_note))
        .route(
            "/trips/{trip_id}/stop-notes/{note_id}",
            patch(patch_stop_note).delete(delete_stop_note),
        )
}

#[utoipa::path(
    post,
    path = "/trips/{trip_id}/stop-notes",
    params(
        ("trip_id" = String, Path, description = "Trip id")
    ),
    request_body = CreateStopNoteRequest,
    responses(
        (status = 200, description = "Stop note created", body = StopNoteSummary)
    ),
    tag = "stop_notes"
)]
pub async fn create_stop_note(
    State(state): State<AppState>,
    Path(trip_id): Path<Uuid>,
    BearerToken(session_token): BearerToken,
    Json(request): Json<CreateStopNoteRequest>,
) -> Result<Json<StopNoteSummary>, ApiError> {
    let note = app::stop_notes::create_stop_note(
        &state.pool,
        &state.realtime,
        trip_id,
        &session_token,
        request,
    )
    .await?;

    Ok(Json(note))
}

#[utoipa::path(
    patch,
    path = "/trips/{trip_id}/stop-notes/{note_id}",
    params(
        ("trip_id" = String, Path, description = "Trip id"),
        ("note_id" = String, Path, description = "Stop note id")
    ),
    request_body = PatchStopNoteRequest,
    responses(
        (status = 200, description = "Stop note updated", body = StopNoteSummary)
    ),
    tag = "stop_notes"
)]
pub async fn patch_stop_note(
    State(state): State<AppState>,
    Path((trip_id, note_id)): Path<(Uuid, Uuid)>,
    BearerToken(session_token): BearerToken,
    Json(request): Json<PatchStopNoteRequest>,
) -> Result<Json<StopNoteSummary>, ApiError> {
    let note = app::stop_notes::patch_stop_note(
        &state.pool,
        &state.realtime,
        trip_id,
        note_id,
        &session_token,
        request,
    )
    .await?;

    Ok(Json(note))
}

#[utoipa::path(
    delete,
    path = "/trips/{trip_id}/stop-notes/{note_id}",
    params(
        ("trip_id" = String, Path, description = "Trip id"),
        ("note_id" = String, Path, description = "Stop note id")
    ),
    responses(
        (status = 200, description = "Stop note deleted", body = StopNoteSummary)
    ),
    tag = "stop_notes"
)]
pub async fn delete_stop_note(
    State(state): State<AppState>,
    Path((trip_id, note_id)): Path<(Uuid, Uuid)>,
    BearerToken(session_token): BearerToken,
) -> Result<Json<StopNoteSummary>, ApiError> {
    let note = app::stop_notes::delete_stop_note(
        &state.pool,
        &state.realtime,
        trip_id,
        note_id,
        &session_token,
    )
    .await?;

    Ok(Json(note))
}
