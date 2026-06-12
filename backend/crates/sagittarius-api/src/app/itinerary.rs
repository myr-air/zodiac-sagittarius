use uuid::Uuid;

use crate::app::{auth, events};
use crate::db;
use crate::db::PgPool;
use crate::domain::capabilities::can;
use crate::domain::errors::ServiceError;
use crate::domain::patches::{
    CreateItineraryItemRequest, PatchItineraryItemRequest, ReorderItineraryItemsRequest,
};
use crate::domain::types::{Capability, ItineraryItemSummary};
use crate::realtime::RealtimeHub;

pub async fn patch_itinerary_item(
    pool: &PgPool,
    realtime: &RealtimeHub,
    trip_id: Uuid,
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
    if existing.trip_id != trip_id {
        return Err(ServiceError::NotFound);
    }
    let session =
        db::queries::find_active_member_session_in_tx(&mut tx, existing.trip_id, &token_hash)
            .await?
            .ok_or(ServiceError::Unauthenticated)?;

    if !can(session.role, Capability::EditItinerary) {
        return Err(ServiceError::Forbidden);
    }

    if db::queries::realtime_event_exists_for_client_mutation(
        &mut tx,
        existing.trip_id,
        session.member_id,
        &request.client_mutation_id,
    )
    .await?
    {
        return Err(ServiceError::VersionConflict);
    }

    if existing.version != request.expected_version {
        let latest = serde_json::to_value(ItineraryItemSummary::from(existing))
            .map_err(|_| ServiceError::InvalidRequest("latest item could not be serialized"))?;
        return Err(ServiceError::VersionConflictWithLatest(latest));
    }

    let target_parent_item_id = request
        .patch
        .parent_item_id
        .unwrap_or(existing.parent_item_id);
    let target_day = request.patch.day.unwrap_or(existing.day);
    validate_itinerary_block_patch(
        &mut tx,
        trip_id,
        item_id,
        existing.day,
        target_day,
        target_parent_item_id,
    )
    .await?;
    validate_itinerary_parent(
        &mut tx,
        trip_id,
        item_id,
        existing.plan_variant_id,
        target_day,
        target_parent_item_id,
    )
    .await?;

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

pub async fn create_itinerary_item(
    pool: &PgPool,
    realtime: &RealtimeHub,
    trip_id: Uuid,
    session_token: &str,
    request: CreateItineraryItemRequest,
) -> Result<ItineraryItemSummary, ServiceError> {
    request.validate()?;

    let token_hash = auth::hash_session_token(session_token)?;
    let mut tx = pool.begin().await?;
    let session = db::queries::find_active_member_session_in_tx(&mut tx, trip_id, &token_hash)
        .await?
        .ok_or(ServiceError::Unauthenticated)?;
    if !can(session.role, Capability::EditItinerary) {
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
    if !db::queries::plan_variant_exists_for_trip(&mut tx, trip_id, request.plan_variant_id).await?
    {
        return Err(ServiceError::NotFound);
    }

    let item_id = Uuid::now_v7();
    validate_itinerary_parent(
        &mut tx,
        trip_id,
        item_id,
        request.plan_variant_id,
        request.day,
        request.parent_item_id,
    )
    .await?;

    let sort_order = db::queries::next_itinerary_sort_order(
        &mut tx,
        trip_id,
        request.plan_variant_id,
        request.day,
    )
    .await?;
    let empty_details = serde_json::json!({});
    let details = request.details.as_ref().unwrap_or(&empty_details);
    let record = db::queries::insert_itinerary_item(
        &mut tx,
        db::models::NewItineraryItem {
            id: item_id,
            trip_id,
            plan_variant_id: request.plan_variant_id,
            path_group_id: request.path_group_id.as_deref(),
            path_id: request.path_id.as_deref(),
            path_name: request.path_name.as_deref(),
            path_role: request.path_role.as_deref(),
            parent_item_id: request.parent_item_id,
            item_kind: request.item_kind.as_deref().unwrap_or("activity"),
            time_mode: request.time_mode.as_deref().unwrap_or("scheduled"),
            is_plan_block: request.is_plan_block.unwrap_or(false),
            status: request.status.as_deref().unwrap_or("idea"),
            priority: request.priority.as_deref().unwrap_or("normal"),
            day: request.day,
            sort_order,
            start_time: request.start_time.as_deref(),
            end_time: request.end_time.as_deref(),
            end_offset_days: request.end_offset_days.unwrap_or(0),
            activity: request.activity.trim(),
            activity_type: request.activity_type.as_str(),
            place: request.place.trim(),
            map_link: request.map_link.as_deref().unwrap_or("").trim(),
            address: request.address.as_deref(),
            latitude: request.latitude,
            longitude: request.longitude,
            duration_minutes: request.duration_minutes,
            transportation: request.transportation.as_deref().unwrap_or("").trim(),
            details,
            note: request.note.as_deref().unwrap_or("").trim(),
            created_by: session.member_id,
        },
    )
    .await?;
    let created = ItineraryItemSummary::from(record);
    let event = insert_item_event(
        &mut tx,
        &created,
        "itinerary_item.created",
        Some(request.client_mutation_id.as_str()),
        Some(session.member_id),
    )
    .await?;

    tx.commit().await?;
    realtime.publish(event).await;

    Ok(created)
}

async fn validate_itinerary_block_patch(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    trip_id: Uuid,
    item_id: Uuid,
    existing_day: time::Date,
    target_day: time::Date,
    target_parent_item_id: Option<Uuid>,
) -> Result<(), ServiceError> {
    let has_children = db::queries::itinerary_item_has_children(tx, trip_id, item_id).await?;
    if !has_children {
        return Ok(());
    }

    if target_parent_item_id.is_some() {
        return Err(ServiceError::InvalidRequest(
            "activity block with sub-activities cannot become a sub-activity",
        ));
    }
    if target_day != existing_day {
        return Err(ServiceError::InvalidRequest(
            "activity block with sub-activities cannot move days without its children",
        ));
    }

    Ok(())
}

async fn validate_itinerary_parent(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    trip_id: Uuid,
    item_id: Uuid,
    plan_variant_id: Uuid,
    day: time::Date,
    parent_item_id: Option<Uuid>,
) -> Result<(), ServiceError> {
    let Some(parent_item_id) = parent_item_id else {
        return Ok(());
    };
    if parent_item_id == item_id {
        return Err(ServiceError::InvalidRequest(
            "itinerary item cannot be its own parent",
        ));
    }

    let (parent_plan_variant_id, parent_day, grandparent_item_id) =
        db::queries::itinerary_item_parent_for_trip(tx, trip_id, parent_item_id)
            .await?
            .ok_or(ServiceError::NotFound)?;
    if parent_plan_variant_id != plan_variant_id || parent_day != day {
        return Err(ServiceError::InvalidRequest(
            "sub-activity parent must be in the same trip plan and day",
        ));
    }
    if grandparent_item_id.is_some() {
        return Err(ServiceError::InvalidRequest(
            "itinerary hierarchy supports activity and sub-activity only",
        ));
    }

    Ok(())
}

pub async fn delete_itinerary_item(
    pool: &PgPool,
    realtime: &RealtimeHub,
    trip_id: Uuid,
    item_id: Uuid,
    session_token: &str,
) -> Result<ItineraryItemSummary, ServiceError> {
    let token_hash = auth::hash_session_token(session_token)?;
    let mut tx = pool.begin().await?;
    let existing = db::queries::lock_itinerary_item(&mut tx, item_id)
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

    let deleted = db::queries::delete_itinerary_item(&mut tx, item_id, existing.version + 1)
        .await?
        .ok_or(ServiceError::NotFound)?;
    let deleted = ItineraryItemSummary::from(deleted);
    let event = insert_item_event(
        &mut tx,
        &deleted,
        "itinerary_item.deleted",
        None,
        Some(session.member_id),
    )
    .await?;

    tx.commit().await?;
    realtime.publish(event).await;

    Ok(deleted)
}

pub async fn reorder_itinerary_items(
    pool: &PgPool,
    realtime: &RealtimeHub,
    trip_id: Uuid,
    session_token: &str,
    request: ReorderItineraryItemsRequest,
) -> Result<Vec<ItineraryItemSummary>, ServiceError> {
    request.validate()?;

    let token_hash = auth::hash_session_token(session_token)?;
    let mut tx = pool.begin().await?;
    let session = db::queries::find_active_member_session_in_tx(&mut tx, trip_id, &token_hash)
        .await?
        .ok_or(ServiceError::Unauthenticated)?;
    if !can(session.role, Capability::EditItinerary) {
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

    let rows = db::queries::reorder_itinerary_items(
        &mut tx,
        trip_id,
        request.plan_variant_id,
        request.day,
        &request.item_ids,
    )
    .await?;
    if rows.len() != request.item_ids.len() {
        return Err(ServiceError::NotFound);
    }
    let items: Vec<ItineraryItemSummary> = rows.into_iter().map(Into::into).collect();
    let aggregate_id = items
        .first()
        .map(|item| item.id)
        .ok_or(ServiceError::NotFound)?;
    let payload = serde_json::to_value(&items)
        .map_err(|_| ServiceError::InvalidRequest("event payload could not be serialized"))?;
    let event = events::insert(
        &mut tx,
        events::EventWrite {
            trip_id,
            aggregate_type: "itinerary_item",
            event_type: "itinerary_items.reordered",
            aggregate_id,
            version: 1,
            payload,
            client_mutation_id: Some(request.client_mutation_id.as_str()),
            created_by: Some(session.member_id),
        },
    )
    .await?;

    tx.commit().await?;
    realtime.publish(event).await;

    Ok(items)
}

async fn insert_item_event(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    item: &ItineraryItemSummary,
    event_type: &'static str,
    client_mutation_id: Option<&str>,
    created_by: Option<Uuid>,
) -> Result<crate::realtime::RealtimeEvent, ServiceError> {
    let payload = serde_json::to_value(item)
        .map_err(|_| ServiceError::InvalidRequest("event payload could not be serialized"))?;
    let event = events::insert(
        tx,
        events::EventWrite {
            trip_id: item.trip_id,
            aggregate_type: "itinerary_item",
            event_type,
            aggregate_id: item.id,
            version: item.version,
            payload,
            client_mutation_id,
            created_by,
        },
    )
    .await?;

    Ok(event)
}
