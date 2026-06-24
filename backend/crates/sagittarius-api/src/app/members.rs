use uuid::Uuid;

use crate::app::{auth, events, mutation_guard};
use crate::db;
use crate::db::PgPool;
use crate::db::models::NewTripMember;
use crate::domain::capabilities::can;
use crate::domain::errors::ServiceError;
use crate::domain::patches::{CreateMemberRequest, PatchMemberRequest, UpdatePresenceRequest};
use crate::domain::types::{Capability, TripMemberAccessStatus, TripMemberSummary, TripRole};
use crate::realtime::RealtimeHub;

pub async fn list_members(
    pool: &PgPool,
    trip_id: Uuid,
    session_token: &str,
) -> Result<Vec<TripMemberSummary>, ServiceError> {
    let token_hash = auth::hash_session_token(session_token)?;
    let session = db::queries::find_active_member_session(pool, trip_id, &token_hash)
        .await?
        .ok_or(ServiceError::Unauthenticated)?;
    if !can(session.role, Capability::ViewPlan) {
        return Err(ServiceError::Forbidden);
    }

    Ok(db::queries::list_trip_members(pool, trip_id)
        .await?
        .into_iter()
        .map(Into::into)
        .collect())
}

pub async fn create_member(
    pool: &PgPool,
    realtime: &RealtimeHub,
    trip_id: Uuid,
    session_token: &str,
    request: CreateMemberRequest,
) -> Result<TripMemberSummary, ServiceError> {
    request.validate()?;

    let token_hash = auth::hash_session_token(session_token)?;
    let mut tx = pool.begin().await?;
    let session = db::queries::find_active_member_session_in_tx(&mut tx, trip_id, &token_hash)
        .await?
        .ok_or(ServiceError::Unauthenticated)?;
    if !can(session.role, Capability::ManagePeople) {
        return Err(ServiceError::Forbidden);
    }
    let claim_password_hash = match request.participant_password.as_deref() {
        Some(password) => Some(auth::hash_secret(password)?),
        None => None,
    };
    let record = db::queries::insert_trip_member(
        &mut tx,
        NewTripMember {
            id: Uuid::now_v7(),
            trip_id,
            display_name: request.display_name.trim(),
            role: request.role,
            color: request.color.trim(),
            claim_password_hash: claim_password_hash.as_deref(),
        },
    )
    .await?;
    let member = TripMemberSummary::from(record);
    let event = write_event(&mut tx, &member, "member.created", Some(session.member_id)).await?;

    tx.commit().await?;
    realtime.publish(event).await;

    Ok(member)
}

pub async fn patch_member(
    pool: &PgPool,
    realtime: &RealtimeHub,
    trip_id: Uuid,
    member_id: Uuid,
    session_token: &str,
    request: PatchMemberRequest,
) -> Result<TripMemberSummary, ServiceError> {
    request.validate()?;

    let token_hash = auth::hash_session_token(session_token)?;
    let mut tx = pool.begin().await?;
    let session = db::queries::find_active_member_session_in_tx(&mut tx, trip_id, &token_hash)
        .await?
        .ok_or(ServiceError::Unauthenticated)?;
    if !can(session.role, Capability::ManagePeople) {
        return Err(ServiceError::Forbidden);
    }
    let existing = db::queries::lock_member(&mut tx, trip_id, member_id)
        .await?
        .ok_or(ServiceError::NotFound)?;
    if existing.role == TripRole::Owner
        && (request.role.is_some()
            || request.access_status == Some(TripMemberAccessStatus::Disabled))
    {
        return Err(ServiceError::InvalidRequest(
            "owner changes must use ownership transfer",
        ));
    }
    let claim_password_hash = match request.participant_password.as_deref() {
        Some(password) => Some(auth::hash_secret(password)?),
        None => None,
    };
    let mut member = db::queries::update_trip_member(
        &mut tx,
        trip_id,
        member_id,
        &request,
        claim_password_hash.as_deref(),
    )
    .await?
    .ok_or(ServiceError::NotFound)?;
    if request.access_status == Some(TripMemberAccessStatus::Disabled) {
        member = db::queries::reset_member_claim(&mut tx, trip_id, member_id)
            .await?
            .ok_or(ServiceError::NotFound)?;
        db::queries::revoke_member_sessions_for_member(&mut tx, trip_id, member_id).await?;
    }

    let member = TripMemberSummary::from(member);
    let event = write_event(&mut tx, &member, "member.updated", Some(session.member_id)).await?;

    tx.commit().await?;
    realtime.publish(event).await;

    Ok(member)
}

pub async fn reset_member_claim(
    pool: &PgPool,
    realtime: &RealtimeHub,
    trip_id: Uuid,
    member_id: Uuid,
    session_token: &str,
) -> Result<TripMemberSummary, ServiceError> {
    let token_hash = auth::hash_session_token(session_token)?;
    let mut tx = pool.begin().await?;
    let session = db::queries::find_active_member_session_in_tx(&mut tx, trip_id, &token_hash)
        .await?
        .ok_or(ServiceError::Unauthenticated)?;
    if !can(session.role, Capability::ManagePeople) {
        return Err(ServiceError::Forbidden);
    }
    let member = db::queries::reset_member_claim(&mut tx, trip_id, member_id)
        .await?
        .ok_or(ServiceError::NotFound)?;
    db::queries::revoke_member_sessions_for_member(&mut tx, trip_id, member_id).await?;

    let member = TripMemberSummary::from(member);
    let event = write_event(
        &mut tx,
        &member,
        "member.claim_reset",
        Some(session.member_id),
    )
    .await?;

    tx.commit().await?;
    realtime.publish(event).await;

    Ok(member)
}

pub async fn update_presence(
    pool: &PgPool,
    realtime: &RealtimeHub,
    trip_id: Uuid,
    session_token: &str,
    request: UpdatePresenceRequest,
) -> Result<TripMemberSummary, ServiceError> {
    if request.client_mutation_id.trim().is_empty() {
        return Err(ServiceError::InvalidRequest("clientMutationId is required"));
    }
    let presence = request.presence.trim();
    if !matches!(presence, "online" | "away" | "offline") {
        return Err(ServiceError::InvalidRequest("presence is invalid"));
    }

    let token_hash = auth::hash_session_token(session_token)?;
    let mut tx = pool.begin().await?;
    let session = db::queries::find_active_member_session_in_tx(&mut tx, trip_id, &token_hash)
        .await?
        .ok_or(ServiceError::Unauthenticated)?;
    if !can(session.role, Capability::ViewPlan) {
        return Err(ServiceError::Forbidden);
    }
    mutation_guard::reject_duplicate_mutation(
        &mut tx,
        trip_id,
        session.member_id,
        &request.client_mutation_id,
    )
    .await?;

    let member = db::queries::update_member_presence(&mut tx, trip_id, session.member_id, presence)
        .await?
        .ok_or(ServiceError::NotFound)?;
    let member = TripMemberSummary::from(member);
    let event = events::insert(
        &mut tx,
        events::EventWrite {
            trip_id,
            aggregate_type: "member",
            event_type: "presence.updated",
            aggregate_id: member.id,
            version: 1,
            payload: serde_json::to_value(&member).map_err(|_| {
                ServiceError::InvalidRequest("event payload could not be serialized")
            })?,
            client_mutation_id: Some(request.client_mutation_id.as_str()),
            created_by: Some(session.member_id),
        },
    )
    .await?;

    tx.commit().await?;
    realtime.publish(event).await;

    Ok(member)
}

async fn write_event(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    member: &TripMemberSummary,
    event_type: &'static str,
    created_by: Option<Uuid>,
) -> Result<crate::realtime::RealtimeEvent, ServiceError> {
    let payload = serde_json::to_value(member)
        .map_err(|_| ServiceError::InvalidRequest("event payload could not be serialized"))?;
    let event = events::insert(
        tx,
        events::EventWrite {
            trip_id: member.trip_id,
            aggregate_type: "member",
            event_type,
            aggregate_id: member.id,
            version: 1,
            payload,
            client_mutation_id: None,
            created_by,
        },
    )
    .await?;

    Ok(event)
}
