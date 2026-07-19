use axum::extract::{Path, Query, State};
use axum::http::StatusCode;
use axum::routing::{delete, get, post};
use axum::{Json, Router, response::IntoResponse};
use serde::Deserialize;
use uuid::Uuid;
use utoipa::ToSchema;

use crate::api::extractors::BearerToken;
use crate::app;
use crate::app::AppState;
use crate::api::error::ApiError;
use crate::domain::errors::ServiceError;
use crate::domain::types::{JoinInviteTokenResponse, JoinTripResponse, MemberSession};

#[derive(ToSchema, Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct JoinRequest {
    pub join_code: String,
    pub trip_password: String,
}

#[derive(ToSchema, Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ParticipantPasswordRequest {
    pub participant_password: String,
    pub join_session_token: Option<String>,
}

#[derive(ToSchema, Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LoginMemberRequest {
    pub member_id: Uuid,
    pub participant_password: String,
    pub join_session_token: Option<String>,
}

#[derive(ToSchema, Debug, Deserialize)]
pub struct ResolveInviteTokenQuery {
    pub token: String,
}

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/trip-join-sessions", post(join_trip))
        .route(
            "/trip-join-invite-tokens/current",
            get(resolve_invite_token),
        )
        .route(
            "/trips/{trip_id}/join-invite-tokens",
            post(rotate_invite_token),
        )
        .route(
            "/trips/{trip_id}/members/{member_id}/claims",
            post(claim_member),
        )
        .route("/trips/{trip_id}/member-sessions", post(login_member))
        .route(
            "/trips/{trip_id}/member-sessions/current",
            delete(logout),
        )
}

#[utoipa::path(
    post,
    path = "/trip-join-sessions",
    request_body = JoinRequest,
    responses(
        (status = 200, description = "Joined trip", body = JoinTripResponse)
    ),
    tag = "join"
)]
pub async fn join_trip(
    State(state): State<AppState>,
    Json(request): Json<JoinRequest>,
) -> Result<Json<JoinTripResponse>, ApiError> {
    let response =
        app::auth::join_trip(&state.pool, &request.join_code, &request.trip_password).await?;

    Ok(Json(response))
}

#[utoipa::path(
    get,
    path = "/trip-join-invite-tokens/current",
    params(
        ("token" = String, Query, description = "Invite token")
    ),
    responses(
        (status = 200, description = "Invite token resolved", body = JoinTripResponse)
    ),
    tag = "join"
)]
pub async fn resolve_invite_token(
    State(state): State<AppState>,
    Query(query): Query<ResolveInviteTokenQuery>,
) -> Result<Json<JoinTripResponse>, ApiError> {
    let response = app::auth::resolve_join_invite_token(&state.pool, &query.token).await?;

    Ok(Json(response))
}

#[utoipa::path(
    post,
    path = "/trips/{trip_id}/join-invite-tokens",
    params(
        ("trip_id" = String, Path, description = "Trip id")
    ),
    responses(
        (status = 200, description = "Invite token rotated", body = JoinInviteTokenResponse)
    ),
    tag = "join"
)]
pub async fn rotate_invite_token(
    State(state): State<AppState>,
    Path(trip_id): Path<Uuid>,
    BearerToken(session_token): BearerToken,
) -> Result<Json<JoinInviteTokenResponse>, ApiError> {
    let response =
        app::auth::rotate_join_invite_token(&state.pool, trip_id, &session_token).await?;

    Ok(Json(response))
}

#[utoipa::path(
    post,
    path = "/trips/{trip_id}/members/{member_id}/claims",
    params(
        ("trip_id" = String, Path, description = "Trip id"),
        ("member_id" = String, Path, description = "Member id")
    ),
    request_body = ParticipantPasswordRequest,
    responses(
        (status = 200, description = "Member claimed", body = MemberSession)
    ),
    tag = "join"
)]
pub async fn claim_member(
    State(state): State<AppState>,
    Path((trip_id, member_id)): Path<(Uuid, Uuid)>,
    Json(request): Json<ParticipantPasswordRequest>,
) -> Result<Json<MemberSession>, ApiError> {
    let join_session_token = request
        .join_session_token
        .as_deref()
        .map(str::trim)
        .filter(|token| !token.is_empty())
        .ok_or(ServiceError::Unauthenticated)?;
    let response = app::auth::claim_member(
        &state.pool,
        trip_id,
        member_id,
        &request.participant_password,
        join_session_token,
    )
    .await?;

    Ok(Json(response))
}

#[utoipa::path(
    post,
    path = "/trips/{trip_id}/member-sessions",
    params(
        ("trip_id" = String, Path, description = "Trip id")
    ),
    request_body = LoginMemberRequest,
    responses(
        (status = 200, description = "Member session created", body = MemberSession)
    ),
    tag = "join"
)]
pub async fn login_member(
    State(state): State<AppState>,
    Path(trip_id): Path<Uuid>,
    Json(request): Json<LoginMemberRequest>,
) -> Result<Json<MemberSession>, ApiError> {
    let join_session_token = request
        .join_session_token
        .as_deref()
        .map(str::trim)
        .filter(|token| !token.is_empty())
        .ok_or(ServiceError::Unauthenticated)?;
    let response = app::auth::login_member(
        &state.pool,
        trip_id,
        request.member_id,
        &request.participant_password,
        join_session_token,
    )
    .await?;

    Ok(Json(response))
}

#[utoipa::path(
    delete,
    path = "/trips/{trip_id}/member-sessions/current",
    params(
        ("trip_id" = String, Path, description = "Trip id")
    ),
    responses(
        (status = 204, description = "Member session cleared")
    ),
    tag = "join"
)]
pub async fn logout(
    State(state): State<AppState>,
    Path(trip_id): Path<Uuid>,
    BearerToken(session_token): BearerToken,
) -> Result<impl IntoResponse, ApiError> {
    app::auth::logout_session(&state.pool, trip_id, Some(&session_token)).await?;

    Ok(StatusCode::NO_CONTENT)
}
