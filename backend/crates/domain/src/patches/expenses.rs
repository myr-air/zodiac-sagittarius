use serde::Deserialize;
use serde_json::Value;
use time::Date;
use uuid::Uuid;

use crate::errors::ServiceError;
use crate::expense_patch_rules::{
    validate_amount_minor, validate_comments, validate_exchange_rate, validate_expense_category,
    validate_line_items, validate_settlement_allocations, validate_splits,
    validate_stored_value_fields, validate_stored_value_transaction_type,
};
use crate::patch_serde::{
    deserialize_nullable_string_patch, deserialize_nullable_uuid_patch,
};
use super::shared::*;

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateExpenseRequest {
    pub client_mutation_id: String,
    pub trip_plan_id: Option<Uuid>,
    pub title: String,
    pub amount_minor: i32,
    pub currency: Option<String>,
    pub exchange_rate_to_settlement_currency: Option<f64>,
    pub notes: Option<String>,
    pub receipt_url: Option<String>,
    pub spent_on: Option<Date>,
    pub stored_value_card_id: Option<String>,
    pub stored_value_card_name: Option<String>,
    pub stored_value_transaction_type: Option<String>,
    pub line_items: Option<Value>,
    pub comments: Option<Value>,
    pub settlement_allocations: Option<Value>,
    pub paid_by: Uuid,
    pub category: String,
    pub splits: Value,
    pub itinerary_item_id: Option<Uuid>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PatchExpenseRequest {
    pub client_mutation_id: String,
    pub expected_version: i64,
    pub trip_plan_id: Option<Uuid>,
    pub title: Option<String>,
    pub amount_minor: Option<i32>,
    pub currency: Option<String>,
    pub exchange_rate_to_settlement_currency: Option<f64>,
    pub notes: Option<String>,
    pub receipt_url: Option<String>,
    pub spent_on: Option<Date>,
    #[serde(default, deserialize_with = "deserialize_nullable_string_patch")]
    pub stored_value_card_id: Option<Option<String>>,
    #[serde(default, deserialize_with = "deserialize_nullable_string_patch")]
    pub stored_value_card_name: Option<Option<String>>,
    #[serde(default, deserialize_with = "deserialize_nullable_string_patch")]
    pub stored_value_transaction_type: Option<Option<String>>,
    pub line_items: Option<Value>,
    pub comments: Option<Value>,
    pub settlement_allocations: Option<Value>,
    pub paid_by: Option<Uuid>,
    pub category: Option<String>,
    pub splits: Option<Value>,
    #[serde(default, deserialize_with = "deserialize_nullable_uuid_patch")]
    pub itinerary_item_id: Option<Option<Uuid>>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RecordExpenseReminderRequest {
    pub client_mutation_id: String,
    pub from: Uuid,
    pub to: Uuid,
    pub amount_minor: i32,
}

impl CreateExpenseRequest {
    pub fn validate(&self) -> Result<(), ServiceError> {
        validate_client_mutation_id(&self.client_mutation_id)?;
        validate_required_text(&self.title, "expense title is required")?;
        validate_amount_minor(self.amount_minor)?;
        if let Some(currency) = &self.currency {
            validate_required_text(currency, "expense currency is required")?;
        }
        if let Some(notes) = &self.notes {
            validate_sized_text(notes, "expense notes are too long")?;
        }
        if let Some(receipt_url) = &self.receipt_url {
            validate_required_text(receipt_url, "expense receipt link is required")?;
        }
        if let Some(card_name) = &self.stored_value_card_name {
            validate_sized_text(card_name, "stored value card name is too long")?;
        }
        validate_stored_value_fields(
            self.stored_value_transaction_type.as_deref(),
            self.stored_value_card_id.as_deref(),
            self.stored_value_card_name.as_deref(),
        )?;
        validate_exchange_rate(self.exchange_rate_to_settlement_currency)?;
        validate_line_items(self.line_items.as_ref())?;
        validate_comments(self.comments.as_ref())?;
        validate_settlement_allocations(self.settlement_allocations.as_ref())?;
        validate_expense_category(&self.category)?;
        validate_expense_splits_total(&self.splits, self.amount_minor)
    }
}

impl PatchExpenseRequest {
    pub fn validate(&self) -> Result<(), ServiceError> {
        validate_client_mutation_id(&self.client_mutation_id)?;
        if let Some(title) = &self.title {
            validate_required_text(title, "expense title is required")?;
        }
        if let Some(amount_minor) = self.amount_minor {
            validate_amount_minor(amount_minor)?;
        }
        if let Some(currency) = &self.currency {
            validate_required_text(currency, "expense currency is required")?;
        }
        if let Some(notes) = &self.notes {
            validate_sized_text(notes, "expense notes are too long")?;
        }
        if let Some(receipt_url) = &self.receipt_url {
            validate_required_text(receipt_url, "expense receipt link is required")?;
        }
        if let Some(Some(card_name)) = &self.stored_value_card_name {
            validate_sized_text(card_name, "stored value card name is too long")?;
        }
        validate_stored_value_transaction_type(
            self.stored_value_transaction_type
                .as_ref()
                .and_then(|value| value.as_deref()),
        )?;
        if let Some(Some(transaction_type)) = &self.stored_value_transaction_type {
            validate_stored_value_fields(
                Some(transaction_type.as_str()),
                self.stored_value_card_id
                    .as_ref()
                    .and_then(|value| value.as_deref()),
                self.stored_value_card_name
                    .as_ref()
                    .and_then(|value| value.as_deref()),
            )?;
        }
        if matches!(self.stored_value_card_id, Some(None))
            && matches!(self.stored_value_card_name, Some(None))
            && !matches!(self.stored_value_transaction_type, Some(None))
        {
            return Err(ServiceError::InvalidRequest(
                "stored value transaction type must be cleared",
            ));
        }
        validate_exchange_rate(self.exchange_rate_to_settlement_currency)?;
        validate_line_items(self.line_items.as_ref())?;
        validate_comments(self.comments.as_ref())?;
        validate_settlement_allocations(self.settlement_allocations.as_ref())?;
        if let Some(category) = &self.category {
            validate_expense_category(category)?;
        }
        if let Some(splits) = &self.splits {
            validate_splits(splits)?;
        }
        if let (Some(amount_minor), Some(splits)) = (self.amount_minor, &self.splits) {
            validate_expense_splits_total(splits, amount_minor)?;
        }
        if self.title.is_none()
            && self.trip_plan_id.is_none()
            && self.amount_minor.is_none()
            && self.currency.is_none()
            && self.exchange_rate_to_settlement_currency.is_none()
            && self.notes.is_none()
            && self.receipt_url.is_none()
            && self.spent_on.is_none()
            && self.stored_value_card_id.is_none()
            && self.stored_value_card_name.is_none()
            && self.stored_value_transaction_type.is_none()
            && self.line_items.is_none()
            && self.comments.is_none()
            && self.settlement_allocations.is_none()
            && self.paid_by.is_none()
            && self.category.is_none()
            && self.splits.is_none()
            && self.itinerary_item_id.is_none()
        {
            return Err(ServiceError::InvalidRequest("expense patch is empty"));
        }

        Ok(())
    }
}

impl RecordExpenseReminderRequest {
    pub fn validate(&self) -> Result<(), ServiceError> {
        validate_client_mutation_id(&self.client_mutation_id)?;
        if self.amount_minor <= 0 {
            return Err(ServiceError::InvalidRequest(
                "expense reminder amount_minor must be greater than zero",
            ));
        }
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::errors::ServiceError;
    use serde_json::json;
    use uuid::Uuid;

    fn invalid_message(result: Result<(), ServiceError>) -> &'static str {
        match result {
            Err(ServiceError::InvalidRequest(message)) => message,
            other => panic!("expected invalid request, got {other:?}"),
        }
    }

#[test]
    fn expense_create_rejects_splits_that_do_not_match_amount_minor() {
        let member = Uuid::now_v7();
        let valid = CreateExpenseRequest {
            client_mutation_id: "expense-create".to_string(),
            trip_plan_id: None,
            title: "Dinner".to_string(),
            amount_minor: 10_000,
            currency: Some("HKD".to_string()),
            exchange_rate_to_settlement_currency: None,
            notes: None,
            receipt_url: None,
            spent_on: None,
            stored_value_card_id: None,
            stored_value_card_name: None,
            stored_value_transaction_type: None,
            line_items: None,
            comments: None,
            settlement_allocations: None,
            paid_by: member,
            category: "food".to_string(),
            splits: json!({ member.to_string(): 10_000 }),
            itinerary_item_id: None,
        };
        assert!(valid.validate().is_ok());

        let mut mismatched = valid;
        mismatched.splits = json!({ member.to_string(): 9_999 });
        assert_eq!(
            invalid_message(mismatched.validate()),
            "expense splits must equal amount_minor"
        );
    }

#[test]
    fn expense_patch_rejects_splits_that_do_not_match_amount_minor_when_both_are_present() {
        let member = Uuid::now_v7();
        let valid = PatchExpenseRequest {
            client_mutation_id: "expense-patch".to_string(),
            expected_version: 2,
            trip_plan_id: None,
            title: None,
            amount_minor: Some(10_000),
            currency: None,
            exchange_rate_to_settlement_currency: None,
            notes: None,
            receipt_url: None,
            spent_on: None,
            stored_value_card_id: None,
            stored_value_card_name: None,
            stored_value_transaction_type: None,
            line_items: None,
            comments: None,
            settlement_allocations: None,
            paid_by: None,
            category: None,
            splits: Some(json!({ member.to_string(): 10_000 })),
            itinerary_item_id: None,
        };
        assert!(valid.validate().is_ok());

        let mut mismatched = valid;
        mismatched.splits = Some(json!({ member.to_string(): 9_999 }));
        assert_eq!(
            invalid_message(mismatched.validate()),
            "expense splits must equal amount_minor"
        );
    }

#[test]
    fn expense_create_accepts_closed_statement_allocation_snapshot() {
        let payer = Uuid::now_v7();
        let recipient = Uuid::now_v7();
        let expense = Uuid::now_v7();
        let request = CreateExpenseRequest {
            client_mutation_id: "expense-create-closed-statement".to_string(),
            trip_plan_id: None,
            title: "Beam paid Aom back".to_string(),
            amount_minor: 64_000,
            currency: Some("HKD".to_string()),
            exchange_rate_to_settlement_currency: None,
            notes: None,
            receipt_url: None,
            spent_on: None,
            stored_value_card_id: None,
            stored_value_card_name: None,
            stored_value_transaction_type: None,
            line_items: None,
            comments: None,
            settlement_allocations: Some(json!([{
                "expenseId": expense,
                "memberId": payer,
                "amount": 640.0,
                "closedAmount": 650.0,
                "closedAt": "2026-06-25T04:00:00.000Z",
                "lockedCurrency": "HKD",
                "lockedExchangeRate": 1.0,
                "statementStatus": "closed"
            }])),
            paid_by: payer,
            category: "settlement".to_string(),
            splits: json!({ recipient.to_string(): 64_000 }),
            itinerary_item_id: None,
        };

        assert!(request.validate().is_ok());
    }

#[test]
    fn expense_create_rejects_incomplete_closed_statement_snapshot() {
        let payer = Uuid::now_v7();
        let recipient = Uuid::now_v7();
        let expense = Uuid::now_v7();
        let request = CreateExpenseRequest {
            client_mutation_id: "expense-create-incomplete-closed-statement".to_string(),
            trip_plan_id: None,
            title: "Beam paid Aom back".to_string(),
            amount_minor: 64_000,
            currency: Some("HKD".to_string()),
            exchange_rate_to_settlement_currency: None,
            notes: None,
            receipt_url: None,
            spent_on: None,
            stored_value_card_id: None,
            stored_value_card_name: None,
            stored_value_transaction_type: None,
            line_items: None,
            comments: None,
            settlement_allocations: Some(json!([{
                "expenseId": expense,
                "memberId": payer,
                "amount": 640.0,
                "closedAmount": 650.0,
                "statementStatus": "closed"
            }])),
            paid_by: payer,
            category: "settlement".to_string(),
            splits: json!({ recipient.to_string(): 64_000 }),
            itinerary_item_id: None,
        };

        assert_eq!(
            invalid_message(request.validate()),
            "expense settlement allocation closed snapshot is incomplete"
        );
    }

#[test]
    fn expense_patch_deserializes_stored_value_nulls_as_explicit_clears() {
        let patch: PatchExpenseRequest = serde_json::from_value(json!({
            "clientMutationId": "expense-clear-stored-value",
            "expectedVersion": 2,
            "storedValueCardId": null,
            "storedValueCardName": null,
            "storedValueTransactionType": null
        }))
        .expect("patch payload should deserialize");

        assert_eq!(patch.stored_value_card_id, Some(None));
        assert_eq!(patch.stored_value_card_name, Some(None));
        assert_eq!(patch.stored_value_transaction_type, Some(None));
        assert!(patch.validate().is_ok());
    }

#[test]
    fn expense_requests_reject_incomplete_stored_value_shapes() {
        let member = Uuid::now_v7();
        let create = CreateExpenseRequest {
            client_mutation_id: "expense-create".to_string(),
            trip_plan_id: None,
            title: "Octopus top-up".to_string(),
            amount_minor: 10_000,
            currency: Some("HKD".to_string()),
            exchange_rate_to_settlement_currency: None,
            notes: None,
            receipt_url: None,
            spent_on: None,
            stored_value_card_id: None,
            stored_value_card_name: None,
            stored_value_transaction_type: Some("topup".to_string()),
            line_items: None,
            comments: None,
            settlement_allocations: None,
            paid_by: member,
            category: "transport".to_string(),
            splits: json!({ member.to_string(): 10_000 }),
            itinerary_item_id: None,
        };
        assert_eq!(
            invalid_message(create.validate()),
            "stored value card is required"
        );

        let patch_type_only = PatchExpenseRequest {
            client_mutation_id: "expense-patch".to_string(),
            expected_version: 2,
            trip_plan_id: None,
            title: None,
            amount_minor: None,
            currency: None,
            exchange_rate_to_settlement_currency: None,
            notes: None,
            receipt_url: None,
            spent_on: None,
            stored_value_card_id: None,
            stored_value_card_name: None,
            stored_value_transaction_type: Some(Some("topup".to_string())),
            settlement_allocations: None,
            line_items: None,
            comments: None,
            paid_by: None,
            category: None,
            splits: None,
            itinerary_item_id: None,
        };
        assert_eq!(
            invalid_message(patch_type_only.validate()),
            "stored value card is required"
        );

        let patch_clear_card_without_type = PatchExpenseRequest {
            stored_value_card_id: Some(None),
            stored_value_card_name: Some(None),
            stored_value_transaction_type: None,
            ..patch_type_only
        };
        assert_eq!(
            invalid_message(patch_clear_card_without_type.validate()),
            "stored value transaction type must be cleared"
        );
    }

#[test]
    fn expense_requests_reject_invalid_exchange_rates() {
        let member = Uuid::now_v7();
        let create = CreateExpenseRequest {
            client_mutation_id: "expense-create".to_string(),
            trip_plan_id: None,
            title: "Dinner".to_string(),
            amount_minor: 10_000,
            currency: Some("CNY".to_string()),
            exchange_rate_to_settlement_currency: Some(0.0),
            notes: None,
            receipt_url: None,
            spent_on: None,
            stored_value_card_id: None,
            stored_value_card_name: None,
            stored_value_transaction_type: None,
            line_items: None,
            comments: None,
            settlement_allocations: None,
            paid_by: member,
            category: "food".to_string(),
            splits: json!({ member.to_string(): 10_000 }),
            itinerary_item_id: None,
        };
        assert_eq!(
            invalid_message(create.validate()),
            "expense exchange rate must be greater than zero"
        );

        let patch = PatchExpenseRequest {
            client_mutation_id: "expense-patch".to_string(),
            expected_version: 2,
            trip_plan_id: None,
            title: None,
            amount_minor: None,
            currency: None,
            exchange_rate_to_settlement_currency: Some(-1.0),
            notes: None,
            receipt_url: None,
            spent_on: None,
            stored_value_card_id: None,
            stored_value_card_name: None,
            stored_value_transaction_type: None,
            line_items: None,
            comments: None,
            settlement_allocations: None,
            paid_by: None,
            category: None,
            splits: None,
            itinerary_item_id: None,
        };
        assert_eq!(
            invalid_message(patch.validate()),
            "expense exchange rate must be greater than zero"
        );
    }

}
