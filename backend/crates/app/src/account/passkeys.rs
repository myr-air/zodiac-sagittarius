use base64::{Engine as _, engine::general_purpose::URL_SAFE_NO_PAD};
use time::OffsetDateTime;
use uuid::Uuid;

use crate::account_email::{ensure_email_domain_is_allowed, normalize_email};
use crate::account_mappers::format_timestamp;
use crate::account_passkeys::{
    decode_base64url, parse_authenticator_sign_count, parse_registration_attestation,
    verify_authenticator_data, verify_client_data_json, verify_passkey_signature,
};
use sagittarius_db::{self as db, PgPool};
use sagittarius_domain::errors::ServiceError;
use sagittarius_domain::types::{
    AccountSession, PasskeyChallengeResponse, PasskeyCredentialDescriptor,
    PasskeyLoginStartResponse, PasskeySummary,
};

use super::auth::{
    authenticate_user_session, create_user_session, generate_secure_token, hash_session_token,
};
use super::settings::validate_account_text;
use super::{
    PASSKEY_CHALLENGE_TTL, PasskeyLoginFinishInput, PasskeyRegistrationFinishInput,
    is_unique_violation_on_constraint,
};

pub async fn delete_passkey(
    pool: &PgPool,
    session_token: &str,
    passkey_id: Uuid,
) -> Result<(), ServiceError> {
    let user_id = authenticate_user_session(pool, session_token).await?;
    let rows = db::account_queries::delete_passkey_for_user(pool, user_id, passkey_id).await?;
    if rows == 0 {
        return Err(ServiceError::NotFound);
    }

    Ok(())
}

pub async fn start_passkey_registration(
    pool: &PgPool,
    session_token: &str,
) -> Result<PasskeyChallengeResponse, ServiceError> {
    let user_id = authenticate_user_session(pool, session_token).await?;
    let challenge_id = Uuid::now_v7();
    let challenge = generate_secure_token();
    let expires_at = OffsetDateTime::now_utc() + PASSKEY_CHALLENGE_TTL;

    db::account_queries::insert_webauthn_challenge(
        pool,
        challenge_id,
        user_id,
        &challenge,
        "register",
        expires_at,
    )
    .await?;

    Ok(PasskeyChallengeResponse {
        challenge_id,
        challenge,
        expires_at: format_timestamp(expires_at),
    })
}

pub async fn finish_passkey_registration(
    pool: &PgPool,
    session_token: &str,
    input: PasskeyRegistrationFinishInput,
) -> Result<PasskeySummary, ServiceError> {
    let session_token_hash = hash_session_token(session_token)?;
    let now = OffsetDateTime::now_utc();
    let mut tx = pool.begin().await?;
    let user_id = db::account_queries::find_active_user_session_in_tx(&mut tx, &session_token_hash)
        .await?
        .ok_or(ServiceError::Unauthenticated)?
        .user_id;
    let (_, expected_challenge) =
        db::account_queries::lock_webauthn_challenge(&mut tx, input.challenge_id, "register", now)
            .await?
            .filter(|(challenge_user_id, _)| *challenge_user_id == user_id)
            .ok_or(ServiceError::Unauthenticated)?;

    let origin = verify_client_data_json(
        &input.client_data_json,
        "webauthn.create",
        &expected_challenge,
    )?;
    let credential_public_key =
        parse_registration_attestation(&input.attestation_object, &input.credential_id, &origin)?;
    let nickname = validate_account_text(&input.nickname, 80, "passkey nickname is invalid")?;
    let credential_record_id = Uuid::now_v7();
    db::account_queries::insert_webauthn_credential(
        &mut tx,
        credential_record_id,
        user_id,
        &input.credential_id,
        serde_json::json!({
            "alg": "ES256",
            "coseKey": URL_SAFE_NO_PAD.encode(&credential_public_key),
        }),
        &nickname,
    )
    .await
    .map_err(map_passkey_insert_error)?;
    db::account_queries::consume_webauthn_challenge(&mut tx, input.challenge_id, now).await?;
    tx.commit().await?;

    Ok(PasskeySummary {
        id: credential_record_id,
        nickname,
        created_at: format_timestamp(now),
        last_used_at: None,
    })
}

pub async fn start_passkey_login(
    pool: &PgPool,
    email: &str,
) -> Result<PasskeyLoginStartResponse, ServiceError> {
    let normalized_email = normalize_email(email)?;
    let (user_id, credential_ids) =
        db::account_queries::list_passkey_credential_ids_for_email(pool, &normalized_email)
            .await?
            .filter(|(_, credential_ids)| !credential_ids.is_empty())
            .ok_or(ServiceError::Unauthenticated)?;
    let challenge_id = Uuid::now_v7();
    let challenge = generate_secure_token();
    let expires_at = OffsetDateTime::now_utc() + PASSKEY_CHALLENGE_TTL;

    db::account_queries::insert_webauthn_challenge(
        pool,
        challenge_id,
        user_id,
        &challenge,
        "login",
        expires_at,
    )
    .await?;

    Ok(PasskeyLoginStartResponse {
        challenge_id,
        challenge,
        expires_at: format_timestamp(expires_at),
        allow_credentials: credential_ids
            .into_iter()
            .map(|credential_id| PasskeyCredentialDescriptor { credential_id })
            .collect(),
    })
}

pub async fn finish_passkey_login(
    pool: &PgPool,
    input: PasskeyLoginFinishInput,
) -> Result<AccountSession, ServiceError> {
    let now = OffsetDateTime::now_utc();
    let mut tx = pool.begin().await?;
    let (challenge_user_id, expected_challenge) =
        db::account_queries::lock_webauthn_challenge(&mut tx, input.challenge_id, "login", now)
            .await?
            .ok_or(ServiceError::Unauthenticated)?;
    let credential = db::account_queries::lock_passkey_credential(&mut tx, &input.credential_id)
        .await?
        .filter(|credential| credential.user_id == challenge_user_id)
        .ok_or(ServiceError::Unauthenticated)?;
    db::account_queries::lock_active_user(&mut tx, credential.user_id)
        .await?
        .ok_or(ServiceError::Unauthenticated)?;
    ensure_user_email_domains_are_allowed(&mut tx, credential.user_id).await?;

    let origin =
        verify_client_data_json(&input.client_data_json, "webauthn.get", &expected_challenge)?;
    let authenticator_data = decode_base64url(&input.authenticator_data)?;
    verify_authenticator_data(&authenticator_data, &origin, false)?;
    let signature = decode_base64url(&input.signature)?;
    let sign_count = parse_authenticator_sign_count(&authenticator_data)?;
    verify_passkey_signature(
        &credential.public_key,
        &authenticator_data,
        &input.client_data_json,
        &signature,
    )?;
    if credential.sign_count > 0 && sign_count <= credential.sign_count {
        return Err(ServiceError::Unauthenticated);
    }

    db::account_queries::update_passkey_credential_usage(
        &mut tx,
        &credential.credential_id,
        sign_count,
        now,
    )
    .await?;
    db::account_queries::consume_webauthn_challenge(&mut tx, input.challenge_id, now).await?;
    let session = create_user_session(
        &mut tx,
        credential.user_id,
        input.trust_device,
        &input.device_label,
        now,
    )
    .await?;
    tx.commit().await?;

    Ok(session)
}

async fn ensure_user_email_domains_are_allowed(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    user_id: Uuid,
) -> Result<(), ServiceError> {
    for email in db::account_queries::list_verified_user_emails_for_user(tx, user_id).await? {
        ensure_email_domain_is_allowed(&email)?;
    }

    Ok(())
}
fn map_passkey_insert_error(error: sqlx::Error) -> ServiceError {
    let duplicate_passkey =
        is_unique_violation_on_constraint(&error, "webauthn_credentials_credential_id_idx");
    if duplicate_passkey {
        ServiceError::InvalidRequest("passkey credential already exists")
    } else {
        ServiceError::database(error)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use sqlx::error::{DatabaseError, ErrorKind};
    use std::borrow::Cow;
    use std::error::Error;
    use std::fmt;

    #[test]
    fn passkey_insert_error_falls_back_to_database_error() {
        let error = map_passkey_insert_error(sqlx::Error::RowNotFound);
        assert!(error.to_string().starts_with("database error"));
    }

    #[test]
    fn passkey_insert_error_maps_duplicate_credential() {
        let error = map_passkey_insert_error(unique_database_error(
            "webauthn_credentials_credential_id_idx",
        ));
        assert!(matches!(
            error,
            ServiceError::InvalidRequest("passkey credential already exists")
        ));
    }

    fn unique_database_error(constraint: &'static str) -> sqlx::Error {
        sqlx::Error::Database(Box::new(FakeDatabaseError { constraint }))
    }

    #[derive(Debug)]
    struct FakeDatabaseError {
        constraint: &'static str,
    }

    impl fmt::Display for FakeDatabaseError {
        fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
            formatter.write_str("fake unique violation")
        }
    }

    impl Error for FakeDatabaseError {}

    impl DatabaseError for FakeDatabaseError {
        fn message(&self) -> &str {
            "fake unique violation"
        }

        fn code(&self) -> Option<Cow<'_, str>> {
            Some(Cow::Borrowed("23505"))
        }

        fn as_error(&self) -> &(dyn Error + Send + Sync + 'static) {
            self
        }

        fn as_error_mut(&mut self) -> &mut (dyn Error + Send + Sync + 'static) {
            self
        }

        fn into_error(self: Box<Self>) -> Box<dyn Error + Send + Sync + 'static> {
            self
        }

        fn constraint(&self) -> Option<&str> {
            Some(self.constraint)
        }

        fn kind(&self) -> ErrorKind {
            ErrorKind::UniqueViolation
        }
    }
}
