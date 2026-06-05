# Map Place Resolution Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build full-stack place resolution so added itinerary activities can be resolved to persisted coordinates and displayed correctly on the map.

**Architecture:** Keep OpenFreeMap and MapLibre as the map renderer, add backend-owned place resolution for AI/Brave/Nominatim, and persist location writes through the existing itinerary item API. The UI resolves on submit, confirms only ambiguous results, and saves unresolved activities without blocking trip planning.

**Tech Stack:** Rust/Axum/SQLx/Postgres backend, React/Next/Vitest frontend, MapLibre GL JS, OpenFreeMap tiles, free Nominatim geocoding with backend cache/rate-limit, OpenRouter/agy plus Brave Search as evidence providers.

---

## File Structure

- Modify `backend/crates/sagittarius-api/src/domain/types.rs`: add reusable place-resolution response types if backend responses need shared serialization.
- Modify `backend/crates/sagittarius-api/src/domain/patches.rs`: accept itinerary `address`, `latitude`, and `longitude` in create/patch requests; add place resolve request structs.
- Modify `backend/crates/sagittarius-api/src/db/models.rs`: add `address`, `latitude`, and `longitude` to `NewItineraryItem`.
- Modify `backend/crates/sagittarius-api/src/db/queries.rs`: write and patch itinerary address/coordinates.
- Create `backend/crates/sagittarius-api/src/app/place_resolution.rs`: provider orchestration, cache key normalization, confidence rules, and test seams.
- Create `backend/crates/sagittarius-api/src/api/place_resolution.rs`: authenticated `POST /trips/{trip_id}/places/resolve` handler.
- Modify `backend/crates/sagittarius-api/src/app/mod.rs` and `backend/crates/sagittarius-api/src/api/mod.rs`: register the new module and route.
- Test `backend/crates/sagittarius-api/tests/itinerary_patch_contract.rs`: patch coordinates and stale clearing.
- Test `backend/crates/sagittarius-api/tests/itinerary_create_contract.rs`: create item with coordinates.
- Create `backend/crates/sagittarius-api/tests/place_resolution_contract.rs`: endpoint auth, resolved, ambiguous, disabled, and rate-limited behavior using mocked providers.
- Modify `frontend/src/trip/types.ts`: add place resolution types and stale/unresolved advisory codes.
- Modify `frontend/src/trip/api-routes.ts`: add place resolve route.
- Modify `frontend/src/trip/api-client.ts`: add `resolvePlace`, coordinate request fields, and response mapping.
- Test `frontend/src/trip/api-client.test.ts`: verify route/body/mapping for place resolution and coordinate writes.
- Modify `frontend/src/components/StopDialog.tsx`: candidate list, resolving state, choose candidate, save unresolved.
- Test `frontend/src/components/StopDialog.test.tsx`: ambiguous candidate list and fallback submit.
- Modify `frontend/src/app/SagittariusApp.tsx`: add a `placeResolver` prop for local mode and call API-backed place resolution during API mode create/edit/inline place changes.
- Test `frontend/src/components/SagittariusApp.test.tsx`: local/API resolved, ambiguous, unresolved, and stale-coordinate flows.
- Modify `frontend/src/components/RouteMapView.tsx`: unresolved strip/list, marker click callback, path-aware filters.
- Test `frontend/src/components/RouteMapView.test.tsx`: unresolved count/list, marker filtering, marker click.
- Modify `frontend/src/i18n/messages.ts`: Thai/English copy for resolution states.
- Modify `frontend/src/trip/itinerary-import-export.ts` and `frontend/src/trip/itinerary-import-export.test.ts`: keep existing coordinate/address export behavior covered and add a stale-location import assertion.
- Use manual Playwright/browser QA commands in Task 9 rather than adding a new QA script in this plan.

---

### Task 1: Persist Coordinates Through Itinerary Create/Patch

**Files:**
- Modify: `backend/crates/sagittarius-api/src/domain/patches.rs`
- Modify: `backend/crates/sagittarius-api/src/db/models.rs`
- Modify: `backend/crates/sagittarius-api/src/db/queries.rs`
- Modify: `backend/crates/sagittarius-api/src/app/itinerary.rs`
- Test: `backend/crates/sagittarius-api/tests/itinerary_patch_contract.rs`
- Test: `backend/crates/sagittarius-api/tests/itinerary_create_contract.rs`

- [ ] **Step 1: Write failing backend patch test**

Add this test to `backend/crates/sagittarius-api/tests/itinerary_patch_contract.rs`:

```rust
#[sqlx::test(migrations = "../../migrations")]
async fn itinerary_patch_contract_patches_address_and_coordinates(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    let token = support::create_session(&pool, support::ORGANIZER_ID).await;
    let app = support::app(pool.clone());

    let response = app
        .oneshot(
            Request::builder()
                .method(Method::PATCH)
                .uri(format!(
                    "/api/v1/trips/{}/itinerary-items/{}",
                    support::TRIP_ID,
                    support::ITEM_ID
                ))
                .header(header::AUTHORIZATION, format!("Bearer {token}"))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "clientMutationId": "web-patch-location",
                        "expectedVersion": 4,
                        "patch": {
                            "address": "Shop G72, G/F, The Elements, Hong Kong",
                            "latitude": 22.3049,
                            "longitude": 114.1617,
                            "mapLink": "https://www.openstreetmap.org/?mlat=22.3049&mlon=114.1617#map=17/22.3049/114.1617"
                        }
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
    assert_eq!(body["address"], "Shop G72, G/F, The Elements, Hong Kong");
    assert_eq!(body["coordinates"]["lat"], 22.3049);
    assert_eq!(body["coordinates"]["lng"], 114.1617);
    assert_eq!(body["mapLink"].as_str().unwrap().contains("openstreetmap.org"), true);

    let stored: (Option<String>, Option<f64>, Option<f64>) = sqlx::query_as(
        "select address, latitude::float8, longitude::float8 from itinerary_items where id = $1",
    )
    .bind(Uuid::parse_str(support::ITEM_ID).unwrap())
    .fetch_one(&pool)
    .await
    .unwrap();
    assert_eq!(stored.0.as_deref(), Some("Shop G72, G/F, The Elements, Hong Kong"));
    assert_eq!(stored.1, Some(22.3049));
    assert_eq!(stored.2, Some(114.1617));
}
```

- [ ] **Step 2: Write failing backend create test**

Create `backend/crates/sagittarius-api/tests/itinerary_create_contract.rs` with this test:

```rust
mod support;

use axum::body::{Body, to_bytes};
use http::{Method, Request, StatusCode, header};
use serde_json::{Value, json};
use tower::ServiceExt;

#[sqlx::test(migrations = "../../migrations")]
async fn itinerary_create_contract_accepts_address_and_coordinates(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    let token = support::create_session(&pool, support::ORGANIZER_ID).await;
    let app = support::app(pool);

    let response = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/trips/{}/itinerary-items", support::TRIP_ID))
                .header(header::AUTHORIZATION, format!("Bearer {token}"))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "clientMutationId": "web-create-location",
                        "planVariantId": support::PLAN_ID,
                        "day": "2026-06-19",
                        "startTime": "11:30",
                        "activity": "Coffee break",
                        "activityType": "food",
                        "place": "Blue Bottle Coffee",
                        "address": "K11 Musea, Tsim Sha Tsui, Hong Kong",
                        "latitude": 22.2939,
                        "longitude": 114.1698,
                        "mapLink": "https://www.openstreetmap.org/?mlat=22.2939&mlon=114.1698#map=17/22.2939/114.1698",
                        "durationMinutes": 45,
                        "transportation": "walk",
                        "note": "near the waterfront"
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
    assert_eq!(body["activity"], "Coffee break");
    assert_eq!(body["address"], "K11 Musea, Tsim Sha Tsui, Hong Kong");
    assert_eq!(body["coordinates"]["lat"], 22.2939);
    assert_eq!(body["coordinates"]["lng"], 114.1698);
}
```

- [ ] **Step 3: Run tests to verify they fail**

Run:

```bash
cd backend
cargo test -p sagittarius-api --test itinerary_patch_contract itinerary_patch_contract_patches_address_and_coordinates -- --exact
cargo test -p sagittarius-api --test itinerary_create_contract itinerary_create_contract_accepts_address_and_coordinates -- --exact
```

Expected: both fail because `address`, `latitude`, and `longitude` are ignored or rejected in create/patch write paths.

- [ ] **Step 4: Implement request fields and DB writes**

In `backend/crates/sagittarius-api/src/domain/patches.rs`, add fields:

```rust
pub struct CreateItineraryItemRequest {
    pub client_mutation_id: String,
    pub plan_variant_id: Uuid,
    pub path_group_id: Option<String>,
    pub path_id: Option<String>,
    pub path_name: Option<String>,
    pub path_role: Option<String>,
    pub day: Date,
    pub start_time: Option<String>,
    pub activity: String,
    pub activity_type: String,
    pub place: String,
    pub map_link: Option<String>,
    pub address: Option<String>,
    pub latitude: Option<f64>,
    pub longitude: Option<f64>,
    pub duration_minutes: Option<i32>,
    pub transportation: Option<String>,
    pub note: Option<String>,
}

pub struct ItineraryItemPatch {
    pub path_group_id: Option<String>,
    pub path_id: Option<String>,
    pub path_name: Option<String>,
    pub path_role: Option<String>,
    pub day: Option<Date>,
    pub start_time: Option<String>,
    pub duration_minutes: Option<i32>,
    pub activity: Option<String>,
    pub activity_type: Option<String>,
    pub place: Option<String>,
    pub map_link: Option<String>,
    pub address: Option<String>,
    pub latitude: Option<f64>,
    pub longitude: Option<f64>,
    pub transportation: Option<String>,
    pub note: Option<String>,
}
```

Use explicit-null fields for patch location data so the app can clear stale coordinates. In `ItineraryItemPatch`, use:

```rust
#[serde(default, deserialize_with = "deserialize_nullable_string_patch")]
pub address: Option<Option<String>>,
#[serde(default, deserialize_with = "deserialize_nullable_f64_patch")]
pub latitude: Option<Option<f64>>,
#[serde(default, deserialize_with = "deserialize_nullable_f64_patch")]
pub longitude: Option<Option<f64>>,
```

Keep `CreateItineraryItemRequest` as `Option<String>` and `Option<f64>` because create does not need to distinguish omitted from null. Add validation in `ItineraryItemPatch::validate()` and `CreateItineraryItemRequest::validate()`:

```rust
validate_coordinates(self.latitude.flatten(), self.longitude.flatten())?;
validate_coordinates(self.latitude, self.longitude)?;
```

The first line belongs in `ItineraryItemPatch::validate()` and the second line belongs in `CreateItineraryItemRequest::validate()`. Define near the existing deserializers and validators:

```rust
fn deserialize_nullable_string_patch<'de, D>(deserializer: D) -> Result<Option<Option<String>>, D::Error>
where
    D: Deserializer<'de>,
{
    Option::<String>::deserialize(deserializer).map(Some)
}

fn deserialize_nullable_f64_patch<'de, D>(deserializer: D) -> Result<Option<Option<f64>>, D::Error>
where
    D: Deserializer<'de>,
{
    Option::<f64>::deserialize(deserializer).map(Some)
}
```

```rust
fn validate_coordinates(latitude: Option<f64>, longitude: Option<f64>) -> Result<(), ServiceError> {
    if latitude.is_some() != longitude.is_some() {
        return Err(ServiceError::InvalidRequest(
            "latitude and longitude must be provided together",
        ));
    }
    if latitude.is_some_and(|value| !(-90.0..=90.0).contains(&value))
        || longitude.is_some_and(|value| !(-180.0..=180.0).contains(&value))
    {
        return Err(ServiceError::InvalidRequest("coordinates are out of range"));
    }
    Ok(())
}
```

In `backend/crates/sagittarius-api/src/db/models.rs`, extend `NewItineraryItem<'a>`:

```rust
pub struct NewItineraryItem<'a> {
    pub id: Uuid,
    pub trip_id: Uuid,
    pub plan_variant_id: Uuid,
    pub path_group_id: Option<&'a str>,
    pub path_id: Option<&'a str>,
    pub path_name: Option<&'a str>,
    pub path_role: Option<&'a str>,
    pub day: time::Date,
    pub sort_order: i32,
    pub start_time: Option<&'a str>,
    pub activity: &'a str,
    pub activity_type: &'a str,
    pub place: &'a str,
    pub map_link: &'a str,
    pub address: Option<&'a str>,
    pub latitude: Option<f64>,
    pub longitude: Option<f64>,
    pub duration_minutes: Option<i32>,
    pub transportation: &'a str,
    pub note: &'a str,
    pub created_by: Uuid,
}
```

In `backend/crates/sagittarius-api/src/db/queries.rs`, update `insert_itinerary_item` SQL to include `address, latitude, longitude` and bind `item.address`, `item.latitude`, `item.longitude`. Update `update_itinerary_item` SQL to patch or clear location fields by passing presence flags and values:

```sql
address = case when $15 then $16 else address end,
latitude = case when $17 then $18 else latitude end,
longitude = case when $19 then $20 else longitude end,
transportation = coalesce($21, transportation),
note = coalesce($22, note),
version = $23,
updated_at = now()
```

Bind the patch presence booleans and flattened values:

```rust
.bind(patch.address.is_some())
.bind(patch.address.as_ref().and_then(|value| value.as_deref()))
.bind(patch.latitude.is_some())
.bind(patch.latitude.flatten())
.bind(patch.longitude.is_some())
.bind(patch.longitude.flatten())
```

Adjust the other bind indexes so `transportation`, `note`, and `next_version` still map correctly.

In `backend/crates/sagittarius-api/src/app/itinerary.rs`, pass create fields:

```rust
address: request.address.as_deref(),
latitude: request.latitude,
longitude: request.longitude,
```

- [ ] **Step 5: Run focused backend tests**

Run:

```bash
cd backend
cargo test -p sagittarius-api --test itinerary_patch_contract itinerary_patch_contract_patches_address_and_coordinates -- --exact
cargo test -p sagittarius-api --test itinerary_create_contract itinerary_create_contract_accepts_address_and_coordinates -- --exact
```

Expected: PASS.

- [ ] **Step 6: Commit**

Run:

```bash
git add backend/crates/sagittarius-api/src/domain/patches.rs backend/crates/sagittarius-api/src/db/models.rs backend/crates/sagittarius-api/src/db/queries.rs backend/crates/sagittarius-api/src/app/itinerary.rs backend/crates/sagittarius-api/tests/itinerary_patch_contract.rs backend/crates/sagittarius-api/tests/itinerary_create_contract.rs
git commit -m "feat: persist itinerary coordinates"
```

---

### Task 2: Add Backend Place Resolution Endpoint With Test Providers

**Files:**
- Create: `backend/crates/sagittarius-api/src/app/place_resolution.rs`
- Create: `backend/crates/sagittarius-api/src/api/place_resolution.rs`
- Modify: `backend/crates/sagittarius-api/src/app/mod.rs`
- Modify: `backend/crates/sagittarius-api/src/api/mod.rs`
- Test: `backend/crates/sagittarius-api/tests/place_resolution_contract.rs`

- [ ] **Step 1: Write endpoint contract tests**

Create `backend/crates/sagittarius-api/tests/place_resolution_contract.rs`:

```rust
mod support;

use axum::body::{Body, to_bytes};
use http::{Method, Request, StatusCode, header};
use serde_json::{Value, json};
use tower::ServiceExt;

#[sqlx::test(migrations = "../../migrations")]
async fn place_resolution_returns_unresolved_when_disabled(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    let token = support::create_session(&pool, support::ORGANIZER_ID).await;
    let app = support::app(pool);

    let response = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/trips/{}/places/resolve", support::TRIP_ID))
                .header(header::AUTHORIZATION, format!("Bearer {token}"))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "clientMutationId": "resolve-disabled",
                        "activity": "Dim Dim Sum",
                        "placeHint": "ติ่มซำ แถว Elements",
                        "destinationLabel": "Hong Kong + Shenzhen",
                        "countries": ["HK"],
                        "day": "2026-06-19"
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
    assert_eq!(body["status"], "unresolved");
    assert_eq!(body["candidates"].as_array().unwrap().len(), 0);
}

#[sqlx::test(migrations = "../../migrations")]
async fn place_resolution_requires_edit_itinerary_capability(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    let token = support::create_session(&pool, support::VIEWER_ID).await;
    let app = support::app(pool);

    let response = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/trips/{}/places/resolve", support::TRIP_ID))
                .header(header::AUTHORIZATION, format!("Bearer {token}"))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "clientMutationId": "resolve-forbidden",
                        "activity": "Coffee",
                        "placeHint": "Central",
                        "destinationLabel": "Hong Kong",
                        "countries": ["HK"],
                        "day": "2026-06-19"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::FORBIDDEN);
}
```

- [ ] **Step 2: Run tests to verify route fails**

Run:

```bash
cd backend
cargo test -p sagittarius-api --test place_resolution_contract -- --nocapture
```

Expected: first test fails with `404` until the route is registered.

- [ ] **Step 3: Implement request/response and disabled endpoint**

Create `backend/crates/sagittarius-api/src/app/place_resolution.rs`:

```rust
use serde::{Deserialize, Serialize};
use time::Date;
use uuid::Uuid;

use crate::app::auth;
use crate::db;
use crate::db::PgPool;
use crate::domain::capabilities::can;
use crate::domain::errors::ServiceError;
use crate::domain::types::Capability;

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ResolvePlaceRequest {
    pub client_mutation_id: String,
    pub activity: String,
    pub place_hint: String,
    pub destination_label: String,
    pub countries: Vec<String>,
    pub day: Date,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PlaceCandidate {
    pub name: String,
    pub address: String,
    pub coordinates: PlaceCoordinates,
    pub map_link: String,
    pub confidence: f64,
    pub source: String,
    pub evidence: Vec<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PlaceCoordinates {
    pub lat: f64,
    pub lng: f64,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ResolvePlaceResponse {
    pub status: &'static str,
    pub candidates: Vec<PlaceCandidate>,
}

pub async fn resolve_place(
    pool: &PgPool,
    trip_id: Uuid,
    session_token: &str,
    request: ResolvePlaceRequest,
) -> Result<ResolvePlaceResponse, ServiceError> {
    if request.client_mutation_id.trim().is_empty()
        || request.place_hint.trim().is_empty()
        || request.activity.trim().is_empty()
    {
        return Err(ServiceError::InvalidRequest("place resolution request is incomplete"));
    }

    let token_hash = auth::hash_session_token(session_token)?;
    let mut tx = pool.begin().await?;
    let session = db::queries::find_active_member_session_in_tx(&mut tx, trip_id, &token_hash)
        .await?
        .ok_or(ServiceError::Unauthenticated)?;
    if !can(session.role, Capability::EditItinerary) {
        return Err(ServiceError::Forbidden);
    }
    tx.commit().await?;

    if !place_resolution_enabled() {
        return Ok(ResolvePlaceResponse { status: "unresolved", candidates: Vec::new() });
    }

    Ok(ResolvePlaceResponse { status: "unresolved", candidates: Vec::new() })
}

fn place_resolution_enabled() -> bool {
    std::env::var("PLACE_RESOLUTION_ENABLED")
        .map(|value| matches!(value.to_ascii_lowercase().as_str(), "1" | "true" | "yes" | "on"))
        .unwrap_or(false)
}
```

Create `backend/crates/sagittarius-api/src/api/place_resolution.rs`:

```rust
use axum::Json;
use axum::extract::{Path, State};
use uuid::Uuid;

use crate::api::extractors::BearerToken;
use crate::app;
use crate::app::AppState;
use crate::domain::errors::ServiceError;

pub async fn resolve_place(
    State(state): State<AppState>,
    Path(trip_id): Path<Uuid>,
    BearerToken(session_token): BearerToken,
    Json(request): Json<app::place_resolution::ResolvePlaceRequest>,
) -> Result<Json<app::place_resolution::ResolvePlaceResponse>, ServiceError> {
    Ok(Json(
        app::place_resolution::resolve_place(&state.pool, trip_id, &session_token, request).await?,
    ))
}
```

Register modules:

```rust
// backend/crates/sagittarius-api/src/app/mod.rs
pub mod place_resolution;

// backend/crates/sagittarius-api/src/api/mod.rs
pub mod place_resolution;
```

Add route in `api_v1()`:

```rust
.route(
    "/trips/{trip_id}/places/resolve",
    post(place_resolution::resolve_place),
)
```

- [ ] **Step 4: Run endpoint tests**

Run:

```bash
cd backend
cargo test -p sagittarius-api --test place_resolution_contract -- --nocapture
```

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```bash
git add backend/crates/sagittarius-api/src/app/place_resolution.rs backend/crates/sagittarius-api/src/api/place_resolution.rs backend/crates/sagittarius-api/src/app/mod.rs backend/crates/sagittarius-api/src/api/mod.rs backend/crates/sagittarius-api/tests/place_resolution_contract.rs
git commit -m "feat: add place resolution endpoint"
```

---

### Task 3: Add Free Geocoder Adapter, Cache, and Confidence Rules

**Files:**
- Modify: `backend/crates/sagittarius-api/src/app/place_resolution.rs`
- Test: `backend/crates/sagittarius-api/tests/place_resolution_contract.rs`

- [ ] **Step 1: Add provider behavior tests**

Append to `backend/crates/sagittarius-api/tests/place_resolution_contract.rs`:

```rust
#[test]
fn place_resolution_classifies_candidates_by_confidence() {
    use sagittarius_api::app::place_resolution::{
        classify_candidates_for_tests, PlaceCandidate, PlaceCoordinates,
    };

    let high = PlaceCandidate {
        name: "Dim Dim Sum".to_string(),
        address: "The Elements, Hong Kong".to_string(),
        coordinates: PlaceCoordinates { lat: 22.3049, lng: 114.1617 },
        map_link: "https://www.openstreetmap.org/?mlat=22.3049&mlon=114.1617#map=17/22.3049/114.1617".to_string(),
        confidence: 0.92,
        source: "nominatim".to_string(),
        evidence: vec!["brave: Dim Dim Sum Elements".to_string()],
    };
    let low = PlaceCandidate { confidence: 0.61, ..high.clone() };

    assert_eq!(classify_candidates_for_tests(&[high]).status, "resolved");
    assert_eq!(classify_candidates_for_tests(&[low]).status, "ambiguous");
    assert_eq!(classify_candidates_for_tests(&[]).status, "unresolved");
}
```

- [ ] **Step 2: Run test to verify helper is missing**

Run:

```bash
cd backend
cargo test -p sagittarius-api --test place_resolution_contract place_resolution_classifies_candidates_by_confidence -- --exact
```

Expected: FAIL because `classify_candidates_for_tests` is not defined.

- [ ] **Step 3: Implement classification and map link helper**

In `backend/crates/sagittarius-api/src/app/place_resolution.rs`, add:

```rust
const HIGH_CONFIDENCE_THRESHOLD: f64 = 0.85;

pub fn classify_candidates(candidates: Vec<PlaceCandidate>) -> ResolvePlaceResponse {
    let status = match candidates.as_slice() {
        [] => "unresolved",
        [candidate] if candidate.confidence >= HIGH_CONFIDENCE_THRESHOLD => "resolved",
        _ => "ambiguous",
    };
    ResolvePlaceResponse { status, candidates }
}

pub fn osm_map_link(lat: f64, lng: f64) -> String {
    format!("https://www.openstreetmap.org/?mlat={lat:.7}&mlon={lng:.7}#map=17/{lat:.7}/{lng:.7}")
}

#[cfg(test)]
pub fn classify_candidates_for_tests(candidates: &[PlaceCandidate]) -> ResolvePlaceResponse {
    classify_candidates(candidates.to_vec())
}
```

- [ ] **Step 4: Add Nominatim response parsing unit test**

Add inside `backend/crates/sagittarius-api/src/app/place_resolution.rs`:

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn nominatim_response_maps_to_candidate() {
        let raw = serde_json::json!([{
            "display_name": "The Elements, Austin Road West, Hong Kong",
            "name": "The Elements",
            "lat": "22.3049000",
            "lon": "114.1617000",
            "osm_type": "way",
            "osm_id": 123
        }]);

        let candidates = parse_nominatim_candidates(&raw, 0.9, vec!["brave: The Elements".to_string()]);
        assert_eq!(candidates.len(), 1);
        assert_eq!(candidates[0].name, "The Elements");
        assert_eq!(candidates[0].coordinates.lat, 22.3049);
        assert_eq!(candidates[0].coordinates.lng, 114.1617);
        assert_eq!(candidates[0].source, "nominatim");
    }
}
```

- [ ] **Step 5: Implement Nominatim parser**

Add:

```rust
fn parse_nominatim_candidates(
    value: &serde_json::Value,
    confidence: f64,
    evidence: Vec<String>,
) -> Vec<PlaceCandidate> {
    value
        .as_array()
        .into_iter()
        .flatten()
        .filter_map(|entry| {
            let lat = entry.get("lat")?.as_str()?.parse::<f64>().ok()?;
            let lng = entry.get("lon")?.as_str()?.parse::<f64>().ok()?;
            if !(-90.0..=90.0).contains(&lat) || !(-180.0..=180.0).contains(&lng) {
                return None;
            }
            let address = entry.get("display_name")?.as_str()?.to_string();
            let name = entry
                .get("name")
                .and_then(|name| name.as_str())
                .filter(|name| !name.trim().is_empty())
                .unwrap_or(address.as_str())
                .to_string();
            Some(PlaceCandidate {
                name,
                address,
                coordinates: PlaceCoordinates { lat, lng },
                map_link: osm_map_link(lat, lng),
                confidence,
                source: "nominatim".to_string(),
                evidence: evidence.clone(),
            })
        })
        .take(3)
        .collect()
}
```

- [ ] **Step 6: Run backend place resolution tests**

Run:

```bash
cd backend
cargo test -p sagittarius-api --test place_resolution_contract -- --nocapture
cargo test -p sagittarius-api app::place_resolution::tests -- --nocapture
```

Expected: PASS.

- [ ] **Step 7: Commit**

Run:

```bash
git add backend/crates/sagittarius-api/src/app/place_resolution.rs backend/crates/sagittarius-api/tests/place_resolution_contract.rs
git commit -m "feat: classify free geocoder results"
```

---

### Task 4: Wire Frontend API Types and Routes

**Files:**
- Modify: `frontend/src/trip/types.ts`
- Modify: `frontend/src/trip/api-routes.ts`
- Modify: `frontend/src/trip/api-client.ts`
- Test: `frontend/src/trip/api-client.test.ts`

- [ ] **Step 1: Write failing frontend API client test**

Add to `frontend/src/trip/api-client.test.ts`:

```ts
it("resolves place candidates through the trip-scoped place route", async () => {
  const fetchImpl = vi.fn().mockResolvedValueOnce(jsonResponse({
    status: "resolved",
    candidates: [{
      name: "The Elements",
      address: "Austin Road West, Hong Kong",
      coordinates: { lat: 22.3049, lng: 114.1617 },
      mapLink: "https://www.openstreetmap.org/?mlat=22.3049000&mlon=114.1617000#map=17/22.3049000/114.1617000",
      confidence: 0.92,
      source: "nominatim",
      evidence: ["brave: The Elements"],
    }],
  }));
  const client = createTripApiClient({ baseUrl: "https://api.example.test", fetchImpl });

  const result = await client.resolvePlace(cockpitResponse.trip.id, "session-token", {
    clientMutationId: "resolve-web-1",
    activity: "Dim Dim Sum",
    placeHint: "ติ่มซำ แถว Elements",
    destinationLabel: "Hong Kong + Shenzhen",
    countries: ["HK"],
    day: "2026-06-19",
  });

  expect(fetchImpl).toHaveBeenCalledWith(
    `https://api.example.test/api/v1/trips/${cockpitResponse.trip.id}/places/resolve`,
    expect.objectContaining({
      method: "POST",
      headers: expect.objectContaining({ Authorization: "Bearer session-token" }),
      body: JSON.stringify({
        clientMutationId: "resolve-web-1",
        activity: "Dim Dim Sum",
        placeHint: "ติ่มซำ แถว Elements",
        destinationLabel: "Hong Kong + Shenzhen",
        countries: ["HK"],
        day: "2026-06-19",
      }),
    }),
  );
  expect(result.status).toBe("resolved");
  expect(result.candidates[0].coordinates).toEqual({ lat: 22.3049, lng: 114.1617 });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
cd frontend
bunx vitest --project unit run src/trip/api-client.test.ts -t "resolves place candidates"
```

Expected: FAIL because `resolvePlace` is not on the client.

- [ ] **Step 3: Add types and route**

In `frontend/src/trip/types.ts`, add:

```ts
export type PlaceResolutionStatus = "resolved" | "ambiguous" | "unresolved";

export interface PlaceResolutionCandidate {
  name: string;
  address: string;
  coordinates: ItineraryCoordinates;
  mapLink: string;
  confidence: number;
  source: string;
  evidence: string[];
}

export interface PlaceResolutionRequest {
  clientMutationId: string;
  activity: string;
  placeHint: string;
  destinationLabel: string;
  countries: string[];
  day: string;
}

export interface PlaceResolutionResponse {
  status: PlaceResolutionStatus;
  candidates: PlaceResolutionCandidate[];
}
```

Extend `ValidationWarningCode`:

```ts
| "unresolved-location"
| "stale-location"
```

In `frontend/src/trip/api-routes.ts`, add:

```ts
resolvePlace: (tripId: string) => `/api/v1/trips/${encodeURIComponent(tripId)}/places/resolve`,
```

- [ ] **Step 4: Add API client method and coordinate request fields**

In `frontend/src/trip/api-client.ts`, import the new types and extend `TripApiClient`:

```ts
resolvePlace(tripId: string, sessionToken: string, request: PlaceResolutionRequest): Promise<PlaceResolutionResponse>;
```

Extend request types:

```ts
export interface PatchItineraryItemApiRequest {
  clientMutationId: string;
  expectedVersion: number;
  patch: Partial<Pick<ItineraryItem, "pathGroupId" | "pathId" | "pathName" | "pathRole" | "day" | "startTime" | "durationMinutes" | "activity" | "activityType" | "place" | "transportation" | "note">> & {
    address?: string | null;
    coordinates?: ItineraryCoordinates | null;
    mapLink?: string | null;
  };
}

export interface CreateItineraryItemApiRequest {
  clientMutationId: string;
  planVariantId: string;
  pathGroupId?: string;
  pathId?: string;
  pathName?: string;
  pathRole?: ItineraryItem["pathRole"];
  day: string;
  startTime?: string | null;
  activity: string;
  activityType: ItineraryItem["activityType"];
  place: string;
  mapLink?: string | null;
  address?: string | null;
  coordinates?: ItineraryCoordinates | null;
  durationMinutes?: number | null;
  transportation?: string | null;
  note?: string | null;
}
```

Add helper:

```ts
function serializeItineraryLocation<T extends { coordinates?: ItineraryCoordinates | null; address?: string | null }>(request: T) {
  const { coordinates, ...rest } = request;
  return {
    ...rest,
    ...(request.address !== undefined ? { address: request.address } : {}),
    ...(coordinates !== undefined ? {
      latitude: coordinates?.lat ?? null,
      longitude: coordinates?.lng ?? null,
    } : {}),
  };
}
```

Use the helper in `createItineraryItem`:

```ts
body: JSON.stringify(serializeItineraryLocation(itemRequest)),
```

Use the helper on `patchItineraryItem`:

```ts
body: JSON.stringify({
  ...itemRequest,
  patch: serializeItineraryLocation(itemRequest.patch),
}),
```

Then add:

```ts
resolvePlace(tripId, sessionToken, resolveRequest) {
  return request<PlaceResolutionResponse>(tripApiRoutes.resolvePlace(tripId), {
    method: "POST",
    headers: { Authorization: `Bearer ${sessionToken}` },
    body: JSON.stringify(resolveRequest),
  });
},
```

- [ ] **Step 5: Run frontend API test**

Run:

```bash
cd frontend
bunx vitest --project unit run src/trip/api-client.test.ts -t "resolves place candidates"
```

Expected: PASS.

- [ ] **Step 6: Commit**

Run:

```bash
git add frontend/src/trip/types.ts frontend/src/trip/api-routes.ts frontend/src/trip/api-client.ts frontend/src/trip/api-client.test.ts
git commit -m "feat: add place resolution api client"
```

---

### Task 5: Add StopDialog Candidate Confirmation UI

**Files:**
- Modify: `frontend/src/components/StopDialog.tsx`
- Modify: `frontend/src/i18n/messages.ts`
- Test: `frontend/src/components/StopDialog.test.tsx`

- [ ] **Step 1: Write failing dialog tests**

Add to `frontend/src/components/StopDialog.test.tsx`:

```tsx
it("shows ambiguous place candidates and submits the selected candidate", async () => {
  const onSubmit = vi.fn();
  render(
    <StopDialog
      mode="create"
      onClose={vi.fn()}
      onSubmit={onSubmit}
      placeResolution={{
        state: "ambiguous",
        candidates: [{
          name: "The Elements",
          address: "Austin Road West, Hong Kong",
          coordinates: { lat: 22.3049, lng: 114.1617 },
          mapLink: "https://www.openstreetmap.org/?mlat=22.3049&mlon=114.1617#map=17/22.3049/114.1617",
          confidence: 0.92,
          source: "nominatim",
          evidence: ["brave: The Elements"],
        }],
      }}
    />,
  );

  await userEvent.click(screen.getByRole("button", { name: /เลือก The Elements/i }));
  fireEvent.change(screen.getByLabelText("กิจกรรม"), { target: { value: "Dim Dim Sum" } });
  fireEvent.change(screen.getByLabelText("สถานที่"), { target: { value: "ติ่มซำ แถว Elements" } });
  fireEvent.submit(screen.getByRole("button", { name: "บันทึกกิจกรรม" }).closest("form")!);

  expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
    resolvedPlace: expect.objectContaining({
      name: "The Elements",
      coordinates: { lat: 22.3049, lng: 114.1617 },
    }),
    saveUnresolved: false,
  }));
});

it("allows saving an unresolved place when no candidate is chosen", async () => {
  const onSubmit = vi.fn();
  render(
    <StopDialog
      mode="create"
      onClose={vi.fn()}
      onSubmit={onSubmit}
      placeResolution={{ state: "unresolved", candidates: [] }}
    />,
  );

  fireEvent.change(screen.getByLabelText("กิจกรรม"), { target: { value: "Late snack" } });
  fireEvent.change(screen.getByLabelText("สถานที่"), { target: { value: "near hotel" } });
  await userEvent.click(screen.getByRole("button", { name: /บันทึกแบบยังไม่ระบุพิกัด/i }));

  expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
    activity: "Late snack",
    place: "near hotel",
    saveUnresolved: true,
  }));
});
```

- [ ] **Step 2: Run tests to verify props are missing**

Run:

```bash
cd frontend
bunx vitest --project unit run src/components/StopDialog.test.tsx -t "place candidates|unresolved place"
```

Expected: FAIL because `placeResolution`, `resolvedPlace`, and `saveUnresolved` are not implemented.

- [ ] **Step 3: Add props and form values**

In `frontend/src/components/StopDialog.tsx`, update imports and interfaces:

```ts
import type { ActivityType, ItineraryItem, PlaceResolutionCandidate } from "@/src/trip/types";

export interface StopFormValues {
  day: string;
  pathId?: string;
  startTime: string;
  activity: string;
  activityType: ActivityType;
  place: string;
  durationMinutes: number;
  transportation: string;
  note: string;
  resolvedPlace?: PlaceResolutionCandidate;
  saveUnresolved?: boolean;
}

interface StopDialogProps {
  mode: "create" | "edit";
  endDate?: string;
  initialDay?: string;
  initialItem?: ItineraryItem;
  manualPathOptions?: StopManualPathOption[];
  onClose: () => void;
  onDelete?: () => void;
  onSubmit: (values: StopFormValues) => void;
  placeResolution?: { state: "idle" | "resolving" | "ambiguous" | "unresolved"; candidates: PlaceResolutionCandidate[] };
  startDate?: string;
}
```

Add selected candidate state:

```ts
const [selectedCandidate, setSelectedCandidate] = useState<PlaceResolutionCandidate | undefined>();
```

In `handleSubmit`, include:

```ts
resolvedPlace: selectedCandidate,
saveUnresolved: false,
```

Add unresolved submit helper:

```ts
function submitUnresolved() {
  onSubmit({
    ...values,
    activity: values.activity.trim(),
    place: values.place.trim(),
    transportation: values.transportation.trim(),
    note: values.note.trim(),
    durationMinutes: Math.max(1, Number(values.durationMinutes) || 1),
    resolvedPlace: undefined,
    saveUnresolved: true,
  });
}
```

- [ ] **Step 4: Render candidates**

Add a candidate panel under the place field:

```tsx
{placeResolution?.state === "ambiguous" ? (
  <div className={dialogFieldWideClassName} aria-label={t.stopDialog.placeResolution.candidates}>
    {placeResolution.candidates.map((candidate) => (
      <button
        type="button"
        key={`${candidate.source}:${candidate.name}:${candidate.address}`}
        aria-pressed={selectedCandidate?.mapLink === candidate.mapLink}
        onClick={() => setSelectedCandidate(candidate)}
      >
        <strong>{candidate.name}</strong>
        <span>{candidate.address}</span>
        <span>{candidate.source} · {Math.round(candidate.confidence * 100)}%</span>
      </button>
    ))}
  </div>
) : null}
{placeResolution?.state === "unresolved" ? (
  <Button type="button" variant="ghost" onClick={submitUnresolved}>
    {t.stopDialog.actions.saveUnresolved}
  </Button>
) : null}
```

Add messages in `frontend/src/i18n/messages.ts` for both locales:

```ts
placeResolution: {
  candidates: "Place candidates",
  unresolved: "This place needs location review",
},
actions: {
  saveUnresolved: "Save without coordinates",
}
```

Use the existing nested message shape in the file rather than creating a parallel root.

- [ ] **Step 5: Run dialog tests**

Run:

```bash
cd frontend
bunx vitest --project unit run src/components/StopDialog.test.tsx -t "place candidates|unresolved place|trims submitted values"
```

Expected: PASS.

- [ ] **Step 6: Commit**

Run:

```bash
git add frontend/src/components/StopDialog.tsx frontend/src/components/StopDialog.test.tsx frontend/src/i18n/messages.ts
git commit -m "feat: confirm ambiguous activity places"
```

---

### Task 6: Wire Create/Edit Activity Resolution in SagittariusApp

**Files:**
- Modify: `frontend/src/app/SagittariusApp.tsx`
- Test: `frontend/src/components/SagittariusApp.test.tsx`

- [ ] **Step 1: Extend test API client helper**

In `frontend/src/components/SagittariusApp.test.tsx`, update the local `createApiClientForTrip` helper to include:

```ts
resolvePlace: vi.fn().mockResolvedValue({ status: "unresolved", candidates: [] }),
```

- [ ] **Step 2: Write failing local resolved create test**

Add:

```tsx
it("creates a local activity with resolved coordinates when place resolution is high confidence", async () => {
  const user = userEvent.setup();
  const placeResolver = vi.fn().mockResolvedValue({
    status: "resolved",
    candidates: [{
      name: "The Elements",
      address: "Austin Road West, Hong Kong",
      coordinates: { lat: 22.3049, lng: 114.1617 },
      mapLink: "https://www.openstreetmap.org/?mlat=22.3049&mlon=114.1617#map=17/22.3049/114.1617",
      confidence: 0.92,
      source: "nominatim",
      evidence: ["brave: The Elements"],
    }],
  });
  render(<SagittariusApp placeResolver={placeResolver} />);

  await user.click(screen.getByRole("button", { name: /เพิ่มสถานที่ \/ กิจกรรม/i }));
  fireEvent.change(screen.getByLabelText("กิจกรรม"), { target: { value: "Dim Dim Sum" } });
  fireEvent.change(screen.getByLabelText("สถานที่"), { target: { value: "ติ่มซำ แถว Elements" } });
  await user.click(screen.getByRole("button", { name: "บันทึกกิจกรรม" }));

  await waitFor(() => expect(placeResolver).toHaveBeenCalled());
  await user.click(screen.getByRole("link", { name: "แผนที่" }));
  expect(await screen.findByText(/OpenFreeMap/i)).toBeInTheDocument();
});
```

- [ ] **Step 3: Run test to verify no resolution call**

Run:

```bash
cd frontend
bunx vitest --project unit run src/components/SagittariusApp.test.tsx -t "resolved coordinates"
```

Expected: FAIL because `SagittariusApp` does not accept `placeResolver` and `createStop` does not call place resolution.

- [ ] **Step 4: Add resolver helper in app**

In `frontend/src/app/SagittariusApp.tsx`, add types near the component props:

```ts
type PlaceResolver = (request: PlaceResolutionRequest) => Promise<PlaceResolutionResponse>;
```

Extend `SagittariusAppProps`:

```ts
placeResolver?: PlaceResolver;
```

Inside `SagittariusApp`, derive the resolver:

```ts
const effectivePlaceResolver = useMemo<PlaceResolver | null>(() => {
  if (placeResolver) return placeResolver;
  if (!resolvedApiClient?.resolvePlace || !participantSession) return null;
  return (request) => resolvedApiClient.resolvePlace(trip.id, participantSession.sessionToken, request);
}, [participantSession, placeResolver, resolvedApiClient, trip.id]);
```

Then add helper near `buildMapLink` helpers:

```ts
async function resolveStopPlace(values: StopFormValues, trip: Trip, resolver: PlaceResolver | null) {
  if (values.resolvedPlace) return values.resolvedPlace;
  if (values.saveUnresolved || !resolver) return null;
  const response = await resolver({
    clientMutationId: nextClientMutationId("place-resolve"),
    activity: values.activity,
    placeHint: values.place,
    destinationLabel: trip.destinationLabel,
    countries: trip.countries ?? [],
    day: values.day,
  });
  return response.status === "resolved" ? response.candidates[0] ?? null : null;
}

function locationFieldsFromCandidate(candidate: PlaceResolutionCandidate | null, place: string) {
  return candidate
    ? {
        address: candidate.address,
        coordinates: candidate.coordinates,
        mapLink: candidate.mapLink,
      }
    : {
        address: place,
        coordinates: undefined,
        mapLink: buildMapLink(place),
      };
}
```

Import `PlaceResolutionCandidate`, `PlaceResolutionRequest`, and `PlaceResolutionResponse` from `frontend/src/trip/types.ts`.

- [ ] **Step 5: Use helper in createStop and editStop**

In `createStop`, before building `draftItem`, compute:

```ts
const resolvedPlace = await resolveStopPlace(values, trip, effectivePlaceResolver);
const locationFields = locationFieldsFromCandidate(resolvedPlace, values.place);
```

Use fields in `draftItem`:

```ts
mapLink: locationFields.mapLink,
address: locationFields.address,
coordinates: locationFields.coordinates,
```

Use fields in API create request:

```ts
mapLink: locationFields.mapLink,
address: locationFields.address,
coordinates: locationFields.coordinates,
```

In edit flow, when place changed, use the same helper. If unresolved after place change, clear stale coordinates by sending `coordinates: null` and `address: values.place`.

- [ ] **Step 6: Run focused app tests**

Run:

```bash
cd frontend
bunx vitest --project unit run src/components/SagittariusApp.test.tsx -t "resolved coordinates"
```

Expected: PASS.

- [ ] **Step 7: Commit**

Run:

```bash
git add frontend/src/app/SagittariusApp.tsx frontend/src/components/SagittariusApp.test.tsx
git commit -m "feat: resolve places when saving activities"
```

---

### Task 7: Show Unresolved Stops and Path-Aware Map Controls

**Files:**
- Modify: `frontend/src/components/RouteMapView.tsx`
- Modify: `frontend/src/i18n/messages.ts`
- Test: `frontend/src/components/RouteMapView.test.tsx`

- [ ] **Step 1: Write failing unresolved map test**

Add to `frontend/src/components/RouteMapView.test.tsx`:

```tsx
it("shows unresolved stops without drawing fake live markers for them", async () => {
  const unresolvedItem = {
    ...tripFixture.planItems[0],
    id: "item-unresolved-map",
    activity: "Late snack",
    place: "near hotel",
    address: undefined,
    coordinates: undefined,
    advisories: [{ code: "unresolved-location", label: "Needs location", severity: "warning" }],
  };

  render(
    <RouteMapView
      endDate={tripFixture.trip.endDate}
      items={[tripFixture.planItems[1], unresolvedItem]}
      liveMapEnabled
      startDate={tripFixture.trip.startDate}
      tripName={tripFixture.trip.name}
    />,
  );

  expect(screen.getByText(/ต้องระบุพิกัด/i)).toBeInTheDocument();
  expect(screen.getByText("Late snack")).toBeInTheDocument();
  await waitFor(() => expect(maplibreMock.markers.length).toBe(1));
});
```

- [ ] **Step 2: Run test to verify unresolved UI is missing**

Run:

```bash
cd frontend
bunx vitest --project unit run src/components/RouteMapView.test.tsx -t "unresolved stops"
```

Expected: FAIL because unresolved strip/list is not rendered.

- [ ] **Step 3: Add unresolved derived data and UI**

In `frontend/src/components/RouteMapView.tsx`, add:

```ts
const unresolvedItems = useMemo(
  () => items.filter((item) => !hasCoordinates(item.coordinates)),
  [items],
);
```

Render after day filter:

```tsx
{unresolvedItems.length ? (
  <div className="map-unresolved-strip" aria-label={t.map.unresolvedLabel}>
    <strong>{t.map.unresolvedCount({ count: unresolvedItems.length })}</strong>
    <ul>
      {unresolvedItems.slice(0, 4).map((item) => (
        <li key={item.id}>{item.activity}</li>
      ))}
    </ul>
  </div>
) : null}
```

Add Thai/English messages:

```ts
unresolvedLabel: "Stops needing location",
unresolvedCount: ({ count }: { count: number }) => `${count} stops need coordinates`,
```

For Thai:

```ts
unresolvedLabel: "จุดที่ต้องระบุพิกัด",
unresolvedCount: ({ count }: { count: number }) => `${count} จุดต้องระบุพิกัด`,
```

- [ ] **Step 4: Run map tests**

Run:

```bash
cd frontend
bunx vitest --project unit run src/components/RouteMapView.test.tsx -t "unresolved stops|summarizes route visibility"
```

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```bash
git add frontend/src/components/RouteMapView.tsx frontend/src/components/RouteMapView.test.tsx frontend/src/i18n/messages.ts
git commit -m "feat: show unresolved map stops"
```

---

### Task 8: Preserve Location Data in Import/Export and Inline Edits

**Files:**
- Modify: `frontend/src/trip/itinerary-import-export.ts`
- Test: `frontend/src/trip/itinerary-import-export.test.ts`
- Modify: `frontend/src/app/SagittariusApp.tsx`
- Test: `frontend/src/components/SagittariusApp.test.tsx`

- [ ] **Step 1: Verify export preserves coordinates**

Run:

```bash
cd frontend
bunx vitest --project unit run src/trip/itinerary-import-export.test.ts
```

Expected: PASS if existing coverage already preserves `coordinates` and `address`.

- [ ] **Step 2: Add stale inline edit test**

Add to `frontend/src/components/SagittariusApp.test.tsx`:

```tsx
it("clears stale coordinates when an inline place edit cannot be resolved", async () => {
  const user = userEvent.setup();
  const apiClient = createApiClientForTrip(seedTrip);
  apiClient.resolvePlace = vi.fn().mockResolvedValue({ status: "unresolved", candidates: [] });
  render(<SagittariusApp apiClient={apiClient} />);

  const place = await screen.findByRole("textbox", { name: /แก้ไขสถานที่ Dim Dim Sum/i });
  await user.clear(place);
  await user.type(place, "unknown alley near hotel{Enter}");

  await waitFor(() => expect(apiClient.resolvePlace).toHaveBeenCalled());
  expect(screen.getByText(/unknown alley near hotel/i)).toBeInTheDocument();
});
```

- [ ] **Step 3: Run stale edit test**

Run:

```bash
cd frontend
bunx vitest --project unit run src/components/SagittariusApp.test.tsx -t "clears stale coordinates"
```

Expected: FAIL until inline place edit path clears coordinates or app test helper is updated.

- [ ] **Step 4: Implement stale coordinate clearing**

In `handleUpdateItemInline` in `frontend/src/app/SagittariusApp.tsx`, when `nextPatch.place !== undefined`:

```ts
const resolvedPlace = await resolveStopPlace(
  {
    day: item.day,
    startTime: item.startTime,
    activity: nextPatch.activity ?? item.activity,
    activityType: nextPatch.activityType ?? item.activityType,
    place: nextPatch.place,
    durationMinutes: nextPatch.durationMinutes ?? item.durationMinutes ?? 1,
    transportation: nextPatch.transportation ?? item.transportation,
    note: item.note,
  },
  currentTrip,
  effectivePlaceResolver,
);
const locationFields = locationFieldsFromCandidate(resolvedPlace, nextPatch.place);
nextPatch.address = locationFields.address;
nextPatch.coordinates = locationFields.coordinates ?? null;
nextPatch.mapLink = locationFields.mapLink;
```

Make sure the API patch serializer converts `coordinates: null` into `latitude: null` and `longitude: null`.

- [ ] **Step 5: Run import/export and app stale tests**

Run:

```bash
cd frontend
bunx vitest --project unit run src/trip/itinerary-import-export.test.ts src/components/SagittariusApp.test.tsx -t "coordinates|clears stale coordinates"
```

Expected: PASS.

- [ ] **Step 6: Commit**

Run:

```bash
git add frontend/src/trip/itinerary-import-export.ts frontend/src/trip/itinerary-import-export.test.ts frontend/src/app/SagittariusApp.tsx frontend/src/components/SagittariusApp.test.tsx
git commit -m "feat: keep itinerary location data consistent"
```

---

### Task 9: Final Verification and Browser QA

**Files:**
- Verify: no planned file edits in this task.

- [ ] **Step 1: Run focused backend tests**

Run:

```bash
cd backend
cargo test -p sagittarius-api --test itinerary_create_contract -- --nocapture
cargo test -p sagittarius-api --test itinerary_patch_contract -- --nocapture
cargo test -p sagittarius-api --test place_resolution_contract -- --nocapture
```

Expected: PASS.

- [ ] **Step 2: Run focused frontend tests**

Run:

```bash
cd frontend
bunx vitest --project unit run src/trip/api-client.test.ts src/components/StopDialog.test.tsx src/components/SagittariusApp.test.tsx src/components/RouteMapView.test.tsx src/trip/itinerary-import-export.test.ts
```

Expected: PASS.

- [ ] **Step 3: Run typecheck**

Run:

```bash
cd frontend
bun run typecheck
```

Expected: PASS.

- [ ] **Step 4: Start dev server for browser QA**

Run:

```bash
cd frontend
bun run dev
```

Expected: Next dev server starts on `http://127.0.0.1:5180`.

- [ ] **Step 5: Browser QA flow**

Using Playwright or the Browser plugin if available, verify:

```ts
await page.goto("http://127.0.0.1:5180");
await page.getByRole("button", { name: /เพิ่มสถานที่ \/ กิจกรรม/i }).click();
await page.getByLabel(/กิจกรรม/i).fill("Dim Dim Sum");
await page.getByLabel(/สถานที่/i).fill("ติ่มซำ แถว Elements");
await page.getByRole("button", { name: /บันทึกกิจกรรม/i }).click();
await page.getByRole("link", { name: /แผนที่/i }).click();
await expect(page.getByText(/OpenFreeMap|Live tiles/i)).toBeVisible();
```

Also check mobile:

```ts
await page.setViewportSize({ width: 390, height: 844 });
await expect(page.locator(".route-map-canvas")).toBeVisible();
await expect(page.locator(".map-day-filter")).toBeVisible();
```

Expected: no console errors, no horizontal overflow, map controls visible, unresolved strip does not cover zoom controls.

- [ ] **Step 6: Final status**

Run:

```bash
git status --short
```

Expected: only intended changes are present. Existing unrelated dirty files from before this plan remain untouched unless they were part of implementation.
