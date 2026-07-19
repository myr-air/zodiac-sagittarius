use axum::extract::State;
use axum::extract::rejection::JsonRejection;
use axum::routing::post;
use axum::{Json, Router};
use serde::Deserialize;
use utoipa::ToSchema;

use crate::api::error::ApiError;
use crate::app;
use crate::app::AppState;
use crate::domain::errors::ServiceError;
use crate::domain::types::{AccountTripCreateResponse, PublicTripCreateInput};

#[derive(ToSchema, Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PublicTripCreateRequest {
    pub destination: String,
}

pub fn routes() -> Router<AppState> {
    Router::new().route("/public/trips", post(create_public_trip))
}

#[utoipa::path(
    post,
    path = "/public/trips",
    request_body = PublicTripCreateRequest,
    responses(
        (status = 200, description = "Guest trip created", body = AccountTripCreateResponse)
    ),
    tag = "public"
)]
pub async fn create_public_trip(
    State(state): State<AppState>,
    request: Result<Json<PublicTripCreateRequest>, JsonRejection>,
) -> Result<Json<AccountTripCreateResponse>, ApiError> {
    let Json(request) =
        request.map_err(|_| ServiceError::InvalidRequest("json payload is invalid"))?;
    let response = app::public_trips::create_public_trip(
        &state.pool,
        PublicTripCreateInput {
            destination: request.destination,
        },
    )
    .await?;

    Ok(Json(response))
}
