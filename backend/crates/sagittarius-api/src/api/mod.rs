pub mod account;
pub mod bookings;
pub mod daily_briefings;
pub mod error;
pub mod expenses;
pub mod extractors;
pub mod health;
pub mod itinerary;
pub mod itinerary_imports;
pub mod join;
pub mod members;
pub mod photo_albums;
pub mod place_resolution;
pub mod plan_variants;
pub mod stop_notes;
pub mod suggestions;
pub mod tasks;
pub mod trips;
pub mod ws;

use axum::{
    Router,
    http::{
        Method,
        header::{AUTHORIZATION, CONTENT_TYPE},
    },
    routing::{delete, get, patch, post},
};
use tower_http::cors::{AllowOrigin, CorsLayer};
use tower_http::trace::{DefaultMakeSpan, DefaultOnRequest, DefaultOnResponse, TraceLayer};
use tracing::Level;

use crate::app::AppState;

pub fn router(state: AppState) -> Router {
    Router::new()
        .nest("/api/v1", api_v1())
        .fallback(error::not_found)
        .layer(
            TraceLayer::new_for_http()
                .make_span_with(DefaultMakeSpan::new().level(Level::INFO))
                .on_request(DefaultOnRequest::new().level(Level::INFO))
                .on_response(DefaultOnResponse::new().level(Level::INFO)),
        )
        .layer(cors_layer())
        .with_state(state)
}

fn api_v1() -> Router<AppState> {
    Router::new()
        .route("/health", get(health::liveness))
        .route("/readiness", get(health::readiness))
        .route("/auth/email/challenges", post(account::start_email_login))
        .route("/auth/email/sessions", post(account::finish_email_login))
        .route(
            "/auth/password/sessions",
            post(account::finish_password_login),
        )
        .route(
            "/account",
            get(account::get_settings).patch(account::update_settings),
        )
        .route(
            "/account/trusted-devices/{trusted_device_id}",
            delete(account::revoke_trusted_device),
        )
        .route(
            "/account/trips",
            post(account::create_trip).get(account::list_trips),
        )
        .route(
            "/account/trips/{trip_id}/member-sessions",
            post(account::create_trip_member_session),
        )
        .route("/account/trip-stats", get(account::get_stats))
        .route("/account/explorer", get(account::get_explorer))
        .route("/account/to-dos", get(account::list_todos))
        .route(
            "/account/vault",
            get(account::list_vault_items).post(account::create_vault_item),
        )
        .route(
            "/trips/{trip_id}/ownership-transfers",
            post(account::transfer_owner),
        )
        .route(
            "/trips/{trip_id}/members/{member_id}/account-links",
            post(account::claim_member),
        )
        .route(
            "/account/passkeys/options",
            post(account::start_passkey_registration),
        )
        .route(
            "/account/passkeys",
            post(account::finish_passkey_registration),
        )
        .route("/auth/passkeys/options", post(account::start_passkey_login))
        .route(
            "/auth/passkeys/sessions",
            post(account::finish_passkey_login),
        )
        .route("/account/session", delete(account::logout_session))
        .route("/trip-join-sessions", post(join::join_trip))
        .route(
            "/trip-join-invite-tokens/current",
            get(join::resolve_invite_token),
        )
        .route(
            "/trips/{trip_id}",
            get(trips::load_trip).patch(trips::patch_trip),
        )
        .route(
            "/trips/{trip_id}/daily-briefings",
            get(daily_briefings::list_daily_briefings),
        )
        .route(
            "/trips/{trip_id}/daily-briefings/{date}",
            patch(daily_briefings::patch_daily_briefing),
        )
        .route(
            "/trips/{trip_id}/plan-variants",
            post(plan_variants::create_plan_variant),
        )
        .route(
            "/trips/{trip_id}/plan-variants/{plan_variant_id}",
            patch(plan_variants::patch_plan_variant),
        )
        .route(
            "/trips/{trip_id}/plan-variants/{plan_variant_id}/publications",
            post(plan_variants::publish_plan_variant),
        )
        .route("/trips/{trip_id}/events/stream", get(ws::trip_ws))
        .route(
            "/trips/{trip_id}/itinerary-items",
            post(itinerary::create_itinerary_item),
        )
        .route(
            "/trips/{trip_id}/itinerary-imports",
            post(itinerary_imports::import_itinerary),
        )
        .route(
            "/trips/{trip_id}/places/resolve",
            post(place_resolution::resolve_place),
        )
        .route(
            "/trips/{trip_id}/itinerary-items/order",
            patch(itinerary::reorder_itinerary_items),
        )
        .route(
            "/trips/{trip_id}/itinerary-items/{item_id}",
            patch(itinerary::patch_itinerary_item).delete(itinerary::delete_itinerary_item),
        )
        .route(
            "/trips/{trip_id}/suggestions",
            post(suggestions::create_suggestion),
        )
        .route("/trips/{trip_id}/tasks", post(tasks::create_task))
        .route("/trips/{trip_id}/tasks/{task_id}", patch(tasks::patch_task))
        .route(
            "/trips/{trip_id}/expenses/summary",
            get(expenses::get_expense_summary),
        )
        .route(
            "/trips/{trip_id}/expenses/reminders",
            post(expenses::record_expense_reminder),
        )
        .route("/trips/{trip_id}/expenses", post(expenses::create_expense))
        .route(
            "/trips/{trip_id}/expenses/{expense_id}",
            patch(expenses::patch_expense).delete(expenses::delete_expense),
        )
        .route(
            "/trips/{trip_id}/bookings",
            post(bookings::create_booking_doc),
        )
        .route(
            "/trips/{trip_id}/bookings/{booking_id}",
            patch(bookings::patch_booking_doc).delete(bookings::delete_booking_doc),
        )
        .route(
            "/trips/{trip_id}/photo-albums",
            post(photo_albums::create_photo_album_link),
        )
        .route(
            "/trips/{trip_id}/photo-albums/{album_id}",
            patch(photo_albums::patch_photo_album_link)
                .delete(photo_albums::delete_photo_album_link),
        )
        .route(
            "/trips/{trip_id}/members",
            get(members::list_members).post(members::create_member),
        )
        .route(
            "/trips/{trip_id}/members/{member_id}",
            patch(members::patch_member),
        )
        .route(
            "/trips/{trip_id}/members/{member_id}/claim-resets",
            post(members::reset_member_claim),
        )
        .route(
            "/trips/{trip_id}/join-invite-tokens",
            post(join::rotate_invite_token),
        )
        .route("/trips/{trip_id}/presence", post(members::update_presence))
        .route(
            "/trips/{trip_id}/stop-notes",
            post(stop_notes::create_stop_note),
        )
        .route(
            "/trips/{trip_id}/stop-notes/{note_id}",
            patch(stop_notes::patch_stop_note).delete(stop_notes::delete_stop_note),
        )
        .route(
            "/trips/{trip_id}/suggestions/{suggestion_id}",
            patch(suggestions::patch_suggestion),
        )
        .route(
            "/trips/{trip_id}/members/{member_id}/claims",
            post(join::claim_member),
        )
        .route("/trips/{trip_id}/member-sessions", post(join::login_member))
        .route(
            "/trips/{trip_id}/member-sessions/current",
            delete(join::logout),
        )
}

fn cors_layer() -> CorsLayer {
    let origin_policy = CorsOriginPolicy::from_env();
    CorsLayer::new()
        .allow_origin(AllowOrigin::predicate(move |origin, _request_parts| {
            origin
                .to_str()
                .is_ok_and(|value| origin_policy.allows(value))
        }))
        .allow_methods([
            Method::DELETE,
            Method::GET,
            Method::POST,
            Method::PATCH,
            Method::OPTIONS,
        ])
        .allow_headers([AUTHORIZATION, CONTENT_TYPE])
}

#[derive(Clone, Debug)]
struct CorsOriginPolicy {
    allowed_origins: Vec<String>,
    allow_local_development_origins: bool,
}

impl CorsOriginPolicy {
    fn from_env() -> Self {
        let runtime_env = std::env::var("SAGITTARIUS_ENV").unwrap_or_default();
        let allow_local_override = std::env::var("SAGITTARIUS_ALLOW_LOCAL_CORS").ok();
        let allowed_origins = std::env::var("SAGITTARIUS_ALLOWED_ORIGINS").ok();
        Self::from_parts(
            &runtime_env,
            allow_local_override.as_deref(),
            allowed_origins.as_deref(),
        )
    }

    fn from_parts(
        runtime_env: &str,
        allow_local_override: Option<&str>,
        allowed_origins: Option<&str>,
    ) -> Self {
        let runtime_env = runtime_env.trim().to_ascii_lowercase();
        let allow_local_development_origins = parse_cors_bool(allow_local_override)
            .unwrap_or_else(|| !matches!(runtime_env.as_str(), "production" | "staging"));
        let allowed_origins = allowed_origins
            .unwrap_or_default()
            .split(',')
            .map(str::trim)
            .filter(|candidate| !candidate.is_empty())
            .map(str::to_owned)
            .collect();

        Self {
            allowed_origins,
            allow_local_development_origins,
        }
    }

    fn allows(&self, origin: &str) -> bool {
        if self.allow_local_development_origins && local_development_origin(origin) {
            return true;
        }

        self.allowed_origins.iter().any(|allowed| allowed == origin)
    }
}

fn parse_cors_bool(value: Option<&str>) -> Option<bool> {
    match value.map(str::trim).map(str::to_ascii_lowercase).as_deref() {
        Some("1" | "true" | "yes" | "on") => Some(true),
        Some("0" | "false" | "no" | "off") => Some(false),
        _ => None,
    }
}

fn local_development_origin(origin: &str) -> bool {
    let Ok(url) = origin.parse::<http::Uri>() else {
        return false;
    };
    if url.scheme_str() != Some("http") {
        return false;
    }
    matches!(
        url.host(),
        Some("127.0.0.1") | Some("localhost") | Some("0.0.0.0")
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn production_cors_policy_rejects_localhost_and_allows_configured_origins() {
        let policy = CorsOriginPolicy::from_parts(
            "production",
            None,
            Some("https://app.sagittarius.example, https://admin.sagittarius.example"),
        );

        assert!(!policy.allows("http://127.0.0.1:5180"));
        assert!(!policy.allows("http://localhost:5180"));
        assert!(policy.allows("https://app.sagittarius.example"));
        assert!(policy.allows("https://admin.sagittarius.example"));
    }

    #[test]
    fn development_cors_policy_keeps_localhost_available() {
        let policy = CorsOriginPolicy::from_parts("development", None, None);

        assert!(policy.allows("http://127.0.0.1:5180"));
        assert!(policy.allows("http://localhost:5190"));
        assert!(!policy.allows("https://evil.example.test"));
    }
}
