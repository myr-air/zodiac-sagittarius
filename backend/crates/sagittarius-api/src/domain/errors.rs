use thiserror::Error;

#[derive(Debug, Error)]
pub enum ServiceError {
    #[error("invalid request: {0}")]
    InvalidRequest(&'static str),
    #[error("unauthenticated")]
    Unauthenticated,
    #[error("forbidden")]
    Forbidden,
    #[error("not found")]
    NotFound,
    #[error("version conflict")]
    VersionConflict,
    #[error("database error: {0}")]
    Database(#[from] sqlx::Error),
}
