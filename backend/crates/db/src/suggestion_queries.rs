use uuid::Uuid;

use crate::PgPool;
use crate::models::{NewSuggestion, SuggestionRecord};

pub async fn list_suggestions(
    pool: &PgPool,
    trip_id: Uuid,
) -> Result<Vec<SuggestionRecord>, sqlx::Error> {
    sqlx::query_as::<_, SuggestionRecord>(
        "select
           id, trip_id, trip_plan_id, proposer_id, type, target_item_id, proposed_patch,
           source_version, status, created_at::text as created_at
         from suggestions
         where trip_id = $1
         order by created_at desc",
    )
    .bind(trip_id)
    .fetch_all(pool)
    .await
}

pub async fn insert_suggestion(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    suggestion: NewSuggestion<'_>,
) -> Result<SuggestionRecord, sqlx::Error> {
    sqlx::query_as::<_, SuggestionRecord>(
        "insert into suggestions (
           id, trip_id, trip_plan_id, proposer_id, type, target_item_id, proposed_patch,
           source_version, status
         )
         values ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
         returning
           id, trip_id, trip_plan_id, proposer_id, type, target_item_id, proposed_patch,
           source_version, status, created_at::text as created_at",
    )
    .bind(suggestion.id)
    .bind(suggestion.trip_id)
    .bind(suggestion.trip_plan_id)
    .bind(suggestion.proposer_id)
    .bind(suggestion.r#type)
    .bind(suggestion.target_item_id)
    .bind(suggestion.proposed_patch)
    .bind(suggestion.source_version)
    .fetch_one(&mut **tx)
    .await
}

pub async fn lock_suggestion(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    suggestion_id: Uuid,
) -> Result<Option<SuggestionRecord>, sqlx::Error> {
    sqlx::query_as::<_, SuggestionRecord>(
        "select
           id, trip_id, trip_plan_id, proposer_id, type, target_item_id, proposed_patch,
           source_version, status, created_at::text as created_at
         from suggestions
         where id = $1
         for update",
    )
    .bind(suggestion_id)
    .fetch_optional(&mut **tx)
    .await
}

pub async fn update_suggestion_status(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    suggestion_id: Uuid,
    status: &str,
    resolved_by: Uuid,
) -> Result<Option<SuggestionRecord>, sqlx::Error> {
    sqlx::query_as::<_, SuggestionRecord>(
        "update suggestions
         set status = $2, resolved_at = now(), resolved_by = $3
         where id = $1
         returning
           id, trip_id, trip_plan_id, proposer_id, type, target_item_id, proposed_patch,
           source_version, status, created_at::text as created_at",
    )
    .bind(suggestion_id)
    .bind(status)
    .bind(resolved_by)
    .fetch_optional(&mut **tx)
    .await
}
