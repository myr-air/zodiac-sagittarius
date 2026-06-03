mod support;

use axum::body::{Body, to_bytes};
use http::{Method, Request, StatusCode, header};
use serde_json::{Value, json};
use tower::ServiceExt;

#[sqlx::test(migrations = "../../migrations")]
async fn members_contract_lists_trip_members_for_authenticated_participant(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    let token = support::create_session(&pool, support::TRAVELER_ID).await;
    let app = support::app(pool);

    let response = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(format!("/api/v1/trips/{}/members", support::TRIP_ID))
                .header(header::AUTHORIZATION, format!("Bearer {token}"))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);
    let body: Value =
        serde_json::from_slice(&to_bytes(response.into_body(), 65536).await.unwrap()).unwrap();
    assert_eq!(body.as_array().unwrap().len(), 4);
    assert_eq!(body[0]["tripId"], support::TRIP_ID);
    assert!(body.as_array().unwrap().iter().any(|member| {
        member["id"] == support::OWNER_ID
            && member["role"] == "owner"
            && member["accessStatus"] == "active"
    }));
}

#[sqlx::test(migrations = "../../migrations")]
async fn members_contract_requires_bearer_session(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    let app = support::app(pool);

    let response = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(format!("/api/v1/trips/{}/members", support::TRIP_ID))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
}

#[sqlx::test(migrations = "../../migrations")]
async fn presence_contract_updates_current_member_and_emits_event(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    let token = support::create_session(&pool, support::TRAVELER_ID).await;
    let app = support::app(pool.clone());

    let response = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/trips/{}/presence", support::TRIP_ID))
                .header(header::AUTHORIZATION, format!("Bearer {token}"))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "clientMutationId": "presence-web-1",
                        "presence": "online"
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
    assert_eq!(body["id"], support::TRAVELER_ID);
    assert_eq!(body["presence"], "online");
    assert!(
        body["lastSeenAt"]
            .as_str()
            .is_some_and(|value| !value.is_empty())
    );

    let event_type: String = sqlx::query_scalar(
        "select event_type
         from realtime_events
         where trip_id = $1 and client_mutation_id = 'presence-web-1'",
    )
    .bind(uuid::Uuid::parse_str(support::TRIP_ID).unwrap())
    .fetch_one(&pool)
    .await
    .unwrap();
    assert_eq!(event_type, "presence.updated");
}

#[sqlx::test(migrations = "../../migrations")]
async fn presence_contract_rejects_invalid_presence(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    let token = support::create_session(&pool, support::TRAVELER_ID).await;
    let app = support::app(pool);

    let response = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/trips/{}/presence", support::TRIP_ID))
                .header(header::AUTHORIZATION, format!("Bearer {token}"))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "clientMutationId": "presence-web-2",
                        "presence": "busy"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::BAD_REQUEST);
}
