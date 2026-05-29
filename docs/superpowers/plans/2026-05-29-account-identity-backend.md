# Account Identity Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first account identity backend slice: schema, passwordless email-code login, temporary/trusted account sessions, provider-free passkey challenge storage, basic settings, and authenticated account lookup.

**Architecture:** Add an account module beside the existing trip-member auth module. Keep all auth provider-free: email codes are deterministic/logged for dev/test, passkey endpoints create and consume local WebAuthn challenge records, and no hosted auth, OAuth, email delivery, or notification provider is introduced. Account sessions are bearer tokens stored as hashes, parallel to existing `trip_member_sessions`.

**Tech Stack:** Rust 1.95 workspace, axum, sqlx/PostgreSQL migrations and `#[sqlx::test]`, argon2 hashing helpers already in `app::auth`, uuid v7, time, serde.

---

## Scope Check

The approved account membership spec covers four independent slices:

1. account identity backend;
2. trip creation, temporary-member claim, and owner transfer;
3. account frontend UX;
4. stats/audit polish.

This plan implements slice 1 only. It intentionally prepares tables and API
contracts needed by following slices, but it does not implement trip creation, owner
transfer, frontend pages, production email delivery, OAuth, hosted auth, or any
third-party provider integration.

## File Structure

- Create `backend/migrations/0002_account_identity.sql`: account tables, foreign key from `trip_members.user_id` to `users(id)`, indexes, and ownership hardening constraints that are purely schema-level.
- Create `backend/crates/sagittarius-api/tests/account_schema_contract.rs`: migration and constraint tests for account tables and indexes.
- Create `backend/crates/sagittarius-api/tests/account_auth_contract.rs`: HTTP-level account auth contract tests.
- Modify `backend/crates/sagittarius-api/src/domain/types.rs`: account DTOs and session kind enum.
- Modify `backend/crates/sagittarius-api/src/domain/errors.rs`: account-specific conflict variants used by the API.
- Modify `backend/crates/sagittarius-api/src/api/error.rs`: map account conflict variants to stable JSON error codes.
- Create `backend/crates/sagittarius-api/src/api/account.rs`: axum request handlers for email login, passkey challenge storage, account settings, and session revocation.
- Modify `backend/crates/sagittarius-api/src/api/mod.rs`: route account endpoints and allow CORS for account auth calls.
- Create `backend/crates/sagittarius-api/src/app/account.rs`: account use cases.
- Modify `backend/crates/sagittarius-api/src/app/mod.rs`: expose account module.
- Create `backend/crates/sagittarius-api/src/db/account_queries.rs`: account SQL helpers.
- Modify `backend/crates/sagittarius-api/src/db/mod.rs`: expose account query module.
- Modify `backend/crates/sagittarius-api/src/db/models.rs`: account row models.
- Modify `backend/crates/sagittarius-api/tests/support/mod.rs`: helpers for seeding account users and sessions.

### Provider-Free Boundaries

No task may add SendGrid, Resend, Postmark, Auth0, Clerk, Supabase Auth, Firebase
Auth, OAuth, hosted WebAuthn, push notification providers, or any equivalent
provider. If a task needs email delivery, return the dev challenge code in the
response under `devCode`. If a task needs passkey verification, store and
consume local challenge records and keep verification inputs as opaque JSON in
this backend slice.

---

### Task 1: Account Schema Migration

**Files:**
- Create: `backend/migrations/0002_account_identity.sql`
- Create: `backend/crates/sagittarius-api/tests/account_schema_contract.rs`

- [ ] **Step 1: Write failing schema contract tests**

Create `backend/crates/sagittarius-api/tests/account_schema_contract.rs`:

```rust
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
        assert!(table_names.contains(&table_name.to_string()), "missing table {table_name}");
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
        assert!(index_names.contains(&index_name.to_string()), "missing index {index_name}");
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
```

- [ ] **Step 2: Run schema contract tests to verify RED**

Run:

```bash
cd backend
rtk cargo test -p sagittarius-api --test account_schema_contract
```

Expected: FAIL with missing `account_schema_contract` migration tables or indexes.

- [ ] **Step 3: Add account identity migration**

Create `backend/migrations/0002_account_identity.sql`:

```sql
CREATE TABLE users (
  id uuid PRIMARY KEY,
  display_name text NOT NULL,
  avatar_color text NOT NULL,
  locale text NOT NULL DEFAULT 'th-TH',
  timezone text NOT NULL DEFAULT 'Asia/Bangkok',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  disabled_at timestamptz
);

CREATE TABLE user_emails (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id),
  email text NOT NULL,
  normalized_email text NOT NULL,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX user_emails_normalized_email_idx
  ON user_emails (normalized_email);

CREATE TABLE email_login_challenges (
  id uuid PRIMARY KEY,
  normalized_email text NOT NULL,
  code_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz
);

CREATE INDEX email_login_challenges_email_active_idx
  ON email_login_challenges (normalized_email, expires_at DESC)
  WHERE consumed_at IS NULL;

CREATE TABLE webauthn_challenges (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES users(id),
  challenge text NOT NULL,
  purpose text NOT NULL CHECK (purpose IN ('register', 'login')),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz
);

CREATE INDEX webauthn_challenges_challenge_active_idx
  ON webauthn_challenges (challenge, expires_at DESC)
  WHERE consumed_at IS NULL;

CREATE TABLE webauthn_credentials (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id),
  credential_id text NOT NULL,
  public_key jsonb NOT NULL,
  sign_count bigint NOT NULL DEFAULT 0,
  nickname text NOT NULL DEFAULT 'Passkey',
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz
);

CREATE UNIQUE INDEX webauthn_credentials_credential_id_idx
  ON webauthn_credentials (credential_id);

CREATE TABLE trusted_devices (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id),
  label text NOT NULL,
  user_agent text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz,
  revoked_at timestamptz
);

CREATE INDEX trusted_devices_user_active_idx
  ON trusted_devices (user_id, last_seen_at DESC)
  WHERE revoked_at IS NULL;

CREATE TABLE user_sessions (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id),
  trusted_device_id uuid REFERENCES trusted_devices(id),
  session_token_hash text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('temporary', 'trusted')),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz
);

CREATE UNIQUE INDEX user_sessions_token_hash_idx
  ON user_sessions (session_token_hash);

CREATE INDEX user_sessions_user_active_idx
  ON user_sessions (user_id, expires_at DESC)
  WHERE revoked_at IS NULL;

CREATE TABLE account_audit_events (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES users(id),
  trip_id uuid REFERENCES trips(id),
  actor_user_id uuid REFERENCES users(id),
  actor_member_id uuid REFERENCES trip_members(id),
  event_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX account_audit_events_user_created_idx
  ON account_audit_events (user_id, created_at DESC);

ALTER TABLE trip_members
  ADD CONSTRAINT trip_members_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(id);

CREATE INDEX trip_members_user_id_idx
  ON trip_members (user_id)
  WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX trip_members_one_owner_per_trip_idx
  ON trip_members (trip_id)
  WHERE role = 'owner';
```

- [ ] **Step 4: Run schema contract tests to verify GREEN**

Run:

```bash
cd backend
rtk cargo test -p sagittarius-api --test account_schema_contract
```

Expected: PASS.

- [ ] **Step 5: Commit schema slice**

Run:

```bash
rtk git add backend/migrations/0002_account_identity.sql backend/crates/sagittarius-api/tests/account_schema_contract.rs
rtk git commit -m "feat: add account identity schema"
```

Expected: commit succeeds.

---

### Task 2: Account Domain Types And Errors

**Files:**
- Modify: `backend/crates/sagittarius-api/src/domain/types.rs`
- Modify: `backend/crates/sagittarius-api/src/domain/errors.rs`
- Modify: `backend/crates/sagittarius-api/src/api/error.rs`

- [ ] **Step 1: Add focused type serialization tests**

Append this test module to `backend/crates/sagittarius-api/src/domain/types.rs`:

```rust
#[cfg(test)]
mod account_type_tests {
    use super::*;

    #[test]
    fn account_session_kind_serializes_as_camel_case() {
        assert_eq!(
            serde_json::to_value(AccountSessionKind::Temporary).unwrap(),
            serde_json::json!("temporary")
        );
        assert_eq!(
            serde_json::to_value(AccountSessionKind::Trusted).unwrap(),
            serde_json::json!("trusted")
        );
    }
}
```

- [ ] **Step 2: Run type test to verify RED**

Run:

```bash
cd backend
rtk cargo test -p sagittarius-api account_session_kind_serializes_as_camel_case
```

Expected: FAIL because `AccountSessionKind` does not exist.

- [ ] **Step 3: Add account DTOs**

Add these types near existing session DTOs in `backend/crates/sagittarius-api/src/domain/types.rs`:

```rust
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
#[sqlx(type_name = "text", rename_all = "lowercase")]
pub enum AccountSessionKind {
    Temporary,
    Trusted,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AccountSession {
    pub user_id: Uuid,
    pub session_token: String,
    pub kind: AccountSessionKind,
    pub created_at: String,
    pub expires_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AccountProfile {
    pub id: Uuid,
    pub display_name: String,
    pub avatar_color: String,
    pub locale: String,
    pub timezone: String,
    pub primary_email: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TrustedDeviceSummary {
    pub id: Uuid,
    pub label: String,
    pub user_agent: String,
    pub created_at: String,
    pub last_seen_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PasskeySummary {
    pub id: Uuid,
    pub nickname: String,
    pub created_at: String,
    pub last_used_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AccountSettings {
    pub profile: AccountProfile,
    pub passkeys: Vec<PasskeySummary>,
    pub trusted_devices: Vec<TrustedDeviceSummary>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EmailLoginStartResponse {
    pub challenge_id: Uuid,
    pub expires_at: String,
    pub dev_code: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PasskeyChallengeResponse {
    pub challenge_id: Uuid,
    pub challenge: String,
    pub expires_at: String,
}
```

- [ ] **Step 4: Add account conflict error variants**

Modify `backend/crates/sagittarius-api/src/domain/errors.rs`:

```rust
#[derive(Debug, Error)]
pub enum ServiceError {
    #[error("invalid request: {0}")]
    InvalidRequest(&'static str),
    #[error("unauthenticated")]
    Unauthenticated,
    #[error("forbidden")]
    Forbidden,
    #[error("not found")]
    NotFound,
    #[error("identity already linked")]
    IdentityAlreadyLinked,
    #[error("owner transfer invalid")]
    OwnerTransferInvalid,
    #[error("version conflict")]
    VersionConflict,
    #[error("version conflict")]
    VersionConflictWithLatest(serde_json::Value),
    #[error("database error: {0}")]
    Database(#[from] sqlx::Error),
}
```

Modify the `match self` in `backend/crates/sagittarius-api/src/api/error.rs`:

```rust
            ServiceError::IdentityAlreadyLinked => (
                StatusCode::CONFLICT,
                "identity_already_linked",
                self.to_string(),
                None,
            ),
            ServiceError::OwnerTransferInvalid => (
                StatusCode::CONFLICT,
                "owner_transfer_invalid",
                self.to_string(),
                None,
            ),
```

Place the new arms before `ServiceError::VersionConflict`.

- [ ] **Step 5: Run type and existing error tests**

Run:

```bash
cd backend
rtk cargo test -p sagittarius-api account_session_kind_serializes_as_camel_case database_errors_do_not_leak_details
```

Expected: PASS.

- [ ] **Step 6: Commit domain types**

Run:

```bash
rtk git add backend/crates/sagittarius-api/src/domain/types.rs backend/crates/sagittarius-api/src/domain/errors.rs backend/crates/sagittarius-api/src/api/error.rs
rtk git commit -m "feat: add account identity domain types"
```

Expected: commit succeeds.

---

### Task 3: Account DB Models And Queries

**Files:**
- Modify: `backend/crates/sagittarius-api/src/db/models.rs`
- Create: `backend/crates/sagittarius-api/src/db/account_queries.rs`
- Modify: `backend/crates/sagittarius-api/src/db/mod.rs`
- Modify: `backend/crates/sagittarius-api/tests/support/mod.rs`
- Create: `backend/crates/sagittarius-api/tests/account_auth_contract.rs`

- [ ] **Step 1: Write failing DB helper tests through HTTP support setup**

Create the first test in `backend/crates/sagittarius-api/tests/account_auth_contract.rs`:

```rust
mod support;

use axum::body::Body;
use http::{Request, StatusCode, header::CONTENT_TYPE};
use serde_json::{Value, json};
use tower::ServiceExt;

#[sqlx::test(migrations = "../../migrations")]
async fn email_login_start_creates_dev_challenge(pool: sqlx::PgPool) {
    let app = support::app(pool.clone());

    let response = app
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/v1/account/email-login/start")
                .header(CONTENT_TYPE, "application/json")
                .body(Body::from(json!({ "email": " Aom@Example.COM " }).to_string()))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);
    let body = axum::body::to_bytes(response.into_body(), usize::MAX).await.unwrap();
    let body: Value = serde_json::from_slice(&body).unwrap();

    assert!(body["challengeId"].as_str().unwrap().len() > 20);
    assert_eq!(body["devCode"].as_str().unwrap().len(), 6);

    let stored_email: String = sqlx::query_scalar(
        "select normalized_email from email_login_challenges limit 1",
    )
    .fetch_one(&pool)
    .await
    .unwrap();

    assert_eq!(stored_email, "aom@example.com");
}
```

- [ ] **Step 2: Run test to verify RED**

Run:

```bash
cd backend
rtk cargo test -p sagittarius-api --test account_auth_contract email_login_start_creates_dev_challenge
```

Expected: FAIL because route/query modules do not exist yet.

- [ ] **Step 3: Add DB row models**

Append these structs to `backend/crates/sagittarius-api/src/db/models.rs`:

```rust
#[derive(Debug, Clone, FromRow)]
pub struct UserRecord {
    pub id: Uuid,
    pub display_name: String,
    pub avatar_color: String,
    pub locale: String,
    pub timezone: String,
    pub primary_email: Option<String>,
}

#[derive(Debug, Clone, FromRow)]
pub struct UserSessionRecord {
    pub user_id: Uuid,
    pub kind: crate::domain::types::AccountSessionKind,
}

#[derive(Debug, Clone, FromRow)]
pub struct TrustedDeviceRecord {
    pub id: Uuid,
    pub label: String,
    pub user_agent: String,
    pub created_at: String,
    pub last_seen_at: Option<String>,
}

#[derive(Debug, Clone, FromRow)]
pub struct PasskeyRecord {
    pub id: Uuid,
    pub nickname: String,
    pub created_at: String,
    pub last_used_at: Option<String>,
}
```

- [ ] **Step 4: Add account query module**

Create `backend/crates/sagittarius-api/src/db/account_queries.rs`:

```rust
use time::OffsetDateTime;
use uuid::Uuid;

use crate::db::PgPool;
use crate::db::models::{PasskeyRecord, TrustedDeviceRecord, UserRecord, UserSessionRecord};
use crate::domain::types::AccountSessionKind;

pub async fn insert_email_login_challenge(
    pool: &PgPool,
    id: Uuid,
    normalized_email: &str,
    code_hash: &str,
    expires_at: OffsetDateTime,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        "insert into email_login_challenges (id, normalized_email, code_hash, expires_at)
         values ($1, $2, $3, $4)",
    )
    .bind(id)
    .bind(normalized_email)
    .bind(code_hash)
    .bind(expires_at)
    .execute(pool)
    .await?;

    Ok(())
}

pub async fn lock_email_login_challenge(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    challenge_id: Uuid,
) -> Result<Option<(String, String, OffsetDateTime, Option<OffsetDateTime>)>, sqlx::Error> {
    sqlx::query_as(
        "select normalized_email, code_hash, expires_at, consumed_at
         from email_login_challenges
         where id = $1
         for update",
    )
    .bind(challenge_id)
    .fetch_optional(&mut **tx)
    .await
}

pub async fn consume_email_login_challenge(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    challenge_id: Uuid,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        "update email_login_challenges
         set consumed_at = now()
         where id = $1",
    )
    .bind(challenge_id)
    .execute(&mut **tx)
    .await?;

    Ok(())
}

pub async fn find_user_by_normalized_email(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    normalized_email: &str,
) -> Result<Option<Uuid>, sqlx::Error> {
    sqlx::query_scalar(
        "select user_id
         from user_emails
         where normalized_email = $1",
    )
    .bind(normalized_email)
    .fetch_optional(&mut **tx)
    .await
}

pub async fn insert_user_with_email(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    user_id: Uuid,
    email_id: Uuid,
    email: &str,
    normalized_email: &str,
    display_name: &str,
    avatar_color: &str,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        "insert into users (id, display_name, avatar_color)
         values ($1, $2, $3)",
    )
    .bind(user_id)
    .bind(display_name)
    .bind(avatar_color)
    .execute(&mut **tx)
    .await?;

    sqlx::query(
        "insert into user_emails (id, user_id, email, normalized_email, verified_at)
         values ($1, $2, $3, $4, now())",
    )
    .bind(email_id)
    .bind(user_id)
    .bind(email)
    .bind(normalized_email)
    .execute(&mut **tx)
    .await?;

    Ok(())
}

pub async fn insert_trusted_device(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    id: Uuid,
    user_id: Uuid,
    label: &str,
    user_agent: &str,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        "insert into trusted_devices (id, user_id, label, user_agent, last_seen_at)
         values ($1, $2, $3, $4, now())",
    )
    .bind(id)
    .bind(user_id)
    .bind(label)
    .bind(user_agent)
    .execute(&mut **tx)
    .await?;

    Ok(())
}

pub async fn insert_user_session(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    id: Uuid,
    user_id: Uuid,
    trusted_device_id: Option<Uuid>,
    token_hash: &str,
    kind: AccountSessionKind,
    created_at: OffsetDateTime,
    expires_at: OffsetDateTime,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        "insert into user_sessions (
           id, user_id, trusted_device_id, session_token_hash, kind, created_at, expires_at
         )
         values ($1, $2, $3, $4, $5, $6, $7)",
    )
    .bind(id)
    .bind(user_id)
    .bind(trusted_device_id)
    .bind(token_hash)
    .bind(kind)
    .bind(created_at)
    .bind(expires_at)
    .execute(&mut **tx)
    .await?;

    Ok(())
}

pub async fn find_active_user_session(
    pool: &PgPool,
    token_hash: &str,
) -> Result<Option<UserSessionRecord>, sqlx::Error> {
    sqlx::query_as(
        "select s.user_id, s.kind
         from user_sessions s
         join users u on u.id = s.user_id
         where s.session_token_hash = $1
           and s.revoked_at is null
           and s.expires_at > now()
           and u.disabled_at is null",
    )
    .bind(token_hash)
    .fetch_optional(pool)
    .await
}

pub async fn get_user_profile(pool: &PgPool, user_id: Uuid) -> Result<Option<UserRecord>, sqlx::Error> {
    sqlx::query_as(
        "select u.id, u.display_name, u.avatar_color, u.locale, u.timezone,
                min(e.email) filter (where e.verified_at is not null) as primary_email
         from users u
         left join user_emails e on e.user_id = u.id
         where u.id = $1 and u.disabled_at is null
         group by u.id",
    )
    .bind(user_id)
    .fetch_optional(pool)
    .await
}

pub async fn list_trusted_devices(pool: &PgPool, user_id: Uuid) -> Result<Vec<TrustedDeviceRecord>, sqlx::Error> {
    sqlx::query_as(
        "select id, label, user_agent, created_at::text as created_at, last_seen_at::text as last_seen_at
         from trusted_devices
         where user_id = $1 and revoked_at is null
         order by coalesce(last_seen_at, created_at) desc",
    )
    .bind(user_id)
    .fetch_all(pool)
    .await
}

pub async fn list_passkeys(pool: &PgPool, user_id: Uuid) -> Result<Vec<PasskeyRecord>, sqlx::Error> {
    sqlx::query_as(
        "select id, nickname, created_at::text as created_at, last_used_at::text as last_used_at
         from webauthn_credentials
         where user_id = $1
         order by coalesce(last_used_at, created_at) desc",
    )
    .bind(user_id)
    .fetch_all(pool)
    .await
}
```

- [ ] **Step 5: Expose query module**

Modify `backend/crates/sagittarius-api/src/db/mod.rs`:

```rust
pub mod account_queries;
pub mod models;
pub mod queries;

pub type PgPool = sqlx::PgPool;
```

- [ ] **Step 6: Run account auth contract test**

Run:

```bash
cd backend
rtk cargo test -p sagittarius-api --test account_auth_contract email_login_start_creates_dev_challenge
```

Expected: still FAIL because API and app layers do not exist yet, but DB symbols compile once app code is added in the next task.

- [ ] **Step 7: Checkpoint DB query groundwork**

Run:

```bash
rtk git status --short
```

Expected: the DB and contract-test files are modified or untracked. Do not commit
this checkpoint by itself because the account API/app layer is intentionally
added in Task 4; Task 4 commits the compileable email-login slice.

---

### Task 4: Email Login And Account Sessions

**Files:**
- Create: `backend/crates/sagittarius-api/src/app/account.rs`
- Modify: `backend/crates/sagittarius-api/src/app/mod.rs`
- Create: `backend/crates/sagittarius-api/src/api/account.rs`
- Modify: `backend/crates/sagittarius-api/src/api/mod.rs`
- Modify: `backend/crates/sagittarius-api/tests/account_auth_contract.rs`

- [ ] **Step 1: Extend account auth contract tests**

Append these tests to `backend/crates/sagittarius-api/tests/account_auth_contract.rs`:

```rust
#[sqlx::test(migrations = "../../migrations")]
async fn email_login_finish_creates_user_and_temporary_session(pool: sqlx::PgPool) {
    let app = support::app(pool.clone());
    let challenge = post_json(
        app.clone(),
        "/v1/account/email-login/start",
        json!({ "email": "aom@example.com" }),
        None,
    )
    .await;
    let challenge_id = challenge["challengeId"].as_str().unwrap();
    let dev_code = challenge["devCode"].as_str().unwrap();

    let finished = post_json(
        app,
        "/v1/account/email-login/finish",
        json!({
            "challengeId": challenge_id,
            "code": dev_code,
            "trustDevice": false,
            "deviceLabel": "Temporary browser"
        }),
        None,
    )
    .await;

    assert_eq!(finished["kind"], "temporary");
    assert!(finished["sessionToken"].as_str().unwrap().len() > 20);

    let session_count: i64 = sqlx::query_scalar("select count(*) from user_sessions")
        .fetch_one(&pool)
        .await
        .unwrap();
    assert_eq!(session_count, 1);

    let trusted_device_count: i64 = sqlx::query_scalar("select count(*) from trusted_devices")
        .fetch_one(&pool)
        .await
        .unwrap();
    assert_eq!(trusted_device_count, 0);
}

#[sqlx::test(migrations = "../../migrations")]
async fn trusted_email_login_creates_trusted_device(pool: sqlx::PgPool) {
    let app = support::app(pool.clone());
    let challenge = post_json(
        app.clone(),
        "/v1/account/email-login/start",
        json!({ "email": "beam@example.com" }),
        None,
    )
    .await;

    let finished = post_json(
        app,
        "/v1/account/email-login/finish",
        json!({
            "challengeId": challenge["challengeId"],
            "code": challenge["devCode"],
            "trustDevice": true,
            "deviceLabel": "MacBook"
        }),
        None,
    )
    .await;

    assert_eq!(finished["kind"], "trusted");

    let trusted_device_count: i64 = sqlx::query_scalar("select count(*) from trusted_devices")
        .fetch_one(&pool)
        .await
        .unwrap();
    assert_eq!(trusted_device_count, 1);
}

#[sqlx::test(migrations = "../../migrations")]
async fn email_login_finish_rejects_reused_code(pool: sqlx::PgPool) {
    let app = support::app(pool);
    let challenge = post_json(
        app.clone(),
        "/v1/account/email-login/start",
        json!({ "email": "nam@example.com" }),
        None,
    )
    .await;

    let body = json!({
        "challengeId": challenge["challengeId"],
        "code": challenge["devCode"],
        "trustDevice": false,
        "deviceLabel": "Shared computer"
    });
    let _first = post_json(app.clone(), "/v1/account/email-login/finish", body.clone(), None).await;

    let response = app
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/v1/account/email-login/finish")
                .header(CONTENT_TYPE, "application/json")
                .body(Body::from(body.to_string()))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
}

async fn post_json(
    app: axum::Router,
    uri: &str,
    body: Value,
    bearer: Option<&str>,
) -> Value {
    let mut builder = Request::builder()
        .method("POST")
        .uri(uri)
        .header(CONTENT_TYPE, "application/json");
    if let Some(token) = bearer {
        builder = builder.header("authorization", format!("Bearer {token}"));
    }
    let response = app
        .oneshot(builder.body(Body::from(body.to_string())).unwrap())
        .await
        .unwrap();
    assert_eq!(response.status(), StatusCode::OK);
    let body = axum::body::to_bytes(response.into_body(), usize::MAX).await.unwrap();
    serde_json::from_slice(&body).unwrap()
}
```

- [ ] **Step 2: Run tests to verify RED**

Run:

```bash
cd backend
rtk cargo test -p sagittarius-api --test account_auth_contract
```

Expected: FAIL because account API/app modules do not exist.

- [ ] **Step 3: Add account app module**

Create `backend/crates/sagittarius-api/src/app/account.rs`:

```rust
use argon2::password_hash::{PasswordHash, SaltString, rand_core::OsRng};
use argon2::{Argon2, PasswordHasher, PasswordVerifier};
use base64::{Engine as _, engine::general_purpose::URL_SAFE_NO_PAD};
use rand::RngCore;
use time::format_description::well_known::Rfc3339;
use time::{Duration, OffsetDateTime};
use uuid::Uuid;

use crate::db::{account_queries, PgPool};
use crate::domain::errors::ServiceError;
use crate::domain::types::{AccountSession, AccountSessionKind, EmailLoginStartResponse};

const EMAIL_LOGIN_TTL: Duration = Duration::minutes(10);
const TEMP_SESSION_TTL: Duration = Duration::days(1);
const TRUSTED_SESSION_TTL: Duration = Duration::days(30);
const SESSION_TOKEN_SALT: &[u8] = b"sagittarius-user-session-token";

pub async fn start_email_login(pool: &PgPool, email: &str) -> Result<EmailLoginStartResponse, ServiceError> {
    let normalized_email = normalize_email(email)?;
    let code = deterministic_dev_code(&normalized_email);
    let code_hash = hash_secret(&code)?;
    let challenge_id = Uuid::now_v7();
    let expires_at = OffsetDateTime::now_utc() + EMAIL_LOGIN_TTL;

    account_queries::insert_email_login_challenge(
        pool,
        challenge_id,
        &normalized_email,
        &code_hash,
        expires_at,
    )
    .await?;

    Ok(EmailLoginStartResponse {
        challenge_id,
        expires_at: format_timestamp(expires_at)?,
        dev_code: code,
    })
}

pub async fn finish_email_login(
    pool: &PgPool,
    challenge_id: Uuid,
    code: &str,
    trust_device: bool,
    device_label: &str,
    user_agent: &str,
) -> Result<AccountSession, ServiceError> {
    let mut tx = pool.begin().await?;
    let Some((normalized_email, code_hash, expires_at, consumed_at)) =
        account_queries::lock_email_login_challenge(&mut tx, challenge_id).await?
    else {
        return Err(ServiceError::Unauthenticated);
    };

    if consumed_at.is_some() || expires_at <= OffsetDateTime::now_utc() || !verify_secret(code.trim(), &code_hash) {
        return Err(ServiceError::Unauthenticated);
    }

    let user_id = match account_queries::find_user_by_normalized_email(&mut tx, &normalized_email).await? {
        Some(user_id) => user_id,
        None => {
            let user_id = Uuid::now_v7();
            let display_name = display_name_from_email(&normalized_email);
            account_queries::insert_user_with_email(
                &mut tx,
                user_id,
                Uuid::now_v7(),
                &normalized_email,
                &normalized_email,
                &display_name,
                "#0f766e",
            )
            .await?;
            user_id
        }
    };

    account_queries::consume_email_login_challenge(&mut tx, challenge_id).await?;
    let session = create_user_session(&mut tx, user_id, trust_device, device_label, user_agent).await?;
    tx.commit().await?;

    Ok(session)
}

pub fn hash_user_session_token_for_tests(session_token: &str) -> String {
    hash_session_token(session_token).expect("static session token salt should hash")
}

pub(crate) fn hash_session_token(session_token: &str) -> Result<String, ServiceError> {
    hash_secret_with_salt(session_token, SESSION_TOKEN_SALT)
}

fn normalize_email(email: &str) -> Result<String, ServiceError> {
    let normalized = email.trim().to_ascii_lowercase();
    if !normalized.contains('@') || normalized.len() < 3 {
        return Err(ServiceError::InvalidRequest("email is invalid"));
    }
    Ok(normalized)
}

fn deterministic_dev_code(normalized_email: &str) -> String {
    let mut value = 0u32;
    for byte in normalized_email.as_bytes() {
        value = value.wrapping_mul(33).wrapping_add(u32::from(*byte));
    }
    format!("{:06}", value % 1_000_000)
}

fn display_name_from_email(normalized_email: &str) -> String {
    normalized_email
        .split('@')
        .next()
        .filter(|name| !name.is_empty())
        .unwrap_or("Traveler")
        .to_string()
}

async fn create_user_session(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    user_id: Uuid,
    trust_device: bool,
    device_label: &str,
    user_agent: &str,
) -> Result<AccountSession, ServiceError> {
    let created_at = OffsetDateTime::now_utc();
    let kind = if trust_device { AccountSessionKind::Trusted } else { AccountSessionKind::Temporary };
    let expires_at = created_at + if trust_device { TRUSTED_SESSION_TTL } else { TEMP_SESSION_TTL };
    let trusted_device_id = if trust_device {
        let trusted_device_id = Uuid::now_v7();
        account_queries::insert_trusted_device(
            tx,
            trusted_device_id,
            user_id,
            clean_device_label(device_label),
            user_agent,
        )
        .await?;
        Some(trusted_device_id)
    } else {
        None
    };

    let session_token = generate_session_token();
    let token_hash = hash_session_token(&session_token)?;
    account_queries::insert_user_session(
        tx,
        Uuid::now_v7(),
        user_id,
        trusted_device_id,
        &token_hash,
        kind,
        created_at,
        expires_at,
    )
    .await?;

    Ok(AccountSession {
        user_id,
        session_token,
        kind,
        created_at: format_timestamp(created_at)?,
        expires_at: format_timestamp(expires_at)?,
    })
}

fn clean_device_label(label: &str) -> &str {
    let trimmed = label.trim();
    if trimmed.is_empty() { "Trusted device" } else { trimmed }
}

fn generate_session_token() -> String {
    let mut bytes = [0u8; 32];
    rand::rng().fill_bytes(&mut bytes);
    URL_SAFE_NO_PAD.encode(bytes)
}

fn hash_secret(secret: &str) -> Result<String, ServiceError> {
    let salt = SaltString::generate(&mut OsRng);
    hash_secret_with_salt_string(secret, &salt)
}

fn hash_secret_with_salt(secret: &str, salt: &[u8]) -> Result<String, ServiceError> {
    let salt = SaltString::encode_b64(salt).map_err(|_| ServiceError::InvalidRequest("salt"))?;
    hash_secret_with_salt_string(secret, &salt)
}

fn hash_secret_with_salt_string(secret: &str, salt: &SaltString) -> Result<String, ServiceError> {
    Argon2::default()
        .hash_password(secret.as_bytes(), salt)
        .map(|hash| hash.to_string())
        .map_err(|_| ServiceError::InvalidRequest("secret could not be hashed"))
}

fn verify_secret(secret: &str, hash: &str) -> bool {
    let Ok(parsed_hash) = PasswordHash::new(hash) else {
        return false;
    };
    Argon2::default().verify_password(secret.as_bytes(), &parsed_hash).is_ok()
}

fn format_timestamp(timestamp: OffsetDateTime) -> Result<String, ServiceError> {
    timestamp
        .format(&Rfc3339)
        .map_err(|_| ServiceError::InvalidRequest("timestamp could not be formatted"))
}
```

- [ ] **Step 4: Expose account app module**

Modify `backend/crates/sagittarius-api/src/app/mod.rs`:

```rust
pub mod account;
pub mod auth;
pub mod events;
pub mod itinerary;
pub mod suggestions;
pub mod tasks;
pub mod trips;
```

- [ ] **Step 5: Add account API handlers**

Create `backend/crates/sagittarius-api/src/api/account.rs`:

```rust
use axum::extract::State;
use axum::http::{HeaderMap, header};
use axum::Json;
use serde::Deserialize;
use uuid::Uuid;

use crate::app;
use crate::app::AppState;
use crate::domain::errors::ServiceError;
use crate::domain::types::{AccountSession, EmailLoginStartResponse};

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EmailLoginStartRequest {
    pub email: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EmailLoginFinishRequest {
    pub challenge_id: Uuid,
    pub code: String,
    pub trust_device: bool,
    pub device_label: String,
}

pub async fn start_email_login(
    State(state): State<AppState>,
    Json(request): Json<EmailLoginStartRequest>,
) -> Result<Json<EmailLoginStartResponse>, ServiceError> {
    let response = app::account::start_email_login(&state.pool, &request.email).await?;
    Ok(Json(response))
}

pub async fn finish_email_login(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(request): Json<EmailLoginFinishRequest>,
) -> Result<Json<AccountSession>, ServiceError> {
    let user_agent = headers
        .get(header::USER_AGENT)
        .and_then(|value| value.to_str().ok())
        .unwrap_or("");
    let response = app::account::finish_email_login(
        &state.pool,
        request.challenge_id,
        &request.code,
        request.trust_device,
        &request.device_label,
        user_agent,
    )
    .await?;
    Ok(Json(response))
}
```

- [ ] **Step 6: Route account endpoints**

Modify `backend/crates/sagittarius-api/src/api/mod.rs`:

```rust
pub mod account;
pub mod error;
pub mod extractors;
pub mod itinerary;
pub mod join;
pub mod suggestions;
pub mod tasks;
pub mod trips;
pub mod ws;
```

Add routes inside `router` before fallback:

```rust
        .route(
            "/v1/account/email-login/start",
            post(account::start_email_login),
        )
        .route(
            "/v1/account/email-login/finish",
            post(account::finish_email_login),
        )
```

- [ ] **Step 7: Run account auth contract tests**

Run:

```bash
cd backend
rtk cargo test -p sagittarius-api --test account_auth_contract
```

Expected: PASS for email login start/finish tests.

- [ ] **Step 8: Commit email login slice**

Run:

```bash
rtk git add backend/crates/sagittarius-api/src/app/account.rs backend/crates/sagittarius-api/src/app/mod.rs backend/crates/sagittarius-api/src/api/account.rs backend/crates/sagittarius-api/src/api/mod.rs backend/crates/sagittarius-api/tests/account_auth_contract.rs backend/crates/sagittarius-api/src/db/models.rs backend/crates/sagittarius-api/src/db/account_queries.rs backend/crates/sagittarius-api/src/db/mod.rs
rtk git commit -m "feat: add provider-free email account login"
```

Expected: commit succeeds.

---

### Task 5: Authenticated Account Settings And Session Revocation

**Files:**
- Modify: `backend/crates/sagittarius-api/src/api/account.rs`
- Modify: `backend/crates/sagittarius-api/src/app/account.rs`
- Modify: `backend/crates/sagittarius-api/src/db/account_queries.rs`
- Modify: `backend/crates/sagittarius-api/src/api/mod.rs`
- Modify: `backend/crates/sagittarius-api/tests/account_auth_contract.rs`

- [ ] **Step 1: Write failing account settings tests**

Append to `backend/crates/sagittarius-api/tests/account_auth_contract.rs`:

```rust
#[sqlx::test(migrations = "../../migrations")]
async fn account_me_returns_profile_for_active_session(pool: sqlx::PgPool) {
    let app = support::app(pool);
    let challenge = post_json(
        app.clone(),
        "/v1/account/email-login/start",
        json!({ "email": "settings@example.com" }),
        None,
    )
    .await;
    let session = post_json(
        app.clone(),
        "/v1/account/email-login/finish",
        json!({
            "challengeId": challenge["challengeId"],
            "code": challenge["devCode"],
            "trustDevice": true,
            "deviceLabel": "Settings Laptop"
        }),
        None,
    )
    .await;
    let token = session["sessionToken"].as_str().unwrap();

    let response = app
        .oneshot(
            Request::builder()
                .method("GET")
                .uri("/v1/account/me")
                .header("authorization", format!("Bearer {token}"))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);
    let body = axum::body::to_bytes(response.into_body(), usize::MAX).await.unwrap();
    let body: Value = serde_json::from_slice(&body).unwrap();
    assert_eq!(body["profile"]["primaryEmail"], "settings@example.com");
    assert_eq!(body["trustedDevices"].as_array().unwrap().len(), 1);
}

#[sqlx::test(migrations = "../../migrations")]
async fn revoked_account_session_cannot_load_me(pool: sqlx::PgPool) {
    let app = support::app(pool);
    let challenge = post_json(
        app.clone(),
        "/v1/account/email-login/start",
        json!({ "email": "logout@example.com" }),
        None,
    )
    .await;
    let session = post_json(
        app.clone(),
        "/v1/account/email-login/finish",
        json!({
            "challengeId": challenge["challengeId"],
            "code": challenge["devCode"],
            "trustDevice": false,
            "deviceLabel": "One-time browser"
        }),
        None,
    )
    .await;
    let token = session["sessionToken"].as_str().unwrap();

    let logout_response = app
        .clone()
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/v1/account/sessions/logout")
                .header("authorization", format!("Bearer {token}"))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(logout_response.status(), StatusCode::NO_CONTENT);

    let me_response = app
        .oneshot(
            Request::builder()
                .method("GET")
                .uri("/v1/account/me")
                .header("authorization", format!("Bearer {token}"))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(me_response.status(), StatusCode::UNAUTHORIZED);
}
```

- [ ] **Step 2: Run tests to verify RED**

Run:

```bash
cd backend
rtk cargo test -p sagittarius-api --test account_auth_contract account_me_returns_profile_for_active_session revoked_account_session_cannot_load_me
```

Expected: FAIL because authenticated account endpoints do not exist.

- [ ] **Step 3: Add account session lookup and revoke queries**

Append to `backend/crates/sagittarius-api/src/db/account_queries.rs`:

```rust
pub async fn revoke_user_session(pool: &PgPool, token_hash: &str) -> Result<u64, sqlx::Error> {
    let result = sqlx::query(
        "update user_sessions
         set revoked_at = now()
         where session_token_hash = $1 and revoked_at is null",
    )
    .bind(token_hash)
    .execute(pool)
    .await?;

    Ok(result.rows_affected())
}
```

- [ ] **Step 4: Add settings app functions**

Append to `backend/crates/sagittarius-api/src/app/account.rs`:

```rust
use crate::domain::types::{AccountProfile, AccountSettings, PasskeySummary, TrustedDeviceSummary};

pub async fn authenticate_user_session(pool: &PgPool, session_token: &str) -> Result<Uuid, ServiceError> {
    let token_hash = hash_session_token(session_token)?;
    let session = account_queries::find_active_user_session(pool, &token_hash)
        .await?
        .ok_or(ServiceError::Unauthenticated)?;
    Ok(session.user_id)
}

pub async fn load_settings(pool: &PgPool, session_token: &str) -> Result<AccountSettings, ServiceError> {
    let user_id = authenticate_user_session(pool, session_token).await?;
    let profile = account_queries::get_user_profile(pool, user_id)
        .await?
        .ok_or(ServiceError::NotFound)?;
    let passkeys = account_queries::list_passkeys(pool, user_id).await?;
    let trusted_devices = account_queries::list_trusted_devices(pool, user_id).await?;

    Ok(AccountSettings {
        profile: AccountProfile {
            id: profile.id,
            display_name: profile.display_name,
            avatar_color: profile.avatar_color,
            locale: profile.locale,
            timezone: profile.timezone,
            primary_email: profile.primary_email,
        },
        passkeys: passkeys
            .into_iter()
            .map(|record| PasskeySummary {
                id: record.id,
                nickname: record.nickname,
                created_at: record.created_at,
                last_used_at: record.last_used_at,
            })
            .collect(),
        trusted_devices: trusted_devices
            .into_iter()
            .map(|record| TrustedDeviceSummary {
                id: record.id,
                label: record.label,
                user_agent: record.user_agent,
                created_at: record.created_at,
                last_seen_at: record.last_seen_at,
            })
            .collect(),
    })
}

pub async fn logout_user_session(pool: &PgPool, session_token: &str) -> Result<(), ServiceError> {
    let token_hash = hash_session_token(session_token)?;
    account_queries::revoke_user_session(pool, &token_hash).await?;
    Ok(())
}
```

- [ ] **Step 5: Add bearer extraction and settings handlers**

Append to `backend/crates/sagittarius-api/src/api/account.rs`:

```rust
use axum::http::StatusCode;
use crate::domain::types::AccountSettings;

pub async fn me(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<AccountSettings>, ServiceError> {
    let token = bearer_token(&headers).ok_or(ServiceError::Unauthenticated)?;
    let response = app::account::load_settings(&state.pool, token).await?;
    Ok(Json(response))
}

pub async fn logout(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<StatusCode, ServiceError> {
    let token = bearer_token(&headers).ok_or(ServiceError::Unauthenticated)?;
    app::account::logout_user_session(&state.pool, token).await?;
    Ok(StatusCode::NO_CONTENT)
}

fn bearer_token(headers: &HeaderMap) -> Option<&str> {
    let value = headers.get(header::AUTHORIZATION)?.to_str().ok()?;
    value.strip_prefix("Bearer ")
}
```

- [ ] **Step 6: Route settings endpoints**

Add routes in `backend/crates/sagittarius-api/src/api/mod.rs`:

```rust
        .route("/v1/account/me", get(account::me))
        .route("/v1/account/settings", get(account::me))
        .route("/v1/account/sessions/logout", post(account::logout))
```

- [ ] **Step 7: Run account settings tests**

Run:

```bash
cd backend
rtk cargo test -p sagittarius-api --test account_auth_contract
```

Expected: PASS.

- [ ] **Step 8: Commit account settings**

Run:

```bash
rtk git add backend/crates/sagittarius-api/src/api/account.rs backend/crates/sagittarius-api/src/api/mod.rs backend/crates/sagittarius-api/src/app/account.rs backend/crates/sagittarius-api/src/db/account_queries.rs backend/crates/sagittarius-api/tests/account_auth_contract.rs
rtk git commit -m "feat: add account settings and session logout"
```

Expected: commit succeeds.

---

### Task 6: Provider-Free Passkey Challenge Storage

**Files:**
- Modify: `backend/crates/sagittarius-api/src/db/account_queries.rs`
- Modify: `backend/crates/sagittarius-api/src/app/account.rs`
- Modify: `backend/crates/sagittarius-api/src/api/account.rs`
- Modify: `backend/crates/sagittarius-api/src/api/mod.rs`
- Modify: `backend/crates/sagittarius-api/tests/account_auth_contract.rs`

- [ ] **Step 1: Write failing passkey challenge tests**

Append to `backend/crates/sagittarius-api/tests/account_auth_contract.rs`:

```rust
#[sqlx::test(migrations = "../../migrations")]
async fn authenticated_user_can_create_passkey_registration_challenge(pool: sqlx::PgPool) {
    let app = support::app(pool);
    let challenge = post_json(
        app.clone(),
        "/v1/account/email-login/start",
        json!({ "email": "passkey@example.com" }),
        None,
    )
    .await;
    let session = post_json(
        app.clone(),
        "/v1/account/email-login/finish",
        json!({
            "challengeId": challenge["challengeId"],
            "code": challenge["devCode"],
            "trustDevice": false,
            "deviceLabel": "Passkey test"
        }),
        None,
    )
    .await;

    let token = session["sessionToken"].as_str().unwrap();
    let passkey_challenge = post_json(
        app,
        "/v1/account/passkeys/register/start",
        json!({}),
        Some(token),
    )
    .await;

    assert!(passkey_challenge["challengeId"].as_str().unwrap().len() > 20);
    assert!(passkey_challenge["challenge"].as_str().unwrap().len() > 20);
}
```

- [ ] **Step 2: Run passkey test to verify RED**

Run:

```bash
cd backend
rtk cargo test -p sagittarius-api --test account_auth_contract authenticated_user_can_create_passkey_registration_challenge
```

Expected: FAIL because passkey route does not exist.

- [ ] **Step 3: Add passkey challenge insert query**

Append to `backend/crates/sagittarius-api/src/db/account_queries.rs`:

```rust
pub async fn insert_webauthn_challenge(
    pool: &PgPool,
    id: Uuid,
    user_id: Option<Uuid>,
    challenge: &str,
    purpose: &str,
    expires_at: OffsetDateTime,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        "insert into webauthn_challenges (id, user_id, challenge, purpose, expires_at)
         values ($1, $2, $3, $4, $5)",
    )
    .bind(id)
    .bind(user_id)
    .bind(challenge)
    .bind(purpose)
    .bind(expires_at)
    .execute(pool)
    .await?;

    Ok(())
}
```

- [ ] **Step 4: Add passkey challenge app function**

Append to `backend/crates/sagittarius-api/src/app/account.rs`:

```rust
const WEBAUTHN_CHALLENGE_TTL: Duration = Duration::minutes(5);

pub async fn start_passkey_registration(
    pool: &PgPool,
    session_token: &str,
) -> Result<crate::domain::types::PasskeyChallengeResponse, ServiceError> {
    let user_id = authenticate_user_session(pool, session_token).await?;
    let challenge_id = Uuid::now_v7();
    let challenge = generate_session_token();
    let expires_at = OffsetDateTime::now_utc() + WEBAUTHN_CHALLENGE_TTL;
    account_queries::insert_webauthn_challenge(
        pool,
        challenge_id,
        Some(user_id),
        &challenge,
        "register",
        expires_at,
    )
    .await?;

    Ok(crate::domain::types::PasskeyChallengeResponse {
        challenge_id,
        challenge,
        expires_at: format_timestamp(expires_at)?,
    })
}
```

- [ ] **Step 5: Add passkey route handler**

Append to `backend/crates/sagittarius-api/src/api/account.rs`:

```rust
use crate::domain::types::PasskeyChallengeResponse;

pub async fn start_passkey_registration(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<PasskeyChallengeResponse>, ServiceError> {
    let token = bearer_token(&headers).ok_or(ServiceError::Unauthenticated)?;
    let response = app::account::start_passkey_registration(&state.pool, token).await?;
    Ok(Json(response))
}
```

- [ ] **Step 6: Route passkey registration start**

Add route in `backend/crates/sagittarius-api/src/api/mod.rs`:

```rust
        .route(
            "/v1/account/passkeys/register/start",
            post(account::start_passkey_registration),
        )
```

- [ ] **Step 7: Run passkey challenge tests**

Run:

```bash
cd backend
rtk cargo test -p sagittarius-api --test account_auth_contract authenticated_user_can_create_passkey_registration_challenge
```

Expected: PASS.

- [ ] **Step 8: Commit passkey challenge storage**

Run:

```bash
rtk git add backend/crates/sagittarius-api/src/db/account_queries.rs backend/crates/sagittarius-api/src/app/account.rs backend/crates/sagittarius-api/src/api/account.rs backend/crates/sagittarius-api/src/api/mod.rs backend/crates/sagittarius-api/tests/account_auth_contract.rs
rtk git commit -m "feat: add provider-free passkey challenge storage"
```

Expected: commit succeeds.

---

### Task 7: Full Backend Verification

**Files:**
- No source changes expected.

- [ ] **Step 1: Run account-focused tests**

Run:

```bash
cd backend
rtk cargo test -p sagittarius-api --test account_schema_contract
rtk cargo test -p sagittarius-api --test account_auth_contract
```

Expected: both commands PASS.

- [ ] **Step 2: Run full backend tests**

Run:

```bash
cd backend
rtk cargo test -p sagittarius-api
```

Expected: PASS.

- [ ] **Step 3: Confirm no third-party provider dependency was added**

Run:

```bash
rtk rg -n "sendgrid|resend|postmark|auth0|clerk|supabase_auth|firebase|oauth|provider" backend/Cargo.toml backend/crates/sagittarius-api/Cargo.toml backend/crates/sagittarius-api/src backend/migrations
```

Expected: no matches except documentation comments that explicitly say providers are not used.

- [ ] **Step 4: Commit any verification-only cleanup**

Run:

```bash
rtk git status --short
```

Expected: clean. If formatting changed files, commit them with:

```bash
rtk git add backend
rtk git commit -m "chore: format account identity backend"
```

## Next Plan

After this plan is implemented and verified, write the second plan:
`docs/superpowers/plans/2026-05-29-account-trip-ownership.md`.
That plan should implement account trip creation, linking a temporary
`trip_members` identity to `users.id`, account trip history/stats reads, and
owner transfer invariants.
