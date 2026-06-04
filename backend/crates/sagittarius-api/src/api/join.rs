use axum::extract::{Path, Query, State};
use axum::http::StatusCode;
use axum::{Json, response::IntoResponse};
use serde::Deserialize;
use uuid::Uuid;

use crate::api::extractors::BearerToken;
use crate::app;
use crate::app::AppState;
use crate::domain::errors::ServiceError;
use crate::domain::types::{JoinInviteTokenResponse, JoinTripResponse, MemberSession};

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct JoinRequest {
    pub join_code: String,
    pub trip_password: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ParticipantPasswordRequest {
    pub participant_password: String,
    pub join_session_token: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LoginMemberRequest {
    pub member_id: Uuid,
    pub participant_password: String,
    pub join_session_token: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct ResolveInviteTokenQuery {
    pub token: String,
}

pub async fn join_trip(
    State(state): State<AppState>,
    Json(request): Json<JoinRequest>,
) -> Result<Json<JoinTripResponse>, ServiceError> {
    let response =
        app::auth::join_trip(&state.pool, &request.join_code, &request.trip_password).await?;

    Ok(Json(response))
}

pub async fn resolve_invite_token(
    State(state): State<AppState>,
    Query(query): Query<ResolveInviteTokenQuery>,
) -> Result<Json<JoinTripResponse>, ServiceError> {
    let response = app::auth::resolve_join_invite_token(&state.pool, &query.token).await?;

    Ok(Json(response))
}

pub async fn rotate_invite_token(
    State(state): State<AppState>,
    Path(trip_id): Path<Uuid>,
    BearerToken(session_token): BearerToken,
) -> Result<Json<JoinInviteTokenResponse>, ServiceError> {
    let response =
        app::auth::rotate_join_invite_token(&state.pool, trip_id, &session_token).await?;

    Ok(Json(response))
}

pub async fn claim_member(
    State(state): State<AppState>,
    Path((trip_id, member_id)): Path<(Uuid, Uuid)>,
    Json(request): Json<ParticipantPasswordRequest>,
) -> Result<Json<MemberSession>, ServiceError> {
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

pub async fn login_member(
    State(state): State<AppState>,
    Path(trip_id): Path<Uuid>,
    Json(request): Json<LoginMemberRequest>,
) -> Result<Json<MemberSession>, ServiceError> {
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

pub async fn logout(
    State(state): State<AppState>,
    Path(trip_id): Path<Uuid>,
    BearerToken(session_token): BearerToken,
) -> Result<impl IntoResponse, ServiceError> {
    app::auth::logout_session(&state.pool, trip_id, Some(&session_token)).await?;

    Ok(StatusCode::NO_CONTENT)
}
