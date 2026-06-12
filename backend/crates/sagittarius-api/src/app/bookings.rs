use std::collections::BTreeMap;

use time::OffsetDateTime;
use time::format_description::well_known::Rfc3339;
use uuid::Uuid;

use crate::app::{auth, events};
use crate::db;
use crate::db::PgPool;
use crate::db::models::{BookingDocRecord, NewBookingDoc};
use crate::domain::capabilities::can;
use crate::domain::errors::ServiceError;
use crate::domain::patches::{
    BookingDocPatch, CreateBookingDocExternalLinkRequest, CreateBookingDocRequest,
    PatchBookingDocRequest,
};
use crate::domain::types::{
    BookingDocExternalLinkSummary, BookingDocSummary, Capability, TripRole,
};
use crate::realtime::{RealtimeEvent, RealtimeHub};

#[derive(Debug, Clone, Default)]
struct BookingDocRelations {
    traveler_ids: Vec<Uuid>,
    external_links: Vec<BookingDocExternalLinkSummary>,
    related_itinerary_item_ids: Vec<Uuid>,
    related_task_ids: Vec<Uuid>,
    related_expense_ids: Vec<Uuid>,
    note_ids: Vec<Uuid>,
}

pub async fn list_visible_booking_docs(
    pool: &PgPool,
    trip_id: Uuid,
    member_id: Uuid,
    role: TripRole,
) -> Result<Vec<BookingDocSummary>, ServiceError> {
    let records = db::queries::list_booking_docs(pool, trip_id).await?;
    let booking_ids = records.iter().map(|record| record.id).collect::<Vec<_>>();
    let relations = load_relation_map(pool, trip_id, &booking_ids).await?;

    Ok(records
        .into_iter()
        .filter_map(|record| {
            let relation_set = relations.get(&record.id).cloned().unwrap_or_default();
            if can_view_booking_doc(role, member_id, &record, &relation_set) {
                Some(summary_from_record(record, relation_set))
            } else {
                None
            }
        })
        .collect())
}

pub async fn create_booking_doc(
    pool: &PgPool,
    realtime: &RealtimeHub,
    trip_id: Uuid,
    session_token: &str,
    request: CreateBookingDocRequest,
) -> Result<BookingDocSummary, ServiceError> {
    request.validate()?;

    let token_hash = auth::hash_session_token(session_token)?;
    let mut tx = pool.begin().await?;
    let session = db::queries::find_active_member_session_in_tx(&mut tx, trip_id, &token_hash)
        .await?
        .ok_or(ServiceError::Unauthenticated)?;
    if !can(session.role, Capability::EditBookings) {
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

    let trip_plan_id = resolve_booking_trip_plan_id(&mut tx, trip_id, &request).await?;
    validate_create_references(&mut tx, trip_id, &request).await?;

    let booking_id = Uuid::now_v7();
    let external_link_requests = normalize_external_link_requests(&request.external_links);
    let starts_at = parse_optional_rfc3339(request.starts_at.as_deref(), "startsAt")?;
    let ends_at = parse_optional_rfc3339(request.ends_at.as_deref(), "endsAt")?;
    let record = db::queries::insert_booking_doc(
        &mut tx,
        NewBookingDoc {
            id: booking_id,
            trip_id,
            trip_plan_id,
            r#type: request.r#type.trim(),
            title: request.title.trim(),
            status: request.status.trim(),
            visibility: request.visibility.trim(),
            owner_member_id: request.owner_member_id,
            provider_name: request.provider_name.as_deref().map(str::trim),
            confirmation_code: request.confirmation_code.as_deref().map(str::trim),
            starts_at,
            ends_at,
            timezone: request.timezone.as_deref().map(str::trim),
            price_minor: request.price_amount.map(price_amount_to_minor),
            currency: request.currency.as_deref().map(str::trim),
            notes: request.notes.as_deref().map(str::trim),
            created_by: session.member_id,
        },
    )
    .await?;

    replace_relations(
        &mut tx,
        trip_id,
        booking_id,
        Some(&external_link_requests),
        Some(&request.traveler_ids),
        Some(&request.related_itinerary_item_ids),
        Some(&request.related_task_ids),
        Some(&request.related_expense_ids),
        Some(&request.note_ids),
    )
    .await?;

    let relations = BookingDocRelations {
        traveler_ids: unique_uuids(&request.traveler_ids),
        external_links: external_link_requests
            .iter()
            .map(link_summary_from_request)
            .collect(),
        related_itinerary_item_ids: unique_uuids(&request.related_itinerary_item_ids),
        related_task_ids: unique_uuids(&request.related_task_ids),
        related_expense_ids: unique_uuids(&request.related_expense_ids),
        note_ids: unique_uuids(&request.note_ids),
    };
    let booking_doc = summary_from_record(record, relations);
    let event = write_event(
        &mut tx,
        &booking_doc,
        "booking_doc.created",
        Some(request.client_mutation_id.as_str()),
        Some(session.member_id),
    )
    .await?;

    tx.commit().await?;
    realtime.publish(event).await;

    Ok(booking_doc)
}

pub async fn patch_booking_doc(
    pool: &PgPool,
    realtime: &RealtimeHub,
    trip_id: Uuid,
    booking_id: Uuid,
    session_token: &str,
    request: PatchBookingDocRequest,
) -> Result<BookingDocSummary, ServiceError> {
    request.validate()?;

    let token_hash = auth::hash_session_token(session_token)?;
    let mut tx = pool.begin().await?;
    let existing = db::queries::lock_booking_doc(&mut tx, booking_id)
        .await?
        .ok_or(ServiceError::NotFound)?;
    if existing.trip_id != trip_id {
        return Err(ServiceError::NotFound);
    }
    let session = db::queries::find_active_member_session_in_tx(&mut tx, trip_id, &token_hash)
        .await?
        .ok_or(ServiceError::Unauthenticated)?;
    if !can(session.role, Capability::EditBookings) {
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

    let existing_summary = load_booking_doc_summary(pool, &existing).await?;
    if existing.version != request.expected_version {
        let latest = serde_json::to_value(existing_summary).map_err(|_| {
            ServiceError::InvalidRequest("latest booking doc could not be serialized")
        })?;
        return Err(ServiceError::VersionConflictWithLatest(latest));
    }

    validate_patch_references(&mut tx, trip_id, &request.patch).await?;
    validate_patch_times(&request.patch)?;

    let external_link_requests = request
        .patch
        .external_links
        .as_ref()
        .map(|links| normalize_external_link_requests(links));
    let updated = db::queries::update_booking_doc(
        &mut tx,
        booking_id,
        &request,
        request.expected_version + 1,
    )
    .await?
    .ok_or(ServiceError::NotFound)?;

    replace_relations(
        &mut tx,
        trip_id,
        booking_id,
        external_link_requests.as_deref(),
        request.patch.traveler_ids.as_deref(),
        request.patch.related_itinerary_item_ids.as_deref(),
        request.patch.related_task_ids.as_deref(),
        request.patch.related_expense_ids.as_deref(),
        request.patch.note_ids.as_deref(),
    )
    .await?;

    let relations = patched_relations(&existing_summary, &request.patch, &external_link_requests);
    let booking_doc = summary_from_record(updated, relations);
    let event = write_event(
        &mut tx,
        &booking_doc,
        "booking_doc.updated",
        Some(request.client_mutation_id.as_str()),
        Some(session.member_id),
    )
    .await?;

    tx.commit().await?;
    realtime.publish(event).await;

    Ok(booking_doc)
}

pub async fn delete_booking_doc(
    pool: &PgPool,
    realtime: &RealtimeHub,
    trip_id: Uuid,
    booking_id: Uuid,
    session_token: &str,
) -> Result<BookingDocSummary, ServiceError> {
    let token_hash = auth::hash_session_token(session_token)?;
    let mut tx = pool.begin().await?;
    let existing = db::queries::lock_booking_doc(&mut tx, booking_id)
        .await?
        .ok_or(ServiceError::NotFound)?;
    if existing.trip_id != trip_id {
        return Err(ServiceError::NotFound);
    }
    let session = db::queries::find_active_member_session_in_tx(&mut tx, trip_id, &token_hash)
        .await?
        .ok_or(ServiceError::Unauthenticated)?;
    if !can(session.role, Capability::EditBookings) {
        return Err(ServiceError::Forbidden);
    }

    let existing_summary = load_booking_doc_summary(pool, &existing).await?;
    let deleted = db::queries::soft_delete_booking_doc(&mut tx, booking_id, existing.version + 1)
        .await?
        .ok_or(ServiceError::NotFound)?;
    let booking_doc = summary_from_record(
        deleted,
        BookingDocRelations {
            traveler_ids: existing_summary.traveler_ids,
            external_links: existing_summary.external_links,
            related_itinerary_item_ids: existing_summary.related_itinerary_item_ids,
            related_task_ids: existing_summary.related_task_ids,
            related_expense_ids: existing_summary.related_expense_ids,
            note_ids: existing_summary.note_ids,
        },
    );
    let event = write_event(
        &mut tx,
        &booking_doc,
        "booking_doc.deleted",
        None,
        Some(session.member_id),
    )
    .await?;

    tx.commit().await?;
    realtime.publish(event).await;

    Ok(booking_doc)
}

async fn load_booking_doc_summary(
    pool: &PgPool,
    record: &BookingDocRecord,
) -> Result<BookingDocSummary, ServiceError> {
    let booking_ids = [record.id];
    let relations = load_relation_map(pool, record.trip_id, &booking_ids).await?;
    Ok(summary_from_record(
        record.clone(),
        relations.get(&record.id).cloned().unwrap_or_default(),
    ))
}

async fn load_relation_map(
    pool: &PgPool,
    trip_id: Uuid,
    booking_ids: &[Uuid],
) -> Result<BTreeMap<Uuid, BookingDocRelations>, ServiceError> {
    let (link_records, traveler_pairs, itinerary_pairs, task_pairs, expense_pairs, note_pairs) = tokio::try_join!(
        db::queries::list_booking_doc_links(pool, trip_id, booking_ids),
        db::queries::list_booking_doc_relation_ids(pool, trip_id, "travelers", booking_ids),
        db::queries::list_booking_doc_relation_ids(pool, trip_id, "itinerary_items", booking_ids),
        db::queries::list_booking_doc_relation_ids(pool, trip_id, "tasks", booking_ids),
        db::queries::list_booking_doc_relation_ids(pool, trip_id, "expenses", booking_ids),
        db::queries::list_booking_doc_relation_ids(pool, trip_id, "stop_notes", booking_ids),
    )?;

    let mut map = BTreeMap::<Uuid, BookingDocRelations>::new();
    for booking_id in booking_ids {
        map.entry(*booking_id).or_default();
    }
    for link in link_records {
        map.entry(link.booking_doc_id)
            .or_default()
            .external_links
            .push(BookingDocExternalLinkSummary {
                id: link.id,
                label: link.label,
                url: link.url,
                provider: link.provider,
                access_note: link.access_note,
            });
    }
    push_relation_pairs(&mut map, traveler_pairs, |relations| {
        &mut relations.traveler_ids
    });
    push_relation_pairs(&mut map, itinerary_pairs, |relations| {
        &mut relations.related_itinerary_item_ids
    });
    push_relation_pairs(&mut map, task_pairs, |relations| {
        &mut relations.related_task_ids
    });
    push_relation_pairs(&mut map, expense_pairs, |relations| {
        &mut relations.related_expense_ids
    });
    push_relation_pairs(&mut map, note_pairs, |relations| &mut relations.note_ids);

    Ok(map)
}

fn push_relation_pairs(
    map: &mut BTreeMap<Uuid, BookingDocRelations>,
    pairs: Vec<(Uuid, Uuid)>,
    select: fn(&mut BookingDocRelations) -> &mut Vec<Uuid>,
) {
    for (booking_id, related_id) in pairs {
        select(map.entry(booking_id).or_default()).push(related_id);
    }
}

async fn validate_create_references(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    trip_id: Uuid,
    request: &CreateBookingDocRequest,
) -> Result<(), ServiceError> {
    validate_owner(tx, trip_id, request.owner_member_id).await?;
    validate_relations(
        tx,
        trip_id,
        Some(&request.traveler_ids),
        Some(&request.related_itinerary_item_ids),
        Some(&request.related_task_ids),
        Some(&request.related_expense_ids),
        Some(&request.note_ids),
    )
    .await
}

async fn resolve_booking_trip_plan_id(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    trip_id: Uuid,
    request: &CreateBookingDocRequest,
) -> Result<Option<Uuid>, ServiceError> {
    if let Some(trip_plan_id) = request.trip_plan_id {
        if !db::queries::plan_variant_exists_for_trip(tx, trip_id, trip_plan_id).await? {
            return Err(ServiceError::NotFound);
        }
    }

    let itinerary_plan_ids =
        unique_itinerary_item_plan_ids(tx, trip_id, &request.related_itinerary_item_ids).await?;
    if let Some(requested) = request.trip_plan_id {
        if itinerary_plan_ids
            .iter()
            .any(|item_trip_plan_id| *item_trip_plan_id != requested)
        {
            return Err(ServiceError::InvalidRequest(
                "tripPlanId must match related itinerary item plans",
            ));
        }
        return Ok(Some(requested));
    }
    if let Some(derived) = itinerary_plan_ids.first() {
        return Ok(Some(*derived));
    }

    db::queries::active_plan_variant_id_for_trip(tx, trip_id)
        .await?
        .ok_or(ServiceError::NotFound)
        .map(Some)
}

async fn unique_itinerary_item_plan_ids(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    trip_id: Uuid,
    item_ids: &[Uuid],
) -> Result<Vec<Uuid>, ServiceError> {
    let mut plan_ids = Vec::new();
    for item_id in unique_uuids(item_ids) {
        let plan_id = db::queries::itinerary_item_plan_variant_id_for_trip(tx, trip_id, item_id)
            .await?
            .ok_or(ServiceError::NotFound)?;
        if !plan_ids.contains(&plan_id) {
            plan_ids.push(plan_id);
        }
    }
    if plan_ids.len() > 1 {
        return Err(ServiceError::InvalidRequest(
            "booking doc itinerary relations must belong to one trip plan",
        ));
    }
    Ok(plan_ids)
}

async fn validate_patch_references(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    trip_id: Uuid,
    patch: &BookingDocPatch,
) -> Result<(), ServiceError> {
    if let Some(owner_member_id) = patch.owner_member_id {
        validate_owner(tx, trip_id, owner_member_id).await?;
    }
    validate_relations(
        tx,
        trip_id,
        patch.traveler_ids.as_deref(),
        patch.related_itinerary_item_ids.as_deref(),
        patch.related_task_ids.as_deref(),
        patch.related_expense_ids.as_deref(),
        patch.note_ids.as_deref(),
    )
    .await
}

async fn validate_owner(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    trip_id: Uuid,
    owner_member_id: Option<Uuid>,
) -> Result<(), ServiceError> {
    if let Some(owner_member_id) = owner_member_id {
        if !db::queries::trip_member_ids_exist(tx, trip_id, &[owner_member_id]).await? {
            return Err(ServiceError::NotFound);
        }
    }

    Ok(())
}

async fn validate_relations(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    trip_id: Uuid,
    traveler_ids: Option<&[Uuid]>,
    itinerary_item_ids: Option<&[Uuid]>,
    task_ids: Option<&[Uuid]>,
    expense_ids: Option<&[Uuid]>,
    note_ids: Option<&[Uuid]>,
) -> Result<(), ServiceError> {
    if let Some(ids) = traveler_ids {
        if !db::queries::trip_member_ids_exist(tx, trip_id, ids).await? {
            return Err(ServiceError::NotFound);
        }
    }
    if let Some(ids) = itinerary_item_ids {
        if !db::queries::itinerary_item_ids_exist_for_trip(tx, trip_id, ids).await? {
            return Err(ServiceError::NotFound);
        }
    }
    if let Some(ids) = task_ids {
        if !db::queries::task_ids_exist_for_trip(tx, trip_id, ids).await? {
            return Err(ServiceError::NotFound);
        }
    }
    if let Some(ids) = expense_ids {
        if !db::queries::expense_ids_exist_for_trip(tx, trip_id, ids).await? {
            return Err(ServiceError::NotFound);
        }
    }
    if let Some(ids) = note_ids {
        if !db::queries::stop_note_ids_exist_for_trip(tx, trip_id, ids).await? {
            return Err(ServiceError::NotFound);
        }
    }

    Ok(())
}

fn validate_patch_times(patch: &BookingDocPatch) -> Result<(), ServiceError> {
    if let Some(Some(value)) = patch.starts_at.as_ref() {
        parse_optional_rfc3339(Some(value), "startsAt")?;
    }
    if let Some(Some(value)) = patch.ends_at.as_ref() {
        parse_optional_rfc3339(Some(value), "endsAt")?;
    }
    Ok(())
}

async fn replace_relations(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    trip_id: Uuid,
    booking_id: Uuid,
    external_links: Option<&[CreateBookingDocExternalLinkRequest]>,
    traveler_ids: Option<&[Uuid]>,
    itinerary_item_ids: Option<&[Uuid]>,
    task_ids: Option<&[Uuid]>,
    expense_ids: Option<&[Uuid]>,
    note_ids: Option<&[Uuid]>,
) -> Result<(), ServiceError> {
    if let Some(links) = external_links {
        db::queries::replace_booking_doc_external_links(tx, trip_id, booking_id, links).await?;
    }
    if let Some(ids) = traveler_ids {
        db::queries::replace_booking_doc_member_relations(tx, trip_id, booking_id, ids).await?;
    }
    if let Some(ids) = itinerary_item_ids {
        db::queries::replace_booking_doc_itinerary_relations(tx, trip_id, booking_id, ids).await?;
    }
    if let Some(ids) = task_ids {
        db::queries::replace_booking_doc_task_relations(tx, trip_id, booking_id, ids).await?;
    }
    if let Some(ids) = expense_ids {
        db::queries::replace_booking_doc_expense_relations(tx, trip_id, booking_id, ids).await?;
    }
    if let Some(ids) = note_ids {
        db::queries::replace_booking_doc_note_relations(tx, trip_id, booking_id, ids).await?;
    }

    Ok(())
}

fn patched_relations(
    existing: &BookingDocSummary,
    patch: &BookingDocPatch,
    external_link_requests: &Option<Vec<CreateBookingDocExternalLinkRequest>>,
) -> BookingDocRelations {
    BookingDocRelations {
        traveler_ids: patch
            .traveler_ids
            .as_ref()
            .map(|ids| unique_uuids(ids))
            .unwrap_or_else(|| existing.traveler_ids.clone()),
        external_links: external_link_requests
            .as_ref()
            .map(|links| links.iter().map(link_summary_from_request).collect())
            .unwrap_or_else(|| existing.external_links.clone()),
        related_itinerary_item_ids: patch
            .related_itinerary_item_ids
            .as_ref()
            .map(|ids| unique_uuids(ids))
            .unwrap_or_else(|| existing.related_itinerary_item_ids.clone()),
        related_task_ids: patch
            .related_task_ids
            .as_ref()
            .map(|ids| unique_uuids(ids))
            .unwrap_or_else(|| existing.related_task_ids.clone()),
        related_expense_ids: patch
            .related_expense_ids
            .as_ref()
            .map(|ids| unique_uuids(ids))
            .unwrap_or_else(|| existing.related_expense_ids.clone()),
        note_ids: patch
            .note_ids
            .as_ref()
            .map(|ids| unique_uuids(ids))
            .unwrap_or_else(|| existing.note_ids.clone()),
    }
}

fn summary_from_record(
    record: BookingDocRecord,
    relations: BookingDocRelations,
) -> BookingDocSummary {
    BookingDocSummary {
        id: record.id,
        trip_id: record.trip_id,
        trip_plan_id: record.trip_plan_id,
        r#type: record.r#type,
        title: record.title,
        status: record.status,
        visibility: record.visibility,
        owner_member_id: record.owner_member_id,
        provider_name: record.provider_name,
        confirmation_code: record.confirmation_code,
        starts_at: record.starts_at.map(format_time),
        ends_at: record.ends_at.map(format_time),
        timezone: record.timezone,
        price_amount: record.price_minor.map(|amount| amount as f64 / 100.0),
        currency: record.currency,
        traveler_ids: relations.traveler_ids,
        external_links: relations.external_links,
        related_itinerary_item_ids: relations.related_itinerary_item_ids,
        related_task_ids: relations.related_task_ids,
        related_expense_ids: relations.related_expense_ids,
        note_ids: relations.note_ids,
        notes: record.notes,
        created_by: record.created_by,
        updated_at: format_time(record.updated_at),
        version: record.version,
    }
}

fn can_view_booking_doc(
    role: TripRole,
    member_id: Uuid,
    record: &BookingDocRecord,
    relations: &BookingDocRelations,
) -> bool {
    match record.visibility.as_str() {
        "shared" => true,
        "sensitive" => {
            matches!(role, TripRole::Owner | TripRole::Organizer)
                || owns_or_participates(member_id, record, relations)
        }
        "private" => {
            matches!(role, TripRole::Owner) || owns_or_participates(member_id, record, relations)
        }
        _ => false,
    }
}

fn owns_or_participates(
    member_id: Uuid,
    record: &BookingDocRecord,
    relations: &BookingDocRelations,
) -> bool {
    record.owner_member_id == Some(member_id)
        || record.created_by == member_id
        || relations.traveler_ids.contains(&member_id)
}

fn normalize_external_link_requests(
    links: &[CreateBookingDocExternalLinkRequest],
) -> Vec<CreateBookingDocExternalLinkRequest> {
    links
        .iter()
        .cloned()
        .map(|mut link| {
            if link.id.is_none() {
                link.id = Some(Uuid::now_v7());
            }
            link
        })
        .collect()
}

fn link_summary_from_request(
    link: &CreateBookingDocExternalLinkRequest,
) -> BookingDocExternalLinkSummary {
    BookingDocExternalLinkSummary {
        id: link.id.expect("booking doc link id should be normalized"),
        label: link.label.trim().to_string(),
        url: link.url.trim().to_string(),
        provider: link.provider.as_deref().map(str::trim).map(str::to_string),
        access_note: link
            .access_note
            .as_deref()
            .map(str::trim)
            .map(str::to_string),
    }
}

fn parse_optional_rfc3339(
    value: Option<&str>,
    field_name: &'static str,
) -> Result<Option<OffsetDateTime>, ServiceError> {
    value
        .map(|value| {
            OffsetDateTime::parse(value.trim(), &Rfc3339)
                .map_err(|_| ServiceError::InvalidRequest(field_name))
        })
        .transpose()
}

fn format_time(value: OffsetDateTime) -> String {
    value
        .format(&Rfc3339)
        .unwrap_or_else(|_| value.unix_timestamp().to_string())
}

fn price_amount_to_minor(value: f64) -> i32 {
    (value * 100.0).round() as i32
}

fn unique_uuids(ids: &[Uuid]) -> Vec<Uuid> {
    let mut seen = std::collections::HashSet::new();
    ids.iter().copied().filter(|id| seen.insert(*id)).collect()
}

async fn write_event(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    booking_doc: &BookingDocSummary,
    event_type: &'static str,
    client_mutation_id: Option<&str>,
    created_by: Option<Uuid>,
) -> Result<RealtimeEvent, ServiceError> {
    let payload = serde_json::to_value(booking_doc)
        .map_err(|_| ServiceError::InvalidRequest("event payload could not be serialized"))?;
    events::insert(
        tx,
        events::EventWrite {
            trip_id: booking_doc.trip_id,
            aggregate_type: "booking_doc",
            event_type,
            aggregate_id: booking_doc.id,
            version: booking_doc.version,
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

    fn booking_record(
        visibility: &str,
        owner_member_id: Option<Uuid>,
        created_by: Uuid,
    ) -> BookingDocRecord {
        BookingDocRecord {
            id: Uuid::now_v7(),
            trip_id: Uuid::now_v7(),
            r#type: "flight".to_string(),
            title: "Flight".to_string(),
            status: "confirmed".to_string(),
            visibility: visibility.to_string(),
            owner_member_id,
            provider_name: Some("Airline".to_string()),
            confirmation_code: Some("ABC123".to_string()),
            starts_at: None,
            ends_at: None,
            timezone: Some("Asia/Bangkok".to_string()),
            price_minor: Some(12345),
            currency: Some("THB".to_string()),
            notes: Some("Check in online".to_string()),
            created_by,
            created_at: OffsetDateTime::UNIX_EPOCH,
            updated_at: OffsetDateTime::UNIX_EPOCH,
            version: 1,
        }
    }

    #[test]
    fn visibility_rules_keep_private_docs_owner_or_participant_only() {
        let owner = Uuid::now_v7();
        let organizer = Uuid::now_v7();
        let traveler = Uuid::now_v7();
        let other = Uuid::now_v7();
        let record = booking_record("private", Some(owner), organizer);
        let relations = BookingDocRelations {
            traveler_ids: vec![traveler],
            ..BookingDocRelations::default()
        };

        assert!(can_view_booking_doc(
            TripRole::Owner,
            other,
            &record,
            &relations
        ));
        assert!(can_view_booking_doc(
            TripRole::Organizer,
            organizer,
            &record,
            &relations
        ));
        assert!(can_view_booking_doc(
            TripRole::Traveler,
            traveler,
            &record,
            &relations
        ));
        assert!(!can_view_booking_doc(
            TripRole::Organizer,
            other,
            &record,
            &relations
        ));
        assert!(!can_view_booking_doc(
            TripRole::Viewer,
            other,
            &record,
            &relations
        ));
    }

    #[test]
    fn visibility_rules_allow_organizers_to_see_sensitive_docs() {
        let owner = Uuid::now_v7();
        let organizer = Uuid::now_v7();
        let record = booking_record("sensitive", Some(owner), owner);
        let relations = BookingDocRelations::default();

        assert!(can_view_booking_doc(
            TripRole::Organizer,
            organizer,
            &record,
            &relations
        ));
        assert!(!can_view_booking_doc(
            TripRole::Traveler,
            organizer,
            &record,
            &relations
        ));
    }

    #[test]
    fn unique_uuids_preserves_first_seen_order() {
        let first = Uuid::now_v7();
        let second = Uuid::now_v7();
        let third = Uuid::now_v7();

        assert_eq!(
            unique_uuids(&[first, second, first, third, second]),
            vec![first, second, third]
        );
    }

    #[test]
    fn summary_converts_minor_units_to_price_amount() {
        let created_by = Uuid::now_v7();
        let record = booking_record("shared", None, created_by);
        let summary = summary_from_record(record, BookingDocRelations::default());

        assert_eq!(summary.price_amount, Some(123.45));
        assert_eq!(summary.created_by, created_by);
        assert_eq!(summary.updated_at, "1970-01-01T00:00:00Z");
    }
}
