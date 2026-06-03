use uuid::Uuid;

use crate::app::{auth, events};
use crate::db;
use crate::db::PgPool;
use crate::db::models::NewStopNote;
use crate::domain::capabilities::can;
use crate::domain::errors::ServiceError;
use crate::domain::patches::{CreateStopNoteRequest, PatchStopNoteRequest};
use crate::domain::types::{Capability, StopNoteSummary, TripRole};
use crate::realtime::RealtimeHub;

pub async fn create_stop_note(
    pool: &PgPool,
    realtime: &RealtimeHub,
    trip_id: Uuid,
    session_token: &str,
    request: CreateStopNoteRequest,
) -> Result<StopNoteSummary, ServiceError> {
    request.validate()?;

    let token_hash = auth::hash_session_token(session_token)?;
    let mut tx = pool.begin().await?;
    let session = db::queries::find_active_member_session_in_tx(&mut tx, trip_id, &token_hash)
        .await?
        .ok_or(ServiceError::Unauthenticated)?;

    if !can_create_stop_note(session.role) {
        return Err(ServiceError::Forbidden);
    }

    if db::queries::realtime_event_exists_for_client_mutation(
        &mut tx,
        trip_id,
        session.member_id,
        &request.client_mutation_id,
    )
    .await?
    {
        return Err(ServiceError::VersionConflict);
    }

    if !db::queries::itinerary_item_exists_for_trip(&mut tx, trip_id, request.itinerary_item_id)
        .await?
    {
        return Err(ServiceError::NotFound);
    }

    let note = db::queries::insert_stop_note(
        &mut tx,
        NewStopNote {
            id: Uuid::now_v7(),
            trip_id,
            itinerary_item_id: request.itinerary_item_id,
            author_id: session.member_id,
            body: request.body.trim(),
        },
    )
    .await?;
    let summary = StopNoteSummary::from(note);
    let event = write_event(
        &mut tx,
        &summary,
        "stop_note.created",
        Some(request.client_mutation_id.as_str()),
        Some(session.member_id),
    )
    .await?;

    tx.commit().await?;
    realtime.publish(event).await;

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
    if db::queries::realtime_event_exists_for_client_mutation(
        &mut tx,
        trip_id,
        session.member_id,
        &request.client_mutation_id,
    )
    .await?
    {
        return Err(ServiceError::VersionConflict);
    }
    if existing.version != request.expected_version {
        let latest = serde_json::to_value(StopNoteSummary::from(existing)).map_err(|_| {
            ServiceError::InvalidRequest("latest stop note could not be serialized")
        })?;
        return Err(ServiceError::VersionConflictWithLatest(latest));
    }

    let updated = db::queries::update_stop_note(
        &mut tx,
        note_id,
        request.body.trim(),
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

fn can_create_stop_note(role: TripRole) -> bool {
    can(role, Capability::EditItinerary) || can(role, Capability::CreateSuggestion)
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
) -> Result<crate::realtime::RealtimeEvent, ServiceError> {
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
