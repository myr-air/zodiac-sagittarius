use serde::{Deserialize, Serialize};
use time::Date;
use uuid::Uuid;

#[cfg_attr(feature = "openapi", derive(utoipa::ToSchema))]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BriefingCoordinates {
    pub lat: f64,
    pub lng: f64,
}

#[cfg_attr(feature = "openapi", derive(utoipa::ToSchema))]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BriefingSourceMeta {
    pub source: String,
    pub source_url: Option<String>,
    pub fetched_at: Option<String>,
    pub expires_at: Option<String>,
    pub confidence: String,
    pub unavailable_reason: Option<String>,
}

#[cfg_attr(feature = "openapi", derive(utoipa::ToSchema))]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WeatherBriefingBlock {
    pub condition_code: String,
    pub condition_label: String,
    pub temperature_max_celsius: Option<f64>,
    pub temperature_min_celsius: Option<f64>,
    pub apparent_temperature_max_celsius: Option<f64>,
    pub apparent_temperature_min_celsius: Option<f64>,
    pub sunrise: Option<String>,
    pub sunset: Option<String>,
    pub daylight_duration_seconds: Option<f64>,
    pub sunshine_duration_seconds: Option<f64>,
    pub uv_index_max: Option<f64>,
    pub precipitation_sum_mm: Option<f64>,
    pub precipitation_hours: Option<f64>,
    pub rain_sum_mm: Option<f64>,
    pub humidity_percent: Option<i32>,
    pub wind_speed_kph: Option<f64>,
    pub wind_gusts_kph: Option<f64>,
    pub wind_direction_degrees: Option<i32>,
    pub cloud_cover_mean_percent: Option<i32>,
    pub visibility_mean_meters: Option<f64>,
    pub visibility_min_meters: Option<f64>,
    pub dew_point_mean_celsius: Option<f64>,
    pub pressure_msl_mean_hpa: Option<f64>,
    pub rain_chance_percent: Option<i32>,
    pub meta: BriefingSourceMeta,
}

#[cfg_attr(feature = "openapi", derive(utoipa::ToSchema))]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TextBriefingBlock {
    pub title: String,
    pub body: String,
    pub meta: BriefingSourceMeta,
}

#[cfg_attr(feature = "openapi", derive(utoipa::ToSchema))]
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DailyBriefingOverrides {
    pub day_title: Option<String>,
    pub outfit_advice: Option<String>,
    pub festival_note: Option<String>,
    pub facts_note: Option<String>,
}

#[cfg_attr(feature = "openapi", derive(utoipa::ToSchema))]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TripDailyBriefing {
    pub trip_id: Uuid,
    pub date: Date,
    pub location_key: String,
    pub location_label: String,
    pub coordinates: Option<BriefingCoordinates>,
    pub weather: Option<WeatherBriefingBlock>,
    pub holiday: Option<TextBriefingBlock>,
    pub festival: Option<TextBriefingBlock>,
    pub facts: Option<TextBriefingBlock>,
    pub outfit_advice: Option<TextBriefingBlock>,
    pub manual_overrides: DailyBriefingOverrides,
    pub updated_at: String,
    pub version: i64,
}

