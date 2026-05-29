use super::types::{Capability, TripRole};

pub fn can(role: TripRole, capability: Capability) -> bool {
    match role {
        TripRole::Owner => matches!(
            capability,
            Capability::ViewPlan
                | Capability::EditItinerary
                | Capability::ReviewSuggestions
                | Capability::CreateSuggestion
                | Capability::ViewExpenses
                | Capability::EditExpenses
                | Capability::ManagePeople
                | Capability::CreateSharedTask
                | Capability::CreatePrivateTask
                | Capability::UpdateOwnPrivateTask
        ),
        TripRole::Organizer => matches!(
            capability,
            Capability::ViewPlan
                | Capability::EditItinerary
                | Capability::ReviewSuggestions
                | Capability::CreateSuggestion
                | Capability::ViewExpenses
                | Capability::EditExpenses
                | Capability::ManagePeople
                | Capability::CreateSharedTask
                | Capability::CreatePrivateTask
                | Capability::UpdateOwnPrivateTask
        ),
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
