use sqlx::FromRow;
use uuid::Uuid;

use sagittarius_domain::types::{LocalizedText, PlanCheckSummary, PlanSuggestionSummary, SuggestionSummary};

#[derive(Debug, Clone, FromRow)]
pub struct SuggestionRecord {
    pub id: Uuid,
    pub trip_id: Uuid,
    pub trip_plan_id: Uuid,
    pub proposer_id: Uuid,
    pub r#type: String,
    pub target_item_id: Option<Uuid>,
    pub proposed_patch: serde_json::Value,
    pub source_version: Option<i64>,
    pub status: String,
    pub created_at: String,
}

#[derive(Debug, Clone, FromRow)]
pub struct PlanCheckRecord {
    pub id: Uuid,
    pub trip_id: Uuid,
    pub trip_plan_id: Option<Uuid>,
    pub created_by: Uuid,
    pub itinerary_fingerprint: String,
    pub language_metadata: serde_json::Value,
    pub status: String,
    pub created_at: String,
    pub completed_at: Option<String>,
    pub version: i64,
}

#[derive(Debug, Clone, FromRow)]
pub struct PlanSuggestionRecord {
    pub id: Uuid,
    pub trip_id: Uuid,
    pub plan_check_id: Uuid,
    pub severity: String,
    pub scope: String,
    pub target_item_ids: Vec<Uuid>,
    pub explanation_i18n: serde_json::Value,
    pub recommended_action_i18n: serde_json::Value,
    pub action_kind: Option<String>,
    pub action_payload: serde_json::Value,
    pub status: String,
    pub snoozed_until: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    pub version: i64,
}

impl PlanSuggestionRecord {
    pub fn into_summary(self) -> PlanSuggestionSummary {
        PlanSuggestionSummary {
            id: self.id,
            trip_id: self.trip_id,
            plan_check_id: self.plan_check_id,
            severity: self.severity,
            scope: self.scope,
            target_item_ids: self.target_item_ids,
            explanation: localized_text(self.explanation_i18n),
            recommended_action: localized_text(self.recommended_action_i18n),
            action_kind: self.action_kind,
            action_payload: self.action_payload,
            status: self.status,
            snoozed_until: self.snoozed_until,
            created_at: self.created_at,
            updated_at: self.updated_at,
            version: self.version,
        }
    }
}

pub fn plan_check_summary(
    record: PlanCheckRecord,
    stale: bool,
    suggestions: Vec<PlanSuggestionSummary>,
) -> PlanCheckSummary {
    PlanCheckSummary {
        id: record.id,
        trip_id: record.trip_id,
        trip_plan_id: record.trip_plan_id,
        created_by: record.created_by,
        itinerary_fingerprint: record.itinerary_fingerprint,
        stale,
        status: record.status,
        language_metadata: record.language_metadata,
        created_at: record.created_at,
        completed_at: record.completed_at,
        version: record.version,
        suggestions,
    }
}

fn localized_text(value: serde_json::Value) -> LocalizedText {
    LocalizedText {
        en: value
            .get("en")
            .and_then(|entry| entry.as_str())
            .unwrap_or("")
            .to_string(),
        th: value
            .get("th")
            .and_then(|entry| entry.as_str())
            .unwrap_or("")
            .to_string(),
    }
}

pub struct NewPlanCheck<'a> {
    pub id: Uuid,
    pub trip_id: Uuid,
    pub trip_plan_id: Option<Uuid>,
    pub created_by: Uuid,
    pub itinerary_fingerprint: &'a str,
    pub language_metadata: &'a serde_json::Value,
}

pub struct NewPlanSuggestion<'a> {
    pub id: Uuid,
    pub trip_id: Uuid,
    pub plan_check_id: Uuid,
    pub severity: &'a str,
    pub scope: &'a str,
    pub target_item_ids: &'a [Uuid],
    pub explanation_i18n: &'a serde_json::Value,
    pub recommended_action_i18n: &'a serde_json::Value,
    pub action_kind: Option<&'a str>,
    pub action_payload: &'a serde_json::Value,
}

impl From<SuggestionRecord> for SuggestionSummary {
    fn from(record: SuggestionRecord) -> Self {
        Self {
            id: record.id,
            trip_id: record.trip_id,
            plan_variant_id: record.trip_plan_id,
            proposer_id: record.proposer_id,
            r#type: record.r#type,
            target_item_id: record.target_item_id,
            proposed_patch: record.proposed_patch,
            source_version: record.source_version,
            status: record.status,
            created_at: record.created_at,
        }
    }
}

pub struct NewSuggestion<'a> {
    pub id: Uuid,
    pub trip_id: Uuid,
    pub trip_plan_id: Uuid,
    pub proposer_id: Uuid,
    pub r#type: &'a str,
    pub target_item_id: Option<Uuid>,
    pub proposed_patch: serde_json::Value,
    pub source_version: Option<i64>,
}

