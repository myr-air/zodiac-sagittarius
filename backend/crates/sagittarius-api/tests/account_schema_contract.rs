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
        "email_login_outbox",
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
        "email_login_challenges_email_active_idx",
        "email_login_outbox_challenge_idx",
        "webauthn_challenges_challenge_active_idx",
        "webauthn_credentials_credential_id_idx",
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

#[sqlx::test(migrations = "../../migrations")]
async fn owner_members_cannot_be_disabled(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;

    let result = sqlx::query(
        "update trip_members
         set access_status = 'disabled'
         where id = $1::uuid",
    )
    .bind(support::OWNER_ID)
    .execute(&pool)
    .await;

    assert!(result.is_err(), "trip owner member was disabled");
}

#[sqlx::test(migrations = "../../migrations")]
async fn trusted_sessions_cannot_use_another_users_device(pool: sqlx::PgPool) {
    sqlx::query(
        "insert into users (id, display_name, avatar_color)
         values
           ('018f4e80-0000-7000-a000-000000000001'::uuid, 'User A', '#0f766e'),
           ('018f4e80-0000-7000-a000-000000000002'::uuid, 'User B', '#2563eb')",
    )
    .execute(&pool)
    .await
    .unwrap();

    sqlx::query(
        "insert into trusted_devices (id, user_id, label)
         values (
           '018f4e80-0000-7000-a000-000000000101'::uuid,
           '018f4e80-0000-7000-a000-000000000001'::uuid,
           'User A laptop'
         )",
    )
    .execute(&pool)
    .await
    .unwrap();

    let result = sqlx::query(
        "insert into user_sessions (
           id, user_id, trusted_device_id, session_token_hash, kind, expires_at
         )
         values (
           '018f4e80-0000-7000-a000-000000000201'::uuid,
           '018f4e80-0000-7000-a000-000000000002'::uuid,
           '018f4e80-0000-7000-a000-000000000101'::uuid,
           'cross-user-device-session',
           'trusted',
           now() + interval '30 days'
         )",
    )
    .execute(&pool)
    .await;

    assert!(
        result.is_err(),
        "trusted session accepted another user's device"
    );
}

#[sqlx::test(migrations = "../../migrations")]
async fn session_kind_must_match_trusted_device_presence(pool: sqlx::PgPool) {
    sqlx::query(
        "insert into users (id, display_name, avatar_color)
         values ('018f4e80-0000-7000-a000-000000000001'::uuid, 'User A', '#0f766e')",
    )
    .execute(&pool)
    .await
    .unwrap();

    sqlx::query(
        "insert into trusted_devices (id, user_id, label)
         values (
           '018f4e80-0000-7000-a000-000000000101'::uuid,
           '018f4e80-0000-7000-a000-000000000001'::uuid,
           'User A laptop'
         )",
    )
    .execute(&pool)
    .await
    .unwrap();

    let trusted_without_device = sqlx::query(
        "insert into user_sessions (
           id, user_id, trusted_device_id, session_token_hash, kind, expires_at
         )
         values (
           '018f4e80-0000-7000-a000-000000000201'::uuid,
           '018f4e80-0000-7000-a000-000000000001'::uuid,
           null,
           'trusted-without-device',
           'trusted',
           now() + interval '30 days'
         )",
    )
    .execute(&pool)
    .await;

    assert!(
        trusted_without_device.is_err(),
        "trusted session accepted a missing trusted_device_id"
    );

    let temporary_with_device = sqlx::query(
        "insert into user_sessions (
           id, user_id, trusted_device_id, session_token_hash, kind, expires_at
         )
         values (
           '018f4e80-0000-7000-a000-000000000202'::uuid,
           '018f4e80-0000-7000-a000-000000000001'::uuid,
           '018f4e80-0000-7000-a000-000000000101'::uuid,
           'temporary-with-device',
           'temporary',
           now() + interval '1 day'
         )",
    )
    .execute(&pool)
    .await;

    assert!(
        temporary_with_device.is_err(),
        "temporary session accepted a trusted_device_id"
    );
}
