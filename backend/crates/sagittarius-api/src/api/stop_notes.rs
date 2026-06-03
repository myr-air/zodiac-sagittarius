use axum::Json;
use axum::extract::{Path, State};
use uuid::Uuid;

use crate::api::extractors::BearerToken;
use crate::app;
use crate::app::AppState;
use crate::domain::errors::ServiceError;
use crate::domain::patches::{CreateStopNoteRequest, PatchStopNoteRequest};
use crate::domain::types::StopNoteSummary;

pub async fn create_stop_note(
    State(state): State<AppState>,
    Path(trip_id): Path<Uuid>,
    BearerToken(session_token): BearerToken,
    Json(request): Json<CreateStopNoteRequest>,
) -> Result<Json<StopNoteSummary>, ServiceError> {
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

pub async fn patch_stop_note(
    State(state): State<AppState>,
    Path((trip_id, note_id)): Path<(Uuid, Uuid)>,
    BearerToken(session_token): BearerToken,
    Json(request): Json<PatchStopNoteRequest>,
) -> Result<Json<StopNoteSummary>, ServiceError> {
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

pub async fn delete_stop_note(
    State(state): State<AppState>,
    Path((trip_id, note_id)): Path<(Uuid, Uuid)>,
    BearerToken(session_token): BearerToken,
) -> Result<Json<StopNoteSummary>, ServiceError> {
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
