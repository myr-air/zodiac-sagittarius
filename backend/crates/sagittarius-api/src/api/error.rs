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
        let (status, code) = match self {
            ServiceError::InvalidRequest(_) => (StatusCode::BAD_REQUEST, "invalid_request"),
            ServiceError::Unauthenticated => (StatusCode::UNAUTHORIZED, "unauthenticated"),
            ServiceError::Forbidden => (StatusCode::FORBIDDEN, "forbidden"),
            ServiceError::NotFound => (StatusCode::NOT_FOUND, "not_found"),
            ServiceError::VersionConflict => (StatusCode::CONFLICT, "version_conflict"),
            ServiceError::Database(_) => (StatusCode::INTERNAL_SERVER_ERROR, "database_error"),
        };

        (
            status,
            Json(ErrorBody {
                code,
                message: self.to_string(),
            }),
        )
            .into_response()
    }
}
