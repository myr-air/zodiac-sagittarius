use uuid::Uuid;

use crate::db::PgPool;
use crate::db::models::{
    ExpenseRecord, ExpenseReminderRecord, ExpenseSplitRecord, NewExpense, NewExpenseReminder,
};
use crate::domain::patches::PatchExpenseRequest;
use crate::domain::uuid_values::unique_uuids;

pub async fn list_expense_splits(
    pool: &PgPool,
    trip_id: Uuid,
    trip_plan_id: Option<Uuid>,
) -> Result<Vec<ExpenseSplitRecord>, sqlx::Error> {
    sqlx::query_as::<_, ExpenseSplitRecord>(
        "select paid_by, amount_minor, currency, exchange_rate_to_settlement_currency, category, splits
         from expenses
         where trip_id = $1
           and ($2::uuid is null or trip_plan_id = $2)
           and deleted_at is null
         order by created_at",
    )
    .bind(trip_id)
    .bind(trip_plan_id)
    .fetch_all(pool)
    .await
}

pub async fn list_expense_reminders(
    pool: &PgPool,
    trip_id: Uuid,
    trip_plan_id: Option<Uuid>,
) -> Result<Vec<ExpenseReminderRecord>, sqlx::Error> {
    sqlx::query_as::<_, ExpenseReminderRecord>(
        "select
           id, trip_id, trip_plan_id, from_member_id, to_member_id, amount_minor,
           to_char(last_reminded_at at time zone 'UTC', 'YYYY-MM-DD\"T\"HH24:MI:SS\"Z\"') as last_reminded_at,
           version
         from expense_reminders
         where trip_id = $1
           and ($2::uuid is null or trip_plan_id = $2)
         order by updated_at",
    )
    .bind(trip_id)
    .bind(trip_plan_id)
    .fetch_all(pool)
    .await
}

pub async fn upsert_expense_reminder(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    reminder: NewExpenseReminder,
) -> Result<ExpenseReminderRecord, sqlx::Error> {
    sqlx::query_as::<_, ExpenseReminderRecord>(
        "insert into expense_reminders (
           id, trip_id, trip_plan_id, from_member_id, to_member_id, amount_minor, created_by
         )
         values ($1, $2, $3, $4, $5, $6, $7)
         on conflict (trip_id, trip_plan_id, from_member_id, to_member_id, amount_minor)
         do update set
           last_reminded_at = now(),
           updated_at = now(),
           created_by = excluded.created_by,
           version = expense_reminders.version + 1
         returning
           id, trip_id, trip_plan_id, from_member_id, to_member_id, amount_minor,
           to_char(last_reminded_at at time zone 'UTC', 'YYYY-MM-DD\"T\"HH24:MI:SS\"Z\"') as last_reminded_at,
           version",
    )
    .bind(reminder.id)
    .bind(reminder.trip_id)
    .bind(reminder.trip_plan_id)
    .bind(reminder.from_member_id)
    .bind(reminder.to_member_id)
    .bind(reminder.amount_minor)
    .bind(reminder.created_by)
    .fetch_one(&mut **tx)
    .await
}

pub async fn list_expenses(
    pool: &PgPool,
    trip_id: Uuid,
) -> Result<Vec<ExpenseRecord>, sqlx::Error> {
    sqlx::query_as::<_, ExpenseRecord>(
        "select
           id, trip_id, trip_plan_id, title, amount_minor, currency, exchange_rate_to_settlement_currency, notes, receipt_url, line_items, comments, settlement_allocations, paid_by, category, splits,
           itinerary_item_id, version
         from expenses
         where trip_id = $1 and deleted_at is null
         order by created_at",
    )
    .bind(trip_id)
    .fetch_all(pool)
    .await
}

pub async fn insert_expense(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    expense: NewExpense<'_>,
) -> Result<ExpenseRecord, sqlx::Error> {
    sqlx::query_as::<_, ExpenseRecord>(
        "insert into expenses (
           id, trip_id, trip_plan_id, title, amount_minor, currency, exchange_rate_to_settlement_currency, notes, receipt_url, line_items, comments, settlement_allocations, paid_by, category, splits,
           itinerary_item_id, version
         )
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 1)
         returning
           id, trip_id, trip_plan_id, title, amount_minor, currency, exchange_rate_to_settlement_currency, notes, receipt_url, line_items, comments, settlement_allocations, paid_by, category, splits,
           itinerary_item_id, version",
    )
    .bind(expense.id)
    .bind(expense.trip_id)
    .bind(expense.trip_plan_id)
    .bind(expense.title)
    .bind(expense.amount_minor)
    .bind(expense.currency)
    .bind(expense.exchange_rate_to_settlement_currency)
    .bind(expense.notes)
    .bind(expense.receipt_url)
    .bind(expense.line_items)
    .bind(expense.comments)
    .bind(expense.settlement_allocations)
    .bind(expense.paid_by)
    .bind(expense.category)
    .bind(expense.splits)
    .bind(expense.itinerary_item_id)
    .fetch_one(&mut **tx)
    .await
}

pub async fn lock_expense(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    expense_id: Uuid,
) -> Result<Option<ExpenseRecord>, sqlx::Error> {
    sqlx::query_as::<_, ExpenseRecord>(
        "select
           id, trip_id, trip_plan_id, title, amount_minor, currency, exchange_rate_to_settlement_currency, notes, receipt_url, line_items, comments, settlement_allocations, paid_by, category, splits,
           itinerary_item_id, version
         from expenses
         where id = $1 and deleted_at is null
         for update",
    )
    .bind(expense_id)
    .fetch_optional(&mut **tx)
    .await
}

pub async fn update_expense(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    expense_id: Uuid,
    patch: &PatchExpenseRequest,
    trip_plan_id: Option<Uuid>,
    next_version: i64,
) -> Result<Option<ExpenseRecord>, sqlx::Error> {
    sqlx::query_as::<_, ExpenseRecord>(
        "update expenses
         set title = coalesce($2, title),
             amount_minor = coalesce($3, amount_minor),
             currency = coalesce($4, currency),
             exchange_rate_to_settlement_currency = coalesce($5, exchange_rate_to_settlement_currency),
             notes = coalesce($6, notes),
             receipt_url = coalesce($7, receipt_url),
             line_items = coalesce($8, line_items),
             comments = coalesce($9, comments),
             settlement_allocations = coalesce($10, settlement_allocations),
             paid_by = coalesce($11, paid_by),
             category = coalesce($12, category),
             splits = coalesce($13, splits),
             itinerary_item_id = case when $14 then $15 else itinerary_item_id end,
             trip_plan_id = $16,
             version = $17,
             updated_at = now()
         where id = $1 and deleted_at is null
         returning
           id, trip_id, trip_plan_id, title, amount_minor, currency, exchange_rate_to_settlement_currency, notes, receipt_url, line_items, comments, settlement_allocations, paid_by, category, splits,
           itinerary_item_id, version",
    )
    .bind(expense_id)
    .bind(patch.title.as_deref())
    .bind(patch.amount_minor)
    .bind(patch.currency.as_deref())
    .bind(patch.exchange_rate_to_settlement_currency)
    .bind(patch.notes.as_deref())
    .bind(patch.receipt_url.as_deref())
    .bind(patch.line_items.as_ref())
    .bind(patch.comments.as_ref())
    .bind(patch.settlement_allocations.as_ref())
    .bind(patch.paid_by)
    .bind(patch.category.as_deref())
    .bind(patch.splits.as_ref())
    .bind(patch.itinerary_item_id.is_some())
    .bind(patch.itinerary_item_id.unwrap_or(None))
    .bind(trip_plan_id)
    .bind(next_version)
    .fetch_optional(&mut **tx)
    .await
}

pub async fn delete_expense(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    expense_id: Uuid,
    next_version: i64,
) -> Result<Option<ExpenseRecord>, sqlx::Error> {
    sqlx::query_as::<_, ExpenseRecord>(
        "update expenses
         set deleted_at = now(), version = $2, updated_at = now()
         where id = $1 and deleted_at is null
         returning
           id, trip_id, trip_plan_id, title, amount_minor, currency, exchange_rate_to_settlement_currency, notes, receipt_url, line_items, comments, settlement_allocations, paid_by, category, splits,
           itinerary_item_id, version",
    )
    .bind(expense_id)
    .bind(next_version)
    .fetch_optional(&mut **tx)
    .await
}

pub async fn expense_ids_exist_for_trip(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    trip_id: Uuid,
    expense_ids: &[Uuid],
) -> Result<bool, sqlx::Error> {
    if expense_ids.is_empty() {
        return Ok(true);
    }

    let existing_count = sqlx::query_scalar::<_, i64>(
        "select count(distinct id)
         from expenses
         where trip_id = $1 and id = any($2) and deleted_at is null",
    )
    .bind(trip_id)
    .bind(expense_ids)
    .fetch_one(&mut **tx)
    .await?;

    Ok(existing_count == unique_uuids(expense_ids).len() as i64)
}

pub async fn expense_trip_plan_ids_for_trip(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    trip_id: Uuid,
    expense_ids: &[Uuid],
) -> Result<Vec<Option<Uuid>>, sqlx::Error> {
    if expense_ids.is_empty() {
        return Ok(Vec::new());
    }

    sqlx::query_scalar(
        "select distinct trip_plan_id
         from expenses
         where trip_id = $1 and id = any($2) and deleted_at is null",
    )
    .bind(trip_id)
    .bind(expense_ids)
    .fetch_all(&mut **tx)
    .await
}
