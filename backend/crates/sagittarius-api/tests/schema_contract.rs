mod support;

#[sqlx::test(migrations = "../../migrations")]
async fn migration_creates_vertical_slice_tables(pool: sqlx::PgPool) {
    let table_names: Vec<String> = sqlx::query_scalar(
        "select table_name::text
         from information_schema.tables
         where table_schema = 'public'
         order by table_name",
    )
    .fetch_all(&pool)
    .await
    .unwrap();

    assert!(table_names.contains(&"trips".to_string()));
    assert!(table_names.contains(&"trip_members".to_string()));
    assert!(table_names.contains(&"trip_member_sessions".to_string()));
    assert!(table_names.contains(&"itinerary_items".to_string()));
    assert!(table_names.contains(&"suggestions".to_string()));
    assert!(table_names.contains(&"trip_tasks".to_string()));
    assert!(table_names.contains(&"realtime_events".to_string()));
}
