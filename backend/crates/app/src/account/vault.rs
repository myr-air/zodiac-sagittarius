use uuid::Uuid;

use crate::account_mappers::account_vault_item_from_record;
use sagittarius_db::models::NewAccountVaultItem;
use sagittarius_db::{self as db, PgPool};
use sagittarius_domain::errors::ServiceError;
use sagittarius_domain::types::AccountVaultItemSummary;

use super::auth::authenticate_user_session;
use super::trips::validate_trip_text;
use super::AccountVaultItemCreateInput;

pub async fn list_vault_items(
    pool: &PgPool,
    session_token: &str,
) -> Result<Vec<AccountVaultItemSummary>, ServiceError> {
    let user_id = authenticate_user_session(pool, session_token).await?;
    let items = db::account_queries::list_account_vault_items(pool, user_id).await?;

    Ok(items
        .into_iter()
        .map(account_vault_item_from_record)
        .collect())
}

pub async fn create_vault_item(
    pool: &PgPool,
    session_token: &str,
    input: AccountVaultItemCreateInput,
) -> Result<AccountVaultItemSummary, ServiceError> {
    let user_id = authenticate_user_session(pool, session_token).await?;
    let kind = match input.kind.as_str() {
        "note" | "file" => input.kind,
        _ => return Err(ServiceError::InvalidRequest("vault item kind is invalid")),
    };
    let title = validate_trip_text(&input.title, "vault title")?;
    let detail = input.detail.trim().chars().take(2000).collect::<String>();
    let external_url = input
        .external_url
        .as_deref()
        .map(str::trim)
        .filter(|value| !value.is_empty());
    if let Some(trip_id) = input.trip_id {
        let has_membership =
            db::account_queries::account_has_active_trip_membership(pool, user_id, trip_id).await?;
        if !has_membership {
            return Err(ServiceError::Forbidden);
        }
    }
    let record = db::account_queries::insert_account_vault_item(
        pool,
        NewAccountVaultItem {
            id: Uuid::now_v7(),
            user_id,
            trip_id: input.trip_id,
            kind: &kind,
            title: &title,
            detail: &detail,
            external_url,
        },
    )
    .await?;

    Ok(account_vault_item_from_record(record))
}
