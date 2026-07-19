use axum::body::{Body, to_bytes};
use axum::http::{Request, StatusCode};
use serde_json::Value;
use tower::ServiceExt;

mod support;

#[sqlx::test(migrations = "../../migrations")]
async fn returns_major_currency_rate_without_trip_session(pool: sqlx::PgPool) {
    let response = support::app(pool)
        .oneshot(
            Request::builder()
                .method("GET")
                .uri("/api/v1/exchange-rates?base=HKD&quote=HKD")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);
    let body = response_json(response).await;
    assert_eq!(body["base"], "HKD");
    assert_eq!(body["quote"], "HKD");
    assert_eq!(body["rate"], 1.0);
    assert_eq!(body["provider"], "internal");
}

#[sqlx::test(migrations = "../../migrations")]
async fn rejects_unsupported_currency_codes(pool: sqlx::PgPool) {
    let response = support::app(pool)
        .oneshot(
            Request::builder()
                .method("GET")
                .uri("/api/v1/exchange-rates?base=BTC&quote=HKD")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::BAD_REQUEST);
    let body = response_json(response).await;
    assert_eq!(body["code"], "invalid_request");
}

async fn response_json(response: axum::response::Response) -> Value {
    let bytes = to_bytes(response.into_body(), 1024 * 1024).await.unwrap();
    serde_json::from_slice(&bytes).unwrap()
}
