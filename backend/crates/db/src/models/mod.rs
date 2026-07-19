//! SQLx row / insert models split by feature.

mod account;
mod bookings;
mod briefings;
mod expenses;
mod itinerary;
mod members;
mod photos;
mod places;
mod plans;
mod shared;
mod tasks;
mod trip;

pub use account::*;
pub use bookings::*;
pub use briefings::*;
pub use expenses::*;
pub use itinerary::*;
pub use members::*;
pub use photos::*;
pub use places::*;
pub use plans::*;
pub use shared::*;
pub use tasks::*;
pub use trip::*;

#[cfg(test)]
mod tests {
    use super::*;
    use sagittarius_domain::types::ItineraryItemSummary;
    use serde_json::json;
    use time::Date;
    use uuid::Uuid;

    fn itinerary_record(latitude: Option<f64>, longitude: Option<f64>) -> ItineraryItemRecord {
        ItineraryItemRecord {
            id: Uuid::now_v7(),
            trip_id: Uuid::now_v7(),
            trip_plan_id: Uuid::now_v7(),
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
            day: Date::from_calendar_date(2026, time::Month::May, 29).unwrap(),
            sort_order: 1,
            start_time: "09:00".to_string(),
            end_time: None,
            end_offset_days: 0,
            activity: "Breakfast".to_string(),
            activity_type: "food".to_string(),
            activity_subtype: None,
            place: "Central".to_string(),
            map_link: String::new(),
            address: Some("Hong Kong".to_string()),
            latitude,
            longitude,
            duration_minutes: Some(45),
            transportation: "walk".to_string(),
            details: json!({}),
            note: "Bring cash".to_string(),
            created_by: Uuid::now_v7(),
            updated_at: "2026-05-29T00:00:00Z".to_string(),
            version: 1,
        }
    }

    #[test]
    fn itinerary_summary_includes_coordinates_only_when_both_parts_exist() {
        let with_coordinates =
            ItineraryItemSummary::from(itinerary_record(Some(22.3), Some(114.2)));
        assert_eq!(with_coordinates.coordinates.unwrap().lat, 22.3);

        let missing_longitude = ItineraryItemSummary::from(itinerary_record(Some(22.3), None));
        assert!(missing_longitude.coordinates.is_none());
    }
}
