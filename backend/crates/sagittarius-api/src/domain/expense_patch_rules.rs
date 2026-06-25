use serde_json::Value;
use uuid::Uuid;

use crate::domain::errors::ServiceError;

pub(crate) fn validate_amount_minor(value: i32) -> Result<(), ServiceError> {
    if value < 0 {
        return Err(ServiceError::InvalidRequest(
            "amount_minor must be zero or greater",
        ));
    }

    Ok(())
}

pub(crate) fn validate_exchange_rate(value: Option<f64>) -> Result<(), ServiceError> {
    let Some(rate) = value else {
        return Ok(());
    };
    if !rate.is_finite() || rate <= 0.0 {
        return Err(ServiceError::InvalidRequest(
            "expense exchange rate must be greater than zero",
        ));
    }

    Ok(())
}

pub(crate) fn validate_expense_category(value: &str) -> Result<(), ServiceError> {
    match value {
        "food" | "transport" | "tickets" | "stay" | "shopping" | "settlement" => Ok(()),
        _ => Err(ServiceError::InvalidRequest("expense category is invalid")),
    }
}

pub(crate) fn validate_stored_value_transaction_type(
    value: Option<&str>,
) -> Result<(), ServiceError> {
    match value {
        None | Some("topup" | "spend" | "refund") => Ok(()),
        Some(_) => Err(ServiceError::InvalidRequest(
            "stored value transaction type is invalid",
        )),
    }
}

pub(crate) fn validate_stored_value_fields(
    transaction_type: Option<&str>,
    card_id: Option<&str>,
    card_name: Option<&str>,
) -> Result<(), ServiceError> {
    validate_stored_value_transaction_type(transaction_type)?;
    if transaction_type.is_none() {
        return Ok(());
    }
    let has_card_key = [card_id, card_name]
        .into_iter()
        .flatten()
        .any(|value| !value.trim().is_empty());
    if has_card_key {
        Ok(())
    } else {
        Err(ServiceError::InvalidRequest(
            "stored value card is required",
        ))
    }
}

pub(crate) fn validate_splits(value: &Value) -> Result<(), ServiceError> {
    if !value.is_object() {
        return Err(ServiceError::InvalidRequest(
            "expense splits must be an object",
        ));
    }

    Ok(())
}

pub(crate) fn validate_line_items(value: Option<&Value>) -> Result<(), ServiceError> {
    let Some(value) = value else {
        return Ok(());
    };
    if !value.is_array() {
        return Err(ServiceError::InvalidRequest(
            "expense line items must be an array",
        ));
    }

    Ok(())
}

pub(crate) fn validate_comments(value: Option<&Value>) -> Result<(), ServiceError> {
    let Some(value) = value else {
        return Ok(());
    };
    if !value.is_array() {
        return Err(ServiceError::InvalidRequest(
            "expense comments must be an array",
        ));
    }

    Ok(())
}

pub(crate) fn validate_settlement_allocations(value: Option<&Value>) -> Result<(), ServiceError> {
    let Some(value) = value else {
        return Ok(());
    };
    if !value.is_array() {
        return Err(ServiceError::InvalidRequest(
            "expense settlement allocations must be an array",
        ));
    }
    for allocation in value.as_array().expect("validated allocations array") {
        let Some(allocation) = allocation.as_object() else {
            return Err(ServiceError::InvalidRequest(
                "expense settlement allocation must be an object",
            ));
        };
        let expense_id = allocation.get("expenseId").and_then(Value::as_str);
        if expense_id
            .and_then(|value| Uuid::parse_str(value).ok())
            .is_none()
        {
            return Err(ServiceError::InvalidRequest(
                "expense settlement allocation expense is invalid",
            ));
        }
        let member_id = allocation.get("memberId").and_then(Value::as_str);
        if member_id
            .and_then(|value| Uuid::parse_str(value).ok())
            .is_none()
        {
            return Err(ServiceError::InvalidRequest(
                "expense settlement allocation member is invalid",
            ));
        }
        let amount = allocation.get("amount").and_then(Value::as_f64);
        if amount.is_none_or(|amount| !amount.is_finite() || amount <= 0.0) {
            return Err(ServiceError::InvalidRequest(
                "expense settlement allocation amount must be greater than zero",
            ));
        }
        let has_closed_snapshot = allocation.contains_key("closedAmount")
            || allocation.contains_key("closedAt")
            || allocation.contains_key("lockedCurrency")
            || allocation.contains_key("lockedExchangeRate")
            || allocation.contains_key("statementStatus");
        if has_closed_snapshot {
            for field in [
                "closedAmount",
                "closedAt",
                "lockedCurrency",
                "lockedExchangeRate",
                "statementStatus",
            ] {
                if !allocation.contains_key(field) {
                    return Err(ServiceError::InvalidRequest(
                        "expense settlement allocation closed snapshot is incomplete",
                    ));
                }
            }
        }
        if let Some(closed_amount) = allocation.get("closedAmount") {
            let closed_amount = closed_amount.as_f64();
            if closed_amount.is_none_or(|amount| !amount.is_finite() || amount <= 0.0) {
                return Err(ServiceError::InvalidRequest(
                    "expense settlement allocation closed amount must be greater than zero",
                ));
            }
        }
        if let Some(locked_exchange_rate) = allocation.get("lockedExchangeRate") {
            let locked_exchange_rate = locked_exchange_rate.as_f64();
            if locked_exchange_rate.is_none_or(|rate| !rate.is_finite() || rate <= 0.0) {
                return Err(ServiceError::InvalidRequest(
                    "expense settlement allocation locked exchange rate must be greater than zero",
                ));
            }
        }
        if let Some(locked_currency) = allocation.get("lockedCurrency") {
            if locked_currency
                .as_str()
                .is_none_or(|value| value.trim().is_empty())
            {
                return Err(ServiceError::InvalidRequest(
                    "expense settlement allocation locked currency is invalid",
                ));
            }
        }
        if let Some(closed_at) = allocation.get("closedAt") {
            if closed_at
                .as_str()
                .is_none_or(|value| value.trim().is_empty())
            {
                return Err(ServiceError::InvalidRequest(
                    "expense settlement allocation closed_at is invalid",
                ));
            }
        }
        if let Some(statement_status) = allocation.get("statementStatus") {
            if statement_status.as_str() != Some("closed") {
                return Err(ServiceError::InvalidRequest(
                    "expense settlement allocation statement status is invalid",
                ));
            }
        }
    }

    Ok(())
}

pub(crate) fn validate_expense_splits_total(
    value: &Value,
    amount_minor: i32,
) -> Result<(), ServiceError> {
    validate_splits(value)?;
    let mut total_minor = 0_i64;
    for (member_id, share) in value.as_object().expect("validated splits object") {
        if Uuid::parse_str(member_id).is_err() {
            return Err(ServiceError::InvalidRequest(
                "expense split member is invalid",
            ));
        }
        let Some(share_minor) = split_share_minor(share) else {
            return Err(ServiceError::InvalidRequest(
                "expense split amount must be numeric",
            ));
        };
        if share_minor < 0 {
            return Err(ServiceError::InvalidRequest(
                "expense split amount must be zero or greater",
            ));
        }
        total_minor += share_minor;
    }
    if total_minor != i64::from(amount_minor) {
        return Err(ServiceError::InvalidRequest(
            "expense splits must equal amount_minor",
        ));
    }

    Ok(())
}

fn split_share_minor(value: &Value) -> Option<i64> {
    value
        .as_i64()
        .or_else(|| value.as_f64().map(|number| number.round() as i64))
}
