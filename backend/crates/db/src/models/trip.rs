use sqlx::{FromRow, types::Json};
use time::Date;
use uuid::Uuid;

use sagittarius_domain::plan_status::legacy_kind_for_plan_status;
use sagittarius_domain::types::{PlanVariantSummary, TripCity, TripSummary};

#[derive(Debug, Clone, FromRow)]
pub struct TripAuthRecord {
    pub id: Uuid,
    pub name: String,
    pub origin_label: String,
    pub origin_city: String,
    pub origin_country: String,
    pub origin_country_code: String,
    pub destination_label: String,
    pub destination_cities: Json<Vec<TripCity>>,
    pub countries: Vec<String>,
    pub party_size: i32,
    pub default_timezone: String,
    pub start_date: Date,
    pub end_date: Date,
    pub join_id: String,
    pub join_password_hash: String,
    pub main_trip_plan_id: Option<Uuid>,
    pub owner_member_id: Uuid,
    pub version: i64,
}

impl From<TripAuthRecord> for TripSummary {
    fn from(record: TripAuthRecord) -> Self {
        Self {
            id: record.id,
            name: record.name,
            origin_label: record.origin_label,
            origin_city: record.origin_city,
            origin_country: record.origin_country,
            origin_country_code: record.origin_country_code,
            destination_label: record.destination_label,
            destination_cities: record.destination_cities.0,
            countries: record.countries,
            party_size: record.party_size,
            default_timezone: record.default_timezone,
            start_date: record.start_date,
            end_date: record.end_date,
            join_id: record.join_id,
            active_plan_variant_id: record.main_trip_plan_id,
            main_trip_plan_id: record.main_trip_plan_id,
            owner_member_id: record.owner_member_id,
            version: record.version,
        }
    }
}

pub struct NewPlanVariant<'a> {
    pub id: Uuid,
    pub trip_id: Uuid,
    pub name: &'a str,
    pub status: &'a str,
    pub description: &'a str,
}

#[derive(Debug, Clone, FromRow)]
pub struct PlanVariantRecord {
    pub id: Uuid,
    pub trip_id: Uuid,
    pub name: String,
    pub status: String,
    pub description: String,
    pub version: i64,
}

impl From<PlanVariantRecord> for PlanVariantSummary {
    fn from(record: PlanVariantRecord) -> Self {
        let status = record.status;
        let kind = legacy_kind_for_plan_status(&status).to_string();
        Self {
            id: record.id,
            trip_id: record.trip_id,
            name: record.name,
            kind,
            status,
            description: record.description,
            version: record.version,
        }
    }
}

pub fn plan_variant_summary_for_main_pointer(
    record: PlanVariantRecord,
    main_trip_plan_id: Option<Uuid>,
) -> PlanVariantSummary {
    let mut summary = PlanVariantSummary::from(record);
    if Some(summary.id) == main_trip_plan_id {
        summary.kind = "main".to_string();
        summary.status = "main".to_string();
    } else if summary.status == "main" {
        summary.kind = "backup".to_string();
        summary.status = "backup".to_string();
    }
    summary
}

