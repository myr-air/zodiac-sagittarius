use axum::{
    extract::FromRequestParts,
    http::{Method, header, request::Parts},
};

use crate::{api::CorsOriginPolicy, api::error::ApiError, app::AppState, domain::errors::ServiceError};

pub(crate) const ACCOUNT_SESSION_COOKIE_NAME: &str = "sagittarius-account-session";

#[derive(Debug, Clone)]
pub struct BearerToken(pub String);

impl FromRequestParts<AppState> for BearerToken {
    type Rejection = ApiError;

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
            return Err(ServiceError::Unauthenticated.into());
        }
        let token = parts.next().ok_or(ServiceError::Unauthenticated)?;

        if token.is_empty() || parts.next().is_some() {
            return Err(ServiceError::Unauthenticated.into());
        }

        Ok(Self(token.to_string()))
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum AccountSessionTokenSource {
    Bearer,
    Cookie,
}

#[derive(Debug, Clone)]
pub struct AccountSessionToken {
    pub token: String,
    pub source: AccountSessionTokenSource,
}

impl FromRequestParts<AppState> for AccountSessionToken {
    type Rejection = ApiError;

    async fn from_request_parts(
        parts: &mut Parts,
        _state: &AppState,
    ) -> Result<Self, Self::Rejection> {
        if let Ok(BearerToken(token)) = bearer_token_from_parts(parts) {
            return Ok(Self {
                token,
                source: AccountSessionTokenSource::Bearer,
            });
        }

        let token = account_session_cookie(parts).ok_or(ServiceError::Unauthenticated)?;
        validate_cookie_account_request(parts)?;

        Ok(Self {
            token,
            source: AccountSessionTokenSource::Cookie,
        })
    }
}

fn bearer_token_from_parts(parts: &Parts) -> Result<BearerToken, ApiError> {
    let header = parts
        .headers
        .get(header::AUTHORIZATION)
        .and_then(|value| value.to_str().ok())
        .ok_or(ServiceError::Unauthenticated)?;
    let mut parts = header.split_whitespace();
    let scheme = parts.next().ok_or(ServiceError::Unauthenticated)?;
    if !scheme.eq_ignore_ascii_case("Bearer") {
        return Err(ServiceError::Unauthenticated.into());
    }
    let token = parts.next().ok_or(ServiceError::Unauthenticated)?;

    if token.is_empty() || parts.next().is_some() {
        return Err(ServiceError::Unauthenticated.into());
    }

    Ok(BearerToken(token.to_string()))
}

fn account_session_cookie(parts: &Parts) -> Option<String> {
    parts
        .headers
        .get(header::COOKIE)
        .and_then(|value| value.to_str().ok())
        .and_then(|cookies| {
            cookies.split(';').find_map(|cookie| {
                let (name, value) = cookie.trim().split_once('=')?;
                (name == ACCOUNT_SESSION_COOKIE_NAME && !value.is_empty())
                    .then(|| value.to_string())
            })
        })
}

fn validate_cookie_account_request(parts: &Parts) -> Result<(), ApiError> {
    if matches!(
        &parts.method,
        &Method::GET | &Method::HEAD | &Method::OPTIONS
    ) {
        return Ok(());
    }

    validate_account_cookie_origin(parts)
}

pub(crate) fn validate_account_cookie_origin(parts: &Parts) -> Result<(), ApiError> {
    let origin = parts
        .headers
        .get(header::ORIGIN)
        .and_then(|value| value.to_str().ok())
        .ok_or(ServiceError::Forbidden)?;

    if CorsOriginPolicy::from_env().allows(origin) {
        Ok(())
    } else {
        Err(ServiceError::Forbidden.into())
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
        assert!(matches!(
            missing,
            Err(ApiError(ServiceError::Unauthenticated))
        ));

        let request = Request::builder()
            .header(http::header::AUTHORIZATION, "Basic abcdef")
            .body(())
            .unwrap();
        let mut parts = request.into_parts().0;
        let wrong_scheme = BearerToken::from_request_parts(&mut parts, &state).await;
        assert!(matches!(
            wrong_scheme,
            Err(ApiError(ServiceError::Unauthenticated))
        ));

        let request = Request::builder()
            .header(http::header::AUTHORIZATION, "Bearer ")
            .body(())
            .unwrap();
        let mut parts = request.into_parts().0;
        let empty_token = BearerToken::from_request_parts(&mut parts, &state).await;
        assert!(matches!(
            empty_token,
            Err(ApiError(ServiceError::Unauthenticated))
        ));

        let request = Request::builder()
            .header(http::header::AUTHORIZATION, "Bearer token extra")
            .body(())
            .unwrap();
        let mut parts = request.into_parts().0;
        let extra = BearerToken::from_request_parts(&mut parts, &state).await;
        assert!(matches!(
            extra,
            Err(ApiError(ServiceError::Unauthenticated))
        ));
    }

    #[tokio::test]
    async fn account_session_token_prefers_bearer_over_cookie() {
        let request = Request::builder()
            .method(Method::PATCH)
            .header(header::AUTHORIZATION, "Bearer bearer-token")
            .header(
                header::COOKIE,
                format!("{ACCOUNT_SESSION_COOKIE_NAME}=cookie-token"),
            )
            .body(())
            .unwrap();
        let mut parts = request.into_parts().0;

        let state = crate::app::AppState::test();
        let token = AccountSessionToken::from_request_parts(&mut parts, &state)
            .await
            .unwrap();

        assert_eq!(token.token, "bearer-token");
        assert_eq!(token.source, AccountSessionTokenSource::Bearer);
    }

    #[tokio::test]
    async fn account_session_token_reads_cookie_for_safe_requests() {
        let request = Request::builder()
            .header(
                header::COOKIE,
                format!("{ACCOUNT_SESSION_COOKIE_NAME}=cookie-token"),
            )
            .body(())
            .unwrap();
        let mut parts = request.into_parts().0;

        let state = crate::app::AppState::test();
        let token = AccountSessionToken::from_request_parts(&mut parts, &state)
            .await
            .unwrap();

        assert_eq!(token.token, "cookie-token");
        assert_eq!(token.source, AccountSessionTokenSource::Cookie);
    }

    #[tokio::test]
    async fn account_session_token_requires_origin_for_unsafe_cookie_requests() {
        let state = crate::app::AppState::test();
        let request = Request::builder()
            .method(Method::PATCH)
            .header(
                header::COOKIE,
                format!("{ACCOUNT_SESSION_COOKIE_NAME}=cookie-token"),
            )
            .body(())
            .unwrap();
        let mut parts = request.into_parts().0;

        let missing_origin = AccountSessionToken::from_request_parts(&mut parts, &state).await;
        assert!(matches!(
            missing_origin,
            Err(ApiError(ServiceError::Forbidden))
        ));

        let request = Request::builder()
            .method(Method::PATCH)
            .header(
                header::COOKIE,
                format!("{ACCOUNT_SESSION_COOKIE_NAME}=cookie-token"),
            )
            .header(header::ORIGIN, "http://127.0.0.1:5180")
            .body(())
            .unwrap();
        let mut parts = request.into_parts().0;

        let allowed = AccountSessionToken::from_request_parts(&mut parts, &state)
            .await
            .unwrap();
        assert_eq!(allowed.token, "cookie-token");
    }
}
