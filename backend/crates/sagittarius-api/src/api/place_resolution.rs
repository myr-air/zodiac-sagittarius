use axum::Json;
use axum::extract::{Path, State};
use uuid::Uuid;

use crate::api::extractors::BearerToken;
use crate::app;
use crate::app::AppState;
use crate::domain::errors::ServiceError;

pub async fn resolve_place(
    State(state): State<AppState>,
    Path(trip_id): Path<Uuid>,
    BearerToken(session_token): BearerToken,
    Json(request): Json<app::place_resolution::ResolvePlaceRequest>,
) -> Result<Json<app::place_resolution::ResolvePlaceResponse>, ServiceError> {
    Ok(Json(
        app::place_resolution::resolve_place(&state.pool, trip_id, &session_token, request).await?,
    ))
}
