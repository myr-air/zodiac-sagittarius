use uuid::Uuid;

use crate::app::{auth, events, trips};
use crate::db;
use crate::db::PgPool;
use crate::db::models::NewExpense;
use crate::domain::capabilities::can;
use crate::domain::errors::ServiceError;
use crate::domain::patches::{CreateExpenseRequest, PatchExpenseRequest};
use crate::domain::types::{Capability, ExpenseItemSummary, ExpenseSummary};
use crate::realtime::RealtimeHub;

pub async fn get_expense_summary(
    pool: &PgPool,
    trip_id: Uuid,
    session_token: &str,
) -> Result<ExpenseSummary, ServiceError> {
    let token_hash = auth::hash_session_token(session_token)?;
    let session = db::queries::find_active_member_session(pool, trip_id, &token_hash)
        .await?
        .ok_or(ServiceError::Unauthenticated)?;
    if !can(session.role, Capability::ViewExpenses) {
        return Err(ServiceError::Forbidden);
    }

    let splits = db::queries::list_expense_splits(pool, trip_id).await?;
    Ok(trips::build_expense_summary(splits, session.member_id))
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
    if db::queries::realtime_event_exists_for_client_mutation(
        &mut tx,
        trip_id,
        session.member_id,
        &request.client_mutation_id,
    )
    .await?
    {
        return Err(ServiceError::VersionConflict);
    }
    validate_expense_links(&mut tx, trip_id, request.paid_by, request.itinerary_item_id).await?;

    let record = db::queries::insert_expense(
        &mut tx,
        NewExpense {
            id: Uuid::now_v7(),
            trip_id,
            title: request.title.trim(),
            amount_minor: request.amount_minor,
            currency: request.currency.as_deref().unwrap_or("HKD").trim(),
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
    let existing = db::queries::lock_expense(&mut tx, expense_id)
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
    if db::queries::realtime_event_exists_for_client_mutation(
        &mut tx,
        trip_id,
        session.member_id,
        &request.client_mutation_id,
    )
    .await?
    {
        return Err(ServiceError::VersionConflict);
    }
    if existing.version != request.expected_version {
        let latest = serde_json::to_value(ExpenseItemSummary::from(existing))
            .map_err(|_| ServiceError::InvalidRequest("latest expense could not be serialized"))?;
        return Err(ServiceError::VersionConflictWithLatest(latest));
    }
    validate_expense_links(
        &mut tx,
        trip_id,
        request.paid_by.unwrap_or(existing.paid_by),
        request
            .itinerary_item_id
            .unwrap_or(existing.itinerary_item_id),
    )
    .await?;

    let updated =
        db::queries::update_expense(&mut tx, expense_id, &request, request.expected_version + 1)
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

pub async fn delete_expense(
    pool: &PgPool,
    realtime: &RealtimeHub,
    trip_id: Uuid,
    expense_id: Uuid,
    session_token: &str,
) -> Result<ExpenseItemSummary, ServiceError> {
    let token_hash = auth::hash_session_token(session_token)?;
    let mut tx = pool.begin().await?;
    let existing = db::queries::lock_expense(&mut tx, expense_id)
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

    let deleted = db::queries::delete_expense(&mut tx, expense_id, existing.version + 1)
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
