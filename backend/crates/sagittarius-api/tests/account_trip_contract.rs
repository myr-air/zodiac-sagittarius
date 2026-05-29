mod support;

use axum::body::{Body, to_bytes};
use http::{Method, Request, Response, StatusCode, header};
use serde::de::DeserializeOwned;
use serde_json::{Value, json};
use time::{Date, Month};
use tower::ServiceExt;
use uuid::Uuid;

async fn post_json_response<T: DeserializeOwned>(
    app: axum::Router,
    uri: &str,
    body: Value,
) -> (StatusCode, T) {
    let response = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(uri)
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(body.to_string()))
                .unwrap(),
        )
        .await
        .unwrap();
    response_json(response).await
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

async fn response_json<T: DeserializeOwned>(
    response: Response<axum::body::Body>,
) -> (StatusCode, T) {
    let status = response.status();
    let bytes = to_bytes(response.into_body(), 65536).await.unwrap();
    let body = serde_json::from_slice(&bytes).unwrap();

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

fn date_value(year: i32, month: Month, day: u8) -> Value {
    serde_json::to_value(Date::from_calendar_date(year, month, day).unwrap()).unwrap()
}

#[sqlx::test(migrations = "../../migrations")]
async fn account_user_can_create_trip_and_becomes_owner(pool: sqlx::PgPool) {
    let session = login_account(&pool, "owner@example.com", false, "").await;
    let user_id = Uuid::parse_str(session["userId"].as_str().unwrap()).unwrap();
    let auth = format!("Bearer {}", session["sessionToken"].as_str().unwrap());
    let app = support::app(pool.clone());

    let response = post_json_with_auth(
        app,
        "/v1/account/trips",
        Some(&auth),
        json!({
            "name": " Chiang Mai Food Run ",
            "destinationLabel": " Chiang Mai, Thailand ",
            "startDate": date_value(2026, Month::November, 4),
            "endDate": date_value(2026, Month::November, 8),
            "ownerDisplayName": " Aom ",
            "joinId": " cm-2026 ",
            "joinPassword": "rice-noodle-2026"
        }),
    )
    .await;
    let (status, body): (StatusCode, Value) = response_json(response).await;

    assert_eq!(status, StatusCode::OK);
    assert_eq!(body["trip"]["name"], "Chiang Mai Food Run");
    assert_eq!(body["trip"]["destinationLabel"], "Chiang Mai, Thailand");
    assert_eq!(
        body["trip"]["startDate"],
        date_value(2026, Month::November, 4)
    );
    assert_eq!(
        body["trip"]["endDate"],
        date_value(2026, Month::November, 8)
    );
    assert_eq!(body["trip"]["joinId"], "CM-2026");
    assert_eq!(body["trip"]["version"], 1);
    assert_eq!(body["ownerMemberId"], body["trip"]["ownerMemberId"]);
    assert_eq!(body["memberSession"]["tripId"], body["trip"]["id"]);
    assert_eq!(body["memberSession"]["memberId"], body["ownerMemberId"]);
    assert!(
        !body["memberSession"]["sessionToken"]
            .as_str()
            .unwrap()
            .is_empty()
    );

    let trip_id = Uuid::parse_str(body["trip"]["id"].as_str().unwrap()).unwrap();
    let owner_member_id = Uuid::parse_str(body["ownerMemberId"].as_str().unwrap()).unwrap();
    let active_plan_variant_id =
        Uuid::parse_str(body["trip"]["activePlanVariantId"].as_str().unwrap()).unwrap();

    let trip: (String, String, String, String, String, Uuid, Uuid, i64) = sqlx::query_as(
        "select
           name,
           destination_label,
           start_date::text,
           end_date::text,
           join_id,
           active_plan_variant_id,
           owner_member_id,
           version
         from trips
         where id = $1",
    )
    .bind(trip_id)
    .fetch_one(&pool)
    .await
    .unwrap();
    assert_eq!(trip.0, "Chiang Mai Food Run");
    assert_eq!(trip.1, "Chiang Mai, Thailand");
    assert_eq!(trip.2, "2026-11-04");
    assert_eq!(trip.3, "2026-11-08");
    assert_eq!(trip.4, "CM-2026");
    assert_eq!(trip.5, active_plan_variant_id);
    assert_eq!(trip.6, owner_member_id);
    assert_eq!(trip.7, 1);

    let owner: (Uuid, String, String, String, bool, String) = sqlx::query_as(
        "select
           user_id,
           display_name,
           role,
           access_status,
           claimed_at is not null,
           color
         from trip_members
         where id = $1 and trip_id = $2",
    )
    .bind(owner_member_id)
    .bind(trip_id)
    .fetch_one(&pool)
    .await
    .unwrap();
    assert_eq!(owner.0, user_id);
    assert_eq!(owner.1, "Aom");
    assert_eq!(owner.2, "owner");
    assert_eq!(owner.3, "active");
    assert!(owner.4);
    assert_eq!(owner.5, "#0f766e");

    let plan: (Uuid, String, String, String) = sqlx::query_as(
        "select trip_id, name, kind, description
         from plan_variants
         where id = $1",
    )
    .bind(active_plan_variant_id)
    .fetch_one(&pool)
    .await
    .unwrap();
    assert_eq!(plan.0, trip_id);
    assert_eq!(plan.1, "Main");
    assert_eq!(plan.2, "main");
    assert_eq!(plan.3, "Primary plan");

    let member_session_hash = sagittarius_api::app::auth::hash_session_token_for_tests(
        body["memberSession"]["sessionToken"].as_str().unwrap(),
    );
    let persisted_session_count: i64 = sqlx::query_scalar(
        "select count(*)
         from trip_member_sessions
         where trip_id = $1
           and member_id = $2
           and session_token_hash = $3
           and revoked_at is null
           and expires_at > now()",
    )
    .bind(trip_id)
    .bind(owner_member_id)
    .bind(member_session_hash)
    .fetch_one(&pool)
    .await
    .unwrap();
    assert_eq!(persisted_session_count, 1);

    let audit: (
        Option<Uuid>,
        Option<Uuid>,
        Option<Uuid>,
        Option<Uuid>,
        String,
    ) = sqlx::query_as(
        "select user_id, trip_id, actor_user_id, actor_member_id, event_type
         from account_audit_events
         where trip_id = $1",
    )
    .bind(trip_id)
    .fetch_one(&pool)
    .await
    .unwrap();
    assert_eq!(audit.0, Some(user_id));
    assert_eq!(audit.1, Some(trip_id));
    assert_eq!(audit.2, Some(user_id));
    assert_eq!(audit.3, Some(owner_member_id));
    assert_eq!(audit.4, "trip.created");
}

#[sqlx::test(migrations = "../../migrations")]
async fn account_trip_creation_validates_dates_and_auth(pool: sqlx::PgPool) {
    let app = support::app(pool.clone());
    let response = post_json_with_auth(
        app,
        "/v1/account/trips",
        None,
        json!({
            "name": "Chiang Mai",
            "destinationLabel": "Chiang Mai, Thailand",
            "startDate": date_value(2026, Month::November, 4),
            "endDate": date_value(2026, Month::November, 8),
            "ownerDisplayName": "Aom",
            "joinId": "CM-2026",
            "joinPassword": "rice-noodle-2026"
        }),
    )
    .await;
    let (status, body): (StatusCode, Value) = response_json(response).await;
    assert_eq!(status, StatusCode::UNAUTHORIZED);
    assert_eq!(body["code"], "unauthenticated");

    let session = login_account(&pool, "owner@example.com", false, "").await;
    let auth = format!("Bearer {}", session["sessionToken"].as_str().unwrap());
    let app = support::app(pool);
    let response = post_json_with_auth(
        app,
        "/v1/account/trips",
        Some(&auth),
        json!({
            "name": "Chiang Mai",
            "destinationLabel": "Chiang Mai, Thailand",
            "startDate": date_value(2026, Month::November, 9),
            "endDate": date_value(2026, Month::November, 8),
            "ownerDisplayName": "Aom",
            "joinId": "CM-2026",
            "joinPassword": "rice-noodle-2026"
        }),
    )
    .await;
    let (status, body): (StatusCode, Value) = response_json(response).await;
    assert_eq!(status, StatusCode::BAD_REQUEST);
    assert_eq!(body["code"], "invalid_request");
}
