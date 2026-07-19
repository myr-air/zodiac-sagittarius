use uuid::Uuid;

use crate::{auth, events, kernel, mutation_guard};
use sagittarius_db as db;
use sagittarius_db::PgPool;
use sagittarius_db::models::NewStopNote;
use sagittarius_domain::capabilities::can;
use sagittarius_domain::errors::ServiceError;
use sagittarius_domain::patches::{CreateStopNoteRequest, PatchStopNoteRequest};
use sagittarius_domain::types::{Capability, StopNoteSummary, TripRole};
use sagittarius_realtime::RealtimeHub;

pub async fn create_stop_note(
    pool: &PgPool,
    realtime: &RealtimeHub,
    trip_id: Uuid,
    session_token: &str,
    request: CreateStopNoteRequest,
) -> Result<StopNoteSummary, ServiceError> {
    request.validate()?;

    let mut mutation = kernel::MemberMutation::begin(
        pool,
        trip_id,
        session_token,
        &[Capability::EditItinerary, Capability::CreateSuggestion],
        &request.client_mutation_id,
    )
    .await?;

    let item_trip_plan_id = db::queries::itinerary_item_plan_variant_id_for_trip(
        &mut mutation.tx,
        trip_id,
        request.itinerary_item_id,
    )
    .await?
    .ok_or(ServiceError::NotFound)?;
    if let Some(trip_plan_id) = request.trip_plan_id {
        if trip_plan_id != item_trip_plan_id {
            return Err(ServiceError::InvalidRequest(
                "tripPlanId must match itinerary item plan",
            ));
        }
        if !db::queries::plan_variant_exists_for_trip(&mut mutation.tx, trip_id, trip_plan_id)
            .await?
        {
            return Err(ServiceError::NotFound);
        }
    }

    let note = db::queries::insert_stop_note(
        &mut mutation.tx,
        NewStopNote {
            id: Uuid::now_v7(),
            trip_id,
            trip_plan_id: Some(request.trip_plan_id.unwrap_or(item_trip_plan_id)),
            itinerary_item_id: request.itinerary_item_id,
            author_id: mutation.session.member_id,
            body: request.body.trim(),
        },
    )
    .await?;
    let summary = StopNoteSummary::from(note);
    let event = write_event(
        &mut mutation.tx,
        &summary,
        "stop_note.created",
        Some(request.client_mutation_id.as_str()),
        Some(mutation.session.member_id),
    )
    .await?;

    mutation.commit_publish(realtime, vec![event]).await?;
    Ok(summary)
}

pub async fn patch_stop_note(
    pool: &PgPool,
    realtime: &RealtimeHub,
    trip_id: Uuid,
    note_id: Uuid,
    session_token: &str,
    request: PatchStopNoteRequest,
) -> Result<StopNoteSummary, ServiceError> {
    request.validate()?;

    let token_hash = auth::hash_session_token(session_token)?;
    let mut tx = pool.begin().await?;
    let existing = db::queries::lock_stop_note(&mut tx, note_id)
        .await?
        .ok_or(ServiceError::NotFound)?;
    if existing.trip_id != trip_id {
        return Err(ServiceError::NotFound);
    }

    let session = db::queries::find_active_member_session_in_tx(&mut tx, trip_id, &token_hash)
        .await?
        .ok_or(ServiceError::Unauthenticated)?;
    if !can_manage_stop_note(session.role, session.member_id, existing.author_id) {
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
            StopNoteSummary::from(existing),
            "latest stop note could not be serialized",
        ));
    }
    let trip_plan_id = db::queries::itinerary_item_plan_variant_id_for_trip(
        &mut tx,
        trip_id,
        existing.itinerary_item_id,
    )
    .await?
    .ok_or(ServiceError::NotFound)?;

    let updated = db::queries::update_stop_note(
        &mut tx,
        note_id,
        request.body.trim(),
        Some(trip_plan_id),
        request.expected_version + 1,
    )
    .await?
    .ok_or(ServiceError::NotFound)?;
    let summary = StopNoteSummary::from(updated);
    let event = write_event(
        &mut tx,
        &summary,
        "stop_note.updated",
        Some(request.client_mutation_id.as_str()),
        Some(session.member_id),
    )
    .await?;

    tx.commit().await?;
    realtime.publish(event).await;

    Ok(summary)
}

pub async fn delete_stop_note(
    pool: &PgPool,
    realtime: &RealtimeHub,
    trip_id: Uuid,
    note_id: Uuid,
    session_token: &str,
) -> Result<StopNoteSummary, ServiceError> {
    let token_hash = auth::hash_session_token(session_token)?;
    let mut tx = pool.begin().await?;
    let existing = db::queries::lock_stop_note(&mut tx, note_id)
        .await?
        .ok_or(ServiceError::NotFound)?;
    if existing.trip_id != trip_id {
        return Err(ServiceError::NotFound);
    }

    let session = db::queries::find_active_member_session_in_tx(&mut tx, trip_id, &token_hash)
        .await?
        .ok_or(ServiceError::Unauthenticated)?;
    if !can_manage_stop_note(session.role, session.member_id, existing.author_id) {
        return Err(ServiceError::Forbidden);
    }

    let deleted = db::queries::delete_stop_note(&mut tx, note_id, existing.version + 1)
        .await?
        .ok_or(ServiceError::NotFound)?;
    let summary = StopNoteSummary::from(deleted);
    let event = write_event(
        &mut tx,
        &summary,
        "stop_note.deleted",
        None,
        Some(session.member_id),
    )
    .await?;

    tx.commit().await?;
    realtime.publish(event).await;

    Ok(summary)
}

fn can_manage_stop_note(role: TripRole, member_id: Uuid, author_id: Uuid) -> bool {
    member_id == author_id || can(role, Capability::EditItinerary)
}

async fn write_event(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    note: &StopNoteSummary,
    event_type: &'static str,
    client_mutation_id: Option<&str>,
    created_by: Option<Uuid>,
) -> Result<sagittarius_realtime::RealtimeEvent, ServiceError> {
    let payload = serde_json::to_value(note)
        .map_err(|_| ServiceError::InvalidRequest("event payload could not be serialized"))?;
    let event = events::insert(
        tx,
        events::EventWrite {
            trip_id: note.trip_id,
            aggregate_type: "stop_note",
            event_type,
            aggregate_id: note.id,
            version: note.version,
            payload,
            client_mutation_id,
            created_by,
        },
    )
    .await?;

    Ok(event)
}
