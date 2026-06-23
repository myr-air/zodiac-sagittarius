use uuid::Uuid;

use crate::app::{auth, events, mutation_guard};
use crate::db;
use crate::db::PgPool;
use crate::domain::capabilities::can;
use crate::domain::errors::ServiceError;
use crate::domain::patches::{
    CreatePlanVariantRequest, PatchPlanVariantRequest, PublishPlanVariantRequest,
};
use crate::domain::plan_status::legacy_kind_for_plan_status;
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
    if !can(session.role, Capability::ManageTripPlans) {
        return Err(ServiceError::Forbidden);
    }
    mutation_guard::reject_duplicate_mutation(
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
            kind: request.effective_kind(),
            status: request.effective_status(),
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
    let main_trip_plan_id = db::queries::active_plan_variant_id_for_trip(&mut tx, trip_id).await?;
    let session = db::queries::find_active_member_session_in_tx(&mut tx, trip_id, &token_hash)
        .await?
        .ok_or(ServiceError::Unauthenticated)?;
    if !can(session.role, Capability::ManageTripPlans) {
        return Err(ServiceError::Forbidden);
    }
    mutation_guard::reject_duplicate_mutation(
        &mut tx,
        trip_id,
        session.member_id,
        &request.client_mutation_id,
    )
    .await?;

    if existing.version != request.expected_version {
        return Err(mutation_guard::version_conflict_with_latest(
            PlanVariantSummary::from_record_for_main_pointer(existing, main_trip_plan_id),
            "latest variant could not be serialized",
        ));
    }

    let mut updated_record = db::queries::update_plan_variant(
        &mut tx,
        plan_variant_id,
        &request.patch,
        existing.version + 1,
    )
    .await?
    .ok_or(ServiceError::NotFound)?;
    let mut updated =
        PlanVariantSummary::from_record_for_main_pointer(updated_record.clone(), main_trip_plan_id);
    if updated.kind != updated_record.kind || updated.status != updated_record.status {
        updated_record = db::queries::update_plan_variant_status(
            &mut tx,
            plan_variant_id,
            &updated.kind,
            &updated.status,
            updated_record.version,
        )
        .await?
        .ok_or(ServiceError::NotFound)?;
        updated =
            PlanVariantSummary::from_record_for_main_pointer(updated_record, main_trip_plan_id);
    }
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
    if !can(session.role, Capability::ManageTripPlans) {
        return Err(ServiceError::Forbidden);
    }
    mutation_guard::reject_duplicate_mutation(
        &mut tx,
        trip_id,
        session.member_id,
        &request.client_mutation_id,
    )
    .await?;

    let mut previous_main_summary = None;
    if let Some(previous_main_id) = trip.active_plan_variant_id {
        if previous_main_id != plan_variant_id {
            let previous_main = db::queries::lock_plan_variant(&mut tx, previous_main_id)
                .await?
                .ok_or(ServiceError::NotFound)?;
            let previous_status = request
                .previous_main_next_status
                .as_deref()
                .unwrap_or("backup");
            let previous_kind = legacy_kind_for_plan_status(previous_status);
            let updated_previous_main = db::queries::update_plan_variant_status(
                &mut tx,
                previous_main_id,
                previous_kind,
                previous_status,
                previous_main.version + 1,
            )
            .await?
            .ok_or(ServiceError::NotFound)?;
            previous_main_summary = Some(PlanVariantSummary::from(updated_previous_main));
        }
    }

    let updated_variant = db::queries::update_plan_variant_status(
        &mut tx,
        plan_variant_id,
        "main",
        "main",
        variant.version + 1,
    )
    .await?
    .ok_or(ServiceError::NotFound)?;

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
        "mainTripPlanId": plan_variant_id,
        "tripPlan": PlanVariantSummary::from(updated_variant),
        "previousMainTripPlan": previous_main_summary,
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
