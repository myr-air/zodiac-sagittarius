mod support;

use axum::body::{Body, to_bytes};
use http::{Method, Request, StatusCode, header};
use serde_json::{Value, json};
use tower::ServiceExt;
use uuid::Uuid;

#[sqlx::test(migrations = "../../migrations")]
async fn organizer_can_create_patch_and_delete_booking_doc(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    support::seed_tasks(&pool).await;
    support::seed_stop_note(&pool).await;
    support::seed_expense(&pool).await;
    let organizer_token = support::create_session(&pool, support::ORGANIZER_ID).await;
    let app = support::app(pool);

    let create_response = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/trips/{}/bookings", support::TRIP_ID))
                .header(header::AUTHORIZATION, format!("Bearer {organizer_token}"))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "clientMutationId": "booking-create-route-1",
                        "type": "flight",
                        "title": "Airport flight",
                        "status": "confirmed",
                        "visibility": "shared",
                        "ownerMemberId": support::ORGANIZER_ID,
                        "providerName": "HK Express",
                        "confirmationCode": "UO-2026",
                        "startsAt": "2026-06-18T09:00:00+07:00",
                        "endsAt": "2026-06-18T12:00:00+07:00",
                        "timezone": "Asia/Bangkok",
                        "priceAmount": 2400.25,
                        "currency": "THB",
                        "travelerIds": [support::TRAVELER_ID],
                        "externalLinks": [
                            {
                                "label": "Drive",
                                "url": "https://drive.google.com/flight-a",
                                "provider": "Google Drive",
                                "accessNote": null
                            }
                        ],
                        "relatedItineraryItemIds": [support::ITEM_ID],
                        "relatedTaskIds": [],
                        "relatedExpenseIds": [support::EXPENSE_ID],
                        "noteIds": [support::STOP_NOTE_ID],
                        "notes": "Stored in cloud."
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(create_response.status(), StatusCode::OK);
    let created: Value =
        serde_json::from_slice(&to_bytes(create_response.into_body(), 131072).await.unwrap())
            .unwrap();
    let booking_id = created["id"].as_str().expect("booking id").to_string();
    let create_version = created["version"].as_i64().unwrap();
    assert_eq!(created["title"], "Airport flight");
    assert_eq!(created["tripPlanId"], support::PLAN_ID);
    assert_eq!(created["priceAmount"], 2400.25);
    assert_eq!(created["travelerIds"][0], support::TRAVELER_ID);
    assert_eq!(created["externalLinks"][0]["label"], "Drive");
    assert_eq!(created["relatedExpenseIds"][0], support::EXPENSE_ID);

    let cockpit_response = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(format!("/api/v1/trips/{}", support::TRIP_ID))
                .header(header::AUTHORIZATION, format!("Bearer {organizer_token}"))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(cockpit_response.status(), StatusCode::OK);
    let cockpit: Value = serde_json::from_slice(
        &to_bytes(cockpit_response.into_body(), 131072)
            .await
            .unwrap(),
    )
    .unwrap();
    let loaded_booking = cockpit["bookingDocs"]
        .as_array()
        .unwrap()
        .iter()
        .find(|booking| booking["id"] == booking_id)
        .expect("created booking is in cockpit");
    assert_eq!(loaded_booking["tripPlanId"], support::PLAN_ID);

    let patch_response = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::PATCH)
                .uri(format!(
                    "/api/v1/trips/{}/bookings/{booking_id}",
                    support::TRIP_ID
                ))
                .header(header::AUTHORIZATION, format!("Bearer {organizer_token}"))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "clientMutationId": "booking-patch-route-1",
                        "expectedVersion": create_version,
                        "patch": {
                            "title": "Airport flight updated",
                            "status": "paid",
                            "travelerIds": [support::ORGANIZER_ID, support::TRAVELER_ID],
                            "externalLinks": [
                                {
                                    "label": "Airline",
                                    "url": "https://example.com/manage-booking",
                                    "provider": "Airline",
                                    "accessNote": "Use confirmation code"
                                }
                            ],
                            "notes": null
                        }
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(patch_response.status(), StatusCode::OK);
    let patched: Value =
        serde_json::from_slice(&to_bytes(patch_response.into_body(), 131072).await.unwrap())
            .unwrap();
    let patch_version = patched["version"].as_i64().unwrap();
    assert_eq!(patched["title"], "Airport flight updated");
    assert_eq!(patched["status"], "paid");
    assert_eq!(patched["notes"], Value::Null);
    assert_eq!(patched["externalLinks"][0]["label"], "Airline");
    assert_eq!(patch_version, create_version + 1);

    let delete_response = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::DELETE)
                .uri(format!(
                    "/api/v1/trips/{}/bookings/{booking_id}",
                    support::TRIP_ID
                ))
                .header(header::AUTHORIZATION, format!("Bearer {organizer_token}"))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(delete_response.status(), StatusCode::OK);
    let deleted: Value =
        serde_json::from_slice(&to_bytes(delete_response.into_body(), 131072).await.unwrap())
            .unwrap();
    assert_eq!(deleted["id"], booking_id);
    assert_eq!(deleted["version"], patch_version + 1);

    let after_delete_response = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(format!("/api/v1/trips/{}", support::TRIP_ID))
                .header(header::AUTHORIZATION, format!("Bearer {organizer_token}"))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(after_delete_response.status(), StatusCode::OK);
    let after_delete: Value = serde_json::from_slice(
        &to_bytes(after_delete_response.into_body(), 131072)
            .await
            .unwrap(),
    )
    .unwrap();
    assert!(
        !after_delete["bookingDocs"]
            .as_array()
            .unwrap()
            .iter()
            .any(|booking| booking["id"] == booking_id)
    );
}

#[sqlx::test(migrations = "../../migrations")]
async fn booking_patch_relinks_to_new_item_plan(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    support::seed_booking_doc(&pool).await;
    let alt_item_id = support::seed_alt_plan_item(&pool).await;
    let organizer_token = support::create_session(&pool, support::ORGANIZER_ID).await;
    let app = support::app(pool.clone());

    let response = app
        .oneshot(
            Request::builder()
                .method(Method::PATCH)
                .uri(format!(
                    "/api/v1/trips/{}/bookings/{}",
                    support::TRIP_ID,
                    support::BOOKING_DOC_ID
                ))
                .header(header::AUTHORIZATION, format!("Bearer {organizer_token}"))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "clientMutationId": "booking-relink-alt-plan",
                        "expectedVersion": 1,
                        "patch": {
                            "relatedItineraryItemIds": [alt_item_id]
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
        serde_json::from_slice(&to_bytes(response.into_body(), 131072).await.unwrap()).unwrap();
    assert_eq!(body["tripPlanId"], support::ALT_PLAN_ID);
    assert_eq!(body["relatedItineraryItemIds"][0], alt_item_id.to_string());
    assert_eq!(body["version"], 2);

    let stored: (Uuid, i64) = sqlx::query_as(
        "select trip_plan_id, version
         from booking_docs
         where id = $1",
    )
    .bind(Uuid::parse_str(support::BOOKING_DOC_ID).unwrap())
    .fetch_one(&pool)
    .await
    .unwrap();
    assert_eq!(stored.0, Uuid::parse_str(support::ALT_PLAN_ID).unwrap());
    assert_eq!(stored.1, 2);

    let relation_count: i64 = sqlx::query_scalar(
        "select count(*)
         from booking_doc_itinerary_items
         where booking_doc_id = $1 and itinerary_item_id = $2",
    )
    .bind(Uuid::parse_str(support::BOOKING_DOC_ID).unwrap())
    .bind(alt_item_id)
    .fetch_one(&pool)
    .await
    .unwrap();
    assert_eq!(relation_count, 1);
}

#[sqlx::test(migrations = "../../migrations")]
async fn booking_patch_rejects_related_records_from_another_plan(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    support::seed_booking_doc(&pool).await;
    let alt_item_id = support::seed_alt_plan_item(&pool).await;
    let alt_task_id = Uuid::now_v7();
    let alt_expense_id = Uuid::now_v7();
    let alt_note_id = Uuid::now_v7();
    let trip_id = Uuid::parse_str(support::TRIP_ID).unwrap();
    let alt_plan_id = Uuid::parse_str(support::ALT_PLAN_ID).unwrap();
    let owner_id = Uuid::parse_str(support::OWNER_ID).unwrap();
    let traveler_id = Uuid::parse_str(support::TRAVELER_ID).unwrap();
    sqlx::query(
        "insert into trip_tasks (
           id, trip_id, trip_plan_id, title, status, visibility, kind, created_by, related_item_id
         )
         values ($1, $2, $3, 'Alt task', 'open', 'shared', 'booking', $4, $5)",
    )
    .bind(alt_task_id)
    .bind(trip_id)
    .bind(alt_plan_id)
    .bind(owner_id)
    .bind(alt_item_id)
    .execute(&pool)
    .await
    .unwrap();
    sqlx::query(
        "insert into expenses (
           id, trip_id, trip_plan_id, title, amount_minor, currency, paid_by, category, splits, itinerary_item_id
         )
         values ($1, $2, $3, 'Alt expense', 1000, 'HKD', $4, 'transport', $5, $6)",
    )
    .bind(alt_expense_id)
    .bind(trip_id)
    .bind(alt_plan_id)
    .bind(owner_id)
    .bind(json!({
        owner_id.to_string(): 500,
        traveler_id.to_string(): 500
    }))
    .bind(alt_item_id)
    .execute(&pool)
    .await
    .unwrap();
    sqlx::query(
        "insert into stop_notes (id, trip_id, trip_plan_id, itinerary_item_id, author_id, body, version)
         values ($1, $2, $3, $4, $5, 'Alt note', 1)",
    )
    .bind(alt_note_id)
    .bind(trip_id)
    .bind(alt_plan_id)
    .bind(alt_item_id)
    .bind(traveler_id)
    .execute(&pool)
    .await
    .unwrap();

    let organizer_token = support::create_session(&pool, support::ORGANIZER_ID).await;
    let app = support::app(pool.clone());
    let response = app
        .oneshot(
            Request::builder()
                .method(Method::PATCH)
                .uri(format!(
                    "/api/v1/trips/{}/bookings/{}",
                    support::TRIP_ID,
                    support::BOOKING_DOC_ID
                ))
                .header(header::AUTHORIZATION, format!("Bearer {organizer_token}"))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "clientMutationId": "booking-cross-plan-record-links",
                        "expectedVersion": 1,
                        "patch": {
                            "relatedTaskIds": [alt_task_id],
                            "relatedExpenseIds": [alt_expense_id],
                            "noteIds": [alt_note_id]
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
        serde_json::from_slice(&to_bytes(response.into_body(), 131072).await.unwrap()).unwrap();
    assert_eq!(body["code"], "invalid_request");

    let stored: (Uuid, i64) = sqlx::query_as(
        "select trip_plan_id, version
         from booking_docs
         where id = $1",
    )
    .bind(Uuid::parse_str(support::BOOKING_DOC_ID).unwrap())
    .fetch_one(&pool)
    .await
    .unwrap();
    assert_eq!(stored.0, Uuid::parse_str(support::PLAN_ID).unwrap());
    assert_eq!(stored.1, 1);
}

#[sqlx::test(migrations = "../../migrations")]
async fn booking_create_rejects_trip_plan_that_conflicts_with_item_plan(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    let alt_item_id = support::seed_alt_plan_item(&pool).await;
    let organizer_token = support::create_session(&pool, support::ORGANIZER_ID).await;
    let app = support::app(pool.clone());

    let response = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/trips/{}/bookings", support::TRIP_ID))
                .header(header::AUTHORIZATION, format!("Bearer {organizer_token}"))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "clientMutationId": "booking-create-mismatched-plan",
                        "tripPlanId": support::PLAN_ID,
                        "type": "train",
                        "title": "Alt plan train ticket",
                        "status": "booked",
                        "visibility": "shared",
                        "ownerMemberId": support::ORGANIZER_ID,
                        "providerName": "MTR",
                        "confirmationCode": "ALT-TRAIN",
                        "startsAt": null,
                        "endsAt": null,
                        "timezone": "Asia/Hong_Kong",
                        "priceAmount": 120,
                        "currency": "HKD",
                        "travelerIds": [support::TRAVELER_ID],
                        "externalLinks": [],
                        "relatedItineraryItemIds": [alt_item_id],
                        "relatedTaskIds": [],
                        "relatedExpenseIds": [],
                        "noteIds": [],
                        "notes": null
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::BAD_REQUEST);
    let body: Value =
        serde_json::from_slice(&to_bytes(response.into_body(), 131072).await.unwrap()).unwrap();
    assert_eq!(body["code"], "invalid_request");

    let stored_count: i64 = sqlx::query_scalar(
        "select count(*)
         from booking_docs
         where title = 'Alt plan train ticket'",
    )
    .fetch_one(&pool)
    .await
    .unwrap();
    assert_eq!(stored_count, 0);
}

#[sqlx::test(migrations = "../../migrations")]
async fn booking_create_rejects_related_records_from_another_plan(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    let alt_item_id = support::seed_alt_plan_item(&pool).await;
    let alt_task_id = Uuid::now_v7();
    let alt_expense_id = Uuid::now_v7();
    let alt_note_id = Uuid::now_v7();
    let trip_id = Uuid::parse_str(support::TRIP_ID).unwrap();
    let alt_plan_id = Uuid::parse_str(support::ALT_PLAN_ID).unwrap();
    let owner_id = Uuid::parse_str(support::OWNER_ID).unwrap();
    let traveler_id = Uuid::parse_str(support::TRAVELER_ID).unwrap();
    sqlx::query(
        "insert into trip_tasks (
           id, trip_id, trip_plan_id, title, status, visibility, kind, created_by, related_item_id
         )
         values ($1, $2, $3, 'Alt booking task', 'open', 'shared', 'booking', $4, $5)",
    )
    .bind(alt_task_id)
    .bind(trip_id)
    .bind(alt_plan_id)
    .bind(owner_id)
    .bind(alt_item_id)
    .execute(&pool)
    .await
    .unwrap();
    sqlx::query(
        "insert into expenses (
           id, trip_id, trip_plan_id, title, amount_minor, currency, paid_by, category, splits, itinerary_item_id
         )
         values ($1, $2, $3, 'Alt booking expense', 1000, 'HKD', $4, 'transport', $5, $6)",
    )
    .bind(alt_expense_id)
    .bind(trip_id)
    .bind(alt_plan_id)
    .bind(owner_id)
    .bind(json!({
        owner_id.to_string(): 500,
        traveler_id.to_string(): 500
    }))
    .bind(alt_item_id)
    .execute(&pool)
    .await
    .unwrap();
    sqlx::query(
        "insert into stop_notes (id, trip_id, trip_plan_id, itinerary_item_id, author_id, body, version)
         values ($1, $2, $3, $4, $5, 'Alt booking note', 1)",
    )
    .bind(alt_note_id)
    .bind(trip_id)
    .bind(alt_plan_id)
    .bind(alt_item_id)
    .bind(traveler_id)
    .execute(&pool)
    .await
    .unwrap();
    let organizer_token = support::create_session(&pool, support::ORGANIZER_ID).await;
    let app = support::app(pool.clone());

    let response = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/trips/{}/bookings", support::TRIP_ID))
                .header(header::AUTHORIZATION, format!("Bearer {organizer_token}"))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "clientMutationId": "booking-create-cross-plan-record-link",
                        "type": "hotel",
                        "title": "Main plan hotel with alt task",
                        "status": "booked",
                        "visibility": "shared",
                        "ownerMemberId": support::ORGANIZER_ID,
                        "providerName": "Hotel",
                        "confirmationCode": "MAIN-HOTEL",
                        "startsAt": null,
                        "endsAt": null,
                        "timezone": "Asia/Hong_Kong",
                        "priceAmount": 500,
                        "currency": "HKD",
                        "travelerIds": [support::TRAVELER_ID],
                        "externalLinks": [],
                        "relatedItineraryItemIds": [support::ITEM_ID],
                        "relatedTaskIds": [alt_task_id],
                        "relatedExpenseIds": [alt_expense_id],
                        "noteIds": [alt_note_id],
                        "notes": null
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::BAD_REQUEST);
    let body: Value =
        serde_json::from_slice(&to_bytes(response.into_body(), 131072).await.unwrap()).unwrap();
    assert_eq!(body["code"], "invalid_request");

    let stored_count: i64 = sqlx::query_scalar(
        "select count(*)
         from booking_docs
         where title = 'Main plan hotel with alt task'",
    )
    .fetch_one(&pool)
    .await
    .unwrap();
    assert_eq!(stored_count, 0);
}

#[sqlx::test(migrations = "../../migrations")]
async fn booking_create_rejects_duplicate_external_link_ids(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    support::seed_tasks(&pool).await;
    support::seed_stop_note(&pool).await;
    support::seed_expense(&pool).await;
    let organizer_token = support::create_session(&pool, support::ORGANIZER_ID).await;
    let app = support::app(pool);
    let duplicate_link_id = "018f4e88-1111-7000-8000-000000000001";

    let response = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/trips/{}/bookings", support::TRIP_ID))
                .header(header::AUTHORIZATION, format!("Bearer {organizer_token}"))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "clientMutationId": "booking-duplicate-link-id",
                        "type": "flight",
                        "title": "Airport flight",
                        "status": "confirmed",
                        "visibility": "shared",
                        "ownerMemberId": support::ORGANIZER_ID,
                        "providerName": "HK Express",
                        "confirmationCode": "UO-2026",
                        "startsAt": "2026-06-18T09:00:00+07:00",
                        "endsAt": null,
                        "timezone": "Asia/Bangkok",
                        "priceAmount": 2400,
                        "currency": "THB",
                        "travelerIds": [support::TRAVELER_ID],
                        "externalLinks": [
                            {
                                "id": duplicate_link_id,
                                "label": "Drive",
                                "url": "https://drive.google.com/flight-a",
                                "provider": "Google Drive",
                                "accessNote": null
                            },
                            {
                                "id": duplicate_link_id,
                                "label": "Airline",
                                "url": "https://example.com/flight-a",
                                "provider": "Airline",
                                "accessNote": null
                            }
                        ],
                        "relatedItineraryItemIds": [support::ITEM_ID],
                        "relatedTaskIds": [],
                        "relatedExpenseIds": [support::EXPENSE_ID],
                        "noteIds": [support::STOP_NOTE_ID],
                        "notes": "Stored in cloud."
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::BAD_REQUEST);
    let body: Value =
        serde_json::from_slice(&to_bytes(response.into_body(), 131072).await.unwrap()).unwrap();
    assert_eq!(body["code"], "invalid_request");
    assert_eq!(
        body["message"],
        "invalid request: booking doc external link ids must be unique"
    );
}
