use sqlx::FromRow;
use time::Date;
use uuid::Uuid;

use sagittarius_domain::types::ExpenseItemSummary;

#[derive(Debug, Clone, FromRow)]
pub struct ExpenseSplitRecord {
    pub id: Uuid,
    pub paid_by: Uuid,
    pub amount_minor: i32,
    pub currency: String,
    pub exchange_rate_to_settlement_currency: f64,
    pub category: String,
    pub stored_value_transaction_type: Option<String>,
    pub settlement_allocations: serde_json::Value,
    pub splits: serde_json::Value,
}

#[derive(Debug, Clone, FromRow)]
pub struct ExpenseRecord {
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
    pub line_items: serde_json::Value,
    pub comments: serde_json::Value,
    pub settlement_allocations: serde_json::Value,
    pub paid_by: Uuid,
    pub category: String,
    pub splits: serde_json::Value,
    pub itinerary_item_id: Option<Uuid>,
    pub version: i64,
}

#[derive(Debug, Clone, FromRow)]
pub struct ExpenseReminderRecord {
    pub id: Uuid,
    pub trip_id: Uuid,
    pub trip_plan_id: Uuid,
    pub from_member_id: Uuid,
    pub to_member_id: Uuid,
    pub amount_minor: i32,
    pub last_reminded_at: String,
    pub version: i64,
}

pub struct NewExpenseReminder {
    pub id: Uuid,
    pub trip_id: Uuid,
    pub trip_plan_id: Uuid,
    pub from_member_id: Uuid,
    pub to_member_id: Uuid,
    pub amount_minor: i32,
    pub created_by: Uuid,
}

impl From<ExpenseRecord> for ExpenseItemSummary {
    fn from(record: ExpenseRecord) -> Self {
        Self {
            id: record.id,
            trip_id: record.trip_id,
            trip_plan_id: record.trip_plan_id,
            title: record.title,
            amount_minor: record.amount_minor,
            currency: record.currency,
            exchange_rate_to_settlement_currency: record.exchange_rate_to_settlement_currency,
            notes: record.notes,
            receipt_url: record.receipt_url,
            spent_on: record.spent_on,
            stored_value_card_id: record.stored_value_card_id,
            stored_value_card_name: record.stored_value_card_name,
            stored_value_transaction_type: record.stored_value_transaction_type,
            line_items: record.line_items,
            comments: record.comments,
            settlement_allocations: record.settlement_allocations,
            paid_by: record.paid_by,
            category: record.category,
            splits: record.splits,
            itinerary_item_id: record.itinerary_item_id,
            version: record.version,
        }
    }
}

pub struct NewExpense<'a> {
    pub id: Uuid,
    pub trip_id: Uuid,
    pub trip_plan_id: Option<Uuid>,
    pub title: &'a str,
    pub amount_minor: i32,
    pub currency: &'a str,
    pub exchange_rate_to_settlement_currency: f64,
    pub notes: &'a str,
    pub receipt_url: Option<&'a str>,
    pub spent_on: Date,
    pub stored_value_card_id: Option<&'a str>,
    pub stored_value_card_name: Option<&'a str>,
    pub stored_value_transaction_type: Option<&'a str>,
    pub line_items: serde_json::Value,
    pub comments: serde_json::Value,
    pub settlement_allocations: serde_json::Value,
    pub paid_by: Uuid,
    pub category: &'a str,
    pub splits: serde_json::Value,
    pub itinerary_item_id: Option<Uuid>,
}

