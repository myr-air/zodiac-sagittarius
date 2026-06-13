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
                            "endTime": "11:30",
                            "endOffsetDays": 1,
                            "durationMinutes": 75,
                            "details": {
                                "kind": "transportation",
                                "origin": "Tsim Sha Tsui",
                                "destination": "Disneyland",
                                "mode": "MTR"
                            }
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
    assert_eq!(ok_body["endTime"], "11:30");
    assert_eq!(ok_body["endOffsetDays"], 1);
    assert_eq!(ok_body["details"]["kind"], "transportation");
    assert_eq!(ok_body["details"]["origin"], "Tsim Sha Tsui");
    assert_eq!(ok_body["details"]["destination"], "Disneyland");
    assert_eq!(ok_body["details"]["mode"], "MTR");
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
async fn itinerary_patch_contract_patches_address_and_coordinates(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    let token = support::create_session(&pool, support::ORGANIZER_ID).await;
    let app = support::app(pool.clone());

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
                        "clientMutationId": "web-patch-location",
                        "expectedVersion": 4,
                        "patch": {
                            "address": "Shop G72, G/F, The Elements, Hong Kong",
                            "latitude": 22.3049,
                            "longitude": 114.1617,
                            "mapLink": "https://www.openstreetmap.org/?mlat=22.3049&mlon=114.1617#map=17/22.3049/114.1617"
                        }
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
    assert_eq!(body["address"], "Shop G72, G/F, The Elements, Hong Kong");
    assert_eq!(body["coordinates"]["lat"], 22.3049);
    assert_eq!(body["coordinates"]["lng"], 114.1617);
    assert!(
        body["mapLink"]
            .as_str()
            .unwrap()
            .contains("openstreetmap.org")
    );

    let stored: (Option<String>, Option<f64>, Option<f64>) = sqlx::query_as(
        "select address, latitude::float8, longitude::float8 from itinerary_items where id = $1",
    )
    .bind(Uuid::parse_str(support::ITEM_ID).unwrap())
    .fetch_one(&pool)
    .await
    .unwrap();
    assert_eq!(
        stored.0.as_deref(),
        Some("Shop G72, G/F, The Elements, Hong Kong")
    );
    assert_eq!(stored.1, Some(22.3049));
    assert_eq!(stored.2, Some(114.1617));
}

#[sqlx::test(migrations = "../../migrations")]
async fn itinerary_patch_contract_rejects_clearing_end_time_with_offset(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    let token = support::create_session(&pool, support::ORGANIZER_ID).await;
    let app = support::app(pool.clone());

    let cross_day = app
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
                        "clientMutationId": "web-patch-cross-day-first",
                        "expectedVersion": 4,
                        "patch": {
                            "endTime": "02:00",
                            "endOffsetDays": 1
                        }
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(cross_day.status(), StatusCode::OK);

    let rejected = app
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
                        "clientMutationId": "web-patch-clear-end-time-offset-stale",
                        "expectedVersion": 5,
                        "patch": {
                            "endTime": null
                        }
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(rejected.status(), StatusCode::BAD_REQUEST);
    let body: Value =
        serde_json::from_slice(&to_bytes(rejected.into_body(), 65536).await.unwrap()).unwrap();
    assert_eq!(body["code"], "invalid_request");

    let stored: (Option<String>, i32, i64) = sqlx::query_as(
        "select to_char(end_time, 'HH24:MI') as end_time, end_offset_days, version
         from itinerary_items
         where id = $1",
    )
    .bind(Uuid::parse_str(support::ITEM_ID).unwrap())
    .fetch_one(&pool)
    .await
    .unwrap();
    assert_eq!(stored.0.as_deref(), Some("02:00"));
    assert_eq!(stored.1, 1);
    assert_eq!(stored.2, 5);
}

#[sqlx::test(migrations = "../../migrations")]
async fn itinerary_patch_contract_clears_end_time_and_duration(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    let token = support::create_session(&pool, support::ORGANIZER_ID).await;
    let app = support::app(pool.clone());

    let cross_day = app
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
                        "clientMutationId": "web-patch-clearable-window-first",
                        "expectedVersion": 4,
                        "patch": {
                            "endTime": "02:00",
                            "endOffsetDays": 1,
                            "durationMinutes": 180
                        }
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(cross_day.status(), StatusCode::OK);

    let cleared = app
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
                        "clientMutationId": "web-patch-clear-window-duration",
                        "expectedVersion": 5,
                        "patch": {
                            "endTime": null,
                            "endOffsetDays": 0,
                            "durationMinutes": null
                        }
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(cleared.status(), StatusCode::OK);
    let body: Value =
        serde_json::from_slice(&to_bytes(cleared.into_body(), 65536).await.unwrap()).unwrap();
    assert_eq!(body["endTime"], Value::Null);
    assert_eq!(body["endOffsetDays"], 0);
    assert_eq!(body["durationMinutes"], Value::Null);

    let stored: (Option<String>, i32, Option<i32>, i64) = sqlx::query_as(
        "select to_char(end_time, 'HH24:MI') as end_time,
                end_offset_days,
                duration_minutes,
                version
         from itinerary_items
         where id = $1",
    )
    .bind(Uuid::parse_str(support::ITEM_ID).unwrap())
    .fetch_one(&pool)
    .await
    .unwrap();
    assert_eq!(stored.0, None);
    assert_eq!(stored.1, 0);
    assert_eq!(stored.2, None);
    assert_eq!(stored.3, 6);
}

#[sqlx::test(migrations = "../../migrations")]
async fn itinerary_patch_contract_normalizes_raw_end_offset_drift_on_load(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    sqlx::query(
        "update itinerary_items
         set end_time = null, end_offset_days = 3
         where id = $1",
    )
    .bind(Uuid::parse_str(support::ITEM_ID).unwrap())
    .execute(&pool)
    .await
    .unwrap();
    let token = support::create_session(&pool, support::TRAVELER_ID).await;
    let app = support::app(pool.clone());

    let response = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(format!("/api/v1/trips/{}", support::TRIP_ID))
                .header(header::AUTHORIZATION, format!("Bearer {token}"))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);
    let body: Value =
        serde_json::from_slice(&to_bytes(response.into_body(), 131072).await.unwrap()).unwrap();
    let item = body["itineraryItems"]
        .as_array()
        .unwrap()
        .iter()
        .find(|item| item["id"] == support::ITEM_ID)
        .unwrap();
    assert_eq!(item["endTime"], Value::Null);
    assert_eq!(item["endOffsetDays"], 0);
}

#[sqlx::test(migrations = "../../migrations")]
async fn itinerary_patch_contract_accepts_end_time_without_start_time(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    let token = support::create_session(&pool, support::ORGANIZER_ID).await;
    let app = support::app(pool.clone());

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
                        "clientMutationId": "web-patch-end-time-only",
                        "expectedVersion": 4,
                        "patch": {
                            "startTime": null,
                            "endTime": "22:00",
                            "endOffsetDays": 0
                        }
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

    let stored: (Option<String>, Option<String>, i64) = sqlx::query_as(
        "select to_char(start_time, 'HH24:MI') as start_time,
                to_char(end_time, 'HH24:MI') as end_time,
                version
         from itinerary_items
         where id = $1",
    )
    .bind(Uuid::parse_str(support::ITEM_ID).unwrap())
    .fetch_one(&pool)
    .await
    .unwrap();
    assert_eq!(stored.0, None);
    assert_eq!(stored.1.as_deref(), Some("22:00"));
    assert_eq!(stored.2, 5);
}

#[sqlx::test(migrations = "../../migrations")]
async fn itinerary_patch_contract_rejects_unsafe_map_link(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    let token = support::create_session(&pool, support::ORGANIZER_ID).await;
    let app = support::app(pool.clone());

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
                        "clientMutationId": "web-patch-unsafe-map-link",
                        "expectedVersion": 4,
                        "patch": {
                            "mapLink": "javascript:alert(document.domain)"
                        }
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::BAD_REQUEST);
}

#[sqlx::test(migrations = "../../migrations")]
async fn itinerary_patch_contract_traveler_can_patch_v1_item_fields(pool: sqlx::PgPool) {
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
                            "startTime": "09:00",
                            "itemKind": "meal",
                            "timeMode": "scheduled",
                            "status": "planned",
                            "priority": "must"
                        }
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(response.status(), StatusCode::OK);
    let body: serde_json::Value =
        serde_json::from_slice(&to_bytes(response.into_body(), 65536).await.unwrap()).unwrap();
    assert_eq!(body["startTime"], "09:00");
    assert_eq!(body["itemKind"], "meal");
    assert_eq!(body["status"], "planned");
    assert_eq!(body["priority"], "must");
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
async fn itinerary_patch_contract_rejects_activity_block_becoming_sub_activity(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    let token = support::create_session(&pool, support::ORGANIZER_ID).await;
    let app = support::app(pool);

    let child = create_itinerary_item(
        &app,
        &token,
        "web-create-child-for-block-patch",
        json!({
            "parentItemId": support::ITEM_ID,
            "activity": "Queue for table",
            "startTime": "08:45",
            "place": "The Elements"
        }),
    )
    .await;
    assert_eq!(child["parentItemId"], support::ITEM_ID);

    let target_parent = create_itinerary_item(
        &app,
        &token,
        "web-create-target-parent-for-block-patch",
        json!({
            "activity": "Nearby coffee",
            "startTime": "09:30",
            "place": "Kowloon Station"
        }),
    )
    .await;

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
                        "clientMutationId": "web-patch-block-into-child",
                        "expectedVersion": 4,
                        "patch": {
                            "parentItemId": target_parent["id"]
                        }
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::BAD_REQUEST);
}

#[sqlx::test(migrations = "../../migrations")]
async fn itinerary_patch_contract_rejects_activity_block_day_move_without_children(
    pool: sqlx::PgPool,
) {
    support::seed_trip(&pool).await;
    let token = support::create_session(&pool, support::ORGANIZER_ID).await;
    let app = support::app(pool);

    let child = create_itinerary_item(
        &app,
        &token,
        "web-create-child-for-day-move",
        json!({
            "parentItemId": support::ITEM_ID,
            "activity": "Queue for table",
            "startTime": "08:45",
            "place": "The Elements"
        }),
    )
    .await;
    assert_eq!(child["parentItemId"], support::ITEM_ID);

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
                        "clientMutationId": "web-patch-block-day-without-child",
                        "expectedVersion": 4,
                        "patch": {
                            "day": "2025-05-17"
                        }
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::BAD_REQUEST);
}

#[sqlx::test(migrations = "../../migrations")]
async fn itinerary_patch_contract_rejects_sub_activity_becoming_plan_block(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    let token = support::create_session(&pool, support::ORGANIZER_ID).await;
    let app = support::app(pool.clone());

    let child = create_itinerary_item(
        &app,
        &token,
        "web-create-child-for-block-toggle",
        json!({
            "parentItemId": support::ITEM_ID,
            "activity": "Queue for table",
            "startTime": "08:45",
            "place": "The Elements"
        }),
    )
    .await;
    let child_id = child["id"].as_str().unwrap();

    let response = app
        .oneshot(
            Request::builder()
                .method(Method::PATCH)
                .uri(format!(
                    "/api/v1/trips/{}/itinerary-items/{child_id}",
                    support::TRIP_ID
                ))
                .header(header::AUTHORIZATION, format!("Bearer {token}"))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "clientMutationId": "web-patch-child-to-plan-block",
                        "expectedVersion": 1,
                        "patch": {
                            "isPlanBlock": true
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

    let stored: (bool, i64) =
        sqlx::query_as("select is_plan_block, version from itinerary_items where id = $1")
            .bind(Uuid::parse_str(child_id).unwrap())
            .fetch_one(&pool)
            .await
            .unwrap();
    assert_eq!(stored.0, false);
    assert_eq!(stored.1, 1);
}

#[sqlx::test(migrations = "../../migrations")]
async fn itinerary_patch_contract_rejects_non_block_parent(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    let token = support::create_session(&pool, support::ORGANIZER_ID).await;
    let app = support::app(pool);

    let child = create_itinerary_item(
        &app,
        &token,
        "web-create-child-before-non-block-parent",
        json!({
            "parentItemId": support::ITEM_ID,
            "activity": "Queue for table",
            "startTime": "08:45",
            "place": "The Elements"
        }),
    )
    .await;
    let plain_parent = create_itinerary_item(
        &app,
        &token,
        "web-create-plain-parent-for-patch",
        json!({
            "activity": "Plain activity",
            "startTime": "09:30",
            "place": "Cafe"
        }),
    )
    .await;
    assert_eq!(plain_parent["isPlanBlock"], false);

    let response = app
        .oneshot(
            Request::builder()
                .method(Method::PATCH)
                .uri(format!(
                    "/api/v1/trips/{}/itinerary-items/{}",
                    support::TRIP_ID,
                    child["id"].as_str().unwrap()
                ))
                .header(header::AUTHORIZATION, format!("Bearer {token}"))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "clientMutationId": "web-patch-child-under-plain-parent",
                        "expectedVersion": 1,
                        "patch": {
                            "parentItemId": plain_parent["id"]
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
async fn itinerary_patch_contract_rejects_parent_from_another_plan(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    let alt_item_id = support::seed_alt_plan_item(&pool).await;
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
                        "clientMutationId": "web-patch-parent-other-plan",
                        "expectedVersion": 4,
                        "patch": {
                            "parentItemId": alt_item_id
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
async fn itinerary_patch_contract_rejects_parent_from_another_day(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    let token = support::create_session(&pool, support::ORGANIZER_ID).await;
    let app = support::app(pool);

    let day_two_item = create_itinerary_item(
        &app,
        &token,
        "web-create-day-two-parent",
        json!({
            "day": "2025-05-17",
            "activity": "Day two hotel breakfast",
            "startTime": "08:00",
            "place": "Hotel"
        }),
    )
    .await;

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
                        "clientMutationId": "web-patch-parent-other-day",
                        "expectedVersion": 4,
                        "patch": {
                            "parentItemId": day_two_item["id"]
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
async fn itinerary_patch_contract_rejects_child_only_alternative_path_change(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    let token = support::create_session(&pool, support::ORGANIZER_ID).await;
    let app = support::app(pool);

    let child = create_itinerary_item(
        &app,
        &token,
        "web-create-child-for-path-mismatch",
        json!({
            "parentItemId": support::ITEM_ID,
            "activity": "Queue for table",
            "startTime": "08:45",
            "place": "The Elements"
        }),
    )
    .await;

    let response = app
        .oneshot(
            Request::builder()
                .method(Method::PATCH)
                .uri(format!(
                    "/api/v1/trips/{}/itinerary-items/{}",
                    support::TRIP_ID,
                    child["id"].as_str().unwrap()
                ))
                .header(header::AUTHORIZATION, format!("Bearer {token}"))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "clientMutationId": "web-patch-child-path-mismatch",
                        "expectedVersion": 1,
                        "patch": {
                            "pathGroupId": "group-child-only",
                            "pathId": "path-2025-05-16-sub-a",
                            "pathName": "Plan A",
                            "pathRole": "alternative"
                        }
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::BAD_REQUEST);
}

#[sqlx::test(migrations = "../../migrations")]
async fn itinerary_patch_contract_parent_path_change_cascades_to_sub_activities(
    pool: sqlx::PgPool,
) {
    support::seed_trip(&pool).await;
    let token = support::create_session(&pool, support::ORGANIZER_ID).await;
    let app = support::app(pool.clone());

    let child = create_itinerary_item(
        &app,
        &token,
        "web-create-child-for-path-cascade",
        json!({
            "parentItemId": support::ITEM_ID,
            "activity": "Queue for table",
            "startTime": "08:45",
            "place": "The Elements"
        }),
    )
    .await;
    let child_id = Uuid::parse_str(child["id"].as_str().unwrap()).unwrap();

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
                        "clientMutationId": "web-patch-parent-path-cascade",
                        "expectedVersion": 4,
                        "patch": {
                            "pathGroupId": "group-flight",
                            "pathId": "path-2025-05-16-sub-a",
                            "pathName": "Plan A",
                            "pathRole": "alternative"
                        }
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);

    let stored_child: (
        Option<String>,
        Option<String>,
        Option<String>,
        Option<String>,
        i64,
    ) = sqlx::query_as(
        "select path_group_id, path_id, path_name, path_role, version
             from itinerary_items
             where id = $1",
    )
    .bind(child_id)
    .fetch_one(&pool)
    .await
    .unwrap();
    assert_eq!(stored_child.0.as_deref(), Some("group-flight"));
    assert_eq!(stored_child.1.as_deref(), Some("path-2025-05-16-sub-a"));
    assert_eq!(stored_child.2.as_deref(), Some("Plan A"));
    assert_eq!(stored_child.3.as_deref(), Some("alternative"));
    assert_eq!(stored_child.4, 2);
}

#[sqlx::test(migrations = "../../migrations")]
async fn itinerary_patch_contract_deletes_leaf_activity(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    let token = support::create_session(&pool, support::ORGANIZER_ID).await;
    let app = support::app(pool.clone());

    let response = app
        .oneshot(
            Request::builder()
                .method(Method::DELETE)
                .uri(format!(
                    "/api/v1/trips/{}/itinerary-items/{}",
                    support::TRIP_ID,
                    support::ITEM_ID
                ))
                .header(header::AUTHORIZATION, format!("Bearer {token}"))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);
    let body: Value =
        serde_json::from_slice(&to_bytes(response.into_body(), 65536).await.unwrap()).unwrap();
    assert_eq!(body["id"], support::ITEM_ID);
    assert_eq!(body["version"], 5);

    let stored: (Option<String>, i64) = sqlx::query_as(
        "select deleted_at::text, version
         from itinerary_items
         where id = $1",
    )
    .bind(Uuid::parse_str(support::ITEM_ID).unwrap())
    .fetch_one(&pool)
    .await
    .unwrap();
    assert!(stored.0.is_some());
    assert_eq!(stored.1, 5);
}

#[sqlx::test(migrations = "../../migrations")]
async fn itinerary_patch_contract_rejects_deleting_activity_block_with_sub_activities(
    pool: sqlx::PgPool,
) {
    support::seed_trip(&pool).await;
    let token = support::create_session(&pool, support::ORGANIZER_ID).await;
    let app = support::app(pool.clone());

    let child = create_itinerary_item(
        &app,
        &token,
        "web-create-child-before-delete-block",
        json!({
            "parentItemId": support::ITEM_ID,
            "activity": "Queue for table",
            "startTime": "08:45",
            "place": "The Elements"
        }),
    )
    .await;
    assert_eq!(child["parentItemId"], support::ITEM_ID);

    let response = app
        .oneshot(
            Request::builder()
                .method(Method::DELETE)
                .uri(format!(
                    "/api/v1/trips/{}/itinerary-items/{}",
                    support::TRIP_ID,
                    support::ITEM_ID
                ))
                .header(header::AUTHORIZATION, format!("Bearer {token}"))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::BAD_REQUEST);
    let body: Value =
        serde_json::from_slice(&to_bytes(response.into_body(), 65536).await.unwrap()).unwrap();
    assert_eq!(body["code"], "invalid_request");

    let stored: (Option<String>, i64) = sqlx::query_as(
        "select deleted_at::text, version
         from itinerary_items
         where id = $1",
    )
    .bind(Uuid::parse_str(support::ITEM_ID).unwrap())
    .fetch_one(&pool)
    .await
    .unwrap();
    assert_eq!(stored.0, None);
    assert_eq!(stored.1, 4);
}

#[sqlx::test(migrations = "../../migrations")]
async fn itinerary_reorder_contract_rejects_partial_or_child_first_day_order(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    let token = support::create_session(&pool, support::ORGANIZER_ID).await;
    let app = support::app(pool.clone());

    let child = create_itinerary_item(
        &app,
        &token,
        "web-reorder-create-child",
        json!({
            "parentItemId": support::ITEM_ID,
            "activity": "Queue for table",
            "startTime": "08:45",
            "place": "The Elements"
        }),
    )
    .await;
    let top_level = create_itinerary_item(
        &app,
        &token,
        "web-reorder-create-top-level",
        json!({
            "activity": "Nearby coffee",
            "startTime": "09:30",
            "place": "Kowloon Station"
        }),
    )
    .await;
    let child_id = child["id"].as_str().unwrap();
    let top_level_id = top_level["id"].as_str().unwrap();

    let partial = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::PATCH)
                .uri(format!(
                    "/api/v1/trips/{}/itinerary-items/order",
                    support::TRIP_ID
                ))
                .header(header::AUTHORIZATION, format!("Bearer {token}"))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "clientMutationId": "web-reorder-partial-day",
                        "planVariantId": support::PLAN_ID,
                        "day": "2025-05-16",
                        "itemIds": [top_level_id, support::ITEM_ID]
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(partial.status(), StatusCode::BAD_REQUEST);

    let child_first = app
        .oneshot(
            Request::builder()
                .method(Method::PATCH)
                .uri(format!(
                    "/api/v1/trips/{}/itinerary-items/order",
                    support::TRIP_ID
                ))
                .header(header::AUTHORIZATION, format!("Bearer {token}"))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "clientMutationId": "web-reorder-child-first",
                        "planVariantId": support::PLAN_ID,
                        "day": "2025-05-16",
                        "itemIds": [child_id, support::ITEM_ID, top_level_id]
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(child_first.status(), StatusCode::BAD_REQUEST);

    let stored: Vec<(Uuid, i32)> = sqlx::query_as(
        "select id, sort_order
         from itinerary_items
         where id = any($1)
         order by id",
    )
    .bind(vec![
        Uuid::parse_str(support::ITEM_ID).unwrap(),
        Uuid::parse_str(child_id).unwrap(),
        Uuid::parse_str(top_level_id).unwrap(),
    ])
    .fetch_all(&pool)
    .await
    .unwrap();
    let sort_by_id: std::collections::HashMap<Uuid, i32> = stored.into_iter().collect();
    assert_eq!(sort_by_id[&Uuid::parse_str(support::ITEM_ID).unwrap()], 100);
    assert_eq!(sort_by_id[&Uuid::parse_str(child_id).unwrap()], 110);
    assert_eq!(
        sort_by_id[&Uuid::parse_str(top_level_id).unwrap()],
        top_level["sortOrder"].as_i64().unwrap() as i32
    );
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

async fn create_itinerary_item(
    app: &axum::Router,
    token: &str,
    client_mutation_id: &str,
    overrides: Value,
) -> Value {
    let mut body = json!({
        "clientMutationId": client_mutation_id,
        "planVariantId": support::PLAN_ID,
        "day": "2025-05-16",
        "activity": "Generated activity",
        "activityType": "food",
        "place": "The Elements"
    });
    let body_object = body.as_object_mut().unwrap();
    for (key, value) in overrides.as_object().unwrap() {
        body_object.insert(key.clone(), value.clone());
    }

    let response = app
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
                .body(Body::from(body.to_string()))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);
    serde_json::from_slice(&to_bytes(response.into_body(), 65536).await.unwrap()).unwrap()
}
