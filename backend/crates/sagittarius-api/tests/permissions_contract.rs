use sagittarius_api::domain::capabilities::can;
use sagittarius_api::domain::types::{Capability, TripRole};

#[test]
fn role_capabilities_match_frontend_contract() {
    assert!(can(TripRole::Owner, Capability::EditItinerary));
    assert!(can(TripRole::Organizer, Capability::ReviewSuggestions));
    assert!(can(TripRole::Traveler, Capability::CreateSuggestion));
    assert!(can(TripRole::Traveler, Capability::CreatePrivateTask));
    assert!(!can(TripRole::Traveler, Capability::EditItinerary));
    assert!(can(TripRole::Viewer, Capability::ViewPlan));
    assert!(!can(TripRole::Viewer, Capability::CreateSuggestion));
    assert!(!can(TripRole::Viewer, Capability::CreatePrivateTask));
}
