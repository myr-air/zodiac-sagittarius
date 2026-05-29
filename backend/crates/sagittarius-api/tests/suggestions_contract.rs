mod support;

use axum::body::Body;
use http::{Method, Request, StatusCode, header};
use serde_json::json;
use tower::ServiceExt;

#[sqlx::test(migrations = "../../migrations")]
async fn suggestions_contract_traveler_can_create_suggestion_and_viewer_cannot(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    let traveler = support::create_session(&pool, support::TRAVELER_ID).await;
    let viewer = support::create_session(&pool, support::VIEWER_ID).await;
    let app = support::app(pool.clone());

    let ok = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/v1/trips/{}/suggestions", support::TRIP_ID))
                .header(header::AUTHORIZATION, format!("Bearer {traveler}"))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "clientMutationId": "web-suggestion-1",
                        "type": "edit",
                        "targetItemId": support::ITEM_ID,
                        "planVariantId": support::PLAN_ID,
                        "sourceVersion": 4,
                        "proposedPatch": {"note":"book ahead"}
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(ok.status(), StatusCode::CREATED);
    let created_event_count: i64 =
        sqlx::query_scalar("select count(*) from realtime_events where event_type = $1")
            .bind("suggestion.created")
            .fetch_one(&pool)
            .await
            .unwrap();
    assert_eq!(created_event_count, 1);

    let forbidden = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/v1/trips/{}/suggestions", support::TRIP_ID))
                .header(header::AUTHORIZATION, format!("Bearer {viewer}"))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "clientMutationId": "web-suggestion-2",
                        "type": "edit",
                        "targetItemId": support::ITEM_ID,
                        "planVariantId": support::PLAN_ID,
                        "sourceVersion": 4,
                        "proposedPatch": {"note":"book ahead"}
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(forbidden.status(), StatusCode::FORBIDDEN);
}

#[sqlx::test(migrations = "../../migrations")]
async fn suggestions_contract_create_edit_rejects_invalid_plan_and_target_variant(
    pool: sqlx::PgPool,
) {
    support::seed_trip(&pool).await;
    let alternate_plan_id = support::seed_plan_variant(&pool).await;
    let traveler = support::create_session(&pool, support::TRAVELER_ID).await;
    let app = support::app(pool);
    let unknown_plan_id = uuid::Uuid::now_v7();

    let unknown_plan = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/v1/trips/{}/suggestions", support::TRIP_ID))
                .header(header::AUTHORIZATION, format!("Bearer {traveler}"))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "clientMutationId": "web-suggestion-bad-plan",
                        "type": "edit",
                        "targetItemId": support::ITEM_ID,
                        "planVariantId": unknown_plan_id,
                        "sourceVersion": 4,
                        "proposedPatch": {"note":"book ahead"}
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(unknown_plan.status(), StatusCode::NOT_FOUND);

    let target_variant_mismatch = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/v1/trips/{}/suggestions", support::TRIP_ID))
                .header(header::AUTHORIZATION, format!("Bearer {traveler}"))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "clientMutationId": "web-suggestion-target-plan-mismatch",
                        "type": "edit",
                        "targetItemId": support::ITEM_ID,
                        "planVariantId": alternate_plan_id,
                        "sourceVersion": 4,
                        "proposedPatch": {"note":"book ahead"}
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(target_variant_mismatch.status(), StatusCode::BAD_REQUEST);
}

#[sqlx::test(migrations = "../../migrations")]
async fn suggestions_contract_organizer_approves_matching_suggestion_and_conflicts_stale_one(
    pool: sqlx::PgPool,
) {
    support::seed_trip(&pool).await;
    let organizer = support::create_session(&pool, support::ORGANIZER_ID).await;
    let fresh_id = support::seed_suggestion(&pool, 4).await;
    let stale_id = support::seed_suggestion(&pool, 2).await;
    let app = support::app(pool.clone());

    let approved = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/v1/suggestions/{fresh_id}/approve"))
                .header(header::AUTHORIZATION, format!("Bearer {organizer}"))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(approved.status(), StatusCode::OK);

    let note: String = sqlx::query_scalar("select note from itinerary_items where id = $1")
        .bind(uuid::Uuid::parse_str(support::ITEM_ID).unwrap())
        .fetch_one(&pool)
        .await
        .unwrap();
    assert_eq!(note, "approved note");

    let status: String = sqlx::query_scalar("select status from suggestions where id = $1")
        .bind(fresh_id)
        .fetch_one(&pool)
        .await
        .unwrap();
    assert_eq!(status, "approved");

    let conflicted = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/v1/suggestions/{stale_id}/approve"))
                .header(header::AUTHORIZATION, format!("Bearer {organizer}"))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(conflicted.status(), StatusCode::CONFLICT);

    let stale_status: String = sqlx::query_scalar("select status from suggestions where id = $1")
        .bind(stale_id)
        .fetch_one(&pool)
        .await
        .unwrap();
    assert_eq!(stale_status, "conflicted");

    let resolved_event_count: i64 =
        sqlx::query_scalar("select count(*) from realtime_events where event_type = $1")
            .bind("suggestion.resolved")
            .fetch_one(&pool)
            .await
            .unwrap();
    assert_eq!(resolved_event_count, 2);
}

#[sqlx::test(migrations = "../../migrations")]
async fn suggestions_contract_approval_rejects_target_plan_mismatch_without_mutating_item(
    pool: sqlx::PgPool,
) {
    support::seed_trip(&pool).await;
    support::seed_plan_variant(&pool).await;
    let organizer = support::create_session(&pool, support::ORGANIZER_ID).await;
    let malformed_id = support::seed_suggestion_for_plan(&pool, support::ALT_PLAN_ID, 4).await;
    let app = support::app(pool.clone());

    let response = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/v1/suggestions/{malformed_id}/approve"))
                .header(header::AUTHORIZATION, format!("Bearer {organizer}"))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(response.status(), StatusCode::BAD_REQUEST);

    let note: String = sqlx::query_scalar("select note from itinerary_items where id = $1")
        .bind(uuid::Uuid::parse_str(support::ITEM_ID).unwrap())
        .fetch_one(&pool)
        .await
        .unwrap();
    assert_eq!(note, "breakfast");

    let version: i64 = sqlx::query_scalar("select version from itinerary_items where id = $1")
        .bind(uuid::Uuid::parse_str(support::ITEM_ID).unwrap())
        .fetch_one(&pool)
        .await
        .unwrap();
    assert_eq!(version, 4);
}
