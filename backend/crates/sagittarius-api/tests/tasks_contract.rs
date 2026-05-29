mod support;

use axum::body::{Body, to_bytes};
use http::{Method, Request, StatusCode, header};
use serde_json::{Value, json};
use tower::ServiceExt;
use uuid::Uuid;

#[sqlx::test(migrations = "../../migrations")]
async fn tasks_contract_traveler_creates_and_updates_own_private_task(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    let token = support::create_session(&pool, support::TRAVELER_ID).await;
    let app = support::app(pool.clone());

    let created = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/v1/trips/{}/tasks", support::TRIP_ID))
                .header(header::AUTHORIZATION, format!("Bearer {token}"))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "clientMutationId": "web-task-1",
                        "title": "Buy eSIM",
                        "visibility": "private",
                        "assigneeId": support::ORGANIZER_ID
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(created.status(), StatusCode::CREATED);
    let body: Value =
        serde_json::from_slice(&to_bytes(created.into_body(), 65536).await.unwrap()).unwrap();
    let task_id = body["id"].as_str().unwrap();
    assert_eq!(body["assigneeId"], json!(support::TRAVELER_ID));
    assert_eq!(body["version"], json!(1));

    let updated = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::PATCH)
                .uri(format!("/v1/tasks/{task_id}"))
                .header(header::AUTHORIZATION, format!("Bearer {token}"))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "clientMutationId": "web-task-2",
                        "expectedVersion": 1,
                        "patch": { "status": "done" }
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(updated.status(), StatusCode::OK);
    let body: Value =
        serde_json::from_slice(&to_bytes(updated.into_body(), 65536).await.unwrap()).unwrap();
    assert_eq!(body["status"], json!("done"));
    assert_eq!(body["version"], json!(2));

    let stale = app
        .oneshot(
            Request::builder()
                .method(Method::PATCH)
                .uri(format!("/v1/tasks/{task_id}"))
                .header(header::AUTHORIZATION, format!("Bearer {token}"))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "clientMutationId": "web-task-stale",
                        "expectedVersion": 1,
                        "patch": { "status": "open" }
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(stale.status(), StatusCode::CONFLICT);
    let stale_body: Value =
        serde_json::from_slice(&to_bytes(stale.into_body(), 65536).await.unwrap()).unwrap();
    assert_eq!(stale_body["code"], "version_conflict");
    assert_eq!(stale_body["latest"]["id"], task_id);
    assert_eq!(stale_body["latest"]["version"], json!(2));

    let event_count: i64 = sqlx::query_scalar(
        "select count(*)
         from realtime_events
         where aggregate_type = 'task'
           and aggregate_id = $1
           and event_type in ('task.created', 'task.updated')",
    )
    .bind(Uuid::parse_str(task_id).unwrap())
    .fetch_one(&pool)
    .await
    .unwrap();
    assert_eq!(event_count, 2);
}

#[sqlx::test(migrations = "../../migrations")]
async fn tasks_contract_viewer_cannot_create_task(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    let token = support::create_session(&pool, support::VIEWER_ID).await;
    let app = support::app(pool);
    let response = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/v1/trips/{}/tasks", support::TRIP_ID))
                .header(header::AUTHORIZATION, format!("Bearer {token}"))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "clientMutationId": "web-task-3",
                        "title": "Buy eSIM",
                        "visibility": "private"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(response.status(), StatusCode::FORBIDDEN);
}
