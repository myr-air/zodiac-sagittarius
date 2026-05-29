use axum::Json;
use axum::extract::State;
use axum::extract::rejection::JsonRejection;
use serde::Deserialize;
use uuid::Uuid;

use crate::app;
use crate::app::AppState;
use crate::domain::errors::ServiceError;
use crate::domain::types::{AccountSession, EmailLoginStartResponse};

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
