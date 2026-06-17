# Design Spec — Admin Console B1: CMS Foundation

**Date:** 2026-06-17
**Status:** Design approved by user.
**Scope:** Sub-project B1 of the admin console — turn the platform into a database-backed CMS with an
authenticated admin UI for managing topics, phases, and categories. **Analytics is B2** (separate spec).

## Decisions (locked)
- **Source of truth:** a persistent SQLite DB on disk. Existing Markdown is imported once.
- **Auth:** single admin password → server-side session (opaque cookie).
- **Editor:** Markdown stored as source, with toolbar + live preview + drag/drop image uploads.
- **Visibility:** guides have draft/published status; only published show on the public site.

---

## 1. Persistence shift (foundational)

Today `AppState::build(CONTENT_ROOT)` ingests Markdown into an **in-memory** `Store`
(`Store::open_in_memory()`) + Tantivy index on every boot. New model:

- Open a **persistent** DB via the existing `Store::open(db_path)` (no new method needed). `db_path` from
  env `DB_PATH` (default `./data/manual.db`).
- **Tantivy index:** rebuilt from the DB into a fresh index on boot (DB is truth; the library is small so
  a full rebuild is fast and avoids on-disk index migrations), then updated incrementally on writes (§5).
- **One-time import:** if the DB has no guides and `CONTENT_ROOT` is set, run the existing ingest to
  populate the DB (status defaults to `published` for imported guides). Idempotent: imported guides upsert
  by slug; re-running import doesn't duplicate. After import the DB is authoritative; Markdown files are a
  backup, not read at runtime. Also exposed as an explicit `import` action (see §7 CLI).

## 2. Schema changes (content-core `store.rs`)

Migrations run in `from_conn` (additive; guard with `ALTER TABLE ADD COLUMN` checked against
`pragma_table_info`, or `CREATE TABLE IF NOT EXISTS` for new tables):

- **guides** — add `status TEXT NOT NULL DEFAULT 'published'` (`draft`|`published`),
  `sort_order INTEGER NOT NULL DEFAULT 0`, `created_at TEXT NOT NULL DEFAULT ''`,
  `updated_at TEXT NOT NULL DEFAULT ''`.
- **phases** — add `markdown TEXT NOT NULL DEFAULT ''` (the editable source; `html` becomes its rendered
  cache). Phase 0 = the guide overview (today's `_guide.md`).
- **categories** (new table) — `slug TEXT PRIMARY KEY, name TEXT NOT NULL, icon TEXT NOT NULL,
  blurb TEXT NOT NULL, sort_order INTEGER NOT NULL DEFAULT 0`. Seeded from the current
  `categories::DEFS` on first run (so the 7 categories persist and become editable). `categories.rs`
  switches from const-driven listing to **DB-driven** (`categories_with_counts` reads the table and counts
  only `published` guides).
- **assets** (new table) — `id TEXT PRIMARY KEY` (uuid), `filename TEXT, mime TEXT NOT NULL,
  bytes BLOB NOT NULL, created_at TEXT NOT NULL`.
- **sessions** (new table) — `id TEXT PRIMARY KEY` (random 256-bit), `created_at TEXT, expires_at TEXT`.

`Phase` (models.rs) and `GuideSummary` gain the new fields (`markdown` on Phase; `status` on guide rows for
admin queries). Public `Store` methods get `status`-filtered variants; admin gets unfiltered ones
(`list_all_guides`, `get_guide_any_status`).

## 3. Rendering & link rewriting

On any phase write: render `markdown` → `html` with comrak (the exact renderer ingest uses), then apply
`links::rewrite_internal_links`. Store both. The public reader serves the cached `html` unchanged.

## 4. Auth (server)

- Config: `ADMIN_PASSWORD_HASH` env (argon2 hash). A `hash-password` CLI subcommand prints a hash from a
  plaintext for setup. No plaintext password in env.
- `POST /api/admin/login {password}` → verify with argon2; on success insert a `sessions` row and set an
  `admin_session` cookie (the opaque id): `HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age`. On failure
  401.
- `POST /api/admin/logout` → delete session row + clear cookie. `GET /api/admin/me` → 200 if valid session
  else 401.
- **Middleware** `require_admin` guards every `/api/admin/*` route except `login`: reads the cookie, checks
  the session is present and unexpired, else 401.
- **Rate limiting:** per-IP failed-login counter (in-memory, sliding window) → 429 after N failures.

## 5. Search index updates

`AppState` holds the Tantivy `IndexWriter` behind a `Mutex` (already has the index). On guide/phase
create/update/delete (and publish/unpublish), delete the affected phase docs by term and re-add the current
published ones, then `commit()` and reload the reader. **Only published phases are indexed**, so drafts
never appear in search.

## 6. API (server `routes.rs`)

**Public (changed):** `list_guides`, `category` counts, and search now filter `status='published'`.
Asset serving `GET /assets/:id` → bytes + `Content-Type` (public; images are not secret).

**Admin (new, under `/api/admin`, all behind `require_admin` except login):**
- `POST /login`, `POST /logout`, `GET /me`.
- Guides: `GET /guides` (all, incl. drafts), `POST /guides` (create: slug, title, summary, category,
  difficulty, status=draft), `GET /guides/:slug`, `PATCH /guides/:slug` (title/summary/category/difficulty/
  status/sort_order), `DELETE /guides/:slug`.
- Phases: `GET /guides/:slug/phases`, `POST /guides/:slug/phases`, `PATCH /guides/:slug/phases/:no`
  (title/summary/markdown), `DELETE /guides/:slug/phases/:no`, `POST /guides/:slug/phases/reorder`.
- Categories: `GET /categories`, `POST /categories`, `PATCH /categories/:slug`, `DELETE /categories/:slug`
  (refuse if non-empty, or reassign), `POST /categories/reorder`.
- Assets: `POST /assets` (multipart) → `{id, url}`.
- Preview: `POST /preview {markdown}` → `{html}` (comrak + link rewrite) for the editor's live preview, so
  preview matches saved output exactly.

## 7. CLI (server bin)
Subcommands on the server binary: default = run server; `import` = (re)run Markdown import into `DB_PATH`;
`hash-password <plaintext>` = print an argon2 hash for `ADMIN_PASSWORD_HASH`.

## 8. Admin UI (web `/admin/*`)

A separate admin layout (no public sidebar; a slim admin nav: Dashboard · Content · Categories · Logout),
reusing the design system (IBM Plex, tokens). Server-side `load` on the admin layout calls
`/api/admin/me`; unauthenticated → redirect to `/admin/login`.

- `/admin/login` — password form → POST `/api/admin/login` → redirect to `/admin`.
- `/admin` — dashboard: counts (published, drafts, categories), recent edits.
- `/admin/content` — guides table (title, category, difficulty, status, updated) + "New topic".
- `/admin/content/[slug]` — the editor from the approved mockup: metadata panel (title, slug, summary,
  category, difficulty, status) + phases list (add/reorder/delete) + per-phase Markdown editor
  (textarea + formatting toolbar + live preview via debounced `POST /preview`). Image **paste/drop** uploads
  to `/api/admin/assets` and inserts `![](/assets/:id)` at the cursor. Save → PATCH.
- `/admin/categories` — list + add/edit (name, slug, icon, blurb) + reorder.
- `lib/admin.js` — admin API client (credentials: 'include').

## 9. Testing

**Rust (content-core + server):**
- Persistence: open `DB_PATH`, create a guide, reopen → still present.
- Import: a temp Markdown dir → DB has the guide + phases + categories; re-import doesn't duplicate.
- Auth: wrong password → 401; correct → cookie + session row; `/me` with cookie → 200, without → 401;
  logout → session gone, `/me` → 401; >N failures → 429.
- CRUD: create draft guide → absent from public `list_guides`, present in admin list; publish → appears
  publicly; edit phase markdown → `html` re-rendered (contains expected tag); search finds a published
  phase but not a draft one.
- Assets: upload bytes → `GET /assets/:id` returns same bytes + mime.
- Categories: add category → appears in public list with count 0; rename persists.

**Web (build + live browse):** login flow; create topic (draft) and confirm it's hidden on the public
site; edit Markdown with live preview; paste/drop an image and see it render; publish → appears in the
public sidebar + category; logout returns to login.

## 10. Out of scope
- **B2 analytics** (own spec). Future: multi-admin/roles, content version history & rollback, a media
  library browser, scheduled publishing, i18n. No GitHub sync of DB content (content now lives in the DB;
  Markdown files remain only as the pre-import backup).

## 11. Risks / notes
- **Content leaves git.** After import, version history for content lives in the DB, not git. Acceptable
  per the DB-CMS decision; a future export-to-Markdown could restore portability if wanted.
- **DB durability.** `DATA_DIR` must be a persisted volume in Docker (add a volume mount); document it.
- **Schema migration** is additive only here; if a column rename is ever needed, write an explicit migration.
