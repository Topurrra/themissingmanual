use std::sync::Arc;
use std::path::Path;

#[tokio::main]
async fn main() {
    let state = Arc::new(
        server::AppState::build(Path::new(".")).expect("failed to ingest guides"),
    );
    let app = server::app(state);
    let listener = tokio::net::TcpListener::bind("127.0.0.1:3000")
        .await
        .expect("bind 127.0.0.1:3000");
    println!("listening on http://127.0.0.1:3000");
    axum::serve(listener, app).await.expect("server error");
}
