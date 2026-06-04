mod support;

use axum::body::{Body, to_bytes};
use http::{Method, Request, StatusCode, header};
use serde_json::{Value, json};
use tower::ServiceExt;

#[sqlx::test(migrations = "../../migrations")]
async fn itinerary_import_contract_organizer_can_normalize_json_import(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    let token = support::create_session(&pool, support::ORGANIZER_ID).await;
    let app = support::app(pool);

    let source = json!({
        "schema": "joii.itinerary.export",
        "version": 1,
        "exportedAt": "2026-06-04T12:00:00.000Z",
        "trip": {
            "id": support::TRIP_ID,
            "name": "Hong Kong + Shenzhen Trip",
            "destinationLabel": "Hong Kong + Shenzhen",
            "startDate": "2026-06-18",
            "endDate": "2026-06-23",
            "activePlanVariantId": support::PLAN_ID
        },
        "items": [{
            "id": "import-stop-1",
            "day": "2026-06-19",
            "sortOrder": 100,
            "startTime": "09:15",
            "activity": "Imported breakfast",
            "activityType": "food",
            "place": "Central",
            "linkLabel": "Map",
            "mapLink": "https://maps.example.test",
            "durationMinutes": 45,
            "transportation": "MTR",
            "advisories": [],
            "note": "From text file"
        }]
    });

    let response = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!(
                    "/api/v1/trips/{}/itinerary-imports",
                    support::TRIP_ID
                ))
                .header(header::AUTHORIZATION, format!("Bearer {token}"))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "fileName": "itinerary.json",
                        "contentType": "application/json",
                        "mode": "json",
                        "content": source.to_string()
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);
    let body: Value =
        serde_json::from_slice(&to_bytes(response.into_body(), 131072).await.unwrap()).unwrap();
    assert_eq!(body["schema"], "joii.itinerary.export");
    assert_eq!(body["version"], 1);
    assert_eq!(body["source"], "json");
    assert_eq!(body["items"][0]["activity"], "Imported breakfast");
}

#[sqlx::test(migrations = "../../migrations")]
async fn itinerary_import_contract_traveler_cannot_import(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    let token = support::create_session(&pool, support::TRAVELER_ID).await;
    let app = support::app(pool);

    let response = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!(
                    "/api/v1/trips/{}/itinerary-imports",
                    support::TRIP_ID
                ))
                .header(header::AUTHORIZATION, format!("Bearer {token}"))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "fileName": "notes.txt",
                        "contentType": "text/plain",
                        "mode": "auto",
                        "content": "09:00 breakfast at Central"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::FORBIDDEN);
}
