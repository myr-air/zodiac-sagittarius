use time::Date;
use uuid::Uuid;

use crate::db::PgPool;
use crate::db::models::{NewPhotoAlbumLink, PhotoAlbumLinkRecord};
use crate::domain::uuid_values::unique_uuids;

pub async fn list_photo_album_links(
    pool: &PgPool,
    trip_id: Uuid,
) -> Result<Vec<PhotoAlbumLinkRecord>, sqlx::Error> {
    sqlx::query_as::<_, PhotoAlbumLinkRecord>(
        "select
           id, trip_id, title, provider, url, access, owner_member_id, day, description,
           access_note, cover_url, created_by, created_at, updated_at, version
         from photo_album_links
         where trip_id = $1 and deleted_at is null
         order by day nulls last, created_at",
    )
    .bind(trip_id)
    .fetch_all(pool)
    .await
}

pub async fn list_photo_album_itinerary_relation_ids(
    pool: &PgPool,
    trip_id: Uuid,
    album_ids: &[Uuid],
) -> Result<Vec<(Uuid, Uuid)>, sqlx::Error> {
    if album_ids.is_empty() {
        return Ok(Vec::new());
    }

    sqlx::query_as::<_, (Uuid, Uuid)>(
        "select photo_album_link_id, itinerary_item_id
         from photo_album_link_itinerary_items
         where trip_id = $1 and photo_album_link_id = any($2)
         order by photo_album_link_id, itinerary_item_id",
    )
    .bind(trip_id)
    .bind(album_ids)
    .fetch_all(pool)
    .await
}

pub async fn lock_photo_album_link(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    album_id: Uuid,
) -> Result<Option<PhotoAlbumLinkRecord>, sqlx::Error> {
    sqlx::query_as::<_, PhotoAlbumLinkRecord>(
        "select
           id, trip_id, title, provider, url, access, owner_member_id, day, description,
           access_note, cover_url, created_by, created_at, updated_at, version
         from photo_album_links
         where id = $1 and deleted_at is null
         for update",
    )
    .bind(album_id)
    .fetch_optional(&mut **tx)
    .await
}

pub async fn insert_photo_album_link(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    album: NewPhotoAlbumLink<'_>,
) -> Result<PhotoAlbumLinkRecord, sqlx::Error> {
    sqlx::query_as::<_, PhotoAlbumLinkRecord>(
        "insert into photo_album_links (
           id, trip_id, title, provider, url, access, owner_member_id, day, description,
           access_note, cover_url, created_by, version
         )
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 1)
         returning
           id, trip_id, title, provider, url, access, owner_member_id, day, description,
           access_note, cover_url, created_by, created_at, updated_at, version",
    )
    .bind(album.id)
    .bind(album.trip_id)
    .bind(album.title)
    .bind(album.provider)
    .bind(album.url)
    .bind(album.access)
    .bind(album.owner_member_id)
    .bind(album.day)
    .bind(album.description)
    .bind(album.access_note)
    .bind(album.cover_url)
    .bind(album.created_by)
    .fetch_one(&mut **tx)
    .await
}

pub async fn update_photo_album_link(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    album_id: Uuid,
    patch: &crate::domain::patches::PatchPhotoAlbumLinkRequest,
    next_version: i64,
) -> Result<Option<PhotoAlbumLinkRecord>, sqlx::Error> {
    let patch = &patch.patch;
    sqlx::query_as::<_, PhotoAlbumLinkRecord>(
        "update photo_album_links
         set title = coalesce($2, title),
             provider = coalesce($3, provider),
             url = coalesce($4, url),
             access = coalesce($5, access),
             owner_member_id = case when $6 then $7 else owner_member_id end,
             day = case when $8 then $9 else day end,
             description = case when $10 then $11 else description end,
             access_note = case when $12 then $13 else access_note end,
             cover_url = case when $14 then $15 else cover_url end,
             version = $16,
             updated_at = now()
         where id = $1 and deleted_at is null
         returning
           id, trip_id, title, provider, url, access, owner_member_id, day, description,
           access_note, cover_url, created_by, created_at, updated_at, version",
    )
    .bind(album_id)
    .bind(patch.title.as_deref())
    .bind(patch.provider.as_deref())
    .bind(patch.url.as_deref())
    .bind(patch.access.as_deref())
    .bind(patch.owner_member_id.is_some())
    .bind(patch.owner_member_id.unwrap_or(None))
    .bind(patch.day.is_some())
    .bind(
        patch
            .day
            .as_ref()
            .and_then(|value| value.as_ref())
            .and_then(|value| parse_iso_date_for_db(value).ok()),
    )
    .bind(patch.description.is_some())
    .bind(
        patch
            .description
            .as_ref()
            .and_then(|value| value.as_deref()),
    )
    .bind(patch.access_note.is_some())
    .bind(
        patch
            .access_note
            .as_ref()
            .and_then(|value| value.as_deref()),
    )
    .bind(patch.cover_url.is_some())
    .bind(patch.cover_url.as_ref().and_then(|value| value.as_deref()))
    .bind(next_version)
    .fetch_optional(&mut **tx)
    .await
}

pub async fn soft_delete_photo_album_link(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    album_id: Uuid,
    next_version: i64,
) -> Result<Option<PhotoAlbumLinkRecord>, sqlx::Error> {
    sqlx::query_as::<_, PhotoAlbumLinkRecord>(
        "update photo_album_links
         set deleted_at = now(), version = $2, updated_at = now()
         where id = $1 and deleted_at is null
         returning
           id, trip_id, title, provider, url, access, owner_member_id, day, description,
           access_note, cover_url, created_by, created_at, updated_at, version",
    )
    .bind(album_id)
    .bind(next_version)
    .fetch_optional(&mut **tx)
    .await
}

pub async fn replace_photo_album_itinerary_relations(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    trip_id: Uuid,
    album_id: Uuid,
    itinerary_item_ids: &[Uuid],
) -> Result<(), sqlx::Error> {
    sqlx::query(
        "delete from photo_album_link_itinerary_items
         where trip_id = $1 and photo_album_link_id = $2",
    )
    .bind(trip_id)
    .bind(album_id)
    .execute(&mut **tx)
    .await?;

    for item_id in unique_uuids(itinerary_item_ids) {
        sqlx::query(
            "insert into photo_album_link_itinerary_items (trip_id, photo_album_link_id, itinerary_item_id)
             values ($1, $2, $3)",
        )
        .bind(trip_id)
        .bind(album_id)
        .bind(item_id)
        .execute(&mut **tx)
        .await?;
    }

    Ok(())
}

fn parse_iso_date_for_db(value: &str) -> Result<Date, time::error::ComponentRange> {
    let mut parts = value.trim().split('-');
    let (Some(year), Some(month), Some(day), None) =
        (parts.next(), parts.next(), parts.next(), parts.next())
    else {
        return Date::from_calendar_date(0, time::Month::January, 0);
    };
    let year = year.parse::<i32>().unwrap_or(0);
    let month = month
        .parse::<u8>()
        .ok()
        .and_then(|value| time::Month::try_from(value).ok())
        .unwrap_or(time::Month::January);
    let day = day.parse::<u8>().unwrap_or(0);
    Date::from_calendar_date(year, month, day)
}
