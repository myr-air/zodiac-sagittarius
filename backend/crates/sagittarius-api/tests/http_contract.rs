use axum::{body::Body, response::IntoResponse};
use http::{
    Request, StatusCode,
    header::{ACCESS_CONTROL_ALLOW_ORIGIN, ACCESS_CONTROL_REQUEST_METHOD, CONTENT_TYPE, ORIGIN},
};
use sagittarius_api::domain::errors::ServiceError;
use serde_json::Value;
use tower::ServiceExt;

#[tokio::test]
async fn health_returns_ok() {
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

    assert_eq!(response.status(), StatusCode::OK);

    let body = axum::body::to_bytes(response.into_body(), usize::MAX)
        .await
        .unwrap();

    assert_eq!(&body[..], b"ok");
}

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
async fn cors_preflight_allows_frontend_to_call_api() {
    let app = sagittarius_api::api::router(sagittarius_api::app::AppState::test());
    let response = app
        .oneshot(
            Request::builder()
                .method("OPTIONS")
                .uri("/v1/trips/join")
                .header(ORIGIN, "http://127.0.0.1:5180")
                .header(ACCESS_CONTROL_REQUEST_METHOD, "POST")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);
    assert_eq!(
        response.headers().get(ACCESS_CONTROL_ALLOW_ORIGIN).unwrap(),
        "http://127.0.0.1:5180"
    );
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

#[tokio::test]
async fn account_conflict_errors_return_stable_codes() {
    let identity_response = ServiceError::IdentityAlreadyLinked.into_response();
    assert_eq!(identity_response.status(), StatusCode::CONFLICT);
    let identity_body = axum::body::to_bytes(identity_response.into_body(), usize::MAX)
        .await
        .unwrap();
    let identity_body: Value = serde_json::from_slice(&identity_body).unwrap();
    assert_eq!(identity_body["code"], "identity_already_linked");
    assert_eq!(identity_body["message"], "identity already linked");

    let owner_response = ServiceError::OwnerTransferInvalid.into_response();
    assert_eq!(owner_response.status(), StatusCode::CONFLICT);
    let owner_body = axum::body::to_bytes(owner_response.into_body(), usize::MAX)
        .await
        .unwrap();
    let owner_body: Value = serde_json::from_slice(&owner_body).unwrap();
    assert_eq!(owner_body["code"], "owner_transfer_invalid");
    assert_eq!(owner_body["message"], "owner transfer invalid");
}
