use time::OffsetDateTime;

use crate::models::AuthAttemptLockRecord;

pub async fn lock_auth_attempt(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    scope: &str,
    attempt_key: &str,
) -> Result<AuthAttemptLockRecord, sqlx::Error> {
    sqlx::query_as::<_, AuthAttemptLockRecord>(
        "insert into auth_attempt_locks (scope, attempt_key)
         values ($1, $2)
         on conflict (scope, attempt_key) do update
         set updated_at = auth_attempt_locks.updated_at
         returning attempt_count, locked_until",
    )
    .bind(scope)
    .bind(attempt_key)
    .fetch_one(&mut **tx)
    .await
}

pub async fn record_auth_failed_attempt(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    scope: &str,
    attempt_key: &str,
    max_attempts: i32,
    locked_until: OffsetDateTime,
) -> Result<AuthAttemptLockRecord, sqlx::Error> {
    sqlx::query_as::<_, AuthAttemptLockRecord>(
        "update auth_attempt_locks
         set attempt_count = attempt_count + 1,
             locked_until = case
               when attempt_count + 1 >= $3 then greatest(coalesce(locked_until, $4), $4)
               else locked_until
             end,
             updated_at = now()
         where scope = $1 and attempt_key = $2
         returning attempt_count, locked_until",
    )
    .bind(scope)
    .bind(attempt_key)
    .bind(max_attempts)
    .bind(locked_until)
    .fetch_one(&mut **tx)
    .await
}

pub async fn clear_auth_attempt(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    scope: &str,
    attempt_key: &str,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        "delete from auth_attempt_locks
         where scope = $1 and attempt_key = $2",
    )
    .bind(scope)
    .bind(attempt_key)
    .execute(&mut **tx)
    .await?;

    Ok(())
}
