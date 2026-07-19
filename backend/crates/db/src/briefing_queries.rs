use time::Date;
use uuid::Uuid;

use crate::PgPool;
use crate::models::TripDailyBriefingRecord;

pub async fn list_trip_daily_briefings(
    pool: &PgPool,
    trip_id: Uuid,
) -> Result<Vec<TripDailyBriefingRecord>, sqlx::Error> {
    sqlx::query_as::<_, TripDailyBriefingRecord>(
        "select distinct on (briefing_date)
           trip_id, briefing_date, location_key, location_label, coordinates,
           weather, holiday, festival, facts, outfit_advice, manual_overrides,
           updated_at, version
         from trip_daily_briefings
         where trip_id = $1
         order by briefing_date, updated_at desc, location_key",
    )
    .bind(trip_id)
    .fetch_all(pool)
    .await
}

pub async fn upsert_trip_daily_briefing_shell(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    trip_id: Uuid,
    briefing_date: Date,
    location_key: &str,
    location_label: &str,
    coordinates: Option<&serde_json::Value>,
) -> Result<TripDailyBriefingRecord, sqlx::Error> {
    sqlx::query_as::<_, TripDailyBriefingRecord>(
        "insert into trip_daily_briefings (
           trip_id, briefing_date, location_key, location_label, coordinates
         )
         values ($1, $2, $3, $4, $5)
         on conflict (trip_id, briefing_date, location_key)
         do update set
           location_label = excluded.location_label,
           coordinates = coalesce(excluded.coordinates, trip_daily_briefings.coordinates)
         returning
           trip_id, briefing_date, location_key, location_label, coordinates,
           weather, holiday, festival, facts, outfit_advice, manual_overrides,
           updated_at, version",
    )
    .bind(trip_id)
    .bind(briefing_date)
    .bind(location_key)
    .bind(location_label)
    .bind(coordinates)
    .fetch_one(&mut **tx)
    .await
}

pub async fn patch_trip_daily_briefing_overrides(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    trip_id: Uuid,
    briefing_date: Date,
    expected_version: i64,
    manual_overrides: &serde_json::Value,
) -> Result<Option<TripDailyBriefingRecord>, sqlx::Error> {
    sqlx::query_as::<_, TripDailyBriefingRecord>(
        "update trip_daily_briefings
         set manual_overrides = $4,
             version = version + 1,
             updated_at = now()
         where id = (
           select id
           from trip_daily_briefings
           where trip_id = $1 and briefing_date = $2
           order by updated_at desc, location_key
           limit 1
         )
           and version = $3
         returning
           trip_id, briefing_date, location_key, location_label, coordinates,
           weather, holiday, festival, facts, outfit_advice, manual_overrides,
           updated_at, version",
    )
    .bind(trip_id)
    .bind(briefing_date)
    .bind(expected_version)
    .bind(manual_overrides)
    .fetch_optional(&mut **tx)
    .await
}

pub async fn update_trip_daily_briefing_weather(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    trip_id: Uuid,
    briefing_date: Date,
    location_key: &str,
    weather: &serde_json::Value,
    outfit_advice: &serde_json::Value,
) -> Result<Option<TripDailyBriefingRecord>, sqlx::Error> {
    sqlx::query_as::<_, TripDailyBriefingRecord>(
        "update trip_daily_briefings
         set weather = $4,
             outfit_advice = $5,
             updated_at = now()
         where trip_id = $1
           and briefing_date = $2
           and location_key = $3
         returning
           trip_id, briefing_date, location_key, location_label, coordinates,
           weather, holiday, festival, facts, outfit_advice, manual_overrides,
           updated_at, version",
    )
    .bind(trip_id)
    .bind(briefing_date)
    .bind(location_key)
    .bind(weather)
    .bind(outfit_advice)
    .fetch_optional(&mut **tx)
    .await
}
