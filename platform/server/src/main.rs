use std::net::SocketAddr;
use std::path::PathBuf;
use std::sync::Arc;

#[tokio::main]
async fn main() {
    match std::env::args().nth(1).as_deref() {
        Some("hash-password") => {
            let pw = std::env::args().nth(2).expect("usage: server hash-password <password>");
            println!("{}", server::auth::hash_password(&pw));
            return;
        }
        Some("import") => {
            let (db, root) = paths();
            server::AppState::build_persistent(&db, Some(&root)).expect("import failed");
            println!("imported into {}", db.display());
            return;
        }
        _ => {}
    }

    let (db, root) = paths();
    let bind_addr = std::env::var("BIND_ADDR").unwrap_or_else(|_| "127.0.0.1:3000".to_string());
    let state = Arc::new(
        server::AppState::build_persistent(&db, Some(&root)).expect("failed to build app state"),
    );
    let app = server::app(state);

    let listener = tokio::net::TcpListener::bind(&bind_addr)
        .await
        .unwrap_or_else(|e| panic!("bind {bind_addr}: {e}"));
    println!("listening on http://{bind_addr}");
    axum::serve(listener, app.into_make_service_with_connect_info::<SocketAddr>())
        .await
        .expect("server error");
}

/// Resolve the DB path (creating its parent dir) and the content root for first-run import.
fn paths() -> (PathBuf, PathBuf) {
    let db = PathBuf::from(std::env::var("DB_PATH").unwrap_or_else(|_| "./data/manual.db".to_string()));
    if let Some(parent) = db.parent() {
        std::fs::create_dir_all(parent).ok();
    }
    let root = PathBuf::from(std::env::var("CONTENT_ROOT").unwrap_or_else(|_| ".".to_string()));
    (db, root)
}
