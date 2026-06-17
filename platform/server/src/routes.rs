use std::sync::Arc;
use axum::{
    extract::State,
    http::StatusCode,
    response::{IntoResponse, Response},
    routing::get,
    Json, Router,
};
use crate::state::AppState;

pub fn health_router() -> Router {
    Router::new().route("/api/health", get(|| async { "ok" }))
}

/// The full application router, with state.
pub fn app(state: Arc<AppState>) -> Router {
    Router::new()
        .route("/api/health", get(|| async { "ok" }))
        .route("/api/guides", get(list_guides))
        .with_state(state)
}

fn server_error<E: std::fmt::Display>(e: E) -> Response {
    (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": e.to_string() }))).into_response()
}

async fn list_guides(State(state): State<Arc<AppState>>) -> Response {
    let result = {
        let store = state.store.lock().unwrap();
        store.list_guides()
    };
    match result {
        Ok(guides) => Json(guides).into_response(),
        Err(e) => server_error(e),
    }
}
