pub mod auth;
pub mod events;
pub mod itinerary;
pub mod suggestions;
pub mod tasks;
pub mod trips;

use crate::realtime::RealtimeHub;

#[derive(Clone)]
pub struct AppState {
    pub realtime: RealtimeHub,
}

impl AppState {
    pub fn test() -> Self {
        Self {
            realtime: RealtimeHub,
        }
    }
}
