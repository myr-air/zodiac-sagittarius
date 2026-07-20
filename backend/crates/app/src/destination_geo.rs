use sagittarius_domain::types::TripCity;

const OPEN_METEO_GEOCODE_URL: &str = "https://geocoding-api.open-meteo.com/v1/search";
const GEOCODE_TIMEOUT: std::time::Duration = std::time::Duration::from_secs(3);

/// Result of filling destination cities/countries from a free-text destination label.
#[derive(Debug, Clone, PartialEq)]
pub struct DestinationGeoFill {
    pub cities: Vec<TripCity>,
    pub countries: Vec<String>,
}

/// Best-effort resolve destination geo from a label **without** inventing Thailand defaults.
///
/// On miss: keeps the label as the city name and leaves country/code/timezone empty
/// (unknown/neutral). Lat/lng stay unresolved at `0.0`.
pub async fn fill_destination_geo_from_label(label: &str) -> DestinationGeoFill {
    let label = label.trim();
    if label.is_empty() {
        return neutral_fill(label);
    }

    match resolve_open_meteo(label).await {
        Some(hit) => DestinationGeoFill {
            cities: vec![TripCity {
                city: label.to_string(),
                country: hit.country,
                country_code: hit.country_code,
                timezone: hit.timezone,
                latitude: hit.latitude,
                longitude: hit.longitude,
            }],
            countries: if hit.country_for_list.is_empty() {
                Vec::new()
            } else {
                vec![hit.country_for_list]
            },
        },
        None => neutral_fill(label),
    }
}

fn neutral_fill(label: &str) -> DestinationGeoFill {
    DestinationGeoFill {
        cities: vec![TripCity {
            city: label.to_string(),
            country: String::new(),
            country_code: String::new(),
            timezone: String::new(),
            latitude: 0.0,
            longitude: 0.0,
        }],
        countries: Vec::new(),
    }
}

struct ResolvedGeo {
    country: String,
    country_for_list: String,
    country_code: String,
    timezone: String,
    latitude: f64,
    longitude: f64,
}

async fn resolve_open_meteo(label: &str) -> Option<ResolvedGeo> {
    let client = reqwest::Client::builder()
        .timeout(GEOCODE_TIMEOUT)
        .build()
        .ok()?;

    let response = client
        .get(OPEN_METEO_GEOCODE_URL)
        .query(&[
            ("name", label),
            ("count", "1"),
            ("format", "json"),
            ("language", "en"),
        ])
        .header(
            reqwest::header::USER_AGENT,
            "sagittarius-destination-geo/0.1",
        )
        .send()
        .await
        .ok()?;

    if !response.status().is_success() {
        return None;
    }

    let raw = response.json::<serde_json::Value>().await.ok()?;
    let entry = raw.get("results")?.as_array()?.first()?;

    let latitude = entry.get("latitude")?.as_f64()?;
    let longitude = entry.get("longitude")?.as_f64()?;
    if !(-90.0..=90.0).contains(&latitude) || !(-180.0..=180.0).contains(&longitude) {
        return None;
    }

    let country = entry
        .get("country")
        .and_then(|value| value.as_str())
        .unwrap_or("")
        .trim()
        .to_string();
    let country_code = entry
        .get("country_code")
        .and_then(|value| value.as_str())
        .unwrap_or("")
        .trim()
        .to_ascii_uppercase();
    let timezone = entry
        .get("timezone")
        .and_then(|value| value.as_str())
        .unwrap_or("")
        .trim()
        .to_string();

    Some(ResolvedGeo {
        country_for_list: country.clone(),
        country,
        country_code,
        timezone,
        latitude,
        longitude,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn neutral_fill_keeps_label_without_thailand() {
        let fill = neutral_fill("Somewhere");
        assert_eq!(fill.cities.len(), 1);
        assert_eq!(fill.cities[0].city, "Somewhere");
        assert_eq!(fill.cities[0].country, "");
        assert_eq!(fill.cities[0].country_code, "");
        assert_eq!(fill.cities[0].timezone, "");
        assert_eq!(fill.cities[0].latitude, 0.0);
        assert_eq!(fill.cities[0].longitude, 0.0);
        assert!(fill.countries.is_empty());
    }
}
