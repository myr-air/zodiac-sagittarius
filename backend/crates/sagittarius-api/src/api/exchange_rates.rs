use axum::{
    Json,
    extract::{Query, State},
};
use serde::Deserialize;

use crate::{app::AppState, domain::errors::ServiceError};

#[derive(Debug, Deserialize)]
pub struct ExchangeRateQuery {
    base: String,
    quote: String,
}

pub async fn get_exchange_rate(
    State(state): State<AppState>,
    Query(query): Query<ExchangeRateQuery>,
) -> Result<Json<crate::app::exchange_rates::ExchangeRateResponse>, ServiceError> {
    Ok(Json(
        state
            .exchange_rates
            .get_rate(query.base, query.quote)
            .await?,
    ))
}
