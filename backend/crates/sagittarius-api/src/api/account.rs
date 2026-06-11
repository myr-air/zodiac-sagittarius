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
    AccountExplorerSummary, AccountMemberClaimResponse, AccountSession, AccountSettings,
    AccountTodoSummary, AccountTripCreateResponse, AccountTripStats, AccountTripSummary,
    AccountVaultItemSummary, EmailLoginStartResponse, MemberSession, OwnerTransferResponse,
    PasskeyChallengeResponse, PasskeyLoginStartResponse, PasskeySummary, TripCity,
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
pub struct PasswordLoginRequest {
    pub flow: String,
    pub email: String,
    pub password: String,
    pub trust_device: bool,
    pub device_label: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AccountTripCreateRequest {
    pub name: String,
    pub origin_label: String,
    pub origin_city: String,
    pub origin_country: String,
    pub origin_country_code: String,
    pub destination_label: String,
    pub destination_cities: Vec<TripCity>,
    pub countries: Vec<String>,
    pub party_size: Option<i32>,
    pub default_timezone: Option<String>,
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

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AccountSettingsUpdateRequest {
    pub display_name: String,
    pub avatar_color: String,
    pub locale: String,
    pub timezone: String,
    pub home_city: Option<String>,
    pub home_country: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AccountVaultItemCreateRequest {
    pub trip_id: Option<Uuid>,
    pub kind: String,
    pub title: String,
    pub detail: String,
    pub external_url: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PasskeyRegistrationFinishRequest {
    pub challenge_id: Uuid,
    pub credential_id: String,
    pub client_data_json: String,
    pub attestation_object: String,
    pub nickname: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PasskeyLoginStartRequest {
    pub email: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PasskeyLoginFinishRequest {
    pub challenge_id: Uuid,
    pub credential_id: String,
    pub client_data_json: String,
    pub authenticator_data: String,
    pub signature: String,
    pub trust_device: bool,
    pub device_label: String,
}

pub async fn start_email_login(
    State(state): State<AppState>,
    request: Result<Json<EmailLoginStartRequest>, JsonRejection>,
) -> Result<Json<EmailLoginStartResponse>, ServiceError> {
    let Json(request) =
        request.map_err(|_| ServiceError::InvalidRequest("json payload is invalid"))?;
    let response =
        app::account::start_email_login(&state.pool, &state.email_delivery, &request.email).await?;

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

pub async fn finish_password_login(
    State(state): State<AppState>,
    request: Result<Json<PasswordLoginRequest>, JsonRejection>,
) -> Result<Json<AccountSession>, ServiceError> {
    let Json(request) =
        request.map_err(|_| ServiceError::InvalidRequest("json payload is invalid"))?;
    let flow = match request.flow.as_str() {
        "login" => app::account::PasswordLoginFlow::Login,
        "register" => app::account::PasswordLoginFlow::Register,
        _ => {
            return Err(ServiceError::InvalidRequest(
                "password auth flow is invalid",
            ));
        }
    };
    let response = app::account::finish_password_login(
        &state.pool,
        app::account::PasswordLoginInput {
            flow,
            email: request.email,
            password: request.password,
            trust_device: request.trust_device,
            device_label: request.device_label,
        },
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

pub async fn update_settings(
    State(state): State<AppState>,
    BearerToken(session_token): BearerToken,
    request: Result<Json<AccountSettingsUpdateRequest>, JsonRejection>,
) -> Result<Json<AccountSettings>, ServiceError> {
    let Json(request) =
        request.map_err(|_| ServiceError::InvalidRequest("json payload is invalid"))?;
    let settings = app::account::update_settings(
        &state.pool,
        &session_token,
        app::account::AccountSettingsUpdateInput {
            display_name: request.display_name,
            avatar_color: request.avatar_color,
            locale: request.locale,
            timezone: request.timezone,
            home_city: request.home_city,
            home_country: request.home_country,
        },
    )
    .await?;

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
            origin_label: request.origin_label,
            origin_city: request.origin_city,
            origin_country: request.origin_country,
            origin_country_code: request.origin_country_code,
            destination_label: request.destination_label,
            destination_cities: request.destination_cities,
            countries: request.countries,
            party_size: request.party_size,
            default_timezone: request.default_timezone,
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

pub async fn list_trips(
    State(state): State<AppState>,
    BearerToken(session_token): BearerToken,
) -> Result<Json<Vec<AccountTripSummary>>, ServiceError> {
    let response = app::account::list_trips(&state.pool, &session_token).await?;

    Ok(Json(response))
}

pub async fn create_trip_member_session(
    State(state): State<AppState>,
    BearerToken(session_token): BearerToken,
    Path(trip_id): Path<Uuid>,
) -> Result<Json<MemberSession>, ServiceError> {
    let response =
        app::account::create_trip_member_session(&state.pool, &session_token, trip_id).await?;

    Ok(Json(response))
}

pub async fn get_stats(
    State(state): State<AppState>,
    BearerToken(session_token): BearerToken,
) -> Result<Json<AccountTripStats>, ServiceError> {
    let response = app::account::load_stats(&state.pool, &session_token).await?;

    Ok(Json(response))
}

pub async fn get_explorer(
    State(state): State<AppState>,
    BearerToken(session_token): BearerToken,
) -> Result<Json<AccountExplorerSummary>, ServiceError> {
    let response = app::account::load_explorer(&state.pool, &session_token).await?;

    Ok(Json(response))
}

pub async fn list_todos(
    State(state): State<AppState>,
    BearerToken(session_token): BearerToken,
) -> Result<Json<Vec<AccountTodoSummary>>, ServiceError> {
    let response = app::account::list_todos(&state.pool, &session_token).await?;

    Ok(Json(response))
}

pub async fn list_vault_items(
    State(state): State<AppState>,
    BearerToken(session_token): BearerToken,
) -> Result<Json<Vec<AccountVaultItemSummary>>, ServiceError> {
    let response = app::account::list_vault_items(&state.pool, &session_token).await?;

    Ok(Json(response))
}

pub async fn create_vault_item(
    State(state): State<AppState>,
    BearerToken(session_token): BearerToken,
    request: Result<Json<AccountVaultItemCreateRequest>, JsonRejection>,
) -> Result<(StatusCode, Json<AccountVaultItemSummary>), ServiceError> {
    let Json(request) =
        request.map_err(|_| ServiceError::InvalidRequest("json payload is invalid"))?;
    let response = app::account::create_vault_item(
        &state.pool,
        &session_token,
        app::account::AccountVaultItemCreateInput {
            trip_id: request.trip_id,
            kind: request.kind,
            title: request.title,
            detail: request.detail,
            external_url: request.external_url,
        },
    )
    .await?;

    Ok((StatusCode::CREATED, Json(response)))
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

pub async fn finish_passkey_registration(
    State(state): State<AppState>,
    BearerToken(session_token): BearerToken,
    request: Result<Json<PasskeyRegistrationFinishRequest>, JsonRejection>,
) -> Result<Json<PasskeySummary>, ServiceError> {
    let Json(request) =
        request.map_err(|_| ServiceError::InvalidRequest("json payload is invalid"))?;
    let response = app::account::finish_passkey_registration(
        &state.pool,
        &session_token,
        app::account::PasskeyRegistrationFinishInput {
            challenge_id: request.challenge_id,
            credential_id: request.credential_id,
            client_data_json: request.client_data_json,
            attestation_object: request.attestation_object,
            nickname: request.nickname,
        },
    )
    .await?;

    Ok(Json(response))
}

pub async fn start_passkey_login(
    State(state): State<AppState>,
    request: Result<Json<PasskeyLoginStartRequest>, JsonRejection>,
) -> Result<Json<PasskeyLoginStartResponse>, ServiceError> {
    let Json(request) =
        request.map_err(|_| ServiceError::InvalidRequest("json payload is invalid"))?;
    let response = app::account::start_passkey_login(&state.pool, &request.email).await?;

    Ok(Json(response))
}

pub async fn finish_passkey_login(
    State(state): State<AppState>,
    request: Result<Json<PasskeyLoginFinishRequest>, JsonRejection>,
) -> Result<Json<AccountSession>, ServiceError> {
    let Json(request) =
        request.map_err(|_| ServiceError::InvalidRequest("json payload is invalid"))?;
    let response = app::account::finish_passkey_login(
        &state.pool,
        app::account::PasskeyLoginFinishInput {
            challenge_id: request.challenge_id,
            credential_id: request.credential_id,
            client_data_json: request.client_data_json,
            authenticator_data: request.authenticator_data,
            signature: request.signature,
            trust_device: request.trust_device,
            device_label: request.device_label,
        },
    )
    .await?;

    Ok(Json(response))
}

pub async fn logout_session(
    State(state): State<AppState>,
    BearerToken(session_token): BearerToken,
) -> Result<StatusCode, ServiceError> {
    app::account::logout_user_session(&state.pool, &session_token).await?;

    Ok(StatusCode::NO_CONTENT)
}

pub async fn revoke_trusted_device(
    State(state): State<AppState>,
    BearerToken(session_token): BearerToken,
    Path(trusted_device_id): Path<Uuid>,
) -> Result<StatusCode, ServiceError> {
    app::account::revoke_trusted_device(&state.pool, &session_token, trusted_device_id).await?;

    Ok(StatusCode::NO_CONTENT)
}
