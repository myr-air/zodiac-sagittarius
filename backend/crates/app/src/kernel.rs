//! Shared member-session mutation scaffolding.
//!
//! Use-cases that mutate trip-scoped records should prefer these helpers so
//! auth, capability checks, idempotency, commit, and realtime publish stay
//! consistent across features.

use uuid::Uuid;

use crate::{auth, mutation_guard};
use sagittarius_db as db;
use sagittarius_db::PgPool;
use sagittarius_db::models::AuthenticatedMemberSessionRecord;
use sagittarius_domain::capabilities::can;
use sagittarius_domain::errors::ServiceError;
use sagittarius_domain::types::Capability;
use sagittarius_realtime::{RealtimeEvent, RealtimeHub};

/// Authenticated member context loaded for a trip session.
pub type MemberCtx = AuthenticatedMemberSessionRecord;

/// Open transaction with authenticated member + optional capability + idempotency.
pub struct MemberMutation<'a> {
    pub tx: sqlx::Transaction<'a, sqlx::Postgres>,
    pub session: MemberCtx,
}

impl<'a> MemberMutation<'a> {
    /// Begin mutation: hash session, load member, check capabilities, reject duplicates.
    pub async fn begin(
        pool: &'a PgPool,
        trip_id: Uuid,
        session_token: &str,
        capabilities: &[Capability],
        client_mutation_id: &str,
    ) -> Result<Self, ServiceError> {
        let token_hash = auth::hash_session_token(session_token)?;
        let mut tx = pool.begin().await?;
        let session = db::queries::find_active_member_session_in_tx(&mut tx, trip_id, &token_hash)
            .await?
            .ok_or(ServiceError::Unauthenticated)?;
        require_any_capability(&session, capabilities)?;
        mutation_guard::reject_duplicate_mutation(
            &mut tx,
            trip_id,
            session.member_id,
            client_mutation_id,
        )
        .await?;
        Ok(Self { tx, session })
    }

    /// Begin mutation requiring a single capability.
    pub async fn begin_with(
        pool: &'a PgPool,
        trip_id: Uuid,
        session_token: &str,
        capability: Capability,
        client_mutation_id: &str,
    ) -> Result<Self, ServiceError> {
        Self::begin(
            pool,
            trip_id,
            session_token,
            &[capability],
            client_mutation_id,
        )
        .await
    }

    /// Commit the transaction and publish realtime events.
    pub async fn commit_publish(
        self,
        realtime: &RealtimeHub,
        events: Vec<RealtimeEvent>,
    ) -> Result<(), ServiceError> {
        self.tx.commit().await?;
        for event in events {
            realtime.publish(event).await;
        }
        Ok(())
    }
}

/// Reject when the member lacks `capability`.
pub fn require_capability(session: &MemberCtx, capability: Capability) -> Result<(), ServiceError> {
    if can(session.role, capability) {
        Ok(())
    } else {
        Err(ServiceError::Forbidden)
    }
}

/// Reject when the member lacks every capability in `any_of`.
pub fn require_any_capability(
    session: &MemberCtx,
    any_of: &[Capability],
) -> Result<(), ServiceError> {
    if any_of
        .iter()
        .any(|capability| can(session.role, *capability))
    {
        Ok(())
    } else {
        Err(ServiceError::Forbidden)
    }
}

/// Authenticate a read-only member request (no transaction, no mutation guard).
pub async fn require_member_session(
    pool: &PgPool,
    trip_id: Uuid,
    session_token: &str,
    capability: Capability,
) -> Result<MemberCtx, ServiceError> {
    let token_hash = auth::hash_session_token(session_token)?;
    let session = db::queries::find_active_member_session(pool, trip_id, &token_hash)
        .await?
        .ok_or(ServiceError::Unauthenticated)?;
    require_capability(&session, capability)?;
    Ok(session)
}

pub use mutation_guard::version_conflict_with_latest;
