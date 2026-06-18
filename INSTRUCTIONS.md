# INSTRUCTIONS — running & working on The Missing Manual

Operational guide: how to start, stop, rebuild, manage content & admin, and troubleshoot.
For *what the project is* and *how to write guides*, see `README.md`, `CONTRIBUTING.md` (voice),
`DESIGN.md` (visual system), and `.claude/skills/missing-manual-writer/SKILL.md` (the writer skill).

> Commands are shown for a POSIX shell. Where Windows **PowerShell** differs, it's called out
> (`grep` → `Select-String`, `curl` → `curl.exe`, etc.).

---

## 1. What's where

```
guides/                     Markdown content — the source of truth for guides
  <slug>/_guide.md          a guide's overview (phase 0) + frontmatter
  <slug>/NN-*.md            its phases
platform/                   Rust + web app (a Cargo workspace + a SvelteKit app)
  core/                     content-core: ingest, SQLite store, Tantivy search
  server/                   axum HTTP API  (binary: `server`)
  web/                      SvelteKit front-end (adapter-node)
docker-compose.yml          runs the whole stack (api + web)
```

Two services:
| Service | What | Port (host) | Internal |
|---|---|---|---|
| `api` | Rust axum API + SQLite + search | **3000** | 3000 |
| `web` | SvelteKit site (SSR) | **5173** | 3000 |

URLs once running:
- **Site:** http://localhost:5173
- **Admin console:** http://localhost:5173/admin
- **API (direct):** http://localhost:3000/api/… (e.g. `/api/guides`, `/api/search?q=…`, `/api/rss`)

---

## 2. Run with Docker (recommended)

Prerequisite: Docker Desktop running.

**Start everything** (build images + run in background):
```bash
docker compose up -d --build
```
Open http://localhost:5173.

**Stop** (keeps your data — guides, admin, analytics):
```bash
docker compose down
```
> ⚠️ Never `docker compose down -v` unless you truly want to wipe the database. `-v` deletes the
> `manual-data` volume (all CMS content, the admin password, and analytics).

**Restart a service** (no rebuild — re-runs startup, re-applies content sync, picks up env changes):
```bash
docker compose restart api
```

**Status / logs:**
```bash
docker compose ps
docker compose logs api --tail 40
docker compose logs -f api            # follow
# PowerShell: docker compose logs api | Select-String "content sync"
```

### After you change code — rebuild
Docker runs the *image's* compiled binary, so code changes need a rebuild **and** a recreate:
```bash
docker compose up -d --build --force-recreate api     # Rust/api change
docker compose up -d --build --force-recreate web     # web change
```
- `--force-recreate` matters: without it, Compose sometimes keeps the old container running the old image.
- If a build seems stale (the compile step shows `CACHED` when it shouldn't), force a clean one:
  ```bash
  docker compose build --no-cache api
  docker compose up -d --force-recreate api
  ```

### After you change content (`guides/`) — nothing
`./guides` is bind-mounted into the `api` container, and the server **auto-syncs**: new/edited guide
folders are picked up within `SYNC_INTERVAL_SECS` (default 300s = 5 min). To apply instantly, use the
admin **"Sync now"** button, or restart the api (`docker compose restart api`). See §5.

---

## 3. Run without Docker (local dev)

Prerequisites: **Rust** (stable, with `cargo`) and **Node.js 20+** with `npm`.

**Terminal 1 — the API** (run from the repo root so `CONTENT_ROOT="."` finds `guides/`):
```bash
cargo run --manifest-path platform/Cargo.toml -p server
# serves http://127.0.0.1:3000, ingests guides/ on startup, writes ./data/manual.db
```

**Terminal 2 — the web app:**
```bash
cd platform/web
npm install          # first time only
npm run dev          # serves http://localhost:5173, SSR loaders call the API
```
> **Windows:** run npm via a subshell — `(cd platform/web && npm run dev)` — **not** `npm --prefix platform/web …` (it misreads `package.json`).

The local web dev server talks to the API at `API_BASE` (default `http://127.0.0.1:3000`). The local API
also auto-syncs `guides/` just like in Docker.

Production-style local web build (optional): `(cd platform/web && npm run build && npm run preview)`
(`preview` serves the built app on :4173).

---

## 4. Admin console

The admin lives in the **database** (so password changes persist). One admin credential.

**Create / reset the admin password** (Docker):
```bash
docker compose exec api server create-admin "your-password-here"      # stack running
# or, if the stack is down:
docker compose run --rm api server create-admin "your-password-here"
```
Local (no Docker):
```bash
cargo run --manifest-path platform/Cargo.toml -p server -- create-admin "your-password-here"
```
Then log in at **http://localhost:5173/admin/login**.

- Forgot it? Just run `create-admin` again — that's the reset/lockout path.
- Change it from the console once logged in (Settings → change password), or via `POST /api/admin/password`.
- `ADMIN_PASSWORD_HASH` (env) is only a first-run bootstrap fallback; `create-admin` is the simple path.
  (Generate a hash with `docker compose run --rm api server hash-password "…"` if you want to use the env.)

---

## 5. Working with content (guides)

Guides are Markdown under `guides/<slug>/`. Author them per `CONTRIBUTING.md` and the writer skill
(`.claude/skills/missing-manual-writer/SKILL.md`).

**Files & frontmatter:**
```
guides/<slug>/_guide.md     # phase 0 — the overview; carries category + order
guides/<slug>/01-*.md       # phase 1, 02-*, 03-* …
```
`_guide.md` frontmatter:
```yaml
---
title: "…"
guide: "<slug>"              # must equal the folder name
phase: 0
summary: "one honest sentence (also feeds search)"
tags: [git, version-control]
category: version-control    # see categories below (only on _guide.md)
order: 1                     # sidebar/category position; lower = earlier (default 0)
difficulty: beginner         # beginner | intermediate | advanced
synonyms: ["questions a reader would type"]
updated: 2026-06-18
---
```
Phase files are the same, with their `phase:` number and **no** `category`/`order`.

- **Categories:** `programming-languages`, `version-control`, `devops`, `databases`, `architecture`,
  `performance`, `security`.
- **Difficulty:** `beginner` / `intermediate` / `advanced` (shown as Basic / Intermediate / Advanced).
- **Order:** set `order:` on `_guide.md` to control position within a category (lower = earlier).

**How it goes live:** the auto-sync imports `guides/` into the DB + search index — **files win on
change**. Drop or edit a folder and it appears within `SYNC_INTERVAL_SECS` (default 300s), or instantly
via the admin **"Sync now"** (`POST /api/admin/sync`). Guides created only in the CMS (no folder) are
never overwritten by the sync.

> Note: a *content* change (editing `guides/`) needs **no rebuild**. A *code* change to the ingest
> logic does — and the server now force-re-imports on every boot, so a rebuild re-applies it automatically.

---

## 6. Tests & build checks

```bash
cargo test --manifest-path platform/Cargo.toml      # Rust workspace (core + server)
(cd platform/web && npm run build)                  # web build must pass
```

---

## 7. Environment variables

Set these in `docker-compose.yml` (per service) or the shell when running locally.

**api (server):**
| Var | Default | Purpose |
|---|---|---|
| `BIND_ADDR` | `127.0.0.1:3000` (local) / `0.0.0.0:3000` (Docker) | listen address |
| `CONTENT_ROOT` | `.` | folder containing `guides/` |
| `DB_PATH` | `./data/manual.db` (local) / `/data/manual.db` (Docker) | SQLite file |
| `SYNC_INTERVAL_SECS` | `300` | content auto-sync interval |
| `SITE_URL` | `http://localhost:5173` | base URL for RSS item links |
| `ADMIN_PASSWORD_HASH` | — | first-run admin bootstrap (prefer `create-admin`) |
| `COOKIE_SECURE` | off | `1`/`true` → mark the session cookie `Secure` (HTTPS prod) |
| `BEACON_KEY` | — | optional shared secret required on `/api/events` |
| `ASSET_MAX_BYTES` | `5242880` (5 MiB) | max uploaded asset size |
| `EVENTS_RETENTION_DAYS` | `365` | analytics event retention |

**web:**
| Var | Default | Purpose |
|---|---|---|
| `API_BASE` | `http://127.0.0.1:3000` (local) / `http://api:3000` (Docker) | where the API is |
| `PORT` | `3000` (Docker) | adapter-node listen port |
| `ORIGIN` | `http://localhost:5173` (compose) | **must match the browser URL** or admin login 403s (CSRF) |
| `ANALYTICS_SALT` | built-in | salt for the daily-rotating visitor hash |

---

## 8. Troubleshooting

**A change to `guides/` didn't show up.** Wait one sync interval, or click admin "Sync now"
(`POST /api/admin/sync`), or `docker compose restart api`. Confirm the container sees your file:
`docker compose exec api sh -c "sed -n '1,12p' /app/guides/<slug>/_guide.md"`.

**A code change didn't take effect.** You must rebuild **and** recreate:
`docker compose up -d --build --force-recreate api`. Watch for the `cargo build` step actually running
(not `CACHED`). Verify the running build via logs: `docker compose logs api --tail 20` should show
`listening on http://0.0.0.0:3000` (and `content sync: imported …` on boot).

**Admin login returns 403.** That's SvelteKit's CSRF check — the web container's `ORIGIN` must equal the
URL in your browser. It's set to `http://localhost:5173` in `docker-compose.yml`; for a real domain set
`ORIGIN=https://your-domain`. Recreate web after changing it: `docker compose up -d --force-recreate web`.

**"Address already in use" on :3000 or :5173.** A stale container or a local server holds the port.
`docker compose down`, or kill the local process — Windows: `netstat -ano | findstr :3000` then
`taskkill /F /PID <pid>`.

**Inspect the database** to see raw values (e.g. why ordering or draft/published status looks off) —
see **§9 Querying the database**.

**PowerShell equivalents:** `grep` → `Select-String`; `curl -X POST …` → `curl.exe -X POST …` or
`Invoke-RestMethod -Method Post …`; `head`/`tail` → `Select-Object -First/-Last N`.

---

## 9. Querying the database

Yes — it's a plain **SQLite** file you can query directly.
- **Docker:** `/data/manual.db` inside the `api` container (on the `manual-data` volume).
- **Local (no Docker):** `./data/manual.db`.

Most data is also readable without SQL via the API (`/api/guides`, `/api/categories`, `/api/search?q=…`,
the admin endpoints) — reach for SQL when you need raw columns like `sort_order` or the analytics tables.

> Reads are safe while the server is running (SQLite allows concurrent readers). Avoid manual **writes**
> while `api` is up — let the app own writes.

### Option A — one-off SQLite container against the volume (nothing to install in the app)
```bash
docker volume ls | grep manual-data        # find the exact name, e.g. knowledgebase_manual-data
docker run --rm -v knowledgebase_manual-data:/data alpine \
  sh -c "apk add -q sqlite && sqlite3 /data/manual.db 'SELECT slug, sort_order, status FROM guides ORDER BY sort_order, slug;'"
```

### Option B — sqlite3 inside the running api container
The api image ships without `sqlite3`; install it ad hoc (gone on the next rebuild):
```bash
docker compose exec api sh -c "command -v sqlite3 >/dev/null || { apt-get update -qq && apt-get install -y -qq sqlite3; }; \
  sqlite3 /data/manual.db 'SELECT slug, sort_order, status FROM guides ORDER BY sort_order, slug;'"
```
Drop the trailing SQL for an interactive `sqlite>` prompt (`.tables`, `.schema guides`, `.quit`).

### Option C — copy it out and use a GUI
```bash
docker compose cp api:/data/manual.db ./manual.db     # Docker (local: it's already ./data/manual.db)
```
Open `manual.db` in **DB Browser for SQLite** (https://sqlitebrowser.org) or any SQLite client. That's a
*copy* — edits don't sync back; for live changes use the CMS/API.

### Tables & handy queries
Tables: `guides`, `phases`, `categories`, `assets`, `sessions`, `events`, `settings`.
```sql
.tables                      -- list tables
.schema guides               -- one table's definition

-- guides: ordering, difficulty, draft vs published
SELECT slug, category, difficulty, sort_order, status FROM guides ORDER BY sort_order, slug;

-- phases of one guide
SELECT phase_no, title FROM phases WHERE guide_slug='git-from-zero' ORDER BY phase_no;

-- categories and their order
SELECT slug, name, sort_order FROM categories ORDER BY sort_order;

-- settings: is an admin set? what's the last content-sync signature?
SELECT key FROM settings;                 -- expect: admin_password_hash, content_sig

-- analytics: totals by kind, and top pages over the last 30 days
SELECT kind, COUNT(*) FROM events GROUP BY kind;
SELECT path, COUNT(*) AS c FROM events
  WHERE kind='pageview' AND ts >= datetime('now','-30 days')
  GROUP BY path ORDER BY c DESC LIMIT 10;

-- active sessions
SELECT COUNT(*) FROM sessions WHERE expires_at > datetime('now');
```
> Don't `SELECT *` from `assets` — its `bytes` column holds binary blobs. Select `id, filename, mime`.

PowerShell: `grep` → `Select-String` (e.g. `docker volume ls | Select-String manual-data`); the
`docker run …` and `docker compose exec …` commands work unchanged.

---

## 10. How it fits together (for changes)

- **Markdown in `guides/`** is the content source → ingested into **SQLite** (`/data/manual.db`) + a
  **Tantivy** search index. The DB also holds CMS edits, the admin credential, sessions, and analytics.
- **`platform/server`** (axum) serves the JSON API on :3000. **`platform/web`** (SvelteKit) renders the
  site on :5173 and calls the API server-side. The **HTTP API is the contract** between them.
- Persistent state lives in the `manual-data` Docker volume (or `./data/` locally).

**Roles / ownership:** backend work (`platform/core`, `platform/server`, DB, search, ingest) and
`platform/web` (the SvelteKit UI + design) are maintained separately; coordinate through the HTTP API,
and when committing, stage only the files you own.

---

## 11. Production checklist

- `ORIGIN=https://your-domain` (web) and `SITE_URL=https://your-domain` (api).
- `COOKIE_SECURE=1` (serve over HTTPS).
- A strong admin password via `create-admin` (not a default).
- Keep the API internal (only expose the web service publicly); optionally set `BEACON_KEY` and have the
  web collector send `x-beacon-key`.
- Back up the `manual-data` volume (it's the whole database).
