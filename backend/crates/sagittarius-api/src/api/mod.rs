pub mod account;
pub mod error;
pub mod extractors;
pub mod itinerary;
pub mod join;
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

use crate::app::AppState;

pub fn router(state: AppState) -> Router {
    Router::new()
        .nest("/api/v1", api_v1())
        .fallback(error::not_found)
        .layer(cors_layer())
        .with_state(state)
}

fn api_v1() -> Router<AppState> {
    Router::new()
        .route("/health", get(|| async { "ok" }))
        .route("/auth/email/challenges", post(account::start_email_login))
        .route("/auth/email/sessions", post(account::finish_email_login))
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
        .route("/account/trip-stats", get(account::get_stats))
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
        .route("/trips/{trip_id}", get(trips::load_trip))
        .route("/trips/{trip_id}/events/stream", get(ws::trip_ws))
        .route(
            "/trips/{trip_id}/itinerary-items/{item_id}",
            patch(itinerary::patch_itinerary_item),
        )
        .route(
            "/trips/{trip_id}/suggestions",
            post(suggestions::create_suggestion),
        )
        .route("/trips/{trip_id}/tasks", post(tasks::create_task))
        .route("/trips/{trip_id}/tasks/{task_id}", patch(tasks::patch_task))
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
    CorsLayer::new()
        .allow_origin(AllowOrigin::mirror_request())
        .allow_methods([
            Method::DELETE,
            Method::GET,
            Method::POST,
            Method::PATCH,
            Method::OPTIONS,
        ])
        .allow_headers([AUTHORIZATION, CONTENT_TYPE])
}
