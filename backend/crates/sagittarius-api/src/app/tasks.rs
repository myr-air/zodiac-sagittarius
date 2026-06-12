use uuid::Uuid;

use crate::app::{auth, events};
use crate::db;
use crate::db::PgPool;
use crate::db::models::NewTripTask;
use crate::domain::capabilities::can;
use crate::domain::errors::ServiceError;
use crate::domain::patches::{CreateTaskRequest, PatchTaskRequest, TaskPatch};
use crate::domain::types::{Capability, TripRole, TripTaskSummary};
use crate::realtime::{RealtimeEvent, RealtimeHub};

pub async fn create_task(
    pool: &PgPool,
    realtime: &RealtimeHub,
    trip_id: Uuid,
    session_token: &str,
    request: CreateTaskRequest,
) -> Result<TripTaskSummary, ServiceError> {
    request.validate()?;

    let token_hash = auth::hash_session_token(session_token)?;
    let mut tx = pool.begin().await?;
    let session = db::queries::find_active_member_session_in_tx(&mut tx, trip_id, &token_hash)
        .await?
        .ok_or(ServiceError::Unauthenticated)?;

    let required_capability = if request.visibility == "private" {
        Capability::CreatePrivateTask
    } else {
        Capability::CreateSharedTask
    };
    if !can(session.role, required_capability) {
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

    let assignee_id = if request.visibility == "private" {
        Some(session.member_id)
    } else {
        request.assignee_id
    };
    let trip_plan_id = resolve_task_trip_plan_id(
        &mut tx,
        session.trip_id,
        request.trip_plan_id,
        assignee_id,
        request.related_item_id,
    )
    .await?;

    let task = db::queries::insert_task(
        &mut tx,
        NewTripTask {
            id: Uuid::now_v7(),
            trip_id: session.trip_id,
            trip_plan_id,
            title: request.title.trim(),
            visibility: request.visibility.as_str(),
            kind: request.kind.as_deref(),
            created_by: session.member_id,
            assignee_id,
            related_item_id: request.related_item_id,
        },
    )
    .await?;
    let summary = TripTaskSummary::from(task);
    let event = insert_task_event(
        &mut tx,
        "task.created",
        &summary,
        Some(request.client_mutation_id.as_str()),
        Some(session.member_id),
    )
    .await?;

    tx.commit().await?;
    realtime.publish(event).await;

    Ok(summary)
}

pub async fn patch_task(
    pool: &PgPool,
    realtime: &RealtimeHub,
    trip_id: Uuid,
    task_id: Uuid,
    session_token: &str,
    request: PatchTaskRequest,
) -> Result<TripTaskSummary, ServiceError> {
    request.validate()?;

    let token_hash = auth::hash_session_token(session_token)?;
    let mut tx = pool.begin().await?;
    let existing = db::queries::lock_task(&mut tx, task_id)
        .await?
        .ok_or(ServiceError::NotFound)?;
    if existing.trip_id != trip_id {
        return Err(ServiceError::NotFound);
    }
    let session =
        db::queries::find_active_member_session_in_tx(&mut tx, existing.trip_id, &token_hash)
            .await?
            .ok_or(ServiceError::Unauthenticated)?;

    if !can_patch_task(session.role, session.member_id, &existing) {
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
        let latest = serde_json::to_value(TripTaskSummary::from(existing))
            .map_err(|_| ServiceError::InvalidRequest("latest task could not be serialized"))?;
        return Err(ServiceError::VersionConflictWithLatest(latest));
    }

    validate_patch_references(&mut tx, existing.trip_id, &existing, &request.patch).await?;

    let updated_record =
        db::queries::update_task(&mut tx, task_id, &request.patch, existing.version + 1)
            .await?
            .ok_or(ServiceError::NotFound)?;
    let updated = TripTaskSummary::from(updated_record);
    let event = insert_task_event(
        &mut tx,
        "task.updated",
        &updated,
        Some(request.client_mutation_id.as_str()),
        Some(session.member_id),
    )
    .await?;

    tx.commit().await?;
    realtime.publish(event).await;

    Ok(updated)
}

fn can_patch_task(
    role: TripRole,
    member_id: Uuid,
    task: &crate::db::models::TripTaskRecord,
) -> bool {
    match role {
        TripRole::Owner | TripRole::Organizer => true,
        TripRole::Traveler => {
            can(role, Capability::UpdateOwnPrivateTask)
                && task.visibility == "private"
                && (task.created_by == member_id || task.assignee_id == Some(member_id))
        }
        TripRole::Viewer => false,
    }
}

async fn resolve_task_trip_plan_id(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    trip_id: Uuid,
    requested_trip_plan_id: Option<Uuid>,
    assignee_id: Option<Uuid>,
    related_item_id: Option<Uuid>,
) -> Result<Option<Uuid>, ServiceError> {
    if let Some(trip_plan_id) = requested_trip_plan_id {
        if !db::queries::plan_variant_exists_for_trip(tx, trip_id, trip_plan_id).await? {
            return Err(ServiceError::NotFound);
        }
    }

    if let Some(assignee_id) = assignee_id {
        let assignee_exists = db::queries::trip_member_exists(tx, trip_id, assignee_id).await?;
        if !assignee_exists {
            return Err(ServiceError::NotFound);
        }
    }

    let related_item_trip_plan_id = if let Some(related_item_id) = related_item_id {
        Some(
            db::queries::itinerary_item_plan_variant_id_for_trip(tx, trip_id, related_item_id)
                .await?
                .ok_or(ServiceError::NotFound)?,
        )
    } else {
        None
    };
    if let (Some(requested), Some(related)) = (requested_trip_plan_id, related_item_trip_plan_id) {
        if requested != related {
            return Err(ServiceError::InvalidRequest(
                "tripPlanId must match related itinerary item plan",
            ));
        }
    }

    if requested_trip_plan_id.is_some() || related_item_trip_plan_id.is_some() {
        return Ok(requested_trip_plan_id.or(related_item_trip_plan_id));
    }

    db::queries::active_plan_variant_id_for_trip(tx, trip_id)
        .await?
        .ok_or(ServiceError::NotFound)
        .map(Some)
}

async fn validate_task_references(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    trip_id: Uuid,
    assignee_id: Option<Uuid>,
    related_item_id: Option<Uuid>,
) -> Result<(), ServiceError> {
    resolve_task_trip_plan_id(tx, trip_id, None, assignee_id, related_item_id)
        .await
        .map(|_| ())
}

async fn validate_patch_references(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    trip_id: Uuid,
    existing: &crate::db::models::TripTaskRecord,
    patch: &TaskPatch,
) -> Result<(), ServiceError> {
    let assignee_id = patch.assignee_id.unwrap_or(existing.assignee_id);
    let related_item_id = patch.related_item_id.unwrap_or(existing.related_item_id);
    validate_task_references(tx, trip_id, assignee_id, related_item_id).await?;

    let Some(item_id) = related_item_id else {
        return Ok(());
    };
    let related_item_trip_plan_id =
        db::queries::itinerary_item_plan_variant_id_for_trip(tx, trip_id, item_id)
            .await?
            .ok_or(ServiceError::NotFound)?;
    if Some(related_item_trip_plan_id) != existing.trip_plan_id {
        return Err(ServiceError::InvalidRequest(
            "relatedItemId must match task Trip Plan",
        ));
    }

    Ok(())
}

async fn insert_task_event(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    event_type: &'static str,
    task: &TripTaskSummary,
    client_mutation_id: Option<&str>,
    created_by: Option<Uuid>,
) -> Result<RealtimeEvent, ServiceError> {
    let payload = serde_json::to_value(task)
        .map_err(|_| ServiceError::InvalidRequest("event payload could not be serialized"))?;
    events::insert(
        tx,
        events::EventWrite {
            trip_id: task.trip_id,
            aggregate_type: "task",
            event_type,
            aggregate_id: task.id,
            version: task.version,
            payload,
            client_mutation_id,
            created_by,
        },
    )
    .await
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::models::TripTaskRecord;

    fn task(visibility: &str, created_by: Uuid, assignee_id: Option<Uuid>) -> TripTaskRecord {
        TripTaskRecord {
            id: Uuid::now_v7(),
            trip_id: Uuid::now_v7(),
            trip_plan_id: Some(Uuid::now_v7()),
            title: "Task".to_string(),
            status: "open".to_string(),
            visibility: visibility.to_string(),
            kind: Some("prep".to_string()),
            created_by,
            assignee_id,
            related_item_id: None,
            version: 1,
        }
    }

    #[test]
    fn task_patch_permissions_match_role_boundaries() {
        let owner = Uuid::now_v7();
        let traveler = Uuid::now_v7();
        let other = Uuid::now_v7();
        let private_owned = task("private", traveler, None);
        let private_assigned = task("private", other, Some(traveler));
        let shared = task("shared", owner, Some(traveler));

        assert!(can_patch_task(TripRole::Owner, owner, &shared));
        assert!(can_patch_task(TripRole::Organizer, owner, &shared));
        assert!(can_patch_task(TripRole::Traveler, traveler, &private_owned));
        assert!(can_patch_task(
            TripRole::Traveler,
            traveler,
            &private_assigned
        ));
        assert!(!can_patch_task(TripRole::Traveler, traveler, &shared));
        assert!(!can_patch_task(TripRole::Viewer, traveler, &private_owned));
    }
}
