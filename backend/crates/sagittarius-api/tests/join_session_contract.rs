mod support;

use axum::body::{Body, to_bytes};
use http::{Method, Request, StatusCode, header};
use serde_json::{Value, json};
use time::{Duration, OffsetDateTime};
use tower::ServiceExt;

fn assert_hash_fields_absent(value: &Value) {
    match value {
        Value::Object(map) => {
            for (key, child) in map {
                assert!(
                    !key.to_ascii_lowercase().contains("hash"),
                    "response leaked hash field {key}: {value}"
                );
                assert_hash_fields_absent(child);
            }
        }
        Value::Array(items) => {
            for item in items {
                assert_hash_fields_absent(item);
            }
        }
        _ => {}
    }
}

async fn join_room(app: &axum::Router) -> Value {
    let join_response = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/trip-join-sessions")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({"joinCode":" hk-sz-2025 ","tripPassword":"seed-trip-pass"}).to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(join_response.status(), StatusCode::OK);

    serde_json::from_slice(&to_bytes(join_response.into_body(), 65536).await.unwrap()).unwrap()
}

#[sqlx::test(migrations = "../../migrations")]
async fn join_session_contract_hides_hashes_and_claim_creates_session(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    support::set_trip_dates(&pool, "2026-06-01", "2026-06-30").await;
    let app = support::app(pool.clone());

    let join_body = join_room(&app).await;
    let join_session_token = join_body["joinSessionToken"].as_str().unwrap();
    assert_eq!(join_body["trip"]["id"], support::TRIP_ID);
    assert_eq!(join_body["trip"]["joinId"], "HK-SZ-2025");
    assert_eq!(
        join_body["trip"]["mainTripPlanId"], join_body["trip"]["activePlanVariantId"],
        "trip-join-sessions response must expose canonical and legacy Main Plan pointers",
    );
    assert!(!join_session_token.is_empty());
    assert!(join_body["expiresAt"].as_str().unwrap().contains('T'));
    assert!(join_body["trip"].get("joinPasswordHash").is_none());
    assert!(join_body["claimableMembers"].as_array().unwrap().len() >= 3);
    assert!(
        join_body["claimableMembers"]
            .as_array()
            .unwrap()
            .iter()
            .all(|member| member.get("claimPasswordHash").is_none())
    );
    assert_hash_fields_absent(&join_body);

    let claim_response = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!(
                    "/api/v1/trips/{}/members/{}/claims",
                    support::TRIP_ID,
                    support::TRAVELER_ID
                ))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({"participantPassword":"1234","joinSessionToken":join_session_token})
                        .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(claim_response.status(), StatusCode::OK);
    let claim_body: Value =
        serde_json::from_slice(&to_bytes(claim_response.into_body(), 65536).await.unwrap())
            .unwrap();
    assert_eq!(claim_body["tripId"], support::TRIP_ID);
    assert_eq!(claim_body["memberId"], support::TRAVELER_ID);
    assert!(claim_body["sessionToken"].as_str().unwrap().len() >= 32);
    assert_hash_fields_absent(&claim_body);
}

#[sqlx::test(migrations = "../../migrations")]
async fn join_session_contract_claim_rejects_already_claimed_member(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    support::claim_member(&pool, support::TRAVELER_ID, "1234", "active").await;
    let app = support::app(pool.clone());
    let join_body = join_room(&app).await;
    let join_session_token = join_body["joinSessionToken"].as_str().unwrap();

    let response = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!(
                    "/api/v1/trips/{}/members/{}/claims",
                    support::TRIP_ID,
                    support::TRAVELER_ID
                ))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({"participantPassword":"1234","joinSessionToken":join_session_token})
                        .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
}

#[sqlx::test(migrations = "../../migrations")]
async fn join_session_contract_claim_requires_join_session_token(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    let app = support::app(pool.clone());

    let response = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!(
                    "/api/v1/trips/{}/members/{}/claims",
                    support::TRIP_ID,
                    support::TRAVELER_ID
                ))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({"participantPassword":"1234"}).to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
}

#[sqlx::test(migrations = "../../migrations")]
async fn join_session_contract_locks_trip_password_after_repeated_wrong_attempts(
    pool: sqlx::PgPool,
) {
    support::seed_trip(&pool).await;
    let app = support::app(pool.clone());

    for _ in 0..5 {
        let response = app
            .clone()
            .oneshot(
                Request::builder()
                    .method(Method::POST)
                    .uri("/api/v1/trip-join-sessions")
                    .header(header::CONTENT_TYPE, "application/json")
                    .body(Body::from(
                        json!({"joinCode":"HK-SZ-2025","tripPassword":"wrong-pass"}).to_string(),
                    ))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
    }

    let locked = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/trip-join-sessions")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({"joinCode":"HK-SZ-2025","tripPassword":"seed-trip-pass"}).to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(locked.status(), StatusCode::TOO_MANY_REQUESTS);
}

#[sqlx::test(migrations = "../../migrations")]
async fn join_session_contract_locks_member_password_after_repeated_wrong_attempts(
    pool: sqlx::PgPool,
) {
    support::seed_trip(&pool).await;
    support::claim_member(&pool, support::ORGANIZER_ID, "1234", "active").await;
    let app = support::app(pool.clone());
    let join_body = join_room(&app).await;
    let join_session_token = join_body["joinSessionToken"].as_str().unwrap();

    for _ in 0..5 {
        let response = app
            .clone()
            .oneshot(
                Request::builder()
                    .method(Method::POST)
                    .uri(format!(
                        "/api/v1/trips/{}/member-sessions",
                        support::TRIP_ID
                    ))
                    .header(header::CONTENT_TYPE, "application/json")
                    .body(Body::from(
                        json!({
                            "memberId": support::ORGANIZER_ID,
                            "participantPassword":"0000",
                            "joinSessionToken": join_session_token
                        })
                        .to_string(),
                    ))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
    }

    let locked = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!(
                    "/api/v1/trips/{}/member-sessions",
                    support::TRIP_ID
                ))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "memberId": support::ORGANIZER_ID,
                        "participantPassword":"1234",
                        "joinSessionToken": join_session_token
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(locked.status(), StatusCode::TOO_MANY_REQUESTS);
}

#[sqlx::test(migrations = "../../migrations")]
async fn join_session_contract_login_and_logout_use_join_and_member_tokens(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    support::set_trip_dates(&pool, "2026-06-01", "2026-06-30").await;
    support::claim_member(&pool, support::ORGANIZER_ID, "1234", "active").await;
    let app = support::app(pool.clone());
    let join_body = join_room(&app).await;
    let join_session_token = join_body["joinSessionToken"].as_str().unwrap();

    let login_response = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!(
                    "/api/v1/trips/{}/member-sessions",
                    support::TRIP_ID
                ))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "memberId": support::ORGANIZER_ID,
                        "participantPassword":"1234",
                        "joinSessionToken": join_session_token
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(login_response.status(), StatusCode::OK);
    let login_body: Value =
        serde_json::from_slice(&to_bytes(login_response.into_body(), 65536).await.unwrap())
            .unwrap();
    let session_token = login_body["sessionToken"].as_str().unwrap();

    let reused_join_session = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!(
                    "/api/v1/trips/{}/member-sessions",
                    support::TRIP_ID
                ))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "memberId": support::ORGANIZER_ID,
                        "participantPassword":"1234",
                        "joinSessionToken": join_session_token
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(reused_join_session.status(), StatusCode::UNAUTHORIZED);

    let logout_body = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::DELETE)
                .uri(format!(
                    "/api/v1/trips/{}/member-sessions/current",
                    support::TRIP_ID
                ))
                .header(header::AUTHORIZATION, format!("Bearer {session_token}"))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(logout_body.status(), StatusCode::NO_CONTENT);

    let bearer_token = support::create_session(&pool, support::ORGANIZER_ID).await;
    let logout_bearer = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::DELETE)
                .uri(format!(
                    "/api/v1/trips/{}/member-sessions/current",
                    support::TRIP_ID
                ))
                .header(header::AUTHORIZATION, format!("bearer   {bearer_token}"))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(logout_bearer.status(), StatusCode::NO_CONTENT);

    let logout_missing_token = app
        .oneshot(
            Request::builder()
                .method(Method::DELETE)
                .uri(format!(
                    "/api/v1/trips/{}/member-sessions/current",
                    support::TRIP_ID
                ))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(logout_missing_token.status(), StatusCode::UNAUTHORIZED);
}

#[sqlx::test(migrations = "../../migrations")]
async fn join_invite_token_resolves_to_fresh_join_session(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    support::claim_member(&pool, support::ORGANIZER_ID, "1234", "active").await;
    let organizer_token = support::create_session(&pool, support::ORGANIZER_ID).await;
    let app = support::app(pool.clone());

    let rotate_response = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!(
                    "/api/v1/trips/{}/join-invite-tokens",
                    support::TRIP_ID
                ))
                .header(header::AUTHORIZATION, format!("Bearer {organizer_token}"))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(rotate_response.status(), StatusCode::OK);
    let rotate_body: Value =
        serde_json::from_slice(&to_bytes(rotate_response.into_body(), 65536).await.unwrap())
            .unwrap();
    let invite_token = rotate_body["token"].as_str().unwrap();
    assert!(!invite_token.is_empty());
    assert!(rotate_body["expiresAt"].as_str().unwrap().contains('T'));
    assert_hash_fields_absent(&rotate_body);

    let resolve_response = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(format!(
                    "/api/v1/trip-join-invite-tokens/current?token={invite_token}"
                ))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(resolve_response.status(), StatusCode::OK);
    let resolve_body: Value =
        serde_json::from_slice(&to_bytes(resolve_response.into_body(), 65536).await.unwrap())
            .unwrap();
    assert_eq!(resolve_body["trip"]["id"], support::TRIP_ID);
    assert_eq!(resolve_body["trip"]["joinId"], "HK-SZ-2025");
    assert_eq!(
        resolve_body["trip"]["mainTripPlanId"], resolve_body["trip"]["activePlanVariantId"],
        "invite-token-current response must expose canonical and legacy Main Plan pointers",
    );
    assert_ne!(
        resolve_body["joinSessionToken"].as_str().unwrap(),
        invite_token,
        "URL invite token must not be reused as the one-time member auth token"
    );
    assert_hash_fields_absent(&resolve_body);
}

#[sqlx::test(migrations = "../../migrations")]
async fn join_invite_token_rotation_revokes_old_token_and_requires_manage_people(
    pool: sqlx::PgPool,
) {
    support::seed_trip(&pool).await;
    support::claim_member(&pool, support::ORGANIZER_ID, "1234", "active").await;
    support::claim_member(&pool, support::TRAVELER_ID, "1234", "active").await;
    let organizer_token = support::create_session(&pool, support::ORGANIZER_ID).await;
    let traveler_token = support::create_session(&pool, support::TRAVELER_ID).await;
    let app = support::app(pool.clone());

    let denied_response = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!(
                    "/api/v1/trips/{}/join-invite-tokens",
                    support::TRIP_ID
                ))
                .header(header::AUTHORIZATION, format!("Bearer {traveler_token}"))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(denied_response.status(), StatusCode::FORBIDDEN);

    let first_response = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!(
                    "/api/v1/trips/{}/join-invite-tokens",
                    support::TRIP_ID
                ))
                .header(header::AUTHORIZATION, format!("Bearer {organizer_token}"))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(first_response.status(), StatusCode::OK);
    let first_body: Value =
        serde_json::from_slice(&to_bytes(first_response.into_body(), 65536).await.unwrap())
            .unwrap();
    let first_token = first_body["token"].as_str().unwrap();

    let second_response = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!(
                    "/api/v1/trips/{}/join-invite-tokens",
                    support::TRIP_ID
                ))
                .header(header::AUTHORIZATION, format!("Bearer {organizer_token}"))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(second_response.status(), StatusCode::OK);
    let second_body: Value =
        serde_json::from_slice(&to_bytes(second_response.into_body(), 65536).await.unwrap())
            .unwrap();
    let second_token = second_body["token"].as_str().unwrap();
    assert_ne!(first_token, second_token);

    let old_token_response = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(format!(
                    "/api/v1/trip-join-invite-tokens/current?token={first_token}"
                ))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(old_token_response.status(), StatusCode::UNAUTHORIZED);

    sqlx::query(
        "update trip_join_invite_tokens
         set expires_at = now() - interval '1 minute'
         where trip_id = $1",
    )
    .bind(uuid::Uuid::parse_str(support::TRIP_ID).unwrap())
    .execute(&pool)
    .await
    .unwrap();
    let expired_token_response = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(format!(
                    "/api/v1/trip-join-invite-tokens/current?token={second_token}"
                ))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(expired_token_response.status(), StatusCode::UNAUTHORIZED);
}

#[sqlx::test(migrations = "../../migrations")]
async fn member_session_contract_sets_organizer_traveler_and_viewer_ttls(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    support::set_trip_dates(&pool, "2026-07-15", "2026-07-30").await;
    support::claim_member(&pool, support::ORGANIZER_ID, "1234", "active").await;
    support::claim_member(&pool, support::TRAVELER_ID, "1234", "active").await;
    support::claim_member(&pool, support::VIEWER_ID, "1234", "active").await;
    let app = support::app(pool.clone());

    for (member_id, expected_days) in [
        (support::ORGANIZER_ID, 7_i64),
        (support::TRAVELER_ID, 7_i64),
        (support::VIEWER_ID, 1_i64),
    ] {
        let join_body = join_room(&app).await;
        let join_session_token = join_body["joinSessionToken"].as_str().unwrap();
        let response = app
            .clone()
            .oneshot(
                Request::builder()
                    .method(Method::POST)
                    .uri(format!(
                        "/api/v1/trips/{}/member-sessions",
                        support::TRIP_ID
                    ))
                    .header(header::CONTENT_TYPE, "application/json")
                    .body(Body::from(
                        json!({
                            "memberId": member_id,
                            "participantPassword": "1234",
                            "joinSessionToken": join_session_token
                        })
                        .to_string(),
                    ))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::OK);
        let body: Value =
            serde_json::from_slice(&to_bytes(response.into_body(), 65536).await.unwrap()).unwrap();
        let created_at = OffsetDateTime::parse(
            body["createdAt"].as_str().unwrap(),
            &time::format_description::well_known::Rfc3339,
        )
        .unwrap();
        let expires_at = OffsetDateTime::parse(
            body["expiresAt"].as_str().unwrap(),
            &time::format_description::well_known::Rfc3339,
        )
        .unwrap();

        assert_eq!(expires_at - created_at, Duration::days(expected_days));
    }
}

#[sqlx::test(migrations = "../../migrations")]
async fn member_session_contract_allows_organizer_after_trip_window(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    support::set_trip_dates(&pool, "2020-01-01", "2020-01-02").await;
    support::claim_member(&pool, support::ORGANIZER_ID, "1234", "active").await;
    let app = support::app(pool.clone());
    let join_body = join_room(&app).await;
    let join_session_token = join_body["joinSessionToken"].as_str().unwrap();

    let response = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!(
                    "/api/v1/trips/{}/member-sessions",
                    support::TRIP_ID
                ))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "memberId": support::ORGANIZER_ID,
                        "participantPassword": "1234",
                        "joinSessionToken": join_session_token
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);
}

#[sqlx::test(migrations = "../../migrations")]
async fn join_session_contract_rejects_bad_join_and_disabled_or_wrong_login(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    support::set_trip_dates(&pool, "2026-06-01", "2026-06-30").await;
    support::claim_member(&pool, support::VIEWER_ID, "1234", "disabled").await;
    support::claim_member(&pool, support::ORGANIZER_ID, "1234", "active").await;
    let app = support::app(pool.clone());

    let bad_join = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/trip-join-sessions")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({"joinCode":"HK-SZ-2025","tripPassword":"wrong"}).to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(bad_join.status(), StatusCode::UNAUTHORIZED);
    let join_body = join_room(&app).await;
    let join_session_token = join_body["joinSessionToken"].as_str().unwrap();

    sqlx::query("update trip_members set access_status = 'disabled' where id = $1")
        .bind(uuid::Uuid::parse_str(support::TRAVELER_ID).unwrap())
        .execute(&pool)
        .await
        .unwrap();
    let disabled_claim = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!(
                    "/api/v1/trips/{}/members/{}/claims",
                    support::TRIP_ID,
                    support::TRAVELER_ID
                ))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({"participantPassword":"1234","joinSessionToken":join_session_token})
                        .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(disabled_claim.status(), StatusCode::FORBIDDEN);

    let response = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!(
                    "/api/v1/trips/{}/member-sessions",
                    support::TRIP_ID
                ))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "memberId": support::VIEWER_ID,
                        "participantPassword":"1234",
                        "joinSessionToken": join_session_token
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::FORBIDDEN);

    let wrong_password = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!(
                    "/api/v1/trips/{}/member-sessions",
                    support::TRIP_ID
                ))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "memberId": support::ORGANIZER_ID,
                        "participantPassword":"wrong",
                        "joinSessionToken": join_session_token
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(wrong_password.status(), StatusCode::UNAUTHORIZED);

    let correct_after_wrong_password = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!(
                    "/api/v1/trips/{}/member-sessions",
                    support::TRIP_ID
                ))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "memberId": support::ORGANIZER_ID,
                        "participantPassword":"1234",
                        "joinSessionToken": join_session_token
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(correct_after_wrong_password.status(), StatusCode::OK);
}

#[sqlx::test(migrations = "../../migrations")]
async fn join_session_contract_rejects_short_participant_password(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    let app = support::app(pool.clone());
    let join_body = join_room(&app).await;
    let join_session_token = join_body["joinSessionToken"].as_str().unwrap();

    let response = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!(
                    "/api/v1/trips/{}/members/{}/claims",
                    support::TRIP_ID,
                    support::TRAVELER_ID
                ))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({"participantPassword":"123","joinSessionToken":join_session_token})
                        .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::BAD_REQUEST);
}
