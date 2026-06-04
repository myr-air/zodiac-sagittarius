# Trip Temp Access Sessions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bound temporary trip member sessions by role and trip dates, while keeping organizer/traveler access convenient through sliding 7-day refresh and viewer access fixed to 1 day.

**Architecture:** Keep the existing database-backed opaque token model. Add one centralized session policy helper in `app::auth`, use it when creating member sessions from both legacy trip join auth and account trip creation, and refresh eligible organizer/traveler sessions when `load_cockpit` succeeds. Keep bearer-token storage unchanged in this implementation; cookie migration remains out of scope.

**Tech Stack:** Rust, Axum, SQLx, PostgreSQL migrations already present, `time`, backend contract tests with `#[sqlx::test]`.

---

## File Structure

- Modify `backend/crates/sagittarius-api/src/app/auth.rs`
  - Owns trip join/member auth. Add the role/date session policy helper and use it for legacy claim/login member sessions.
- Modify `backend/crates/sagittarius-api/src/app/account.rs`
  - Uses the same helper when account trip creation creates the owner member session.
- Modify `backend/crates/sagittarius-api/src/app/trips.rs`
  - Refreshes organizer/traveler sessions on successful cockpit load.
- Modify `backend/crates/sagittarius-api/src/db/queries.rs`
  - Adds query helpers to read trip dates/member role for session creation and to extend an active member session expiry.
- Modify `backend/crates/sagittarius-api/src/db/models.rs`
  - Adds any small record type needed by the new query helpers.
- Modify `backend/crates/sagittarius-api/tests/support/mod.rs`
  - Adds test helpers for changing trip dates, creating sessions with explicit expiry, and reading stored session expiry.
- Modify `backend/crates/sagittarius-api/tests/join_session_contract.rs`
  - Covers organizer/traveler/viewer login/claim expiry and blocked access windows.
- Modify `backend/crates/sagittarius-api/tests/account_trip_contract.rs`
  - Covers owner session from permanent-account trip creation not being capped by `trip.end_date + 7 days`.
- Modify `backend/crates/sagittarius-api/tests/trip_load_contract.rs`
  - Covers sliding refresh on cockpit load and no refresh for viewer.

---

### Task 1: Add Member Session Policy Unit Tests

**Files:**
- Modify: `backend/crates/sagittarius-api/src/app/auth.rs`

- [ ] **Step 1: Add failing unit tests for the policy helper**

Add these tests inside the existing `#[cfg(test)] mod tests` in `backend/crates/sagittarius-api/src/app/auth.rs`.

```rust
    fn utc(year: i32, month: time::Month, day: u8, hour: u8) -> OffsetDateTime {
        time::Date::from_calendar_date(year, month, day)
            .unwrap()
            .with_hms(hour, 0, 0)
            .unwrap()
            .assume_utc()
    }

    #[test]
    fn organizer_and_traveler_policy_uses_sliding_7_day_cap() {
        let start = time::Date::from_calendar_date(2026, time::Month::November, 10).unwrap();
        let end = time::Date::from_calendar_date(2026, time::Month::November, 20).unwrap();
        let now = utc(2026, time::Month::November, 17, 9);

        let organizer = member_session_expires_at(
            crate::domain::types::TripRole::Organizer,
            start,
            end,
            now,
        )
        .unwrap();
        let traveler = member_session_expires_at(
            crate::domain::types::TripRole::Traveler,
            start,
            end,
            now,
        )
        .unwrap();

        assert_eq!(organizer, utc(2026, time::Month::November, 24, 9));
        assert_eq!(traveler, utc(2026, time::Month::November, 24, 9));
    }

    #[test]
    fn organizer_and_traveler_policy_never_extends_past_trip_end_plus_7_days() {
        let start = time::Date::from_calendar_date(2026, time::Month::November, 10).unwrap();
        let end = time::Date::from_calendar_date(2026, time::Month::November, 20).unwrap();
        let now = utc(2026, time::Month::November, 25, 9);

        let expires_at =
            member_session_expires_at(crate::domain::types::TripRole::Traveler, start, end, now)
                .unwrap();

        assert_eq!(
            expires_at,
            utc(2026, time::Month::November, 27, 23)
                + Duration::minutes(59)
                + Duration::seconds(59)
        );
    }

    #[test]
    fn organizer_and_traveler_policy_rejects_outside_trip_window() {
        let start = time::Date::from_calendar_date(2026, time::Month::November, 10).unwrap();
        let end = time::Date::from_calendar_date(2026, time::Month::November, 20).unwrap();
        let too_early = utc(2026, time::Month::November, 2, 23);
        let too_late = utc(2026, time::Month::November, 28, 0);

        assert!(matches!(
            member_session_expires_at(
                crate::domain::types::TripRole::Organizer,
                start,
                end,
                too_early
            ),
            Err(ServiceError::Unauthenticated)
        ));
        assert!(matches!(
            member_session_expires_at(
                crate::domain::types::TripRole::Traveler,
                start,
                end,
                too_late
            ),
            Err(ServiceError::Unauthenticated)
        ));
    }

    #[test]
    fn viewer_policy_is_fixed_1_day_and_capped_by_trip_end_plus_7_days() {
        let start = time::Date::from_calendar_date(2026, time::Month::November, 10).unwrap();
        let end = time::Date::from_calendar_date(2026, time::Month::November, 20).unwrap();

        let normal = member_session_expires_at(
            crate::domain::types::TripRole::Viewer,
            start,
            end,
            utc(2026, time::Month::November, 10, 9),
        )
        .unwrap();
        let capped = member_session_expires_at(
            crate::domain::types::TripRole::Viewer,
            start,
            end,
            utc(2026, time::Month::November, 27, 12),
        )
        .unwrap();

        assert_eq!(normal, utc(2026, time::Month::November, 11, 9));
        assert_eq!(
            capped,
            utc(2026, time::Month::November, 27, 23)
                + Duration::minutes(59)
                + Duration::seconds(59)
        );
    }

    #[test]
    fn owner_policy_uses_existing_long_member_ttl() {
        let start = time::Date::from_calendar_date(2026, time::Month::November, 10).unwrap();
        let end = time::Date::from_calendar_date(2026, time::Month::November, 20).unwrap();
        let now = utc(2026, time::Month::December, 15, 9);

        let expires_at =
            member_session_expires_at(crate::domain::types::TripRole::Owner, start, end, now)
                .unwrap();

        assert_eq!(expires_at, now + OWNER_MEMBER_SESSION_TTL);
    }
```

- [ ] **Step 2: Run tests and verify failure**

Run:

```bash
rtk cargo test -p sagittarius-api app::auth::tests::organizer_and_traveler_policy_uses_sliding_7_day_cap --lib
```

Expected: compile failure mentioning `member_session_expires_at` is not found.

### Task 2: Implement Member Session Policy Helper

**Files:**
- Modify: `backend/crates/sagittarius-api/src/app/auth.rs`

- [ ] **Step 1: Import trip role and date/time helpers**

At the top of `backend/crates/sagittarius-api/src/app/auth.rs`, change the `time` and `types` imports to include `Date`, `PrimitiveDateTime`, `Time`, and `TripRole`.

```rust
use time::format_description::well_known::Rfc3339;
use time::{Date, Duration, OffsetDateTime, PrimitiveDateTime, Time};
use uuid::Uuid;

use crate::db;
use crate::db::PgPool;
use crate::domain::errors::ServiceError;
use crate::domain::types::{
    ClaimableMember, JoinTripResponse, MemberSession, TripMemberAccessStatus, TripRole,
    TripSummary,
};
```

- [ ] **Step 2: Replace member session constants**

Replace:

```rust
const SESSION_TTL: Duration = Duration::days(30);
```

with:

```rust
const OWNER_MEMBER_SESSION_TTL: Duration = Duration::days(30);
const ACTIVE_TRIP_MEMBER_SESSION_TTL: Duration = Duration::days(7);
const VIEWER_SESSION_TTL: Duration = Duration::days(1);
const TRIP_ACCESS_WINDOW: Duration = Duration::days(7);
```

- [ ] **Step 3: Add the helper functions before `create_session`**

```rust
pub(crate) fn member_session_expires_at(
    role: TripRole,
    trip_start_date: Date,
    trip_end_date: Date,
    now: OffsetDateTime,
) -> Result<OffsetDateTime, ServiceError> {
    match role {
        TripRole::Owner => Ok(now + OWNER_MEMBER_SESSION_TTL),
        TripRole::Organizer | TripRole::Traveler => {
            let access_start = start_of_day_utc(trip_start_date)? - TRIP_ACCESS_WINDOW;
            let access_end = end_of_day_utc(add_days(trip_end_date, 7)?)?;
            if now < access_start || now > access_end {
                return Err(ServiceError::Unauthenticated);
            }
            Ok(std::cmp::min(now + ACTIVE_TRIP_MEMBER_SESSION_TTL, access_end))
        }
        TripRole::Viewer => {
            let access_end = end_of_day_utc(add_days(trip_end_date, 7)?)?;
            if now > access_end {
                return Err(ServiceError::Unauthenticated);
            }
            Ok(std::cmp::min(now + VIEWER_SESSION_TTL, access_end))
        }
    }
}

fn start_of_day_utc(date: Date) -> Result<OffsetDateTime, ServiceError> {
    Ok(PrimitiveDateTime::new(date, Time::MIDNIGHT).assume_utc())
}

fn add_days(date: Date, days: i64) -> Result<Date, ServiceError> {
    date.checked_add(Duration::days(days))
        .ok_or(ServiceError::InvalidRequest("trip access date is out of range"))
}

fn end_of_day_utc(date: Date) -> Result<OffsetDateTime, ServiceError> {
    let next_day = date
        .next_day()
        .ok_or(ServiceError::InvalidRequest("trip access date is out of range"))?;
    Ok(PrimitiveDateTime::new(next_day, Time::MIDNIGHT).assume_utc() - Duration::seconds(1))
}
```

- [ ] **Step 4: Run policy unit tests**

Run:

```bash
rtk cargo test -p sagittarius-api app::auth::tests:: --lib
```

Expected: PASS for the policy tests and existing auth unit tests.

- [ ] **Step 5: Commit**

```bash
git add backend/crates/sagittarius-api/src/app/auth.rs
git commit -m "feat: add trip member session policy"
```

### Task 3: Add DB Query Helpers For Session Policy

**Files:**
- Modify: `backend/crates/sagittarius-api/src/db/models.rs`
- Modify: `backend/crates/sagittarius-api/src/db/queries.rs`

- [ ] **Step 1: Add record types**

In `backend/crates/sagittarius-api/src/db/models.rs`, add this near the other auth/session record structs:

```rust
#[derive(Debug, Clone, FromRow)]
pub struct MemberSessionPolicyRecord {
    pub role: TripRole,
    pub start_date: Date,
    pub end_date: Date,
}
```

- [ ] **Step 2: Import the record type in queries**

In `backend/crates/sagittarius-api/src/db/queries.rs`, replace the existing `use crate::db::models::{...};` block with:

```rust
use crate::db::models::{
    AuthenticatedMemberSessionRecord, ExpenseRecord, ExpenseSplitRecord, ItineraryItemRecord,
    MemberSessionPolicyRecord, NewExpense, NewItineraryItem, NewPlanVariant, NewRealtimeEvent,
    NewStopNote, NewSuggestion, NewTripMember, NewTripTask, PlanVariantRecord,
    RealtimeEventRecord, StopNoteRecord, SuggestionRecord, TripAuthRecord, TripMemberAuthRecord,
    TripMemberRecord, TripTaskRecord,
};
```

- [ ] **Step 3: Add policy lookup and refresh queries after `insert_member_session`**

```rust
pub async fn find_member_session_policy(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    trip_id: Uuid,
    member_id: Uuid,
) -> Result<Option<MemberSessionPolicyRecord>, sqlx::Error> {
    sqlx::query_as::<_, MemberSessionPolicyRecord>(
        "select m.role, t.start_date, t.end_date
         from trip_members m
         join trips t on t.id = m.trip_id
         where m.trip_id = $1
           and m.id = $2
           and m.access_status = 'active'
           and t.deleted_at is null",
    )
    .bind(trip_id)
    .bind(member_id)
    .fetch_optional(&mut **tx)
    .await
}

pub async fn extend_member_session_expiry(
    pool: &PgPool,
    trip_id: Uuid,
    member_id: Uuid,
    token_hash: &str,
    expires_at: OffsetDateTime,
) -> Result<u64, sqlx::Error> {
    let result = sqlx::query(
        "update trip_member_sessions
         set expires_at = greatest(expires_at, $4)
         where trip_id = $1
           and member_id = $2
           and session_token_hash = $3
           and revoked_at is null
           and expires_at > now()",
    )
    .bind(trip_id)
    .bind(member_id)
    .bind(token_hash)
    .bind(expires_at)
    .execute(pool)
    .await?;

    Ok(result.rows_affected())
}
```

- [ ] **Step 4: Run backend compile check**

Run:

```bash
rtk cargo test -p sagittarius-api --no-run
```

Expected: PASS compile.

- [ ] **Step 5: Commit**

```bash
git add backend/crates/sagittarius-api/src/db/models.rs backend/crates/sagittarius-api/src/db/queries.rs
git commit -m "feat: add member session expiry queries"
```

### Task 4: Apply Policy To Legacy Trip Member Claim/Login

**Files:**
- Modify: `backend/crates/sagittarius-api/src/app/auth.rs`
- Modify: `backend/crates/sagittarius-api/tests/support/mod.rs`
- Modify: `backend/crates/sagittarius-api/tests/join_session_contract.rs`

- [ ] **Step 1: Update `create_session` signature and implementation**

In `backend/crates/sagittarius-api/src/app/auth.rs`, replace `create_session` with:

```rust
async fn create_session(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    trip_id: Uuid,
    member_id: Uuid,
) -> Result<MemberSession, ServiceError> {
    let policy = db::queries::find_member_session_policy(tx, trip_id, member_id)
        .await?
        .ok_or(ServiceError::Unauthenticated)?;
    let session_token = generate_session_token();
    let session_token_hash = hash_session_token(&session_token)?;
    let created_at = OffsetDateTime::now_utc();
    let expires_at =
        member_session_expires_at(policy.role, policy.start_date, policy.end_date, created_at)?;

    db::queries::insert_member_session(
        tx,
        Uuid::now_v7(),
        trip_id,
        member_id,
        &session_token_hash,
        created_at,
        expires_at,
    )
    .await?;

    Ok(MemberSession {
        trip_id,
        member_id,
        session_token,
        created_at: format_timestamp(created_at)?,
        expires_at: format_timestamp(expires_at)?,
    })
}
```

- [ ] **Step 2: Add test helpers**

In `backend/crates/sagittarius-api/tests/support/mod.rs`, add:

```rust
pub async fn set_trip_dates(pool: &PgPool, start_date: &str, end_date: &str) {
    sqlx::query(
        "update trips
         set start_date = $1::date, end_date = $2::date
         where id = $3",
    )
    .bind(start_date)
    .bind(end_date)
    .bind(Uuid::parse_str(TRIP_ID).unwrap())
    .execute(pool)
    .await
    .unwrap();
}

pub async fn stored_member_session_expires_at(
    pool: &PgPool,
    session_token: &str,
) -> time::OffsetDateTime {
    sqlx::query_scalar(
        "select expires_at
         from trip_member_sessions
         where session_token_hash = $1",
    )
    .bind(sagittarius_api::app::auth::hash_session_token_for_tests(session_token))
    .fetch_one(pool)
    .await
    .unwrap()
}
```

- [ ] **Step 3: Add contract tests for organizer/traveler/viewer expiry**

In `backend/crates/sagittarius-api/tests/join_session_contract.rs`, add helper imports:

```rust
use time::{Duration, OffsetDateTime};
```

Then add tests:

```rust
#[sqlx::test(migrations = "../../migrations")]
async fn member_session_contract_sets_organizer_traveler_and_viewer_ttls(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    support::set_trip_dates(&pool, "2026-06-01", "2026-06-30").await;
    support::claim_member(&pool, support::ORGANIZER_ID, "1234", "active").await;
    support::claim_member(&pool, support::TRAVELER_ID, "1234", "active").await;
    support::claim_member(&pool, support::VIEWER_ID, "1234", "active").await;
    let app = support::app(pool.clone());

    for (member_id, expected_days) in [
        (support::ORGANIZER_ID, 7_i64),
        (support::TRAVELER_ID, 7_i64),
        (support::VIEWER_ID, 1_i64),
    ] {
        let join_body = join_room(&app).await;
        let join_session_token = join_body["joinSessionToken"].as_str().unwrap();
        let response = app
            .clone()
            .oneshot(
                Request::builder()
                    .method(Method::POST)
                    .uri(format!("/api/v1/trips/{}/member-sessions", support::TRIP_ID))
                    .header(header::CONTENT_TYPE, "application/json")
                    .body(Body::from(
                        json!({
                            "memberId": member_id,
                            "participantPassword":"1234",
                            "joinSessionToken": join_session_token
                        })
                        .to_string(),
                    ))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::OK);
        let body: Value =
            serde_json::from_slice(&to_bytes(response.into_body(), 65536).await.unwrap()).unwrap();
        let created_at = OffsetDateTime::parse(
            body["createdAt"].as_str().unwrap(),
            &time::format_description::well_known::Rfc3339,
        )
        .unwrap();
        let expires_at = OffsetDateTime::parse(
            body["expiresAt"].as_str().unwrap(),
            &time::format_description::well_known::Rfc3339,
        )
        .unwrap();

        assert_eq!(expires_at - created_at, Duration::days(expected_days));
    }
}

#[sqlx::test(migrations = "../../migrations")]
async fn member_session_contract_rejects_organizer_after_trip_window(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    support::set_trip_dates(&pool, "2020-01-01", "2020-01-02").await;
    support::claim_member(&pool, support::ORGANIZER_ID, "1234", "active").await;
    let app = support::app(pool.clone());
    let join_body = join_room(&app).await;
    let join_session_token = join_body["joinSessionToken"].as_str().unwrap();

    let response = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/trips/{}/member-sessions", support::TRIP_ID))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "memberId": support::ORGANIZER_ID,
                        "participantPassword":"1234",
                        "joinSessionToken": join_session_token
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
}
```

- [ ] **Step 4: Run focused contract tests**

Run:

```bash
rtk cargo test -p sagittarius-api --test join_session_contract member_session_contract_
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/crates/sagittarius-api/src/app/auth.rs backend/crates/sagittarius-api/tests/support/mod.rs backend/crates/sagittarius-api/tests/join_session_contract.rs
git commit -m "feat: bound trip member session creation"
```

### Task 5: Apply Policy To Account-Created Owner Member Sessions

**Files:**
- Modify: `backend/crates/sagittarius-api/src/app/account.rs`
- Modify: `backend/crates/sagittarius-api/tests/account_trip_contract.rs`

- [ ] **Step 1: Replace `MEMBER_SESSION_TTL` use**

In `backend/crates/sagittarius-api/src/app/account.rs`, keep the constant for unrelated code only if still used. Replace this line in `create_member_session`:

```rust
    let expires_at = created_at + MEMBER_SESSION_TTL;
```

with:

```rust
    let policy = db::queries::find_member_session_policy(tx, trip_id, member_id)
        .await?
        .ok_or(ServiceError::Unauthenticated)?;
    let expires_at = crate::app::auth::member_session_expires_at(
        policy.role,
        policy.start_date,
        policy.end_date,
        created_at,
    )?;
```

Then remove `const MEMBER_SESSION_TTL: Duration = Duration::days(30);` if it is unused.

- [ ] **Step 2: Add owner expiry contract test**

In `backend/crates/sagittarius-api/tests/account_trip_contract.rs`, add:

```rust
#[sqlx::test(migrations = "../../migrations")]
async fn account_trip_contract_owner_member_session_uses_30_day_ttl(pool: sqlx::PgPool) {
    let account = login_account(&pool, "owner-session@example.com", true, "Owner laptop").await;
    let auth = format!("Bearer {}", account["sessionToken"].as_str().unwrap());
    let (status, body) = create_account_trip(&pool, &auth, "OWNER-TTL-2026", "owner-ttl-pass").await;

    assert_eq!(status, StatusCode::OK);
    let member_session = &body["memberSession"];
    let created_at = time::OffsetDateTime::parse(
        member_session["createdAt"].as_str().unwrap(),
        &time::format_description::well_known::Rfc3339,
    )
    .unwrap();
    let expires_at = time::OffsetDateTime::parse(
        member_session["expiresAt"].as_str().unwrap(),
        &time::format_description::well_known::Rfc3339,
    )
    .unwrap();

    assert_eq!(expires_at - created_at, time::Duration::days(30));
}
```

- [ ] **Step 3: Run focused contract test**

Run:

```bash
rtk cargo test -p sagittarius-api --test account_trip_contract owner
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add backend/crates/sagittarius-api/src/app/account.rs backend/crates/sagittarius-api/tests/account_trip_contract.rs
git commit -m "feat: use session policy for owner trip sessions"
```

### Task 6: Refresh Organizer/Traveler Sessions On Cockpit Load

**Files:**
- Modify: `backend/crates/sagittarius-api/src/app/trips.rs`
- Modify: `backend/crates/sagittarius-api/tests/support/mod.rs`
- Modify: `backend/crates/sagittarius-api/tests/trip_load_contract.rs`

- [ ] **Step 1: Add explicit-expiry session helper**

In `backend/crates/sagittarius-api/tests/support/mod.rs`, add:

```rust
pub async fn create_session_with_expiry(
    pool: &PgPool,
    member_id: &str,
    expires_at: time::OffsetDateTime,
) -> String {
    let token = format!("test-token-{member_id}-{expires_at}");
    sqlx::query(
        "insert into trip_member_sessions (
           id, trip_id, member_id, session_token_hash, expires_at
         )
         values (gen_random_uuid(), $1, $2, $3, $4)",
    )
    .bind(Uuid::parse_str(TRIP_ID).unwrap())
    .bind(Uuid::parse_str(member_id).unwrap())
    .bind(sagittarius_api::app::auth::hash_session_token_for_tests(&token))
    .bind(expires_at)
    .execute(pool)
    .await
    .unwrap();

    token
}
```

- [ ] **Step 2: Update `load_cockpit` to refresh eligible sessions**

In `backend/crates/sagittarius-api/src/app/trips.rs`, after `let session_member_id = session.member_id;`, add:

```rust
    if matches!(
        session.role,
        crate::domain::types::TripRole::Organizer | crate::domain::types::TripRole::Traveler
    ) {
        if let Some(trip_record) = db::queries::find_trip_by_id(pool, session_trip_id).await? {
            let refreshed_expires_at = auth::member_session_expires_at(
                session.role,
                trip_record.start_date,
                trip_record.end_date,
                time::OffsetDateTime::now_utc(),
            )?;
            db::queries::extend_member_session_expiry(
                pool,
                session_trip_id,
                session_member_id,
                &token_hash,
                refreshed_expires_at,
            )
            .await?;
        }
    }
```

Keep the later `tokio::try_join!` trip branch unchanged in this task. The extra lookup is acceptable for this small auth refresh and avoids an unrelated query refactor.

- [ ] **Step 3: Add refresh tests**

In `backend/crates/sagittarius-api/tests/trip_load_contract.rs`, add:

```rust
#[sqlx::test(migrations = "../../migrations")]
async fn trip_load_refreshes_organizer_session_but_not_viewer_session(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    support::set_trip_dates(&pool, "2026-06-01", "2026-06-30").await;
    let organizer_expiry = time::OffsetDateTime::now_utc() + time::Duration::hours(2);
    let viewer_expiry = time::OffsetDateTime::now_utc() + time::Duration::hours(2);
    let organizer_token =
        support::create_session_with_expiry(&pool, support::ORGANIZER_ID, organizer_expiry).await;
    let viewer_token =
        support::create_session_with_expiry(&pool, support::VIEWER_ID, viewer_expiry).await;
    let app = support::app(pool.clone());

    let organizer_response = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(format!("/api/v1/trips/{}", support::TRIP_ID))
                .header(header::AUTHORIZATION, format!("Bearer {organizer_token}"))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(organizer_response.status(), StatusCode::OK);

    let viewer_response = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(format!("/api/v1/trips/{}", support::TRIP_ID))
                .header(header::AUTHORIZATION, format!("Bearer {viewer_token}"))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(viewer_response.status(), StatusCode::OK);

    let organizer_refreshed =
        support::stored_member_session_expires_at(&pool, &organizer_token).await;
    let viewer_refreshed = support::stored_member_session_expires_at(&pool, &viewer_token).await;

    assert!(organizer_refreshed > organizer_expiry + time::Duration::days(6));
    assert_eq!(viewer_refreshed, viewer_expiry);
}
```

- [ ] **Step 4: Run focused test**

Run:

```bash
rtk cargo test -p sagittarius-api --test trip_load_contract trip_load_refreshes_organizer_session_but_not_viewer_session
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/crates/sagittarius-api/src/app/trips.rs backend/crates/sagittarius-api/tests/support/mod.rs backend/crates/sagittarius-api/tests/trip_load_contract.rs
git commit -m "feat: refresh active trip member sessions"
```

### Task 7: Full Verification

**Files:**
- No source changes.

- [ ] **Step 1: Run backend tests**

Run:

```bash
rtk make backend-test
```

Expected: PASS.

- [ ] **Step 2: Run frontend verification only if backend API contract output changes**

This plan should not change response field names. If any frontend API contract snapshot or type is changed during execution, run:

```bash
rtk make frontend-verify
```

Expected: PASS.

- [ ] **Step 3: Real-system QA gate**

Because this changes auth/session behavior, run the existing real API or browser auth flow if local services are available:

```bash
rtk make frontend-e2e-local SAGITTARIUS_BIND_ADDR=127.0.0.1:5201
```

Expected: PASS join/login/load cockpit flow on the real Rust API.

- [ ] **Step 4: Final status check**

Run:

```bash
rtk git status --short
```

Expected: no uncommitted source changes.
