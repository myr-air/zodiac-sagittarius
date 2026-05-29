mod support;

use axum::body::{Body, to_bytes};
use http::{Method, Request, Response, StatusCode, header};
use serde::de::DeserializeOwned;
use serde_json::{Value, json};
use tower::ServiceExt;
use uuid::Uuid;

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
        "/v1/account/email-login/finish",
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
        "/v1/account/email-login/start",
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
async fn malformed_or_missing_json_uses_stable_error_envelope(pool: sqlx::PgPool) {
    let app = support::app(pool);

    let missing_start = post_raw(app.clone(), "/v1/account/email-login/start", Body::empty()).await;
    assert_invalid_request(missing_start).await;

    let malformed_start = post_raw(
        app.clone(),
        "/v1/account/email-login/start",
        Body::from("{"),
    )
    .await;
    assert_invalid_request(malformed_start).await;

    let missing_finish =
        post_raw(app.clone(), "/v1/account/email-login/finish", Body::empty()).await;
    assert_invalid_request(missing_finish).await;

    let malformed_finish = post_raw(app, "/v1/account/email-login/finish", Body::from("{")).await;
    assert_invalid_request(malformed_finish).await;
}

#[sqlx::test(migrations = "../../migrations")]
async fn invalid_email_start_returns_invalid_request(pool: sqlx::PgPool) {
    let app = support::app(pool);

    let (status, body): (StatusCode, Value) = post_json_response(
        app,
        "/v1/account/email-login/start",
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
        "/v1/account/email-login/start",
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
        "/v1/account/email-login/finish",
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
        "/v1/account/email-login/finish",
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
        "/v1/account/email-login/finish",
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
        "/v1/account/email-login/finish",
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
        "/v1/account/email-login/finish",
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
        "/v1/account/email-login/finish",
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
        "/v1/account/email-login/finish",
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
async fn reused_code_is_rejected_after_success(pool: sqlx::PgPool) {
    let app = support::app(pool.clone());
    let (start, code) = start_email_login_with_code(&pool, app.clone(), "aom@example.com").await;
    let finish = json!({
        "challengeId": start["challengeId"],
        "code": code,
        "trustDevice": false,
        "deviceLabel": ""
    });

    let first = post_json(
        app.clone(),
        "/v1/account/email-login/finish",
        finish.clone(),
    )
    .await;
    assert_eq!(first.status(), StatusCode::OK);

    let second = post_json(app, "/v1/account/email-login/finish", finish).await;
    assert_eq!(second.status(), StatusCode::UNAUTHORIZED);
}

#[sqlx::test(migrations = "../../migrations")]
async fn wrong_code_is_rejected_and_does_not_consume_challenge(pool: sqlx::PgPool) {
    let app = support::app(pool.clone());
    let (start, _) = start_email_login_with_code(&pool, app.clone(), "aom@example.com").await;

    let challenge_id = Uuid::parse_str(start["challengeId"].as_str().unwrap()).unwrap();
    let wrong = post_json(
        app,
        "/v1/account/email-login/finish",
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
            "/v1/account/email-login/finish",
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
        "/v1/account/email-login/finish",
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
        "/v1/account/email-login/start",
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
        "/v1/account/email-login/finish",
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
        "/v1/account/email-login/finish",
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
        "/v1/account/email-login/finish",
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
        "/v1/account/email-login/finish",
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
            "/v1/account/me",
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
            "/v1/account/settings",
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
            "/v1/account/me",
            Some(&format!("Bearer {token}")),
        )
        .await,
    )
    .await;

    assert_eq!(status, StatusCode::UNAUTHORIZED);
    assert_eq!(body["code"], "unauthenticated");
}

#[sqlx::test(migrations = "../../migrations")]
async fn missing_bearer_token_on_account_me_returns_stable_unauthenticated(pool: sqlx::PgPool) {
    let (status, body) =
        response_json(get_with_auth(support::app(pool), "/v1/account/me", None).await).await;

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
                "/v1/account/me",
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
                "/v1/account/passkeys/register/start",
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

    let logout = post_with_auth(
        support::app(pool.clone()),
        "/v1/account/sessions/logout",
        Some(&authorization),
    )
    .await;
    assert_eq!(logout.status(), StatusCode::NO_CONTENT);

    let (status, body) = response_json(
        get_with_auth(support::app(pool), "/v1/account/me", Some(&authorization)).await,
    )
    .await;
    assert_eq!(status, StatusCode::UNAUTHORIZED);
    assert_eq!(body["code"], "unauthenticated");
}

#[sqlx::test(migrations = "../../migrations")]
async fn logout_with_unknown_session_returns_stable_unauthenticated(pool: sqlx::PgPool) {
    let (status, body) = response_json(
        post_with_auth(
            support::app(pool),
            "/v1/account/sessions/logout",
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
            "/v1/account/me",
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
            "/v1/account/settings",
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
            "/v1/account/settings",
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
            "/v1/account/settings",
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
            "/v1/account/me",
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
            "/v1/account/settings",
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
            "/v1/account/passkeys/register/start",
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
        post_with_auth(
            support::app(pool),
            "/v1/account/passkeys/register/start",
            None,
        )
        .await,
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
            "/v1/account/passkeys/register/start",
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
            "/v1/account/passkeys/register/start",
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
            "/v1/account/passkeys/register/start",
            Some(&authorization),
        )
        .await,
    )
    .await;
    let (second_status, second) = response_json(
        post_with_auth(
            support::app(pool.clone()),
            "/v1/account/passkeys/register/start",
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
