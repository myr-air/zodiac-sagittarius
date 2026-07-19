mod support;

use axum::body::{Body, to_bytes};
use http::{Method, Request, StatusCode, header};
use serde_json::{Value, json};
use tower::ServiceExt;
use uuid::Uuid;

#[sqlx::test(migrations = "../../migrations")]
async fn public_trip_bootstrap_succeeds_without_account_session(pool: sqlx::PgPool) {
    let app = support::app(pool);

    // No Authorization header and no account session cookie — guest bootstrap.
    let response = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/public/trips")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({ "destination": "Chiang Mai" }).to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();

    let status = response.status();
    let bytes = to_bytes(response.into_body(), 65536).await.unwrap();
    assert!(
        status.is_success(),
        "public trip bootstrap must succeed without account session; got {status}, body={}",
        String::from_utf8_lossy(&bytes)
    );

    let body: Value = serde_json::from_slice(&bytes).expect("success body must be JSON");
    let trip_id = body["trip"]["id"]
        .as_str()
        .expect("response must include trip identity (trip.id)");
    assert!(
        Uuid::parse_str(trip_id).is_ok(),
        "trip.id must be a UUID, got {trip_id}"
    );
}

#[sqlx::test(migrations = "../../migrations")]
async fn public_trip_bootstrap_does_not_mint_account_login_session(pool: sqlx::PgPool) {
    let app = support::app(pool.clone());

    // Anonymous create: no Authorization, no account cookie.
    let response = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/public/trips")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({ "destination": "Chiang Mai" }).to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();

    let status = response.status();
    assert!(
        response
            .headers()
            .get_all(header::SET_COOKIE)
            .iter()
            .filter_map(|value| value.to_str().ok())
            .all(|cookie| !cookie.starts_with("sagittarius-account-session=")),
        "public trip bootstrap must not set an account session cookie"
    );

    let bytes = to_bytes(response.into_body(), 65536).await.unwrap();
    assert!(
        status.is_success(),
        "anonymous public trip create must succeed; got {status}, body={}",
        String::from_utf8_lossy(&bytes)
    );

    let body: Value = serde_json::from_slice(&bytes).expect("success body must be JSON");

    // Trip-create shape includes memberSession; account login shape (AccountSession) does not.
    assert!(
        body["memberSession"]["sessionToken"]
            .as_str()
            .is_some_and(|token| !token.is_empty()),
        "response must include memberSession.sessionToken"
    );
    assert!(
        body.get("sessionToken").is_none(),
        "response must not expose top-level account sessionToken (AccountSession shape)"
    );
    assert!(
        body.get("userId").is_none(),
        "response must not expose top-level account userId"
    );
    assert!(
        body.get("kind").is_none(),
        "response must not expose top-level account session kind"
    );

    let user_session_count: i64 = sqlx::query_scalar("select count(*) from user_sessions")
        .fetch_one(&pool)
        .await
        .unwrap();
    assert_eq!(
        user_session_count, 0,
        "public trip bootstrap must not insert user_sessions rows"
    );

    // Without an account session, account routes stay unauthenticated.
    let account_response = support::app(pool)
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/account")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    let account_status = account_response.status();
    let account_bytes = to_bytes(account_response.into_body(), 65536)
        .await
        .unwrap();
    let account_body: Value =
        serde_json::from_slice(&account_bytes).expect("account error body must be JSON");
    assert_eq!(account_status, StatusCode::UNAUTHORIZED);
    assert_eq!(account_body["code"], "unauthenticated");
}

#[sqlx::test(migrations = "../../migrations")]
async fn public_trip_bootstrap_returns_usable_member_session(pool: sqlx::PgPool) {
    let app = support::app(pool);

    let create_response = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/public/trips")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({ "destination": "Chiang Mai" }).to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();

    let create_status = create_response.status();
    let create_bytes = to_bytes(create_response.into_body(), 65536).await.unwrap();
    assert!(
        create_status.is_success(),
        "anonymous public trip bootstrap must succeed; got {create_status}, body={}",
        String::from_utf8_lossy(&create_bytes)
    );

    let body: Value =
        serde_json::from_slice(&create_bytes).expect("success body must be JSON");
    let trip_id = body["trip"]["id"]
        .as_str()
        .expect("response must include trip.id");
    assert!(
        Uuid::parse_str(trip_id).is_ok(),
        "trip.id must be a UUID, got {trip_id}"
    );

    let session_token = body["memberSession"]["sessionToken"]
        .as_str()
        .expect("response must include memberSession.sessionToken");
    assert!(
        !session_token.is_empty(),
        "memberSession.sessionToken must be non-empty"
    );
    assert_eq!(
        body["memberSession"]["tripId"].as_str(),
        Some(trip_id),
        "memberSession.tripId must match trip.id"
    );
    let member_id = body["memberSession"]["memberId"]
        .as_str()
        .expect("response must include memberSession.memberId");
    assert!(
        Uuid::parse_str(member_id).is_ok(),
        "memberSession.memberId must be a UUID, got {member_id}"
    );

    // Member session must work like join/member-session flows against trip APIs.
    let trip_response = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(format!("/api/v1/trips/{trip_id}"))
                .header(header::AUTHORIZATION, format!("Bearer {session_token}"))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    let trip_status = trip_response.status();
    let trip_bytes = to_bytes(trip_response.into_body(), 65536).await.unwrap();
    assert!(
        trip_status.is_success(),
        "memberSession.sessionToken must authorize GET /api/v1/trips/{{id}}; got {trip_status}, body={}",
        String::from_utf8_lossy(&trip_bytes)
    );
}

#[sqlx::test(migrations = "../../migrations")]
async fn public_trip_create_accepts_destination_seed_without_full_account_input(
    pool: sqlx::PgPool,
) {
    let app = support::app(pool);

    // Destination-only seed — not AccountTripCreateInput (no name, origin, dates, join secrets).
    let response = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/public/trips")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({ "destination": "Chiang Mai" }).to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();

    let status = response.status();
    let bytes = to_bytes(response.into_body(), 65536).await.unwrap();
    assert!(
        status.is_success(),
        "destination-only public trip create must succeed without AccountTripCreateInput; got {status}, body={}",
        String::from_utf8_lossy(&bytes)
    );

    let body: Value = serde_json::from_slice(&bytes).expect("success body must be JSON");
    assert_eq!(body["trip"]["destinationLabel"], "Chiang Mai");
    assert!(
        body["trip"]["id"].as_str().is_some_and(|id| Uuid::parse_str(id).is_ok()),
        "response must include a trip id"
    );
}

#[sqlx::test(migrations = "../../migrations")]
async fn public_trip_create_fills_safe_defaults_from_destination_seed(pool: sqlx::PgPool) {
    let app = support::app(pool);

    let create_response = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/public/trips")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({ "destination": "Chiang Mai" }).to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();

    let create_status = create_response.status();
    let create_bytes = to_bytes(create_response.into_body(), 65536).await.unwrap();
    assert!(
        create_status.is_success(),
        "public trip create must succeed; got {create_status}, body={}",
        String::from_utf8_lossy(&create_bytes)
    );

    let body: Value =
        serde_json::from_slice(&create_bytes).expect("success body must be JSON");
    let trip = &body["trip"];

    assert_eq!(trip["name"], "Chiang Mai");
    assert_eq!(trip["destinationLabel"], "Chiang Mai");
    assert_eq!(trip["originLabel"], "Bangkok, Thailand");
    assert_eq!(trip["originCity"], "Bangkok");
    assert_eq!(trip["originCountry"], "Thailand");
    assert_eq!(trip["originCountryCode"], "TH");
    assert_eq!(trip["defaultTimezone"], "Asia/Bangkok");

    let start_date = trip["startDate"]
        .as_str()
        .expect("trip.startDate must be present");
    let end_date = trip["endDate"]
        .as_str()
        .expect("trip.endDate must be present");
    assert!(
        !start_date.is_empty() && !end_date.is_empty(),
        "start/end dates must be non-empty"
    );
    assert!(
        end_date >= start_date,
        "endDate must be >= startDate; got start={start_date} end={end_date}"
    );

    let join_id = trip["joinId"]
        .as_str()
        .expect("trip.joinId must be present");
    assert!(
        !join_id.trim().is_empty(),
        "server must fill joinId; got empty"
    );

    // Owner display name is not on TripSummary; load cockpit members.
    let trip_id = trip["id"].as_str().expect("trip.id");
    let session_token = body["memberSession"]["sessionToken"]
        .as_str()
        .expect("memberSession.sessionToken");
    let owner_member_id = body["ownerMemberId"]
        .as_str()
        .expect("ownerMemberId");

    let trip_response = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(format!("/api/v1/trips/{trip_id}"))
                .header(header::AUTHORIZATION, format!("Bearer {session_token}"))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    let trip_status = trip_response.status();
    let trip_bytes = to_bytes(trip_response.into_body(), 65536).await.unwrap();
    assert!(
        trip_status.is_success(),
        "member session must load trip cockpit; got {trip_status}, body={}",
        String::from_utf8_lossy(&trip_bytes)
    );
    let cockpit: Value =
        serde_json::from_slice(&trip_bytes).expect("cockpit body must be JSON");
    let members = cockpit["members"]
        .as_array()
        .expect("cockpit.members must be an array");
    let owner = members
        .iter()
        .find(|member| member["id"].as_str() == Some(owner_member_id))
        .expect("cockpit must include owner member");
    assert_eq!(owner["displayName"], "Guest");
}

#[sqlx::test(migrations = "../../migrations")]
async fn public_trip_create_rejects_empty_destination(pool: sqlx::PgPool) {
    let app = support::app(pool);

    for destination in ["", "   "] {
        let response = app
            .clone()
            .oneshot(
                Request::builder()
                    .method(Method::POST)
                    .uri("/api/v1/public/trips")
                    .header(header::CONTENT_TYPE, "application/json")
                    .body(Body::from(json!({ "destination": destination }).to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();

        let status = response.status();
        let bytes = to_bytes(response.into_body(), 65536).await.unwrap();
        let body: Value =
            serde_json::from_slice(&bytes).expect("error body must be JSON");
        assert!(
            status.is_client_error(),
            "empty destination must return 4xx; got {status} for destination={destination:?}, body={}",
            String::from_utf8_lossy(&bytes)
        );
        assert_eq!(
            body["code"], "invalid_request",
            "empty destination must use invalid_request; got body={body}"
        );
    }
}

#[sqlx::test(migrations = "../../migrations")]
async fn account_trip_create_without_session_fails_auth_while_public_bootstrap_allows_anonymous(
    pool: sqlx::PgPool,
) {
    let app = support::app(pool);

    // Public bootstrap remains available without an account session.
    let public_response = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/public/trips")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({ "destination": "Chiang Mai" }).to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    let public_status = public_response.status();
    let public_bytes = to_bytes(public_response.into_body(), 65536).await.unwrap();
    assert!(
        public_status.is_success(),
        "public bootstrap must allow anonymous; got {public_status}, body={}",
        String::from_utf8_lossy(&public_bytes)
    );

    // Account create stays auth-gated — no Authorization / account cookie.
    let account_response = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/account/trips")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "name": "Chiang Mai Food Run",
                        "originLabel": "Bangkok, Thailand",
                        "originCity": "Bangkok",
                        "originCountry": "Thailand",
                        "originCountryCode": "TH",
                        "destinationLabel": "Chiang Mai",
                        "destinationCities": [{
                            "city": "Chiang Mai",
                            "country": "Thailand",
                            "countryCode": "TH",
                            "timezone": "Asia/Bangkok",
                            "latitude": 18.7883,
                            "longitude": 98.9853
                        }],
                        "countries": ["Thailand"],
                        "startDate": "2026-11-04",
                        "endDate": "2026-11-08",
                        "ownerDisplayName": "Aom",
                        "joinId": "CM-AUTH-GATE-2026",
                        "joinPassword": "rice-noodle-2026"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();

    let account_status = account_response.status();
    let account_bytes = to_bytes(account_response.into_body(), 65536)
        .await
        .unwrap();
    let account_body: Value =
        serde_json::from_slice(&account_bytes).expect("account error body must be JSON");
    assert_eq!(
        account_status,
        StatusCode::UNAUTHORIZED,
        "POST /api/v1/account/trips without account session must fail auth; body={}",
        String::from_utf8_lossy(&account_bytes)
    );
    assert_eq!(account_body["code"], "unauthenticated");
}
