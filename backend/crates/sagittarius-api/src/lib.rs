pub mod api;
pub mod app;
pub mod db;
pub mod domain;
pub mod realtime;

pub fn backend_contract_version() -> &'static str {
    "2026-05-29"
}
