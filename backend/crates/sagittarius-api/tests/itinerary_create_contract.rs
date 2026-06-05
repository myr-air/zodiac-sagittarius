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
                .uri(format!("/api/v1/trips/{}/itinerary-items", support::TRIP_ID))
                .header(header::AUTHORIZATION, format!("Bearer {token}"))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "clientMutationId": "web-create-location",
                        "planVariantId": support::PLAN_ID,
                        "day": "2026-06-19",
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
    assert_eq!(body["address"], "K11 Musea, Tsim Sha Tsui, Hong Kong");
    assert_eq!(body["coordinates"]["lat"], 22.2939);
    assert_eq!(body["coordinates"]["lng"], 114.1698);
}
