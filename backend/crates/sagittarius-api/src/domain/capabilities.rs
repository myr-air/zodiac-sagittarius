use super::types::{Capability, TripRole};

pub fn can(role: TripRole, capability: Capability) -> bool {
    match role {
        TripRole::Owner | TripRole::Organizer => {
            OWNER_OR_ORGANIZER_CAPABILITIES.contains(&capability)
        }
        TripRole::Traveler => matches!(
            capability,
            Capability::ViewPlan
                | Capability::EditItinerary
                | Capability::CreateSuggestion
                | Capability::ViewExpenses
                | Capability::CreateSharedTask
                | Capability::CreatePrivateTask
                | Capability::UpdateOwnPrivateTask
                | Capability::ManagePhotoAlbums
        ),
        TripRole::Viewer => matches!(capability, Capability::ViewPlan),
    }
}

const OWNER_OR_ORGANIZER_CAPABILITIES: &[Capability] = &[
    Capability::ViewPlan,
    Capability::EditItinerary,
    Capability::ReviewSuggestions,
    Capability::CreateSuggestion,
    Capability::ViewExpenses,
    Capability::EditExpenses,
    Capability::ManagePeople,
    Capability::CreateSharedTask,
    Capability::CreatePrivateTask,
    Capability::UpdateOwnPrivateTask,
    Capability::EditBookings,
    Capability::ManagePhotoAlbums,
];

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn traveler_and_viewer_capabilities_are_intentionally_limited() {
        assert!(can(TripRole::Traveler, Capability::ViewPlan));
        assert!(can(TripRole::Traveler, Capability::CreateSuggestion));
        assert!(can(TripRole::Traveler, Capability::CreatePrivateTask));
        assert!(can(TripRole::Traveler, Capability::UpdateOwnPrivateTask));
        assert!(can(TripRole::Traveler, Capability::ManagePhotoAlbums));
        assert!(can(TripRole::Traveler, Capability::EditItinerary));
        assert!(!can(TripRole::Traveler, Capability::ManagePeople));
        assert!(!can(TripRole::Traveler, Capability::EditExpenses));
        assert!(!can(TripRole::Traveler, Capability::EditBookings));

        assert!(can(TripRole::Viewer, Capability::ViewPlan));
        assert!(!can(TripRole::Viewer, Capability::CreateSuggestion));
        assert!(!can(TripRole::Viewer, Capability::ViewExpenses));
        assert!(!can(TripRole::Viewer, Capability::EditBookings));
        assert!(!can(TripRole::Viewer, Capability::ManagePhotoAlbums));
    }

    #[test]
    fn owner_and_organizer_share_management_capabilities() {
        for role in [TripRole::Owner, TripRole::Organizer] {
            assert!(can(role, Capability::ViewPlan));
            assert!(can(role, Capability::EditItinerary));
            assert!(can(role, Capability::ReviewSuggestions));
            assert!(can(role, Capability::EditExpenses));
            assert!(can(role, Capability::ManagePeople));
            assert!(can(role, Capability::CreateSharedTask));
            assert!(can(role, Capability::CreatePrivateTask));
            assert!(can(role, Capability::UpdateOwnPrivateTask));
            assert!(can(role, Capability::EditBookings));
            assert!(can(role, Capability::ManagePhotoAlbums));
        }
    }
}
