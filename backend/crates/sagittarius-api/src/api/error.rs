use axum::{Json, http::StatusCode, response::IntoResponse};
use serde::Serialize;

use crate::domain::errors::ServiceError;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ErrorBody {
    pub code: &'static str,
    pub message: String,
}

pub async fn not_found() -> impl IntoResponse {
    (
        StatusCode::NOT_FOUND,
        Json(ErrorBody {
            code: "not_found",
            message: "not found".to_string(),
        }),
    )
}

impl IntoResponse for ServiceError {
    fn into_response(self) -> axum::response::Response {
        let (status, code, message) = match self {
            ServiceError::InvalidRequest(_) => {
                (StatusCode::BAD_REQUEST, "invalid_request", self.to_string())
            }
            ServiceError::Unauthenticated => (
                StatusCode::UNAUTHORIZED,
                "unauthenticated",
                self.to_string(),
            ),
            ServiceError::Forbidden => (StatusCode::FORBIDDEN, "forbidden", self.to_string()),
            ServiceError::NotFound => (StatusCode::NOT_FOUND, "not_found", self.to_string()),
            ServiceError::VersionConflict => {
                (StatusCode::CONFLICT, "version_conflict", self.to_string())
            }
            ServiceError::Database(_) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                "database_error",
                "database error".to_string(),
            ),
        };

        (status, Json(ErrorBody { code, message })).into_response()
    }
}
