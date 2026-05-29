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

    for table_name in [
        "trips",
        "trip_members",
        "trip_member_sessions",
        "plan_variants",
        "itinerary_items",
        "suggestions",
        "trip_tasks",
        "expenses",
        "realtime_events",
    ] {
        assert!(
            table_names.contains(&table_name.to_string()),
            "missing table {table_name}"
        );
    }
}

#[sqlx::test(migrations = "../../migrations")]
async fn migration_creates_vertical_slice_indexes(pool: sqlx::PgPool) {
    let index_names: Vec<String> = sqlx::query_scalar(
        "select indexname::text
         from pg_indexes
         where schemaname = 'public'
         order by indexname",
    )
    .fetch_all(&pool)
    .await
    .unwrap();

    for index_name in [
        "itinerary_items_trip_plan_day_sort_idx",
        "suggestions_trip_status_idx",
        "trip_tasks_trip_visibility_status_idx",
        "trip_tasks_assignee_status_idx",
        "trip_member_sessions_member_active_idx",
        "realtime_events_trip_id_idx",
        "realtime_events_client_mutation_id_idx",
    ] {
        assert!(
            index_names.contains(&index_name.to_string()),
            "missing index {index_name}"
        );
    }
}

#[sqlx::test(migrations = "../../migrations")]
async fn trips_cycle_foreign_keys_are_deferred(pool: sqlx::PgPool) {
    let constraints: Vec<(String, bool, bool)> = sqlx::query_as(
        "select conname::text, condeferrable, condeferred
         from pg_constraint
         where conname in ('trips_owner_member_id_fkey', 'trips_active_plan_variant_id_fkey')
         order by conname",
    )
    .fetch_all(&pool)
    .await
    .unwrap();

    assert_eq!(
        constraints,
        vec![
            ("trips_active_plan_variant_id_fkey".to_string(), true, true),
            ("trips_owner_member_id_fkey".to_string(), true, true),
        ]
    );
}

#[sqlx::test(migrations = "../../migrations")]
async fn deferred_constraints_allow_minimal_trip_graph(pool: sqlx::PgPool) {
    let mut tx = pool.begin().await.unwrap();
    sqlx::query("set constraints all deferred")
        .execute(&mut *tx)
        .await
        .unwrap();

    insert_trip(
        &mut tx,
        support::TRIP_ID,
        support::OWNER_ID,
        support::PLAN_ID,
        "join-main",
    )
    .await;
    insert_member(&mut tx, support::OWNER_ID, support::TRIP_ID, "owner").await;
    insert_plan(&mut tx, support::PLAN_ID, support::TRIP_ID).await;
    insert_item(
        &mut tx,
        support::ITEM_ID,
        support::TRIP_ID,
        support::PLAN_ID,
        support::OWNER_ID,
    )
    .await;

    tx.commit().await.unwrap();
}

#[sqlx::test(migrations = "../../migrations")]
async fn same_trip_composite_keys_reject_cross_trip_plan_reference(pool: sqlx::PgPool) {
    let mut tx = pool.begin().await.unwrap();
    sqlx::query("set constraints all deferred")
        .execute(&mut *tx)
        .await
        .unwrap();

    insert_trip(
        &mut tx,
        support::TRIP_ID,
        support::OWNER_ID,
        support::PLAN_ID,
        "join-main",
    )
    .await;
    insert_member(&mut tx, support::OWNER_ID, support::TRIP_ID, "owner").await;
    insert_plan(&mut tx, support::PLAN_ID, support::TRIP_ID).await;

    let other_trip_id = "018f4e80-5788-7de0-a45c-8a555d17fc3d";
    let other_owner_id = support::ORGANIZER_ID;
    let other_plan_id = "018f4e82-3000-7c00-b111-000000000002";

    insert_trip(
        &mut tx,
        other_trip_id,
        other_owner_id,
        other_plan_id,
        "join-other",
    )
    .await;
    insert_member(&mut tx, other_owner_id, other_trip_id, "owner").await;
    insert_plan(&mut tx, other_plan_id, other_trip_id).await;

    tx.commit().await.unwrap();

    let result = sqlx::query(
        "insert into itinerary_items (
           id, trip_id, plan_variant_id, day, sort_order, activity, activity_type, place, created_by
         )
         values ($1::uuid, $2::uuid, $3::uuid, '2026-06-01', 1, 'Breakfast', 'food', 'Cafe', $4::uuid)",
    )
    .bind(support::ITEM_ID)
    .bind(support::TRIP_ID)
    .bind(other_plan_id)
    .bind(support::OWNER_ID)
    .execute(&pool)
    .await;

    assert!(result.is_err(), "cross-trip plan reference was accepted");
}

#[sqlx::test(migrations = "../../migrations")]
async fn realtime_events_require_actor_for_client_mutation_id(pool: sqlx::PgPool) {
    let mut tx = pool.begin().await.unwrap();
    sqlx::query("set constraints all deferred")
        .execute(&mut *tx)
        .await
        .unwrap();

    insert_trip(
        &mut tx,
        support::TRIP_ID,
        support::OWNER_ID,
        support::PLAN_ID,
        "join-main",
    )
    .await;
    insert_member(&mut tx, support::OWNER_ID, support::TRIP_ID, "owner").await;
    insert_plan(&mut tx, support::PLAN_ID, support::TRIP_ID).await;

    tx.commit().await.unwrap();

    let result = sqlx::query(
        "insert into realtime_events (
           id, trip_id, aggregate_type, event_type, aggregate_id, version, payload, client_mutation_id, created_by
         )
         values
           ('018f4e84-5410-7d8b-8f25-fd52c5e7bd1f'::uuid, $1::uuid, 'trip', 'updated', $1::uuid, 1, '{}'::jsonb, 'mutation-1', null),
           ('018f4e84-5410-7d8b-8f25-fd52c5e7bd20'::uuid, $1::uuid, 'trip', 'updated', $1::uuid, 2, '{}'::jsonb, 'mutation-1', null)",
    )
    .bind(support::TRIP_ID)
    .execute(&pool)
    .await;

    assert!(
        result.is_err(),
        "client mutation id with null created_by was accepted"
    );
}

async fn insert_trip(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    trip_id: &str,
    owner_id: &str,
    plan_id: &str,
    join_id: &str,
) {
    sqlx::query(
        "insert into trips (
           id, name, destination_label, start_date, end_date, join_id, join_password_hash,
           active_plan_variant_id, owner_member_id
         )
         values ($1::uuid, 'Hong Kong', 'Hong Kong', '2026-06-01', '2026-06-07', $2, 'hash', $3::uuid, $4::uuid)",
    )
    .bind(trip_id)
    .bind(join_id)
    .bind(plan_id)
    .bind(owner_id)
    .execute(&mut **tx)
    .await
    .unwrap();
}

async fn insert_member(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    member_id: &str,
    trip_id: &str,
    role: &str,
) {
    sqlx::query(
        "insert into trip_members (id, trip_id, display_name, role, color)
         values ($1::uuid, $2::uuid, 'Owner', $3, '#123456')",
    )
    .bind(member_id)
    .bind(trip_id)
    .bind(role)
    .execute(&mut **tx)
    .await
    .unwrap();
}

async fn insert_plan(tx: &mut sqlx::Transaction<'_, sqlx::Postgres>, plan_id: &str, trip_id: &str) {
    sqlx::query(
        "insert into plan_variants (id, trip_id, name, kind)
         values ($1::uuid, $2::uuid, 'Main', 'main')",
    )
    .bind(plan_id)
    .bind(trip_id)
    .execute(&mut **tx)
    .await
    .unwrap();
}

async fn insert_item(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    item_id: &str,
    trip_id: &str,
    plan_id: &str,
    created_by: &str,
) {
    sqlx::query(
        "insert into itinerary_items (
           id, trip_id, plan_variant_id, day, sort_order, activity, activity_type, place, created_by
         )
         values ($1::uuid, $2::uuid, $3::uuid, '2026-06-01', 1, 'Breakfast', 'food', 'Cafe', $4::uuid)",
    )
    .bind(item_id)
    .bind(trip_id)
    .bind(plan_id)
    .bind(created_by)
    .execute(&mut **tx)
    .await
    .unwrap();
}
