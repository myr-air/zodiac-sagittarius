use axum::extract::{Path, State};
use axum::http::{HeaderMap, StatusCode, header};
use axum::{Json, response::IntoResponse};
use serde::Deserialize;
use uuid::Uuid;

use crate::app;
use crate::app::AppState;
use crate::domain::errors::ServiceError;
use crate::domain::types::{JoinTripResponse, MemberSession};

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct JoinRequest {
    pub join_id: String,
    pub trip_password: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ParticipantPasswordRequest {
    pub participant_password: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LogoutRequest {
    pub session_token: Option<String>,
}

pub async fn join_trip(
    State(state): State<AppState>,
    Json(request): Json<JoinRequest>,
) -> Result<Json<JoinTripResponse>, ServiceError> {
    let response =
        app::auth::join_trip(&state.pool, &request.join_id, &request.trip_password).await?;

    Ok(Json(response))
}

pub async fn claim_member(
    State(state): State<AppState>,
    Path((trip_id, member_id)): Path<(Uuid, Uuid)>,
    Json(request): Json<ParticipantPasswordRequest>,
) -> Result<Json<MemberSession>, ServiceError> {
    let response = app::auth::claim_member(
        &state.pool,
        trip_id,
        member_id,
        &request.participant_password,
    )
    .await?;

    Ok(Json(response))
}

pub async fn login_member(
    State(state): State<AppState>,
    Path((trip_id, member_id)): Path<(Uuid, Uuid)>,
    Json(request): Json<ParticipantPasswordRequest>,
) -> Result<Json<MemberSession>, ServiceError> {
    let response = app::auth::login_member(
        &state.pool,
        trip_id,
        member_id,
        &request.participant_password,
    )
    .await?;

    Ok(Json(response))
}

pub async fn logout(
    State(state): State<AppState>,
    Path(trip_id): Path<Uuid>,
    headers: HeaderMap,
    request: Option<Json<LogoutRequest>>,
) -> Result<impl IntoResponse, ServiceError> {
    let posted_token = request
        .as_ref()
        .and_then(|Json(request)| request.session_token.as_deref());
    let bearer_token = bearer_token(&headers);
    let session_token = posted_token.or(bearer_token);

    app::auth::logout_session(&state.pool, trip_id, session_token).await?;

    Ok(StatusCode::NO_CONTENT)
}

fn bearer_token(headers: &HeaderMap) -> Option<&str> {
    let value = headers.get(header::AUTHORIZATION)?.to_str().ok()?;
    value.strip_prefix("Bearer ")
}
