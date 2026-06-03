mod support;

use axum::body::{Body, to_bytes};
use http::{Method, Request, StatusCode, header};
use serde_json::{Value, json};
use tower::ServiceExt;
use uuid::Uuid;

#[sqlx::test(migrations = "../../migrations")]
async fn plan_variant_contract_organizer_can_create_patch_and_publish(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    let token = support::create_session(&pool, support::ORGANIZER_ID).await;
    let app = support::app(pool.clone());

    let create = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/trips/{}/plan-variants", support::TRIP_ID))
                .header(header::AUTHORIZATION, format!("Bearer {token}"))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "clientMutationId": "web-plan-create-1",
                        "name": "Rain backup",
                        "kind": "backup",
                        "description": "Indoor route when weather changes"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(create.status(), StatusCode::CREATED);
    let created: Value =
        serde_json::from_slice(&to_bytes(create.into_body(), 65536).await.unwrap()).unwrap();
    assert_eq!(created["name"], "Rain backup");
    assert_eq!(created["kind"], "backup");
    assert_eq!(created["version"], 1);
    let plan_variant_id = created["id"].as_str().unwrap();

    let patch = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::PATCH)
                .uri(format!(
                    "/api/v1/trips/{}/plan-variants/{plan_variant_id}",
                    support::TRIP_ID
                ))
                .header(header::AUTHORIZATION, format!("Bearer {token}"))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "clientMutationId": "web-plan-patch-1",
                        "expectedVersion": 1,
                        "patch": {
                            "name": "Rain day backup",
                            "description": "Indoor route with shorter walks"
                        }
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(patch.status(), StatusCode::OK);
    let patched: Value =
        serde_json::from_slice(&to_bytes(patch.into_body(), 65536).await.unwrap()).unwrap();
    assert_eq!(patched["name"], "Rain day backup");
    assert_eq!(patched["description"], "Indoor route with shorter walks");
    assert_eq!(patched["version"], 2);

    let stale = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::PATCH)
                .uri(format!(
                    "/api/v1/trips/{}/plan-variants/{plan_variant_id}",
                    support::TRIP_ID
                ))
                .header(header::AUTHORIZATION, format!("Bearer {token}"))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "clientMutationId": "web-plan-patch-2",
                        "expectedVersion": 1,
                        "patch": {
                            "kind": "split"
                        }
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
    assert_eq!(stale_body["latest"]["version"], 2);

    let publish = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!(
                    "/api/v1/trips/{}/plan-variants/{plan_variant_id}/publications",
                    support::TRIP_ID
                ))
                .header(header::AUTHORIZATION, format!("Bearer {token}"))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "clientMutationId": "web-plan-publish-1"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(publish.status(), StatusCode::OK);
    let trip: Value =
        serde_json::from_slice(&to_bytes(publish.into_body(), 65536).await.unwrap()).unwrap();
    assert_eq!(trip["activePlanVariantId"], plan_variant_id);
    assert_eq!(trip["version"], 2);

    let event_count: i64 =
        sqlx::query_scalar("select count(*) from realtime_events where aggregate_id = $1")
            .bind(Uuid::parse_str(plan_variant_id).unwrap())
            .fetch_one(&pool)
            .await
            .unwrap();
    assert_eq!(event_count, 3);
}

#[sqlx::test(migrations = "../../migrations")]
async fn plan_variant_contract_viewer_cannot_create(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    let token = support::create_session(&pool, support::VIEWER_ID).await;
    let app = support::app(pool);

    let response = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/trips/{}/plan-variants", support::TRIP_ID))
                .header(header::AUTHORIZATION, format!("Bearer {token}"))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "clientMutationId": "web-plan-create-viewer",
                        "name": "Viewer idea",
                        "kind": "draft",
                        "description": ""
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::FORBIDDEN);
}
