use uuid::Uuid;

use crate::app::{auth, events};
use crate::db;
use crate::db::PgPool;
use crate::domain::capabilities::can;
use crate::domain::errors::ServiceError;
use crate::domain::patches::{
    CreateItineraryItemRequest, ItineraryItemPatch, PatchItineraryItemRequest,
    ReorderItineraryItemsRequest,
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

    let mut patch = request.patch.clone();
    let target_parent_item_id = patch.parent_item_id.unwrap_or(existing.parent_item_id);
    let target_day = patch.day.unwrap_or(existing.day);
    let target_end_time = patch
        .end_time
        .clone()
        .unwrap_or_else(|| existing.end_time.clone());
    let target_end_offset_days = patch.end_offset_days.unwrap_or(existing.end_offset_days);
    let target_is_plan_block = patch.is_plan_block.unwrap_or(existing.is_plan_block);
    validate_time_window_end_offset(target_end_time.as_deref(), target_end_offset_days)?;
    validate_sub_activity_not_plan_block(target_parent_item_id, target_is_plan_block)?;
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
    if let Some(parent_path_fields) =
        resolve_parent_path_fields(&mut tx, trip_id, target_parent_item_id).await?
    {
        validate_child_path_patch(&existing, &patch, &parent_path_fields)?;
        apply_path_fields_to_patch(&mut patch, &parent_path_fields);
    }

    let updated_record =
        db::queries::update_itinerary_item(&mut tx, item_id, &patch, existing.version + 1)
            .await?
            .ok_or(ServiceError::NotFound)?;
    let updated = ItineraryItemSummary::from(updated_record);
    let mut events_to_publish = Vec::new();
    if existing.parent_item_id.is_none() && patch_has_path_fields(&patch) {
        let child_records = db::queries::update_itinerary_child_path_fields(
            &mut tx,
            trip_id,
            item_id,
            updated.path_group_id.as_deref(),
            updated.path_id.as_deref(),
            updated.path_name.as_deref(),
            updated.path_role.as_deref(),
        )
        .await?;
        for child in child_records {
            let child = ItineraryItemSummary::from(child);
            events_to_publish.push(
                insert_item_event(
                    &mut tx,
                    &child,
                    "itinerary_item.updated",
                    None,
                    Some(session.member_id),
                )
                .await?,
            );
        }
    }
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
    for event in events_to_publish {
        realtime.publish(event).await;
    }

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
    validate_time_window_end_offset(
        request.end_time.as_deref(),
        request.end_offset_days.unwrap_or(0),
    )?;
    validate_sub_activity_not_plan_block(
        request.parent_item_id,
        request.is_plan_block.unwrap_or(false),
    )?;

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
    let parent_path_fields =
        resolve_parent_path_fields(&mut tx, trip_id, request.parent_item_id).await?;
    if let Some(parent_path_fields) = &parent_path_fields {
        validate_child_create_path_fields(&request, parent_path_fields)?;
    }

    let sort_order = if let Some(parent_item_id) = request.parent_item_id {
        db::queries::next_itinerary_child_sort_order(&mut tx, trip_id, parent_item_id).await?
    } else {
        db::queries::next_itinerary_sort_order(
            &mut tx,
            trip_id,
            request.plan_variant_id,
            request.day,
        )
        .await?
    };
    let empty_details = serde_json::json!({});
    let details = request.details.as_ref().unwrap_or(&empty_details);
    let path_group_id = parent_path_fields
        .as_ref()
        .and_then(|fields| fields.path_group_id.as_deref())
        .or(request.path_group_id.as_deref());
    let path_id = parent_path_fields
        .as_ref()
        .and_then(|fields| fields.path_id.as_deref())
        .or(request.path_id.as_deref());
    let path_name = parent_path_fields
        .as_ref()
        .and_then(|fields| fields.path_name.as_deref())
        .or(request.path_name.as_deref());
    let path_role = parent_path_fields
        .as_ref()
        .and_then(|fields| fields.path_role.as_deref())
        .or(request.path_role.as_deref());
    let record = db::queries::insert_itinerary_item(
        &mut tx,
        db::models::NewItineraryItem {
            id: item_id,
            trip_id,
            plan_variant_id: request.plan_variant_id,
            path_group_id,
            path_id,
            path_name,
            path_role,
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

#[derive(Debug, Clone, PartialEq, Eq)]
struct ItineraryPathFields {
    path_group_id: Option<String>,
    path_id: Option<String>,
    path_name: Option<String>,
    path_role: Option<String>,
}

impl ItineraryPathFields {
    fn from_patch(
        existing: &crate::db::models::ItineraryItemRecord,
        patch: &ItineraryItemPatch,
    ) -> Self {
        Self {
            path_group_id: patch
                .path_group_id
                .clone()
                .or_else(|| existing.path_group_id.clone()),
            path_id: patch.path_id.clone().or_else(|| existing.path_id.clone()),
            path_name: patch
                .path_name
                .clone()
                .or_else(|| existing.path_name.clone()),
            path_role: patch
                .path_role
                .clone()
                .or_else(|| existing.path_role.clone()),
        }
    }

    fn from_tuple(
        fields: (
            Option<String>,
            Option<String>,
            Option<String>,
            Option<String>,
        ),
    ) -> Self {
        Self {
            path_group_id: fields.0,
            path_id: fields.1,
            path_name: fields.2,
            path_role: fields.3,
        }
    }
}

async fn resolve_parent_path_fields(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    trip_id: Uuid,
    parent_item_id: Option<Uuid>,
) -> Result<Option<ItineraryPathFields>, ServiceError> {
    let Some(parent_item_id) = parent_item_id else {
        return Ok(None);
    };
    db::queries::itinerary_item_path_fields_for_trip(tx, trip_id, parent_item_id)
        .await?
        .ok_or(ServiceError::NotFound)
        .map(ItineraryPathFields::from_tuple)
        .map(Some)
}

fn validate_child_create_path_fields(
    request: &CreateItineraryItemRequest,
    parent_path_fields: &ItineraryPathFields,
) -> Result<(), ServiceError> {
    let requested = ItineraryPathFields {
        path_group_id: request.path_group_id.clone(),
        path_id: request.path_id.clone(),
        path_name: request.path_name.clone(),
        path_role: request.path_role.clone(),
    };
    if requested.path_group_id.is_none()
        && requested.path_id.is_none()
        && requested.path_name.is_none()
        && requested.path_role.is_none()
    {
        return Ok(());
    }
    if requested == *parent_path_fields {
        return Ok(());
    }
    Err(ServiceError::InvalidRequest(
        "sub-activity path must match parent activity block",
    ))
}

fn validate_child_path_patch(
    existing: &crate::db::models::ItineraryItemRecord,
    patch: &ItineraryItemPatch,
    parent_path_fields: &ItineraryPathFields,
) -> Result<(), ServiceError> {
    if !patch_has_path_fields(patch) {
        return Ok(());
    }
    let requested = ItineraryPathFields::from_patch(existing, patch);
    if requested == *parent_path_fields {
        return Ok(());
    }
    Err(ServiceError::InvalidRequest(
        "sub-activity path must match parent activity block",
    ))
}

fn apply_path_fields_to_patch(patch: &mut ItineraryItemPatch, fields: &ItineraryPathFields) {
    patch.path_group_id = fields.path_group_id.clone();
    patch.path_id = fields.path_id.clone();
    patch.path_name = fields.path_name.clone();
    patch.path_role = fields.path_role.clone();
}

fn patch_has_path_fields(patch: &ItineraryItemPatch) -> bool {
    patch.path_group_id.is_some()
        || patch.path_id.is_some()
        || patch.path_name.is_some()
        || patch.path_role.is_some()
}

fn validate_time_window_end_offset(
    end_time: Option<&str>,
    end_offset_days: i32,
) -> Result<(), ServiceError> {
    if end_time.is_none() && end_offset_days != 0 {
        return Err(ServiceError::InvalidRequest(
            "end_offset_days must be 0 when end_time is empty",
        ));
    }

    Ok(())
}

fn validate_sub_activity_not_plan_block(
    parent_item_id: Option<Uuid>,
    is_plan_block: bool,
) -> Result<(), ServiceError> {
    if parent_item_id.is_some() && is_plan_block {
        return Err(ServiceError::InvalidRequest(
            "sub-activity cannot be an activity block",
        ));
    }

    Ok(())
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

    let (parent_plan_variant_id, parent_day, grandparent_item_id, parent_is_plan_block) =
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
    if !parent_is_plan_block {
        return Err(ServiceError::InvalidRequest(
            "sub-activity parent must be an activity block",
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
    if db::queries::itinerary_item_has_children(&mut tx, trip_id, item_id).await? {
        return Err(ServiceError::InvalidRequest(
            "activity block with sub-activities cannot be deleted",
        ));
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
