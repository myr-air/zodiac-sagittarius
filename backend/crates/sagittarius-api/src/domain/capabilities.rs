use super::types::{Capability, TripRole};

pub fn can(role: TripRole, capability: Capability) -> bool {
    match role {
        TripRole::Owner | TripRole::Organizer => true,
        TripRole::Traveler => matches!(
            capability,
            Capability::ViewPlan
                | Capability::CreateSuggestion
                | Capability::ViewExpenses
                | Capability::CreateSharedTask
                | Capability::CreatePrivateTask
                | Capability::UpdateOwnPrivateTask
        ),
        TripRole::Viewer => matches!(capability, Capability::ViewPlan),
    }
}
