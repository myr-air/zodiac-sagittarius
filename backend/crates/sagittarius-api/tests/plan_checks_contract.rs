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

#[sqlx::test(migrations = "../../migrations")]
async fn plan_checks_contract_uses_explicit_time_windows_for_overlaps_and_child_bounds(
    pool: sqlx::PgPool,
) {
    support::seed_trip(&pool).await;
    let overlap_item_id = Uuid::parse_str("018f4e83-5410-7d8b-8f25-fd52c5e7bda1").unwrap();
    let journey_block_id = Uuid::parse_str("018f4e83-5410-7d8b-8f25-fd52c5e7bda2").unwrap();
    let late_child_id = Uuid::parse_str("018f4e83-5410-7d8b-8f25-fd52c5e7bda3").unwrap();
    sqlx::query(
        "insert into itinerary_items (
           id, trip_id, plan_variant_id, day, sort_order, start_time, end_time,
           end_offset_days, activity, activity_type, place, map_link, duration_minutes,
           transportation, note, created_by, version
         )
         values (
           $1, $2, $3, '2025-05-16', 200, '09:15', '10:00', 0,
           'Explicit end overlap', 'food', 'Kowloon',
           'https://maps.example.test/end-overlap', null, 'walk', 'end window only',
           $4, 1
         )",
    )
    .bind(overlap_item_id)
    .bind(Uuid::parse_str(support::TRIP_ID).unwrap())
    .bind(Uuid::parse_str(support::PLAN_ID).unwrap())
    .bind(Uuid::parse_str(support::OWNER_ID).unwrap())
    .execute(&pool)
    .await
    .unwrap();
    sqlx::query(
        "insert into itinerary_items (
           id, trip_id, plan_variant_id, parent_item_id, item_kind, time_mode,
           is_plan_block, day, sort_order, start_time, end_time, end_offset_days,
           activity, activity_type, place, map_link, duration_minutes, transportation,
           note, created_by, version
         )
         values
           (
             $1, $3, $4, null, 'travel', 'scheduled', true, '2025-05-16',
             300, '04:00', '13:00', 0, 'Journey block', 'travel', 'Airport',
             'https://maps.example.test/journey', null, 'airport buffer',
             'full journey block', $5, 1
           ),
           (
             $2, $3, $4, $1, 'travel', 'scheduled', false, '2025-05-16',
             310, '12:30', '13:30', 0, 'Late segment', 'travel', 'Airport',
             'https://maps.example.test/late-segment', null, 'rail',
             'outside parent end', $5, 1
           )",
    )
    .bind(journey_block_id)
    .bind(late_child_id)
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
    let seed_item_id = Uuid::parse_str(support::ITEM_ID).unwrap().to_string();
    let overlap_item_id = overlap_item_id.to_string();
    let journey_block_id = journey_block_id.to_string();
    let late_child_id = late_child_id.to_string();
    let suggestions = body["suggestions"].as_array().unwrap();
    let has_explicit_end_overlap = suggestions.iter().any(|suggestion| {
        let target_ids = suggestion["targetItemIds"].as_array().unwrap();
        suggestion["scope"] == "betweenItems"
            && target_ids.iter().any(|id| id == &seed_item_id)
            && target_ids.iter().any(|id| id == &overlap_item_id)
    });
    let explicit_end_overlap = suggestions
        .iter()
        .find(|suggestion| {
            let target_ids = suggestion["targetItemIds"].as_array().unwrap();
            suggestion["scope"] == "betweenItems"
                && target_ids.iter().any(|id| id == &seed_item_id)
                && target_ids.iter().any(|id| id == &overlap_item_id)
        })
        .unwrap();
    let has_child_bounds_warning = suggestions.iter().any(|suggestion| {
        let target_ids = suggestion["targetItemIds"].as_array().unwrap();
        suggestion["scope"] == "item"
            && target_ids.iter().any(|id| id == &journey_block_id)
            && target_ids.iter().any(|id| id == &late_child_id)
            && suggestion["actionPayload"]["parentItemId"] == journey_block_id
    });
    let explicit_end_missing_duration = suggestions.iter().any(|suggestion| {
        suggestion["actionPayload"]["itemId"] == overlap_item_id
            && suggestion["actionPayload"]["patch"]["durationMinutes"] == 60
    });

    assert!(has_explicit_end_overlap);
    assert_eq!(explicit_end_overlap["severity"], "warning");
    assert!(
        explicit_end_overlap["recommendedAction"]["en"]
            .as_str()
            .unwrap()
            .contains("explicit Alternative Path")
    );
    assert!(
        !explicit_end_overlap["recommendedAction"]["en"]
            .as_str()
            .unwrap()
            .contains("move one item")
    );
    assert!(
        explicit_end_overlap["recommendedAction"]["th"]
            .as_str()
            .unwrap()
            .contains("explicit")
    );
    assert!(has_child_bounds_warning);
    assert!(!explicit_end_missing_duration);
}
