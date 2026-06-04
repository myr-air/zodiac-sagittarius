# Trip Weather Briefing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a trip daily weather briefing: an Atmospheric Glass one-line forecast strip under the overview hero, a large animated detail drawer, cached backend daily briefing data, and organizer-editable manual overrides.

**Architecture:** Add a scoped backend `daily-briefings` feature with its own migration, domain DTOs, query functions, app service, and routes. Add frontend API/types plus focused React components for the strip and drawer, then wire them into `OverviewPage` with Storybook and tests. External provider calls are introduced behind a small provider interface so the first implementation can return deterministic cache-backed/fallback data and later swap in Open-Meteo/Nager.Date clients safely.

**Tech Stack:** Rust, Axum, SQLx, Postgres migrations, time, serde_json, Next.js 16, React 19, TypeScript, Tailwind utilities/design tokens, Vitest, Storybook, Playwright-backed real system QA.

---

## File Structure

- Create `backend/migrations/0008_trip_daily_briefings.sql`: stores cached briefing blocks and manual overrides.
- Create `backend/crates/sagittarius-api/src/app/daily_briefings.rs`: service layer for date-window generation, permission checks, cache assembly, and manual override patching.
- Create `backend/crates/sagittarius-api/src/api/daily_briefings.rs`: Axum handlers for list and patch endpoints.
- Modify `backend/crates/sagittarius-api/src/api/mod.rs`: register new routes.
- Modify `backend/crates/sagittarius-api/src/app/mod.rs`: export the daily briefing service.
- Modify `backend/crates/sagittarius-api/src/domain/types.rs`: add daily briefing response DTOs.
- Modify `backend/crates/sagittarius-api/src/domain/patches.rs`: add manual override patch request DTO and validation.
- Modify `backend/crates/sagittarius-api/src/db/models.rs`: add `TripDailyBriefingRecord`.
- Modify `backend/crates/sagittarius-api/src/db/queries.rs`: add briefing list/upsert/patch queries.
- Create `backend/crates/sagittarius-api/tests/daily_briefings_contract.rs`: backend contract coverage.
- Modify frontend trip types/API:
  - `frontend/src/trip/types.ts`
  - `frontend/src/trip/api-routes.ts`
  - `frontend/src/trip/api-client.ts`
  - `frontend/src/trip/api-client.test.ts`
  - `frontend/src/trip/api-contract.test.ts`
- Create frontend briefing domain/helpers:
  - `frontend/src/trip/weather-briefings.ts`
  - `frontend/src/trip/weather-briefings.test.ts`
- Create UI components:
  - `frontend/src/components/WeatherForecastStrip.tsx`
  - `frontend/src/components/WeatherForecastStrip.test.tsx`
  - `frontend/src/components/WeatherForecastStrip.stories.tsx`
  - `frontend/src/components/WeatherBriefingDrawer.tsx`
  - `frontend/src/components/WeatherBriefingDrawer.test.tsx`
  - `frontend/src/components/WeatherBriefingDrawer.stories.tsx`
- Modify `frontend/src/components/OverviewPage.tsx`: place strip below hero and open drawer on day selection.
- Modify `frontend/src/components/OverviewPage.stories.tsx`: include briefing args.
- Modify app/root state in `frontend/src/app/SagittariusApp.tsx`, where `OverviewPage` is called, to load briefings and pass them down.

---

### Task 1: Backend Schema And Domain DTOs

**Files:**
- Create: `backend/migrations/0008_trip_daily_briefings.sql`
- Modify: `backend/crates/sagittarius-api/src/domain/types.rs`
- Modify: `backend/crates/sagittarius-api/src/domain/patches.rs`
- Modify: `backend/crates/sagittarius-api/src/db/models.rs`
- Test: `backend/crates/sagittarius-api/tests/schema_contract.rs`

- [ ] **Step 1: Write the migration**

Create `backend/migrations/0008_trip_daily_briefings.sql`:

```sql
CREATE TABLE trip_daily_briefings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  briefing_date date NOT NULL,
  location_key text NOT NULL,
  location_label text NOT NULL,
  coordinates jsonb,
  weather jsonb,
  holiday jsonb,
  festival jsonb,
  facts jsonb,
  outfit_advice jsonb,
  manual_overrides jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version bigint NOT NULL DEFAULT 1,
  UNIQUE (trip_id, briefing_date, location_key)
);

CREATE INDEX trip_daily_briefings_trip_date_idx
  ON trip_daily_briefings (trip_id, briefing_date);
```

- [ ] **Step 2: Add schema contract expectations**

Modify `backend/crates/sagittarius-api/tests/schema_contract.rs` to assert the migration file exists and contains the table/index. Add a test near existing migration checks:

```rust
#[test]
fn daily_briefings_migration_declares_cache_and_override_table() {
    let migration = std::fs::read_to_string("../../migrations/0008_trip_daily_briefings.sql")
        .expect("daily briefings migration should exist");

    assert!(migration.contains("CREATE TABLE trip_daily_briefings"));
    assert!(migration.contains("manual_overrides jsonb NOT NULL DEFAULT '{}'::jsonb"));
    assert!(migration.contains("UNIQUE (trip_id, briefing_date, location_key)"));
    assert!(migration.contains("trip_daily_briefings_trip_date_idx"));
}
```

- [ ] **Step 3: Run schema contract to verify migration coverage**

Run:

```bash
rtk cargo test -p sagittarius-api --test schema_contract daily_briefings_migration_declares_cache_and_override_table
```

Expected: PASS.

- [ ] **Step 4: Add backend DTOs**

Modify `backend/crates/sagittarius-api/src/domain/types.rs` after `ItineraryCoordinates`:

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BriefingCoordinates {
    pub lat: f64,
    pub lng: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BriefingSourceMeta {
    pub source: String,
    pub source_url: Option<String>,
    pub fetched_at: Option<String>,
    pub expires_at: Option<String>,
    pub confidence: String,
    pub unavailable_reason: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WeatherBriefingBlock {
    pub condition_code: String,
    pub condition_label: String,
    pub temperature_max_celsius: Option<f64>,
    pub temperature_min_celsius: Option<f64>,
    pub humidity_percent: Option<i32>,
    pub wind_speed_kph: Option<f64>,
    pub rain_chance_percent: Option<i32>,
    pub meta: BriefingSourceMeta,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TextBriefingBlock {
    pub title: String,
    pub body: String,
    pub meta: BriefingSourceMeta,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct DailyBriefingOverrides {
    pub outfit_advice: Option<String>,
    pub festival_note: Option<String>,
    pub facts_note: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TripDailyBriefing {
    pub trip_id: Uuid,
    pub date: Date,
    pub location_key: String,
    pub location_label: String,
    pub coordinates: Option<BriefingCoordinates>,
    pub weather: Option<WeatherBriefingBlock>,
    pub holiday: Option<TextBriefingBlock>,
    pub festival: Option<TextBriefingBlock>,
    pub facts: Option<TextBriefingBlock>,
    pub outfit_advice: Option<TextBriefingBlock>,
    pub manual_overrides: DailyBriefingOverrides,
    pub updated_at: String,
    pub version: i64,
}
```

- [ ] **Step 5: Add patch request DTO and validation**

Modify `backend/crates/sagittarius-api/src/domain/patches.rs`:

```rust
#[derive(Debug, Clone, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PatchDailyBriefingRequest {
    pub client_mutation_id: String,
    pub expected_version: i64,
    pub outfit_advice: Option<Option<String>>,
    pub festival_note: Option<Option<String>>,
    pub facts_note: Option<Option<String>>,
}

impl PatchDailyBriefingRequest {
    pub fn validate(&self) -> Result<(), ServiceError> {
        validate_client_mutation_id(&self.client_mutation_id)?;
        validate_optional_override(&self.outfit_advice, "outfitAdvice")?;
        validate_optional_override(&self.festival_note, "festivalNote")?;
        validate_optional_override(&self.facts_note, "factsNote")?;
        Ok(())
    }
}

fn validate_optional_override(value: &Option<Option<String>>, field: &'static str) -> Result<(), ServiceError> {
    if let Some(Some(text)) = value {
        validate_sized_text(text, field)?;
    }
    Ok(())
}
```

- [ ] **Step 6: Add DB record model**

Modify `backend/crates/sagittarius-api/src/db/models.rs`:

```rust
#[derive(Debug, Clone, sqlx::FromRow)]
pub struct TripDailyBriefingRecord {
    pub trip_id: uuid::Uuid,
    pub briefing_date: time::Date,
    pub location_key: String,
    pub location_label: String,
    pub coordinates: Option<serde_json::Value>,
    pub weather: Option<serde_json::Value>,
    pub holiday: Option<serde_json::Value>,
    pub festival: Option<serde_json::Value>,
    pub facts: Option<serde_json::Value>,
    pub outfit_advice: Option<serde_json::Value>,
    pub manual_overrides: serde_json::Value,
    pub updated_at: time::OffsetDateTime,
    pub version: i64,
}
```

- [ ] **Step 7: Run backend type checks**

Run:

```bash
rtk cargo test -p sagittarius-api --lib domain::patches
```

Expected: PASS. If the exact module filter runs no tests, run:

```bash
rtk cargo test -p sagittarius-api --lib
```

Expected: PASS.

- [ ] **Step 8: Commit backend schema/domain foundation**

```bash
git add backend/migrations/0008_trip_daily_briefings.sql \
  backend/crates/sagittarius-api/src/domain/types.rs \
  backend/crates/sagittarius-api/src/domain/patches.rs \
  backend/crates/sagittarius-api/src/db/models.rs \
  backend/crates/sagittarius-api/tests/schema_contract.rs
git commit -m "feat: add trip daily briefing schema"
```

---

### Task 2: Backend Queries, Service, And Routes

**Files:**
- Modify: `backend/crates/sagittarius-api/src/db/queries.rs`
- Create: `backend/crates/sagittarius-api/src/app/daily_briefings.rs`
- Modify: `backend/crates/sagittarius-api/src/app/mod.rs`
- Create: `backend/crates/sagittarius-api/src/api/daily_briefings.rs`
- Modify: `backend/crates/sagittarius-api/src/api/mod.rs`
- Test: `backend/crates/sagittarius-api/tests/daily_briefings_contract.rs`

- [ ] **Step 1: Add backend contract tests**

Create `backend/crates/sagittarius-api/tests/daily_briefings_contract.rs`:

```rust
mod support;

use sagittarius_api::domain::types::TripRole;

#[tokio::test]
async fn traveler_can_list_daily_briefings_for_trip_window() {
    let ctx = support::TestContext::new().await;
    let seeded = ctx.seed_trip().await;
    let session = ctx.login_member(seeded.trip_id, TripRole::Traveler).await;

    let response = ctx
        .client()
        .get(format!("/api/v1/trips/{}/daily-briefings", seeded.trip_id))
        .bearer_auth(session.session_token)
        .send()
        .await
        .expect("request should send");

    assert_eq!(response.status(), 200);
    let body: serde_json::Value = response.json().await.expect("json response");
    let briefings = body.as_array().expect("briefings should be an array");
    assert!(briefings.len() >= 3);
    assert!(briefings.iter().any(|briefing| briefing["date"] == seeded.start_date.to_string()));
    assert!(briefings[0].get("manualOverrides").is_some());
}

#[tokio::test]
async fn organizer_can_patch_manual_briefing_overrides() {
    let ctx = support::TestContext::new().await;
    let seeded = ctx.seed_trip().await;
    let session = ctx.login_member(seeded.trip_id, TripRole::Organizer).await;

    let list = ctx
        .client()
        .get(format!("/api/v1/trips/{}/daily-briefings", seeded.trip_id))
        .bearer_auth(&session.session_token)
        .send()
        .await
        .expect("list should send")
        .json::<serde_json::Value>()
        .await
        .expect("list json");
    let first = &list.as_array().expect("array")[0];
    let date = first["date"].as_str().expect("date");
    let version = first["version"].as_i64().expect("version");

    let response = ctx
        .client()
        .patch(format!("/api/v1/trips/{}/daily-briefings/{}", seeded.trip_id, date))
        .bearer_auth(&session.session_token)
        .json(&serde_json::json!({
            "clientMutationId": "daily-briefing-override-1",
            "expectedVersion": version,
            "outfitAdvice": "Pack a compact umbrella and breathable shirt",
            "festivalNote": "Check local waterfront events before leaving"
        }))
        .send()
        .await
        .expect("patch should send");

    assert_eq!(response.status(), 200);
    let body: serde_json::Value = response.json().await.expect("patch json");
    assert_eq!(
        body["manualOverrides"]["outfitAdvice"],
        "Pack a compact umbrella and breathable shirt"
    );
    assert_eq!(
        body["manualOverrides"]["festivalNote"],
        "Check local waterfront events before leaving"
    );
}

#[tokio::test]
async fn traveler_cannot_patch_manual_briefing_overrides() {
    let ctx = support::TestContext::new().await;
    let seeded = ctx.seed_trip().await;
    let session = ctx.login_member(seeded.trip_id, TripRole::Traveler).await;

    let response = ctx
        .client()
        .patch(format!("/api/v1/trips/{}/daily-briefings/{}", seeded.trip_id, seeded.start_date))
        .bearer_auth(&session.session_token)
        .json(&serde_json::json!({
            "clientMutationId": "daily-briefing-override-denied",
            "expectedVersion": 1,
            "outfitAdvice": "Traveler should not be able to edit"
        }))
        .send()
        .await
        .expect("patch should send");

    assert_eq!(response.status(), 403);
}
```

Use the existing helpers from `backend/crates/sagittarius-api/tests/support/mod.rs`. If the helper names in this snippet do not exist, create thin helper methods in that support module with these names and semantics:

```rust
impl TestContext {
    pub async fn seed_trip(&self) -> SeededTrip {
        self.seed_default_trip().await
    }

    pub async fn login_member(&self, trip_id: uuid::Uuid, role: sagittarius_api::domain::types::TripRole) -> sagittarius_api::domain::types::MemberSession {
        self.login_member_by_role(trip_id, role).await
    }
}
```

Do not change the assertions in `daily_briefings_contract.rs`.

- [ ] **Step 2: Run contract tests to verify they fail**

Run:

```bash
rtk cargo test -p sagittarius-api --test daily_briefings_contract
```

Expected: FAIL because routes and service do not exist yet.

- [ ] **Step 3: Add query functions**

Modify `backend/crates/sagittarius-api/src/db/queries.rs` imports to include `TripDailyBriefingRecord`, then add:

```rust
pub async fn list_trip_daily_briefings(
    pool: &PgPool,
    trip_id: Uuid,
) -> Result<Vec<TripDailyBriefingRecord>, sqlx::Error> {
    sqlx::query_as::<_, TripDailyBriefingRecord>(
        "select
           trip_id, briefing_date, location_key, location_label, coordinates,
           weather, holiday, festival, facts, outfit_advice, manual_overrides,
           updated_at, version
         from trip_daily_briefings
         where trip_id = $1
         order by briefing_date, location_key",
    )
    .bind(trip_id)
    .fetch_all(pool)
    .await
}

pub async fn upsert_trip_daily_briefing_shell(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    trip_id: Uuid,
    briefing_date: time::Date,
    location_key: &str,
    location_label: &str,
    coordinates: Option<&serde_json::Value>,
) -> Result<TripDailyBriefingRecord, sqlx::Error> {
    sqlx::query_as::<_, TripDailyBriefingRecord>(
        "insert into trip_daily_briefings (
           trip_id, briefing_date, location_key, location_label, coordinates
         )
         values ($1, $2, $3, $4, $5)
         on conflict (trip_id, briefing_date, location_key)
         do update set
           location_label = excluded.location_label,
           coordinates = coalesce(excluded.coordinates, trip_daily_briefings.coordinates),
           updated_at = trip_daily_briefings.updated_at
         returning
           trip_id, briefing_date, location_key, location_label, coordinates,
           weather, holiday, festival, facts, outfit_advice, manual_overrides,
           updated_at, version",
    )
    .bind(trip_id)
    .bind(briefing_date)
    .bind(location_key)
    .bind(location_label)
    .bind(coordinates)
    .fetch_one(&mut **tx)
    .await
}

pub async fn patch_trip_daily_briefing_overrides(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    trip_id: Uuid,
    briefing_date: time::Date,
    expected_version: i64,
    manual_overrides: &serde_json::Value,
) -> Result<Option<TripDailyBriefingRecord>, sqlx::Error> {
    sqlx::query_as::<_, TripDailyBriefingRecord>(
        "update trip_daily_briefings
         set manual_overrides = $4,
             version = version + 1,
             updated_at = now()
         where trip_id = $1
           and briefing_date = $2
           and version = $3
         returning
           trip_id, briefing_date, location_key, location_label, coordinates,
           weather, holiday, festival, facts, outfit_advice, manual_overrides,
           updated_at, version",
    )
    .bind(trip_id)
    .bind(briefing_date)
    .bind(expected_version)
    .bind(manual_overrides)
    .fetch_optional(&mut **tx)
    .await
}
```

- [ ] **Step 4: Add app service module**

Create `backend/crates/sagittarius-api/src/app/daily_briefings.rs`:

```rust
use std::collections::BTreeMap;

use time::{Date, Duration};
use uuid::Uuid;

use crate::app::auth;
use crate::db;
use crate::db::PgPool;
use crate::db::models::{ItineraryItemRecord, TripDailyBriefingRecord, TripAuthRecord};
use crate::domain::capabilities::can;
use crate::domain::errors::ServiceError;
use crate::domain::patches::PatchDailyBriefingRequest;
use crate::domain::types::{
    BriefingCoordinates, DailyBriefingOverrides, Capability, TextBriefingBlock, TripDailyBriefing,
    WeatherBriefingBlock,
};

pub async fn list_daily_briefings(
    pool: &PgPool,
    trip_id: Uuid,
    session_token: &str,
) -> Result<Vec<TripDailyBriefing>, ServiceError> {
    let token_hash = auth::hash_session_token(session_token)?;
    let session = db::queries::find_active_member_session(pool, trip_id, &token_hash)
        .await?
        .ok_or(ServiceError::Unauthenticated)?;
    if !can(session.role, Capability::ViewPlan) {
        return Err(ServiceError::Forbidden);
    }

    let trip = db::queries::find_trip_by_id(pool, session.trip_id)
        .await?
        .ok_or(ServiceError::NotFound)?;
    let itinerary_items = db::queries::list_itinerary_items(pool, session.trip_id).await?;
    ensure_briefing_shells(pool, &trip, &itinerary_items).await?;

    let records = db::queries::list_trip_daily_briefings(pool, session.trip_id).await?;
    let window = briefing_window(trip.start_date, trip.end_date);
    Ok(records
        .into_iter()
        .filter(|record| window.contains(&record.briefing_date))
        .map(record_to_summary)
        .collect())
}

pub async fn patch_daily_briefing(
    pool: &PgPool,
    trip_id: Uuid,
    briefing_date: Date,
    session_token: &str,
    request: PatchDailyBriefingRequest,
) -> Result<TripDailyBriefing, ServiceError> {
    request.validate()?;
    let token_hash = auth::hash_session_token(session_token)?;
    let mut tx = pool.begin().await?;
    let session = db::queries::find_active_member_session_in_tx(&mut tx, trip_id, &token_hash)
        .await?
        .ok_or(ServiceError::Unauthenticated)?;
    if !can(session.role, Capability::EditItinerary) {
        return Err(ServiceError::Forbidden);
    }

    let current = db::queries::list_trip_daily_briefings(pool, session.trip_id)
        .await?
        .into_iter()
        .find(|record| record.briefing_date == briefing_date)
        .ok_or(ServiceError::NotFound)?;
    let mut overrides = parse_overrides(current.manual_overrides.clone())?;
    if let Some(value) = request.outfit_advice {
        overrides.outfit_advice = value.map(trim_override);
    }
    if let Some(value) = request.festival_note {
        overrides.festival_note = value.map(trim_override);
    }
    if let Some(value) = request.facts_note {
        overrides.facts_note = value.map(trim_override);
    }
    let overrides_value = serde_json::to_value(&overrides)
        .map_err(|_| ServiceError::InvalidRequest("manual overrides could not be serialized"))?;
    let patched = db::queries::patch_trip_daily_briefing_overrides(
        &mut tx,
        session.trip_id,
        briefing_date,
        request.expected_version,
        &overrides_value,
    )
    .await?
    .ok_or(ServiceError::VersionConflict)?;
    tx.commit().await?;

    Ok(record_to_summary(patched))
}

pub fn briefing_window(start_date: Date, end_date: Date) -> Vec<Date> {
    let mut dates = Vec::new();
    let mut cursor = start_date - Duration::days(1);
    let final_date = end_date + Duration::days(1);
    while cursor <= final_date {
        dates.push(cursor);
        cursor = cursor + Duration::days(1);
    }
    dates
}

async fn ensure_briefing_shells(
    pool: &PgPool,
    trip: &TripAuthRecord,
    itinerary_items: &[ItineraryItemRecord],
) -> Result<(), ServiceError> {
    let by_date = first_item_by_date(itinerary_items);
    let mut tx = pool.begin().await?;
    for date in briefing_window(trip.start_date, trip.end_date) {
        let (location_key, location_label, coordinates) = location_for_date(trip, by_date.get(&date));
        db::queries::upsert_trip_daily_briefing_shell(
            &mut tx,
            trip.id,
            date,
            &location_key,
            &location_label,
            coordinates.as_ref(),
        )
        .await?;
    }
    tx.commit().await?;
    Ok(())
}

fn first_item_by_date(items: &[ItineraryItemRecord]) -> BTreeMap<Date, &ItineraryItemRecord> {
    let mut map = BTreeMap::new();
    for item in items {
        map.entry(item.day).or_insert(item);
    }
    map
}

fn location_for_date(
    trip: &TripAuthRecord,
    item: Option<&&ItineraryItemRecord>,
) -> (String, String, Option<serde_json::Value>) {
    if let Some(item) = item {
        let key = format!("itinerary:{}", item.id);
        let label = if item.place.trim().is_empty() {
            trip.destination_label.clone()
        } else {
            item.place.clone()
        };
        return (key, label, item.coordinates.clone());
    }
    (
        format!("destination:{}", trip.destination_label.to_lowercase()),
        trip.destination_label.clone(),
        None,
    )
}

fn record_to_summary(record: TripDailyBriefingRecord) -> TripDailyBriefing {
    TripDailyBriefing {
        trip_id: record.trip_id,
        date: record.briefing_date,
        location_key: record.location_key,
        location_label: record.location_label,
        coordinates: record.coordinates.and_then(|value| serde_json::from_value::<BriefingCoordinates>(value).ok()),
        weather: record.weather.and_then(|value| serde_json::from_value::<WeatherBriefingBlock>(value).ok()),
        holiday: record.holiday.and_then(|value| serde_json::from_value::<TextBriefingBlock>(value).ok()),
        festival: record.festival.and_then(|value| serde_json::from_value::<TextBriefingBlock>(value).ok()),
        facts: record.facts.and_then(|value| serde_json::from_value::<TextBriefingBlock>(value).ok()),
        outfit_advice: record.outfit_advice.and_then(|value| serde_json::from_value::<TextBriefingBlock>(value).ok()),
        manual_overrides: parse_overrides(record.manual_overrides).unwrap_or_default(),
        updated_at: record.updated_at.to_string(),
        version: record.version,
    }
}

fn parse_overrides(value: serde_json::Value) -> Result<DailyBriefingOverrides, ServiceError> {
    serde_json::from_value(value)
        .map_err(|_| ServiceError::InvalidRequest("manual overrides are invalid"))
}

fn trim_override(value: String) -> String {
    value.trim().to_string()
}
```

- [ ] **Step 5: Export app module**

Modify `backend/crates/sagittarius-api/src/app/mod.rs`:

```rust
pub mod daily_briefings;
```

- [ ] **Step 6: Add API handlers**

Create `backend/crates/sagittarius-api/src/api/daily_briefings.rs`:

```rust
use axum::extract::{Path, State};
use axum::Json;
use time::Date;
use uuid::Uuid;

use crate::api::extractors::BearerToken;
use crate::app;
use crate::app::AppState;
use crate::domain::errors::ServiceError;
use crate::domain::patches::PatchDailyBriefingRequest;
use crate::domain::types::TripDailyBriefing;

pub async fn list_daily_briefings(
    State(state): State<AppState>,
    Path(trip_id): Path<Uuid>,
    BearerToken(session_token): BearerToken,
) -> Result<Json<Vec<TripDailyBriefing>>, ServiceError> {
    let briefings = app::daily_briefings::list_daily_briefings(&state.pool, trip_id, &session_token).await?;
    Ok(Json(briefings))
}

pub async fn patch_daily_briefing(
    State(state): State<AppState>,
    Path((trip_id, date)): Path<(Uuid, Date)>,
    BearerToken(session_token): BearerToken,
    Json(request): Json<PatchDailyBriefingRequest>,
) -> Result<Json<TripDailyBriefing>, ServiceError> {
    let briefing = app::daily_briefings::patch_daily_briefing(
        &state.pool,
        trip_id,
        date,
        &session_token,
        request,
    )
    .await?;
    Ok(Json(briefing))
}
```

- [ ] **Step 7: Register API routes**

Modify `backend/crates/sagittarius-api/src/api/mod.rs`:

```rust
pub mod daily_briefings;
```

Add routes inside `router` near other trip scoped routes:

```rust
.route(
    "/api/v1/trips/:trip_id/daily-briefings",
    get(daily_briefings::list_daily_briefings),
)
.route(
    "/api/v1/trips/:trip_id/daily-briefings/:date",
    patch(daily_briefings::patch_daily_briefing),
)
```

- [ ] **Step 8: Run backend contract tests**

Run:

```bash
rtk cargo test -p sagittarius-api --test daily_briefings_contract
```

Expected: PASS.

- [ ] **Step 9: Run route contract tests**

Run:

```bash
rtk cargo test -p sagittarius-api --test route_contract
```

Expected: PASS. If route contract snapshots/listings require updates, add daily briefing routes explicitly and rerun.

- [ ] **Step 10: Commit backend service/routes**

```bash
git add backend/crates/sagittarius-api/src/db/queries.rs \
  backend/crates/sagittarius-api/src/app/daily_briefings.rs \
  backend/crates/sagittarius-api/src/app/mod.rs \
  backend/crates/sagittarius-api/src/api/daily_briefings.rs \
  backend/crates/sagittarius-api/src/api/mod.rs \
  backend/crates/sagittarius-api/tests/daily_briefings_contract.rs \
  backend/crates/sagittarius-api/tests/route_contract.rs
git commit -m "feat: expose trip daily briefings API"
```

---

### Task 3: Frontend API, Types, And Briefing Helpers

**Files:**
- Modify: `frontend/src/trip/types.ts`
- Modify: `frontend/src/trip/api-routes.ts`
- Modify: `frontend/src/trip/api-client.ts`
- Modify: `frontend/src/trip/api-client.test.ts`
- Modify: `frontend/src/trip/api-contract.test.ts`
- Create: `frontend/src/trip/weather-briefings.ts`
- Create: `frontend/src/trip/weather-briefings.test.ts`

- [ ] **Step 1: Add frontend tests for routes and helpers**

Modify `frontend/src/trip/api-contract.test.ts`:

```ts
it("builds daily briefing routes", () => {
  expect(tripApiRoutes.dailyBriefings("trip 1")).toBe("/api/v1/trips/trip%201/daily-briefings");
  expect(tripApiRoutes.dailyBriefing("trip 1", "2026-07-09")).toBe("/api/v1/trips/trip%201/daily-briefings/2026-07-09");
});
```

Create `frontend/src/trip/weather-briefings.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { briefingsForStrip, thaiWeekdayTone, weatherGraphicLabel } from "./weather-briefings";
import type { TripDailyBriefing } from "./types";

const briefing = (date: string, high: number | null, low: number | null): TripDailyBriefing => ({
  tripId: "trip-1",
  date,
  locationKey: "destination:hong-kong",
  locationLabel: "Hong Kong",
  coordinates: null,
  weather: {
    conditionCode: "rain",
    conditionLabel: "Rain",
    temperatureMaxCelsius: high,
    temperatureMinCelsius: low,
    humidityPercent: 82,
    windSpeedKph: 14,
    rainChancePercent: 64,
    meta: { source: "Open-Meteo", sourceUrl: null, fetchedAt: null, expiresAt: null, confidence: "high", unavailableReason: null },
  },
  holiday: null,
  festival: null,
  facts: null,
  outfitAdvice: null,
  manualOverrides: {},
  updatedAt: "2026-06-04T00:00:00Z",
  version: 1,
});

describe("weather briefings", () => {
  it("sorts strip briefings by date", () => {
    expect(briefingsForStrip([briefing("2026-07-11", 33, 28), briefing("2026-07-09", 31, 27)]).map((item) => item.date)).toEqual([
      "2026-07-09",
      "2026-07-11",
    ]);
  });

  it("maps Thai weekday tones from ISO date", () => {
    expect(thaiWeekdayTone("2026-07-12")).toMatchObject({ name: "sunday", className: expect.stringContaining("text-red") });
    expect(thaiWeekdayTone("2026-07-13")).toMatchObject({ name: "monday", className: expect.stringContaining("text-yellow") });
  });

  it("maps weather code to a readable graphic label", () => {
    expect(weatherGraphicLabel("rain")).toBe("Rain");
    expect(weatherGraphicLabel("unknown-code")).toBe("Weather");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
cd frontend && rtk bun run test -- src/trip/api-contract.test.ts src/trip/weather-briefings.test.ts
```

Expected: FAIL because route/helper/types do not exist yet.

- [ ] **Step 3: Add frontend types**

Modify `frontend/src/trip/types.ts`:

```ts
export interface BriefingCoordinates {
  lat: number;
  lng: number;
}

export interface BriefingSourceMeta {
  source: string;
  sourceUrl: string | null;
  fetchedAt: string | null;
  expiresAt: string | null;
  confidence: "high" | "medium" | "low" | "unknown";
  unavailableReason: string | null;
}

export interface WeatherBriefingBlock {
  conditionCode: string;
  conditionLabel: string;
  temperatureMaxCelsius: number | null;
  temperatureMinCelsius: number | null;
  humidityPercent: number | null;
  windSpeedKph: number | null;
  rainChancePercent: number | null;
  meta: BriefingSourceMeta;
}

export interface TextBriefingBlock {
  title: string;
  body: string;
  meta: BriefingSourceMeta;
}

export interface DailyBriefingOverrides {
  outfitAdvice?: string | null;
  festivalNote?: string | null;
  factsNote?: string | null;
}

export interface TripDailyBriefing {
  tripId: string;
  date: string;
  locationKey: string;
  locationLabel: string;
  coordinates: BriefingCoordinates | null;
  weather: WeatherBriefingBlock | null;
  holiday: TextBriefingBlock | null;
  festival: TextBriefingBlock | null;
  facts: TextBriefingBlock | null;
  outfitAdvice: TextBriefingBlock | null;
  manualOverrides: DailyBriefingOverrides;
  updatedAt: string;
  version: number;
}
```

- [ ] **Step 4: Add API routes**

Modify `frontend/src/trip/api-routes.ts`:

```ts
dailyBriefings: (tripId: string) => `/api/v1/trips/${encodePathSegment(tripId)}/daily-briefings`,
dailyBriefing: (tripId: string, date: string) =>
  `/api/v1/trips/${encodePathSegment(tripId)}/daily-briefings/${encodePathSegment(date)}`,
```

- [ ] **Step 5: Add API client methods**

Modify imports in `frontend/src/trip/api-client.ts` to include `TripDailyBriefing`. Add to `TripApiClient`:

```ts
listDailyBriefings(tripId: string, sessionToken: string): Promise<TripDailyBriefing[]>;
patchDailyBriefing(tripId: string, date: string, sessionToken: string, request: PatchDailyBriefingApiRequest): Promise<TripDailyBriefing>;
```

Add request interface:

```ts
export interface PatchDailyBriefingApiRequest {
  clientMutationId: string;
  expectedVersion: number;
  outfitAdvice?: string | null;
  festivalNote?: string | null;
  factsNote?: string | null;
}
```

Add methods in the client implementation:

```ts
async listDailyBriefings(tripId, sessionToken) {
  return request<TripDailyBriefing[]>(tripApiRoutes.dailyBriefings(tripId), {
    baseUrl,
    fetchImpl,
    sessionToken,
  });
},
async patchDailyBriefing(tripId, date, sessionToken, patchRequest) {
  return request<TripDailyBriefing>(tripApiRoutes.dailyBriefing(tripId, date), {
    baseUrl,
    fetchImpl,
    method: "PATCH",
    sessionToken,
    body: patchRequest,
  });
},
```

- [ ] **Step 6: Add helper module**

Create `frontend/src/trip/weather-briefings.ts`:

```ts
import type { TripDailyBriefing } from "./types";

export interface ThaiWeekdayTone {
  name: "sunday" | "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday";
  className: string;
}

const weekdayTones: ThaiWeekdayTone[] = [
  { name: "sunday", className: "text-red-600" },
  { name: "monday", className: "text-yellow-600" },
  { name: "tuesday", className: "text-pink-600" },
  { name: "wednesday", className: "text-green-600" },
  { name: "thursday", className: "text-orange-600" },
  { name: "friday", className: "text-sky-600" },
  { name: "saturday", className: "text-violet-600" },
];

export function briefingsForStrip(briefings: TripDailyBriefing[]): TripDailyBriefing[] {
  return briefings.slice().sort((a, b) => a.date.localeCompare(b.date));
}

export function thaiWeekdayTone(date: string): ThaiWeekdayTone {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return weekdayTones[0];
  return weekdayTones[parsed.getDay()] ?? weekdayTones[0];
}

export function weatherGraphicLabel(conditionCode: string | null | undefined): string {
  switch (conditionCode) {
    case "clear":
    case "sunny":
      return "Sunny";
    case "partly-cloudy":
    case "cloudy":
      return "Cloudy";
    case "rain":
    case "showers":
      return "Rain";
    case "storm":
    case "thunderstorm":
      return "Storm";
    default:
      return "Weather";
  }
}
```

- [ ] **Step 7: Add API client tests**

Modify `frontend/src/trip/api-client.test.ts`:

```ts
it("lists and patches daily briefings through authenticated routes", async () => {
  const fetchImpl = vi.fn()
    .mockResolvedValueOnce(jsonResponse([
      {
        tripId: "trip-1",
        date: "2026-07-09",
        locationKey: "destination:hong-kong",
        locationLabel: "Hong Kong",
        coordinates: null,
        weather: null,
        holiday: null,
        festival: null,
        facts: null,
        outfitAdvice: null,
        manualOverrides: {},
        updatedAt: "2026-06-04T00:00:00Z",
        version: 1,
      },
    ]))
    .mockResolvedValueOnce(jsonResponse({
      tripId: "trip-1",
      date: "2026-07-09",
      locationKey: "destination:hong-kong",
      locationLabel: "Hong Kong",
      coordinates: null,
      weather: null,
      holiday: null,
      festival: null,
      facts: null,
      outfitAdvice: null,
      manualOverrides: { outfitAdvice: "Bring umbrella" },
      updatedAt: "2026-06-04T00:10:00Z",
      version: 2,
    }));
  const client = createTripApiClient({ baseUrl: "https://api.example.test", fetchImpl });

  await expect(client.listDailyBriefings("trip-1", "session-token")).resolves.toHaveLength(1);
  await expect(client.patchDailyBriefing("trip-1", "2026-07-09", "session-token", {
    clientMutationId: "briefing-1",
    expectedVersion: 1,
    outfitAdvice: "Bring umbrella",
  })).resolves.toMatchObject({ manualOverrides: { outfitAdvice: "Bring umbrella" }, version: 2 });

  expect(fetchImpl).toHaveBeenNthCalledWith(1, "https://api.example.test/api/v1/trips/trip-1/daily-briefings", expect.objectContaining({
    headers: expect.objectContaining({ Authorization: "Bearer session-token" }),
  }));
  expect(fetchImpl).toHaveBeenNthCalledWith(2, "https://api.example.test/api/v1/trips/trip-1/daily-briefings/2026-07-09", expect.objectContaining({
    method: "PATCH",
  }));
});
```

Use the existing test helper name for `jsonResponse` in that file.

- [ ] **Step 8: Run frontend unit tests**

Run:

```bash
cd frontend && rtk bun run test -- src/trip/api-contract.test.ts src/trip/api-client.test.ts src/trip/weather-briefings.test.ts
```

Expected: PASS.

- [ ] **Step 9: Commit frontend API foundation**

```bash
git add frontend/src/trip/types.ts \
  frontend/src/trip/api-routes.ts \
  frontend/src/trip/api-client.ts \
  frontend/src/trip/api-client.test.ts \
  frontend/src/trip/api-contract.test.ts \
  frontend/src/trip/weather-briefings.ts \
  frontend/src/trip/weather-briefings.test.ts
git commit -m "feat: add trip weather briefing client"
```

---

### Task 4: Forecast Strip And Drawer Components

**Files:**
- Create: `frontend/src/components/WeatherForecastStrip.tsx`
- Create: `frontend/src/components/WeatherForecastStrip.test.tsx`
- Create: `frontend/src/components/WeatherForecastStrip.stories.tsx`
- Create: `frontend/src/components/WeatherBriefingDrawer.tsx`
- Create: `frontend/src/components/WeatherBriefingDrawer.test.tsx`
- Create: `frontend/src/components/WeatherBriefingDrawer.stories.tsx`

- [ ] **Step 1: Add component tests first**

Create `frontend/src/components/WeatherForecastStrip.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { WeatherForecastStrip } from "./WeatherForecastStrip";
import type { TripDailyBriefing } from "@/src/trip/types";

const briefing = (date: string, high: number, low: number): TripDailyBriefing => ({
  tripId: "trip-1",
  date,
  locationKey: "destination:hong-kong",
  locationLabel: "Hong Kong",
  coordinates: null,
  weather: {
    conditionCode: "rain",
    conditionLabel: "Rain",
    temperatureMaxCelsius: high,
    temperatureMinCelsius: low,
    humidityPercent: 80,
    windSpeedKph: 12,
    rainChancePercent: 60,
    meta: { source: "Open-Meteo", sourceUrl: null, fetchedAt: null, expiresAt: null, confidence: "high", unavailableReason: null },
  },
  holiday: null,
  festival: null,
  facts: null,
  outfitAdvice: null,
  manualOverrides: {},
  updatedAt: "2026-06-04T00:00:00Z",
  version: 1,
});

describe("WeatherForecastStrip", () => {
  it("renders one-line forecast segments with high and low temperature hierarchy", async () => {
    const onSelect = vi.fn();
    render(<WeatherForecastStrip briefings={[briefing("2026-07-12", 33, 28)]} locale="en" selectedDate={null} onSelect={onSelect} />);

    expect(screen.getByRole("button", { name: /Sun Jul 12 Rain 33° 28°/ })).toBeInTheDocument();
    expect(screen.getByText("33°")).toHaveClass("weather-forecast-temp-high");
    expect(screen.getByText("28°")).toHaveClass("weather-forecast-temp-low");

    await userEvent.click(screen.getByRole("button", { name: /Sun Jul 12/ }));
    expect(onSelect).toHaveBeenCalledWith("2026-07-12");
  });
});
```

Create `frontend/src/components/WeatherBriefingDrawer.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { WeatherBriefingDrawer } from "./WeatherBriefingDrawer";
import type { TripDailyBriefing } from "@/src/trip/types";

const briefing: TripDailyBriefing = {
  tripId: "trip-1",
  date: "2026-07-12",
  locationKey: "destination:hong-kong",
  locationLabel: "Hong Kong",
  coordinates: null,
  weather: {
    conditionCode: "rain",
    conditionLabel: "Rain",
    temperatureMaxCelsius: 33,
    temperatureMinCelsius: 28,
    humidityPercent: 82,
    windSpeedKph: 16,
    rainChancePercent: 64,
    meta: { source: "Open-Meteo", sourceUrl: null, fetchedAt: "2026-06-04T00:00:00Z", expiresAt: "2026-06-04T06:00:00Z", confidence: "high", unavailableReason: null },
  },
  holiday: { title: "Public holiday", body: "No public holiday found.", meta: { source: "Nager.Date", sourceUrl: null, fetchedAt: null, expiresAt: null, confidence: "high", unavailableReason: null } },
  festival: null,
  facts: null,
  outfitAdvice: { title: "Outfit advice", body: "Light shirt and compact umbrella.", meta: { source: "Sagittarius", sourceUrl: null, fetchedAt: null, expiresAt: null, confidence: "medium", unavailableReason: null } },
  manualOverrides: {},
  updatedAt: "2026-06-04T00:00:00Z",
  version: 1,
};

describe("WeatherBriefingDrawer", () => {
  it("renders a large drawer and closes from the close button", async () => {
    const onClose = vi.fn();
    render(<WeatherBriefingDrawer briefing={briefing} locale="en" canEdit={false} isOpen onClose={onClose} />);

    expect(screen.getByRole("dialog", { name: /weather briefing/i })).toBeInTheDocument();
    expect(screen.getByText("Rain")).toBeInTheDocument();
    expect(screen.getByText(/Humidity 82%/)).toBeInTheDocument();
    expect(screen.getByText("Light shirt and compact umbrella.")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /close/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it("shows organizer edit controls only when editable", () => {
    const { rerender } = render(<WeatherBriefingDrawer briefing={briefing} locale="en" canEdit={false} isOpen onClose={() => {}} />);
    expect(screen.queryByLabelText(/outfit advice override/i)).not.toBeInTheDocument();

    rerender(<WeatherBriefingDrawer briefing={briefing} locale="en" canEdit isOpen onClose={() => {}} />);
    expect(screen.getByLabelText(/outfit advice override/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run component tests to verify they fail**

Run:

```bash
cd frontend && rtk bun run test -- src/components/WeatherForecastStrip.test.tsx src/components/WeatherBriefingDrawer.test.tsx
```

Expected: FAIL because components do not exist.

- [ ] **Step 3: Implement `WeatherForecastStrip`**

Create `frontend/src/components/WeatherForecastStrip.tsx`:

```tsx
import type { Locale } from "@/src/i18n/types";
import type { TripDailyBriefing } from "@/src/trip/types";
import { briefingsForStrip, thaiWeekdayTone, weatherGraphicLabel } from "@/src/trip/weather-briefings";
import { cn } from "@/src/lib/cn";

interface WeatherForecastStripProps {
  briefings: TripDailyBriefing[];
  locale: Locale;
  selectedDate: string | null;
  onSelect: (date: string) => void;
}

const stripClassName =
  "weather-forecast-strip relative z-[1] mx-auto -mt-[22px] mb-3 w-[94%] overflow-hidden rounded-b-[var(--radius-lg)] border border-t-0 border-white/60 bg-[linear-gradient(180deg,rgb(255_255_255_/_0.46),rgb(255_255_255_/_0.30)),linear-gradient(135deg,rgb(224_242_254_/_0.72),rgb(254_243_199_/_0.54))] px-4 pb-3 pt-9 shadow-[0_18px_42px_rgb(14_116_144_/_0.12)] backdrop-blur-xl max-[767px]:-mt-3 max-[767px]:w-[96%] max-[767px]:px-3 max-[767px]:pt-6";
const rowClassName =
  "weather-forecast-row flex min-w-0 gap-6 overflow-x-auto whitespace-nowrap pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";
const segmentClassName =
  "weather-forecast-segment grid min-w-[72px] cursor-pointer gap-2 border-0 bg-transparent p-0 text-center font-inherit text-[var(--color-text)] transition-[opacity,transform,filter] duration-200 hover:-translate-y-0.5 hover:opacity-95 focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[rgb(14_165_233_/_0.28)]";
const selectedClassName = "weather-forecast-segment--selected drop-shadow-[0_10px_18px_rgb(14_116_144_/_0.20)]";
const dayClassName = "text-[12px] font-black leading-4";
const iconClassName = "weather-forecast-icon text-[30px] leading-none drop-shadow-[0_8px_14px_rgb(15_23_42_/_0.16)]";
const tempClassName = "weather-forecast-temp inline-flex items-baseline justify-center gap-1.5 leading-none";
const tempHighClassName = "weather-forecast-temp-high text-[16px] font-black text-[var(--color-text)]";
const tempLowClassName = "weather-forecast-temp-low text-[16px] font-bold text-[var(--color-text-muted)]";

export function WeatherForecastStrip({ briefings, locale, selectedDate, onSelect }: WeatherForecastStripProps) {
  const sorted = briefingsForStrip(briefings);
  if (!sorted.length) return null;

  return (
    <section className={stripClassName} aria-label={locale === "th" ? "พยากรณ์อากาศรายวัน" : "Daily weather forecast"}>
      <div className={rowClassName}>
        {sorted.map((briefing) => {
          const tone = thaiWeekdayTone(briefing.date);
          const weather = briefing.weather;
          const high = weather?.temperatureMaxCelsius;
          const low = weather?.temperatureMinCelsius;
          const dayLabel = formatDayLabel(briefing.date, locale);
          const condition = weatherGraphicLabel(weather?.conditionCode);
          return (
            <button
              aria-label={`${dayLabel} ${condition} ${formatTemp(high)} ${formatTemp(low)}`}
              className={cn(segmentClassName, selectedDate === briefing.date && selectedClassName)}
              key={`${briefing.date}-${briefing.locationKey}`}
              type="button"
              onClick={() => onSelect(briefing.date)}
            >
              <span className={cn(dayClassName, tone.className)}>{dayLabel}</span>
              <span className={iconClassName} aria-hidden="true">{iconForCondition(weather?.conditionCode)}</span>
              <span className={tempClassName}>
                <span className={tempHighClassName}>{formatTemp(high)}</span>
                <span className={tempLowClassName}>{formatTemp(low)}</span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function formatDayLabel(date: string, locale: Locale): string {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-US", { weekday: "short", month: "short", day: "numeric" }).format(parsed);
}

function formatTemp(value: number | null | undefined): string {
  if (typeof value !== "number") return "--°";
  return `${Math.round(value)}°`;
}

function iconForCondition(code: string | null | undefined): string {
  if (code === "clear" || code === "sunny") return "☀️";
  if (code === "rain" || code === "showers") return "🌧️";
  if (code === "storm" || code === "thunderstorm") return "⛈️";
  if (code === "cloudy" || code === "partly-cloudy") return "☁️";
  return "🌤️";
}
```

- [ ] **Step 4: Implement `WeatherBriefingDrawer`**

Create `frontend/src/components/WeatherBriefingDrawer.tsx`:

```tsx
import type { Locale } from "@/src/i18n/types";
import type { TextBriefingBlock, TripDailyBriefing } from "@/src/trip/types";
import { Button } from "./ui";

interface WeatherBriefingDrawerProps {
  briefing: TripDailyBriefing | null;
  locale: Locale;
  canEdit: boolean;
  isOpen: boolean;
  onClose: () => void;
}

const backdropClassName =
  "weather-briefing-backdrop fixed inset-0 z-50 bg-[rgb(15_23_42_/_0.28)] opacity-100 transition-opacity duration-200 motion-reduce:transition-none";
const drawerClassName =
  "weather-briefing-drawer fixed bottom-0 right-0 top-0 z-[60] grid w-[min(720px,78vw)] grid-rows-[auto_minmax(0,1fr)] overflow-hidden border-l border-[var(--color-border)] bg-[var(--color-surface)] shadow-[-28px_0_70px_rgb(15_23_42_/_0.22)] transition-[transform,opacity] duration-300 ease-out motion-reduce:transition-none max-[767px]:top-auto max-[767px]:h-[88vh] max-[767px]:w-full max-[767px]:rounded-t-[24px] max-[767px]:border-l-0 max-[767px]:border-t max-[767px]:shadow-[0_-24px_70px_rgb(15_23_42_/_0.22)]";
const drawerHeaderClassName = "grid grid-cols-[minmax(0,1fr)_auto] gap-3 border-b border-[var(--color-border)] px-5 py-4";
const drawerBodyClassName = "grid min-h-0 grid-cols-2 gap-3 overflow-auto p-5 max-[767px]:grid-cols-1";
const briefingBlockClassName = "grid content-start gap-1 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-4";
const metaClassName = "text-[11px] font-extrabold leading-4 text-[var(--color-text-muted)]";

export function WeatherBriefingDrawer({ briefing, locale, canEdit, isOpen, onClose }: WeatherBriefingDrawerProps) {
  if (!isOpen || !briefing) return null;
  const weather = briefing.weather;
  const outfitBody = briefing.manualOverrides.outfitAdvice ?? briefing.outfitAdvice?.body ?? emptyText(locale);

  return (
    <>
      <button className={backdropClassName} type="button" aria-label={locale === "th" ? "ปิดพยากรณ์อากาศ" : "Close weather briefing"} onClick={onClose} />
      <section className={drawerClassName} role="dialog" aria-modal="true" aria-label={locale === "th" ? "รายละเอียดพยากรณ์อากาศ" : "Weather briefing"}>
        <header className={drawerHeaderClassName}>
          <div>
            <p className="m-0 text-xs font-black leading-4 text-[var(--color-text-muted)]">{formatFullDate(briefing.date, locale)} · {briefing.locationLabel}</p>
            <h2 className="m-0 mt-1 text-2xl font-black leading-8 text-[var(--color-text)]">{weather?.conditionLabel ?? emptyText(locale)} · {formatTemp(weather?.temperatureMaxCelsius)} {formatTemp(weather?.temperatureMinCelsius)}</h2>
          </div>
          <Button type="button" variant="ghost" onClick={onClose}>{locale === "th" ? "ปิด" : "Close"}</Button>
        </header>

        <div className={drawerBodyClassName}>
          <section className={briefingBlockClassName}>
            <h3 className="m-0 text-sm font-black">Weather</h3>
            <p className="m-0 text-sm font-bold text-[var(--color-text-muted)]">
              Humidity {formatPercent(weather?.humidityPercent)} · Wind {formatSpeed(weather?.windSpeedKph)} · Rain {formatPercent(weather?.rainChancePercent)}
            </p>
            <SourceMeta source={weather?.meta.source} fetchedAt={weather?.meta.fetchedAt} expiresAt={weather?.meta.expiresAt} />
          </section>

          <section className={briefingBlockClassName}>
            <h3 className="m-0 text-sm font-black">Outfit advice</h3>
            <p className="m-0 text-sm font-bold text-[var(--color-text-muted)]">{outfitBody}</p>
            {canEdit ? <textarea aria-label="Outfit advice override" className="mt-2 min-h-20 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-white p-2 text-sm font-bold" defaultValue={briefing.manualOverrides.outfitAdvice ?? ""} /> : null}
          </section>

          <TextBlock title="Holiday" block={briefing.holiday} locale={locale} />
          <TextBlock title="Festival" block={briefing.festival} locale={locale} />
          <TextBlock title="Daily facts" block={briefing.facts} locale={locale} />

          {canEdit ? (
            <section className={briefingBlockClassName}>
              <h3 className="m-0 text-sm font-black">Organizer notes</h3>
              <textarea aria-label="Festival note override" className="min-h-16 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-white p-2 text-sm font-bold" defaultValue={briefing.manualOverrides.festivalNote ?? ""} />
              <textarea aria-label="Facts note override" className="min-h-16 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-white p-2 text-sm font-bold" defaultValue={briefing.manualOverrides.factsNote ?? ""} />
            </section>
          ) : null}
        </div>
      </section>
    </>
  );
}

function TextBlock({ title, block, locale }: { title: string; block: TextBriefingBlock | null; locale: Locale }) {
  return (
    <section className={briefingBlockClassName}>
      <h3 className="m-0 text-sm font-black">{title}</h3>
      <p className="m-0 text-sm font-bold text-[var(--color-text-muted)]">{block?.body ?? emptyText(locale)}</p>
      <SourceMeta source={block?.meta.source} fetchedAt={block?.meta.fetchedAt} expiresAt={block?.meta.expiresAt} />
    </section>
  );
}

function SourceMeta({ source, fetchedAt, expiresAt }: { source?: string; fetchedAt?: string | null; expiresAt?: string | null }) {
  return <p className={metaClassName}>{source ?? "No source"}{fetchedAt ? ` · fetched ${fetchedAt}` : ""}{expiresAt ? ` · expires ${expiresAt}` : ""}</p>;
}

function formatFullDate(date: string, locale: Locale): string {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-US", { dateStyle: "full" }).format(parsed);
}

function formatTemp(value: number | null | undefined): string {
  if (typeof value !== "number") return "--°";
  return `${Math.round(value)}°`;
}

function formatPercent(value: number | null | undefined): string {
  if (typeof value !== "number") return "--";
  return `${value}%`;
}

function formatSpeed(value: number | null | undefined): string {
  if (typeof value !== "number") return "--";
  return `${Math.round(value)} km/h`;
}

function emptyText(locale: Locale): string {
  return locale === "th" ? "ยังไม่มีข้อมูล" : "No data yet";
}
```

- [ ] **Step 5: Add Storybook stories**

Create `frontend/src/components/WeatherForecastStrip.stories.tsx` and `frontend/src/components/WeatherBriefingDrawer.stories.tsx` using the same fixture shape from the tests. Include at least `AtmosphericGlass`, `MobileOverflow`, `OrganizerDrawer`, and `TravelerDrawer` stories.

- [ ] **Step 6: Run component tests and Storybook test project**

Run:

```bash
cd frontend && rtk bun run test -- src/components/WeatherForecastStrip.test.tsx src/components/WeatherBriefingDrawer.test.tsx
cd frontend && rtk bun run test:storybook -- Weather
```

Expected: PASS. If Storybook filtering by `Weather` is not supported, run:

```bash
cd frontend && rtk bun run test:storybook
```

Expected: PASS.

- [ ] **Step 7: Commit components**

```bash
git add frontend/src/components/WeatherForecastStrip.tsx \
  frontend/src/components/WeatherForecastStrip.test.tsx \
  frontend/src/components/WeatherForecastStrip.stories.tsx \
  frontend/src/components/WeatherBriefingDrawer.tsx \
  frontend/src/components/WeatherBriefingDrawer.test.tsx \
  frontend/src/components/WeatherBriefingDrawer.stories.tsx
git commit -m "feat: add weather briefing strip and drawer"
```

---

### Task 5: Wire Overview To Briefings

**Files:**
- Modify: `frontend/src/components/OverviewPage.tsx`
- Modify: `frontend/src/components/OverviewPage.stories.tsx`
- Modify: `frontend/src/components/SagittariusApp.test.tsx`
- Modify: `frontend/src/app/SagittariusApp.tsx`
- Test: `frontend/src/components/OverviewPage.test.tsx` if present, otherwise add focused assertions in `SagittariusApp.test.tsx`

- [ ] **Step 1: Add integration test for Overview strip**

Modify the existing overview/app test that renders `OverviewPage` or `SagittariusApp`:

```tsx
it("shows the weather forecast strip under the overview hero and opens drawer details", async () => {
  render(<OverviewPage
    trip={tripFixture.trip}
    currentMemberId={tripFixture.currentMembers.owner.id}
    expenseSummary={tripFixture.expenseSummaries.owner}
    items={tripFixture.planItems}
    suggestions={tripFixture.suggestions}
    tasks={tripFixture.tasks}
    dailyBriefings={[weatherBriefingFixture("2026-07-12", 33, 28)]}
    onCreateTask={() => {}}
    onToggleTaskStatus={() => {}}
  />);

  expect(screen.getByLabelText(/daily weather forecast/i)).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: /33° 28°/ }));
  expect(screen.getByRole("dialog", { name: /weather briefing/i })).toBeInTheDocument();
});
```

Add `weatherBriefingFixture` in the test file or import from a fixture helper.

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
cd frontend && rtk bun run test -- src/components/SagittariusApp.test.tsx src/components/OverviewPage.test.tsx
```

Expected: FAIL because `OverviewPage` does not accept `dailyBriefings`.

- [ ] **Step 3: Modify `OverviewPage` props and state**

Modify `frontend/src/components/OverviewPage.tsx`:

```tsx
import type { TripDailyBriefing } from "@/src/trip/types";
import { WeatherForecastStrip } from "./WeatherForecastStrip";
import { WeatherBriefingDrawer } from "./WeatherBriefingDrawer";
```

Add prop:

```ts
dailyBriefings?: TripDailyBriefing[];
```

Add state:

```ts
const [selectedBriefingDate, setSelectedBriefingDate] = useState<string | null>(null);
const selectedBriefing = dailyBriefings?.find((briefing) => briefing.date === selectedBriefingDate) ?? null;
```

Render after `OverviewHero`:

```tsx
<WeatherForecastStrip
  briefings={dailyBriefings ?? []}
  locale={locale}
  selectedDate={selectedBriefingDate}
  onSelect={setSelectedBriefingDate}
/>
<WeatherBriefingDrawer
  briefing={selectedBriefing}
  locale={locale}
  canEdit={isManagerLens}
  isOpen={Boolean(selectedBriefing)}
  onClose={() => setSelectedBriefingDate(null)}
/>
```

- [ ] **Step 4: Update Storybook args**

Modify `frontend/src/components/OverviewPage.stories.tsx` and add `dailyBriefings` fixtures to `Owner.args`.

- [ ] **Step 5: Wire app-level loading**

Modify `frontend/src/app/SagittariusApp.tsx` where the cockpit/trip data loads. Add state:

```ts
const [dailyBriefings, setDailyBriefings] = useState<TripDailyBriefing[]>([]);
```

After a member session and trip id are available, call:

```ts
tripClient.listDailyBriefings(trip.id, session.sessionToken)
  .then(setDailyBriefings)
  .catch(() => setDailyBriefings([]));
```

Pass `dailyBriefings={dailyBriefings}` to `OverviewPage`. If this app already centralizes async loading in a repository, put the call there instead of adding duplicate effect logic.

- [ ] **Step 6: Run overview/app tests**

Run:

```bash
cd frontend && rtk bun run test -- src/components/SagittariusApp.test.tsx src/components/OverviewPage.test.tsx src/components/WeatherForecastStrip.test.tsx src/components/WeatherBriefingDrawer.test.tsx
```

Expected: PASS.

- [ ] **Step 7: Commit overview wiring**

```bash
git add frontend/src/components/OverviewPage.tsx \
  frontend/src/components/OverviewPage.stories.tsx \
  frontend/src/components/SagittariusApp.test.tsx \
  frontend/src/app/SagittariusApp.tsx
git commit -m "feat: show weather briefing on overview"
```

---

### Task 6: Verification And Real System QA

**Files:**
- Modify only files required by failures found during verification.
- Read: `/Users/xiivth/.codex/skills/feature-qa/SKILL.md`

- [ ] **Step 1: Run backend focused tests**

Run:

```bash
rtk cargo test -p sagittarius-api --test daily_briefings_contract
rtk cargo test -p sagittarius-api --test route_contract
rtk cargo test -p sagittarius-api --test schema_contract
```

Expected: PASS.

- [ ] **Step 2: Run frontend focused tests**

Run:

```bash
cd frontend && rtk bun run test -- \
  src/trip/api-contract.test.ts \
  src/trip/api-client.test.ts \
  src/trip/weather-briefings.test.ts \
  src/components/WeatherForecastStrip.test.tsx \
  src/components/WeatherBriefingDrawer.test.tsx \
  src/components/SagittariusApp.test.tsx
```

Expected: PASS.

- [ ] **Step 3: Run broader checks**

Run:

```bash
rtk cargo test -p sagittarius-api
cd frontend && rtk bun run lint
cd frontend && rtk bun run typecheck
cd frontend && rtk bun run test
cd frontend && rtk bun run test:storybook
```

Expected: PASS.

- [ ] **Step 4: Run real system feature QA**

Use `/Users/xiivth/.codex/skills/feature-qa/SKILL.md`. Minimum browser evidence:

```bash
cd frontend && rtk bun run dev
```

Open `/trips/:id` with real backend/dev data. Verify:

- Forecast strip appears directly below hero with hero overlap.
- Strip stays one line and horizontally scrolls when narrow.
- Thai weekday color is on day/date text.
- Temperature high is darker/heavier than low.
- Drawer opens with slide animation and backdrop fade.
- Drawer closes by button and backdrop.
- Desktop drawer width is large enough for two-column content.
- Mobile drawer becomes bottom sheet.
- Reduced motion setting does not rely on movement.
- Organizer can see edit controls.
- Traveler/viewer cannot see edit controls.
- Browser console has no errors.
- Network panel has no failed daily briefing requests except intentionally simulated source failures.
- Reload/direct route still renders the overview.

- [ ] **Step 5: Commit verification fixes**

When verification changes files, stage the exact files changed by the verification fix. Example for a drawer animation class fix:

```bash
git add frontend/src/components/WeatherBriefingDrawer.tsx frontend/src/components/WeatherBriefingDrawer.test.tsx
git commit -m "fix: stabilize weather briefing QA"
```

When verification changes no files, do not create an empty commit.

---

## Self-Review Notes

- Spec coverage: plan includes overview placement, Atmospheric Glass styling, one-line overflow, Thai weekday colors on text, high/low hierarchy, large responsive drawer, animation, cached backend schema, manual overrides, role permissions, expiry metadata fields, API routes, Storybook, and real system QA.
- External providers: first implementation stores source/freshness fields and deterministic shells. Actual Open-Meteo/Nager.Date fetch clients can be added after the cache/API/UI path is proven, without changing user-facing contracts.
- Scope control: paid event providers, notifications, image sourcing, and wider overview redesign remain out of scope.
