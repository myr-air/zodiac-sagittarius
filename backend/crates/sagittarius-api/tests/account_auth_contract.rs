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
