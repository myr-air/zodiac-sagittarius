use axum::Json;
use axum::Router;
use axum::extract::{Path, State};
use axum::routing::get;
use uuid::Uuid;

use crate::api::extractors::BearerToken;
use crate::app;
use crate::app::AppState;
use crate::api::error::ApiError;
use crate::domain::patches::PatchTripRequest;
use crate::domain::types::{TripCockpit, TripSummary};

pub fn routes() -> Router<AppState> {
    Router::new().route("/trips/{trip_id}", get(load_trip).patch(patch_trip))
}

#[utoipa::path(
    get,
    path = "/trips/{trip_id}",
    params(
        ("trip_id" = String, Path, description = "Trip id")
    ),
    responses(
        (status = 200, description = "Trip cockpit loaded", body = TripCockpit)
    ),
    tag = "trips"
)]
pub async fn load_trip(
    State(state): State<AppState>,
    Path(trip_id): Path<Uuid>,
    BearerToken(session_token): BearerToken,
) -> Result<Json<TripCockpit>, ApiError> {
    let cockpit = app::trips::load_cockpit(&state.pool, trip_id, &session_token).await?;

    Ok(Json(cockpit))
}

#[utoipa::path(
    patch,
    path = "/trips/{trip_id}",
    params(
        ("trip_id" = String, Path, description = "Trip id")
    ),
    request_body = PatchTripRequest,
    responses(
        (status = 200, description = "Trip updated", body = TripSummary)
    ),
    tag = "trips"
)]
pub async fn patch_trip(
    State(state): State<AppState>,
    Path(trip_id): Path<Uuid>,
    BearerToken(session_token): BearerToken,
    Json(request): Json<PatchTripRequest>,
) -> Result<Json<TripSummary>, ApiError> {
    let trip = app::trips::patch_trip(
        &state.pool,
        &state.realtime,
        trip_id,
        &session_token,
        request,
    )
    .await?;

    Ok(Json(trip))
}
