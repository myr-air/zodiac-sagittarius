use sqlx::FromRow;
use time::OffsetDateTime;
use uuid::Uuid;

#[derive(Debug, Clone, FromRow)]
pub struct BookingDocRecord {
    pub id: Uuid,
    pub trip_id: Uuid,
    pub trip_plan_id: Option<Uuid>,
    pub r#type: String,
    pub title: String,
    pub status: String,
    pub visibility: String,
    pub owner_member_id: Option<Uuid>,
    pub provider_name: Option<String>,
    pub confirmation_code: Option<String>,
    pub starts_at: Option<OffsetDateTime>,
    pub ends_at: Option<OffsetDateTime>,
    pub timezone: Option<String>,
    pub price_minor: Option<i32>,
    pub currency: Option<String>,
    pub notes: Option<String>,
    pub created_by: Uuid,
    pub created_at: OffsetDateTime,
    pub updated_at: OffsetDateTime,
    pub version: i64,
}

#[derive(Debug, Clone, FromRow)]
pub struct BookingDocExternalLinkRecord {
    pub id: Uuid,
    pub trip_id: Uuid,
    pub booking_doc_id: Uuid,
    pub label: String,
    pub url: String,
    pub provider: Option<String>,
    pub access_note: Option<String>,
    pub sort_order: i32,
}

pub struct NewBookingDoc<'a> {
    pub id: Uuid,
    pub trip_id: Uuid,
    pub trip_plan_id: Option<Uuid>,
    pub r#type: &'a str,
    pub title: &'a str,
    pub status: &'a str,
    pub visibility: &'a str,
    pub owner_member_id: Option<Uuid>,
    pub provider_name: Option<&'a str>,
    pub confirmation_code: Option<&'a str>,
    pub starts_at: Option<OffsetDateTime>,
    pub ends_at: Option<OffsetDateTime>,
    pub timezone: Option<&'a str>,
    pub price_minor: Option<i32>,
    pub currency: Option<&'a str>,
    pub notes: Option<&'a str>,
    pub created_by: Uuid,
}

