# Backend Vertical Slice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Rust 1.95/PostgreSQL backend vertical slice for join/session, trip load, itinerary mutation, suggestions, tasks, role permissions, and WebSocket event replay.

**Architecture:** Add a Rust workspace under `backend/` using axum for REST/WebSocket transport, sqlx for Postgres access, and layered modules for api, app, db, domain, and realtime behavior. All writes flow through application services that authenticate sessions, enforce capabilities, perform optimistic concurrency checks, mutate rows in one transaction, persist realtime events, and publish events after commit.

**Tech Stack:** Rust 1.95, edition 2024, axum, tokio, sqlx/postgres, serde, uuid v7, time, argon2, rand, tower-http, tokio-tungstenite tests, PostgreSQL.

---

## File Structure

- Create `rust-toolchain.toml`: pins Rust 1.95.
- Create `backend/Cargo.toml`: backend workspace manifest.
- Create `backend/crates/sagittarius-api/Cargo.toml`: API crate manifest.
- Create `backend/crates/sagittarius-api/src/lib.rs`: public module exports and app builder.
- Create `backend/crates/sagittarius-api/src/main.rs`: local server entry point.
- Create `backend/crates/sagittarius-api/src/api/mod.rs`: route composition.
- Create `backend/crates/sagittarius-api/src/api/error.rs`: HTTP error mapping.
- Create `backend/crates/sagittarius-api/src/api/extractors.rs`: bearer session extraction.
- Create `backend/crates/sagittarius-api/src/api/join.rs`: join, claim, login, logout handlers.
- Create `backend/crates/sagittarius-api/src/api/trips.rs`: trip bootstrap handler.
- Create `backend/crates/sagittarius-api/src/api/itinerary.rs`: itinerary mutation handler.
- Create `backend/crates/sagittarius-api/src/api/suggestions.rs`: suggestion create/resolve handlers.
- Create `backend/crates/sagittarius-api/src/api/tasks.rs`: task create/update handlers.
- Create `backend/crates/sagittarius-api/src/api/ws.rs`: WebSocket replay and stream handler.
- Create `backend/crates/sagittarius-api/src/app/mod.rs`: application service wiring.
- Create `backend/crates/sagittarius-api/src/app/auth.rs`: join/session use cases.
- Create `backend/crates/sagittarius-api/src/app/trips.rs`: cockpit load use case.
- Create `backend/crates/sagittarius-api/src/app/itinerary.rs`: itinerary patch use case.
- Create `backend/crates/sagittarius-api/src/app/suggestions.rs`: suggestion use cases.
- Create `backend/crates/sagittarius-api/src/app/tasks.rs`: task use cases.
- Create `backend/crates/sagittarius-api/src/app/events.rs`: event write/publish helper.
- Create `backend/crates/sagittarius-api/src/db/mod.rs`: pool and transaction helpers.
- Create `backend/crates/sagittarius-api/src/db/models.rs`: row structs and JSON adapters.
- Create `backend/crates/sagittarius-api/src/db/queries.rs`: sqlx query functions.
- Create `backend/crates/sagittarius-api/src/domain/mod.rs`: domain module exports.
- Create `backend/crates/sagittarius-api/src/domain/capabilities.rs`: role capability matrix.
- Create `backend/crates/sagittarius-api/src/domain/types.rs`: DTO/domain enums and structs.
- Create `backend/crates/sagittarius-api/src/domain/patches.rs`: itinerary/task/suggestion patch validation.
- Create `backend/crates/sagittarius-api/src/domain/errors.rs`: service error enum.
- Create `backend/crates/sagittarius-api/src/realtime/mod.rs`: broadcast hub and event envelope.
- Create `backend/crates/sagittarius-api/tests/support/mod.rs`: Postgres test harness and fixtures.
- Create integration tests under `backend/crates/sagittarius-api/tests/`.
- Create `backend/migrations/0001_backend_vertical_slice.sql`: schema migration.
- Create `backend/.env.example`: local database URL example.

## Task 1: Workspace And Rust Toolchain

**Files:**
- Create: `rust-toolchain.toml`
- Create: `backend/Cargo.toml`
- Create: `backend/crates/sagittarius-api/Cargo.toml`
- Create: `backend/crates/sagittarius-api/src/lib.rs`
- Create: `backend/crates/sagittarius-api/src/main.rs`
- Test: `backend/crates/sagittarius-api/tests/workspace_contract.rs`

- [ ] **Step 1: Write the failing workspace contract test**

Create `backend/crates/sagittarius-api/tests/workspace_contract.rs`:

```rust
#[test]
fn crate_exposes_backend_contract_metadata() {
    assert_eq!(env!("CARGO_PKG_NAME"), "sagittarius-api");
    assert_eq!(env!("CARGO_PKG_VERSION"), "0.1.0");
    assert_eq!(sagittarius_api::backend_contract_version(), "2026-05-29");
}
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
rtk cargo test --manifest-path backend/crates/sagittarius-api/Cargo.toml workspace_contract -- --nocapture
```

Expected: FAIL because `backend/crates/sagittarius-api/Cargo.toml` or `sagittarius_api::backend_contract_version` does not exist.

- [ ] **Step 3: Create the Rust workspace files**

Create `rust-toolchain.toml`:

```toml
[toolchain]
channel = "1.95"
components = ["rustfmt", "clippy"]
```

Create `backend/Cargo.toml`:

```toml
[workspace]
resolver = "3"
members = ["crates/sagittarius-api"]

[workspace.package]
edition = "2024"
license = "UNLICENSED"
publish = false
rust-version = "1.95"
```

Create `backend/crates/sagittarius-api/Cargo.toml`:

```toml
[package]
name = "sagittarius-api"
version = "0.1.0"
edition = "2024"
license.workspace = true
publish.workspace = true
rust-version.workspace = true

[dependencies]
argon2 = { version = "0.5", features = ["password-hash"] }
async-trait = "0.1"
axum = { version = "0.8", features = ["json", "macros", "ws"] }
base64 = "0.22"
futures-util = "0.3"
http = "1"
rand = "0.9"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
sqlx = { version = "0.8", features = ["runtime-tokio-rustls", "postgres", "uuid", "time", "json"] }
thiserror = "2"
time = { version = "0.3", features = ["formatting", "macros", "parsing", "serde"] }
tokio = { version = "1", features = ["macros", "rt-multi-thread", "signal", "sync"] }
tower-http = { version = "0.6", features = ["cors", "trace"] }
tracing = "0.1"
tracing-subscriber = { version = "0.3", features = ["env-filter"] }
uuid = { version = "1", features = ["v7", "serde"] }

[dev-dependencies]
tower = { version = "0.5", features = ["util"] }
tokio-tungstenite = "0.27"
url = "2"
```

Create `backend/crates/sagittarius-api/src/lib.rs`:

```rust
pub mod api;
pub mod app;
pub mod db;
pub mod domain;
pub mod realtime;

pub fn backend_contract_version() -> &'static str {
    "2026-05-29"
}
```

Create `backend/crates/sagittarius-api/src/main.rs`:

```rust
#[tokio::main]
async fn main() {
    tracing_subscriber::fmt().with_env_filter("info").init();
    println!("sagittarius-api {}", sagittarius_api::backend_contract_version());
}
```

Create empty module files so the crate compiles before behavior is added:

```rust
// backend/crates/sagittarius-api/src/api/mod.rs
pub mod error;
pub mod extractors;
pub mod itinerary;
pub mod join;
pub mod suggestions;
pub mod tasks;
pub mod trips;
pub mod ws;
```

```rust
// backend/crates/sagittarius-api/src/app/mod.rs
pub mod auth;
pub mod events;
pub mod itinerary;
pub mod suggestions;
pub mod tasks;
pub mod trips;
```

```rust
// backend/crates/sagittarius-api/src/db/mod.rs
pub mod models;
pub mod queries;
```

```rust
// backend/crates/sagittarius-api/src/domain/mod.rs
pub mod capabilities;
pub mod errors;
pub mod patches;
pub mod types;
```

```rust
// backend/crates/sagittarius-api/src/realtime/mod.rs
#[derive(Clone, Default)]
pub struct RealtimeHub;
```

Create the remaining empty files listed by the module declarations.

- [ ] **Step 4: Run the test to verify it passes**

Run:

```bash
rtk cargo test --manifest-path backend/crates/sagittarius-api/Cargo.toml workspace_contract -- --nocapture
```

Expected: PASS when Rust 1.95 is installed. If the command reports that Rust 1.95 is missing, install/select Rust 1.95 before continuing.

- [ ] **Step 5: Format and commit**

Run:

```bash
rtk cargo fmt --manifest-path backend/Cargo.toml
rtk git add rust-toolchain.toml backend/Cargo.toml backend/crates/sagittarius-api
rtk git commit -m "chore: scaffold sagittarius backend workspace"
```

## Task 2: Domain Types And Permissions

**Files:**
- Modify: `backend/crates/sagittarius-api/src/domain/types.rs`
- Modify: `backend/crates/sagittarius-api/src/domain/capabilities.rs`
- Modify: `backend/crates/sagittarius-api/src/domain/errors.rs`
- Test: `backend/crates/sagittarius-api/tests/permissions_contract.rs`

- [ ] **Step 1: Write the failing permission tests**

Create `backend/crates/sagittarius-api/tests/permissions_contract.rs`:

```rust
use sagittarius_api::domain::capabilities::can;
use sagittarius_api::domain::types::{Capability, TripRole};

#[test]
fn role_capabilities_match_frontend_contract() {
    assert!(can(TripRole::Owner, Capability::EditItinerary));
    assert!(can(TripRole::Organizer, Capability::ReviewSuggestions));
    assert!(can(TripRole::Traveler, Capability::CreateSuggestion));
    assert!(can(TripRole::Traveler, Capability::CreatePrivateTask));
    assert!(!can(TripRole::Traveler, Capability::EditItinerary));
    assert!(can(TripRole::Viewer, Capability::ViewPlan));
    assert!(!can(TripRole::Viewer, Capability::CreateSuggestion));
    assert!(!can(TripRole::Viewer, Capability::CreatePrivateTask));
}
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
rtk cargo test --manifest-path backend/crates/sagittarius-api/Cargo.toml permissions_contract -- --nocapture
```

Expected: FAIL because `TripRole`, `Capability`, and `can` are not present at this plan step.

- [ ] **Step 3: Implement domain types and capability checks**

Replace `backend/crates/sagittarius-api/src/domain/types.rs` with:

```rust
use serde::{Deserialize, Serialize};
use sqlx::Type;
use uuid::Uuid;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
#[sqlx(type_name = "text", rename_all = "lowercase")]
pub enum TripRole {
    Owner,
    Organizer,
    Traveler,
    Viewer,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Capability {
    ViewPlan,
    EditItinerary,
    ReviewSuggestions,
    CreateSuggestion,
    ViewExpenses,
    EditExpenses,
    ManagePeople,
    CreateSharedTask,
    CreatePrivateTask,
    UpdateOwnPrivateTask,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
#[sqlx(type_name = "text", rename_all = "lowercase")]
pub enum TripMemberAccessStatus {
    Active,
    Disabled,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MemberSession {
    pub trip_id: Uuid,
    pub member_id: Uuid,
    pub session_token: String,
    pub created_at: String,
    pub expires_at: String,
}
```

Replace `backend/crates/sagittarius-api/src/domain/capabilities.rs` with:

```rust
use super::types::{Capability, TripRole};

pub fn can(role: TripRole, capability: Capability) -> bool {
    match role {
        TripRole::Owner | TripRole::Organizer => true,
        TripRole::Traveler => matches!(
            capability,
            Capability::ViewPlan
                | Capability::CreateSuggestion
                | Capability::ViewExpenses
                | Capability::CreateSharedTask
                | Capability::CreatePrivateTask
                | Capability::UpdateOwnPrivateTask
        ),
        TripRole::Viewer => matches!(capability, Capability::ViewPlan),
    }
}
```

Replace `backend/crates/sagittarius-api/src/domain/errors.rs` with:

```rust
use thiserror::Error;

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
    #[error("version conflict")]
    VersionConflict,
    #[error("database error: {0}")]
    Database(#[from] sqlx::Error),
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run:

```bash
rtk cargo test --manifest-path backend/crates/sagittarius-api/Cargo.toml permissions_contract -- --nocapture
```

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```bash
rtk cargo fmt --manifest-path backend/Cargo.toml
rtk git add backend/crates/sagittarius-api/src/domain backend/crates/sagittarius-api/tests/permissions_contract.rs
rtk git commit -m "feat: add backend role capability matrix"
```

## Task 3: Database Migration And Test Harness

**Files:**
- Create: `backend/migrations/0001_backend_vertical_slice.sql`
- Create: `backend/.env.example`
- Create: `backend/crates/sagittarius-api/tests/support/mod.rs`
- Modify: `backend/crates/sagittarius-api/src/db/mod.rs`
- Test: `backend/crates/sagittarius-api/tests/schema_contract.rs`

- [ ] **Step 1: Write the failing schema test**

Create `backend/crates/sagittarius-api/tests/schema_contract.rs`:

```rust
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
rtk env DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5432/sagittarius_test cargo test --manifest-path backend/crates/sagittarius-api/Cargo.toml schema_contract -- --nocapture
```

Expected: FAIL because the migration file and schema are missing. If Postgres is not running, start a local Postgres instance before continuing.

- [ ] **Step 3: Create the migration and harness files**

Create `backend/.env.example`:

```dotenv
DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5432/sagittarius
SAGITTARIUS_BIND_ADDR=127.0.0.1:5181
```

Create `backend/migrations/0001_backend_vertical_slice.sql`:

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE trips (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  destination_label text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  join_id text NOT NULL UNIQUE,
  join_password_hash text NOT NULL,
  active_plan_variant_id uuid,
  owner_member_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  version bigint NOT NULL DEFAULT 1
);

CREATE TABLE trip_members (
  id uuid PRIMARY KEY,
  trip_id uuid NOT NULL REFERENCES trips(id),
  user_id uuid,
  display_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('owner', 'organizer', 'traveler', 'viewer')),
  access_status text NOT NULL DEFAULT 'active' CHECK (access_status IN ('active', 'disabled')),
  claim_password_hash text,
  claimed_at timestamptz,
  last_seen_at timestamptz,
  presence text NOT NULL DEFAULT 'offline' CHECK (presence IN ('online', 'away', 'offline')),
  color text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE trips
  ADD CONSTRAINT trips_owner_member_id_fkey
  FOREIGN KEY (owner_member_id) REFERENCES trip_members(id)
  DEFERRABLE INITIALLY DEFERRED;

CREATE TABLE trip_member_sessions (
  id uuid PRIMARY KEY,
  trip_id uuid NOT NULL REFERENCES trips(id),
  member_id uuid NOT NULL REFERENCES trip_members(id),
  session_token_hash text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz
);

CREATE TABLE plan_variants (
  id uuid PRIMARY KEY,
  trip_id uuid NOT NULL REFERENCES trips(id),
  name text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('main', 'backup', 'draft', 'split')),
  description text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version bigint NOT NULL DEFAULT 1
);

ALTER TABLE trips
  ADD CONSTRAINT trips_active_plan_variant_id_fkey
  FOREIGN KEY (active_plan_variant_id) REFERENCES plan_variants(id)
  DEFERRABLE INITIALLY DEFERRED;

CREATE TABLE itinerary_items (
  id uuid PRIMARY KEY,
  trip_id uuid NOT NULL REFERENCES trips(id),
  plan_variant_id uuid NOT NULL REFERENCES plan_variants(id),
  day date NOT NULL,
  sort_order integer NOT NULL,
  start_time time,
  activity text NOT NULL,
  activity_type text NOT NULL CHECK (activity_type IN ('travel', 'food', 'shopping', 'attraction', 'experience', 'stay')),
  place text NOT NULL,
  link_label text NOT NULL DEFAULT 'แผนที่',
  map_link text NOT NULL DEFAULT '',
  address text,
  latitude numeric(10, 7),
  longitude numeric(10, 7),
  duration_minutes integer,
  transportation text NOT NULL DEFAULT '',
  note text NOT NULL DEFAULT '',
  advisories jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_by uuid NOT NULL REFERENCES trip_members(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  version bigint NOT NULL DEFAULT 1
);

CREATE TABLE suggestions (
  id uuid PRIMARY KEY,
  trip_id uuid NOT NULL REFERENCES trips(id),
  plan_variant_id uuid NOT NULL REFERENCES plan_variants(id),
  proposer_id uuid NOT NULL REFERENCES trip_members(id),
  type text NOT NULL CHECK (type IN ('add', 'edit', 'delete', 'reorder')),
  target_item_id uuid REFERENCES itinerary_items(id),
  proposed_patch jsonb NOT NULL,
  source_version bigint,
  status text NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'conflicted')),
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  resolved_by uuid REFERENCES trip_members(id)
);

CREATE TABLE trip_tasks (
  id uuid PRIMARY KEY,
  trip_id uuid NOT NULL REFERENCES trips(id),
  title text NOT NULL,
  status text NOT NULL CHECK (status IN ('open', 'done')),
  visibility text NOT NULL CHECK (visibility IN ('private', 'shared')),
  kind text CHECK (kind IN ('prep', 'booking')),
  created_by uuid NOT NULL REFERENCES trip_members(id),
  assignee_id uuid REFERENCES trip_members(id),
  related_item_id uuid REFERENCES itinerary_items(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  version bigint NOT NULL DEFAULT 1
);

CREATE TABLE expenses (
  id uuid PRIMARY KEY,
  trip_id uuid NOT NULL REFERENCES trips(id),
  title text NOT NULL,
  amount_minor integer NOT NULL,
  currency text NOT NULL DEFAULT 'HKD',
  paid_by uuid NOT NULL REFERENCES trip_members(id),
  category text NOT NULL,
  splits jsonb NOT NULL,
  itinerary_item_id uuid REFERENCES itinerary_items(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  version bigint NOT NULL DEFAULT 1
);

CREATE TABLE realtime_events (
  id uuid PRIMARY KEY,
  trip_id uuid NOT NULL REFERENCES trips(id),
  aggregate_type text NOT NULL,
  event_type text NOT NULL,
  aggregate_id uuid NOT NULL,
  version bigint NOT NULL,
  payload jsonb NOT NULL,
  client_mutation_id text,
  created_by uuid REFERENCES trip_members(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX itinerary_items_trip_plan_day_sort_idx
  ON itinerary_items (trip_id, plan_variant_id, day, sort_order)
  WHERE deleted_at IS NULL;

CREATE INDEX suggestions_trip_status_idx
  ON suggestions (trip_id, status, created_at DESC);

CREATE INDEX trip_tasks_trip_visibility_status_idx
  ON trip_tasks (trip_id, visibility, status, updated_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX trip_tasks_assignee_status_idx
  ON trip_tasks (assignee_id, status, updated_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX trip_member_sessions_member_active_idx
  ON trip_member_sessions (member_id, expires_at DESC)
  WHERE revoked_at IS NULL;

CREATE INDEX realtime_events_trip_id_idx
  ON realtime_events (trip_id, id);

CREATE UNIQUE INDEX realtime_events_client_mutation_id_idx
  ON realtime_events (trip_id, created_by, client_mutation_id)
  WHERE client_mutation_id IS NOT NULL;
```

Create `backend/crates/sagittarius-api/tests/support/mod.rs`:

```rust
pub const OWNER_ID: &str = "018f4e81-77a4-7b8f-b3bd-0d0f493ac561";
pub const ORGANIZER_ID: &str = "018f4e81-77a4-7b8f-b3bd-0d0f493ac562";
pub const TRAVELER_ID: &str = "018f4e81-77a4-7b8f-b3bd-0d0f493ac563";
pub const VIEWER_ID: &str = "018f4e81-77a4-7b8f-b3bd-0d0f493ac564";
pub const TRIP_ID: &str = "018f4e80-5788-7de0-a45c-8a555d17fc2d";
pub const PLAN_ID: &str = "018f4e82-3000-7c00-b111-000000000001";
pub const ITEM_ID: &str = "018f4e83-5410-7d8b-8f25-fd52c5e7bd1f";
```

Replace `backend/crates/sagittarius-api/src/db/mod.rs` with:

```rust
pub mod models;
pub mod queries;

pub type PgPool = sqlx::PgPool;
```

- [ ] **Step 4: Run the schema test to verify it passes**

Run:

```bash
rtk env DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5432/sagittarius_test cargo test --manifest-path backend/crates/sagittarius-api/Cargo.toml schema_contract -- --nocapture
```

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```bash
rtk git add backend/.env.example backend/migrations backend/crates/sagittarius-api/src/db backend/crates/sagittarius-api/tests
rtk git commit -m "feat: add backend postgres schema"
```

## Task 4: App State, Error Mapping, And Router

**Files:**
- Modify: `backend/crates/sagittarius-api/src/api/mod.rs`
- Modify: `backend/crates/sagittarius-api/src/api/error.rs`
- Modify: `backend/crates/sagittarius-api/src/app/mod.rs`
- Modify: `backend/crates/sagittarius-api/src/main.rs`
- Test: `backend/crates/sagittarius-api/tests/http_contract.rs`

- [ ] **Step 1: Write the failing health and error mapping test**

Create `backend/crates/sagittarius-api/tests/http_contract.rs`:

```rust
use axum::body::Body;
use http::{Request, StatusCode};
use tower::ServiceExt;

#[tokio::test]
async fn unknown_route_returns_json_not_found() {
    let app = sagittarius_api::api::router(sagittarius_api::app::AppState::test());
    let response = app
        .oneshot(Request::builder().uri("/v1/missing").body(Body::empty()).unwrap())
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::NOT_FOUND);
}
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
rtk cargo test --manifest-path backend/crates/sagittarius-api/Cargo.toml http_contract -- --nocapture
```

Expected: FAIL because `api::router` and `AppState::test` are not present at this plan step.

- [ ] **Step 3: Implement app state, router, and error response**

Replace `backend/crates/sagittarius-api/src/app/mod.rs` with:

```rust
pub mod auth;
pub mod events;
pub mod itinerary;
pub mod suggestions;
pub mod tasks;
pub mod trips;

use crate::realtime::RealtimeHub;

#[derive(Clone)]
pub struct AppState {
    pub realtime: RealtimeHub,
}

impl AppState {
    pub fn test() -> Self {
        Self {
            realtime: RealtimeHub::default(),
        }
    }
}
```

Replace `backend/crates/sagittarius-api/src/api/error.rs` with:

```rust
use axum::{Json, http::StatusCode, response::IntoResponse};
use serde::Serialize;

use crate::domain::errors::ServiceError;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ErrorBody {
    pub code: &'static str,
    pub message: String,
}

pub fn not_found() -> impl IntoResponse {
    (
        StatusCode::NOT_FOUND,
        Json(ErrorBody {
            code: "not_found",
            message: "not found".to_string(),
        }),
    )
}

impl IntoResponse for ServiceError {
    fn into_response(self) -> axum::response::Response {
        let (status, code) = match self {
            ServiceError::InvalidRequest(_) => (StatusCode::BAD_REQUEST, "invalid_request"),
            ServiceError::Unauthenticated => (StatusCode::UNAUTHORIZED, "unauthenticated"),
            ServiceError::Forbidden => (StatusCode::FORBIDDEN, "forbidden"),
            ServiceError::NotFound => (StatusCode::NOT_FOUND, "not_found"),
            ServiceError::VersionConflict => (StatusCode::CONFLICT, "version_conflict"),
            ServiceError::Database(_) => (StatusCode::INTERNAL_SERVER_ERROR, "database_error"),
        };

        (
            status,
            Json(ErrorBody {
                code,
                message: self.to_string(),
            }),
        )
            .into_response()
    }
}
```

Replace `backend/crates/sagittarius-api/src/api/mod.rs` with:

```rust
pub mod error;
pub mod extractors;
pub mod itinerary;
pub mod join;
pub mod suggestions;
pub mod tasks;
pub mod trips;
pub mod ws;

use axum::{Router, routing::get};

use crate::app::AppState;

pub fn router(state: AppState) -> Router {
    Router::new()
        .route("/v1/health", get(|| async { "ok" }))
        .fallback(error::not_found)
        .with_state(state)
}
```

Replace `backend/crates/sagittarius-api/src/main.rs` with:

```rust
#[tokio::main]
async fn main() {
    tracing_subscriber::fmt().with_env_filter("info").init();
    let bind_addr = std::env::var("SAGITTARIUS_BIND_ADDR").unwrap_or_else(|_| "127.0.0.1:5181".to_string());
    println!("sagittarius-api {} listening on {bind_addr}", sagittarius_api::backend_contract_version());
}
```

- [ ] **Step 4: Run the HTTP contract test to verify it passes**

Run:

```bash
rtk cargo test --manifest-path backend/crates/sagittarius-api/Cargo.toml http_contract -- --nocapture
```

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```bash
rtk cargo fmt --manifest-path backend/Cargo.toml
rtk git add backend/crates/sagittarius-api/src backend/crates/sagittarius-api/tests/http_contract.rs
rtk git commit -m "feat: add backend router and error responses"
```

## Task 5: Join, Claim, Login, Logout

**Files:**
- Modify: `backend/crates/sagittarius-api/src/api/join.rs`
- Modify: `backend/crates/sagittarius-api/src/api/mod.rs`
- Modify: `backend/crates/sagittarius-api/src/app/auth.rs`
- Modify: `backend/crates/sagittarius-api/src/db/models.rs`
- Modify: `backend/crates/sagittarius-api/src/db/queries.rs`
- Modify: `backend/crates/sagittarius-api/src/domain/types.rs`
- Test: `backend/crates/sagittarius-api/tests/join_session_contract.rs`

- [ ] **Step 1: Write the failing join/session integration tests**

Create `backend/crates/sagittarius-api/tests/join_session_contract.rs`:

```rust
mod support;

use axum::body::{to_bytes, Body};
use http::{header, Method, Request, StatusCode};
use serde_json::{json, Value};
use tower::ServiceExt;

#[sqlx::test(migrations = "../../migrations")]
async fn join_hides_hashes_and_claim_creates_session(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    let app = support::app(pool.clone());

    let join_response = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/v1/trips/join")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(json!({"joinId":"HK-SZ-2025","tripPassword":"dim-sum-run"}).to_string()))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(join_response.status(), StatusCode::OK);
    let join_body: Value = serde_json::from_slice(&to_bytes(join_response.into_body(), 65536).await.unwrap()).unwrap();
    assert_eq!(join_body["trip"]["id"], support::TRIP_ID);
    assert!(join_body["trip"].get("joinPasswordHash").is_none());
    assert!(join_body["claimableMembers"][0].get("claimPasswordHash").is_none());

    let claim_response = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/v1/trips/{}/members/{}/claim", support::TRIP_ID, support::TRAVELER_ID))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(json!({"participantPassword":"1234"}).to_string()))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(claim_response.status(), StatusCode::OK);
    let claim_body: Value = serde_json::from_slice(&to_bytes(claim_response.into_body(), 65536).await.unwrap()).unwrap();
    assert_eq!(claim_body["tripId"], support::TRIP_ID);
    assert_eq!(claim_body["memberId"], support::TRAVELER_ID);
    assert!(claim_body["sessionToken"].as_str().unwrap().len() >= 32);
}

#[sqlx::test(migrations = "../../migrations")]
async fn disabled_member_cannot_login(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    support::claim_member(&pool, support::VIEWER_ID, "1234", "disabled").await;
    let app = support::app(pool);

    let response = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/v1/trips/{}/members/{}/login", support::TRIP_ID, support::VIEWER_ID))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(json!({"participantPassword":"1234"}).to_string()))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::FORBIDDEN);
}
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
rtk env DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5432/sagittarius_test cargo test --manifest-path backend/crates/sagittarius-api/Cargo.toml join_session_contract -- --nocapture
```

Expected: FAIL because support fixture helpers and auth endpoints are not present at this plan step.

- [ ] **Step 3: Implement fixture helpers and auth routes**

Add helper functions to `backend/crates/sagittarius-api/tests/support/mod.rs`:

```rust
use axum::Router;
use sqlx::PgPool;
use uuid::Uuid;

pub const OWNER_ID: &str = "018f4e81-77a4-7b8f-b3bd-0d0f493ac561";
pub const ORGANIZER_ID: &str = "018f4e81-77a4-7b8f-b3bd-0d0f493ac562";
pub const TRAVELER_ID: &str = "018f4e81-77a4-7b8f-b3bd-0d0f493ac563";
pub const VIEWER_ID: &str = "018f4e81-77a4-7b8f-b3bd-0d0f493ac564";
pub const TRIP_ID: &str = "018f4e80-5788-7de0-a45c-8a555d17fc2d";
pub const PLAN_ID: &str = "018f4e82-3000-7c00-b111-000000000001";
pub const ITEM_ID: &str = "018f4e83-5410-7d8b-8f25-fd52c5e7bd1f";

pub fn app(pool: PgPool) -> Router {
    sagittarius_api::api::router(sagittarius_api::app::AppState::with_pool(pool))
}

pub async fn seed_trip(pool: &PgPool) {
    let trip_id = Uuid::parse_str(TRIP_ID).unwrap();
    let owner_id = Uuid::parse_str(OWNER_ID).unwrap();
    let organizer_id = Uuid::parse_str(ORGANIZER_ID).unwrap();
    let traveler_id = Uuid::parse_str(TRAVELER_ID).unwrap();
    let viewer_id = Uuid::parse_str(VIEWER_ID).unwrap();
    let plan_id = Uuid::parse_str(PLAN_ID).unwrap();
    let item_id = Uuid::parse_str(ITEM_ID).unwrap();

    let mut tx = pool.begin().await.unwrap();
    sqlx::query("set constraints all deferred").execute(&mut *tx).await.unwrap();
    sqlx::query("insert into trips (id, name, destination_label, start_date, end_date, join_id, join_password_hash, active_plan_variant_id, owner_member_id) values ($1,'Hong Kong + Shenzhen Trip','Hong Kong + Shenzhen','2025-05-15','2025-05-20','HK-SZ-2025',$2,$3,$4)")
        .bind(trip_id)
        .bind(sagittarius_api::app::auth::hash_secret_for_tests("dim-sum-run"))
        .bind(plan_id)
        .bind(owner_id)
        .execute(&mut *tx)
        .await
        .unwrap();
    sqlx::query("insert into trip_members (id, trip_id, display_name, role, color) values ($1,$2,'Aom','owner','#0f766e'),($3,$2,'Beam','organizer','#2563eb'),($4,$2,'Nam','traveler','#f97316'),($5,$2,'Family','viewer','#64748b')")
        .bind(owner_id)
        .bind(trip_id)
        .bind(organizer_id)
        .bind(traveler_id)
        .bind(viewer_id)
        .execute(&mut *tx)
        .await
        .unwrap();
    sqlx::query("insert into plan_variants (id, trip_id, name, kind, description) values ($1,$2,'Main','main','Primary plan')")
        .bind(plan_id)
        .bind(trip_id)
        .execute(&mut *tx)
        .await
        .unwrap();
    sqlx::query("insert into itinerary_items (id, trip_id, plan_variant_id, day, sort_order, start_time, activity, activity_type, place, map_link, duration_minutes, transportation, note, created_by, version) values ($1,$2,$3,'2025-05-16',100,'08:30','Dim Dim Sum','food','The Elements','https://maps.google.com',60,'walk','breakfast',$4,4)")
        .bind(item_id)
        .bind(trip_id)
        .bind(plan_id)
        .bind(owner_id)
        .execute(&mut *tx)
        .await
        .unwrap();
    tx.commit().await.unwrap();
}

pub async fn claim_member(pool: &PgPool, member_id: &str, password: &str, access_status: &str) {
    sqlx::query("update trip_members set claim_password_hash = $1, claimed_at = now(), access_status = $2 where id = $3")
        .bind(sagittarius_api::app::auth::hash_secret_for_tests(password))
        .bind(access_status)
        .bind(Uuid::parse_str(member_id).unwrap())
        .execute(pool)
        .await
        .unwrap();
}
```

Implement the minimal auth service and routes. The code must:

```rust
// backend/crates/sagittarius-api/src/app/mod.rs
#[derive(Clone)]
pub struct AppState {
    pub pool: Option<sqlx::PgPool>,
    pub realtime: crate::realtime::RealtimeHub,
}

impl AppState {
    pub fn test() -> Self {
        Self { pool: None, realtime: crate::realtime::RealtimeHub::default() }
    }

    pub fn with_pool(pool: sqlx::PgPool) -> Self {
        Self { pool: Some(pool), realtime: crate::realtime::RealtimeHub::default() }
    }

    pub fn pool(&self) -> Result<&sqlx::PgPool, crate::domain::errors::ServiceError> {
        self.pool.as_ref().ok_or(crate::domain::errors::ServiceError::Database(sqlx::Error::PoolClosed))
    }
}
```

```rust
// backend/crates/sagittarius-api/src/api/mod.rs
use axum::{routing::{get, post}, Router};

pub fn router(state: crate::app::AppState) -> Router {
    Router::new()
        .route("/v1/health", get(|| async { "ok" }))
        .route("/v1/trips/join", post(join::join_trip))
        .route("/v1/trips/{trip_id}/members/{member_id}/claim", post(join::claim_member))
        .route("/v1/trips/{trip_id}/members/{member_id}/login", post(join::login_member))
        .route("/v1/trips/{trip_id}/member-session/logout", post(join::logout))
        .fallback(error::not_found)
        .with_state(state)
}
```

Implement `backend/crates/sagittarius-api/src/app/auth.rs` with Argon2 hashing, `verify_secret`, session token generation, `join_trip`, `claim_member`, `login_member`, and `logout_session`. Return JSON DTOs that omit hash fields.

Implement `backend/crates/sagittarius-api/src/api/join.rs` handlers that deserialize:

```rust
#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct JoinRequest {
    pub join_id: String,
    pub trip_password: String,
}

#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ParticipantPasswordRequest {
    pub participant_password: String,
}
```

- [ ] **Step 4: Run the join/session tests to verify they pass**

Run:

```bash
rtk env DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5432/sagittarius_test cargo test --manifest-path backend/crates/sagittarius-api/Cargo.toml join_session_contract -- --nocapture
```

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```bash
rtk cargo fmt --manifest-path backend/Cargo.toml
rtk git add backend/crates/sagittarius-api/src backend/crates/sagittarius-api/tests
rtk git commit -m "feat: add trip join and participant sessions"
```

## Task 6: Trip Cockpit Load

**Files:**
- Modify: `backend/crates/sagittarius-api/src/api/trips.rs`
- Modify: `backend/crates/sagittarius-api/src/api/mod.rs`
- Modify: `backend/crates/sagittarius-api/src/api/extractors.rs`
- Modify: `backend/crates/sagittarius-api/src/app/trips.rs`
- Modify: `backend/crates/sagittarius-api/src/db/models.rs`
- Modify: `backend/crates/sagittarius-api/src/db/queries.rs`
- Test: `backend/crates/sagittarius-api/tests/trip_load_contract.rs`

- [ ] **Step 1: Write the failing trip load tests**

Create `backend/crates/sagittarius-api/tests/trip_load_contract.rs`:

```rust
mod support;

use axum::body::{to_bytes, Body};
use http::{header, Method, Request, StatusCode};
use serde_json::Value;
use tower::ServiceExt;

#[sqlx::test(migrations = "../../migrations")]
async fn trip_load_returns_cockpit_payload_and_filters_private_tasks(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    let traveler_token = support::create_session(&pool, support::TRAVELER_ID).await;
    support::seed_tasks(&pool).await;
    let app = support::app(pool);

    let response = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(format!("/v1/trips/{}", support::TRIP_ID))
                .header(header::AUTHORIZATION, format!("Bearer {traveler_token}"))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);
    let body: Value = serde_json::from_slice(&to_bytes(response.into_body(), 131072).await.unwrap()).unwrap();
    assert_eq!(body["trip"]["id"], support::TRIP_ID);
    assert_eq!(body["members"].as_array().unwrap().len(), 4);
    assert_eq!(body["itineraryItems"][0]["id"], support::ITEM_ID);
    assert!(body["tasks"].as_array().unwrap().iter().any(|task| task["visibility"] == "shared"));
    assert!(body["tasks"].as_array().unwrap().iter().all(|task| task["visibility"] == "shared" || task["createdBy"] == support::TRAVELER_ID || task["assigneeId"] == support::TRAVELER_ID));
    assert!(body["expenseSummary"].is_object());
}

#[sqlx::test(migrations = "../../migrations")]
async fn viewer_trip_load_hides_expense_summary(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    let viewer_token = support::create_session(&pool, support::VIEWER_ID).await;
    let app = support::app(pool);

    let response = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(format!("/v1/trips/{}", support::TRIP_ID))
                .header(header::AUTHORIZATION, format!("Bearer {viewer_token}"))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);
    let body: Value = serde_json::from_slice(&to_bytes(response.into_body(), 131072).await.unwrap()).unwrap();
    assert!(body["expenseSummary"].is_null());
}
```

- [ ] **Step 2: Run the tests to verify they fail**

Run:

```bash
rtk env DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5432/sagittarius_test cargo test --manifest-path backend/crates/sagittarius-api/Cargo.toml trip_load_contract -- --nocapture
```

Expected: FAIL because authenticated trip load and task fixture helpers are missing.

- [ ] **Step 3: Implement bearer extraction and trip load**

Implement `backend/crates/sagittarius-api/src/api/extractors.rs`:

```rust
use axum::{extract::FromRequestParts, http::request::Parts};

use crate::{app::AppState, domain::errors::ServiceError};

#[derive(Debug, Clone)]
pub struct BearerToken(pub String);

impl FromRequestParts<AppState> for BearerToken {
    type Rejection = ServiceError;

    async fn from_request_parts(parts: &mut Parts, _state: &AppState) -> Result<Self, Self::Rejection> {
        let header = parts
            .headers
            .get(http::header::AUTHORIZATION)
            .and_then(|value| value.to_str().ok())
            .ok_or(ServiceError::Unauthenticated)?;
        let token = header.strip_prefix("Bearer ").ok_or(ServiceError::Unauthenticated)?;
        Ok(Self(token.to_string()))
    }
}
```

Implement `GET /v1/trips/{trip_id}` route and `app::trips::load_cockpit`. The JSON response must include `trip`, `members`, `planVariants`, `itineraryItems`, `suggestions`, `tasks`, and `expenseSummary`. Use the capability matrix to return `expenseSummary: null` for viewers and an object for owner, organizer, or traveler.

Add support helpers:

```rust
pub async fn create_session(pool: &PgPool, member_id: &str) -> String {
    let token = format!("test-token-{member_id}");
    sqlx::query("insert into trip_member_sessions (id, trip_id, member_id, session_token_hash, expires_at) values (gen_random_uuid(), $1, $2, $3, now() + interval '30 days')")
        .bind(Uuid::parse_str(TRIP_ID).unwrap())
        .bind(Uuid::parse_str(member_id).unwrap())
        .bind(sagittarius_api::app::auth::hash_secret_for_tests(&token))
        .execute(pool)
        .await
        .unwrap();
    token
}

pub async fn seed_tasks(pool: &PgPool) {
    sqlx::query("insert into trip_tasks (id, trip_id, title, status, visibility, kind, created_by, assignee_id) values (gen_random_uuid(), $1, 'Buy eSIM', 'open', 'private', 'prep', $2, $2), (gen_random_uuid(), $1, 'Book Peak Tram', 'done', 'shared', 'booking', $3, $3), (gen_random_uuid(), $1, 'Private owner task', 'open', 'private', 'prep', $3, $3)")
        .bind(Uuid::parse_str(TRIP_ID).unwrap())
        .bind(Uuid::parse_str(TRAVELER_ID).unwrap())
        .bind(Uuid::parse_str(ORGANIZER_ID).unwrap())
        .execute(pool)
        .await
        .unwrap();
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run:

```bash
rtk env DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5432/sagittarius_test cargo test --manifest-path backend/crates/sagittarius-api/Cargo.toml trip_load_contract -- --nocapture
```

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```bash
rtk cargo fmt --manifest-path backend/Cargo.toml
rtk git add backend/crates/sagittarius-api/src backend/crates/sagittarius-api/tests
rtk git commit -m "feat: load trip cockpit payload"
```

## Task 7: Itinerary Patch With Permissions, Concurrency, And Events

**Files:**
- Modify: `backend/crates/sagittarius-api/src/api/itinerary.rs`
- Modify: `backend/crates/sagittarius-api/src/api/mod.rs`
- Modify: `backend/crates/sagittarius-api/src/app/events.rs`
- Modify: `backend/crates/sagittarius-api/src/app/itinerary.rs`
- Modify: `backend/crates/sagittarius-api/src/domain/patches.rs`
- Modify: `backend/crates/sagittarius-api/src/realtime/mod.rs`
- Test: `backend/crates/sagittarius-api/tests/itinerary_patch_contract.rs`

- [ ] **Step 1: Write the failing itinerary patch tests**

Create `backend/crates/sagittarius-api/tests/itinerary_patch_contract.rs`:

```rust
mod support;

use axum::body::{to_bytes, Body};
use http::{header, Method, Request, StatusCode};
use serde_json::{json, Value};
use tower::ServiceExt;

#[sqlx::test(migrations = "../../migrations")]
async fn organizer_can_patch_item_and_stale_patch_conflicts(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    let token = support::create_session(&pool, support::ORGANIZER_ID).await;
    let app = support::app(pool.clone());

    let ok = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::PATCH)
                .uri(format!("/v1/itinerary-items/{}", support::ITEM_ID))
                .header(header::AUTHORIZATION, format!("Bearer {token}"))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(json!({"clientMutationId":"web-patch-1","expectedVersion":4,"patch":{"startTime":"09:00","durationMinutes":75}}).to_string()))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(ok.status(), StatusCode::OK);
    let ok_body: Value = serde_json::from_slice(&to_bytes(ok.into_body(), 65536).await.unwrap()).unwrap();
    assert_eq!(ok_body["startTime"], "09:00");
    assert_eq!(ok_body["version"], 5);

    let stale = app
        .oneshot(
            Request::builder()
                .method(Method::PATCH)
                .uri(format!("/v1/itinerary-items/{}", support::ITEM_ID))
                .header(header::AUTHORIZATION, format!("Bearer {token}"))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(json!({"clientMutationId":"web-patch-2","expectedVersion":4,"patch":{"startTime":"10:00"}}).to_string()))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(stale.status(), StatusCode::CONFLICT);
}

#[sqlx::test(migrations = "../../migrations")]
async fn traveler_cannot_patch_item(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    let token = support::create_session(&pool, support::TRAVELER_ID).await;
    let app = support::app(pool);
    let response = app
        .oneshot(
            Request::builder()
                .method(Method::PATCH)
                .uri(format!("/v1/itinerary-items/{}", support::ITEM_ID))
                .header(header::AUTHORIZATION, format!("Bearer {token}"))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(json!({"clientMutationId":"web-patch-3","expectedVersion":4,"patch":{"startTime":"09:00"}}).to_string()))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(response.status(), StatusCode::FORBIDDEN);
}
```

- [ ] **Step 2: Run the tests to verify they fail**

Run:

```bash
rtk env DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5432/sagittarius_test cargo test --manifest-path backend/crates/sagittarius-api/Cargo.toml itinerary_patch_contract -- --nocapture
```

Expected: FAIL because itinerary patch behavior is missing.

- [ ] **Step 3: Implement itinerary patch**

Implement request DTO:

```rust
#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PatchItineraryItemRequest {
    pub client_mutation_id: String,
    pub expected_version: i64,
    pub patch: ItineraryItemPatch,
}

#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ItineraryItemPatch {
    pub start_time: Option<String>,
    pub duration_minutes: Option<i32>,
    pub activity: Option<String>,
    pub activity_type: Option<String>,
    pub place: Option<String>,
    pub map_link: Option<String>,
    pub transportation: Option<String>,
    pub note: Option<String>,
}
```

The service must load actor by bearer token, require `Capability::EditItinerary`, update only allowed fields, increment `version`, update `updated_at`, insert `realtime_events` with event type `itinerary_item.updated`, and return `409` if stored version differs from `expected_version`.

- [ ] **Step 4: Run the tests to verify they pass**

Run:

```bash
rtk env DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5432/sagittarius_test cargo test --manifest-path backend/crates/sagittarius-api/Cargo.toml itinerary_patch_contract -- --nocapture
```

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```bash
rtk cargo fmt --manifest-path backend/Cargo.toml
rtk git add backend/crates/sagittarius-api/src backend/crates/sagittarius-api/tests/itinerary_patch_contract.rs
rtk git commit -m "feat: patch itinerary items with concurrency checks"
```

## Task 8: Suggestions

**Files:**
- Modify: `backend/crates/sagittarius-api/src/api/suggestions.rs`
- Modify: `backend/crates/sagittarius-api/src/api/mod.rs`
- Modify: `backend/crates/sagittarius-api/src/app/suggestions.rs`
- Test: `backend/crates/sagittarius-api/tests/suggestions_contract.rs`

- [ ] **Step 1: Write the failing suggestion tests**

Create `backend/crates/sagittarius-api/tests/suggestions_contract.rs`:

```rust
mod support;

use axum::body::Body;
use http::{header, Method, Request, StatusCode};
use serde_json::json;
use tower::ServiceExt;

#[sqlx::test(migrations = "../../migrations")]
async fn traveler_can_create_suggestion_and_viewer_cannot(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    let traveler = support::create_session(&pool, support::TRAVELER_ID).await;
    let viewer = support::create_session(&pool, support::VIEWER_ID).await;
    let app = support::app(pool);

    let ok = app
        .clone()
        .oneshot(Request::builder().method(Method::POST).uri(format!("/v1/trips/{}/suggestions", support::TRIP_ID)).header(header::AUTHORIZATION, format!("Bearer {traveler}")).header(header::CONTENT_TYPE, "application/json").body(Body::from(json!({"clientMutationId":"web-suggestion-1","type":"edit","targetItemId":support::ITEM_ID,"planVariantId":support::PLAN_ID,"sourceVersion":4,"proposedPatch":{"note":"book ahead"}}).to_string())).unwrap())
        .await
        .unwrap();
    assert_eq!(ok.status(), StatusCode::CREATED);

    let forbidden = app
        .oneshot(Request::builder().method(Method::POST).uri(format!("/v1/trips/{}/suggestions", support::TRIP_ID)).header(header::AUTHORIZATION, format!("Bearer {viewer}")).header(header::CONTENT_TYPE, "application/json").body(Body::from(json!({"clientMutationId":"web-suggestion-2","type":"edit","targetItemId":support::ITEM_ID,"planVariantId":support::PLAN_ID,"sourceVersion":4,"proposedPatch":{"note":"book ahead"}}).to_string())).unwrap())
        .await
        .unwrap();
    assert_eq!(forbidden.status(), StatusCode::FORBIDDEN);
}

#[sqlx::test(migrations = "../../migrations")]
async fn organizer_approves_matching_suggestion_and_conflicts_stale_one(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    let organizer = support::create_session(&pool, support::ORGANIZER_ID).await;
    let fresh_id = support::seed_suggestion(&pool, 4).await;
    let stale_id = support::seed_suggestion(&pool, 2).await;
    let app = support::app(pool);

    let approved = app.clone().oneshot(Request::builder().method(Method::POST).uri(format!("/v1/suggestions/{fresh_id}/approve")).header(header::AUTHORIZATION, format!("Bearer {organizer}")).body(Body::empty()).unwrap()).await.unwrap();
    assert_eq!(approved.status(), StatusCode::OK);

    let conflicted = app.oneshot(Request::builder().method(Method::POST).uri(format!("/v1/suggestions/{stale_id}/approve")).header(header::AUTHORIZATION, format!("Bearer {organizer}")).body(Body::empty()).unwrap()).await.unwrap();
    assert_eq!(conflicted.status(), StatusCode::CONFLICT);
}
```

- [ ] **Step 2: Run the tests to verify they fail**

Run:

```bash
rtk env DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5432/sagittarius_test cargo test --manifest-path backend/crates/sagittarius-api/Cargo.toml suggestions_contract -- --nocapture
```

Expected: FAIL because suggestion routes and helpers are missing.

- [ ] **Step 3: Implement suggestion create, approve, and reject**

Implement `POST /v1/trips/{trip_id}/suggestions`, `POST /v1/suggestions/{suggestion_id}/approve`, and `POST /v1/suggestions/{suggestion_id}/reject`.

Behavior:

```rust
// create
require Capability::CreateSuggestion;
insert suggestions.status = 'pending';
insert realtime_events.event_type = 'suggestion.created';

// approve
require Capability::ReviewSuggestions;
lock suggestion and target itinerary item;
if suggestion.source_version != itinerary_items.version {
    update suggestions.status = 'conflicted';
    insert realtime_events.event_type = 'suggestion.resolved';
    return ServiceError::VersionConflict;
}
apply proposed_patch to itinerary_items;
increment itinerary_items.version;
update suggestions.status = 'approved';
insert realtime_events.event_type = 'suggestion.resolved';

// reject
require Capability::ReviewSuggestions;
update suggestions.status = 'rejected';
insert realtime_events.event_type = 'suggestion.resolved';
```

Add support helper:

```rust
pub async fn seed_suggestion(pool: &PgPool, source_version: i64) -> uuid::Uuid {
    let id = uuid::Uuid::now_v7();
    sqlx::query("insert into suggestions (id, trip_id, plan_variant_id, proposer_id, type, target_item_id, proposed_patch, source_version, status) values ($1,$2,$3,$4,'edit',$5,$6,$7,'pending')")
        .bind(id)
        .bind(uuid::Uuid::parse_str(TRIP_ID).unwrap())
        .bind(uuid::Uuid::parse_str(PLAN_ID).unwrap())
        .bind(uuid::Uuid::parse_str(TRAVELER_ID).unwrap())
        .bind(uuid::Uuid::parse_str(ITEM_ID).unwrap())
        .bind(serde_json::json!({"note":"approved note"}))
        .bind(source_version)
        .execute(pool)
        .await
        .unwrap();
    id
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run:

```bash
rtk env DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5432/sagittarius_test cargo test --manifest-path backend/crates/sagittarius-api/Cargo.toml suggestions_contract -- --nocapture
```

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```bash
rtk cargo fmt --manifest-path backend/Cargo.toml
rtk git add backend/crates/sagittarius-api/src backend/crates/sagittarius-api/tests
rtk git commit -m "feat: add itinerary suggestions workflow"
```

## Task 9: Tasks API

**Files:**
- Modify: `backend/crates/sagittarius-api/src/api/tasks.rs`
- Modify: `backend/crates/sagittarius-api/src/api/mod.rs`
- Modify: `backend/crates/sagittarius-api/src/app/tasks.rs`
- Test: `backend/crates/sagittarius-api/tests/tasks_contract.rs`

- [ ] **Step 1: Write the failing task tests**

Create `backend/crates/sagittarius-api/tests/tasks_contract.rs`:

```rust
mod support;

use axum::body::{to_bytes, Body};
use http::{header, Method, Request, StatusCode};
use serde_json::{json, Value};
use tower::ServiceExt;

#[sqlx::test(migrations = "../../migrations")]
async fn traveler_creates_and_updates_own_private_task(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    let token = support::create_session(&pool, support::TRAVELER_ID).await;
    let app = support::app(pool);

    let created = app
        .clone()
        .oneshot(Request::builder().method(Method::POST).uri(format!("/v1/trips/{}/tasks", support::TRIP_ID)).header(header::AUTHORIZATION, format!("Bearer {token}")).header(header::CONTENT_TYPE, "application/json").body(Body::from(json!({"clientMutationId":"web-task-1","title":"Buy eSIM","visibility":"private","assigneeId":support::TRAVELER_ID}).to_string())).unwrap())
        .await
        .unwrap();
    assert_eq!(created.status(), StatusCode::CREATED);
    let body: Value = serde_json::from_slice(&to_bytes(created.into_body(), 65536).await.unwrap()).unwrap();
    let task_id = body["id"].as_str().unwrap();

    let updated = app
        .oneshot(Request::builder().method(Method::PATCH).uri(format!("/v1/tasks/{task_id}")).header(header::AUTHORIZATION, format!("Bearer {token}")).header(header::CONTENT_TYPE, "application/json").body(Body::from(json!({"clientMutationId":"web-task-2","expectedVersion":1,"patch":{"status":"done"}}).to_string())).unwrap())
        .await
        .unwrap();
    assert_eq!(updated.status(), StatusCode::OK);
}

#[sqlx::test(migrations = "../../migrations")]
async fn viewer_cannot_create_task(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    let token = support::create_session(&pool, support::VIEWER_ID).await;
    let app = support::app(pool);
    let response = app
        .oneshot(Request::builder().method(Method::POST).uri(format!("/v1/trips/{}/tasks", support::TRIP_ID)).header(header::AUTHORIZATION, format!("Bearer {token}")).header(header::CONTENT_TYPE, "application/json").body(Body::from(json!({"clientMutationId":"web-task-3","title":"Buy eSIM","visibility":"private"}).to_string())).unwrap())
        .await
        .unwrap();
    assert_eq!(response.status(), StatusCode::FORBIDDEN);
}
```

- [ ] **Step 2: Run the tests to verify they fail**

Run:

```bash
rtk env DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5432/sagittarius_test cargo test --manifest-path backend/crates/sagittarius-api/Cargo.toml tasks_contract -- --nocapture
```

Expected: FAIL because task routes are missing.

- [ ] **Step 3: Implement task create and patch**

Implement `POST /v1/trips/{trip_id}/tasks` and `PATCH /v1/tasks/{task_id}`.

Behavior:

```rust
// create task
require Capability::CreatePrivateTask for private visibility;
require Capability::CreateSharedTask for shared visibility;
created_by = actor.member_id;
assignee_id = request.assignee_id for shared tasks;
assignee_id = actor.member_id for private tasks;
status = "open";
version = 1;
insert realtime_events.event_type = "task.created";

// patch task
lock task;
allow owner/organizer to patch any task;
allow traveler only when task.visibility = "private" and actor is created_by or assignee_id;
check expectedVersion;
update status/title/assignee_id/related_item_id when present;
increment version;
insert realtime_events.event_type = "task.updated";
```

- [ ] **Step 4: Run the tests to verify they pass**

Run:

```bash
rtk env DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5432/sagittarius_test cargo test --manifest-path backend/crates/sagittarius-api/Cargo.toml tasks_contract -- --nocapture
```

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```bash
rtk cargo fmt --manifest-path backend/Cargo.toml
rtk git add backend/crates/sagittarius-api/src backend/crates/sagittarius-api/tests/tasks_contract.rs
rtk git commit -m "feat: add trip task mutations"
```

## Task 10: Realtime Event Replay And WebSocket

**Files:**
- Modify: `backend/crates/sagittarius-api/src/api/ws.rs`
- Modify: `backend/crates/sagittarius-api/src/api/mod.rs`
- Modify: `backend/crates/sagittarius-api/src/realtime/mod.rs`
- Modify: `backend/crates/sagittarius-api/src/app/events.rs`
- Test: `backend/crates/sagittarius-api/tests/realtime_contract.rs`

- [ ] **Step 1: Write the failing realtime tests**

Create `backend/crates/sagittarius-api/tests/realtime_contract.rs`:

```rust
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
}
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
rtk env DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5432/sagittarius_test cargo test --manifest-path backend/crates/sagittarius-api/Cargo.toml realtime_contract -- --nocapture
```

Expected: FAIL because event replay is not present at this plan step.

- [ ] **Step 3: Implement event envelopes, replay, and WebSocket route**

Replace `backend/crates/sagittarius-api/src/realtime/mod.rs` with:

```rust
use serde::Serialize;
use sqlx::PgPool;
use tokio::sync::broadcast;
use uuid::Uuid;

#[derive(Clone)]
pub struct RealtimeHub {
    sender: broadcast::Sender<RealtimeEvent>,
}

impl Default for RealtimeHub {
    fn default() -> Self {
        let (sender, _) = broadcast::channel(1024);
        Self { sender }
    }
}

impl RealtimeHub {
    pub fn subscribe(&self) -> broadcast::Receiver<RealtimeEvent> {
        self.sender.subscribe()
    }

    pub fn publish(&self, event: RealtimeEvent) {
        let _ = self.sender.send(event);
    }
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RealtimeEvent {
    pub event_id: Uuid,
    pub trip_id: Uuid,
    #[serde(rename = "type")]
    pub event_type: String,
    pub aggregate_id: Uuid,
    pub version: i64,
    pub client_mutation_id: Option<String>,
    pub actor_member_id: Option<Uuid>,
    pub occurred_at: String,
    pub payload: serde_json::Value,
}

pub async fn load_events_after(pool: &PgPool, trip_id: Uuid, after_event_id: Option<Uuid>) -> Result<Vec<RealtimeEvent>, sqlx::Error> {
    let rows = sqlx::query!(
        "select id, trip_id, event_type, aggregate_id, version, client_mutation_id, created_by, created_at, payload
         from realtime_events
         where trip_id = $1 and ($2::uuid is null or id > $2)
         order by id asc
         limit 500",
        trip_id,
        after_event_id
    )
    .fetch_all(pool)
    .await?;

    Ok(rows
        .into_iter()
        .map(|row| RealtimeEvent {
            event_id: row.id,
            trip_id: row.trip_id,
            event_type: row.event_type,
            aggregate_id: row.aggregate_id,
            version: row.version,
            client_mutation_id: row.client_mutation_id,
            actor_member_id: row.created_by,
            occurred_at: row.created_at.to_string(),
            payload: row.payload,
        })
        .collect())
}
```

Implement `GET /v1/trips/{trip_id}/ws` to authenticate the bearer token from the WebSocket request, replay `load_events_after`, then forward events from `RealtimeHub::subscribe()` where `event.trip_id == trip_id`.

Add support helper:

```rust
pub async fn insert_event(pool: &PgPool, event_type: &str) -> uuid::Uuid {
    let id = uuid::Uuid::now_v7();
    sqlx::query("insert into realtime_events (id, trip_id, aggregate_type, event_type, aggregate_id, version, payload, created_by) values ($1,$2,'task',$3,gen_random_uuid(),1,'{}'::jsonb,$4)")
        .bind(id)
        .bind(uuid::Uuid::parse_str(TRIP_ID).unwrap())
        .bind(event_type)
        .bind(uuid::Uuid::parse_str(ORGANIZER_ID).unwrap())
        .execute(pool)
        .await
        .unwrap();
    id
}
```

- [ ] **Step 4: Run realtime tests to verify they pass**

Run:

```bash
rtk env DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5432/sagittarius_test cargo test --manifest-path backend/crates/sagittarius-api/Cargo.toml realtime_contract -- --nocapture
```

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```bash
rtk cargo fmt --manifest-path backend/Cargo.toml
rtk git add backend/crates/sagittarius-api/src backend/crates/sagittarius-api/tests/realtime_contract.rs
rtk git commit -m "feat: add realtime event replay"
```

## Task 11: Full Verification And Frontend Contract Check

**Files:**
- Modify: `package.json`
- Test: all backend and existing frontend contract tests.

- [ ] **Step 1: Write the failing root script contract test**

Modify `src/project-contract.test.ts` to assert the backend verification script exists:

```ts
it("documents the backend vertical slice verification command", () => {
  const packageJson = JSON.parse(readFileSync(join(process.cwd(), "package.json"), "utf8")) as {
    scripts?: Record<string, string>;
  };

  expect(packageJson.scripts?.["verify:backend"]).toBe(
    "rtk env DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5432/sagittarius_test cargo test --manifest-path backend/Cargo.toml",
  );
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
rtk bun test src/project-contract.test.ts
```

Expected: FAIL because `verify:backend` is missing.

- [ ] **Step 3: Add backend verification script**

Modify `package.json` scripts:

```json
{
  "verify:backend": "rtk env DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5432/sagittarius_test cargo test --manifest-path backend/Cargo.toml"
}
```

Keep existing scripts unchanged.

- [ ] **Step 4: Run backend verification**

Run:

```bash
rtk env DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5432/sagittarius_test cargo test --manifest-path backend/Cargo.toml
```

Expected: PASS for all backend tests.

- [ ] **Step 5: Run frontend contract tests**

Run:

```bash
rtk bun test src/project-contract.test.ts src/trip/api-contract.test.ts src/trip/auth.test.ts src/trip/fixtures.test.ts
```

Expected: PASS.

- [ ] **Step 6: Run formatting and lint checks**

Run:

```bash
rtk cargo fmt --manifest-path backend/Cargo.toml --check
rtk cargo clippy --manifest-path backend/Cargo.toml --all-targets -- -D warnings
```

Expected: PASS.

- [ ] **Step 7: Commit**

Run:

```bash
rtk git add package.json src/project-contract.test.ts backend
rtk git commit -m "test: verify backend vertical slice"
```

## Self-Review Checklist

- Spec coverage: Tasks 1-11 cover Rust 1.95 workspace, Postgres schema, join/session, trip load, itinerary update, suggestions, tasks, permissions, events, WebSocket replay, and verification.
- Placeholder scan: This plan contains no unresolved placeholders, no `TBD`, and no deferred behavior inside the vertical slice.
- Type consistency: Endpoint paths, DTO camelCase names, role names, capability names, and task/suggestion/itinerary IDs match the approved design and frontend contract.
- Scope check: Expenses mutation, documents, invitations, permanent user accounts, and gRPC service contracts remain out of scope as specified by the approved design.
