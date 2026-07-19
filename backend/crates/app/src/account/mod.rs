mod auth;
mod claims;
mod passkeys;
mod settings;
mod trips;
mod vault;

use uuid::Uuid;

use sagittarius_domain::types::TripCity;

const CHALLENGE_TTL: time::Duration = time::Duration::minutes(10);
const PASSKEY_CHALLENGE_TTL: time::Duration = time::Duration::minutes(5);
const TEMPORARY_SESSION_TTL: time::Duration = time::Duration::days(1);
const TRUSTED_SESSION_TTL: time::Duration = time::Duration::days(30);
const EMAIL_LOGIN_CODE_SALT: &[u8] = b"sagittarius-email-login-code";
const SESSION_TOKEN_SALT: &[u8] = b"sagittarius-account-session-token";
const DEFAULT_TRUSTED_DEVICE_LABEL: &str = "Trusted device";
const MAX_EMAIL_LOGIN_ATTEMPTS: i32 = 5;
const PASSWORD_LOGIN_MAX_ATTEMPTS: i32 = 5;
const PASSWORD_LOGIN_LOCK_MINUTES: i64 = 15;
const PASSWORD_LOGIN_ATTEMPT_SCOPE: &str = "account_password_login";
const MIN_ACCOUNT_PASSWORD_LENGTH: usize = 8;
const MAX_ACCOUNT_PASSWORD_LENGTH: usize = 256;
const MAX_TRUSTED_DEVICE_LABEL_LENGTH: usize = 120;
const MAX_ACCOUNT_DISPLAY_NAME_LENGTH: usize = 80;
const MAX_ACCOUNT_LOCALE_LENGTH: usize = 32;
const MAX_ACCOUNT_TIMEZONE_LENGTH: usize = 64;
const MAX_TRIP_TEXT_LENGTH: usize = 120;
const MAX_TRIP_TIMEZONE_LENGTH: usize = 64;
const MAX_JOIN_ID_LENGTH: usize = 32;
const MIN_JOIN_PASSWORD_LENGTH: usize = 8;
const MAX_JOIN_PASSWORD_LENGTH: usize = 256;
const DEFAULT_OWNER_COLOR: &str = "#0f766e";

pub struct AccountTripCreateInput {
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
    pub start_date: time::Date,
    pub end_date: time::Date,
    pub owner_display_name: String,
    pub join_id: String,
    pub join_password: String,
}

pub struct AccountSettingsUpdateInput {
    pub display_name: String,
    pub avatar_color: String,
    pub locale: String,
    pub timezone: String,
    pub home_city: Option<String>,
    pub home_country: Option<String>,
}

pub struct AccountVaultItemCreateInput {
    pub trip_id: Option<Uuid>,
    pub kind: String,
    pub title: String,
    pub detail: String,
    pub external_url: Option<String>,
}

pub struct PasskeyRegistrationFinishInput {
    pub challenge_id: Uuid,
    pub credential_id: String,
    pub client_data_json: String,
    pub attestation_object: String,
    pub nickname: String,
}

pub struct PasskeyLoginFinishInput {
    pub challenge_id: Uuid,
    pub credential_id: String,
    pub client_data_json: String,
    pub authenticator_data: String,
    pub signature: String,
    pub trust_device: bool,
    pub device_label: String,
}

pub struct PasswordLoginInput {
    pub flow: PasswordLoginFlow,
    pub email: String,
    pub password: String,
    pub trust_device: bool,
    pub device_label: String,
}

pub enum PasswordLoginFlow {
    Login,
    Register,
}

pub use auth::{
    authenticate_user_session, finish_email_login, finish_password_login, logout_user_session,
    start_email_login,
};
pub use claims::{claim_member, transfer_trip_owner};
pub use passkeys::{
    finish_passkey_login, finish_passkey_registration, start_passkey_login,
    start_passkey_registration,
};
pub use settings::{load_settings, revoke_trusted_device, update_settings};
pub use trips::{
    create_trip, create_trip_member_session, list_todos, list_trips, load_explorer, load_stats,
};
pub use vault::{create_vault_item, list_vault_items};

fn is_unique_violation_on_constraint(error: &sqlx::Error, constraint: &str) -> bool {
    matches!(error, sqlx::Error::Database(database_error) if database_error.code().as_deref() == Some("23505") && database_error.constraint() == Some(constraint))
}
