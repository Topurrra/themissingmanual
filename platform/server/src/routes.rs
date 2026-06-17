use axum::{routing::get, Router};

pub fn health_router() -> Router {
    Router::new().route("/api/health", get(|| async { "ok" }))
}
