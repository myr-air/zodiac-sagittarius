pub mod account;
pub mod bookings;
pub mod daily_briefings;
pub mod error;
pub mod exchange_rates;
pub mod expenses;
pub mod extractors;
pub mod health;
pub mod itinerary;
pub mod itinerary_imports;
pub mod join;
pub mod members;
pub mod openapi;
pub mod photo_albums;
pub mod place_resolution;
pub mod plan_checks;
pub mod plan_variants;
pub mod public_trips;
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
};
use tower_http::cors::{AllowOrigin, CorsLayer};
use tower_http::trace::{DefaultMakeSpan, DefaultOnRequest, DefaultOnResponse, TraceLayer};
use tracing::Level;

use crate::app::AppState;

pub fn router(state: AppState) -> Router {
    Router::new()
        .nest("/api/v1", api_v1())
        .merge(openapi::docs_routes())
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
        .merge(openapi::routes())
        .merge(health::routes())
        .merge(exchange_rates::routes())
        .merge(account::routes())
        .merge(public_trips::routes())
        .merge(join::routes())
        .merge(trips::routes())
        .merge(daily_briefings::routes())
        .merge(plan_variants::routes())
        .merge(itinerary::routes())
        .merge(itinerary_imports::routes())
        .merge(plan_checks::routes())
        .merge(place_resolution::routes())
        .merge(suggestions::routes())
        .merge(tasks::routes())
        .merge(expenses::routes())
        .merge(bookings::routes())
        .merge(photo_albums::routes())
        .merge(members::routes())
        .merge(stop_notes::routes())
        .merge(ws::routes())
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
        .allow_credentials(true)
}

#[derive(Clone, Debug)]
pub(crate) struct CorsOriginPolicy {
    allowed_origins: Vec<String>,
    allow_local_development_origins: bool,
}

impl CorsOriginPolicy {
    pub(crate) fn from_env() -> Self {
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

    pub(crate) fn allows(&self, origin: &str) -> bool {
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
