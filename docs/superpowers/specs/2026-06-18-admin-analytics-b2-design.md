# Design Spec — Admin Console B2: Analytics

**Date:** 2026-06-18
**Status:** Design approved by user.
**Scope:** Built-in, privacy-friendly analytics for the public site, surfaced in the admin console.
Builds on B1 (admin auth, `/api/admin/*`, the BFF proxy). Last sub-project of the admin console.

## Decisions (locked)
- **Capture:** client-side beacon → web-origin collector → API. Beacon counts real browser visitors.
- **Privacy:** daily-rotating one-way visitor hash; no cookies, no PII stored, no consent banner.
- **Metrics:** views, unique visitors, searches; views-over-time; top topics, referrers, search queries.

---

## 1. Capture flow

1. **Beacon (browser).** The root layout fires `navigator.sendBeacon('/analytics/collect', body)` on each
   public pageview via SvelteKit `afterNavigate` (runs on initial load + every client navigation). Skipped
   when the path starts with `/admin`. Body (JSON string): `{ path, referrer, kind, query }` where:
   - `/search?q=…` → `kind:'search'`, `query:<q>`, `path:'/search'`.
   - everything else → `kind:'pageview'`, `path:<pathname without query>`.
   - `referrer` = `document.referrer` (external source; blanked when same-origin by the collector).
2. **Collector (web origin).** `POST /analytics/collect` (`+server.js`) reads the body, derives the client
   IP via `getClientAddress()` and the `user-agent` header, computes the **visitor hash**
   `sha256(YYYY-MM-DD + ip + ua + ANALYTICS_SALT)` (raw IP/UA never leave the server), normalizes the
   referrer to a hostname (drops same-origin/empty), and forwards `POST {API}/api/events`
   `{ kind, path, referrer, visitor, query }`. Returns `204` fire-and-forget.
3. **Store (API).** `POST /api/events` validates (`kind ∈ {pageview, search}`, caps field lengths) and
   inserts a row.

## 2. Privacy
- The visitor hash includes the date, so it **rotates daily** — a visitor can't be tracked across days, and
  there's no stable identifier. Raw IP and UA are used only to compute the hash, never stored.
- No cookies are set for analytics; no consent banner is required.
- Because counting is beacon-based (real browsers), most bots/crawlers are excluded.

## 3. Data model (content-core `store.rs`)
- **events** table: `ts TEXT NOT NULL DEFAULT (datetime('now')), kind TEXT NOT NULL, path TEXT NOT NULL,
  referrer TEXT, visitor TEXT NOT NULL, query TEXT`. Index on `ts`.
- Store methods:
  - `record_event(kind, path, referrer, visitor, query)`.
  - `analytics_totals(days) -> (views, unique_visitors, searches)` — counts over the window.
  - `views_per_day(days) -> Vec<(day, count)>` — pageviews grouped by date.
  - `top_paths(days, limit) -> Vec<(path, count)>` — pageviews, excludes `/search`.
  - `top_referrers(days, limit) -> Vec<(referrer, count)>` — non-empty referrers.
  - `top_searches(days, limit) -> Vec<(query, count)>` — search events grouped by query.

## 4. API (server)
- **Public:** `POST /api/events` — body `{ kind, path, referrer, visitor, query }`; validate + `record_event`;
  `204`. (Called server-to-server by the collector, but it's a public route — light validation, length caps.)
- **Admin (auth):** `GET /api/admin/analytics?days=N` (default 30, clamp 1..365) →
  `{ views, uniqueVisitors, searches, perDay:[{day,count}], topPaths:[{path,count}],
  topReferrers:[{referrer,count}], topSearches:[{query,count}] }`. Behind `require_admin`.

## 5. Web (SvelteKit)
- `src/routes/+layout.svelte` — add the beacon (`afterNavigate`, skip `/admin`). A tiny `$lib/beacon.js`
  helper builds the body + calls `navigator.sendBeacon`.
- `src/routes/analytics/collect/+server.js` — the collector (POST): hash + normalize + forward to API.
  Uses `node:crypto` for the hash and `getClientAddress()` for the IP.
- `src/routes/admin/analytics/+page.server.js` + `+page.svelte` — dashboard: metric cards (views, unique
  visitors, searches), views-over-time bars, top topics / referrers / searches; a 7/30/90-day range
  (querystring `?days=`). "No-result" searches are a content-backlog signal (shown when result count is 0
  — a future enrichment that needs the search beacon to send the result count). v1 ranks search queries by frequency.
- `src/routes/admin/+layout.svelte` — add "Analytics" to the admin nav.

## 6. Config
- `ANALYTICS_SALT` (env) seeds the visitor hash; defaults to a constant if unset (fine for single-instance).

## 7. Testing
**Rust:** `record_event` then `analytics_totals` counts correctly; `views_per_day`/`top_paths`/
`top_referrers`/`top_searches` group + order; `/api/events` rejects an invalid `kind`; same visitor hash
counted once in unique visitors, two hashes = two uniques; `GET /api/admin/analytics` requires auth.
**Web (build + live):** visiting public pages emits beacons; `/admin/analytics` shows non-zero views after
browsing; a search appears under top searches; admin nav has Analytics; collector stores no raw IP.

## 8. Out of scope (v1)
Geographic/country (needs a GeoIP DB — deferred), per-visitor funnels/retention, real-time live view,
event retention/pruning policy, exporting. No changes to B1 content endpoints.
