use std::collections::BTreeMap;
use std::env;
use std::panic::{self, AssertUnwindSafe};
use std::sync::Mutex;

use base64::Engine as _;
use base64::engine::general_purpose::URL_SAFE_NO_PAD;
use p256::ecdsa::SigningKey;
use sha2::{Digest, Sha256};

use super::*;

static PASSKEY_ORIGIN_ALLOWLIST_MUTEX: Mutex<()> = Mutex::new(());

fn with_passkey_origin_allowlist<R>(value: &str, test: impl FnOnce() -> R) -> R {
    let _guard = PASSKEY_ORIGIN_ALLOWLIST_MUTEX.lock().unwrap();
    let previous = env::var("PASSKEY_ALLOWED_ORIGINS").ok();
    // SAFETY: test code is single-threaded and the process-wide env is restored before returning.
    unsafe {
        env::set_var("PASSKEY_ALLOWED_ORIGINS", value);
    }
    let result = panic::catch_unwind(AssertUnwindSafe(test));
    match previous {
        Some(raw) => {
            // SAFETY: restoring the env is intentionally scoped to this test helper.
            unsafe {
                env::set_var("PASSKEY_ALLOWED_ORIGINS", raw);
            }
        }
        None => {
            // SAFETY: restoring the env is intentionally scoped to this test helper.
            unsafe {
                env::remove_var("PASSKEY_ALLOWED_ORIGINS");
            }
        }
    }
    match result {
        Ok(value) => value,
        Err(payload) => panic::resume_unwind(payload),
    }
}

#[test]
fn passkey_origin_uses_explicit_allowed_origins() {
    with_passkey_origin_allowlist("example.com,127.0.0.1", || {
        assert_eq!(
            allowed_passkey_origin("https://example.com:5180/path"),
            Some("example.com".to_string())
        );
        assert_eq!(
            allowed_passkey_origin("http://127.0.0.1:5180"),
            Some("127.0.0.1".to_string())
        );
        assert_eq!(allowed_passkey_origin("https://localhost:5180"), None);
    });
}

#[test]
fn passkey_origin_respects_subdomain_wildcards() {
    with_passkey_origin_allowlist("*.example.test,localhost", || {
        assert_eq!(
            allowed_passkey_origin("https://foo.example.test"),
            Some("foo.example.test".to_string())
        );
        assert_eq!(allowed_passkey_origin("https://example.test"), None);
    });
}

#[test]
fn passkey_origin_respects_plain_global_wildcard() {
    with_passkey_origin_allowlist("*", || {
        assert_eq!(
            allowed_passkey_origin("https://evil.example.test"),
            Some("evil.example.test".to_string())
        );
    });
}

#[test]
fn passkey_origin_rejects_url_global_wildcards() {
    with_passkey_origin_allowlist("https://*", || {
        assert_eq!(allowed_passkey_origin("https://evil.example.test"), None);
    });
}

#[test]
fn passkey_origin_rejects_url_subdomain_wildcards() {
    with_passkey_origin_allowlist("https://*.example.test", || {
        assert_eq!(allowed_passkey_origin("https://foo.example.test"), None);
    });
}

#[test]
fn passkey_origin_accepts_allowed_origin_urls() {
    with_passkey_origin_allowlist("https://sagittarius.13thx.com", || {
        assert_eq!(
            allowed_passkey_origin("https://sagittarius.13thx.com/account"),
            Some("sagittarius.13thx.com".to_string())
        );
        assert_eq!(allowed_passkey_origin("https://evil.13thx.com"), None);
    });
}

#[test]
fn passkey_origin_rejects_invalid_or_empty_values() {
    with_passkey_origin_allowlist("", || {
        assert_eq!(allowed_passkey_origin("https://localhost:5180"), None);
        assert_eq!(allowed_passkey_origin("ftp://127.0.0.1:5180"), None);
        assert_eq!(allowed_passkey_origin("localhost"), None);
    });
    with_passkey_origin_allowlist("https://,://,*. ", || {
        assert_eq!(allowed_passkey_origin("https://localhost:5180"), None);
        assert_eq!(allowed_passkey_origin("https://example.com"), None);
    });
}

#[test]
fn passkey_authenticator_data_validation_accepts_valid_registration() {
    with_passkey_origin_allowlist("localhost,127.0.0.1", || {
        let signing_key = SigningKey::from_slice(&[7; 32]).unwrap();
        let credential_id = b"unit-passkey-credential";
        let mut auth_data = passkey_authenticator_data(8, 0x45);
        auth_data.extend_from_slice(&[0; 16]);
        auth_data.extend_from_slice(&(credential_id.len() as u16).to_be_bytes());
        auth_data.extend_from_slice(credential_id);
        auth_data.extend_from_slice(&cose_key(&signing_key));
        let encoded_credential_id = URL_SAFE_NO_PAD.encode(credential_id);

        assert_eq!(
            parse_registration_authenticator_data(
                &auth_data,
                &encoded_credential_id,
                "http://localhost:5180",
            )
            .unwrap(),
            cose_key(&signing_key)
        );
        assert_eq!(parse_authenticator_sign_count(&auth_data).unwrap(), 8);
    });
}

#[test]
fn passkey_authenticator_data_validation_rejects_wrong_rp_and_flags() {
    with_passkey_origin_allowlist("localhost,127.0.0.1", || {
        assert!(
            verify_authenticator_data(
                &passkey_authenticator_data(0, 0x05),
                "https://evil.example.test",
                false,
            )
            .is_err()
        );
        assert!(
            verify_authenticator_data(
                &passkey_authenticator_data(0, 0x05),
                "http://127.0.0.1:5180",
                false,
            )
            .is_err()
        );
        assert!(
            verify_authenticator_data(
                &passkey_authenticator_data(0, 0x04),
                "http://localhost:5180",
                false,
            )
            .is_err()
        );
        assert!(
            verify_authenticator_data(
                &passkey_authenticator_data(0, 0x01),
                "http://localhost:5180",
                true,
            )
            .is_err()
        );
        assert!(
            verify_authenticator_data(
                &passkey_authenticator_data(0, 0x41),
                "http://localhost:5180",
                true,
            )
            .is_err()
        );
    });
}

#[test]
fn passkey_authenticator_data_validation_covers_malformed_shapes() {
    with_passkey_origin_allowlist("localhost,127.0.0.1", || {
        assert!(parse_authenticator_sign_count(&[0; 36]).is_err());
        assert!(verify_authenticator_data(&[0; 36], "http://localhost:5180", false).is_err());

        let mut short_registration = passkey_authenticator_data(0, 0x45);
        assert!(
            parse_registration_authenticator_data(
                &short_registration,
                "credential",
                "http://localhost:5180",
            )
            .is_err()
        );

        short_registration.extend_from_slice(&[0; 16]);
        short_registration.extend_from_slice(&1_u16.to_be_bytes());
        assert!(
            parse_registration_authenticator_data(
                &short_registration,
                "credential",
                "http://localhost:5180",
            )
            .is_err()
        );

        short_registration.push(b'x');
        short_registration.push(0);
        assert!(
            parse_registration_authenticator_data(
                &short_registration,
                "different",
                "http://localhost:5180",
            )
            .is_err()
        );
    });
}

#[test]
fn passkey_cbor_helpers_handle_non_maps_and_values() {
    let not_map = serde_cbor::Value::Bool(false);
    assert!(cbor_map_text_bytes(&not_map, "authData").is_none());
    assert!(cbor_map_int_bytes(&not_map, -2).is_none());
    assert!(cbor_map_int_integer(&not_map, 1).is_none());

    let map = serde_cbor::Value::Map(
        [
            (
                serde_cbor::Value::Text("authData".to_string()),
                serde_cbor::Value::Bytes(vec![1, 2, 3]),
            ),
            (
                serde_cbor::Value::Integer(-2),
                serde_cbor::Value::Bytes(vec![4, 5, 6]),
            ),
            (serde_cbor::Value::Integer(1), serde_cbor::Value::Integer(2)),
        ]
        .into_iter()
        .collect(),
    );
    assert_eq!(
        cbor_map_text_bytes(&map, "authData"),
        Some([1, 2, 3].as_slice())
    );
    assert_eq!(cbor_map_int_bytes(&map, -2), Some([4, 5, 6].as_slice()));
    assert_eq!(cbor_map_int_integer(&map, 1), Some(2));

    let wrong_value_types = serde_cbor::Value::Map(
        [
            (
                serde_cbor::Value::Text("authData".to_string()),
                serde_cbor::Value::Integer(1),
            ),
            (
                serde_cbor::Value::Integer(-2),
                serde_cbor::Value::Integer(2),
            ),
            (
                serde_cbor::Value::Integer(1),
                serde_cbor::Value::Bytes(vec![3]),
            ),
        ]
        .into_iter()
        .collect(),
    );
    assert!(cbor_map_text_bytes(&wrong_value_types, "authData").is_none());
    assert!(cbor_map_int_bytes(&wrong_value_types, -2).is_none());
    assert!(cbor_map_int_integer(&wrong_value_types, 1).is_none());
}

fn passkey_authenticator_data(sign_count: u32, flags: u8) -> Vec<u8> {
    let mut auth_data = vec![0; 37];
    auth_data[..32].copy_from_slice(&Sha256::digest(b"localhost"));
    auth_data[32] = flags;
    auth_data[33..37].copy_from_slice(&sign_count.to_be_bytes());
    auth_data
}

fn cose_key(signing_key: &SigningKey) -> Vec<u8> {
    let encoded_point = signing_key.verifying_key().to_encoded_point(false);
    let mut map = BTreeMap::new();
    map.insert(serde_cbor::Value::Integer(1), serde_cbor::Value::Integer(2));
    map.insert(
        serde_cbor::Value::Integer(3),
        serde_cbor::Value::Integer(-7),
    );
    map.insert(
        serde_cbor::Value::Integer(-1),
        serde_cbor::Value::Integer(1),
    );
    map.insert(
        serde_cbor::Value::Integer(-2),
        serde_cbor::Value::Bytes(encoded_point.x().unwrap().to_vec()),
    );
    map.insert(
        serde_cbor::Value::Integer(-3),
        serde_cbor::Value::Bytes(encoded_point.y().unwrap().to_vec()),
    );
    serde_cbor::to_vec(&serde_cbor::Value::Map(map)).unwrap()
}
