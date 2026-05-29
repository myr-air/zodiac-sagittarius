use axum::Json;
use axum::extract::{Path, State};
use uuid::Uuid;

use crate::api::extractors::BearerToken;
use crate::app;
use crate::app::AppState;
use crate::domain::errors::ServiceError;
use crate::domain::patches::PatchItineraryItemRequest;
use crate::domain::types::ItineraryItemSummary;

pub async fn patch_itinerary_item(
    State(state): State<AppState>,
    Path(item_id): Path<Uuid>,
    BearerToken(session_token): BearerToken,
    Json(request): Json<PatchItineraryItemRequest>,
) -> Result<Json<ItineraryItemSummary>, ServiceError> {
    let item = app::itinerary::patch_itinerary_item(
        &state.pool,
        &state.realtime,
        item_id,
        &session_token,
        request,
    )
    .await?;

    Ok(Json(item))
}
