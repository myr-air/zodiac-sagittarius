mod support;

use axum::body::Body;
use futures_util::StreamExt;
use http::{Method, Request, header};
use sagittarius_api::api::ws::should_send_live_event;
use sagittarius_api::app::{AppState, email::EmailDelivery, events, exchange_rates};
use sagittarius_api::domain::errors::ServiceError;
use sagittarius_api::realtime::{RealtimeEvent, RealtimeHub};
use serde_json::json;
use tokio::net::TcpListener;
use tokio::time::{Duration, timeout};
use tokio_tungstenite::connect_async;
use tokio_tungstenite::tungstenite::client::IntoClientRequest;
use tower::ServiceExt;
use uuid::Uuid;

#[sqlx::test(migrations = "../../migrations")]
async fn event_replay_returns_events_after_event_id(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    let first = support::insert_event(&pool, "task.created").await;
    let second = support::insert_event(&pool, "task.updated").await;

    let events = sagittarius_api::realtime::load_events_after(
        &pool,
        uuid::Uuid::parse_str(support::TRIP_ID).unwrap(),
        Some(first),
    )
    .await
    .unwrap();

    assert_eq!(events.len(), 1);
    assert_eq!(events[0].event_id, second);
    assert_eq!(events[0].event_type, "task.updated");

    let serialized = serde_json::to_value(&events[0]).unwrap();
    assert_eq!(serialized["eventId"], second.to_string());
    assert_eq!(serialized["type"], "task.updated");
}

#[sqlx::test(migrations = "../../migrations")]
async fn event_insert_maps_unique_conflicts_and_other_database_errors(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    let trip_id = Uuid::parse_str(support::TRIP_ID).unwrap();
    let actor_id = Uuid::parse_str(support::ORGANIZER_ID).unwrap();
    let aggregate_id = Uuid::now_v7();

    let mut tx = pool.begin().await.unwrap();
    let first = events::insert(
        &mut tx,
        events::EventWrite {
            trip_id,
            aggregate_type: "task",
            event_type: "task.created",
            aggregate_id,
            version: 1,
            payload: json!({"id": aggregate_id}),
            client_mutation_id: Some("event-duplicate"),
            created_by: Some(actor_id),
        },
    )
    .await
    .unwrap();
    assert_eq!(first.client_mutation_id.as_deref(), Some("event-duplicate"));

    let duplicate = events::insert(
        &mut tx,
        events::EventWrite {
            trip_id,
            aggregate_type: "task",
            event_type: "task.created",
            aggregate_id,
            version: 1,
            payload: json!({"id": aggregate_id}),
            client_mutation_id: Some("event-duplicate"),
            created_by: Some(actor_id),
        },
    )
    .await;
    assert!(matches!(duplicate, Err(ServiceError::VersionConflict)));
    tx.rollback().await.unwrap();

    let mut tx = pool.begin().await.unwrap();
    let missing_actor = events::insert(
        &mut tx,
        events::EventWrite {
            trip_id,
            aggregate_type: "task",
            event_type: "task.created",
            aggregate_id,
            version: 1,
            payload: json!({"id": aggregate_id}),
            client_mutation_id: Some("event-without-actor"),
            created_by: None,
        },
    )
    .await;
    assert!(matches!(missing_actor, Err(ServiceError::Database(_))));
    tx.rollback().await.unwrap();
}

#[test]
fn websocket_live_handoff_skips_events_already_sent_by_replay() {
    let trip_id = Uuid::parse_str(support::TRIP_ID).unwrap();
    let other_trip_id = Uuid::parse_str("018f4e80-5788-7de0-a45c-8a555d17fc2e").unwrap();
    let replayed_event_id = Uuid::parse_str("018f4e90-0000-7000-8000-000000000001").unwrap();
    let next_event_id = Uuid::parse_str("018f4e90-0000-7000-8000-000000000002").unwrap();

    assert!(!should_send_live_event(
        trip_id,
        trip_id,
        replayed_event_id,
        Some(replayed_event_id)
    ));
    assert!(should_send_live_event(
        trip_id,
        trip_id,
        next_event_id,
        Some(replayed_event_id)
    ));
    assert!(!should_send_live_event(
        trip_id,
        other_trip_id,
        next_event_id,
        Some(replayed_event_id)
    ));
}

#[sqlx::test(migrations = "../../migrations")]
async fn trip_plan_mutations_keep_legacy_realtime_wrapper_with_canonical_payload(
    pool: sqlx::PgPool,
) {
    support::seed_trip(&pool).await;
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
                        "clientMutationId": "realtime-trip-plan-create",
                        "name": "Realtime proposal",
                        "status": "proposal",
                        "description": "Realtime contract route"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(create.status(), http::StatusCode::CREATED);
    let created: serde_json::Value = serde_json::from_slice(
        &axum::body::to_bytes(create.into_body(), 65536)
            .await
            .unwrap(),
    )
    .unwrap();
    let trip_plan_id = created["id"].as_str().expect("trip plan id");

    let create_event: (String, String, serde_json::Value) = sqlx::query_as(
        "select event_type, aggregate_type, payload
         from realtime_events
         where client_mutation_id = 'realtime-trip-plan-create'",
    )
    .fetch_one(&pool)
    .await
    .unwrap();
    assert_eq!(create_event.0, "plan_variant.created");
    assert_eq!(create_event.1, "plan_variant");
    assert_eq!(create_event.2["id"], trip_plan_id);
    assert_eq!(create_event.2["kind"], "split");
    assert_eq!(create_event.2["status"], "proposal");

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
                        "clientMutationId": "realtime-trip-plan-patch",
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
    assert_eq!(patch.status(), http::StatusCode::OK);

    let patch_event: (String, String, serde_json::Value) = sqlx::query_as(
        "select event_type, aggregate_type, payload
         from realtime_events
         where client_mutation_id = 'realtime-trip-plan-patch'",
    )
    .fetch_one(&pool)
    .await
    .unwrap();
    assert_eq!(patch_event.0, "plan_variant.updated");
    assert_eq!(patch_event.1, "plan_variant");
    assert_eq!(patch_event.2["id"], trip_plan_id);
    assert_eq!(patch_event.2["kind"], "backup");
    assert_eq!(patch_event.2["status"], "backup");

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
                        "clientMutationId": "realtime-trip-plan-main",
                        "previousMainNextStatus": "draft"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(set_main.status(), http::StatusCode::OK);

    let set_main_event: (String, String, serde_json::Value) = sqlx::query_as(
        "select event_type, aggregate_type, payload
         from realtime_events
         where client_mutation_id = 'realtime-trip-plan-main'",
    )
    .fetch_one(&pool)
    .await
    .unwrap();
    assert_eq!(set_main_event.0, "plan_variant.updated");
    assert_eq!(set_main_event.1, "plan_variant");
    assert_eq!(set_main_event.2["activePlanVariantId"], trip_plan_id);
    assert_eq!(set_main_event.2["mainTripPlanId"], trip_plan_id);
    assert_eq!(set_main_event.2["tripPlan"]["id"], trip_plan_id);
    assert_eq!(set_main_event.2["tripPlan"]["kind"], "main");
    assert_eq!(set_main_event.2["tripPlan"]["status"], "main");
    assert_eq!(
        set_main_event.2["previousMainTripPlan"]["id"],
        support::PLAN_ID
    );
    assert_eq!(set_main_event.2["previousMainTripPlan"]["kind"], "draft");
    assert_eq!(set_main_event.2["previousMainTripPlan"]["status"], "draft");
    assert_eq!(set_main_event.2["trip"]["mainTripPlanId"], trip_plan_id);

    let canonical_duplicate_event_count: i64 = sqlx::query_scalar(
        "select count(*)
         from realtime_events
         where event_type in ('trip_plan.created', 'trip_plan.updated')",
    )
    .fetch_one(&pool)
    .await
    .unwrap();
    assert_eq!(canonical_duplicate_event_count, 0);
}

#[sqlx::test(migrations = "../../migrations")]
async fn websocket_route_replays_stored_events_and_streams_live_events(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    let token = support::create_session(&pool, support::ORGANIZER_ID).await;
    let replayed_event_id = support::insert_event(&pool, "task.created").await;
    let hub = RealtimeHub::default();
    let app = sagittarius_api::api::router(AppState {
        pool: pool.clone(),
        email_delivery: EmailDelivery::Disabled,
        exchange_rates: exchange_rates::ExchangeRateService::new(),
        realtime: hub.clone(),
        daily_briefing_weather_fetch: false,
    });
    let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
    let address = listener.local_addr().unwrap();
    let server = tokio::spawn(async move {
        axum::serve(listener, app).await.unwrap();
    });

    let url = format!(
        "ws://{address}/api/v1/trips/{}/events/stream?token={token}",
        support::TRIP_ID
    );
    let (mut socket, _) = connect_async(url).await.unwrap();

    let replay = timeout(Duration::from_secs(2), socket.next())
        .await
        .unwrap()
        .unwrap()
        .unwrap();
    let replay = replay.into_text().unwrap();
    let replay: serde_json::Value = serde_json::from_str(&replay).unwrap();
    assert_eq!(replay["eventId"], replayed_event_id.to_string());
    assert_eq!(replay["type"], "task.created");

    let live_event_id = Uuid::now_v7();
    hub.publish(RealtimeEvent {
        event_id: Uuid::now_v7(),
        trip_id: Uuid::parse_str("018f4e80-5788-7de0-a45c-8a555d17fc2e").unwrap(),
        event_type: "task.updated".to_string(),
        aggregate_id: Uuid::now_v7(),
        version: 2,
        client_mutation_id: Some("ws-other-trip".to_string()),
        actor_member_id: Some(Uuid::parse_str(support::ORGANIZER_ID).unwrap()),
        occurred_at: "2026-05-29T00:00:00Z".to_string(),
        payload: json!({ "id": "task-other-trip" }),
    })
    .await;
    assert!(
        timeout(Duration::from_millis(100), socket.next())
            .await
            .is_err()
    );

    hub.publish(RealtimeEvent {
        event_id: live_event_id,
        trip_id: Uuid::parse_str(support::TRIP_ID).unwrap(),
        event_type: "task.updated".to_string(),
        aggregate_id: Uuid::now_v7(),
        version: 2,
        client_mutation_id: Some("ws-live".to_string()),
        actor_member_id: Some(Uuid::parse_str(support::ORGANIZER_ID).unwrap()),
        occurred_at: "2026-05-29T00:00:00Z".to_string(),
        payload: json!({ "id": "task-live" }),
    })
    .await;

    let live = timeout(Duration::from_secs(2), socket.next())
        .await
        .unwrap()
        .unwrap()
        .unwrap();
    let live = live.into_text().unwrap();
    let live: serde_json::Value = serde_json::from_str(&live).unwrap();
    assert_eq!(live["eventId"], live_event_id.to_string());
    assert_eq!(live["type"], "task.updated");
    assert_eq!(live["clientMutationId"], "ws-live");

    drop(socket);
    server.abort();
}

#[sqlx::test(migrations = "../../migrations")]
async fn websocket_route_accepts_bearer_header_session(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    let token = support::create_session(&pool, support::ORGANIZER_ID).await;
    let hub = RealtimeHub::default();
    let app = sagittarius_api::api::router(AppState {
        pool,
        email_delivery: EmailDelivery::Disabled,
        exchange_rates: exchange_rates::ExchangeRateService::new(),
        realtime: hub.clone(),
        daily_briefing_weather_fetch: false,
    });
    let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
    let address = listener.local_addr().unwrap();
    let server = tokio::spawn(async move {
        axum::serve(listener, app).await.unwrap();
    });

    let url = format!(
        "ws://{address}/api/v1/trips/{}/events/stream",
        support::TRIP_ID
    );
    let mut request = url.into_client_request().unwrap();
    request
        .headers_mut()
        .insert("authorization", format!("Bearer {token}").parse().unwrap());
    let (mut socket, response) = connect_async(request).await.unwrap();
    assert_eq!(response.status(), http::StatusCode::SWITCHING_PROTOCOLS);

    let live_event_id = Uuid::now_v7();
    hub.publish(RealtimeEvent {
        event_id: live_event_id,
        trip_id: Uuid::parse_str(support::TRIP_ID).unwrap(),
        event_type: "task.header".to_string(),
        aggregate_id: Uuid::now_v7(),
        version: 1,
        client_mutation_id: None,
        actor_member_id: Some(Uuid::parse_str(support::ORGANIZER_ID).unwrap()),
        occurred_at: "2026-05-29T00:00:00Z".to_string(),
        payload: json!({ "id": "task-header" }),
    })
    .await;

    let live = timeout(Duration::from_secs(2), socket.next())
        .await
        .unwrap()
        .unwrap()
        .unwrap();
    let live = live.into_text().unwrap();
    let live: serde_json::Value = serde_json::from_str(&live).unwrap();
    assert_eq!(live["eventId"], live_event_id.to_string());
    assert_eq!(live["type"], "task.header");

    drop(socket);
    server.abort();
}

#[sqlx::test(migrations = "../../migrations")]
async fn websocket_route_does_not_send_expense_events_to_viewer(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    let token = support::create_session(&pool, support::VIEWER_ID).await;
    let hub = RealtimeHub::default();
    let app = sagittarius_api::api::router(AppState {
        pool,
        email_delivery: EmailDelivery::Disabled,
        exchange_rates: exchange_rates::ExchangeRateService::new(),
        realtime: hub.clone(),
        daily_briefing_weather_fetch: false,
    });
    let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
    let address = listener.local_addr().unwrap();
    let server = tokio::spawn(async move {
        axum::serve(listener, app).await.unwrap();
    });

    let url = format!(
        "ws://{address}/api/v1/trips/{}/events/stream?token={token}",
        support::TRIP_ID
    );
    let (mut socket, _) = connect_async(url).await.unwrap();

    hub.publish(RealtimeEvent {
        event_id: Uuid::now_v7(),
        trip_id: Uuid::parse_str(support::TRIP_ID).unwrap(),
        event_type: "expense.created".to_string(),
        aggregate_id: Uuid::parse_str(support::EXPENSE_ID).unwrap(),
        version: 1,
        client_mutation_id: Some("viewer-expense-leak".to_string()),
        actor_member_id: Some(Uuid::parse_str(support::ORGANIZER_ID).unwrap()),
        occurred_at: "2026-05-29T00:00:00Z".to_string(),
        payload: json!({ "title": "Private dinner", "amountMinor": 12500 }),
    })
    .await;

    assert!(
        timeout(Duration::from_millis(150), socket.next())
            .await
            .is_err()
    );

    drop(socket);
    server.abort();
}

#[sqlx::test(migrations = "../../migrations")]
async fn websocket_route_closes_when_live_receiver_lags(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    let token = support::create_session(&pool, support::ORGANIZER_ID).await;
    let hub = RealtimeHub::with_capacity(1);
    let app = sagittarius_api::api::router(AppState {
        pool,
        email_delivery: EmailDelivery::Disabled,
        exchange_rates: exchange_rates::ExchangeRateService::new(),
        realtime: hub.clone(),
        daily_briefing_weather_fetch: false,
    });
    let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
    let address = listener.local_addr().unwrap();
    let server = tokio::spawn(async move {
        axum::serve(listener, app).await.unwrap();
    });

    let url = format!(
        "ws://{address}/api/v1/trips/{}/events/stream?token={token}",
        support::TRIP_ID
    );
    let (mut socket, _) = connect_async(url).await.unwrap();
    for index in 0..1000 {
        hub.publish(RealtimeEvent {
            event_id: Uuid::now_v7(),
            trip_id: Uuid::parse_str(support::TRIP_ID).unwrap(),
            event_type: "task.flood".to_string(),
            aggregate_id: Uuid::now_v7(),
            version: index,
            client_mutation_id: None,
            actor_member_id: Some(Uuid::parse_str(support::ORGANIZER_ID).unwrap()),
            occurred_at: "2026-05-29T00:00:00Z".to_string(),
            payload: json!({ "index": index }),
        })
        .await;
    }

    let mut saw_close = false;
    for _ in 0..20 {
        let Some(message) = timeout(Duration::from_secs(2), socket.next())
            .await
            .unwrap()
        else {
            break;
        };
        if message.unwrap().is_close() {
            saw_close = true;
            break;
        }
    }
    assert!(saw_close);

    drop(socket);
    server.abort();
}
