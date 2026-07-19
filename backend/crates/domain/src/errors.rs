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
    #[error("exchange rate provider failed: {0}")]
    ExchangeRateProvider(String),
    #[error("trip join id already exists")]
    TripJoinIdAlreadyExists,
    #[error("owner transfer invalid")]
    OwnerTransferInvalid,
    #[error("version conflict")]
    VersionConflict,
    #[error("version conflict")]
    VersionConflictWithLatest(serde_json::Value),
    #[error("database error: {0}")]
    Database(String),
}

impl ServiceError {
    pub fn database(error: impl std::fmt::Display) -> Self {
        Self::Database(error.to_string())
    }
}

impl From<sqlx::Error> for ServiceError {
    fn from(error: sqlx::Error) -> Self {
        Self::Database(error.to_string())
    }
}
