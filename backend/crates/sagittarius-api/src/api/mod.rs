pub mod error;
pub mod extractors;
pub mod itinerary;
pub mod join;
pub mod suggestions;
pub mod tasks;
pub mod trips;
pub mod ws;

use axum::{
    http::{
        Method,
        header::{AUTHORIZATION, CONTENT_TYPE},
    },
    Router,
    routing::{get, patch, post},
};
use tower_http::cors::{AllowOrigin, CorsLayer};

use crate::app::AppState;

pub fn router(state: AppState) -> Router {
    Router::new()
        .route("/v1/health", get(|| async { "ok" }))
        .route("/v1/trips/join", post(join::join_trip))
        .route("/v1/trips/{trip_id}", get(trips::load_trip))
        .route("/v1/trips/{trip_id}/ws", get(ws::trip_ws))
        .route(
            "/v1/itinerary-items/{item_id}",
            patch(itinerary::patch_itinerary_item),
        )
        .route(
            "/v1/trips/{trip_id}/suggestions",
            post(suggestions::create_suggestion),
        )
        .route("/v1/trips/{trip_id}/tasks", post(tasks::create_task))
        .route("/v1/tasks/{task_id}", patch(tasks::patch_task))
        .route(
            "/v1/suggestions/{suggestion_id}/approve",
            post(suggestions::approve_suggestion),
        )
        .route(
            "/v1/suggestions/{suggestion_id}/reject",
            post(suggestions::reject_suggestion),
        )
        .route(
            "/v1/trips/{trip_id}/members/{member_id}/claim",
            post(join::claim_member),
        )
        .route(
            "/v1/trips/{trip_id}/members/{member_id}/login",
            post(join::login_member),
        )
        .route(
            "/v1/trips/{trip_id}/member-session/logout",
            post(join::logout),
        )
        .fallback(error::not_found)
        .layer(
            CorsLayer::new()
                .allow_origin(AllowOrigin::mirror_request())
                .allow_methods([Method::GET, Method::POST, Method::PATCH, Method::OPTIONS])
                .allow_headers([AUTHORIZATION, CONTENT_TYPE]),
        )
        .with_state(state)
}
