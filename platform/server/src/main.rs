use std::sync::Arc;
use std::path::Path;

#[tokio::main]
async fn main() {
    let content_root = std::env::var("CONTENT_ROOT").unwrap_or_else(|_| ".".to_string());
    let bind_addr = std::env::var("BIND_ADDR").unwrap_or_else(|_| "127.0.0.1:3000".to_string());

    let state = Arc::new(
        server::AppState::build(Path::new(&content_root)).expect("failed to ingest guides"),
    );
    let app = server::app(state);

    let listener = tokio::net::TcpListener::bind(&bind_addr)
        .await
        .unwrap_or_else(|e| panic!("bind {bind_addr}: {e}"));
    println!("listening on http://{bind_addr}");
    axum::serve(listener, app).await.expect("server error");
}
