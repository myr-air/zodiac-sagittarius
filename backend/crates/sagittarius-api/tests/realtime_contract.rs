mod support;

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
