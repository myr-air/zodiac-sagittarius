use serde::{Deserialize, Serialize};
use time::Date;
use uuid::Uuid;

use crate::app::auth;
use crate::db;
use crate::db::PgPool;
use crate::domain::capabilities::can;
use crate::domain::errors::ServiceError;
use crate::domain::types::Capability;

const HIGH_CONFIDENCE_THRESHOLD: f64 = 0.85;

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
        return Ok(classify_candidates(Vec::new()));
    }

    Ok(classify_candidates(Vec::new()))
}

pub fn classify_candidates(candidates: Vec<PlaceCandidate>) -> ResolvePlaceResponse {
    let status = match candidates.as_slice() {
        [] => "unresolved",
        [candidate] if candidate.confidence >= HIGH_CONFIDENCE_THRESHOLD => "resolved",
        _ => "ambiguous",
    };
    ResolvePlaceResponse { status, candidates }
}

pub fn osm_map_link(lat: f64, lng: f64) -> String {
    format!(
        "https://www.openstreetmap.org/?mlat={lat:.7}&mlon={lng:.7}#map=17/{lat:.7}/{lng:.7}"
    )
}

fn parse_nominatim_candidates(
    value: &serde_json::Value,
    confidence: f64,
    evidence: Vec<String>,
) -> Vec<PlaceCandidate> {
    value
        .as_array()
        .into_iter()
        .flatten()
        .filter_map(|entry| {
            let lat = entry.get("lat")?.as_str()?.parse::<f64>().ok()?;
            let lng = entry.get("lon")?.as_str()?.parse::<f64>().ok()?;
            if !(-90.0..=90.0).contains(&lat) || !(-180.0..=180.0).contains(&lng) {
                return None;
            }
            let address = entry.get("display_name")?.as_str()?.to_string();
            let name = entry
                .get("name")
                .and_then(|name| name.as_str())
                .filter(|name| !name.trim().is_empty())
                .unwrap_or(address.as_str())
                .to_string();
            Some(PlaceCandidate {
                name,
                address,
                coordinates: PlaceCoordinates { lat, lng },
                map_link: osm_map_link(lat, lng),
                confidence,
                source: "nominatim".to_string(),
                evidence: evidence.clone(),
            })
        })
        .take(3)
        .collect()
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

fn place_resolution_enabled() -> bool {
    std::env::var("PLACE_RESOLUTION_ENABLED")
        .map(|value| matches!(value.to_ascii_lowercase().as_str(), "1" | "true" | "yes" | "on"))
        .unwrap_or(false)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn nominatim_response_maps_to_candidate() {
        let raw = serde_json::json!([{
            "display_name": "The Elements, Austin Road West, Hong Kong",
            "name": "The Elements",
            "lat": "22.3049000",
            "lon": "114.1617000",
            "osm_type": "way",
            "osm_id": 123
        }]);

        let candidates =
            parse_nominatim_candidates(&raw, 0.9, vec!["brave: The Elements".to_string()]);
        assert_eq!(candidates.len(), 1);
        assert_eq!(candidates[0].name, "The Elements");
        assert_eq!(candidates[0].coordinates.lat, 22.3049);
        assert_eq!(candidates[0].coordinates.lng, 114.1617);
        assert_eq!(candidates[0].source, "nominatim");
    }
}
