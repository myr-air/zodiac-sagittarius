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
async fn itinerary_create_contract_accepts_end_time_without_start_time(pool: sqlx::PgPool) {
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
                        "clientMutationId": "web-create-end-time-only",
                        "planVariantId": support::PLAN_ID,
                        "day": "2025-05-16",
                        "endTime": "22:00",
                        "activity": "Hotel lights-out target",
                        "activityType": "stay",
                        "place": "Hotel"
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
    assert_eq!(body["startTime"], "");
    assert_eq!(body["endTime"], "22:00");
    assert_eq!(body["endOffsetDays"], 0);
    assert_eq!(body["durationMinutes"], Value::Null);
}

#[sqlx::test(migrations = "../../migrations")]
async fn itinerary_create_contract_rejects_end_offset_without_end_time(pool: sqlx::PgPool) {
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
                        "clientMutationId": "web-create-offset-without-end-time",
                        "planVariantId": support::PLAN_ID,
                        "day": "2025-05-16",
                        "startTime": "23:00",
                        "endOffsetDays": 1,
                        "activity": "Late transfer",
                        "activityType": "travel",
                        "place": "Airport"
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
async fn itinerary_create_contract_rejects_sub_activity_plan_block(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    let token = support::create_session(&pool, support::ORGANIZER_ID).await;
    let app = support::app(pool.clone());

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
                        "clientMutationId": "web-create-sub-activity-block",
                        "planVariantId": support::PLAN_ID,
                        "parentItemId": support::ITEM_ID,
                        "isPlanBlock": true,
                        "day": "2025-05-16",
                        "startTime": "09:15",
                        "activity": "Impossible nested block",
                        "activityType": "travel",
                        "place": "Station"
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

    let stored_count: i64 = sqlx::query_scalar(
        "select count(*)
         from itinerary_items
         where activity = 'Impossible nested block'",
    )
    .fetch_one(&pool)
    .await
    .unwrap();
    assert_eq!(stored_count, 0);
}

#[sqlx::test(migrations = "../../migrations")]
async fn itinerary_create_contract_rejects_parent_from_another_plan(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    let alt_item_id = support::seed_alt_plan_item(&pool).await;
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
                        "clientMutationId": "web-create-parent-other-plan",
                        "planVariantId": support::PLAN_ID,
                        "parentItemId": alt_item_id,
                        "day": "2025-05-16",
                        "startTime": "09:15",
                        "activity": "Impossible child",
                        "activityType": "travel",
                        "place": "Station"
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
async fn itinerary_create_contract_rejects_parent_from_another_day(pool: sqlx::PgPool) {
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
                        "clientMutationId": "web-create-parent-other-day",
                        "planVariantId": support::PLAN_ID,
                        "parentItemId": support::ITEM_ID,
                        "day": "2025-05-17",
                        "startTime": "09:15",
                        "activity": "Wrong day child",
                        "activityType": "travel",
                        "place": "Station"
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
async fn itinerary_create_contract_sub_activity_inherits_parent_path(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    let token = support::create_session(&pool, support::ORGANIZER_ID).await;
    let app = support::app(pool);

    let parent = app
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
                        "clientMutationId": "web-create-alt-parent",
                        "planVariantId": support::PLAN_ID,
                        "pathGroupId": "group-flight",
                        "pathId": "path-2025-05-16-sub-a",
                        "pathName": "Plan A",
                        "pathRole": "alternative",
                        "day": "2025-05-16",
                        "startTime": "07:00",
                        "activity": "Flight to Hong Kong",
                        "activityType": "travel",
                        "place": "BKK"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(parent.status(), StatusCode::OK);
    let parent_body: Value =
        serde_json::from_slice(&to_bytes(parent.into_body(), 65536).await.unwrap()).unwrap();

    let child = app
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
                        "clientMutationId": "web-create-alt-child",
                        "planVariantId": support::PLAN_ID,
                        "parentItemId": parent_body["id"].as_str().unwrap(),
                        "day": "2025-05-16",
                        "startTime": "08:00",
                        "activity": "Check in",
                        "activityType": "travel",
                        "place": "BKK"
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
    assert_eq!(child_body["pathGroupId"], "group-flight");
    assert_eq!(child_body["pathId"], "path-2025-05-16-sub-a");
    assert_eq!(child_body["pathName"], "Plan A");
    assert_eq!(child_body["pathRole"], "alternative");
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
