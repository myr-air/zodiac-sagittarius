use axum::Json;
use axum::extract::{Path, State};
use uuid::Uuid;

use crate::api::extractors::BearerToken;
use crate::app;
use crate::app::AppState;
use crate::domain::errors::ServiceError;
use crate::domain::types::TripCockpit;

pub async fn load_trip(
    State(state): State<AppState>,
    Path(trip_id): Path<Uuid>,
    BearerToken(session_token): BearerToken,
) -> Result<Json<TripCockpit>, ServiceError> {
    let cockpit = app::trips::load_cockpit(&state.pool, trip_id, &session_token).await?;

    Ok(Json(cockpit))
}
