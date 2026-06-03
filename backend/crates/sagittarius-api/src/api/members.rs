use axum::Json;
use axum::extract::{Path, State};
use uuid::Uuid;

use crate::api::extractors::BearerToken;
use crate::app;
use crate::app::AppState;
use crate::domain::errors::ServiceError;
use crate::domain::patches::{CreateMemberRequest, PatchMemberRequest, UpdatePresenceRequest};
use crate::domain::types::TripMemberSummary;

pub async fn list_members(
    State(state): State<AppState>,
    Path(trip_id): Path<Uuid>,
    BearerToken(session_token): BearerToken,
) -> Result<Json<Vec<TripMemberSummary>>, ServiceError> {
    let members = app::members::list_members(&state.pool, trip_id, &session_token).await?;

    Ok(Json(members))
}

pub async fn create_member(
    State(state): State<AppState>,
    Path(trip_id): Path<Uuid>,
    BearerToken(session_token): BearerToken,
    Json(request): Json<CreateMemberRequest>,
) -> Result<Json<TripMemberSummary>, ServiceError> {
    let member = app::members::create_member(
        &state.pool,
        &state.realtime,
        trip_id,
        &session_token,
        request,
    )
    .await?;

    Ok(Json(member))
}

pub async fn patch_member(
    State(state): State<AppState>,
    Path((trip_id, member_id)): Path<(Uuid, Uuid)>,
    BearerToken(session_token): BearerToken,
    Json(request): Json<PatchMemberRequest>,
) -> Result<Json<TripMemberSummary>, ServiceError> {
    let member = app::members::patch_member(
        &state.pool,
        &state.realtime,
        trip_id,
        member_id,
        &session_token,
        request,
    )
    .await?;

    Ok(Json(member))
}

pub async fn reset_member_claim(
    State(state): State<AppState>,
    Path((trip_id, member_id)): Path<(Uuid, Uuid)>,
    BearerToken(session_token): BearerToken,
) -> Result<Json<TripMemberSummary>, ServiceError> {
    let member = app::members::reset_member_claim(
        &state.pool,
        &state.realtime,
        trip_id,
        member_id,
        &session_token,
    )
    .await?;

    Ok(Json(member))
}

pub async fn update_presence(
    State(state): State<AppState>,
    Path(trip_id): Path<Uuid>,
    BearerToken(session_token): BearerToken,
    Json(request): Json<UpdatePresenceRequest>,
) -> Result<Json<TripMemberSummary>, ServiceError> {
    let member = app::members::update_presence(
        &state.pool,
        &state.realtime,
        trip_id,
        &session_token,
        request,
    )
    .await?;

    Ok(Json(member))
}
