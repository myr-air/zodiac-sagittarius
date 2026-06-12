mod support;

use axum::body::{Body, to_bytes};
use http::{Method, Request, StatusCode, header};
use serde_json::{Value, json};
use tower::ServiceExt;

#[sqlx::test(migrations = "../../migrations")]
async fn itinerary_create_contract_accepts_address_and_coordinates(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    let token = support::create_session(&pool, support::ORGANIZER_ID).await;
    let app = support::app(pool);

    let response = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!(
                    "/api/v1/trips/{}/itinerary-items",
                    support::TRIP_ID
                ))
                .header(header::AUTHORIZATION, format!("Bearer {token}"))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "clientMutationId": "web-create-location",
                        "planVariantId": support::PLAN_ID,
                        "itemKind": "meal",
                        "timeMode": "scheduled",
                        "isPlanBlock": false,
                        "status": "booked",
                        "priority": "high",
                        "day": "2025-05-16",
                        "startTime": "11:30",
                        "activity": "Coffee break",
                        "activityType": "food",
                        "place": "Blue Bottle Coffee",
                        "address": "K11 Musea, Tsim Sha Tsui, Hong Kong",
                        "latitude": 22.2939,
                        "longitude": 114.1698,
                        "mapLink": "https://www.openstreetmap.org/?mlat=22.2939&mlon=114.1698#map=17/22.2939/114.1698",
                        "durationMinutes": 45,
                        "transportation": "walk",
                        "details": {
                            "kind": "food",
                            "meal": "breakfast",
                            "reservationName": "Mew"
                        },
                        "note": "near the waterfront"
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
    assert_eq!(body["activity"], "Coffee break");
    assert_eq!(body["itemKind"], "meal");
    assert_eq!(body["timeMode"], "scheduled");
    assert_eq!(body["isPlanBlock"], false);
    assert_eq!(body["status"], "booked");
    assert_eq!(body["priority"], "high");
    assert_eq!(body["address"], "K11 Musea, Tsim Sha Tsui, Hong Kong");
    assert_eq!(body["coordinates"]["lat"], 22.2939);
    assert_eq!(body["coordinates"]["lng"], 114.1698);
    assert_eq!(body["details"]["kind"], "food");
    assert_eq!(body["details"]["meal"], "breakfast");
    assert_eq!(body["details"]["reservationName"], "Mew");
}

#[sqlx::test(migrations = "../../migrations")]
async fn itinerary_create_contract_accepts_cross_day_time_window(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    let token = support::create_session(&pool, support::ORGANIZER_ID).await;
    let app = support::app(pool);

    let response = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!(
                    "/api/v1/trips/{}/itinerary-items",
                    support::TRIP_ID
                ))
                .header(header::AUTHORIZATION, format!("Bearer {token}"))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "clientMutationId": "web-create-cross-day-time-window",
                        "planVariantId": support::PLAN_ID,
                        "day": "2025-05-16",
                        "startTime": "23:00",
                        "endTime": "02:00",
                        "endOffsetDays": 1,
                        "activity": "Late flight transfer",
                        "activityType": "travel",
                        "place": "Airport",
                        "durationMinutes": 180,
                        "transportation": "taxi"
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
    assert_eq!(body["startTime"], "23:00");
    assert_eq!(body["endTime"], "02:00");
    assert_eq!(body["endOffsetDays"], 1);
}

#[sqlx::test(migrations = "../../migrations")]
async fn itinerary_create_contract_rejects_nested_sub_activity(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    let token = support::create_session(&pool, support::ORGANIZER_ID).await;
    let app = support::app(pool);

    let child = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!(
                    "/api/v1/trips/{}/itinerary-items",
                    support::TRIP_ID
                ))
                .header(header::AUTHORIZATION, format!("Bearer {token}"))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "clientMutationId": "web-create-sub-activity",
                        "planVariantId": support::PLAN_ID,
                        "parentItemId": support::ITEM_ID,
                        "day": "2025-05-16",
                        "startTime": "09:15",
                        "activity": "Check platform",
                        "activityType": "travel",
                        "place": "Station"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(child.status(), StatusCode::OK);
    let child_body: Value =
        serde_json::from_slice(&to_bytes(child.into_body(), 65536).await.unwrap()).unwrap();

    let grandchild = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!(
                    "/api/v1/trips/{}/itinerary-items",
                    support::TRIP_ID
                ))
                .header(header::AUTHORIZATION, format!("Bearer {token}"))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "clientMutationId": "web-create-nested-sub-activity",
                        "planVariantId": support::PLAN_ID,
                        "parentItemId": child_body["id"].as_str().unwrap(),
                        "day": "2025-05-16",
                        "startTime": "09:20",
                        "activity": "Find gate",
                        "activityType": "travel",
                        "place": "Station"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(grandchild.status(), StatusCode::BAD_REQUEST);
}

#[sqlx::test(migrations = "../../migrations")]
async fn itinerary_create_contract_rejects_unsafe_map_link(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    let token = support::create_session(&pool, support::ORGANIZER_ID).await;
    let app = support::app(pool);

    let response = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!(
                    "/api/v1/trips/{}/itinerary-items",
                    support::TRIP_ID
                ))
                .header(header::AUTHORIZATION, format!("Bearer {token}"))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "clientMutationId": "web-create-unsafe-map-link",
                        "planVariantId": support::PLAN_ID,
                        "day": "2026-06-19",
                        "startTime": "11:30",
                        "activity": "Coffee break",
                        "activityType": "food",
                        "place": "Blue Bottle Coffee",
                        "mapLink": "javascript:alert(document.domain)",
                        "durationMinutes": 45,
                        "transportation": "walk",
                        "note": "near the waterfront"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::BAD_REQUEST);
}
