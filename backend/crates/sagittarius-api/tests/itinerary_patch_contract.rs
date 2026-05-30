mod support;

use axum::body::{Body, to_bytes};
use http::{Method, Request, StatusCode, header};
use serde_json::{Value, json};
use tower::ServiceExt;
use uuid::Uuid;

#[sqlx::test(migrations = "../../migrations")]
async fn itinerary_patch_contract_organizer_can_patch_item_and_stale_patch_conflicts(
    pool: sqlx::PgPool,
) {
    support::seed_trip(&pool).await;
    let token = support::create_session(&pool, support::ORGANIZER_ID).await;
    let app = support::app(pool.clone());

    let ok = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::PATCH)
                .uri(format!(
                    "/api/v1/trips/{}/itinerary-items/{}",
                    support::TRIP_ID,
                    support::ITEM_ID
                ))
                .header(header::AUTHORIZATION, format!("Bearer {token}"))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "clientMutationId": "web-patch-1",
                        "expectedVersion": 4,
                        "patch": {
                            "startTime": "09:00",
                            "durationMinutes": 75
                        }
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(ok.status(), StatusCode::OK);
    let ok_body: Value =
        serde_json::from_slice(&to_bytes(ok.into_body(), 65536).await.unwrap()).unwrap();
    assert_eq!(ok_body["startTime"], "09:00");
    assert_eq!(ok_body["version"], 5);

    let event_count: i64 =
        sqlx::query_scalar("select count(*) from realtime_events where aggregate_id = $1")
            .bind(Uuid::parse_str(support::ITEM_ID).unwrap())
            .fetch_one(&pool)
            .await
            .unwrap();
    assert_eq!(event_count, 1);

    let stale = app
        .oneshot(
            Request::builder()
                .method(Method::PATCH)
                .uri(format!(
                    "/api/v1/trips/{}/itinerary-items/{}",
                    support::TRIP_ID,
                    support::ITEM_ID
                ))
                .header(header::AUTHORIZATION, format!("Bearer {token}"))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "clientMutationId": "web-patch-2",
                        "expectedVersion": 4,
                        "patch": {
                            "startTime": "10:00"
                        }
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(stale.status(), StatusCode::CONFLICT);
    let stale_body: Value =
        serde_json::from_slice(&to_bytes(stale.into_body(), 65536).await.unwrap()).unwrap();
    assert_eq!(stale_body["code"], "version_conflict");
    assert_eq!(stale_body["latest"]["id"], support::ITEM_ID);
    assert_eq!(stale_body["latest"]["version"], 5);
}

#[sqlx::test(migrations = "../../migrations")]
async fn itinerary_patch_contract_traveler_cannot_patch_item(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    let token = support::create_session(&pool, support::TRAVELER_ID).await;
    let app = support::app(pool);
    let response = app
        .oneshot(
            Request::builder()
                .method(Method::PATCH)
                .uri(format!(
                    "/api/v1/trips/{}/itinerary-items/{}",
                    support::TRIP_ID,
                    support::ITEM_ID
                ))
                .header(header::AUTHORIZATION, format!("Bearer {token}"))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "clientMutationId": "web-patch-3",
                        "expectedVersion": 4,
                        "patch": {
                            "startTime": "09:00"
                        }
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(response.status(), StatusCode::FORBIDDEN);
}

#[sqlx::test(migrations = "../../migrations")]
async fn itinerary_patch_contract_invalid_activity_type_returns_invalid_request(
    pool: sqlx::PgPool,
) {
    support::seed_trip(&pool).await;
    let token = support::create_session(&pool, support::ORGANIZER_ID).await;
    let app = support::app(pool);
    let response = app
        .oneshot(
            Request::builder()
                .method(Method::PATCH)
                .uri(format!(
                    "/api/v1/trips/{}/itinerary-items/{}",
                    support::TRIP_ID,
                    support::ITEM_ID
                ))
                .header(header::AUTHORIZATION, format!("Bearer {token}"))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "clientMutationId": "web-patch-invalid-type",
                        "expectedVersion": 4,
                        "patch": {
                            "activityType": "museum"
                        }
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::BAD_REQUEST);
    let body: Value =
        serde_json::from_slice(&to_bytes(response.into_body(), 65536).await.unwrap()).unwrap();
    assert_eq!(body["code"], "invalid_request");
}

#[sqlx::test(migrations = "../../migrations")]
async fn itinerary_patch_contract_duplicate_client_mutation_id_conflicts(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    let token = support::create_session(&pool, support::ORGANIZER_ID).await;
    let app = support::app(pool);

    let ok = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::PATCH)
                .uri(format!(
                    "/api/v1/trips/{}/itinerary-items/{}",
                    support::TRIP_ID,
                    support::ITEM_ID
                ))
                .header(header::AUTHORIZATION, format!("Bearer {token}"))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "clientMutationId": "web-patch-duplicate",
                        "expectedVersion": 4,
                        "patch": {
                            "startTime": "09:00"
                        }
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(ok.status(), StatusCode::OK);

    let duplicate = app
        .oneshot(
            Request::builder()
                .method(Method::PATCH)
                .uri(format!(
                    "/api/v1/trips/{}/itinerary-items/{}",
                    support::TRIP_ID,
                    support::ITEM_ID
                ))
                .header(header::AUTHORIZATION, format!("Bearer {token}"))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "clientMutationId": "web-patch-duplicate",
                        "expectedVersion": 5,
                        "patch": {
                            "startTime": "10:00"
                        }
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(duplicate.status(), StatusCode::CONFLICT);
}
