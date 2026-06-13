mod support;

use axum::body::{Body, to_bytes};
use http::{Method, Request, StatusCode, header};
use serde_json::{Value, json};
use tower::ServiceExt;
use uuid::Uuid;

#[sqlx::test(migrations = "../../migrations")]
async fn expenses_contract_create_without_item_defaults_to_current_main_plan(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    let organizer = support::create_session(&pool, support::ORGANIZER_ID).await;
    let app = support::app(pool.clone());

    let response = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/trips/{}/expenses", support::TRIP_ID))
                .header(header::AUTHORIZATION, format!("Bearer {organizer}"))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "clientMutationId": "web-expense-main-default",
                        "title": "Unlinked deposit",
                        "amountMinor": 5000,
                        "currency": "HKD",
                        "paidBy": support::OWNER_ID,
                        "category": "settlement",
                        "splits": { support::OWNER_ID: 5000 }
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
    assert_eq!(body["tripPlanId"], support::PLAN_ID);
    assert_eq!(body["itineraryItemId"], Value::Null);

    let stored: (Uuid, Option<Uuid>) = sqlx::query_as(
        "select trip_plan_id, itinerary_item_id
         from expenses
         where id = $1",
    )
    .bind(Uuid::parse_str(body["id"].as_str().unwrap()).unwrap())
    .fetch_one(&pool)
    .await
    .unwrap();
    assert_eq!(stored.0, Uuid::parse_str(support::PLAN_ID).unwrap());
    assert_eq!(stored.1, None);
}

#[sqlx::test(migrations = "../../migrations")]
async fn expenses_contract_patch_relinks_to_new_item_plan(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    support::seed_expense(&pool).await;
    let alt_item_id = support::seed_alt_plan_item(&pool).await;
    let organizer = support::create_session(&pool, support::ORGANIZER_ID).await;
    let app = support::app(pool.clone());

    let response = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::PATCH)
                .uri(format!(
                    "/api/v1/trips/{}/expenses/{}",
                    support::TRIP_ID,
                    support::EXPENSE_ID
                ))
                .header(header::AUTHORIZATION, format!("Bearer {organizer}"))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "clientMutationId": "web-expense-cross-plan-relink",
                        "expectedVersion": 1,
                        "itineraryItemId": alt_item_id
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
    assert_eq!(body["tripPlanId"], support::ALT_PLAN_ID);
    assert_eq!(body["itineraryItemId"], alt_item_id.to_string());
    assert_eq!(body["version"], 2);

    let stored: (Uuid, Uuid, i64) = sqlx::query_as(
        "select trip_plan_id, itinerary_item_id, version
         from expenses
         where id = $1",
    )
    .bind(Uuid::parse_str(support::EXPENSE_ID).unwrap())
    .fetch_one(&pool)
    .await
    .unwrap();
    assert_eq!(stored.0, Uuid::parse_str(support::ALT_PLAN_ID).unwrap());
    assert_eq!(stored.1, alt_item_id);
    assert_eq!(stored.2, 2);

    let clear_item = app
        .oneshot(
            Request::builder()
                .method(Method::PATCH)
                .uri(format!(
                    "/api/v1/trips/{}/expenses/{}",
                    support::TRIP_ID,
                    support::EXPENSE_ID
                ))
                .header(header::AUTHORIZATION, format!("Bearer {organizer}"))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "clientMutationId": "web-expense-clear-item-link",
                        "expectedVersion": 2,
                        "itineraryItemId": null
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(clear_item.status(), StatusCode::OK);
    let body: Value =
        serde_json::from_slice(&to_bytes(clear_item.into_body(), 65536).await.unwrap()).unwrap();
    assert_eq!(body["tripPlanId"], support::ALT_PLAN_ID);
    assert_eq!(body["itineraryItemId"], Value::Null);
    assert_eq!(body["version"], 3);

    let stored: (Uuid, Option<Uuid>, i64) = sqlx::query_as(
        "select trip_plan_id, itinerary_item_id, version
         from expenses
         where id = $1",
    )
    .bind(Uuid::parse_str(support::EXPENSE_ID).unwrap())
    .fetch_one(&pool)
    .await
    .unwrap();
    assert_eq!(stored.0, Uuid::parse_str(support::ALT_PLAN_ID).unwrap());
    assert_eq!(stored.1, None);
    assert_eq!(stored.2, 3);
}

#[sqlx::test(migrations = "../../migrations")]
async fn expenses_contract_patch_repairs_legacy_null_trip_plan_id(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    support::seed_expense(&pool).await;
    let organizer = support::create_session(&pool, support::ORGANIZER_ID).await;
    let app = support::app(pool.clone());

    sqlx::query(
        "update expenses
         set trip_plan_id = null,
             itinerary_item_id = null
         where id = $1",
    )
    .bind(Uuid::parse_str(support::EXPENSE_ID).unwrap())
    .execute(&pool)
    .await
    .unwrap();

    let response = app
        .oneshot(
            Request::builder()
                .method(Method::PATCH)
                .uri(format!(
                    "/api/v1/trips/{}/expenses/{}",
                    support::TRIP_ID,
                    support::EXPENSE_ID
                ))
                .header(header::AUTHORIZATION, format!("Bearer {organizer}"))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "clientMutationId": "web-expense-legacy-null-repair",
                        "expectedVersion": 1,
                        "title": "Legacy unscoped expense repaired"
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
    assert_eq!(body["tripPlanId"], support::PLAN_ID);
    assert_eq!(body["itineraryItemId"], Value::Null);
    assert_eq!(body["version"], 2);

    let stored: (Uuid, Option<Uuid>, i64) = sqlx::query_as(
        "select trip_plan_id, itinerary_item_id, version
         from expenses
         where id = $1",
    )
    .bind(Uuid::parse_str(support::EXPENSE_ID).unwrap())
    .fetch_one(&pool)
    .await
    .unwrap();
    assert_eq!(stored.0, Uuid::parse_str(support::PLAN_ID).unwrap());
    assert_eq!(stored.1, None);
    assert_eq!(stored.2, 2);
}

#[sqlx::test(migrations = "../../migrations")]
async fn expenses_contract_rejects_trip_plan_that_conflicts_with_item_plan(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    let alt_item_id = support::seed_alt_plan_item(&pool).await;
    let organizer = support::create_session(&pool, support::ORGANIZER_ID).await;
    let app = support::app(pool.clone());

    let response = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/trips/{}/expenses", support::TRIP_ID))
                .header(header::AUTHORIZATION, format!("Bearer {organizer}"))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "clientMutationId": "web-expense-mismatched-plan",
                        "tripPlanId": support::PLAN_ID,
                        "title": "Alt plan ticket",
                        "amountMinor": 12000,
                        "currency": "HKD",
                        "paidBy": support::OWNER_ID,
                        "category": "tickets",
                        "splits": { support::OWNER_ID: 12000 },
                        "itineraryItemId": alt_item_id
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
         from expenses
         where title = 'Alt plan ticket'",
    )
    .fetch_one(&pool)
    .await
    .unwrap();
    assert_eq!(stored_count, 0);
}
