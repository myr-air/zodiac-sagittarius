use axum::{
    Json, Router,
    extract::{Query, State},
    routing::get,
};
use serde::Deserialize;
use serde_json::Value as JsonValue;

use crate::app::AppState;
use crate::api::error::ApiError;

pub fn routes() -> Router<AppState> {
    Router::new().route("/exchange-rates", get(get_exchange_rate))
}

#[derive(Debug, Deserialize)]
pub struct ExchangeRateQuery {
    base: String,
    quote: String,
}

#[utoipa::path(
    get,
    path = "/exchange-rates",
    params(
        ("base" = String, Query, description = "Base currency code"),
        ("quote" = String, Query, description = "Quote currency code")
    ),
    responses(
        (status = 200, description = "Exchange rate", body = JsonValue)
    ),
    tag = "exchange_rates"
)]
pub async fn get_exchange_rate(
    State(state): State<AppState>,
    Query(query): Query<ExchangeRateQuery>,
) -> Result<Json<crate::app::exchange_rates::ExchangeRateResponse>, ApiError> {
    Ok(Json(
        state
            .exchange_rates
            .get_rate(query.base, query.quote)
            .await?,
    ))
}
