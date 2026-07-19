use serde::{Deserialize, Serialize};
use serde_json::Value;
use time::Date;
use uuid::Uuid;

use super::plans::{PlanVariantSummary, TripPlanSummary};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ItineraryCoordinates {
    pub lat: f64,
    pub lng: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ItineraryItemSummary {
    pub id: Uuid,
    pub trip_id: Uuid,
    pub plan_variant_id: Uuid,
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
    pub link_label: String,
    pub map_link: String,
    pub coordinates: Option<ItineraryCoordinates>,
    pub address: Option<String>,
    pub duration_minutes: Option<i32>,
    pub transportation: String,
    pub details: Value,
    pub advisories: Value,
    pub note: String,
    pub created_by: Uuid,
    pub updated_at: String,
    pub version: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ItineraryImportTrip {
    pub id: Uuid,
    pub name: String,
    pub destination_label: String,
    pub start_date: Date,
    pub end_date: Date,
    #[serde(default)]
    pub active_plan_variant_id: Option<Uuid>,
    #[serde(default)]
    pub main_trip_plan_id: Option<Uuid>,
    #[serde(default)]
    pub plan_variants: Vec<PlanVariantSummary>,
    #[serde(default)]
    pub trip_plans: Vec<TripPlanSummary>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ItineraryImportItem {
    pub id: String,
    pub path_group_id: Option<String>,
    pub path_id: Option<String>,
    pub path_name: Option<String>,
    pub path_role: Option<String>,
    #[serde(default)]
    pub parent_item_id: Option<String>,
    #[serde(default = "default_import_item_kind")]
    pub item_kind: String,
    #[serde(default = "default_import_time_mode")]
    pub time_mode: String,
    #[serde(default)]
    pub is_plan_block: bool,
    #[serde(default = "default_import_status")]
    pub status: String,
    #[serde(default = "default_import_priority")]
    pub priority: String,
    pub day: Date,
    pub sort_order: i32,
    pub start_time: String,
    #[serde(default)]
    pub end_time: Option<String>,
    #[serde(default)]
    pub end_offset_days: i32,
    pub activity: String,
    pub activity_type: String,
    #[serde(default)]
    pub activity_subtype: Option<String>,
    pub place: String,
    #[serde(default)]
    pub link_label: String,
    pub map_link: String,
    pub coordinates: Option<ItineraryCoordinates>,
    pub address: Option<String>,
    pub duration_minutes: Option<i32>,
    pub transportation: String,
    #[serde(default = "empty_object")]
    pub details: Value,
    #[serde(default = "empty_advisories")]
    pub advisories: Value,
    pub note: String,
}

fn empty_object() -> Value {
    serde_json::json!({})
}

fn empty_advisories() -> Value {
    serde_json::json!([])
}

fn default_import_item_kind() -> String {
    "activity".to_string()
}

fn default_import_time_mode() -> String {
    "scheduled".to_string()
}

fn default_import_status() -> String {
    "idea".to_string()
}

fn default_import_priority() -> String {
    "normal".to_string()
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ItineraryImportDocument {
    pub schema: String,
    pub version: i32,
    #[serde(default)]
    pub source: String,
    pub exported_at: String,
    pub trip: ItineraryImportTrip,
    pub items: Vec<ItineraryImportItem>,
    #[serde(default = "default_import_records")]
    pub records: Value,
}

fn default_import_records() -> Value {
    serde_json::json!({
        "expenses": [],
        "bookingDocs": [],
        "stopNotes": [],
        "tasks": []
    })
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StopNoteSummary {
    pub id: Uuid,
    pub trip_id: Uuid,
    pub trip_plan_id: Option<Uuid>,
    pub item_id: Uuid,
    pub author_id: Uuid,
    pub body: String,
    pub created_at: String,
    pub updated_at: String,
    pub version: i64,
}

