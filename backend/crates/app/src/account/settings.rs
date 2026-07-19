use uuid::Uuid;

use crate::account_mappers::{
    account_profile_from_record, passkey_summary_from_record, trusted_device_summary_from_record,
};
use sagittarius_db::{self as db, PgPool};
use sagittarius_domain::errors::ServiceError;
use sagittarius_domain::types::AccountSettings;

use super::auth::authenticate_user_session;
use super::{
    AccountSettingsUpdateInput, MAX_ACCOUNT_DISPLAY_NAME_LENGTH, MAX_ACCOUNT_LOCALE_LENGTH,
    MAX_ACCOUNT_TIMEZONE_LENGTH, MAX_TRIP_TEXT_LENGTH,
};

pub async fn load_settings(
    pool: &PgPool,
    session_token: &str,
) -> Result<AccountSettings, ServiceError> {
    let user_id = authenticate_user_session(pool, session_token).await?;
    let profile = db::account_queries::get_user_profile(pool, user_id)
        .await?
        .ok_or(ServiceError::Unauthenticated)?;
    let passkeys = db::account_queries::list_passkeys(pool, user_id).await?;
    let trusted_devices = db::account_queries::list_trusted_devices(pool, user_id).await?;

    Ok(AccountSettings {
        profile: account_profile_from_record(profile),
        passkeys: passkeys
            .into_iter()
            .map(passkey_summary_from_record)
            .collect(),
        trusted_devices: trusted_devices
            .into_iter()
            .map(trusted_device_summary_from_record)
            .collect(),
    })
}

pub async fn update_settings(
    pool: &PgPool,
    session_token: &str,
    input: AccountSettingsUpdateInput,
) -> Result<AccountSettings, ServiceError> {
    let user_id = authenticate_user_session(pool, session_token).await?;
    let display_name = validate_account_text(
        &input.display_name,
        MAX_ACCOUNT_DISPLAY_NAME_LENGTH,
        "display name is invalid",
    )?;
    let avatar_color = validate_avatar_color(&input.avatar_color)?;
    let locale = validate_account_text(
        &input.locale,
        MAX_ACCOUNT_LOCALE_LENGTH,
        "locale is invalid",
    )?;
    let timezone = validate_account_text(
        &input.timezone,
        MAX_ACCOUNT_TIMEZONE_LENGTH,
        "timezone is invalid",
    )?;
    let home_city = optional_account_text(
        input.home_city.as_deref(),
        MAX_TRIP_TEXT_LENGTH,
        "home city is invalid",
    )?;
    let home_country = optional_account_text(
        input.home_country.as_deref(),
        MAX_TRIP_TEXT_LENGTH,
        "home country is invalid",
    )?;

    db::account_queries::update_user_profile(
        pool,
        user_id,
        &display_name,
        &avatar_color,
        &locale,
        &timezone,
        home_city.as_deref(),
        home_country.as_deref(),
    )
    .await?
    .ok_or(ServiceError::Unauthenticated)?;

    load_settings(pool, session_token).await
}
pub async fn revoke_trusted_device(
    pool: &PgPool,
    session_token: &str,
    trusted_device_id: Uuid,
) -> Result<(), ServiceError> {
    let user_id = authenticate_user_session(pool, session_token).await?;
    let rows =
        db::account_queries::revoke_trusted_device_for_user(pool, user_id, trusted_device_id)
            .await?;
    if rows == 0 {
        return Err(ServiceError::NotFound);
    }

    Ok(())
}

pub(super) fn validate_account_text(
    value: &str,
    max_length: usize,
    field: &'static str,
) -> Result<String, ServiceError> {
    let trimmed = value.trim();
    if trimmed.is_empty() || trimmed.chars().count() > max_length {
        return Err(ServiceError::InvalidRequest(field));
    }

    Ok(trimmed.to_string())
}

fn optional_account_text(
    value: Option<&str>,
    max_length: usize,
    field: &'static str,
) -> Result<Option<String>, ServiceError> {
    let Some(value) = value else {
        return Ok(None);
    };
    let trimmed = value.trim();
    if trimmed.is_empty() {
        return Ok(None);
    }
    if trimmed.chars().count() > max_length {
        return Err(ServiceError::InvalidRequest(field));
    }
    Ok(Some(trimmed.to_string()))
}

fn validate_avatar_color(value: &str) -> Result<String, ServiceError> {
    let trimmed = value.trim();
    let bytes = trimmed.as_bytes();
    if bytes.len() == 7
        && bytes[0] == b'#'
        && bytes[1..].iter().all(|byte| byte.is_ascii_hexdigit())
    {
        return Ok(trimmed.to_ascii_lowercase());
    }

    Err(ServiceError::InvalidRequest("avatar color is invalid"))
}
