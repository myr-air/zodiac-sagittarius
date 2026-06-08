use axum::Json;
use axum::extract::{Path, State};
use uuid::Uuid;

use crate::api::extractors::BearerToken;
use crate::app;
use crate::app::AppState;
use crate::domain::errors::ServiceError;
use crate::domain::patches::{CreatePhotoAlbumLinkRequest, PatchPhotoAlbumLinkRequest};
use crate::domain::types::PhotoAlbumLinkSummary;

pub async fn create_photo_album_link(
    State(state): State<AppState>,
    Path(trip_id): Path<Uuid>,
    BearerToken(session_token): BearerToken,
    Json(request): Json<CreatePhotoAlbumLinkRequest>,
) -> Result<Json<PhotoAlbumLinkSummary>, ServiceError> {
    let album = app::photo_albums::create_photo_album_link(
        &state.pool,
        &state.realtime,
        trip_id,
        &session_token,
        request,
    )
    .await?;

    Ok(Json(album))
}

pub async fn patch_photo_album_link(
    State(state): State<AppState>,
    Path((trip_id, album_id)): Path<(Uuid, Uuid)>,
    BearerToken(session_token): BearerToken,
    Json(request): Json<PatchPhotoAlbumLinkRequest>,
) -> Result<Json<PhotoAlbumLinkSummary>, ServiceError> {
    let album = app::photo_albums::patch_photo_album_link(
        &state.pool,
        &state.realtime,
        trip_id,
        album_id,
        &session_token,
        request,
    )
    .await?;

    Ok(Json(album))
}

pub async fn delete_photo_album_link(
    State(state): State<AppState>,
    Path((trip_id, album_id)): Path<(Uuid, Uuid)>,
    BearerToken(session_token): BearerToken,
) -> Result<Json<PhotoAlbumLinkSummary>, ServiceError> {
    let album = app::photo_albums::delete_photo_album_link(
        &state.pool,
        &state.realtime,
        trip_id,
        album_id,
        &session_token,
    )
    .await?;

    Ok(Json(album))
}
