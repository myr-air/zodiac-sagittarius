use uuid::Uuid;

use sagittarius_db::models::NewAccountAuditEvent;
use sagittarius_db::{self as db, PgPool};
use sagittarius_domain::errors::ServiceError;
use sagittarius_domain::types::{
    AccountMemberClaimResponse, OwnerTransferResponse, TripMemberAccessStatus, TripRole,
};

use super::auth::{authenticate_user_session, hash_session_token};

pub async fn claim_member(
    pool: &PgPool,
    session_token: &str,
    trip_id: Uuid,
    member_id: Uuid,
    member_session_token: &str,
) -> Result<AccountMemberClaimResponse, ServiceError> {
    let user_id = authenticate_user_session(pool, session_token).await?;
    let member_session_token_hash = crate::auth::hash_session_token(member_session_token)?;
    let mut tx = pool.begin().await?;
    let member_session = db::queries::find_unexpired_member_session_in_tx(
        &mut tx,
        trip_id,
        &member_session_token_hash,
    )
    .await?
    .ok_or(ServiceError::Unauthenticated)?;

    if member_session.member_id != member_id {
        return Err(ServiceError::Unauthenticated);
    }

    let member = db::queries::lock_member(&mut tx, trip_id, member_id)
        .await?
        .ok_or(ServiceError::NotFound)?;

    if member.access_status == TripMemberAccessStatus::Disabled {
        return Err(ServiceError::Forbidden);
    }

    if let Some(existing_user_id) =
        db::account_queries::get_member_user_id(&mut tx, trip_id, member_id).await?
    {
        if existing_user_id != user_id {
            return Err(ServiceError::IdentityAlreadyLinked);
        }
        tx.commit().await?;
        return Ok(AccountMemberClaimResponse {
            trip_id,
            member_id,
            user_id,
            role: member.role,
        });
    }

    db::account_queries::link_member_to_account_user(&mut tx, trip_id, member_id, user_id).await?;
    db::account_queries::insert_account_audit_event(
        &mut tx,
        NewAccountAuditEvent {
            id: Uuid::now_v7(),
            user_id,
            trip_id,
            actor_user_id: user_id,
            actor_member_id: member_id,
            event_type: "member.claimed_account",
            payload: serde_json::json!({}),
        },
    )
    .await?;
    tx.commit().await?;

    Ok(AccountMemberClaimResponse {
        trip_id,
        member_id,
        user_id,
        role: member.role,
    })
}

pub async fn transfer_trip_owner(
    pool: &PgPool,
    session_token: &str,
    trip_id: Uuid,
    target_member_id: Uuid,
) -> Result<OwnerTransferResponse, ServiceError> {
    let session_token_hash = hash_session_token(session_token)?;
    let mut tx = pool.begin().await?;

    db::account_queries::defer_constraints(&mut tx).await?;
    let user_id = db::account_queries::find_active_user_session_in_tx(&mut tx, &session_token_hash)
        .await?
        .ok_or(ServiceError::Unauthenticated)?
        .user_id;
    let current_owner = db::account_queries::lock_current_owner_member(&mut tx, trip_id)
        .await?
        .ok_or(ServiceError::Forbidden)?;

    if current_owner.access_status != TripMemberAccessStatus::Active
        || current_owner.user_id != Some(user_id)
    {
        return Err(ServiceError::Forbidden);
    }

    if target_member_id == current_owner.id {
        return Err(ServiceError::OwnerTransferInvalid);
    }

    let target_member =
        db::account_queries::lock_owner_transfer_target_member(&mut tx, trip_id, target_member_id)
            .await?
            .ok_or(ServiceError::OwnerTransferInvalid)?;

    let Some(target_user_id) = target_member.user_id else {
        return Err(ServiceError::OwnerTransferInvalid);
    };

    if target_member.access_status != TripMemberAccessStatus::Active
        || target_member.user_disabled_at.is_some()
    {
        return Err(ServiceError::OwnerTransferInvalid);
    }

    db::account_queries::update_trip_member_role(
        &mut tx,
        trip_id,
        current_owner.id,
        TripRole::Organizer,
    )
    .await?;
    db::account_queries::update_trip_member_role(
        &mut tx,
        trip_id,
        target_member.id,
        TripRole::Owner,
    )
    .await?;
    db::account_queries::update_trip_owner_member(&mut tx, trip_id, target_member.id).await?;
    db::account_queries::insert_account_audit_event(
        &mut tx,
        NewAccountAuditEvent {
            id: Uuid::now_v7(),
            user_id: target_user_id,
            trip_id,
            actor_user_id: user_id,
            actor_member_id: current_owner.id,
            event_type: "owner.transferred",
            payload: serde_json::json!({}),
        },
    )
    .await?;
    tx.commit().await?;

    Ok(OwnerTransferResponse {
        trip_id,
        previous_owner_member_id: current_owner.id,
        new_owner_member_id: target_member.id,
    })
}
