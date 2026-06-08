use std::collections::BTreeMap;

use time::OffsetDateTime;
use time::format_description::well_known::Rfc3339;
use uuid::Uuid;

use crate::app::{auth, events};
use crate::db;
use crate::db::PgPool;
use crate::db::models::{NewPhotoAlbumLink, PhotoAlbumLinkRecord};
use crate::domain::capabilities::can;
use crate::domain::errors::ServiceError;
use crate::domain::patches::{
    CreatePhotoAlbumLinkRequest, PatchPhotoAlbumLinkRequest, PhotoAlbumLinkPatch,
};
use crate::domain::types::{Capability, PhotoAlbumLinkSummary};
use crate::realtime::{RealtimeEvent, RealtimeHub};

#[derive(Debug, Clone, Default)]
struct PhotoAlbumRelations {
    related_itinerary_item_ids: Vec<Uuid>,
}

pub async fn list_photo_album_links(
    pool: &PgPool,
    trip_id: Uuid,
) -> Result<Vec<PhotoAlbumLinkSummary>, ServiceError> {
    let records = db::queries::list_photo_album_links(pool, trip_id).await?;
    let album_ids = records.iter().map(|record| record.id).collect::<Vec<_>>();
    let relations = load_relation_map(pool, trip_id, &album_ids).await?;

    Ok(records
        .into_iter()
        .map(|record| {
            let album_id = record.id;
            summary_from_record(
                record,
                relations.get(&album_id).cloned().unwrap_or_default(),
            )
        })
        .collect())
}

pub async fn create_photo_album_link(
    pool: &PgPool,
    realtime: &RealtimeHub,
    trip_id: Uuid,
    session_token: &str,
    request: CreatePhotoAlbumLinkRequest,
) -> Result<PhotoAlbumLinkSummary, ServiceError> {
    request.validate()?;

    let token_hash = auth::hash_session_token(session_token)?;
    let mut tx = pool.begin().await?;
    let session = db::queries::find_active_member_session_in_tx(&mut tx, trip_id, &token_hash)
        .await?
        .ok_or(ServiceError::Unauthenticated)?;
    if !can(session.role, Capability::ManagePhotoAlbums) {
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

    validate_owner(&mut tx, trip_id, request.owner_member_id).await?;
    validate_itinerary_items(&mut tx, trip_id, &request.related_itinerary_item_ids).await?;

    let album_id = Uuid::now_v7();
    let record = db::queries::insert_photo_album_link(
        &mut tx,
        NewPhotoAlbumLink {
            id: album_id,
            trip_id,
            title: request.title.trim(),
            provider: request.provider.trim(),
            url: request.url.trim(),
            access: request.access.trim(),
            owner_member_id: request.owner_member_id,
            day: parse_optional_date(request.day.as_deref())?,
            description: optional_trimmed(request.description.as_deref()),
            access_note: optional_trimmed(request.access_note.as_deref()),
            cover_url: optional_trimmed(request.cover_url.as_deref()),
            created_by: session.member_id,
        },
    )
    .await?;

    db::queries::replace_photo_album_itinerary_relations(
        &mut tx,
        trip_id,
        album_id,
        &request.related_itinerary_item_ids,
    )
    .await?;

    let album = summary_from_record(
        record,
        PhotoAlbumRelations {
            related_itinerary_item_ids: unique_uuids(&request.related_itinerary_item_ids),
        },
    );
    let event = write_event(
        &mut tx,
        &album,
        "photo_album.created",
        Some(request.client_mutation_id.as_str()),
        Some(session.member_id),
    )
    .await?;

    tx.commit().await?;
    realtime.publish(event).await;

    Ok(album)
}

pub async fn patch_photo_album_link(
    pool: &PgPool,
    realtime: &RealtimeHub,
    trip_id: Uuid,
    album_id: Uuid,
    session_token: &str,
    request: PatchPhotoAlbumLinkRequest,
) -> Result<PhotoAlbumLinkSummary, ServiceError> {
    request.validate()?;

    let token_hash = auth::hash_session_token(session_token)?;
    let mut tx = pool.begin().await?;
    let existing = db::queries::lock_photo_album_link(&mut tx, album_id)
        .await?
        .ok_or(ServiceError::NotFound)?;
    if existing.trip_id != trip_id {
        return Err(ServiceError::NotFound);
    }
    let session = db::queries::find_active_member_session_in_tx(&mut tx, trip_id, &token_hash)
        .await?
        .ok_or(ServiceError::Unauthenticated)?;
    if !can(session.role, Capability::ManagePhotoAlbums) {
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

    let existing_summary = load_photo_album_summary(pool, &existing).await?;
    if existing.version != request.expected_version {
        let latest = serde_json::to_value(existing_summary).map_err(|_| {
            ServiceError::InvalidRequest("latest photo album could not be serialized")
        })?;
        return Err(ServiceError::VersionConflictWithLatest(latest));
    }

    validate_patch_references(&mut tx, trip_id, &request.patch).await?;
    let updated = db::queries::update_photo_album_link(
        &mut tx,
        album_id,
        &request,
        request.expected_version + 1,
    )
    .await?
    .ok_or(ServiceError::NotFound)?;

    if let Some(ids) = request.patch.related_itinerary_item_ids.as_deref() {
        db::queries::replace_photo_album_itinerary_relations(&mut tx, trip_id, album_id, ids)
            .await?;
    }

    let relations = patched_relations(&existing_summary, &request.patch);
    let album = summary_from_record(updated, relations);
    let event = write_event(
        &mut tx,
        &album,
        "photo_album.updated",
        Some(request.client_mutation_id.as_str()),
        Some(session.member_id),
    )
    .await?;

    tx.commit().await?;
    realtime.publish(event).await;

    Ok(album)
}

pub async fn delete_photo_album_link(
    pool: &PgPool,
    realtime: &RealtimeHub,
    trip_id: Uuid,
    album_id: Uuid,
    session_token: &str,
) -> Result<PhotoAlbumLinkSummary, ServiceError> {
    let token_hash = auth::hash_session_token(session_token)?;
    let mut tx = pool.begin().await?;
    let existing = db::queries::lock_photo_album_link(&mut tx, album_id)
        .await?
        .ok_or(ServiceError::NotFound)?;
    if existing.trip_id != trip_id {
        return Err(ServiceError::NotFound);
    }
    let session = db::queries::find_active_member_session_in_tx(&mut tx, trip_id, &token_hash)
        .await?
        .ok_or(ServiceError::Unauthenticated)?;
    if !can(session.role, Capability::ManagePhotoAlbums) {
        return Err(ServiceError::Forbidden);
    }

    let existing_summary = load_photo_album_summary(pool, &existing).await?;
    let deleted =
        db::queries::soft_delete_photo_album_link(&mut tx, album_id, existing.version + 1)
            .await?
            .ok_or(ServiceError::NotFound)?;
    let album = summary_from_record(
        deleted,
        PhotoAlbumRelations {
            related_itinerary_item_ids: existing_summary.related_itinerary_item_ids,
        },
    );
    let event = write_event(
        &mut tx,
        &album,
        "photo_album.deleted",
        None,
        Some(session.member_id),
    )
    .await?;

    tx.commit().await?;
    realtime.publish(event).await;

    Ok(album)
}

async fn load_photo_album_summary(
    pool: &PgPool,
    record: &PhotoAlbumLinkRecord,
) -> Result<PhotoAlbumLinkSummary, ServiceError> {
    let album_ids = [record.id];
    let relations = load_relation_map(pool, record.trip_id, &album_ids).await?;
    Ok(summary_from_record(
        record.clone(),
        relations.get(&record.id).cloned().unwrap_or_default(),
    ))
}

async fn load_relation_map(
    pool: &PgPool,
    trip_id: Uuid,
    album_ids: &[Uuid],
) -> Result<BTreeMap<Uuid, PhotoAlbumRelations>, ServiceError> {
    let pairs =
        db::queries::list_photo_album_itinerary_relation_ids(pool, trip_id, album_ids).await?;
    let mut map = BTreeMap::<Uuid, PhotoAlbumRelations>::new();
    for album_id in album_ids {
        map.entry(*album_id).or_default();
    }
    for (album_id, item_id) in pairs {
        map.entry(album_id)
            .or_default()
            .related_itinerary_item_ids
            .push(item_id);
    }
    Ok(map)
}

async fn validate_patch_references(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    trip_id: Uuid,
    patch: &PhotoAlbumLinkPatch,
) -> Result<(), ServiceError> {
    if let Some(owner_member_id) = patch.owner_member_id {
        validate_owner(tx, trip_id, owner_member_id).await?;
    }
    if let Some(ids) = patch.related_itinerary_item_ids.as_deref() {
        validate_itinerary_items(tx, trip_id, ids).await?;
    }
    Ok(())
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

async fn validate_itinerary_items(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    trip_id: Uuid,
    ids: &[Uuid],
) -> Result<(), ServiceError> {
    if !db::queries::itinerary_item_ids_exist_for_trip(tx, trip_id, ids).await? {
        return Err(ServiceError::InvalidRequest(
            "photo album itinerary item is invalid",
        ));
    }
    Ok(())
}

fn patched_relations(
    existing: &PhotoAlbumLinkSummary,
    patch: &PhotoAlbumLinkPatch,
) -> PhotoAlbumRelations {
    PhotoAlbumRelations {
        related_itinerary_item_ids: patch
            .related_itinerary_item_ids
            .as_ref()
            .map(|ids| unique_uuids(ids))
            .unwrap_or_else(|| existing.related_itinerary_item_ids.clone()),
    }
}

fn summary_from_record(
    record: PhotoAlbumLinkRecord,
    relations: PhotoAlbumRelations,
) -> PhotoAlbumLinkSummary {
    PhotoAlbumLinkSummary {
        id: record.id,
        trip_id: record.trip_id,
        title: record.title,
        provider: record.provider,
        url: record.url,
        access: record.access,
        owner_member_id: record.owner_member_id,
        related_itinerary_item_ids: relations.related_itinerary_item_ids,
        day: record.day.map(|day| day.to_string()),
        description: record.description,
        access_note: record.access_note,
        cover_url: record.cover_url,
        created_by: record.created_by,
        updated_at: format_time(record.updated_at),
        version: record.version,
    }
}

fn parse_optional_date(value: Option<&str>) -> Result<Option<time::Date>, ServiceError> {
    value
        .map(|value| {
            let mut parts = value.trim().split('-');
            let (Some(year), Some(month), Some(day), None) =
                (parts.next(), parts.next(), parts.next(), parts.next())
            else {
                return Err(ServiceError::InvalidRequest("day is invalid"));
            };
            let year = year
                .parse::<i32>()
                .map_err(|_| ServiceError::InvalidRequest("day is invalid"))?;
            let month = month
                .parse::<u8>()
                .ok()
                .and_then(|value| time::Month::try_from(value).ok())
                .ok_or(ServiceError::InvalidRequest("day is invalid"))?;
            let day = day
                .parse::<u8>()
                .map_err(|_| ServiceError::InvalidRequest("day is invalid"))?;
            time::Date::from_calendar_date(year, month, day)
                .map_err(|_| ServiceError::InvalidRequest("day is invalid"))
        })
        .transpose()
}

fn optional_trimmed(value: Option<&str>) -> Option<&str> {
    value.map(str::trim).filter(|value| !value.is_empty())
}

fn format_time(value: OffsetDateTime) -> String {
    value
        .format(&Rfc3339)
        .unwrap_or_else(|_| value.unix_timestamp().to_string())
}

fn unique_uuids(ids: &[Uuid]) -> Vec<Uuid> {
    let mut seen = std::collections::HashSet::new();
    ids.iter().copied().filter(|id| seen.insert(*id)).collect()
}

async fn write_event(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    album: &PhotoAlbumLinkSummary,
    event_type: &'static str,
    client_mutation_id: Option<&str>,
    created_by: Option<Uuid>,
) -> Result<RealtimeEvent, ServiceError> {
    let payload = serde_json::to_value(album)
        .map_err(|_| ServiceError::InvalidRequest("event payload could not be serialized"))?;
    events::insert(
        tx,
        events::EventWrite {
            trip_id: album.trip_id,
            aggregate_type: "photo_album",
            event_type,
            aggregate_id: album.id,
            version: album.version,
            payload,
            client_mutation_id,
            created_by,
        },
    )
    .await
}
