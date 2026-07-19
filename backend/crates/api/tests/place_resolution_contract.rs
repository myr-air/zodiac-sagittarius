mod support;

use axum::body::{Body, to_bytes};
use http::{Method, Request, StatusCode, header};
use serde_json::{Value, json};
use tower::ServiceExt;

#[test]
fn place_resolution_classifies_candidates_by_confidence() {
    use sagittarius_api::app::place_resolution::{
        PlaceCandidate, PlaceCoordinates, classify_candidates,
    };

    let high = PlaceCandidate {
        name: "Dim Dim Sum".to_string(),
        address: "The Elements, Hong Kong".to_string(),
        coordinates: PlaceCoordinates {
            lat: 22.3049,
            lng: 114.1617,
        },
        map_link:
            "https://www.openstreetmap.org/?mlat=22.3049&mlon=114.1617#map=17/22.3049/114.1617"
                .to_string(),
        confidence: 0.92,
        source: "nominatim".to_string(),
        evidence: vec!["brave: Dim Dim Sum Elements".to_string()],
    };
    let low = PlaceCandidate {
        confidence: 0.61,
        ..high.clone()
    };

    assert_eq!(classify_candidates(vec![high]).status, "resolved");
    assert_eq!(classify_candidates(vec![low]).status, "ambiguous");
    assert_eq!(classify_candidates(Vec::new()).status, "unresolved");
}

#[sqlx::test(migrations = "../../migrations")]
async fn place_resolution_returns_unresolved_when_disabled(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    let token = support::create_session(&pool, support::ORGANIZER_ID).await;
    let app = support::app(pool);

    let response = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/trips/{}/places/resolve", support::TRIP_ID))
                .header(header::AUTHORIZATION, format!("Bearer {token}"))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "clientMutationId": "resolve-disabled",
                        "activity": "Dim Dim Sum",
                        "placeHint": "ติ่มซำ แถว Elements",
                        "destinationLabel": "Hong Kong + Shenzhen",
                        "countries": ["HK"],
                        "day": "2026-06-19"
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
    assert_eq!(body["status"], "unresolved");
    assert_eq!(body["candidates"].as_array().unwrap().len(), 0);
}

#[sqlx::test(migrations = "../../migrations")]
async fn place_resolution_requires_edit_itinerary_capability(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    let token = support::create_session(&pool, support::VIEWER_ID).await;
    let app = support::app(pool);

    let response = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/trips/{}/places/resolve", support::TRIP_ID))
                .header(header::AUTHORIZATION, format!("Bearer {token}"))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "clientMutationId": "resolve-forbidden",
                        "activity": "Coffee",
                        "placeHint": "Central",
                        "destinationLabel": "Hong Kong",
                        "countries": ["HK"],
                        "day": "2026-06-19"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::FORBIDDEN);
}
