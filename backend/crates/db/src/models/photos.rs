use sqlx::FromRow;
use time::{Date, OffsetDateTime};
use uuid::Uuid;

#[derive(Debug, Clone, FromRow)]
pub struct PhotoAlbumLinkRecord {
    pub id: Uuid,
    pub trip_id: Uuid,
    pub title: String,
    pub provider: String,
    pub url: String,
    pub access: String,
    pub owner_member_id: Option<Uuid>,
    pub day: Option<Date>,
    pub description: Option<String>,
    pub access_note: Option<String>,
    pub cover_url: Option<String>,
    pub created_by: Uuid,
    pub created_at: OffsetDateTime,
    pub updated_at: OffsetDateTime,
    pub version: i64,
}

pub struct NewPhotoAlbumLink<'a> {
    pub id: Uuid,
    pub trip_id: Uuid,
    pub title: &'a str,
    pub provider: &'a str,
    pub url: &'a str,
    pub access: &'a str,
    pub owner_member_id: Option<Uuid>,
    pub day: Option<Date>,
    pub description: Option<&'a str>,
    pub access_note: Option<&'a str>,
    pub cover_url: Option<&'a str>,
    pub created_by: Uuid,
}

