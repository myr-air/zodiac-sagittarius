use thiserror::Error;

#[derive(Debug, Error)]
pub enum ServiceError {
    #[error("invalid request: {0}")]
    InvalidRequest(&'static str),
    #[error("unauthenticated")]
    Unauthenticated,
    #[error("forbidden")]
    Forbidden,
    #[error("too many requests")]
    TooManyRequests,
    #[error("not found")]
    NotFound,
    #[error("identity already linked")]
    IdentityAlreadyLinked,
    #[error("email delivery failed: {0}")]
    EmailDelivery(String),
    #[error("trip join id already exists")]
    TripJoinIdAlreadyExists,
    #[error("owner transfer invalid")]
    OwnerTransferInvalid,
    #[error("version conflict")]
    VersionConflict,
    #[error("version conflict")]
    VersionConflictWithLatest(serde_json::Value),
    #[error("database error: {0}")]
    Database(#[from] sqlx::Error),
}
