#[test]
fn crate_exposes_backend_contract_metadata() {
    assert_eq!(env!("CARGO_PKG_NAME"), "sagittarius-api");
    assert_eq!(env!("CARGO_PKG_VERSION"), "0.1.5");
    assert_eq!(sagittarius_api::backend_contract_version(), "2026-05-29");
}
