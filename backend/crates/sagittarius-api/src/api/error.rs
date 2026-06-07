use axum::{Json, http::StatusCode, response::IntoResponse};
use serde::Serialize;
use serde_json::Value;

use crate::domain::errors::ServiceError;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ErrorBody {
    pub code: &'static str,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub latest: Option<Value>,
}

pub async fn not_found() -> impl IntoResponse {
    (
        StatusCode::NOT_FOUND,
        Json(ErrorBody {
            code: "not_found",
            message: "not found".to_string(),
            latest: None,
        }),
    )
}

impl IntoResponse for ServiceError {
    fn into_response(self) -> axum::response::Response {
        let (status, code, message, latest) = match self {
            ServiceError::InvalidRequest(_) => (
                StatusCode::BAD_REQUEST,
                "invalid_request",
                self.to_string(),
                None,
            ),
            ServiceError::Unauthenticated => (
                StatusCode::UNAUTHORIZED,
                "unauthenticated",
                self.to_string(),
                None,
            ),
            ServiceError::Forbidden => (StatusCode::FORBIDDEN, "forbidden", self.to_string(), None),
            ServiceError::TooManyRequests => (
                StatusCode::TOO_MANY_REQUESTS,
                "too_many_requests",
                self.to_string(),
                None,
            ),
            ServiceError::NotFound => (StatusCode::NOT_FOUND, "not_found", self.to_string(), None),
            ServiceError::IdentityAlreadyLinked => (
                StatusCode::CONFLICT,
                "identity_already_linked",
                self.to_string(),
                None,
            ),
            ServiceError::EmailDelivery(message) => (
                StatusCode::BAD_GATEWAY,
                "email_delivery_failed",
                message,
                None,
            ),
            ServiceError::TripJoinIdAlreadyExists => (
                StatusCode::CONFLICT,
                "trip_join_id_already_exists",
                self.to_string(),
                None,
            ),
            ServiceError::OwnerTransferInvalid => (
                StatusCode::CONFLICT,
                "owner_transfer_invalid",
                self.to_string(),
                None,
            ),
            ServiceError::VersionConflict => (
                StatusCode::CONFLICT,
                "version_conflict",
                self.to_string(),
                None,
            ),
            ServiceError::VersionConflictWithLatest(latest) => (
                StatusCode::CONFLICT,
                "version_conflict",
                "version conflict".to_string(),
                Some(latest),
            ),
            ServiceError::Database(_) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                "database_error",
                "database error".to_string(),
                None,
            ),
        };

        (
            status,
            Json(ErrorBody {
                code,
                message,
                latest,
            }),
        )
            .into_response()
    }
}
