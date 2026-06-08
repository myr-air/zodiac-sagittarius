mod support;

use axum::body::{Body, to_bytes};
use base64::{Engine as _, engine::general_purpose::URL_SAFE_NO_PAD};
use http::{Method, Request, Response, StatusCode, header};
use p256::ecdsa::signature::Signer;
use p256::ecdsa::{Signature, SigningKey};
use serde::de::DeserializeOwned;
use serde_json::{Value, json};
use sha2::{Digest, Sha256};
use tower::ServiceExt;
use uuid::Uuid;

const PASSKEY_ORIGIN: &str = "http://localhost:5180";
const PASSKEY_RP_ID: &str = "localhost";

async fn post_json(app: axum::Router, uri: &str, body: Value) -> Response<axum::body::Body> {
    app.oneshot(
        Request::builder()
            .method(Method::POST)
            .uri(uri)
            .header(header::CONTENT_TYPE, "application/json")
            .body(Body::from(body.to_string()))
            .unwrap(),
    )
    .await
    .unwrap()
}

async fn post_json_response<T: DeserializeOwned>(
    app: axum::Router,
    uri: &str,
    body: Value,
) -> (StatusCode, T) {
    let response = post_json(app, uri, body).await;
    let status = response.status();
    let bytes = to_bytes(response.into_body(), 65536).await.unwrap();
    let body = serde_json::from_slice(&bytes).unwrap();

    (status, body)
}

async fn post_raw(app: axum::Router, uri: &str, body: Body) -> Response<axum::body::Body> {
    app.oneshot(
        Request::builder()
            .method(Method::POST)
            .uri(uri)
            .header(header::CONTENT_TYPE, "application/json")
            .body(body)
            .unwrap(),
    )
    .await
    .unwrap()
}

async fn get_with_auth(
    app: axum::Router,
    uri: &str,
    authorization: Option<&str>,
) -> Response<axum::body::Body> {
    let mut request = Request::builder().method(Method::GET).uri(uri);
    if let Some(authorization) = authorization {
        request = request.header(header::AUTHORIZATION, authorization);
    }

    app.oneshot(request.body(Body::empty()).unwrap())
        .await
        .unwrap()
}

async fn post_with_auth(
    app: axum::Router,
    uri: &str,
    authorization: Option<&str>,
) -> Response<axum::body::Body> {
    let mut request = Request::builder().method(Method::POST).uri(uri);
    if let Some(authorization) = authorization {
        request = request.header(header::AUTHORIZATION, authorization);
    }

    app.oneshot(request.body(Body::empty()).unwrap())
        .await
        .unwrap()
}

async fn post_json_with_auth(
    app: axum::Router,
    uri: &str,
    authorization: Option<&str>,
    body: Value,
) -> Response<axum::body::Body> {
    let mut request = Request::builder()
        .method(Method::POST)
        .uri(uri)
        .header(header::CONTENT_TYPE, "application/json");
    if let Some(authorization) = authorization {
        request = request.header(header::AUTHORIZATION, authorization);
    }

    app.oneshot(request.body(Body::from(body.to_string())).unwrap())
        .await
        .unwrap()
}

async fn patch_json_with_auth(
    app: axum::Router,
    uri: &str,
    authorization: Option<&str>,
    body: Value,
) -> Response<axum::body::Body> {
    let mut request = Request::builder()
        .method(Method::PATCH)
        .uri(uri)
        .header(header::CONTENT_TYPE, "application/json");
    if let Some(authorization) = authorization {
        request = request.header(header::AUTHORIZATION, authorization);
    }

    app.oneshot(request.body(Body::from(body.to_string())).unwrap())
        .await
        .unwrap()
}

async fn patch_raw_with_auth(
    app: axum::Router,
    uri: &str,
    authorization: Option<&str>,
    body: Body,
) -> Response<axum::body::Body> {
    let mut request = Request::builder()
        .method(Method::PATCH)
        .uri(uri)
        .header(header::CONTENT_TYPE, "application/json");
    if let Some(authorization) = authorization {
        request = request.header(header::AUTHORIZATION, authorization);
    }

    app.oneshot(request.body(body).unwrap()).await.unwrap()
}

async fn delete_with_auth(
    app: axum::Router,
    uri: &str,
    authorization: Option<&str>,
) -> Response<axum::body::Body> {
    let mut request = Request::builder().method(Method::DELETE).uri(uri);
    if let Some(authorization) = authorization {
        request = request.header(header::AUTHORIZATION, authorization);
    }

    app.oneshot(request.body(Body::empty()).unwrap())
        .await
        .unwrap()
}

async fn response_json(response: Response<axum::body::Body>) -> (StatusCode, Value) {
    let status = response.status();
    let bytes = to_bytes(response.into_body(), 65536).await.unwrap();
    let body = if bytes.is_empty() {
        Value::Null
    } else {
        serde_json::from_slice(&bytes).unwrap()
    };

    (status, body)
}

#[sqlx::test(migrations = "../../migrations")]
async fn account_settings_can_update_profile_fields(pool: sqlx::PgPool) {
    let session = login_account(&pool, "settings-owner@example.com", true, "Settings laptop").await;
    let token = session["sessionToken"].as_str().unwrap();
    let authorization = format!("Bearer {token}");

    let (status, body) = response_json(
        patch_json_with_auth(
            support::app(pool.clone()),
            "/api/v1/account",
            Some(&authorization),
            json!({
                "displayName": "  Aom Updated  ",
                "avatarColor": "#ABCDEF",
                "locale": "en-US",
                "timezone": "Asia/Tokyo"
            }),
        )
        .await,
    )
    .await;

    assert_eq!(status, StatusCode::OK);
    assert_eq!(body["profile"]["displayName"], "Aom Updated");
    assert_eq!(body["profile"]["avatarColor"], "#abcdef");
    assert_eq!(body["profile"]["locale"], "en-US");
    assert_eq!(body["profile"]["timezone"], "Asia/Tokyo");
    assert_eq!(
        body["profile"]["primaryEmail"],
        "settings-owner@example.com"
    );
    assert_eq!(body["trustedDevices"].as_array().unwrap().len(), 1);

    let stored = sqlx::query_as::<_, (String, String, String, String)>(
        "select display_name, avatar_color, locale, timezone
         from users
         where id = $1",
    )
    .bind(Uuid::parse_str(session["userId"].as_str().unwrap()).unwrap())
    .fetch_one(&pool)
    .await
    .unwrap();
    assert_eq!(
        stored,
        (
            "Aom Updated".to_string(),
            "#abcdef".to_string(),
            "en-US".to_string(),
            "Asia/Tokyo".to_string()
        )
    );
}

#[sqlx::test(migrations = "../../migrations")]
async fn account_settings_update_validates_payload_and_auth(pool: sqlx::PgPool) {
    let session = login_account(&pool, "settings-invalid@example.com", false, "").await;
    let authorization = format!("Bearer {}", session["sessionToken"].as_str().unwrap());

    let malformed = response_json(
        patch_raw_with_auth(
            support::app(pool.clone()),
            "/api/v1/account",
            Some(&authorization),
            Body::from("{"),
        )
        .await,
    )
    .await;
    assert_eq!(malformed.0, StatusCode::BAD_REQUEST);
    assert_eq!(malformed.1["code"], "invalid_request");

    for payload in [
        json!({"displayName": "", "avatarColor": "#abcdef", "locale": "th-TH", "timezone": "Asia/Bangkok"}),
        json!({"displayName": "Aom", "avatarColor": "teal", "locale": "th-TH", "timezone": "Asia/Bangkok"}),
        json!({"displayName": "Aom", "avatarColor": "#abcdef", "locale": "", "timezone": "Asia/Bangkok"}),
        json!({"displayName": "Aom", "avatarColor": "#abcdef", "locale": "th-TH", "timezone": ""}),
    ] {
        let (status, body) = response_json(
            patch_json_with_auth(
                support::app(pool.clone()),
                "/api/v1/account",
                Some(&authorization),
                payload,
            )
            .await,
        )
        .await;
        assert_eq!(status, StatusCode::BAD_REQUEST);
        assert_eq!(body["code"], "invalid_request");
    }

    let (missing_auth_status, missing_auth_body) = response_json(
        patch_json_with_auth(
            support::app(pool),
            "/api/v1/account",
            None,
            json!({
                "displayName": "Aom",
                "avatarColor": "#abcdef",
                "locale": "th-TH",
                "timezone": "Asia/Bangkok"
            }),
        )
        .await,
    )
    .await;
    assert_eq!(missing_auth_status, StatusCode::UNAUTHORIZED);
    assert_eq!(missing_auth_body["code"], "unauthenticated");
}

async fn login_account(
    pool: &sqlx::PgPool,
    email: &str,
    trust_device: bool,
    device_label: &str,
) -> Value {
    let app = support::app(pool.clone());
    let (start, code) = start_email_login_with_code(pool, app.clone(), email).await;
    let (status, session): (StatusCode, Value) = post_json_response(
        app,
        "/api/v1/auth/email/sessions",
        json!({
            "challengeId": start["challengeId"],
            "code": code,
            "trustDevice": trust_device,
            "deviceLabel": device_label
        }),
    )
    .await;
    assert_eq!(status, StatusCode::OK);

    session
}

async fn start_email_login_with_code(
    pool: &sqlx::PgPool,
    app: axum::Router,
    email: &str,
) -> (Value, String) {
    let (status, body): (StatusCode, Value) = post_json_response(
        app,
        "/api/v1/auth/email/challenges",
        json!({"email": email}),
    )
    .await;
    assert_eq!(status, StatusCode::OK);
    assert!(
        body.get("devCode").is_none(),
        "email login code must not be exposed in the public response"
    );
    let challenge_id = Uuid::parse_str(body["challengeId"].as_str().unwrap()).unwrap();
    let code = sqlx::query_scalar(
        "select code
         from email_login_outbox
         where challenge_id = $1",
    )
    .bind(challenge_id)
    .fetch_one(pool)
    .await
    .unwrap();

    (body, code)
}

async fn assert_invalid_request(response: Response<axum::body::Body>) {
    assert_eq!(response.status(), StatusCode::BAD_REQUEST);
    let bytes = to_bytes(response.into_body(), 65536).await.unwrap();
    let body: Value = serde_json::from_slice(&bytes).unwrap();
    assert_eq!(body["code"], "invalid_request");
}

#[sqlx::test(migrations = "../../migrations")]
async fn password_auth_registers_and_logs_in_without_email_code(pool: sqlx::PgPool) {
    let app = support::app(pool.clone());
    let (status, session): (StatusCode, Value) = post_json_response(
        app.clone(),
        "/api/v1/auth/password/sessions",
        json!({
            "flow": "register",
            "email": " Password.Owner@Example.COM ",
            "password": "correct-horse-battery",
            "trustDevice": true,
            "deviceLabel": "Password laptop"
        }),
    )
    .await;

    assert_eq!(status, StatusCode::OK);
    assert_eq!(session["kind"], "trusted");
    assert!(session["sessionToken"].as_str().unwrap().len() > 20);

    let stored = sqlx::query_as::<_, (String, String, Option<String>)>(
        "select ue.normalized_email, u.display_name, u.password_hash
         from user_emails ue
         join users u on u.id = ue.user_id
         where ue.normalized_email = $1",
    )
    .bind("password.owner@example.com")
    .fetch_one(&pool)
    .await
    .unwrap();
    assert_eq!(stored.0, "password.owner@example.com");
    assert_eq!(stored.1, "password.owner");
    let password_hash = stored.2.expect("password registration should store a hash");
    assert_ne!(password_hash, "correct-horse-battery");
    assert!(password_hash.starts_with("$argon2"));

    let (login_status, login_session): (StatusCode, Value) = post_json_response(
        app.clone(),
        "/api/v1/auth/password/sessions",
        json!({
            "flow": "login",
            "email": "password.owner@example.com",
            "password": "correct-horse-battery",
            "trustDevice": false,
            "deviceLabel": ""
        }),
    )
    .await;
    assert_eq!(login_status, StatusCode::OK);
    assert_eq!(login_session["kind"], "temporary");
    assert_eq!(login_session["userId"], session["userId"]);

    let (wrong_status, wrong_body): (StatusCode, Value) = post_json_response(
        app,
        "/api/v1/auth/password/sessions",
        json!({
            "flow": "login",
            "email": "password.owner@example.com",
            "password": "wrong-password",
            "trustDevice": false,
            "deviceLabel": ""
        }),
    )
    .await;
    assert_eq!(wrong_status, StatusCode::UNAUTHORIZED);
    assert_eq!(wrong_body["code"], "unauthenticated");
}

#[sqlx::test(migrations = "../../migrations")]
async fn password_auth_locks_after_repeated_wrong_passwords(pool: sqlx::PgPool) {
    let app = support::app(pool.clone());
    let (register_status, _session): (StatusCode, Value) = post_json_response(
        app.clone(),
        "/api/v1/auth/password/sessions",
        json!({
            "flow": "register",
            "email": "lockout@example.com",
            "password": "correct-horse-battery",
            "trustDevice": false,
            "deviceLabel": ""
        }),
    )
    .await;
    assert_eq!(register_status, StatusCode::OK);

    for _ in 0..5 {
        let (status, body): (StatusCode, Value) = post_json_response(
            app.clone(),
            "/api/v1/auth/password/sessions",
            json!({
                "flow": "login",
                "email": "lockout@example.com",
                "password": "wrong-password",
                "trustDevice": false,
                "deviceLabel": ""
            }),
        )
        .await;
        assert_eq!(status, StatusCode::UNAUTHORIZED);
        assert_eq!(body["code"], "unauthenticated");
    }

    let (locked_status, locked_body): (StatusCode, Value) = post_json_response(
        app,
        "/api/v1/auth/password/sessions",
        json!({
            "flow": "login",
            "email": "lockout@example.com",
            "password": "correct-horse-battery",
            "trustDevice": false,
            "deviceLabel": ""
        }),
    )
    .await;
    assert_eq!(locked_status, StatusCode::TOO_MANY_REQUESTS);
    assert_eq!(locked_body["code"], "too_many_requests");
}

#[sqlx::test(migrations = "../../migrations")]
async fn password_auth_validates_payload(pool: sqlx::PgPool) {
    let app = support::app(pool.clone());

    for payload in [
        json!({"flow": "register", "email": "not-an-email", "password": "long-enough", "trustDevice": false, "deviceLabel": ""}),
        json!({"flow": "register", "email": "short@example.com", "password": "short", "trustDevice": false, "deviceLabel": ""}),
        json!({"flow": "unknown", "email": "owner@example.com", "password": "long-enough", "trustDevice": false, "deviceLabel": ""}),
    ] {
        let (status, body): (StatusCode, Value) =
            post_json_response(app.clone(), "/api/v1/auth/password/sessions", payload).await;
        assert_eq!(status, StatusCode::BAD_REQUEST);
        assert_eq!(body["code"], "invalid_request");
    }
}

#[sqlx::test(migrations = "../../migrations")]
async fn email_login_start_rejects_disposable_email_domains_without_challenge(pool: sqlx::PgPool) {
    let app = support::app(pool.clone());

    for email in [
        "traveler@10minutemail.com",
        "traveler@inbox.10minutemail.com",
    ] {
        let (status, body): (StatusCode, Value) = post_json_response(
            app.clone(),
            "/api/v1/auth/email/challenges",
            json!({ "email": email }),
        )
        .await;
        assert_eq!(status, StatusCode::BAD_REQUEST);
        assert_eq!(body["code"], "invalid_request");
    }

    let challenge_count: i64 = sqlx::query_scalar("select count(*) from email_login_challenges")
        .fetch_one(&pool)
        .await
        .unwrap();
    assert_eq!(challenge_count, 0);

    let outbox_count: i64 = sqlx::query_scalar("select count(*) from email_login_outbox")
        .fetch_one(&pool)
        .await
        .unwrap();
    assert_eq!(outbox_count, 0);
}

#[sqlx::test(migrations = "../../migrations")]
async fn password_auth_rejects_disposable_email_domains_without_side_effects(pool: sqlx::PgPool) {
    let app = support::app(pool.clone());

    let (register_status, register_body): (StatusCode, Value) = post_json_response(
        app.clone(),
        "/api/v1/auth/password/sessions",
        json!({
            "flow": "register",
            "email": "owner@mailinator.com",
            "password": "correct-horse-battery",
            "trustDevice": false,
            "deviceLabel": ""
        }),
    )
    .await;
    assert_eq!(register_status, StatusCode::BAD_REQUEST);
    assert_eq!(register_body["code"], "invalid_request");

    let user_count: i64 = sqlx::query_scalar("select count(*) from users")
        .fetch_one(&pool)
        .await
        .unwrap();
    assert_eq!(user_count, 0);

    let email_count: i64 = sqlx::query_scalar("select count(*) from user_emails")
        .fetch_one(&pool)
        .await
        .unwrap();
    assert_eq!(email_count, 0);

    let session_count: i64 = sqlx::query_scalar("select count(*) from user_sessions")
        .fetch_one(&pool)
        .await
        .unwrap();
    assert_eq!(session_count, 0);

    let legacy_user_id = Uuid::parse_str("018f4e80-0000-7000-a000-000000000101").unwrap();
    let password_hash = sagittarius_api::app::auth::hash_secret_for_tests("correct-horse-battery");
    sqlx::query(
        "insert into users (id, display_name, avatar_color, password_hash)
         values ($1, 'Disposable Legacy', '#0f766e', $2)",
    )
    .bind(legacy_user_id)
    .bind(password_hash)
    .execute(&pool)
    .await
    .unwrap();
    sqlx::query(
        "insert into user_emails (id, user_id, email, normalized_email, verified_at)
         values (gen_random_uuid(), $1, 'owner@sub.guerrillamail.com', 'owner@sub.guerrillamail.com', now())",
    )
    .bind(legacy_user_id)
    .execute(&pool)
    .await
    .unwrap();

    let (login_status, login_body): (StatusCode, Value) = post_json_response(
        app,
        "/api/v1/auth/password/sessions",
        json!({
            "flow": "login",
            "email": "owner@sub.guerrillamail.com",
            "password": "wrong-password",
            "trustDevice": false,
            "deviceLabel": ""
        }),
    )
    .await;
    assert_eq!(login_status, StatusCode::BAD_REQUEST);
    assert_eq!(login_body["code"], "invalid_request");

    let session_count_after_login: i64 = sqlx::query_scalar("select count(*) from user_sessions")
        .fetch_one(&pool)
        .await
        .unwrap();
    assert_eq!(session_count_after_login, 0);

    let attempt_count: i64 = sqlx::query_scalar("select count(*) from auth_attempt_locks")
        .fetch_one(&pool)
        .await
        .unwrap();
    assert_eq!(attempt_count, 0);
}

#[sqlx::test(migrations = "../../migrations")]
async fn passkey_login_start_rejects_disposable_email_domain_without_challenge(pool: sqlx::PgPool) {
    let app = support::app(pool.clone());

    let legacy_user_id = Uuid::parse_str("018f4e80-0000-7000-a000-000000000102").unwrap();
    sqlx::query(
        "insert into users (id, display_name, avatar_color)
         values ($1, 'Passkey Disposable', '#2563eb')",
    )
    .bind(legacy_user_id)
    .execute(&pool)
    .await
    .unwrap();
    sqlx::query(
        "insert into user_emails (id, user_id, email, normalized_email, verified_at)
         values (gen_random_uuid(), $1, 'traveler@maildrop.cc', 'traveler@maildrop.cc', now())",
    )
    .bind(legacy_user_id)
    .execute(&pool)
    .await
    .unwrap();
    sqlx::query(
        "insert into webauthn_credentials (id, user_id, credential_id, public_key, nickname)
         values (gen_random_uuid(), $1, 'credential-disposable', '{\"alg\":\"ES256\",\"coseKey\":\"placeholder\"}'::jsonb, 'Disposable passkey')",
    )
    .bind(legacy_user_id)
    .execute(&pool)
    .await
    .unwrap();

    let (status, body): (StatusCode, Value) = post_json_response(
        app,
        "/api/v1/auth/passkeys/options",
        json!({ "email": "traveler@maildrop.cc" }),
    )
    .await;

    assert_eq!(status, StatusCode::BAD_REQUEST);
    assert_eq!(body["code"], "invalid_request");

    let challenge_count: i64 = sqlx::query_scalar("select count(*) from webauthn_challenges")
        .fetch_one(&pool)
        .await
        .unwrap();
    assert_eq!(challenge_count, 0);
}

#[sqlx::test(migrations = "../../migrations")]
async fn email_login_start_creates_and_reuses_active_challenge(pool: sqlx::PgPool) {
    let app = support::app(pool.clone());

    let (body, dev_code) = start_email_login_with_code(&pool, app, " Aom@Example.COM ").await;

    assert!(Uuid::parse_str(body["challengeId"].as_str().unwrap()).is_ok());
    assert_eq!(dev_code.len(), 6);
    assert!(dev_code.chars().all(|ch| ch.is_ascii_digit()));
    assert!(body["expiresAt"].as_str().unwrap().contains('T'));

    let challenge: (String, String) = sqlx::query_as(
        "select normalized_email, code_hash
         from email_login_challenges
         where id = $1",
    )
    .bind(Uuid::parse_str(body["challengeId"].as_str().unwrap()).unwrap())
    .fetch_one(&pool)
    .await
    .unwrap();

    assert_eq!(challenge.0, "aom@example.com");
    assert_ne!(challenge.1, dev_code);

    let (second_body, second_code) =
        start_email_login_with_code(&pool, support::app(pool.clone()), "aom@example.com").await;
    assert_eq!(second_body["challengeId"], body["challengeId"]);
    assert_eq!(second_code, dev_code);

    let outbox_count: i64 = sqlx::query_scalar(
        "select count(*)
         from email_login_outbox
         where normalized_email = 'aom@example.com'",
    )
    .fetch_one(&pool)
    .await
    .unwrap();
    assert_eq!(outbox_count, 1);
}

#[sqlx::test(migrations = "../../migrations")]
async fn concurrent_email_login_starts_reuse_one_active_challenge(pool: sqlx::PgPool) {
    let first = post_json(
        support::app(pool.clone()),
        "/api/v1/auth/email/challenges",
        json!({"email": "race@example.com"}),
    );
    let second = post_json(
        support::app(pool.clone()),
        "/api/v1/auth/email/challenges",
        json!({"email": " RACE@example.com "}),
    );

    let (first_response, second_response) = tokio::join!(first, second);
    let (first_status, first_body) = response_json(first_response).await;
    let (second_status, second_body) = response_json(second_response).await;

    assert_eq!(first_status, StatusCode::OK);
    assert_eq!(second_status, StatusCode::OK);
    assert_eq!(first_body["challengeId"], second_body["challengeId"]);
    assert!(first_body.get("devCode").is_none());
    assert!(second_body.get("devCode").is_none());

    let outbox_count: i64 = sqlx::query_scalar(
        "select count(*)
         from email_login_outbox
         where normalized_email = 'race@example.com'",
    )
    .fetch_one(&pool)
    .await
    .unwrap();
    assert_eq!(outbox_count, 1);
}

#[sqlx::test(migrations = "../../migrations")]
async fn malformed_or_missing_json_uses_stable_error_envelope(pool: sqlx::PgPool) {
    let app = support::app(pool);

    let missing_start = post_raw(app.clone(), "/api/v1/auth/email/challenges", Body::empty()).await;
    assert_invalid_request(missing_start).await;

    let malformed_start = post_raw(
        app.clone(),
        "/api/v1/auth/email/challenges",
        Body::from("{"),
    )
    .await;
    assert_invalid_request(malformed_start).await;

    let missing_finish = post_raw(app.clone(), "/api/v1/auth/email/sessions", Body::empty()).await;
    assert_invalid_request(missing_finish).await;

    let malformed_finish = post_raw(app, "/api/v1/auth/email/sessions", Body::from("{")).await;
    assert_invalid_request(malformed_finish).await;
}

#[sqlx::test(migrations = "../../migrations")]
async fn invalid_email_start_returns_invalid_request(pool: sqlx::PgPool) {
    let app = support::app(pool);

    let (status, body): (StatusCode, Value) = post_json_response(
        app,
        "/api/v1/auth/email/challenges",
        json!({"email":"not-an-email"}),
    )
    .await;

    assert_eq!(status, StatusCode::BAD_REQUEST);
    assert_eq!(body["code"], "invalid_request");
}

#[sqlx::test(migrations = "../../migrations")]
async fn oversized_email_start_returns_invalid_request(pool: sqlx::PgPool) {
    let app = support::app(pool);
    let long_email = format!("{}@example.com", "a".repeat(244));

    let (status, body): (StatusCode, Value) = post_json_response(
        app,
        "/api/v1/auth/email/challenges",
        json!({"email": long_email}),
    )
    .await;

    assert_eq!(status, StatusCode::BAD_REQUEST);
    assert_eq!(body["code"], "invalid_request");
}

#[sqlx::test(migrations = "../../migrations")]
async fn expired_challenge_is_rejected_and_not_consumed(pool: sqlx::PgPool) {
    let app = support::app(pool.clone());
    let (start, code) = start_email_login_with_code(&pool, app.clone(), "aom@example.com").await;
    let challenge_id = Uuid::parse_str(start["challengeId"].as_str().unwrap()).unwrap();

    sqlx::query(
        "update email_login_challenges
         set expires_at = now() - interval '1 minute'
         where id = $1",
    )
    .bind(challenge_id)
    .execute(&pool)
    .await
    .unwrap();

    let response = post_json(
        app,
        "/api/v1/auth/email/sessions",
        json!({
            "challengeId": start["challengeId"],
            "code": code,
            "trustDevice": false,
            "deviceLabel": ""
        }),
    )
    .await;

    assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
    let consumed_at: Option<time::OffsetDateTime> =
        sqlx::query_scalar("select consumed_at from email_login_challenges where id = $1")
            .bind(challenge_id)
            .fetch_one(&pool)
            .await
            .unwrap();
    assert!(consumed_at.is_none());
}

#[sqlx::test(migrations = "../../migrations")]
async fn malformed_stored_code_hash_is_rejected_and_not_consumed(pool: sqlx::PgPool) {
    let app = support::app(pool.clone());
    let (start, code) = start_email_login_with_code(&pool, app.clone(), "aom@example.com").await;
    let challenge_id = Uuid::parse_str(start["challengeId"].as_str().unwrap()).unwrap();

    sqlx::query(
        "update email_login_challenges
         set code_hash = 'not-a-password-hash'
         where id = $1",
    )
    .bind(challenge_id)
    .execute(&pool)
    .await
    .unwrap();

    let response = post_json(
        app,
        "/api/v1/auth/email/sessions",
        json!({
            "challengeId": start["challengeId"],
            "code": code,
            "trustDevice": false,
            "deviceLabel": ""
        }),
    )
    .await;

    assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
    let consumed_at: Option<time::OffsetDateTime> =
        sqlx::query_scalar("select consumed_at from email_login_challenges where id = $1")
            .bind(challenge_id)
            .fetch_one(&pool)
            .await
            .unwrap();
    assert!(consumed_at.is_none());
}

#[sqlx::test(migrations = "../../migrations")]
async fn email_login_finish_creates_user_and_temporary_session(pool: sqlx::PgPool) {
    let app = support::app(pool.clone());
    let (start, code) = start_email_login_with_code(&pool, app.clone(), "aom@example.com").await;

    let (finish_status, session): (StatusCode, Value) = post_json_response(
        app,
        "/api/v1/auth/email/sessions",
        json!({
            "challengeId": start["challengeId"],
            "code": code,
            "trustDevice": false,
            "deviceLabel": ""
        }),
    )
    .await;

    assert_eq!(finish_status, StatusCode::OK);
    assert_eq!(session["kind"], "temporary");
    assert_eq!(session["trustedDeviceId"], Value::Null);
    let user_id = Uuid::parse_str(session["userId"].as_str().unwrap()).unwrap();
    let session_token = session["sessionToken"].as_str().unwrap();
    assert!(!session_token.is_empty());

    let user_count: i64 = sqlx::query_scalar("select count(*) from users where id = $1")
        .bind(user_id)
        .fetch_one(&pool)
        .await
        .unwrap();
    assert_eq!(user_count, 1);

    let trusted_device_count: i64 =
        sqlx::query_scalar("select count(*) from trusted_devices where user_id = $1")
            .bind(user_id)
            .fetch_one(&pool)
            .await
            .unwrap();
    assert_eq!(trusted_device_count, 0);

    let stored: (String, Option<Uuid>, String) = sqlx::query_as(
        "select session_token_hash, trusted_device_id, kind
         from user_sessions
         where user_id = $1",
    )
    .bind(user_id)
    .fetch_one(&pool)
    .await
    .unwrap();
    assert_ne!(stored.0, session_token);
    assert!(stored.1.is_none());
    assert_eq!(stored.2, "temporary");
}

#[sqlx::test(migrations = "../../migrations")]
async fn email_login_finish_rejects_legacy_disposable_challenge_without_side_effects(
    pool: sqlx::PgPool,
) {
    let app = support::app(pool.clone());
    let (start, code) = start_email_login_with_code(&pool, app.clone(), "legacy@example.com").await;
    let challenge_id = Uuid::parse_str(start["challengeId"].as_str().unwrap()).unwrap();

    sqlx::query(
        "update email_login_challenges
         set normalized_email = 'traveler@10minutemail.com'
         where id = $1",
    )
    .bind(challenge_id)
    .execute(&pool)
    .await
    .unwrap();

    let (finish_status, body): (StatusCode, Value) = post_json_response(
        app,
        "/api/v1/auth/email/sessions",
        json!({
            "challengeId": start["challengeId"],
            "code": code,
            "trustDevice": false,
            "deviceLabel": ""
        }),
    )
    .await;

    assert_eq!(finish_status, StatusCode::BAD_REQUEST);
    assert_eq!(body["code"], "invalid_request");

    let consumed_at: Option<time::OffsetDateTime> =
        sqlx::query_scalar("select consumed_at from email_login_challenges where id = $1")
            .bind(challenge_id)
            .fetch_one(&pool)
            .await
            .unwrap();
    assert!(consumed_at.is_none());

    let disposable_email_count: i64 = sqlx::query_scalar(
        "select count(*) from user_emails where normalized_email = 'traveler@10minutemail.com'",
    )
    .fetch_one(&pool)
    .await
    .unwrap();
    assert_eq!(disposable_email_count, 0);

    let session_count: i64 = sqlx::query_scalar("select count(*) from user_sessions")
        .fetch_one(&pool)
        .await
        .unwrap();
    assert_eq!(session_count, 0);
}

#[sqlx::test(migrations = "../../migrations")]
async fn preexisting_normalized_email_resumes_existing_user(pool: sqlx::PgPool) {
    let existing_user_id = Uuid::parse_str("018f4e80-0000-7000-a000-000000000001").unwrap();
    sqlx::query(
        "insert into users (id, display_name, avatar_color)
         values ($1, 'Aom Existing', '#0f766e')",
    )
    .bind(existing_user_id)
    .execute(&pool)
    .await
    .unwrap();
    sqlx::query(
        "insert into user_emails (id, user_id, email, normalized_email, verified_at)
         values (gen_random_uuid(), $1, 'aom@example.com', 'aom@example.com', now())",
    )
    .bind(existing_user_id)
    .execute(&pool)
    .await
    .unwrap();

    let app = support::app(pool.clone());
    let (start, code) = start_email_login_with_code(&pool, app.clone(), " Aom@Example.COM ").await;
    let (finish_status, session): (StatusCode, Value) = post_json_response(
        app,
        "/api/v1/auth/email/sessions",
        json!({
            "challengeId": start["challengeId"],
            "code": code,
            "trustDevice": false,
            "deviceLabel": ""
        }),
    )
    .await;

    assert_eq!(finish_status, StatusCode::OK);
    assert_eq!(session["userId"], existing_user_id.to_string());
    let user_count: i64 = sqlx::query_scalar("select count(*) from users")
        .fetch_one(&pool)
        .await
        .unwrap();
    assert_eq!(user_count, 1);
}

#[sqlx::test(migrations = "../../migrations")]
async fn email_login_reuses_existing_user_without_orphan_user_rows(pool: sqlx::PgPool) {
    let app = support::app(pool.clone());

    let first_start = start_email_login_with_code(&pool, app.clone(), "  New@example.com  ").await;
    let (first_status, first_session): (StatusCode, Value) = post_json_response(
        app.clone(),
        "/api/v1/auth/email/sessions",
        json!({
            "challengeId": first_start.0["challengeId"],
            "code": first_start.1,
            "trustDevice": false,
            "deviceLabel": ""
        }),
    )
    .await;
    assert_eq!(first_status, StatusCode::OK);
    let user_id = Uuid::parse_str(first_session["userId"].as_str().unwrap()).unwrap();

    let total_users_after_first: i64 = sqlx::query_scalar("select count(*) from users")
        .fetch_one(&pool)
        .await
        .unwrap();
    assert_eq!(total_users_after_first, 1);
    let email_rows_after_first: i64 =
        sqlx::query_scalar("select count(*) from user_emails where user_id = $1")
            .bind(user_id)
            .fetch_one(&pool)
            .await
            .unwrap();
    assert_eq!(email_rows_after_first, 1);

    let second_start = start_email_login_with_code(&pool, app.clone(), "new@EXAMPLE.com").await;
    let (second_status, second_session): (StatusCode, Value) = post_json_response(
        app,
        "/api/v1/auth/email/sessions",
        json!({
            "challengeId": second_start.0["challengeId"],
            "code": second_start.1,
            "trustDevice": false,
            "deviceLabel": ""
        }),
    )
    .await;
    assert_eq!(second_status, StatusCode::OK);
    let reused_user_id = Uuid::parse_str(second_session["userId"].as_str().unwrap()).unwrap();
    assert_eq!(reused_user_id, user_id);

    let total_users_after_second: i64 = sqlx::query_scalar("select count(*) from users")
        .fetch_one(&pool)
        .await
        .unwrap();
    assert_eq!(total_users_after_second, 1);
    let normalized_user_email_count: i64 = sqlx::query_scalar(
        "select count(*) from user_emails where normalized_email = 'new@example.com'",
    )
    .fetch_one(&pool)
    .await
    .unwrap();
    assert_eq!(normalized_user_email_count, 1);
}

#[sqlx::test(migrations = "../../migrations")]
async fn disabled_user_email_login_is_forbidden_and_creates_no_session(pool: sqlx::PgPool) {
    let disabled_user_id = Uuid::parse_str("018f4e80-0000-7000-a000-000000000001").unwrap();
    sqlx::query(
        "insert into users (id, display_name, avatar_color, disabled_at)
         values ($1, 'Aom Disabled', '#0f766e', now())",
    )
    .bind(disabled_user_id)
    .execute(&pool)
    .await
    .unwrap();
    sqlx::query(
        "insert into user_emails (id, user_id, email, normalized_email, verified_at)
         values (gen_random_uuid(), $1, 'aom@example.com', 'aom@example.com', now())",
    )
    .bind(disabled_user_id)
    .execute(&pool)
    .await
    .unwrap();

    let app = support::app(pool.clone());
    let (start, code) = start_email_login_with_code(&pool, app.clone(), "aom@example.com").await;
    let (finish_status, body): (StatusCode, Value) = post_json_response(
        app,
        "/api/v1/auth/email/sessions",
        json!({
            "challengeId": start["challengeId"],
            "code": code,
            "trustDevice": false,
            "deviceLabel": ""
        }),
    )
    .await;

    assert_eq!(finish_status, StatusCode::FORBIDDEN);
    assert_eq!(body["code"], "forbidden");
    let session_count: i64 =
        sqlx::query_scalar("select count(*) from user_sessions where user_id = $1")
            .bind(disabled_user_id)
            .fetch_one(&pool)
            .await
            .unwrap();
    assert_eq!(session_count, 0);
}

#[sqlx::test(migrations = "../../migrations")]
async fn successful_email_login_verifies_existing_unverified_email(pool: sqlx::PgPool) {
    let existing_user_id = Uuid::parse_str("018f4e80-0000-7000-a000-000000000001").unwrap();
    sqlx::query(
        "insert into users (id, display_name, avatar_color)
         values ($1, 'Aom Unverified', '#0f766e')",
    )
    .bind(existing_user_id)
    .execute(&pool)
    .await
    .unwrap();
    sqlx::query(
        "insert into user_emails (id, user_id, email, normalized_email, verified_at)
         values (gen_random_uuid(), $1, 'aom@example.com', 'aom@example.com', null)",
    )
    .bind(existing_user_id)
    .execute(&pool)
    .await
    .unwrap();

    let app = support::app(pool.clone());
    let (start, code) = start_email_login_with_code(&pool, app.clone(), " Aom@Example.COM ").await;
    let (finish_status, session): (StatusCode, Value) = post_json_response(
        app,
        "/api/v1/auth/email/sessions",
        json!({
            "challengeId": start["challengeId"],
            "code": code,
            "trustDevice": false,
            "deviceLabel": ""
        }),
    )
    .await;

    assert_eq!(finish_status, StatusCode::OK);
    assert_eq!(session["userId"], existing_user_id.to_string());
    let verified_at: Option<time::OffsetDateTime> =
        sqlx::query_scalar("select verified_at from user_emails where user_id = $1")
            .bind(existing_user_id)
            .fetch_one(&pool)
            .await
            .unwrap();
    assert!(verified_at.is_some());
}

#[sqlx::test(migrations = "../../migrations")]
async fn trusted_login_creates_trusted_device_and_session(pool: sqlx::PgPool) {
    let app = support::app(pool.clone());
    let (start, code) = start_email_login_with_code(&pool, app.clone(), "aom@example.com").await;

    let (finish_status, session): (StatusCode, Value) = post_json_response(
        app,
        "/api/v1/auth/email/sessions",
        json!({
            "challengeId": start["challengeId"],
            "code": code,
            "trustDevice": true,
            "deviceLabel": "Aom laptop"
        }),
    )
    .await;

    assert_eq!(finish_status, StatusCode::OK);
    assert_eq!(session["kind"], "trusted");
    let user_id = Uuid::parse_str(session["userId"].as_str().unwrap()).unwrap();

    let device: (Uuid, String) = sqlx::query_as(
        "select id, label
         from trusted_devices
         where user_id = $1",
    )
    .bind(user_id)
    .fetch_one(&pool)
    .await
    .unwrap();
    assert_eq!(device.1, "Aom laptop");
    assert_eq!(session["trustedDeviceId"], device.0.to_string());

    let session_kind: String = sqlx::query_scalar(
        "select kind
         from user_sessions
         where user_id = $1 and trusted_device_id = $2",
    )
    .bind(user_id)
    .bind(device.0)
    .fetch_one(&pool)
    .await
    .unwrap();
    assert_eq!(session_kind, "trusted");
}

#[sqlx::test(migrations = "../../migrations")]
async fn trusted_login_reuses_active_device_with_same_label(pool: sqlx::PgPool) {
    let first_session = login_account(&pool, "devices@example.com", true, "Aom laptop").await;
    let second_session = login_account(&pool, "devices@example.com", true, "Aom laptop").await;
    let user_id = Uuid::parse_str(first_session["userId"].as_str().unwrap()).unwrap();

    assert_eq!(
        second_session["trustedDeviceId"],
        first_session["trustedDeviceId"]
    );
    let trusted_device_count: i64 =
        sqlx::query_scalar("select count(*) from trusted_devices where user_id = $1")
            .bind(user_id)
            .fetch_one(&pool)
            .await
            .unwrap();
    assert_eq!(trusted_device_count, 1);
}

#[sqlx::test(migrations = "../../migrations")]
async fn reused_code_is_rejected_after_success(pool: sqlx::PgPool) {
    let app = support::app(pool.clone());
    let (start, code) = start_email_login_with_code(&pool, app.clone(), "aom@example.com").await;
    let finish = json!({
        "challengeId": start["challengeId"],
        "code": code,
        "trustDevice": false,
        "deviceLabel": ""
    });

    let first = post_json(app.clone(), "/api/v1/auth/email/sessions", finish.clone()).await;
    assert_eq!(first.status(), StatusCode::OK);

    let second = post_json(app, "/api/v1/auth/email/sessions", finish).await;
    assert_eq!(second.status(), StatusCode::UNAUTHORIZED);
}

#[sqlx::test(migrations = "../../migrations")]
async fn wrong_code_is_rejected_and_does_not_consume_challenge(pool: sqlx::PgPool) {
    let app = support::app(pool.clone());
    let (start, _) = start_email_login_with_code(&pool, app.clone(), "aom@example.com").await;

    let challenge_id = Uuid::parse_str(start["challengeId"].as_str().unwrap()).unwrap();
    let wrong = post_json(
        app,
        "/api/v1/auth/email/sessions",
        json!({
            "challengeId": start["challengeId"],
            "code": "000000",
            "trustDevice": false,
            "deviceLabel": ""
        }),
    )
    .await;

    assert_eq!(wrong.status(), StatusCode::UNAUTHORIZED);

    let consumed_at: Option<time::OffsetDateTime> =
        sqlx::query_scalar("select consumed_at from email_login_challenges where id = $1")
            .bind(challenge_id)
            .fetch_one(&pool)
            .await
            .unwrap();
    assert!(consumed_at.is_none());
}

#[sqlx::test(migrations = "../../migrations")]
async fn repeated_wrong_codes_lock_email_login_challenge(pool: sqlx::PgPool) {
    let app = support::app(pool.clone());
    let (start, code) = start_email_login_with_code(&pool, app.clone(), "aom@example.com").await;
    let challenge_id = Uuid::parse_str(start["challengeId"].as_str().unwrap()).unwrap();

    let wrong_codes: Vec<String> = (0..)
        .map(|candidate| format!("{candidate:06}"))
        .filter(|candidate| candidate != &code)
        .take(5)
        .collect();

    for wrong_code in wrong_codes {
        let wrong = post_json(
            app.clone(),
            "/api/v1/auth/email/sessions",
            json!({
                "challengeId": start["challengeId"],
                "code": wrong_code,
                "trustDevice": false,
                "deviceLabel": ""
            }),
        )
        .await;
        assert_eq!(wrong.status(), StatusCode::UNAUTHORIZED);
    }

    let locked: (
        i32,
        Option<time::OffsetDateTime>,
        Option<time::OffsetDateTime>,
    ) = sqlx::query_as(
        "select attempt_count, locked_at, consumed_at
             from email_login_challenges
             where id = $1",
    )
    .bind(challenge_id)
    .fetch_one(&pool)
    .await
    .unwrap();
    assert_eq!(locked.0, 5);
    assert!(locked.1.is_some());
    assert!(locked.2.is_none());

    let correct_after_lock = post_json(
        app.clone(),
        "/api/v1/auth/email/sessions",
        json!({
            "challengeId": start["challengeId"],
            "code": code,
            "trustDevice": false,
            "deviceLabel": ""
        }),
    )
    .await;
    assert_eq!(correct_after_lock.status(), StatusCode::UNAUTHORIZED);

    let fresh_start_while_locked = post_json(
        app.clone(),
        "/api/v1/auth/email/challenges",
        json!({"email": " AOM@example.com "}),
    )
    .await;
    assert_eq!(fresh_start_while_locked.status(), StatusCode::UNAUTHORIZED);

    sqlx::query(
        "update email_login_challenges
         set expires_at = now() - interval '1 minute'
         where id = $1",
    )
    .bind(challenge_id)
    .execute(&pool)
    .await
    .unwrap();

    let (fresh_start_after_expiry, _fresh_code) =
        start_email_login_with_code(&pool, app, "aom@example.com").await;
    assert_ne!(
        fresh_start_after_expiry["challengeId"],
        start["challengeId"]
    );
}

#[sqlx::test(migrations = "../../migrations")]
async fn same_normalized_email_resumes_same_user(pool: sqlx::PgPool) {
    let app = support::app(pool.clone());
    let (first_start, first_code) =
        start_email_login_with_code(&pool, app.clone(), " Aom@Example.COM ").await;
    let (_, first_session): (StatusCode, Value) = post_json_response(
        app.clone(),
        "/api/v1/auth/email/sessions",
        json!({
            "challengeId": first_start["challengeId"],
            "code": first_code,
            "trustDevice": false,
            "deviceLabel": ""
        }),
    )
    .await;

    let (second_start, second_code) =
        start_email_login_with_code(&pool, app.clone(), "aom@example.com").await;
    let (_, second_session): (StatusCode, Value) = post_json_response(
        app,
        "/api/v1/auth/email/sessions",
        json!({
            "challengeId": second_start["challengeId"],
            "code": second_code,
            "trustDevice": false,
            "deviceLabel": ""
        }),
    )
    .await;

    assert_eq!(first_session["userId"], second_session["userId"]);
}

#[sqlx::test(migrations = "../../migrations")]
async fn empty_trusted_device_label_defaults_to_trusted_device(pool: sqlx::PgPool) {
    let app = support::app(pool.clone());
    let (start, code) = start_email_login_with_code(&pool, app.clone(), "aom@example.com").await;
    let (_, session): (StatusCode, Value) = post_json_response(
        app,
        "/api/v1/auth/email/sessions",
        json!({
            "challengeId": start["challengeId"],
            "code": code,
            "trustDevice": true,
            "deviceLabel": " "
        }),
    )
    .await;

    let user_id = Uuid::parse_str(session["userId"].as_str().unwrap()).unwrap();
    let label: String = sqlx::query_scalar("select label from trusted_devices where user_id = $1")
        .bind(user_id)
        .fetch_one(&pool)
        .await
        .unwrap();

    assert_eq!(label, "Trusted device");
}

#[sqlx::test(migrations = "../../migrations")]
async fn oversized_trusted_device_label_returns_invalid_request(pool: sqlx::PgPool) {
    let app = support::app(pool.clone());
    let (start, code) = start_email_login_with_code(&pool, app.clone(), "aom@example.com").await;

    let (status, body): (StatusCode, Value) = post_json_response(
        app,
        "/api/v1/auth/email/sessions",
        json!({
            "challengeId": start["challengeId"],
            "code": code,
            "trustDevice": true,
            "deviceLabel": "x".repeat(121)
        }),
    )
    .await;

    assert_eq!(status, StatusCode::BAD_REQUEST);
    assert_eq!(body["code"], "invalid_request");
}

#[sqlx::test(migrations = "../../migrations")]
async fn active_temporary_session_can_load_account_me(pool: sqlx::PgPool) {
    let session = login_account(&pool, " Aom@Example.COM ", false, "").await;
    let token = session["sessionToken"].as_str().unwrap();

    let (status, body) = response_json(
        get_with_auth(
            support::app(pool),
            "/api/v1/account",
            Some(&format!("Bearer {token}")),
        )
        .await,
    )
    .await;

    assert_eq!(status, StatusCode::OK);
    assert_eq!(body["profile"]["id"], session["userId"]);
    assert_eq!(body["profile"]["displayName"], "aom");
    assert_eq!(body["profile"]["primaryEmail"], "aom@example.com");
    assert_eq!(body["passkeys"], json!([]));
    assert_eq!(body["trustedDevices"], json!([]));
}

#[sqlx::test(migrations = "../../migrations")]
async fn trusted_session_can_load_settings_with_trusted_device(pool: sqlx::PgPool) {
    let session = login_account(&pool, "aom@example.com", true, "Aom laptop").await;
    let token = session["sessionToken"].as_str().unwrap();

    sqlx::query(
        "update trusted_devices
         set user_agent = 'Safari on macOS',
             last_seen_at = now() - interval '5 minutes'
         where user_id = $1",
    )
    .bind(Uuid::parse_str(session["userId"].as_str().unwrap()).unwrap())
    .execute(&pool)
    .await
    .unwrap();

    let (status, body) = response_json(
        get_with_auth(
            support::app(pool),
            "/api/v1/account",
            Some(&format!("Bearer {token}")),
        )
        .await,
    )
    .await;

    assert_eq!(status, StatusCode::OK);
    assert_eq!(body["trustedDevices"].as_array().unwrap().len(), 1);
    assert_eq!(body["trustedDevices"][0]["label"], "Aom laptop");
    assert_eq!(body["trustedDevices"][0]["userAgent"], "Safari on macOS");
    assert!(
        body["trustedDevices"][0]["createdAt"]
            .as_str()
            .unwrap()
            .contains('T')
    );
    assert!(
        body["trustedDevices"][0]["lastSeenAt"]
            .as_str()
            .unwrap()
            .contains('T')
    );
}

#[sqlx::test(migrations = "../../migrations")]
async fn revoked_trusted_device_invalidates_attached_session(pool: sqlx::PgPool) {
    let session = login_account(&pool, "aom@example.com", true, "Aom laptop").await;
    let token = session["sessionToken"].as_str().unwrap();
    let user_id = Uuid::parse_str(session["userId"].as_str().unwrap()).unwrap();

    sqlx::query(
        "update trusted_devices
         set revoked_at = now()
         where user_id = $1",
    )
    .bind(user_id)
    .execute(&pool)
    .await
    .unwrap();

    let (status, body) = response_json(
        get_with_auth(
            support::app(pool),
            "/api/v1/account",
            Some(&format!("Bearer {token}")),
        )
        .await,
    )
    .await;

    assert_eq!(status, StatusCode::UNAUTHORIZED);
    assert_eq!(body["code"], "unauthenticated");
}

#[sqlx::test(migrations = "../../migrations")]
async fn account_can_revoke_trusted_device_from_settings(pool: sqlx::PgPool) {
    let first_session = login_account(&pool, "devices@example.com", true, "Laptop").await;
    let first_token = first_session["sessionToken"].as_str().unwrap().to_string();
    let user_id = Uuid::parse_str(first_session["userId"].as_str().unwrap()).unwrap();
    let second_session = login_account(&pool, "devices@example.com", true, "Tablet").await;
    let second_token = second_session["sessionToken"].as_str().unwrap();
    let second_authorization = format!("Bearer {second_token}");
    let laptop_device_id = sqlx::query_as::<_, (Uuid,)>(
        "select id
         from trusted_devices
         where user_id = $1 and label = 'Laptop'",
    )
    .bind(user_id)
    .fetch_one(&pool)
    .await
    .unwrap()
    .0;

    let (status, body) = response_json(
        delete_with_auth(
            support::app(pool.clone()),
            &format!("/api/v1/account/trusted-devices/{laptop_device_id}"),
            Some(&second_authorization),
        )
        .await,
    )
    .await;

    assert_eq!(status, StatusCode::NO_CONTENT);
    assert_eq!(body, Value::Null);

    let (settings_status, settings_body) = response_json(
        get_with_auth(
            support::app(pool.clone()),
            "/api/v1/account",
            Some(&second_authorization),
        )
        .await,
    )
    .await;
    assert_eq!(settings_status, StatusCode::OK);
    assert_eq!(settings_body["trustedDevices"].as_array().unwrap().len(), 1);
    assert_eq!(settings_body["trustedDevices"][0]["label"], "Tablet");

    let revoked_auth = format!("Bearer {first_token}");
    let (revoked_status, revoked_body) = response_json(
        get_with_auth(support::app(pool), "/api/v1/account", Some(&revoked_auth)).await,
    )
    .await;
    assert_eq!(revoked_status, StatusCode::UNAUTHORIZED);
    assert_eq!(revoked_body["code"], "unauthenticated");
}

#[sqlx::test(migrations = "../../migrations")]
async fn trusted_device_revoke_requires_owner_and_existing_device(pool: sqlx::PgPool) {
    let owner_session =
        login_account(&pool, "device-owner@example.com", true, "Owner laptop").await;
    let other_session =
        login_account(&pool, "device-other@example.com", true, "Other laptop").await;
    let owner_auth = format!("Bearer {}", owner_session["sessionToken"].as_str().unwrap());
    let other_user_id = Uuid::parse_str(other_session["userId"].as_str().unwrap()).unwrap();
    let other_device_id = sqlx::query_as::<_, (Uuid,)>(
        "select id
         from trusted_devices
         where user_id = $1",
    )
    .bind(other_user_id)
    .fetch_one(&pool)
    .await
    .unwrap()
    .0;

    let (foreign_status, foreign_body) = response_json(
        delete_with_auth(
            support::app(pool.clone()),
            &format!("/api/v1/account/trusted-devices/{other_device_id}"),
            Some(&owner_auth),
        )
        .await,
    )
    .await;
    assert_eq!(foreign_status, StatusCode::NOT_FOUND);
    assert_eq!(foreign_body["code"], "not_found");

    let unknown_id = Uuid::now_v7();
    let (unknown_status, unknown_body) = response_json(
        delete_with_auth(
            support::app(pool.clone()),
            &format!("/api/v1/account/trusted-devices/{unknown_id}"),
            Some(&owner_auth),
        )
        .await,
    )
    .await;
    assert_eq!(unknown_status, StatusCode::NOT_FOUND);
    assert_eq!(unknown_body["code"], "not_found");

    let (missing_auth_status, missing_auth_body) = response_json(
        delete_with_auth(
            support::app(pool),
            &format!("/api/v1/account/trusted-devices/{other_device_id}"),
            None,
        )
        .await,
    )
    .await;
    assert_eq!(missing_auth_status, StatusCode::UNAUTHORIZED);
    assert_eq!(missing_auth_body["code"], "unauthenticated");
}

#[sqlx::test(migrations = "../../migrations")]
async fn missing_bearer_token_on_account_me_returns_stable_unauthenticated(pool: sqlx::PgPool) {
    let (status, body) =
        response_json(get_with_auth(support::app(pool), "/api/v1/account", None).await).await;

    assert_eq!(status, StatusCode::UNAUTHORIZED);
    assert_eq!(body["code"], "unauthenticated");
    assert_eq!(body["message"], "unauthenticated");
}

#[sqlx::test(migrations = "../../migrations")]
async fn malformed_bearer_header_on_account_me_returns_stable_unauthenticated(pool: sqlx::PgPool) {
    for authorization in ["Token abc", "Bearer "] {
        let (status, body) = response_json(
            get_with_auth(
                support::app(pool.clone()),
                "/api/v1/account",
                Some(authorization),
            )
            .await,
        )
        .await;

        assert_eq!(status, StatusCode::UNAUTHORIZED);
        assert_eq!(body["code"], "unauthenticated");
        assert_eq!(body["message"], "unauthenticated");
    }
}

#[sqlx::test(migrations = "../../migrations")]
async fn malformed_bearer_on_passkey_registration_start_returns_stable_unauthenticated(
    pool: sqlx::PgPool,
) {
    for authorization in ["Token abc", "Bearer "] {
        let (status, body) = response_json(
            post_with_auth(
                support::app(pool.clone()),
                "/api/v1/account/passkeys/options",
                Some(authorization),
            )
            .await,
        )
        .await;

        assert_eq!(status, StatusCode::UNAUTHORIZED);
        assert_eq!(body["code"], "unauthenticated");
        assert_eq!(body["message"], "unauthenticated");
    }
}

#[sqlx::test(migrations = "../../migrations")]
async fn logout_revokes_current_account_session(pool: sqlx::PgPool) {
    let session = login_account(&pool, "aom@example.com", false, "").await;
    let token = session["sessionToken"].as_str().unwrap();
    let authorization = format!("Bearer {token}");

    let logout = delete_with_auth(
        support::app(pool.clone()),
        "/api/v1/account/session",
        Some(&authorization),
    )
    .await;
    assert_eq!(logout.status(), StatusCode::NO_CONTENT);

    let (status, body) = response_json(
        get_with_auth(support::app(pool), "/api/v1/account", Some(&authorization)).await,
    )
    .await;
    assert_eq!(status, StatusCode::UNAUTHORIZED);
    assert_eq!(body["code"], "unauthenticated");
}

#[sqlx::test(migrations = "../../migrations")]
async fn logout_with_unknown_session_returns_stable_unauthenticated(pool: sqlx::PgPool) {
    let (status, body) = response_json(
        delete_with_auth(
            support::app(pool),
            "/api/v1/account/session",
            Some("Bearer unknown-session-token"),
        )
        .await,
    )
    .await;

    assert_eq!(status, StatusCode::UNAUTHORIZED);
    assert_eq!(body["code"], "unauthenticated");
    assert_eq!(body["message"], "unauthenticated");
}

#[sqlx::test(migrations = "../../migrations")]
async fn expired_user_session_cannot_load_account_me(pool: sqlx::PgPool) {
    let session = login_account(&pool, "aom@example.com", false, "").await;
    let token = session["sessionToken"].as_str().unwrap();

    sqlx::query(
        "update user_sessions
         set expires_at = now() - interval '1 minute'
         where user_id = $1",
    )
    .bind(Uuid::parse_str(session["userId"].as_str().unwrap()).unwrap())
    .execute(&pool)
    .await
    .unwrap();

    let (status, body) = response_json(
        get_with_auth(
            support::app(pool),
            "/api/v1/account",
            Some(&format!("Bearer {token}")),
        )
        .await,
    )
    .await;

    assert_eq!(status, StatusCode::UNAUTHORIZED);
    assert_eq!(body["code"], "unauthenticated");
}

#[sqlx::test(migrations = "../../migrations")]
async fn expired_user_session_cannot_load_account_settings(pool: sqlx::PgPool) {
    let session = login_account(&pool, "settings-expired@example.com", false, "").await;
    let token = session["sessionToken"].as_str().unwrap();

    sqlx::query(
        "update user_sessions
         set expires_at = now() - interval '1 minute'
         where user_id = $1",
    )
    .bind(Uuid::parse_str(session["userId"].as_str().unwrap()).unwrap())
    .execute(&pool)
    .await
    .unwrap();

    let (status, body) = response_json(
        get_with_auth(
            support::app(pool),
            "/api/v1/account",
            Some(&format!("Bearer {token}")),
        )
        .await,
    )
    .await;

    assert_eq!(status, StatusCode::UNAUTHORIZED);
    assert_eq!(body["code"], "unauthenticated");
    assert_eq!(body["message"], "unauthenticated");
}

#[sqlx::test(migrations = "../../migrations")]
async fn revoked_trusted_device_is_hidden_from_account_settings(pool: sqlx::PgPool) {
    let session = login_account(&pool, "aom@example.com", true, "Active device").await;
    let token = session["sessionToken"].as_str().unwrap();
    let user_id = Uuid::parse_str(session["userId"].as_str().unwrap()).unwrap();

    sqlx::query(
        "insert into trusted_devices (id, user_id, label, user_agent, revoked_at)
         values (gen_random_uuid(), $1, 'Revoked device', 'Old Browser', now())",
    )
    .bind(user_id)
    .execute(&pool)
    .await
    .unwrap();

    let (status, body) = response_json(
        get_with_auth(
            support::app(pool),
            "/api/v1/account",
            Some(&format!("Bearer {token}")),
        )
        .await,
    )
    .await;

    assert_eq!(status, StatusCode::OK);
    let devices = body["trustedDevices"].as_array().unwrap();
    assert_eq!(devices.len(), 1);
    assert_eq!(devices[0]["label"], "Active device");
}

#[sqlx::test(migrations = "../../migrations")]
async fn trusted_devices_order_by_latest_seen_or_created_and_omit_revoked(pool: sqlx::PgPool) {
    let session = login_account(&pool, "aom@example.com", true, "Recently seen").await;
    let token = session["sessionToken"].as_str().unwrap();
    let user_id = Uuid::parse_str(session["userId"].as_str().unwrap()).unwrap();

    sqlx::query(
        "update trusted_devices
         set user_agent = 'Safari',
             created_at = '2026-05-30T00:00:00Z',
             last_seen_at = '2026-05-30T02:00:00Z'
         where user_id = $1",
    )
    .bind(user_id)
    .execute(&pool)
    .await
    .unwrap();
    sqlx::query(
        "insert into trusted_devices (id, user_id, label, user_agent, created_at, last_seen_at)
         values
           (
             gen_random_uuid(), $1, 'Fresh created fallback', 'Firefox',
             '2026-05-30T03:00:00Z', null
           ),
           (
             '018f4e80-0000-7000-a000-000000000012', $1, 'Tie high UUID', 'Edge',
             '2026-05-30T00:45:00Z', '2026-05-30T02:30:00Z'
           ),
           (
             '018f4e80-0000-7000-a000-000000000011', $1, 'Tie low UUID', 'Edge',
             '2026-05-30T00:45:00Z', '2026-05-30T02:30:00Z'
           ),
           (
             gen_random_uuid(), $1, 'Older seen', 'Chrome',
             '2026-05-30T00:30:00Z', '2026-05-30T01:00:00Z'
           ),
           (
             gen_random_uuid(), $1, 'Revoked newest', 'Old Browser',
             '2026-05-30T04:00:00Z', '2026-05-30T04:00:00Z'
           )",
    )
    .bind(user_id)
    .execute(&pool)
    .await
    .unwrap();
    sqlx::query(
        "update trusted_devices
         set revoked_at = '2026-05-30T04:30:00Z'
         where user_id = $1 and label = 'Revoked newest'",
    )
    .bind(user_id)
    .execute(&pool)
    .await
    .unwrap();

    let (status, body) = response_json(
        get_with_auth(
            support::app(pool),
            "/api/v1/account",
            Some(&format!("Bearer {token}")),
        )
        .await,
    )
    .await;

    assert_eq!(status, StatusCode::OK);
    let labels: Vec<&str> = body["trustedDevices"]
        .as_array()
        .unwrap()
        .iter()
        .map(|device| device["label"].as_str().unwrap())
        .collect();
    assert_eq!(
        labels,
        vec![
            "Fresh created fallback",
            "Tie low UUID",
            "Tie high UUID",
            "Recently seen",
            "Older seen"
        ]
    );
    let tie_ids: Vec<&str> = body["trustedDevices"]
        .as_array()
        .unwrap()
        .iter()
        .filter(|device| device["label"].as_str().unwrap().starts_with("Tie "))
        .map(|device| device["id"].as_str().unwrap())
        .collect();
    assert_eq!(
        tie_ids,
        vec![
            "018f4e80-0000-7000-a000-000000000011",
            "018f4e80-0000-7000-a000-000000000012"
        ]
    );
}

#[sqlx::test(migrations = "../../migrations")]
async fn passkeys_serialize_last_used_at_in_account_settings(pool: sqlx::PgPool) {
    let session = login_account(&pool, "aom@example.com", false, "").await;
    let token = session["sessionToken"].as_str().unwrap();
    let user_id = Uuid::parse_str(session["userId"].as_str().unwrap()).unwrap();

    sqlx::query(
        "insert into webauthn_credentials (
           id, user_id, credential_id, public_key, nickname, created_at, last_used_at
         )
         values (
           gen_random_uuid(), $1, 'credential-aom', '{}'::jsonb, 'Aom MacBook',
           '2026-05-30T01:00:00Z', '2026-05-30T02:00:00Z'
         )",
    )
    .bind(user_id)
    .execute(&pool)
    .await
    .unwrap();

    let (status, body) = response_json(
        get_with_auth(
            support::app(pool),
            "/api/v1/account",
            Some(&format!("Bearer {token}")),
        )
        .await,
    )
    .await;

    assert_eq!(status, StatusCode::OK);
    assert_eq!(body["passkeys"].as_array().unwrap().len(), 1);
    assert_eq!(body["passkeys"][0]["nickname"], "Aom MacBook");
    assert_eq!(body["passkeys"][0]["lastUsedAt"], "2026-05-30T02:00:00Z");
}

#[sqlx::test(migrations = "../../migrations")]
async fn passkeys_order_by_latest_used_or_created_and_serialize_null_last_used_at(
    pool: sqlx::PgPool,
) {
    let session = login_account(&pool, "aom@example.com", false, "").await;
    let token = session["sessionToken"].as_str().unwrap();
    let user_id = Uuid::parse_str(session["userId"].as_str().unwrap()).unwrap();

    sqlx::query(
        "insert into webauthn_credentials (
           id, user_id, credential_id, public_key, nickname, created_at, last_used_at
         )
         values
           (
             gen_random_uuid(), $1, 'credential-fresh-created', '{}'::jsonb,
             'Fresh created fallback', '2026-05-30T03:00:00Z', null
           ),
           (
             '018f4e80-0000-7000-a000-000000000022', $1, 'credential-tie-high',
             '{}'::jsonb, 'Tie high UUID', '2026-05-30T00:45:00Z',
             '2026-05-30T02:30:00Z'
           ),
           (
             '018f4e80-0000-7000-a000-000000000021', $1, 'credential-tie-low',
             '{}'::jsonb, 'Tie low UUID', '2026-05-30T00:45:00Z',
             '2026-05-30T02:30:00Z'
           ),
           (
             gen_random_uuid(), $1, 'credential-recently-used', '{}'::jsonb,
             'Recently used', '2026-05-30T00:00:00Z', '2026-05-30T02:00:00Z'
           ),
           (
             gen_random_uuid(), $1, 'credential-older-used', '{}'::jsonb,
             'Older used', '2026-05-30T00:30:00Z', '2026-05-30T01:00:00Z'
           )",
    )
    .bind(user_id)
    .execute(&pool)
    .await
    .unwrap();

    let (status, body) = response_json(
        get_with_auth(
            support::app(pool),
            "/api/v1/account",
            Some(&format!("Bearer {token}")),
        )
        .await,
    )
    .await;

    assert_eq!(status, StatusCode::OK);
    let passkeys = body["passkeys"].as_array().unwrap();
    let nicknames: Vec<&str> = passkeys
        .iter()
        .map(|passkey| passkey["nickname"].as_str().unwrap())
        .collect();
    assert_eq!(
        nicknames,
        vec![
            "Fresh created fallback",
            "Tie low UUID",
            "Tie high UUID",
            "Recently used",
            "Older used"
        ]
    );
    assert_eq!(passkeys[0]["lastUsedAt"], Value::Null);
    let tie_ids: Vec<&str> = passkeys
        .iter()
        .filter(|passkey| passkey["nickname"].as_str().unwrap().starts_with("Tie "))
        .map(|passkey| passkey["id"].as_str().unwrap())
        .collect();
    assert_eq!(
        tie_ids,
        vec![
            "018f4e80-0000-7000-a000-000000000021",
            "018f4e80-0000-7000-a000-000000000022"
        ]
    );
}

#[sqlx::test(migrations = "../../migrations")]
async fn authenticated_user_can_start_passkey_registration_challenge(pool: sqlx::PgPool) {
    let session = login_account(&pool, "aom@example.com", false, "").await;
    let token = session["sessionToken"].as_str().unwrap();
    let user_id = Uuid::parse_str(session["userId"].as_str().unwrap()).unwrap();
    let before_request = time::OffsetDateTime::now_utc();

    let (status, body) = response_json(
        post_with_auth(
            support::app(pool.clone()),
            "/api/v1/account/passkeys/options",
            Some(&format!("Bearer {token}")),
        )
        .await,
    )
    .await;

    assert_eq!(status, StatusCode::OK);
    let challenge_id = Uuid::parse_str(body["challengeId"].as_str().unwrap()).unwrap();
    let challenge = body["challenge"].as_str().unwrap();
    assert!(!challenge.is_empty());
    assert!(body["expiresAt"].as_str().unwrap().contains('T'));

    let row: (
        Uuid,
        String,
        String,
        time::OffsetDateTime,
        Option<time::OffsetDateTime>,
    ) = sqlx::query_as(
        "select user_id, challenge, purpose, expires_at, consumed_at
         from webauthn_challenges
         where id = $1",
    )
    .bind(challenge_id)
    .fetch_one(&pool)
    .await
    .unwrap();

    assert_eq!(row.0, user_id);
    assert_eq!(row.1, challenge);
    assert_eq!(row.2, "register");
    assert!(row.3 > before_request + time::Duration::minutes(4));
    assert!(row.3 <= before_request + time::Duration::minutes(6));
    assert!(row.4.is_none());
}

#[sqlx::test(migrations = "../../migrations")]
async fn missing_bearer_on_passkey_registration_start_returns_stable_unauthenticated(
    pool: sqlx::PgPool,
) {
    let (status, body) = response_json(
        post_with_auth(support::app(pool), "/api/v1/account/passkeys/options", None).await,
    )
    .await;

    assert_eq!(status, StatusCode::UNAUTHORIZED);
    assert_eq!(body["code"], "unauthenticated");
    assert_eq!(body["message"], "unauthenticated");
}

#[sqlx::test(migrations = "../../migrations")]
async fn revoked_or_expired_session_cannot_start_passkey_registration_challenge(
    pool: sqlx::PgPool,
) {
    let revoked = login_account(&pool, "revoked@example.com", false, "").await;
    let revoked_token = revoked["sessionToken"].as_str().unwrap();
    let revoked_user_id = Uuid::parse_str(revoked["userId"].as_str().unwrap()).unwrap();
    sqlx::query(
        "update user_sessions
         set revoked_at = now()
         where user_id = $1",
    )
    .bind(revoked_user_id)
    .execute(&pool)
    .await
    .unwrap();

    let (revoked_status, revoked_body) = response_json(
        post_with_auth(
            support::app(pool.clone()),
            "/api/v1/account/passkeys/options",
            Some(&format!("Bearer {revoked_token}")),
        )
        .await,
    )
    .await;
    assert_eq!(revoked_status, StatusCode::UNAUTHORIZED);
    assert_eq!(revoked_body["code"], "unauthenticated");

    let expired = login_account(&pool, "expired@example.com", false, "").await;
    let expired_token = expired["sessionToken"].as_str().unwrap();
    let expired_user_id = Uuid::parse_str(expired["userId"].as_str().unwrap()).unwrap();
    sqlx::query(
        "update user_sessions
         set expires_at = now() - interval '1 minute'
         where user_id = $1",
    )
    .bind(expired_user_id)
    .execute(&pool)
    .await
    .unwrap();

    let (expired_status, expired_body) = response_json(
        post_with_auth(
            support::app(pool.clone()),
            "/api/v1/account/passkeys/options",
            Some(&format!("Bearer {expired_token}")),
        )
        .await,
    )
    .await;
    assert_eq!(expired_status, StatusCode::UNAUTHORIZED);
    assert_eq!(expired_body["code"], "unauthenticated");

    let challenge_count: i64 = sqlx::query_scalar("select count(*) from webauthn_challenges")
        .fetch_one(&pool)
        .await
        .unwrap();
    assert_eq!(challenge_count, 0);
}

#[sqlx::test(migrations = "../../migrations")]
async fn multiple_passkey_registration_starts_create_unique_challenges(pool: sqlx::PgPool) {
    let session = login_account(&pool, "aom@example.com", false, "").await;
    let token = session["sessionToken"].as_str().unwrap();
    let authorization = format!("Bearer {token}");

    let (first_status, first) = response_json(
        post_with_auth(
            support::app(pool.clone()),
            "/api/v1/account/passkeys/options",
            Some(&authorization),
        )
        .await,
    )
    .await;
    let (second_status, second) = response_json(
        post_with_auth(
            support::app(pool.clone()),
            "/api/v1/account/passkeys/options",
            Some(&authorization),
        )
        .await,
    )
    .await;

    assert_eq!(first_status, StatusCode::OK);
    assert_eq!(second_status, StatusCode::OK);
    assert_ne!(first["challengeId"], second["challengeId"]);
    assert_ne!(first["challenge"], second["challenge"]);

    let challenge_count: i64 = sqlx::query_scalar("select count(*) from webauthn_challenges")
        .fetch_one(&pool)
        .await
        .unwrap();
    assert_eq!(challenge_count, 2);
}

#[sqlx::test(migrations = "../../migrations")]
async fn passkey_registration_finish_stores_credential_and_login_verifies_signature(
    pool: sqlx::PgPool,
) {
    let session = login_account(&pool, "passkey@example.com", false, "").await;
    let token = session["sessionToken"].as_str().unwrap();
    let authorization = format!("Bearer {token}");
    let signing_key = SigningKey::from_slice(&[7; 32]).unwrap();
    let credential_id_bytes = b"credential-passkey-aom";
    let (start_status, start) = response_json(
        post_with_auth(
            support::app(pool.clone()),
            "/api/v1/account/passkeys/options",
            Some(&authorization),
        )
        .await,
    )
    .await;
    assert_eq!(start_status, StatusCode::OK);
    let challenge_id = start["challengeId"].as_str().unwrap();
    let challenge = start["challenge"].as_str().unwrap();
    let registration = registration_finish_payload(
        challenge_id,
        challenge,
        &signing_key,
        credential_id_bytes,
        "Aom MacBook",
    );

    let (finish_status, finish_body) = response_json(
        post_json_with_auth(
            support::app(pool.clone()),
            "/api/v1/account/passkeys",
            Some(&authorization),
            registration,
        )
        .await,
    )
    .await;

    assert_eq!(finish_status, StatusCode::OK);
    assert_eq!(finish_body["nickname"], "Aom MacBook");
    assert_eq!(finish_body["lastUsedAt"], Value::Null);

    let (settings_status, settings_body) = response_json(
        get_with_auth(
            support::app(pool.clone()),
            "/api/v1/account",
            Some(&authorization),
        )
        .await,
    )
    .await;
    assert_eq!(settings_status, StatusCode::OK);
    assert_eq!(settings_body["passkeys"].as_array().unwrap().len(), 1);
    assert_eq!(settings_body["passkeys"][0]["nickname"], "Aom MacBook");

    let (login_start_status, login_start) = response_json(
        post_json(
            support::app(pool.clone()),
            "/api/v1/auth/passkeys/options",
            json!({"email": "passkey@example.com"}),
        )
        .await,
    )
    .await;
    assert_eq!(login_start_status, StatusCode::OK);
    assert_eq!(
        login_start["allowCredentials"][0]["credentialId"],
        URL_SAFE_NO_PAD.encode(credential_id_bytes)
    );

    let login_finish = passkey_login_finish_payload(
        login_start["challengeId"].as_str().unwrap(),
        login_start["challenge"].as_str().unwrap(),
        &signing_key,
        credential_id_bytes,
        1,
        true,
        "Passkey laptop",
    );
    let (login_finish_status, login_session) = response_json(
        post_json(
            support::app(pool.clone()),
            "/api/v1/auth/passkeys/sessions",
            login_finish,
        )
        .await,
    )
    .await;
    assert_eq!(login_finish_status, StatusCode::OK);
    assert_eq!(login_session["kind"], "trusted");
    assert_eq!(login_session["userId"], session["userId"]);

    let row: (i64, Option<time::OffsetDateTime>) = sqlx::query_as(
        "select sign_count, last_used_at
         from webauthn_credentials
         where credential_id = $1",
    )
    .bind(URL_SAFE_NO_PAD.encode(credential_id_bytes))
    .fetch_one(&pool)
    .await
    .unwrap();
    assert_eq!(row.0, 1);
    assert!(row.1.is_some());

    let (_, replay_start) = response_json(
        post_json(
            support::app(pool.clone()),
            "/api/v1/auth/passkeys/options",
            json!({"email": "passkey@example.com"}),
        )
        .await,
    )
    .await;
    let replay_finish = passkey_login_finish_payload(
        replay_start["challengeId"].as_str().unwrap(),
        replay_start["challenge"].as_str().unwrap(),
        &signing_key,
        credential_id_bytes,
        1,
        false,
        "",
    );
    let (replay_status, replay_body) = response_json(
        post_json(
            support::app(pool.clone()),
            "/api/v1/auth/passkeys/sessions",
            replay_finish,
        )
        .await,
    )
    .await;
    assert_eq!(replay_status, StatusCode::UNAUTHORIZED);
    assert_eq!(replay_body["code"], "unauthenticated");

    let (_, duplicate_start) = response_json(
        post_with_auth(
            support::app(pool.clone()),
            "/api/v1/account/passkeys/options",
            Some(&authorization),
        )
        .await,
    )
    .await;
    let duplicate_registration = registration_finish_payload(
        duplicate_start["challengeId"].as_str().unwrap(),
        duplicate_start["challenge"].as_str().unwrap(),
        &signing_key,
        credential_id_bytes,
        "Aom Duplicate",
    );
    let (duplicate_status, duplicate_body) = response_json(
        post_json_with_auth(
            support::app(pool.clone()),
            "/api/v1/account/passkeys",
            Some(&authorization),
            duplicate_registration,
        )
        .await,
    )
    .await;
    assert_eq!(duplicate_status, StatusCode::BAD_REQUEST);
    assert_eq!(duplicate_body["code"], "invalid_request");
}

#[sqlx::test(migrations = "../../migrations")]
async fn passkey_registration_and_login_reject_invalid_proofs(pool: sqlx::PgPool) {
    let session = login_account(&pool, "passkey-invalid@example.com", false, "").await;
    let authorization = format!("Bearer {}", session["sessionToken"].as_str().unwrap());
    let signing_key = SigningKey::from_slice(&[8; 32]).unwrap();
    let credential_id_bytes = b"credential-invalid-aom";
    let (_, start) = response_json(
        post_with_auth(
            support::app(pool.clone()),
            "/api/v1/account/passkeys/options",
            Some(&authorization),
        )
        .await,
    )
    .await;

    let malformed_finish = response_json(
        post_json_with_auth(
            support::app(pool.clone()),
            "/api/v1/account/passkeys",
            Some(&authorization),
            json!({"challengeId": start["challengeId"]}),
        )
        .await,
    )
    .await;
    assert_eq!(malformed_finish.0, StatusCode::BAD_REQUEST);
    assert_eq!(malformed_finish.1["code"], "invalid_request");

    let missing_origin_payload = registration_finish_payload(
        start["challengeId"].as_str().unwrap(),
        start["challenge"].as_str().unwrap(),
        &signing_key,
        credential_id_bytes,
        "Aom MacBook",
    )
    .with_client_data_json(encoded_client_data_json_without_origin(
        "webauthn.create",
        start["challenge"].as_str().unwrap(),
    ));
    let (missing_origin_status, missing_origin_body) = response_json(
        post_json_with_auth(
            support::app(pool.clone()),
            "/api/v1/account/passkeys",
            Some(&authorization),
            missing_origin_payload,
        )
        .await,
    )
    .await;
    assert_eq!(missing_origin_status, StatusCode::BAD_REQUEST);
    assert_eq!(missing_origin_body["code"], "invalid_request");

    let wrong_origin_payload = registration_finish_payload(
        start["challengeId"].as_str().unwrap(),
        start["challenge"].as_str().unwrap(),
        &signing_key,
        credential_id_bytes,
        "Aom MacBook",
    )
    .with_client_data_json(encoded_client_data_json_with_origin(
        "webauthn.create",
        start["challenge"].as_str().unwrap(),
        "https://evil.example.test",
    ));
    let (wrong_origin_status, wrong_origin_body) = response_json(
        post_json_with_auth(
            support::app(pool.clone()),
            "/api/v1/account/passkeys",
            Some(&authorization),
            wrong_origin_payload,
        )
        .await,
    )
    .await;
    assert_eq!(wrong_origin_status, StatusCode::UNAUTHORIZED);
    assert_eq!(wrong_origin_body["code"], "unauthenticated");

    let missing_attested_flag_payload = registration_finish_payload(
        start["challengeId"].as_str().unwrap(),
        start["challenge"].as_str().unwrap(),
        &signing_key,
        credential_id_bytes,
        "Aom MacBook",
    )
    .with_attestation_object(attestation_object_with_auth_data(login_authenticator_data(
        0,
    )));
    let (missing_attested_flag_status, missing_attested_flag_body) = response_json(
        post_json_with_auth(
            support::app(pool.clone()),
            "/api/v1/account/passkeys",
            Some(&authorization),
            missing_attested_flag_payload,
        )
        .await,
    )
    .await;
    assert_eq!(missing_attested_flag_status, StatusCode::UNAUTHORIZED);
    assert_eq!(missing_attested_flag_body["code"], "unauthenticated");

    let missing_user_verified_payload = registration_finish_payload(
        start["challengeId"].as_str().unwrap(),
        start["challenge"].as_str().unwrap(),
        &signing_key,
        credential_id_bytes,
        "Aom MacBook",
    )
    .with_attestation_object(attestation_object_with_auth_data({
        let mut auth_data = registration_authenticator_data(&signing_key, credential_id_bytes);
        auth_data[32] = 0x41;
        auth_data
    }));
    let (missing_user_verified_status, missing_user_verified_body) = response_json(
        post_json_with_auth(
            support::app(pool.clone()),
            "/api/v1/account/passkeys",
            Some(&authorization),
            missing_user_verified_payload,
        )
        .await,
    )
    .await;
    assert_eq!(missing_user_verified_status, StatusCode::UNAUTHORIZED);
    assert_eq!(missing_user_verified_body["code"], "unauthenticated");

    let non_map_attestation_payload = registration_finish_payload(
        start["challengeId"].as_str().unwrap(),
        start["challenge"].as_str().unwrap(),
        &signing_key,
        credential_id_bytes,
        "Aom MacBook",
    )
    .with_attestation_object(serde_cbor::to_vec(&serde_cbor::Value::Bool(false)).unwrap());
    let (non_map_attestation_status, non_map_attestation_body) = response_json(
        post_json_with_auth(
            support::app(pool.clone()),
            "/api/v1/account/passkeys",
            Some(&authorization),
            non_map_attestation_payload,
        )
        .await,
    )
    .await;
    assert_eq!(non_map_attestation_status, StatusCode::BAD_REQUEST);
    assert_eq!(non_map_attestation_body["code"], "invalid_request");

    let auth_data_wrong_type_payload = registration_finish_payload(
        start["challengeId"].as_str().unwrap(),
        start["challenge"].as_str().unwrap(),
        &signing_key,
        credential_id_bytes,
        "Aom MacBook",
    )
    .with_attestation_object(attestation_object_with_auth_data_value(
        serde_cbor::Value::Integer(1),
    ));
    let (auth_data_wrong_type_status, auth_data_wrong_type_body) = response_json(
        post_json_with_auth(
            support::app(pool.clone()),
            "/api/v1/account/passkeys",
            Some(&authorization),
            auth_data_wrong_type_payload,
        )
        .await,
    )
    .await;
    assert_eq!(auth_data_wrong_type_status, StatusCode::BAD_REQUEST);
    assert_eq!(auth_data_wrong_type_body["code"], "invalid_request");

    let short_auth_data_payload = registration_finish_payload(
        start["challengeId"].as_str().unwrap(),
        start["challenge"].as_str().unwrap(),
        &signing_key,
        credential_id_bytes,
        "Aom MacBook",
    )
    .with_attestation_object(attestation_object_with_auth_data(vec![0; 36]));
    let (short_auth_data_status, short_auth_data_body) = response_json(
        post_json_with_auth(
            support::app(pool.clone()),
            "/api/v1/account/passkeys",
            Some(&authorization),
            short_auth_data_payload,
        )
        .await,
    )
    .await;
    assert_eq!(short_auth_data_status, StatusCode::BAD_REQUEST);
    assert_eq!(short_auth_data_body["code"], "invalid_request");

    let short_registration_payload = registration_finish_payload(
        start["challengeId"].as_str().unwrap(),
        start["challenge"].as_str().unwrap(),
        &signing_key,
        credential_id_bytes,
        "Aom MacBook",
    )
    .with_attestation_object(attestation_object_with_auth_data({
        let mut auth_data = login_authenticator_data(0);
        auth_data[32] = 0x45;
        auth_data
    }));
    let (short_registration_status, short_registration_body) = response_json(
        post_json_with_auth(
            support::app(pool.clone()),
            "/api/v1/account/passkeys",
            Some(&authorization),
            short_registration_payload,
        )
        .await,
    )
    .await;
    assert_eq!(short_registration_status, StatusCode::BAD_REQUEST);
    assert_eq!(short_registration_body["code"], "invalid_request");

    let missing_public_key_payload = registration_finish_payload(
        start["challengeId"].as_str().unwrap(),
        start["challenge"].as_str().unwrap(),
        &signing_key,
        credential_id_bytes,
        "Aom MacBook",
    )
    .with_attestation_object(attestation_object_with_auth_data({
        let mut auth_data = login_authenticator_data(0);
        auth_data[32] = 0x45;
        auth_data.extend_from_slice(&[0; 16]);
        auth_data.extend_from_slice(&(credential_id_bytes.len() as u16).to_be_bytes());
        auth_data.extend_from_slice(credential_id_bytes);
        auth_data
    }));
    let (missing_public_key_status, missing_public_key_body) = response_json(
        post_json_with_auth(
            support::app(pool.clone()),
            "/api/v1/account/passkeys",
            Some(&authorization),
            missing_public_key_payload,
        )
        .await,
    )
    .await;
    assert_eq!(missing_public_key_status, StatusCode::BAD_REQUEST);
    assert_eq!(missing_public_key_body["code"], "invalid_request");

    let mismatched_credential_payload = registration_finish_payload(
        start["challengeId"].as_str().unwrap(),
        start["challenge"].as_str().unwrap(),
        &signing_key,
        credential_id_bytes,
        "Aom MacBook",
    )
    .with_attestation_object(attestation_object_with_auth_data(
        registration_authenticator_data(&signing_key, b"different-credential"),
    ));
    let (mismatched_credential_status, mismatched_credential_body) = response_json(
        post_json_with_auth(
            support::app(pool.clone()),
            "/api/v1/account/passkeys",
            Some(&authorization),
            mismatched_credential_payload,
        )
        .await,
    )
    .await;
    assert_eq!(mismatched_credential_status, StatusCode::UNAUTHORIZED);
    assert_eq!(mismatched_credential_body["code"], "unauthenticated");

    let non_map_cose_payload = registration_finish_payload(
        start["challengeId"].as_str().unwrap(),
        start["challenge"].as_str().unwrap(),
        &signing_key,
        credential_id_bytes,
        "Aom MacBook",
    )
    .with_attestation_object(attestation_object_with_auth_data(
        registration_authenticator_data_with_cose(
            credential_id_bytes,
            &serde_cbor::to_vec(&serde_cbor::Value::Bool(false)).unwrap(),
        ),
    ));
    let (non_map_cose_status, non_map_cose_body) = response_json(
        post_json_with_auth(
            support::app(pool.clone()),
            "/api/v1/account/passkeys",
            Some(&authorization),
            non_map_cose_payload,
        )
        .await,
    )
    .await;
    assert_eq!(non_map_cose_status, StatusCode::BAD_REQUEST);
    assert_eq!(non_map_cose_body["code"], "invalid_request");

    let wrong_cose_value_type_payload = registration_finish_payload(
        start["challengeId"].as_str().unwrap(),
        start["challenge"].as_str().unwrap(),
        &signing_key,
        credential_id_bytes,
        "Aom MacBook",
    )
    .with_attestation_object(attestation_object_with_auth_data(
        registration_authenticator_data_with_cose(
            credential_id_bytes,
            &cose_key_with_wrong_value_types(&signing_key),
        ),
    ));
    let (wrong_cose_value_type_status, wrong_cose_value_type_body) = response_json(
        post_json_with_auth(
            support::app(pool.clone()),
            "/api/v1/account/passkeys",
            Some(&authorization),
            wrong_cose_value_type_payload,
        )
        .await,
    )
    .await;
    assert_eq!(wrong_cose_value_type_status, StatusCode::BAD_REQUEST);
    assert_eq!(wrong_cose_value_type_body["code"], "invalid_request");

    let wrong_cose_metadata_payload = registration_finish_payload(
        start["challengeId"].as_str().unwrap(),
        start["challenge"].as_str().unwrap(),
        &signing_key,
        credential_id_bytes,
        "Aom MacBook",
    )
    .with_attestation_object(attestation_object_with_auth_data(
        registration_authenticator_data_with_cose(
            credential_id_bytes,
            &cose_key_with_metadata(&signing_key, 2, -8, 1),
        ),
    ));
    let (wrong_cose_status, wrong_cose_body) = response_json(
        post_json_with_auth(
            support::app(pool.clone()),
            "/api/v1/account/passkeys",
            Some(&authorization),
            wrong_cose_metadata_payload,
        )
        .await,
    )
    .await;
    assert_eq!(wrong_cose_status, StatusCode::BAD_REQUEST);
    assert_eq!(wrong_cose_body["code"], "invalid_request");

    let wrong_challenge_payload = registration_finish_payload(
        start["challengeId"].as_str().unwrap(),
        "wrong-challenge",
        &signing_key,
        credential_id_bytes,
        "Aom MacBook",
    );
    let (wrong_status, wrong_body) = response_json(
        post_json_with_auth(
            support::app(pool.clone()),
            "/api/v1/account/passkeys",
            Some(&authorization),
            wrong_challenge_payload,
        )
        .await,
    )
    .await;
    assert_eq!(wrong_status, StatusCode::UNAUTHORIZED);
    assert_eq!(wrong_body["code"], "unauthenticated");

    let valid_payload = registration_finish_payload(
        start["challengeId"].as_str().unwrap(),
        start["challenge"].as_str().unwrap(),
        &signing_key,
        credential_id_bytes,
        "Aom MacBook",
    );
    let (valid_status, _) = response_json(
        post_json_with_auth(
            support::app(pool.clone()),
            "/api/v1/account/passkeys",
            Some(&authorization),
            valid_payload,
        )
        .await,
    )
    .await;
    assert_eq!(valid_status, StatusCode::OK);

    let missing_email = response_json(
        post_json(
            support::app(pool.clone()),
            "/api/v1/auth/passkeys/options",
            json!({"email": "missing@example.com"}),
        )
        .await,
    )
    .await;
    assert_eq!(missing_email.0, StatusCode::UNAUTHORIZED);
    assert_eq!(missing_email.1["code"], "unauthenticated");

    let (_, login_start) = response_json(
        post_json(
            support::app(pool.clone()),
            "/api/v1/auth/passkeys/options",
            json!({"email": "passkey-invalid@example.com"}),
        )
        .await,
    )
    .await;
    let short_login_auth_data_payload = passkey_login_finish_payload_with_authenticator_data(
        login_start["challengeId"].as_str().unwrap(),
        login_start["challenge"].as_str().unwrap(),
        &signing_key,
        credential_id_bytes,
        vec![0; 36],
        false,
        "",
    );
    let (short_login_auth_data_status, short_login_auth_data_body) = response_json(
        post_json(
            support::app(pool.clone()),
            "/api/v1/auth/passkeys/sessions",
            short_login_auth_data_payload,
        )
        .await,
    )
    .await;
    assert_eq!(short_login_auth_data_status, StatusCode::BAD_REQUEST);
    assert_eq!(short_login_auth_data_body["code"], "invalid_request");

    let wrong_rp_hash_payload = passkey_login_finish_payload_with_authenticator_data(
        login_start["challengeId"].as_str().unwrap(),
        login_start["challenge"].as_str().unwrap(),
        &signing_key,
        credential_id_bytes,
        login_authenticator_data_with_rp_id(1, "127.0.0.1"),
        false,
        "",
    );
    let (wrong_rp_hash_status, wrong_rp_hash_body) = response_json(
        post_json(
            support::app(pool.clone()),
            "/api/v1/auth/passkeys/sessions",
            wrong_rp_hash_payload,
        )
        .await,
    )
    .await;
    assert_eq!(wrong_rp_hash_status, StatusCode::UNAUTHORIZED);
    assert_eq!(wrong_rp_hash_body["code"], "unauthenticated");

    let missing_user_present_payload = passkey_login_finish_payload_with_authenticator_data(
        login_start["challengeId"].as_str().unwrap(),
        login_start["challenge"].as_str().unwrap(),
        &signing_key,
        credential_id_bytes,
        login_authenticator_data_with_flags(1, 0),
        false,
        "",
    );
    let (missing_user_present_status, missing_user_present_body) = response_json(
        post_json(
            support::app(pool.clone()),
            "/api/v1/auth/passkeys/sessions",
            missing_user_present_payload,
        )
        .await,
    )
    .await;
    assert_eq!(missing_user_present_status, StatusCode::UNAUTHORIZED);
    assert_eq!(missing_user_present_body["code"], "unauthenticated");

    let missing_user_verified_payload = passkey_login_finish_payload_with_authenticator_data(
        login_start["challengeId"].as_str().unwrap(),
        login_start["challenge"].as_str().unwrap(),
        &signing_key,
        credential_id_bytes,
        login_authenticator_data_with_flags(1, 0x01),
        false,
        "",
    );
    let (missing_user_verified_status, missing_user_verified_body) = response_json(
        post_json(
            support::app(pool.clone()),
            "/api/v1/auth/passkeys/sessions",
            missing_user_verified_payload,
        )
        .await,
    )
    .await;
    assert_eq!(missing_user_verified_status, StatusCode::UNAUTHORIZED);
    assert_eq!(missing_user_verified_body["code"], "unauthenticated");

    let wrong_signing_key = SigningKey::from_slice(&[9; 32]).unwrap();
    let wrong_signature_payload = passkey_login_finish_payload(
        login_start["challengeId"].as_str().unwrap(),
        login_start["challenge"].as_str().unwrap(),
        &wrong_signing_key,
        credential_id_bytes,
        1,
        false,
        "",
    );
    let (wrong_signature_status, wrong_signature_body) = response_json(
        post_json(
            support::app(pool),
            "/api/v1/auth/passkeys/sessions",
            wrong_signature_payload,
        )
        .await,
    )
    .await;
    assert_eq!(wrong_signature_status, StatusCode::UNAUTHORIZED);
    assert_eq!(wrong_signature_body["code"], "unauthenticated");
}

#[sqlx::test(migrations = "../../migrations")]
async fn passkey_login_start_for_account_without_passkeys_is_unauthenticated(pool: sqlx::PgPool) {
    let _session = login_account(&pool, "no-passkeys@example.com", false, "").await;

    let response = response_json(
        post_json(
            support::app(pool),
            "/api/v1/auth/passkeys/options",
            json!({"email": "no-passkeys@example.com"}),
        )
        .await,
    )
    .await;

    assert_eq!(response.0, StatusCode::UNAUTHORIZED);
    assert_eq!(response.1["code"], "unauthenticated");
}

#[sqlx::test(migrations = "../../migrations")]
async fn passkey_login_finish_rejects_user_disabled_after_challenge_start(pool: sqlx::PgPool) {
    let session = login_account(&pool, "passkey-disabled@example.com", false, "").await;
    let authorization = format!("Bearer {}", session["sessionToken"].as_str().unwrap());
    let signing_key = SigningKey::from_slice(&[10; 32]).unwrap();
    let credential_id_bytes = b"credential-disabled-aom";
    let (_, start) = response_json(
        post_with_auth(
            support::app(pool.clone()),
            "/api/v1/account/passkeys/options",
            Some(&authorization),
        )
        .await,
    )
    .await;
    let valid_payload = registration_finish_payload(
        start["challengeId"].as_str().unwrap(),
        start["challenge"].as_str().unwrap(),
        &signing_key,
        credential_id_bytes,
        "Aom MacBook",
    );
    let (valid_status, _) = response_json(
        post_json_with_auth(
            support::app(pool.clone()),
            "/api/v1/account/passkeys",
            Some(&authorization),
            valid_payload,
        )
        .await,
    )
    .await;
    assert_eq!(valid_status, StatusCode::OK);

    let (_, login_start) = response_json(
        post_json(
            support::app(pool.clone()),
            "/api/v1/auth/passkeys/options",
            json!({"email": "passkey-disabled@example.com"}),
        )
        .await,
    )
    .await;
    sqlx::query("update users set disabled_at = now() where id = $1")
        .bind(Uuid::parse_str(session["userId"].as_str().unwrap()).unwrap())
        .execute(&pool)
        .await
        .unwrap();

    let login_finish = passkey_login_finish_payload(
        login_start["challengeId"].as_str().unwrap(),
        login_start["challenge"].as_str().unwrap(),
        &signing_key,
        credential_id_bytes,
        1,
        false,
        "",
    );
    let (finish_status, finish_body) = response_json(
        post_json(
            support::app(pool),
            "/api/v1/auth/passkeys/sessions",
            login_finish,
        )
        .await,
    )
    .await;
    assert_eq!(finish_status, StatusCode::UNAUTHORIZED);
    assert_eq!(finish_body["code"], "unauthenticated");
}

#[sqlx::test(migrations = "../../migrations")]
async fn passkey_login_finish_rejects_legacy_disposable_email_after_challenge_start(
    pool: sqlx::PgPool,
) {
    let session = login_account(&pool, "passkey-legacy-disposable@example.com", false, "").await;
    let user_id = Uuid::parse_str(session["userId"].as_str().unwrap()).unwrap();
    let signing_key = SigningKey::from_slice(&[11; 32]).unwrap();
    let credential_id_bytes = b"credential-legacy-disposable";

    sqlx::query(
        "insert into webauthn_credentials (id, user_id, credential_id, public_key, nickname)
         values (gen_random_uuid(), $1, $2, $3, 'Aom MacBook')",
    )
    .bind(user_id)
    .bind(URL_SAFE_NO_PAD.encode(credential_id_bytes))
    .bind(serde_json::json!({
        "alg": "ES256",
        "coseKey": URL_SAFE_NO_PAD.encode(cose_key(&signing_key)),
    }))
    .execute(&pool)
    .await
    .unwrap();

    let (_, login_start) = response_json(
        post_json(
            support::app(pool.clone()),
            "/api/v1/auth/passkeys/options",
            json!({"email": "passkey-legacy-disposable@example.com"}),
        )
        .await,
    )
    .await;
    let challenge_id = Uuid::parse_str(login_start["challengeId"].as_str().unwrap()).unwrap();
    let session_count_before: i64 = sqlx::query_scalar("select count(*) from user_sessions")
        .fetch_one(&pool)
        .await
        .unwrap();

    sqlx::query(
        "update user_emails
         set email = 'traveler@maildrop.cc',
             normalized_email = 'traveler@maildrop.cc'
         where user_id = $1",
    )
    .bind(user_id)
    .execute(&pool)
    .await
    .unwrap();

    let (origin, rp_id) = passkey_origin_for_current_env();
    let login_finish = passkey_login_finish_payload_with_origin_and_rp_id(
        login_start["challengeId"].as_str().unwrap(),
        login_start["challenge"].as_str().unwrap(),
        &signing_key,
        credential_id_bytes,
        1,
        false,
        "",
        &origin,
        &rp_id,
    );
    let (finish_status, finish_body) = response_json(
        post_json(
            support::app(pool.clone()),
            "/api/v1/auth/passkeys/sessions",
            login_finish,
        )
        .await,
    )
    .await;
    assert_eq!(finish_status, StatusCode::BAD_REQUEST);
    assert_eq!(finish_body["code"], "invalid_request");

    let consumed_at: Option<time::OffsetDateTime> =
        sqlx::query_scalar("select consumed_at from webauthn_challenges where id = $1")
            .bind(challenge_id)
            .fetch_one(&pool)
            .await
            .unwrap();
    assert!(consumed_at.is_none());

    let session_count_after: i64 = sqlx::query_scalar("select count(*) from user_sessions")
        .fetch_one(&pool)
        .await
        .unwrap();
    assert_eq!(session_count_after, session_count_before);

    let credential: (i64, Option<time::OffsetDateTime>) = sqlx::query_as(
        "select sign_count, last_used_at
         from webauthn_credentials
         where credential_id = $1",
    )
    .bind(URL_SAFE_NO_PAD.encode(credential_id_bytes))
    .fetch_one(&pool)
    .await
    .unwrap();
    assert_eq!(credential.0, 0);
    assert!(credential.1.is_none());
}

fn registration_finish_payload(
    challenge_id: &str,
    challenge: &str,
    signing_key: &SigningKey,
    credential_id: &[u8],
    nickname: &str,
) -> Value {
    let credential_id_encoded = URL_SAFE_NO_PAD.encode(credential_id);
    json!({
        "challengeId": challenge_id,
        "credentialId": credential_id_encoded,
        "clientDataJson": encoded_client_data_json("webauthn.create", challenge),
        "attestationObject": URL_SAFE_NO_PAD.encode(attestation_object(signing_key, credential_id)),
        "nickname": nickname
    })
}

fn passkey_login_finish_payload(
    challenge_id: &str,
    challenge: &str,
    signing_key: &SigningKey,
    credential_id: &[u8],
    sign_count: u32,
    trust_device: bool,
    device_label: &str,
) -> Value {
    passkey_login_finish_payload_with_authenticator_data(
        challenge_id,
        challenge,
        signing_key,
        credential_id,
        login_authenticator_data(sign_count),
        trust_device,
        device_label,
    )
}

fn passkey_login_finish_payload_with_authenticator_data(
    challenge_id: &str,
    challenge: &str,
    signing_key: &SigningKey,
    credential_id: &[u8],
    authenticator_data: Vec<u8>,
    trust_device: bool,
    device_label: &str,
) -> Value {
    passkey_login_finish_payload_with_authenticator_data_and_origin(
        challenge_id,
        challenge,
        signing_key,
        credential_id,
        authenticator_data,
        trust_device,
        device_label,
        PASSKEY_ORIGIN,
    )
}

fn passkey_origin_for_current_env() -> (String, String) {
    let host = std::env::var("PASSKEY_ALLOWED_ORIGINS")
        .ok()
        .and_then(|raw| raw.split(',').find_map(passkey_host_from_allowed_entry))
        .unwrap_or_else(|| PASSKEY_RP_ID.to_string());
    let scheme = if host == "localhost" || host == "0.0.0.0" || host.starts_with("127.") {
        "http"
    } else {
        "https"
    };

    (format!("{scheme}://{host}"), host)
}

fn passkey_host_from_allowed_entry(entry: &str) -> Option<String> {
    let trimmed = entry.trim();
    if trimmed.is_empty() {
        return None;
    }
    if trimmed == "*" {
        return Some(PASSKEY_RP_ID.to_string());
    }
    if let Some(suffix) = trimmed.strip_prefix("*.") {
        return Some(format!("test.{suffix}"));
    }
    let without_scheme = trimmed
        .split_once("://")
        .map(|(_, rest)| rest)
        .unwrap_or(trimmed);
    let host = without_scheme
        .split('/')
        .next()
        .unwrap_or("")
        .split(':')
        .next()
        .unwrap_or("")
        .trim();
    if host.is_empty() {
        None
    } else {
        Some(host.to_ascii_lowercase())
    }
}

fn passkey_login_finish_payload_with_origin_and_rp_id(
    challenge_id: &str,
    challenge: &str,
    signing_key: &SigningKey,
    credential_id: &[u8],
    sign_count: u32,
    trust_device: bool,
    device_label: &str,
    origin: &str,
    rp_id: &str,
) -> Value {
    passkey_login_finish_payload_with_authenticator_data_and_origin(
        challenge_id,
        challenge,
        signing_key,
        credential_id,
        login_authenticator_data_with_rp_id(sign_count, rp_id),
        trust_device,
        device_label,
        origin,
    )
}

fn passkey_login_finish_payload_with_authenticator_data_and_origin(
    challenge_id: &str,
    challenge: &str,
    signing_key: &SigningKey,
    credential_id: &[u8],
    authenticator_data: Vec<u8>,
    trust_device: bool,
    device_label: &str,
    origin: &str,
) -> Value {
    let client_data_json = encoded_client_data_json_with_origin("webauthn.get", challenge, origin);
    let client_data_hash = Sha256::digest(URL_SAFE_NO_PAD.decode(&client_data_json).unwrap());
    let mut signed_data = Vec::with_capacity(authenticator_data.len() + client_data_hash.len());
    signed_data.extend_from_slice(&authenticator_data);
    signed_data.extend_from_slice(&client_data_hash);
    let signature: Signature = signing_key.sign(&signed_data);

    json!({
        "challengeId": challenge_id,
        "credentialId": URL_SAFE_NO_PAD.encode(credential_id),
        "clientDataJson": client_data_json,
        "authenticatorData": URL_SAFE_NO_PAD.encode(authenticator_data),
        "signature": URL_SAFE_NO_PAD.encode(signature.to_der().as_bytes()),
        "trustDevice": trust_device,
        "deviceLabel": device_label
    })
}

fn encoded_client_data_json(credential_type: &str, challenge: &str) -> String {
    encoded_client_data_json_with_origin(credential_type, challenge, PASSKEY_ORIGIN)
}

fn encoded_client_data_json_with_origin(
    credential_type: &str,
    challenge: &str,
    origin: &str,
) -> String {
    URL_SAFE_NO_PAD.encode(
        json!({
            "type": credential_type,
            "challenge": challenge,
            "origin": origin
        })
        .to_string(),
    )
}

fn encoded_client_data_json_without_origin(credential_type: &str, challenge: &str) -> String {
    URL_SAFE_NO_PAD.encode(
        json!({
            "type": credential_type,
            "challenge": challenge
        })
        .to_string(),
    )
}

fn attestation_object(signing_key: &SigningKey, credential_id: &[u8]) -> Vec<u8> {
    attestation_object_with_auth_data(registration_authenticator_data(signing_key, credential_id))
}

fn attestation_object_with_auth_data(auth_data: Vec<u8>) -> Vec<u8> {
    attestation_object_with_auth_data_value(serde_cbor::Value::Bytes(auth_data))
}

fn attestation_object_with_auth_data_value(auth_data: serde_cbor::Value) -> Vec<u8> {
    let mut map = std::collections::BTreeMap::new();
    map.insert(
        serde_cbor::Value::Text("fmt".to_string()),
        serde_cbor::Value::Text("none".to_string()),
    );
    map.insert(
        serde_cbor::Value::Text("attStmt".to_string()),
        serde_cbor::Value::Map(std::collections::BTreeMap::new()),
    );
    map.insert(serde_cbor::Value::Text("authData".to_string()), auth_data);
    serde_cbor::to_vec(&serde_cbor::Value::Map(map)).unwrap()
}

fn registration_authenticator_data(signing_key: &SigningKey, credential_id: &[u8]) -> Vec<u8> {
    registration_authenticator_data_with_cose(credential_id, &cose_key(signing_key))
}

fn registration_authenticator_data_with_cose(credential_id: &[u8], cose_key: &[u8]) -> Vec<u8> {
    let mut auth_data = login_authenticator_data(0);
    auth_data[32] = 0x45;
    auth_data.extend_from_slice(&[0; 16]);
    auth_data.extend_from_slice(&(credential_id.len() as u16).to_be_bytes());
    auth_data.extend_from_slice(credential_id);
    auth_data.extend_from_slice(cose_key);
    auth_data
}

fn login_authenticator_data(sign_count: u32) -> Vec<u8> {
    login_authenticator_data_with_flags(sign_count, 0x05)
}

fn login_authenticator_data_with_flags(sign_count: u32, flags: u8) -> Vec<u8> {
    login_authenticator_data_with_rp_id_and_flags(sign_count, PASSKEY_RP_ID, flags)
}

fn login_authenticator_data_with_rp_id(sign_count: u32, rp_id: &str) -> Vec<u8> {
    login_authenticator_data_with_rp_id_and_flags(sign_count, rp_id, 0x05)
}

fn login_authenticator_data_with_rp_id_and_flags(
    sign_count: u32,
    rp_id: &str,
    flags: u8,
) -> Vec<u8> {
    let mut auth_data = vec![0; 37];
    auth_data[..32].copy_from_slice(&Sha256::digest(rp_id.as_bytes()));
    auth_data[32] = flags;
    auth_data[33..37].copy_from_slice(&sign_count.to_be_bytes());
    auth_data
}

fn cose_key(signing_key: &SigningKey) -> Vec<u8> {
    cose_key_with_metadata(signing_key, 2, -7, 1)
}

fn cose_key_with_metadata(
    signing_key: &SigningKey,
    key_type: i128,
    alg: i128,
    curve: i128,
) -> Vec<u8> {
    let encoded_point = signing_key.verifying_key().to_encoded_point(false);
    let mut map = std::collections::BTreeMap::new();
    map.insert(
        serde_cbor::Value::Integer(1),
        serde_cbor::Value::Integer(key_type),
    );
    map.insert(
        serde_cbor::Value::Integer(3),
        serde_cbor::Value::Integer(alg),
    );
    map.insert(
        serde_cbor::Value::Integer(-1),
        serde_cbor::Value::Integer(curve),
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

fn cose_key_with_wrong_value_types(signing_key: &SigningKey) -> Vec<u8> {
    let encoded_point = signing_key.verifying_key().to_encoded_point(false);
    let mut map = std::collections::BTreeMap::new();
    map.insert(
        serde_cbor::Value::Integer(1),
        serde_cbor::Value::Bytes(vec![2]),
    );
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
        serde_cbor::Value::Integer(2),
    );
    map.insert(
        serde_cbor::Value::Integer(-3),
        serde_cbor::Value::Bytes(encoded_point.y().unwrap().to_vec()),
    );
    serde_cbor::to_vec(&serde_cbor::Value::Map(map)).unwrap()
}

trait PasskeyPayloadExt {
    fn with_client_data_json(self, client_data_json: String) -> Self;
    fn with_attestation_object(self, attestation_object: Vec<u8>) -> Self;
}

impl PasskeyPayloadExt for Value {
    fn with_client_data_json(mut self, client_data_json: String) -> Self {
        self["clientDataJson"] = json!(client_data_json);
        self
    }

    fn with_attestation_object(mut self, attestation_object: Vec<u8>) -> Self {
        self["attestationObject"] = json!(URL_SAFE_NO_PAD.encode(attestation_object));
        self
    }
}
