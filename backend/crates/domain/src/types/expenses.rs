use serde::{Deserialize, Serialize};
use serde_json::Value;
use time::Date;
use uuid::Uuid;

#[cfg_attr(feature = "openapi", derive(utoipa::ToSchema))]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SettlementSuggestion {
    pub from: Uuid,
    pub to: Uuid,
    pub amount: f64,
    pub currency: String,
    pub last_reminded_at: Option<String>,
}

#[cfg_attr(feature = "openapi", derive(utoipa::ToSchema))]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExpenseSummary {
    pub group_spend: f64,
    pub settlement_currency: String,
    pub net_by_member: std::collections::BTreeMap<Uuid, f64>,
    pub current_user_net_label: String,
    pub settlement_suggestions: Vec<SettlementSuggestion>,
}

#[cfg_attr(feature = "openapi", derive(utoipa::ToSchema))]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExpenseItemSummary {
    pub id: Uuid,
    pub trip_id: Uuid,
    pub trip_plan_id: Option<Uuid>,
    pub title: String,
    pub amount_minor: i32,
    pub currency: String,
    pub exchange_rate_to_settlement_currency: f64,
    pub notes: String,
    pub receipt_url: Option<String>,
    pub spent_on: Option<Date>,
    pub stored_value_card_id: Option<String>,
    pub stored_value_card_name: Option<String>,
    pub stored_value_transaction_type: Option<String>,
    #[cfg_attr(feature = "openapi", schema(value_type = Object))]
    pub line_items: Value,
    #[cfg_attr(feature = "openapi", schema(value_type = Object))]
    pub comments: Value,
    #[cfg_attr(feature = "openapi", schema(value_type = Object))]
    pub settlement_allocations: Value,
    pub paid_by: Uuid,
    pub category: String,
    #[cfg_attr(feature = "openapi", schema(value_type = Object))]
    pub splits: Value,
    pub itinerary_item_id: Option<Uuid>,
    pub version: i64,
}

