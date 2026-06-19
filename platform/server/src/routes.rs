use std::sync::Arc;
use axum::{
    extract::{DefaultBodyLimit, Path, Query, State},
    http::{header, StatusCode},
    middleware,
    response::{IntoResponse, Response},
    routing::{get, patch, post},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use content_core::{Category, GuideSummary, PhaseRef};
use crate::state::AppState;
use crate::{admin, auth};

pub fn health_router() -> Router {
    Router::new().route("/api/health", get(|| async { "ok" }))
}

/// The full application router, with state.
pub fn app(state: Arc<AppState>) -> Router {
    // Cap the asset-upload request body just above the stored-asset size limit.
    let upload_limit = state.asset_max.saturating_add(1024 * 1024);
    // Admin content routes — guarded by the require_admin middleware.
    let protected = Router::new()
        .route("/guides", get(admin::list_guides).post(admin::create_guide))
        .route("/guides/bulk", post(admin::bulk_guides))
        .route("/guides/:slug", get(admin::get_guide).patch(admin::patch_guide).delete(admin::delete_guide))
        .route("/guides/:slug/phases", get(admin::list_phases).post(admin::create_phase))
        .route("/guides/:slug/phases/reorder", post(admin::reorder_phases))
        .route("/guides/:slug/phases/:no", get(admin::get_phase).patch(admin::patch_phase).delete(admin::delete_phase))
        .route("/categories", get(admin::list_categories).post(admin::create_category))
        .route("/categories/reorder", post(admin::reorder_categories))
        .route("/categories/:slug", patch(admin::patch_category).delete(admin::delete_category))
        .route("/password", post(auth::change_password))
        .route("/sync", post(admin::sync_now))
        .route("/assets", post(admin::upload_asset).layer(DefaultBodyLimit::max(upload_limit)))
        .route("/preview", post(admin::preview))
        .route("/analytics", get(admin::analytics))
        .route("/settings", get(admin::get_settings).put(admin::put_settings))
        .route("/feedback", get(admin::list_feedback))
        .route("/status", get(admin::status))
        .route("/backlog", get(admin::backlog))
        .route_layer(middleware::from_fn_with_state(state.clone(), auth::require_admin));
    // Auth routes — not behind require_admin (login establishes the session; me/logout self-check).
    let auth_routes = Router::new()
        .route("/login", post(auth::login))
        .route("/logout", post(auth::logout))
        .route("/me", get(auth::me));

    Router::new()
        .route("/api/health", get(|| async { "ok" }))
        .route("/api/guides", get(list_guides))
        .route("/api/guides/:slug", get(guide_detail))
        .route("/api/guides/:slug/:phase", get(phase_detail))
        .route("/api/search", get(search))
        .route("/api/rss", get(rss))
        .route("/api/events", post(admin::record_event))
        .route("/api/feedback", post(admin::submit_feedback))
        .route("/api/site-config", get(admin::site_config))
        .route("/api/categories", get(list_categories))
        .route("/api/categories/:slug", get(category_detail))
        .route("/api/tracks", get(list_tracks_h))
        .route("/api/tracks/:slug", get(track_detail))
        .route("/assets/:id", get(admin::serve_asset))
        .nest("/api/admin", protected.merge(auth_routes))
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
        Ok(results) => {
            // Body stays the hits array (non-breaking); the optional "did you mean"
            // rides in a header so existing clients keep working unchanged.
            let mut resp = Json(results.hits).into_response();
            if let Some(s) = results.suggestion {
                if let Ok(val) = header::HeaderValue::from_str(&s) {
                    resp.headers_mut().insert("x-search-suggestion", val);
                }
            }
            resp
        }
        Err(e) => server_error(e),
    }
}

/// RSS 2.0 feed of published guides. Item links point at the public web origin
/// (`SITE_URL`, default http://localhost:5173) — set SITE_URL in production.
async fn rss(State(state): State<Arc<AppState>>) -> Response {
    let guides = {
        let store = state.store.lock().unwrap();
        store.list_guides()
    };
    let guides = match guides {
        Ok(g) => g,
        Err(e) => return server_error(e),
    };
    fn xml_escape(s: &str) -> String {
        s.replace('&', "&amp;").replace('<', "&lt;").replace('>', "&gt;")
    }
    let site = std::env::var("SITE_URL").unwrap_or_else(|_| "http://localhost:5173".to_string());
    let site = site.trim_end_matches('/');
    let mut items = String::new();
    for g in &guides {
        let link = format!("{site}/guides/{}", g.slug);
        items.push_str(&format!(
            "<item><title>{}</title><link>{}</link><guid isPermaLink=\"true\">{}</guid><description>{}</description></item>",
            xml_escape(&g.title),
            xml_escape(&link),
            xml_escape(&link),
            xml_escape(&g.summary),
        ));
    }
    let body = format!(
        "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n\
         <rss version=\"2.0\"><channel>\
         <title>The Missing Manual</title>\
         <link>{site}</link>\
         <description>Real-world developer knowledge, explained with zero ego.</description>\
         {items}</channel></rss>"
    );
    ([(header::CONTENT_TYPE, "application/rss+xml; charset=utf-8")], body).into_response()
}

async fn list_categories(State(state): State<Arc<AppState>>) -> Response {
    let result = {
        let store = state.store.lock().unwrap();
        content_core::categories::categories_with_counts(&store)
    };
    match result {
        Ok(cats) => Json(cats).into_response(),
        Err(e) => server_error(e),
    }
}

#[derive(Serialize)]
struct CategoryPage {
    category: Category,
    guides: Vec<GuideSummary>,
}

async fn category_detail(State(state): State<Arc<AppState>>, Path(slug): Path<String>) -> Response {
    let result = {
        let store = state.store.lock().unwrap();
        content_core::categories::category_with_guides(&store, &slug)
    };
    match result {
        Ok(Some((category, guides))) => Json(CategoryPage { category, guides }).into_response(),
        Ok(None) => (StatusCode::NOT_FOUND, Json(serde_json::json!({ "error": "category not found" }))).into_response(),
        Err(e) => server_error(e),
    }
}

async fn list_tracks_h() -> Response {
    Json(content_core::tracks::list_tracks()).into_response()
}

async fn track_detail(
    State(state): State<Arc<AppState>>,
    Path(slug): Path<String>,
    Query(choices): Query<std::collections::HashMap<String, String>>,
) -> Response {
    let meta = match content_core::tracks::track_meta(&slug) {
        Some(m) => m,
        None => return (StatusCode::NOT_FOUND, Json(serde_json::json!({ "error": "track not found" }))).into_response(),
    };
    let dimensions = content_core::tracks::dimensions_for(&slug).unwrap_or_default();
    let roadmap = {
        let store = state.store.lock().unwrap();
        match content_core::tracks::resolve_roadmap(&slug, &choices, &store) {
            Ok(Some(r)) => r,
            Ok(None) => return (StatusCode::NOT_FOUND, Json(serde_json::json!({ "error": "track not found" }))).into_response(),
            Err(e) => return server_error(e),
        }
    };
    Json(serde_json::json!({ "track": meta, "dimensions": dimensions, "roadmap": roadmap, "choices": choices })).into_response()
}
