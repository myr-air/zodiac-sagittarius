use sqlx::FromRow;
use time::Date;
use uuid::Uuid;

use sagittarius_domain::types::{ItineraryCoordinates, ItineraryItemSummary, StopNoteSummary};

pub struct NewItineraryItem<'a> {
    pub id: Uuid,
    pub trip_id: Uuid,
    pub trip_plan_id: Uuid,
    pub path_group_id: Option<&'a str>,
    pub path_id: Option<&'a str>,
    pub path_name: Option<&'a str>,
    pub path_role: Option<&'a str>,
    pub parent_item_id: Option<Uuid>,
    pub item_kind: &'a str,
    pub time_mode: &'a str,
    pub is_plan_block: bool,
    pub status: &'a str,
    pub priority: &'a str,
    pub day: Date,
    pub sort_order: i32,
    pub start_time: Option<&'a str>,
    pub end_time: Option<&'a str>,
    pub end_offset_days: i32,
    pub activity: &'a str,
    pub activity_type: &'a str,
    pub activity_subtype: Option<&'a str>,
    pub place: &'a str,
    pub map_link: &'a str,
    pub address: Option<&'a str>,
    pub latitude: Option<f64>,
    pub longitude: Option<f64>,
    pub duration_minutes: Option<i32>,
    pub transportation: &'a str,
    pub details: &'a serde_json::Value,
    pub note: &'a str,
    pub created_by: Uuid,
}

#[derive(Debug, Clone, FromRow)]
pub struct ItineraryItemRecord {
    pub id: Uuid,
    pub trip_id: Uuid,
    pub trip_plan_id: Uuid,
    pub path_group_id: Option<String>,
    pub path_id: Option<String>,
    pub path_name: Option<String>,
    pub path_role: Option<String>,
    pub parent_item_id: Option<Uuid>,
    pub item_kind: String,
    pub time_mode: String,
    pub is_plan_block: bool,
    pub status: String,
    pub priority: String,
    pub day: Date,
    pub sort_order: i32,
    pub start_time: String,
    pub end_time: Option<String>,
    pub end_offset_days: i32,
    pub activity: String,
    pub activity_type: String,
    pub activity_subtype: Option<String>,
    pub place: String,
    pub map_link: String,
    pub address: Option<String>,
    pub latitude: Option<f64>,
    pub longitude: Option<f64>,
    pub duration_minutes: Option<i32>,
    pub transportation: String,
    pub details: serde_json::Value,
    pub note: String,
    pub created_by: Uuid,
    pub updated_at: String,
    pub version: i64,
}

impl From<ItineraryItemRecord> for ItineraryItemSummary {
    fn from(record: ItineraryItemRecord) -> Self {
        let coordinates = match (record.latitude, record.longitude) {
            (Some(lat), Some(lng)) => Some(ItineraryCoordinates { lat, lng }),
            _ => None,
        };
        let end_offset_days = if record.end_time.is_some() {
            record.end_offset_days
        } else {
            0
        };

        Self {
            id: record.id,
            trip_id: record.trip_id,
            plan_variant_id: record.trip_plan_id,
            path_group_id: record.path_group_id,
            path_id: record.path_id,
            path_name: record.path_name,
            path_role: record.path_role,
            parent_item_id: record.parent_item_id,
            item_kind: record.item_kind,
            time_mode: record.time_mode,
            is_plan_block: record.is_plan_block,
            status: record.status,
            priority: record.priority,
            day: record.day,
            sort_order: record.sort_order,
            start_time: record.start_time,
            end_time: record.end_time,
            end_offset_days,
            activity: record.activity,
            activity_type: record.activity_type,
            activity_subtype: record.activity_subtype,
            place: record.place,
            link_label: String::new(),
            map_link: record.map_link,
            coordinates,
            address: record.address,
            duration_minutes: record.duration_minutes,
            transportation: record.transportation,
            details: record.details,
            advisories: serde_json::json!([]),
            note: record.note,
            created_by: record.created_by,
            updated_at: record.updated_at,
            version: record.version,
        }
    }
}

#[derive(Debug, Clone, FromRow)]
pub struct StopNoteRecord {
    pub id: Uuid,
    pub trip_id: Uuid,
    pub trip_plan_id: Option<Uuid>,
    pub itinerary_item_id: Uuid,
    pub author_id: Uuid,
    pub body: String,
    pub created_at: String,
    pub updated_at: String,
    pub version: i64,
}

impl From<StopNoteRecord> for StopNoteSummary {
    fn from(record: StopNoteRecord) -> Self {
        Self {
            id: record.id,
            trip_id: record.trip_id,
            trip_plan_id: record.trip_plan_id,
            item_id: record.itinerary_item_id,
            author_id: record.author_id,
            body: record.body,
            created_at: record.created_at,
            updated_at: record.updated_at,
            version: record.version,
        }
    }
}

pub struct NewStopNote<'a> {
    pub id: Uuid,
    pub trip_id: Uuid,
    pub trip_plan_id: Option<Uuid>,
    pub itinerary_item_id: Uuid,
    pub author_id: Uuid,
    pub body: &'a str,
}

