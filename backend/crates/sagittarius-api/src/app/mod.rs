pub mod account;
pub mod email;
pub mod auth;
pub mod events;
pub mod itinerary;
pub mod suggestions;
pub mod tasks;
pub mod trips;

use crate::db::PgPool;
use crate::realtime::RealtimeHub;

#[derive(Clone)]
pub struct AppState {
    pub pool: PgPool,
    pub realtime: RealtimeHub,
    pub email_delivery: email::EmailDelivery,
}

impl AppState {
    pub fn with_pool(pool: PgPool) -> Self {
        Self {
            pool,
            realtime: RealtimeHub::default(),
            email_delivery: email::EmailDelivery::from_env(),
        }
    }

    pub fn test() -> Self {
        let pool = sqlx::postgres::PgPoolOptions::new()
            .connect_lazy("postgres://sagittarius:sagittarius@localhost/sagittarius")
            .expect("test database URL should be valid");

        Self::with_pool(pool)
    }
}
