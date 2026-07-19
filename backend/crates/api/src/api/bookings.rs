use axum::Json;
use axum::Router;
use axum::extract::{Path, State};
use axum::routing::{patch, post};
use uuid::Uuid;

use crate::api::extractors::BearerToken;
use crate::app;
use crate::app::AppState;
use crate::api::error::ApiError;
use crate::domain::patches::{CreateBookingDocRequest, PatchBookingDocRequest};
use crate::domain::types::BookingDocSummary;

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/trips/{trip_id}/bookings", post(create_booking_doc))
        .route(
            "/trips/{trip_id}/bookings/{booking_id}",
            patch(patch_booking_doc).delete(delete_booking_doc),
        )
}

#[utoipa::path(
    post,
    path = "/trips/{trip_id}/bookings",
    params(
        ("trip_id" = String, Path, description = "Trip id")
    ),
    request_body = CreateBookingDocRequest,
    responses(
        (status = 200, description = "Booking created", body = BookingDocSummary)
    ),
    tag = "bookings"
)]
pub async fn create_booking_doc(
    State(state): State<AppState>,
    Path(trip_id): Path<Uuid>,
    BearerToken(session_token): BearerToken,
    Json(request): Json<CreateBookingDocRequest>,
) -> Result<Json<BookingDocSummary>, ApiError> {
    let booking_doc = app::bookings::create_booking_doc(
        &state.pool,
        &state.realtime,
        trip_id,
        &session_token,
        request,
    )
    .await?;

    Ok(Json(booking_doc))
}

#[utoipa::path(
    patch,
    path = "/trips/{trip_id}/bookings/{booking_id}",
    params(
        ("trip_id" = String, Path, description = "Trip id"),
        ("booking_id" = String, Path, description = "Booking id")
    ),
    request_body = PatchBookingDocRequest,
    responses(
        (status = 200, description = "Booking updated", body = BookingDocSummary)
    ),
    tag = "bookings"
)]
pub async fn patch_booking_doc(
    State(state): State<AppState>,
    Path((trip_id, booking_id)): Path<(Uuid, Uuid)>,
    BearerToken(session_token): BearerToken,
    Json(request): Json<PatchBookingDocRequest>,
) -> Result<Json<BookingDocSummary>, ApiError> {
    let booking_doc = app::bookings::patch_booking_doc(
        &state.pool,
        &state.realtime,
        trip_id,
        booking_id,
        &session_token,
        request,
    )
    .await?;

    Ok(Json(booking_doc))
}

#[utoipa::path(
    delete,
    path = "/trips/{trip_id}/bookings/{booking_id}",
    params(
        ("trip_id" = String, Path, description = "Trip id"),
        ("booking_id" = String, Path, description = "Booking id")
    ),
    responses(
        (status = 200, description = "Booking deleted", body = BookingDocSummary)
    ),
    tag = "bookings"
)]
pub async fn delete_booking_doc(
    State(state): State<AppState>,
    Path((trip_id, booking_id)): Path<(Uuid, Uuid)>,
    BearerToken(session_token): BearerToken,
) -> Result<Json<BookingDocSummary>, ApiError> {
    let booking_doc = app::bookings::delete_booking_doc(
        &state.pool,
        &state.realtime,
        trip_id,
        booking_id,
        &session_token,
    )
    .await?;

    Ok(Json(booking_doc))
}
