pub use sagittarius_app as app;
pub use sagittarius_db as db;
pub use sagittarius_domain as domain;
pub use sagittarius_realtime as realtime;

pub mod api;

pub fn backend_contract_version() -> &'static str {
    "2026-05-29"
}
