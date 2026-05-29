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

async fn post_raw_with_auth(
    app: axum::Router,
    uri: &str,
    authorization: Option<&str>,
    body: &'static str,
) -> Response<axum::body::Body> {
    let mut request = Request::builder()
        .method(Method::POST)
        .uri(uri)
        .header(header::CONTENT_TYPE, "application/json");
    if let Some(authorization) = authorization {
        request = request.header(header::AUTHORIZATION, authorization);
    }

    app.oneshot(request.body(Body::from(body)).unwrap())
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

async fn create_account_trip(
    pool: &sqlx::PgPool,
    auth: &str,
    join_id: &str,
    join_password: &str,
) -> (StatusCode, Value) {
    let app = support::app(pool.clone());
    let response = post_json_with_auth(
        app,
        "/v1/account/trips",
        Some(auth),
        json!({
            "name": format!("{join_id} Food Run"),
            "destinationLabel": "Chiang Mai, Thailand",
            "startDate": date_value(2026, Month::November, 4),
            "endDate": date_value(2026, Month::November, 8),
            "ownerDisplayName": "Aom",
            "joinId": join_id,
            "joinPassword": join_password
        }),
    )
    .await;

    response_json(response).await
}

async fn insert_account_linked_member(
    pool: &sqlx::PgPool,
    trip_id: Uuid,
    user_id: Option<Uuid>,
    display_name: &str,
) -> Uuid {
    let member_id = Uuid::now_v7();
    sqlx::query(
        "insert into trip_members (
           id, trip_id, user_id, display_name, role, access_status, claimed_at, color
         )
         values ($1, $2, $3, $4, 'organizer', 'active', case when $3 is null then null else now() end, '#2563eb')",
    )
    .bind(member_id)
    .bind(trip_id)
    .bind(user_id)
    .bind(display_name)
    .execute(pool)
    .await
    .unwrap();

    member_id
}

async fn legacy_claim_member_session(
    pool: &sqlx::PgPool,
    member_id: &str,
    participant_password: &str,
) -> Value {
    let app = support::app(pool.clone());
    let (status, body): (StatusCode, Value) = post_json_response(
        app,
        &format!("/v1/trips/{}/members/{member_id}/claim", support::TRIP_ID),
        json!({"participantPassword": participant_password}),
    )
    .await;
    assert_eq!(status, StatusCode::OK);

    body
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
async fn account_trip_join_password_hash_uses_random_salt_and_remains_joinable(pool: sqlx::PgPool) {
    let session = login_account(&pool, "owner@example.com", false, "").await;
    let auth = format!("Bearer {}", session["sessionToken"].as_str().unwrap());

    let (first_status, first_body) =
        create_account_trip(&pool, &auth, "random-salt-1", "shared-password-2026").await;
    assert_eq!(first_status, StatusCode::OK);
    let (second_status, second_body) =
        create_account_trip(&pool, &auth, "random-salt-2", "shared-password-2026").await;
    assert_eq!(second_status, StatusCode::OK);

    let first_trip_id = Uuid::parse_str(first_body["trip"]["id"].as_str().unwrap()).unwrap();
    let second_trip_id = Uuid::parse_str(second_body["trip"]["id"].as_str().unwrap()).unwrap();
    let first_hash: String = sqlx::query_scalar(
        "select join_password_hash
         from trips
         where id = $1",
    )
    .bind(first_trip_id)
    .fetch_one(&pool)
    .await
    .unwrap();
    let second_hash: String = sqlx::query_scalar(
        "select join_password_hash
         from trips
         where id = $1",
    )
    .bind(second_trip_id)
    .fetch_one(&pool)
    .await
    .unwrap();
    assert_ne!(first_hash, second_hash);

    for join_id in ["random-salt-1", "random-salt-2"] {
        let app = support::app(pool.clone());
        let (status, body): (StatusCode, Value) = post_json_response(
            app,
            "/v1/trips/join",
            json!({
                "joinId": join_id,
                "tripPassword": "shared-password-2026"
            }),
        )
        .await;
        assert_eq!(status, StatusCode::OK);
        assert_eq!(body["trip"]["joinId"], join_id.to_ascii_uppercase());
    }
}

#[sqlx::test(migrations = "../../migrations")]
async fn duplicate_account_trip_join_id_returns_stable_conflict(pool: sqlx::PgPool) {
    let session = login_account(&pool, "owner@example.com", false, "").await;
    let auth = format!("Bearer {}", session["sessionToken"].as_str().unwrap());

    let (first_status, _) =
        create_account_trip(&pool, &auth, "dupe-join-id", "rice-noodle-2026").await;
    assert_eq!(first_status, StatusCode::OK);
    let (second_status, second_body) =
        create_account_trip(&pool, &auth, " DUPE-JOIN-ID ", "rice-noodle-2027").await;

    assert_eq!(second_status, StatusCode::CONFLICT);
    assert_eq!(second_body["code"], "trip_join_id_already_exists");

    let trip_count: i64 = sqlx::query_scalar(
        "select count(*)
         from trips
         where join_id = 'DUPE-JOIN-ID'",
    )
    .fetch_one(&pool)
    .await
    .unwrap();
    assert_eq!(trip_count, 1);
}

#[sqlx::test(migrations = "../../migrations")]
async fn account_trip_creation_rejects_oversized_join_password(pool: sqlx::PgPool) {
    let session = login_account(&pool, "owner@example.com", false, "").await;
    let auth = format!("Bearer {}", session["sessionToken"].as_str().unwrap());
    let oversized_password = "p".repeat(257);

    let (status, body) =
        create_account_trip(&pool, &auth, "oversized-password", &oversized_password).await;

    assert_eq!(status, StatusCode::BAD_REQUEST);
    assert_eq!(body["code"], "invalid_request");
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

#[sqlx::test(migrations = "../../migrations")]
async fn account_claims_existing_temp_member_after_member_session_proof(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    let member_session = legacy_claim_member_session(&pool, support::TRAVELER_ID, "1234").await;
    let member_session_token = member_session["sessionToken"].as_str().unwrap();
    let session = login_account(&pool, "traveler@example.com", false, "").await;
    let user_id = Uuid::parse_str(session["userId"].as_str().unwrap()).unwrap();
    let auth = format!("Bearer {}", session["sessionToken"].as_str().unwrap());
    let trip_id = Uuid::parse_str(support::TRIP_ID).unwrap();
    let member_id = Uuid::parse_str(support::TRAVELER_ID).unwrap();

    let response = post_json_with_auth(
        support::app(pool.clone()),
        &format!("/v1/account/trips/{trip_id}/members/{member_id}/claim"),
        Some(&auth),
        json!({"memberSessionToken": member_session_token}),
    )
    .await;
    let (status, body): (StatusCode, Value) = response_json(response).await;

    assert_eq!(status, StatusCode::OK);
    assert_eq!(body["tripId"], support::TRIP_ID);
    assert_eq!(body["memberId"], support::TRAVELER_ID);
    assert_eq!(body["userId"], user_id.to_string());
    assert_eq!(body["role"], "traveler");

    let member: (Option<Uuid>, bool) = sqlx::query_as(
        "select user_id, claimed_at is not null
         from trip_members
         where trip_id = $1 and id = $2",
    )
    .bind(trip_id)
    .bind(member_id)
    .fetch_one(&pool)
    .await
    .unwrap();
    assert_eq!(member.0, Some(user_id));
    assert!(member.1);

    let audit: (
        Option<Uuid>,
        Option<Uuid>,
        Option<Uuid>,
        Option<Uuid>,
        String,
        Value,
    ) = sqlx::query_as(
        "select user_id, trip_id, actor_user_id, actor_member_id, event_type, payload
         from account_audit_events
         where trip_id = $1 and event_type = 'member.claimed_account'",
    )
    .bind(trip_id)
    .fetch_one(&pool)
    .await
    .unwrap();
    assert_eq!(audit.0, Some(user_id));
    assert_eq!(audit.1, Some(trip_id));
    assert_eq!(audit.2, Some(user_id));
    assert_eq!(audit.3, Some(member_id));
    assert_eq!(audit.4, "member.claimed_account");
    assert_eq!(audit.5, json!({}));
}

#[sqlx::test(migrations = "../../migrations")]
async fn account_claim_for_disabled_member_returns_forbidden_after_session_proof(
    pool: sqlx::PgPool,
) {
    support::seed_trip(&pool).await;
    let member_session = legacy_claim_member_session(&pool, support::TRAVELER_ID, "1234").await;
    let member_session_token = member_session["sessionToken"].as_str().unwrap();
    let member_session_hash =
        sagittarius_api::app::auth::hash_session_token_for_tests(member_session_token);
    let trip_id = Uuid::parse_str(support::TRIP_ID).unwrap();
    let member_id = Uuid::parse_str(support::TRAVELER_ID).unwrap();

    let session_exists_before_disable: bool = sqlx::query_scalar(
        "select exists (
           select 1
           from trip_member_sessions
           where trip_id = $1
             and member_id = $2
             and session_token_hash = $3
             and revoked_at is null
             and expires_at > now()
         )",
    )
    .bind(trip_id)
    .bind(member_id)
    .bind(member_session_hash)
    .fetch_one(&pool)
    .await
    .unwrap();
    assert!(session_exists_before_disable);

    sqlx::query(
        "update trip_members
         set access_status = 'disabled'
         where trip_id = $1 and id = $2",
    )
    .bind(trip_id)
    .bind(member_id)
    .execute(&pool)
    .await
    .unwrap();

    let account_session = login_account(&pool, "traveler@example.com", false, "").await;
    let auth = format!(
        "Bearer {}",
        account_session["sessionToken"].as_str().unwrap()
    );

    let response = post_json_with_auth(
        support::app(pool.clone()),
        &format!("/v1/account/trips/{trip_id}/members/{member_id}/claim"),
        Some(&auth),
        json!({"memberSessionToken": member_session_token}),
    )
    .await;
    let (status, body): (StatusCode, Value) = response_json(response).await;

    assert_eq!(status, StatusCode::FORBIDDEN);
    assert_eq!(body["code"], "forbidden");
}

#[sqlx::test(migrations = "../../migrations")]
async fn account_claim_rejects_wrong_session_and_already_linked_member(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    let traveler_session = legacy_claim_member_session(&pool, support::TRAVELER_ID, "1234").await;
    let organizer_session = legacy_claim_member_session(&pool, support::ORGANIZER_ID, "5678").await;
    let account_session = login_account(&pool, "traveler@example.com", false, "").await;
    let auth = format!(
        "Bearer {}",
        account_session["sessionToken"].as_str().unwrap()
    );
    let trip_id = Uuid::parse_str(support::TRIP_ID).unwrap();
    let traveler_id = Uuid::parse_str(support::TRAVELER_ID).unwrap();
    let organizer_id = Uuid::parse_str(support::ORGANIZER_ID).unwrap();

    let missing_bearer = post_json_with_auth(
        support::app(pool.clone()),
        &format!("/v1/account/trips/{trip_id}/members/{traveler_id}/claim"),
        None,
        json!({"memberSessionToken": traveler_session["sessionToken"]}),
    )
    .await;
    let (missing_status, missing_body): (StatusCode, Value) = response_json(missing_bearer).await;
    assert_eq!(missing_status, StatusCode::UNAUTHORIZED);
    assert_eq!(missing_body["code"], "unauthenticated");

    let malformed = post_raw_with_auth(
        support::app(pool.clone()),
        &format!("/v1/account/trips/{trip_id}/members/{traveler_id}/claim"),
        Some(&auth),
        "{",
    )
    .await;
    let (malformed_status, malformed_body): (StatusCode, Value) = response_json(malformed).await;
    assert_eq!(malformed_status, StatusCode::BAD_REQUEST);
    assert_eq!(malformed_body["code"], "invalid_request");

    let wrong_session = post_json_with_auth(
        support::app(pool.clone()),
        &format!("/v1/account/trips/{trip_id}/members/{traveler_id}/claim"),
        Some(&auth),
        json!({"memberSessionToken": organizer_session["sessionToken"]}),
    )
    .await;
    let (wrong_status, wrong_body): (StatusCode, Value) = response_json(wrong_session).await;
    assert_eq!(wrong_status, StatusCode::UNAUTHORIZED);
    assert_eq!(wrong_body["code"], "unauthenticated");

    sqlx::query(
        "update trip_members
         set user_id = $1, claimed_at = coalesce(claimed_at, now())
         where trip_id = $2 and id = $3",
    )
    .bind(Uuid::parse_str(account_session["userId"].as_str().unwrap()).unwrap())
    .bind(trip_id)
    .bind(organizer_id)
    .execute(&pool)
    .await
    .unwrap();

    let already_linked = post_json_with_auth(
        support::app(pool.clone()),
        &format!("/v1/account/trips/{trip_id}/members/{organizer_id}/claim"),
        Some(&auth),
        json!({"memberSessionToken": organizer_session["sessionToken"]}),
    )
    .await;
    let (linked_status, linked_body): (StatusCode, Value) = response_json(already_linked).await;
    assert_eq!(linked_status, StatusCode::CONFLICT);
    assert_eq!(linked_body["code"], "identity_already_linked");
}

#[sqlx::test(migrations = "../../migrations")]
async fn owner_can_transfer_ownership_to_account_linked_member(pool: sqlx::PgPool) {
    let owner_session = login_account(&pool, "owner@example.com", false, "").await;
    let owner_user_id = Uuid::parse_str(owner_session["userId"].as_str().unwrap()).unwrap();
    let owner_auth = format!("Bearer {}", owner_session["sessionToken"].as_str().unwrap());
    let (_, trip_body) =
        create_account_trip(&pool, &owner_auth, "owner-transfer", "rice-noodle-2026").await;
    let trip_id = Uuid::parse_str(trip_body["trip"]["id"].as_str().unwrap()).unwrap();
    let old_owner_member_id =
        Uuid::parse_str(trip_body["ownerMemberId"].as_str().unwrap()).unwrap();
    let target_session = login_account(&pool, "target@example.com", false, "").await;
    let target_user_id = Uuid::parse_str(target_session["userId"].as_str().unwrap()).unwrap();
    let target_member_id =
        insert_account_linked_member(&pool, trip_id, Some(target_user_id), "Ben").await;

    let response = post_json_with_auth(
        support::app(pool.clone()),
        &format!("/v1/account/trips/{trip_id}/owner-transfer"),
        Some(&owner_auth),
        json!({"targetMemberId": target_member_id}),
    )
    .await;
    let (status, body): (StatusCode, Value) = response_json(response).await;

    assert_eq!(status, StatusCode::OK);
    assert_eq!(body["tripId"], trip_id.to_string());
    assert_eq!(
        body["previousOwnerMemberId"],
        old_owner_member_id.to_string()
    );
    assert_eq!(body["newOwnerMemberId"], target_member_id.to_string());

    let old_owner_role: String = sqlx::query_scalar(
        "select role
         from trip_members
         where trip_id = $1 and id = $2",
    )
    .bind(trip_id)
    .bind(old_owner_member_id)
    .fetch_one(&pool)
    .await
    .unwrap();
    assert_eq!(old_owner_role, "organizer");

    let target_role: String = sqlx::query_scalar(
        "select role
         from trip_members
         where trip_id = $1 and id = $2",
    )
    .bind(trip_id)
    .bind(target_member_id)
    .fetch_one(&pool)
    .await
    .unwrap();
    assert_eq!(target_role, "owner");

    let persisted_owner_member_id: Uuid = sqlx::query_scalar(
        "select owner_member_id
         from trips
         where id = $1",
    )
    .bind(trip_id)
    .fetch_one(&pool)
    .await
    .unwrap();
    assert_eq!(persisted_owner_member_id, target_member_id);

    let owner_count: i64 = sqlx::query_scalar(
        "select count(*)
         from trip_members
         where trip_id = $1 and role = 'owner'",
    )
    .bind(trip_id)
    .fetch_one(&pool)
    .await
    .unwrap();
    assert_eq!(owner_count, 1);

    let audit: (
        Option<Uuid>,
        Option<Uuid>,
        Option<Uuid>,
        Option<Uuid>,
        String,
        Value,
    ) = sqlx::query_as(
        "select user_id, trip_id, actor_user_id, actor_member_id, event_type, payload
         from account_audit_events
         where trip_id = $1 and event_type = 'owner.transferred'",
    )
    .bind(trip_id)
    .fetch_one(&pool)
    .await
    .unwrap();
    assert_eq!(audit.0, Some(target_user_id));
    assert_eq!(audit.1, Some(trip_id));
    assert_eq!(audit.2, Some(owner_user_id));
    assert_eq!(audit.3, Some(old_owner_member_id));
    assert_eq!(audit.4, "owner.transferred");
    assert_eq!(audit.5, json!({}));
}

#[sqlx::test(migrations = "../../migrations")]
async fn owner_transfer_requires_current_owner_and_account_target(pool: sqlx::PgPool) {
    let owner_session = login_account(&pool, "owner@example.com", false, "").await;
    let owner_auth = format!("Bearer {}", owner_session["sessionToken"].as_str().unwrap());
    let (_, trip_body) = create_account_trip(
        &pool,
        &owner_auth,
        "owner-transfer-auth",
        "rice-noodle-2026",
    )
    .await;
    let trip_id = Uuid::parse_str(trip_body["trip"]["id"].as_str().unwrap()).unwrap();
    let target_session = login_account(&pool, "target@example.com", false, "").await;
    let target_user_id = Uuid::parse_str(target_session["userId"].as_str().unwrap()).unwrap();
    let target_auth = format!(
        "Bearer {}",
        target_session["sessionToken"].as_str().unwrap()
    );
    let target_member_id =
        insert_account_linked_member(&pool, trip_id, Some(target_user_id), "Ben").await;

    let non_owner_response = post_json_with_auth(
        support::app(pool.clone()),
        &format!("/v1/account/trips/{trip_id}/owner-transfer"),
        Some(&target_auth),
        json!({"targetMemberId": target_member_id}),
    )
    .await;
    let (non_owner_status, non_owner_body): (StatusCode, Value) =
        response_json(non_owner_response).await;
    assert_eq!(non_owner_status, StatusCode::FORBIDDEN);
    assert_eq!(non_owner_body["code"], "forbidden");

    let unlinked_member_id = insert_account_linked_member(&pool, trip_id, None, "No Account").await;
    let unlinked_response = post_json_with_auth(
        support::app(pool.clone()),
        &format!("/v1/account/trips/{trip_id}/owner-transfer"),
        Some(&owner_auth),
        json!({"targetMemberId": unlinked_member_id}),
    )
    .await;
    let (unlinked_status, unlinked_body): (StatusCode, Value) =
        response_json(unlinked_response).await;
    assert_eq!(unlinked_status, StatusCode::CONFLICT);
    assert_eq!(unlinked_body["code"], "owner_transfer_invalid");
}

#[sqlx::test(migrations = "../../migrations")]
async fn owner_transfer_rejects_disabled_account_target_and_preserves_roles(pool: sqlx::PgPool) {
    let owner_session = login_account(&pool, "owner@example.com", false, "").await;
    let owner_auth = format!("Bearer {}", owner_session["sessionToken"].as_str().unwrap());
    let (_, trip_body) = create_account_trip(
        &pool,
        &owner_auth,
        "owner-transfer-disabled",
        "rice-noodle-2026",
    )
    .await;
    let trip_id = Uuid::parse_str(trip_body["trip"]["id"].as_str().unwrap()).unwrap();
    let owner_member_id = Uuid::parse_str(trip_body["ownerMemberId"].as_str().unwrap()).unwrap();
    let target_session = login_account(&pool, "target@example.com", false, "").await;
    let target_user_id = Uuid::parse_str(target_session["userId"].as_str().unwrap()).unwrap();
    let target_member_id =
        insert_account_linked_member(&pool, trip_id, Some(target_user_id), "Ben").await;

    sqlx::query(
        "update users
         set disabled_at = now()
         where id = $1",
    )
    .bind(target_user_id)
    .execute(&pool)
    .await
    .unwrap();

    let response = post_json_with_auth(
        support::app(pool.clone()),
        &format!("/v1/account/trips/{trip_id}/owner-transfer"),
        Some(&owner_auth),
        json!({"targetMemberId": target_member_id}),
    )
    .await;
    let (status, body): (StatusCode, Value) = response_json(response).await;

    assert_eq!(status, StatusCode::CONFLICT);
    assert_eq!(body["code"], "owner_transfer_invalid");

    let roles: Vec<(Uuid, String)> = sqlx::query_as(
        "select id, role
         from trip_members
         where trip_id = $1 and id = any($2)
         order by id",
    )
    .bind(trip_id)
    .bind(vec![owner_member_id, target_member_id])
    .fetch_all(&pool)
    .await
    .unwrap();
    assert_eq!(
        roles,
        vec![
            (owner_member_id, "owner".to_string()),
            (target_member_id, "organizer".to_string())
        ]
    );

    let persisted_owner_member_id: Uuid = sqlx::query_scalar(
        "select owner_member_id
         from trips
         where id = $1",
    )
    .bind(trip_id)
    .fetch_one(&pool)
    .await
    .unwrap();
    assert_eq!(persisted_owner_member_id, owner_member_id);
}

#[sqlx::test(migrations = "../../migrations")]
async fn owner_transfer_rejects_self_transfer(pool: sqlx::PgPool) {
    let owner_session = login_account(&pool, "owner@example.com", false, "").await;
    let owner_auth = format!("Bearer {}", owner_session["sessionToken"].as_str().unwrap());
    let (_, trip_body) = create_account_trip(
        &pool,
        &owner_auth,
        "owner-transfer-self",
        "rice-noodle-2026",
    )
    .await;
    let trip_id = Uuid::parse_str(trip_body["trip"]["id"].as_str().unwrap()).unwrap();
    let owner_member_id = Uuid::parse_str(trip_body["ownerMemberId"].as_str().unwrap()).unwrap();

    let response = post_json_with_auth(
        support::app(pool.clone()),
        &format!("/v1/account/trips/{trip_id}/owner-transfer"),
        Some(&owner_auth),
        json!({"targetMemberId": owner_member_id}),
    )
    .await;
    let (status, body): (StatusCode, Value) = response_json(response).await;

    assert_eq!(status, StatusCode::CONFLICT);
    assert_eq!(body["code"], "owner_transfer_invalid");

    let audit_count: i64 = sqlx::query_scalar(
        "select count(*)
         from account_audit_events
         where trip_id = $1 and event_type = 'owner.transferred'",
    )
    .bind(trip_id)
    .fetch_one(&pool)
    .await
    .unwrap();
    assert_eq!(audit_count, 0);
}

#[sqlx::test(migrations = "../../migrations")]
async fn owner_transfer_rejects_malformed_request(pool: sqlx::PgPool) {
    let owner_session = login_account(&pool, "owner@example.com", false, "").await;
    let owner_auth = format!("Bearer {}", owner_session["sessionToken"].as_str().unwrap());
    let (_, trip_body) = create_account_trip(
        &pool,
        &owner_auth,
        "owner-transfer-json",
        "rice-noodle-2026",
    )
    .await;
    let trip_id = Uuid::parse_str(trip_body["trip"]["id"].as_str().unwrap()).unwrap();

    let missing = post_json_with_auth(
        support::app(pool.clone()),
        &format!("/v1/account/trips/{trip_id}/owner-transfer"),
        Some(&owner_auth),
        json!({}),
    )
    .await;
    let (missing_status, missing_body): (StatusCode, Value) = response_json(missing).await;
    assert_eq!(missing_status, StatusCode::BAD_REQUEST);
    assert_eq!(missing_body["code"], "invalid_request");

    let malformed = post_raw_with_auth(
        support::app(pool.clone()),
        &format!("/v1/account/trips/{trip_id}/owner-transfer"),
        Some(&owner_auth),
        "{",
    )
    .await;
    let (malformed_status, malformed_body): (StatusCode, Value) = response_json(malformed).await;
    assert_eq!(malformed_status, StatusCode::BAD_REQUEST);
    assert_eq!(malformed_body["code"], "invalid_request");
}
