mod support;

use axum::body::{Body, to_bytes};
use http::{Method, Request, StatusCode, header};
use serde_json::{Value, json};
use tower::ServiceExt;

#[sqlx::test(migrations = "../../migrations")]
async fn traveler_can_list_daily_briefings_for_trip_window(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    let traveler_token = support::create_session(&pool, support::TRAVELER_ID).await;
    let app = support::app(pool);

    let response = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(format!(
                    "/api/v1/trips/{}/daily-briefings",
                    support::TRIP_ID
                ))
                .header(header::AUTHORIZATION, format!("Bearer {traveler_token}"))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);
    let body: Value =
        serde_json::from_slice(&to_bytes(response.into_body(), 131072).await.unwrap()).unwrap();
    let briefings = body.as_array().expect("briefings should be an array");

    assert_eq!(briefings.len(), 32);
    assert!(
        briefings
            .iter()
            .any(|briefing| briefing["date"] == "2026-05-31")
    );
    assert!(
        briefings
            .iter()
            .any(|briefing| briefing["date"] == "2026-06-30")
    );
    assert!(
        briefings
            .iter()
            .any(|briefing| briefing["date"] == "2026-07-01")
    );
    assert!(briefings[0].get("manualOverrides").is_some());
    assert_eq!(
        briefings[0]["weather"]["conditionLabel"],
        "Forecast pending"
    );
}

#[sqlx::test(migrations = "../../migrations")]
async fn organizer_can_patch_manual_briefing_overrides(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    let organizer_token = support::create_session(&pool, support::ORGANIZER_ID).await;
    let app = support::app(pool);

    let list_response = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(format!(
                    "/api/v1/trips/{}/daily-briefings",
                    support::TRIP_ID
                ))
                .header(header::AUTHORIZATION, format!("Bearer {organizer_token}"))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(list_response.status(), StatusCode::OK);
    let list_body: Value =
        serde_json::from_slice(&to_bytes(list_response.into_body(), 131072).await.unwrap())
            .unwrap();
    let first = &list_body.as_array().unwrap()[0];
    let date = first["date"].as_str().unwrap();
    let version = first["version"].as_i64().unwrap();

    let patch_response = app
        .oneshot(
            Request::builder()
                .method(Method::PATCH)
                .uri(format!(
                    "/api/v1/trips/{}/daily-briefings/{date}",
                    support::TRIP_ID
                ))
                .header(header::AUTHORIZATION, format!("Bearer {organizer_token}"))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "clientMutationId": "daily-briefing-override-1",
                        "expectedVersion": version,
                        "dayTitle": "Dim sum and ferry",
                        "outfitAdvice": "Pack a compact umbrella and breathable shirt",
                        "festivalNote": "Check local waterfront events before leaving"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(patch_response.status(), StatusCode::OK);
    let body: Value =
        serde_json::from_slice(&to_bytes(patch_response.into_body(), 131072).await.unwrap())
            .unwrap();
    assert_eq!(body["manualOverrides"]["dayTitle"], "Dim sum and ferry");
    assert_eq!(
        body["manualOverrides"]["outfitAdvice"],
        "Pack a compact umbrella and breathable shirt"
    );
    assert_eq!(
        body["manualOverrides"]["festivalNote"],
        "Check local waterfront events before leaving"
    );
    assert_eq!(body["version"], version + 1);
}

#[sqlx::test(migrations = "../../migrations")]
async fn traveler_cannot_patch_manual_briefing_overrides(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    let traveler_token = support::create_session(&pool, support::TRAVELER_ID).await;
    let app = support::app(pool);

    let response = app
        .oneshot(
            Request::builder()
                .method(Method::PATCH)
                .uri(format!(
                    "/api/v1/trips/{}/daily-briefings/2026-06-01",
                    support::TRIP_ID
                ))
                .header(header::AUTHORIZATION, format!("Bearer {traveler_token}"))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "clientMutationId": "daily-briefing-override-denied",
                        "expectedVersion": 1,
                        "outfitAdvice": "Traveler should not be able to edit"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::FORBIDDEN);
}
