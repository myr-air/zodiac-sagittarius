use axum::body::Body;
use http::{Request, StatusCode, header::CONTENT_TYPE};
use serde_json::Value;
use tower::ServiceExt;

#[tokio::test]
async fn openapi_json_is_served() {
    let app = sagittarius_api::api::router(sagittarius_api::app::AppState::test());
    let response = app
        .oneshot(
            Request::builder()
                .uri("/api/v1/openapi.json")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);
    assert!(
        response
            .headers()
            .get(CONTENT_TYPE)
            .and_then(|value| value.to_str().ok())
            .is_some_and(|value| value.starts_with("application/json")),
        "expected Content-Type application/json"
    );

    let body = axum::body::to_bytes(response.into_body(), usize::MAX)
        .await
        .unwrap();
    let body: Value = serde_json::from_slice(&body).unwrap();
    let openapi = body["openapi"]
        .as_str()
        .expect("openapi field must be a string");
    assert!(
        openapi.starts_with("3."),
        "openapi field must start with \"3.\", got {openapi:?}"
    );
}

#[tokio::test]
async fn openapi_docs_ui_is_served() {
    let app = sagittarius_api::api::router(sagittarius_api::app::AppState::test());
    let response = app
        .oneshot(
            Request::builder()
                .uri("/api/docs")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);
    assert!(
        response
            .headers()
            .get(CONTENT_TYPE)
            .and_then(|value| value.to_str().ok())
            .is_some_and(|value| value.starts_with("text/html")),
        "expected Content-Type text/html"
    );

    let body = axum::body::to_bytes(response.into_body(), usize::MAX)
        .await
        .unwrap();
    let body = String::from_utf8(body.to_vec()).expect("docs UI body must be UTF-8");
    let lower = body.to_ascii_lowercase();
    assert!(
        lower.contains("openapi.json")
            || lower.contains("swagger")
            || lower.contains("scalar"),
        "docs HTML should reference openapi.json or a Scalar/Swagger UI"
    );
}

/// Axum route paths from `account::routes()` and `join::routes()` (method, path).
/// Path params use Axum `{snake_case}`; OpenAPI may emit `{snake_case}` or `{camelCase}`.
const ACCOUNT_AND_JOIN_ROUTES: &[(&str, &str)] = &[
    // account::routes()
    ("post", "/auth/email/challenges"),
    ("post", "/auth/email/sessions"),
    ("post", "/auth/password/sessions"),
    ("get", "/account"),
    ("patch", "/account"),
    ("delete", "/account/trusted-devices/{trusted_device_id}"),
    ("post", "/account/trips"),
    ("get", "/account/trips"),
    ("post", "/account/trips/{trip_id}/member-sessions"),
    ("get", "/account/trip-stats"),
    ("get", "/account/explorer"),
    ("get", "/account/to-dos"),
    ("get", "/account/vault"),
    ("post", "/account/vault"),
    ("post", "/trips/{trip_id}/ownership-transfers"),
    ("post", "/trips/{trip_id}/members/{member_id}/account-links"),
    ("post", "/account/passkeys/options"),
    ("post", "/account/passkeys"),
    ("post", "/auth/passkeys/options"),
    ("post", "/auth/passkeys/sessions"),
    ("delete", "/account/session"),
    // join::routes()
    ("post", "/trip-join-sessions"),
    ("get", "/trip-join-invite-tokens/current"),
    ("post", "/trips/{trip_id}/join-invite-tokens"),
    ("post", "/trips/{trip_id}/members/{member_id}/claims"),
    ("post", "/trips/{trip_id}/member-sessions"),
    ("delete", "/trips/{trip_id}/member-sessions/current"),
];

#[tokio::test]
async fn openapi_account_join_and_security_schemes_present() {
    let app = sagittarius_api::api::router(sagittarius_api::app::AppState::test());
    let response = app
        .oneshot(
            Request::builder()
                .uri("/api/v1/openapi.json")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);
    let body = axum::body::to_bytes(response.into_body(), usize::MAX)
        .await
        .unwrap();
    let doc: Value = serde_json::from_slice(&body).unwrap();

    let schemes = doc
        .pointer("/components/securitySchemes")
        .and_then(|v| v.as_object())
        .expect("components.securitySchemes must be a non-empty object");
    assert!(
        !schemes.is_empty(),
        "components.securitySchemes must be non-empty"
    );

    assert!(
        schemes.values().any(is_http_bearer_scheme),
        "securitySchemes must document Bearer auth for member/trip sessions \
         (type=http, scheme=bearer), as used by BearerToken"
    );
    assert!(
        schemes.iter().any(|(name, scheme)| is_account_session_scheme(name, scheme)),
        "securitySchemes must document account session auth via Authorization Bearer \
         and/or cookie sagittarius-account-session, as used by AccountSessionToken"
    );

    let paths = doc["paths"]
        .as_object()
        .expect("openapi paths must be an object");

    for &(method, route_path) in ACCOUNT_AND_JOIN_ROUTES {
        let (resolved_path, operation) =
            find_path_operation(paths, route_path, method).unwrap_or_else(|| {
                panic!(
                    "missing OpenAPI operation {method} {route_path} \
                     (Axum path; OpenAPI may use camelCase path params)"
                )
            });

        assert!(
            operation
                .get("responses")
                .and_then(|r| r.as_object())
                .is_some_and(|r| !r.is_empty()),
            "{method} {resolved_path} must declare non-empty responses"
        );

        let has_request_schema = operation
            .pointer("/requestBody/content")
            .and_then(|c| c.as_object())
            .is_some_and(|content| content.values().any(|media| media.get("schema").is_some()));
        let has_response_schema = operation
            .get("responses")
            .and_then(|r| r.as_object())
            .is_some_and(|responses| {
                responses.values().any(|resp| {
                    resp.pointer("/content")
                        .and_then(|c| c.as_object())
                        .is_some_and(|content| {
                            content.values().any(|media| media.get("schema").is_some())
                        })
                })
            });
        // Body-less POSTs (e.g. rotate invite, passkey options) may omit requestBody;
        // DELETEs may be 204 with no content schema. Require at least one schema when the
        // method typically returns or accepts JSON (everything except delete).
        if method != "delete" {
            assert!(
                has_request_schema || has_response_schema,
                "{method} {resolved_path} must declare request and/or response content schemas"
            );
        }
    }
}

/// Axum route paths from trips, plan_variants, itinerary, itinerary_imports, and
/// plan_checks `routes()` (method, path).
/// Path params use Axum `{snake_case}`; OpenAPI may emit `{snake_case}` or `{camelCase}`.
const TRIP_PLAN_ITINERARY_ROUTES: &[(&str, &str)] = &[
    // trips::routes()
    ("get", "/trips/{trip_id}"),
    ("patch", "/trips/{trip_id}"),
    // plan_variants::routes()
    ("post", "/trips/{trip_id}/plan-variants"),
    ("patch", "/trips/{trip_id}/plan-variants/{plan_variant_id}"),
    (
        "post",
        "/trips/{trip_id}/plan-variants/{plan_variant_id}/publications",
    ),
    ("post", "/trips/{trip_id}/trip-plans"),
    ("patch", "/trips/{trip_id}/trip-plans/{trip_plan_id}"),
    ("post", "/trips/{trip_id}/trip-plans/{trip_plan_id}/set-main"),
    // itinerary::routes()
    ("post", "/trips/{trip_id}/itinerary-items"),
    ("patch", "/trips/{trip_id}/itinerary-items/order"),
    ("patch", "/trips/{trip_id}/itinerary-items/{item_id}"),
    ("delete", "/trips/{trip_id}/itinerary-items/{item_id}"),
    // itinerary_imports::routes()
    ("post", "/trips/{trip_id}/itinerary-imports"),
    // plan_checks::routes()
    ("post", "/trips/{trip_id}/plan-checks"),
    ("get", "/trips/{trip_id}/plan-checks/latest"),
    ("patch", "/trips/{trip_id}/plan-suggestions/{suggestion_id}"),
];

#[tokio::test]
async fn openapi_trip_plan_itinerary_paths_present() {
    let app = sagittarius_api::api::router(sagittarius_api::app::AppState::test());
    let response = app
        .oneshot(
            Request::builder()
                .uri("/api/v1/openapi.json")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);
    let body = axum::body::to_bytes(response.into_body(), usize::MAX)
        .await
        .unwrap();
    let doc: Value = serde_json::from_slice(&body).unwrap();

    let paths = doc["paths"]
        .as_object()
        .expect("openapi paths must be an object");

    for &(method, route_path) in TRIP_PLAN_ITINERARY_ROUTES {
        let (resolved_path, operation) =
            find_path_operation(paths, route_path, method).unwrap_or_else(|| {
                panic!(
                    "missing OpenAPI operation {method} {route_path} \
                     (Axum path; OpenAPI may use camelCase path params)"
                )
            });

        assert!(
            operation
                .get("responses")
                .and_then(|r| r.as_object())
                .is_some_and(|r| !r.is_empty()),
            "{method} {resolved_path} must declare non-empty responses"
        );

        let has_request_schema = operation
            .pointer("/requestBody/content")
            .and_then(|c| c.as_object())
            .is_some_and(|content| content.values().any(|media| media.get("schema").is_some()));
        let has_response_schema = operation
            .get("responses")
            .and_then(|r| r.as_object())
            .is_some_and(|responses| {
                responses.values().any(|resp| {
                    resp.pointer("/content")
                        .and_then(|c| c.as_object())
                        .is_some_and(|content| {
                            content.values().any(|media| media.get("schema").is_some())
                        })
                })
            });
        // DELETEs may be 204 with no content schema. Require at least one schema when the
        // method typically returns or accepts JSON (everything except delete).
        if method != "delete" {
            assert!(
                has_request_schema || has_response_schema,
                "{method} {resolved_path} must declare request and/or response content schemas"
            );
        }
    }
}

/// Axum route paths from health, exchange_rates, expenses, members, bookings, tasks,
/// suggestions, photo_albums, stop_notes, daily_briefings, and place_resolution `routes()`
/// (method, path). Path params use Axum `{snake_case}`; OpenAPI may emit `{snake_case}` or
/// `{camelCase}`. WebSocket `ws::routes()` is intentionally excluded.
const REMAINING_HTTP_MODULE_ROUTES: &[(&str, &str)] = &[
    // health::routes()
    ("get", "/health"),
    ("get", "/readiness"),
    ("get", "/version"),
    // exchange_rates::routes()
    ("get", "/exchange-rates"),
    // expenses::routes()
    ("get", "/trips/{trip_id}/expenses/summary"),
    ("post", "/trips/{trip_id}/expenses/reminders"),
    ("post", "/trips/{trip_id}/expenses"),
    ("patch", "/trips/{trip_id}/expenses/{expense_id}"),
    ("delete", "/trips/{trip_id}/expenses/{expense_id}"),
    // members::routes()
    ("get", "/trips/{trip_id}/members"),
    ("post", "/trips/{trip_id}/members"),
    ("patch", "/trips/{trip_id}/members/{member_id}"),
    ("post", "/trips/{trip_id}/members/{member_id}/claim-resets"),
    ("post", "/trips/{trip_id}/presence"),
    // bookings::routes()
    ("post", "/trips/{trip_id}/bookings"),
    ("patch", "/trips/{trip_id}/bookings/{booking_id}"),
    ("delete", "/trips/{trip_id}/bookings/{booking_id}"),
    // tasks::routes()
    ("post", "/trips/{trip_id}/tasks"),
    ("patch", "/trips/{trip_id}/tasks/{task_id}"),
    // suggestions::routes()
    ("post", "/trips/{trip_id}/suggestions"),
    ("patch", "/trips/{trip_id}/suggestions/{suggestion_id}"),
    // photo_albums::routes()
    ("post", "/trips/{trip_id}/photo-albums"),
    ("patch", "/trips/{trip_id}/photo-albums/{album_id}"),
    ("delete", "/trips/{trip_id}/photo-albums/{album_id}"),
    // stop_notes::routes()
    ("post", "/trips/{trip_id}/stop-notes"),
    ("patch", "/trips/{trip_id}/stop-notes/{note_id}"),
    ("delete", "/trips/{trip_id}/stop-notes/{note_id}"),
    // daily_briefings::routes()
    ("get", "/trips/{trip_id}/daily-briefings"),
    ("patch", "/trips/{trip_id}/daily-briefings/{date}"),
    // place_resolution::routes()
    ("post", "/trips/{trip_id}/places/resolve"),
];

#[tokio::test]
async fn openapi_remaining_http_modules_present() {
    let app = sagittarius_api::api::router(sagittarius_api::app::AppState::test());
    let response = app
        .oneshot(
            Request::builder()
                .uri("/api/v1/openapi.json")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);
    let body = axum::body::to_bytes(response.into_body(), usize::MAX)
        .await
        .unwrap();
    let doc: Value = serde_json::from_slice(&body).unwrap();

    let paths = doc["paths"]
        .as_object()
        .expect("openapi paths must be an object");

    // WebSocket upgrade path must stay out of OpenAPI path coverage.
    let ws_present = paths.keys().any(|doc_path| {
        normalize_openapi_path(doc_path) == "/trips/{trip_id}/events/stream"
    });
    assert!(
        !ws_present,
        "WebSocket path /trips/{{trip_id}}/events/stream must be absent from openapi.json paths"
    );

    for &(method, route_path) in REMAINING_HTTP_MODULE_ROUTES {
        let (resolved_path, operation) =
            find_path_operation(paths, route_path, method).unwrap_or_else(|| {
                panic!(
                    "missing OpenAPI operation {method} {route_path} \
                     (Axum path; OpenAPI may use camelCase path params)"
                )
            });

        assert!(
            operation
                .get("responses")
                .and_then(|r| r.as_object())
                .is_some_and(|r| !r.is_empty()),
            "{method} {resolved_path} must declare non-empty responses"
        );

        let has_request_schema = operation
            .pointer("/requestBody/content")
            .and_then(|c| c.as_object())
            .is_some_and(|content| content.values().any(|media| media.get("schema").is_some()));
        let has_response_schema = operation
            .get("responses")
            .and_then(|r| r.as_object())
            .is_some_and(|responses| {
                responses.values().any(|resp| {
                    resp.pointer("/content")
                        .and_then(|c| c.as_object())
                        .is_some_and(|content| {
                            content.values().any(|media| media.get("schema").is_some())
                        })
                })
            });
        // DELETEs may be 204 with no content schema. Require at least one schema when the
        // method typically returns or accepts JSON (everything except delete).
        if method != "delete" {
            assert!(
                has_request_schema || has_response_schema,
                "{method} {resolved_path} must declare request and/or response content schemas"
            );
        }
    }
}

/// Definitive allowlist of every non-WebSocket HTTP (method, path) under `api_v1()`.
/// Derived from all `routes()` modules merged in `api::api_v1()`, including
/// `openapi::routes()`, and excluding `ws::routes()`.
/// Path params use Axum `{snake_case}`; OpenAPI may emit `{snake_case}` or `{camelCase}`.
fn all_api_v1_http_routes() -> Vec<(&'static str, &'static str)> {
    let mut routes = Vec::with_capacity(
        1 + ACCOUNT_AND_JOIN_ROUTES.len()
            + TRIP_PLAN_ITINERARY_ROUTES.len()
            + REMAINING_HTTP_MODULE_ROUTES.len(),
    );
    // openapi::routes()
    routes.push(("get", "/openapi.json"));
    routes.extend_from_slice(ACCOUNT_AND_JOIN_ROUTES);
    routes.extend_from_slice(TRIP_PLAN_ITINERARY_ROUTES);
    routes.extend_from_slice(REMAINING_HTTP_MODULE_ROUTES);
    routes
}

/// Coverage gate: every `api_v1()` HTTP route appears in OpenAPI, every OpenAPI
/// operation maps back to a known Axum route, WS is excluded, and docs/security remain.
#[tokio::test]
async fn openapi_all_http_routes_covered() {
    let app = sagittarius_api::api::router(sagittarius_api::app::AppState::test());

    let docs_response = app
        .clone()
        .oneshot(
            Request::builder()
                .uri("/api/docs")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        docs_response.status(),
        StatusCode::OK,
        "/api/docs must remain served"
    );

    let response = app
        .oneshot(
            Request::builder()
                .uri("/api/v1/openapi.json")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        response.status(),
        StatusCode::OK,
        "/api/v1/openapi.json must remain served"
    );

    let body = axum::body::to_bytes(response.into_body(), usize::MAX)
        .await
        .unwrap();
    let doc: Value = serde_json::from_slice(&body).unwrap();

    let schemes = doc
        .pointer("/components/securitySchemes")
        .and_then(|v| v.as_object())
        .expect("components.securitySchemes must be a non-empty object");
    assert!(
        !schemes.is_empty(),
        "components.securitySchemes must be non-empty"
    );

    let paths = doc["paths"]
        .as_object()
        .expect("openapi paths must be an object");

    let ws_present = paths.keys().any(|doc_path| {
        normalize_openapi_path(doc_path) == "/trips/{trip_id}/events/stream"
    });
    assert!(
        !ws_present,
        "WebSocket path /trips/{{trip_id}}/events/stream must be absent from openapi.json paths"
    );

    let expected = all_api_v1_http_routes();

    // Axum → OpenAPI: every registered HTTP route has a matching method+path.
    for &(method, route_path) in &expected {
        assert!(
            find_path_operation(paths, route_path, method).is_some(),
            "missing OpenAPI operation {method} {route_path} \
             (registered under api_v1(); OpenAPI may use camelCase path params)"
        );
    }

    // OpenAPI → Axum: every documented operation maps to a known HTTP route.
    let http_methods = ["get", "post", "put", "patch", "delete", "head", "options", "trace"];
    let mut orphan_ops = Vec::new();
    for (doc_path, item) in paths {
        let Some(item_obj) = item.as_object() else {
            continue;
        };
        for method in http_methods {
            if item_obj.get(method).is_none() {
                continue;
            }
            let normalized = normalize_openapi_path(doc_path);
            let known = expected.iter().any(|&(m, p)| {
                m == method && normalize_openapi_path(p) == normalized
            });
            if !known {
                orphan_ops.push(format!("{method} {doc_path} (normalized {normalized})"));
            }
        }
    }
    assert!(
        orphan_ops.is_empty(),
        "OpenAPI documents operations with no matching api_v1() HTTP route: {orphan_ops:?}"
    );
}

fn is_http_bearer_scheme(scheme: &Value) -> bool {
    scheme.get("type").and_then(|t| t.as_str()) == Some("http")
        && scheme
            .get("scheme")
            .and_then(|s| s.as_str())
            .is_some_and(|s| s.eq_ignore_ascii_case("bearer"))
}

fn is_account_session_scheme(name: &str, scheme: &Value) -> bool {
    // Cookie-based account session (AccountSessionToken cookie path).
    let cookie_named = scheme.get("type").and_then(|t| t.as_str()) == Some("apiKey")
        && scheme.get("in").and_then(|i| i.as_str()) == Some("cookie")
        && scheme.get("name").and_then(|n| n.as_str()) == Some("sagittarius-account-session");

    let name_lower = name.to_ascii_lowercase();
    let name_suggests_account = name_lower.contains("account")
        && (name_lower.contains("session") || name_lower.contains("cookie"));

    let describes_account = scheme
        .get("description")
        .and_then(|d| d.as_str())
        .is_some_and(|d| {
            let lower = d.to_ascii_lowercase();
            lower.contains("account")
                && (lower.contains("session")
                    || lower.contains("sagittarius-account-session")
                    || lower.contains("cookie"))
        });

    // HTTP Bearer used for account sessions (AccountSessionToken Bearer path),
    // identified by scheme key or description — not a generic member Bearer alone.
    let account_bearer =
        is_http_bearer_scheme(scheme) && (name_suggests_account || describes_account);

    cookie_named || account_bearer
}

fn normalize_openapi_path(path: &str) -> String {
    let trimmed = path.trim_end_matches('/');
    let without_prefix = trimmed
        .strip_prefix("/api/v1")
        .unwrap_or(trimmed);
    let mut out = String::new();
    let mut chars = without_prefix.chars().peekable();
    while let Some(c) = chars.next() {
        if c == '{' {
            out.push('{');
            let mut name = String::new();
            for n in chars.by_ref() {
                if n == '}' {
                    break;
                }
                name.push(n);
            }
            out.push_str(&to_snake_case(&name));
            out.push('}');
        } else {
            out.push(c);
        }
    }
    if out.is_empty() {
        "/".to_string()
    } else {
        out
    }
}

fn to_snake_case(name: &str) -> String {
    let mut out = String::with_capacity(name.len() + 4);
    for (i, c) in name.chars().enumerate() {
        if c.is_uppercase() {
            if i > 0 {
                out.push('_');
            }
            out.extend(c.to_lowercase());
        } else {
            out.push(c);
        }
    }
    out
}

fn find_path_operation<'a>(
    paths: &'a serde_json::Map<String, Value>,
    axum_path: &str,
    method: &str,
) -> Option<(String, &'a Value)> {
    let want = normalize_openapi_path(axum_path);
    for (doc_path, item) in paths {
        if normalize_openapi_path(doc_path) != want {
            continue;
        }
        if let Some(op) = item.get(method) {
            return Some((doc_path.clone(), op));
        }
    }
    None
}
