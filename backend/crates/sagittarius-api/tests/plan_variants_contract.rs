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
    let create_event_payload: Value = sqlx::query_scalar(
        "select payload
         from realtime_events
         where client_mutation_id = 'web-trip-plan-create-1'
           and event_type = 'plan_variant.created'
           and aggregate_type = 'plan_variant'",
    )
    .fetch_one(&pool)
    .await
    .unwrap();
    assert_eq!(create_event_payload["id"], trip_plan_id);
    assert_eq!(create_event_payload["kind"], "split");
    assert_eq!(create_event_payload["status"], "proposal");

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
    let patch_event_payload: Value = sqlx::query_scalar(
        "select payload
         from realtime_events
         where client_mutation_id = 'web-trip-plan-patch-1'
           and event_type = 'plan_variant.updated'
           and aggregate_type = 'plan_variant'",
    )
    .fetch_one(&pool)
    .await
    .unwrap();
    assert_eq!(patch_event_payload["id"], trip_plan_id);
    assert_eq!(patch_event_payload["kind"], "backup");
    assert_eq!(patch_event_payload["status"], "backup");

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
    assert_eq!(payload["previousMainTripPlan"]["id"], support::PLAN_ID);
    assert_eq!(payload["previousMainTripPlan"]["kind"], "backup");
    assert_eq!(payload["previousMainTripPlan"]["status"], "backup");
    assert_eq!(payload["trip"]["mainTripPlanId"], trip_plan_id);

    let canonical_duplicate_event_count: i64 = sqlx::query_scalar(
        "select count(*)
         from realtime_events
         where aggregate_id = $1
           and event_type = 'trip_plan.updated'",
    )
    .bind(Uuid::parse_str(trip_plan_id).unwrap())
    .fetch_one(&pool)
    .await
    .unwrap();
    assert_eq!(canonical_duplicate_event_count, 0);
}

#[sqlx::test(migrations = "../../migrations")]
async fn trip_plan_contract_defaults_create_and_keeps_legacy_route_parity(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    let token = support::create_session(&pool, support::ORGANIZER_ID).await;
    let app = support::app(pool.clone());

    let canonical_default = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/trips/{}/trip-plans", support::TRIP_ID))
                .header(header::AUTHORIZATION, format!("Bearer {token}"))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "clientMutationId": "web-trip-plan-create-default",
                        "name": "Blank draft"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(canonical_default.status(), StatusCode::CREATED);
    let default_plan: Value = serde_json::from_slice(
        &to_bytes(canonical_default.into_body(), 65536)
            .await
            .unwrap(),
    )
    .unwrap();
    assert_eq!(default_plan["kind"], "draft");
    assert_eq!(default_plan["status"], "draft");
    let default_plan_id = default_plan["id"].as_str().unwrap();

    let legacy_create = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/trips/{}/plan-variants", support::TRIP_ID))
                .header(header::AUTHORIZATION, format!("Bearer {token}"))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "clientMutationId": "web-plan-create-split-parity",
                        "name": "Legacy proposal",
                        "kind": "split"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(legacy_create.status(), StatusCode::CREATED);
    let legacy_plan: Value =
        serde_json::from_slice(&to_bytes(legacy_create.into_body(), 65536).await.unwrap()).unwrap();
    assert_eq!(legacy_plan["kind"], "split");
    assert_eq!(legacy_plan["status"], "proposal");

    let legacy_patch = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::PATCH)
                .uri(format!(
                    "/api/v1/trips/{}/plan-variants/{default_plan_id}",
                    support::TRIP_ID
                ))
                .header(header::AUTHORIZATION, format!("Bearer {token}"))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "clientMutationId": "web-plan-patch-split-parity",
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
    assert_eq!(legacy_patch.status(), StatusCode::OK);
    let patched_plan: Value =
        serde_json::from_slice(&to_bytes(legacy_patch.into_body(), 65536).await.unwrap()).unwrap();
    assert_eq!(patched_plan["kind"], "split");
    assert_eq!(patched_plan["status"], "proposal");

    let invalid_legacy_create = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/trips/{}/plan-variants", support::TRIP_ID))
                .header(header::AUTHORIZATION, format!("Bearer {token}"))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "clientMutationId": "web-plan-create-conflict-parity",
                        "name": "Conflicting legacy",
                        "kind": "draft",
                        "status": "proposal"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(invalid_legacy_create.status(), StatusCode::BAD_REQUEST);
    let invalid_create_body: Value = serde_json::from_slice(
        &to_bytes(invalid_legacy_create.into_body(), 65536)
            .await
            .unwrap(),
    )
    .unwrap();
    assert_eq!(invalid_create_body["code"], "invalid_request");

    let invalid_legacy_patch = app
        .oneshot(
            Request::builder()
                .method(Method::PATCH)
                .uri(format!(
                    "/api/v1/trips/{}/plan-variants/{default_plan_id}",
                    support::TRIP_ID
                ))
                .header(header::AUTHORIZATION, format!("Bearer {token}"))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "clientMutationId": "web-plan-patch-conflict-parity",
                        "expectedVersion": 2,
                        "patch": {
                            "kind": "draft",
                            "status": "proposal"
                        }
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(invalid_legacy_patch.status(), StatusCode::BAD_REQUEST);
    let invalid_patch_body: Value = serde_json::from_slice(
        &to_bytes(invalid_legacy_patch.into_body(), 65536)
            .await
            .unwrap(),
    )
    .unwrap();
    assert_eq!(invalid_patch_body["code"], "invalid_request");
}

#[sqlx::test(migrations = "../../migrations")]
async fn trip_plan_contract_repairs_current_main_status_drift_on_patch(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    sqlx::query(
        "update plan_variants
         set kind = 'draft', status = 'proposal'
         where id = $1",
    )
    .bind(Uuid::parse_str(support::PLAN_ID).unwrap())
    .execute(&pool)
    .await
    .unwrap();
    let token = support::create_session(&pool, support::ORGANIZER_ID).await;
    let app = support::app(pool.clone());

    let patch = app
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
                        "clientMutationId": "web-trip-plan-main-drift-patch",
                        "expectedVersion": 1,
                        "patch": {
                            "name": "Main repaired"
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
    assert_eq!(patched["name"], "Main repaired");
    assert_eq!(patched["kind"], "main");
    assert_eq!(patched["status"], "main");
    assert_eq!(patched["version"], 2);

    let stored_pair: (String, String) =
        sqlx::query_as("select kind, status from plan_variants where id = $1")
            .bind(Uuid::parse_str(support::PLAN_ID).unwrap())
            .fetch_one(&pool)
            .await
            .unwrap();
    assert_eq!(stored_pair, ("main".to_string(), "main".to_string()));

    let stale = app
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
                        "clientMutationId": "web-trip-plan-main-drift-stale",
                        "expectedVersion": 1,
                        "patch": {
                            "description": "stale write"
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
    assert_eq!(stale_body["latest"]["kind"], "main");
    assert_eq!(stale_body["latest"]["status"], "main");
    assert_eq!(stale_body["latest"]["version"], 2);
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

async fn realtime_event_count(pool: &sqlx::PgPool) -> i64 {
    sqlx::query_scalar("select count(*) from realtime_events")
        .fetch_one(pool)
        .await
        .unwrap()
}

async fn seed_cross_trip_plan(pool: &sqlx::PgPool) -> Uuid {
    let trip_id = Uuid::now_v7();
    let owner_id = Uuid::now_v7();
    let plan_id = Uuid::now_v7();
    let mut tx = pool.begin().await.unwrap();
    sqlx::query("set constraints all deferred")
        .execute(&mut *tx)
        .await
        .unwrap();
    sqlx::query(
        "insert into trips (
           id, name, destination_label, countries, start_date, end_date,
           join_id, join_password_hash, active_plan_variant_id, owner_member_id
         )
         values ($1, 'Other trip', 'Other city', '{}', '2026-07-01', '2026-07-02',
           $2, 'hash', $3, $4)",
    )
    .bind(trip_id)
    .bind(format!("OTHER-{}", trip_id.simple()))
    .bind(plan_id)
    .bind(owner_id)
    .execute(&mut *tx)
    .await
    .unwrap();
    sqlx::query(
        "insert into trip_members (id, trip_id, display_name, role, color)
         values ($1, $2, 'Other owner', 'owner', '#0f766e')",
    )
    .bind(owner_id)
    .bind(trip_id)
    .execute(&mut *tx)
    .await
    .unwrap();
    sqlx::query(
        "insert into plan_variants (id, trip_id, name, kind, status, description)
         values ($1, $2, 'Other main', 'main', 'main', '')",
    )
    .bind(plan_id)
    .bind(trip_id)
    .execute(&mut *tx)
    .await
    .unwrap();
    tx.commit().await.unwrap();
    plan_id
}

#[sqlx::test(migrations = "../../migrations")]
async fn trip_plan_contract_rejects_unsupported_creation_modes_and_main_status(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    let token = support::create_session(&pool, support::ORGANIZER_ID).await;
    let app = support::app(pool.clone());
    let initial_event_count = realtime_event_count(&pool).await;

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
            "web-trip-plan-create-import",
            json!({
                "clientMutationId": "web-trip-plan-create-import",
                "name": "Imported plan",
                "status": "draft",
                "creationMode": "import"
            }),
        ),
        (
            "web-trip-plan-create-unknown-mode",
            json!({
                "clientMutationId": "web-trip-plan-create-unknown-mode",
                "name": "Unknown mode",
                "status": "draft",
                "creationMode": "clone-later"
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
            "web-trip-plan-create-null-source",
            json!({
                "clientMutationId": "web-trip-plan-create-null-source",
                "name": "Null source",
                "status": "draft",
                "sourceTripPlanId": null
            }),
        ),
        (
            "web-trip-plan-create-null-mode",
            json!({
                "clientMutationId": "web-trip-plan-create-null-mode",
                "name": "Null mode",
                "status": "draft",
                "creationMode": null
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
            "web-trip-plan-create-null-status",
            json!({
                "clientMutationId": "web-trip-plan-create-null-status",
                "name": "Null status",
                "status": null
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
        (
            "web-trip-plan-create-null-kind",
            json!({
                "clientMutationId": "web-trip-plan-create-null-kind",
                "name": "Null kind",
                "kind": null
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
             'Imported plan',
             'Unknown mode',
             'Copied source plan',
             'Null source',
             'Null mode',
             'Main by status',
             'Main by kind',
             'Conflicting status',
             'Bad status',
             'Null status',
             'Bad kind',
             'Null kind'
           )",
    )
    .bind(Uuid::parse_str(support::TRIP_ID).unwrap())
    .fetch_one(&pool)
    .await
    .unwrap();
    assert_eq!(rejected_count, 0);
    assert_eq!(realtime_event_count(&pool).await, initial_event_count);
}

#[sqlx::test(migrations = "../../migrations")]
async fn trip_plan_contract_rejects_main_status_and_empty_patch(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    let token = support::create_session(&pool, support::ORGANIZER_ID).await;
    let app = support::app(pool.clone());
    let initial_event_count = realtime_event_count(&pool).await;

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
            "web-trip-plan-patch-null-status",
            json!({
                "status": null
            }),
        ),
        (
            "web-trip-plan-patch-bad-kind",
            json!({
                "kind": "rain"
            }),
        ),
        (
            "web-trip-plan-patch-null-kind",
            json!({
                "kind": null
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

    let missing_expected_version = app
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
                        "clientMutationId": "web-trip-plan-patch-missing-version",
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
    assert_eq!(missing_expected_version.status(), StatusCode::BAD_REQUEST);
    let error_body: Value = serde_json::from_slice(
        &to_bytes(missing_expected_version.into_body(), 65536)
            .await
            .unwrap(),
    )
    .unwrap();
    assert_eq!(error_body["code"], "invalid_request");

    let plan_version: i64 = sqlx::query_scalar("select version from plan_variants where id = $1")
        .bind(Uuid::parse_str(support::PLAN_ID).unwrap())
        .fetch_one(&pool)
        .await
        .unwrap();
    assert_eq!(plan_version, 1);
    assert_eq!(realtime_event_count(&pool).await, initial_event_count);
}

#[sqlx::test(migrations = "../../migrations")]
async fn trip_plan_contract_rejects_invalid_set_main_status_without_writes(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    let token = support::create_session(&pool, support::ORGANIZER_ID).await;
    let app = support::app(pool.clone());
    let initial_event_count = realtime_event_count(&pool).await;

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
                        "clientMutationId": "web-trip-plan-create-for-invalid-main",
                        "name": "Invalid set-main target",
                        "status": "backup"
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
    let trip_plan_id = created["id"].as_str().unwrap();
    let event_count_after_create = realtime_event_count(&pool).await;

    for (client_mutation_id, body) in [
        (
            "web-trip-plan-main-main-status",
            json!({
                "clientMutationId": "web-trip-plan-main-main-status",
                "previousMainNextStatus": "main"
            }),
        ),
        (
            "web-trip-plan-main-bad-status",
            json!({
                "clientMutationId": "web-trip-plan-main-bad-status",
                "previousMainNextStatus": "archived"
            }),
        ),
        (
            "web-trip-plan-main-bad-type",
            json!({
                "clientMutationId": "web-trip-plan-main-bad-type",
                "previousMainNextStatus": 42
            }),
        ),
        (
            "web-trip-plan-main-null-status",
            json!({
                "clientMutationId": "web-trip-plan-main-null-status",
                "previousMainNextStatus": null
            }),
        ),
    ] {
        let response = app
            .clone()
            .oneshot(
                Request::builder()
                    .method(Method::POST)
                    .uri(format!(
                        "/api/v1/trips/{}/trip-plans/{trip_plan_id}/set-main",
                        support::TRIP_ID
                    ))
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

    let active_plan_variant_id: Uuid =
        sqlx::query_scalar("select active_plan_variant_id from trips where id = $1")
            .bind(Uuid::parse_str(support::TRIP_ID).unwrap())
            .fetch_one(&pool)
            .await
            .unwrap();
    assert_eq!(
        active_plan_variant_id,
        Uuid::parse_str(support::PLAN_ID).unwrap()
    );

    let target_status: String =
        sqlx::query_scalar("select status from plan_variants where id = $1")
            .bind(Uuid::parse_str(trip_plan_id).unwrap())
            .fetch_one(&pool)
            .await
            .unwrap();
    assert_eq!(target_status, "backup");
    assert_eq!(realtime_event_count(&pool).await, event_count_after_create);
    assert_eq!(initial_event_count + 1, event_count_after_create);
}

#[sqlx::test(migrations = "../../migrations")]
async fn trip_plan_contract_rejects_missing_and_cross_trip_targets_without_writes(
    pool: sqlx::PgPool,
) {
    support::seed_trip(&pool).await;
    let token = support::create_session(&pool, support::ORGANIZER_ID).await;
    let app = support::app(pool.clone());
    let missing_plan_id = Uuid::now_v7();
    let cross_trip_plan_id = seed_cross_trip_plan(&pool).await;
    let initial_event_count = realtime_event_count(&pool).await;
    let initial_main: Uuid =
        sqlx::query_scalar("select active_plan_variant_id from trips where id = $1")
            .bind(Uuid::parse_str(support::TRIP_ID).unwrap())
            .fetch_one(&pool)
            .await
            .unwrap();
    let initial_main_status: (String, Option<String>, i64) =
        sqlx::query_as("select kind, status, version from plan_variants where id = $1")
            .bind(Uuid::parse_str(support::PLAN_ID).unwrap())
            .fetch_one(&pool)
            .await
            .unwrap();

    for (label, target_id, method, uri_suffix, body) in [
        (
            "patch missing target",
            missing_plan_id,
            Method::PATCH,
            "",
            json!({
                "clientMutationId": "web-trip-plan-patch-missing-target",
                "expectedVersion": 1,
                "patch": { "name": "Should not write" }
            }),
        ),
        (
            "patch cross-trip target",
            cross_trip_plan_id,
            Method::PATCH,
            "",
            json!({
                "clientMutationId": "web-trip-plan-patch-cross-trip-target",
                "expectedVersion": 1,
                "patch": { "name": "Should not cross write" }
            }),
        ),
        (
            "set-main missing target",
            missing_plan_id,
            Method::POST,
            "/set-main",
            json!({
                "clientMutationId": "web-trip-plan-main-missing-target"
            }),
        ),
        (
            "set-main cross-trip target",
            cross_trip_plan_id,
            Method::POST,
            "/set-main",
            json!({
                "clientMutationId": "web-trip-plan-main-cross-trip-target"
            }),
        ),
    ] {
        let response = app
            .clone()
            .oneshot(
                Request::builder()
                    .method(method)
                    .uri(format!(
                        "/api/v1/trips/{}/trip-plans/{target_id}{uri_suffix}",
                        support::TRIP_ID
                    ))
                    .header(header::AUTHORIZATION, format!("Bearer {token}"))
                    .header(header::CONTENT_TYPE, "application/json")
                    .body(Body::from(body.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::NOT_FOUND, "{label}");
        let error_body: Value =
            serde_json::from_slice(&to_bytes(response.into_body(), 65536).await.unwrap()).unwrap();
        assert_eq!(error_body["code"], "not_found", "{label}");
    }

    let current_main: Uuid =
        sqlx::query_scalar("select active_plan_variant_id from trips where id = $1")
            .bind(Uuid::parse_str(support::TRIP_ID).unwrap())
            .fetch_one(&pool)
            .await
            .unwrap();
    let current_main_status: (String, Option<String>, i64) =
        sqlx::query_as("select kind, status, version from plan_variants where id = $1")
            .bind(Uuid::parse_str(support::PLAN_ID).unwrap())
            .fetch_one(&pool)
            .await
            .unwrap();
    assert_eq!(current_main, initial_main);
    assert_eq!(current_main_status, initial_main_status);
    assert_eq!(realtime_event_count(&pool).await, initial_event_count);
}

#[sqlx::test(migrations = "../../migrations")]
async fn trip_plan_contract_set_main_honors_previous_statuses_and_duplicate_guard(
    pool: sqlx::PgPool,
) {
    support::seed_trip(&pool).await;
    let token = support::create_session(&pool, support::ORGANIZER_ID).await;
    let app = support::app(pool.clone());
    let proposal_target_id = Uuid::now_v7();
    let draft_target_id = Uuid::now_v7();

    for (plan_id, name) in [
        (proposal_target_id, "Proposal demotion target"),
        (draft_target_id, "Draft demotion target"),
    ] {
        sqlx::query(
            "insert into plan_variants (id, trip_id, name, kind, status, description)
             values ($1, $2, $3, 'draft', 'draft', '')",
        )
        .bind(plan_id)
        .bind(Uuid::parse_str(support::TRIP_ID).unwrap())
        .bind(name)
        .execute(&pool)
        .await
        .unwrap();
    }

    let set_proposal = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!(
                    "/api/v1/trips/{}/trip-plans/{proposal_target_id}/set-main",
                    support::TRIP_ID
                ))
                .header(header::AUTHORIZATION, format!("Bearer {token}"))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "clientMutationId": "web-trip-plan-main-demote-proposal",
                        "previousMainNextStatus": "proposal"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(set_proposal.status(), StatusCode::OK);
    let proposal_trip: Value =
        serde_json::from_slice(&to_bytes(set_proposal.into_body(), 65536).await.unwrap()).unwrap();
    assert_eq!(
        proposal_trip["mainTripPlanId"],
        proposal_target_id.to_string()
    );

    let previous_main_pair: (String, String) =
        sqlx::query_as("select kind, status from plan_variants where id = $1")
            .bind(Uuid::parse_str(support::PLAN_ID).unwrap())
            .fetch_one(&pool)
            .await
            .unwrap();
    assert_eq!(
        previous_main_pair,
        ("split".to_string(), "proposal".to_string())
    );

    let event_count_after_first_set_main = realtime_event_count(&pool).await;
    let duplicate_set_main = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!(
                    "/api/v1/trips/{}/trip-plans/{proposal_target_id}/set-main",
                    support::TRIP_ID
                ))
                .header(header::AUTHORIZATION, format!("Bearer {token}"))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "clientMutationId": "web-trip-plan-main-demote-proposal",
                        "previousMainNextStatus": "backup"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(duplicate_set_main.status(), StatusCode::CONFLICT);
    assert_eq!(
        realtime_event_count(&pool).await,
        event_count_after_first_set_main
    );

    let set_draft = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!(
                    "/api/v1/trips/{}/trip-plans/{draft_target_id}/set-main",
                    support::TRIP_ID
                ))
                .header(header::AUTHORIZATION, format!("Bearer {token}"))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "clientMutationId": "web-trip-plan-main-demote-draft",
                        "previousMainNextStatus": "draft"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(set_draft.status(), StatusCode::OK);
    let draft_trip: Value =
        serde_json::from_slice(&to_bytes(set_draft.into_body(), 65536).await.unwrap()).unwrap();
    assert_eq!(draft_trip["mainTripPlanId"], draft_target_id.to_string());

    let proposal_target_pair: (String, String) =
        sqlx::query_as("select kind, status from plan_variants where id = $1")
            .bind(proposal_target_id)
            .fetch_one(&pool)
            .await
            .unwrap();
    assert_eq!(
        proposal_target_pair,
        ("draft".to_string(), "draft".to_string())
    );
}

#[sqlx::test(migrations = "../../migrations")]
async fn trip_plan_contract_noop_set_main_keeps_previous_main_payload_null(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    sqlx::query(
        "update plan_variants
         set kind = 'draft', status = 'proposal'
         where id = $1",
    )
    .bind(Uuid::parse_str(support::PLAN_ID).unwrap())
    .execute(&pool)
    .await
    .unwrap();
    let token = support::create_session(&pool, support::ORGANIZER_ID).await;
    let app = support::app(pool.clone());
    let initial_event_count = realtime_event_count(&pool).await;

    let response = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!(
                    "/api/v1/trips/{}/trip-plans/{}/set-main",
                    support::TRIP_ID,
                    support::PLAN_ID
                ))
                .header(header::AUTHORIZATION, format!("Bearer {token}"))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "clientMutationId": "web-trip-plan-main-noop"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);
    let trip: Value =
        serde_json::from_slice(&to_bytes(response.into_body(), 65536).await.unwrap()).unwrap();
    assert_eq!(trip["activePlanVariantId"], support::PLAN_ID);
    assert_eq!(trip["mainTripPlanId"], support::PLAN_ID);

    let stored_pair: (String, String) =
        sqlx::query_as("select kind, status from plan_variants where id = $1")
            .bind(Uuid::parse_str(support::PLAN_ID).unwrap())
            .fetch_one(&pool)
            .await
            .unwrap();
    assert_eq!(stored_pair, ("main".to_string(), "main".to_string()));

    let event_count_after_noop = realtime_event_count(&pool).await;
    assert_eq!(event_count_after_noop, initial_event_count + 1);

    let payload: Value = sqlx::query_scalar(
        "select payload
         from realtime_events
         where client_mutation_id = 'web-trip-plan-main-noop'
           and event_type = 'plan_variant.updated'
           and aggregate_type = 'plan_variant'",
    )
    .fetch_one(&pool)
    .await
    .unwrap();
    assert_eq!(payload["activePlanVariantId"], support::PLAN_ID);
    assert_eq!(payload["mainTripPlanId"], support::PLAN_ID);
    assert_eq!(payload["tripPlan"]["id"], support::PLAN_ID);
    assert_eq!(payload["tripPlan"]["kind"], "main");
    assert_eq!(payload["tripPlan"]["status"], "main");
    assert_eq!(payload["previousMainTripPlan"], Value::Null);
    assert_eq!(payload["trip"]["activePlanVariantId"], support::PLAN_ID);
    assert_eq!(payload["trip"]["mainTripPlanId"], support::PLAN_ID);

    let canonical_duplicate_event_count: i64 = sqlx::query_scalar(
        "select count(*)
         from realtime_events
         where client_mutation_id = 'web-trip-plan-main-noop'
           and event_type = 'trip_plan.updated'",
    )
    .fetch_one(&pool)
    .await
    .unwrap();
    assert_eq!(canonical_duplicate_event_count, 0);
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

#[sqlx::test(migrations = "../../migrations")]
async fn plan_variant_contract_traveler_cannot_manage_trip_plans(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    let alt_plan_id = support::seed_plan_variant(&pool).await;
    let token = support::create_session(&pool, support::TRAVELER_ID).await;
    let app = support::app(pool.clone());
    let initial_event_count = realtime_event_count(&pool).await;
    let initial_target: (String, Option<String>, i64) =
        sqlx::query_as("select name, status, version from plan_variants where id = $1")
            .bind(alt_plan_id)
            .fetch_one(&pool)
            .await
            .unwrap();

    for (label, method, uri, body) in [
        (
            "legacy create",
            Method::POST,
            format!("/api/v1/trips/{}/plan-variants", support::TRIP_ID),
            json!({
                "clientMutationId": "web-plan-create-traveler-forbidden",
                "name": "Traveler legacy plan",
                "kind": "draft",
                "description": "Should not be created"
            }),
        ),
        (
            "canonical create",
            Method::POST,
            format!("/api/v1/trips/{}/trip-plans", support::TRIP_ID),
            json!({
                "clientMutationId": "web-trip-plan-create-traveler-forbidden",
                "name": "Traveler canonical plan",
                "status": "draft",
                "description": "Should not be created"
            }),
        ),
        (
            "legacy patch",
            Method::PATCH,
            format!(
                "/api/v1/trips/{}/plan-variants/{alt_plan_id}",
                support::TRIP_ID
            ),
            json!({
                "clientMutationId": "web-plan-patch-traveler-forbidden",
                "expectedVersion": 1,
                "patch": {
                    "name": "Traveler patched legacy plan"
                }
            }),
        ),
        (
            "canonical patch",
            Method::PATCH,
            format!(
                "/api/v1/trips/{}/trip-plans/{alt_plan_id}",
                support::TRIP_ID
            ),
            json!({
                "clientMutationId": "web-trip-plan-patch-traveler-forbidden",
                "expectedVersion": 1,
                "patch": {
                    "status": "proposal"
                }
            }),
        ),
        (
            "legacy publish",
            Method::POST,
            format!(
                "/api/v1/trips/{}/plan-variants/{alt_plan_id}/publications",
                support::TRIP_ID
            ),
            json!({
                "clientMutationId": "web-plan-publish-traveler-forbidden"
            }),
        ),
        (
            "canonical set-main",
            Method::POST,
            format!(
                "/api/v1/trips/{}/trip-plans/{alt_plan_id}/set-main",
                support::TRIP_ID
            ),
            json!({
                "clientMutationId": "web-trip-plan-main-traveler-forbidden",
                "previousMainNextStatus": "backup"
            }),
        ),
    ] {
        let response = app
            .clone()
            .oneshot(
                Request::builder()
                    .method(method)
                    .uri(uri)
                    .header(header::AUTHORIZATION, format!("Bearer {token}"))
                    .header(header::CONTENT_TYPE, "application/json")
                    .body(Body::from(body.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(
            response.status(),
            StatusCode::FORBIDDEN,
            "{label} should require trip plan management"
        );
    }

    let created_count: i64 = sqlx::query_scalar(
        "select count(*) from plan_variants
         where trip_id = $1
           and name in ('Traveler legacy plan', 'Traveler canonical plan')",
    )
    .bind(Uuid::parse_str(support::TRIP_ID).unwrap())
    .fetch_one(&pool)
    .await
    .unwrap();
    assert_eq!(created_count, 0);

    let current_target: (String, Option<String>, i64) =
        sqlx::query_as("select name, status, version from plan_variants where id = $1")
            .bind(alt_plan_id)
            .fetch_one(&pool)
            .await
            .unwrap();
    assert_eq!(current_target, initial_target);

    let active_plan_variant_id: Uuid =
        sqlx::query_scalar("select active_plan_variant_id from trips where id = $1")
            .bind(Uuid::parse_str(support::TRIP_ID).unwrap())
            .fetch_one(&pool)
            .await
            .unwrap();
    assert_eq!(
        active_plan_variant_id,
        Uuid::parse_str(support::PLAN_ID).unwrap()
    );
    assert_eq!(realtime_event_count(&pool).await, initial_event_count);
}
