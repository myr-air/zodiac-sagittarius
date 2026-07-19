use axum::Json;
use axum::Router;
use axum::extract::{Path, State};
use axum::routing::post;
use uuid::Uuid;

use crate::api::extractors::BearerToken;
use crate::app;
use crate::app::AppState;
use crate::api::error::ApiError;
use crate::domain::patches::ImportItineraryRequest;
use crate::domain::types::ItineraryImportDocument;

pub fn routes() -> Router<AppState> {
    Router::new().route(
        "/trips/{trip_id}/itinerary-imports",
        post(import_itinerary),
    )
}

#[utoipa::path(
    post,
    path = "/trips/{trip_id}/itinerary-imports",
    params(
        ("trip_id" = String, Path, description = "Trip id")
    ),
    request_body = ImportItineraryRequest,
    responses(
        (status = 200, description = "Itinerary imported", body = ItineraryImportDocument)
    ),
    tag = "itinerary_imports"
)]
pub async fn import_itinerary(
    State(state): State<AppState>,
    Path(trip_id): Path<Uuid>,
    BearerToken(session_token): BearerToken,
    Json(request): Json<ImportItineraryRequest>,
) -> Result<Json<ItineraryImportDocument>, ApiError> {
    let document =
        app::itinerary_imports::import_itinerary(&state.pool, trip_id, &session_token, request)
            .await?;

    Ok(Json(document))
}
