use uuid::Uuid;

use crate::app::{auth, events};
use crate::db;
use crate::db::PgPool;
use crate::domain::capabilities::can;
use crate::domain::errors::ServiceError;
use crate::domain::patches::{
    CreatePlanVariantRequest, PatchPlanVariantRequest, PublishPlanVariantRequest,
};
use crate::domain::types::{Capability, PlanVariantSummary, TripSummary};
use crate::realtime::RealtimeHub;

pub async fn create_plan_variant(
    pool: &PgPool,
    realtime: &RealtimeHub,
    trip_id: Uuid,
    session_token: &str,
    request: CreatePlanVariantRequest,
) -> Result<PlanVariantSummary, ServiceError> {
    request.validate()?;

    let token_hash = auth::hash_session_token(session_token)?;
    let mut tx = pool.begin().await?;
    let session = db::queries::find_active_member_session_in_tx(&mut tx, trip_id, &token_hash)
        .await?
        .ok_or(ServiceError::Unauthenticated)?;
    if !can(session.role, Capability::EditItinerary) {
        return Err(ServiceError::Forbidden);
    }
    reject_duplicate_mutation(
        &mut tx,
        trip_id,
        session.member_id,
        &request.client_mutation_id,
    )
    .await?;

    let record = db::queries::insert_plan_variant(
        &mut tx,
        db::models::NewPlanVariant {
            id: Uuid::now_v7(),
            trip_id,
            name: request.name.trim(),
            kind: request.kind.as_str(),
            description: request.description.as_deref().unwrap_or("").trim(),
        },
    )
    .await?;
    let created = PlanVariantSummary::from(record);
    let event = insert_variant_event(
        &mut tx,
        &created,
        "plan_variant.created",
        Some(request.client_mutation_id.as_str()),
        Some(session.member_id),
    )
    .await?;

    tx.commit().await?;
    realtime.publish(event).await;

    Ok(created)
}

pub async fn patch_plan_variant(
    pool: &PgPool,
    realtime: &RealtimeHub,
    trip_id: Uuid,
    plan_variant_id: Uuid,
    session_token: &str,
    request: PatchPlanVariantRequest,
) -> Result<PlanVariantSummary, ServiceError> {
    request.validate()?;

    let token_hash = auth::hash_session_token(session_token)?;
    let mut tx = pool.begin().await?;
    let existing = db::queries::lock_plan_variant(&mut tx, plan_variant_id)
        .await?
        .ok_or(ServiceError::NotFound)?;
    if existing.trip_id != trip_id {
        return Err(ServiceError::NotFound);
    }
    let session = db::queries::find_active_member_session_in_tx(&mut tx, trip_id, &token_hash)
        .await?
        .ok_or(ServiceError::Unauthenticated)?;
    if !can(session.role, Capability::EditItinerary) {
        return Err(ServiceError::Forbidden);
    }
    reject_duplicate_mutation(
        &mut tx,
        trip_id,
        session.member_id,
        &request.client_mutation_id,
    )
    .await?;

    if existing.version != request.expected_version {
        let latest = serde_json::to_value(PlanVariantSummary::from(existing))
            .map_err(|_| ServiceError::InvalidRequest("latest variant could not be serialized"))?;
        return Err(ServiceError::VersionConflictWithLatest(latest));
    }

    let updated_record = db::queries::update_plan_variant(
        &mut tx,
        plan_variant_id,
        &request.patch,
        existing.version + 1,
    )
    .await?
    .ok_or(ServiceError::NotFound)?;
    let updated = PlanVariantSummary::from(updated_record);
    let event = insert_variant_event(
        &mut tx,
        &updated,
        "plan_variant.updated",
        Some(request.client_mutation_id.as_str()),
        Some(session.member_id),
    )
    .await?;

    tx.commit().await?;
    realtime.publish(event).await;

    Ok(updated)
}

pub async fn publish_plan_variant(
    pool: &PgPool,
    realtime: &RealtimeHub,
    trip_id: Uuid,
    plan_variant_id: Uuid,
    session_token: &str,
    request: PublishPlanVariantRequest,
) -> Result<TripSummary, ServiceError> {
    request.validate()?;

    let token_hash = auth::hash_session_token(session_token)?;
    let mut tx = pool.begin().await?;
    let trip = db::queries::lock_trip(&mut tx, trip_id)
        .await?
        .ok_or(ServiceError::NotFound)?;
    let variant = db::queries::lock_plan_variant(&mut tx, plan_variant_id)
        .await?
        .ok_or(ServiceError::NotFound)?;
    if variant.trip_id != trip_id {
        return Err(ServiceError::NotFound);
    }
    let session = db::queries::find_active_member_session_in_tx(&mut tx, trip_id, &token_hash)
        .await?
        .ok_or(ServiceError::Unauthenticated)?;
    if !can(session.role, Capability::EditItinerary) {
        return Err(ServiceError::Forbidden);
    }
    reject_duplicate_mutation(
        &mut tx,
        trip_id,
        session.member_id,
        &request.client_mutation_id,
    )
    .await?;

    let updated_trip = db::queries::update_trip_active_plan_variant(
        &mut tx,
        trip_id,
        plan_variant_id,
        trip.version + 1,
    )
    .await?
    .ok_or(ServiceError::NotFound)?;
    let summary = TripSummary::from(updated_trip);
    let payload = serde_json::json!({
        "activePlanVariantId": plan_variant_id,
        "trip": summary,
    });
    let event = events::insert(
        &mut tx,
        events::EventWrite {
            trip_id,
            aggregate_type: "plan_variant",
            event_type: "plan_variant.updated",
            aggregate_id: plan_variant_id,
            version: summary.version,
            payload,
            client_mutation_id: Some(request.client_mutation_id.as_str()),
            created_by: Some(session.member_id),
        },
    )
    .await?;

    tx.commit().await?;
    realtime.publish(event).await;

    Ok(summary)
}

async fn reject_duplicate_mutation(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    trip_id: Uuid,
    member_id: Uuid,
    client_mutation_id: &str,
) -> Result<(), ServiceError> {
    if db::queries::realtime_event_exists_for_client_mutation(
        tx,
        trip_id,
        member_id,
        client_mutation_id,
    )
    .await?
    {
        return Err(ServiceError::VersionConflict);
    }

    Ok(())
}

async fn insert_variant_event(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    variant: &PlanVariantSummary,
    event_type: &'static str,
    client_mutation_id: Option<&str>,
    created_by: Option<Uuid>,
) -> Result<crate::realtime::RealtimeEvent, ServiceError> {
    let payload = serde_json::to_value(variant)
        .map_err(|_| ServiceError::InvalidRequest("event payload could not be serialized"))?;

    events::insert(
        tx,
        events::EventWrite {
            trip_id: variant.trip_id,
            aggregate_type: "plan_variant",
            event_type,
            aggregate_id: variant.id,
            version: variant.version,
            payload,
            client_mutation_id,
            created_by,
        },
    )
    .await
}
