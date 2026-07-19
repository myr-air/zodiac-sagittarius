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
use crate::domain::patches::{
    CreateItineraryItemRequest, PatchItineraryItemRequest, ReorderItineraryItemsRequest,
};
use crate::domain::types::ItineraryItemSummary;

pub fn routes() -> Router<AppState> {
    Router::new()
        .route(
            "/trips/{trip_id}/itinerary-items",
            post(create_itinerary_item),
        )
        .route(
            "/trips/{trip_id}/itinerary-items/order",
            patch(reorder_itinerary_items),
        )
        .route(
            "/trips/{trip_id}/itinerary-items/{item_id}",
            patch(patch_itinerary_item).delete(delete_itinerary_item),
        )
}

#[utoipa::path(
    post,
    path = "/trips/{trip_id}/itinerary-items",
    params(
        ("trip_id" = String, Path, description = "Trip id")
    ),
    request_body = JsonValue,
    responses(
        (status = 200, description = "Itinerary item created", body = JsonValue)
    ),
    tag = "itinerary"
)]
pub async fn create_itinerary_item(
    State(state): State<AppState>,
    Path(trip_id): Path<Uuid>,
    BearerToken(session_token): BearerToken,
    Json(request): Json<CreateItineraryItemRequest>,
) -> Result<Json<ItineraryItemSummary>, ApiError> {
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

#[utoipa::path(
    patch,
    path = "/trips/{trip_id}/itinerary-items/{item_id}",
    params(
        ("trip_id" = String, Path, description = "Trip id"),
        ("item_id" = String, Path, description = "Itinerary item id")
    ),
    request_body = JsonValue,
    responses(
        (status = 200, description = "Itinerary item updated", body = JsonValue)
    ),
    tag = "itinerary"
)]
pub async fn patch_itinerary_item(
    State(state): State<AppState>,
    Path((trip_id, item_id)): Path<(Uuid, Uuid)>,
    BearerToken(session_token): BearerToken,
    Json(request): Json<PatchItineraryItemRequest>,
) -> Result<Json<ItineraryItemSummary>, ApiError> {
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

#[utoipa::path(
    delete,
    path = "/trips/{trip_id}/itinerary-items/{item_id}",
    params(
        ("trip_id" = String, Path, description = "Trip id"),
        ("item_id" = String, Path, description = "Itinerary item id")
    ),
    responses(
        (status = 200, description = "Itinerary item deleted", body = JsonValue)
    ),
    tag = "itinerary"
)]
pub async fn delete_itinerary_item(
    State(state): State<AppState>,
    Path((trip_id, item_id)): Path<(Uuid, Uuid)>,
    BearerToken(session_token): BearerToken,
) -> Result<Json<ItineraryItemSummary>, ApiError> {
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

#[utoipa::path(
    patch,
    path = "/trips/{trip_id}/itinerary-items/order",
    params(
        ("trip_id" = String, Path, description = "Trip id")
    ),
    request_body = JsonValue,
    responses(
        (status = 200, description = "Itinerary items reordered", body = JsonValue)
    ),
    tag = "itinerary"
)]
pub async fn reorder_itinerary_items(
    State(state): State<AppState>,
    Path(trip_id): Path<Uuid>,
    BearerToken(session_token): BearerToken,
    Json(request): Json<ReorderItineraryItemsRequest>,
) -> Result<Json<Vec<ItineraryItemSummary>>, ApiError> {
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
