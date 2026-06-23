pub mod account;
pub mod auth;
pub mod bookings;
pub mod daily_briefings;
pub mod email;
pub mod events;
pub mod exchange_rates;
pub mod expenses;
pub mod itinerary;
pub mod itinerary_imports;
pub mod members;
pub mod mutation_guard;
pub mod photo_albums;
pub mod place_resolution;
pub mod plan_checks;
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
    pub exchange_rates: exchange_rates::ExchangeRateService,
    pub daily_briefing_weather_fetch: bool,
}

impl AppState {
    pub fn with_pool(pool: PgPool) -> Self {
        Self {
            pool,
            realtime: RealtimeHub::default(),
            email_delivery: email::EmailDelivery::from_env(),
            exchange_rates: exchange_rates::ExchangeRateService::new(),
            daily_briefing_weather_fetch: daily_briefings::weather_fetch_enabled_from_env(),
        }
    }

    pub fn with_pool_for_tests(pool: PgPool) -> Self {
        Self {
            email_delivery: email::EmailDelivery::Disabled,
            daily_briefing_weather_fetch: false,
            ..Self::with_pool(pool)
        }
    }

    pub fn test() -> Self {
        let database_url = std::env::var("DATABASE_URL").unwrap_or_else(|_| {
            "postgres://sagittarius:sagittarius@localhost/sagittarius".to_string()
        });
        let pool = sqlx::postgres::PgPoolOptions::new()
            .connect_lazy(&database_url)
            .expect("test database URL should be valid");

        Self::with_pool_for_tests(pool)
    }
}
