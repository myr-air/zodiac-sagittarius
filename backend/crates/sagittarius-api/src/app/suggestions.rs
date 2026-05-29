use uuid::Uuid;

use crate::app::{auth, events};
use crate::db;
use crate::db::PgPool;
use crate::db::models::{NewSuggestion, SuggestionRecord};
use crate::domain::capabilities::can;
use crate::domain::errors::ServiceError;
use crate::domain::patches::{CreateSuggestionRequest, ItineraryItemPatch};
use crate::domain::types::{Capability, SuggestionSummary};
use crate::realtime::{RealtimeEvent, RealtimeHub};

pub async fn create_suggestion(
    pool: &PgPool,
    realtime: &RealtimeHub,
    trip_id: Uuid,
    session_token: &str,
    request: CreateSuggestionRequest,
) -> Result<SuggestionSummary, ServiceError> {
    validate_suggestion_request(&request)?;

    let token_hash = auth::hash_session_token(session_token)?;
    let mut tx = pool.begin().await?;
    let session = db::queries::find_active_member_session_in_tx(&mut tx, trip_id, &token_hash)
        .await?
        .ok_or(ServiceError::Unauthenticated)?;

    if !can(session.role, Capability::CreateSuggestion) {
        return Err(ServiceError::Forbidden);
    }

    if db::queries::realtime_event_exists_for_client_mutation(
        &mut tx,
        session.trip_id,
        session.member_id,
        &request.client_mutation_id,
    )
    .await?
    {
        return Err(ServiceError::VersionConflict);
    }

    validate_suggestion_references(&mut tx, session.trip_id, &request).await?;

    let suggestion = db::queries::insert_suggestion(
        &mut tx,
        NewSuggestion {
            id: Uuid::now_v7(),
            trip_id: session.trip_id,
            plan_variant_id: request.plan_variant_id,
            proposer_id: session.member_id,
            r#type: &request.r#type,
            target_item_id: request.target_item_id,
            proposed_patch: request.proposed_patch,
            source_version: request.source_version,
        },
    )
    .await?;
    let summary = SuggestionSummary::from(suggestion);
    let event = insert_suggestion_event(
        &mut tx,
        "suggestion.created",
        &summary,
        Some(request.client_mutation_id.as_str()),
        Some(session.member_id),
    )
    .await?;

    tx.commit().await?;
    realtime.publish(event).await;

    Ok(summary)
}

pub async fn approve_suggestion(
    pool: &PgPool,
    realtime: &RealtimeHub,
    suggestion_id: Uuid,
    session_token: &str,
) -> Result<SuggestionSummary, ServiceError> {
    let token_hash = auth::hash_session_token(session_token)?;
    let mut tx = pool.begin().await?;
    let suggestion = db::queries::lock_suggestion(&mut tx, suggestion_id)
        .await?
        .ok_or(ServiceError::NotFound)?;
    let session =
        db::queries::find_active_member_session_in_tx(&mut tx, suggestion.trip_id, &token_hash)
            .await?
            .ok_or(ServiceError::Unauthenticated)?;

    if !can(session.role, Capability::ReviewSuggestions) {
        return Err(ServiceError::Forbidden);
    }

    if suggestion.status != "pending" {
        return Err(ServiceError::InvalidRequest(
            "suggestion is already resolved",
        ));
    }

    let target_item_id = suggestion
        .target_item_id
        .ok_or(ServiceError::InvalidRequest(
            "suggestion target item is required",
        ))?;
    let item = db::queries::lock_itinerary_item(&mut tx, target_item_id)
        .await?
        .ok_or(ServiceError::NotFound)?;
    if item.trip_id != suggestion.trip_id {
        return Err(ServiceError::NotFound);
    }
    if item.plan_variant_id != suggestion.plan_variant_id {
        return Err(ServiceError::InvalidRequest(
            "suggestion target item plan variant does not match",
        ));
    }

    if suggestion.source_version != Some(item.version) {
        let resolved =
            update_status_and_insert_event(&mut tx, &suggestion, "conflicted", session.member_id)
                .await?;
        let latest = serde_json::to_value(resolved.summary.clone()).map_err(|_| {
            ServiceError::InvalidRequest("latest suggestion could not be serialized")
        })?;
        tx.commit().await?;
        realtime.publish(resolved.event).await;
        return Err(ServiceError::VersionConflictWithLatest(latest));
    }

    let patch = suggestion_patch(&suggestion)?;
    patch.validate()?;
    db::queries::update_itinerary_item(&mut tx, item.id, &patch, item.version + 1)
        .await?
        .ok_or(ServiceError::NotFound)?;

    let resolved =
        update_status_and_insert_event(&mut tx, &suggestion, "approved", session.member_id).await?;
    tx.commit().await?;
    realtime.publish(resolved.event).await;

    Ok(resolved.summary)
}

pub async fn reject_suggestion(
    pool: &PgPool,
    realtime: &RealtimeHub,
    suggestion_id: Uuid,
    session_token: &str,
) -> Result<SuggestionSummary, ServiceError> {
    let token_hash = auth::hash_session_token(session_token)?;
    let mut tx = pool.begin().await?;
    let suggestion = db::queries::lock_suggestion(&mut tx, suggestion_id)
        .await?
        .ok_or(ServiceError::NotFound)?;
    let session =
        db::queries::find_active_member_session_in_tx(&mut tx, suggestion.trip_id, &token_hash)
            .await?
            .ok_or(ServiceError::Unauthenticated)?;

    if !can(session.role, Capability::ReviewSuggestions) {
        return Err(ServiceError::Forbidden);
    }

    if suggestion.status != "pending" {
        return Err(ServiceError::InvalidRequest(
            "suggestion is already resolved",
        ));
    }

    let resolved =
        update_status_and_insert_event(&mut tx, &suggestion, "rejected", session.member_id).await?;
    tx.commit().await?;
    realtime.publish(resolved.event).await;

    Ok(resolved.summary)
}

fn validate_suggestion_request(request: &CreateSuggestionRequest) -> Result<(), ServiceError> {
    match request.r#type.as_str() {
        "edit" => {
            if request.target_item_id.is_none() {
                return Err(ServiceError::InvalidRequest("target_item_id is required"));
            }
            if request.source_version.is_none() {
                return Err(ServiceError::InvalidRequest("source_version is required"));
            }
            let patch: ItineraryItemPatch = serde_json::from_value(request.proposed_patch.clone())
                .map_err(|_| ServiceError::InvalidRequest("proposed_patch is invalid"))?;
            patch.validate()
        }
        "add" | "delete" | "reorder" => Ok(()),
        _ => Err(ServiceError::InvalidRequest("suggestion type is invalid")),
    }
}

async fn validate_suggestion_references(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    trip_id: Uuid,
    request: &CreateSuggestionRequest,
) -> Result<(), ServiceError> {
    let plan_exists =
        db::queries::plan_variant_exists_for_trip(tx, trip_id, request.plan_variant_id).await?;
    if !plan_exists {
        return Err(ServiceError::NotFound);
    }

    if request.r#type != "edit" {
        return Ok(());
    }

    let target_item_id = request
        .target_item_id
        .ok_or(ServiceError::InvalidRequest("target_item_id is required"))?;
    let target = db::queries::lock_itinerary_item(tx, target_item_id)
        .await?
        .ok_or(ServiceError::NotFound)?;
    if target.trip_id != trip_id {
        return Err(ServiceError::NotFound);
    }
    if target.plan_variant_id != request.plan_variant_id {
        return Err(ServiceError::InvalidRequest(
            "target item plan variant does not match",
        ));
    }

    Ok(())
}

fn suggestion_patch(suggestion: &SuggestionRecord) -> Result<ItineraryItemPatch, ServiceError> {
    if suggestion.r#type != "edit" {
        return Err(ServiceError::InvalidRequest(
            "suggestion type is not supported",
        ));
    }

    serde_json::from_value(suggestion.proposed_patch.clone())
        .map_err(|_| ServiceError::InvalidRequest("proposed_patch is invalid"))
}

struct ResolvedSuggestion {
    summary: SuggestionSummary,
    event: RealtimeEvent,
}

async fn update_status_and_insert_event(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    suggestion: &SuggestionRecord,
    status: &str,
    resolved_by: Uuid,
) -> Result<ResolvedSuggestion, ServiceError> {
    let updated = db::queries::update_suggestion_status(tx, suggestion.id, status, resolved_by)
        .await?
        .ok_or(ServiceError::NotFound)?;
    let summary = SuggestionSummary::from(updated);
    let event =
        insert_suggestion_event(tx, "suggestion.resolved", &summary, None, Some(resolved_by))
            .await?;

    Ok(ResolvedSuggestion { summary, event })
}

async fn insert_suggestion_event(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    event_type: &'static str,
    suggestion: &SuggestionSummary,
    client_mutation_id: Option<&str>,
    created_by: Option<Uuid>,
) -> Result<RealtimeEvent, ServiceError> {
    let payload = serde_json::to_value(suggestion)
        .map_err(|_| ServiceError::InvalidRequest("event payload could not be serialized"))?;
    events::insert(
        tx,
        events::EventWrite {
            trip_id: suggestion.trip_id,
            aggregate_type: "suggestion",
            event_type,
            aggregate_id: suggestion.id,
            version: 1,
            payload,
            client_mutation_id,
            created_by,
        },
    )
    .await
}
