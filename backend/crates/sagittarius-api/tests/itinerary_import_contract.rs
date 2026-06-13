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
            "mainTripPlanId": support::PLAN_ID,
            "tripPlans": [
                {
                    "id": support::PLAN_ID,
                    "tripId": support::TRIP_ID,
                    "name": "Main",
                    "kind": "main",
                    "status": "main",
                    "description": "Primary plan",
                    "version": 1
                }
            ]
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
    assert_eq!(
        body["trip"]["tripPlans"][0]["id"],
        support::PLAN_ID.to_string()
    );
    assert_eq!(
        body["trip"]["planVariants"][0]["id"],
        support::PLAN_ID.to_string()
    );
    assert_eq!(body["trip"]["planVariants"], body["trip"]["tripPlans"]);
    assert_eq!(body["trip"]["tripPlans"][0]["kind"], "main");
    assert_eq!(body["trip"]["tripPlans"][0]["status"], "main");
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
async fn itinerary_import_contract_rejects_invalid_hierarchy(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    let token = support::create_session(&pool, support::ORGANIZER_ID).await;
    let app = support::app(pool);

    async fn import_status(app: &axum::Router, token: &str, source: Value) -> StatusCode {
        app.clone()
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
            .unwrap()
            .status()
    }

    let source = base_import_source(json!([
        import_item("block-1", "2026-06-19", Value::Null, false),
        import_item("child-1", "2026-06-19", "block-1", false),
    ]));
    let ok = app
        .clone()
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
    assert_eq!(ok.status(), StatusCode::OK);
    let body: Value =
        serde_json::from_slice(&to_bytes(ok.into_body(), 131072).await.unwrap()).unwrap();
    assert_eq!(body["items"][0]["isPlanBlock"], true);
    assert_eq!(body["items"][1]["isPlanBlock"], false);

    let grandchild = base_import_source(json!([
        import_item("block-1", "2026-06-19", Value::Null, true),
        import_item("child-1", "2026-06-19", "block-1", false),
        import_item("grandchild-1", "2026-06-19", "child-1", false),
    ]));
    let cross_day = base_import_source(json!([
        import_item("block-1", "2026-06-19", Value::Null, true),
        import_item("child-1", "2026-06-20", "block-1", false),
    ]));
    let missing_parent = base_import_source(json!([import_item(
        "child-1",
        "2026-06-19",
        "missing-block",
        false
    ),]));
    let duplicate_item_id = base_import_source(json!([
        import_item("dup-item", "2026-06-19", Value::Null, false),
        import_item("dup-item", "2026-06-19", Value::Null, false),
    ]));

    assert_eq!(
        import_status(&app, &token, grandchild).await,
        StatusCode::BAD_REQUEST
    );
    assert_eq!(
        import_status(&app, &token, cross_day).await,
        StatusCode::BAD_REQUEST
    );
    assert_eq!(
        import_status(&app, &token, missing_parent).await,
        StatusCode::BAD_REQUEST
    );
    assert_eq!(
        import_status(&app, &token, duplicate_item_id).await,
        StatusCode::BAD_REQUEST
    );
}

#[sqlx::test(migrations = "../../migrations")]
async fn itinerary_import_contract_accepts_compatible_plan_metadata(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    let token = support::create_session(&pool, support::ORGANIZER_ID).await;
    let app = support::app(pool);

    let mut legacy_only = base_import_source(json!([import_item(
        "legacy-1",
        "2026-06-19",
        Value::Null,
        true
    )]));
    legacy_only["trip"]
        .as_object_mut()
        .unwrap()
        .remove("mainTripPlanId");

    let mut canonical_only = base_import_source(json!([import_item(
        "canonical-1",
        "2026-06-19",
        Value::Null,
        true
    )]));
    canonical_only["trip"]
        .as_object_mut()
        .unwrap()
        .remove("activePlanVariantId");

    let mut neither = base_import_source(json!([import_item(
        "neither-1",
        "2026-06-19",
        Value::Null,
        true
    )]));
    neither["trip"]
        .as_object_mut()
        .unwrap()
        .remove("activePlanVariantId");
    neither["trip"]
        .as_object_mut()
        .unwrap()
        .remove("mainTripPlanId");

    for source in [legacy_only, canonical_only, neither] {
        let response = app
            .clone()
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
        assert_eq!(
            body["trip"]["activePlanVariantId"],
            support::PLAN_ID.to_string()
        );
        assert_eq!(body["trip"]["mainTripPlanId"], support::PLAN_ID.to_string());
    }
}

#[sqlx::test(migrations = "../../migrations")]
async fn itinerary_import_contract_conflicting_source_plan_aliases_do_not_switch_main_plan(
    pool: sqlx::PgPool,
) {
    support::seed_trip(&pool).await;
    let token = support::create_session(&pool, support::ORGANIZER_ID).await;
    let app = support::app(pool.clone());
    let mut source = base_import_source(json!([import_item(
        "conflict-source-1",
        "2026-06-19",
        Value::Null,
        true
    )]));
    source["trip"]["activePlanVariantId"] = json!("018f4e82-3000-7c00-b111-0000000000a1");
    source["trip"]["mainTripPlanId"] = json!("018f4e82-3000-7c00-b111-0000000000a2");

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
    assert_eq!(
        body["trip"]["activePlanVariantId"],
        support::PLAN_ID.to_string()
    );
    assert_eq!(body["trip"]["mainTripPlanId"], support::PLAN_ID.to_string());
    assert_eq!(body["items"][0]["id"], "conflict-source-1");

    let stored_main_plan_id: uuid::Uuid =
        sqlx::query_scalar("select active_plan_variant_id from trips where id = $1")
            .bind(uuid::Uuid::parse_str(support::TRIP_ID).unwrap())
            .fetch_one(&pool)
            .await
            .unwrap();
    assert_eq!(
        stored_main_plan_id,
        uuid::Uuid::parse_str(support::PLAN_ID).unwrap()
    );
}

#[sqlx::test(migrations = "../../migrations")]
async fn itinerary_import_contract_rejects_dangling_record_references(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    let token = support::create_session(&pool, support::ORGANIZER_ID).await;
    let app = support::app(pool);

    async fn import_status(app: &axum::Router, token: &str, source: Value) -> StatusCode {
        app.clone()
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
            .unwrap()
            .status()
    }

    let items = json!([import_item("block-1", "2026-06-19", Value::Null, true)]);
    let record_cases = [
        json!({
            "expenses": [
                {
                    "id": "expense-1",
                    "title": "Missing item receipt",
                    "itineraryItemId": "missing-item"
                }
            ],
            "bookingDocs": [],
            "stopNotes": [],
            "tasks": []
        }),
        json!({
            "expenses": [],
            "bookingDocs": [],
            "stopNotes": [],
            "tasks": [
                {
                    "id": "task-1",
                    "title": "Missing item task",
                    "relatedItemId": "missing-item"
                }
            ]
        }),
        json!({
            "expenses": [],
            "bookingDocs": [],
            "stopNotes": [
                {
                    "id": "note-1",
                    "itemId": "missing-item",
                    "body": "Missing item note"
                }
            ],
            "tasks": []
        }),
        json!({
            "expenses": [
                {
                    "id": "expense-1",
                    "title": "Valid receipt",
                    "itineraryItemId": "block-1"
                }
            ],
            "bookingDocs": [
                {
                    "id": "booking-1",
                    "relatedItineraryItemIds": ["block-1"],
                    "relatedTaskIds": ["missing-task"],
                    "relatedExpenseIds": ["expense-1"],
                    "noteIds": []
                }
            ],
            "stopNotes": [],
            "tasks": []
        }),
        json!({
            "expenses": [],
            "bookingDocs": [
                {
                    "id": "booking-1",
                    "relatedItineraryItemIds": ["missing-item"],
                    "relatedTaskIds": [],
                    "relatedExpenseIds": [],
                    "noteIds": []
                }
            ],
            "stopNotes": [],
            "tasks": []
        }),
        json!({
            "expenses": [
                {
                    "id": "expense-1",
                    "title": "Duplicate A",
                    "itineraryItemId": "block-1"
                },
                {
                    "id": "expense-1",
                    "title": "Duplicate B",
                    "itineraryItemId": "block-1"
                }
            ],
            "bookingDocs": [],
            "stopNotes": [],
            "tasks": []
        }),
        json!({
            "expenses": [],
            "bookingDocs": [],
            "stopNotes": [
                {
                    "id": "note-1",
                    "body": "Missing required item id"
                }
            ],
            "tasks": []
        }),
        json!({
            "expenses": { "id": "expense-1" },
            "bookingDocs": [],
            "stopNotes": [],
            "tasks": []
        }),
    ];

    for records in record_cases {
        assert_eq!(
            import_status(
                &app,
                &token,
                base_import_source_with_records(items.clone(), records)
            )
            .await,
            StatusCode::BAD_REQUEST
        );
    }
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

fn base_import_source(items: Value) -> Value {
    base_import_source_with_records(
        items,
        json!({
            "expenses": [],
            "bookingDocs": [],
            "stopNotes": [],
            "tasks": []
        }),
    )
}

fn base_import_source_with_records(items: Value, records: Value) -> Value {
    json!({
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
            "mainTripPlanId": support::PLAN_ID,
            "tripPlans": []
        },
        "items": items,
        "records": records
    })
}

fn import_item(
    id: &str,
    day: &str,
    parent_item_id: impl Into<Value>,
    is_plan_block: bool,
) -> Value {
    json!({
        "id": id,
        "pathGroupId": null,
        "pathId": null,
        "pathName": null,
        "pathRole": null,
        "parentItemId": parent_item_id.into(),
        "itemKind": "activity",
        "timeMode": "scheduled",
        "isPlanBlock": is_plan_block,
        "status": "planned",
        "priority": "normal",
        "day": day,
        "sortOrder": 100,
        "startTime": "09:00",
        "endTime": null,
        "endOffsetDays": 0,
        "activity": format!("Import item {id}"),
        "activityType": "experience",
        "place": "Central",
        "linkLabel": "Map",
        "mapLink": "",
        "coordinates": null,
        "address": null,
        "durationMinutes": 60,
        "transportation": "",
        "details": {},
        "advisories": [],
        "note": ""
    })
}
