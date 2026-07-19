//! Trip event stream authentication (HTTP layer stays thin).

use uuid::Uuid;

use sagittarius_db as db;
use sagittarius_db::PgPool;
use sagittarius_db::models::AuthenticatedMemberSessionRecord;
use sagittarius_domain::errors::ServiceError;

use crate::auth;

/// Authenticate a trip event-stream subscriber by member session token.
pub async fn authenticate_trip_stream(
    pool: &PgPool,
    trip_id: Uuid,
    session_token: &str,
) -> Result<AuthenticatedMemberSessionRecord, ServiceError> {
    let token_hash = auth::hash_session_token(session_token)?;
    db::queries::find_active_member_session(pool, trip_id, &token_hash)
        .await
        ?
        .ok_or(ServiceError::Unauthenticated)
}
