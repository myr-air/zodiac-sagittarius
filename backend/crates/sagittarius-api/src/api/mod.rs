pub mod error;
pub mod extractors;
pub mod itinerary;
pub mod join;
pub mod suggestions;
pub mod tasks;
pub mod trips;
pub mod ws;

use axum::{Router, routing::get};

use crate::app::AppState;

pub fn router(state: AppState) -> Router {
    Router::new()
        .route("/v1/health", get(|| async { "ok" }))
        .fallback(error::not_found)
        .with_state(state)
}
