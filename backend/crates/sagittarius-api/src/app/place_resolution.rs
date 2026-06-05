use serde::{Deserialize, Serialize};
use time::Date;
use uuid::Uuid;

use crate::app::auth;
use crate::db;
use crate::db::PgPool;
use crate::domain::capabilities::can;
use crate::domain::errors::ServiceError;
use crate::domain::types::Capability;

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ResolvePlaceRequest {
    pub client_mutation_id: String,
    pub activity: String,
    pub place_hint: String,
    pub destination_label: String,
    pub countries: Vec<String>,
    pub day: Date,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PlaceCandidate {
    pub name: String,
    pub address: String,
    pub coordinates: PlaceCoordinates,
    pub map_link: String,
    pub confidence: f64,
    pub source: String,
    pub evidence: Vec<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PlaceCoordinates {
    pub lat: f64,
    pub lng: f64,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ResolvePlaceResponse {
    pub status: &'static str,
    pub candidates: Vec<PlaceCandidate>,
}

pub async fn resolve_place(
    pool: &PgPool,
    trip_id: Uuid,
    session_token: &str,
    request: ResolvePlaceRequest,
) -> Result<ResolvePlaceResponse, ServiceError> {
    validate_request(&request)?;

    let token_hash = auth::hash_session_token(session_token)?;
    let mut tx = pool.begin().await?;
    let session = db::queries::find_active_member_session_in_tx(&mut tx, trip_id, &token_hash)
        .await?
        .ok_or(ServiceError::Unauthenticated)?;
    if !can(session.role, Capability::EditItinerary) {
        return Err(ServiceError::Forbidden);
    }
    tx.commit().await?;

    if !place_resolution_enabled() {
        return Ok(unresolved_response());
    }

    Ok(unresolved_response())
}

fn validate_request(request: &ResolvePlaceRequest) -> Result<(), ServiceError> {
    if request.client_mutation_id.trim().is_empty()
        || request.place_hint.trim().is_empty()
        || request.activity.trim().is_empty()
        || request.destination_label.trim().is_empty()
    {
        return Err(ServiceError::InvalidRequest(
            "place resolution request is incomplete",
        ));
    }

    Ok(())
}

fn unresolved_response() -> ResolvePlaceResponse {
    ResolvePlaceResponse {
        status: "unresolved",
        candidates: Vec::new(),
    }
}

fn place_resolution_enabled() -> bool {
    std::env::var("PLACE_RESOLUTION_ENABLED")
        .map(|value| matches!(value.to_ascii_lowercase().as_str(), "1" | "true" | "yes" | "on"))
        .unwrap_or(false)
}
