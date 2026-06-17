# server Implementation Plan (Platform — Plan 2 of 3)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `server`, an axum HTTP API over `content-core` that serves the guides and natural-language search as JSON.

**Architecture:** A new crate `platform/server` (lib + bin) in the existing workspace. On startup it ingests the Markdown guides into an in-memory `content-core` store + Tantivy index, holds them in shared `AppState`, and exposes four read-only JSON endpoints. The `content-core` crate gains a couple of read methods + serde derives it was missing.

**Tech Stack:** Rust, axum 0.7, tokio, serde/serde_json; tower (dev) for endpoint tests via `oneshot`. Depends on the `content-core` crate from Plan 1.

**Source spec:** `docs/superpowers/specs/2026-06-17-platform-web-first-design.md` (§6 API).

---

## Conventions

- **TDD**, conventional commits, Co-Authored-By trailer (second `-m`), as in Plan 1.
- Run tests with `cargo test --manifest-path platform/Cargo.toml -p server` (and `-p content-core` for Task 1).
- Handlers lock the store mutex, perform the synchronous read, and drop the guard **before** building the response (never hold a lock across an `.await`).

## File Structure

```
/platform/
  Cargo.toml                 (workspace — add "server" to members)
  /core/                     (content-core — Task 1 adds get_guide, list_phase_refs, serde derives)
  /server/
    Cargo.toml               server crate manifest
    src/lib.rs               re-exports: app(), AppState
    src/state.rs             AppState { store, index } + build() (ingests on startup)
    src/routes.rs            Router + the four handlers + error helpers
    src/main.rs              binary: build state, serve on 127.0.0.1:3000
    tests/api.rs             integration tests hitting app() via tower oneshot
```

---

## Task 0: server crate skeleton + health route

**Files:**
- Modify: `platform/Cargo.toml`
- Create: `platform/server/Cargo.toml`
- Create: `platform/server/src/lib.rs`
- Create: `platform/server/src/routes.rs`
- Create: `platform/server/tests/api.rs`

- [ ] **Step 1: Add the crate to the workspace** — `platform/Cargo.toml`

```toml
[workspace]
resolver = "2"
members = ["core", "server"]
```

- [ ] **Step 2: Create the server manifest** — `platform/server/Cargo.toml`

```toml
[package]
name = "server"
version = "0.1.0"
edition = "2021"

[dependencies]
content-core = { path = "../core" }
axum = "0.7"
tokio = { version = "1", features = ["full"] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"

[dev-dependencies]
tower = { version = "0.5", features = ["util"] }
```

- [ ] **Step 3: Write the failing test** — `platform/server/tests/api.rs`

```rust
use axum::body::Body;
use axum::http::{Request, StatusCode};
use tower::ServiceExt; // for `oneshot`

#[tokio::test]
async fn health_returns_ok() {
    let app = server::app_for_test();
    let res = app
        .oneshot(Request::builder().uri("/api/health").body(Body::empty()).unwrap())
        .await
        .unwrap();
    assert_eq!(res.status(), StatusCode::OK);
    let bytes = axum::body::to_bytes(res.into_body(), usize::MAX).await.unwrap();
    assert_eq!(&bytes[..], b"ok");
}
```

- [ ] **Step 4: Run it to verify failure**

Run: `cargo test --manifest-path platform/Cargo.toml -p server`
Expected: FAIL to compile — `server::app_for_test` not found.

- [ ] **Step 5: Minimal router + lib** — `platform/server/src/routes.rs`

```rust
use axum::{routing::get, Router};

pub fn health_router() -> Router {
    Router::new().route("/api/health", get(|| async { "ok" }))
}
```

`platform/server/src/lib.rs`

```rust
pub mod routes;

/// Router with no state, for early tests (health only).
pub fn app_for_test() -> axum::Router {
    routes::health_router()
}
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `cargo test --manifest-path platform/Cargo.toml -p server`
Expected: `health_returns_ok ... ok`.

- [ ] **Step 7: Commit**

```bash
git add platform/ && git commit -m "chore: scaffold server crate with health route" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 1: content-core read methods + serde derives

**Files:**
- Modify: `platform/core/src/models.rs`
- Modify: `platform/core/src/store.rs`

- [ ] **Step 1: Write the failing test** — add to the `tests` mod in `platform/core/src/store.rs`

```rust
    #[test]
    fn get_guide_and_phase_refs() {
        let store = Store::open_in_memory().unwrap();
        store.upsert_guide("git", "Git Guide", "All about git").unwrap();
        store.upsert_phase(&sample_phase()).unwrap();

        let g = store.get_guide("git").unwrap().unwrap();
        assert_eq!(g.title, "Git Guide");
        assert!(store.get_guide("missing").unwrap().is_none());

        let refs = store.list_phase_refs("git").unwrap();
        assert_eq!(refs.len(), 1);
        assert_eq!(refs[0].phase_no, 1);
        assert_eq!(refs[0].title, "The Mental Model");
    }
```

- [ ] **Step 2: Run it to verify failure**

Run: `cargo test --manifest-path platform/Cargo.toml -p content-core get_guide_and_phase_refs`
Expected: FAIL — `get_guide` / `list_phase_refs` / `PhaseRef` not found.

- [ ] **Step 3: Add serde derives + `PhaseRef`** — edit `platform/core/src/models.rs`

Change the derive lines so the API types serialize, and add `PhaseRef`:

```rust
use serde::{Deserialize, Serialize};
```

```rust
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct GuideSummary {
    pub slug: String,
    pub title: String,
    pub summary: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct PhaseRef {
    pub phase_no: u32,
    pub title: String,
    pub summary: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct SearchHit {
    pub guide_slug: String,
    pub phase_no: u32,
    pub title: String,
    pub summary: String,
    pub score: f32,
}
```

Also add `Serialize` to `Phase` (it is returned whole by the phase endpoint):

```rust
#[derive(Debug, Clone, Serialize)]
pub struct Phase {
    pub guide_slug: String,
    pub phase_no: u32,
    pub title: String,
    pub summary: String,
    pub tags: Vec<String>,
    pub difficulty: String,
    pub synonyms: Vec<String>,
    pub html: String,
    pub updated: String,
}
```

- [ ] **Step 4: Add the read methods** — append inside `impl Store` in `platform/core/src/store.rs`

```rust
    pub fn get_guide(&self, slug: &str) -> Result<Option<GuideSummary>, StoreError> {
        let mut stmt = self.conn.prepare("SELECT slug, title, summary FROM guides WHERE slug = ?1")?;
        let mut rows = stmt.query(params![slug])?;
        match rows.next()? {
            Some(row) => Ok(Some(GuideSummary {
                slug: row.get(0)?,
                title: row.get(1)?,
                summary: row.get(2)?,
            })),
            None => Ok(None),
        }
    }

    pub fn list_phase_refs(&self, guide_slug: &str) -> Result<Vec<crate::models::PhaseRef>, StoreError> {
        let mut stmt = self.conn.prepare(
            "SELECT phase_no, title, summary FROM phases WHERE guide_slug = ?1 ORDER BY phase_no",
        )?;
        let rows = stmt.query_map(params![guide_slug], |row| {
            Ok(crate::models::PhaseRef {
                phase_no: row.get::<_, i64>(0)? as u32,
                title: row.get(1)?,
                summary: row.get(2)?,
            })
        })?;
        Ok(rows.collect::<Result<Vec<_>, _>>()?)
    }
```

Add `PhaseRef` to the import at the top of `store.rs`:

```rust
use crate::models::{GuideSummary, Phase, PhaseRef};
```

- [ ] **Step 5: Re-export `PhaseRef`** — in `platform/core/src/lib.rs`, update the `pub use`:

```rust
pub use models::{Frontmatter, GuideSummary, Phase, PhaseRef, SearchHit};
```

- [ ] **Step 6: Run the content-core tests to verify they pass**

Run: `cargo test --manifest-path platform/Cargo.toml -p content-core`
Expected: all prior tests + `get_guide_and_phase_refs` PASS.

- [ ] **Step 7: Commit**

```bash
git add platform/ && git commit -m "feat: content-core get_guide + list_phase_refs + serde derives" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: AppState + GET /api/guides

**Files:**
- Create: `platform/server/src/state.rs`
- Modify: `platform/server/src/routes.rs`
- Modify: `platform/server/src/lib.rs`
- Modify: `platform/server/tests/api.rs`

- [ ] **Step 1: Write the failing test** — add to `platform/server/tests/api.rs`

```rust
use content_core::GuideSummary;

fn repo_root() -> std::path::PathBuf {
    std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("../..").canonicalize().unwrap()
}

#[tokio::test]
async fn lists_guides() {
    let app = server::app(std::sync::Arc::new(server::AppState::build(&repo_root()).unwrap()));
    let res = app
        .oneshot(Request::builder().uri("/api/guides").body(Body::empty()).unwrap())
        .await
        .unwrap();
    assert_eq!(res.status(), StatusCode::OK);
    let bytes = axum::body::to_bytes(res.into_body(), usize::MAX).await.unwrap();
    let guides: Vec<GuideSummary> = serde_json::from_slice(&bytes).unwrap();
    assert!(guides.iter().any(|g| g.slug == "git-explained-like-a-human"));
}
```

- [ ] **Step 2: Run it to verify failure**

Run: `cargo test --manifest-path platform/Cargo.toml -p server lists_guides`
Expected: FAIL — `server::AppState` / `server::app` not found.

- [ ] **Step 3: Create `AppState`** — `platform/server/src/state.rs`

```rust
use std::path::Path;
use std::sync::Mutex;
use content_core::ingest::ingest_dir;
use content_core::store::Store;
use content_core::index::SearchIndex;

/// Shared application state: the SQLite store (behind a mutex — rusqlite is !Sync)
/// and the Tantivy index (already Send + Sync).
pub struct AppState {
    pub store: Mutex<Store>,
    pub index: SearchIndex,
}

impl AppState {
    /// Build state by ingesting the guides under `repo_root` into memory.
    pub fn build(repo_root: &Path) -> Result<Self, Box<dyn std::error::Error>> {
        let store = Store::open_in_memory()?;
        let index = SearchIndex::create_in_ram()?;
        ingest_dir(repo_root, &store, &index)?;
        Ok(Self { store: Mutex::new(store), index })
    }
}
```

- [ ] **Step 4: Add the router + handler** — replace `platform/server/src/routes.rs`

```rust
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
```

- [ ] **Step 5: Export `app` + `AppState`** — replace `platform/server/src/lib.rs`

```rust
pub mod routes;
pub mod state;

pub use routes::{app, health_router};
pub use state::AppState;

/// Router with no state, for early tests (health only).
pub fn app_for_test() -> axum::Router {
    routes::health_router()
}
```

- [ ] **Step 6: Run the server tests to verify they pass**

Run: `cargo test --manifest-path platform/Cargo.toml -p server`
Expected: `health_returns_ok` and `lists_guides` PASS.

- [ ] **Step 7: Commit**

```bash
git add platform/ && git commit -m "feat: AppState (ingest on startup) + GET /api/guides" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: GET /api/guides/:slug and /api/guides/:slug/:phase

**Files:**
- Modify: `platform/server/src/routes.rs`
- Modify: `platform/server/tests/api.rs`

- [ ] **Step 1: Write the failing tests** — add to `platform/server/tests/api.rs`

```rust
#[tokio::test]
async fn guide_detail_and_404() {
    let state = std::sync::Arc::new(server::AppState::build(&repo_root()).unwrap());
    let app = server::app(state);

    let ok = app.clone()
        .oneshot(Request::builder().uri("/api/guides/git-explained-like-a-human").body(Body::empty()).unwrap())
        .await.unwrap();
    assert_eq!(ok.status(), StatusCode::OK);
    let bytes = axum::body::to_bytes(ok.into_body(), usize::MAX).await.unwrap();
    let v: serde_json::Value = serde_json::from_slice(&bytes).unwrap();
    assert!(v["phases"].as_array().unwrap().len() >= 3);

    let missing = app
        .oneshot(Request::builder().uri("/api/guides/nope").body(Body::empty()).unwrap())
        .await.unwrap();
    assert_eq!(missing.status(), StatusCode::NOT_FOUND);
}

#[tokio::test]
async fn phase_detail_and_404() {
    let state = std::sync::Arc::new(server::AppState::build(&repo_root()).unwrap());
    let app = server::app(state);

    let ok = app.clone()
        .oneshot(Request::builder().uri("/api/guides/git-explained-like-a-human/1").body(Body::empty()).unwrap())
        .await.unwrap();
    assert_eq!(ok.status(), StatusCode::OK);
    let bytes = axum::body::to_bytes(ok.into_body(), usize::MAX).await.unwrap();
    let v: serde_json::Value = serde_json::from_slice(&bytes).unwrap();
    assert!(v["html"].as_str().unwrap().contains("<"));

    let missing = app
        .oneshot(Request::builder().uri("/api/guides/git-explained-like-a-human/99").body(Body::empty()).unwrap())
        .await.unwrap();
    assert_eq!(missing.status(), StatusCode::NOT_FOUND);
}
```

- [ ] **Step 2: Run them to verify failure**

Run: `cargo test --manifest-path platform/Cargo.toml -p server guide_detail_and_404`
Expected: FAIL — routes return 404 for everything (handlers/routes not added yet).

- [ ] **Step 3: Add the handlers + routes** — in `platform/server/src/routes.rs`, add the routes to `app()` and the handlers:

In `app()`, add these two `.route(...)` lines before `.with_state(state)`:

```rust
        .route("/api/guides/:slug", get(guide_detail))
        .route("/api/guides/:slug/:phase", get(phase_detail))
```

Add the imports at the top (extend the `axum::extract` use):

```rust
use axum::extract::Path;
use serde::Serialize;
use content_core::{GuideSummary, PhaseRef};
```

Add the handlers and the response struct:

```rust
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
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cargo test --manifest-path platform/Cargo.toml -p server`
Expected: all server tests so far PASS (health, guides, guide_detail_and_404, phase_detail_and_404).

- [ ] **Step 5: Commit**

```bash
git add platform/ && git commit -m "feat: guide-detail and phase-detail endpoints (with 404s)" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: GET /api/search

**Files:**
- Modify: `platform/server/src/routes.rs`
- Modify: `platform/server/tests/api.rs`

- [ ] **Step 1: Write the failing tests** — add to `platform/server/tests/api.rs`

```rust
use content_core::SearchHit;

#[tokio::test]
async fn search_returns_hits_and_rejects_empty() {
    let state = std::sync::Arc::new(server::AppState::build(&repo_root()).unwrap());
    let app = server::app(state);

    let res = app.clone()
        .oneshot(Request::builder().uri("/api/search?q=how%20to%20revert%20a%20commit").body(Body::empty()).unwrap())
        .await.unwrap();
    assert_eq!(res.status(), StatusCode::OK);
    let bytes = axum::body::to_bytes(res.into_body(), usize::MAX).await.unwrap();
    let hits: Vec<SearchHit> = serde_json::from_slice(&bytes).unwrap();
    assert_eq!(hits[0].phase_no, 3);

    let empty = app
        .oneshot(Request::builder().uri("/api/search?q=").body(Body::empty()).unwrap())
        .await.unwrap();
    assert_eq!(empty.status(), StatusCode::BAD_REQUEST);
}
```

- [ ] **Step 2: Run it to verify failure**

Run: `cargo test --manifest-path platform/Cargo.toml -p server search_returns_hits_and_rejects_empty`
Expected: FAIL — `/api/search` route returns 404.

- [ ] **Step 3: Add the search handler + route** — in `platform/server/src/routes.rs`:

Add the route in `app()` before `.with_state(state)`:

```rust
        .route("/api/search", get(search))
```

Add the import for the query extractor and Deserialize:

```rust
use axum::extract::Query;
use serde::Deserialize;
```

Add the handler:

```rust
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
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cargo test --manifest-path platform/Cargo.toml -p server`
Expected: all server tests PASS, including `search_returns_hits_and_rejects_empty`.

- [ ] **Step 5: Commit**

```bash
git add platform/ && git commit -m "feat: GET /api/search (lexical + fuzzy) with empty-query guard" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: main binary + run verification

**Files:**
- Create: `platform/server/src/main.rs`

- [ ] **Step 1: Write the binary** — `platform/server/src/main.rs`

```rust
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
```

- [ ] **Step 2: Verify the whole workspace builds and all tests pass**

Run: `cargo test --manifest-path platform/Cargo.toml`
Expected: content-core tests + all server tests PASS.

- [ ] **Step 3: Smoke-test the running server** (background it, curl, then stop)

Run:
```bash
cargo run --manifest-path platform/Cargo.toml -p server &
sleep 4
curl -s "http://127.0.0.1:3000/api/search?q=undo%20a%20commit" | head -c 300
echo
curl -s "http://127.0.0.1:3000/api/guides" | head -c 300
kill %1
```
Expected: the search returns a JSON array whose first hit is a Phase-3 result; `/api/guides` returns the Git guide.

- [ ] **Step 4: Commit**

```bash
git add platform/ && git commit -m "feat: server binary serving the API on 127.0.0.1:3000" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Definition of Done

- `cargo test --manifest-path platform/Cargo.toml` is green (content-core + server).
- `cargo run -p server` serves `/api/health`, `/api/guides`, `/api/guides/:slug`, `/api/guides/:slug/:phase`, and `/api/search?q=` on `127.0.0.1:3000`.
- Search over the live API returns the right phase (e.g. "undo a commit" → a Phase-3 hit), 404s on unknown guide/phase, 400s on empty query.
- The API is ready for the SvelteKit `web` plan (Plan 3) to consume.

## Self-Review

**Spec coverage:** Implements spec §6 exactly — the four endpoints, JSON bodies, 404/400 errors. Reuses content-core's search (§5) and store (§4). §7 "smooth updates" is satisfied for the web path (ingest-on-startup; re-running the server re-ingests). Desktop/frecency (§10–11) remain out of scope.
**Placeholders:** none — every step has real test + handler code and exact commands.
**Type consistency:** `AppState { store: Mutex<Store>, index: SearchIndex }`, `app(Arc<AppState>) -> Router`, and the content-core additions (`get_guide`, `list_phase_refs`, `PhaseRef`, serde derives) are defined once and used consistently. `GuideDetail { guide, phases }` matches the test's `v["phases"]`/`v["guide"]` access.
