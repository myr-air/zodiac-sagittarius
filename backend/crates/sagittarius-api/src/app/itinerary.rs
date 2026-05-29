use uuid::Uuid;

use crate::app::{auth, events};
use crate::db;
use crate::db::PgPool;
use crate::domain::capabilities::can;
use crate::domain::errors::ServiceError;
use crate::domain::patches::PatchItineraryItemRequest;
use crate::domain::types::{Capability, ItineraryItemSummary};
use crate::realtime::RealtimeHub;

pub async fn patch_itinerary_item(
    pool: &PgPool,
    realtime: &RealtimeHub,
    item_id: Uuid,
    session_token: &str,
    request: PatchItineraryItemRequest,
) -> Result<ItineraryItemSummary, ServiceError> {
    request.patch.validate()?;

    let token_hash = auth::hash_session_token(session_token)?;
    let mut tx = pool.begin().await?;
    let existing = db::queries::lock_itinerary_item(&mut tx, item_id)
        .await?
        .ok_or(ServiceError::NotFound)?;
    let session =
        db::queries::find_active_member_session_in_tx(&mut tx, existing.trip_id, &token_hash)
            .await?
            .ok_or(ServiceError::Unauthenticated)?;

    if !can(session.role, Capability::EditItinerary) {
        return Err(ServiceError::Forbidden);
    }

    if existing.version != request.expected_version {
        return Err(ServiceError::VersionConflict);
    }

    let updated_record =
        db::queries::update_itinerary_item(&mut tx, item_id, &request.patch, existing.version + 1)
            .await?
            .ok_or(ServiceError::NotFound)?;
    let updated = ItineraryItemSummary::from(updated_record);
    let payload = serde_json::to_value(&updated)
        .map_err(|_| ServiceError::InvalidRequest("event payload could not be serialized"))?;
    let event = events::insert(
        &mut tx,
        events::EventWrite {
            trip_id: updated.trip_id,
            aggregate_type: "itinerary_item",
            event_type: "itinerary_item.updated",
            aggregate_id: updated.id,
            version: updated.version,
            payload,
            client_mutation_id: Some(request.client_mutation_id.as_str()),
            created_by: Some(session.member_id),
        },
    )
    .await?;

    tx.commit().await?;
    realtime.publish(event).await;

    Ok(updated)
}
