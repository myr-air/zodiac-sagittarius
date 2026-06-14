use sagittarius_api::domain::capabilities::can;
use sagittarius_api::domain::types::{Capability, TripRole};

#[test]
fn role_capabilities_match_frontend_contract() {
    let cases = [
        (TripRole::Owner, Capability::ViewPlan, true),
        (TripRole::Owner, Capability::EditItinerary, true),
        (TripRole::Owner, Capability::ReviewSuggestions, true),
        (TripRole::Owner, Capability::CreateSuggestion, true),
        (TripRole::Owner, Capability::ViewExpenses, true),
        (TripRole::Owner, Capability::EditExpenses, true),
        (TripRole::Owner, Capability::ManagePeople, true),
        (TripRole::Owner, Capability::ManageTripPlans, true),
        (TripRole::Owner, Capability::CreateSharedTask, true),
        (TripRole::Owner, Capability::CreatePrivateTask, true),
        (TripRole::Owner, Capability::UpdateOwnPrivateTask, true),
        (TripRole::Organizer, Capability::ViewPlan, true),
        (TripRole::Organizer, Capability::EditItinerary, true),
        (TripRole::Organizer, Capability::ReviewSuggestions, true),
        (TripRole::Organizer, Capability::CreateSuggestion, true),
        (TripRole::Organizer, Capability::ViewExpenses, true),
        (TripRole::Organizer, Capability::EditExpenses, true),
        (TripRole::Organizer, Capability::ManagePeople, true),
        (TripRole::Organizer, Capability::ManageTripPlans, true),
        (TripRole::Organizer, Capability::CreateSharedTask, true),
        (TripRole::Organizer, Capability::CreatePrivateTask, true),
        (TripRole::Organizer, Capability::UpdateOwnPrivateTask, true),
        (TripRole::Traveler, Capability::ViewPlan, true),
        (TripRole::Traveler, Capability::EditItinerary, true),
        (TripRole::Traveler, Capability::ReviewSuggestions, false),
        (TripRole::Traveler, Capability::CreateSuggestion, true),
        (TripRole::Traveler, Capability::ViewExpenses, true),
        (TripRole::Traveler, Capability::EditExpenses, false),
        (TripRole::Traveler, Capability::ManagePeople, false),
        (TripRole::Traveler, Capability::ManageTripPlans, false),
        (TripRole::Traveler, Capability::CreateSharedTask, true),
        (TripRole::Traveler, Capability::CreatePrivateTask, true),
        (TripRole::Traveler, Capability::UpdateOwnPrivateTask, true),
        (TripRole::Viewer, Capability::ViewPlan, true),
        (TripRole::Viewer, Capability::EditItinerary, false),
        (TripRole::Viewer, Capability::ReviewSuggestions, false),
        (TripRole::Viewer, Capability::CreateSuggestion, false),
        (TripRole::Viewer, Capability::ViewExpenses, false),
        (TripRole::Viewer, Capability::EditExpenses, false),
        (TripRole::Viewer, Capability::ManagePeople, false),
        (TripRole::Viewer, Capability::ManageTripPlans, false),
        (TripRole::Viewer, Capability::CreateSharedTask, false),
        (TripRole::Viewer, Capability::CreatePrivateTask, false),
        (TripRole::Viewer, Capability::UpdateOwnPrivateTask, false),
    ];

    for (role, capability, expected) in cases {
        assert_eq!(can(role, capability), expected, "{role:?} {capability:?}");
    }
}
