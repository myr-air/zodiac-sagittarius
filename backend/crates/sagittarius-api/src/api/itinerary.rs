use axum::Json;
use axum::extract::{Path, State};
use uuid::Uuid;

use crate::api::extractors::BearerToken;
use crate::app;
use crate::app::AppState;
use crate::domain::errors::ServiceError;
use crate::domain::patches::{
    CreateItineraryItemRequest, PatchItineraryItemRequest, ReorderItineraryItemsRequest,
};
use crate::domain::types::ItineraryItemSummary;

pub async fn create_itinerary_item(
    State(state): State<AppState>,
    Path(trip_id): Path<Uuid>,
    BearerToken(session_token): BearerToken,
    Json(request): Json<CreateItineraryItemRequest>,
) -> Result<Json<ItineraryItemSummary>, ServiceError> {
    let item = app::itinerary::create_itinerary_item(
        &state.pool,
        &state.realtime,
        trip_id,
        &session_token,
        request,
    )
    .await?;

    Ok(Json(item))
}

pub async fn patch_itinerary_item(
    State(state): State<AppState>,
    Path((trip_id, item_id)): Path<(Uuid, Uuid)>,
    BearerToken(session_token): BearerToken,
    Json(request): Json<PatchItineraryItemRequest>,
) -> Result<Json<ItineraryItemSummary>, ServiceError> {
    let item = app::itinerary::patch_itinerary_item(
        &state.pool,
        &state.realtime,
        trip_id,
        item_id,
        &session_token,
        request,
    )
    .await?;

    Ok(Json(item))
}

pub async fn delete_itinerary_item(
    State(state): State<AppState>,
    Path((trip_id, item_id)): Path<(Uuid, Uuid)>,
    BearerToken(session_token): BearerToken,
) -> Result<Json<ItineraryItemSummary>, ServiceError> {
    let item = app::itinerary::delete_itinerary_item(
        &state.pool,
        &state.realtime,
        trip_id,
        item_id,
        &session_token,
    )
    .await?;

    Ok(Json(item))
}

pub async fn reorder_itinerary_items(
    State(state): State<AppState>,
    Path(trip_id): Path<Uuid>,
    BearerToken(session_token): BearerToken,
    Json(request): Json<ReorderItineraryItemsRequest>,
) -> Result<Json<Vec<ItineraryItemSummary>>, ServiceError> {
    let items = app::itinerary::reorder_itinerary_items(
        &state.pool,
        &state.realtime,
        trip_id,
        &session_token,
        request,
    )
    .await?;

    Ok(Json(items))
}
