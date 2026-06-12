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
            "activePlanVariantId": support::PLAN_ID,
            "mainTripPlanId": support::PLAN_ID
        },
        "items": [
            {
                "id": "import-flight-block",
                "pathGroupId": "group-hkg-arrival",
                "pathId": "path-main",
                "pathName": "Main arrival",
                "pathRole": "main",
                "itemKind": "travel",
                "timeMode": "scheduled",
                "isPlanBlock": true,
                "status": "confirmed",
                "priority": "must",
                "day": "2026-06-19",
                "sortOrder": 100,
                "startTime": "23:00",
                "endTime": "02:00",
                "endOffsetDays": 1,
                "activity": "Flight to Hong Kong",
                "activityType": "travel",
                "place": "BKK",
                "linkLabel": "Map",
                "mapLink": "https://maps.example.test",
                "durationMinutes": 180,
                "transportation": "Flight",
                "details": { "bookingRef": "QR349" },
                "advisories": [],
                "note": "Keep airport buffer"
            },
            {
                "id": "import-checkin",
                "pathGroupId": "group-hkg-arrival",
                "pathId": "path-rain",
                "pathName": "Rain arrival",
                "pathRole": "alternative",
                "parentItemId": "import-flight-block",
                "itemKind": "preparation",
                "timeMode": "flexible",
                "isPlanBlock": false,
                "status": "planned",
                "priority": "high",
                "day": "2026-06-19",
                "sortOrder": 200,
                "startTime": "",
                "endTime": null,
                "endOffsetDays": 0,
                "activity": "Check in online",
                "activityType": "travel",
                "place": "Hotel lobby",
                "linkLabel": "Map",
                "mapLink": "https://maps.example.test/checkin",
                "durationMinutes": null,
                "transportation": "",
                "details": {},
                "advisories": [],
                "note": "Sub-activity remains attached to the block"
            }
        ],
        "records": {
            "expenses": [
                {
                    "id": "import-expense",
                    "tripId": support::TRIP_ID,
                    "tripPlanId": support::PLAN_ID,
                    "title": "Imported ticket receipt",
                    "amount": 120,
                    "paidBy": support::ORGANIZER_ID,
                    "splits": { support::ORGANIZER_ID.to_string(): 120 },
                    "category": "tickets",
                    "itineraryItemId": "import-flight-block"
                }
            ],
            "bookingDocs": [
                {
                    "id": "import-booking",
                    "tripId": support::TRIP_ID,
                    "tripPlanId": support::PLAN_ID,
                    "type": "flight",
                    "title": "Imported flight ticket",
                    "status": "booked",
                    "visibility": "shared",
                    "travelerIds": [support::ORGANIZER_ID],
                    "externalLinks": [],
                    "relatedItineraryItemIds": ["import-flight-block"],
                    "relatedTaskIds": ["import-task"],
                    "relatedExpenseIds": ["import-expense"],
                    "noteIds": ["import-note"],
                    "createdBy": support::ORGANIZER_ID,
                    "updatedAt": "2026-06-04T12:00:00.000Z",
                    "version": 1
                }
            ],
            "stopNotes": [
                {
                    "id": "import-note",
                    "tripId": support::TRIP_ID,
                    "tripPlanId": support::PLAN_ID,
                    "itemId": "import-flight-block",
                    "authorId": support::ORGANIZER_ID,
                    "body": "Imported note",
                    "createdAt": "2026-06-04T12:00:00.000Z",
                    "version": 1
                }
            ],
            "tasks": [
                {
                    "id": "import-task",
                    "tripPlanId": support::PLAN_ID,
                    "title": "Confirm imported ticket",
                    "status": "open",
                    "visibility": "shared",
                    "kind": "booking",
                    "createdBy": support::ORGANIZER_ID,
                    "relatedItemId": "import-flight-block",
                    "version": 1
                }
            ]
        }
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
    assert_eq!(
        body["trip"]["activePlanVariantId"],
        support::PLAN_ID.to_string()
    );
    assert_eq!(body["trip"]["mainTripPlanId"], support::PLAN_ID.to_string());
    assert_eq!(body["items"][0]["activity"], "Flight to Hong Kong");
    assert_eq!(body["items"][0]["isPlanBlock"], true);
    assert_eq!(body["items"][0]["endTime"], "02:00");
    assert_eq!(body["items"][0]["endOffsetDays"], 1);
    assert_eq!(body["items"][1]["parentItemId"], "import-flight-block");
    assert_eq!(body["items"][1]["pathRole"], "alternative");
    assert_eq!(body["items"][1]["timeMode"], "flexible");
    assert_eq!(body["items"][1]["priority"], "high");
    assert_eq!(body["records"]["expenses"][0]["id"], "import-expense");
    assert_eq!(
        body["records"]["bookingDocs"][0]["relatedExpenseIds"][0],
        "import-expense"
    );
    assert_eq!(
        body["records"]["bookingDocs"][0]["relatedTaskIds"][0],
        "import-task"
    );
    assert_eq!(
        body["records"]["stopNotes"][0]["itemId"],
        "import-flight-block"
    );
    assert_eq!(
        body["records"]["tasks"][0]["relatedItemId"],
        "import-flight-block"
    );
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
