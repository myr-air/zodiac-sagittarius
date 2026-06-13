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
                .uri(format!("/api/v1/trips/{}/tasks", support::TRIP_ID))
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
    assert_eq!(body["tripPlanId"], json!(support::PLAN_ID));
    assert_eq!(body["assigneeId"], json!(support::TRAVELER_ID));
    assert_eq!(body["version"], json!(1));

    let updated = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::PATCH)
                .uri(format!(
                    "/api/v1/trips/{}/tasks/{task_id}",
                    support::TRIP_ID
                ))
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
                .uri(format!(
                    "/api/v1/trips/{}/tasks/{task_id}",
                    support::TRIP_ID
                ))
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
                .uri(format!("/api/v1/trips/{}/tasks", support::TRIP_ID))
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

#[sqlx::test(migrations = "../../migrations")]
async fn tasks_contract_shared_tasks_validate_references_and_duplicate_mutations(
    pool: sqlx::PgPool,
) {
    support::seed_trip(&pool).await;
    let organizer = support::create_session(&pool, support::ORGANIZER_ID).await;
    let app = support::app(pool.clone());

    let created = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/trips/{}/tasks", support::TRIP_ID))
                .header(header::AUTHORIZATION, format!("Bearer {organizer}"))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "clientMutationId": "web-task-shared",
                        "title": "Confirm Dim Dim Sum",
                        "visibility": "shared",
                        "kind": "booking",
                        "assigneeId": support::TRAVELER_ID,
                        "relatedItemId": support::ITEM_ID
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
    assert_eq!(body["assigneeId"], support::TRAVELER_ID);
    assert_eq!(body["relatedItemId"], support::ITEM_ID);
    let task_id = body["id"].as_str().unwrap();

    let duplicate = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/trips/{}/tasks", support::TRIP_ID))
                .header(header::AUTHORIZATION, format!("Bearer {organizer}"))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "clientMutationId": "web-task-shared",
                        "title": "Duplicate",
                        "visibility": "shared"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(duplicate.status(), StatusCode::CONFLICT);

    let missing_assignee = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/trips/{}/tasks", support::TRIP_ID))
                .header(header::AUTHORIZATION, format!("Bearer {organizer}"))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "clientMutationId": "web-task-missing-assignee",
                        "title": "Missing assignee",
                        "visibility": "shared",
                        "assigneeId": Uuid::now_v7()
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(missing_assignee.status(), StatusCode::NOT_FOUND);

    let missing_related_item = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/trips/{}/tasks", support::TRIP_ID))
                .header(header::AUTHORIZATION, format!("Bearer {organizer}"))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "clientMutationId": "web-task-missing-item",
                        "title": "Missing item",
                        "visibility": "shared",
                        "relatedItemId": Uuid::now_v7()
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(missing_related_item.status(), StatusCode::NOT_FOUND);

    let traveler = support::create_session(&pool, support::TRAVELER_ID).await;
    let forbidden_patch = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::PATCH)
                .uri(format!(
                    "/api/v1/trips/{}/tasks/{task_id}",
                    support::TRIP_ID
                ))
                .header(header::AUTHORIZATION, format!("Bearer {traveler}"))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "clientMutationId": "web-task-forbidden-patch",
                        "expectedVersion": 1,
                        "patch": { "status": "done" }
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(forbidden_patch.status(), StatusCode::FORBIDDEN);
}

#[sqlx::test(migrations = "../../migrations")]
async fn tasks_contract_patch_rejects_unknown_task_duplicate_mutation_and_bad_references(
    pool: sqlx::PgPool,
) {
    support::seed_trip(&pool).await;
    let traveler = support::create_session(&pool, support::TRAVELER_ID).await;
    let app = support::app(pool);

    let unknown_task = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::PATCH)
                .uri(format!(
                    "/api/v1/trips/{}/tasks/{}",
                    support::TRIP_ID,
                    Uuid::now_v7()
                ))
                .header(header::AUTHORIZATION, format!("Bearer {traveler}"))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "clientMutationId": "web-task-unknown",
                        "expectedVersion": 1,
                        "patch": { "status": "done" }
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(unknown_task.status(), StatusCode::NOT_FOUND);

    let created = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/trips/{}/tasks", support::TRIP_ID))
                .header(header::AUTHORIZATION, format!("Bearer {traveler}"))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "clientMutationId": "web-task-private-ref",
                        "title": "Private prep",
                        "visibility": "private"
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

    let missing_related_item = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::PATCH)
                .uri(format!(
                    "/api/v1/trips/{}/tasks/{task_id}",
                    support::TRIP_ID
                ))
                .header(header::AUTHORIZATION, format!("Bearer {traveler}"))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "clientMutationId": "web-task-patch-missing-item",
                        "expectedVersion": 1,
                        "patch": { "relatedItemId": Uuid::now_v7() }
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(missing_related_item.status(), StatusCode::NOT_FOUND);

    let updated = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::PATCH)
                .uri(format!("/api/v1/trips/{}/tasks/{task_id}", support::TRIP_ID))
                .header(header::AUTHORIZATION, format!("Bearer {traveler}"))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "clientMutationId": "web-task-patch-clear",
                        "expectedVersion": 1,
                        "patch": { "assigneeId": null, "relatedItemId": null, "title": "Private prep updated" }
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(updated.status(), StatusCode::OK);

    let duplicate_patch = app
        .oneshot(
            Request::builder()
                .method(Method::PATCH)
                .uri(format!(
                    "/api/v1/trips/{}/tasks/{task_id}",
                    support::TRIP_ID
                ))
                .header(header::AUTHORIZATION, format!("Bearer {traveler}"))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "clientMutationId": "web-task-patch-clear",
                        "expectedVersion": 2,
                        "patch": { "status": "done" }
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(duplicate_patch.status(), StatusCode::CONFLICT);
}

#[sqlx::test(migrations = "../../migrations")]
async fn tasks_contract_patch_relinks_to_new_item_plan(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    let alt_item_id = support::seed_alt_plan_item(&pool).await;
    let organizer = support::create_session(&pool, support::ORGANIZER_ID).await;
    let app = support::app(pool.clone());

    let created = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/trips/{}/tasks", support::TRIP_ID))
                .header(header::AUTHORIZATION, format!("Bearer {organizer}"))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "clientMutationId": "web-task-main-plan",
                        "title": "Confirm airport transfer",
                        "visibility": "shared",
                        "kind": "booking",
                        "relatedItemId": support::ITEM_ID
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
    assert_eq!(body["tripPlanId"], support::PLAN_ID);
    let task_id = body["id"].as_str().unwrap();

    let response = app
        .oneshot(
            Request::builder()
                .method(Method::PATCH)
                .uri(format!(
                    "/api/v1/trips/{}/tasks/{task_id}",
                    support::TRIP_ID
                ))
                .header(header::AUTHORIZATION, format!("Bearer {organizer}"))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "clientMutationId": "web-task-cross-plan-relink",
                        "expectedVersion": 1,
                        "patch": { "relatedItemId": alt_item_id }
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
    assert_eq!(body["relatedItemId"], alt_item_id.to_string());
    assert_eq!(body["version"], 2);

    let stored: (Uuid, Uuid, i64) = sqlx::query_as(
        "select trip_plan_id, related_item_id, version
         from trip_tasks
         where id = $1",
    )
    .bind(Uuid::parse_str(task_id).unwrap())
    .fetch_one(&pool)
    .await
    .unwrap();
    assert_eq!(stored.0, Uuid::parse_str(support::ALT_PLAN_ID).unwrap());
    assert_eq!(stored.1, alt_item_id);
    assert_eq!(stored.2, 2);
}

#[sqlx::test(migrations = "../../migrations")]
async fn tasks_contract_patch_repairs_legacy_null_trip_plan_id(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    let traveler = support::create_session(&pool, support::TRAVELER_ID).await;
    let app = support::app(pool.clone());

    let created = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/trips/{}/tasks", support::TRIP_ID))
                .header(header::AUTHORIZATION, format!("Bearer {traveler}"))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "clientMutationId": "web-task-legacy-null-create",
                        "title": "Legacy unscoped task",
                        "visibility": "private"
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

    sqlx::query(
        "update trip_tasks
         set trip_plan_id = null
         where id = $1",
    )
    .bind(Uuid::parse_str(task_id).unwrap())
    .execute(&pool)
    .await
    .unwrap();

    let response = app
        .oneshot(
            Request::builder()
                .method(Method::PATCH)
                .uri(format!(
                    "/api/v1/trips/{}/tasks/{task_id}",
                    support::TRIP_ID
                ))
                .header(header::AUTHORIZATION, format!("Bearer {traveler}"))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "clientMutationId": "web-task-legacy-null-repair",
                        "expectedVersion": 1,
                        "patch": { "title": "Legacy unscoped task repaired" }
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
    assert_eq!(body["version"], 2);

    let stored: (Uuid, i64) = sqlx::query_as(
        "select trip_plan_id, version
         from trip_tasks
         where id = $1",
    )
    .bind(Uuid::parse_str(task_id).unwrap())
    .fetch_one(&pool)
    .await
    .unwrap();
    assert_eq!(stored.0, Uuid::parse_str(support::PLAN_ID).unwrap());
    assert_eq!(stored.1, 2);
}

#[sqlx::test(migrations = "../../migrations")]
async fn tasks_contract_rejects_trip_plan_that_conflicts_with_related_item_plan(
    pool: sqlx::PgPool,
) {
    support::seed_trip(&pool).await;
    let alt_item_id = support::seed_alt_plan_item(&pool).await;
    let organizer = support::create_session(&pool, support::ORGANIZER_ID).await;
    let app = support::app(pool.clone());

    let response = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/trips/{}/tasks", support::TRIP_ID))
                .header(header::AUTHORIZATION, format!("Bearer {organizer}"))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "clientMutationId": "web-task-mismatched-plan",
                        "tripPlanId": support::PLAN_ID,
                        "title": "Confirm alt train",
                        "visibility": "shared",
                        "kind": "booking",
                        "relatedItemId": alt_item_id
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
         from trip_tasks
         where title = 'Confirm alt train'",
    )
    .fetch_one(&pool)
    .await
    .unwrap();
    assert_eq!(stored_count, 0);
}
