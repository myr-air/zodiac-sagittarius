use axum::Json;
use axum::extract::rejection::JsonRejection;
use axum::extract::{Path, State};
use axum::http::{HeaderMap, HeaderValue, StatusCode, header};
use axum::response::IntoResponse;
use serde::Deserialize;
use time::Date;
use uuid::Uuid;

use crate::api::{
    CorsOriginPolicy,
    extractors::{ACCOUNT_SESSION_COOKIE_NAME, AccountSessionToken},
};
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
    headers: HeaderMap,
    request: Result<Json<EmailLoginFinishRequest>, JsonRejection>,
) -> Result<impl IntoResponse, ServiceError> {
    let Json(request) =
        request.map_err(|_| ServiceError::InvalidRequest("json payload is invalid"))?;
    validate_cookie_setting_origin(&headers)?;
    let response = app::account::finish_email_login(
        &state.pool,
        request.challenge_id,
        &request.code,
        request.trust_device,
        &request.device_label,
    )
    .await?;

    Ok(account_session_response(response))
}

pub async fn finish_password_login(
    State(state): State<AppState>,
    headers: HeaderMap,
    request: Result<Json<PasswordLoginRequest>, JsonRejection>,
) -> Result<impl IntoResponse, ServiceError> {
    let Json(request) =
        request.map_err(|_| ServiceError::InvalidRequest("json payload is invalid"))?;
    validate_cookie_setting_origin(&headers)?;
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

    Ok(account_session_response(response))
}

pub async fn get_me(
    State(state): State<AppState>,
    account_session: AccountSessionToken,
) -> Result<Json<AccountSettings>, ServiceError> {
    let settings = app::account::load_settings(&state.pool, &account_session.token).await?;

    Ok(Json(settings))
}

pub async fn get_settings(
    State(state): State<AppState>,
    account_session: AccountSessionToken,
) -> Result<Json<AccountSettings>, ServiceError> {
    let settings = app::account::load_settings(&state.pool, &account_session.token).await?;

    Ok(Json(settings))
}

pub async fn update_settings(
    State(state): State<AppState>,
    account_session: AccountSessionToken,
    request: Result<Json<AccountSettingsUpdateRequest>, JsonRejection>,
) -> Result<Json<AccountSettings>, ServiceError> {
    let Json(request) =
        request.map_err(|_| ServiceError::InvalidRequest("json payload is invalid"))?;
    let settings = app::account::update_settings(
        &state.pool,
        &account_session.token,
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
    account_session: AccountSessionToken,
    request: Result<Json<AccountTripCreateRequest>, JsonRejection>,
) -> Result<Json<AccountTripCreateResponse>, ServiceError> {
    let Json(request) =
        request.map_err(|_| ServiceError::InvalidRequest("json payload is invalid"))?;
    let response = app::account::create_trip(
        &state.pool,
        &account_session.token,
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
    account_session: AccountSessionToken,
) -> Result<Json<Vec<AccountTripSummary>>, ServiceError> {
    let response = app::account::list_trips(&state.pool, &account_session.token).await?;

    Ok(Json(response))
}

pub async fn create_trip_member_session(
    State(state): State<AppState>,
    account_session: AccountSessionToken,
    Path(trip_id): Path<Uuid>,
) -> Result<Json<MemberSession>, ServiceError> {
    let response =
        app::account::create_trip_member_session(&state.pool, &account_session.token, trip_id)
            .await?;

    Ok(Json(response))
}

pub async fn get_stats(
    State(state): State<AppState>,
    account_session: AccountSessionToken,
) -> Result<Json<AccountTripStats>, ServiceError> {
    let response = app::account::load_stats(&state.pool, &account_session.token).await?;

    Ok(Json(response))
}

pub async fn get_explorer(
    State(state): State<AppState>,
    account_session: AccountSessionToken,
) -> Result<Json<AccountExplorerSummary>, ServiceError> {
    let response = app::account::load_explorer(&state.pool, &account_session.token).await?;

    Ok(Json(response))
}

pub async fn list_todos(
    State(state): State<AppState>,
    account_session: AccountSessionToken,
) -> Result<Json<Vec<AccountTodoSummary>>, ServiceError> {
    let response = app::account::list_todos(&state.pool, &account_session.token).await?;

    Ok(Json(response))
}

pub async fn list_vault_items(
    State(state): State<AppState>,
    account_session: AccountSessionToken,
) -> Result<Json<Vec<AccountVaultItemSummary>>, ServiceError> {
    let response = app::account::list_vault_items(&state.pool, &account_session.token).await?;

    Ok(Json(response))
}

pub async fn create_vault_item(
    State(state): State<AppState>,
    account_session: AccountSessionToken,
    request: Result<Json<AccountVaultItemCreateRequest>, JsonRejection>,
) -> Result<(StatusCode, Json<AccountVaultItemSummary>), ServiceError> {
    let Json(request) =
        request.map_err(|_| ServiceError::InvalidRequest("json payload is invalid"))?;
    let response = app::account::create_vault_item(
        &state.pool,
        &account_session.token,
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
    account_session: AccountSessionToken,
    Path((trip_id, member_id)): Path<(Uuid, Uuid)>,
    request: Result<Json<AccountMemberClaimRequest>, JsonRejection>,
) -> Result<Json<AccountMemberClaimResponse>, ServiceError> {
    let Json(request) =
        request.map_err(|_| ServiceError::InvalidRequest("json payload is invalid"))?;
    let response = app::account::claim_member(
        &state.pool,
        &account_session.token,
        trip_id,
        member_id,
        &request.member_session_token,
    )
    .await?;

    Ok(Json(response))
}

pub async fn transfer_owner(
    State(state): State<AppState>,
    account_session: AccountSessionToken,
    Path(trip_id): Path<Uuid>,
    request: Result<Json<OwnerTransferRequest>, JsonRejection>,
) -> Result<Json<OwnerTransferResponse>, ServiceError> {
    let Json(request) =
        request.map_err(|_| ServiceError::InvalidRequest("json payload is invalid"))?;
    let response = app::account::transfer_trip_owner(
        &state.pool,
        &account_session.token,
        trip_id,
        request.target_member_id,
    )
    .await?;

    Ok(Json(response))
}

pub async fn start_passkey_registration(
    State(state): State<AppState>,
    account_session: AccountSessionToken,
) -> Result<Json<PasskeyChallengeResponse>, ServiceError> {
    let response =
        app::account::start_passkey_registration(&state.pool, &account_session.token).await?;

    Ok(Json(response))
}

pub async fn finish_passkey_registration(
    State(state): State<AppState>,
    account_session: AccountSessionToken,
    request: Result<Json<PasskeyRegistrationFinishRequest>, JsonRejection>,
) -> Result<Json<PasskeySummary>, ServiceError> {
    let Json(request) =
        request.map_err(|_| ServiceError::InvalidRequest("json payload is invalid"))?;
    let response = app::account::finish_passkey_registration(
        &state.pool,
        &account_session.token,
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
    headers: HeaderMap,
    request: Result<Json<PasskeyLoginFinishRequest>, JsonRejection>,
) -> Result<impl IntoResponse, ServiceError> {
    let Json(request) =
        request.map_err(|_| ServiceError::InvalidRequest("json payload is invalid"))?;
    validate_cookie_setting_origin(&headers)?;
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

    Ok(account_session_response(response))
}

pub async fn logout_session(
    State(state): State<AppState>,
    account_session: AccountSessionToken,
) -> Result<impl IntoResponse, ServiceError> {
    app::account::logout_user_session(&state.pool, &account_session.token).await?;

    Ok((
        clear_account_session_cookie_headers(),
        StatusCode::NO_CONTENT,
    ))
}

pub async fn revoke_trusted_device(
    State(state): State<AppState>,
    account_session: AccountSessionToken,
    Path(trusted_device_id): Path<Uuid>,
) -> Result<StatusCode, ServiceError> {
    app::account::revoke_trusted_device(&state.pool, &account_session.token, trusted_device_id)
        .await?;

    Ok(StatusCode::NO_CONTENT)
}

fn account_session_response(session: AccountSession) -> impl IntoResponse {
    let mut headers = HeaderMap::new();
    if matches!(
        session.kind,
        crate::domain::types::AccountSessionKind::Trusted
    ) {
        headers.insert(
            header::SET_COOKIE,
            account_session_cookie(&session.session_token),
        );
    }

    (headers, Json(session))
}

fn validate_cookie_setting_origin(headers: &HeaderMap) -> Result<(), ServiceError> {
    let Some(origin) = headers
        .get(header::ORIGIN)
        .and_then(|value| value.to_str().ok())
    else {
        return Ok(());
    };

    if CorsOriginPolicy::from_env().allows(origin) {
        Ok(())
    } else {
        Err(ServiceError::Forbidden)
    }
}

fn account_session_cookie(session_token: &str) -> HeaderValue {
    let secure = secure_account_cookie();
    let max_age = 30 * 24 * 60 * 60;
    let secure_attribute = if secure { "; Secure" } else { "" };
    HeaderValue::from_str(&format!(
        "{ACCOUNT_SESSION_COOKIE_NAME}={session_token}; Max-Age={max_age}; Path=/; HttpOnly; SameSite=Lax{secure_attribute}",
    ))
    .expect("account session cookie should be a valid header value")
}

fn clear_account_session_cookie_headers() -> HeaderMap {
    let mut headers = HeaderMap::new();
    headers.insert(header::SET_COOKIE, clear_account_session_cookie());
    headers
}

fn clear_account_session_cookie() -> HeaderValue {
    let secure_attribute = if secure_account_cookie() {
        "; Secure"
    } else {
        ""
    };
    HeaderValue::from_str(&format!(
        "{ACCOUNT_SESSION_COOKIE_NAME}=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax{secure_attribute}",
    ))
    .expect("account session clear cookie should be a valid header value")
}

fn secure_account_cookie() -> bool {
    matches!(
        std::env::var("SAGITTARIUS_ENV")
            .unwrap_or_default()
            .trim()
            .to_ascii_lowercase()
            .as_str(),
        "production"
    )
}
