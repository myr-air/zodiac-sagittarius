//! Contract tests for day-plan-assist Suggest/Auto-route + Accept/Reject.
//!
//! Phase 2 / T7–T8 (M80VKAX5):
//! - T7: OpenRouter multi-plan Suggest + Auto-route & fill (propose only).
//! - T8: Accept applies via existing itinerary create/patch/reorder/delete
//!   mutations; Reject dismisses; Accept one auto-rejects siblings in the batch.
//! Do not invent a parallel itinerary write API.

mod support;

use axum::body::{Body, to_bytes};
use http::{Method, Request, StatusCode, header};
use serde::{Deserialize, Serialize};
use serde_json::{Value, json};
use tower::ServiceExt;

/// Modes accepted by the day-plan-assist endpoint (UI: Suggest | Auto-route & fill).
const MODE_SUGGEST: &str = "suggest";
const MODE_AUTO_ROUTE: &str = "autoRoute";

/// Option resolution statuses (priorOutcomes + Accept/Reject responses).
const STATUS_OPEN: &str = "open";
const STATUS_ACCEPTED: &str = "accepted";
const STATUS_REJECTED: &str = "rejected";

/// Test hook GREEN must honor so contract tests never call live OpenRouter.
/// Production / default remains OpenRouter via `OPENROUTER_*` (same pattern as
/// `place_resolution` / `itinerary_imports`).
const STUB_PROVIDER_ENV: &str = "SAGITTARIUS_DAY_PLAN_ASSIST_PROVIDER";
const STUB_PROVIDER_VALUE: &str = "stub";

/// Seeded item starts at 60m / version 4; stub suggest option A patches to 90.
const SEEDED_DURATION_MINUTES: i32 = 60;
const ACCEPTED_PATCH_DURATION_MINUTES: i32 = 90;

fn assist_uri() -> String {
    format!("/api/v1/trips/{}/day-plan-assist", support::TRIP_ID)
}

/// T8: discrete Accept / Reject actions under the suggest batch (preferred over
/// PATCH-with-status — Accept applies itinerary mutations; Reject does not).
fn accept_uri(batch_id: &str, option_id: &str) -> String {
    format!(
        "/api/v1/trips/{}/day-plan-assist/batches/{}/options/{}/accept",
        support::TRIP_ID,
        batch_id,
        option_id
    )
}

fn reject_uri(batch_id: &str, option_id: &str) -> String {
    format!(
        "/api/v1/trips/{}/day-plan-assist/batches/{}/options/{}/reject",
        support::TRIP_ID,
        batch_id,
        option_id
    )
}

fn resolution_body(client_mutation_id: &str) -> Body {
    Body::from(
        json!({
            "clientMutationId": client_mutation_id
        })
        .to_string(),
    )
}

/// Expected request body: day targeting + full direct/indirect context packing.
///
/// Direct: active day stops, types, times, geo/pins, selected fields.
/// Indirect: trip + Main/selected plan, other days, members/constraints,
/// linked bookings/estimates/commitments, prior Accept/Reject outcomes.
fn expected_assist_request(mode: &str) -> Value {
    json!({
        "clientMutationId": format!("day-plan-assist-{mode}"),
        "mode": mode,
        "day": "2026-06-19",
        "planVariantId": support::PLAN_ID,
        "selectedItemIds": [support::ITEM_ID],
        "selectedFields": [
            "activity",
            "activityType",
            "place",
            "startTime",
            "endTime",
            "durationMinutes",
            "transportation",
            "coordinates",
            "mapLink",
            "details"
        ],
        "mapPins": [
            {
                "itemId": support::ITEM_ID,
                "lat": 22.3049,
                "lng": 114.1617,
                "label": "The Elements"
            }
        ],
        "context": {
            "direct": {
                "day": "2026-06-19",
                "stops": [
                    {
                        "id": support::ITEM_ID,
                        "activity": "Dim Dim Sum",
                        "activityType": "food",
                        "place": "The Elements",
                        "startTime": "08:30",
                        "endTime": null,
                        "durationMinutes": 60,
                        "transportation": "walk",
                        "mapLink": "https://maps.google.com",
                        "coordinates": { "lat": 22.3049, "lng": 114.1617 },
                        "details": {},
                        "selectedFields": {
                            "activity": "Dim Dim Sum",
                            "activityType": "food",
                            "place": "The Elements"
                        }
                    }
                ],
                "mapPins": [
                    {
                        "itemId": support::ITEM_ID,
                        "lat": 22.3049,
                        "lng": 114.1617,
                        "label": "The Elements"
                    }
                ]
            },
            "indirect": {
                "trip": {
                    "id": support::TRIP_ID,
                    "name": "Hong Kong + Shenzhen Trip",
                    "destinationLabel": "Hong Kong + Shenzhen",
                    "countries": ["HK", "CN"],
                    "startDate": "2026-06-18",
                    "endDate": "2026-06-23"
                },
                "mainPlanId": support::PLAN_ID,
                "selectedPlanId": support::PLAN_ID,
                "otherDays": [
                    {
                        "day": "2026-06-18",
                        "stopCount": 0,
                        "summary": "Arrival / buffer day"
                    }
                ],
                "members": [
                    {
                        "id": support::OWNER_ID,
                        "displayName": "Aom",
                        "role": "owner"
                    },
                    {
                        "id": support::ORGANIZER_ID,
                        "displayName": "Beam",
                        "role": "organizer"
                    }
                ],
                "constraints": [
                    {
                        "kind": "mobility",
                        "note": "Prefer fewer long walking legs"
                    }
                ],
                "linkedBookings": [],
                "linkedEstimates": [],
                "linkedCommitments": [],
                "priorOutcomes": [
                    {
                        "batchId": "018f4e90-0000-7000-8000-0000000000aa",
                        "optionId": "018f4e90-0000-7000-8000-0000000000bb",
                        "status": "rejected",
                        "why": "Too aggressive on transfer time"
                    }
                ]
            }
        }
    })
}

/// Wire contract mirrors — GREEN domain types in
/// `sagittarius_domain::types::day_plan_assist` must serialize to this shape.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
struct DayPlanAssistRequestContract {
    client_mutation_id: String,
    mode: String,
    day: String,
    plan_variant_id: String,
    selected_item_ids: Vec<String>,
    selected_fields: Vec<String>,
    map_pins: Vec<DayPlanAssistMapPinContract>,
    context: DayPlanAssistContextContract,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
struct DayPlanAssistMapPinContract {
    item_id: String,
    lat: f64,
    lng: f64,
    label: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
struct DayPlanAssistContextContract {
    direct: Value,
    indirect: Value,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
struct DayPlanAssistResponseContract {
    batch_id: String,
    trip_id: String,
    day: String,
    plan_variant_id: String,
    mode: String,
    options: Vec<DayPlanAssistOptionContract>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
struct DayPlanAssistOptionContract {
    id: String,
    label: String,
    title: String,
    summary: String,
    /// Required explainability string (UI: Why). Alias `reason` must not replace it.
    why: String,
    affects_item_ids: Vec<String>,
    proposed_mutations: Vec<Value>,
}

/// Wire contract for Accept / Reject responses (T8).
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
struct DayPlanAssistResolutionRequestContract {
    client_mutation_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
struct DayPlanAssistResolutionResponseContract {
    batch_id: String,
    trip_id: String,
    option_id: String,
    /// `accepted` or `rejected` for the targeted option.
    status: String,
    /// Full batch option statuses after the action (Accept auto-rejects siblings).
    options: Vec<DayPlanAssistOptionStatusContract>,
    /// Echo of mutations applied via itinerary create/patch/reorder/delete (Accept only).
    #[serde(default)]
    applied_mutations: Vec<Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
struct DayPlanAssistOptionStatusContract {
    id: String,
    status: String,
}

fn assert_required_context_keys(request: &Value) {
    let context = request
        .get("context")
        .expect("request must pack context");
    let direct = context
        .get("direct")
        .expect("context.direct required")
        .as_object()
        .expect("context.direct object");
    let indirect = context
        .get("indirect")
        .expect("context.indirect required")
        .as_object()
        .expect("context.indirect object");

    for key in ["day", "stops", "mapPins"] {
        assert!(
            direct.contains_key(key),
            "context.direct missing {key}"
        );
    }
    for key in [
        "trip",
        "mainPlanId",
        "selectedPlanId",
        "otherDays",
        "members",
        "constraints",
        "linkedBookings",
        "linkedEstimates",
        "linkedCommitments",
        "priorOutcomes",
    ] {
        assert!(
            indirect.contains_key(key),
            "context.indirect missing {key}"
        );
    }
}

fn assert_assist_response_contract(body: &Value, expected_mode: &str) {
    let parsed: DayPlanAssistResponseContract =
        serde_json::from_value(body.clone()).expect("response must match day-plan-assist contract");

    assert_eq!(parsed.trip_id, support::TRIP_ID);
    assert_eq!(parsed.day, "2026-06-19");
    assert_eq!(parsed.plan_variant_id, support::PLAN_ID);
    assert_eq!(parsed.mode, expected_mode);
    assert!(!parsed.batch_id.is_empty(), "batchId required");
    assert!(
        !parsed.options.is_empty() && parsed.options.len() <= 3,
        "must return 1..=3 plan options, got {}",
        parsed.options.len()
    );

    for option in &parsed.options {
        assert!(!option.id.is_empty(), "option.id required");
        assert!(!option.label.is_empty(), "option.label required");
        assert!(
            !option.why.trim().is_empty(),
            "option.why (Why/reason) is required and must be non-empty"
        );
        assert!(
            body["options"]
                .as_array()
                .unwrap()
                .iter()
                .any(|row| row.get("why").and_then(|v| v.as_str()) == Some(option.why.as_str())),
            "Why must be present under key `why` (not only `reason`)"
        );
    }
}

fn enable_stub_openrouter_path() {
    // SAFETY: contract tests run single-threaded per binary invocation for this env seam.
    unsafe {
        std::env::set_var(STUB_PROVIDER_ENV, STUB_PROVIDER_VALUE);
        // Document OPENROUTER_* reuse — stub mode must still accept these vars without error.
        std::env::set_var("OPENROUTER_MODEL", "openai/gpt-5.2");
        std::env::set_var("OPENROUTER_SITE_NAME", "Joii");
        std::env::set_var("OPENROUTER_SITE_URL", "http://127.0.0.1:5180");
    }
}

async fn post_assist(
    app: axum::Router,
    token: &str,
    mode: &str,
) -> (StatusCode, Value) {
    let response = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(assist_uri())
                .header(header::AUTHORIZATION, format!("Bearer {token}"))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(expected_assist_request(mode).to_string()))
                .unwrap(),
        )
        .await
        .unwrap();
    let status = response.status();
    let body: Value = if status == StatusCode::OK {
        serde_json::from_slice(&to_bytes(response.into_body(), 65536).await.unwrap()).unwrap()
    } else {
        Value::Null
    };
    (status, body)
}

async fn post_resolution(
    app: axum::Router,
    token: &str,
    uri: String,
    client_mutation_id: &str,
) -> (StatusCode, Value) {
    let response = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(uri)
                .header(header::AUTHORIZATION, format!("Bearer {token}"))
                .header(header::CONTENT_TYPE, "application/json")
                .body(resolution_body(client_mutation_id))
                .unwrap(),
        )
        .await
        .unwrap();
    let status = response.status();
    let bytes = to_bytes(response.into_body(), 65536).await.unwrap();
    let body: Value = if bytes.is_empty() {
        Value::Null
    } else {
        serde_json::from_slice(&bytes).unwrap_or(Value::Null)
    };
    (status, body)
}

async fn item_duration_minutes(pool: &sqlx::PgPool) -> i32 {
    sqlx::query_scalar("select duration_minutes from itinerary_items where id = $1")
        .bind(uuid::Uuid::parse_str(support::ITEM_ID).unwrap())
        .fetch_one(pool)
        .await
        .unwrap()
}

fn option_with_patch_mutation(assist_body: &Value) -> &Value {
    assist_body["options"]
        .as_array()
        .expect("options array")
        .iter()
        .find(|option| {
            option["proposedMutations"]
                .as_array()
                .map(|ops| {
                    ops.iter().any(|op| {
                        op.get("op").and_then(|v| v.as_str()) == Some("patch")
                            && op
                                .pointer("/patch/durationMinutes")
                                .and_then(|v| v.as_i64())
                                == Some(ACCEPTED_PATCH_DURATION_MINUTES as i64)
                    })
                })
                .unwrap_or(false)
        })
        .expect("stub suggest must include a patch option with durationMinutes=90")
}

fn option_without_mutations<'a>(assist_body: &'a Value, exclude_id: &str) -> &'a Value {
    assist_body["options"]
        .as_array()
        .expect("options array")
        .iter()
        .find(|option| {
            option["id"].as_str() != Some(exclude_id)
                && option["proposedMutations"]
                    .as_array()
                    .map(|ops| ops.is_empty())
                    .unwrap_or(true)
        })
        .expect("batch must include an open sibling option without mutations")
}

fn assert_resolution_response_contract(body: &Value, expected_status: &str) {
    let parsed: DayPlanAssistResolutionResponseContract = serde_json::from_value(body.clone())
        .expect("response must match day-plan-assist Accept/Reject contract");
    assert_eq!(parsed.trip_id, support::TRIP_ID);
    assert_eq!(parsed.status, expected_status);
    assert!(!parsed.batch_id.is_empty());
    assert!(!parsed.option_id.is_empty());
    assert!(
        !parsed.options.is_empty(),
        "resolution must return full batch option statuses"
    );
    let targeted = parsed
        .options
        .iter()
        .find(|row| row.id == parsed.option_id)
        .expect("targeted option must appear in options[]");
    assert_eq!(targeted.status, expected_status);
}

#[test]
fn day_plan_assist_request_contract_documents_direct_and_indirect_context() {
    let suggest = expected_assist_request(MODE_SUGGEST);
    let auto_route = expected_assist_request(MODE_AUTO_ROUTE);

    assert_eq!(suggest["mode"], MODE_SUGGEST);
    assert_eq!(auto_route["mode"], MODE_AUTO_ROUTE);
    assert_required_context_keys(&suggest);
    assert_required_context_keys(&auto_route);

    let parsed: DayPlanAssistRequestContract =
        serde_json::from_value(suggest.clone()).expect("request JSON must deserialize to contract");
    assert_eq!(parsed.mode, MODE_SUGGEST);
    assert_eq!(parsed.plan_variant_id, support::PLAN_ID);
    assert_eq!(parsed.selected_item_ids, vec![support::ITEM_ID.to_string()]);
    assert!(!parsed.selected_fields.is_empty());
    assert_eq!(parsed.map_pins.len(), 1);
    assert!(parsed.context.direct.get("stops").is_some());
    assert!(parsed.context.indirect.get("priorOutcomes").is_some());

    let round_trip = serde_json::to_value(&parsed).unwrap();
    assert_eq!(round_trip["clientMutationId"], suggest["clientMutationId"]);
    assert_eq!(round_trip["context"]["indirect"]["mainPlanId"], support::PLAN_ID);
}

#[test]
fn day_plan_assist_response_contract_requires_why_and_caps_options_at_three() {
    let valid = json!({
        "batchId": "018f4e90-0000-7000-8000-000000000001",
        "tripId": support::TRIP_ID,
        "day": "2026-06-19",
        "planVariantId": support::PLAN_ID,
        "mode": MODE_SUGGEST,
        "options": [
            {
                "id": "018f4e90-0000-7000-8000-000000000011",
                "label": "A",
                "title": "Plan A · Culture morning",
                "summary": "Keep order; add transfer buffer.",
                "why": "Temple opens early; songthaew is usual for this leg.",
                "affectsItemIds": [support::ITEM_ID],
                "proposedMutations": [
                    {
                        "op": "patch",
                        "itemId": support::ITEM_ID,
                        "patch": { "durationMinutes": 90 }
                    }
                ]
            },
            {
                "id": "018f4e90-0000-7000-8000-000000000012",
                "label": "B",
                "title": "Plan B · Food-first",
                "summary": "Swap lunch earlier.",
                "why": "Group food preference noted on trip.",
                "affectsItemIds": [support::ITEM_ID],
                "proposedMutations": []
            },
            {
                "id": "018f4e90-0000-7000-8000-000000000013",
                "label": "C",
                "title": "Plan C · Easy transfer",
                "summary": "Auto-route with taxi legs filled.",
                "why": "Three geo pins present so a path is valid.",
                "affectsItemIds": [support::ITEM_ID],
                "proposedMutations": []
            }
        ]
    });
    assert_assist_response_contract(&valid, MODE_SUGGEST);

    let missing_why = json!({
        "batchId": "018f4e90-0000-7000-8000-000000000002",
        "tripId": support::TRIP_ID,
        "day": "2026-06-19",
        "planVariantId": support::PLAN_ID,
        "mode": MODE_AUTO_ROUTE,
        "options": [{
            "id": "018f4e90-0000-7000-8000-000000000021",
            "label": "A",
            "title": "Route fill",
            "summary": "Fill From/To/By",
            "why": "",
            "affectsItemIds": [],
            "proposedMutations": []
        }]
    });
    let parsed: DayPlanAssistResponseContract =
        serde_json::from_value(missing_why).expect("empty why still deserializes");
    assert!(
        parsed.options[0].why.trim().is_empty(),
        "fixture documents that empty why must be rejected by handler assertions"
    );
}

#[sqlx::test(migrations = "../../migrations")]
async fn day_plan_assist_suggest_returns_at_most_three_options_with_why(pool: sqlx::PgPool) {
    enable_stub_openrouter_path();
    support::seed_trip(&pool).await;
    support::seed_booking_doc(&pool).await;
    let token = support::create_session(&pool, support::ORGANIZER_ID).await;
    let app = support::app(pool.clone());

    let item_count_before: i64 =
        sqlx::query_scalar("select count(*) from itinerary_items where trip_id = $1")
            .bind(uuid::Uuid::parse_str(support::TRIP_ID).unwrap())
            .fetch_one(&pool)
            .await
            .unwrap();

    let response = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(assist_uri())
                .header(header::AUTHORIZATION, format!("Bearer {token}"))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    expected_assist_request(MODE_SUGGEST).to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();

    // RED: route/handler missing → 404 (or 501). GREEN: 200 with contract body.
    assert_eq!(
        response.status(),
        StatusCode::OK,
        "POST /day-plan-assist (suggest) must be registered; stub OpenRouter path via {STUB_PROVIDER_ENV}={STUB_PROVIDER_VALUE}; reuse OPENROUTER_* env names — no shadow itinerary API"
    );

    let body: Value =
        serde_json::from_slice(&to_bytes(response.into_body(), 65536).await.unwrap()).unwrap();
    assert_assist_response_contract(&body, MODE_SUGGEST);

    let item_count_after: i64 =
        sqlx::query_scalar("select count(*) from itinerary_items where trip_id = $1")
            .bind(uuid::Uuid::parse_str(support::TRIP_ID).unwrap())
            .fetch_one(&pool)
            .await
            .unwrap();
    assert_eq!(
        item_count_after, item_count_before,
        "suggest must not silently mutate itinerary (no shadow write API)"
    );
}

#[sqlx::test(migrations = "../../migrations")]
async fn day_plan_assist_auto_route_returns_at_most_three_options_with_why(pool: sqlx::PgPool) {
    enable_stub_openrouter_path();
    support::seed_trip(&pool).await;
    let token = support::create_session(&pool, support::ORGANIZER_ID).await;
    let app = support::app(pool);

    let response = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(assist_uri())
                .header(header::AUTHORIZATION, format!("Bearer {token}"))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    expected_assist_request(MODE_AUTO_ROUTE).to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(
        response.status(),
        StatusCode::OK,
        "POST /day-plan-assist (autoRoute / Auto-route & fill) must be registered"
    );

    let body: Value =
        serde_json::from_slice(&to_bytes(response.into_body(), 65536).await.unwrap()).unwrap();
    assert_assist_response_contract(&body, MODE_AUTO_ROUTE);
}

#[sqlx::test(migrations = "../../migrations")]
async fn day_plan_assist_requires_edit_capability(pool: sqlx::PgPool) {
    enable_stub_openrouter_path();
    support::seed_trip(&pool).await;
    let viewer = support::create_session(&pool, support::VIEWER_ID).await;
    let app = support::app(pool);

    let response = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(assist_uri())
                .header(header::AUTHORIZATION, format!("Bearer {viewer}"))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    expected_assist_request(MODE_SUGGEST).to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();

    // RED until route exists (404). GREEN: forbidden for viewer.
    assert_eq!(response.status(), StatusCode::FORBIDDEN);
}

#[test]
fn day_plan_assist_resolution_contract_documents_accept_reject_statuses() {
    let accept = json!({
        "clientMutationId": "day-plan-assist-accept-a"
    });
    let parsed_req: DayPlanAssistResolutionRequestContract =
        serde_json::from_value(accept).expect("Accept/Reject request body");
    assert_eq!(parsed_req.client_mutation_id, "day-plan-assist-accept-a");

    let response = json!({
        "batchId": "018f4e90-0000-7000-8000-000000000001",
        "tripId": support::TRIP_ID,
        "optionId": "018f4e90-0000-7000-8000-000000000011",
        "status": STATUS_ACCEPTED,
        "options": [
            { "id": "018f4e90-0000-7000-8000-000000000011", "status": STATUS_ACCEPTED },
            { "id": "018f4e90-0000-7000-8000-000000000012", "status": STATUS_REJECTED },
            { "id": "018f4e90-0000-7000-8000-000000000013", "status": STATUS_REJECTED }
        ],
        "appliedMutations": [
            {
                "op": "patch",
                "itemId": support::ITEM_ID,
                "patch": { "durationMinutes": ACCEPTED_PATCH_DURATION_MINUTES }
            }
        ]
    });
    assert_resolution_response_contract(&response, STATUS_ACCEPTED);
    let parsed: DayPlanAssistResolutionResponseContract =
        serde_json::from_value(response).unwrap();
    assert_eq!(parsed.applied_mutations.len(), 1);
    assert!(
        parsed
            .options
            .iter()
            .filter(|row| row.status == STATUS_REJECTED)
            .count()
            >= 2,
        "Accept fixture documents auto-reject of sibling open options"
    );

    let reject = json!({
        "batchId": "018f4e90-0000-7000-8000-000000000001",
        "tripId": support::TRIP_ID,
        "optionId": "018f4e90-0000-7000-8000-000000000012",
        "status": STATUS_REJECTED,
        "options": [
            { "id": "018f4e90-0000-7000-8000-000000000011", "status": STATUS_OPEN },
            { "id": "018f4e90-0000-7000-8000-000000000012", "status": STATUS_REJECTED },
            { "id": "018f4e90-0000-7000-8000-000000000013", "status": STATUS_OPEN }
        ],
        "appliedMutations": []
    });
    assert_resolution_response_contract(&reject, STATUS_REJECTED);
}

/// T8-A1: Accept applies the chosen option's proposedMutations via existing
/// itinerary create/patch/reorder/delete paths; suggest alone never overwrites.
#[sqlx::test(migrations = "../../migrations")]
async fn day_plan_assist_accept_applies_proposed_mutations_without_silent_overwrite(
    pool: sqlx::PgPool,
) {
    enable_stub_openrouter_path();
    support::seed_trip(&pool).await;
    let token = support::create_session(&pool, support::ORGANIZER_ID).await;
    let app = support::app(pool.clone());

    assert_eq!(
        item_duration_minutes(&pool).await,
        SEEDED_DURATION_MINUTES,
        "fixture baseline duration"
    );

    let (suggest_status, suggest_body) =
        post_assist(app.clone(), &token, MODE_SUGGEST).await;
    assert_eq!(suggest_status, StatusCode::OK);
    assert_assist_response_contract(&suggest_body, MODE_SUGGEST);

    assert_eq!(
        item_duration_minutes(&pool).await,
        SEEDED_DURATION_MINUTES,
        "suggest must not silently overwrite itinerary before Accept"
    );

    let batch_id = suggest_body["batchId"].as_str().expect("batchId");
    let option = option_with_patch_mutation(&suggest_body);
    let option_id = option["id"].as_str().expect("option.id");

    let (accept_status, accept_body) = post_resolution(
        app,
        &token,
        accept_uri(batch_id, option_id),
        "day-plan-assist-accept-patch",
    )
    .await;

    // RED: Accept route missing → 404. GREEN: 200 + itinerary patched via existing mutations.
    assert_eq!(
        accept_status,
        StatusCode::OK,
        "POST .../day-plan-assist/batches/{{batchId}}/options/{{optionId}}/accept must apply proposedMutations through itinerary create/patch/reorder/delete — no shadow write API"
    );
    assert_resolution_response_contract(&accept_body, STATUS_ACCEPTED);
    assert_eq!(accept_body["optionId"], option_id);
    assert_eq!(accept_body["batchId"], batch_id);
    assert!(
        accept_body["appliedMutations"]
            .as_array()
            .map(|ops| !ops.is_empty())
            .unwrap_or(false),
        "Accept must echo appliedMutations from the chosen option"
    );
    assert_eq!(
        item_duration_minutes(&pool).await,
        ACCEPTED_PATCH_DURATION_MINUTES,
        "Accept must apply stub patch durationMinutes={ACCEPTED_PATCH_DURATION_MINUTES} via itinerary patch"
    );
}

/// T8-A2: Accept auto-rejects other open options in the batch; Reject dismisses
/// without mutating itinerary.
#[sqlx::test(migrations = "../../migrations")]
async fn day_plan_assist_accept_auto_rejects_siblings_and_reject_does_not_mutate(
    pool: sqlx::PgPool,
) {
    enable_stub_openrouter_path();
    support::seed_trip(&pool).await;
    let token = support::create_session(&pool, support::ORGANIZER_ID).await;
    let app = support::app(pool.clone());

    let (suggest_status, suggest_body) =
        post_assist(app.clone(), &token, MODE_SUGGEST).await;
    assert_eq!(suggest_status, StatusCode::OK);
    assert!(
        suggest_body["options"].as_array().map(|o| o.len()).unwrap_or(0) >= 2,
        "need ≥2 options to verify sibling auto-reject"
    );

    let batch_id = suggest_body["batchId"].as_str().expect("batchId").to_string();
    let accept_option = option_with_patch_mutation(&suggest_body);
    let accept_option_id = accept_option["id"].as_str().expect("option.id").to_string();
    let reject_option = option_without_mutations(&suggest_body, &accept_option_id);
    let reject_option_id = reject_option["id"].as_str().expect("option.id").to_string();

    let (reject_status, reject_body) = post_resolution(
        app.clone(),
        &token,
        reject_uri(&batch_id, &reject_option_id),
        "day-plan-assist-reject-sibling",
    )
    .await;
    assert_eq!(
        reject_status,
        StatusCode::OK,
        "POST .../options/{{optionId}}/reject must be registered"
    );
    assert_resolution_response_contract(&reject_body, STATUS_REJECTED);
    assert_eq!(reject_body["optionId"], reject_option_id);
    assert!(
        reject_body["appliedMutations"]
            .as_array()
            .map(|ops| ops.is_empty())
            .unwrap_or(true),
        "Reject must not apply mutations"
    );
    assert_eq!(
        item_duration_minutes(&pool).await,
        SEEDED_DURATION_MINUTES,
        "Reject must dismiss without mutating itinerary"
    );
    // Remaining non-targeted options stay open after a single Reject.
    let reject_options = reject_body["options"].as_array().expect("options");
    let still_open: Vec<_> = reject_options
        .iter()
        .filter(|row| row["status"].as_str() == Some(STATUS_OPEN))
        .collect();
    assert!(
        still_open.iter().any(|row| row["id"].as_str() == Some(&accept_option_id)),
        "Reject must leave the other open options available for Accept"
    );

    let (accept_status, accept_body) = post_resolution(
        app,
        &token,
        accept_uri(&batch_id, &accept_option_id),
        "day-plan-assist-accept-after-reject",
    )
    .await;
    assert_eq!(
        accept_status,
        StatusCode::OK,
        "POST .../options/{{optionId}}/accept must auto-reject remaining open siblings"
    );
    assert_resolution_response_contract(&accept_body, STATUS_ACCEPTED);

    let accept_options = accept_body["options"].as_array().expect("options");
    assert_eq!(
        accept_options.len(),
        suggest_body["options"].as_array().unwrap().len(),
        "Accept response must cover the full suggestion batch"
    );
    for row in accept_options {
        let id = row["id"].as_str().unwrap();
        let status = row["status"].as_str().unwrap();
        if id == accept_option_id {
            assert_eq!(status, STATUS_ACCEPTED);
        } else {
            assert_eq!(
                status, STATUS_REJECTED,
                "Accept must auto-reject sibling option {id} (was open or already rejected)"
            );
        }
    }
    assert_eq!(
        item_duration_minutes(&pool).await,
        ACCEPTED_PATCH_DURATION_MINUTES,
        "Accept still applies the chosen plan after a prior Reject of a sibling"
    );
}
