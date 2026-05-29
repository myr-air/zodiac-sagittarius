# Account Trip Ownership Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let authenticated accounts create trips, link existing temp/member access to an account, transfer the single required trip owner, and read account trip history/stats without third-party providers.

**Architecture:** Extend the current provider-free account slice with account-authenticated trip commands. Keep legacy member-session trip access working, but make account-owned workflows persist through `trip_members.user_id` and `account_audit_events`. Owner transfer is enforced in a transaction plus existing DB invariants: one owner per trip, owner cannot be disabled, and `trips.owner_member_id` must point at the current owner member.

**Tech Stack:** Rust 2024, Axum, SQLx/Postgres migrations, existing Argon2 trip/member password hashing, existing account bearer session auth, contract tests with `sqlx::test`, `cargo llvm-cov`.

---

## File Structure

- Modify `backend/migrations/0002_account_identity.sql`
  - Add account trip list/stat indexes if needed:
    - `account_audit_events_actor_user_created_idx`
    - `trip_members_trip_user_idx`
  - Add a trigger that guarantees `trips.owner_member_id` points to the member whose role is `owner`.
- Modify `backend/crates/sagittarius-api/src/domain/types.rs`
  - Add DTOs:
    - `AccountTripCreateResponse`
    - `AccountTripSummary`
    - `AccountTripStats`
    - `AccountMemberClaimResponse`
    - `OwnerTransferResponse`
- Modify `backend/crates/sagittarius-api/src/db/models.rs`
  - Add records and insert structs for account trip creation, account trip list rows, stats rows, and audit events.
- Modify `backend/crates/sagittarius-api/src/db/account_queries.rs`
  - Add account-auth helpers that touch account-owned trip/member state.
- Modify `backend/crates/sagittarius-api/src/app/account.rs`
  - Add service functions:
    - `create_account_trip`
    - `claim_member_for_account`
    - `transfer_trip_owner`
    - `list_account_trips`
    - `load_account_stats`
- Modify `backend/crates/sagittarius-api/src/api/account.rs`
  - Add request structs and route handlers using `BearerToken`.
- Modify `backend/crates/sagittarius-api/src/api/mod.rs`
  - Add routes under `/v1/account/...`.
- Create `backend/crates/sagittarius-api/tests/account_trip_contract.rs`
  - Contract tests for all new behavior and error handlers.
- Update `backend/crates/sagittarius-api/tests/account_schema_contract.rs`
  - Schema tests for owner pointer invariant and indexes.

## Routes

- `POST /v1/account/trips`
  - Bearer account session required.
  - Request:
    ```json
    {
      "name": "Osaka Food Sprint",
      "destinationLabel": "Osaka",
      "startDate": "2026-11-10",
      "endDate": "2026-11-14",
      "ownerDisplayName": "Aom",
      "joinId": "OSAKA-2026",
      "joinPassword": "takoyaki-run"
    }
    ```
  - Response contains created `trip`, owner `memberSession`, and `ownerMemberId`.
- `POST /v1/account/trips/{trip_id}/members/{member_id}/claim`
  - Bearer account session required.
  - Request:
    ```json
    { "memberSessionToken": "existing-temp-member-session-token" }
    ```
  - Links that active member to the authenticated user after proving the member session.
- `POST /v1/account/trips/{trip_id}/owner-transfer`
  - Bearer account session required.
  - Request:
    ```json
    { "targetMemberId": "uuid-of-account-linked-member" }
    ```
  - Current account must be the active owner. Target must be active and linked to an account. Old owner becomes organizer.
- `GET /v1/account/trips`
  - Bearer account session required.
  - Returns trips where `trip_members.user_id = account user_id`.
- `GET /v1/account/stats`
  - Bearer account session required.
  - Returns trip counts and recent account audit counts.

## Task 1: Schema Invariants And Contract Tests

**Files:**
- Modify: `backend/migrations/0002_account_identity.sql`
- Modify: `backend/crates/sagittarius-api/tests/account_schema_contract.rs`

- [ ] **Step 1: Write failing schema tests**

Add tests to `account_schema_contract.rs`:

```rust
#[sqlx::test(migrations = "../../migrations")]
async fn trip_owner_pointer_must_reference_owner_role(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;

    let result = sqlx::query(
        "update trips
         set owner_member_id = $1::uuid
         where id = $2::uuid",
    )
    .bind(support::ORGANIZER_ID)
    .bind(support::TRIP_ID)
    .execute(&pool)
    .await;

    assert!(
        result.is_err(),
        "trip accepted owner_member_id that does not have role owner"
    );
}

#[sqlx::test(migrations = "../../migrations")]
async fn account_trip_indexes_exist(pool: sqlx::PgPool) {
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
        "trip_members_trip_user_idx",
        "account_audit_events_actor_user_created_idx",
    ] {
        assert!(
            index_names.contains(&index_name.to_string()),
            "missing index {index_name}"
        );
    }
}
```

- [ ] **Step 2: Run test to verify RED**

Run:

```bash
DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5432/sagittarius_test rtk cargo test -p sagittarius-api --test account_schema_contract trip_owner_pointer_must_reference_owner_role account_trip_indexes_exist
```

Expected: tests fail because the trigger/indexes do not exist.

- [ ] **Step 3: Add schema objects**

Patch `0002_account_identity.sql`:

```sql
CREATE INDEX trip_members_trip_user_idx
  ON trip_members (trip_id, user_id)
  WHERE user_id IS NOT NULL;

CREATE INDEX account_audit_events_actor_user_created_idx
  ON account_audit_events (actor_user_id, created_at DESC)
  WHERE actor_user_id IS NOT NULL;

CREATE FUNCTION enforce_trip_owner_pointer()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM trip_members
    WHERE id = NEW.owner_member_id
      AND trip_id = NEW.id
      AND role = 'owner'
      AND access_status = 'active'
  ) THEN
    RAISE EXCEPTION 'trip owner_member_id must reference the active owner member';
  END IF;

  RETURN NEW;
END;
$$;

CREATE CONSTRAINT TRIGGER trips_owner_member_role_check
AFTER INSERT OR UPDATE OF owner_member_id ON trips
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION enforce_trip_owner_pointer();
```

- [ ] **Step 4: Run schema tests**

Run:

```bash
DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5432/sagittarius_test rtk cargo test -p sagittarius-api --test account_schema_contract
```

Expected: all schema tests pass.

- [ ] **Step 5: Commit**

```bash
rtk git add backend/migrations/0002_account_identity.sql backend/crates/sagittarius-api/tests/account_schema_contract.rs
rtk git commit -m "test: enforce account trip owner schema"
```

## Task 2: Account Trip DTOs And Serialization

**Files:**
- Modify: `backend/crates/sagittarius-api/src/domain/types.rs`

- [ ] **Step 1: Add failing DTO serialization test**

In `domain/types.rs` test module, extend `account_dtos_serialize_with_camel_case_fields`:

```rust
let trip_id = Uuid::parse_str("018f4e80-0000-7000-a000-000000000010").unwrap();
let member_id = Uuid::parse_str("018f4e80-0000-7000-a000-000000000011").unwrap();
let trip_summary = AccountTripSummary {
    id: trip_id,
    name: "Osaka Food Sprint".to_string(),
    destination_label: "Osaka".to_string(),
    start_date: Date::from_calendar_date(2026, time::Month::November, 10).unwrap(),
    end_date: Date::from_calendar_date(2026, time::Month::November, 14).unwrap(),
    role: TripRole::Owner,
    member_id,
    owner_member_id: member_id,
    joined_at: "2026-05-30T00:00:00Z".to_string(),
    is_owner: true,
};
let value = serde_json::to_value(trip_summary).unwrap();
assert_eq!(value["destinationLabel"], "Osaka");
assert_eq!(value["ownerMemberId"], member_id.to_string());
assert_eq!(value["isOwner"], true);

let stats = AccountTripStats {
    trips_total: 3,
    trips_owned: 1,
    active_trips: 2,
    temp_claims_completed: 4,
};
let value = serde_json::to_value(stats).unwrap();
assert_eq!(value["tripsTotal"], 3);
assert_eq!(value["tempClaimsCompleted"], 4);
```

- [ ] **Step 2: Run RED**

Run:

```bash
rtk cargo test -p sagittarius-api domain::types::account_type_tests::account_dtos_serialize_with_camel_case_fields
```

Expected: compile fails because DTOs are missing.

- [ ] **Step 3: Add DTOs**

Add to `domain/types.rs`:

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AccountTripCreateResponse {
    pub trip: TripSummary,
    pub owner_member_id: Uuid,
    pub member_session: MemberSession,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AccountTripSummary {
    pub id: Uuid,
    pub name: String,
    pub destination_label: String,
    pub start_date: Date,
    pub end_date: Date,
    pub role: TripRole,
    pub member_id: Uuid,
    pub owner_member_id: Uuid,
    pub joined_at: String,
    pub is_owner: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AccountTripStats {
    pub trips_total: i64,
    pub trips_owned: i64,
    pub active_trips: i64,
    pub temp_claims_completed: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AccountMemberClaimResponse {
    pub trip_id: Uuid,
    pub member_id: Uuid,
    pub user_id: Uuid,
    pub role: TripRole,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OwnerTransferResponse {
    pub trip_id: Uuid,
    pub previous_owner_member_id: Uuid,
    pub new_owner_member_id: Uuid,
}
```

- [ ] **Step 4: Run DTO test**

Run:

```bash
rtk cargo test -p sagittarius-api domain::types::account_type_tests::account_dtos_serialize_with_camel_case_fields
```

Expected: pass.

- [ ] **Step 5: Commit**

```bash
rtk git add backend/crates/sagittarius-api/src/domain/types.rs
rtk git commit -m "feat: add account trip dto contracts"
```

## Task 3: Account Trip Creation

**Files:**
- Create: `backend/crates/sagittarius-api/tests/account_trip_contract.rs`
- Modify: `backend/crates/sagittarius-api/src/db/models.rs`
- Modify: `backend/crates/sagittarius-api/src/db/account_queries.rs`
- Modify: `backend/crates/sagittarius-api/src/app/account.rs`
- Modify: `backend/crates/sagittarius-api/src/api/account.rs`
- Modify: `backend/crates/sagittarius-api/src/api/mod.rs`

- [ ] **Step 1: Write failing contract tests**

Create `account_trip_contract.rs` with helpers copied from `account_auth_contract.rs` for `post_json`, `post_with_auth`, `response_json`, and `login_account`.

Add:

```rust
#[sqlx::test(migrations = "../../migrations")]
async fn account_user_can_create_trip_and_becomes_owner(pool: sqlx::PgPool) {
    let session = login_account(&pool, "owner@example.com", false, "").await;
    let token = session["sessionToken"].as_str().unwrap();
    let user_id = Uuid::parse_str(session["userId"].as_str().unwrap()).unwrap();

    let (status, body) = response_json(
        post_json_with_auth(
            support::app(pool.clone()),
            "/v1/account/trips",
            Some(&format!("Bearer {token}")),
            json!({
                "name": "Osaka Food Sprint",
                "destinationLabel": "Osaka",
                "startDate": "2026-11-10",
                "endDate": "2026-11-14",
                "ownerDisplayName": "Aom",
                "joinId": "OSAKA-2026",
                "joinPassword": "takoyaki-run"
            }),
        )
        .await,
    )
    .await;

    assert_eq!(status, StatusCode::OK);
    let trip_id = Uuid::parse_str(body["trip"]["id"].as_str().unwrap()).unwrap();
    let owner_member_id = Uuid::parse_str(body["ownerMemberId"].as_str().unwrap()).unwrap();
    assert_eq!(body["trip"]["ownerMemberId"], owner_member_id.to_string());
    assert_eq!(body["memberSession"]["tripId"], trip_id.to_string());
    assert_eq!(body["memberSession"]["memberId"], owner_member_id.to_string());

    let owner: (Uuid, String, String) = sqlx::query_as(
        "select user_id, role, access_status
         from trip_members
         where id = $1",
    )
    .bind(owner_member_id)
    .fetch_one(&pool)
    .await
    .unwrap();
    assert_eq!(owner.0, user_id);
    assert_eq!(owner.1, "owner");
    assert_eq!(owner.2, "active");

    let audit_count: i64 = sqlx::query_scalar(
        "select count(*)
         from account_audit_events
         where actor_user_id = $1 and trip_id = $2 and event_type = 'trip.created'",
    )
    .bind(user_id)
    .bind(trip_id)
    .fetch_one(&pool)
    .await
    .unwrap();
    assert_eq!(audit_count, 1);
}

#[sqlx::test(migrations = "../../migrations")]
async fn account_trip_creation_validates_dates_and_auth(pool: sqlx::PgPool) {
    let missing_auth = response_json(
        post_json_with_auth(
            support::app(pool.clone()),
            "/v1/account/trips",
            None,
            json!({
                "name": "Osaka",
                "destinationLabel": "Osaka",
                "startDate": "2026-11-14",
                "endDate": "2026-11-10",
                "ownerDisplayName": "Aom",
                "joinId": "OSAKA-2026",
                "joinPassword": "takoyaki-run"
            }),
        )
        .await,
    )
    .await;
    assert_eq!(missing_auth.0, StatusCode::UNAUTHORIZED);

    let session = login_account(&pool, "owner@example.com", false, "").await;
    let token = session["sessionToken"].as_str().unwrap();
    let invalid_dates = response_json(
        post_json_with_auth(
            support::app(pool),
            "/v1/account/trips",
            Some(&format!("Bearer {token}")),
            json!({
                "name": "Osaka",
                "destinationLabel": "Osaka",
                "startDate": "2026-11-14",
                "endDate": "2026-11-10",
                "ownerDisplayName": "Aom",
                "joinId": "OSAKA-2026",
                "joinPassword": "takoyaki-run"
            }),
        )
        .await,
    )
    .await;
    assert_eq!(invalid_dates.0, StatusCode::BAD_REQUEST);
    assert_eq!(invalid_dates.1["code"], "invalid_request");
}
```

- [ ] **Step 2: Run RED**

Run:

```bash
DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5432/sagittarius_test rtk cargo test -p sagittarius-api --test account_trip_contract account_user_can_create_trip_and_becomes_owner account_trip_creation_validates_dates_and_auth
```

Expected: compile/404 failure because route and service are missing.

- [ ] **Step 3: Implement data layer**

Add model structs:

```rust
pub struct NewAccountTrip<'a> {
    pub id: Uuid,
    pub name: &'a str,
    pub destination_label: &'a str,
    pub start_date: time::Date,
    pub end_date: time::Date,
    pub join_id: &'a str,
    pub join_password_hash: &'a str,
    pub owner_member_id: Uuid,
    pub active_plan_variant_id: Uuid,
}

pub struct NewTripMember<'a> {
    pub id: Uuid,
    pub trip_id: Uuid,
    pub display_name: &'a str,
    pub role: TripRole,
    pub color: &'a str,
    pub user_id: Option<Uuid>,
    pub claimed_at: Option<OffsetDateTime>,
}

pub struct NewAccountAuditEvent<'a> {
    pub id: Uuid,
    pub user_id: Option<Uuid>,
    pub trip_id: Option<Uuid>,
    pub actor_user_id: Option<Uuid>,
    pub actor_member_id: Option<Uuid>,
    pub event_type: &'a str,
    pub payload: serde_json::Value,
}
```

Add SQL helpers that insert trip with deferred FKs, owner member, default active plan variant, member session, and audit event in one transaction.

- [ ] **Step 4: Implement service and API route**

In `api/mod.rs` add:

```rust
.route("/v1/account/trips", post(account::create_trip).get(account::list_trips))
```

In `api/account.rs` add request:

```rust
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AccountTripCreateRequest {
    pub name: String,
    pub destination_label: String,
    pub start_date: time::Date,
    pub end_date: time::Date,
    pub owner_display_name: String,
    pub join_id: String,
    pub join_password: String,
}
```

Handler:

```rust
pub async fn create_trip(
    State(state): State<AppState>,
    BearerToken(session_token): BearerToken,
    request: Result<Json<AccountTripCreateRequest>, JsonRejection>,
) -> Result<Json<AccountTripCreateResponse>, ServiceError> {
    let Json(request) =
        request.map_err(|_| ServiceError::InvalidRequest("json payload is invalid"))?;
    let response = app::account::create_account_trip(&state.pool, &session_token, request).await?;
    Ok(Json(response))
}
```

In service, validate:
- trimmed name, destination, owner display name are non-empty and <= 120 chars
- `start_date <= end_date`
- normalized `join_id` is non-empty and <= 32 chars
- `join_password.trim().len() >= 8`

- [ ] **Step 5: Run account trip tests**

Run:

```bash
DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5432/sagittarius_test rtk cargo test -p sagittarius-api --test account_trip_contract
```

Expected: task tests pass.

- [ ] **Step 6: Commit**

```bash
rtk git add backend/crates/sagittarius-api/tests/account_trip_contract.rs backend/crates/sagittarius-api/src/db/models.rs backend/crates/sagittarius-api/src/db/account_queries.rs backend/crates/sagittarius-api/src/app/account.rs backend/crates/sagittarius-api/src/api/account.rs backend/crates/sagittarius-api/src/api/mod.rs
rtk git commit -m "feat: create account-owned trips"
```

## Task 4: Claim Existing Temp Member Into Account

**Files:**
- Modify: `backend/crates/sagittarius-api/tests/account_trip_contract.rs`
- Modify: `backend/crates/sagittarius-api/src/db/account_queries.rs`
- Modify: `backend/crates/sagittarius-api/src/app/account.rs`
- Modify: `backend/crates/sagittarius-api/src/api/account.rs`
- Modify: `backend/crates/sagittarius-api/src/api/mod.rs`

- [ ] **Step 1: Write failing tests**

Add:

```rust
#[sqlx::test(migrations = "../../migrations")]
async fn account_claims_existing_temp_member_after_member_session_proof(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    let member_session = claim_legacy_member(&pool, support::TRAVELER_ID, "traveler-pin").await;
    let account_session = login_account(&pool, "traveler@example.com", false, "").await;
    let token = account_session["sessionToken"].as_str().unwrap();
    let user_id = Uuid::parse_str(account_session["userId"].as_str().unwrap()).unwrap();

    let (status, body) = response_json(
        post_json_with_auth(
            support::app(pool.clone()),
            &format!("/v1/account/trips/{}/members/{}/claim", support::TRIP_ID, support::TRAVELER_ID),
            Some(&format!("Bearer {token}")),
            json!({"memberSessionToken": member_session["sessionToken"]}),
        )
        .await,
    )
    .await;

    assert_eq!(status, StatusCode::OK);
    assert_eq!(body["userId"], user_id.to_string());
    assert_eq!(body["memberId"], support::TRAVELER_ID);

    let linked_user_id: Uuid = sqlx::query_scalar(
        "select user_id
         from trip_members
         where id = $1::uuid",
    )
    .bind(support::TRAVELER_ID)
    .fetch_one(&pool)
    .await
    .unwrap();
    assert_eq!(linked_user_id, user_id);
}

#[sqlx::test(migrations = "../../migrations")]
async fn account_claim_rejects_wrong_session_and_already_linked_member(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    let account_session = login_account(&pool, "traveler@example.com", false, "").await;
    let token = account_session["sessionToken"].as_str().unwrap();

    let wrong_session = response_json(
        post_json_with_auth(
            support::app(pool.clone()),
            &format!("/v1/account/trips/{}/members/{}/claim", support::TRIP_ID, support::TRAVELER_ID),
            Some(&format!("Bearer {token}")),
            json!({"memberSessionToken": "not-a-member-session"}),
        )
        .await,
    )
    .await;
    assert_eq!(wrong_session.0, StatusCode::UNAUTHORIZED);

    sqlx::query(
        "update trip_members
         set user_id = gen_random_uuid()
         where id = $1::uuid",
    )
    .bind(support::TRAVELER_ID)
    .execute(&pool)
    .await
    .unwrap();

    let already_linked = response_json(
        post_json_with_auth(
            support::app(pool),
            &format!("/v1/account/trips/{}/members/{}/claim", support::TRIP_ID, support::TRAVELER_ID),
            Some(&format!("Bearer {token}")),
            json!({"memberSessionToken": "not-a-member-session"}),
        )
        .await,
    )
    .await;
    assert_eq!(already_linked.0, StatusCode::CONFLICT);
    assert_eq!(already_linked.1["code"], "identity_already_linked");
}
```

- [ ] **Step 2: Run RED**

Run:

```bash
DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5432/sagittarius_test rtk cargo test -p sagittarius-api --test account_trip_contract account_claims_existing_temp_member_after_member_session_proof account_claim_rejects_wrong_session_and_already_linked_member
```

Expected: route missing.

- [ ] **Step 3: Implement service**

Rules:
- Authenticate account bearer token to `user_id`.
- Hash supplied `member_session_token` using existing `app::auth::hash_session_token`.
- Use `db::queries::find_active_member_session_in_tx` to prove session belongs to `{trip_id, member_id}`.
- Lock member row.
- If disabled -> `Forbidden`.
- If `user_id` already set and different/same -> `IdentityAlreadyLinked`.
- Set `trip_members.user_id = account user_id`, `claimed_at = coalesce(claimed_at, now())`, `updated_at = now()`.
- Insert `account_audit_events` with `event_type = 'member.claimed_account'`.

- [ ] **Step 4: Add API route**

Route:

```rust
.route(
    "/v1/account/trips/{trip_id}/members/{member_id}/claim",
    post(account::claim_member_for_account),
)
```

Request:

```rust
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AccountMemberClaimRequest {
    pub member_session_token: String,
}
```

- [ ] **Step 5: Run account trip tests**

Run:

```bash
DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5432/sagittarius_test rtk cargo test -p sagittarius-api --test account_trip_contract
```

Expected: pass.

- [ ] **Step 6: Commit**

```bash
rtk git add backend/crates/sagittarius-api/tests/account_trip_contract.rs backend/crates/sagittarius-api/src/db/account_queries.rs backend/crates/sagittarius-api/src/app/account.rs backend/crates/sagittarius-api/src/api/account.rs backend/crates/sagittarius-api/src/api/mod.rs
rtk git commit -m "feat: claim trip members into accounts"
```

## Task 5: Owner Transfer

**Files:**
- Modify: `backend/crates/sagittarius-api/tests/account_trip_contract.rs`
- Modify: `backend/crates/sagittarius-api/src/db/account_queries.rs`
- Modify: `backend/crates/sagittarius-api/src/app/account.rs`
- Modify: `backend/crates/sagittarius-api/src/api/account.rs`
- Modify: `backend/crates/sagittarius-api/src/api/mod.rs`

- [ ] **Step 1: Write failing tests**

Add:

```rust
#[sqlx::test(migrations = "../../migrations")]
async fn owner_can_transfer_ownership_to_account_linked_member(pool: sqlx::PgPool) {
    let owner = login_account(&pool, "owner@example.com", false, "").await;
    let owner_token = owner["sessionToken"].as_str().unwrap();
    let created = create_trip_for_account(&pool, owner_token).await;
    let trip_id = Uuid::parse_str(created["trip"]["id"].as_str().unwrap()).unwrap();
    let old_owner_member_id = Uuid::parse_str(created["ownerMemberId"].as_str().unwrap()).unwrap();

    let target = login_account(&pool, "target@example.com", false, "").await;
    let target_user_id = Uuid::parse_str(target["userId"].as_str().unwrap()).unwrap();
    let target_member_id = insert_linked_member(&pool, trip_id, target_user_id, "Beam").await;

    let (status, body) = response_json(
        post_json_with_auth(
            support::app(pool.clone()),
            &format!("/v1/account/trips/{trip_id}/owner-transfer"),
            Some(&format!("Bearer {owner_token}")),
            json!({"targetMemberId": target_member_id}),
        )
        .await,
    )
    .await;

    assert_eq!(status, StatusCode::OK);
    assert_eq!(body["previousOwnerMemberId"], old_owner_member_id.to_string());
    assert_eq!(body["newOwnerMemberId"], target_member_id.to_string());

    let roles: Vec<(Uuid, String)> = sqlx::query_as(
        "select id, role
         from trip_members
         where trip_id = $1
         order by id",
    )
    .bind(trip_id)
    .fetch_all(&pool)
    .await
    .unwrap();
    assert!(roles.iter().any(|(id, role)| *id == old_owner_member_id && role == "organizer"));
    assert!(roles.iter().any(|(id, role)| *id == target_member_id && role == "owner"));

    let owner_count: i64 = sqlx::query_scalar(
        "select count(*)
         from trip_members
         where trip_id = $1 and role = 'owner'",
    )
    .bind(trip_id)
    .fetch_one(&pool)
    .await
    .unwrap();
    assert_eq!(owner_count, 1);
}

#[sqlx::test(migrations = "../../migrations")]
async fn owner_transfer_requires_current_owner_and_account_target(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    let non_owner = login_account(&pool, "traveler@example.com", false, "").await;
    let non_owner_token = non_owner["sessionToken"].as_str().unwrap();

    let response = response_json(
        post_json_with_auth(
            support::app(pool.clone()),
            &format!("/v1/account/trips/{}/owner-transfer", support::TRIP_ID),
            Some(&format!("Bearer {non_owner_token}")),
            json!({"targetMemberId": support::TRAVELER_ID}),
        )
        .await,
    )
    .await;
    assert_eq!(response.0, StatusCode::FORBIDDEN);

    let owner = login_account(&pool, "owner@example.com", false, "").await;
    let owner_token = owner["sessionToken"].as_str().unwrap();
    sqlx::query(
        "update trip_members
         set user_id = $1
         where id = $2::uuid",
    )
    .bind(Uuid::parse_str(owner["userId"].as_str().unwrap()).unwrap())
    .bind(support::OWNER_ID)
    .execute(&pool)
    .await
    .unwrap();

    let unlinked_target = response_json(
        post_json_with_auth(
            support::app(pool),
            &format!("/v1/account/trips/{}/owner-transfer", support::TRIP_ID),
            Some(&format!("Bearer {owner_token}")),
            json!({"targetMemberId": support::TRAVELER_ID}),
        )
        .await,
    )
    .await;
    assert_eq!(unlinked_target.0, StatusCode::CONFLICT);
    assert_eq!(unlinked_target.1["code"], "owner_transfer_invalid");
}
```

- [ ] **Step 2: Run RED**

Run:

```bash
DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5432/sagittarius_test rtk cargo test -p sagittarius-api --test account_trip_contract owner_can_transfer_ownership_to_account_linked_member owner_transfer_requires_current_owner_and_account_target
```

Expected: route missing.

- [ ] **Step 3: Implement transfer**

Use a transaction:
- Authenticate `user_id`.
- Lock current owner row by `trip_id` and `role='owner'`.
- Require current owner row has `user_id = authenticated user_id`.
- Lock target member row.
- Require target active and `target.user_id IS NOT NULL`.
- If target equals current owner, return current state with no update.
- Update old owner role to `organizer`.
- Update target role to `owner`.
- Update `trips.owner_member_id = target_member_id`.
- Insert `account_audit_events` with `event_type = 'owner.transferred'`.
- Commit. Existing unique index and owner pointer trigger must protect exactly one owner.

- [ ] **Step 4: Add route and handler**

Route:

```rust
.route(
    "/v1/account/trips/{trip_id}/owner-transfer",
    post(account::transfer_trip_owner),
)
```

Request:

```rust
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OwnerTransferRequest {
    pub target_member_id: Uuid,
}
```

- [ ] **Step 5: Run account trip tests**

Run:

```bash
DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5432/sagittarius_test rtk cargo test -p sagittarius-api --test account_trip_contract
```

Expected: pass.

- [ ] **Step 6: Commit**

```bash
rtk git add backend/crates/sagittarius-api/tests/account_trip_contract.rs backend/crates/sagittarius-api/src/db/account_queries.rs backend/crates/sagittarius-api/src/app/account.rs backend/crates/sagittarius-api/src/api/account.rs backend/crates/sagittarius-api/src/api/mod.rs
rtk git commit -m "feat: transfer account trip ownership"
```

## Task 6: Account Trip History And Stats

**Files:**
- Modify: `backend/crates/sagittarius-api/tests/account_trip_contract.rs`
- Modify: `backend/crates/sagittarius-api/src/db/models.rs`
- Modify: `backend/crates/sagittarius-api/src/db/account_queries.rs`
- Modify: `backend/crates/sagittarius-api/src/app/account.rs`
- Modify: `backend/crates/sagittarius-api/src/api/account.rs`
- Modify: `backend/crates/sagittarius-api/src/api/mod.rs`

- [ ] **Step 1: Write failing tests**

Add:

```rust
#[sqlx::test(migrations = "../../migrations")]
async fn account_can_list_trip_history_and_stats(pool: sqlx::PgPool) {
    let session = login_account(&pool, "owner@example.com", false, "").await;
    let token = session["sessionToken"].as_str().unwrap();

    let created = create_trip_for_account(&pool, token).await;
    let trip_id = created["trip"]["id"].as_str().unwrap();

    let (list_status, list_body) = response_json(
        get_with_auth(
            support::app(pool.clone()),
            "/v1/account/trips",
            Some(&format!("Bearer {token}")),
        )
        .await,
    )
    .await;
    assert_eq!(list_status, StatusCode::OK);
    assert_eq!(list_body.as_array().unwrap().len(), 1);
    assert_eq!(list_body[0]["id"], trip_id);
    assert_eq!(list_body[0]["role"], "owner");
    assert_eq!(list_body[0]["isOwner"], true);

    let (stats_status, stats_body) = response_json(
        get_with_auth(
            support::app(pool),
            "/v1/account/stats",
            Some(&format!("Bearer {token}")),
        )
        .await,
    )
    .await;
    assert_eq!(stats_status, StatusCode::OK);
    assert_eq!(stats_body["tripsTotal"], 1);
    assert_eq!(stats_body["tripsOwned"], 1);
    assert_eq!(stats_body["activeTrips"], 1);
}
```

- [ ] **Step 2: Run RED**

Run:

```bash
DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5432/sagittarius_test rtk cargo test -p sagittarius-api --test account_trip_contract account_can_list_trip_history_and_stats
```

Expected: 404 or route missing.

- [ ] **Step 3: Implement queries**

List query:

```sql
select
  t.id,
  t.name,
  t.destination_label,
  t.start_date,
  t.end_date,
  m.role,
  m.id as member_id,
  t.owner_member_id,
  m.claimed_at::text as joined_at,
  (m.role = 'owner') as is_owner
from trip_members m
join trips t on t.id = m.trip_id
where m.user_id = $1
  and m.access_status = 'active'
  and t.deleted_at is null
order by coalesce(m.claimed_at, t.created_at) desc, t.created_at desc
```

Stats query:

```sql
select
  count(*)::bigint as trips_total,
  count(*) filter (where m.role = 'owner')::bigint as trips_owned,
  count(*) filter (where t.deleted_at is null and m.access_status = 'active')::bigint as active_trips,
  (
    select count(*)::bigint
    from account_audit_events
    where actor_user_id = $1 and event_type = 'member.claimed_account'
  ) as temp_claims_completed
from trip_members m
join trips t on t.id = m.trip_id
where m.user_id = $1
```

- [ ] **Step 4: Add handlers**

Handlers:

```rust
pub async fn list_trips(
    State(state): State<AppState>,
    BearerToken(session_token): BearerToken,
) -> Result<Json<Vec<AccountTripSummary>>, ServiceError> {
    Ok(Json(app::account::list_account_trips(&state.pool, &session_token).await?))
}

pub async fn get_stats(
    State(state): State<AppState>,
    BearerToken(session_token): BearerToken,
) -> Result<Json<AccountTripStats>, ServiceError> {
    Ok(Json(app::account::load_account_stats(&state.pool, &session_token).await?))
}
```

Routes:

```rust
.route("/v1/account/trips", post(account::create_trip).get(account::list_trips))
.route("/v1/account/stats", get(account::get_stats))
```

- [ ] **Step 5: Run account trip tests**

Run:

```bash
DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5432/sagittarius_test rtk cargo test -p sagittarius-api --test account_trip_contract
```

Expected: pass.

- [ ] **Step 6: Commit**

```bash
rtk git add backend/crates/sagittarius-api/tests/account_trip_contract.rs backend/crates/sagittarius-api/src/db/models.rs backend/crates/sagittarius-api/src/db/account_queries.rs backend/crates/sagittarius-api/src/app/account.rs backend/crates/sagittarius-api/src/api/account.rs backend/crates/sagittarius-api/src/api/mod.rs
rtk git commit -m "feat: add account trip history stats"
```

## Task 7: Final Verification And Aggressive Review

**Files:**
- No planned edits unless review finds issues.

- [ ] **Step 1: Run focused contracts**

```bash
DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5432/sagittarius_test rtk cargo test -p sagittarius-api --test account_schema_contract
DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5432/sagittarius_test rtk cargo test -p sagittarius-api --test account_auth_contract
DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5432/sagittarius_test rtk cargo test -p sagittarius-api --test account_trip_contract
```

Expected: all pass.

- [ ] **Step 2: Run full backend suite**

```bash
DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5432/sagittarius_test rtk cargo test -p sagittarius-api
rtk cargo fmt -p sagittarius-api --check
```

Expected: all pass.

- [ ] **Step 3: Run provider scan**

```bash
rtk rg -n "sendgrid|resend|postmark|auth0|clerk|supabase_auth|firebase|oauth|provider" Cargo.toml crates/sagittarius-api/Cargo.toml crates/sagittarius-api/src migrations
```

Expected: no hosted auth/email provider hits.

- [ ] **Step 4: Run account coverage gate**

```bash
DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5432/sagittarius_test rtk cargo llvm-cov -p sagittarius-api --tests --ignore-filename-regex '(^|/)(api/(itinerary|join|suggestions|tasks|trips|ws)\\.rs|app/(auth|events|itinerary|suggestions|tasks|trips|mod)\\.rs|db/(models|queries)\\.rs|domain/(capabilities|patches)\\.rs|realtime/.*|lib\\.rs|main\\.rs|bin/seed_e2e\\.rs)$' --fail-under-lines 100 --fail-under-functions 100
```

Expected: account identity/trip files have 100% line and function coverage. Document any remaining region misses caused only by implicit DB `?` error arms.

- [ ] **Step 5: Run final code review subagent**

Ask reviewer to check:
- owner transfer cannot leave zero or two owners
- target owner must be account-linked
- current owner must be the account bearer user
- member claim requires both account token and valid member session token
- audit events do not leak secrets
- account stats/list queries cannot show disabled/deleted trips
- no hosted provider dependencies
- tests cover stable error envelopes

- [ ] **Step 6: Fix review findings using TDD**

For each finding:
- write/adjust a failing test in `account_trip_contract.rs` or `account_schema_contract.rs`
- run targeted RED
- implement fix
- run targeted GREEN
- commit:

```bash
rtk git add <changed-files>
rtk git commit -m "fix: harden account trip ownership"
```

- [ ] **Step 7: Final clean status**

Run:

```bash
rtk git status --short --branch
```

Expected: clean branch.

## Self-Review

- Spec coverage:
  - Account can create trips: Task 3.
  - History/stats including trips: Task 6.
  - Claim from temp/member access into account: Task 4.
  - Owner has organizer-equivalent power: existing capability tests already cover role equivalence; Task 5 preserves owner/organizer behavior.
  - Owner transfer only to account users: Task 5.
  - Trip always has one owner: existing unique index plus Task 1 pointer trigger plus Task 5 transaction.
  - Performance/UX backend surface: account list/stat endpoints avoid N+1 queries and return stable DTOs for frontend.
  - No third-party provider: Task 7 scan.
- Placeholder scan: no TBD/TODO placeholders.
- Type consistency:
  - DTO field names use `camelCase`.
  - Route handlers use existing `BearerToken`.
  - Member-session proof uses existing member session token hashing.
