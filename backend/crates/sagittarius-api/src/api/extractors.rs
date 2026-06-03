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
        let mut parts = header.split_whitespace();
        let scheme = parts.next().ok_or(ServiceError::Unauthenticated)?;
        if !scheme.eq_ignore_ascii_case("Bearer") {
            return Err(ServiceError::Unauthenticated);
        }
        let token = parts.next().ok_or(ServiceError::Unauthenticated)?;

        if token.is_empty() || parts.next().is_some() {
            return Err(ServiceError::Unauthenticated);
        }

        Ok(Self(token.to_string()))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use http::Request;

    #[tokio::test]
    async fn bearer_token_parses_from_authorization_header() {
        let request = Request::builder()
            .header(http::header::AUTHORIZATION, "Bearer abc.def")
            .body(())
            .unwrap();
        let mut parts = request.into_parts().0;

        let state = crate::app::AppState::test();
        let token = BearerToken::from_request_parts(&mut parts, &state)
            .await
            .unwrap();

        assert_eq!(token.0, "abc.def");
    }

    #[tokio::test]
    async fn bearer_token_rejects_invalid_or_empty_tokens() {
        let state = crate::app::AppState::test();

        let request = Request::builder().body(()).unwrap();
        let mut parts = request.into_parts().0;
        let missing = BearerToken::from_request_parts(&mut parts, &state).await;
        assert!(matches!(missing, Err(ServiceError::Unauthenticated)));

        let request = Request::builder()
            .header(http::header::AUTHORIZATION, "Basic abcdef")
            .body(())
            .unwrap();
        let mut parts = request.into_parts().0;
        let wrong_scheme = BearerToken::from_request_parts(&mut parts, &state).await;
        assert!(matches!(wrong_scheme, Err(ServiceError::Unauthenticated)));

        let request = Request::builder()
            .header(http::header::AUTHORIZATION, "Bearer ")
            .body(())
            .unwrap();
        let mut parts = request.into_parts().0;
        let empty_token = BearerToken::from_request_parts(&mut parts, &state).await;
        assert!(matches!(empty_token, Err(ServiceError::Unauthenticated)));

        let request = Request::builder()
            .header(http::header::AUTHORIZATION, "Bearer token extra")
            .body(())
            .unwrap();
        let mut parts = request.into_parts().0;
        let extra = BearerToken::from_request_parts(&mut parts, &state).await;
        assert!(matches!(extra, Err(ServiceError::Unauthenticated)));
    }
}
