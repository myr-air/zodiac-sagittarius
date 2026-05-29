use axum::body::Body;
use http::{Request, StatusCode};
use tower::ServiceExt;

#[tokio::test]
async fn unknown_route_returns_json_not_found() {
    let app = sagittarius_api::api::router(sagittarius_api::app::AppState::test());
    let response = app
        .oneshot(
            Request::builder()
                .uri("/v1/missing")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::NOT_FOUND);
}
