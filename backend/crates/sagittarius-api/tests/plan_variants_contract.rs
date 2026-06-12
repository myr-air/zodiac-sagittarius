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
    assert_eq!(created["status"], "backup");
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
    assert_eq!(patched["status"], "backup");
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
    assert_eq!(trip["mainTripPlanId"], plan_variant_id);
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
async fn trip_plan_contract_accepts_canonical_routes_and_status(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    support::seed_tasks(&pool).await;
    support::seed_stop_note(&pool).await;
    support::seed_expense(&pool).await;
    support::seed_booking_doc(&pool).await;
    let token = support::create_session(&pool, support::ORGANIZER_ID).await;
    let app = support::app(pool.clone());

    let create = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/trips/{}/trip-plans", support::TRIP_ID))
                .header(header::AUTHORIZATION, format!("Bearer {token}"))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "clientMutationId": "web-trip-plan-create-1",
                        "name": "Client proposal",
                        "status": "proposal",
                        "description": "Proposal for tour clients",
                        "creationMode": "blank"
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
    assert_eq!(created["name"], "Client proposal");
    assert_eq!(created["kind"], "split");
    assert_eq!(created["status"], "proposal");
    let trip_plan_id = created["id"].as_str().unwrap();

    let patch = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::PATCH)
                .uri(format!(
                    "/api/v1/trips/{}/trip-plans/{trip_plan_id}",
                    support::TRIP_ID
                ))
                .header(header::AUTHORIZATION, format!("Bearer {token}"))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "clientMutationId": "web-trip-plan-patch-1",
                        "expectedVersion": 1,
                        "patch": {
                            "status": "backup"
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
    assert_eq!(patched["kind"], "backup");
    assert_eq!(patched["status"], "backup");

    let set_main = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!(
                    "/api/v1/trips/{}/trip-plans/{trip_plan_id}/set-main",
                    support::TRIP_ID
                ))
                .header(header::AUTHORIZATION, format!("Bearer {token}"))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "clientMutationId": "web-trip-plan-main-1",
                        "previousMainNextStatus": "backup"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(set_main.status(), StatusCode::OK);
    let trip: Value =
        serde_json::from_slice(&to_bytes(set_main.into_body(), 65536).await.unwrap()).unwrap();
    assert_eq!(trip["activePlanVariantId"], trip_plan_id);
    assert_eq!(trip["mainTripPlanId"], trip_plan_id);

    let previous_status: String =
        sqlx::query_scalar("select status from plan_variants where id = $1")
            .bind(Uuid::parse_str(support::PLAN_ID).unwrap())
            .fetch_one(&pool)
            .await
            .unwrap();
    assert_eq!(previous_status, "backup");

    let expense_trip_plan_id: Uuid =
        sqlx::query_scalar("select trip_plan_id from expenses where id = $1")
            .bind(Uuid::parse_str(support::EXPENSE_ID).unwrap())
            .fetch_one(&pool)
            .await
            .unwrap();
    assert_eq!(
        expense_trip_plan_id,
        Uuid::parse_str(support::PLAN_ID).unwrap()
    );

    let unchanged_record_counts =
        plan_scoped_record_counts_by_plan(&pool, Uuid::parse_str(support::PLAN_ID).unwrap()).await;
    assert_eq!(
        unchanged_record_counts,
        [
            ("booking_docs", 1),
            ("expenses", 1),
            ("stop_notes", 1),
            ("trip_tasks", 3)
        ]
    );

    let moved_record_count: i64 = sqlx::query_scalar(
        "select
           (select count(*) from booking_docs where trip_plan_id = $1)
         + (select count(*) from expenses where trip_plan_id = $1)
         + (select count(*) from stop_notes where trip_plan_id = $1)
         + (select count(*) from trip_tasks where trip_plan_id = $1)",
    )
    .bind(Uuid::parse_str(trip_plan_id).unwrap())
    .fetch_one(&pool)
    .await
    .unwrap();
    assert_eq!(moved_record_count, 0);

    let (event_type, aggregate_type, payload): (String, String, Value) = sqlx::query_as(
        "select event_type, aggregate_type, payload
         from realtime_events
         where aggregate_id = $1
           and event_type = 'plan_variant.updated'
         order by created_at desc
         limit 1",
    )
    .bind(Uuid::parse_str(trip_plan_id).unwrap())
    .fetch_one(&pool)
    .await
    .unwrap();
    assert_eq!(event_type, "plan_variant.updated");
    assert_eq!(aggregate_type, "plan_variant");
    assert_eq!(payload["activePlanVariantId"], trip_plan_id);
    assert_eq!(payload["mainTripPlanId"], trip_plan_id);
    assert_eq!(payload["tripPlan"]["id"], trip_plan_id);
    assert_eq!(payload["tripPlan"]["status"], "main");
    assert_eq!(payload["trip"]["mainTripPlanId"], trip_plan_id);
}

async fn plan_scoped_record_counts_by_plan(
    pool: &sqlx::PgPool,
    trip_plan_id: Uuid,
) -> [(&'static str, i64); 4] {
    let booking_docs =
        sqlx::query_scalar("select count(*) from booking_docs where trip_plan_id = $1")
            .bind(trip_plan_id)
            .fetch_one(pool)
            .await
            .unwrap();
    let expenses = sqlx::query_scalar("select count(*) from expenses where trip_plan_id = $1")
        .bind(trip_plan_id)
        .fetch_one(pool)
        .await
        .unwrap();
    let stop_notes = sqlx::query_scalar("select count(*) from stop_notes where trip_plan_id = $1")
        .bind(trip_plan_id)
        .fetch_one(pool)
        .await
        .unwrap();
    let trip_tasks = sqlx::query_scalar("select count(*) from trip_tasks where trip_plan_id = $1")
        .bind(trip_plan_id)
        .fetch_one(pool)
        .await
        .unwrap();

    [
        ("booking_docs", booking_docs),
        ("expenses", expenses),
        ("stop_notes", stop_notes),
        ("trip_tasks", trip_tasks),
    ]
}

#[sqlx::test(migrations = "../../migrations")]
async fn trip_plan_contract_rejects_unsupported_creation_modes_and_main_status(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    let token = support::create_session(&pool, support::ORGANIZER_ID).await;
    let app = support::app(pool.clone());

    for (client_mutation_id, body) in [
        (
            "web-trip-plan-create-duplicate",
            json!({
                "clientMutationId": "web-trip-plan-create-duplicate",
                "name": "Copied plan",
                "status": "draft",
                "creationMode": "duplicate-current"
            }),
        ),
        (
            "web-trip-plan-create-source",
            json!({
                "clientMutationId": "web-trip-plan-create-source",
                "name": "Copied source plan",
                "status": "draft",
                "sourceTripPlanId": support::PLAN_ID
            }),
        ),
        (
            "web-trip-plan-create-main-status",
            json!({
                "clientMutationId": "web-trip-plan-create-main-status",
                "name": "Main by status",
                "status": "main"
            }),
        ),
        (
            "web-trip-plan-create-main-kind",
            json!({
                "clientMutationId": "web-trip-plan-create-main-kind",
                "name": "Main by kind",
                "kind": "main"
            }),
        ),
        (
            "web-trip-plan-create-conflict",
            json!({
                "clientMutationId": "web-trip-plan-create-conflict",
                "name": "Conflicting status",
                "kind": "draft",
                "status": "proposal"
            }),
        ),
        (
            "web-trip-plan-create-bad-status",
            json!({
                "clientMutationId": "web-trip-plan-create-bad-status",
                "name": "Bad status",
                "status": "archived"
            }),
        ),
        (
            "web-trip-plan-create-bad-kind",
            json!({
                "clientMutationId": "web-trip-plan-create-bad-kind",
                "name": "Bad kind",
                "kind": "rain"
            }),
        ),
    ] {
        let response = app
            .clone()
            .oneshot(
                Request::builder()
                    .method(Method::POST)
                    .uri(format!("/api/v1/trips/{}/trip-plans", support::TRIP_ID))
                    .header(header::AUTHORIZATION, format!("Bearer {token}"))
                    .header(header::CONTENT_TYPE, "application/json")
                    .body(Body::from(body.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(
            response.status(),
            StatusCode::BAD_REQUEST,
            "{client_mutation_id} should be rejected"
        );
        let error_body: Value =
            serde_json::from_slice(&to_bytes(response.into_body(), 65536).await.unwrap()).unwrap();
        assert_eq!(error_body["code"], "invalid_request");
        assert!(
            error_body["message"]
                .as_str()
                .is_some_and(|message| !message.is_empty()),
            "{client_mutation_id} should include a useful message",
        );
    }

    let rejected_count: i64 = sqlx::query_scalar(
        "select count(*) from plan_variants
         where trip_id = $1
           and name in (
             'Copied plan',
             'Copied source plan',
             'Main by status',
             'Main by kind',
             'Conflicting status',
             'Bad status',
             'Bad kind'
           )",
    )
    .bind(Uuid::parse_str(support::TRIP_ID).unwrap())
    .fetch_one(&pool)
    .await
    .unwrap();
    assert_eq!(rejected_count, 0);
}

#[sqlx::test(migrations = "../../migrations")]
async fn trip_plan_contract_rejects_main_status_and_empty_patch(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    let token = support::create_session(&pool, support::ORGANIZER_ID).await;
    let app = support::app(pool);

    for (client_mutation_id, patch) in [
        (
            "web-trip-plan-patch-main-status",
            json!({
                "status": "main"
            }),
        ),
        (
            "web-trip-plan-patch-main-kind",
            json!({
                "kind": "main"
            }),
        ),
        (
            "web-trip-plan-patch-conflict",
            json!({
                "kind": "draft",
                "status": "proposal"
            }),
        ),
        (
            "web-trip-plan-patch-bad-status",
            json!({
                "status": "archived"
            }),
        ),
        (
            "web-trip-plan-patch-bad-kind",
            json!({
                "kind": "rain"
            }),
        ),
        ("web-trip-plan-patch-empty", json!({})),
    ] {
        let response = app
            .clone()
            .oneshot(
                Request::builder()
                    .method(Method::PATCH)
                    .uri(format!(
                        "/api/v1/trips/{}/trip-plans/{}",
                        support::TRIP_ID,
                        support::PLAN_ID
                    ))
                    .header(header::AUTHORIZATION, format!("Bearer {token}"))
                    .header(header::CONTENT_TYPE, "application/json")
                    .body(Body::from(
                        json!({
                            "clientMutationId": client_mutation_id,
                            "expectedVersion": 1,
                            "patch": patch
                        })
                        .to_string(),
                    ))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(
            response.status(),
            StatusCode::BAD_REQUEST,
            "{client_mutation_id} should be rejected"
        );
        let error_body: Value =
            serde_json::from_slice(&to_bytes(response.into_body(), 65536).await.unwrap()).unwrap();
        assert_eq!(error_body["code"], "invalid_request");
        assert!(
            error_body["message"]
                .as_str()
                .is_some_and(|message| !message.is_empty()),
            "{client_mutation_id} should include a useful message",
        );
    }
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
