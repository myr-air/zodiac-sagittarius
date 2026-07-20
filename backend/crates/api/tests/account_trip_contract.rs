mod support;

use axum::body::{Body, to_bytes};
use http::{Method, Request, Response, StatusCode, header};
use serde::de::DeserializeOwned;
use serde_json::{Value, json};
use time::{Date, Month};
use tower::ServiceExt;
use uuid::Uuid;

async fn post_json_response<T: DeserializeOwned>(
    app: axum::Router,
    uri: &str,
    body: Value,
) -> (StatusCode, T) {
    let response = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(uri)
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(body.to_string()))
                .unwrap(),
        )
        .await
        .unwrap();
    response_json(response).await
}

async fn post_json_with_auth(
    app: axum::Router,
    uri: &str,
    authorization: Option<&str>,
    body: Value,
) -> Response<axum::body::Body> {
    let mut request = Request::builder()
        .method(Method::POST)
        .uri(uri)
        .header(header::CONTENT_TYPE, "application/json");
    if let Some(authorization) = authorization {
        request = request.header(header::AUTHORIZATION, authorization);
    }

    app.oneshot(request.body(Body::from(body.to_string())).unwrap())
        .await
        .unwrap()
}

async fn post_raw_with_auth(
    app: axum::Router,
    uri: &str,
    authorization: Option<&str>,
    body: &'static str,
) -> Response<axum::body::Body> {
    let mut request = Request::builder()
        .method(Method::POST)
        .uri(uri)
        .header(header::CONTENT_TYPE, "application/json");
    if let Some(authorization) = authorization {
        request = request.header(header::AUTHORIZATION, authorization);
    }

    app.oneshot(request.body(Body::from(body)).unwrap())
        .await
        .unwrap()
}

async fn get_with_auth(
    app: axum::Router,
    uri: &str,
    authorization: Option<&str>,
) -> Response<axum::body::Body> {
    let mut request = Request::builder().method(Method::GET).uri(uri);
    if let Some(authorization) = authorization {
        request = request.header(header::AUTHORIZATION, authorization);
    }

    app.oneshot(request.body(Body::empty()).unwrap())
        .await
        .unwrap()
}

async fn response_json<T: DeserializeOwned>(
    response: Response<axum::body::Body>,
) -> (StatusCode, T) {
    let status = response.status();
    let bytes = to_bytes(response.into_body(), 65536).await.unwrap();
    let body = serde_json::from_slice(&bytes).unwrap();

    (status, body)
}

async fn login_account(
    pool: &sqlx::PgPool,
    email: &str,
    trust_device: bool,
    device_label: &str,
) -> Value {
    let app = support::app(pool.clone());
    let (start, code) = start_email_login_with_code(pool, app.clone(), email).await;
    let (status, session): (StatusCode, Value) = post_json_response(
        app,
        "/api/v1/auth/email/sessions",
        json!({
            "challengeId": start["challengeId"],
            "code": code,
            "trustDevice": trust_device,
            "deviceLabel": device_label
        }),
    )
    .await;
    assert_eq!(status, StatusCode::OK);

    session
}

async fn start_email_login_with_code(
    pool: &sqlx::PgPool,
    app: axum::Router,
    email: &str,
) -> (Value, String) {
    let (status, body): (StatusCode, Value) = post_json_response(
        app,
        "/api/v1/auth/email/challenges",
        json!({"email": email}),
    )
    .await;
    assert_eq!(status, StatusCode::OK);
    assert!(
        body.get("devCode").is_none(),
        "email login code must not be exposed in the public response"
    );
    let challenge_id = Uuid::parse_str(body["challengeId"].as_str().unwrap()).unwrap();
    let code = sqlx::query_scalar(
        "select code
         from email_login_outbox
         where challenge_id = $1",
    )
    .bind(challenge_id)
    .fetch_one(pool)
    .await
    .unwrap();

    (body, code)
}

fn date_value(year: i32, month: Month, day: u8) -> Value {
    serde_json::to_value(Date::from_calendar_date(year, month, day).unwrap()).unwrap()
}

fn default_account_trip_payload(join_id: &str, join_password: &str) -> Value {
    json!({
        "name": format!("{join_id} Food Run"),
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
        "startDate": date_value(2026, Month::November, 4),
        "endDate": date_value(2026, Month::November, 8),
        "ownerDisplayName": "Aom",
        "joinId": join_id,
        "joinPassword": join_password
    })
}

async fn create_account_trip(
    pool: &sqlx::PgPool,
    auth: &str,
    join_id: &str,
    join_password: &str,
) -> (StatusCode, Value) {
    let app = support::app(pool.clone());
    let response = post_json_with_auth(
        app,
        "/api/v1/account/trips",
        Some(auth),
        default_account_trip_payload(join_id, join_password),
    )
    .await;

    response_json(response).await
}

async fn insert_account_linked_member(
    pool: &sqlx::PgPool,
    trip_id: Uuid,
    user_id: Option<Uuid>,
    display_name: &str,
) -> Uuid {
    let member_id = Uuid::now_v7();
    sqlx::query(
        "insert into trip_members (
           id, trip_id, user_id, display_name, role, access_status, claimed_at, color
         )
         values ($1, $2, $3, $4, 'organizer', 'active', case when $3 is null then null else now() end, '#2563eb')",
    )
    .bind(member_id)
    .bind(trip_id)
    .bind(user_id)
    .bind(display_name)
    .execute(pool)
    .await
    .unwrap();

    member_id
}

async fn legacy_claim_member_session(
    pool: &sqlx::PgPool,
    member_id: &str,
    participant_password: &str,
) -> Value {
    support::set_trip_dates(pool, "2026-06-01", "2026-06-30").await;
    let app = support::app(pool.clone());
    let (join_status, join_body): (StatusCode, Value) = post_json_response(
        app.clone(),
        "/api/v1/trip-join-sessions",
        json!({"joinCode": "HK-SZ-2025", "tripPassword": "seed-trip-pass"}),
    )
    .await;
    assert_eq!(join_status, StatusCode::OK);
    let join_session_token = join_body["joinSessionToken"].as_str().unwrap();
    let (status, body): (StatusCode, Value) = post_json_response(
        app,
        &format!(
            "/api/v1/trips/{}/members/{member_id}/claims",
            support::TRIP_ID
        ),
        json!({
            "participantPassword": participant_password,
            "joinSessionToken": join_session_token
        }),
    )
    .await;
    assert_eq!(status, StatusCode::OK, "claim response body: {body}");

    body
}

#[sqlx::test(migrations = "../../migrations")]
async fn account_user_can_create_trip_and_becomes_owner(pool: sqlx::PgPool) {
    let session = login_account(&pool, "owner@example.com", false, "").await;
    let user_id = Uuid::parse_str(session["userId"].as_str().unwrap()).unwrap();
    let auth = format!("Bearer {}", session["sessionToken"].as_str().unwrap());
    let app = support::app(pool.clone());

    let response = post_json_with_auth(
        app,
        "/api/v1/account/trips",
        Some(&auth),
        json!({
            "name": " Chiang Mai Food Run ",
            "originLabel": " Bangkok, Thailand ",
            "originCity": " Bangkok ",
            "originCountry": " Thailand ",
            "originCountryCode": " TH ",
            "destinationLabel": " Chiang Mai ",
            "destinationCities": [{
                "city": " Chiang Mai ",
                "country": " Thailand ",
                "countryCode": " TH ",
                "timezone": " Asia/Bangkok ",
                "latitude": 18.7883,
                "longitude": 98.9853
            }],
            "countries": [" Thailand "],
            "startDate": date_value(2026, Month::November, 4),
            "endDate": date_value(2026, Month::November, 8),
            "ownerDisplayName": " Aom ",
            "joinId": " cm-2026 ",
            "joinPassword": "rice-noodle-2026"
        }),
    )
    .await;
    let (status, body): (StatusCode, Value) = response_json(response).await;

    assert_eq!(status, StatusCode::OK);
    assert_eq!(body["trip"]["name"], "Chiang Mai Food Run");
    assert_eq!(body["trip"]["originLabel"], "Bangkok, Thailand");
    assert_eq!(body["trip"]["originCity"], "Bangkok");
    assert_eq!(body["trip"]["originCountry"], "Thailand");
    assert_eq!(body["trip"]["originCountryCode"], "TH");
    assert_eq!(body["trip"]["destinationLabel"], "Chiang Mai");
    assert_eq!(
        body["trip"]["destinationCities"],
        json!([{
            "city": "Chiang Mai",
            "country": "Thailand",
            "countryCode": "TH",
            "timezone": "Asia/Bangkok",
            "latitude": 18.7883,
            "longitude": 98.9853
        }])
    );
    assert_eq!(body["trip"]["countries"], json!(["Thailand"]));
    assert_eq!(
        body["trip"]["startDate"],
        date_value(2026, Month::November, 4)
    );
    assert_eq!(
        body["trip"]["endDate"],
        date_value(2026, Month::November, 8)
    );
    assert_eq!(body["trip"]["joinId"], "CM-2026");
    assert_eq!(body["trip"]["version"], 1);
    assert_eq!(body["ownerMemberId"], body["trip"]["ownerMemberId"]);
    assert_eq!(body["memberSession"]["tripId"], body["trip"]["id"]);
    assert_eq!(body["memberSession"]["memberId"], body["ownerMemberId"]);
    assert!(
        !body["memberSession"]["sessionToken"]
            .as_str()
            .unwrap()
            .is_empty()
    );

    let trip_id = Uuid::parse_str(body["trip"]["id"].as_str().unwrap()).unwrap();
    let owner_member_id = Uuid::parse_str(body["ownerMemberId"].as_str().unwrap()).unwrap();
    let active_plan_variant_id =
        Uuid::parse_str(body["trip"]["activePlanVariantId"].as_str().unwrap()).unwrap();
    assert_eq!(
        body["trip"]["mainTripPlanId"], body["trip"]["activePlanVariantId"],
        "account trip create must expose canonical and legacy Main Plan pointers",
    );

    let trip: (String, String, String, String, String, Uuid, Uuid, i64) = sqlx::query_as(
        "select
           name,
           destination_label,
           start_date::text,
           end_date::text,
           join_id,
           main_trip_plan_id,
           owner_member_id,
           version
         from trips
         where id = $1",
    )
    .bind(trip_id)
    .fetch_one(&pool)
    .await
    .unwrap();
    assert_eq!(trip.0, "Chiang Mai Food Run");
    assert_eq!(trip.1, "Chiang Mai");
    assert_eq!(trip.2, "2026-11-04");
    assert_eq!(trip.3, "2026-11-08");
    assert_eq!(trip.4, "CM-2026");
    assert_eq!(trip.5, active_plan_variant_id);
    assert_eq!(trip.6, owner_member_id);
    assert_eq!(trip.7, 1);

    let owner: (Uuid, String, String, String, bool, String) = sqlx::query_as(
        "select
           user_id,
           display_name,
           role,
           access_status,
           claimed_at is not null,
           color
         from trip_members
         where id = $1 and trip_id = $2",
    )
    .bind(owner_member_id)
    .bind(trip_id)
    .fetch_one(&pool)
    .await
    .unwrap();
    assert_eq!(owner.0, user_id);
    assert_eq!(owner.1, "Aom");
    assert_eq!(owner.2, "owner");
    assert_eq!(owner.3, "active");
    assert!(owner.4);
    assert_eq!(owner.5, "#0f766e");

    let plan: (Uuid, String, String, String) = sqlx::query_as(
        "select trip_id, name, status, description
         from trip_plans
         where id = $1",
    )
    .bind(active_plan_variant_id)
    .fetch_one(&pool)
    .await
    .unwrap();
    assert_eq!(plan.0, trip_id);
    assert_eq!(plan.1, "Main");
    assert_eq!(plan.2, "main");
    assert_eq!(plan.3, "Primary plan");

    let member_session_hash = sagittarius_api::app::auth::hash_session_token_for_tests(
        body["memberSession"]["sessionToken"].as_str().unwrap(),
    );
    let persisted_session_count: i64 = sqlx::query_scalar(
        "select count(*)
         from trip_member_sessions
         where trip_id = $1
           and member_id = $2
           and session_token_hash = $3
           and revoked_at is null
           and expires_at > now()",
    )
    .bind(trip_id)
    .bind(owner_member_id)
    .bind(member_session_hash)
    .fetch_one(&pool)
    .await
    .unwrap();
    assert_eq!(persisted_session_count, 1);

    let audit: (
        Option<Uuid>,
        Option<Uuid>,
        Option<Uuid>,
        Option<Uuid>,
        String,
    ) = sqlx::query_as(
        "select user_id, trip_id, actor_user_id, actor_member_id, event_type
         from account_audit_events
         where trip_id = $1",
    )
    .bind(trip_id)
    .fetch_one(&pool)
    .await
    .unwrap();
    assert_eq!(audit.0, Some(user_id));
    assert_eq!(audit.1, Some(trip_id));
    assert_eq!(audit.2, Some(user_id));
    assert_eq!(audit.3, Some(owner_member_id));
    assert_eq!(audit.4, "trip.created");
}

#[sqlx::test(migrations = "../../migrations")]
async fn account_trip_create_accepts_slim_seed_without_join_credentials(pool: sqlx::PgPool) {
    let session = login_account(&pool, "slim-seed@example.com", false, "").await;
    let auth = format!("Bearer {}", session["sessionToken"].as_str().unwrap());

    let slim_seeds = [
        json!({ "name": "Weekend Escape" }),
        json!({ "destinationLabel": "Chiang Mai" }),
    ];

    for payload in slim_seeds {
        let response = post_json_with_auth(
            support::app(pool.clone()),
            "/api/v1/account/trips",
            Some(&auth),
            payload.clone(),
        )
        .await;
        let (status, body): (StatusCode, Value) = response_json(response).await;

        assert_eq!(
            status,
            StatusCode::OK,
            "slim seed {payload} must create without joinId/joinPassword; body={body}"
        );

        let trip = &body["trip"];
        let trip_id = Uuid::parse_str(trip["id"].as_str().expect("trip.id")).unwrap();
        let join_id = trip["joinId"]
            .as_str()
            .expect("server must generate trip.joinId");
        assert!(
            !join_id.trim().is_empty(),
            "server-generated joinId must be non-empty"
        );
        let join_parts: Vec<&str> = join_id.split('-').collect();
        assert_eq!(
            join_parts.len(),
            3,
            "joinId must be yymm-SLUG-suffix; got {join_id}"
        );
        assert!(
            join_parts[0].len() == 4 && join_parts[0].chars().all(|c| c.is_ascii_digit()),
            "joinId yymm must be 4 digits; got {join_id}"
        );
        assert!(
            join_parts[1].len() == 4
                && join_parts[1]
                    .chars()
                    .all(|c| c.is_ascii_uppercase() || c.is_ascii_digit()),
            "joinId slug must be 4 capitals; got {join_id}"
        );
        assert!(
            join_parts[2].len() == 4
                && join_parts[2]
                    .chars()
                    .all(|c| c.is_ascii_uppercase() || c.is_ascii_digit()),
            "joinId suffix must be 4 chars 0-9A-Z; got {join_id}"
        );
        assert_eq!(
            join_id,
            join_id.to_ascii_uppercase(),
            "joinId must be all uppercase; got {join_id}"
        );
        let join_password = body["joinPassword"]
            .as_str()
            .expect("create must return joinPassword once");
        assert!(
            join_password.len() >= 8,
            "returned joinPassword must be usable"
        );

        if let Some(name) = payload["name"].as_str() {
            assert_eq!(trip["name"], name);
            assert_eq!(
                trip["destinationLabel"], name,
                "name-only slim seed must derive destinationLabel from name"
            );
        }
        if let Some(destination_label) = payload["destinationLabel"].as_str() {
            assert_eq!(trip["destinationLabel"], destination_label);
            assert_eq!(
                trip["name"], destination_label,
                "destination-only slim seed must derive name from destinationLabel"
            );
        }

        assert_eq!(
            trip["mainTripPlanId"], trip["activePlanVariantId"],
            "slim create must expose Main Plan pointers"
        );
        let main_plan_id =
            Uuid::parse_str(trip["activePlanVariantId"].as_str().unwrap()).unwrap();

        assert_eq!(body["memberSession"]["tripId"], trip["id"]);
        assert_eq!(body["memberSession"]["memberId"], body["ownerMemberId"]);
        assert!(
            !body["memberSession"]["sessionToken"]
                .as_str()
                .unwrap()
                .is_empty(),
            "slim create must include memberSession.sessionToken"
        );

        let persisted: (String, String, Uuid) = sqlx::query_as(
            "select join_id, join_password_hash, main_trip_plan_id
             from trips
             where id = $1",
        )
        .bind(trip_id)
        .fetch_one(&pool)
        .await
        .unwrap();
        assert_eq!(persisted.0, join_id);
        assert!(
            !persisted.1.trim().is_empty(),
            "server must persist a join password hash"
        );
        assert_eq!(persisted.2, main_plan_id);

        let plan: (String, String) = sqlx::query_as(
            "select name, status
             from trip_plans
             where id = $1",
        )
        .bind(main_plan_id)
        .fetch_one(&pool)
        .await
        .unwrap();
        assert_eq!(plan.0, "Main");
        assert_eq!(plan.1, "main");
    }
}

#[sqlx::test(migrations = "../../migrations")]
async fn account_trip_create_rejects_empty_seed(pool: sqlx::PgPool) {
    let session = login_account(&pool, "empty-seed@example.com", false, "").await;
    let auth = format!("Bearer {}", session["sessionToken"].as_str().unwrap());

    for payload in [
        json!({}),
        json!({ "name": " ", "destinationLabel": "" }),
    ] {
        let response = post_json_with_auth(
            support::app(pool.clone()),
            "/api/v1/account/trips",
            Some(&auth),
            payload.clone(),
        )
        .await;
        let (status, body): (StatusCode, Value) = response_json(response).await;
        assert_eq!(
            status,
            StatusCode::BAD_REQUEST,
            "empty seed {payload} must 400; body={body}"
        );
    }
}

/// T7-A1: Slim seed with destinationLabel Tokyo (cities/countries omitted) must not
/// invent Thailand / TH / Asia/Bangkok on destination geo.
#[sqlx::test(migrations = "../../migrations")]
async fn account_trip_create_tokyo_destination_geo_is_not_forced_thailand(pool: sqlx::PgPool) {
    let session = login_account(&pool, "tokyo-geo@example.com", false, "").await;
    let auth = format!("Bearer {}", session["sessionToken"].as_str().unwrap());

    let response = post_json_with_auth(
        support::app(pool.clone()),
        "/api/v1/account/trips",
        Some(&auth),
        json!({ "destinationLabel": "Tokyo" }),
    )
    .await;
    let (status, body): (StatusCode, Value) = response_json(response).await;
    assert_eq!(
        status,
        StatusCode::OK,
        "Tokyo slim seed must succeed; body={body}"
    );

    let trip = &body["trip"];
    assert_eq!(trip["destinationLabel"], "Tokyo");

    let cities = trip["destinationCities"]
        .as_array()
        .expect("destinationCities must be present");
    assert!(
        !cities.is_empty(),
        "destinationCities must include at least one city for the seed label"
    );
    let city = &cities[0];
    assert_eq!(city["city"], "Tokyo");

    let country = city["country"].as_str().unwrap_or("");
    let country_code = city["countryCode"].as_str().unwrap_or("");
    let timezone = city["timezone"].as_str().unwrap_or("");
    assert_ne!(
        country, "Thailand",
        "Tokyo destination country must not be invented as Thailand; got {country:?}"
    );
    assert_ne!(
        country_code, "TH",
        "Tokyo destination countryCode must not be invented as TH; got {country_code:?}"
    );
    assert_ne!(
        timezone, "Asia/Bangkok",
        "Tokyo destination timezone must not be invented as Asia/Bangkok; got {timezone:?}"
    );

    let countries = trip["countries"]
        .as_array()
        .expect("countries must be present");
    assert!(
        countries
            .iter()
            .filter_map(|value| value.as_str())
            .all(|name| name != "Thailand"),
        "trip.countries must not invent Thailand for Tokyo; got {countries:?}"
    );
}

/// T7-A2: When destination_cities/countries are omitted, shared destination_geo fill
/// is used; explicit destination_cities in the request still win.
#[sqlx::test(migrations = "../../migrations")]
async fn account_trip_create_omitted_geo_uses_fill_explicit_cities_win(pool: sqlx::PgPool) {
    let session = login_account(&pool, "geo-fill-win@example.com", false, "").await;
    let auth = format!("Bearer {}", session["sessionToken"].as_str().unwrap());

    // Omitted cities/countries → shared destination_geo fill (never fake Thailand).
    let omitted_response = post_json_with_auth(
        support::app(pool.clone()),
        "/api/v1/account/trips",
        Some(&auth),
        json!({ "destinationLabel": "Tokyo" }),
    )
    .await;
    let (omitted_status, omitted_body): (StatusCode, Value) =
        response_json(omitted_response).await;
    assert_eq!(
        omitted_status,
        StatusCode::OK,
        "omitted geo slim seed must succeed; body={omitted_body}"
    );
    let omitted_trip = &omitted_body["trip"];
    let omitted_city = &omitted_trip["destinationCities"]
        .as_array()
        .expect("destinationCities")[0];
    assert_eq!(omitted_city["city"], "Tokyo");
    assert_ne!(
        omitted_city["country"].as_str().unwrap_or(""),
        "Thailand",
        "omitted destination_cities must use destination_geo fill, not invent Thailand"
    );
    assert_ne!(
        omitted_city["countryCode"].as_str().unwrap_or(""),
        "TH",
        "omitted destination_cities must use destination_geo fill, not invent TH"
    );
    assert_ne!(
        omitted_city["timezone"].as_str().unwrap_or(""),
        "Asia/Bangkok",
        "omitted destination_cities must use destination_geo fill, not invent Asia/Bangkok"
    );
    let omitted_countries = omitted_trip["countries"]
        .as_array()
        .expect("countries");
    assert!(
        omitted_countries
            .iter()
            .filter_map(|value| value.as_str())
            .all(|name| name != "Thailand"),
        "omitted countries must use destination_geo fill, not invent Thailand; got {omitted_countries:?}"
    );

    // Explicit destination_cities still win over fill for the same label.
    let explicit_cities = json!([{
        "city": "Client City",
        "country": "Japan",
        "countryCode": "JP",
        "timezone": "Asia/Tokyo",
        "latitude": 35.68,
        "longitude": 139.76
    }]);
    let explicit_response = post_json_with_auth(
        support::app(pool.clone()),
        "/api/v1/account/trips",
        Some(&auth),
        json!({
            "destinationLabel": "Tokyo",
            "destinationCities": explicit_cities,
            "countries": ["Japan"]
        }),
    )
    .await;
    let (explicit_status, explicit_body): (StatusCode, Value) =
        response_json(explicit_response).await;
    assert_eq!(
        explicit_status,
        StatusCode::OK,
        "explicit destinationCities must succeed; body={explicit_body}"
    );
    let explicit_trip = &explicit_body["trip"];
    assert_eq!(
        explicit_trip["destinationCities"], explicit_cities,
        "explicit destinationCities in the request must win over geo fill"
    );
    assert_eq!(
        explicit_trip["countries"],
        json!(["Japan"]),
        "explicit countries in the request must persist"
    );
}

/// T7-A3: Auth gate on account create and empty name+destination rejection remain unchanged.
#[sqlx::test(migrations = "../../migrations")]
async fn account_trip_create_keeps_auth_gate_and_rejects_empty_seed(pool: sqlx::PgPool) {
    let unauth = post_json_with_auth(
        support::app(pool.clone()),
        "/api/v1/account/trips",
        None,
        json!({ "destinationLabel": "Tokyo" }),
    )
    .await;
    let (unauth_status, unauth_body): (StatusCode, Value) = response_json(unauth).await;
    assert_eq!(unauth_status, StatusCode::UNAUTHORIZED);
    assert_eq!(unauth_body["code"], "unauthenticated");

    let session = login_account(&pool, "t7-empty-seed@example.com", false, "").await;
    let auth = format!("Bearer {}", session["sessionToken"].as_str().unwrap());
    for payload in [
        json!({}),
        json!({ "name": " ", "destinationLabel": "" }),
    ] {
        let response = post_json_with_auth(
            support::app(pool.clone()),
            "/api/v1/account/trips",
            Some(&auth),
            payload.clone(),
        )
        .await;
        let (status, body): (StatusCode, Value) = response_json(response).await;
        assert_eq!(
            status,
            StatusCode::BAD_REQUEST,
            "empty seed {payload} must remain 400; body={body}"
        );
    }
}

#[sqlx::test(migrations = "../../migrations")]
async fn account_trip_create_slim_seed_accepts_optional_client_join_credentials(
    pool: sqlx::PgPool,
) {
    let session = login_account(&pool, "slim-join@example.com", false, "").await;
    let auth = format!("Bearer {}", session["sessionToken"].as_str().unwrap());
    let join_id = "JAPAN-AUTUMN-26-TEST";
    let join_password = "shared-access-ok";

    let response = post_json_with_auth(
        support::app(pool.clone()),
        "/api/v1/account/trips",
        Some(&auth),
        json!({
            "destinationLabel": "Japan",
            "joinId": join_id,
            "joinPassword": join_password,
        }),
    )
    .await;
    let (status, body): (StatusCode, Value) = response_json(response).await;
    assert_eq!(status, StatusCode::OK, "body={body}");
    assert_eq!(body["trip"]["joinId"], join_id);
    assert_eq!(body["joinPassword"], join_password);

    let trip_id = Uuid::parse_str(body["trip"]["id"].as_str().unwrap()).unwrap();
    let (persisted_join_id,): (String,) =
        sqlx::query_as("select join_id from trips where id = $1")
            .bind(trip_id)
            .fetch_one(&pool)
            .await
            .unwrap();
    assert_eq!(persisted_join_id, join_id);

    let (join_status, join_body): (StatusCode, Value) = post_json_response(
        support::app(pool.clone()),
        "/api/v1/trip-join-sessions",
        json!({
            "joinCode": join_id,
            "tripPassword": join_password,
        }),
    )
    .await;
    assert_eq!(join_status, StatusCode::OK, "join body={join_body}");
}

/// T1 A2 — guest-style defaults when start/end/party/origin are omitted; provided
/// values persist. Matches public/guest create: Bangkok origin, partySize 1,
/// start = UTC today, end = start + 7 days.
#[sqlx::test(migrations = "../../migrations")]
async fn account_trip_create_applies_guest_defaults_and_persists_optional_fields(
    pool: sqlx::PgPool,
) {
    let session = login_account(&pool, "guest-defaults@example.com", false, "").await;
    let auth = format!("Bearer {}", session["sessionToken"].as_str().unwrap());

    let before = time::OffsetDateTime::now_utc().date();
    let omitted_response = post_json_with_auth(
        support::app(pool.clone()),
        "/api/v1/account/trips",
        Some(&auth),
        json!({ "name": "Flexible Escape" }),
    )
    .await;
    let after = time::OffsetDateTime::now_utc().date();
    let (omitted_status, omitted_body): (StatusCode, Value) =
        response_json(omitted_response).await;

    assert_eq!(
        omitted_status,
        StatusCode::OK,
        "name-only create must succeed; body={omitted_body}"
    );
    let omitted_trip = &omitted_body["trip"];
    assert_eq!(omitted_trip["originLabel"], "Bangkok, Thailand");
    assert_eq!(omitted_trip["originCity"], "Bangkok");
    assert_eq!(omitted_trip["originCountry"], "Thailand");
    assert_eq!(omitted_trip["originCountryCode"], "TH");
    assert_eq!(omitted_trip["partySize"], 1);

    let start = Date::parse(
        omitted_trip["startDate"].as_str().expect("startDate"),
        &time::format_description::well_known::Iso8601::DATE,
    )
    .expect("startDate must be ISO date");
    let end = Date::parse(
        omitted_trip["endDate"].as_str().expect("endDate"),
        &time::format_description::well_known::Iso8601::DATE,
    )
    .expect("endDate must be ISO date");
    assert!(
        start >= before && start <= after,
        "omitted startDate must be UTC today; got {start}, window {before}..{after}"
    );
    assert_eq!(
        end,
        start + time::Duration::days(7),
        "omitted endDate must be startDate + 7 days (public/guest window)"
    );

    let omitted_trip_id =
        Uuid::parse_str(omitted_trip["id"].as_str().expect("trip.id")).unwrap();
    let omitted_row: (
        String,
        String,
        String,
        String,
        i32,
        String,
        String,
    ) = sqlx::query_as(
        "select
           origin_label,
           origin_city,
           origin_country,
           origin_country_code,
           party_size,
           start_date::text,
           end_date::text
         from trips
         where id = $1",
    )
    .bind(omitted_trip_id)
    .fetch_one(&pool)
    .await
    .unwrap();
    assert_eq!(omitted_row.0, "Bangkok, Thailand");
    assert_eq!(omitted_row.1, "Bangkok");
    assert_eq!(omitted_row.2, "Thailand");
    assert_eq!(omitted_row.3, "TH");
    assert_eq!(omitted_row.4, 1);
    assert_eq!(omitted_row.5, omitted_trip["startDate"]);
    assert_eq!(omitted_row.6, omitted_trip["endDate"]);

    let provided_start = date_value(2027, Month::March, 10);
    let provided_end = date_value(2027, Month::March, 18);
    let provided_response = post_json_with_auth(
        support::app(pool.clone()),
        "/api/v1/account/trips",
        Some(&auth),
        json!({
            "name": "Osaka Spring",
            "originLabel": "Singapore",
            "originCity": "Singapore",
            "originCountry": "Singapore",
            "originCountryCode": "SG",
            "partySize": 4,
            "startDate": provided_start,
            "endDate": provided_end
        }),
    )
    .await;
    let (provided_status, provided_body): (StatusCode, Value) =
        response_json(provided_response).await;

    assert_eq!(
        provided_status,
        StatusCode::OK,
        "slim create with optional fields must succeed; body={provided_body}"
    );
    let provided_trip = &provided_body["trip"];
    assert_eq!(provided_trip["originLabel"], "Singapore");
    assert_eq!(provided_trip["originCity"], "Singapore");
    assert_eq!(provided_trip["originCountry"], "Singapore");
    assert_eq!(provided_trip["originCountryCode"], "SG");
    assert_eq!(provided_trip["partySize"], 4);
    assert_eq!(provided_trip["startDate"], provided_start);
    assert_eq!(provided_trip["endDate"], provided_end);

    let provided_trip_id =
        Uuid::parse_str(provided_trip["id"].as_str().expect("trip.id")).unwrap();
    let provided_row: (
        String,
        String,
        String,
        String,
        i32,
        String,
        String,
    ) = sqlx::query_as(
        "select
           origin_label,
           origin_city,
           origin_country,
           origin_country_code,
           party_size,
           start_date::text,
           end_date::text
         from trips
         where id = $1",
    )
    .bind(provided_trip_id)
    .fetch_one(&pool)
    .await
    .unwrap();
    assert_eq!(provided_row.0, "Singapore");
    assert_eq!(provided_row.1, "Singapore");
    assert_eq!(provided_row.2, "Singapore");
    assert_eq!(provided_row.3, "SG");
    assert_eq!(provided_row.4, 4);
    assert_eq!(provided_row.5, "2027-03-10");
    assert_eq!(provided_row.6, "2027-03-18");
}

#[sqlx::test(migrations = "../../migrations")]
async fn account_trip_contract_owner_member_session_uses_30_day_ttl(pool: sqlx::PgPool) {
    let account = login_account(&pool, "owner-session@example.com", true, "Owner laptop").await;
    let auth = format!("Bearer {}", account["sessionToken"].as_str().unwrap());
    let (status, body) =
        create_account_trip(&pool, &auth, "OWNER-TTL-2026", "owner-ttl-pass").await;

    assert_eq!(status, StatusCode::OK);
    let member_session = &body["memberSession"];
    let created_at = time::OffsetDateTime::parse(
        member_session["createdAt"].as_str().unwrap(),
        &time::format_description::well_known::Rfc3339,
    )
    .unwrap();
    let expires_at = time::OffsetDateTime::parse(
        member_session["expiresAt"].as_str().unwrap(),
        &time::format_description::well_known::Rfc3339,
    )
    .unwrap();

    assert_eq!(expires_at - created_at, time::Duration::days(30));
}

#[sqlx::test(migrations = "../../migrations")]
async fn account_portal_routes_return_explorer_todos_and_vault(pool: sqlx::PgPool) {
    let session = login_account(&pool, "portal@example.com", true, "Portal laptop").await;
    let auth = format!("Bearer {}", session["sessionToken"].as_str().unwrap());
    let (create_status, create_body) =
        create_account_trip(&pool, &auth, "portal-2026", "portal-password-2026").await;
    assert_eq!(create_status, StatusCode::OK);
    let trip_id = Uuid::parse_str(create_body["trip"]["id"].as_str().unwrap()).unwrap();
    let member_id = Uuid::parse_str(create_body["ownerMemberId"].as_str().unwrap()).unwrap();
    let plan_variant_id =
        Uuid::parse_str(create_body["trip"]["activePlanVariantId"].as_str().unwrap()).unwrap();
    let item_id = Uuid::now_v7();
    let task_id = Uuid::now_v7();

    sqlx::query(
        "insert into itinerary_items (
           id, trip_id, trip_plan_id, day, sort_order, start_time, activity, activity_type,
           place, map_link, transportation, note, created_by
         )
         values ($1, $2, $3, '2026-11-04', 100, '09:00', 'Temple visit', 'attraction',
           'Chiang Mai', '', 'walk', 'Bring paper tickets', $4)",
    )
    .bind(item_id)
    .bind(trip_id)
    .bind(plan_variant_id)
    .bind(member_id)
    .execute(&pool)
    .await
    .unwrap();
    sqlx::query(
        "insert into trip_tasks (
           id, trip_id, title, status, visibility, kind, created_by, assignee_id, related_item_id
         )
         values ($1, $2, 'Book train', 'open', 'shared', 'booking', $3, $3, $4)",
    )
    .bind(task_id)
    .bind(trip_id)
    .bind(member_id)
    .bind(item_id)
    .execute(&pool)
    .await
    .unwrap();

    let app = support::app(pool.clone());
    let (explorer_status, explorer): (StatusCode, Value) =
        response_json(get_with_auth(app.clone(), "/api/v1/account/explorer", Some(&auth)).await)
            .await;
    assert_eq!(explorer_status, StatusCode::OK);
    assert_eq!(explorer["upcomingTrips"], 1);
    assert_eq!(explorer["destinationCount"], 1);
    assert_eq!(explorer["nextTrip"]["id"], create_body["trip"]["id"]);

    let (todo_status, todos): (StatusCode, Value) =
        response_json(get_with_auth(app.clone(), "/api/v1/account/to-dos", Some(&auth)).await)
            .await;
    assert_eq!(todo_status, StatusCode::OK);
    assert_eq!(todos[0]["title"], "Book train");
    assert_eq!(todos[0]["tripName"], "portal-2026 Food Run");

    let create_vault = post_json_with_auth(
        app.clone(),
        "/api/v1/account/vault",
        Some(&auth),
        json!({
            "tripId": trip_id,
            "kind": "file",
            "title": "Tickets",
            "detail": "PDF copy",
            "externalUrl": "https://example.test/tickets.pdf"
        }),
    )
    .await;
    let (vault_create_status, vault_created): (StatusCode, Value) =
        response_json(create_vault).await;
    assert_eq!(vault_create_status, StatusCode::CREATED);
    assert_eq!(vault_created["kind"], "file");
    assert_eq!(vault_created["tripId"], trip_id.to_string());
    assert_eq!(vault_created["tripName"], "portal-2026 Food Run");

    let (vault_status, vault): (StatusCode, Value) =
        response_json(get_with_auth(app, "/api/v1/account/vault", Some(&auth)).await).await;
    assert_eq!(vault_status, StatusCode::OK);
    assert!(
        vault
            .as_array()
            .unwrap()
            .iter()
            .any(|item| item["title"] == "Tickets")
    );
    assert!(
        vault
            .as_array()
            .unwrap()
            .iter()
            .any(|item| item["title"] == "Temple visit" && item["source"] == "itinerary")
    );
}

#[sqlx::test(migrations = "../../migrations")]
async fn account_vault_rejects_trip_id_outside_account_membership(pool: sqlx::PgPool) {
    let owner_session = login_account(&pool, "vault-owner@example.com", false, "").await;
    let owner_auth = format!("Bearer {}", owner_session["sessionToken"].as_str().unwrap());
    let outsider_session = login_account(&pool, "vault-outsider@example.com", false, "").await;
    let outsider_auth = format!(
        "Bearer {}",
        outsider_session["sessionToken"].as_str().unwrap()
    );
    let (create_status, create_body) =
        create_account_trip(&pool, &owner_auth, "vault-private", "vault-password-2026").await;
    assert_eq!(create_status, StatusCode::OK);
    let trip_id = create_body["trip"]["id"].as_str().unwrap();

    let response = post_json_with_auth(
        support::app(pool.clone()),
        "/api/v1/account/vault",
        Some(&outsider_auth),
        json!({
            "tripId": trip_id,
            "kind": "note",
            "title": "Should not attach",
            "detail": "Must not leak trip metadata",
            "externalUrl": null
        }),
    )
    .await;
    let (status, body): (StatusCode, Value) = response_json(response).await;
    assert_eq!(status, StatusCode::FORBIDDEN);
    assert_eq!(body["code"], "forbidden");

    let leaked_count: i64 = sqlx::query_scalar(
        "select count(*)
         from account_vault_items
         where trip_id = $1",
    )
    .bind(Uuid::parse_str(trip_id).unwrap())
    .fetch_one(&pool)
    .await
    .unwrap();
    assert_eq!(leaked_count, 0);
}

#[sqlx::test(migrations = "../../migrations")]
async fn account_trip_join_password_hash_uses_random_salt_and_remains_joinable(pool: sqlx::PgPool) {
    let session = login_account(&pool, "owner@example.com", false, "").await;
    let auth = format!("Bearer {}", session["sessionToken"].as_str().unwrap());

    let (first_status, first_body) =
        create_account_trip(&pool, &auth, "random-salt-1", "shared-password-2026").await;
    assert_eq!(first_status, StatusCode::OK);
    let (second_status, second_body) =
        create_account_trip(&pool, &auth, "random-salt-2", "shared-password-2026").await;
    assert_eq!(second_status, StatusCode::OK);

    let first_trip_id = Uuid::parse_str(first_body["trip"]["id"].as_str().unwrap()).unwrap();
    let second_trip_id = Uuid::parse_str(second_body["trip"]["id"].as_str().unwrap()).unwrap();
    let first_hash: String = sqlx::query_scalar(
        "select join_password_hash
         from trips
         where id = $1",
    )
    .bind(first_trip_id)
    .fetch_one(&pool)
    .await
    .unwrap();
    let second_hash: String = sqlx::query_scalar(
        "select join_password_hash
         from trips
         where id = $1",
    )
    .bind(second_trip_id)
    .fetch_one(&pool)
    .await
    .unwrap();
    assert_ne!(first_hash, second_hash);

    for join_id in ["random-salt-1", "random-salt-2"] {
        let app = support::app(pool.clone());
        let (status, body): (StatusCode, Value) = post_json_response(
            app,
            "/api/v1/trip-join-sessions",
            json!({
                "joinCode": join_id,
                "tripPassword": "shared-password-2026"
            }),
        )
        .await;
        assert_eq!(status, StatusCode::OK);
        assert_eq!(body["trip"]["joinId"], join_id.to_ascii_uppercase());
        assert_eq!(
            body["trip"]["mainTripPlanId"], body["trip"]["activePlanVariantId"],
            "join response must expose canonical and legacy Main Plan pointers",
        );
    }
}

#[sqlx::test(migrations = "../../migrations")]
async fn duplicate_account_trip_join_id_returns_stable_conflict(pool: sqlx::PgPool) {
    let session = login_account(&pool, "owner@example.com", false, "").await;
    let auth = format!("Bearer {}", session["sessionToken"].as_str().unwrap());

    let (first_status, _) =
        create_account_trip(&pool, &auth, "dupe-join-id", "rice-noodle-2026").await;
    assert_eq!(first_status, StatusCode::OK);
    let (second_status, second_body) =
        create_account_trip(&pool, &auth, " DUPE-JOIN-ID ", "rice-noodle-2027").await;

    assert_eq!(second_status, StatusCode::CONFLICT);
    assert_eq!(second_body["code"], "trip_join_id_already_exists");

    let trip_count: i64 = sqlx::query_scalar(
        "select count(*)
         from trips
         where join_id = 'DUPE-JOIN-ID'",
    )
    .fetch_one(&pool)
    .await
    .unwrap();
    assert_eq!(trip_count, 1);
}

#[sqlx::test(migrations = "../../migrations")]
async fn account_trip_creation_rejects_oversized_join_password(pool: sqlx::PgPool) {
    let session = login_account(&pool, "owner@example.com", false, "").await;
    let auth = format!("Bearer {}", session["sessionToken"].as_str().unwrap());
    let oversized_password = "p".repeat(257);

    let (status, body) =
        create_account_trip(&pool, &auth, "oversized-password", &oversized_password).await;

    assert_eq!(status, StatusCode::BAD_REQUEST);
    assert_eq!(body["code"], "invalid_request");
}

#[sqlx::test(migrations = "../../migrations")]
async fn account_trip_creation_validates_text_and_join_id(pool: sqlx::PgPool) {
    let session = login_account(&pool, "owner@example.com", false, "").await;
    let auth = format!("Bearer {}", session["sessionToken"].as_str().unwrap());
    let oversized_name = "x".repeat(121);
    let oversized_join_id = "x".repeat(33);

    let mut empty_name = default_account_trip_payload("valid-empty-name", "rice-noodle-2026");
    empty_name["name"] = json!(" ");
    let mut oversized_name_payload =
        default_account_trip_payload("valid-oversized-name", "rice-noodle-2026");
    oversized_name_payload["name"] = json!(oversized_name);
    let mut empty_join_id = default_account_trip_payload("valid-empty-join", "rice-noodle-2026");
    empty_join_id["joinId"] = json!(" ");
    let mut oversized_join_payload =
        default_account_trip_payload("valid-oversized-join", "rice-noodle-2026");
    oversized_join_payload["joinId"] = json!(oversized_join_id);

    let cases = [
        empty_name,
        oversized_name_payload,
        empty_join_id,
        oversized_join_payload,
    ];

    for payload in cases {
        let response = post_json_with_auth(
            support::app(pool.clone()),
            "/api/v1/account/trips",
            Some(&auth),
            payload,
        )
        .await;
        let (status, body): (StatusCode, Value) = response_json(response).await;
        assert_eq!(status, StatusCode::BAD_REQUEST);
        assert_eq!(body["code"], "invalid_request");
    }
}

#[sqlx::test(migrations = "../../migrations")]
async fn account_trip_creation_validates_dates_and_auth(pool: sqlx::PgPool) {
    let app = support::app(pool.clone());
    let response = post_json_with_auth(
        app,
        "/api/v1/account/trips",
        None,
        default_account_trip_payload("CM-2026", "rice-noodle-2026"),
    )
    .await;
    let (status, body): (StatusCode, Value) = response_json(response).await;
    assert_eq!(status, StatusCode::UNAUTHORIZED);
    assert_eq!(body["code"], "unauthenticated");

    let session = login_account(&pool, "owner@example.com", false, "").await;
    let auth = format!("Bearer {}", session["sessionToken"].as_str().unwrap());
    let app = support::app(pool);
    let mut invalid_dates = default_account_trip_payload("CM-2026", "rice-noodle-2026");
    invalid_dates["startDate"] = date_value(2026, Month::November, 9);
    invalid_dates["endDate"] = date_value(2026, Month::November, 8);
    let response =
        post_json_with_auth(app, "/api/v1/account/trips", Some(&auth), invalid_dates).await;
    let (status, body): (StatusCode, Value) = response_json(response).await;
    assert_eq!(status, StatusCode::BAD_REQUEST);
    assert_eq!(body["code"], "invalid_request");
}

#[sqlx::test(migrations = "../../migrations")]
async fn account_can_list_trip_history_and_stats(pool: sqlx::PgPool) {
    let session = login_account(&pool, "owner@example.com", false, "").await;
    let auth = format!("Bearer {}", session["sessionToken"].as_str().unwrap());
    let (create_status, create_body) =
        create_account_trip(&pool, &auth, "history-stats", "rice-noodle-2026").await;
    assert_eq!(create_status, StatusCode::OK);
    let trip_id = create_body["trip"]["id"].as_str().unwrap();
    let owner_member_id = create_body["ownerMemberId"].as_str().unwrap();

    let trips_response = get_with_auth(
        support::app(pool.clone()),
        "/api/v1/account/trips",
        Some(&auth),
    )
    .await;
    let (trips_status, trips): (StatusCode, Value) = response_json(trips_response).await;

    assert_eq!(trips_status, StatusCode::OK);
    let trips = trips.as_array().unwrap();
    assert_eq!(trips.len(), 1);
    assert_eq!(trips[0]["id"], trip_id);
    assert_eq!(trips[0]["name"], "history-stats Food Run");
    assert_eq!(trips[0]["destinationLabel"], "Chiang Mai");
    assert_eq!(trips[0]["startDate"], date_value(2026, Month::November, 4));
    assert_eq!(trips[0]["endDate"], date_value(2026, Month::November, 8));
    assert_eq!(trips[0]["role"], "owner");
    assert_eq!(trips[0]["memberId"], owner_member_id);
    assert_eq!(trips[0]["ownerMemberId"], owner_member_id);
    assert_eq!(trips[0]["isOwner"], true);
    assert!(trips[0]["joinedAt"].as_str().unwrap().ends_with('Z'));

    let stats_response = get_with_auth(
        support::app(pool.clone()),
        "/api/v1/account/trip-stats",
        Some(&auth),
    )
    .await;
    let (stats_status, stats): (StatusCode, Value) = response_json(stats_response).await;

    assert_eq!(stats_status, StatusCode::OK);
    assert_eq!(stats["tripsTotal"], 1);
    assert_eq!(stats["tripsOwned"], 1);
    assert_eq!(stats["activeTrips"], 1);
}

#[sqlx::test(migrations = "../../migrations")]
async fn account_can_open_linked_trip_without_trip_password(pool: sqlx::PgPool) {
    let session = login_account(&pool, "owner-open@example.com", false, "").await;
    let auth = format!("Bearer {}", session["sessionToken"].as_str().unwrap());
    let (create_status, create_body) =
        create_account_trip(&pool, &auth, "account-open", "rice-noodle-2026").await;
    assert_eq!(create_status, StatusCode::OK);
    let trip_id = create_body["trip"]["id"].as_str().unwrap();
    let owner_member_id = create_body["ownerMemberId"].as_str().unwrap();

    let session_response = post_json_with_auth(
        support::app(pool.clone()),
        &format!("/api/v1/account/trips/{trip_id}/member-sessions"),
        Some(&auth),
        json!({}),
    )
    .await;
    let (session_status, member_session): (StatusCode, Value) =
        response_json(session_response).await;

    assert_eq!(session_status, StatusCode::OK);
    assert_eq!(member_session["tripId"], trip_id);
    assert_eq!(member_session["memberId"], owner_member_id);
    assert!(!member_session["sessionToken"].as_str().unwrap().is_empty());

    let trip_response = get_with_auth(
        support::app(pool),
        &format!("/api/v1/trips/{trip_id}"),
        Some(&format!(
            "Bearer {}",
            member_session["sessionToken"].as_str().unwrap()
        )),
    )
    .await;
    let (trip_status, trip_body): (StatusCode, Value) = response_json(trip_response).await;

    assert_eq!(trip_status, StatusCode::OK);
    assert_eq!(trip_body["trip"]["id"], trip_id);
}

#[sqlx::test(migrations = "../../migrations")]
async fn account_trip_history_filters_disabled_members_and_deleted_trips(pool: sqlx::PgPool) {
    let session = login_account(&pool, "owner@example.com", false, "").await;
    let user_id = Uuid::parse_str(session["userId"].as_str().unwrap()).unwrap();
    let auth = format!("Bearer {}", session["sessionToken"].as_str().unwrap());
    let other_session = login_account(&pool, "other-owner@example.com", false, "").await;
    let other_auth = format!("Bearer {}", other_session["sessionToken"].as_str().unwrap());
    let (active_status, active_body) =
        create_account_trip(&pool, &auth, "active-history", "rice-noodle-2026").await;
    assert_eq!(active_status, StatusCode::OK);
    let (disabled_status, disabled_body) =
        create_account_trip(&pool, &other_auth, "disabled-history", "rice-noodle-2026").await;
    assert_eq!(disabled_status, StatusCode::OK);
    let (deleted_status, deleted_body) =
        create_account_trip(&pool, &auth, "deleted-history", "rice-noodle-2026").await;
    assert_eq!(deleted_status, StatusCode::OK);

    let active_trip_id = Uuid::parse_str(active_body["trip"]["id"].as_str().unwrap()).unwrap();
    let disabled_trip_id = Uuid::parse_str(disabled_body["trip"]["id"].as_str().unwrap()).unwrap();
    let disabled_member_id =
        insert_account_linked_member(&pool, disabled_trip_id, Some(user_id), "Aom Disabled").await;
    let deleted_trip_id = Uuid::parse_str(deleted_body["trip"]["id"].as_str().unwrap()).unwrap();

    sqlx::query(
        "update trip_members
         set access_status = 'disabled'
         where trip_id = $1 and id = $2",
    )
    .bind(disabled_trip_id)
    .bind(disabled_member_id)
    .execute(&pool)
    .await
    .unwrap();
    sqlx::query(
        "update trips
         set deleted_at = now()
         where id = $1",
    )
    .bind(deleted_trip_id)
    .execute(&pool)
    .await
    .unwrap();

    let trips_response = get_with_auth(
        support::app(pool.clone()),
        "/api/v1/account/trips",
        Some(&auth),
    )
    .await;
    let (trips_status, trips): (StatusCode, Value) = response_json(trips_response).await;

    assert_eq!(trips_status, StatusCode::OK);
    let trips = trips.as_array().unwrap();
    assert_eq!(trips.len(), 1);
    assert_eq!(trips[0]["id"], active_trip_id.to_string());

    let stats_response = get_with_auth(
        support::app(pool.clone()),
        "/api/v1/account/trip-stats",
        Some(&auth),
    )
    .await;
    let (stats_status, stats): (StatusCode, Value) = response_json(stats_response).await;

    assert_eq!(stats_status, StatusCode::OK);
    assert_eq!(stats["tripsTotal"], 1);
    assert_eq!(stats["tripsOwned"], 1);
    assert_eq!(stats["activeTrips"], 1);
}

#[sqlx::test(migrations = "../../migrations")]
async fn account_trip_history_and_stats_require_bearer(pool: sqlx::PgPool) {
    let trips_response =
        get_with_auth(support::app(pool.clone()), "/api/v1/account/trips", None).await;
    let (trips_status, trips_body): (StatusCode, Value) = response_json(trips_response).await;
    assert_eq!(trips_status, StatusCode::UNAUTHORIZED);
    assert_eq!(trips_body["code"], "unauthenticated");

    let stats_response =
        get_with_auth(support::app(pool), "/api/v1/account/trip-stats", None).await;
    let (stats_status, stats_body): (StatusCode, Value) = response_json(stats_response).await;
    assert_eq!(stats_status, StatusCode::UNAUTHORIZED);
    assert_eq!(stats_body["code"], "unauthenticated");
}

#[sqlx::test(migrations = "../../migrations")]
async fn account_claims_existing_temp_member_after_member_session_proof(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    let member_session = legacy_claim_member_session(&pool, support::TRAVELER_ID, "1234").await;
    let member_session_token = member_session["sessionToken"].as_str().unwrap();
    let session = login_account(&pool, "traveler@example.com", false, "").await;
    let user_id = Uuid::parse_str(session["userId"].as_str().unwrap()).unwrap();
    let auth = format!("Bearer {}", session["sessionToken"].as_str().unwrap());
    let trip_id = Uuid::parse_str(support::TRIP_ID).unwrap();
    let member_id = Uuid::parse_str(support::TRAVELER_ID).unwrap();

    let response = post_json_with_auth(
        support::app(pool.clone()),
        &format!("/api/v1/trips/{trip_id}/members/{member_id}/account-links"),
        Some(&auth),
        json!({"memberSessionToken": member_session_token}),
    )
    .await;
    let (status, body): (StatusCode, Value) = response_json(response).await;

    assert_eq!(status, StatusCode::OK);
    assert_eq!(body["tripId"], support::TRIP_ID);
    assert_eq!(body["memberId"], support::TRAVELER_ID);
    assert_eq!(body["userId"], user_id.to_string());
    assert_eq!(body["role"], "traveler");

    let member: (Option<Uuid>, bool) = sqlx::query_as(
        "select user_id, claimed_at is not null
         from trip_members
         where trip_id = $1 and id = $2",
    )
    .bind(trip_id)
    .bind(member_id)
    .fetch_one(&pool)
    .await
    .unwrap();
    assert_eq!(member.0, Some(user_id));
    assert!(member.1);

    let audit: (
        Option<Uuid>,
        Option<Uuid>,
        Option<Uuid>,
        Option<Uuid>,
        String,
        Value,
    ) = sqlx::query_as(
        "select user_id, trip_id, actor_user_id, actor_member_id, event_type, payload
         from account_audit_events
         where trip_id = $1 and event_type = 'member.claimed_account'",
    )
    .bind(trip_id)
    .fetch_one(&pool)
    .await
    .unwrap();
    assert_eq!(audit.0, Some(user_id));
    assert_eq!(audit.1, Some(trip_id));
    assert_eq!(audit.2, Some(user_id));
    assert_eq!(audit.3, Some(member_id));
    assert_eq!(audit.4, "member.claimed_account");
    assert_eq!(audit.5, json!({}));
}

#[sqlx::test(migrations = "../../migrations")]
async fn account_claim_accepts_valid_member_session_after_trip_window(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    support::set_trip_dates(&pool, "2020-01-01", "2020-01-02").await;
    support::claim_member(&pool, support::TRAVELER_ID, "1234", "active").await;
    let member_session_token = support::create_session_with_expiry(
        &pool,
        support::TRAVELER_ID,
        time::OffsetDateTime::now_utc() + time::Duration::days(7),
    )
    .await;
    let session = login_account(&pool, "traveler-after-window@example.com", false, "").await;
    let auth = format!("Bearer {}", session["sessionToken"].as_str().unwrap());
    let user_id = Uuid::parse_str(session["userId"].as_str().unwrap()).unwrap();
    let trip_id = Uuid::parse_str(support::TRIP_ID).unwrap();
    let member_id = Uuid::parse_str(support::TRAVELER_ID).unwrap();

    let response = post_json_with_auth(
        support::app(pool.clone()),
        &format!("/api/v1/trips/{trip_id}/members/{member_id}/account-links"),
        Some(&auth),
        json!({"memberSessionToken": member_session_token}),
    )
    .await;
    let (status, body): (StatusCode, Value) = response_json(response).await;

    assert_eq!(status, StatusCode::OK);
    assert_eq!(body["userId"], user_id.to_string());
    assert_eq!(body["memberId"], support::TRAVELER_ID);
}

#[sqlx::test(migrations = "../../migrations")]
async fn account_claim_is_idempotent_for_same_account_user(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    let member_session = legacy_claim_member_session(&pool, support::TRAVELER_ID, "1234").await;
    let member_session_token = member_session["sessionToken"].as_str().unwrap();
    let session = login_account(&pool, "traveler@example.com", false, "").await;
    let auth = format!("Bearer {}", session["sessionToken"].as_str().unwrap());
    let user_id = Uuid::parse_str(session["userId"].as_str().unwrap()).unwrap();
    let trip_id = Uuid::parse_str(support::TRIP_ID).unwrap();
    let member_id = Uuid::parse_str(support::TRAVELER_ID).unwrap();

    sqlx::query(
        "update trip_members
         set user_id = $1, claimed_at = coalesce(claimed_at, now())
         where trip_id = $2 and id = $3",
    )
    .bind(user_id)
    .bind(trip_id)
    .bind(member_id)
    .execute(&pool)
    .await
    .unwrap();

    let response = post_json_with_auth(
        support::app(pool.clone()),
        &format!("/api/v1/trips/{trip_id}/members/{member_id}/account-links"),
        Some(&auth),
        json!({"memberSessionToken": member_session_token}),
    )
    .await;
    let (status, body): (StatusCode, Value) = response_json(response).await;

    assert_eq!(status, StatusCode::OK);
    assert_eq!(body["tripId"], support::TRIP_ID);
    assert_eq!(body["memberId"], support::TRAVELER_ID);
    assert_eq!(body["userId"], user_id.to_string());
    assert_eq!(body["role"], "traveler");
}

#[sqlx::test(migrations = "../../migrations")]
async fn account_claim_for_disabled_member_returns_forbidden_after_session_proof(
    pool: sqlx::PgPool,
) {
    support::seed_trip(&pool).await;
    let member_session = legacy_claim_member_session(&pool, support::TRAVELER_ID, "1234").await;
    let member_session_token = member_session["sessionToken"].as_str().unwrap();
    let member_session_hash =
        sagittarius_api::app::auth::hash_session_token_for_tests(member_session_token);
    let trip_id = Uuid::parse_str(support::TRIP_ID).unwrap();
    let member_id = Uuid::parse_str(support::TRAVELER_ID).unwrap();

    let session_exists_before_disable: bool = sqlx::query_scalar(
        "select exists (
           select 1
           from trip_member_sessions
           where trip_id = $1
             and member_id = $2
             and session_token_hash = $3
             and revoked_at is null
             and expires_at > now()
         )",
    )
    .bind(trip_id)
    .bind(member_id)
    .bind(member_session_hash)
    .fetch_one(&pool)
    .await
    .unwrap();
    assert!(session_exists_before_disable);

    sqlx::query(
        "update trip_members
         set access_status = 'disabled'
         where trip_id = $1 and id = $2",
    )
    .bind(trip_id)
    .bind(member_id)
    .execute(&pool)
    .await
    .unwrap();

    let account_session = login_account(&pool, "traveler@example.com", false, "").await;
    let auth = format!(
        "Bearer {}",
        account_session["sessionToken"].as_str().unwrap()
    );

    let response = post_json_with_auth(
        support::app(pool.clone()),
        &format!("/api/v1/trips/{trip_id}/members/{member_id}/account-links"),
        Some(&auth),
        json!({"memberSessionToken": member_session_token}),
    )
    .await;
    let (status, body): (StatusCode, Value) = response_json(response).await;

    assert_eq!(status, StatusCode::FORBIDDEN);
    assert_eq!(body["code"], "forbidden");
}

#[sqlx::test(migrations = "../../migrations")]
async fn account_claim_rejects_wrong_session_and_already_linked_member(pool: sqlx::PgPool) {
    support::seed_trip(&pool).await;
    let traveler_session = legacy_claim_member_session(&pool, support::TRAVELER_ID, "1234").await;
    let organizer_session = legacy_claim_member_session(&pool, support::ORGANIZER_ID, "5678").await;
    let account_session = login_account(&pool, "traveler@example.com", false, "").await;
    let other_account_session = login_account(&pool, "other-traveler@example.com", false, "").await;
    let auth = format!(
        "Bearer {}",
        account_session["sessionToken"].as_str().unwrap()
    );
    let trip_id = Uuid::parse_str(support::TRIP_ID).unwrap();
    let traveler_id = Uuid::parse_str(support::TRAVELER_ID).unwrap();
    let organizer_id = Uuid::parse_str(support::ORGANIZER_ID).unwrap();

    let missing_bearer = post_json_with_auth(
        support::app(pool.clone()),
        &format!("/api/v1/trips/{trip_id}/members/{traveler_id}/account-links"),
        None,
        json!({"memberSessionToken": traveler_session["sessionToken"]}),
    )
    .await;
    let (missing_status, missing_body): (StatusCode, Value) = response_json(missing_bearer).await;
    assert_eq!(missing_status, StatusCode::UNAUTHORIZED);
    assert_eq!(missing_body["code"], "unauthenticated");

    let malformed = post_raw_with_auth(
        support::app(pool.clone()),
        &format!("/api/v1/trips/{trip_id}/members/{traveler_id}/account-links"),
        Some(&auth),
        "{",
    )
    .await;
    let (malformed_status, malformed_body): (StatusCode, Value) = response_json(malformed).await;
    assert_eq!(malformed_status, StatusCode::BAD_REQUEST);
    assert_eq!(malformed_body["code"], "invalid_request");

    let wrong_session = post_json_with_auth(
        support::app(pool.clone()),
        &format!("/api/v1/trips/{trip_id}/members/{traveler_id}/account-links"),
        Some(&auth),
        json!({"memberSessionToken": organizer_session["sessionToken"]}),
    )
    .await;
    let (wrong_status, wrong_body): (StatusCode, Value) = response_json(wrong_session).await;
    assert_eq!(wrong_status, StatusCode::UNAUTHORIZED);
    assert_eq!(wrong_body["code"], "unauthenticated");

    sqlx::query(
        "update trip_members
         set user_id = $1, claimed_at = coalesce(claimed_at, now())
         where trip_id = $2 and id = $3",
    )
    .bind(Uuid::parse_str(other_account_session["userId"].as_str().unwrap()).unwrap())
    .bind(trip_id)
    .bind(organizer_id)
    .execute(&pool)
    .await
    .unwrap();

    let already_linked = post_json_with_auth(
        support::app(pool.clone()),
        &format!("/api/v1/trips/{trip_id}/members/{organizer_id}/account-links"),
        Some(&auth),
        json!({"memberSessionToken": organizer_session["sessionToken"]}),
    )
    .await;
    let (linked_status, linked_body): (StatusCode, Value) = response_json(already_linked).await;
    assert_eq!(linked_status, StatusCode::CONFLICT);
    assert_eq!(linked_body["code"], "identity_already_linked");
}

#[sqlx::test(migrations = "../../migrations")]
async fn owner_can_transfer_ownership_to_account_linked_member(pool: sqlx::PgPool) {
    let owner_session = login_account(&pool, "owner@example.com", false, "").await;
    let owner_user_id = Uuid::parse_str(owner_session["userId"].as_str().unwrap()).unwrap();
    let owner_auth = format!("Bearer {}", owner_session["sessionToken"].as_str().unwrap());
    let (_, trip_body) =
        create_account_trip(&pool, &owner_auth, "owner-transfer", "rice-noodle-2026").await;
    let trip_id = Uuid::parse_str(trip_body["trip"]["id"].as_str().unwrap()).unwrap();
    let old_owner_member_id =
        Uuid::parse_str(trip_body["ownerMemberId"].as_str().unwrap()).unwrap();
    let target_session = login_account(&pool, "target@example.com", false, "").await;
    let target_user_id = Uuid::parse_str(target_session["userId"].as_str().unwrap()).unwrap();
    let target_member_id =
        insert_account_linked_member(&pool, trip_id, Some(target_user_id), "Ben").await;

    let response = post_json_with_auth(
        support::app(pool.clone()),
        &format!("/api/v1/trips/{trip_id}/ownership-transfers"),
        Some(&owner_auth),
        json!({"targetMemberId": target_member_id}),
    )
    .await;
    let (status, body): (StatusCode, Value) = response_json(response).await;

    assert_eq!(status, StatusCode::OK);
    assert_eq!(body["tripId"], trip_id.to_string());
    assert_eq!(
        body["previousOwnerMemberId"],
        old_owner_member_id.to_string()
    );
    assert_eq!(body["newOwnerMemberId"], target_member_id.to_string());

    let old_owner_role: String = sqlx::query_scalar(
        "select role
         from trip_members
         where trip_id = $1 and id = $2",
    )
    .bind(trip_id)
    .bind(old_owner_member_id)
    .fetch_one(&pool)
    .await
    .unwrap();
    assert_eq!(old_owner_role, "organizer");

    let target_role: String = sqlx::query_scalar(
        "select role
         from trip_members
         where trip_id = $1 and id = $2",
    )
    .bind(trip_id)
    .bind(target_member_id)
    .fetch_one(&pool)
    .await
    .unwrap();
    assert_eq!(target_role, "owner");

    let persisted_owner_member_id: Uuid = sqlx::query_scalar(
        "select owner_member_id
         from trips
         where id = $1",
    )
    .bind(trip_id)
    .fetch_one(&pool)
    .await
    .unwrap();
    assert_eq!(persisted_owner_member_id, target_member_id);

    let owner_count: i64 = sqlx::query_scalar(
        "select count(*)
         from trip_members
         where trip_id = $1 and role = 'owner'",
    )
    .bind(trip_id)
    .fetch_one(&pool)
    .await
    .unwrap();
    assert_eq!(owner_count, 1);

    let audit: (
        Option<Uuid>,
        Option<Uuid>,
        Option<Uuid>,
        Option<Uuid>,
        String,
        Value,
    ) = sqlx::query_as(
        "select user_id, trip_id, actor_user_id, actor_member_id, event_type, payload
         from account_audit_events
         where trip_id = $1 and event_type = 'owner.transferred'",
    )
    .bind(trip_id)
    .fetch_one(&pool)
    .await
    .unwrap();
    assert_eq!(audit.0, Some(target_user_id));
    assert_eq!(audit.1, Some(trip_id));
    assert_eq!(audit.2, Some(owner_user_id));
    assert_eq!(audit.3, Some(old_owner_member_id));
    assert_eq!(audit.4, "owner.transferred");
    assert_eq!(audit.5, json!({}));
}

#[sqlx::test(migrations = "../../migrations")]
async fn owner_transfer_requires_current_owner_and_account_target(pool: sqlx::PgPool) {
    let owner_session = login_account(&pool, "owner@example.com", false, "").await;
    let owner_auth = format!("Bearer {}", owner_session["sessionToken"].as_str().unwrap());
    let (_, trip_body) = create_account_trip(
        &pool,
        &owner_auth,
        "owner-transfer-auth",
        "rice-noodle-2026",
    )
    .await;
    let trip_id = Uuid::parse_str(trip_body["trip"]["id"].as_str().unwrap()).unwrap();
    let target_session = login_account(&pool, "target@example.com", false, "").await;
    let target_user_id = Uuid::parse_str(target_session["userId"].as_str().unwrap()).unwrap();
    let target_auth = format!(
        "Bearer {}",
        target_session["sessionToken"].as_str().unwrap()
    );
    let target_member_id =
        insert_account_linked_member(&pool, trip_id, Some(target_user_id), "Ben").await;

    let non_owner_response = post_json_with_auth(
        support::app(pool.clone()),
        &format!("/api/v1/trips/{trip_id}/ownership-transfers"),
        Some(&target_auth),
        json!({"targetMemberId": target_member_id}),
    )
    .await;
    let (non_owner_status, non_owner_body): (StatusCode, Value) =
        response_json(non_owner_response).await;
    assert_eq!(non_owner_status, StatusCode::FORBIDDEN);
    assert_eq!(non_owner_body["code"], "forbidden");

    let unlinked_member_id = insert_account_linked_member(&pool, trip_id, None, "No Account").await;
    let unlinked_response = post_json_with_auth(
        support::app(pool.clone()),
        &format!("/api/v1/trips/{trip_id}/ownership-transfers"),
        Some(&owner_auth),
        json!({"targetMemberId": unlinked_member_id}),
    )
    .await;
    let (unlinked_status, unlinked_body): (StatusCode, Value) =
        response_json(unlinked_response).await;
    assert_eq!(unlinked_status, StatusCode::CONFLICT);
    assert_eq!(unlinked_body["code"], "owner_transfer_invalid");
}

#[sqlx::test(migrations = "../../migrations")]
async fn owner_transfer_rejects_disabled_account_target_and_preserves_roles(pool: sqlx::PgPool) {
    let owner_session = login_account(&pool, "owner@example.com", false, "").await;
    let owner_auth = format!("Bearer {}", owner_session["sessionToken"].as_str().unwrap());
    let (_, trip_body) = create_account_trip(
        &pool,
        &owner_auth,
        "owner-transfer-disabled",
        "rice-noodle-2026",
    )
    .await;
    let trip_id = Uuid::parse_str(trip_body["trip"]["id"].as_str().unwrap()).unwrap();
    let owner_member_id = Uuid::parse_str(trip_body["ownerMemberId"].as_str().unwrap()).unwrap();
    let target_session = login_account(&pool, "target@example.com", false, "").await;
    let target_user_id = Uuid::parse_str(target_session["userId"].as_str().unwrap()).unwrap();
    let target_member_id =
        insert_account_linked_member(&pool, trip_id, Some(target_user_id), "Ben").await;

    sqlx::query(
        "update users
         set disabled_at = now()
         where id = $1",
    )
    .bind(target_user_id)
    .execute(&pool)
    .await
    .unwrap();

    let response = post_json_with_auth(
        support::app(pool.clone()),
        &format!("/api/v1/trips/{trip_id}/ownership-transfers"),
        Some(&owner_auth),
        json!({"targetMemberId": target_member_id}),
    )
    .await;
    let (status, body): (StatusCode, Value) = response_json(response).await;

    assert_eq!(status, StatusCode::CONFLICT);
    assert_eq!(body["code"], "owner_transfer_invalid");

    let roles: Vec<(Uuid, String)> = sqlx::query_as(
        "select id, role
         from trip_members
         where trip_id = $1 and id = any($2)
         order by id",
    )
    .bind(trip_id)
    .bind(vec![owner_member_id, target_member_id])
    .fetch_all(&pool)
    .await
    .unwrap();
    assert_eq!(
        roles,
        vec![
            (owner_member_id, "owner".to_string()),
            (target_member_id, "organizer".to_string())
        ]
    );

    let persisted_owner_member_id: Uuid = sqlx::query_scalar(
        "select owner_member_id
         from trips
         where id = $1",
    )
    .bind(trip_id)
    .fetch_one(&pool)
    .await
    .unwrap();
    assert_eq!(persisted_owner_member_id, owner_member_id);
}

#[sqlx::test(migrations = "../../migrations")]
async fn owner_transfer_rejects_self_transfer(pool: sqlx::PgPool) {
    let owner_session = login_account(&pool, "owner@example.com", false, "").await;
    let owner_auth = format!("Bearer {}", owner_session["sessionToken"].as_str().unwrap());
    let (_, trip_body) = create_account_trip(
        &pool,
        &owner_auth,
        "owner-transfer-self",
        "rice-noodle-2026",
    )
    .await;
    let trip_id = Uuid::parse_str(trip_body["trip"]["id"].as_str().unwrap()).unwrap();
    let owner_member_id = Uuid::parse_str(trip_body["ownerMemberId"].as_str().unwrap()).unwrap();

    let response = post_json_with_auth(
        support::app(pool.clone()),
        &format!("/api/v1/trips/{trip_id}/ownership-transfers"),
        Some(&owner_auth),
        json!({"targetMemberId": owner_member_id}),
    )
    .await;
    let (status, body): (StatusCode, Value) = response_json(response).await;

    assert_eq!(status, StatusCode::CONFLICT);
    assert_eq!(body["code"], "owner_transfer_invalid");

    let audit_count: i64 = sqlx::query_scalar(
        "select count(*)
         from account_audit_events
         where trip_id = $1 and event_type = 'owner.transferred'",
    )
    .bind(trip_id)
    .fetch_one(&pool)
    .await
    .unwrap();
    assert_eq!(audit_count, 0);
}

#[sqlx::test(migrations = "../../migrations")]
async fn classify_trip_seed_structures_nl_and_returns_recommendations(pool: sqlx::PgPool) {
    let session = login_account(&pool, "classify-seed@example.com", false, "").await;
    let auth = format!("Bearer {}", session["sessionToken"].as_str().unwrap());

    let response = post_json_with_auth(
        support::app(pool.clone()),
        "/api/v1/account/classify-trip-seed",
        Some(&auth),
        json!({
            "text": "Japan food trip in autumn - Kyoto primary, Osaka optional, October into November"
        }),
    )
    .await;
    let (status, body): (StatusCode, Value) = response_json(response).await;

    assert_eq!(status, StatusCode::OK);
    assert_eq!(body["name"], "Kyoto");
    assert_eq!(body["destinations"][0]["label"], "Kyoto");
    assert_eq!(body["destinations"][0]["role"], "primary");
    assert_eq!(body["destinations"][1]["label"], "Osaka");
    assert_eq!(body["destinations"][1]["role"], "optional");
    assert_eq!(body["when"]["mode"], "months");
    assert_eq!(body["when"]["startM"], 9);
    assert_eq!(body["when"]["endM"], 10);
    assert_eq!(body["confidence"], "high");
    assert!(
        body["recommendations"]["styles"]
            .as_array()
            .unwrap()
            .iter()
            .any(|s| s == "food")
    );
    assert_eq!(body["recommendations"]["seasonHint"], "autumn");
    assert!(
        body["recommendations"]["relatedPlaces"]
            .as_array()
            .unwrap()
            .iter()
            .any(|p| p == "Nara")
    );
    // Structure creator never invents join credentials
    assert!(body.get("joinId").is_none());
    assert!(body.get("joinPassword").is_none());
}

#[sqlx::test(migrations = "../../migrations")]
async fn classify_trip_seed_requires_auth_and_nonempty_text(pool: sqlx::PgPool) {
    let unauth = post_json_with_auth(
        support::app(pool.clone()),
        "/api/v1/account/classify-trip-seed",
        None,
        json!({ "text": "Chiang Mai with friends" }),
    )
    .await;
    assert_eq!(unauth.status(), StatusCode::UNAUTHORIZED);

    let session = login_account(&pool, "classify-empty@example.com", false, "").await;
    let auth = format!("Bearer {}", session["sessionToken"].as_str().unwrap());

    let empty = post_json_with_auth(
        support::app(pool.clone()),
        "/api/v1/account/classify-trip-seed",
        Some(&auth),
        json!({ "text": "   " }),
    )
    .await;
    let (status, body): (StatusCode, Value) = response_json(empty).await;
    assert_eq!(status, StatusCode::BAD_REQUEST);
    assert_eq!(body["code"], "invalid_request");
}

#[sqlx::test(migrations = "../../migrations")]
async fn owner_transfer_rejects_malformed_request(pool: sqlx::PgPool) {
    let owner_session = login_account(&pool, "owner@example.com", false, "").await;
    let owner_auth = format!("Bearer {}", owner_session["sessionToken"].as_str().unwrap());
    let (_, trip_body) = create_account_trip(
        &pool,
        &owner_auth,
        "owner-transfer-json",
        "rice-noodle-2026",
    )
    .await;
    let trip_id = Uuid::parse_str(trip_body["trip"]["id"].as_str().unwrap()).unwrap();

    let missing = post_json_with_auth(
        support::app(pool.clone()),
        &format!("/api/v1/trips/{trip_id}/ownership-transfers"),
        Some(&owner_auth),
        json!({}),
    )
    .await;
    let (missing_status, missing_body): (StatusCode, Value) = response_json(missing).await;
    assert_eq!(missing_status, StatusCode::BAD_REQUEST);
    assert_eq!(missing_body["code"], "invalid_request");

    let malformed = post_raw_with_auth(
        support::app(pool.clone()),
        &format!("/api/v1/trips/{trip_id}/ownership-transfers"),
        Some(&owner_auth),
        "{",
    )
    .await;
    let (malformed_status, malformed_body): (StatusCode, Value) = response_json(malformed).await;
    assert_eq!(malformed_status, StatusCode::BAD_REQUEST);
    assert_eq!(malformed_body["code"], "invalid_request");
}
