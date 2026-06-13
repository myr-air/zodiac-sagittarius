mod support;

use axum::body::{Body, to_bytes};
use http::{Method, Request, StatusCode, header};
use serde_json::{Value, json};
use tower::ServiceExt;
use uuid::Uuid;

#[sqlx::test(migrations = "../../migrations")]
async fn stop_note_contract_traveler_can_create_note_for_trip_item(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    let token = support::create_session(&pool, support::TRAVELER_ID).await;
    let app = support::app(pool.clone());

    let response = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/trips/{}/stop-notes", support::TRIP_ID))
                .header(header::AUTHORIZATION, format!("Bearer {token}"))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "clientMutationId": "stop-note-create-1",
                        "itineraryItemId": support::ITEM_ID,
                        "body": "  Meet outside exit B  "
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
    assert_eq!(body["itemId"], support::ITEM_ID);
    assert_eq!(body["authorId"], support::TRAVELER_ID);
    assert_eq!(body["body"], "Meet outside exit B");
    assert_eq!(body["version"], 1);

    let event_type: String = sqlx::query_scalar(
        "select event_type from realtime_events where aggregate_id = $1 and created_by = $2",
    )
    .bind(Uuid::parse_str(body["id"].as_str().unwrap()).unwrap())
    .bind(Uuid::parse_str(support::TRAVELER_ID).unwrap())
    .fetch_one(&pool)
    .await
    .unwrap();
    assert_eq!(event_type, "stop_note.created");
}

#[sqlx::test(migrations = "../../migrations")]
async fn stop_note_contract_rejects_trip_plan_that_conflicts_with_item_plan(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    let alt_item_id = support::seed_alt_plan_item(&pool).await;
    let token = support::create_session(&pool, support::TRAVELER_ID).await;
    let app = support::app(pool.clone());

    let response = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/trips/{}/stop-notes", support::TRIP_ID))
                .header(header::AUTHORIZATION, format!("Bearer {token}"))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "clientMutationId": "stop-note-mismatched-plan",
                        "tripPlanId": support::PLAN_ID,
                        "itineraryItemId": alt_item_id,
                        "body": "Alt plan note should stay scoped"
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
         from stop_notes
         where body = 'Alt plan note should stay scoped'",
    )
    .fetch_one(&pool)
    .await
    .unwrap();
    assert_eq!(stored_count, 0);
}

#[sqlx::test(migrations = "../../migrations")]
async fn stop_note_contract_viewer_cannot_create_note(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    let token = support::create_session(&pool, support::VIEWER_ID).await;
    let app = support::app(pool);

    let response = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/trips/{}/stop-notes", support::TRIP_ID))
                .header(header::AUTHORIZATION, format!("Bearer {token}"))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "clientMutationId": "stop-note-create-viewer",
                        "itineraryItemId": support::ITEM_ID,
                        "body": "Viewer note"
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
async fn stop_note_contract_author_can_patch_and_stale_patch_conflicts(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    support::seed_stop_note(&pool).await;
    let token = support::create_session(&pool, support::TRAVELER_ID).await;
    let app = support::app(pool);

    let ok = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::PATCH)
                .uri(format!(
                    "/api/v1/trips/{}/stop-notes/{}",
                    support::TRIP_ID,
                    support::STOP_NOTE_ID
                ))
                .header(header::AUTHORIZATION, format!("Bearer {token}"))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "clientMutationId": "stop-note-patch-1",
                        "expectedVersion": 2,
                        "body": "Meet at exit C"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(ok.status(), StatusCode::OK);
    let ok_body: Value =
        serde_json::from_slice(&to_bytes(ok.into_body(), 65536).await.unwrap()).unwrap();
    assert_eq!(ok_body["body"], "Meet at exit C");
    assert_eq!(ok_body["version"], 3);

    let stale = app
        .oneshot(
            Request::builder()
                .method(Method::PATCH)
                .uri(format!(
                    "/api/v1/trips/{}/stop-notes/{}",
                    support::TRIP_ID,
                    support::STOP_NOTE_ID
                ))
                .header(header::AUTHORIZATION, format!("Bearer {token}"))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "clientMutationId": "stop-note-patch-2",
                        "expectedVersion": 2,
                        "body": "Old edit"
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
    assert_eq!(stale_body["latest"]["id"], support::STOP_NOTE_ID);
    assert_eq!(stale_body["latest"]["version"], 3);
}

#[sqlx::test(migrations = "../../migrations")]
async fn stop_note_contract_patch_repairs_legacy_null_trip_plan_id(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    support::seed_stop_note(&pool).await;
    sqlx::query("update stop_notes set trip_plan_id = null where id = $1")
        .bind(Uuid::parse_str(support::STOP_NOTE_ID).unwrap())
        .execute(&pool)
        .await
        .unwrap();
    let token = support::create_session(&pool, support::TRAVELER_ID).await;
    let app = support::app(pool.clone());

    let response = app
        .oneshot(
            Request::builder()
                .method(Method::PATCH)
                .uri(format!(
                    "/api/v1/trips/{}/stop-notes/{}",
                    support::TRIP_ID,
                    support::STOP_NOTE_ID
                ))
                .header(header::AUTHORIZATION, format!("Bearer {token}"))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "clientMutationId": "stop-note-patch-repair-plan",
                        "expectedVersion": 2,
                        "body": "Legacy scope repaired"
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
    assert_eq!(body["body"], "Legacy scope repaired");
    assert_eq!(body["version"], 3);

    let stored_trip_plan_id: Uuid =
        sqlx::query_scalar("select trip_plan_id from stop_notes where id = $1")
            .bind(Uuid::parse_str(support::STOP_NOTE_ID).unwrap())
            .fetch_one(&pool)
            .await
            .unwrap();
    assert_eq!(
        stored_trip_plan_id,
        Uuid::parse_str(support::PLAN_ID).unwrap()
    );
}

#[sqlx::test(migrations = "../../migrations")]
async fn stop_note_contract_author_can_delete_note(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    support::seed_stop_note(&pool).await;
    let token = support::create_session(&pool, support::TRAVELER_ID).await;
    let app = support::app(pool.clone());

    let response = app
        .oneshot(
            Request::builder()
                .method(Method::DELETE)
                .uri(format!(
                    "/api/v1/trips/{}/stop-notes/{}",
                    support::TRIP_ID,
                    support::STOP_NOTE_ID
                ))
                .header(header::AUTHORIZATION, format!("Bearer {token}"))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);
    let body: Value =
        serde_json::from_slice(&to_bytes(response.into_body(), 65536).await.unwrap()).unwrap();
    assert_eq!(body["id"], support::STOP_NOTE_ID);
    assert_eq!(body["version"], 3);

    let is_deleted: bool =
        sqlx::query_scalar("select deleted_at is not null from stop_notes where id = $1")
            .bind(Uuid::parse_str(support::STOP_NOTE_ID).unwrap())
            .fetch_one(&pool)
            .await
            .unwrap();
    assert!(is_deleted);
}
