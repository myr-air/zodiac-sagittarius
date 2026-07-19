use uuid::Uuid;

use crate::PgPool;
use crate::models::{
    NewPlanCheck, NewPlanSuggestion, PlanCheckRecord, PlanSuggestionRecord,
};

pub async fn find_latest_plan_check(
    pool: &PgPool,
    trip_id: Uuid,
    trip_plan_id: Option<Uuid>,
) -> Result<Option<PlanCheckRecord>, sqlx::Error> {
    sqlx::query_as::<_, PlanCheckRecord>(
        "select
           id, trip_id, trip_plan_id, created_by, itinerary_fingerprint, language_metadata,
           status, created_at::text as created_at, completed_at::text as completed_at, version
         from plan_checks
         where trip_id = $1
           and ($2::uuid is null or trip_plan_id = $2)
         order by created_at desc
         limit 1",
    )
    .bind(trip_id)
    .bind(trip_plan_id)
    .fetch_optional(pool)
    .await
}

pub async fn list_plan_suggestions(
    pool: &PgPool,
    plan_check_id: Uuid,
) -> Result<Vec<PlanSuggestionRecord>, sqlx::Error> {
    sqlx::query_as::<_, PlanSuggestionRecord>(
        "select
           id, trip_id, plan_check_id, severity, scope, target_item_ids,
           explanation_i18n, recommended_action_i18n, action_kind, action_payload,
           status, snoozed_until::text as snoozed_until,
           created_at::text as created_at, updated_at::text as updated_at, version
         from plan_suggestions
         where plan_check_id = $1
         order by
           case severity when 'critical' then 0 when 'warning' then 1 else 2 end,
           created_at,
           id",
    )
    .bind(plan_check_id)
    .fetch_all(pool)
    .await
}

pub async fn insert_plan_check(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    check: NewPlanCheck<'_>,
) -> Result<PlanCheckRecord, sqlx::Error> {
    sqlx::query_as::<_, PlanCheckRecord>(
        "insert into plan_checks (
           id, trip_id, trip_plan_id, created_by, itinerary_fingerprint, language_metadata,
           status, completed_at
         )
         values ($1, $2, $3, $4, $5, $6, 'complete', now())
         returning
           id, trip_id, trip_plan_id, created_by, itinerary_fingerprint, language_metadata,
           status, created_at::text as created_at, completed_at::text as completed_at, version",
    )
    .bind(check.id)
    .bind(check.trip_id)
    .bind(check.trip_plan_id)
    .bind(check.created_by)
    .bind(check.itinerary_fingerprint)
    .bind(check.language_metadata)
    .fetch_one(&mut **tx)
    .await
}

pub async fn insert_plan_suggestion(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    suggestion: NewPlanSuggestion<'_>,
) -> Result<PlanSuggestionRecord, sqlx::Error> {
    sqlx::query_as::<_, PlanSuggestionRecord>(
        "insert into plan_suggestions (
           id, trip_id, plan_check_id, severity, scope, target_item_ids,
           explanation_i18n, recommended_action_i18n, action_kind, action_payload
         )
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         returning
           id, trip_id, plan_check_id, severity, scope, target_item_ids,
           explanation_i18n, recommended_action_i18n, action_kind, action_payload,
           status, snoozed_until::text as snoozed_until,
           created_at::text as created_at, updated_at::text as updated_at, version",
    )
    .bind(suggestion.id)
    .bind(suggestion.trip_id)
    .bind(suggestion.plan_check_id)
    .bind(suggestion.severity)
    .bind(suggestion.scope)
    .bind(suggestion.target_item_ids)
    .bind(suggestion.explanation_i18n)
    .bind(suggestion.recommended_action_i18n)
    .bind(suggestion.action_kind)
    .bind(suggestion.action_payload)
    .fetch_one(&mut **tx)
    .await
}

pub async fn lock_plan_suggestion(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    suggestion_id: Uuid,
) -> Result<Option<PlanSuggestionRecord>, sqlx::Error> {
    sqlx::query_as::<_, PlanSuggestionRecord>(
        "select
           id, trip_id, plan_check_id, severity, scope, target_item_ids,
           explanation_i18n, recommended_action_i18n, action_kind, action_payload,
           status, snoozed_until::text as snoozed_until,
           created_at::text as created_at, updated_at::text as updated_at, version
         from plan_suggestions
         where id = $1
         for update",
    )
    .bind(suggestion_id)
    .fetch_optional(&mut **tx)
    .await
}

pub async fn update_plan_suggestion_status(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    suggestion_id: Uuid,
    status: &str,
    snoozed_until: Option<&str>,
    next_version: i64,
) -> Result<Option<PlanSuggestionRecord>, sqlx::Error> {
    sqlx::query_as::<_, PlanSuggestionRecord>(
        "update plan_suggestions
         set status = $2,
             snoozed_until = $3::timestamptz,
             version = $4,
             updated_at = now()
         where id = $1
         returning
           id, trip_id, plan_check_id, severity, scope, target_item_ids,
           explanation_i18n, recommended_action_i18n, action_kind, action_payload,
           status, snoozed_until::text as snoozed_until,
           created_at::text as created_at, updated_at::text as updated_at, version",
    )
    .bind(suggestion_id)
    .bind(status)
    .bind(snoozed_until)
    .bind(next_version)
    .fetch_optional(&mut **tx)
    .await
}
