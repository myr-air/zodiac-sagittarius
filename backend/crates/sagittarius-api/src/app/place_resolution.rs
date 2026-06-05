use serde::{Deserialize, Serialize};
use std::sync::LazyLock;
use std::time::{Duration, Instant};
use time::Date;
use tokio::sync::Mutex;
use uuid::Uuid;

use crate::app::auth;
use crate::db;
use crate::db::PgPool;
use crate::domain::capabilities::can;
use crate::domain::errors::ServiceError;
use crate::domain::types::Capability;

const HIGH_CONFIDENCE_THRESHOLD: f64 = 0.85;
const NOMINATIM_DEFAULT_BASE_URL: &str = "https://nominatim.openstreetmap.org";
const NOMINATIM_MIN_INTERVAL: Duration = Duration::from_secs(1);

static NOMINATIM_LAST_REQUEST: LazyLock<Mutex<Option<Instant>>> =
    LazyLock::new(|| Mutex::new(None));

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

    let evidence = brave_place_evidence(&request).await.unwrap_or_default();
    let candidates = nominatim_place_candidates(&request, evidence)
        .await
        .unwrap_or_default();
    Ok(classify_candidates(candidates))
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
    format!("https://www.openstreetmap.org/?mlat={lat:.7}&mlon={lng:.7}#map=17/{lat:.7}/{lng:.7}")
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

async fn nominatim_place_candidates(
    request: &ResolvePlaceRequest,
    evidence: Vec<String>,
) -> Option<Vec<PlaceCandidate>> {
    wait_for_nominatim_slot().await;

    let client = reqwest::Client::new();
    let query = place_query(request);
    let base_url = std::env::var("NOMINATIM_BASE_URL")
        .unwrap_or_else(|_| NOMINATIM_DEFAULT_BASE_URL.to_string());
    let url = format!("{}/search", base_url.trim_end_matches('/'));
    let mut params = vec![
        ("format".to_string(), "jsonv2".to_string()),
        ("limit".to_string(), "3".to_string()),
        ("q".to_string(), query),
    ];
    let country_codes = nominatim_country_codes(&request.countries);
    if !country_codes.is_empty() {
        params.push(("countrycodes".to_string(), country_codes));
    }

    let response = client
        .get(url)
        .header(reqwest::header::USER_AGENT, place_resolution_user_agent())
        .query(&params)
        .send()
        .await
        .ok()?;
    if !response.status().is_success() {
        return None;
    }

    let raw = response.json::<serde_json::Value>().await.ok()?;
    Some(parse_nominatim_candidates(
        &raw,
        confidence_for_request(request),
        evidence,
    ))
}

async fn brave_place_evidence(request: &ResolvePlaceRequest) -> Option<Vec<String>> {
    let api_key = std::env::var("BRAVE_API_KEY").ok()?;
    let query = place_query(request);
    let response = reqwest::Client::new()
        .get("https://api.search.brave.com/res/v1/web/search")
        .header("X-Subscription-Token", api_key)
        .header(reqwest::header::USER_AGENT, place_resolution_user_agent())
        .query(&[("q", query.as_str()), ("count", "3"), ("search_lang", "en")])
        .send()
        .await
        .ok()?;
    if !response.status().is_success() {
        return None;
    }
    let raw = response.json::<serde_json::Value>().await.ok()?;
    let evidence = raw
        .pointer("/web/results")
        .and_then(|value| value.as_array())
        .into_iter()
        .flatten()
        .filter_map(|entry| {
            let title = entry.get("title").and_then(|value| value.as_str())?;
            let description = entry
                .get("description")
                .and_then(|value| value.as_str())
                .unwrap_or("");
            Some(
                format!("brave: {} {}", title.trim(), description.trim())
                    .trim()
                    .to_string(),
            )
        })
        .filter(|entry| !entry.is_empty())
        .take(3)
        .collect::<Vec<_>>();
    Some(evidence)
}

async fn wait_for_nominatim_slot() {
    let mut last_request = NOMINATIM_LAST_REQUEST.lock().await;
    if let Some(last_request) = *last_request {
        let elapsed = last_request.elapsed();
        if elapsed < NOMINATIM_MIN_INTERVAL {
            tokio::time::sleep(NOMINATIM_MIN_INTERVAL - elapsed).await;
        }
    }
    *last_request = Some(Instant::now());
}

fn place_query(request: &ResolvePlaceRequest) -> String {
    [
        request.activity.clone(),
        request.place_hint.clone(),
        request.destination_label.clone(),
        request.countries.join(" "),
    ]
    .join(" ")
    .split_whitespace()
    .collect::<Vec<_>>()
    .join(" ")
}

fn nominatim_country_codes(countries: &[String]) -> String {
    countries
        .iter()
        .filter_map(|country| {
            let normalized = country.trim().to_ascii_lowercase();
            (normalized.len() == 2
                && normalized
                    .chars()
                    .all(|character| character.is_ascii_lowercase()))
            .then_some(normalized)
        })
        .collect::<Vec<_>>()
        .join(",")
}

fn confidence_for_request(request: &ResolvePlaceRequest) -> f64 {
    let hint_words = request.place_hint.split_whitespace().count();
    let activity_words = request.activity.split_whitespace().count();
    if hint_words + activity_words >= 4 {
        0.9
    } else {
        0.78
    }
}

fn place_resolution_user_agent() -> String {
    std::env::var("PLACE_RESOLUTION_USER_AGENT").unwrap_or_else(|_| {
        "Sagittarius travel planner place resolver; set PLACE_RESOLUTION_USER_AGENT with contact".to_string()
    })
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
        .map(|value| {
            matches!(
                value.to_ascii_lowercase().as_str(),
                "1" | "true" | "yes" | "on"
            )
        })
        .unwrap_or(false)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn request() -> ResolvePlaceRequest {
        ResolvePlaceRequest {
            client_mutation_id: "mutation-1".to_string(),
            activity: "Dim Dim Sum".to_string(),
            place_hint: "near Elements".to_string(),
            destination_label: "Hong Kong".to_string(),
            countries: vec!["HK".to_string(), "Thailand".to_string()],
            day: Date::from_calendar_date(2026, time::Month::June, 5).unwrap(),
        }
    }

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

    #[test]
    fn place_query_combines_activity_hint_destination_and_country_context() {
        let query = place_query(&request());

        assert_eq!(query, "Dim Dim Sum near Elements Hong Kong HK Thailand");
        assert_eq!(nominatim_country_codes(&request().countries), "hk");
    }

    #[test]
    fn confidence_uses_query_specificity() {
        let mut request = request();
        assert_eq!(confidence_for_request(&request), 0.9);

        request.activity = "Cafe".to_string();
        request.place_hint = "nearby".to_string();
        assert_eq!(confidence_for_request(&request), 0.78);
    }
}
