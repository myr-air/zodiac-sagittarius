mod support;

use axum::body::{Body, to_bytes};
use http::{Method, Request, StatusCode, header};
use serde_json::{Value, json};
use tower::ServiceExt;

#[sqlx::test(migrations = "../../migrations")]
async fn trip_load_contract_returns_cockpit_payload_and_filters_private_tasks(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    support::set_trip_dates(&pool, "2026-06-01", "2026-06-30").await;
    let traveler_token = support::create_session(&pool, support::TRAVELER_ID).await;
    support::seed_tasks(&pool).await;
    support::seed_stop_note(&pool).await;
    support::seed_expense(&pool).await;
    let app = support::app(pool);

    let response = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(format!("/api/v1/trips/{}", support::TRIP_ID))
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
    assert_eq!(body["trip"]["activePlanVariantId"], support::PLAN_ID);
    assert_eq!(body["trip"]["mainTripPlanId"], support::PLAN_ID);
    assert_eq!(body["members"].as_array().unwrap().len(), 4);
    assert_eq!(body["planVariants"].as_array().unwrap().len(), 1);
    assert_eq!(body["tripPlans"].as_array().unwrap().len(), 1);
    assert_eq!(body["planVariants"][0]["id"], support::PLAN_ID);
    assert_eq!(body["tripPlans"][0]["id"], support::PLAN_ID);
    assert_eq!(body["tripPlans"][0]["status"], "main");
    assert_eq!(body["itineraryItems"][0]["id"], support::ITEM_ID);
    assert_eq!(body["suggestions"].as_array().unwrap().len(), 0);
    assert_eq!(body["stopNotes"][0]["id"], support::STOP_NOTE_ID);
    assert_eq!(body["stopNotes"][0]["tripPlanId"], support::PLAN_ID);
    assert_eq!(body["stopNotes"][0]["itemId"], support::ITEM_ID);
    assert_eq!(body["stopNotes"][0]["authorId"], support::TRAVELER_ID);
    assert_eq!(
        body["stopNotes"][0]["body"],
        "Bring printed booking voucher"
    );
    assert_eq!(body["stopNotes"][0]["version"], 2);

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
            .all(|task| task["tripPlanId"] == support::PLAN_ID)
    );
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
    assert_eq!(body["expenseSummary"]["groupSpend"].as_f64(), Some(240.0));
    assert!(body["expenseSummary"]["netByMember"].is_object());
    assert_eq!(body["expenses"][0]["id"], support::EXPENSE_ID);
    assert_eq!(body["expenses"][0]["tripPlanId"], support::PLAN_ID);
    assert_eq!(body["expenses"][0]["itineraryItemId"], support::ITEM_ID);
    assert_eq!(body["expenses"][0]["amountMinor"], 24000);
}

#[sqlx::test(migrations = "../../migrations")]
async fn trip_load_contract_returns_whole_trip_plan_scoped_records(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    support::set_trip_dates(&pool, "2026-06-01", "2026-06-30").await;
    let traveler_token = support::create_session(&pool, support::TRAVELER_ID).await;
    support::seed_tasks(&pool).await;
    support::seed_stop_note(&pool).await;
    support::seed_expense(&pool).await;
    support::seed_booking_doc(&pool).await;
    let alt_item_id = support::seed_alt_plan_item(&pool).await;

    sqlx::query(
        "insert into trip_tasks (
           id, trip_id, trip_plan_id, title, status, visibility, kind, created_by, assignee_id
         )
         values (gen_random_uuid(), $1, $2, 'Alt plan check-in', 'open', 'shared', 'booking', $3, $3)",
    )
    .bind(uuid::Uuid::parse_str(support::TRIP_ID).unwrap())
    .bind(uuid::Uuid::parse_str(support::ALT_PLAN_ID).unwrap())
    .bind(uuid::Uuid::parse_str(support::TRAVELER_ID).unwrap())
    .execute(&pool)
    .await
    .unwrap();
    sqlx::query(
        "insert into stop_notes (
           id, trip_id, trip_plan_id, itinerary_item_id, author_id, body, version
         )
         values (gen_random_uuid(), $1, $2, $3, $4, 'Alt plan terminal note', 1)",
    )
    .bind(uuid::Uuid::parse_str(support::TRIP_ID).unwrap())
    .bind(uuid::Uuid::parse_str(support::ALT_PLAN_ID).unwrap())
    .bind(alt_item_id)
    .bind(uuid::Uuid::parse_str(support::TRAVELER_ID).unwrap())
    .execute(&pool)
    .await
    .unwrap();
    sqlx::query(
        "insert into expenses (
           id, trip_id, trip_plan_id, title, amount_minor, currency, paid_by, category, splits,
           itinerary_item_id
         )
         values (gen_random_uuid(), $1, $2, 'Alt plan airport bus', 5000, 'HKD', $3, 'transport', $4, $5)",
    )
    .bind(uuid::Uuid::parse_str(support::TRIP_ID).unwrap())
    .bind(uuid::Uuid::parse_str(support::ALT_PLAN_ID).unwrap())
    .bind(uuid::Uuid::parse_str(support::OWNER_ID).unwrap())
    .bind(serde_json::json!({
        support::OWNER_ID: 2500,
        support::TRAVELER_ID: 2500
    }))
    .bind(alt_item_id)
    .execute(&pool)
    .await
    .unwrap();
    sqlx::query(
        "insert into booking_docs (
           id, trip_id, trip_plan_id, type, title, status, visibility, owner_member_id,
           provider_name, confirmation_code, starts_at, ends_at, timezone, price_minor,
           currency, notes, created_by, version
         )
         values (
           gen_random_uuid(), $1, $2, 'activity_ticket', 'Alt gallery booking', 'draft', 'shared', $3,
           'M+', null, '2026-06-18T10:00:00+07:00',
           '2026-06-18T12:00:00+07:00', 'Asia/Bangkok', 5000,
           'HKD', 'Alt booking doc', $3, 1
         )",
    )
    .bind(uuid::Uuid::parse_str(support::TRIP_ID).unwrap())
    .bind(uuid::Uuid::parse_str(support::ALT_PLAN_ID).unwrap())
    .bind(uuid::Uuid::parse_str(support::TRAVELER_ID).unwrap())
    .execute(&pool)
    .await
    .unwrap();
    let app = support::app(pool);

    let response = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(format!("/api/v1/trips/{}", support::TRIP_ID))
                .header(header::AUTHORIZATION, format!("Bearer {traveler_token}"))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);
    let body: Value =
        serde_json::from_slice(&to_bytes(response.into_body(), 131072).await.unwrap()).unwrap();

    assert_eq!(body["tripPlans"].as_array().unwrap().len(), 2);
    assert!(
        body["tripPlans"]
            .as_array()
            .unwrap()
            .iter()
            .any(|plan| { plan["id"] == support::PLAN_ID && plan["status"] == "main" })
    );
    assert!(
        body["tripPlans"]
            .as_array()
            .unwrap()
            .iter()
            .any(|plan| { plan["id"] == support::ALT_PLAN_ID && plan["status"] == "draft" })
    );
    assert!(
        body["itineraryItems"]
            .as_array()
            .unwrap()
            .iter()
            .any(|item| {
                item["id"] == support::ITEM_ID && item["planVariantId"] == support::PLAN_ID
            })
    );
    assert!(
        body["itineraryItems"]
            .as_array()
            .unwrap()
            .iter()
            .any(|item| {
                item["id"] == alt_item_id.to_string()
                    && item["planVariantId"] == support::ALT_PLAN_ID
            })
    );
    assert!(body["tasks"].as_array().unwrap().iter().any(|task| {
        task["title"] == "Book Peak Tram" && task["tripPlanId"] == support::PLAN_ID
    }));
    assert!(body["tasks"].as_array().unwrap().iter().any(|task| {
        task["title"] == "Alt plan check-in" && task["tripPlanId"] == support::ALT_PLAN_ID
    }));
    assert!(body["stopNotes"].as_array().unwrap().iter().any(|note| {
        note["body"] == "Bring printed booking voucher" && note["tripPlanId"] == support::PLAN_ID
    }));
    assert!(body["stopNotes"].as_array().unwrap().iter().any(|note| {
        note["body"] == "Alt plan terminal note" && note["tripPlanId"] == support::ALT_PLAN_ID
    }));
    assert!(body["expenses"].as_array().unwrap().iter().any(|expense| {
        expense["title"] == "Dim sum breakfast" && expense["tripPlanId"] == support::PLAN_ID
    }));
    assert!(body["expenses"].as_array().unwrap().iter().any(|expense| {
        expense["title"] == "Alt plan airport bus" && expense["tripPlanId"] == support::ALT_PLAN_ID
    }));
    assert_eq!(body["expenseSummary"]["groupSpend"].as_f64(), Some(290.0));
    assert!(body["bookingDocs"].as_array().unwrap().iter().any(|doc| {
        doc["title"] == "Main plan flight" && doc["tripPlanId"] == support::PLAN_ID
    }));
    assert!(body["bookingDocs"].as_array().unwrap().iter().any(|doc| {
        doc["title"] == "Alt gallery booking" && doc["tripPlanId"] == support::ALT_PLAN_ID
    }));
}

#[sqlx::test(migrations = "../../migrations")]
async fn trip_load_contract_viewer_hides_expense_summary_and_private_tasks(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    let viewer_token = support::create_session(&pool, support::VIEWER_ID).await;
    support::seed_tasks(&pool).await;
    support::seed_expense(&pool).await;
    let app = support::app(pool);

    let response = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(format!("/api/v1/trips/{}", support::TRIP_ID))
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
    assert_eq!(body["expenses"].as_array().unwrap().len(), 0);
    let tasks = body["tasks"].as_array().unwrap();
    let task_titles: Vec<&str> = tasks
        .iter()
        .map(|task| task["title"].as_str().unwrap())
        .collect();
    assert_eq!(task_titles, vec!["Book Peak Tram"]);
    assert!(tasks.iter().all(|task| task["visibility"] == "shared"));
}

#[sqlx::test(migrations = "../../migrations")]
async fn trip_load_contract_uses_pointer_when_status_metadata_disagrees(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    sqlx::query("update trip_plans set status = 'draft' where id = $1")
        .bind(uuid::Uuid::parse_str(support::PLAN_ID).unwrap())
        .execute(&pool)
        .await
        .unwrap();
    let stale_status_plan_id = uuid::Uuid::now_v7();
    sqlx::query(
        "insert into trip_plans (id, trip_id, name, status, description)
         values ($1, $2, 'Stale status main', 'proposal', 'Raw support script drift')",
    )
    .bind(stale_status_plan_id)
    .bind(uuid::Uuid::parse_str(support::TRIP_ID).unwrap())
    .execute(&pool)
    .await
    .unwrap();
    let second_raw_main_id = uuid::Uuid::now_v7();
    sqlx::query(
        "insert into trip_plans (id, trip_id, name, status, description)
         values ($1, $2, 'Raw duplicate main', 'main', 'Raw duplicate main drift')",
    )
    .bind(second_raw_main_id)
    .bind(uuid::Uuid::parse_str(support::TRIP_ID).unwrap())
    .execute(&pool)
    .await
    .unwrap();
    let nullable_status_main_id = uuid::Uuid::now_v7();
    sqlx::query(
        "insert into trip_plans (id, trip_id, name, status, description)
         values ($1, $2, 'Nullable status main', 'main', 'Legacy nullable status drift')",
    )
    .bind(nullable_status_main_id)
    .bind(uuid::Uuid::parse_str(support::TRIP_ID).unwrap())
    .execute(&pool)
    .await
    .unwrap();
    let organizer_token = support::create_session(&pool, support::ORGANIZER_ID).await;
    let app = support::app(pool);

    let response = app
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

    assert_eq!(response.status(), StatusCode::OK);
    let body: Value =
        serde_json::from_slice(&to_bytes(response.into_body(), 131072).await.unwrap()).unwrap();
    assert_eq!(body["trip"]["activePlanVariantId"], support::PLAN_ID);
    assert_eq!(body["trip"]["mainTripPlanId"], support::PLAN_ID);
    assert_eq!(
        body["planVariants"], body["tripPlans"],
        "legacy and canonical Trip Plan aliases must stay coherent after repair",
    );
    assert!(body["tripPlans"].as_array().unwrap().iter().any(|plan| {
        plan["id"] == support::PLAN_ID && plan["kind"] == "main" && plan["status"] == "main"
    }));
    assert!(body["tripPlans"].as_array().unwrap().iter().any(|plan| {
        plan["id"] == stale_status_plan_id.to_string()
            && plan["kind"] == "split"
            && plan["status"] == "proposal"
    }));
    assert!(body["tripPlans"].as_array().unwrap().iter().any(|plan| {
        plan["id"] == second_raw_main_id.to_string()
            && plan["kind"] == "backup"
            && plan["status"] == "backup"
    }));
    assert!(body["tripPlans"].as_array().unwrap().iter().any(|plan| {
        plan["id"] == nullable_status_main_id.to_string()
            && plan["kind"] == "backup"
            && plan["status"] == "backup"
    }));
}

#[sqlx::test(migrations = "../../migrations")]
async fn trip_load_contract_serializes_missing_start_time_as_empty_string(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    support::set_trip_dates(&pool, "2026-06-01", "2026-06-30").await;
    sqlx::query("update itinerary_items set start_time = null where id = $1")
        .bind(uuid::Uuid::parse_str(support::ITEM_ID).unwrap())
        .execute(&pool)
        .await
        .unwrap();
    let traveler_token = support::create_session(&pool, support::TRAVELER_ID).await;
    let app = support::app(pool);

    let response = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(format!("/api/v1/trips/{}", support::TRIP_ID))
                .header(header::AUTHORIZATION, format!("Bearer {traveler_token}"))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);
    let body: Value =
        serde_json::from_slice(&to_bytes(response.into_body(), 131072).await.unwrap()).unwrap();
    assert_eq!(body["itineraryItems"][0]["startTime"], "");
}

#[sqlx::test(migrations = "../../migrations")]
async fn trip_load_contract_rejects_raw_empty_end_time_offset_drift(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    let result = sqlx::query(
        "update itinerary_items
         set end_time = null,
             end_offset_days = 1
         where id = $1",
    )
    .bind(uuid::Uuid::parse_str(support::ITEM_ID).unwrap())
    .execute(&pool)
    .await;

    assert!(
        result.is_err(),
        "end_offset_days > 0 without end_time was accepted"
    );
}

#[sqlx::test(migrations = "../../migrations")]
async fn trip_load_refreshes_organizer_session_but_not_viewer_session(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    support::set_trip_dates(&pool, "2026-06-01", "2026-06-30").await;
    let organizer_expiry = time::OffsetDateTime::now_utc() + time::Duration::hours(2);
    let viewer_expiry = time::OffsetDateTime::now_utc() + time::Duration::hours(2);
    let organizer_token =
        support::create_session_with_expiry(&pool, support::ORGANIZER_ID, organizer_expiry).await;
    let viewer_token =
        support::create_session_with_expiry(&pool, support::VIEWER_ID, viewer_expiry).await;
    let app = support::app(pool.clone());

    let organizer_response = app
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
    assert_eq!(organizer_response.status(), StatusCode::OK);

    let viewer_response = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(format!("/api/v1/trips/{}", support::TRIP_ID))
                .header(header::AUTHORIZATION, format!("Bearer {viewer_token}"))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(viewer_response.status(), StatusCode::OK);

    let organizer_refreshed =
        support::stored_member_session_expires_at(&pool, &organizer_token).await;
    let viewer_refreshed = support::stored_member_session_expires_at(&pool, &viewer_token).await;

    assert!(organizer_refreshed >= time::OffsetDateTime::now_utc() + time::Duration::hours(71));
    assert_eq!(
        viewer_refreshed,
        truncate_to_postgres_precision(viewer_expiry)
    );
}

fn truncate_to_postgres_precision(timestamp: time::OffsetDateTime) -> time::OffsetDateTime {
    timestamp
        .replace_nanosecond((timestamp.nanosecond() / 1_000) * 1_000)
        .unwrap()
}

#[sqlx::test(migrations = "../../migrations")]
async fn trip_load_allows_unexpired_session_after_trip_access_window(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    support::set_trip_dates(&pool, "2020-01-01", "2020-01-02").await;
    let organizer_token = support::create_session_with_expiry(
        &pool,
        support::ORGANIZER_ID,
        time::OffsetDateTime::now_utc() + time::Duration::days(30),
    )
    .await;
    let viewer_token = support::create_session_with_expiry(
        &pool,
        support::VIEWER_ID,
        time::OffsetDateTime::now_utc() + time::Duration::days(30),
    )
    .await;
    let app = support::app(pool);

    for token in [organizer_token, viewer_token] {
        let response = app
            .clone()
            .oneshot(
                Request::builder()
                    .method(Method::GET)
                    .uri(format!("/api/v1/trips/{}", support::TRIP_ID))
                    .header(header::AUTHORIZATION, format!("Bearer {token}"))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);
    }
}

#[sqlx::test(migrations = "../../migrations")]
async fn trip_load_contract_requires_bearer_session(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    let app = support::app(pool);

    let response = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(format!("/api/v1/trips/{}", support::TRIP_ID))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
}

#[sqlx::test(migrations = "../../migrations")]
async fn trip_load_contract_rejects_empty_bearer_token(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    let app = support::app(pool);

    let response = app
        .oneshot(
            Request::builder()
                .uri(format!("/api/v1/trips/{}", support::TRIP_ID))
                .header(header::AUTHORIZATION, "Bearer ")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
}

#[sqlx::test(migrations = "../../migrations")]
async fn trip_patch_contract_updates_metadata_and_rejects_stale_versions(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    let owner_token = support::create_session(&pool, support::OWNER_ID).await;
    let app = support::app(pool);

    let response = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::PATCH)
                .uri(format!("/api/v1/trips/{}", support::TRIP_ID))
                .header(header::AUTHORIZATION, format!("Bearer {owner_token}"))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "clientMutationId": "trip-patch-1",
                        "expectedVersion": 1,
                        "name": "Hong Kong revised",
                        "destinationLabel": "Hong Kong",
                        "countries": ["Hong Kong"]
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
    assert_eq!(body["name"], "Hong Kong revised");
    assert_eq!(body["destinationLabel"], "Hong Kong");
    assert_eq!(body["countries"], json!(["Hong Kong"]));
    assert_eq!(body["version"], 2);

    let stale = app
        .oneshot(
            Request::builder()
                .method(Method::PATCH)
                .uri(format!("/api/v1/trips/{}", support::TRIP_ID))
                .header(header::AUTHORIZATION, format!("Bearer {owner_token}"))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "clientMutationId": "trip-patch-2",
                        "expectedVersion": 1,
                        "name": "Stale"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(stale.status(), StatusCode::CONFLICT);
}

#[sqlx::test(migrations = "../../migrations")]
async fn trip_patch_contract_rejects_main_plan_pointer_mutation(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    let trip_id = uuid::Uuid::parse_str(support::TRIP_ID).unwrap();
    let alt_plan_id = uuid::Uuid::parse_str(support::ALT_PLAN_ID).unwrap();
    sqlx::query(
        "insert into trip_plans (id, trip_id, name, status, description)
         values ($1, $2, 'Draft option', 'draft', 'Draft route')",
    )
    .bind(alt_plan_id)
    .bind(trip_id)
    .execute(&pool)
    .await
    .unwrap();
    let owner_token = support::create_session(&pool, support::OWNER_ID).await;
    let app = support::app(pool.clone());
    let initial_event_count: i64 = sqlx::query_scalar("select count(*) from realtime_events")
        .fetch_one(&pool)
        .await
        .unwrap();

    for (field, client_mutation_id) in [
        ("activePlanVariantId", "trip-patch-main-plan-legacy"),
        ("mainTripPlanId", "trip-patch-main-plan-canonical"),
    ] {
        let response = app
            .clone()
            .oneshot(
                Request::builder()
                    .method(Method::PATCH)
                    .uri(format!("/api/v1/trips/{}", support::TRIP_ID))
                    .header(header::AUTHORIZATION, format!("Bearer {owner_token}"))
                    .header(header::CONTENT_TYPE, "application/json")
                    .body(Body::from(
                        json!({
                            "clientMutationId": client_mutation_id,
                            "expectedVersion": 1,
                            field: support::ALT_PLAN_ID
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
    }

    let trip_row: (uuid::Uuid, i64) =
        sqlx::query_as("select main_trip_plan_id, version from trips where id = $1")
            .bind(trip_id)
            .fetch_one(&pool)
            .await
            .unwrap();
    assert_eq!(trip_row.0, uuid::Uuid::parse_str(support::PLAN_ID).unwrap());
    assert_eq!(trip_row.1, 1);
    let event_count_after_rejections: i64 =
        sqlx::query_scalar("select count(*) from realtime_events")
            .fetch_one(&pool)
            .await
            .unwrap();
    assert_eq!(event_count_after_rejections, initial_event_count);
}

#[sqlx::test(migrations = "../../migrations")]
async fn trip_patch_contract_viewer_cannot_update_metadata(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    let viewer_token = support::create_session(&pool, support::VIEWER_ID).await;
    let app = support::app(pool);

    let response = app
        .oneshot(
            Request::builder()
                .method(Method::PATCH)
                .uri(format!("/api/v1/trips/{}", support::TRIP_ID))
                .header(header::AUTHORIZATION, format!("Bearer {viewer_token}"))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "clientMutationId": "trip-patch-viewer",
                        "expectedVersion": 1,
                        "name": "Forbidden"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::FORBIDDEN);
}
