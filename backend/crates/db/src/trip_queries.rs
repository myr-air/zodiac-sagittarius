use uuid::Uuid;

use crate::PgPool;
use crate::models::{NewPlanVariant, PlanVariantRecord, TripAuthRecord};

pub async fn find_trip_by_join_id(
    pool: &PgPool,
    join_id: &str,
) -> Result<Option<TripAuthRecord>, sqlx::Error> {
    sqlx::query_as::<_, TripAuthRecord>(
        "select
           id, name, origin_label, origin_city, origin_country, origin_country_code,
           destination_label, destination_cities, countries, party_size, default_timezone,
           start_date, end_date, join_id, join_password_hash,
           main_trip_plan_id, owner_member_id, version
         from trips
         where join_id = $1 and deleted_at is null",
    )
    .bind(join_id)
    .fetch_optional(pool)
    .await
}

pub async fn find_trip_by_id(
    pool: &PgPool,
    trip_id: Uuid,
) -> Result<Option<TripAuthRecord>, sqlx::Error> {
    sqlx::query_as::<_, TripAuthRecord>(
        "select
           id, name, origin_label, origin_city, origin_country, origin_country_code,
           destination_label, destination_cities, countries, party_size, default_timezone,
           start_date, end_date, join_id, join_password_hash,
           main_trip_plan_id, owner_member_id, version
         from trips
         where id = $1 and deleted_at is null",
    )
    .bind(trip_id)
    .fetch_optional(pool)
    .await
}

pub async fn lock_trip(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    trip_id: Uuid,
) -> Result<Option<TripAuthRecord>, sqlx::Error> {
    sqlx::query_as::<_, TripAuthRecord>(
        "select
           id, name, origin_label, origin_city, origin_country, origin_country_code,
           destination_label, destination_cities, countries, party_size, default_timezone,
           start_date, end_date, join_id, join_password_hash,
           main_trip_plan_id, owner_member_id, version
         from trips
         where id = $1 and deleted_at is null
         for update",
    )
    .bind(trip_id)
    .fetch_optional(&mut **tx)
    .await
}

pub async fn update_trip_metadata(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    trip_id: Uuid,
    patch: &sagittarius_domain::patches::PatchTripRequest,
    version: i64,
) -> Result<Option<TripAuthRecord>, sqlx::Error> {
    sqlx::query_as::<_, TripAuthRecord>(
        "update trips
         set name = coalesce($2, name),
             destination_label = coalesce($3, destination_label),
             countries = coalesce($4, countries),
             start_date = coalesce($5, start_date),
             end_date = coalesce($6, end_date),
             main_trip_plan_id = coalesce($7, main_trip_plan_id),
             party_size = coalesce($8, party_size),
             default_timezone = coalesce($9, default_timezone),
             version = $10,
             updated_at = now()
         where id = $1 and deleted_at is null
         returning
           id, name, origin_label, origin_city, origin_country, origin_country_code,
           destination_label, destination_cities, countries, party_size, default_timezone,
           start_date, end_date, join_id, join_password_hash,
           main_trip_plan_id, owner_member_id, version",
    )
    .bind(trip_id)
    .bind(patch.name.as_deref())
    .bind(patch.destination_label.as_deref())
    .bind(patch.countries.as_ref())
    .bind(patch.start_date)
    .bind(patch.end_date)
    .bind(patch.main_trip_plan_id.or(patch.active_plan_variant_id))
    .bind(patch.party_size)
    .bind(patch.default_timezone.as_deref())
    .bind(version)
    .fetch_optional(&mut **tx)
    .await
}

pub async fn update_trip_active_plan_variant(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    trip_id: Uuid,
    active_plan_variant_id: Uuid,
    version: i64,
) -> Result<Option<TripAuthRecord>, sqlx::Error> {
    sqlx::query_as::<_, TripAuthRecord>(
        "update trips
         set main_trip_plan_id = $2,
             version = $3,
             updated_at = now()
         where id = $1 and deleted_at is null
         returning
           id, name, origin_label, origin_city, origin_country, origin_country_code,
           destination_label, destination_cities, countries, party_size, default_timezone,
           start_date, end_date, join_id, join_password_hash,
           main_trip_plan_id, owner_member_id, version",
    )
    .bind(trip_id)
    .bind(active_plan_variant_id)
    .bind(version)
    .fetch_optional(&mut **tx)
    .await
}

pub async fn list_plan_variants(
    pool: &PgPool,
    trip_id: Uuid,
) -> Result<Vec<PlanVariantRecord>, sqlx::Error> {
    sqlx::query_as::<_, PlanVariantRecord>(
        "select id, trip_id, name, status, description, version
         from trip_plans
         where trip_id = $1
         order by created_at, name",
    )
    .bind(trip_id)
    .fetch_all(pool)
    .await
}

pub async fn lock_plan_variant(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    plan_variant_id: Uuid,
) -> Result<Option<PlanVariantRecord>, sqlx::Error> {
    sqlx::query_as::<_, PlanVariantRecord>(
        "select id, trip_id, name, status, description, version
         from trip_plans
         where id = $1
         for update",
    )
    .bind(plan_variant_id)
    .fetch_optional(&mut **tx)
    .await
}

pub async fn insert_plan_variant(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    plan_variant: NewPlanVariant<'_>,
) -> Result<PlanVariantRecord, sqlx::Error> {
    sqlx::query_as::<_, PlanVariantRecord>(
        "insert into trip_plans (id, trip_id, name, status, description)
         values ($1, $2, $3, $4, $5)
         returning id, trip_id, name, status, description, version",
    )
    .bind(plan_variant.id)
    .bind(plan_variant.trip_id)
    .bind(plan_variant.name)
    .bind(plan_variant.status)
    .bind(plan_variant.description)
    .fetch_one(&mut **tx)
    .await
}

pub async fn update_plan_variant(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    plan_variant_id: Uuid,
    patch: &sagittarius_domain::patches::PlanVariantPatch,
    version: i64,
) -> Result<Option<PlanVariantRecord>, sqlx::Error> {
    sqlx::query_as::<_, PlanVariantRecord>(
        "update trip_plans
         set name = coalesce($2, name),
             status = coalesce($3, status),
             description = coalesce($4, description),
             version = $5,
             updated_at = now()
         where id = $1
         returning id, trip_id, name, status, description, version",
    )
    .bind(plan_variant_id)
    .bind(patch.name.as_deref().map(str::trim))
    .bind(patch.effective_status())
    .bind(patch.description.as_deref().map(str::trim))
    .bind(version)
    .fetch_optional(&mut **tx)
    .await
}

pub async fn update_plan_variant_status(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    plan_variant_id: Uuid,
    _kind: &str,
    status: &str,
    version: i64,
) -> Result<Option<PlanVariantRecord>, sqlx::Error> {
    sqlx::query_as::<_, PlanVariantRecord>(
        "update trip_plans
         set status = $2,
             version = $3,
             updated_at = now()
         where id = $1
         returning id, trip_id, name, status, description, version",
    )
    .bind(plan_variant_id)
    .bind(status)
    .bind(version)
    .fetch_optional(&mut **tx)
    .await
}

pub async fn plan_variant_exists_for_trip(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    trip_id: Uuid,
    plan_variant_id: Uuid,
) -> Result<bool, sqlx::Error> {
    sqlx::query_scalar(
        "select exists (
           select 1
           from trip_plans
           where trip_id = $1 and id = $2
         )",
    )
    .bind(trip_id)
    .bind(plan_variant_id)
    .fetch_one(&mut **tx)
    .await
}

pub async fn active_plan_variant_id_for_trip(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    trip_id: Uuid,
) -> Result<Option<Uuid>, sqlx::Error> {
    sqlx::query_scalar(
        "select main_trip_plan_id
         from trips
         where id = $1 and deleted_at is null",
    )
    .bind(trip_id)
    .fetch_optional(&mut **tx)
    .await
}
