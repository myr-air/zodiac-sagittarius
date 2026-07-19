use axum::Json;
use axum::Router;
use axum::extract::{Path, State};
use axum::routing::{get, patch, post};
use uuid::Uuid;

use crate::api::extractors::BearerToken;
use crate::app;
use crate::app::AppState;
use crate::api::error::ApiError;
use crate::domain::patches::{CreateMemberRequest, PatchMemberRequest, UpdatePresenceRequest};
use crate::domain::types::TripMemberSummary;

pub fn routes() -> Router<AppState> {
    Router::new()
        .route(
            "/trips/{trip_id}/members",
            get(list_members).post(create_member),
        )
        .route(
            "/trips/{trip_id}/members/{member_id}",
            patch(patch_member),
        )
        .route(
            "/trips/{trip_id}/members/{member_id}/claim-resets",
            post(reset_member_claim),
        )
        .route("/trips/{trip_id}/presence", post(update_presence))
}

#[utoipa::path(
    get,
    path = "/trips/{trip_id}/members",
    params(
        ("trip_id" = String, Path, description = "Trip id")
    ),
    responses(
        (status = 200, description = "Members listed", body = Vec<TripMemberSummary>)
    ),
    tag = "members"
)]
pub async fn list_members(
    State(state): State<AppState>,
    Path(trip_id): Path<Uuid>,
    BearerToken(session_token): BearerToken,
) -> Result<Json<Vec<TripMemberSummary>>, ApiError> {
    let members = app::members::list_members(&state.pool, trip_id, &session_token).await?;

    Ok(Json(members))
}

#[utoipa::path(
    post,
    path = "/trips/{trip_id}/members",
    params(
        ("trip_id" = String, Path, description = "Trip id")
    ),
    request_body = CreateMemberRequest,
    responses(
        (status = 200, description = "Member created", body = TripMemberSummary)
    ),
    tag = "members"
)]
pub async fn create_member(
    State(state): State<AppState>,
    Path(trip_id): Path<Uuid>,
    BearerToken(session_token): BearerToken,
    Json(request): Json<CreateMemberRequest>,
) -> Result<Json<TripMemberSummary>, ApiError> {
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

#[utoipa::path(
    patch,
    path = "/trips/{trip_id}/members/{member_id}",
    params(
        ("trip_id" = String, Path, description = "Trip id"),
        ("member_id" = String, Path, description = "Member id")
    ),
    request_body = PatchMemberRequest,
    responses(
        (status = 200, description = "Member updated", body = TripMemberSummary)
    ),
    tag = "members"
)]
pub async fn patch_member(
    State(state): State<AppState>,
    Path((trip_id, member_id)): Path<(Uuid, Uuid)>,
    BearerToken(session_token): BearerToken,
    Json(request): Json<PatchMemberRequest>,
) -> Result<Json<TripMemberSummary>, ApiError> {
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

#[utoipa::path(
    post,
    path = "/trips/{trip_id}/members/{member_id}/claim-resets",
    params(
        ("trip_id" = String, Path, description = "Trip id"),
        ("member_id" = String, Path, description = "Member id")
    ),
    responses(
        (status = 200, description = "Member claim reset", body = TripMemberSummary)
    ),
    tag = "members"
)]
pub async fn reset_member_claim(
    State(state): State<AppState>,
    Path((trip_id, member_id)): Path<(Uuid, Uuid)>,
    BearerToken(session_token): BearerToken,
) -> Result<Json<TripMemberSummary>, ApiError> {
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

#[utoipa::path(
    post,
    path = "/trips/{trip_id}/presence",
    params(
        ("trip_id" = String, Path, description = "Trip id")
    ),
    request_body = UpdatePresenceRequest,
    responses(
        (status = 200, description = "Presence updated", body = TripMemberSummary)
    ),
    tag = "members"
)]
pub async fn update_presence(
    State(state): State<AppState>,
    Path(trip_id): Path<Uuid>,
    BearerToken(session_token): BearerToken,
    Json(request): Json<UpdatePresenceRequest>,
) -> Result<Json<TripMemberSummary>, ApiError> {
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
