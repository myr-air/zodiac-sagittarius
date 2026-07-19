use sqlx::FromRow;

#[derive(Debug, Clone, FromRow)]
pub struct PlaceGeocodeCacheRecord {
    pub normalized_query: String,
    pub query: String,
    pub country_codes: Vec<String>,
    pub display_name: String,
    pub source: String,
    pub latitude: f64,
    pub longitude: f64,
}

