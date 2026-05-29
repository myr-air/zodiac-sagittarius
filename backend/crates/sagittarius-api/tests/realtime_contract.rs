mod support;

use sagittarius_api::api::ws::should_send_live_event;
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
