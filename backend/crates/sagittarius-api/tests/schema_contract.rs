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
        "stop_notes",
        "trip_daily_briefings",
        "expense_reminders",
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
        "trip_tasks_trip_plan_active_idx",
        "expenses_trip_plan_active_idx",
        "stop_notes_trip_plan_item_idx",
        "booking_docs_trip_plan_active_idx",
        "plan_checks_trip_plan_created_idx",
        "itinerary_items_time_window_idx",
        "itinerary_items_parent_scope_idx",
        "itinerary_items_parent_scope_key",
        "trip_member_sessions_member_active_idx",
        "stop_notes_trip_item_created_at_idx",
        "trip_daily_briefings_trip_date_idx",
        "expense_reminders_trip_pair_idx",
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
async fn itinerary_schema_stores_time_windows(pool: sqlx::PgPool) {
    let columns: Vec<(String, String)> = sqlx::query_as(
        "select column_name::text, data_type::text
         from information_schema.columns
         where table_schema = 'public'
           and table_name = 'itinerary_items'
           and column_name in ('end_time', 'end_offset_days')
         order by column_name",
    )
    .fetch_all(&pool)
    .await
    .unwrap();

    assert_eq!(
        columns,
        vec![
            ("end_offset_days".to_string(), "integer".to_string()),
            ("end_time".to_string(), "time without time zone".to_string()),
        ]
    );

    let constraints: Vec<String> = sqlx::query_scalar(
        "select conname::text
         from pg_constraint
         where conname in (
           'itinerary_items_no_self_parent_check',
           'itinerary_items_parent_scope_fkey'
         )
         order by conname",
    )
    .fetch_all(&pool)
    .await
    .unwrap();
    assert_eq!(
        constraints,
        vec![
            "itinerary_items_no_self_parent_check".to_string(),
            "itinerary_items_parent_scope_fkey".to_string(),
        ]
    );
}

#[sqlx::test(migrations = "../../migrations")]
async fn itinerary_schema_rejects_parent_outside_child_day_or_plan(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;

    let other_plan_id = uuid::Uuid::now_v7();
    sqlx::query(
        "insert into plan_variants (id, trip_id, name, kind, status)
         values ($1, $2, 'Backup', 'backup', 'backup')",
    )
    .bind(other_plan_id)
    .bind(uuid::Uuid::parse_str(support::TRIP_ID).unwrap())
    .execute(&pool)
    .await
    .unwrap();

    let parent_id = uuid::Uuid::now_v7();
    sqlx::query(
        "insert into itinerary_items (
           id, trip_id, plan_variant_id, day, sort_order, start_time,
           activity, activity_type, place, created_by
         )
         values ($1, $2, $3, '2025-05-17', 100, '09:00',
           'Other day parent', 'experience', 'Hotel', $4)",
    )
    .bind(parent_id)
    .bind(uuid::Uuid::parse_str(support::TRIP_ID).unwrap())
    .bind(other_plan_id)
    .bind(uuid::Uuid::parse_str(support::ORGANIZER_ID).unwrap())
    .execute(&pool)
    .await
    .unwrap();

    let child_result = sqlx::query(
        "insert into itinerary_items (
           id, trip_id, plan_variant_id, parent_item_id, day, sort_order,
           start_time, activity, activity_type, place, created_by
         )
         values ($1, $2, $3, $4, '2025-05-16', 200,
           '09:15', 'Invalid child', 'experience', 'Hotel', $5)",
    )
    .bind(uuid::Uuid::now_v7())
    .bind(uuid::Uuid::parse_str(support::TRIP_ID).unwrap())
    .bind(uuid::Uuid::parse_str(support::PLAN_ID).unwrap())
    .bind(parent_id)
    .bind(uuid::Uuid::parse_str(support::ORGANIZER_ID).unwrap())
    .execute(&pool)
    .await;

    assert!(
        child_result.is_err(),
        "DB must reject parent_item_id outside the child's trip plan/day scope",
    );
}

#[sqlx::test(migrations = "../../migrations")]
async fn plan_scoped_record_schema_adds_trip_plan_columns_and_fkeys(pool: sqlx::PgPool) {
    let columns: Vec<(String, String)> = sqlx::query_as(
        "select table_name::text, column_name::text
         from information_schema.columns
         where table_schema = 'public'
           and table_name in ('trip_tasks', 'expenses', 'stop_notes', 'booking_docs')
           and column_name = 'trip_plan_id'
         order by table_name",
    )
    .fetch_all(&pool)
    .await
    .unwrap();

    assert_eq!(
        columns,
        vec![
            ("booking_docs".to_string(), "trip_plan_id".to_string()),
            ("expenses".to_string(), "trip_plan_id".to_string()),
            ("stop_notes".to_string(), "trip_plan_id".to_string()),
            ("trip_tasks".to_string(), "trip_plan_id".to_string()),
        ]
    );

    let constraints: Vec<String> = sqlx::query_scalar(
        "select conname::text
         from pg_constraint
         where conname in (
           'trip_tasks_trip_plan_fkey',
           'expenses_trip_plan_fkey',
           'stop_notes_trip_plan_fkey',
           'booking_docs_trip_plan_fkey'
         )
         order by conname",
    )
    .fetch_all(&pool)
    .await
    .unwrap();

    assert_eq!(
        constraints,
        vec![
            "booking_docs_trip_plan_fkey".to_string(),
            "expenses_trip_plan_fkey".to_string(),
            "stop_notes_trip_plan_fkey".to_string(),
            "trip_tasks_trip_plan_fkey".to_string(),
        ]
    );
}

#[sqlx::test(migrations = "../../migrations")]
async fn plan_check_schema_adds_trip_plan_scope(pool: sqlx::PgPool) {
    let columns: Vec<(String, String)> = sqlx::query_as(
        "select column_name::text, data_type::text
         from information_schema.columns
         where table_schema = 'public'
           and table_name = 'plan_checks'
           and column_name = 'trip_plan_id'
         order by column_name",
    )
    .fetch_all(&pool)
    .await
    .unwrap();

    assert_eq!(
        columns,
        vec![("trip_plan_id".to_string(), "uuid".to_string())]
    );

    let constraints: Vec<String> = sqlx::query_scalar(
        "select conname::text
         from pg_constraint
         where conname = 'plan_checks_trip_plan_fkey'
         order by conname",
    )
    .fetch_all(&pool)
    .await
    .unwrap();
    assert_eq!(constraints, vec!["plan_checks_trip_plan_fkey".to_string()]);
}

#[sqlx::test(migrations = "../../migrations")]
async fn trip_plan_compatibility_schema_adds_status_and_keeps_composite_identity(
    pool: sqlx::PgPool,
) {
    let columns: Vec<(String, String, String)> = sqlx::query_as(
        "select column_name::text, data_type::text, is_nullable::text
         from information_schema.columns
         where table_schema = 'public'
           and table_name = 'plan_variants'
           and column_name = 'status'",
    )
    .fetch_all(&pool)
    .await
    .unwrap();
    assert_eq!(
        columns,
        vec![("status".to_string(), "text".to_string(), "YES".to_string(),)],
    );

    let status_check: Option<String> = sqlx::query_scalar(
        "select pg_get_constraintdef(oid)
         from pg_constraint
         where conname = 'plan_variants_status_check'",
    )
    .fetch_optional(&pool)
    .await
    .unwrap();
    let status_check = status_check.expect("missing plan_variants_status_check");
    for status in ["main", "draft", "proposal", "backup"] {
        assert!(
            status_check.contains(status),
            "status check must allow {status}: {status_check}",
        );
    }

    let composite_unique_count: i64 = sqlx::query_scalar(
        "select count(*)
         from pg_constraint
         where conrelid = 'plan_variants'::regclass
           and contype in ('p', 'u')
           and conkey = ARRAY[
             (select attnum from pg_attribute where attrelid = 'plan_variants'::regclass and attname = 'id'),
             (select attnum from pg_attribute where attrelid = 'plan_variants'::regclass and attname = 'trip_id')
           ]::smallint[]",
    )
    .fetch_one(&pool)
    .await
    .unwrap();
    assert!(
        composite_unique_count >= 1,
        "plan_variants(id, trip_id) must stay unique for composite FKs",
    );
}

#[sqlx::test(migrations = "../../migrations")]
async fn trip_plan_compatibility_backfills_split_kind_to_proposal_status(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    let plan_id = uuid::Uuid::now_v7();

    sqlx::query("insert into plan_variants (id, trip_id, name, kind, status) values ($1, $2, 'Legacy split', 'split', null)")
        .bind(plan_id)
        .bind(uuid::Uuid::parse_str(support::TRIP_ID).unwrap())
        .execute(&pool)
        .await
        .unwrap();

    let status: String = sqlx::query_scalar(
        "select coalesce(status, case when kind = 'split' then 'proposal' else kind end)
         from plan_variants
         where id = $1",
    )
    .bind(plan_id)
    .fetch_one(&pool)
    .await
    .unwrap();
    assert_eq!(status, "proposal");
}

#[test]
fn plan_scoped_record_migration_keeps_linked_records_with_item_plan() {
    let migration = include_str!("../../../migrations/0026_plan_scoped_records.sql");
    let linked_task_backfill = "UPDATE trip_tasks task\nSET trip_plan_id = item.plan_variant_id";
    let fallback_task_backfill =
        "UPDATE trip_tasks task\nSET trip_plan_id = trips.active_plan_variant_id";
    let linked_backfill = "UPDATE expenses expense\nSET trip_plan_id = item.plan_variant_id";
    let fallback_backfill =
        "UPDATE expenses expense\nSET trip_plan_id = trips.active_plan_variant_id";

    assert!(
        migration.contains(linked_task_backfill),
        "linked trip tasks must backfill from itinerary_items.plan_variant_id",
    );
    assert!(
        migration.contains("AND task.related_item_id = item.id"),
        "linked trip tasks must join through related_item_id",
    );
    assert!(
        migration.contains("AND task.related_item_id IS NULL"),
        "Main Plan fallback must only apply to unlinked trip tasks",
    );
    assert!(
        migration.find(linked_task_backfill).unwrap()
            < migration.find(fallback_task_backfill).unwrap(),
        "linked task backfill must run before the Main Plan fallback",
    );

    assert!(
        migration.contains(linked_backfill),
        "linked Actual Expenses must backfill from itinerary_items.plan_variant_id",
    );
    assert!(
        migration.contains("AND expense.itinerary_item_id = item.id"),
        "linked Actual Expenses must join through itinerary_item_id",
    );
    assert!(
        migration.contains("AND expense.itinerary_item_id IS NULL"),
        "Main Plan fallback must only apply to unlinked Actual Expenses",
    );
    assert!(
        migration.find(linked_backfill).unwrap() < migration.find(fallback_backfill).unwrap(),
        "linked expense backfill must run before the Main Plan fallback",
    );
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
async fn daily_briefings_schema_stores_cache_and_manual_overrides(pool: sqlx::PgPool) {
    let columns: Vec<(String, String)> = sqlx::query_as(
        "select column_name::text, data_type::text
         from information_schema.columns
         where table_schema = 'public'
           and table_name = 'trip_daily_briefings'
         order by ordinal_position",
    )
    .fetch_all(&pool)
    .await
    .unwrap();

    for (column_name, data_type) in [
        ("trip_id", "uuid"),
        ("briefing_date", "date"),
        ("location_key", "text"),
        ("location_label", "text"),
        ("coordinates", "jsonb"),
        ("weather", "jsonb"),
        ("holiday", "jsonb"),
        ("festival", "jsonb"),
        ("facts", "jsonb"),
        ("outfit_advice", "jsonb"),
        ("manual_overrides", "jsonb"),
        ("version", "bigint"),
    ] {
        assert!(
            columns.contains(&(column_name.to_string(), data_type.to_string())),
            "missing column {column_name} {data_type}"
        );
    }

    let unique_constraints: Vec<String> = sqlx::query_scalar(
        "select conname::text
         from pg_constraint
         where conrelid = 'trip_daily_briefings'::regclass
           and contype = 'u'",
    )
    .fetch_all(&pool)
    .await
    .unwrap();
    assert!(
        unique_constraints
            .iter()
            .any(|name| name.contains("trip_daily_briefings_trip_id_briefing_date_location_key")),
        "missing unique cache key"
    );
}

#[sqlx::test(migrations = "../../migrations")]
async fn expenses_schema_stores_receipts_itemization_and_exchange_rates(pool: sqlx::PgPool) {
    let columns: Vec<(String, String)> = sqlx::query_as(
        "select column_name::text, data_type::text
         from information_schema.columns
         where table_schema = 'public'
           and table_name = 'expenses'
         order by ordinal_position",
    )
    .fetch_all(&pool)
    .await
    .unwrap();

    for (column_name, data_type) in [
        ("notes", "text"),
        ("receipt_url", "text"),
        ("line_items", "jsonb"),
        ("comments", "jsonb"),
        ("exchange_rate_to_settlement_currency", "double precision"),
    ] {
        assert!(
            columns.contains(&(column_name.to_string(), data_type.to_string())),
            "missing column {column_name} {data_type}",
        );
    }
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
