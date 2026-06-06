use axum::Json;
use axum::extract::{Path, State};
use uuid::Uuid;

use crate::api::extractors::BearerToken;
use crate::app;
use crate::app::AppState;
use crate::domain::errors::ServiceError;
use crate::domain::patches::{
    CreateExpenseRequest, PatchExpenseRequest, RecordExpenseReminderRequest,
};
use crate::domain::types::{ExpenseItemSummary, ExpenseSummary};

pub async fn get_expense_summary(
    State(state): State<AppState>,
    Path(trip_id): Path<Uuid>,
    BearerToken(session_token): BearerToken,
) -> Result<Json<ExpenseSummary>, ServiceError> {
    let summary = app::expenses::get_expense_summary(&state.pool, trip_id, &session_token).await?;

    Ok(Json(summary))
}

pub async fn create_expense(
    State(state): State<AppState>,
    Path(trip_id): Path<Uuid>,
    BearerToken(session_token): BearerToken,
    Json(request): Json<CreateExpenseRequest>,
) -> Result<Json<ExpenseItemSummary>, ServiceError> {
    let expense = app::expenses::create_expense(
        &state.pool,
        &state.realtime,
        trip_id,
        &session_token,
        request,
    )
    .await?;

    Ok(Json(expense))
}

pub async fn record_expense_reminder(
    State(state): State<AppState>,
    Path(trip_id): Path<Uuid>,
    BearerToken(session_token): BearerToken,
    Json(request): Json<RecordExpenseReminderRequest>,
) -> Result<Json<ExpenseSummary>, ServiceError> {
    let summary = app::expenses::record_expense_reminder(
        &state.pool,
        &state.realtime,
        trip_id,
        &session_token,
        request,
    )
    .await?;

    Ok(Json(summary))
}

pub async fn patch_expense(
    State(state): State<AppState>,
    Path((trip_id, expense_id)): Path<(Uuid, Uuid)>,
    BearerToken(session_token): BearerToken,
    Json(request): Json<PatchExpenseRequest>,
) -> Result<Json<ExpenseItemSummary>, ServiceError> {
    let expense = app::expenses::patch_expense(
        &state.pool,
        &state.realtime,
        trip_id,
        expense_id,
        &session_token,
        request,
    )
    .await?;

    Ok(Json(expense))
}

pub async fn delete_expense(
    State(state): State<AppState>,
    Path((trip_id, expense_id)): Path<(Uuid, Uuid)>,
    BearerToken(session_token): BearerToken,
) -> Result<Json<ExpenseItemSummary>, ServiceError> {
    let expense = app::expenses::delete_expense(
        &state.pool,
        &state.realtime,
        trip_id,
        expense_id,
        &session_token,
    )
    .await?;

    Ok(Json(expense))
}
