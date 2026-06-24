use base64::{Engine as _, engine::general_purpose::URL_SAFE_NO_PAD};
use p256::ecdsa::signature::Verifier;
use p256::ecdsa::{Signature, VerifyingKey};
use serde_json::Value;
use sha2::{Digest, Sha256};

use crate::domain::errors::ServiceError;

const PASSKEY_ALLOWED_ORIGINS: &[&str] = &["localhost", "127.0.0.1", "0.0.0.0"];
const WEBAUTHN_FLAG_USER_PRESENT: u8 = 0x01;
const WEBAUTHN_FLAG_USER_VERIFIED: u8 = 0x04;
const WEBAUTHN_FLAG_ATTESTED_CREDENTIAL_DATA: u8 = 0x40;

pub(crate) fn verify_client_data_json(
    encoded_client_data_json: &str,
    expected_type: &str,
    expected_challenge: &str,
) -> Result<String, ServiceError> {
    let client_data_json = decode_base64url(encoded_client_data_json)?;
    let value: Value = serde_json::from_slice(&client_data_json)
        .map_err(|_| ServiceError::InvalidRequest("client data json is invalid"))?;
    let challenge =
        value
            .get("challenge")
            .and_then(Value::as_str)
            .ok_or(ServiceError::InvalidRequest(
                "client data challenge is invalid",
            ))?;
    let credential_type = value
        .get("type")
        .and_then(Value::as_str)
        .ok_or(ServiceError::InvalidRequest("client data type is invalid"))?;
    let origin =
        value
            .get("origin")
            .and_then(Value::as_str)
            .ok_or(ServiceError::InvalidRequest(
                "client data origin is invalid",
            ))?;
    if challenge != expected_challenge || credential_type != expected_type {
        return Err(ServiceError::Unauthenticated);
    }
    if allowed_passkey_origin(origin).is_none() {
        return Err(ServiceError::Unauthenticated);
    }

    Ok(origin.to_string())
}

pub(crate) fn parse_registration_attestation(
    encoded_attestation_object: &str,
    expected_credential_id: &str,
    origin: &str,
) -> Result<Vec<u8>, ServiceError> {
    let attestation_object = decode_base64url(encoded_attestation_object)?;
    let value: serde_cbor::Value = serde_cbor::from_slice(&attestation_object)
        .map_err(|_| ServiceError::InvalidRequest("attestation object is invalid"))?;
    let auth_data = cbor_map_text_bytes(&value, "authData").ok_or(ServiceError::InvalidRequest(
        "authenticator data is invalid",
    ))?;
    parse_registration_authenticator_data(auth_data, expected_credential_id, origin)
}

fn parse_registration_authenticator_data(
    auth_data: &[u8],
    expected_credential_id: &str,
    origin: &str,
) -> Result<Vec<u8>, ServiceError> {
    const ATTESTED_CREDENTIAL_DATA_OFFSET: usize = 37;
    const AAGUID_LENGTH: usize = 16;
    verify_authenticator_data(auth_data, origin, true)?;
    if auth_data.len() < ATTESTED_CREDENTIAL_DATA_OFFSET + AAGUID_LENGTH + 2 {
        return Err(ServiceError::InvalidRequest(
            "authenticator data is invalid",
        ));
    }

    let credential_length_offset = ATTESTED_CREDENTIAL_DATA_OFFSET + AAGUID_LENGTH;
    let credential_id_length = u16::from_be_bytes([
        auth_data[credential_length_offset],
        auth_data[credential_length_offset + 1],
    ]) as usize;
    let credential_id_offset = credential_length_offset + 2;
    let credential_public_key_offset = credential_id_offset + credential_id_length;
    if auth_data.len() <= credential_public_key_offset {
        return Err(ServiceError::InvalidRequest(
            "authenticator data is invalid",
        ));
    }

    let credential_id =
        URL_SAFE_NO_PAD.encode(&auth_data[credential_id_offset..credential_public_key_offset]);
    if credential_id != expected_credential_id {
        return Err(ServiceError::Unauthenticated);
    }
    let credential_public_key = auth_data[credential_public_key_offset..].to_vec();
    cose_es256_verifying_key(&credential_public_key)?;

    Ok(credential_public_key)
}

pub(crate) fn parse_authenticator_sign_count(
    authenticator_data: &[u8],
) -> Result<i64, ServiceError> {
    if authenticator_data.len() < 37 {
        return Err(ServiceError::InvalidRequest(
            "authenticator data is invalid",
        ));
    }
    Ok(u32::from_be_bytes([
        authenticator_data[33],
        authenticator_data[34],
        authenticator_data[35],
        authenticator_data[36],
    ]) as i64)
}

pub(crate) fn verify_authenticator_data(
    authenticator_data: &[u8],
    origin: &str,
    require_attested_credential_data: bool,
) -> Result<(), ServiceError> {
    if authenticator_data.len() < 37 {
        return Err(ServiceError::InvalidRequest(
            "authenticator data is invalid",
        ));
    }
    let rp_id = allowed_passkey_origin(origin).ok_or(ServiceError::Unauthenticated)?;
    let expected_rp_id_hash = Sha256::digest(rp_id.as_bytes());
    if authenticator_data[..32] != expected_rp_id_hash[..] {
        return Err(ServiceError::Unauthenticated);
    }
    let flags = authenticator_data[32];
    if flags & WEBAUTHN_FLAG_USER_PRESENT == 0 {
        return Err(ServiceError::Unauthenticated);
    }
    if flags & WEBAUTHN_FLAG_USER_VERIFIED == 0 {
        return Err(ServiceError::Unauthenticated);
    }
    if require_attested_credential_data && flags & WEBAUTHN_FLAG_ATTESTED_CREDENTIAL_DATA == 0 {
        return Err(ServiceError::Unauthenticated);
    }

    Ok(())
}

fn allowed_passkey_origin(origin: &str) -> Option<String> {
    let (scheme, rest) = origin.split_once("://")?;
    if scheme != "http" && scheme != "https" {
        return None;
    }
    let host = rest.split('/').next().unwrap_or("");
    let host = host.split(':').next().unwrap_or(host).to_ascii_lowercase();
    if host.is_empty() {
        return None;
    }

    let allowed = std::env::var("PASSKEY_ALLOWED_ORIGINS")
        .map(|value| {
            value
                .split(',')
                .filter_map(normalized_passkey_allowed_entry)
                .collect::<Vec<_>>()
        })
        .unwrap_or_else(|_| {
            PASSKEY_ALLOWED_ORIGINS
                .iter()
                .copied()
                .filter_map(normalized_passkey_allowed_entry)
                .collect::<Vec<_>>()
        });

    let wildcard_allowed = allowed.iter().any(|entry| entry == "*" || entry == &host);
    let subdomain_allowed = allowed.iter().any(|entry| {
        entry.starts_with("*.")
            && host.ends_with(&entry["*.".len()..])
            && host.len() > entry.len() - 2
    });

    (wildcard_allowed || subdomain_allowed).then_some(host)
}

fn normalized_passkey_allowed_entry(entry: &str) -> Option<String> {
    let entry = entry.trim().to_ascii_lowercase();
    if entry.is_empty() {
        return None;
    }
    if let Some(rest) = entry
        .strip_prefix("http://")
        .or_else(|| entry.strip_prefix("https://"))
    {
        let host = rest.split('/').next().unwrap_or("");
        let host = host.split(':').next().unwrap_or(host);
        if host.is_empty() || host.contains('*') {
            return None;
        }
        return Some(host.to_string());
    }
    if let Some(suffix) = entry.strip_prefix("*.") {
        if suffix.is_empty() || suffix.contains("://") {
            return None;
        }
        return Some(entry);
    }
    if entry.contains("://") {
        return None;
    }

    Some(entry)
}

pub(crate) fn verify_passkey_signature(
    public_key: &Value,
    authenticator_data: &[u8],
    encoded_client_data_json: &str,
    signature: &[u8],
) -> Result<(), ServiceError> {
    let cose_key =
        public_key
            .get("coseKey")
            .and_then(Value::as_str)
            .ok_or(ServiceError::InvalidRequest(
                "passkey public key is invalid",
            ))?;
    let verifying_key = cose_es256_verifying_key(&decode_base64url(cose_key)?)?;
    let client_data_json = decode_base64url(encoded_client_data_json)?;
    let client_data_hash = Sha256::digest(client_data_json);
    let mut signed_data = Vec::with_capacity(authenticator_data.len() + client_data_hash.len());
    signed_data.extend_from_slice(authenticator_data);
    signed_data.extend_from_slice(&client_data_hash);
    let signature = Signature::from_der(signature).map_err(|_| ServiceError::Unauthenticated)?;
    verifying_key
        .verify(&signed_data, &signature)
        .map_err(|_| ServiceError::Unauthenticated)
}

fn cose_es256_verifying_key(cose_key: &[u8]) -> Result<VerifyingKey, ServiceError> {
    let value: serde_cbor::Value = serde_cbor::from_slice(cose_key)
        .map_err(|_| ServiceError::InvalidRequest("passkey public key is invalid"))?;
    let x = cbor_map_int_bytes(&value, -2)
        .filter(|bytes| bytes.len() == 32)
        .ok_or(ServiceError::InvalidRequest(
            "passkey public key is invalid",
        ))?;
    let y = cbor_map_int_bytes(&value, -3)
        .filter(|bytes| bytes.len() == 32)
        .ok_or(ServiceError::InvalidRequest(
            "passkey public key is invalid",
        ))?;
    if cbor_map_int_integer(&value, 1) != Some(2)
        || cbor_map_int_integer(&value, 3) != Some(-7)
        || cbor_map_int_integer(&value, -1) != Some(1)
    {
        return Err(ServiceError::InvalidRequest(
            "passkey public key is invalid",
        ));
    }
    let mut sec1 = Vec::with_capacity(65);
    sec1.push(0x04);
    sec1.extend_from_slice(x);
    sec1.extend_from_slice(y);

    VerifyingKey::from_sec1_bytes(&sec1)
        .map_err(|_| ServiceError::InvalidRequest("passkey public key is invalid"))
}

fn cbor_map_text_bytes<'a>(value: &'a serde_cbor::Value, key: &str) -> Option<&'a [u8]> {
    let serde_cbor::Value::Map(map) = value else {
        return None;
    };
    map.iter().find_map(|(candidate_key, candidate_value)| {
        if matches!(candidate_key, serde_cbor::Value::Text(text) if text == key) {
            if let serde_cbor::Value::Bytes(bytes) = candidate_value {
                Some(bytes.as_slice())
            } else {
                None
            }
        } else {
            None
        }
    })
}

fn cbor_map_int_bytes(value: &serde_cbor::Value, key: i128) -> Option<&[u8]> {
    let serde_cbor::Value::Map(map) = value else {
        return None;
    };
    map.iter().find_map(|(candidate_key, candidate_value)| {
        if matches!(candidate_key, serde_cbor::Value::Integer(integer) if *integer == key) {
            if let serde_cbor::Value::Bytes(bytes) = candidate_value {
                Some(bytes.as_slice())
            } else {
                None
            }
        } else {
            None
        }
    })
}

fn cbor_map_int_integer(value: &serde_cbor::Value, key: i128) -> Option<i128> {
    let serde_cbor::Value::Map(map) = value else {
        return None;
    };
    map.iter().find_map(|(candidate_key, candidate_value)| {
        if matches!(candidate_key, serde_cbor::Value::Integer(integer) if *integer == key) {
            if let serde_cbor::Value::Integer(integer) = candidate_value {
                Some(*integer)
            } else {
                None
            }
        } else {
            None
        }
    })
}

pub(crate) fn decode_base64url(value: &str) -> Result<Vec<u8>, ServiceError> {
    URL_SAFE_NO_PAD
        .decode(value)
        .map_err(|_| ServiceError::InvalidRequest("base64url value is invalid"))
}

#[cfg(test)]
mod tests;
