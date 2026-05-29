#[tokio::main]
async fn main() {
    tracing_subscriber::fmt().with_env_filter("info").init();
    println!(
        "sagittarius-api {}",
        sagittarius_api::backend_contract_version()
    );
}
