use serde::{Deserialize, Serialize};
use time::Date;
use uuid::Uuid;

use super::auth::{TripMemberAccessStatus, TripRole};
use super::bookings::BookingDocSummary;
use super::expenses::{ExpenseItemSummary, ExpenseSummary};
use super::itinerary::{ItineraryItemSummary, StopNoteSummary};
use super::members::TripMemberSummary;
use super::photos::PhotoAlbumLinkSummary;
use super::plans::{PlanCheckSummary, PlanVariantSummary, SuggestionSummary, TripPlanSummary};
use super::tasks::TripTaskSummary;

#[cfg_attr(feature = "openapi", derive(utoipa::ToSchema))]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct TripCity {
    pub city: String,
    pub country: String,
    pub country_code: String,
    pub timezone: String,
    pub latitude: f64,
    pub longitude: f64,
}

#[cfg_attr(feature = "openapi", derive(utoipa::ToSchema))]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TripSummary {
    pub id: Uuid,
    pub name: String,
    pub origin_label: String,
    pub origin_city: String,
    pub origin_country: String,
    pub origin_country_code: String,
    pub destination_label: String,
    pub destination_cities: Vec<TripCity>,
    pub countries: Vec<String>,
    pub party_size: i32,
    pub default_timezone: String,
    pub start_date: Date,
    pub end_date: Date,
    pub join_id: String,
    pub active_plan_variant_id: Option<Uuid>,
    pub main_trip_plan_id: Option<Uuid>,
    pub owner_member_id: Uuid,
    pub version: i64,
}

#[cfg_attr(feature = "openapi", derive(utoipa::ToSchema))]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ClaimableMember {
    pub id: Uuid,
    pub trip_id: Uuid,
    pub display_name: String,
    pub role: TripRole,
    pub access_status: TripMemberAccessStatus,
    pub color: String,
    pub claimed_at: Option<String>,
}

#[cfg_attr(feature = "openapi", derive(utoipa::ToSchema))]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct JoinTripResponse {
    pub trip: TripSummary,
    pub claimable_members: Vec<ClaimableMember>,
    pub join_session_token: String,
    pub expires_at: String,
}

#[cfg_attr(feature = "openapi", derive(utoipa::ToSchema))]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct JoinInviteTokenResponse {
    pub token: String,
    pub expires_at: String,
}

#[cfg_attr(feature = "openapi", derive(utoipa::ToSchema))]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TripCockpit {
    pub trip: TripSummary,
    pub members: Vec<TripMemberSummary>,
    pub plan_variants: Vec<PlanVariantSummary>,
    pub trip_plans: Vec<TripPlanSummary>,
    pub itinerary_items: Vec<ItineraryItemSummary>,
    pub suggestions: Vec<SuggestionSummary>,
    pub latest_plan_check: Option<PlanCheckSummary>,
    pub tasks: Vec<TripTaskSummary>,
    pub stop_notes: Vec<StopNoteSummary>,
    pub expenses: Vec<ExpenseItemSummary>,
    pub expense_summary: Option<ExpenseSummary>,
    pub booking_docs: Vec<BookingDocSummary>,
    pub photo_album_links: Vec<PhotoAlbumLinkSummary>,
}

