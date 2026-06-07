# Bookings & Docs Backend Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add normalized backend persistence and API-mode frontend mutations for Bookings & Docs.

**Architecture:** Implement `BookingDoc` as a first-class backend domain with one main table and normalized child relation tables. Follow the existing Sagittarius backend layers: `domain` request/DTO types, `db` models/queries, `app` service transactions/events, `api` route handlers, then wire frontend API client and `SagittariusApp` API-mode mutation handlers.

**Tech Stack:** Rust, Axum, SQLx, PostgreSQL migrations, serde, uuid v7, Next.js 16, React 19, TypeScript, Vitest, Testing Library, Playwright.

---

## File Structure

- Create `backend/migrations/0017_booking_docs.sql`: normalized booking-doc tables, relation tables, indexes.
- Modify `backend/crates/sagittarius-api/src/domain/types.rs`: add `Capability::EditBookings`, `BookingDocSummary`, `BookingDocExternalLinkSummary`, and `booking_docs` field on `TripCockpit`.
- Modify `backend/crates/sagittarius-api/src/domain/capabilities.rs`: grant `EditBookings` to owner and organizer.
- Modify `backend/crates/sagittarius-api/src/domain/patches.rs`: add create/patch request structs and validation helpers.
- Modify `backend/crates/sagittarius-api/src/db/models.rs`: add booking record/link/relation models and `From` mappings where direct.
- Modify `backend/crates/sagittarius-api/src/db/queries.rs`: add list, lock, insert, update, soft-delete, relation replace, and validation queries.
- Create `backend/crates/sagittarius-api/src/app/bookings.rs`: transaction service for create/update/delete, visibility filtering, DTO assembly, and realtime events.
- Modify `backend/crates/sagittarius-api/src/app/mod.rs`: expose `bookings`.
- Create `backend/crates/sagittarius-api/src/api/bookings.rs`: Axum handlers.
- Modify `backend/crates/sagittarius-api/src/api/mod.rs`: register booking routes.
- Modify `backend/crates/sagittarius-api/src/app/trips.rs`: include visible booking docs in cockpit loading.
- Modify `backend/crates/sagittarius-api/src/bin/seed_e2e.rs`: seed representative booking docs for real API QA.
- Modify `frontend/src/trip/api-routes.ts`: add booking endpoints.
- Modify `frontend/src/trip/api-client.ts`: add booking request types and client methods.
- Modify `frontend/src/app/SagittariusApp.tsx`: enable API-mode booking create/update/delete and reload-on-conflict behavior.
- Modify `frontend/src/components/SagittariusApp.test.tsx`: cover API-mode create/update/delete.
- Modify `frontend/src/trip/api-client.test.ts`: cover request/response mapping.
- Modify `frontend/src/trip/api-contract.test.ts` or `frontend/src/trip/api-contract.ts`: ensure `bookingDocs` remains part of cockpit contract.

---

### Task 1: Migration And Backend DTO Contract

**Files:**
- Create: `backend/migrations/0017_booking_docs.sql`
- Modify: `backend/crates/sagittarius-api/src/domain/types.rs`
- Modify: `backend/crates/sagittarius-api/src/domain/capabilities.rs`

- [ ] **Step 1: Add the migration**

Create `backend/migrations/0017_booking_docs.sql` with:

```sql
create table booking_docs (
  id uuid primary key,
  trip_id uuid not null references trips(id) on delete cascade,
  type text not null,
  title text not null,
  status text not null,
  visibility text not null,
  owner_member_id uuid references trip_members(id),
  provider_name text,
  confirmation_code text,
  starts_at timestamptz,
  ends_at timestamptz,
  timezone text,
  price_minor integer,
  currency text,
  notes text,
  created_by uuid not null references trip_members(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  version bigint not null default 1,
  constraint booking_docs_type_check check (type in ('flight', 'train', 'public_transport', 'hotel', 'insurance', 'passport', 'visa', 'activity_ticket', 'other')),
  constraint booking_docs_status_check check (status in ('draft', 'needs_action', 'booked', 'confirmed', 'paid', 'cancelled', 'expired')),
  constraint booking_docs_visibility_check check (visibility in ('shared', 'sensitive', 'private')),
  constraint booking_docs_price_minor_check check (price_minor is null or price_minor >= 0)
);

create index booking_docs_trip_active_idx on booking_docs (trip_id, starts_at, created_at) where deleted_at is null;
create index booking_docs_owner_idx on booking_docs (owner_member_id) where deleted_at is null;
create index booking_docs_created_by_idx on booking_docs (created_by) where deleted_at is null;

create table booking_doc_external_links (
  id uuid primary key,
  booking_doc_id uuid not null references booking_docs(id) on delete cascade,
  label text not null,
  url text not null,
  provider text,
  access_note text,
  sort_order integer not null default 0
);

create index booking_doc_external_links_doc_idx on booking_doc_external_links (booking_doc_id, sort_order);

create table booking_doc_travelers (
  booking_doc_id uuid not null references booking_docs(id) on delete cascade,
  member_id uuid not null references trip_members(id) on delete cascade,
  primary key (booking_doc_id, member_id)
);

create table booking_doc_itinerary_items (
  booking_doc_id uuid not null references booking_docs(id) on delete cascade,
  itinerary_item_id uuid not null references itinerary_items(id) on delete cascade,
  primary key (booking_doc_id, itinerary_item_id)
);

create table booking_doc_tasks (
  booking_doc_id uuid not null references booking_docs(id) on delete cascade,
  task_id uuid not null references trip_tasks(id) on delete cascade,
  primary key (booking_doc_id, task_id)
);

create table booking_doc_expenses (
  booking_doc_id uuid not null references booking_docs(id) on delete cascade,
  expense_id uuid not null references expenses(id) on delete cascade,
  primary key (booking_doc_id, expense_id)
);

create table booking_doc_stop_notes (
  booking_doc_id uuid not null references booking_docs(id) on delete cascade,
  stop_note_id uuid not null references stop_notes(id) on delete cascade,
  primary key (booking_doc_id, stop_note_id)
);
```

- [ ] **Step 2: Add backend DTOs**

In `domain/types.rs`, add `EditBookings` to `Capability`, add `BookingDocExternalLinkSummary` and `BookingDocSummary`, then add `booking_docs: Vec<BookingDocSummary>` to `TripCockpit`.

Use these exact DTO fields:

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BookingDocExternalLinkSummary {
    pub id: Uuid,
    pub label: String,
    pub url: String,
    pub provider: Option<String>,
    pub access_note: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BookingDocSummary {
    pub id: Uuid,
    pub trip_id: Uuid,
    pub r#type: String,
    pub title: String,
    pub status: String,
    pub visibility: String,
    pub owner_member_id: Option<Uuid>,
    pub provider_name: Option<String>,
    pub confirmation_code: Option<String>,
    pub starts_at: Option<String>,
    pub ends_at: Option<String>,
    pub timezone: Option<String>,
    pub price_amount: Option<f64>,
    pub currency: Option<String>,
    pub traveler_ids: Vec<Uuid>,
    pub external_links: Vec<BookingDocExternalLinkSummary>,
    pub related_itinerary_item_ids: Vec<Uuid>,
    pub related_task_ids: Vec<Uuid>,
    pub related_expense_ids: Vec<Uuid>,
    pub note_ids: Vec<Uuid>,
    pub notes: Option<String>,
    pub created_by: Uuid,
    pub updated_at: String,
    pub version: i64,
}
```

- [ ] **Step 3: Grant capability**

In `domain/capabilities.rs`, add `Capability::EditBookings` to owner and organizer role capability matches. Do not grant it to traveler or viewer.

- [ ] **Step 4: Verify backend compiles far enough to expose missing fields**

Run: `cd backend && cargo check -p sagittarius-api`

Expected: FAIL until later tasks because `TripCockpit` constructors are missing `booking_docs`.

---

### Task 2: Booking Request Validation

**Files:**
- Modify: `backend/crates/sagittarius-api/src/domain/patches.rs`

- [ ] **Step 1: Add request structs**

Add these structs near expense/task requests:

```rust
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateBookingDocRequest {
    pub client_mutation_id: String,
    pub r#type: String,
    pub title: String,
    pub status: String,
    pub visibility: String,
    pub owner_member_id: Option<Uuid>,
    pub provider_name: Option<String>,
    pub confirmation_code: Option<String>,
    pub starts_at: Option<String>,
    pub ends_at: Option<String>,
    pub timezone: Option<String>,
    pub price_amount: Option<f64>,
    pub currency: Option<String>,
    pub traveler_ids: Vec<Uuid>,
    pub external_links: Vec<CreateBookingDocExternalLinkRequest>,
    pub related_itinerary_item_ids: Vec<Uuid>,
    pub related_task_ids: Vec<Uuid>,
    pub related_expense_ids: Vec<Uuid>,
    pub note_ids: Vec<Uuid>,
    pub notes: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateBookingDocExternalLinkRequest {
    pub id: Option<Uuid>,
    pub label: String,
    pub url: String,
    pub provider: Option<String>,
    pub access_note: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PatchBookingDocRequest {
    pub client_mutation_id: String,
    pub expected_version: i64,
    pub patch: BookingDocPatch,
}

#[derive(Debug, Clone, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BookingDocPatch {
    pub r#type: Option<String>,
    pub title: Option<String>,
    pub status: Option<String>,
    pub visibility: Option<String>,
    #[serde(default, deserialize_with = "deserialize_nullable_uuid_patch")]
    pub owner_member_id: Option<Option<Uuid>>,
    pub provider_name: Option<Option<String>>,
    pub confirmation_code: Option<Option<String>>,
    pub starts_at: Option<Option<String>>,
    pub ends_at: Option<Option<String>>,
    pub timezone: Option<Option<String>>,
    pub price_amount: Option<Option<f64>>,
    pub currency: Option<Option<String>>,
    pub traveler_ids: Option<Vec<Uuid>>,
    pub external_links: Option<Vec<CreateBookingDocExternalLinkRequest>>,
    pub related_itinerary_item_ids: Option<Vec<Uuid>>,
    pub related_task_ids: Option<Vec<Uuid>>,
    pub related_expense_ids: Option<Vec<Uuid>>,
    pub note_ids: Option<Vec<Uuid>>,
    pub notes: Option<Option<String>>,
}
```

- [ ] **Step 2: Add validation methods**

Implement `validate()` for create/patch. Use existing `validate_client_mutation_id`. Add helper functions:

```rust
fn validate_booking_doc_type(value: &str) -> Result<(), ServiceError> {
    match value {
        "flight" | "train" | "public_transport" | "hotel" | "insurance" | "passport" | "visa" | "activity_ticket" | "other" => Ok(()),
        _ => Err(ServiceError::InvalidRequest("type is invalid")),
    }
}

fn validate_booking_doc_status(value: &str) -> Result<(), ServiceError> {
    match value {
        "draft" | "needs_action" | "booked" | "confirmed" | "paid" | "cancelled" | "expired" => Ok(()),
        _ => Err(ServiceError::InvalidRequest("status is invalid")),
    }
}

fn validate_booking_doc_visibility(value: &str) -> Result<(), ServiceError> {
    match value {
        "shared" | "sensitive" | "private" => Ok(()),
        _ => Err(ServiceError::InvalidRequest("visibility is invalid")),
    }
}

fn validate_booking_doc_title(value: &str) -> Result<(), ServiceError> {
    let trimmed = value.trim();
    if trimmed.is_empty() || trimmed.len() > 180 {
        return Err(ServiceError::InvalidRequest("title is invalid"));
    }
    Ok(())
}

fn validate_booking_doc_currency(value: &str) -> Result<(), ServiceError> {
    let trimmed = value.trim();
    if trimmed.len() != 3 || !trimmed.chars().all(|c| c.is_ascii_uppercase()) {
        return Err(ServiceError::InvalidRequest("currency is invalid"));
    }
    Ok(())
}

fn validate_booking_doc_url(value: &str) -> Result<(), ServiceError> {
    let trimmed = value.trim();
    if !(trimmed.starts_with("https://") || trimmed.starts_with("http://")) || trimmed.len() > 2048 {
        return Err(ServiceError::InvalidRequest("external link URL is invalid"));
    }
    Ok(())
}
```

Validation rules:
- create validates every required field and every provided optional field.
- patch validates only provided fields.
- `price_amount` cannot be negative.
- external link label cannot be empty and max length is 80.

- [ ] **Step 3: Run validation-focused tests**

Run: `cd backend && cargo test -p sagittarius-api domain::patches::`

Expected: PASS if existing and new unit tests compile. If there are no current unit tests in this module, `cargo test` still compiles validation code.

---

### Task 3: DB Models And Queries

**Files:**
- Modify: `backend/crates/sagittarius-api/src/db/models.rs`
- Modify: `backend/crates/sagittarius-api/src/db/queries.rs`

- [ ] **Step 1: Add models**

In `db/models.rs`, add:

```rust
#[derive(Debug, Clone, FromRow)]
pub struct BookingDocRecord {
    pub id: Uuid,
    pub trip_id: Uuid,
    pub r#type: String,
    pub title: String,
    pub status: String,
    pub visibility: String,
    pub owner_member_id: Option<Uuid>,
    pub provider_name: Option<String>,
    pub confirmation_code: Option<String>,
    pub starts_at: Option<OffsetDateTime>,
    pub ends_at: Option<OffsetDateTime>,
    pub timezone: Option<String>,
    pub price_minor: Option<i32>,
    pub currency: Option<String>,
    pub notes: Option<String>,
    pub created_by: Uuid,
    pub updated_at: OffsetDateTime,
    pub version: i64,
}

#[derive(Debug, Clone, FromRow)]
pub struct BookingDocExternalLinkRecord {
    pub id: Uuid,
    pub booking_doc_id: Uuid,
    pub label: String,
    pub url: String,
    pub provider: Option<String>,
    pub access_note: Option<String>,
    pub sort_order: i32,
}

pub struct NewBookingDoc<'a> {
    pub id: Uuid,
    pub trip_id: Uuid,
    pub r#type: &'a str,
    pub title: &'a str,
    pub status: &'a str,
    pub visibility: &'a str,
    pub owner_member_id: Option<Uuid>,
    pub provider_name: Option<&'a str>,
    pub confirmation_code: Option<&'a str>,
    pub starts_at: Option<OffsetDateTime>,
    pub ends_at: Option<OffsetDateTime>,
    pub timezone: Option<&'a str>,
    pub price_minor: Option<i32>,
    pub currency: Option<&'a str>,
    pub notes: Option<&'a str>,
    pub created_by: Uuid,
}
```

- [ ] **Step 2: Add list and lock queries**

In `db/queries.rs`, add:

```rust
pub async fn list_booking_docs(pool: &PgPool, trip_id: Uuid) -> Result<Vec<BookingDocRecord>, sqlx::Error>;
pub async fn list_booking_doc_links(pool: &PgPool, booking_ids: &[Uuid]) -> Result<Vec<BookingDocExternalLinkRecord>, sqlx::Error>;
pub async fn list_booking_doc_relation_ids(pool: &PgPool, table_name: &'static str, booking_ids: &[Uuid]) -> Result<Vec<(Uuid, Uuid)>, sqlx::Error>;
pub async fn lock_booking_doc(tx: &mut sqlx::Transaction<'_, sqlx::Postgres>, booking_id: Uuid) -> Result<Option<BookingDocRecord>, sqlx::Error>;
```

For relation ids, use explicit match on `table_name` to choose one of six SQL strings. Do not interpolate arbitrary table names.

- [ ] **Step 3: Add insert/update/delete queries**

Add:

```rust
pub async fn insert_booking_doc(tx: &mut sqlx::Transaction<'_, sqlx::Postgres>, input: NewBookingDoc<'_>) -> Result<BookingDocRecord, sqlx::Error>;
pub async fn update_booking_doc(tx: &mut sqlx::Transaction<'_, sqlx::Postgres>, booking_id: Uuid, patch: &PatchBookingDocRequest, version: i64) -> Result<Option<BookingDocRecord>, sqlx::Error>;
pub async fn soft_delete_booking_doc(tx: &mut sqlx::Transaction<'_, sqlx::Postgres>, booking_id: Uuid, version: i64) -> Result<Option<BookingDocRecord>, sqlx::Error>;
```

`update_booking_doc` uses `coalesce` for scalar fields and explicit nullable handling for fields wrapped in `Option<Option<T>>`.

- [ ] **Step 4: Add relation replacement queries**

Add:

```rust
pub async fn replace_booking_doc_external_links(tx: &mut sqlx::Transaction<'_, sqlx::Postgres>, booking_id: Uuid, links: &[CreateBookingDocExternalLinkRequest]) -> Result<(), sqlx::Error>;
pub async fn replace_booking_doc_member_relations(tx: &mut sqlx::Transaction<'_, sqlx::Postgres>, booking_id: Uuid, member_ids: &[Uuid]) -> Result<(), sqlx::Error>;
pub async fn replace_booking_doc_itinerary_relations(tx: &mut sqlx::Transaction<'_, sqlx::Postgres>, booking_id: Uuid, item_ids: &[Uuid]) -> Result<(), sqlx::Error>;
pub async fn replace_booking_doc_task_relations(tx: &mut sqlx::Transaction<'_, sqlx::Postgres>, booking_id: Uuid, task_ids: &[Uuid]) -> Result<(), sqlx::Error>;
pub async fn replace_booking_doc_expense_relations(tx: &mut sqlx::Transaction<'_, sqlx::Postgres>, booking_id: Uuid, expense_ids: &[Uuid]) -> Result<(), sqlx::Error>;
pub async fn replace_booking_doc_note_relations(tx: &mut sqlx::Transaction<'_, sqlx::Postgres>, booking_id: Uuid, note_ids: &[Uuid]) -> Result<(), sqlx::Error>;
```

Each function deletes current rows for the booking, then inserts the new ids.

- [ ] **Step 5: Add relation existence validation queries**

Add:

```rust
pub async fn trip_member_ids_exist(tx: &mut sqlx::Transaction<'_, sqlx::Postgres>, trip_id: Uuid, ids: &[Uuid]) -> Result<bool, sqlx::Error>;
pub async fn itinerary_item_ids_exist_for_trip(tx: &mut sqlx::Transaction<'_, sqlx::Postgres>, trip_id: Uuid, ids: &[Uuid]) -> Result<bool, sqlx::Error>;
pub async fn task_ids_exist_for_trip(tx: &mut sqlx::Transaction<'_, sqlx::Postgres>, trip_id: Uuid, ids: &[Uuid]) -> Result<bool, sqlx::Error>;
pub async fn expense_ids_exist_for_trip(tx: &mut sqlx::Transaction<'_, sqlx::Postgres>, trip_id: Uuid, ids: &[Uuid]) -> Result<bool, sqlx::Error>;
pub async fn stop_note_ids_exist_for_trip(tx: &mut sqlx::Transaction<'_, sqlx::Postgres>, trip_id: Uuid, ids: &[Uuid]) -> Result<bool, sqlx::Error>;
```

Each returns true when `ids.is_empty()` or the SQL count equals `ids.len()`.

- [ ] **Step 6: Compile DB layer**

Run: `cd backend && cargo check -p sagittarius-api`

Expected: FAIL only if the app service is not yet wired, not due to syntax errors in model/query definitions.

---

### Task 4: Backend App Service And API Routes

**Files:**
- Create: `backend/crates/sagittarius-api/src/app/bookings.rs`
- Modify: `backend/crates/sagittarius-api/src/app/mod.rs`
- Create: `backend/crates/sagittarius-api/src/api/bookings.rs`
- Modify: `backend/crates/sagittarius-api/src/api/mod.rs`
- Modify: `backend/crates/sagittarius-api/src/app/trips.rs`

- [ ] **Step 1: Create service module**

Create `app/bookings.rs` with public functions:

```rust
pub async fn create_booking_doc(pool: &PgPool, realtime: &RealtimeHub, trip_id: Uuid, session_token: &str, request: CreateBookingDocRequest) -> Result<BookingDocSummary, ServiceError>
pub async fn patch_booking_doc(pool: &PgPool, realtime: &RealtimeHub, trip_id: Uuid, booking_id: Uuid, session_token: &str, request: PatchBookingDocRequest) -> Result<BookingDocSummary, ServiceError>
pub async fn delete_booking_doc(pool: &PgPool, realtime: &RealtimeHub, trip_id: Uuid, booking_id: Uuid, session_token: &str) -> Result<BookingDocSummary, ServiceError>
pub async fn list_visible_booking_docs(pool: &PgPool, trip_id: Uuid, member_id: Uuid, role: TripRole) -> Result<Vec<BookingDocSummary>, ServiceError>
```

- [ ] **Step 2: Implement create service**

Create flow:
1. `request.validate()?`
2. hash session token
3. begin transaction
4. find active session in tx
5. require `Capability::EditBookings`
6. reject duplicate `clientMutationId`
7. validate all relation ids belong to trip
8. insert booking doc
9. replace all normalized child relations
10. assemble `BookingDocSummary`
11. insert realtime event `booking.created`
12. commit and publish

- [ ] **Step 3: Implement patch service**

Patch flow:
1. validate request
2. lock booking doc
3. ensure record belongs to path `trip_id`
4. require `EditBookings`
5. reject duplicate `clientMutationId`
6. compare `expectedVersion`
7. validate patched relation ids when present
8. update scalar fields with version + 1
9. replace only relation sets provided by patch
10. assemble summary
11. insert event `booking.updated`
12. commit and publish

On version conflict, return `ServiceError::VersionConflictWithLatest` with serialized latest `BookingDocSummary`.

- [ ] **Step 4: Implement delete service**

Delete flow:
1. lock booking doc
2. ensure trip id matches
3. require `EditBookings`
4. soft-delete with version + 1
5. assemble summary
6. insert event `booking.deleted`
7. commit and publish

- [ ] **Step 5: Implement visibility filtering**

Use this function in `app/bookings.rs`:

```rust
fn can_view_booking_doc(doc: &BookingDocRecord, member_id: Uuid, role: TripRole) -> bool {
    match doc.visibility.as_str() {
        "shared" => true,
        "sensitive" => matches!(role, TripRole::Owner | TripRole::Organizer)
            || doc.owner_member_id == Some(member_id)
            || doc.created_by == member_id,
        "private" => matches!(role, TripRole::Owner)
            || doc.owner_member_id == Some(member_id)
            || doc.created_by == member_id,
        _ => false,
    }
}
```

After assembling relation ids, also allow sensitive/private visibility when `traveler_ids` contains `member_id`.

- [ ] **Step 6: Wire app module**

In `app/mod.rs`, add:

```rust
pub mod bookings;
```

- [ ] **Step 7: Add API handlers**

Create `api/bookings.rs` with handlers equivalent to expenses:

```rust
pub async fn create_booking_doc(
    State(state): State<AppState>,
    Path(trip_id): Path<Uuid>,
    BearerToken(session_token): BearerToken,
    Json(request): Json<CreateBookingDocRequest>,
) -> Result<(StatusCode, Json<BookingDocSummary>), ServiceError>;

pub async fn patch_booking_doc(
    State(state): State<AppState>,
    Path((trip_id, booking_id)): Path<(Uuid, Uuid)>,
    BearerToken(session_token): BearerToken,
    Json(request): Json<PatchBookingDocRequest>,
) -> Result<Json<BookingDocSummary>, ServiceError>;

pub async fn delete_booking_doc(
    State(state): State<AppState>,
    Path((trip_id, booking_id)): Path<(Uuid, Uuid)>,
    BearerToken(session_token): BearerToken,
) -> Result<Json<BookingDocSummary>, ServiceError>;
```

- [ ] **Step 8: Register routes**

In `api/mod.rs`, add module `bookings` and routes:

```rust
.route("/trips/{trip_id}/bookings", post(bookings::create_booking_doc))
.route(
    "/trips/{trip_id}/bookings/{booking_id}",
    patch(bookings::patch_booking_doc).delete(bookings::delete_booking_doc),
)
```

- [ ] **Step 9: Include cockpit bookings**

In `app/trips.rs`, call `bookings::list_visible_booking_docs(pool, session_trip_id, session_member_id, session.role)` in the existing `tokio::try_join!`, then set `booking_docs` in `TripCockpit`.

- [ ] **Step 10: Compile backend**

Run: `cd backend && cargo check -p sagittarius-api`

Expected: PASS.

---

### Task 5: Backend Tests And Seed Data

**Files:**
- Modify: `backend/crates/sagittarius-api/src/domain/patches.rs`
- Modify: `backend/crates/sagittarius-api/src/bin/seed_e2e.rs`

- [ ] **Step 1: Add validation tests**

At the bottom of `domain/patches.rs`, add tests:

```rust
#[test]
fn booking_doc_create_rejects_invalid_url() {
    let request = CreateBookingDocRequest {
        client_mutation_id: "booking-create-test".to_string(),
        r#type: "flight".to_string(),
        title: "Flight".to_string(),
        status: "confirmed".to_string(),
        visibility: "shared".to_string(),
        owner_member_id: None,
        provider_name: None,
        confirmation_code: None,
        starts_at: None,
        ends_at: None,
        timezone: None,
        price_amount: None,
        currency: None,
        traveler_ids: vec![],
        external_links: vec![CreateBookingDocExternalLinkRequest {
            id: None,
            label: "Bad link".to_string(),
            url: "ftp://example.com/doc.pdf".to_string(),
            provider: None,
            access_note: None,
        }],
        related_itinerary_item_ids: vec![],
        related_task_ids: vec![],
        related_expense_ids: vec![],
        note_ids: vec![],
        notes: None,
    };

    assert!(request.validate().is_err());
}
```

Add similar tests for invalid `type`, invalid `currency`, and negative `priceAmount`.

- [ ] **Step 2: Seed e2e booking docs**

In `seed_e2e.rs`, after existing trip/member/itinerary/expense/task seed records, insert:
- a confirmed flight with two external links and three travelers
- a needs-action passport with one traveler, linked task, and linked itinerary item
- a paid activity ticket linked to an expense

Use normalized relation inserts matching migration table names.

- [ ] **Step 3: Run backend tests**

Run: `cd backend && cargo test -p sagittarius-api`

Expected: PASS.

---

### Task 6: Frontend API Client Contract

**Files:**
- Modify: `frontend/src/trip/api-routes.ts`
- Modify: `frontend/src/trip/api-client.ts`
- Modify: `frontend/src/trip/api-client.test.ts`

- [ ] **Step 1: Add route helpers**

In `api-routes.ts`, add:

```ts
bookings: (tripId: string) => `/api/v1/trips/${encodeURIComponent(tripId)}/bookings`,
booking: (tripId: string, bookingId: string) => `/api/v1/trips/${encodeURIComponent(tripId)}/bookings/${encodeURIComponent(bookingId)}`,
```

- [ ] **Step 2: Add API request types**

In `api-client.ts`, add:

```ts
export interface CreateBookingDocApiRequest extends BookingDocInputLike {
  clientMutationId: string;
}

export interface PatchBookingDocApiRequest {
  clientMutationId: string;
  expectedVersion: number;
  patch: Partial<BookingDocInputLike>;
}

interface BookingDocInputLike {
  type: BookingDoc["type"];
  title: string;
  status: BookingDoc["status"];
  visibility: BookingDoc["visibility"];
  ownerMemberId?: string | null;
  providerName?: string | null;
  confirmationCode?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
  timezone?: string | null;
  priceAmount?: number | null;
  currency?: string | null;
  travelerIds: string[];
  externalLinks: BookingDoc["externalLinks"];
  relatedItineraryItemIds: string[];
  relatedTaskIds: string[];
  relatedExpenseIds: string[];
  noteIds: string[];
  notes?: string | null;
}
```

- [ ] **Step 3: Extend `TripApiClient`**

Add:

```ts
createBookingDoc(tripId: string, sessionToken: string, request: CreateBookingDocApiRequest): Promise<BookingDoc>;
patchBookingDoc(tripId: string, bookingId: string, sessionToken: string, request: PatchBookingDocApiRequest): Promise<BookingDoc>;
deleteBookingDoc(tripId: string, bookingId: string, sessionToken: string): Promise<BookingDoc>;
```

- [ ] **Step 4: Implement methods**

In `createTripApiClient`, add methods that call `tripApiRoutes.bookings` and `tripApiRoutes.booking`.

- [ ] **Step 5: Add API client tests**

In `api-client.test.ts`, add tests that assert:
- `createBookingDoc` posts to `/api/v1/trips/:tripId/bookings`
- `patchBookingDoc` patches `/api/v1/trips/:tripId/bookings/:bookingId`
- `deleteBookingDoc` deletes `/api/v1/trips/:tripId/bookings/:bookingId`
- `mapCockpitResponse` keeps `bookingDocs` when present and defaults to `[]`

- [ ] **Step 6: Run frontend API client tests**

Run: `cd frontend && bun run test src/trip/api-client.test.ts`

Expected: PASS.

---

### Task 7: Frontend API-Mode Booking Mutations

**Files:**
- Modify: `frontend/src/app/SagittariusApp.tsx`
- Modify: `frontend/src/components/SagittariusApp.test.tsx`

- [ ] **Step 1: Update edit capability**

Change `canEditBookings` from local-only to:

```ts
const canEditBookings = canEdit || canEditExpenses;
```

This matches current frontend role capability behavior until backend exposes explicit capability flags.

- [ ] **Step 2: Add API create flow**

In `createBookingDoc`, before local `bookingDoc` construction:

```ts
if (isApiMode && resolvedApiClient && participantSession) {
  const created = await resolvedApiClient.createBookingDoc(trip.id, participantSession.sessionToken, {
    clientMutationId: nextClientMutationId("booking-create"),
    ...input,
    title,
  });
  setTripState((current) => ({
    ...current,
    trip: { ...current.trip, bookingDocs: [...(current.trip.bookingDocs ?? []), created] },
  }));
  return;
}
```

- [ ] **Step 3: Add API update flow**

In `updateBookingDoc`, find existing booking. In API mode call:

```ts
const updated = await resolvedApiClient.patchBookingDoc(trip.id, bookingDocId, participantSession.sessionToken, {
  clientMutationId: nextClientMutationId("booking-patch"),
  expectedVersion: existing.version,
  patch: {
    ...input,
    title: input.title.trim(),
  },
});
setTripState((current) => ({
  ...current,
  trip: {
    ...current.trip,
    bookingDocs: (current.trip.bookingDocs ?? []).map((candidate) => candidate.id === bookingDocId ? updated : candidate),
  },
}));
return;
```

- [ ] **Step 4: Add API delete flow**

In `deleteBookingDoc`, in API mode call:

```ts
await resolvedApiClient.deleteBookingDoc(trip.id, bookingDocId, participantSession.sessionToken);
setTripState((current) => ({
  ...current,
  trip: { ...current.trip, bookingDocs: (current.trip.bookingDocs ?? []).filter((bookingDoc) => bookingDoc.id !== bookingDocId) },
}));
return;
```

- [ ] **Step 5: Add app tests**

In `SagittariusApp.test.tsx`, update existing API read-only booking test to expect Add/Edit/Delete for owner API mode. Add tests:
- create booking calls `apiClient.createBookingDoc` and renders returned item
- update booking calls `apiClient.patchBookingDoc`
- delete booking calls `apiClient.deleteBookingDoc` and removes item
- viewer API mode still hides Add/Edit/Delete

- [ ] **Step 6: Run app tests**

Run: `cd frontend && bun run test src/components/SagittariusApp.test.tsx -t "booking"`

Expected: PASS.

---

### Task 8: Contract And Full Verification

**Files:**
- Modify as needed from prior tasks only.

- [ ] **Step 1: Run focused frontend tests**

Run:

```bash
cd frontend
bun run test src/trip/api-client.test.ts src/components/BookingsDocsPage.test.tsx src/components/SagittariusApp.test.tsx -t "booking|Bookings"
```

Expected: PASS.

- [ ] **Step 2: Run frontend checks**

Run:

```bash
cd frontend
bun run lint
bun run typecheck
bun run test
```

Expected: PASS.

- [ ] **Step 3: Run backend checks**

Run:

```bash
cd backend
cargo fmt --all -- --check
cargo test -p sagittarius-api
```

Expected: PASS.

- [ ] **Step 4: Run real API smoke where available**

Run:

```bash
cd frontend
bun run test:e2e:local
```

Expected: PASS if local PostgreSQL/backend prerequisites are available. If blocked, capture the missing service/env reason and continue with unit/API contract evidence.

- [ ] **Step 5: Browser QA**

Start frontend dev server and backend if local API prerequisites are available. Verify:
- owner API-mode opens `/trips/:tripId/bookings`
- create/edit/delete booking works after reload
- viewer API-mode cannot see Add/Edit/Delete
- desktop 1440 and mobile 390 have no page-level horizontal overflow
- console/page errors are empty

- [ ] **Step 6: Commit implementation**

Run:

```bash
git status --short
git add backend frontend
git commit -m "Add bookings docs backend integration"
```

Expected: one implementation commit after all feasible verification.
