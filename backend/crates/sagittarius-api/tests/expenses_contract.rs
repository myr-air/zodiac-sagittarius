mod support;

use axum::body::{Body, to_bytes};
use http::{Method, Request, StatusCode, header};
use serde_json::{Value, json};
use tower::ServiceExt;
use uuid::Uuid;

#[sqlx::test(migrations = "../../migrations")]
async fn expenses_contract_patch_relinks_to_new_item_plan(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    support::seed_expense(&pool).await;
    let alt_item_id = support::seed_alt_plan_item(&pool).await;
    let organizer = support::create_session(&pool, support::ORGANIZER_ID).await;
    let app = support::app(pool.clone());

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
}
