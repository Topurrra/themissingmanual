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
        Some("create-admin") => {
            let pw = std::env::args().nth(2).expect("usage: server create-admin <password>");
            let (db, _root) = paths();
            let store = content_core::store::Store::open(&db).expect("open db");
            store
                .set_admin_hash(&server::auth::hash_password(&pw))
                .expect("set admin password");
            println!("admin password set in {}", db.display());
            return;
        }
        _ => {}
    }

    let (db, root) = paths();
    let bind_addr = std::env::var("BIND_ADDR").unwrap_or_else(|_| "127.0.0.1:3000".to_string());
    let state = Arc::new(
        server::AppState::build_persistent(&db, Some(&root)).expect("failed to build app state"),
    );
    let app = server::app(state.clone());

    // Background maintenance: prune old events + expired sessions now and every 24h.
    {
        let st = state.clone();
        tokio::spawn(async move {
            let mut tick = tokio::time::interval(std::time::Duration::from_secs(24 * 3600));
            loop {
                tick.tick().await; // fires immediately on the first iteration, then daily
                if let Err(e) = st.maintenance() {
                    eprintln!("maintenance error: {e}");
                }
            }
        });
    }

    // Background content sync: re-import guides/ when the files change (files win on change).
    // Interval via SYNC_INTERVAL_SECS (default 300). New guide folders go live within one interval.
    {
        let st = state.clone();
        let secs: u64 = std::env::var("SYNC_INTERVAL_SECS")
            .ok()
            .and_then(|s| s.parse().ok())
            .filter(|&n| n > 0)
            .unwrap_or(300);
        tokio::spawn(async move {
            let mut tick = tokio::time::interval(std::time::Duration::from_secs(secs));
            loop {
                tick.tick().await; // fires immediately on the first iteration, then every `secs`
                match st.sync_content() {
                    Ok(Some(s)) => println!("content sync: imported {} guide(s), {} phase(s)", s.guides, s.phases),
                    Ok(None) => {}
                    Err(e) => eprintln!("content sync error: {e}"),
                }
            }
        });
    }

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
