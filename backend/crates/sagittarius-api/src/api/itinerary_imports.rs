use axum::Json;
use axum::extract::{Path, State};
use uuid::Uuid;

use crate::api::extractors::BearerToken;
use crate::app;
use crate::app::AppState;
use crate::domain::errors::ServiceError;
use crate::domain::patches::ImportItineraryRequest;
use crate::domain::types::ItineraryImportDocument;

pub async fn import_itinerary(
    State(state): State<AppState>,
    Path(trip_id): Path<Uuid>,
    BearerToken(session_token): BearerToken,
    Json(request): Json<ImportItineraryRequest>,
) -> Result<Json<ItineraryImportDocument>, ServiceError> {
    let document =
        app::itinerary_imports::import_itinerary(&state.pool, trip_id, &session_token, request)
            .await?;

    Ok(Json(document))
}
