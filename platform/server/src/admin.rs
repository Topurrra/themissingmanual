use std::sync::Arc;
use std::collections::HashMap;
use axum::{
    extract::{Multipart, Path, Query, State},
    http::{header, HeaderMap, StatusCode},
    response::{IntoResponse, Response},
    Json,
};
use serde::Deserialize;
use serde_json::json;
use content_core::links;
use content_core::models::{CategoryRow, GuideRequest, Phase};
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
            source_file: String::new(), // admin-created phase: no on-disk file to link to
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
        // Snapshot the pre-edit version into the history before overwriting it.
        if let Err(e) = store.insert_phase_revision(&slug, no as i64, &p.title, &p.summary, &p.markdown) {
            return err(e);
        }
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
        if bytes.len() > state.asset_max {
            return (StatusCode::PAYLOAD_TOO_LARGE, Json(json!({ "error": "file too large" }))).into_response();
        }
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
    #[serde(default)]
    device: String,
    #[serde(default)]
    source: String,
    #[serde(default)]
    value: i64,
}

// Public: the analytics collector posts here (server-to-server from the web origin).
// If BEACON_KEY is set, require a matching `x-beacon-key` header so the events
// endpoint can't be POSTed to directly when the API is exposed. Unset = open (the
// web-origin collector is the intended caller and the API is normally internal-only).
pub async fn record_event(State(state): State<Arc<AppState>>, headers: HeaderMap, Json(e): Json<EventInput>) -> Response {
    if let Some(key) = &state.beacon_key {
        if headers.get("x-beacon-key").and_then(|v| v.to_str().ok()) != Some(key.as_str()) {
            return (StatusCode::UNAUTHORIZED, Json(json!({ "error": "bad beacon key" }))).into_response();
        }
    }
    if !matches!(e.kind.as_str(), "pageview" | "search" | "dwell" | "read" | "vital" | "err" | "bot") {
        return (StatusCode::BAD_REQUEST, Json(json!({ "error": "bad kind" }))).into_response();
    }
    // `dwell` carries an engaged-time delta in ms; clamp to a sane 0..2h to reject
    // clock-glitch/tampered values. Other kinds don't use `value`.
    let value = e.value.clamp(0, 7_200_000);
    let r = {
        state.store.lock().unwrap().record_event(
            &e.kind,
            &truncate(&e.path, 512),
            &truncate(&e.referrer, 255),
            &truncate(&e.visitor, 64),
            &truncate(&e.query, 255),
            &truncate(&e.device, 16),
            &truncate(&e.source, 64),
            value,
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
        let (pviews, puniq, psearches) = store.analytics_totals_prev(days)?;
        let (p25, p50, p75, p100) = store.read_funnel(days)?;
        let (lcp, inp, cls) = store.vitals_summary(days)?;
        let (human, bot) = store.human_vs_bot(days)?;
        Ok(json!({
            "views": views,
            "uniqueVisitors": uniq,
            "searches": searches,
            "prev": { "views": pviews, "uniqueVisitors": puniq, "searches": psearches },
            "perDay": store.views_per_day(days)?.into_iter().map(|(d, c)| json!({"day": d, "count": c})).collect::<Vec<_>>(),
            "topGuides": store.top_guides(days, 10)?.into_iter().map(|(p, c)| json!({"path": p, "count": c})).collect::<Vec<_>>(),
            "topCategories": store.top_categories(days, 10)?.into_iter().map(|(p, c)| json!({"path": p, "count": c})).collect::<Vec<_>>(),
            "topPaths": store.top_paths(days, 10)?.into_iter().map(|(p, c)| json!({"path": p, "count": c})).collect::<Vec<_>>(),
            "topReferrers": store.top_referrers(days, 10)?.into_iter().map(|(p, c)| json!({"referrer": p, "count": c})).collect::<Vec<_>>(),
            "topSearches": store.top_searches(days, 10)?.into_iter().map(|(p, c)| json!({"query": p, "count": c})).collect::<Vec<_>>(),
            "devices": store.top_devices(days, 5)?.into_iter().map(|(p, c)| json!({"device": p, "count": c})).collect::<Vec<_>>(),
            "topSources": store.top_sources(days, 10)?.into_iter().map(|(p, c)| json!({"source": p, "count": c})).collect::<Vec<_>>(),
            "avgDwellMs": store.avg_dwell_ms(days)?,
            "topDwell": store.top_guides_by_dwell(days, 10)?.into_iter().map(|(p, ms, v)| json!({"path": p, "ms": ms, "views": v})).collect::<Vec<_>>(),
            "zeroResultSearches": store.top_zero_result_searches(days, 10)?.into_iter().map(|(q, c)| json!({"query": q, "count": c})).collect::<Vec<_>>(),
            "readFunnel": {"p25": p25, "p50": p50, "p75": p75, "p100": p100},
            "vitals": {
                "LCP": {"good": lcp.good, "ni": lcp.ni, "poor": lcp.poor, "med": lcp.med},
                "INP": {"good": inp.good, "ni": inp.ni, "poor": inp.poor, "med": inp.med},
                "CLS": {"good": cls.good, "ni": cls.ni, "poor": cls.poor, "med": cls.med},
            },
            "topErrors": store.top_errors(days, 10)?.into_iter().map(|(sig, c)| json!({"sig": sig, "count": c})).collect::<Vec<_>>(),
            "botHits": store.bot_hits(days, 10)?.into_iter().map(|(b, c)| json!({"bot": b, "count": c})).collect::<Vec<_>>(),
            "humanVsBot": {"human": human, "bot": bot},
        }))
    };
    match build() {
        Ok(v) => Json(v).into_response(),
        Err(e) => err(e),
    }
}

// ===== content sync =====

/// Manually trigger a sync of `guides/` into the DB + index (files-win-on-change).
/// No-op (changed:false) when the on-disk content hasn't changed since the last sync.
pub async fn sync_now(State(state): State<Arc<AppState>>) -> Response {
    match state.sync_content(true) {
        Ok(Some(stats)) => Json(json!({ "changed": true, "guides": stats.guides, "phases": stats.phases })).into_response(),
        Ok(None) => Json(json!({ "changed": false })).into_response(),
        Err(e) => err(e),
    }
}

// ===== bulk content actions =====

#[derive(Deserialize)]
pub struct BulkReq {
    action: String,
    slugs: Vec<String>,
    #[serde(default)]
    value: String,
}

/// Apply one action to many guides: publish | unpublish | delete | recategorize | difficulty.
/// `recategorize`/`difficulty` use `value` (the new category / difficulty).
pub async fn bulk_guides(State(state): State<Arc<AppState>>, Json(b): Json<BulkReq>) -> Response {
    let valued = matches!(b.action.as_str(), "recategorize" | "difficulty");
    if !matches!(b.action.as_str(), "publish" | "unpublish" | "delete" | "recategorize" | "difficulty") {
        return (StatusCode::BAD_REQUEST, Json(json!({ "error": "unknown action" }))).into_response();
    }
    if valued && b.value.trim().is_empty() {
        return (StatusCode::BAD_REQUEST, Json(json!({ "error": "this action requires a value" }))).into_response();
    }
    let mut affected = 0usize;
    for slug in &b.slugs {
        let res = {
            let store = state.store.lock().unwrap();
            match b.action.as_str() {
                "publish" => store.set_guide_status(slug, "published"),
                "unpublish" => store.set_guide_status(slug, "draft"),
                "delete" => store.delete_guide_row(slug),
                "recategorize" => store.set_guide_category(slug, &b.value),
                "difficulty" => store.set_guide_difficulty(slug, &b.value),
                _ => unreachable!(),
            }
        };
        if let Err(e) = res {
            return err(e);
        }
        // Keep the search index consistent (status changes add/drop docs; delete purges).
        match b.action.as_str() {
            "publish" | "unpublish" => {
                let _ = state.reindex_guide(slug);
            }
            "delete" => {
                if let Ok(mut w) = state.index.writer() {
                    w.delete_guide(slug);
                    let _ = w.commit();
                }
            }
            _ => {}
        }
        affected += 1;
    }
    Json(json!({ "ok": true, "affected": affected })).into_response()
}

// ===== settings hub (site config + feature flags) =====

/// Settings the admin may edit and the public `/api/site-config` exposes. Whitelisted so this path
/// can never read or overwrite credentials (`admin_password_hash`) or internal keys (`content_sig`).
const SITE_SETTING_KEYS: &[&str] = &[
    "site_name",
    "tagline",
    "sponsors",
    "social",
    "announcement",
    "flag_lofi",
    "flag_runnable",
    "flag_mermaid",
    // JSON array of admin-uploaded lofi tracks: [{title, artist, src}]. The
    // player reads this from /api/site-config; empty falls back to the built-in
    // tracks. Uploaded audio is stored via the asset endpoint (src=/assets/<id>).
    "lofi_tracks",
];

fn read_site_settings(state: &AppState) -> Result<serde_json::Value, content_core::store::StoreError> {
    let store = state.store.lock().unwrap();
    let mut map = serde_json::Map::new();
    for &k in SITE_SETTING_KEYS {
        map.insert(k.to_string(), json!(store.get_setting(k)?.unwrap_or_default()));
    }
    Ok(serde_json::Value::Object(map))
}

/// Admin: read the editable site settings (all whitelisted keys, blank if unset).
pub async fn get_settings(State(state): State<Arc<AppState>>) -> Response {
    match read_site_settings(&state) {
        Ok(v) => Json(v).into_response(),
        Err(e) => err(e),
    }
}

/// Admin: write site settings. Only whitelisted keys are accepted; anything else is ignored.
pub async fn put_settings(State(state): State<Arc<AppState>>, Json(b): Json<HashMap<String, String>>) -> Response {
    let store = state.store.lock().unwrap();
    let mut updated = Vec::new();
    for (k, v) in &b {
        if SITE_SETTING_KEYS.contains(&k.as_str()) {
            if let Err(e) = store.set_setting(k, v) {
                return err(e);
            }
            updated.push(k.clone());
        }
    }
    Json(json!({ "ok": true, "updated": updated })).into_response()
}

/// Public: the site config the frontend reads (name, tagline, sponsors/social JSON, flags).
pub async fn site_config(State(state): State<Arc<AppState>>) -> Response {
    match read_site_settings(&state) {
        Ok(v) => Json(v).into_response(),
        Err(e) => err(e),
    }
}

// ===== reader feedback =====

#[derive(Deserialize)]
pub struct FeedbackInput {
    guide_slug: String,
    phase_no: i64,
    vote: String,
    #[serde(default)]
    note: String,
    #[serde(default)]
    visitor: String,
}

/// Public: a reader posts 👍/👎 (+ optional note) on a phase.
pub async fn submit_feedback(State(state): State<Arc<AppState>>, Json(b): Json<FeedbackInput>) -> Response {
    if b.vote != "up" && b.vote != "down" {
        return (StatusCode::BAD_REQUEST, Json(json!({ "error": "vote must be 'up' or 'down'" }))).into_response();
    }
    let r = {
        state.store.lock().unwrap().insert_feedback(
            &truncate(&b.guide_slug, 128),
            b.phase_no,
            &b.vote,
            &truncate(&b.note, 1000),
            &truncate(&b.visitor, 64),
        )
    };
    match r {
        Ok(_) => StatusCode::NO_CONTENT.into_response(),
        Err(e) => err(e),
    }
}

/// Admin: the feedback inbox (newest first; `?limit=` default 100).
pub async fn list_feedback(State(state): State<Arc<AppState>>, Query(q): Query<HashMap<String, String>>) -> Response {
    let limit: i64 = q.get("limit").and_then(|s| s.parse().ok()).unwrap_or(100).clamp(1, 1000);
    let r = { state.store.lock().unwrap().list_feedback(limit) };
    match r {
        Ok(f) => Json(f).into_response(),
        Err(e) => err(e),
    }
}

#[derive(Deserialize)]
pub struct SetFeedbackDone {
    done: bool,
}

/// Admin: mark a reader request (or any feedback row) done/not-done.
pub async fn set_feedback_done(State(state): State<Arc<AppState>>, Path(id): Path<i64>, Json(b): Json<SetFeedbackDone>) -> Response {
    let r = { state.store.lock().unwrap().set_feedback_done(id, b.done) };
    match r {
        Ok(_) => Json(json!({ "ok": true })).into_response(),
        Err(e) => err(e),
    }
}

// ===== system status =====

/// Admin: API version, DB size, and content counts for the status panel.
pub async fn status(State(state): State<Arc<AppState>>) -> Response {
    let store = state.store.lock().unwrap();
    let build = || -> Result<serde_json::Value, content_core::store::StoreError> {
        let total = store.list_all_guides()?.len();
        let published = store.list_guides()?.len();
        let categories = store.list_categories_rows()?.len();
        Ok(json!({
            "version": env!("CARGO_PKG_VERSION"),
            "dbSizeBytes": store.db_size_bytes()?,
            "guides": { "total": total, "published": published, "draft": total - published },
            "categories": categories,
        }))
    };
    match build() {
        Ok(v) => Json(v).into_response(),
        Err(e) => err(e),
    }
}

// ===== content backlog (demand vs. coverage) =====

/// Admin: top searches scored by how many results they return today - fewest hits + highest
/// demand first, so "people search this and find little" rises to the top as a content backlog.
pub async fn backlog(State(state): State<Arc<AppState>>, Query(q): Query<HashMap<String, String>>) -> Response {
    let days: i64 = q.get("days").and_then(|s| s.parse().ok()).unwrap_or(30).clamp(1, 365);
    let searches = { state.store.lock().unwrap().top_searches(days, 50) };
    let searches = match searches {
        Ok(s) => s,
        Err(e) => return err(e),
    };
    let mut items: Vec<serde_json::Value> = searches
        .into_iter()
        .map(|(query, demand)| {
            let hits = state.index.search(&query, 5).map(|r| r.hits.len()).unwrap_or(0);
            json!({ "query": query, "demand": demand, "hits": hits })
        })
        .collect();
    items.sort_by(|a, b| {
        let (ha, hb) = (a["hits"].as_u64().unwrap_or(0), b["hits"].as_u64().unwrap_or(0));
        ha.cmp(&hb)
            .then(b["demand"].as_i64().unwrap_or(0).cmp(&a["demand"].as_i64().unwrap_or(0)))
    });
    Json(json!({ "days": days, "items": items })).into_response()
}

/// Public: "what should we write next?" - the same failed-search signal as the admin
/// backlog, plus reader-submitted guide requests, merged into one voted list. No auth,
/// no PII (feedback rows never expose their `visitor` column here or anywhere public).
pub async fn public_backlog(State(state): State<Arc<AppState>>, Query(q): Query<HashMap<String, String>>) -> Response {
    let days: i64 = q.get("days").and_then(|s| s.parse().ok()).unwrap_or(30).clamp(1, 365);
    let (searches, requests, votes) = {
        let store = state.store.lock().unwrap();
        let searches = match store.top_searches(days, 30) {
            Ok(s) => s,
            Err(e) => return err(e),
        };
        let requests = match store.list_guide_requests(30) {
            Ok(r) => r,
            Err(e) => return err(e),
        };
        let votes = match store.all_backlog_votes() {
            Ok(v) => v,
            Err(e) => return err(e),
        };
        (searches, requests, votes)
    };

    let mut items: Vec<serde_json::Value> = searches
        .into_iter()
        .map(|(query, demand)| {
            let hits = state.index.search(&query, 5).map(|r| r.hits.len()).unwrap_or(0);
            let key = format!("q:{query}");
            let v = votes.get(&key).copied().unwrap_or(0);
            json!({ "key": key, "kind": "search", "label": query, "demand": demand, "hits": hits, "votes": v })
        })
        .collect();
    items.extend(requests.into_iter().map(|GuideRequest { id, ts, note, done }| {
        let key = format!("r:{id}");
        let v = votes.get(&key).copied().unwrap_or(0);
        json!({ "key": key, "kind": "request", "label": note, "ts": ts, "votes": v, "done": done })
    }));
    // Done items sink to the bottom regardless of votes - the list is "what's still
    // open", not a trophy case. Within each group: votes first, then demand as a tiebreak.
    items.sort_by(|a, b| {
        let da = a["done"].as_bool().unwrap_or(false);
        let db = b["done"].as_bool().unwrap_or(false);
        da.cmp(&db)
            .then(b["votes"].as_i64().unwrap_or(0).cmp(&a["votes"].as_i64().unwrap_or(0)))
            .then(b["demand"].as_i64().unwrap_or(0).cmp(&a["demand"].as_i64().unwrap_or(0)))
    });
    Json(json!({ "days": days, "items": items })).into_response()
}

#[derive(Deserialize)]
pub struct VoteBacklog {
    key: String,
}

/// Public: +1 a backlog item. `key` must match a shape `public_backlog` actually emits
/// (`q:...` or `r:<id>`) - rejects anything else so this can't become an arbitrary counter.
pub async fn vote_backlog(State(state): State<Arc<AppState>>, Json(b): Json<VoteBacklog>) -> Response {
    let key = b.key.trim();
    let valid = (key.starts_with("q:") || key.starts_with("r:")) && key.len() > 2 && key.len() <= 300;
    if !valid {
        return (StatusCode::BAD_REQUEST, Json(json!({ "error": "bad key" }))).into_response();
    }
    let r = { state.store.lock().unwrap().bump_backlog_vote(key) };
    match r {
        Ok(votes) => Json(json!({ "ok": true, "votes": votes })).into_response(),
        Err(e) => err(e),
    }
}

// ===== drag-reorder guides within a category =====

#[derive(Deserialize)]
pub struct ReorderGuides {
    order: Vec<String>,
}

/// Persist a drag-reorder: `order` is one category's guide slugs in the desired order.
pub async fn reorder_guides(State(state): State<Arc<AppState>>, Json(b): Json<ReorderGuides>) -> Response {
    let r = { state.store.lock().unwrap().reorder_guides(&b.order) };
    match r {
        Ok(_) => Json(json!({ "ok": true })).into_response(),
        Err(e) => err(e),
    }
}

// ===== phase edit history (versioning + revert) =====

/// History entries for a phase (newest first).
pub async fn list_revisions(State(state): State<Arc<AppState>>, Path((slug, no)): Path<(String, u32)>) -> Response {
    let r = { state.store.lock().unwrap().list_phase_revisions(&slug, no as i64) };
    match r {
        Ok(v) => Json(v).into_response(),
        Err(e) => err(e),
    }
}

/// One full revision (its markdown, for diffing client-side).
pub async fn get_revision(State(state): State<Arc<AppState>>, Path(id): Path<i64>) -> Response {
    let r = { state.store.lock().unwrap().get_phase_revision(id) };
    match r {
        Ok(Some(rev)) => Json(rev).into_response(),
        Ok(None) => not_found(),
        Err(e) => err(e),
    }
}

/// Restore a phase to a past revision (snapshotting the current content first, so revert is itself undoable).
pub async fn revert_revision(State(state): State<Arc<AppState>>, Path(id): Path<i64>) -> Response {
    let result = {
        let store = state.store.lock().unwrap();
        let rev = match store.get_phase_revision(id) {
            Ok(Some(r)) => r,
            Ok(None) => return not_found(),
            Err(e) => return err(e),
        };
        let no = rev.phase_no as u32;
        let cur = match store.get_phase(&rev.guide_slug, no) {
            Ok(Some(p)) => p,
            Ok(None) => return not_found(),
            Err(e) => return err(e),
        };
        if let Err(e) = store.insert_phase_revision(&rev.guide_slug, rev.phase_no, &cur.title, &cur.summary, &cur.markdown) {
            return err(e);
        }
        let html = links::rewrite_internal_links(&render_markdown(&rev.markdown), &rev.guide_slug);
        let restored = Phase {
            guide_slug: rev.guide_slug.clone(),
            phase_no: no,
            title: rev.title,
            summary: rev.summary,
            tags: cur.tags,
            difficulty: cur.difficulty,
            synonyms: cur.synonyms,
            html,
            updated: cur.updated,
            markdown: rev.markdown,
            source_file: cur.source_file,
        };
        store.upsert_phase(&restored).map(|_| rev.guide_slug.clone())
    };
    match result {
        Ok(slug) => {
            if let Err(e) = state.reindex_guide(&slug) {
                return err(e);
            }
            Json(json!({ "ok": true })).into_response()
        }
        Err(e) => err(e),
    }
}

// ===== content audit (broken links / orphaned assets) =====

/// Scan all phase HTML for broken internal links and missing/orphaned assets.
pub async fn link_check(State(state): State<Arc<AppState>>) -> Response {
    let r = { content_core::audit::check_links(&state.store.lock().unwrap()) };
    match r {
        Ok(report) => Json(report).into_response(),
        Err(e) => err(e),
    }
}

/// Delete every asset that no phase references. The server recomputes the orphan
/// set itself (rather than trusting client-supplied ids) so a stale page can never
/// delete an asset that is actually in use.
pub async fn delete_orphaned_assets(State(state): State<Arc<AppState>>) -> Response {
    let store = state.store.lock().unwrap();
    let report = match content_core::audit::check_links(&store) {
        Ok(r) => r,
        Err(e) => return err(e),
    };
    let mut deleted = 0usize;
    for id in &report.orphaned_assets {
        match store.delete_asset(id) {
            Ok(n) => deleted += n,
            Err(e) => return err(e),
        }
    }
    Json(json!({ "ok": true, "deleted": deleted })).into_response()
}
