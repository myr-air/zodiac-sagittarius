mod support;

#[sqlx::test(migrations = "../../migrations")]
async fn account_identity_migration_creates_tables(pool: sqlx::PgPool) {
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
        "users",
        "user_emails",
        "email_login_challenges",
        "webauthn_challenges",
        "webauthn_credentials",
        "trusted_devices",
        "user_sessions",
        "account_audit_events",
    ] {
        assert!(
            table_names.contains(&table_name.to_string()),
            "missing table {table_name}"
        );
    }
}

#[sqlx::test(migrations = "../../migrations")]
async fn account_identity_migration_creates_indexes(pool: sqlx::PgPool) {
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
        "user_emails_normalized_email_idx",
        "user_sessions_token_hash_idx",
        "user_sessions_user_active_idx",
        "trusted_devices_user_active_idx",
        "trip_members_user_id_idx",
        "account_audit_events_user_created_idx",
        "trip_members_one_owner_per_trip_idx",
    ] {
        assert!(
            index_names.contains(&index_name.to_string()),
            "missing index {index_name}"
        );
    }
}

#[sqlx::test(migrations = "../../migrations")]
async fn trip_members_user_id_references_users(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;

    let result = sqlx::query(
        "update trip_members
         set user_id = '018f4e80-0000-7000-a000-000000000999'::uuid
         where id = $1::uuid",
    )
    .bind(support::OWNER_ID)
    .execute(&pool)
    .await;

    assert!(result.is_err(), "trip member accepted a missing user_id");
}

#[sqlx::test(migrations = "../../migrations")]
async fn only_one_owner_role_is_allowed_per_trip(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;

    let result = sqlx::query(
        "update trip_members
         set role = 'owner'
         where id = $1::uuid",
    )
    .bind(support::ORGANIZER_ID)
    .execute(&pool)
    .await;

    assert!(result.is_err(), "trip accepted two owner members");
}
