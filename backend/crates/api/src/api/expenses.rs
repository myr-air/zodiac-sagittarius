use axum::{
    Json, Router,
    extract::{Path, Query, State},
    routing::{get, patch, post},
};
use serde::Deserialize;
use uuid::Uuid;
use utoipa::ToSchema;

use crate::api::extractors::BearerToken;
use crate::app;
use crate::app::AppState;
use crate::api::error::ApiError;
use crate::domain::patches::{
    CreateExpenseRequest, PatchExpenseRequest, RecordExpenseReminderRequest,
};
use crate::domain::types::{ExpenseItemSummary, ExpenseSummary};

#[derive(ToSchema, Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExpenseSummaryQuery {
    pub trip_plan_id: Option<Uuid>,
}

pub fn routes() -> Router<AppState> {
    Router::new()
        .route(
            "/trips/{trip_id}/expenses/summary",
            get(get_expense_summary),
        )
        .route(
            "/trips/{trip_id}/expenses/reminders",
            post(record_expense_reminder),
        )
        .route("/trips/{trip_id}/expenses", post(create_expense))
        .route(
            "/trips/{trip_id}/expenses/{expense_id}",
            patch(patch_expense).delete(delete_expense),
        )
}

#[utoipa::path(
    get,
    path = "/trips/{trip_id}/expenses/summary",
    params(
        ("trip_id" = String, Path, description = "Trip id"),
        ("trip_plan_id" = Option<String>, Query, description = "Optional trip plan id")
    ),
    responses(
        (status = 200, description = "Expense summary", body = ExpenseSummary)
    ),
    tag = "expenses"
)]
pub async fn get_expense_summary(
    State(state): State<AppState>,
    Path(trip_id): Path<Uuid>,
    Query(query): Query<ExpenseSummaryQuery>,
    BearerToken(session_token): BearerToken,
) -> Result<Json<ExpenseSummary>, ApiError> {
    let summary = app::expenses::get_expense_summary(
        &state.pool,
        trip_id,
        &session_token,
        query.trip_plan_id,
    )
    .await?;

    Ok(Json(summary))
}

#[utoipa::path(
    post,
    path = "/trips/{trip_id}/expenses",
    params(
        ("trip_id" = String, Path, description = "Trip id")
    ),
    request_body = CreateExpenseRequest,
    responses(
        (status = 200, description = "Expense created", body = ExpenseItemSummary)
    ),
    tag = "expenses"
)]
pub async fn create_expense(
    State(state): State<AppState>,
    Path(trip_id): Path<Uuid>,
    BearerToken(session_token): BearerToken,
    Json(request): Json<CreateExpenseRequest>,
) -> Result<Json<ExpenseItemSummary>, ApiError> {
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

#[utoipa::path(
    post,
    path = "/trips/{trip_id}/expenses/reminders",
    params(
        ("trip_id" = String, Path, description = "Trip id"),
        ("trip_plan_id" = Option<String>, Query, description = "Optional trip plan id")
    ),
    request_body = RecordExpenseReminderRequest,
    responses(
        (status = 200, description = "Expense reminder recorded", body = ExpenseSummary)
    ),
    tag = "expenses"
)]
pub async fn record_expense_reminder(
    State(state): State<AppState>,
    Path(trip_id): Path<Uuid>,
    Query(query): Query<ExpenseSummaryQuery>,
    BearerToken(session_token): BearerToken,
    Json(request): Json<RecordExpenseReminderRequest>,
) -> Result<Json<ExpenseSummary>, ApiError> {
    let summary = app::expenses::record_expense_reminder(
        &state.pool,
        &state.realtime,
        trip_id,
        &session_token,
        query.trip_plan_id,
        request,
    )
    .await?;

    Ok(Json(summary))
}

#[utoipa::path(
    patch,
    path = "/trips/{trip_id}/expenses/{expense_id}",
    params(
        ("trip_id" = String, Path, description = "Trip id"),
        ("expense_id" = String, Path, description = "Expense id")
    ),
    request_body = PatchExpenseRequest,
    responses(
        (status = 200, description = "Expense updated", body = ExpenseItemSummary)
    ),
    tag = "expenses"
)]
pub async fn patch_expense(
    State(state): State<AppState>,
    Path((trip_id, expense_id)): Path<(Uuid, Uuid)>,
    BearerToken(session_token): BearerToken,
    Json(request): Json<PatchExpenseRequest>,
) -> Result<Json<ExpenseItemSummary>, ApiError> {
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

#[utoipa::path(
    delete,
    path = "/trips/{trip_id}/expenses/{expense_id}",
    params(
        ("trip_id" = String, Path, description = "Trip id"),
        ("expense_id" = String, Path, description = "Expense id")
    ),
    responses(
        (status = 200, description = "Expense deleted", body = ExpenseItemSummary)
    ),
    tag = "expenses"
)]
pub async fn delete_expense(
    State(state): State<AppState>,
    Path((trip_id, expense_id)): Path<(Uuid, Uuid)>,
    BearerToken(session_token): BearerToken,
) -> Result<Json<ExpenseItemSummary>, ApiError> {
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
