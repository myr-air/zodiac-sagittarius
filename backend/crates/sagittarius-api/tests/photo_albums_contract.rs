mod support;

use axum::body::{Body, to_bytes};
use http::{Method, Request, StatusCode, header};
use serde_json::{Value, json};
use tower::ServiceExt;

#[sqlx::test(migrations = "../../migrations")]
async fn traveler_can_create_patch_and_delete_photo_album_link(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    let traveler_token = support::create_session(&pool, support::TRAVELER_ID).await;
    let app = support::app(pool);

    let create_response = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/trips/{}/photo-albums", support::TRIP_ID))
                .header(header::AUTHORIZATION, format!("Bearer {traveler_token}"))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "clientMutationId": "photo-album-create-1",
                        "title": "Group Google Photos",
                        "provider": "google_photos",
                        "url": "https://photos.app.goo.gl/group-trip",
                        "access": "collaborative",
                        "ownerMemberId": support::TRAVELER_ID,
                        "relatedItineraryItemIds": [support::ITEM_ID],
                        "day": "2026-06-18",
                        "description": "Main trip album",
                        "accessNote": "Everyone can add photos",
                        "coverUrl": "https://images.example.test/cover.jpg"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(create_response.status(), StatusCode::OK);
    let created: Value =
        serde_json::from_slice(&to_bytes(create_response.into_body(), 131072).await.unwrap())
            .unwrap();
    let album_id = created["id"].as_str().expect("album id").to_string();
    let create_version = created["version"].as_i64().unwrap();
    assert_eq!(created["title"], "Group Google Photos");
    assert_eq!(created["provider"], "google_photos");
    assert_eq!(created["access"], "collaborative");
    assert_eq!(created["ownerMemberId"], support::TRAVELER_ID);
    assert_eq!(created["relatedItineraryItemIds"][0], support::ITEM_ID);

    let cockpit_response = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(format!("/api/v1/trips/{}", support::TRIP_ID))
                .header(header::AUTHORIZATION, format!("Bearer {traveler_token}"))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(cockpit_response.status(), StatusCode::OK);
    let cockpit: Value = serde_json::from_slice(
        &to_bytes(cockpit_response.into_body(), 131072)
            .await
            .unwrap(),
    )
    .unwrap();
    assert!(
        cockpit["photoAlbumLinks"]
            .as_array()
            .unwrap()
            .iter()
            .any(|album| album["id"] == album_id)
    );

    let patch_response = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::PATCH)
                .uri(format!(
                    "/api/v1/trips/{}/photo-albums/{album_id}",
                    support::TRIP_ID
                ))
                .header(header::AUTHORIZATION, format!("Bearer {traveler_token}"))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "clientMutationId": "photo-album-patch-1",
                        "expectedVersion": create_version,
                        "patch": {
                            "title": "Group Google Photos updated",
                            "access": "view_only",
                            "relatedItineraryItemIds": [],
                            "accessNote": null
                        }
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(patch_response.status(), StatusCode::OK);
    let patched: Value =
        serde_json::from_slice(&to_bytes(patch_response.into_body(), 131072).await.unwrap())
            .unwrap();
    let patch_version = patched["version"].as_i64().unwrap();
    assert_eq!(patched["title"], "Group Google Photos updated");
    assert_eq!(patched["access"], "view_only");
    assert_eq!(patched["accessNote"], Value::Null);
    assert!(
        patched["relatedItineraryItemIds"]
            .as_array()
            .unwrap()
            .is_empty()
    );
    assert_eq!(patch_version, create_version + 1);

    let conflict_response = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::PATCH)
                .uri(format!(
                    "/api/v1/trips/{}/photo-albums/{album_id}",
                    support::TRIP_ID
                ))
                .header(header::AUTHORIZATION, format!("Bearer {traveler_token}"))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "clientMutationId": "photo-album-patch-stale",
                        "expectedVersion": create_version,
                        "patch": { "title": "stale edit" }
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(conflict_response.status(), StatusCode::CONFLICT);
    let conflict: Value = serde_json::from_slice(
        &to_bytes(conflict_response.into_body(), 131072)
            .await
            .unwrap(),
    )
    .unwrap();
    assert_eq!(conflict["code"], "version_conflict");
    assert_eq!(conflict["latest"]["id"], album_id);

    let delete_response = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::DELETE)
                .uri(format!(
                    "/api/v1/trips/{}/photo-albums/{album_id}",
                    support::TRIP_ID
                ))
                .header(header::AUTHORIZATION, format!("Bearer {traveler_token}"))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(delete_response.status(), StatusCode::OK);
    let deleted: Value =
        serde_json::from_slice(&to_bytes(delete_response.into_body(), 131072).await.unwrap())
            .unwrap();
    assert_eq!(deleted["id"], album_id);
    assert_eq!(deleted["version"], patch_version + 1);
}

#[sqlx::test(migrations = "../../migrations")]
async fn viewer_cannot_mutate_photo_album_links(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    let viewer_token = support::create_session(&pool, support::VIEWER_ID).await;
    let app = support::app(pool);

    let response = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/trips/{}/photo-albums", support::TRIP_ID))
                .header(header::AUTHORIZATION, format!("Bearer {viewer_token}"))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "clientMutationId": "photo-album-viewer-create",
                        "title": "Viewer album",
                        "provider": "dropbox",
                        "url": "https://dropbox.com/request/viewer",
                        "access": "upload_request",
                        "relatedItineraryItemIds": []
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::FORBIDDEN);
}

#[sqlx::test(migrations = "../../migrations")]
async fn photo_album_validation_rejects_bad_url_and_relation(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    let traveler_token = support::create_session(&pool, support::TRAVELER_ID).await;
    let app = support::app(pool);

    let response = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/trips/{}/photo-albums", support::TRIP_ID))
                .header(header::AUTHORIZATION, format!("Bearer {traveler_token}"))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "clientMutationId": "photo-album-invalid-url",
                        "title": "Bad album",
                        "provider": "custom",
                        "url": "javascript:alert(1)",
                        "access": "view_only",
                        "relatedItineraryItemIds": ["018f4e83-5410-7d8b-8f25-fd52c5e70000"]
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::BAD_REQUEST);
    let body: Value =
        serde_json::from_slice(&to_bytes(response.into_body(), 131072).await.unwrap()).unwrap();
    assert_eq!(body["code"], "invalid_request");

    let relation_response = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/trips/{}/photo-albums", support::TRIP_ID))
                .header(header::AUTHORIZATION, format!("Bearer {traveler_token}"))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "clientMutationId": "photo-album-invalid-relation",
                        "title": "Bad relation album",
                        "provider": "custom",
                        "url": "https://example.com/album",
                        "access": "view_only",
                        "relatedItineraryItemIds": ["018f4e83-5410-7d8b-8f25-fd52c5e70000"]
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(relation_response.status(), StatusCode::BAD_REQUEST);
    let relation_body: Value = serde_json::from_slice(
        &to_bytes(relation_response.into_body(), 131072)
            .await
            .unwrap(),
    )
    .unwrap();
    assert_eq!(relation_body["code"], "invalid_request");
}
