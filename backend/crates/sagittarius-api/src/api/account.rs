use axum::Json;
use axum::extract::rejection::JsonRejection;
use axum::extract::{Path, State};
use axum::http::StatusCode;
use serde::Deserialize;
use time::Date;
use uuid::Uuid;

use crate::api::extractors::BearerToken;
use crate::app;
use crate::app::AppState;
use crate::domain::errors::ServiceError;
use crate::domain::types::{
    AccountMemberClaimResponse, AccountSession, AccountSettings, AccountTripCreateResponse,
    EmailLoginStartResponse, OwnerTransferResponse, PasskeyChallengeResponse,
};

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EmailLoginStartRequest {
    pub email: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EmailLoginFinishRequest {
    pub challenge_id: Uuid,
    pub code: String,
    pub trust_device: bool,
    pub device_label: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AccountTripCreateRequest {
    pub name: String,
    pub destination_label: String,
    pub start_date: Date,
    pub end_date: Date,
    pub owner_display_name: String,
    pub join_id: String,
    pub join_password: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AccountMemberClaimRequest {
    pub member_session_token: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OwnerTransferRequest {
    pub target_member_id: Uuid,
}

pub async fn start_email_login(
    State(state): State<AppState>,
    request: Result<Json<EmailLoginStartRequest>, JsonRejection>,
) -> Result<Json<EmailLoginStartResponse>, ServiceError> {
    let Json(request) =
        request.map_err(|_| ServiceError::InvalidRequest("json payload is invalid"))?;
    let response = app::account::start_email_login(&state.pool, &request.email).await?;

    Ok(Json(response))
}

pub async fn finish_email_login(
    State(state): State<AppState>,
    request: Result<Json<EmailLoginFinishRequest>, JsonRejection>,
) -> Result<Json<AccountSession>, ServiceError> {
    let Json(request) =
        request.map_err(|_| ServiceError::InvalidRequest("json payload is invalid"))?;
    let response = app::account::finish_email_login(
        &state.pool,
        request.challenge_id,
        &request.code,
        request.trust_device,
        &request.device_label,
    )
    .await?;

    Ok(Json(response))
}

pub async fn get_me(
    State(state): State<AppState>,
    BearerToken(session_token): BearerToken,
) -> Result<Json<AccountSettings>, ServiceError> {
    let settings = app::account::load_settings(&state.pool, &session_token).await?;

    Ok(Json(settings))
}

pub async fn get_settings(
    State(state): State<AppState>,
    BearerToken(session_token): BearerToken,
) -> Result<Json<AccountSettings>, ServiceError> {
    let settings = app::account::load_settings(&state.pool, &session_token).await?;

    Ok(Json(settings))
}

pub async fn create_trip(
    State(state): State<AppState>,
    BearerToken(session_token): BearerToken,
    request: Result<Json<AccountTripCreateRequest>, JsonRejection>,
) -> Result<Json<AccountTripCreateResponse>, ServiceError> {
    let Json(request) =
        request.map_err(|_| ServiceError::InvalidRequest("json payload is invalid"))?;
    let response = app::account::create_trip(
        &state.pool,
        &session_token,
        app::account::AccountTripCreateInput {
            name: request.name,
            destination_label: request.destination_label,
            start_date: request.start_date,
            end_date: request.end_date,
            owner_display_name: request.owner_display_name,
            join_id: request.join_id,
            join_password: request.join_password,
        },
    )
    .await?;

    Ok(Json(response))
}

pub async fn claim_member(
    State(state): State<AppState>,
    BearerToken(session_token): BearerToken,
    Path((trip_id, member_id)): Path<(Uuid, Uuid)>,
    request: Result<Json<AccountMemberClaimRequest>, JsonRejection>,
) -> Result<Json<AccountMemberClaimResponse>, ServiceError> {
    let Json(request) =
        request.map_err(|_| ServiceError::InvalidRequest("json payload is invalid"))?;
    let response = app::account::claim_member(
        &state.pool,
        &session_token,
        trip_id,
        member_id,
        &request.member_session_token,
    )
    .await?;

    Ok(Json(response))
}

pub async fn transfer_owner(
    State(state): State<AppState>,
    BearerToken(session_token): BearerToken,
    Path(trip_id): Path<Uuid>,
    request: Result<Json<OwnerTransferRequest>, JsonRejection>,
) -> Result<Json<OwnerTransferResponse>, ServiceError> {
    let Json(request) =
        request.map_err(|_| ServiceError::InvalidRequest("json payload is invalid"))?;
    let response = app::account::transfer_trip_owner(
        &state.pool,
        &session_token,
        trip_id,
        request.target_member_id,
    )
    .await?;

    Ok(Json(response))
}

pub async fn start_passkey_registration(
    State(state): State<AppState>,
    BearerToken(session_token): BearerToken,
) -> Result<Json<PasskeyChallengeResponse>, ServiceError> {
    let response = app::account::start_passkey_registration(&state.pool, &session_token).await?;

    Ok(Json(response))
}

pub async fn logout_session(
    State(state): State<AppState>,
    BearerToken(session_token): BearerToken,
) -> Result<StatusCode, ServiceError> {
    app::account::logout_user_session(&state.pool, &session_token).await?;

    Ok(StatusCode::NO_CONTENT)
}
