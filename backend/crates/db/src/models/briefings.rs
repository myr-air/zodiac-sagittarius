use sqlx::FromRow;
use time::{Date, OffsetDateTime};
use uuid::Uuid;

#[derive(Debug, Clone, FromRow)]
pub struct TripDailyBriefingRecord {
    pub trip_id: Uuid,
    pub briefing_date: Date,
    pub location_key: String,
    pub location_label: String,
    pub coordinates: Option<serde_json::Value>,
    pub weather: Option<serde_json::Value>,
    pub holiday: Option<serde_json::Value>,
    pub festival: Option<serde_json::Value>,
    pub facts: Option<serde_json::Value>,
    pub outfit_advice: Option<serde_json::Value>,
    pub manual_overrides: serde_json::Value,
    pub updated_at: OffsetDateTime,
    pub version: i64,
}

