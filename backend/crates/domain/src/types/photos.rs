use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PhotoAlbumLinkSummary {
    pub id: Uuid,
    pub trip_id: Uuid,
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
    pub created_by: Uuid,
    pub updated_at: String,
    pub version: i64,
}

