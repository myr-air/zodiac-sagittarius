use crate::PgPool;
use crate::models::PlaceGeocodeCacheRecord;

pub async fn find_place_geocode_cache(
    pool: &PgPool,
    normalized_query: &str,
) -> Result<Option<PlaceGeocodeCacheRecord>, sqlx::Error> {
    sqlx::query_as::<_, PlaceGeocodeCacheRecord>(
        "select
           normalized_query, query, country_codes, display_name, source,
           latitude::float8 as latitude, longitude::float8 as longitude
         from place_geocode_cache
         where normalized_query = $1",
    )
    .bind(normalized_query)
    .fetch_optional(pool)
    .await
}

pub async fn upsert_place_geocode_cache(
    pool: &PgPool,
    normalized_query: &str,
    query: &str,
    country_codes: &[String],
    display_name: &str,
    source: &str,
    latitude: f64,
    longitude: f64,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        "insert into place_geocode_cache (
           normalized_query, query, country_codes, display_name, source, latitude, longitude
         )
         values ($1, $2, $3, $4, $5, $6, $7)
         on conflict (normalized_query)
         do update set
           query = excluded.query,
           country_codes = excluded.country_codes,
           display_name = excluded.display_name,
           source = excluded.source,
           latitude = excluded.latitude,
           longitude = excluded.longitude,
           updated_at = now()",
    )
    .bind(normalized_query)
    .bind(query)
    .bind(country_codes)
    .bind(display_name)
    .bind(source)
    .bind(latitude)
    .bind(longitude)
    .execute(pool)
    .await?;

    Ok(())
}
