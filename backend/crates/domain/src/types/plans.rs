use serde::{Deserialize, Serialize};
use serde_json::Value;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PlanVariantSummary {
    pub id: Uuid,
    pub trip_id: Uuid,
    pub name: String,
    pub kind: String,
    pub status: String,
    pub description: String,
    pub version: i64,
}

pub type TripPlanSummary = PlanVariantSummary;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LocalizedText {
    pub en: String,
    pub th: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PlanSuggestionSummary {
    pub id: Uuid,
    pub trip_id: Uuid,
    pub plan_check_id: Uuid,
    pub severity: String,
    pub scope: String,
    pub target_item_ids: Vec<Uuid>,
    pub explanation: LocalizedText,
    pub recommended_action: LocalizedText,
    pub action_kind: Option<String>,
    pub action_payload: Value,
    pub status: String,
    pub snoozed_until: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    pub version: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PlanCheckSummary {
    pub id: Uuid,
    pub trip_id: Uuid,
    pub trip_plan_id: Option<Uuid>,
    pub created_by: Uuid,
    pub itinerary_fingerprint: String,
    pub stale: bool,
    pub status: String,
    pub language_metadata: Value,
    pub created_at: String,
    pub completed_at: Option<String>,
    pub version: i64,
    pub suggestions: Vec<PlanSuggestionSummary>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SuggestionSummary {
    pub id: Uuid,
    pub trip_id: Uuid,
    pub plan_variant_id: Uuid,
    pub proposer_id: Uuid,
    pub r#type: String,
    pub target_item_id: Option<Uuid>,
    pub proposed_patch: Value,
    pub source_version: Option<i64>,
    pub status: String,
    pub created_at: String,
}

