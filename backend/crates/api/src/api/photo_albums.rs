use axum::Json;
use axum::Router;
use axum::extract::{Path, State};
use axum::routing::{patch, post};
use serde_json::Value as JsonValue;
use uuid::Uuid;

use crate::api::extractors::BearerToken;
use crate::app;
use crate::app::AppState;
use crate::api::error::ApiError;
use crate::domain::patches::{CreatePhotoAlbumLinkRequest, PatchPhotoAlbumLinkRequest};
use crate::domain::types::PhotoAlbumLinkSummary;

pub fn routes() -> Router<AppState> {
    Router::new()
        .route(
            "/trips/{trip_id}/photo-albums",
            post(create_photo_album_link),
        )
        .route(
            "/trips/{trip_id}/photo-albums/{album_id}",
            patch(patch_photo_album_link).delete(delete_photo_album_link),
        )
}

#[utoipa::path(
    post,
    path = "/trips/{trip_id}/photo-albums",
    params(
        ("trip_id" = String, Path, description = "Trip id")
    ),
    request_body = JsonValue,
    responses(
        (status = 200, description = "Photo album link created", body = JsonValue)
    ),
    tag = "photo_albums"
)]
pub async fn create_photo_album_link(
    State(state): State<AppState>,
    Path(trip_id): Path<Uuid>,
    BearerToken(session_token): BearerToken,
    Json(request): Json<CreatePhotoAlbumLinkRequest>,
) -> Result<Json<PhotoAlbumLinkSummary>, ApiError> {
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

#[utoipa::path(
    patch,
    path = "/trips/{trip_id}/photo-albums/{album_id}",
    params(
        ("trip_id" = String, Path, description = "Trip id"),
        ("album_id" = String, Path, description = "Photo album id")
    ),
    request_body = JsonValue,
    responses(
        (status = 200, description = "Photo album link updated", body = JsonValue)
    ),
    tag = "photo_albums"
)]
pub async fn patch_photo_album_link(
    State(state): State<AppState>,
    Path((trip_id, album_id)): Path<(Uuid, Uuid)>,
    BearerToken(session_token): BearerToken,
    Json(request): Json<PatchPhotoAlbumLinkRequest>,
) -> Result<Json<PhotoAlbumLinkSummary>, ApiError> {
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

#[utoipa::path(
    delete,
    path = "/trips/{trip_id}/photo-albums/{album_id}",
    params(
        ("trip_id" = String, Path, description = "Trip id"),
        ("album_id" = String, Path, description = "Photo album id")
    ),
    responses(
        (status = 200, description = "Photo album link deleted", body = JsonValue)
    ),
    tag = "photo_albums"
)]
pub async fn delete_photo_album_link(
    State(state): State<AppState>,
    Path((trip_id, album_id)): Path<(Uuid, Uuid)>,
    BearerToken(session_token): BearerToken,
) -> Result<Json<PhotoAlbumLinkSummary>, ApiError> {
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
