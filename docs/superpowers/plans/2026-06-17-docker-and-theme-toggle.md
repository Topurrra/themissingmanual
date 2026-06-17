# Docker + Light/Dark Toggle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a one-command Docker setup (`docker compose up` → API + web) and a persistent, no-flash light/dark theme toggle.

**Architecture:** Two multi-stage Dockerfiles (Rust server, SvelteKit web) wired by a root `docker-compose.yml`; the server's bind address and content root become env-configurable. The theme system moves from a `prefers-color-scheme` media query to a `data-theme` attribute on `<html>`, set before first paint by an inline script (saved choice, else OS preference) and flipped by a header button.

**Tech Stack:** Docker + docker compose; Rust/axum (server), SvelteKit/adapter-node (web); plain CSS + a few lines of vanilla JS for the toggle.

**Source spec:** `docs/superpowers/specs/2026-06-17-docker-and-theme-toggle-design.md`

**Verification model:** these are config/CSS/glue, not unit-testable logic. Each task verifies via `cargo build` / `npm run build` success, `docker compose build`, and **live browser checks** with the gstack `browse` binary (already built). Execution starts by confirming `docker --version`.

## File Structure

```
/.dockerignore                         (new) keep the api build context small
/docker-compose.yml                    (new) api + web services
/platform/server/Dockerfile            (new) multi-stage Rust build
/platform/server/src/main.rs           (modify) BIND_ADDR + CONTENT_ROOT env
/platform/web/Dockerfile               (new) multi-stage SvelteKit build
/platform/web/.dockerignore            (new) keep the web build context small
/platform/web/src/app.css              (modify) data-theme dark + toggle/icon CSS
/platform/web/src/app.html             (modify) no-flash inline theme script
/platform/web/src/routes/+layout.svelte (modify) theme toggle button + JS
```

---

## Task 1: Server env config (BIND_ADDR, CONTENT_ROOT)

**Files:** Modify `platform/server/src/main.rs`

- [ ] **Step 1: Replace `main.rs`**

```rust
use std::sync::Arc;
use std::path::Path;

#[tokio::main]
async fn main() {
    let content_root = std::env::var("CONTENT_ROOT").unwrap_or_else(|_| ".".to_string());
    let bind_addr = std::env::var("BIND_ADDR").unwrap_or_else(|_| "127.0.0.1:3000".to_string());

    let state = Arc::new(
        server::AppState::build(Path::new(&content_root)).expect("failed to ingest guides"),
    );
    let app = server::app(state);

    let listener = tokio::net::TcpListener::bind(&bind_addr)
        .await
        .unwrap_or_else(|e| panic!("bind {bind_addr}: {e}"));
    println!("listening on http://{bind_addr}");
    axum::serve(listener, app).await.expect("server error");
}
```

- [ ] **Step 2: Verify it builds and still runs locally**

Run: `cargo build --manifest-path platform/Cargo.toml -p server`
Expected: compiles. (Default env-free behavior is unchanged: binds `127.0.0.1:3000`, ingests `.`.)

- [ ] **Step 3: Commit**

```bash
git add platform/server/src/main.rs && git commit -m "feat(server): BIND_ADDR + CONTENT_ROOT env config" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Server Dockerfile + root .dockerignore

**Files:** Create `platform/server/Dockerfile`, `.dockerignore`

- [ ] **Step 1: Create `platform/server/Dockerfile`** (build context is the repo root)

```dockerfile
# syntax=docker/dockerfile:1
FROM rust:1-slim-bookworm AS build
RUN apt-get update && apt-get install -y --no-install-recommends build-essential && rm -rf /var/lib/apt/lists/*
WORKDIR /build
COPY platform/ ./platform/
RUN cargo build --release --manifest-path platform/Cargo.toml -p server

FROM debian:bookworm-slim AS runtime
WORKDIR /app
COPY --from=build /build/platform/target/release/server /usr/local/bin/server
COPY guides/ ./guides/
ENV BIND_ADDR=0.0.0.0:3000
ENV CONTENT_ROOT=.
EXPOSE 3000
CMD ["server"]
```

- [ ] **Step 2: Create `.dockerignore`** (repo root — shrinks the api build context)

```
.git
docs
platform/target
platform/.data
**/node_modules
platform/web/.svelte-kit
platform/web/build
```

- [ ] **Step 3: Build just the api image to verify**

Run: `docker build -f platform/server/Dockerfile -t mm-api .`
Expected: build succeeds; final image has `/usr/local/bin/server` and `/app/guides`. (First build compiles Rust deps — slow.)

- [ ] **Step 4: Commit**

```bash
git add platform/server/Dockerfile .dockerignore && git commit -m "build: server Dockerfile + root dockerignore" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Web Dockerfile + web .dockerignore

**Files:** Create `platform/web/Dockerfile`, `platform/web/.dockerignore`

- [ ] **Step 1: Create `platform/web/Dockerfile`** (build context is `platform/web`)

```dockerfile
# syntax=docker/dockerfile:1
FROM node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-slim AS runtime
WORKDIR /app
COPY --from=build /app/build ./build
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
ENV PORT=3000
EXPOSE 3000
CMD ["node", "build"]
```

- [ ] **Step 2: Create `platform/web/.dockerignore`**

```
node_modules
.svelte-kit
build
```

- [ ] **Step 3: Build the web image to verify**

Run: `docker build -f platform/web/Dockerfile -t mm-web platform/web`
Expected: build succeeds (`npm run build` → `✓ built`, adapter-node emits `build/`).

- [ ] **Step 4: Commit**

```bash
git add platform/web/Dockerfile platform/web/.dockerignore && git commit -m "build: web Dockerfile + dockerignore" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: docker-compose.yml + end-to-end verify

**Files:** Create `docker-compose.yml`

- [ ] **Step 1: Create `docker-compose.yml`** (repo root)

```yaml
services:
  api:
    build:
      context: .
      dockerfile: platform/server/Dockerfile
    ports:
      - "3000:3000"
    environment:
      BIND_ADDR: 0.0.0.0:3000
      CONTENT_ROOT: .

  web:
    build:
      context: platform/web
      dockerfile: Dockerfile
    ports:
      - "5173:3000"
    environment:
      API_BASE: http://api:3000
      PORT: "3000"
    depends_on:
      - api
```

- [ ] **Step 2: Bring the stack up and verify both services**

Run:
```bash
docker compose up -d --build
sleep 5
curl -s -o /dev/null -w "api %{http_code}\n" http://localhost:3000/api/health
curl -s http://localhost:5173/ | grep -o "Missing Manual" | head -1
curl -s "http://localhost:5173/search?q=undo%20a%20commit" | grep -o "When It Breaks" | head -1
docker compose down
```
Expected: `api 200`; home and search render real content (the web container's SSR loaders reach the api container at `http://api:3000`).

- [ ] **Step 3: Commit**

```bash
git add docker-compose.yml && git commit -m "build: docker compose for one-command run (api + web)" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Theme CSS — data-theme + toggle/icon styles

**Files:** Modify `platform/web/src/app.css`

- [ ] **Step 1: Replace the dark-mode block** — swap the entire `/* Dark mode */ @media (prefers-color-scheme: dark) { ... }` block for this `data-theme` version:

```css
/* Dark mode — driven by data-theme on <html> (set by the inline script in app.html) */
:root[data-theme="dark"] {
  --bg: #101012;
  --surface: #1b1b20;
  --ink: #f2f2f4;
  --body: #c9c9d0;
  --muted: #9a9aa2;
  --faint: #6e6e76;
  --line: #2a2a30;
  --accent: #2fb6c0;
  --accent-strong: #5cccd4;
  --accent-tint: rgba(47, 182, 192, 0.16);
  --code-bg: #1b1b20;
  --code-fg: #e6e6ea;
}
:root[data-theme="dark"] .searchbar input { background: var(--surface); }
:root[data-theme="dark"] .reader code { background: #26262c; color: var(--accent-strong); }
:root[data-theme="dark"] .reader blockquote { background: #15201f; }
:root[data-theme="dark"] .reader pre { border: 1px solid var(--line); }
```

- [ ] **Step 2: Add header-right + toggle button styles** — append to `app.css`:

```css
/* Header right cluster + theme toggle */
.bar-right { display: flex; align-items: center; gap: 0.75rem; }
.theme-toggle {
  background: none;
  border: 1px solid var(--line);
  color: var(--muted);
  cursor: pointer;
  padding: 7px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
}
.theme-toggle:hover { background: var(--surface); color: var(--ink); }
.theme-toggle svg { width: 18px; height: 18px; display: block; }
.theme-toggle:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
:root:not([data-theme="dark"]) .theme-toggle .icon-sun { display: none; }
:root[data-theme="dark"] .theme-toggle .icon-moon { display: none; }
```

- [ ] **Step 3: Verify the build**

Run: `(cd platform/web && npm run build 2>&1 | grep -E "built|error" | head -3)`
Expected: `✓ built`.

- [ ] **Step 4: Commit**

```bash
git add platform/web/src/app.css && git commit -m "feat(web): data-theme dark mode + toggle/icon styles" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: No-flash script + header toggle button

**Files:** Modify `platform/web/src/app.html`, `platform/web/src/routes/+layout.svelte`

- [ ] **Step 1: Add the no-flash inline script to `app.html`** — insert just before `%sveltekit.head%`:

```html
    <script>
      (function () {
        try {
          var t = localStorage.getItem('theme');
          if (t !== 'dark' && t !== 'light') {
            t = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
          }
          document.documentElement.dataset.theme = t;
        } catch (e) {}
      })();
    </script>
    %sveltekit.head%
```

- [ ] **Step 2: Replace `+layout.svelte`** with the toggle wired in

```svelte
<script>
  import '../app.css';

  function toggleTheme() {
    const cur = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
    const next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch (e) {}
  }
</script>

<header class="site-header">
  <div class="bar">
    <a href="/" class="brand">The Missing Manual</a>
    <div class="bar-right">
      <form method="GET" action="/search" class="searchbar" style="max-width:320px">
        <input type="search" name="q" placeholder="Search… e.g. undo a commit" aria-label="Search guides" />
        <button type="submit">Go</button>
      </form>
      <button class="theme-toggle" on:click={toggleTheme} aria-label="Toggle dark mode" title="Toggle dark mode">
        <svg class="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>
        <svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
      </button>
    </div>
  </div>
</header>

<main>
  <slot />
</main>
```

- [ ] **Step 3: Build, then live-verify the toggle with the browse binary**

Run (build): `(cd platform/web && npm run build 2>&1 | grep -E "built|error" | head -3)` → expect `✓ built`.

Then start the servers (API + dev) and verify with browse:
```bash
B="$HOME/.claude/skills/gstack/browse/dist/browse"
"$B" goto "http://localhost:5173/" 2>&1 | tail -1
# default follows OS / light:
"$B" js "document.documentElement.dataset.theme" 2>&1 | tail -1
# simulate a saved dark choice + reload, expect data-theme=dark and dark bg:
"$B" js "localStorage.setItem('theme','dark')" 2>&1 | tail -1
"$B" goto "http://localhost:5173/" 2>&1 | tail -1
"$B" js "document.documentElement.dataset.theme + ' / ' + getComputedStyle(document.body).backgroundColor" 2>&1 | tail -1
```
Expected: after setting `theme=dark` and reloading, `dataset.theme` is `dark` and the body background is the dark value (`rgb(16, 16, 18)`), with no flash.

- [ ] **Step 4: Commit**

```bash
git add platform/web/src/app.html platform/web/src/routes/+layout.svelte && git commit -m "feat(web): light/dark toggle button + no-flash theme script" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Definition of Done

- `docker compose up --build` serves the site on `:5173` and the API on `:3000`, with real content (web SSR reaching the api container).
- A header toggle flips light/dark, persists across reloads via `localStorage`, follows the OS when unset, and never flashes the wrong theme on load.
- `cargo build -p server` and `npm run build` both pass; local non-Docker run is unchanged.

## Self-Review

**Spec coverage:** Docker §1 → Tasks 1-4 (env config, two Dockerfiles, dockerignores, compose). Toggle §2 → Tasks 5-6 (data-theme CSS, no-flash script, header button). Out-of-scope items (categories, wizard) correctly absent.
**Placeholders:** none — every file's full content is given, with exact build/curl/browse verification commands.
**Consistency:** `BIND_ADDR`/`CONTENT_ROOT` names match between `main.rs`, the Dockerfile `ENV`, and compose `environment`. `API_BASE`/`PORT` match between the web Dockerfile and compose. `data-theme="dark"` and the `.icon-sun`/`.icon-moon`/`.bar-right`/`.theme-toggle` class names match between `app.css`, `app.html`, and `+layout.svelte`.
