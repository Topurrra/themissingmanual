use std::sync::Arc;
use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::{IntoResponse, Response},
    routing::get,
    Json, Router,
};
use serde::{Deserialize, Serialize};
use content_core::{GuideSummary, PhaseRef};
use crate::state::AppState;

pub fn health_router() -> Router {
    Router::new().route("/api/health", get(|| async { "ok" }))
}

/// The full application router, with state.
pub fn app(state: Arc<AppState>) -> Router {
    Router::new()
        .route("/api/health", get(|| async { "ok" }))
        .route("/api/guides", get(list_guides))
        .route("/api/guides/:slug", get(guide_detail))
        .route("/api/guides/:slug/:phase", get(phase_detail))
        .route("/api/search", get(search))
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

#[derive(Serialize)]
struct GuideDetail {
    guide: GuideSummary,
    phases: Vec<PhaseRef>,
}

async fn guide_detail(State(state): State<Arc<AppState>>, Path(slug): Path<String>) -> Response {
    let (guide, phases) = {
        let store = state.store.lock().unwrap();
        let guide = match store.get_guide(&slug) {
            Ok(Some(g)) => g,
            Ok(None) => return (StatusCode::NOT_FOUND, Json(serde_json::json!({ "error": "guide not found" }))).into_response(),
            Err(e) => return server_error(e),
        };
        let phases = match store.list_phase_refs(&slug) {
            Ok(p) => p,
            Err(e) => return server_error(e),
        };
        (guide, phases)
    };
    Json(GuideDetail { guide, phases }).into_response()
}

async fn phase_detail(State(state): State<Arc<AppState>>, Path((slug, phase)): Path<(String, u32)>) -> Response {
    let result = {
        let store = state.store.lock().unwrap();
        store.get_phase(&slug, phase)
    };
    match result {
        Ok(Some(p)) => Json(p).into_response(),
        Ok(None) => (StatusCode::NOT_FOUND, Json(serde_json::json!({ "error": "phase not found" }))).into_response(),
        Err(e) => server_error(e),
    }
}

#[derive(Deserialize)]
struct SearchParams {
    q: String,
}

async fn search(State(state): State<Arc<AppState>>, Query(params): Query<SearchParams>) -> Response {
    if params.q.trim().is_empty() {
        return (StatusCode::BAD_REQUEST, Json(serde_json::json!({ "error": "query `q` is required" }))).into_response();
    }
    match state.index.search(&params.q, 20) {
        Ok(hits) => Json(hits).into_response(),
        Err(e) => server_error(e),
    }
}
