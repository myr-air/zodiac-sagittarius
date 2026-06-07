use axum::Json;
use axum::extract::{Path, State};
use uuid::Uuid;

use crate::api::extractors::BearerToken;
use crate::app;
use crate::app::AppState;
use crate::domain::errors::ServiceError;
use crate::domain::patches::{CreateBookingDocRequest, PatchBookingDocRequest};
use crate::domain::types::BookingDocSummary;

pub async fn create_booking_doc(
    State(state): State<AppState>,
    Path(trip_id): Path<Uuid>,
    BearerToken(session_token): BearerToken,
    Json(request): Json<CreateBookingDocRequest>,
) -> Result<Json<BookingDocSummary>, ServiceError> {
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

pub async fn patch_booking_doc(
    State(state): State<AppState>,
    Path((trip_id, booking_id)): Path<(Uuid, Uuid)>,
    BearerToken(session_token): BearerToken,
    Json(request): Json<PatchBookingDocRequest>,
) -> Result<Json<BookingDocSummary>, ServiceError> {
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

pub async fn delete_booking_doc(
    State(state): State<AppState>,
    Path((trip_id, booking_id)): Path<(Uuid, Uuid)>,
    BearerToken(session_token): BearerToken,
) -> Result<Json<BookingDocSummary>, ServiceError> {
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
