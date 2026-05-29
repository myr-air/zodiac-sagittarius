mod support;

use axum::body::{Body, to_bytes};
use http::{Method, Request, StatusCode, header};
use serde_json::{Value, json};
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

#[sqlx::test(migrations = "../../migrations")]
async fn join_session_contract_hides_hashes_and_claim_creates_session(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    let app = support::app(pool.clone());

    let join_response = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/v1/trips/join")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({"joinId":" hk-sz-2025 ","tripPassword":"dim-sum-run"}).to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(join_response.status(), StatusCode::OK);
    let join_body: Value =
        serde_json::from_slice(&to_bytes(join_response.into_body(), 65536).await.unwrap()).unwrap();
    assert_eq!(join_body["trip"]["id"], support::TRIP_ID);
    assert_eq!(join_body["trip"]["joinId"], "HK-SZ-2025");
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
                    "/v1/trips/{}/members/{}/claim",
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
    let app = support::app(pool);

    let response = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!(
                    "/v1/trips/{}/members/{}/claim",
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

    assert_eq!(response.status(), StatusCode::BAD_REQUEST);
}

#[sqlx::test(migrations = "../../migrations")]
async fn join_session_contract_disabled_member_cannot_login(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    support::claim_member(&pool, support::VIEWER_ID, "1234", "disabled").await;
    let app = support::app(pool);

    let response = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!(
                    "/v1/trips/{}/members/{}/login",
                    support::TRIP_ID,
                    support::VIEWER_ID
                ))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({"participantPassword":"1234"}).to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::FORBIDDEN);
}
