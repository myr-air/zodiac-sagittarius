use serde::{Deserialize, Serialize};
use std::sync::LazyLock;
use std::time::{Duration, Instant};
use time::Date;
use tokio::sync::Mutex;
use uuid::Uuid;

use crate::app::auth;
use crate::db;
use crate::db::PgPool;
use crate::db::models::PlaceGeocodeCacheRecord;
use crate::domain::capabilities::can;
use crate::domain::errors::ServiceError;
use crate::domain::types::Capability;

const HIGH_CONFIDENCE_THRESHOLD: f64 = 0.85;
const NOMINATIM_DEFAULT_BASE_URL: &str = "https://nominatim.openstreetmap.org";
const NOMINATIM_MIN_INTERVAL: Duration = Duration::from_secs(1);
const OPEN_METEO_GEOCODE_BASE_URL: &str = "https://geocoding-api.open-meteo.com/v1";
const OPENROUTER_CHAT_COMPLETIONS_URL: &str = "https://openrouter.ai/api/v1/chat/completions";

static NOMINATIM_LAST_REQUEST: LazyLock<Mutex<Option<Instant>>> =
    LazyLock::new(|| Mutex::new(None));

#[derive(Debug, Clone, Copy)]
struct GeoBounds {
    max_lat: f64,
    max_lng: f64,
    min_lat: f64,
    min_lng: f64,
}

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

#[derive(Debug, Serialize)]
struct OpenRouterPlaceQueryRequest<'a> {
    model: &'a str,
    messages: Vec<OpenRouterPlaceQueryMessage<'a>>,
    temperature: f64,
    response_format: OpenRouterPlaceQueryResponseFormat,
}

#[derive(Debug, Serialize)]
struct OpenRouterPlaceQueryMessage<'a> {
    role: &'a str,
    content: String,
}

#[derive(Debug, Serialize)]
struct OpenRouterPlaceQueryResponseFormat {
    #[serde(rename = "type")]
    response_type: &'static str,
}

#[derive(Debug, Deserialize)]
struct OpenRouterPlaceQueryResponse {
    choices: Vec<OpenRouterPlaceQueryChoice>,
}

#[derive(Debug, Deserialize)]
struct OpenRouterPlaceQueryChoice {
    message: OpenRouterPlaceQueryResponseMessage,
}

#[derive(Debug, Deserialize)]
struct OpenRouterPlaceQueryResponseMessage {
    content: String,
}

#[derive(Debug, Deserialize)]
struct OpenRouterPlaceQueryPayload {
    queries: Vec<String>,
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

    let country_codes = destination_country_codes(&request.countries);
    let route_bounds = route_candidate_bounds(&request);
    let queries = resolved_place_queries(&request).await;
    for query in &queries {
        let normalized_query = normalized_destination_query(query, &country_codes);
        if let Some(record) = db::queries::find_place_geocode_cache(pool, &normalized_query).await?
        {
            let candidate = candidate_from_cache(record);
            if candidate_matches_bounds(&candidate, &route_bounds) {
                return Ok(classify_candidates(vec![candidate]));
            }
        }
    }

    let evidence = brave_place_evidence(&request).await.unwrap_or_default();
    for query in &queries {
        let candidates = resolve_query_candidates(
            query,
            &request.countries,
            confidence_for_request(&request),
            evidence.clone(),
        )
        .await
        .unwrap_or_default();
        let candidates = filter_candidates_for_bounds(candidates, &route_bounds);
        let response = classify_candidates(candidates);
        if response.status == "unresolved" {
            continue;
        }
        if response.status == "resolved" {
            if let Some(candidate) = response.candidates.first() {
                let normalized_query = normalized_destination_query(query, &country_codes);
                let _ = db::queries::upsert_place_geocode_cache(
                    pool,
                    &normalized_query,
                    query,
                    &country_codes,
                    &candidate_display_name(candidate),
                    &candidate.source,
                    candidate.coordinates.lat,
                    candidate.coordinates.lng,
                )
                .await;
            }
        }
        return Ok(response);
    }

    Ok(classify_candidates(Vec::new()))
}

pub async fn resolve_destination_coordinates(
    pool: &PgPool,
    destination_label: &str,
    countries: &[String],
) -> Option<PlaceCoordinates> {
    if destination_label.trim().is_empty() {
        return None;
    }

    let country_codes = destination_country_codes(countries);
    for query in destination_queries(destination_label, countries) {
        let normalized_query = normalized_destination_query(&query, &country_codes);
        if let Some(record) = db::queries::find_place_geocode_cache(pool, &normalized_query)
            .await
            .ok()
            .flatten()
        {
            return Some(PlaceCoordinates {
                lat: record.latitude,
                lng: record.longitude,
            });
        }

        let candidate =
            resolve_query_candidates(&query, countries, HIGH_CONFIDENCE_THRESHOLD, Vec::new())
                .await?
                .into_iter()
                .next()?;
        let _ = db::queries::upsert_place_geocode_cache(
            pool,
            &normalized_query,
            &query,
            &country_codes,
            &candidate_display_name(&candidate),
            &candidate.source,
            candidate.coordinates.lat,
            candidate.coordinates.lng,
        )
        .await;
        return Some(candidate.coordinates);
    }

    None
}

fn destination_queries(destination_label: &str, countries: &[String]) -> Vec<String> {
    let country_context = countries.join(" ");
    let full_query = compact_query(&[destination_label, &country_context]);
    let mut queries = destination_label
        .split(['+', '&', '/', ',', ';'])
        .map(str::trim)
        .filter(|part| !part.is_empty())
        .map(|part| compact_query(&[part, &country_context]))
        .collect::<Vec<_>>();
    if !queries.contains(&full_query) {
        queries.push(full_query);
    }
    queries
}

fn compact_query(parts: &[&str]) -> String {
    parts
        .join(" ")
        .split_whitespace()
        .collect::<Vec<_>>()
        .join(" ")
}

fn destination_country_codes(countries: &[String]) -> Vec<String> {
    let mut country_codes = countries
        .iter()
        .filter_map(|country| {
            let normalized = country.trim().to_ascii_lowercase();
            if normalized.len() == 2
                && normalized
                    .chars()
                    .all(|character| character.is_ascii_lowercase())
            {
                return Some(normalized);
            }
            country_code_for_name(&normalized)
        })
        .collect::<Vec<_>>();
    country_codes.sort();
    country_codes.dedup();
    country_codes
}

fn country_code_for_name(value: &str) -> Option<String> {
    match value {
        "china" | "mainland china" | "people's republic of china" => Some("cn".to_string()),
        "hong kong" | "hong kong sar" | "hong kong, china" => Some("hk".to_string()),
        "japan" => Some("jp".to_string()),
        "macau" | "macao" | "macau sar" | "macao sar" => Some("mo".to_string()),
        "singapore" => Some("sg".to_string()),
        "south korea" | "korea" | "republic of korea" => Some("kr".to_string()),
        "taiwan" => Some("tw".to_string()),
        "thailand" => Some("th".to_string()),
        "vietnam" => Some("vn".to_string()),
        _ => None,
    }
}

fn route_candidate_bounds(request: &ResolvePlaceRequest) -> Vec<GeoBounds> {
    let destination = request.destination_label.to_ascii_lowercase();
    let mut bounds = Vec::new();
    if destination.contains("hong kong") {
        bounds.push(GeoBounds {
            min_lat: 21.95,
            max_lat: 22.65,
            min_lng: 113.75,
            max_lng: 114.55,
        });
    }
    if destination.contains("shenzhen") {
        bounds.push(GeoBounds {
            min_lat: 22.35,
            max_lat: 22.9,
            min_lng: 113.65,
            max_lng: 114.7,
        });
    }
    if destination.contains("macau") || destination.contains("macao") {
        bounds.push(GeoBounds {
            min_lat: 22.05,
            max_lat: 22.35,
            min_lng: 113.45,
            max_lng: 113.75,
        });
    }

    for country in destination_country_codes(&request.countries) {
        if let Some(country_bounds) = country_candidate_bounds(&country) {
            bounds.push(country_bounds);
        }
    }
    bounds
}

fn country_candidate_bounds(country_code: &str) -> Option<GeoBounds> {
    match country_code {
        "hk" => Some(GeoBounds {
            min_lat: 21.95,
            max_lat: 22.65,
            min_lng: 113.75,
            max_lng: 114.55,
        }),
        "jp" => Some(GeoBounds {
            min_lat: 24.0,
            max_lat: 46.5,
            min_lng: 122.0,
            max_lng: 146.5,
        }),
        "kr" => Some(GeoBounds {
            min_lat: 33.0,
            max_lat: 39.5,
            min_lng: 124.0,
            max_lng: 132.0,
        }),
        "mo" => Some(GeoBounds {
            min_lat: 22.05,
            max_lat: 22.35,
            min_lng: 113.45,
            max_lng: 113.75,
        }),
        "sg" => Some(GeoBounds {
            min_lat: 1.15,
            max_lat: 1.5,
            min_lng: 103.55,
            max_lng: 104.1,
        }),
        "th" => Some(GeoBounds {
            min_lat: 5.5,
            max_lat: 20.8,
            min_lng: 97.0,
            max_lng: 106.5,
        }),
        "tw" => Some(GeoBounds {
            min_lat: 21.8,
            max_lat: 25.5,
            min_lng: 119.0,
            max_lng: 122.5,
        }),
        "vn" => Some(GeoBounds {
            min_lat: 8.0,
            max_lat: 23.5,
            min_lng: 102.0,
            max_lng: 110.0,
        }),
        _ => None,
    }
}

fn filter_candidates_for_bounds(
    candidates: Vec<PlaceCandidate>,
    bounds: &[GeoBounds],
) -> Vec<PlaceCandidate> {
    if bounds.is_empty() {
        return candidates;
    }
    candidates
        .into_iter()
        .filter(|candidate| candidate_matches_bounds(candidate, bounds))
        .collect()
}

fn candidate_matches_bounds(candidate: &PlaceCandidate, bounds: &[GeoBounds]) -> bool {
    if bounds.is_empty() {
        return true;
    }
    bounds.iter().any(|bounds| {
        candidate.coordinates.lat >= bounds.min_lat
            && candidate.coordinates.lat <= bounds.max_lat
            && candidate.coordinates.lng >= bounds.min_lng
            && candidate.coordinates.lng <= bounds.max_lng
    })
}

fn normalized_destination_query(query: &str, country_codes: &[String]) -> String {
    let mut country_codes = country_codes.to_vec();
    country_codes.sort();
    format!(
        "{}|{}",
        query
            .split_whitespace()
            .collect::<Vec<_>>()
            .join(" ")
            .to_ascii_lowercase(),
        country_codes.join(",")
    )
}

fn candidate_display_name(candidate: &PlaceCandidate) -> String {
    if candidate.address.trim().is_empty() || candidate.address == candidate.name {
        candidate.name.clone()
    } else {
        format!("{}, {}", candidate.name, candidate.address)
    }
}

fn candidate_from_cache(record: PlaceGeocodeCacheRecord) -> PlaceCandidate {
    let name = record
        .display_name
        .split(',')
        .next()
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .unwrap_or(record.display_name.as_str())
        .to_string();
    let coordinates = PlaceCoordinates {
        lat: record.latitude,
        lng: record.longitude,
    };
    PlaceCandidate {
        name,
        address: record.display_name,
        coordinates,
        map_link: osm_map_link(record.latitude, record.longitude),
        confidence: HIGH_CONFIDENCE_THRESHOLD,
        source: format!("cache:{}", record.source),
        evidence: vec![
            format!("cache-query: {}", record.query),
            format!("cache-key: {}", record.normalized_query),
        ],
    }
}

async fn resolve_query_candidates(
    query: &str,
    countries: &[String],
    confidence: f64,
    evidence: Vec<String>,
) -> Option<Vec<PlaceCandidate>> {
    let mut candidates = Vec::new();
    if let Some(nominatim_candidates) =
        nominatim_candidates_for_query(query, countries, confidence, evidence.clone()).await
    {
        candidates.extend(nominatim_candidates);
    }
    if candidates.is_empty() {
        if let Some(geocode_candidates) =
            open_meteo_candidates_for_query(query, countries, HIGH_CONFIDENCE_THRESHOLD).await
        {
            candidates.extend(geocode_candidates);
        }
    }
    (!candidates.is_empty()).then_some(candidates)
}

async fn nominatim_candidates_for_query(
    query: &str,
    countries: &[String],
    confidence: f64,
    evidence: Vec<String>,
) -> Option<Vec<PlaceCandidate>> {
    if query.trim().is_empty() {
        return None;
    }

    wait_for_nominatim_slot().await;

    let client = reqwest::Client::new();
    let base_url = std::env::var("NOMINATIM_BASE_URL")
        .unwrap_or_else(|_| NOMINATIM_DEFAULT_BASE_URL.to_string());
    let url = format!("{}/search", base_url.trim_end_matches('/'));
    let mut params = vec![
        ("format".to_string(), "jsonv2".to_string()),
        ("limit".to_string(), "3".to_string()),
        ("q".to_string(), query.to_string()),
    ];
    let country_codes = nominatim_country_codes(countries);
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
    Some(parse_nominatim_candidates(&raw, confidence, evidence))
}

async fn open_meteo_candidates_for_query(
    query: &str,
    countries: &[String],
    confidence: f64,
) -> Option<Vec<PlaceCandidate>> {
    if query.trim().is_empty() {
        return None;
    }
    let client = reqwest::Client::new();
    let url = format!("{}/search", OPEN_METEO_GEOCODE_BASE_URL);
    let mut params = vec![("name", query), ("count", "3"), ("format", "json")];
    let country_codes = destination_country_codes(countries);
    let country_code = country_codes.first().map(|country| country.to_uppercase());
    if country_codes.len() == 1 {
        if let Some(country_code) = country_code.as_deref() {
            params.push(("countryCode", country_code));
        }
    }

    let response = client
        .get(url)
        .query(&params)
        .header(reqwest::header::USER_AGENT, place_resolution_user_agent())
        .send()
        .await
        .ok()?;
    if !response.status().is_success() {
        return None;
    }

    let raw = response.json::<serde_json::Value>().await.ok()?;
    Some(parse_open_meteo_candidates(&raw, confidence, Vec::new()))
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

fn parse_open_meteo_candidates(
    value: &serde_json::Value,
    confidence: f64,
    evidence: Vec<String>,
) -> Vec<PlaceCandidate> {
    value
        .get("results")
        .and_then(|value| value.as_array())
        .into_iter()
        .flatten()
        .filter_map(|entry| {
            let lat = entry.get("latitude")?.as_f64()?;
            let lng = entry.get("longitude")?.as_f64()?;
            if !(-90.0..=90.0).contains(&lat) || !(-180.0..=180.0).contains(&lng) {
                return None;
            }
            let mut address_parts = [
                entry.get("name").and_then(|value| value.as_str()),
                entry.get("admin1").and_then(|value| value.as_str()),
                entry.get("admin2").and_then(|value| value.as_str()),
                entry.get("country").and_then(|value| value.as_str()),
            ]
            .into_iter()
            .flatten()
            .map(str::trim)
            .filter(|value| !value.is_empty())
            .map(ToString::to_string)
            .collect::<Vec<_>>();
            if address_parts.is_empty() {
                return None;
            }

            let name = address_parts.remove(0);
            let address = address_parts.join(", ");
            let address = if address.is_empty() {
                name.clone()
            } else {
                address
            };
            Some(PlaceCandidate {
                name,
                address,
                coordinates: PlaceCoordinates { lat, lng },
                map_link: osm_map_link(lat, lng),
                confidence,
                source: "open-meteo".to_string(),
                evidence: evidence.clone(),
            })
        })
        .take(3)
        .collect()
}

async fn brave_place_evidence(request: &ResolvePlaceRequest) -> Option<Vec<String>> {
    let api_key = std::env::var("BRAVE_API_KEY").ok()?;
    let query = full_place_query(request);
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

fn place_queries(request: &ResolvePlaceRequest) -> Vec<String> {
    let mut queries = vec![
        compact_query(&[&request.place_hint]),
        compact_query(&[&request.place_hint, &request.destination_label]),
        full_place_query(request),
    ];
    queries.retain(|query| !query.is_empty());
    queries.dedup();
    queries
}

async fn resolved_place_queries(request: &ResolvePlaceRequest) -> Vec<String> {
    merge_place_queries(
        openrouter_place_queries(request).await.unwrap_or_default(),
        place_queries(request),
    )
}

fn merge_place_queries(primary: Vec<String>, fallback: Vec<String>) -> Vec<String> {
    let mut queries = Vec::new();
    for query in primary.into_iter().chain(fallback) {
        let query = compact_query(&[&query]);
        if query.is_empty() || queries.contains(&query) {
            continue;
        }
        queries.push(query);
    }
    queries
}

async fn openrouter_place_queries(request: &ResolvePlaceRequest) -> Option<Vec<String>> {
    let api_key = std::env::var("OPENROUTER_API_KEY")
        .or_else(|_| std::env::var("SAGITTARIUS_OPENROUTER_API_KEY"))
        .ok()?;
    let model = std::env::var("OPENROUTER_MODEL")
        .or_else(|_| std::env::var("SAGITTARIUS_AI_MODEL"))
        .unwrap_or_else(|_| "openai/gpt-5.2".to_string());
    let client = reqwest::Client::new();
    let mut builder = client
        .post(OPENROUTER_CHAT_COMPLETIONS_URL)
        .bearer_auth(api_key)
        .header(reqwest::header::USER_AGENT, place_resolution_user_agent())
        .json(&OpenRouterPlaceQueryRequest {
            model: &model,
            temperature: 0.0,
            response_format: OpenRouterPlaceQueryResponseFormat {
                response_type: "json_object",
            },
            messages: vec![
                OpenRouterPlaceQueryMessage {
                    role: "system",
                    content: "Return strict JSON with a queries array. Build one to three geocoder search queries for the exact travel place. Prefer airport, train station, transit station, landmark, and highlighted place names when they match the input. Stay inside the provided destination and country context, include transit from/to endpoints, place, and location hints when present, and do not invent coordinates.".to_string(),
                },
                OpenRouterPlaceQueryMessage {
                    role: "user",
                    content: openrouter_place_query_prompt(request),
                },
            ],
        });
    if let Ok(site_url) = std::env::var("OPENROUTER_SITE_URL") {
        builder = builder.header("HTTP-Referer", site_url);
    }
    if let Ok(site_name) = std::env::var("OPENROUTER_SITE_NAME") {
        builder = builder.header("X-Title", site_name);
    }
    let response = builder.send().await.ok()?;
    if !response.status().is_success() {
        return None;
    }
    let raw = response.json::<OpenRouterPlaceQueryResponse>().await.ok()?;
    let content = raw.choices.first()?.message.content.as_str();
    parse_openrouter_place_queries(content)
}

fn openrouter_place_query_prompt(request: &ResolvePlaceRequest) -> String {
    format!(
        "activity: {}\nplaceHint: {}\ndestination: {}\ncountries: {}\nday: {}",
        request.activity,
        request.place_hint,
        request.destination_label,
        request.countries.join(", "),
        request.day
    )
}

fn parse_openrouter_place_queries(content: &str) -> Option<Vec<String>> {
    let payload = serde_json::from_str::<OpenRouterPlaceQueryPayload>(content).ok()?;
    let queries = payload
        .queries
        .into_iter()
        .map(|query| compact_query(&[&query]))
        .filter(|query| !query.is_empty())
        .take(3)
        .collect::<Vec<_>>();
    (!queries.is_empty()).then_some(queries)
}

fn full_place_query(request: &ResolvePlaceRequest) -> String {
    compact_query(&[
        &request.activity,
        &request.place_hint,
        &request.destination_label,
    ])
}

fn nominatim_country_codes(countries: &[String]) -> String {
    destination_country_codes(countries).join(",")
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
    fn place_queries_prioritize_explicit_place_hint_before_context() {
        let queries = place_queries(&request());

        assert_eq!(
            queries,
            vec![
                "near Elements".to_string(),
                "near Elements Hong Kong".to_string(),
                "Dim Dim Sum near Elements Hong Kong".to_string(),
            ]
        );
        assert_eq!(nominatim_country_codes(&request().countries), "hk,th");
    }

    #[test]
    fn openrouter_queries_are_merged_before_fallback_queries() {
        let queries = merge_place_queries(
            vec![
                "HKG Hong Kong International Airport".to_string(),
                "Dim Dim Sum near Elements Hong Kong".to_string(),
            ],
            place_queries(&request()),
        );

        assert_eq!(
            queries,
            vec![
                "HKG Hong Kong International Airport".to_string(),
                "Dim Dim Sum near Elements Hong Kong".to_string(),
                "near Elements".to_string(),
                "near Elements Hong Kong".to_string(),
            ]
        );
    }

    #[test]
    fn openrouter_place_query_parser_keeps_three_compact_queries() {
        let queries = parse_openrouter_place_queries(
            r#"{"queries":["  HKG  Hong Kong International Airport  ","Chek Lap Kok Hong Kong","Airport Express Hong Kong","extra"]}"#,
        )
        .unwrap();

        assert_eq!(
            queries,
            vec![
                "HKG Hong Kong International Airport".to_string(),
                "Chek Lap Kok Hong Kong".to_string(),
                "Airport Express Hong Kong".to_string(),
            ]
        );
    }

    #[test]
    fn openrouter_place_query_prompt_preserves_transit_context() {
        let mut request = request();
        request.activity = "Airport transfer from Suvarnabhumi Airport to HKG".to_string();
        request.place_hint = "Hong Kong Airport".to_string();

        let prompt = openrouter_place_query_prompt(&request);

        assert!(prompt.contains("from Suvarnabhumi Airport to HKG"));
        assert!(prompt.contains("placeHint: Hong Kong Airport"));
        assert!(prompt.contains("countries: HK, Thailand"));
    }

    #[test]
    fn confidence_uses_query_specificity() {
        let mut request = request();
        assert_eq!(confidence_for_request(&request), 0.9);

        request.activity = "Cafe".to_string();
        request.place_hint = "nearby".to_string();
        assert_eq!(confidence_for_request(&request), 0.78);
    }

    #[test]
    fn destination_cache_key_normalizes_query_and_country_order() {
        let country_codes = destination_country_codes(&[
            "TH".to_string(),
            "Thailand".to_string(),
            "hk".to_string(),
        ]);

        assert_eq!(country_codes, vec!["hk".to_string(), "th".to_string()]);
        assert_eq!(
            normalized_destination_query(" Bangkok   Thailand ", &country_codes),
            "bangkok thailand|hk,th"
        );
    }

    #[test]
    fn country_names_are_mapped_to_geocoder_codes() {
        assert_eq!(
            destination_country_codes(&[
                "Hong Kong".to_string(),
                "China".to_string(),
                "Thailand".to_string(),
            ]),
            vec!["cn".to_string(), "hk".to_string(), "th".to_string()]
        );
        assert_eq!(
            nominatim_country_codes(&["Hong Kong".to_string(), "China".to_string()]),
            "cn,hk"
        );
    }

    #[test]
    fn compact_delta_routes_reject_candidates_outside_route_bounds() {
        let mut request = request();
        request.destination_label = "Shenzhen, Hong Kong".to_string();
        request.countries = vec![
            "Hong Kong".to_string(),
            "China".to_string(),
            "Thailand".to_string(),
        ];
        let bounds = route_candidate_bounds(&request);
        let shenzhen = PlaceCandidate {
            name: "MOCAPE".to_string(),
            address: "Shenzhen".to_string(),
            coordinates: PlaceCoordinates {
                lat: 22.5485,
                lng: 114.0567,
            },
            map_link: String::new(),
            confidence: 0.9,
            source: "test".to_string(),
            evidence: Vec::new(),
        };
        let europe = PlaceCandidate {
            coordinates: PlaceCoordinates {
                lat: 50.8085,
                lng: -1.1444,
            },
            ..shenzhen.clone()
        };
        let shanghai = PlaceCandidate {
            coordinates: PlaceCoordinates {
                lat: 31.238,
                lng: 121.4729,
            },
            ..shenzhen.clone()
        };
        let bangkok = PlaceCandidate {
            coordinates: PlaceCoordinates {
                lat: 13.69,
                lng: 100.75,
            },
            ..shenzhen.clone()
        };

        assert!(candidate_matches_bounds(&shenzhen, &bounds));
        assert!(candidate_matches_bounds(&bangkok, &bounds));
        assert!(!candidate_matches_bounds(&europe, &bounds));
        assert!(!candidate_matches_bounds(&shanghai, &bounds));
    }

    #[test]
    fn country_bounds_reject_impossible_locations_without_compact_route_label() {
        let mut request = request();
        request.destination_label = "Bangkok".to_string();
        request.countries = vec!["Thailand".to_string()];
        let bounds = route_candidate_bounds(&request);
        let bangkok = PlaceCandidate {
            name: "Airport Rail Link".to_string(),
            address: "Bangkok".to_string(),
            coordinates: PlaceCoordinates {
                lat: 13.7563,
                lng: 100.5018,
            },
            map_link: String::new(),
            confidence: 0.9,
            source: "test".to_string(),
            evidence: Vec::new(),
        };
        let paris = PlaceCandidate {
            coordinates: PlaceCoordinates {
                lat: 48.8566,
                lng: 2.3522,
            },
            ..bangkok.clone()
        };

        assert!(candidate_matches_bounds(&bangkok, &bounds));
        assert!(!candidate_matches_bounds(&paris, &bounds));
    }

    #[test]
    fn destination_queries_split_multi_city_labels_before_full_label() {
        let queries = destination_queries(
            "Hong Kong + Shenzhen",
            &["HK".to_string(), "CN".to_string()],
        );

        assert_eq!(
            queries,
            vec![
                "Hong Kong HK CN".to_string(),
                "Shenzhen HK CN".to_string(),
                "Hong Kong + Shenzhen HK CN".to_string(),
            ]
        );
    }

    #[test]
    fn cached_place_candidate_preserves_coordinates_without_network() {
        let record = PlaceGeocodeCacheRecord {
            normalized_query: "dim dim sum hong kong|hk".to_string(),
            query: "Dim Dim Sum Hong Kong HK".to_string(),
            country_codes: vec!["hk".to_string()],
            display_name: "Dim Dim Sum, Jordan, Hong Kong".to_string(),
            source: "nominatim".to_string(),
            latitude: 22.3051,
            longitude: 114.1722,
        };

        let candidate = candidate_from_cache(record);

        assert_eq!(candidate.name, "Dim Dim Sum");
        assert_eq!(candidate.coordinates.lat, 22.3051);
        assert_eq!(candidate.coordinates.lng, 114.1722);
        assert_eq!(candidate.source, "cache:nominatim");
        assert!(candidate.evidence[0].contains("Dim Dim Sum Hong Kong HK"));
    }

    #[test]
    fn open_meteo_candidates_parse() {
        let raw = serde_json::json!({
            "results": [{
                "name": "Bangkok",
                "admin1": "Bangkok",
                "admin2": "Krung Thep Maha Nakhon",
                "country": "Thailand",
                "latitude": 13.7563,
                "longitude": 100.5018
            }]
        });

        let candidates = parse_open_meteo_candidates(&raw, 0.85, vec![]);
        assert_eq!(candidates.len(), 1);
        assert_eq!(candidates[0].name, "Bangkok");
        assert_eq!(candidates[0].coordinates.lat, 13.7563);
        assert_eq!(candidates[0].coordinates.lng, 100.5018);
        assert_eq!(candidates[0].source, "open-meteo");
    }
}
