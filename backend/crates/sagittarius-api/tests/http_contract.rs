use axum::{body::Body, response::IntoResponse};
use http::{Request, StatusCode, header::CONTENT_TYPE};
use sagittarius_api::domain::errors::ServiceError;
use serde_json::Value;
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

    let content_type = response
        .headers()
        .get(CONTENT_TYPE)
        .and_then(|value| value.to_str().ok())
        .unwrap();
    assert!(content_type.starts_with("application/json"));

    let body = axum::body::to_bytes(response.into_body(), usize::MAX)
        .await
        .unwrap();
    let body: Value = serde_json::from_slice(&body).unwrap();

    assert_eq!(body["code"], "not_found");
    assert_eq!(body["message"], "not found");
}

#[tokio::test]
async fn database_errors_do_not_leak_details() {
    let response = ServiceError::Database(sqlx::Error::RowNotFound).into_response();

    assert_eq!(response.status(), StatusCode::INTERNAL_SERVER_ERROR);

    let body = axum::body::to_bytes(response.into_body(), usize::MAX)
        .await
        .unwrap();
    let body: Value = serde_json::from_slice(&body).unwrap();

    assert_eq!(body["code"], "database_error");
    assert_eq!(body["message"], "database error");
    assert!(!body["message"].as_str().unwrap().contains("RowNotFound"));
    assert!(
        !body["message"]
            .as_str()
            .unwrap()
            .contains("no rows returned")
    );
}
