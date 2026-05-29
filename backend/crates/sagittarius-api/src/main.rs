#[tokio::main]
async fn main() {
    tracing_subscriber::fmt().with_env_filter("info").init();
    let bind_addr =
        std::env::var("SAGITTARIUS_BIND_ADDR").unwrap_or_else(|_| "127.0.0.1:5181".to_string());
    println!(
        "sagittarius-api {} listening on {bind_addr}",
        sagittarius_api::backend_contract_version()
    );
}
