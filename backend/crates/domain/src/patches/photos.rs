use serde::Deserialize;
use uuid::Uuid;

use crate::errors::ServiceError;
use crate::patch_serde::{
    deserialize_nullable_string_patch, deserialize_nullable_uuid_patch,
};
use super::shared::*;

#[cfg_attr(feature = "openapi", derive(utoipa::ToSchema))]
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreatePhotoAlbumLinkRequest {
    pub client_mutation_id: String,
    pub title: String,
    pub provider: String,
    pub url: String,
    pub access: String,
    pub owner_member_id: Option<Uuid>,
    pub related_itinerary_item_ids: Vec<Uuid>,
    pub day: Option<String>,
    pub description: Option<String>,
    pub access_note: Option<String>,
    pub cover_url: Option<String>,
}

#[cfg_attr(feature = "openapi", derive(utoipa::ToSchema))]
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PatchPhotoAlbumLinkRequest {
    pub client_mutation_id: String,
    pub expected_version: i64,
    pub patch: PhotoAlbumLinkPatch,
}

#[cfg_attr(feature = "openapi", derive(utoipa::ToSchema))]
#[derive(Debug, Clone, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PhotoAlbumLinkPatch {
    pub title: Option<String>,
    pub provider: Option<String>,
    pub url: Option<String>,
    pub access: Option<String>,
    #[serde(default, deserialize_with = "deserialize_nullable_uuid_patch")]
    pub owner_member_id: Option<Option<Uuid>>,
    pub related_itinerary_item_ids: Option<Vec<Uuid>>,
    #[serde(default, deserialize_with = "deserialize_nullable_string_patch")]
    pub day: Option<Option<String>>,
    #[serde(default, deserialize_with = "deserialize_nullable_string_patch")]
    pub description: Option<Option<String>>,
    #[serde(default, deserialize_with = "deserialize_nullable_string_patch")]
    pub access_note: Option<Option<String>>,
    #[serde(default, deserialize_with = "deserialize_nullable_string_patch")]
    pub cover_url: Option<Option<String>>,
}

impl CreatePhotoAlbumLinkRequest {
    pub fn validate(&self) -> Result<(), ServiceError> {
        validate_client_mutation_id(&self.client_mutation_id)?;
        validate_photo_album_title(&self.title)?;
        validate_photo_album_provider(&self.provider)?;
        validate_photo_album_url(&self.url)?;
        validate_photo_album_access(&self.access)?;
        if let Some(day) = &self.day {
            validate_iso_date(day, "day is invalid")?;
        }
        if let Some(cover_url) = &self.cover_url {
            validate_photo_album_url(cover_url)?;
        }
        Ok(())
    }
}

impl PatchPhotoAlbumLinkRequest {
    pub fn validate(&self) -> Result<(), ServiceError> {
        validate_client_mutation_id(&self.client_mutation_id)?;
        self.patch.validate()
    }
}

impl PhotoAlbumLinkPatch {
    pub fn validate(&self) -> Result<(), ServiceError> {
        if self.is_empty() {
            return Err(ServiceError::InvalidRequest("photo album patch is empty"));
        }
        if let Some(value) = &self.title {
            validate_photo_album_title(value)?;
        }
        if let Some(value) = &self.provider {
            validate_photo_album_provider(value)?;
        }
        if let Some(value) = &self.url {
            validate_photo_album_url(value)?;
        }
        if let Some(value) = &self.access {
            validate_photo_album_access(value)?;
        }
        if let Some(Some(value)) = &self.day {
            validate_iso_date(value, "day is invalid")?;
        }
        if let Some(Some(value)) = &self.cover_url {
            validate_photo_album_url(value)?;
        }
        Ok(())
    }

    fn is_empty(&self) -> bool {
        self.title.is_none()
            && self.provider.is_none()
            && self.url.is_none()
            && self.access.is_none()
            && self.owner_member_id.is_none()
            && self.related_itinerary_item_ids.is_none()
            && self.day.is_none()
            && self.description.is_none()
            && self.access_note.is_none()
            && self.cover_url.is_none()
    }
}

