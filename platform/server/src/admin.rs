use std::sync::Arc;
use std::collections::HashMap;
use axum::{
    extract::{Multipart, Path, Query, State},
    http::{header, StatusCode},
    response::{IntoResponse, Response},
    Json,
};
use serde::Deserialize;
use serde_json::json;
use content_core::links;
use content_core::models::{CategoryRow, Phase};
use content_core::render::render_markdown;
use crate::state::AppState;

fn err<E: std::fmt::Display>(e: E) -> Response {
    (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": e.to_string() }))).into_response()
}
fn not_found() -> Response {
    (StatusCode::NOT_FOUND, Json(json!({ "error": "not found" }))).into_response()
}

// ===== guides =====

pub async fn list_guides(State(state): State<Arc<AppState>>) -> Response {
    let r = { state.store.lock().unwrap().list_all_guides() };
    match r {
        Ok(g) => Json(g).into_response(),
        Err(e) => err(e),
    }
}

#[derive(Deserialize)]
pub struct CreateGuide {
    slug: String,
    title: String,
    summary: String,
    category: String,
    difficulty: String,
}

pub async fn create_guide(State(state): State<Arc<AppState>>, Json(b): Json<CreateGuide>) -> Response {
    let r = {
        let store = state.store.lock().unwrap();
        store
            .upsert_guide(&b.slug, &b.title, &b.summary, &b.category, &b.difficulty)
            .and_then(|_| store.set_guide_status(&b.slug, "draft"))
    };
    match r {
        Ok(_) => (StatusCode::CREATED, Json(json!({ "slug": b.slug }))).into_response(),
        Err(e) => err(e),
    }
}

pub async fn get_guide(State(state): State<Arc<AppState>>, Path(slug): Path<String>) -> Response {
    let store = state.store.lock().unwrap();
    match store.get_guide_any_status(&slug) {
        Ok(Some(g)) => match store.list_phase_refs(&slug) {
            Ok(phases) => Json(json!({ "guide": g, "phases": phases })).into_response(),
            Err(e) => err(e),
        },
        Ok(None) => not_found(),
        Err(e) => err(e),
    }
}

#[derive(Deserialize)]
pub struct PatchGuide {
    title: String,
    summary: String,
    category: String,
    difficulty: String,
    status: String,
}

pub async fn patch_guide(State(state): State<Arc<AppState>>, Path(slug): Path<String>, Json(b): Json<PatchGuide>) -> Response {
    let r = {
        let store = state.store.lock().unwrap();
        store
            .update_guide_meta(&slug, &b.title, &b.summary, &b.category, &b.difficulty)
            .and_then(|_| store.set_guide_status(&slug, &b.status))
    };
    if let Err(e) = r {
        return err(e);
    }
    if let Err(e) = state.reindex_guide(&slug) {
        return err(e);
    }
    Json(json!({ "ok": true })).into_response()
}

pub async fn delete_guide(State(state): State<Arc<AppState>>, Path(slug): Path<String>) -> Response {
    let r = { state.store.lock().unwrap().delete_guide_row(&slug) };
    if let Err(e) = r {
        return err(e);
    }
    if let Ok(mut w) = state.index.writer() {
        w.delete_guide(&slug);
        let _ = w.commit();
    }
    Json(json!({ "ok": true })).into_response()
}

// ===== phases =====

pub async fn list_phases(State(state): State<Arc<AppState>>, Path(slug): Path<String>) -> Response {
    let r = { state.store.lock().unwrap().list_phase_refs(&slug) };
    match r {
        Ok(p) => Json(p).into_response(),
        Err(e) => err(e),
    }
}

#[derive(Deserialize)]
pub struct CreatePhase {
    title: String,
    summary: String,
    markdown: String,
}

pub async fn create_phase(State(state): State<Arc<AppState>>, Path(slug): Path<String>, Json(b): Json<CreatePhase>) -> Response {
    let result = {
        let store = state.store.lock().unwrap();
        let no = match store.next_phase_no(&slug) {
            Ok(n) => n,
            Err(e) => return err(e),
        };
        let html = links::rewrite_internal_links(&render_markdown(&b.markdown), &slug);
        let phase = Phase {
            guide_slug: slug.clone(),
            phase_no: no,
            title: b.title,
            summary: b.summary,
            tags: vec![],
            difficulty: String::new(),
            synonyms: vec![],
            html,
            updated: String::new(),
            markdown: b.markdown,
        };
        store.upsert_phase(&phase).map(|_| no)
    };
    match result {
        Ok(no) => {
            if let Err(e) = state.reindex_guide(&slug) {
                return err(e);
            }
            (StatusCode::CREATED, Json(json!({ "phase_no": no }))).into_response()
        }
        Err(e) => err(e),
    }
}

pub async fn get_phase(State(state): State<Arc<AppState>>, Path((slug, no)): Path<(String, u32)>) -> Response {
    let r = { state.store.lock().unwrap().get_phase(&slug, no) };
    match r {
        Ok(Some(p)) => Json(p).into_response(),
        Ok(None) => not_found(),
        Err(e) => err(e),
    }
}

#[derive(Deserialize)]
pub struct PatchPhase {
    title: String,
    summary: String,
    markdown: String,
}

pub async fn patch_phase(State(state): State<Arc<AppState>>, Path((slug, no)): Path<(String, u32)>, Json(b): Json<PatchPhase>) -> Response {
    let result = {
        let store = state.store.lock().unwrap();
        let mut p = match store.get_phase(&slug, no) {
            Ok(Some(p)) => p,
            Ok(None) => return not_found(),
            Err(e) => return err(e),
        };
        p.title = b.title;
        p.summary = b.summary;
        p.markdown = b.markdown;
        p.html = links::rewrite_internal_links(&render_markdown(&p.markdown), &slug);
        store.upsert_phase(&p)
    };
    if let Err(e) = result {
        return err(e);
    }
    if let Err(e) = state.reindex_guide(&slug) {
        return err(e);
    }
    Json(json!({ "ok": true })).into_response()
}

pub async fn delete_phase(State(state): State<Arc<AppState>>, Path((slug, no)): Path<(String, u32)>) -> Response {
    let r = { state.store.lock().unwrap().delete_phase(&slug, no) };
    if let Err(e) = r {
        return err(e);
    }
    if let Err(e) = state.reindex_guide(&slug) {
        return err(e);
    }
    Json(json!({ "ok": true })).into_response()
}

#[derive(Deserialize)]
pub struct ReorderPhases {
    order: Vec<u32>,
}

pub async fn reorder_phases(State(state): State<Arc<AppState>>, Path(slug): Path<String>, Json(b): Json<ReorderPhases>) -> Response {
    let r = { state.store.lock().unwrap().reorder_phases(&slug, &b.order) };
    if let Err(e) = r {
        return err(e);
    }
    if let Err(e) = state.reindex_guide(&slug) {
        return err(e);
    }
    Json(json!({ "ok": true })).into_response()
}

// ===== preview =====

#[derive(Deserialize)]
pub struct PreviewReq {
    markdown: String,
}

pub async fn preview(Json(b): Json<PreviewReq>) -> Response {
    Json(json!({ "html": render_markdown(&b.markdown) })).into_response()
}

// ===== categories =====

pub async fn list_categories(State(state): State<Arc<AppState>>) -> Response {
    let r = { state.store.lock().unwrap().list_categories_rows() };
    match r {
        Ok(c) => Json(c).into_response(),
        Err(e) => err(e),
    }
}

#[derive(Deserialize)]
pub struct CategoryReq {
    name: String,
    icon: String,
    blurb: String,
    #[serde(default)]
    sort_order: i64,
    #[serde(default)]
    slug: String,
}

pub async fn create_category(State(state): State<Arc<AppState>>, Json(b): Json<CategoryReq>) -> Response {
    let row = CategoryRow { slug: b.slug.clone(), name: b.name, icon: b.icon, blurb: b.blurb, sort_order: b.sort_order };
    let r = { state.store.lock().unwrap().upsert_category(&row) };
    match r {
        Ok(_) => (StatusCode::CREATED, Json(json!({ "slug": row.slug }))).into_response(),
        Err(e) => err(e),
    }
}

pub async fn patch_category(State(state): State<Arc<AppState>>, Path(slug): Path<String>, Json(b): Json<CategoryReq>) -> Response {
    let row = CategoryRow { slug, name: b.name, icon: b.icon, blurb: b.blurb, sort_order: b.sort_order };
    let r = { state.store.lock().unwrap().upsert_category(&row) };
    match r {
        Ok(_) => Json(json!({ "ok": true })).into_response(),
        Err(e) => err(e),
    }
}

pub async fn delete_category(State(state): State<Arc<AppState>>, Path(slug): Path<String>) -> Response {
    let r = {
        let store = state.store.lock().unwrap();
        match store.count_guides_in_category(&slug) {
            Ok(0) => store.delete_category(&slug).map(|_| true),
            Ok(_) => Ok(false),
            Err(e) => return err(e),
        }
    };
    match r {
        Ok(true) => Json(json!({ "ok": true })).into_response(),
        Ok(false) => (StatusCode::CONFLICT, Json(json!({ "error": "category is not empty" }))).into_response(),
        Err(e) => err(e),
    }
}

#[derive(Deserialize)]
pub struct ReorderCategories {
    order: Vec<String>,
}

pub async fn reorder_categories(State(state): State<Arc<AppState>>, Json(b): Json<ReorderCategories>) -> Response {
    let r = { state.store.lock().unwrap().reorder_categories(&b.order) };
    match r {
        Ok(_) => Json(json!({ "ok": true })).into_response(),
        Err(e) => err(e),
    }
}

// ===== assets =====

pub async fn upload_asset(State(state): State<Arc<AppState>>, mut mp: Multipart) -> Response {
    while let Ok(Some(field)) = mp.next_field().await {
        let filename = field.file_name().unwrap_or("upload").to_string();
        let mime = field.content_type().unwrap_or("application/octet-stream").to_string();
        let bytes = match field.bytes().await {
            Ok(b) => b,
            Err(e) => return (StatusCode::BAD_REQUEST, Json(json!({ "error": e.to_string() }))).into_response(),
        };
        let id = uuid::Uuid::new_v4().to_string();
        let r = { state.store.lock().unwrap().insert_asset(&id, &filename, &mime, &bytes) };
        if let Err(e) = r {
            return err(e);
        }
        return Json(json!({ "id": id, "url": format!("/assets/{id}") })).into_response();
    }
    (StatusCode::BAD_REQUEST, Json(json!({ "error": "no file field" }))).into_response()
}

pub async fn serve_asset(State(state): State<Arc<AppState>>, Path(id): Path<String>) -> Response {
    let r = { state.store.lock().unwrap().get_asset(&id) };
    match r {
        Ok(Some((mime, _filename, bytes))) => ([(header::CONTENT_TYPE, mime)], bytes).into_response(),
        Ok(None) => (StatusCode::NOT_FOUND, "not found").into_response(),
        Err(e) => err(e),
    }
}

// ===== analytics =====

fn truncate(s: &str, n: usize) -> String {
    s.chars().take(n).collect()
}

#[derive(Deserialize)]
pub struct EventInput {
    kind: String,
    path: String,
    #[serde(default)]
    referrer: String,
    visitor: String,
    #[serde(default)]
    query: String,
}

// Public: the analytics collector posts here (server-to-server from the web origin).
pub async fn record_event(State(state): State<Arc<AppState>>, Json(e): Json<EventInput>) -> Response {
    if e.kind != "pageview" && e.kind != "search" {
        return (StatusCode::BAD_REQUEST, Json(json!({ "error": "bad kind" }))).into_response();
    }
    let r = {
        state.store.lock().unwrap().record_event(
            &e.kind,
            &truncate(&e.path, 512),
            &truncate(&e.referrer, 255),
            &truncate(&e.visitor, 64),
            &truncate(&e.query, 255),
        )
    };
    match r {
        Ok(_) => StatusCode::NO_CONTENT.into_response(),
        Err(e) => err(e),
    }
}

pub async fn analytics(State(state): State<Arc<AppState>>, Query(q): Query<HashMap<String, String>>) -> Response {
    let days: i64 = q.get("days").and_then(|s| s.parse().ok()).unwrap_or(30).clamp(1, 365);
    let store = state.store.lock().unwrap();
    let build = || -> Result<serde_json::Value, content_core::store::StoreError> {
        let (views, uniq, searches) = store.analytics_totals(days)?;
        Ok(json!({
            "views": views,
            "uniqueVisitors": uniq,
            "searches": searches,
            "perDay": store.views_per_day(days)?.into_iter().map(|(d, c)| json!({"day": d, "count": c})).collect::<Vec<_>>(),
            "topPaths": store.top_paths(days, 10)?.into_iter().map(|(p, c)| json!({"path": p, "count": c})).collect::<Vec<_>>(),
            "topReferrers": store.top_referrers(days, 10)?.into_iter().map(|(p, c)| json!({"referrer": p, "count": c})).collect::<Vec<_>>(),
            "topSearches": store.top_searches(days, 10)?.into_iter().map(|(p, c)| json!({"query": p, "count": c})).collect::<Vec<_>>(),
        }))
    };
    match build() {
        Ok(v) => Json(v).into_response(),
        Err(e) => err(e),
    }
}
