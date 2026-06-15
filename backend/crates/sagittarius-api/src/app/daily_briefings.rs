use std::{collections::BTreeMap, env};

use serde::Deserialize;
#[cfg(test)]
use sqlx::types::Json;
use time::format_description::well_known::Rfc3339;
use time::{Date, Duration, OffsetDateTime};
use uuid::Uuid;

use crate::app::auth;
use crate::app::place_resolution::resolve_destination_coordinates;
use crate::db;
use crate::db::PgPool;
use crate::db::models::{ItineraryItemRecord, TripAuthRecord, TripDailyBriefingRecord};
use crate::domain::capabilities::can;
use crate::domain::errors::ServiceError;
use crate::domain::patches::PatchDailyBriefingRequest;
use crate::domain::types::{
    BriefingCoordinates, BriefingSourceMeta, Capability, DailyBriefingOverrides, TextBriefingBlock,
    TripDailyBriefing, TripRole, WeatherBriefingBlock,
};

pub async fn list_daily_briefings(
    pool: &PgPool,
    trip_id: Uuid,
    session_token: &str,
    weather_fetch_enabled: bool,
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
    ensure_briefing_shells(pool, &trip, &itinerary_items, weather_fetch_enabled).await?;

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
    if !can_patch_manual_overrides(session.role) {
        return Err(ServiceError::Forbidden);
    }

    let current = db::queries::list_trip_daily_briefings(pool, session.trip_id)
        .await?
        .into_iter()
        .find(|record| record.briefing_date == briefing_date)
        .ok_or(ServiceError::NotFound)?;
    let mut overrides = parse_overrides(current.manual_overrides.clone())?;
    if let Some(value) = request.day_title {
        overrides.day_title = value.and_then(trim_optional_override);
    }
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
    weather_fetch_enabled: bool,
) -> Result<(), ServiceError> {
    let by_date = first_item_by_date(itinerary_items);
    let destination_coordinates = if let Some(coordinates) = destination_city_coordinates(trip) {
        Some(coordinates)
    } else {
        resolve_destination_coordinates(pool, &trip.destination_label, &trip.countries)
            .await
            .map(
                |coordinates| serde_json::json!({ "lat": coordinates.lat, "lng": coordinates.lng }),
            )
    };
    let mut shells = Vec::new();
    let mut tx = pool.begin().await?;
    for date in briefing_window(trip.start_date, trip.end_date) {
        let (location_key, location_label, coordinates) =
            location_for_date(trip, by_date.get(&date), destination_coordinates.as_ref());
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

    if !weather_fetch_enabled {
        return Ok(());
    }

    let now = OffsetDateTime::now_utc();
    for shell in shells {
        if !weather_needs_refresh(shell.weather.as_ref(), now) {
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
            fetch_weather_for_day(shell.briefing_date, &coordinates).await
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

pub(crate) fn weather_fetch_enabled_from_env() -> bool {
    weather_fetch_enabled_from_value(
        env::var("SAGITTARIUS_DAILY_BRIEFING_WEATHER_FETCH")
            .ok()
            .as_deref(),
    )
}

fn weather_fetch_enabled_from_value(value: Option<&str>) -> bool {
    match value.map(str::trim).map(str::to_ascii_lowercase).as_deref() {
        Some("0" | "false" | "no" | "off") => false,
        Some("1" | "true" | "yes" | "on") => true,
        _ => true,
    }
}

fn first_item_by_date(items: &[ItineraryItemRecord]) -> BTreeMap<Date, &ItineraryItemRecord> {
    let mut map = BTreeMap::new();
    for item in items {
        let current = map.entry(item.day).or_insert(item);
        if current.latitude.is_none() || current.longitude.is_none() {
            if item.latitude.is_some() && item.longitude.is_some() {
                *current = item;
            }
        }
    }
    map
}

fn location_for_date(
    trip: &TripAuthRecord,
    item: Option<&&ItineraryItemRecord>,
    destination_coordinates: Option<&serde_json::Value>,
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
        let coordinates = coordinates.or_else(|| destination_coordinates.cloned());
        return (format!("itinerary:{}", item.id), label, coordinates);
    }

    (
        format!("destination:{}", trip.destination_label.to_lowercase()),
        trip.destination_label.clone(),
        destination_coordinates.cloned(),
    )
}

fn destination_city_coordinates(trip: &TripAuthRecord) -> Option<serde_json::Value> {
    trip.destination_cities
        .0
        .first()
        .map(|city| serde_json::json!({ "lat": city.latitude, "lng": city.longitude }))
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
    let now = OffsetDateTime::now_utc();
    WeatherBriefingBlock {
        condition_code: "unavailable".to_string(),
        condition_label: "Forecast pending".to_string(),
        temperature_max_celsius: None,
        temperature_min_celsius: None,
        apparent_temperature_max_celsius: None,
        apparent_temperature_min_celsius: None,
        sunrise: None,
        sunset: None,
        daylight_duration_seconds: None,
        sunshine_duration_seconds: None,
        uv_index_max: None,
        precipitation_sum_mm: None,
        precipitation_hours: None,
        rain_sum_mm: None,
        humidity_percent: None,
        wind_speed_kph: None,
        wind_gusts_kph: None,
        wind_direction_degrees: None,
        cloud_cover_mean_percent: None,
        visibility_mean_meters: None,
        visibility_min_meters: None,
        dew_point_mean_celsius: None,
        pressure_msl_mean_hpa: None,
        rain_chance_percent: None,
        meta: BriefingSourceMeta {
            source: "Sagittarius".to_string(),
            source_url: None,
            fetched_at: Some(format_briefing_timestamp(now)),
            expires_at: Some(format_briefing_timestamp(now + Duration::hours(1))),
            confidence: "unknown".to_string(),
            unavailable_reason: Some(format!(
                "Weather forecast for {date} has not been fetched yet"
            )),
        },
    }
}

fn format_briefing_timestamp(value: OffsetDateTime) -> String {
    value.format(&Rfc3339).unwrap_or_else(|_| value.to_string())
}

fn weather_needs_refresh(weather: Option<&serde_json::Value>, now: OffsetDateTime) -> bool {
    let Some(weather) = weather else {
        return true;
    };
    let Ok(weather) = serde_json::from_value::<WeatherBriefingBlock>(weather.clone()) else {
        return true;
    };
    if weather.condition_code != "unavailable"
        && (weather.sunrise.is_none() || weather.sunset.is_none())
    {
        return true;
    }
    if weather.condition_code != "unavailable"
        && weather.meta.source == "Open-Meteo"
        && weather.apparent_temperature_max_celsius.is_none()
        && weather.uv_index_max.is_none()
        && weather.wind_gusts_kph.is_none()
    {
        return true;
    }
    let Some(expires_at) = weather.meta.expires_at.as_deref() else {
        return true;
    };
    let Ok(expires_at) = OffsetDateTime::parse(expires_at, &Rfc3339) else {
        return true;
    };
    expires_at <= now
}

async fn fetch_weather_for_day(
    date: Date,
    coordinates: &BriefingCoordinates,
) -> Option<(WeatherBriefingBlock, TextBriefingBlock)> {
    if let Some(result) = fetch_open_meteo_weather(date, coordinates).await {
        return Some(result);
    }
    if let Some(result) = fetch_wttr_weather(date, coordinates).await {
        return Some(result);
    }
    None
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
    let apparent_high = first_f64(&daily.apparent_temperature_max);
    let apparent_low = first_f64(&daily.apparent_temperature_min);
    let sunrise = daily.sunrise.first().cloned().flatten();
    let sunset = daily.sunset.first().cloned().flatten();
    let daylight_duration = first_f64(&daily.daylight_duration);
    let sunshine_duration = first_f64(&daily.sunshine_duration);
    let uv_index = first_f64(&daily.uv_index_max);
    let precipitation_sum = first_f64(&daily.precipitation_sum);
    let precipitation_hours = first_f64(&daily.precipitation_hours);
    let rain_sum = first_f64(&daily.rain_sum);
    let rain_chance = first_i32(&daily.precipitation_probability_max);
    let humidity = first_i32(&daily.relative_humidity_2m_mean);
    let wind_speed = first_f64(&daily.wind_speed_10m_max);
    let wind_gusts = first_f64(&daily.wind_gusts_10m_max);
    let wind_direction = first_i32(&daily.wind_direction_10m_dominant);
    let cloud_cover = first_i32(&daily.cloud_cover_mean);
    let visibility_mean = first_f64(&daily.visibility_mean);
    let visibility_min = first_f64(&daily.visibility_min);
    let dew_point = first_f64(&daily.dew_point_2m_mean);
    let pressure = first_f64(&daily.pressure_msl_mean);
    let now = OffsetDateTime::now_utc();
    let expires_at = now + Duration::hours(6);
    let fetched_at = format_briefing_timestamp(now);
    let expires_at = format_briefing_timestamp(expires_at);
    let (condition_code, condition_label) = map_weather_code(weather_code);
    let meta = BriefingSourceMeta {
        source: "Open-Meteo".to_string(),
        source_url: Some(url),
        fetched_at: Some(fetched_at.clone()),
        expires_at: Some(expires_at.clone()),
        confidence: "high".to_string(),
        unavailable_reason: None,
    };
    let weather = WeatherBriefingBlock {
        condition_code: condition_code.to_string(),
        condition_label: condition_label.to_string(),
        temperature_max_celsius: high,
        temperature_min_celsius: low,
        apparent_temperature_max_celsius: apparent_high,
        apparent_temperature_min_celsius: apparent_low,
        sunrise,
        sunset,
        daylight_duration_seconds: daylight_duration,
        sunshine_duration_seconds: sunshine_duration,
        uv_index_max: uv_index,
        precipitation_sum_mm: precipitation_sum,
        precipitation_hours,
        rain_sum_mm: rain_sum,
        humidity_percent: humidity,
        wind_speed_kph: wind_speed,
        wind_gusts_kph: wind_gusts,
        wind_direction_degrees: wind_direction,
        cloud_cover_mean_percent: cloud_cover,
        visibility_mean_meters: visibility_mean,
        visibility_min_meters: visibility_min,
        dew_point_mean_celsius: dew_point,
        pressure_msl_mean_hpa: pressure,
        rain_chance_percent: rain_chance,
        meta: meta.clone(),
    };
    let advice = TextBriefingBlock {
        title: "Outfit advice".to_string(),
        body: outfit_advice_for_weather(&weather),
        meta: BriefingSourceMeta {
            source: "Sagittarius".to_string(),
            source_url: None,
            fetched_at: Some(fetched_at),
            expires_at: Some(expires_at),
            confidence: "medium".to_string(),
            unavailable_reason: None,
        },
    };

    Some((weather, advice))
}

fn open_meteo_url(date: Date, coordinates: &BriefingCoordinates) -> String {
    format!(
        "https://api.open-meteo.com/v1/forecast?latitude={:.5}&longitude={:.5}&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,sunrise,sunset,daylight_duration,sunshine_duration,uv_index_max,precipitation_sum,precipitation_hours,precipitation_probability_max,rain_sum,wind_speed_10m_max,wind_gusts_10m_max,wind_direction_10m_dominant,cloud_cover_mean,visibility_mean,visibility_min,relative_humidity_2m_mean,dew_point_2m_mean,pressure_msl_mean&timezone=auto&start_date={date}&end_date={date}",
        coordinates.lat, coordinates.lng,
    )
}

fn first_f64(values: &[Option<f64>]) -> Option<f64> {
    values.first().copied().flatten()
}

fn first_i32(values: &[Option<i32>]) -> Option<i32> {
    values.first().copied().flatten()
}

fn wttr_url(coordinates: &BriefingCoordinates) -> String {
    format!(
        "https://wttr.in/{:.4},{:.4}?format=j1",
        coordinates.lat, coordinates.lng
    )
}

fn pick_json_number(value: Option<&serde_json::Value>) -> Option<f64> {
    value.and_then(|value| value.as_f64()).or_else(|| {
        value.and_then(|value| value.as_str().and_then(|value| value.parse::<f64>().ok()))
    })
}

fn pick_json_int(value: Option<&serde_json::Value>) -> Option<i32> {
    value
        .and_then(|value| value.as_i64().and_then(|value| i32::try_from(value).ok()))
        .or_else(|| {
            value
                .and_then(|value| value.as_str())
                .and_then(|value| value.parse::<i32>().ok())
        })
}

fn wttr_condition(
    rain_chance: Option<i32>,
    wind_speed_kph: Option<f64>,
    max_temperature: Option<f64>,
) -> (&'static str, &'static str) {
    if rain_chance.is_some_and(|chance| chance >= 45) {
        ("rain", "Rain")
    } else if wind_speed_kph.is_some_and(|speed| speed >= 35.0) {
        ("storm", "Storm")
    } else if max_temperature.is_some_and(|temperature| temperature >= 30.0) {
        ("sunny", "Sunny")
    } else {
        ("partly-cloudy", "Partly cloudy")
    }
}

async fn fetch_wttr_weather(
    date: Date,
    coordinates: &BriefingCoordinates,
) -> Option<(WeatherBriefingBlock, TextBriefingBlock)> {
    let url = wttr_url(coordinates);
    let response = reqwest::Client::new()
        .get(&url)
        .header(reqwest::header::USER_AGENT, "Sagittarius weather fallback")
        .send()
        .await
        .ok()?;
    if !response.status().is_success() {
        return None;
    }

    let payload = response.json::<serde_json::Value>().await.ok()?;
    let weather_days = payload.get("weather")?.as_array()?;
    let target_date = date.to_string();
    let target = weather_days
        .iter()
        .find(|day| day.get("date").and_then(|value| value.as_str()) == Some(target_date.as_str()))
        .or_else(|| weather_days.first())?;

    let max_temperature = pick_json_number(
        target
            .get("maxtempC")
            .or_else(|| target.get("maxTempC"))
            .or_else(|| target.get("max_temperature")),
    );
    let min_temperature = pick_json_number(
        target
            .get("mintempC")
            .or_else(|| target.get("minTempC"))
            .or_else(|| target.get("min_temperature")),
    );
    let wind_speed_kph = pick_json_number(
        target
            .get("windspeedKmph")
            .or_else(|| target.get("windSpeedKmph"))
            .or_else(|| target.get("windspeed")),
    );
    let hourly_rain = target.get("hourly").and_then(|hourly| {
        let values = hourly
            .as_array()?
            .iter()
            .filter_map(|hour| {
                pick_json_int(
                    hour.get("chanceofrain")
                        .or_else(|| hour.get("chanceOfRain"))
                        .or_else(|| hour.get("chanceofsnow")),
                )
            })
            .collect::<Vec<_>>();
        (values.len() > 0).then_some(values.iter().sum::<i32>() / values.len() as i32)
    });
    let rain_chance = hourly_rain
        .or_else(|| pick_json_int(target.get("hourly")?.get(0)?.get("chanceofrain")))
        .or_else(|| pick_json_int(target.get("chanceofrain")));

    let humidity = target.get("hourly").and_then(|hourly| {
        let values = hourly
            .as_array()?
            .iter()
            .filter_map(|hour| {
                pick_json_int(
                    hour.get("humidity")
                        .or_else(|| hour.get("relative_humidity_2m")),
                )
            })
            .collect::<Vec<_>>();
        (values.len() > 0).then_some(values.iter().sum::<i32>() / values.len() as i32)
    });

    let now = OffsetDateTime::now_utc();
    let expires_at = now + Duration::hours(6);
    let fetched_at = format_briefing_timestamp(now);
    let expires_at = format_briefing_timestamp(expires_at);
    let (condition_code, condition_label) =
        wttr_condition(rain_chance, wind_speed_kph, max_temperature);

    let meta = BriefingSourceMeta {
        source: "wttr.in".to_string(),
        source_url: Some(url),
        fetched_at: Some(fetched_at.clone()),
        expires_at: Some(expires_at.clone()),
        confidence: "medium".to_string(),
        unavailable_reason: None,
    };
    let weather = WeatherBriefingBlock {
        condition_code: condition_code.to_string(),
        condition_label: condition_label.to_string(),
        temperature_max_celsius: max_temperature,
        temperature_min_celsius: min_temperature,
        apparent_temperature_max_celsius: None,
        apparent_temperature_min_celsius: None,
        sunrise: None,
        sunset: None,
        daylight_duration_seconds: None,
        sunshine_duration_seconds: None,
        uv_index_max: None,
        precipitation_sum_mm: None,
        precipitation_hours: None,
        rain_sum_mm: None,
        humidity_percent: humidity,
        wind_speed_kph,
        wind_gusts_kph: None,
        wind_direction_degrees: None,
        cloud_cover_mean_percent: None,
        visibility_mean_meters: None,
        visibility_min_meters: None,
        dew_point_mean_celsius: None,
        pressure_msl_mean_hpa: None,
        rain_chance_percent: rain_chance,
        meta: meta.clone(),
    };
    let advice = TextBriefingBlock {
        title: "Outfit advice".to_string(),
        body: outfit_advice_for_weather(&weather),
        meta: BriefingSourceMeta {
            source: "Sagittarius".to_string(),
            source_url: None,
            fetched_at: Some(fetched_at),
            expires_at: Some(expires_at),
            confidence: "medium".to_string(),
            unavailable_reason: None,
        },
    };

    Some((weather, advice))
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
}

#[derive(Debug, Deserialize)]
struct OpenMeteoDaily {
    weather_code: Vec<i32>,
    temperature_2m_max: Vec<Option<f64>>,
    temperature_2m_min: Vec<Option<f64>>,
    apparent_temperature_max: Vec<Option<f64>>,
    apparent_temperature_min: Vec<Option<f64>>,
    sunrise: Vec<Option<String>>,
    sunset: Vec<Option<String>>,
    daylight_duration: Vec<Option<f64>>,
    sunshine_duration: Vec<Option<f64>>,
    uv_index_max: Vec<Option<f64>>,
    precipitation_sum: Vec<Option<f64>>,
    precipitation_hours: Vec<Option<f64>>,
    precipitation_probability_max: Vec<Option<i32>>,
    rain_sum: Vec<Option<f64>>,
    wind_speed_10m_max: Vec<Option<f64>>,
    wind_gusts_10m_max: Vec<Option<f64>>,
    wind_direction_10m_dominant: Vec<Option<i32>>,
    cloud_cover_mean: Vec<Option<i32>>,
    visibility_mean: Vec<Option<f64>>,
    visibility_min: Vec<Option<f64>>,
    relative_humidity_2m_mean: Vec<Option<i32>>,
    dew_point_2m_mean: Vec<Option<f64>>,
    pressure_msl_mean: Vec<Option<f64>>,
}

fn parse_overrides(value: serde_json::Value) -> Result<DailyBriefingOverrides, ServiceError> {
    serde_json::from_value(value)
        .map_err(|_| ServiceError::InvalidRequest("manual overrides are invalid"))
}

fn trim_override(value: String) -> String {
    value.trim().to_string()
}

fn trim_optional_override(value: String) -> Option<String> {
    let trimmed = value.trim().to_string();
    if trimmed.is_empty() {
        None
    } else {
        Some(trimmed)
    }
}

fn can_patch_manual_overrides(role: TripRole) -> bool {
    matches!(role, TripRole::Owner | TripRole::Organizer)
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
    fn open_meteo_url_requests_sunrise_and_sunset_daily_fields() {
        let date = Date::from_calendar_date(2026, Month::July, 10).unwrap();
        let coordinates = BriefingCoordinates {
            lat: 22.3193,
            lng: 114.1694,
        };

        let url = open_meteo_url(date, &coordinates);

        for field in [
            "sunrise",
            "sunset",
            "apparent_temperature_max",
            "uv_index_max",
            "precipitation_probability_max",
            "wind_gusts_10m_max",
            "visibility_min",
        ] {
            assert!(
                url.contains(field),
                "missing Open-Meteo daily field {field}"
            );
        }
        assert!(url.contains("timezone=auto"));
    }

    #[test]
    fn outfit_advice_responds_to_hot_rainy_weather() {
        let weather = WeatherBriefingBlock {
            condition_code: "rain".to_string(),
            condition_label: "Rain".to_string(),
            temperature_max_celsius: Some(33.0),
            temperature_min_celsius: Some(28.0),
            apparent_temperature_max_celsius: Some(37.0),
            apparent_temperature_min_celsius: Some(31.0),
            sunrise: Some("2026-07-10T05:46".to_string()),
            sunset: Some("2026-07-10T18:47".to_string()),
            daylight_duration_seconds: Some(46_860.0),
            sunshine_duration_seconds: Some(18_000.0),
            uv_index_max: Some(8.1),
            precipitation_sum_mm: Some(12.4),
            precipitation_hours: Some(4.0),
            rain_sum_mm: Some(11.8),
            humidity_percent: Some(82),
            wind_speed_kph: Some(12.0),
            wind_gusts_kph: Some(28.0),
            wind_direction_degrees: Some(188),
            cloud_cover_mean_percent: Some(80),
            visibility_mean_meters: Some(8_000.0),
            visibility_min_meters: Some(2_000.0),
            dew_point_mean_celsius: Some(25.1),
            pressure_msl_mean_hpa: Some(1008.0),
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

    #[test]
    fn weather_cache_refreshes_only_when_missing_invalid_or_expired() {
        let now = OffsetDateTime::now_utc();
        let fresh_weather = serde_json::json!({
            "conditionCode": "rain",
            "conditionLabel": "Rain",
            "temperatureMaxCelsius": 28.0,
            "temperatureMinCelsius": 24.5,
            "apparentTemperatureMaxCelsius": 33.0,
            "apparentTemperatureMinCelsius": 29.0,
            "sunrise": "2026-06-18T05:39",
            "sunset": "2026-06-18T19:09",
            "daylightDurationSeconds": 48590.03,
            "sunshineDurationSeconds": 5740.03,
            "uvIndexMax": 1.6,
            "precipitationSumMm": 19.8,
            "precipitationHours": 24.0,
            "rainSumMm": 10.4,
            "humidityPercent": 96,
            "windSpeedKph": 18.2,
            "windGustsKph": 43.6,
            "windDirectionDegrees": 188,
            "cloudCoverMeanPercent": 100,
            "visibilityMeanMeters": 4569.17,
            "visibilityMinMeters": 1900.0,
            "dewPointMeanCelsius": 24.7,
            "pressureMslMeanHpa": 1009.7,
            "rainChancePercent": 98,
            "meta": {
                "source": "Open-Meteo",
                "sourceUrl": "https://api.open-meteo.com/v1/forecast",
                "fetchedAt": format_briefing_timestamp(now),
                "expiresAt": format_briefing_timestamp(now + Duration::hours(6)),
                "confidence": "high",
                "unavailableReason": null
            }
        });
        let expired_weather = serde_json::json!({
            "conditionCode": "rain",
            "conditionLabel": "Rain",
            "temperatureMaxCelsius": 28.0,
            "temperatureMinCelsius": 24.5,
            "sunrise": "2026-06-18T05:39",
            "sunset": "2026-06-18T19:09",
            "humidityPercent": 96,
            "windSpeedKph": 18.2,
            "rainChancePercent": 98,
            "meta": {
                "source": "Open-Meteo",
                "sourceUrl": "https://api.open-meteo.com/v1/forecast",
                "fetchedAt": format_briefing_timestamp(now - Duration::hours(12)),
                "expiresAt": format_briefing_timestamp(now - Duration::minutes(1)),
                "confidence": "high",
                "unavailableReason": null
            }
        });

        assert!(!weather_needs_refresh(Some(&fresh_weather), now));
        assert!(weather_needs_refresh(Some(&expired_weather), now));
        assert!(weather_needs_refresh(None, now));
        assert!(weather_needs_refresh(
            Some(&serde_json::json!({ "meta": { "expiresAt": "not a timestamp" } })),
            now,
        ));
        assert!(weather_needs_refresh(
            Some(&serde_json::json!({
                "conditionCode": "rain",
                "conditionLabel": "Rain",
                "temperatureMaxCelsius": 28.0,
                "temperatureMinCelsius": 24.5,
                "sunrise": null,
                "sunset": null,
                "humidityPercent": 96,
                "windSpeedKph": 18.2,
                "rainChancePercent": 98,
                "meta": {
                    "source": "Open-Meteo",
                    "sourceUrl": "https://api.open-meteo.com/v1/forecast",
                    "fetchedAt": format_briefing_timestamp(now),
                    "expiresAt": format_briefing_timestamp(now + Duration::hours(6)),
                    "confidence": "high",
                    "unavailableReason": null
                }
            })),
            now,
        ));
        assert!(weather_needs_refresh(
            Some(&serde_json::json!({
                "conditionCode": "rain",
                "conditionLabel": "Rain",
                "temperatureMaxCelsius": 28.0,
                "temperatureMinCelsius": 24.5,
                "sunrise": "2026-06-18T05:39",
                "sunset": "2026-06-18T19:09",
                "humidityPercent": 96,
                "windSpeedKph": 18.2,
                "rainChancePercent": 98,
                "meta": {
                    "source": "Open-Meteo",
                    "sourceUrl": "https://api.open-meteo.com/v1/forecast",
                    "fetchedAt": format_briefing_timestamp(now),
                    "expiresAt": format_briefing_timestamp(now + Duration::hours(6)),
                    "confidence": "high",
                    "unavailableReason": null
                }
            })),
            now,
        ));
    }

    #[test]
    fn fallback_weather_is_cached_briefly() {
        let date = Date::from_calendar_date(2026, Month::June, 18).unwrap();
        let weather = serde_json::to_value(fallback_weather(date)).unwrap();

        assert!(!weather_needs_refresh(
            Some(&weather),
            OffsetDateTime::now_utc()
        ));
    }

    #[test]
    fn first_item_by_date_prefers_coordinate_location() {
        let date = Date::from_calendar_date(2026, Month::July, 10).unwrap();
        let next_date = Date::from_calendar_date(2026, Month::July, 11).unwrap();
        let fallback_trip_id = uuid::Uuid::from_u128(1);
        let fallback_plan_id = uuid::Uuid::from_u128(2);
        let empty_advisories = serde_json::json!([]);
        let items = vec![
            ItineraryItemRecord {
                id: uuid::Uuid::from_u128(10),
                trip_id: fallback_trip_id,
                plan_variant_id: fallback_plan_id,
                path_group_id: None,
                path_id: None,
                path_name: None,
                path_role: None,
                parent_item_id: None,
                item_kind: "travel".to_string(),
                time_mode: "scheduled".to_string(),
                is_plan_block: false,
                status: "planned".to_string(),
                priority: "normal".to_string(),
                day: date,
                sort_order: 1,
                start_time: "08:00".to_string(),
                end_time: None,
                end_offset_days: 0,
                activity: "Start".to_string(),
                activity_type: "travel".to_string(),
                activity_subtype: None,
                place: "No-coord stop".to_string(),
                link_label: String::new(),
                map_link: String::new(),
                address: None,
                latitude: None,
                longitude: None,
                duration_minutes: Some(30),
                transportation: "walk".to_string(),
                details: serde_json::json!({}),
                advisories: empty_advisories.clone(),
                note: String::new(),
                created_by: uuid::Uuid::from_u128(3),
                updated_at: "2026-06-06T00:00:00Z".to_string(),
                version: 1,
            },
            ItineraryItemRecord {
                id: uuid::Uuid::from_u128(11),
                trip_id: fallback_trip_id,
                plan_variant_id: fallback_plan_id,
                path_group_id: None,
                path_id: None,
                path_name: None,
                path_role: None,
                parent_item_id: None,
                item_kind: "activity".to_string(),
                time_mode: "scheduled".to_string(),
                is_plan_block: false,
                status: "planned".to_string(),
                priority: "normal".to_string(),
                day: date,
                sort_order: 2,
                start_time: "09:00".to_string(),
                end_time: None,
                end_offset_days: 0,
                activity: "Museum".to_string(),
                activity_type: "visit".to_string(),
                activity_subtype: None,
                place: "Geo stop".to_string(),
                link_label: String::new(),
                map_link: String::new(),
                address: None,
                latitude: Some(13.7),
                longitude: Some(100.5),
                duration_minutes: Some(45),
                transportation: "walk".to_string(),
                details: serde_json::json!({}),
                advisories: empty_advisories,
                note: String::new(),
                created_by: uuid::Uuid::from_u128(4),
                updated_at: "2026-06-06T00:00:00Z".to_string(),
                version: 1,
            },
            ItineraryItemRecord {
                id: uuid::Uuid::from_u128(12),
                trip_id: fallback_trip_id,
                plan_variant_id: fallback_plan_id,
                path_group_id: None,
                path_id: None,
                path_name: None,
                path_role: None,
                parent_item_id: None,
                item_kind: "activity".to_string(),
                time_mode: "scheduled".to_string(),
                is_plan_block: false,
                status: "planned".to_string(),
                priority: "normal".to_string(),
                day: next_date,
                sort_order: 1,
                start_time: "10:00".to_string(),
                end_time: None,
                end_offset_days: 0,
                activity: "No-coord".to_string(),
                activity_type: "visit".to_string(),
                activity_subtype: None,
                place: "Fallback stop".to_string(),
                link_label: String::new(),
                map_link: String::new(),
                address: None,
                latitude: Some(13.8),
                longitude: Some(100.6),
                duration_minutes: Some(60),
                transportation: "walk".to_string(),
                details: serde_json::json!({}),
                advisories: serde_json::json!([]),
                note: String::new(),
                created_by: uuid::Uuid::from_u128(5),
                updated_at: "2026-06-06T00:00:00Z".to_string(),
                version: 1,
            },
        ];

        let first_by_date = first_item_by_date(&items);

        let date_item = first_by_date.get(&date).expect("should keep day entry");
        assert_eq!(date_item.place, "Geo stop");
        assert_eq!(date_item.latitude, Some(13.7));
        assert_eq!(date_item.longitude, Some(100.5));
    }

    #[test]
    fn weather_fetch_env_gate_defaults_on_and_accepts_false_values() {
        assert!(weather_fetch_enabled_from_value(None));
        assert!(weather_fetch_enabled_from_value(Some("true")));
        assert!(weather_fetch_enabled_from_value(Some("1")));
        assert!(!weather_fetch_enabled_from_value(Some("false")));
        assert!(!weather_fetch_enabled_from_value(Some("0")));
        assert!(!weather_fetch_enabled_from_value(Some("off")));
    }

    #[test]
    fn location_for_date_falls_back_to_destination_coordinates_when_item_has_no_coordinates() {
        let trip = TripAuthRecord {
            id: uuid::Uuid::from_u128(1),
            name: "Fallback Trip".to_string(),
            origin_label: "Bangkok, Thailand".to_string(),
            origin_city: "Bangkok".to_string(),
            origin_country: "Thailand".to_string(),
            origin_country_code: "TH".to_string(),
            destination_label: "Bangkok".to_string(),
            destination_cities: Json(vec![crate::domain::types::TripCity {
                city: "Bangkok".to_string(),
                country: "Thailand".to_string(),
                country_code: "TH".to_string(),
                timezone: "Asia/Bangkok".to_string(),
                latitude: 13.7563,
                longitude: 100.5018,
            }]),
            countries: vec!["TH".to_string()],
            party_size: 2,
            default_timezone: "Asia/Bangkok".to_string(),
            start_date: Date::from_calendar_date(2026, Month::July, 10).unwrap(),
            end_date: Date::from_calendar_date(2026, Month::July, 12).unwrap(),
            join_id: "JOIN".to_string(),
            join_password_hash: "hash".to_string(),
            active_plan_variant_id: None,
            owner_member_id: uuid::Uuid::from_u128(2),
            version: 1,
        };
        let item = ItineraryItemRecord {
            id: uuid::Uuid::from_u128(3),
            trip_id: trip.id,
            plan_variant_id: trip.id,
            path_group_id: None,
            path_id: None,
            path_name: None,
            path_role: None,
            parent_item_id: None,
            item_kind: "meal".to_string(),
            time_mode: "scheduled".to_string(),
            is_plan_block: false,
            status: "planned".to_string(),
            priority: "normal".to_string(),
            day: Date::from_calendar_date(2026, Month::July, 10).unwrap(),
            sort_order: 1,
            start_time: "08:00".to_string(),
            end_time: None,
            end_offset_days: 0,
            activity: "Breakfast".to_string(),
            activity_type: "meal".to_string(),
            activity_subtype: None,
            place: "Some place".to_string(),
            link_label: String::new(),
            map_link: String::new(),
            address: None,
            latitude: None,
            longitude: None,
            duration_minutes: Some(60),
            transportation: "walk".to_string(),
            details: serde_json::json!({}),
            advisories: serde_json::json!([]),
            note: String::new(),
            created_by: uuid::Uuid::from_u128(4),
            updated_at: "2026-06-06T00:00:00Z".to_string(),
            version: 1,
        };

        let destination_coords = serde_json::json!({ "lat": 13.7563, "lng": 100.5018 });
        let (key, label, coordinates) =
            location_for_date(&trip, Some(&&item), Some(&destination_coords));
        assert_eq!(key, format!("itinerary:{}", item.id));
        assert_eq!(label, "Some place");
        assert_eq!(coordinates, Some(destination_coords.clone()));

        let (fallback_key, fallback_label, fallback_coordinates) =
            location_for_date(&trip, None, Some(&destination_coords));
        assert_eq!(fallback_key, "destination:bangkok");
        assert_eq!(fallback_label, "Bangkok");
        assert_eq!(fallback_coordinates, Some(destination_coords));
    }
}
