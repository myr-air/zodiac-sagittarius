pub mod account;
pub mod auth;
pub mod daily_briefings;
pub mod email;
pub mod events;
pub mod expenses;
pub mod itinerary;
pub mod itinerary_imports;
pub mod members;
pub mod place_resolution;
pub mod plan_variants;
pub mod stop_notes;
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
        let database_url = std::env::var("DATABASE_URL").unwrap_or_else(|_| {
            "postgres://sagittarius:sagittarius@localhost/sagittarius".to_string()
        });
        let pool = sqlx::postgres::PgPoolOptions::new()
            .connect_lazy(&database_url)
            .expect("test database URL should be valid");

        Self::with_pool(pool)
    }
}
