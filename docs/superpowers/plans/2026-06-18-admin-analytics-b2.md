# Admin Console B2 — Analytics: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Builds on B1 (admin API +
> BFF proxy + `require_admin`). Rust verified by `cargo test`; web by build + live browse.

**Goal:** Privacy-friendly built-in analytics — a client beacon → web collector (daily-rotating visitor
hash) → API `events` table, surfaced in an `/admin/analytics` dashboard.

**Spec:** `docs/superpowers/specs/2026-06-18-admin-analytics-b2-design.md`.

**Test command:** `cargo test --manifest-path platform/Cargo.toml`

---

### Task 1: events table + analytics store methods (content-core `store.rs`)

- [ ] **Step 1: Test** in `store.rs` tests:
```rust
#[test]
fn analytics_counts_and_uniques() {
    let s = Store::open_in_memory().unwrap();
    s.record_event("pageview", "/guides/git", "google.com", "vA", "").unwrap();
    s.record_event("pageview", "/guides/git", "", "vA", "").unwrap(); // same visitor
    s.record_event("pageview", "/", "reddit.com", "vB", "").unwrap();
    s.record_event("search", "/search", "", "vB", "rebase").unwrap();
    let (views, uniq, searches) = s.analytics_totals(30).unwrap();
    assert_eq!(views, 3);
    assert_eq!(uniq, 2);
    assert_eq!(searches, 1);
    assert_eq!(s.top_paths(30, 10).unwrap()[0], ("/guides/git".into(), 2));
    assert_eq!(s.top_searches(30, 10).unwrap()[0], ("rebase".into(), 1));
    assert!(s.top_referrers(30, 10).unwrap().iter().any(|(r, _)| r == "google.com"));
}
```
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement.** In `from_conn` migrations add:
```rust
conn.execute_batch(
    "CREATE TABLE IF NOT EXISTS events (
         ts TEXT NOT NULL DEFAULT (datetime('now')),
         kind TEXT NOT NULL, path TEXT NOT NULL,
         referrer TEXT, visitor TEXT NOT NULL, query TEXT
     );
     CREATE INDEX IF NOT EXISTS idx_events_ts ON events(ts);",
)?;
```
Add methods (window via `datetime('now', ?1)` bound as `format!("-{} days", days)`):
```rust
pub fn record_event(&self, kind:&str, path:&str, referrer:&str, visitor:&str, query:&str) -> Result<(), StoreError> {
    self.conn.execute(
        "INSERT INTO events (kind, path, referrer, visitor, query) VALUES (?1,?2,?3,?4,?5)",
        params![kind, path, referrer, visitor, query])?;
    Ok(())
}
pub fn analytics_totals(&self, days:i64) -> Result<(i64,i64,i64), StoreError> {
    let w = format!("-{days} days");
    let views: i64 = self.conn.query_row("SELECT COUNT(*) FROM events WHERE kind='pageview' AND ts>=datetime('now',?1)", params![w], |r| r.get(0))?;
    let uniq: i64 = self.conn.query_row("SELECT COUNT(DISTINCT visitor) FROM events WHERE kind='pageview' AND ts>=datetime('now',?1)", params![w], |r| r.get(0))?;
    let searches: i64 = self.conn.query_row("SELECT COUNT(*) FROM events WHERE kind='search' AND ts>=datetime('now',?1)", params![w], |r| r.get(0))?;
    Ok((views, uniq, searches))
}
pub fn views_per_day(&self, days:i64) -> Result<Vec<(String,i64)>, StoreError> {
    let w = format!("-{days} days");
    let mut stmt = self.conn.prepare("SELECT date(ts) d, COUNT(*) FROM events WHERE kind='pageview' AND ts>=datetime('now',?1) GROUP BY d ORDER BY d")?;
    let rows = stmt.query_map(params![w], |r| Ok((r.get::<_,String>(0)?, r.get::<_,i64>(1)?)))?;
    Ok(rows.collect::<Result<Vec<_>,_>>()?)
}
// top_paths / top_referrers / top_searches: same shape, differing WHERE/GROUP BY:
//   top_paths:     kind='pageview'                  GROUP BY path
//   top_referrers: referrer IS NOT NULL AND referrer<>'' GROUP BY referrer
//   top_searches:  kind='search' AND query<>''      GROUP BY query
// each: ORDER BY COUNT(*) DESC LIMIT ?2 ; returns Vec<(String,i64)>
```
Write `top_paths`, `top_referrers`, `top_searches` in full following that note (a shared private helper
`top_by(&self, where_sql, col, days, limit)` is fine).
- [ ] **Step 4: Run** → PASS. **Step 5: Commit** `feat(core): analytics events table + aggregation queries`.

---

### Task 2: `/api/events` + `/api/admin/analytics` (server)

**Files:** Modify `platform/server/src/admin.rs`, `platform/server/src/routes.rs`

- [ ] **Step 1: Test** (`tests/api.rs`): `POST /api/events {kind:"pageview",path:"/x",visitor:"v1"}` → 204;
invalid kind → 400; `GET /api/admin/analytics` without cookie → 401; with cookie → 200 and JSON has
`views`/`uniqueVisitors`/`topPaths` keys.
- [ ] **Step 2: Implement.** In `admin.rs`:
```rust
#[derive(Deserialize)]
pub struct EventInput { kind:String, path:String, #[serde(default)] referrer:String, visitor:String, #[serde(default)] query:String }

pub async fn record_event(State(state): State<Arc<AppState>>, Json(e): Json<EventInput>) -> Response {
    if e.kind != "pageview" && e.kind != "search" {
        return (StatusCode::BAD_REQUEST, Json(json!({"error":"bad kind"}))).into_response();
    }
    let r = { state.store.lock().unwrap().record_event(
        &e.kind, &truncate(&e.path,512), &truncate(&e.referrer,255), &truncate(&e.visitor,64), &truncate(&e.query,255)) };
    match r { Ok(_) => StatusCode::NO_CONTENT.into_response(), Err(e) => err(e) }
}

pub async fn analytics(State(state): State<Arc<AppState>>, axum::extract::Query(q): axum::extract::Query<std::collections::HashMap<String,String>>) -> Response {
    let days: i64 = q.get("days").and_then(|s| s.parse().ok()).unwrap_or(30).clamp(1, 365);
    let store = state.store.lock().unwrap();
    let res = (|| {
        let (views, uniq, searches) = store.analytics_totals(days)?;
        Ok::<_, content_core::store::StoreError>(json!({
            "views": views, "uniqueVisitors": uniq, "searches": searches,
            "perDay": store.views_per_day(days)?.into_iter().map(|(d,c)| json!({"day":d,"count":c})).collect::<Vec<_>>(),
            "topPaths": store.top_paths(days,10)?.into_iter().map(|(p,c)| json!({"path":p,"count":c})).collect::<Vec<_>>(),
            "topReferrers": store.top_referrers(days,10)?.into_iter().map(|(p,c)| json!({"referrer":p,"count":c})).collect::<Vec<_>>(),
            "topSearches": store.top_searches(days,10)?.into_iter().map(|(p,c)| json!({"query":p,"count":c})).collect::<Vec<_>>()
        }))
    })();
    match res { Ok(v) => Json(v).into_response(), Err(e) => err(e) }
}

fn truncate(s:&str, n:usize) -> String { s.chars().take(n).collect() }
```
- [ ] **Step 3:** In `routes.rs`: add `.route("/api/events", post(admin::record_event))` to the PUBLIC router
(no auth), and `.route("/analytics", get(admin::analytics))` to the `protected` admin router.
- [ ] **Step 4: Run** → PASS. **Step 5: Commit** `feat(server): event ingest + admin analytics endpoint`.

---

### Task 3: Beacon + collector (web)

**Files:** Create `platform/web/src/lib/beacon.js`, `platform/web/src/routes/analytics/collect/+server.js`;
modify `platform/web/src/routes/+layout.svelte`

- [ ] **Step 1:** `$lib/beacon.js`:
```js
export function sendPageview(url) {
  if (typeof navigator === 'undefined' || !navigator.sendBeacon) return;
  const path = url.pathname;
  let kind = 'pageview', query = '';
  if (path === '/search') {
    const q = url.searchParams.get('q') || '';
    if (q) { kind = 'search'; query = q; }
  }
  try {
    navigator.sendBeacon('/analytics/collect', JSON.stringify({ path, kind, query, referrer: document.referrer || '' }));
  } catch {}
}
```
- [ ] **Step 2:** `routes/analytics/collect/+server.js`:
```js
import crypto from 'node:crypto';
import { API_BASE } from '$lib/server/adminApi.js';
const SALT = process.env.ANALYTICS_SALT || 'tmm-analytics-salt';

export async function POST({ request, getClientAddress, url }) {
  let data = {};
  try { data = JSON.parse(await request.text()); } catch { return new Response(null, { status: 204 }); }
  const ip = getClientAddress();
  const ua = request.headers.get('user-agent') || '';
  const day = new Date().toISOString().slice(0, 10);
  const visitor = crypto.createHash('sha256').update(day + ip + ua + SALT).digest('hex').slice(0, 32);
  let referrer = '';
  try { if (data.referrer) { const r = new URL(data.referrer); if (r.host && r.host !== url.host) referrer = r.host; } } catch {}
  const body = {
    kind: data.kind === 'search' ? 'search' : 'pageview',
    path: (data.path || '/').slice(0, 512),
    referrer,
    visitor,
    query: (data.query || '').slice(0, 255)
  };
  try { await fetch(`${API_BASE}/api/events`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }); } catch {}
  return new Response(null, { status: 204 });
}
```
- [ ] **Step 3:** In `routes/+layout.svelte` `<script>`, add:
```js
import { afterNavigate } from '$app/navigation';
import { sendPageview } from '$lib/beacon.js';
afterNavigate(({ to }) => { if (to && !to.url.pathname.startsWith('/admin')) sendPageview(to.url); });
```
- [ ] **Step 4: Commit** `feat(web): analytics beacon + collector`.

---

### Task 4: Analytics dashboard + nav (web)

**Files:** Create `platform/web/src/routes/admin/analytics/+page.server.js`, `.../analytics/+page.svelte`;
modify `platform/web/src/routes/admin/+layout.svelte`, `platform/web/src/app.css`

- [ ] **Step 1:** `+page.server.js`:
```js
import { adminJson } from '$lib/server/adminApi.js';
const EMPTY = { views: 0, uniqueVisitors: 0, searches: 0, perDay: [], topPaths: [], topReferrers: [], topSearches: [] };
export async function load({ request, url }) {
  const days = url.searchParams.get('days') || '30';
  const analytics = (await adminJson(request.headers.get('cookie'), `/analytics?days=${days}`, null)) ?? EMPTY;
  return { analytics, days: Number(days) };
}
```
- [ ] **Step 2:** `+page.svelte` — metric cards (views, unique visitors, searches), a views-over-time bar row
(scale each bar height to the max in `perDay`), and top topics / referrers / searches lists; range links
`?days=7|30|90` (the mockup, made real). Empty-state text when no data yet.
- [ ] **Step 3:** Add `{ href: '/admin/analytics', label: 'Analytics', icon: 'ti-chart-bar' }` to the `nav`
array in `admin/+layout.svelte`.
- [ ] **Step 4:** Add dashboard styles to `app.css` (`.bars`, `.bar`, `.rank-row`, range pills) using tokens.
- [ ] **Step 5:** `(cd platform/web && npm run build)` → passes. **Commit** `feat(web): analytics dashboard`.

---

### Task 5: Live verify

- [ ] API (with `ADMIN_PASSWORD_HASH`) + web preview. Browse a few public pages + a search → beacons fire
(check `/analytics/collect` 204 in network). Log in, open `/admin/analytics` → views > 0, the search appears
under top searches, referrers/paths populate. Confirm no raw IP is stored (`events.visitor` is a hash; no IP
column). Screenshot the dashboard.

---

## Self-review
- **Spec coverage:** events table + aggregations (T1); ingest + admin analytics API (T2); beacon + collector
  with daily hash, no cookies (T3); dashboard + nav + range (T4); live verify incl. privacy check (T5).
- **Naming:** `record_event`/`analytics_totals`/`views_per_day`/`top_paths`/`top_referrers`/`top_searches`
  (store) consistent across T1/T2; `sendPageview` (beacon) used in T3.
- **Placeholders:** the three `top_*` methods are described by an explicit shared-shape note + the example
  asserts their exact return tuples; collector/handler code given in full.
