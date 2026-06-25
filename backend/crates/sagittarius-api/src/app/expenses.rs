use time::OffsetDateTime;
use uuid::Uuid;

use crate::app::{auth, events, mutation_guard, trips};
use crate::db;
use crate::db::PgPool;
use crate::db::models::{ExpenseReminderRecord, NewExpense, NewExpenseReminder};
use crate::domain::capabilities::can;
use crate::domain::errors::ServiceError;
use crate::domain::expense_patch_rules::validate_stored_value_fields;
use crate::domain::patches::{
    CreateExpenseRequest, PatchExpenseRequest, RecordExpenseReminderRequest,
    validate_expense_splits_total,
};
use crate::domain::types::{Capability, ExpenseItemSummary, ExpenseSummary};
use crate::realtime::RealtimeHub;

pub async fn get_expense_summary(
    pool: &PgPool,
    trip_id: Uuid,
    session_token: &str,
    trip_plan_id: Option<Uuid>,
) -> Result<ExpenseSummary, ServiceError> {
    let token_hash = auth::hash_session_token(session_token)?;
    let session = db::queries::find_active_member_session(pool, trip_id, &token_hash)
        .await?
        .ok_or(ServiceError::Unauthenticated)?;
    if !can(session.role, Capability::ViewExpenses) {
        return Err(ServiceError::Forbidden);
    }
    validate_expense_summary_trip_plan_id(pool, trip_id, trip_plan_id).await?;

    let (splits, reminders) = tokio::try_join!(
        db::expense_queries::list_expense_splits(pool, trip_id, trip_plan_id),
        db::expense_queries::list_expense_reminders(pool, trip_id, trip_plan_id),
    )?;
    Ok(trips::build_expense_summary(
        splits,
        session.member_id,
        reminders,
    ))
}

pub async fn create_expense(
    pool: &PgPool,
    realtime: &RealtimeHub,
    trip_id: Uuid,
    session_token: &str,
    request: CreateExpenseRequest,
) -> Result<ExpenseItemSummary, ServiceError> {
    request.validate()?;

    let token_hash = auth::hash_session_token(session_token)?;
    let mut tx = pool.begin().await?;
    let session = db::queries::find_active_member_session_in_tx(&mut tx, trip_id, &token_hash)
        .await?
        .ok_or(ServiceError::Unauthenticated)?;
    if !can(session.role, Capability::EditExpenses) {
        return Err(ServiceError::Forbidden);
    }
    mutation_guard::reject_duplicate_mutation(
        &mut tx,
        trip_id,
        session.member_id,
        &request.client_mutation_id,
    )
    .await?;
    let trip_plan_id = resolve_expense_trip_plan_id(
        &mut tx,
        trip_id,
        request.trip_plan_id,
        request.paid_by,
        request.itinerary_item_id,
    )
    .await?;
    validate_settlement_allocations(
        &mut tx,
        trip_id,
        &request.category,
        request.amount_minor,
        request.exchange_rate_to_settlement_currency.unwrap_or(1.0),
        request.settlement_allocations.as_ref(),
    )
    .await?;

    let record = db::expense_queries::insert_expense(
        &mut tx,
        NewExpense {
            id: Uuid::now_v7(),
            trip_id,
            trip_plan_id,
            title: request.title.trim(),
            amount_minor: request.amount_minor,
            currency: request.currency.as_deref().unwrap_or("HKD").trim(),
            exchange_rate_to_settlement_currency: request
                .exchange_rate_to_settlement_currency
                .unwrap_or(1.0),
            notes: request.notes.as_deref().unwrap_or("").trim(),
            receipt_url: request.receipt_url.as_deref().map(str::trim),
            spent_on: request
                .spent_on
                .unwrap_or_else(|| OffsetDateTime::now_utc().date()),
            stored_value_card_id: request.stored_value_card_id.as_deref().map(str::trim),
            stored_value_card_name: request.stored_value_card_name.as_deref().map(str::trim),
            stored_value_transaction_type: request.stored_value_transaction_type.as_deref(),
            line_items: request.line_items.unwrap_or_else(|| serde_json::json!([])),
            comments: request.comments.unwrap_or_else(|| serde_json::json!([])),
            settlement_allocations: request
                .settlement_allocations
                .unwrap_or_else(|| serde_json::json!([])),
            paid_by: request.paid_by,
            category: request.category.as_str(),
            splits: request.splits,
            itinerary_item_id: request.itinerary_item_id,
        },
    )
    .await?;
    let expense = ExpenseItemSummary::from(record);
    let event = write_event(
        &mut tx,
        &expense,
        "expense.created",
        Some(request.client_mutation_id.as_str()),
        Some(session.member_id),
    )
    .await?;

    tx.commit().await?;
    realtime.publish(event).await;

    Ok(expense)
}

pub async fn record_expense_reminder(
    pool: &PgPool,
    realtime: &RealtimeHub,
    trip_id: Uuid,
    session_token: &str,
    trip_plan_id: Option<Uuid>,
    request: RecordExpenseReminderRequest,
) -> Result<ExpenseSummary, ServiceError> {
    request.validate()?;

    let token_hash = auth::hash_session_token(session_token)?;
    let mut tx = pool.begin().await?;
    let session = db::queries::find_active_member_session_in_tx(&mut tx, trip_id, &token_hash)
        .await?
        .ok_or(ServiceError::Unauthenticated)?;
    if !can(session.role, Capability::ViewExpenses) {
        return Err(ServiceError::Forbidden);
    }
    mutation_guard::reject_duplicate_mutation(
        &mut tx,
        trip_id,
        session.member_id,
        &request.client_mutation_id,
    )
    .await?;
    if !db::queries::trip_member_exists(&mut tx, trip_id, request.from).await?
        || !db::queries::trip_member_exists(&mut tx, trip_id, request.to).await?
    {
        return Err(ServiceError::NotFound);
    }
    let reminder_trip_plan_id =
        resolve_expense_reminder_trip_plan_id(&mut tx, trip_id, trip_plan_id).await?;

    let reminder = db::expense_queries::upsert_expense_reminder(
        &mut tx,
        NewExpenseReminder {
            id: Uuid::now_v7(),
            trip_id,
            trip_plan_id: reminder_trip_plan_id,
            from_member_id: request.from,
            to_member_id: request.to,
            amount_minor: request.amount_minor,
            created_by: session.member_id,
        },
    )
    .await?;
    let event = write_reminder_event(
        &mut tx,
        &reminder,
        Some(request.client_mutation_id.as_str()),
        session.member_id,
    )
    .await?;

    tx.commit().await?;
    realtime.publish(event).await;

    get_expense_summary(pool, trip_id, session_token, trip_plan_id).await
}

pub async fn patch_expense(
    pool: &PgPool,
    realtime: &RealtimeHub,
    trip_id: Uuid,
    expense_id: Uuid,
    session_token: &str,
    request: PatchExpenseRequest,
) -> Result<ExpenseItemSummary, ServiceError> {
    request.validate()?;

    let token_hash = auth::hash_session_token(session_token)?;
    let mut tx = pool.begin().await?;
    let existing = db::expense_queries::lock_expense(&mut tx, expense_id)
        .await?
        .ok_or(ServiceError::NotFound)?;
    if existing.trip_id != trip_id {
        return Err(ServiceError::NotFound);
    }
    let session = db::queries::find_active_member_session_in_tx(&mut tx, trip_id, &token_hash)
        .await?
        .ok_or(ServiceError::Unauthenticated)?;
    if !can(session.role, Capability::EditExpenses) {
        return Err(ServiceError::Forbidden);
    }
    mutation_guard::reject_duplicate_mutation(
        &mut tx,
        trip_id,
        session.member_id,
        &request.client_mutation_id,
    )
    .await?;
    if existing.version != request.expected_version {
        return Err(mutation_guard::version_conflict_with_latest(
            ExpenseItemSummary::from(existing),
            "latest expense could not be serialized",
        ));
    }
    let next_itinerary_item_id = request
        .itinerary_item_id
        .unwrap_or(existing.itinerary_item_id);
    validate_expense_links(
        &mut tx,
        trip_id,
        request.paid_by.unwrap_or(existing.paid_by),
        next_itinerary_item_id,
    )
    .await?;
    let next_trip_plan_id = resolve_expense_patch_trip_plan_id(
        &mut tx,
        trip_id,
        request.trip_plan_id,
        existing.trip_plan_id,
        next_itinerary_item_id,
    )
    .await?;
    validate_expense_splits_total(
        request.splits.as_ref().unwrap_or(&existing.splits),
        request.amount_minor.unwrap_or(existing.amount_minor),
    )?;
    validate_stored_value_fields(
        patch_string_field(
            &request.stored_value_transaction_type,
            &existing.stored_value_transaction_type,
        ),
        patch_string_field(
            &request.stored_value_card_id,
            &existing.stored_value_card_id,
        ),
        patch_string_field(
            &request.stored_value_card_name,
            &existing.stored_value_card_name,
        ),
    )?;
    validate_settlement_allocations(
        &mut tx,
        trip_id,
        request.category.as_deref().unwrap_or(&existing.category),
        request.amount_minor.unwrap_or(existing.amount_minor),
        request
            .exchange_rate_to_settlement_currency
            .unwrap_or(existing.exchange_rate_to_settlement_currency),
        request
            .settlement_allocations
            .as_ref()
            .or(Some(&existing.settlement_allocations)),
    )
    .await?;

    let updated = db::expense_queries::update_expense(
        &mut tx,
        expense_id,
        &request,
        next_trip_plan_id,
        request.expected_version + 1,
    )
    .await?
    .ok_or(ServiceError::NotFound)?;
    let expense = ExpenseItemSummary::from(updated);
    let event = write_event(
        &mut tx,
        &expense,
        "expense.updated",
        Some(request.client_mutation_id.as_str()),
        Some(session.member_id),
    )
    .await?;

    tx.commit().await?;
    realtime.publish(event).await;

    Ok(expense)
}

fn patch_string_field<'a>(
    patch: &'a Option<Option<String>>,
    existing: &'a Option<String>,
) -> Option<&'a str> {
    match patch {
        Some(Some(value)) => Some(value.as_str()),
        Some(None) => None,
        None => existing.as_deref(),
    }
}

pub async fn delete_expense(
    pool: &PgPool,
    realtime: &RealtimeHub,
    trip_id: Uuid,
    expense_id: Uuid,
    session_token: &str,
) -> Result<ExpenseItemSummary, ServiceError> {
    let token_hash = auth::hash_session_token(session_token)?;
    let mut tx = pool.begin().await?;
    let existing = db::expense_queries::lock_expense(&mut tx, expense_id)
        .await?
        .ok_or(ServiceError::NotFound)?;
    if existing.trip_id != trip_id {
        return Err(ServiceError::NotFound);
    }
    let session = db::queries::find_active_member_session_in_tx(&mut tx, trip_id, &token_hash)
        .await?
        .ok_or(ServiceError::Unauthenticated)?;
    if !can(session.role, Capability::EditExpenses) {
        return Err(ServiceError::Forbidden);
    }

    let deleted = db::expense_queries::delete_expense(&mut tx, expense_id, existing.version + 1)
        .await?
        .ok_or(ServiceError::NotFound)?;
    let expense = ExpenseItemSummary::from(deleted);
    let event = write_event(
        &mut tx,
        &expense,
        "expense.deleted",
        None,
        Some(session.member_id),
    )
    .await?;

    tx.commit().await?;
    realtime.publish(event).await;

    Ok(expense)
}

async fn validate_expense_summary_trip_plan_id(
    pool: &PgPool,
    trip_id: Uuid,
    requested_trip_plan_id: Option<Uuid>,
) -> Result<(), ServiceError> {
    let Some(trip_plan_id) = requested_trip_plan_id else {
        return Ok(());
    };
    let mut tx = pool.begin().await?;
    if !db::queries::plan_variant_exists_for_trip(&mut tx, trip_id, trip_plan_id).await? {
        return Err(ServiceError::InvalidRequest(
            "tripPlanId must belong to the trip",
        ));
    }
    tx.commit().await?;
    Ok(())
}

async fn resolve_expense_reminder_trip_plan_id(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    trip_id: Uuid,
    requested_trip_plan_id: Option<Uuid>,
) -> Result<Uuid, ServiceError> {
    if let Some(trip_plan_id) = requested_trip_plan_id {
        if !db::queries::plan_variant_exists_for_trip(tx, trip_id, trip_plan_id).await? {
            return Err(ServiceError::InvalidRequest(
                "tripPlanId must belong to the trip",
            ));
        }
        return Ok(trip_plan_id);
    }

    db::queries::active_plan_variant_id_for_trip(tx, trip_id)
        .await?
        .ok_or(ServiceError::NotFound)
}

async fn validate_expense_links(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    trip_id: Uuid,
    paid_by: Uuid,
    itinerary_item_id: Option<Uuid>,
) -> Result<(), ServiceError> {
    if !db::queries::trip_member_exists(tx, trip_id, paid_by).await? {
        return Err(ServiceError::NotFound);
    }
    if let Some(item_id) = itinerary_item_id {
        if !db::queries::itinerary_item_exists_for_trip(tx, trip_id, item_id).await? {
            return Err(ServiceError::NotFound);
        }
    }

    Ok(())
}

async fn validate_settlement_allocations(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    trip_id: Uuid,
    category: &str,
    amount_minor: i32,
    exchange_rate_to_settlement_currency: f64,
    allocations: Option<&serde_json::Value>,
) -> Result<(), ServiceError> {
    let Some(allocations) = allocations else {
        return Ok(());
    };
    let Some(allocation_rows) = allocations.as_array() else {
        return Ok(());
    };
    if allocation_rows.is_empty() {
        return Ok(());
    }
    if category != "settlement" {
        return Err(ServiceError::InvalidRequest(
            "settlement allocations are only valid for settlement expenses",
        ));
    }

    let mut expense_ids = Vec::new();
    let mut member_ids = Vec::new();
    let mut total_allocated = 0.0_f64;
    for allocation in allocation_rows {
        let Some(allocation) = allocation.as_object() else {
            continue;
        };
        if let Some(expense_id) = allocation
            .get("expenseId")
            .and_then(serde_json::Value::as_str)
            .and_then(|value| Uuid::parse_str(value).ok())
        {
            expense_ids.push(expense_id);
        }
        if let Some(member_id) = allocation
            .get("memberId")
            .and_then(serde_json::Value::as_str)
            .and_then(|value| Uuid::parse_str(value).ok())
        {
            member_ids.push(member_id);
        }
        total_allocated += allocation
            .get("amount")
            .and_then(serde_json::Value::as_f64)
            .unwrap_or(0.0);
    }

    if !db::expense_queries::expense_ids_exist_for_trip(tx, trip_id, &expense_ids).await? {
        return Err(ServiceError::NotFound);
    }
    for member_id in member_ids {
        if !db::queries::trip_member_exists(tx, trip_id, member_id).await? {
            return Err(ServiceError::NotFound);
        }
    }

    let settlement_total = (f64::from(amount_minor) / 100.0) * exchange_rate_to_settlement_currency;
    if total_allocated > settlement_total + 0.01 {
        return Err(ServiceError::InvalidRequest(
            "settlement allocations must not exceed settlement amount",
        ));
    }

    Ok(())
}

async fn resolve_expense_patch_trip_plan_id(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    trip_id: Uuid,
    requested_trip_plan_id: Option<Uuid>,
    expense_trip_plan_id: Option<Uuid>,
    itinerary_item_id: Option<Uuid>,
) -> Result<Option<Uuid>, ServiceError> {
    if let Some(trip_plan_id) = requested_trip_plan_id {
        if !db::queries::plan_variant_exists_for_trip(tx, trip_id, trip_plan_id).await? {
            return Err(ServiceError::NotFound);
        }
    }

    let item_trip_plan_id = if let Some(item_id) = itinerary_item_id {
        Some(
            db::queries::itinerary_item_plan_variant_id_for_trip(tx, trip_id, item_id)
                .await?
                .ok_or(ServiceError::NotFound)?,
        )
    } else {
        None
    };
    if let (Some(requested), Some(item_plan)) = (requested_trip_plan_id, item_trip_plan_id) {
        if requested != item_plan {
            return Err(ServiceError::InvalidRequest(
                "tripPlanId must match itinerary item plan",
            ));
        }
    }
    if requested_trip_plan_id.is_some() || item_trip_plan_id.is_some() {
        return Ok(requested_trip_plan_id.or(item_trip_plan_id));
    }
    if expense_trip_plan_id.is_some() {
        return Ok(expense_trip_plan_id);
    }

    db::queries::active_plan_variant_id_for_trip(tx, trip_id)
        .await?
        .ok_or(ServiceError::NotFound)
        .map(Some)
}

async fn resolve_expense_trip_plan_id(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    trip_id: Uuid,
    requested_trip_plan_id: Option<Uuid>,
    paid_by: Uuid,
    itinerary_item_id: Option<Uuid>,
) -> Result<Option<Uuid>, ServiceError> {
    if let Some(trip_plan_id) = requested_trip_plan_id {
        if !db::queries::plan_variant_exists_for_trip(tx, trip_id, trip_plan_id).await? {
            return Err(ServiceError::NotFound);
        }
    }
    if !db::queries::trip_member_exists(tx, trip_id, paid_by).await? {
        return Err(ServiceError::NotFound);
    }

    let item_trip_plan_id = if let Some(item_id) = itinerary_item_id {
        Some(
            db::queries::itinerary_item_plan_variant_id_for_trip(tx, trip_id, item_id)
                .await?
                .ok_or(ServiceError::NotFound)?,
        )
    } else {
        None
    };
    if let (Some(requested), Some(item_plan)) = (requested_trip_plan_id, item_trip_plan_id) {
        if requested != item_plan {
            return Err(ServiceError::InvalidRequest(
                "tripPlanId must match itinerary item plan",
            ));
        }
    }
    if requested_trip_plan_id.is_some() || item_trip_plan_id.is_some() {
        return Ok(requested_trip_plan_id.or(item_trip_plan_id));
    }

    db::queries::active_plan_variant_id_for_trip(tx, trip_id)
        .await?
        .ok_or(ServiceError::NotFound)
        .map(Some)
}

async fn write_reminder_event(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    reminder: &ExpenseReminderRecord,
    client_mutation_id: Option<&str>,
    created_by: Uuid,
) -> Result<crate::realtime::RealtimeEvent, ServiceError> {
    let payload = serde_json::json!({
        "id": reminder.id,
        "tripId": reminder.trip_id,
        "tripPlanId": reminder.trip_plan_id,
        "from": reminder.from_member_id,
        "to": reminder.to_member_id,
        "amountMinor": reminder.amount_minor,
        "lastRemindedAt": reminder.last_reminded_at,
        "version": reminder.version,
    });
    let event = events::insert(
        tx,
        events::EventWrite {
            trip_id: reminder.trip_id,
            aggregate_type: "expense_reminder",
            event_type: "expense.reminder_recorded",
            aggregate_id: reminder.id,
            version: reminder.version,
            payload,
            client_mutation_id,
            created_by: Some(created_by),
        },
    )
    .await?;

    Ok(event)
}

async fn write_event(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    expense: &ExpenseItemSummary,
    event_type: &'static str,
    client_mutation_id: Option<&str>,
    created_by: Option<Uuid>,
) -> Result<crate::realtime::RealtimeEvent, ServiceError> {
    let payload = serde_json::to_value(expense)
        .map_err(|_| ServiceError::InvalidRequest("event payload could not be serialized"))?;
    let event = events::insert(
        tx,
        events::EventWrite {
            trip_id: expense.trip_id,
            aggregate_type: "expense",
            event_type,
            aggregate_id: expense.id,
            version: expense.version,
            payload,
            client_mutation_id,
            created_by,
        },
    )
    .await?;

    Ok(event)
}
