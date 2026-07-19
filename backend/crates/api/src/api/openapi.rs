use axum::{
    Json, Router,
    response::Html,
    routing::get,
};
use utoipa::openapi::security::{ApiKey, ApiKeyValue, HttpAuthScheme, HttpBuilder, SecurityScheme};
use utoipa::{Modify, OpenApi};

use crate::api::{
    account, bookings, daily_briefings, exchange_rates, expenses,
    extractors::ACCOUNT_SESSION_COOKIE_NAME, health, itinerary, itinerary_imports, join, members,
    photo_albums, place_resolution, plan_checks, plan_variants, public_trips, stop_notes,
    suggestions, tasks, trips,
};
use crate::app::AppState;

#[derive(OpenApi)]
#[openapi(
    info(
        title = "Joii API",
        description = "Sagittarius / Joii trip planning HTTP API",
        version = "0.4.1"
    ),
    paths(
        account::start_email_login,
        account::finish_email_login,
        account::finish_password_login,
        account::get_settings,
        account::update_settings,
        account::revoke_trusted_device,
        account::create_trip,
        account::list_trips,
        account::create_trip_member_session,
        account::get_stats,
        account::get_explorer,
        account::list_todos,
        account::list_vault_items,
        account::create_vault_item,
        account::transfer_owner,
        account::claim_member,
        account::start_passkey_registration,
        account::finish_passkey_registration,
        account::start_passkey_login,
        account::finish_passkey_login,
        account::logout_session,
        public_trips::create_public_trip,
        join::join_trip,
        join::resolve_invite_token,
        join::rotate_invite_token,
        join::claim_member,
        join::login_member,
        join::logout,
        trips::load_trip,
        trips::patch_trip,
        plan_variants::create_plan_variant,
        plan_variants::patch_plan_variant,
        plan_variants::publish_plan_variant,
        plan_variants::create_trip_plan,
        plan_variants::patch_trip_plan,
        plan_variants::set_main_trip_plan,
        itinerary::create_itinerary_item,
        itinerary::reorder_itinerary_items,
        itinerary::patch_itinerary_item,
        itinerary::delete_itinerary_item,
        itinerary_imports::import_itinerary,
        plan_checks::run_plan_check,
        plan_checks::latest_plan_check,
        plan_checks::patch_plan_suggestion,
        health::liveness,
        health::readiness,
        health::version,
        exchange_rates::get_exchange_rate,
        expenses::get_expense_summary,
        expenses::record_expense_reminder,
        expenses::create_expense,
        expenses::patch_expense,
        expenses::delete_expense,
        members::list_members,
        members::create_member,
        members::patch_member,
        members::reset_member_claim,
        members::update_presence,
        bookings::create_booking_doc,
        bookings::patch_booking_doc,
        bookings::delete_booking_doc,
        tasks::create_task,
        tasks::patch_task,
        suggestions::create_suggestion,
        suggestions::patch_suggestion,
        photo_albums::create_photo_album_link,
        photo_albums::patch_photo_album_link,
        photo_albums::delete_photo_album_link,
        stop_notes::create_stop_note,
        stop_notes::patch_stop_note,
        stop_notes::delete_stop_note,
        daily_briefings::list_daily_briefings,
        daily_briefings::patch_daily_briefing,
        place_resolution::resolve_place,
        openapi_json,
    ),
    modifiers(&SecuritySchemes)
)]
pub struct ApiDoc;

struct SecuritySchemes;

impl Modify for SecuritySchemes {
    fn modify(&self, openapi: &mut utoipa::openapi::OpenApi) {
        let components = openapi.components.get_or_insert_with(Default::default);
        components.add_security_scheme(
            "bearerAuth",
            SecurityScheme::Http(
                HttpBuilder::new()
                    .scheme(HttpAuthScheme::Bearer)
                    .bearer_format("Token")
                    .description(Some(
                        "Member/trip session Bearer token as used by the BearerToken extractor \
                         (Authorization: Bearer <token>).",
                    ))
                    .build(),
            ),
        );
        components.add_security_scheme(
            "accountSessionCookie",
            SecurityScheme::ApiKey(ApiKey::Cookie(ApiKeyValue::with_description(
                ACCOUNT_SESSION_COOKIE_NAME,
                "Account session cookie as used by the AccountSessionToken extractor \
                 (sagittarius-account-session).",
            ))),
        );
        components.add_security_scheme(
            "accountSessionBearer",
            SecurityScheme::Http(
                HttpBuilder::new()
                    .scheme(HttpAuthScheme::Bearer)
                    .bearer_format("Token")
                    .description(Some(
                        "Account session via Authorization Bearer as used by the \
                         AccountSessionToken extractor (alternative to the cookie).",
                    ))
                    .build(),
            ),
        );
    }
}

/// Routes nested under `/api/v1` (OpenAPI document).
pub fn routes() -> Router<AppState> {
    Router::new().route("/openapi.json", get(openapi_json))
}

/// Top-level docs UI at `/api/docs` (outside the `/api/v1` nest).
pub fn docs_routes() -> Router<AppState> {
    Router::new().route("/api/docs", get(docs_ui))
}

#[utoipa::path(
    get,
    path = "/openapi.json",
    responses(
        (status = 200, description = "OpenAPI 3 document", body = serde_json::Value)
    ),
    tag = "openapi"
)]
async fn openapi_json() -> Json<utoipa::openapi::OpenApi> {
    Json(ApiDoc::openapi())
}

async fn docs_ui() -> Html<&'static str> {
    Html(
        r##"<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Joii API Docs</title>
</head>
<body>
  <div id="app"></div>
  <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
  <script>
    Scalar.createApiReference("#app", {
      url: "/api/v1/openapi.json"
    });
  </script>
</body>
</html>"##,
    )
}
