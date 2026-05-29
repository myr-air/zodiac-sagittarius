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

async fn assert_invalid_request(response: Response<axum::body::Body>) {
    assert_eq!(response.status(), StatusCode::BAD_REQUEST);
    let bytes = to_bytes(response.into_body(), 65536).await.unwrap();
    let body: Value = serde_json::from_slice(&bytes).unwrap();
    assert_eq!(body["code"], "invalid_request");
}

#[sqlx::test(migrations = "../../migrations")]
async fn email_login_start_creates_dev_challenge(pool: sqlx::PgPool) {
    let app = support::app(pool.clone());

    let (status, body): (StatusCode, Value) = post_json_response(
        app,
        "/v1/account/email-login/start",
        json!({"email":" Aom@Example.COM "}),
    )
    .await;

    assert_eq!(status, StatusCode::OK);
    assert!(Uuid::parse_str(body["challengeId"].as_str().unwrap()).is_ok());
    let dev_code = body["devCode"].as_str().unwrap();
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

    let (second_status, second_body): (StatusCode, Value) = post_json_response(
        support::app(pool),
        "/v1/account/email-login/start",
        json!({"email":"aom@example.com"}),
    )
    .await;
    assert_eq!(second_status, StatusCode::OK);
    assert_eq!(second_body["devCode"], dev_code);
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
async fn expired_challenge_is_rejected_and_not_consumed(pool: sqlx::PgPool) {
    let app = support::app(pool.clone());
    let (_, start): (StatusCode, Value) = post_json_response(
        app.clone(),
        "/v1/account/email-login/start",
        json!({"email":"aom@example.com"}),
    )
    .await;
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
            "code": start["devCode"],
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
    let (_, start): (StatusCode, Value) = post_json_response(
        app.clone(),
        "/v1/account/email-login/start",
        json!({"email":"aom@example.com"}),
    )
    .await;
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
            "code": start["devCode"],
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
    let (start_status, start): (StatusCode, Value) = post_json_response(
        app.clone(),
        "/v1/account/email-login/start",
        json!({"email":"aom@example.com"}),
    )
    .await;
    assert_eq!(start_status, StatusCode::OK);

    let (finish_status, session): (StatusCode, Value) = post_json_response(
        app,
        "/v1/account/email-login/finish",
        json!({
            "challengeId": start["challengeId"],
            "code": start["devCode"],
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
    let (_, start): (StatusCode, Value) = post_json_response(
        app.clone(),
        "/v1/account/email-login/start",
        json!({"email":" Aom@Example.COM "}),
    )
    .await;
    let (finish_status, session): (StatusCode, Value) = post_json_response(
        app,
        "/v1/account/email-login/finish",
        json!({
            "challengeId": start["challengeId"],
            "code": start["devCode"],
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
    let (_, start): (StatusCode, Value) = post_json_response(
        app.clone(),
        "/v1/account/email-login/start",
        json!({"email":"aom@example.com"}),
    )
    .await;
    let (finish_status, body): (StatusCode, Value) = post_json_response(
        app,
        "/v1/account/email-login/finish",
        json!({
            "challengeId": start["challengeId"],
            "code": start["devCode"],
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
    let (_, start): (StatusCode, Value) = post_json_response(
        app.clone(),
        "/v1/account/email-login/start",
        json!({"email":" Aom@Example.COM "}),
    )
    .await;
    let (finish_status, session): (StatusCode, Value) = post_json_response(
        app,
        "/v1/account/email-login/finish",
        json!({
            "challengeId": start["challengeId"],
            "code": start["devCode"],
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
    let (_, start): (StatusCode, Value) = post_json_response(
        app.clone(),
        "/v1/account/email-login/start",
        json!({"email":"aom@example.com"}),
    )
    .await;

    let (finish_status, session): (StatusCode, Value) = post_json_response(
        app,
        "/v1/account/email-login/finish",
        json!({
            "challengeId": start["challengeId"],
            "code": start["devCode"],
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
    let app = support::app(pool);
    let (_, start): (StatusCode, Value) = post_json_response(
        app.clone(),
        "/v1/account/email-login/start",
        json!({"email":"aom@example.com"}),
    )
    .await;
    let finish = json!({
        "challengeId": start["challengeId"],
        "code": start["devCode"],
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
    let (_, start): (StatusCode, Value) = post_json_response(
        app.clone(),
        "/v1/account/email-login/start",
        json!({"email":"aom@example.com"}),
    )
    .await;

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
async fn same_normalized_email_resumes_same_user(pool: sqlx::PgPool) {
    let app = support::app(pool);
    let (_, first_start): (StatusCode, Value) = post_json_response(
        app.clone(),
        "/v1/account/email-login/start",
        json!({"email":" Aom@Example.COM "}),
    )
    .await;
    let (_, first_session): (StatusCode, Value) = post_json_response(
        app.clone(),
        "/v1/account/email-login/finish",
        json!({
            "challengeId": first_start["challengeId"],
            "code": first_start["devCode"],
            "trustDevice": false,
            "deviceLabel": ""
        }),
    )
    .await;

    let (_, second_start): (StatusCode, Value) = post_json_response(
        app.clone(),
        "/v1/account/email-login/start",
        json!({"email":"aom@example.com"}),
    )
    .await;
    let (_, second_session): (StatusCode, Value) = post_json_response(
        app,
        "/v1/account/email-login/finish",
        json!({
            "challengeId": second_start["challengeId"],
            "code": second_start["devCode"],
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
    let (_, start): (StatusCode, Value) = post_json_response(
        app.clone(),
        "/v1/account/email-login/start",
        json!({"email":"aom@example.com"}),
    )
    .await;
    let (_, session): (StatusCode, Value) = post_json_response(
        app,
        "/v1/account/email-login/finish",
        json!({
            "challengeId": start["challengeId"],
            "code": start["devCode"],
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
