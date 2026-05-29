use axum::{extract::FromRequestParts, http::request::Parts};

use crate::{app::AppState, domain::errors::ServiceError};

#[derive(Debug, Clone)]
pub struct BearerToken(pub String);

impl FromRequestParts<AppState> for BearerToken {
    type Rejection = ServiceError;

    async fn from_request_parts(
        parts: &mut Parts,
        _state: &AppState,
    ) -> Result<Self, Self::Rejection> {
        let header = parts
            .headers
            .get(http::header::AUTHORIZATION)
            .and_then(|value| value.to_str().ok())
            .ok_or(ServiceError::Unauthenticated)?;
        let token = header
            .strip_prefix("Bearer ")
            .ok_or(ServiceError::Unauthenticated)?;

        if token.is_empty() {
            return Err(ServiceError::Unauthenticated);
        }

        Ok(Self(token.to_string()))
    }
}
