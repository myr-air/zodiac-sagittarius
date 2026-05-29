mod support;

use axum::body::{Body, to_bytes};
use http::{Method, Request, StatusCode, header};
use serde_json::Value;
use tower::ServiceExt;

#[sqlx::test(migrations = "../../migrations")]
async fn trip_load_contract_returns_cockpit_payload_and_filters_private_tasks(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    let traveler_token = support::create_session(&pool, support::TRAVELER_ID).await;
    support::seed_tasks(&pool).await;
    let app = support::app(pool);

    let response = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(format!("/v1/trips/{}", support::TRIP_ID))
                .header(header::AUTHORIZATION, format!("Bearer {traveler_token}"))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);
    let body: Value =
        serde_json::from_slice(&to_bytes(response.into_body(), 131072).await.unwrap()).unwrap();

    assert_eq!(body["trip"]["id"], support::TRIP_ID);
    assert_eq!(body["trip"]["joinPasswordHash"], Value::Null);
    assert_eq!(body["members"].as_array().unwrap().len(), 4);
    assert_eq!(body["planVariants"].as_array().unwrap().len(), 1);
    assert_eq!(body["itineraryItems"][0]["id"], support::ITEM_ID);
    assert_eq!(body["suggestions"].as_array().unwrap().len(), 0);

    let tasks = body["tasks"].as_array().unwrap();
    let mut task_titles: Vec<&str> = tasks
        .iter()
        .map(|task| task["title"].as_str().unwrap())
        .collect();
    task_titles.sort_unstable();
    assert_eq!(task_titles, vec!["Book Peak Tram", "Buy eSIM"]);
    assert!(tasks.iter().any(|task| task["visibility"] == "shared"));
    assert!(
        tasks
            .iter()
            .any(|task| task["createdBy"] == support::TRAVELER_ID)
    );
    assert!(tasks.iter().all(|task| {
        task["visibility"] == "shared"
            || task["createdBy"] == support::TRAVELER_ID
            || task["assigneeId"] == support::TRAVELER_ID
    }));
    assert!(
        tasks
            .iter()
            .all(|task| task["title"] != "Private owner task")
    );
    assert_eq!(body["expenseSummary"]["groupSpend"].as_f64(), Some(0.0));
    assert!(body["expenseSummary"]["netByMember"].is_object());
}

#[sqlx::test(migrations = "../../migrations")]
async fn trip_load_contract_viewer_hides_expense_summary_and_private_tasks(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    let viewer_token = support::create_session(&pool, support::VIEWER_ID).await;
    support::seed_tasks(&pool).await;
    let app = support::app(pool);

    let response = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(format!("/v1/trips/{}", support::TRIP_ID))
                .header(header::AUTHORIZATION, format!("Bearer {viewer_token}"))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);
    let body: Value =
        serde_json::from_slice(&to_bytes(response.into_body(), 131072).await.unwrap()).unwrap();

    assert_eq!(body["expenseSummary"], Value::Null);
    let tasks = body["tasks"].as_array().unwrap();
    let task_titles: Vec<&str> = tasks
        .iter()
        .map(|task| task["title"].as_str().unwrap())
        .collect();
    assert_eq!(task_titles, vec!["Book Peak Tram"]);
    assert!(tasks.iter().all(|task| task["visibility"] == "shared"));
}

#[sqlx::test(migrations = "../../migrations")]
async fn trip_load_contract_requires_bearer_session(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    let app = support::app(pool);

    let response = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(format!("/v1/trips/{}", support::TRIP_ID))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
}
