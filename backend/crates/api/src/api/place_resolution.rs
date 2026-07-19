use axum::Json;
use axum::Router;
use axum::extract::{Path, State};
use axum::routing::post;
use serde_json::Value as JsonValue;
use uuid::Uuid;

use crate::api::extractors::BearerToken;
use crate::app;
use crate::app::AppState;
use crate::api::error::ApiError;

pub fn routes() -> Router<AppState> {
    Router::new().route("/trips/{trip_id}/places/resolve", post(resolve_place))
}

#[utoipa::path(
    post,
    path = "/trips/{trip_id}/places/resolve",
    params(
        ("trip_id" = String, Path, description = "Trip id")
    ),
    request_body = JsonValue,
    responses(
        (status = 200, description = "Place resolved", body = JsonValue)
    ),
    tag = "place_resolution"
)]
pub async fn resolve_place(
    State(state): State<AppState>,
    Path(trip_id): Path<Uuid>,
    BearerToken(session_token): BearerToken,
    Json(request): Json<app::place_resolution::ResolvePlaceRequest>,
) -> Result<Json<app::place_resolution::ResolvePlaceResponse>, ApiError> {
    Ok(Json(
        app::place_resolution::resolve_place(&state.pool, trip_id, &session_token, request).await?,
    ))
}
