# Admin Console B1 — Part A: Backend (CMS API, persistence, auth)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan
> task-by-task. Steps use checkbox (`- [ ]`) syntax. Part B (admin SvelteKit UI) is a separate plan, written
> after this backend is built + verified.

**Goal:** Turn the platform into a database-backed CMS backend: persistent SQLite as source of truth,
draft/published guides, DB-driven categories, Markdown source stored + re-rendered on write, live search
re-indexing, image assets, and an authenticated `/api/admin` API.

**Architecture:** `content-core` gains schema + store methods + import-captures-markdown; `server` switches
`AppState` to a persistent DB, rebuilds the Tantivy index from the DB on boot, updates it incrementally on
writes, and serves auth + admin CRUD + assets. Public read paths filter to `published`.

**Spec:** `docs/superpowers/specs/2026-06-17-admin-cms-b1-design.md`.

**Grounding (verified):** `Store::open(path)` exists; `AppState { store: Mutex<Store>, index: SearchIndex }`;
`SearchIndex::open_or_create(dir)`, `writer()->Writer{add_phase(&Phase,&str), delete_guide(&str), commit()}`,
`search()`; `render::render_markdown(md)->String` (comrak GFM). Timestamps use SQLite `CURRENT_TIMESTAMP` /
`datetime('now')` — no date crate.

**Test command:** `cargo test --manifest-path platform/Cargo.toml`

---

## Task 1: Schema migrations + new tables (content-core `store.rs`)

**Files:** Modify `platform/core/src/store.rs`

- [ ] **Step 1: Failing test** — add to `store.rs` tests: open a temp-file DB, assert new columns/tables exist
and survive reopen.
```rust
#[test]
fn migrations_add_columns_and_tables() {
    let dir = tempfile::tempdir().unwrap();
    let path = dir.path().join("t.db");
    { let s = Store::open(&path).unwrap();
      s.upsert_guide("g","T","S","version-control","beginner").unwrap();
      s.set_guide_status("g","draft").unwrap(); }
    let s = Store::open(&path).unwrap(); // reopen
    assert_eq!(s.guide_status("g").unwrap(), "draft");
    assert!(s.list_categories_rows().unwrap().iter().any(|c| c.slug=="version-control"));
}
```
- [ ] **Step 2: Run** `cargo test -p content-core migrations_add_columns_and_tables` → FAIL (methods missing).
- [ ] **Step 3: Implement** in `from_conn` after the existing `CREATE TABLE` batch — additive migration + new
tables + category seed:
```rust
// additive column migrations (ignore "duplicate column" errors)
for stmt in [
    "ALTER TABLE guides ADD COLUMN status TEXT NOT NULL DEFAULT 'published'",
    "ALTER TABLE guides ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0",
    "ALTER TABLE guides ADD COLUMN created_at TEXT NOT NULL DEFAULT (datetime('now'))",
    "ALTER TABLE guides ADD COLUMN updated_at TEXT NOT NULL DEFAULT (datetime('now'))",
    "ALTER TABLE phases ADD COLUMN markdown TEXT NOT NULL DEFAULT ''",
] { let _ = conn.execute(stmt, []); }
conn.execute_batch(
    "CREATE TABLE IF NOT EXISTS categories (
        slug TEXT PRIMARY KEY, name TEXT NOT NULL, icon TEXT NOT NULL,
        blurb TEXT NOT NULL, sort_order INTEGER NOT NULL DEFAULT 0);
     CREATE TABLE IF NOT EXISTS assets (
        id TEXT PRIMARY KEY, filename TEXT, mime TEXT NOT NULL, bytes BLOB NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')));
     CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY, created_at TEXT NOT NULL DEFAULT (datetime('now')),
        expires_at TEXT NOT NULL);",
)?;
```
Add `tempfile` to `[dev-dependencies]` in `platform/core/Cargo.toml` if absent.
- [ ] **Step 4: Run** the test → still FAIL (store methods come in Task 2/3). Proceed; full pass at Task 3.
- [ ] **Step 5: Commit** `feat(core): CMS schema migrations + categories/assets/sessions tables`.

---

## Task 2: Guide status + Markdown source store methods (content-core)

**Files:** Modify `platform/core/src/models.rs`, `platform/core/src/store.rs`

- [ ] **Step 1: Failing test** in `store.rs` tests:
```rust
#[test]
fn drafts_excluded_from_public_list() {
    let s = Store::open_in_memory().unwrap();
    s.upsert_guide("a","A","s","version-control","beginner").unwrap();
    s.upsert_guide("b","B","s","version-control","beginner").unwrap();
    s.set_guide_status("b","draft").unwrap();
    let public: Vec<_> = s.list_guides().unwrap().into_iter().map(|g| g.slug).collect();
    assert!(public.contains(&"a".to_string()) && !public.contains(&"b".to_string()));
    assert_eq!(s.list_all_guides().unwrap().len(), 2); // admin sees both
}
```
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement.** In `models.rs` add `pub markdown: String` to `Phase` (update its constructor sites
+ the index.rs test `phase()` helper to include `markdown: String::new()`). Add to `store.rs`:
```rust
pub fn set_guide_status(&self, slug:&str, status:&str)->Result<(),StoreError>{
    self.conn.execute("UPDATE guides SET status=?2, updated_at=datetime('now') WHERE slug=?1",
        params![slug,status])?; Ok(())
}
pub fn guide_status(&self, slug:&str)->Result<String,StoreError>{
    Ok(self.conn.query_row("SELECT status FROM guides WHERE slug=?1", params![slug], |r| r.get(0))?)
}
```
Change `list_guides` and `guides_for_category` SQL to add `WHERE status='published'`; add `list_all_guides`
(same as old `list_guides`, no status filter) via a shared `row_to_guide` helper. Update `upsert_phase` to
write `markdown` (add `markdown=?N` to the column list + `ON CONFLICT` update; bind `p.markdown`).
- [ ] **Step 4: Run** both Task-1 and Task-2 tests → Task 2 PASSES; Task 1 still needs `list_categories_rows`
(Task 3).
- [ ] **Step 5: Commit** `feat(core): draft/published guide status + markdown source on phases`.

---

## Task 3: DB-driven categories (content-core `categories.rs` + `store.rs`)

**Files:** Modify `platform/core/src/categories.rs`, `platform/core/src/store.rs`

- [ ] **Step 1: Failing test** in `categories.rs` tests:
```rust
#[test]
fn categories_seed_and_count_published_only() {
    let s = Store::open_in_memory().unwrap();
    seed_categories(&s).unwrap();
    s.upsert_guide("g","T","S","version-control","beginner").unwrap(); // published
    let cats = categories_with_counts(&s).unwrap();
    let vc = cats.iter().find(|c| c.slug=="version-control").unwrap();
    assert_eq!(vc.count, 1);
    assert!(cats.len() >= 7);
}
```
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement.** Add store methods: `CategoryRow { slug,name,icon,blurb,sort_order }`;
`list_categories_rows()`, `upsert_category(&CategoryRow)`, `delete_category(slug)`,
`reorder_categories(&[slug])`, `count_published_in_category(slug)->i64`. In `categories.rs` add
`seed_categories(store)` that upserts the existing `DEFS` (only if the table is empty), and rewrite
`categories_with_counts(store)` to read `list_categories_rows()` + `count_published_in_category` (replacing
the const-driven path). Keep `Category { slug,name,icon,blurb,count }`.
- [ ] **Step 4: Run** Task 1 + Task 3 tests → PASS.
- [ ] **Step 5: Commit** `feat(core): DB-backed categories (seed from defaults, count published)`.

---

## Task 4: Import captures Markdown source (content-core `ingest.rs`)

**Files:** Modify `platform/core/src/ingest.rs` (+ check `frontmatter.rs`)

- [ ] **Step 1: Failing test** in `ingest.rs` tests: ingest a temp guide dir, assert the stored phase has
non-empty `markdown` and the guide is `published`.
```rust
#[test]
fn ingest_stores_markdown_source() {
    // build a tiny guides/<slug>/_guide.md + 01-*.md under a tempdir, then:
    let s = Store::open_in_memory().unwrap();
    let idx = crate::index::SearchIndex::create_in_ram().unwrap();
    ingest_dir(dir.path(), &s, &idx).unwrap();
    let p = s.get_phase("demo", 1).unwrap().unwrap();
    assert!(!p.markdown.is_empty());
}
```
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement.** Where `ingest_dir` reads each phase file and calls `render_markdown`, set
`Phase.markdown` to the raw file body (post-frontmatter) before rendering. Call `seed_categories(store)` at
the start of `ingest_dir` so categories exist. (Keep the existing category/difficulty handling.)
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `feat(core): keep markdown source when ingesting`.

---

## Task 5: Persistent AppState + boot index rebuild + CLI (server)

**Files:** Modify `platform/server/src/state.rs`, `platform/server/src/main.rs`; add `platform/server/src/reindex.rs`

- [ ] **Step 1:** Add to `state.rs` a full reindex from the DB + the persistent build:
```rust
impl AppState {
    pub fn build_persistent(db_path:&Path, content_root:Option<&Path>)
        -> Result<Self, Box<dyn std::error::Error>> {
        let store = Store::open(db_path)?;
        content_core::categories::seed_categories(&store)?;
        if store.list_all_guides()?.is_empty() {
            if let Some(root) = content_root {
                let idx = SearchIndex::create_in_ram();
                ingest_dir(root, &store, &idx?)?; // import once
            }
        }
        let index = SearchIndex::create_in_ram()?;
        let me = Self { store: Mutex::new(store), index, /* + auth fields (Task 7) */ };
        me.rebuild_index()?; // published phases only
        Ok(me)
    }
    pub fn rebuild_index(&self) -> Result<(), Box<dyn std::error::Error>> {
        let store = self.store.lock().unwrap();
        let mut w = self.index.writer()?;
        for g in store.list_guides()? {                 // published guides
            for pref in store.list_phase_refs(&g.slug)? {
                if let Some(p) = store.get_phase(&g.slug, pref.phase_no)? {
                    w.add_phase(&p, &strip_html(&p.html));
                }
            }
        }
        w.commit()?; Ok(())
    }
}
```
Add `reindex.rs` with `pub fn strip_html(html:&str)->String` (regex `<[^>]+>` → " ", collapse spaces) — or
reuse ingest's existing plain-text helper if present. (Note: `ingest_dir` imports as published; the
in-RAM idx during import is discarded — the real index is the rebuilt one.)
- [ ] **Step 2:** `main.rs` — read `DB_PATH` (default `./data/manual.db`, `create_dir_all` the parent) +
`CONTENT_ROOT`; dispatch CLI:
```rust
match std::env::args().nth(1).as_deref() {
    Some("import") => { AppState::build_persistent(&db, Some(&content_root))?; println!("imported"); }
    Some("hash-password") => { println!("{}", auth::hash_password(&std::env::args().nth(2).expect("password"))); }
    _ => { /* build_persistent + serve (ConnectInfo for rate-limit, Task 7) */ }
}
```
- [ ] **Step 3:** Build: `cargo build --manifest-path platform/Cargo.toml -p server`. Expected: compiles
(auth bits stubbed until Task 7 — gate behind feature/order so this builds, or implement Task 7 before main's
hash-password arm).
- [ ] **Step 4:** Manual: delete `data/`, run `server import`, confirm `data/manual.db` exists and
`sqlite3` shows the Git guide with `markdown` populated.
- [ ] **Step 5: Commit** `feat(server): persistent DB, import-if-empty, boot index rebuild`.

---

## Task 6: Incremental re-index on write (server `state.rs`)

**Files:** Modify `platform/server/src/state.rs`

- [ ] **Step 1: Test** (server tests): create a published guide+phase via store, `reindex_guide`, assert
`index.search` finds it; set draft + `reindex_guide`, assert it's gone.
- [ ] **Step 2: Implement:**
```rust
pub fn reindex_guide(&self, slug:&str) -> Result<(), Box<dyn std::error::Error>> {
    let store = self.store.lock().unwrap();
    let mut w = self.index.writer()?;
    w.delete_guide(slug);
    if store.guide_status(slug).unwrap_or_default() == "published" {
        for pref in store.list_phase_refs(slug)? {
            if let Some(p) = store.get_phase(slug, pref.phase_no)? { w.add_phase(&p, &strip_html(&p.html)); }
        }
    }
    w.commit()?; Ok(())
}
```
- [ ] **Step 3: Run** → PASS. **Step 4: Commit** `feat(server): incremental search re-index on content change`.

---

## Task 7: Auth — argon2 + sessions + middleware + rate-limit (server `auth.rs`)

**Files:** Create `platform/server/src/auth.rs`; modify `state.rs`, `lib.rs`, `routes.rs`, `Cargo.toml`

- [ ] **Step 1: Deps** in `platform/server/Cargo.toml`: `argon2`, `rand`, `axum-extra = { version="0.9",
features=["cookie"] }`, and enable axum `multipart` feature (used in Task 12). Session methods in `store.rs`:
`create_session(id,expires_at)`, `session_valid(id)->bool` (exists AND `expires_at > datetime('now')`),
`delete_session(id)`, `purge_expired_sessions()`.
- [ ] **Step 2: Test** (`auth.rs` tests): `verify_password(&hash_password("pw"),"pw")` is true, wrong is false.
- [ ] **Step 3: Implement `auth.rs`:**
```rust
use argon2::{Argon2, PasswordHasher, PasswordVerifier, password_hash::{SaltString, PasswordHash, rand_core::OsRng}};
pub fn hash_password(pw:&str)->String{
    let salt=SaltString::generate(&mut OsRng);
    Argon2::default().hash_password(pw.as_bytes(),&salt).unwrap().to_string()
}
pub fn verify_password(hash:&str, pw:&str)->bool{
    PasswordHash::new(hash).ok().map(|h| Argon2::default().verify_password(pw.as_bytes(),&h).is_ok()).unwrap_or(false)
}
pub fn new_session_id()->String{ /* 32 random bytes hex via rand */ }
```
Add to `AppState`: `admin_hash: Option<String>` (from `ADMIN_PASSWORD_HASH`), `login_attempts:
Mutex<HashMap<IpAddr,(u32,Instant)>>`. Handlers (in `routes.rs` or `auth.rs`):
- `POST /api/admin/login`: rate-limit by `ConnectInfo<SocketAddr>` IP (≥5 fails/5min → 429); verify against
  `admin_hash`; on ok create a session (expiry +30d), set cookie `admin_session=<id>; HttpOnly; SameSite=Strict;
  Path=/; Max-Age=...; Secure` via `CookieJar`; else 401.
- `POST /api/admin/logout`: delete session + removal cookie. `GET /api/admin/me`: 200/401.
- `require_admin` middleware (`axum::middleware::from_fn_with_state`): read `admin_session` cookie →
  `session_valid` → else `401`. Apply to the admin router (Task 9) except `login`.
- [ ] **Step 4: Test** (server integration with `app`): login wrong→401; right→Set-Cookie; `/me` with cookie→200,
without→401; logout→`/me` 401; 6th rapid wrong login→429.
- [ ] **Step 5: Commit** `feat(server): admin auth (argon2 + session cookie + rate limit)`.

---

## Task 8: Public endpoints filter to published (server `routes.rs`)

**Files:** Modify `platform/server/src/routes.rs`

- [ ] **Step 1: Test:** with a draft guide present, `GET /api/guides` omits it; `GET /api/categories` count
excludes it; `GET /api/search?q=<draft term>` returns nothing. (Search already excludes drafts via Task 6;
list/category via Task 2/3 store filters — this task asserts the HTTP layer end-to-end.)
- [ ] **Step 2: Implement:** confirm handlers call the published-filtered store methods (`list_guides`,
`categories_with_counts`, `guides_for_category`). Adjust any that still call `list_all_guides`.
- [ ] **Step 3: Run** → PASS. **Step 4: Commit** `feat(server): public API shows only published content`.

---

## Task 9: Admin guides CRUD API (server `routes.rs`)

**Files:** Modify `platform/server/src/routes.rs`

- [ ] **Step 1: Test:** `POST /api/admin/guides` (authed) creates a draft → absent from `GET /api/guides`,
present in `GET /api/admin/guides`; `PATCH .../status=published` → now in public list.
- [ ] **Step 2: Implement** an admin `Router` (nested at `/api/admin`, `require_admin` layer except login):
- `GET /guides` → `list_all_guides`; `POST /guides {slug,title,summary,category,difficulty}` → `upsert_guide`
  + `set_guide_status(slug,"draft")`; `GET /guides/:slug`; `PATCH /guides/:slug {..}` → update fields (+
  `reindex_guide` on status/visible content change); `DELETE /guides/:slug` (+ delete phases + `delete_guide`
  index). Each handler locks `store`. Show the create handler fully; the rest follow the same pattern (lock
  store → call store method → `reindex_guide` if needed → JSON).
- [ ] **Step 3: Run** → PASS. **Step 4: Commit** `feat(server): admin guides CRUD`.

---

## Task 10: Admin phases CRUD + reorder + preview (server `routes.rs`)

**Files:** Modify `platform/server/src/routes.rs`, `platform/core/src/store.rs`

- [ ] **Step 1: Test:** create a phase with markdown ``"## Hi\n\n`code`"`` → stored `html` contains `<h2>`;
`reindex_guide` makes it searchable when published; `POST /api/admin/preview {markdown}` returns matching html.
- [ ] **Step 2: Implement.** Store: `delete_phase(slug,no)`, `reorder_phases(slug,&[no])`,
`next_phase_no(slug)`. Handlers: `GET/POST /guides/:slug/phases`, `PATCH/DELETE /guides/:slug/phases/:no`,
`POST /guides/:slug/phases/reorder`. On create/update: `html = links::rewrite_internal_links(render_markdown(&md), slug)`,
store markdown+html, `reindex_guide`. `POST /preview {markdown}` → `{ html: render_markdown(md) }` (no persistence).
- [ ] **Step 3: Run** → PASS. **Step 4: Commit** `feat(server): admin phases CRUD + markdown preview`.

---

## Task 11: Admin categories CRUD + reorder (server `routes.rs`)

**Files:** Modify `platform/server/src/routes.rs`

- [ ] **Step 1: Test:** `POST /api/admin/categories {slug,name,icon,blurb}` → appears in `GET /api/categories`
with count 0; `PATCH` renames; `DELETE` on an empty category removes it (non-empty → 409).
- [ ] **Step 2: Implement** handlers over the Task-3 store methods (`upsert_category`, `delete_category` guarded
by `count_published_in_category`/any-guides check, `reorder_categories`).
- [ ] **Step 3: Run** → PASS. **Step 4: Commit** `feat(server): admin categories CRUD`.

---

## Task 12: Assets — upload + serve (server `routes.rs`, content-core `store.rs`)

**Files:** Modify `platform/server/src/routes.rs`, `platform/core/src/store.rs`, `platform/server/Cargo.toml`

- [ ] **Step 1: Test:** store `insert_asset(id,filename,mime,bytes)` then `get_asset(id)` returns same bytes+mime.
- [ ] **Step 2: Implement.** Store: `insert_asset`, `get_asset(id)->Option<(mime,filename,Vec<u8>)>`. Handlers:
`POST /api/admin/assets` (axum `Multipart`, authed) → store blob with a `uuid` id, return `{id, url:"/assets/<id>"}`;
public `GET /assets/:id` → bytes with `Content-Type: <mime>` (404 if missing). Add `uuid` dep to server.
- [ ] **Step 3: Run** → PASS. **Step 4: Commit** `feat(server): image asset upload + serving`.

---

## Task 13: Wire router, Docker volume, full verify

**Files:** Modify `platform/server/src/routes.rs`, `docker-compose.yml`

- [ ] **Step 1:** In `app(state)`, merge the public router + the admin router + the `/assets/:id` route. Ensure
`main.rs` serves with `into_make_service_with_connect_info::<SocketAddr>()` (for login rate-limit IP).
- [ ] **Step 2:** `docker-compose.yml` — give the API a persisted volume for `./data` and set
`DB_PATH=/data/manual.db`, `CONTENT_ROOT=/app` (for first-run import); document `ADMIN_PASSWORD_HASH` env.
- [ ] **Step 3:** `cargo test --manifest-path platform/Cargo.toml` → all green (target ~30+ tests).
- [ ] **Step 4:** Smoke (local): `server hash-password secret` → put hash in env; `server` boots; `curl` login
→ cookie; create a draft guide + phase via admin API; confirm absent from `/api/guides`; publish; confirm
present + searchable; upload an asset; `GET /assets/<id>` returns the bytes.
- [ ] **Step 5: Commit** `feat(server): mount admin API + assets, persistent data volume`.

---

## Self-review
- **Spec coverage:** persistence shift (T1,T5) ✓; schema incl. status/markdown/categories/assets/sessions
  (T1,T2,T3) ✓; DB categories (T3) ✓; import keeps markdown (T4) ✓; auth+sessions+rate-limit (T7) ✓; public
  filtering (T8) ✓; live re-index (T6) ✓; guides/phases/categories CRUD + preview (T9,T10,T11) ✓; assets
  (T12) ✓; Docker volume + wiring (T13) ✓. Analytics correctly absent (B2).
- **Naming consistency:** `set_guide_status`/`guide_status`/`list_all_guides`/`reindex_guide`/`strip_html`/
  `seed_categories`/`hash_password`/`verify_password`/`require_admin` used consistently across tasks.
- **Placeholders:** the routine CRUD handlers reference a fully-shown pattern (create handler in T9, phase
  write in T10); load-bearing code (schema, auth, reindex, build) is given in full.
- **Out of scope:** admin UI = Part B (separate plan, after this is verified).
