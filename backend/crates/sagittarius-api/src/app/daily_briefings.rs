use std::collections::BTreeMap;

use serde::Deserialize;
use time::{Date, Duration, OffsetDateTime};
use uuid::Uuid;

use crate::app::auth;
use crate::db;
use crate::db::PgPool;
use crate::db::models::{ItineraryItemRecord, TripAuthRecord, TripDailyBriefingRecord};
use crate::domain::capabilities::can;
use crate::domain::errors::ServiceError;
use crate::domain::patches::PatchDailyBriefingRequest;
use crate::domain::types::{
    BriefingCoordinates, BriefingSourceMeta, Capability, DailyBriefingOverrides, TextBriefingBlock,
    TripDailyBriefing, WeatherBriefingBlock,
};

pub async fn list_daily_briefings(
    pool: &PgPool,
    trip_id: Uuid,
    session_token: &str,
) -> Result<Vec<TripDailyBriefing>, ServiceError> {
    let token_hash = auth::hash_session_token(session_token)?;
    let session = db::queries::find_active_member_session(pool, trip_id, &token_hash)
        .await?
        .ok_or(ServiceError::Unauthenticated)?;
    if !can(session.role, Capability::ViewPlan) {
        return Err(ServiceError::Forbidden);
    }

    let trip = db::queries::find_trip_by_id(pool, session.trip_id)
        .await?
        .ok_or(ServiceError::NotFound)?;
    let itinerary_items = db::queries::list_itinerary_items(pool, session.trip_id).await?;
    ensure_briefing_shells(pool, &trip, &itinerary_items).await?;

    let window = briefing_window(trip.start_date, trip.end_date);
    let records = db::queries::list_trip_daily_briefings(pool, session.trip_id).await?;
    Ok(records
        .into_iter()
        .filter(|record| window.contains(&record.briefing_date))
        .map(record_to_summary)
        .collect())
}

pub async fn patch_daily_briefing(
    pool: &PgPool,
    trip_id: Uuid,
    briefing_date: Date,
    session_token: &str,
    request: PatchDailyBriefingRequest,
) -> Result<TripDailyBriefing, ServiceError> {
    request.validate()?;
    let token_hash = auth::hash_session_token(session_token)?;
    let mut tx = pool.begin().await?;
    let session = db::queries::find_active_member_session_in_tx(&mut tx, trip_id, &token_hash)
        .await?
        .ok_or(ServiceError::Unauthenticated)?;
    if !can(session.role, Capability::EditItinerary) {
        return Err(ServiceError::Forbidden);
    }

    let current = db::queries::list_trip_daily_briefings(pool, session.trip_id)
        .await?
        .into_iter()
        .find(|record| record.briefing_date == briefing_date)
        .ok_or(ServiceError::NotFound)?;
    let mut overrides = parse_overrides(current.manual_overrides.clone())?;
    if let Some(value) = request.outfit_advice {
        overrides.outfit_advice = value.map(trim_override);
    }
    if let Some(value) = request.festival_note {
        overrides.festival_note = value.map(trim_override);
    }
    if let Some(value) = request.facts_note {
        overrides.facts_note = value.map(trim_override);
    }
    let overrides_value = serde_json::to_value(&overrides)
        .map_err(|_| ServiceError::InvalidRequest("manual overrides could not be serialized"))?;
    let patched = db::queries::patch_trip_daily_briefing_overrides(
        &mut tx,
        session.trip_id,
        briefing_date,
        request.expected_version,
        &overrides_value,
    )
    .await?
    .ok_or(ServiceError::VersionConflict)?;
    tx.commit().await?;

    Ok(record_to_summary(patched))
}

pub fn briefing_window(start_date: Date, end_date: Date) -> Vec<Date> {
    let mut dates = Vec::new();
    let mut cursor = start_date - Duration::days(1);
    let final_date = end_date + Duration::days(1);
    while cursor <= final_date {
        dates.push(cursor);
        cursor = cursor + Duration::days(1);
    }
    dates
}

async fn ensure_briefing_shells(
    pool: &PgPool,
    trip: &TripAuthRecord,
    itinerary_items: &[ItineraryItemRecord],
) -> Result<(), ServiceError> {
    let by_date = first_item_by_date(itinerary_items);
    let mut shells = Vec::new();
    let mut tx = pool.begin().await?;
    for date in briefing_window(trip.start_date, trip.end_date) {
        let (location_key, location_label, coordinates) =
            location_for_date(trip, by_date.get(&date));
        let shell = db::queries::upsert_trip_daily_briefing_shell(
            &mut tx,
            trip.id,
            date,
            &location_key,
            &location_label,
            coordinates.as_ref(),
        )
        .await?;
        shells.push(shell);
    }
    tx.commit().await?;

    for shell in shells {
        if shell.weather.is_some() {
            continue;
        }
        let Some(coordinates) = shell
            .coordinates
            .clone()
            .and_then(|value| serde_json::from_value::<BriefingCoordinates>(value).ok())
        else {
            continue;
        };
        let Some((weather, outfit_advice)) =
            fetch_open_meteo_weather(shell.briefing_date, &coordinates).await
        else {
            continue;
        };
        let weather_value = serde_json::to_value(&weather)
            .map_err(|_| ServiceError::InvalidRequest("weather could not be serialized"))?;
        let advice_value = serde_json::to_value(&outfit_advice)
            .map_err(|_| ServiceError::InvalidRequest("outfit advice could not be serialized"))?;
        let mut tx = pool.begin().await?;
        db::queries::update_trip_daily_briefing_weather(
            &mut tx,
            shell.trip_id,
            shell.briefing_date,
            &shell.location_key,
            &weather_value,
            &advice_value,
        )
        .await?;
        tx.commit().await?;
    }

    Ok(())
}

fn first_item_by_date(items: &[ItineraryItemRecord]) -> BTreeMap<Date, &ItineraryItemRecord> {
    let mut map = BTreeMap::new();
    for item in items {
        map.entry(item.day).or_insert(item);
    }
    map
}

fn location_for_date(
    trip: &TripAuthRecord,
    item: Option<&&ItineraryItemRecord>,
) -> (String, String, Option<serde_json::Value>) {
    if let Some(item) = item {
        let label = if item.place.trim().is_empty() {
            trip.destination_label.clone()
        } else {
            item.place.clone()
        };
        let coordinates = match (item.latitude, item.longitude) {
            (Some(lat), Some(lng)) => Some(serde_json::json!({ "lat": lat, "lng": lng })),
            _ => None,
        };
        return (format!("itinerary:{}", item.id), label, coordinates);
    }

    (
        format!("destination:{}", trip.destination_label.to_lowercase()),
        trip.destination_label.clone(),
        None,
    )
}

fn record_to_summary(record: TripDailyBriefingRecord) -> TripDailyBriefing {
    TripDailyBriefing {
        trip_id: record.trip_id,
        date: record.briefing_date,
        location_key: record.location_key,
        location_label: record.location_label,
        coordinates: record
            .coordinates
            .and_then(|value| serde_json::from_value::<BriefingCoordinates>(value).ok()),
        weather: record
            .weather
            .and_then(|value| serde_json::from_value::<WeatherBriefingBlock>(value).ok())
            .or_else(|| Some(fallback_weather(record.briefing_date))),
        holiday: record
            .holiday
            .and_then(|value| serde_json::from_value::<TextBriefingBlock>(value).ok()),
        festival: record
            .festival
            .and_then(|value| serde_json::from_value::<TextBriefingBlock>(value).ok()),
        facts: record
            .facts
            .and_then(|value| serde_json::from_value::<TextBriefingBlock>(value).ok()),
        outfit_advice: record
            .outfit_advice
            .and_then(|value| serde_json::from_value::<TextBriefingBlock>(value).ok()),
        manual_overrides: parse_overrides(record.manual_overrides).unwrap_or_default(),
        updated_at: record.updated_at.to_string(),
        version: record.version,
    }
}

fn fallback_weather(date: Date) -> WeatherBriefingBlock {
    WeatherBriefingBlock {
        condition_code: "unavailable".to_string(),
        condition_label: "Forecast pending".to_string(),
        temperature_max_celsius: None,
        temperature_min_celsius: None,
        humidity_percent: None,
        wind_speed_kph: None,
        rain_chance_percent: None,
        meta: BriefingSourceMeta {
            source: "Sagittarius".to_string(),
            source_url: None,
            fetched_at: Some(OffsetDateTime::now_utc().to_string()),
            expires_at: None,
            confidence: "unknown".to_string(),
            unavailable_reason: Some(format!(
                "Weather forecast for {date} has not been fetched yet"
            )),
        },
    }
}

async fn fetch_open_meteo_weather(
    date: Date,
    coordinates: &BriefingCoordinates,
) -> Option<(WeatherBriefingBlock, TextBriefingBlock)> {
    let url = open_meteo_url(date, coordinates);
    let response = reqwest::get(&url).await.ok()?;
    if !response.status().is_success() {
        return None;
    }
    let forecast = response.json::<OpenMeteoForecast>().await.ok()?;
    let daily = forecast.daily;
    let weather_code = daily.weather_code.first().copied()?;
    let high = daily.temperature_2m_max.first().copied().flatten();
    let low = daily.temperature_2m_min.first().copied().flatten();
    let rain_chance = daily
        .precipitation_probability_max
        .first()
        .copied()
        .flatten();
    let wind_speed = daily.wind_speed_10m_max.first().copied().flatten();
    let humidity = forecast
        .hourly
        .and_then(|hourly| average_i32(&hourly.relative_humidity_2m));
    let now = OffsetDateTime::now_utc();
    let expires_at = now + Duration::hours(6);
    let (condition_code, condition_label) = map_weather_code(weather_code);
    let meta = BriefingSourceMeta {
        source: "Open-Meteo".to_string(),
        source_url: Some(url),
        fetched_at: Some(now.to_string()),
        expires_at: Some(expires_at.to_string()),
        confidence: "high".to_string(),
        unavailable_reason: None,
    };
    let weather = WeatherBriefingBlock {
        condition_code: condition_code.to_string(),
        condition_label: condition_label.to_string(),
        temperature_max_celsius: high,
        temperature_min_celsius: low,
        humidity_percent: humidity,
        wind_speed_kph: wind_speed,
        rain_chance_percent: rain_chance,
        meta: meta.clone(),
    };
    let advice = TextBriefingBlock {
        title: "Outfit advice".to_string(),
        body: outfit_advice_for_weather(&weather),
        meta: BriefingSourceMeta {
            source: "Sagittarius".to_string(),
            source_url: None,
            fetched_at: Some(now.to_string()),
            expires_at: Some(expires_at.to_string()),
            confidence: "medium".to_string(),
            unavailable_reason: None,
        },
    };

    Some((weather, advice))
}

fn open_meteo_url(date: Date, coordinates: &BriefingCoordinates) -> String {
    format!(
        "https://api.open-meteo.com/v1/forecast?latitude={:.5}&longitude={:.5}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max&hourly=relative_humidity_2m&timezone=auto&start_date={date}&end_date={date}",
        coordinates.lat, coordinates.lng,
    )
}

fn average_i32(values: &[Option<i32>]) -> Option<i32> {
    let mut count = 0;
    let mut total = 0;
    for value in values.iter().flatten() {
        count += 1;
        total += value;
    }
    (count > 0).then_some(total / count)
}

fn map_weather_code(code: i32) -> (&'static str, &'static str) {
    match code {
        0 => ("sunny", "Sunny"),
        1..=3 => ("partly-cloudy", "Partly cloudy"),
        45 | 48 => ("cloudy", "Foggy"),
        51 | 53 | 55 | 56 | 57 | 61 | 63 | 65 | 66 | 67 | 80 | 81 | 82 => ("rain", "Rain"),
        71 | 73 | 75 | 77 | 85 | 86 => ("snow", "Snow"),
        95..=99 => ("storm", "Storm"),
        _ => ("cloudy", "Cloudy"),
    }
}

fn outfit_advice_for_weather(weather: &WeatherBriefingBlock) -> String {
    let mut advice = Vec::new();
    if weather
        .temperature_max_celsius
        .is_some_and(|temp| temp >= 30.0)
    {
        advice.push("wear light breathable clothes");
    } else if weather
        .temperature_min_celsius
        .is_some_and(|temp| temp <= 16.0)
    {
        advice.push("bring a warm layer");
    } else {
        advice.push("wear comfortable travel layers");
    }
    if weather
        .rain_chance_percent
        .is_some_and(|chance| chance >= 50)
        || matches!(weather.condition_code.as_str(), "rain" | "storm")
    {
        advice.push("pack a compact umbrella");
    }
    if weather.wind_speed_kph.is_some_and(|speed| speed >= 25.0) {
        advice.push("secure hats and loose items");
    }
    format!("{}.", advice.join(", "))
}

#[derive(Debug, Deserialize)]
struct OpenMeteoForecast {
    daily: OpenMeteoDaily,
    hourly: Option<OpenMeteoHourly>,
}

#[derive(Debug, Deserialize)]
struct OpenMeteoDaily {
    weather_code: Vec<i32>,
    temperature_2m_max: Vec<Option<f64>>,
    temperature_2m_min: Vec<Option<f64>>,
    precipitation_probability_max: Vec<Option<i32>>,
    wind_speed_10m_max: Vec<Option<f64>>,
}

#[derive(Debug, Deserialize)]
struct OpenMeteoHourly {
    relative_humidity_2m: Vec<Option<i32>>,
}

fn parse_overrides(value: serde_json::Value) -> Result<DailyBriefingOverrides, ServiceError> {
    serde_json::from_value(value)
        .map_err(|_| ServiceError::InvalidRequest("manual overrides are invalid"))
}

fn trim_override(value: String) -> String {
    value.trim().to_string()
}

#[cfg(test)]
mod tests {
    use super::*;
    use time::Month;

    #[test]
    fn briefing_window_includes_day_before_start_and_day_after_end() {
        let start = Date::from_calendar_date(2026, Month::July, 10).unwrap();
        let end = Date::from_calendar_date(2026, Month::July, 14).unwrap();

        let window = briefing_window(start, end);

        assert_eq!(
            window.first().copied(),
            Some(Date::from_calendar_date(2026, Month::July, 9).unwrap())
        );
        assert_eq!(
            window.last().copied(),
            Some(Date::from_calendar_date(2026, Month::July, 15).unwrap())
        );
        assert_eq!(window.len(), 7);
    }

    #[test]
    fn outfit_advice_responds_to_hot_rainy_weather() {
        let weather = WeatherBriefingBlock {
            condition_code: "rain".to_string(),
            condition_label: "Rain".to_string(),
            temperature_max_celsius: Some(33.0),
            temperature_min_celsius: Some(28.0),
            humidity_percent: Some(82),
            wind_speed_kph: Some(12.0),
            rain_chance_percent: Some(64),
            meta: BriefingSourceMeta {
                source: "Open-Meteo".to_string(),
                source_url: None,
                fetched_at: None,
                expires_at: None,
                confidence: "high".to_string(),
                unavailable_reason: None,
            },
        };

        assert_eq!(
            outfit_advice_for_weather(&weather),
            "wear light breathable clothes, pack a compact umbrella."
        );
    }
}
