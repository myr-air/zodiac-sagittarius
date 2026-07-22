use serde::{Deserialize, Serialize};
use serde_json::Value;
use time::Date;
use uuid::Uuid;

/// Day-plan assist modes (UI: Suggest | Auto-route & fill).
#[cfg_attr(feature = "openapi", derive(utoipa::ToSchema))]
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum DayPlanAssistMode {
    Suggest,
    AutoRoute,
}

impl DayPlanAssistMode {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Suggest => "suggest",
            Self::AutoRoute => "autoRoute",
        }
    }
}

#[cfg_attr(feature = "openapi", derive(utoipa::ToSchema))]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DayPlanAssistMapPin {
    pub item_id: Uuid,
    pub lat: f64,
    pub lng: f64,
    pub label: String,
}

#[cfg_attr(feature = "openapi", derive(utoipa::ToSchema))]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DayPlanAssistContext {
    #[cfg_attr(feature = "openapi", schema(value_type = Object))]
    pub direct: Value,
    #[cfg_attr(feature = "openapi", schema(value_type = Object))]
    pub indirect: Value,
}

#[cfg_attr(feature = "openapi", derive(utoipa::ToSchema))]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DayPlanAssistRequest {
    pub client_mutation_id: String,
    pub mode: DayPlanAssistMode,
    pub day: Date,
    pub plan_variant_id: Uuid,
    pub selected_item_ids: Vec<Uuid>,
    pub selected_fields: Vec<String>,
    pub map_pins: Vec<DayPlanAssistMapPin>,
    pub context: DayPlanAssistContext,
}

#[cfg_attr(feature = "openapi", derive(utoipa::ToSchema))]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DayPlanAssistOption {
    pub id: Uuid,
    pub label: String,
    pub title: String,
    pub summary: String,
    /// Required explainability string (UI: Why).
    pub why: String,
    pub affects_item_ids: Vec<Uuid>,
    #[cfg_attr(feature = "openapi", schema(value_type = Vec<Object>))]
    pub proposed_mutations: Vec<Value>,
}

#[cfg_attr(feature = "openapi", derive(utoipa::ToSchema))]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DayPlanAssistResponse {
    pub batch_id: Uuid,
    pub trip_id: Uuid,
    pub day: Date,
    pub plan_variant_id: Uuid,
    pub mode: DayPlanAssistMode,
    pub options: Vec<DayPlanAssistOption>,
}

/// Option resolution status within a suggestion batch (Accept / Reject / still open).
#[cfg_attr(feature = "openapi", derive(utoipa::ToSchema))]
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum DayPlanAssistOptionStatus {
    Open,
    Accepted,
    Rejected,
}

impl DayPlanAssistOptionStatus {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Open => "open",
            Self::Accepted => "accepted",
            Self::Rejected => "rejected",
        }
    }
}

#[cfg_attr(feature = "openapi", derive(utoipa::ToSchema))]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DayPlanAssistResolutionRequest {
    pub client_mutation_id: String,
}

#[cfg_attr(feature = "openapi", derive(utoipa::ToSchema))]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DayPlanAssistOptionStatusRow {
    pub id: Uuid,
    pub status: DayPlanAssistOptionStatus,
}

#[cfg_attr(feature = "openapi", derive(utoipa::ToSchema))]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DayPlanAssistResolutionResponse {
    pub batch_id: Uuid,
    pub trip_id: Uuid,
    pub option_id: Uuid,
    /// `accepted` or `rejected` for the targeted option.
    pub status: DayPlanAssistOptionStatus,
    /// Full batch option statuses after the action (Accept auto-rejects siblings).
    pub options: Vec<DayPlanAssistOptionStatusRow>,
    /// Echo of mutations applied via itinerary create/patch/reorder/delete (Accept only).
    #[serde(default)]
    pub applied_mutations: Vec<Value>,
}
