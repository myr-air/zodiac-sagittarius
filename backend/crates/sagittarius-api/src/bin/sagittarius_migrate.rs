use sha2::{Digest, Sha256};
use sqlx::{PgPool, postgres::PgPoolOptions};
use std::{collections::BTreeMap, env};

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
struct Migration {
    version: &'static str,
    sql: &'static str,
}

#[derive(Debug, thiserror::Error)]
enum MigrationError {
    #[error("migration {version} checksum mismatch: expected {expected}, found {found}")]
    ChecksumMismatch {
        version: String,
        expected: String,
        found: String,
    },
    #[error("database has unknown applied migration {version}")]
    UnknownAppliedMigration { version: String },
}

fn checksum_hex(bytes: &[u8]) -> String {
    let digest = Sha256::digest(bytes);
    digest.iter().map(|byte| format!("{byte:02x}")).collect()
}

fn embedded_migrations() -> Vec<Migration> {
    vec![
        Migration {
            version: "0001_backend_vertical_slice.sql",
            sql: include_str!("../../../../migrations/0001_backend_vertical_slice.sql"),
        },
        Migration {
            version: "0002_account_identity.sql",
            sql: include_str!("../../../../migrations/0002_account_identity.sql"),
        },
        Migration {
            version: "0003_trip_join_sessions.sql",
            sql: include_str!("../../../../migrations/0003_trip_join_sessions.sql"),
        },
        Migration {
            version: "0004_account_password_auth.sql",
            sql: include_str!("../../../../migrations/0004_account_password_auth.sql"),
        },
        Migration {
            version: "0005_account_portal.sql",
            sql: include_str!("../../../../migrations/0005_account_portal.sql"),
        },
        Migration {
            version: "0006_trip_countries.sql",
            sql: include_str!("../../../../migrations/0006_trip_countries.sql"),
        },
        Migration {
            version: "0007_stop_notes.sql",
            sql: include_str!("../../../../migrations/0007_stop_notes.sql"),
        },
        Migration {
            version: "0008_trip_daily_briefings.sql",
            sql: include_str!("../../../../migrations/0008_trip_daily_briefings.sql"),
        },
        Migration {
            version: "0009_trip_join_invite_tokens.sql",
            sql: include_str!("../../../../migrations/0009_trip_join_invite_tokens.sql"),
        },
        Migration {
            version: "0010_itinerary_activity_paths.sql",
            sql: include_str!("../../../../migrations/0010_itinerary_activity_paths.sql"),
        },
        Migration {
            version: "0011_expense_reminders.sql",
            sql: include_str!("../../../../migrations/0011_expense_reminders.sql"),
        },
        Migration {
            version: "0012_expense_exchange_rates.sql",
            sql: include_str!("../../../../migrations/0012_expense_exchange_rates.sql"),
        },
        Migration {
            version: "0013_expense_receipts_itemization.sql",
            sql: include_str!("../../../../migrations/0013_expense_receipts_itemization.sql"),
        },
        Migration {
            version: "0014_expense_notes.sql",
            sql: include_str!("../../../../migrations/0014_expense_notes.sql"),
        },
        Migration {
            version: "0015_expense_comments.sql",
            sql: include_str!("../../../../migrations/0015_expense_comments.sql"),
        },
        Migration {
            version: "0016_place_geocode_cache.sql",
            sql: include_str!("../../../../migrations/0016_place_geocode_cache.sql"),
        },
        Migration {
            version: "0017_booking_docs.sql",
            sql: include_str!("../../../../migrations/0017_booking_docs.sql"),
        },
        Migration {
            version: "0018_auth_attempt_locks.sql",
            sql: include_str!("../../../../migrations/0018_auth_attempt_locks.sql"),
        },
        Migration {
            version: "0019_photo_album_links.sql",
            sql: include_str!("../../../../migrations/0019_photo_album_links.sql"),
        },
        Migration {
            version: "0020_trip_city_routes.sql",
            sql: include_str!("../../../../migrations/0020_trip_city_routes.sql"),
        },
        Migration {
            version: "0021_trusted_device_active_label_unique.sql",
            sql: include_str!("../../../../migrations/0021_trusted_device_active_label_unique.sql"),
        },
        Migration {
            version: "0022_itinerary_item_details.sql",
            sql: include_str!("../../../../migrations/0022_itinerary_item_details.sql"),
        },
        Migration {
            version: "0023_itinerary_table_v1.sql",
            sql: include_str!("../../../../migrations/0023_itinerary_table_v1.sql"),
        },
        Migration {
            version: "0024_plan_check_runtime_grants.sql",
            sql: include_str!("../../../../migrations/0024_plan_check_runtime_grants.sql"),
        },
        Migration {
            version: "0025_trip_plan_compatibility.sql",
            sql: include_str!("../../../../migrations/0025_trip_plan_compatibility.sql"),
        },
        Migration {
            version: "0026_plan_scoped_records.sql",
            sql: include_str!("../../../../migrations/0026_plan_scoped_records.sql"),
        },
        Migration {
            version: "0027_itinerary_hierarchy_time_windows.sql",
            sql: include_str!("../../../../migrations/0027_itinerary_hierarchy_time_windows.sql"),
        },
        Migration {
            version: "0028_plan_check_trip_plan_scope.sql",
            sql: include_str!("../../../../migrations/0028_plan_check_trip_plan_scope.sql"),
        },
        Migration {
            version: "0029_expense_reminder_trip_plan_scope.sql",
            sql: include_str!("../../../../migrations/0029_expense_reminder_trip_plan_scope.sql"),
        },
        Migration {
            version: "0030_itinerary_end_offset_sanitize.sql",
            sql: include_str!("../../../../migrations/0030_itinerary_end_offset_sanitize.sql"),
        },
        Migration {
            version: "0031_itinerary_activity_type_default.sql",
            sql: include_str!("../../../../migrations/0031_itinerary_activity_type_default.sql"),
        },
        Migration {
            version: "0032_itinerary_activity_subtype.sql",
            sql: include_str!("../../../../migrations/0032_itinerary_activity_subtype.sql"),
        },
        Migration {
            version: "0033_expense_spent_on.sql",
            sql: include_str!("../../../../migrations/0033_expense_spent_on.sql"),
        },
        Migration {
            version: "0034_expense_stored_value_cards.sql",
            sql: include_str!("../../../../migrations/0034_expense_stored_value_cards.sql"),
        },
        Migration {
            version: "0035_expense_settlement_allocations.sql",
            sql: include_str!("../../../../migrations/0035_expense_settlement_allocations.sql"),
        },
    ]
}

fn legacy_migration_alias(version: &str) -> Option<&'static str> {
    match version {
        "0030_expense_settlement_allocations.sql" => {
            Some("0035_expense_settlement_allocations.sql")
        }
        _ => None,
    }
}

fn pending_migrations<'a>(
    migrations: &'a [Migration],
    applied: &BTreeMap<String, String>,
) -> Result<Vec<&'a Migration>, MigrationError> {
    let known = migrations
        .iter()
        .map(|migration| migration.version)
        .collect::<std::collections::BTreeSet<_>>();
    let migration_by_version = migrations
        .iter()
        .map(|migration| (migration.version, *migration))
        .collect::<BTreeMap<_, _>>();
    let mut applied_by_known_version = BTreeMap::new();

    for (version, checksum) in applied {
        if known.contains(version.as_str()) {
            applied_by_known_version.insert(version.clone(), checksum.clone());
            continue;
        }
        if let Some(alias) = legacy_migration_alias(version.as_str()) {
            let Some(migration) = migration_by_version.get(alias) else {
                return Err(MigrationError::UnknownAppliedMigration {
                    version: version.clone(),
                });
            };
            let expected = checksum_hex(migration.sql.as_bytes());
            if checksum != &expected {
                return Err(MigrationError::ChecksumMismatch {
                    version: version.clone(),
                    expected,
                    found: checksum.clone(),
                });
            }
            applied_by_known_version.insert(alias.to_string(), checksum.clone());
            continue;
        }
        return Err(MigrationError::UnknownAppliedMigration {
            version: version.clone(),
        });
    }

    migrations
        .iter()
        .filter_map(|migration| {
            let expected = checksum_hex(migration.sql.as_bytes());
            match applied_by_known_version.get(migration.version) {
                Some(found) if found == &expected => None,
                Some(found) => Some(Err(MigrationError::ChecksumMismatch {
                    version: migration.version.to_string(),
                    expected,
                    found: found.clone(),
                })),
                None => Some(Ok(migration)),
            }
        })
        .collect()
}

fn migration_checksum_records(migrations: &[Migration]) -> BTreeMap<String, String> {
    migrations
        .iter()
        .map(|migration| {
            (
                migration.version.to_string(),
                checksum_hex(migration.sql.as_bytes()),
            )
        })
        .collect()
}

async fn ensure_schema_migrations(pool: &PgPool) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
        create table if not exists schema_migrations (
            version text primary key,
            checksum text not null,
            applied_at timestamptz not null default now()
        )
        "#,
    )
    .execute(pool)
    .await?;

    Ok(())
}

async fn load_applied_migrations(pool: &PgPool) -> Result<BTreeMap<String, String>, sqlx::Error> {
    let rows = sqlx::query_as::<_, (String, String)>(
        "select version, checksum from schema_migrations order by version",
    )
    .fetch_all(pool)
    .await?;

    Ok(rows.into_iter().collect())
}

async fn apply_migration(pool: &PgPool, migration: &Migration) -> Result<(), sqlx::Error> {
    let mut tx = pool.begin().await?;

    sqlx::raw_sql(migration.sql).execute(&mut *tx).await?;
    sqlx::query("insert into schema_migrations (version, checksum) values ($1, $2)")
        .bind(migration.version)
        .bind(checksum_hex(migration.sql.as_bytes()))
        .execute(&mut *tx)
        .await?;

    tx.commit().await?;
    Ok(())
}

async fn baseline_migrations(pool: &PgPool, migrations: &[Migration]) -> Result<(), sqlx::Error> {
    let mut tx = pool.begin().await?;

    for (version, checksum) in migration_checksum_records(migrations) {
        sqlx::query(
            "insert into schema_migrations (version, checksum) values ($1, $2) on conflict (version) do nothing",
        )
        .bind(version)
        .bind(checksum)
        .execute(&mut *tx)
        .await?;
    }

    tx.commit().await?;
    Ok(())
}

fn baseline_requested() -> bool {
    matches!(
        env::var("SAGITTARIUS_MIGRATION_BASELINE").as_deref(),
        Ok("1") | Ok("true") | Ok("TRUE")
    )
}

fn migration_database_url_from_env(
    mut get_env: impl FnMut(&str) -> Result<String, env::VarError>,
) -> Result<String, env::VarError> {
    match get_env("MIGRATION_DATABASE_URL") {
        Ok(value) if !value.trim().is_empty() => Ok(value),
        _ => get_env("DATABASE_URL"),
    }
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let database_url = migration_database_url_from_env(|name| env::var(name))?;
    let pool = PgPoolOptions::new()
        .max_connections(1)
        .connect(&database_url)
        .await?;

    ensure_schema_migrations(&pool).await?;
    let applied = load_applied_migrations(&pool).await?;
    let migrations = embedded_migrations();
    let pending = pending_migrations(&migrations, &applied)?;

    if baseline_requested() {
        baseline_migrations(&pool, &migrations).await?;
        println!("recorded {} migration checksums", migrations.len());
        return Ok(());
    }

    if pending.is_empty() {
        println!("schema up to date");
        return Ok(());
    }

    for migration in pending {
        apply_migration(&pool, migration).await?;
        println!("applied {}", migration.version);
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::{BTreeMap, BTreeSet};

    #[test]
    fn pending_migrations_skip_versions_already_recorded() {
        let migrations = vec![
            Migration {
                version: "0001_first.sql",
                sql: "select 1;",
            },
            Migration {
                version: "0002_second.sql",
                sql: "select 2;",
            },
        ];
        let applied = BTreeMap::from([(
            "0001_first.sql".to_string(),
            checksum_hex("select 1;".as_bytes()),
        )]);

        let pending = pending_migrations(&migrations, &applied).expect("valid migration set");

        assert_eq!(pending.len(), 1);
        assert_eq!(pending[0].version, "0002_second.sql");
    }

    #[test]
    fn pending_migrations_reject_changed_applied_sql() {
        let migrations = vec![Migration {
            version: "0001_first.sql",
            sql: "select 1;",
        }];
        let applied = BTreeMap::from([(
            "0001_first.sql".to_string(),
            checksum_hex("select changed;".as_bytes()),
        )]);

        let error = pending_migrations(&migrations, &applied).expect_err("checksum mismatch");

        assert!(error.to_string().contains("checksum mismatch"));
    }

    #[test]
    fn pending_migrations_accept_legacy_settlement_allocation_version() {
        let migrations = vec![Migration {
            version: "0035_expense_settlement_allocations.sql",
            sql: "alter table expenses add column settlement_allocations jsonb;",
        }];
        let applied = BTreeMap::from([(
            "0030_expense_settlement_allocations.sql".to_string(),
            checksum_hex(
                "alter table expenses add column settlement_allocations jsonb;".as_bytes(),
            ),
        )]);

        let pending = pending_migrations(&migrations, &applied).expect("legacy alias");

        assert!(pending.is_empty());
    }

    #[test]
    fn pending_migrations_reject_changed_legacy_settlement_allocation_sql() {
        let migrations = vec![Migration {
            version: "0035_expense_settlement_allocations.sql",
            sql: "alter table expenses add column settlement_allocations jsonb;",
        }];
        let applied = BTreeMap::from([(
            "0030_expense_settlement_allocations.sql".to_string(),
            checksum_hex("select changed;".as_bytes()),
        )]);

        let error = pending_migrations(&migrations, &applied).expect_err("checksum mismatch");

        assert!(
            error
                .to_string()
                .contains("0030_expense_settlement_allocations.sql")
        );
        assert!(error.to_string().contains("checksum mismatch"));
    }

    #[test]
    fn embedded_migrations_include_latest_plan_scope_migration() {
        let versions = embedded_migrations()
            .iter()
            .map(|migration| migration.version)
            .collect::<BTreeSet<_>>();

        assert!(versions.contains("0019_photo_album_links.sql"));
        assert!(versions.contains("0021_trusted_device_active_label_unique.sql"));
        assert!(versions.contains("0028_plan_check_trip_plan_scope.sql"));
        assert!(versions.contains("0029_expense_reminder_trip_plan_scope.sql"));
        assert!(versions.contains("0030_itinerary_end_offset_sanitize.sql"));
        assert!(versions.contains("0031_itinerary_activity_type_default.sql"));
        assert!(versions.contains("0032_itinerary_activity_subtype.sql"));
        assert!(versions.contains("0033_expense_spent_on.sql"));
        assert!(versions.contains("0034_expense_stored_value_cards.sql"));
        assert!(versions.contains("0035_expense_settlement_allocations.sql"));
    }

    #[test]
    fn migration_checksum_records_include_version_and_checksum() {
        let migrations = vec![Migration {
            version: "0001_first.sql",
            sql: "select 1;",
        }];

        let records = migration_checksum_records(&migrations);

        assert_eq!(
            records,
            BTreeMap::from([(
                "0001_first.sql".to_string(),
                checksum_hex("select 1;".as_bytes()),
            )])
        );
    }

    #[test]
    fn migration_database_url_prefers_dedicated_non_empty_url() {
        let database_url = migration_database_url_from_env(|name| match name {
            "MIGRATION_DATABASE_URL" => Ok("postgres://migrator/db".to_string()),
            "DATABASE_URL" => Ok("postgres://runtime/db".to_string()),
            _ => Err(env::VarError::NotPresent),
        })
        .unwrap();

        assert_eq!(database_url, "postgres://migrator/db");
    }

    #[test]
    fn migration_database_url_falls_back_to_runtime_url() {
        let database_url = migration_database_url_from_env(|name| match name {
            "MIGRATION_DATABASE_URL" => Ok(" ".to_string()),
            "DATABASE_URL" => Ok("postgres://runtime/db".to_string()),
            _ => Err(env::VarError::NotPresent),
        })
        .unwrap();

        assert_eq!(database_url, "postgres://runtime/db");
    }
}
