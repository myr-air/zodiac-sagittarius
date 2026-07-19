use axum::body::Body;
use http::{Method, Request, StatusCode, header::CONTENT_TYPE};
use tower::ServiceExt;

#[tokio::test]
async fn api_v1_health_is_the_liveness_path() {
    let app = sagittarius_api::api::router(sagittarius_api::app::AppState::test());
    let response = app
        .oneshot(
            Request::builder()
                .uri("/api/v1/health")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);
}

#[tokio::test]
async fn old_v1_health_is_not_supported() {
    let app = sagittarius_api::api::router(sagittarius_api::app::AppState::test());
    let response = app
        .oneshot(
            Request::builder()
                .uri("/v1/health")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::NOT_FOUND);
}

#[tokio::test]
async fn unknown_api_v1_route_returns_json_not_found() {
    let app = sagittarius_api::api::router(sagittarius_api::app::AppState::test());
    let response = app
        .oneshot(
            Request::builder()
                .uri("/api/v1/missing")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::NOT_FOUND);
    assert!(
        response
            .headers()
            .get(CONTENT_TYPE)
            .and_then(|value| value.to_str().ok())
            .is_some_and(|value| value.starts_with("application/json"))
    );
}

#[tokio::test]
async fn cors_preflight_allows_new_join_session_route() {
    let app = sagittarius_api::api::router(sagittarius_api::app::AppState::test());
    let response = app
        .oneshot(
            Request::builder()
                .method(Method::OPTIONS)
                .uri("/api/v1/trip-join-sessions")
                .header("origin", "http://127.0.0.1:5180")
                .header("access-control-request-method", "POST")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);
}

#[tokio::test]
async fn trip_plan_routes_keep_canonical_and_legacy_mutation_paths() {
    let trip_id = "018f0000-0000-7000-8000-000000000001";
    let plan_id = "018f0000-0000-7000-8000-000000000002";

    for (method, path) in [
        (Method::POST, format!("/api/v1/trips/{trip_id}/trip-plans")),
        (
            Method::PATCH,
            format!("/api/v1/trips/{trip_id}/trip-plans/{plan_id}"),
        ),
        (
            Method::POST,
            format!("/api/v1/trips/{trip_id}/trip-plans/{plan_id}/set-main"),
        ),
        (
            Method::POST,
            format!("/api/v1/trips/{trip_id}/plan-variants"),
        ),
        (
            Method::PATCH,
            format!("/api/v1/trips/{trip_id}/plan-variants/{plan_id}"),
        ),
        (
            Method::POST,
            format!("/api/v1/trips/{trip_id}/plan-variants/{plan_id}/publications"),
        ),
    ] {
        let app = sagittarius_api::api::router(sagittarius_api::app::AppState::test());
        let response = app
            .oneshot(
                Request::builder()
                    .method(method)
                    .uri(path)
                    .header(CONTENT_TYPE, "application/json")
                    .body(Body::from("{}"))
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
    }
}
