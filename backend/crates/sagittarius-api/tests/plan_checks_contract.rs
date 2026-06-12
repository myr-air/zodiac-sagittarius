mod support;

use axum::body::{Body, to_bytes};
use http::{Method, Request, StatusCode, header};
use serde_json::Value;
use tower::ServiceExt;
use uuid::Uuid;

#[sqlx::test(migrations = "../../migrations")]
async fn plan_checks_contract_ignores_overlaps_across_explicit_alternative_paths(
    pool: sqlx::PgPool,
) {
    support::seed_trip(&pool).await;
    let alt_item_id = Uuid::parse_str("018f4e83-5410-7d8b-8f25-fd52c5e7bd99").unwrap();
    sqlx::query(
        "insert into itinerary_items (
           id, trip_id, plan_variant_id, path_group_id, path_id, path_name, path_role,
           day, sort_order, start_time, activity, activity_type, place, map_link,
           duration_minutes, transportation, note, created_by, version
         )
         values (
           $1, $2, $3, 'group-breakfast-alt', 'path-breakfast-alt', 'Plan A', 'alternative',
           '2025-05-16', 200, '08:45', 'Alternative dim sum', 'food', 'Kowloon',
           'https://maps.example.test/alt', 60, 'walk', 'rain backup', $4, 1
         )",
    )
    .bind(alt_item_id)
    .bind(Uuid::parse_str(support::TRIP_ID).unwrap())
    .bind(Uuid::parse_str(support::PLAN_ID).unwrap())
    .bind(Uuid::parse_str(support::OWNER_ID).unwrap())
    .execute(&pool)
    .await
    .unwrap();
    let token = support::create_session(&pool, support::ORGANIZER_ID).await;
    let app = support::app(pool);

    let response = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/trips/{}/plan-checks", support::TRIP_ID))
                .header(header::AUTHORIZATION, format!("Bearer {token}"))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);
    let body: Value =
        serde_json::from_slice(&to_bytes(response.into_body(), 65536).await.unwrap()).unwrap();
    let main_item_id = Uuid::parse_str(support::ITEM_ID).unwrap().to_string();
    let alt_item_id = alt_item_id.to_string();
    let has_cross_path_overlap = body["suggestions"]
        .as_array()
        .unwrap()
        .iter()
        .any(|suggestion| {
            let target_ids = suggestion["targetItemIds"].as_array().unwrap();
            suggestion["scope"] == "betweenItems"
                && target_ids.iter().any(|id| id == &main_item_id)
                && target_ids.iter().any(|id| id == &alt_item_id)
        });
    assert!(!has_cross_path_overlap);
}
