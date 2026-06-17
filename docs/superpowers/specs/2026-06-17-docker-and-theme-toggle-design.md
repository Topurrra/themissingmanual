# Design Spec — One-Command Docker + Light/Dark Toggle

**Date:** 2026-06-17
**Status:** Design approved by user.
**Scope:** Two quick DX/UX wins on the existing platform. Categories, the landing redesign, and the
learning-path wizard are separate later sub-projects (out of scope here).

---

## 1. One-command Docker

**Goal:** `docker compose up` runs the whole platform (API + web) so the user can run and inspect
everything with one command.

- **`platform/server/Dockerfile`** (build context = repo root): multi-stage. Build stage uses a Rust
  image: `cargo build --release --manifest-path platform/Cargo.toml -p server`. Runtime stage
  (debian-slim) copies the `server` binary and the `guides/` tree to `/app`, workdir `/app`, runs the
  binary. The server ingests `guides/` on startup.
- **`platform/server/src/main.rs` env config:** read `BIND_ADDR` (default `127.0.0.1:3000`) and
  `CONTENT_ROOT` (default `.`) from env. In the container, `BIND_ADDR=0.0.0.0:3000` so it's reachable.
- **`platform/web/Dockerfile`** (context = `platform/web`): multi-stage. Build uses a Node image:
  `npm ci` + `npm run build` (adapter-node → `build/`). Runtime (node-slim) copies `build/`,
  `package.json`, and production `node_modules`, runs `node build`. Reads `API_BASE` and `PORT`.
- **`docker-compose.yml`** (repo root):
  - `api`: builds the server Dockerfile; `ports: ["3000:3000"]`; `environment: BIND_ADDR=0.0.0.0:3000`.
  - `web`: builds the web Dockerfile; `ports: ["5173:3000"]`; `environment: API_BASE=http://api:3000`,
    `PORT=3000`; `depends_on: [api]`.
- **`.dockerignore`** (repo root): `platform/target`, `**/node_modules`, `platform/web/.svelte-kit`,
  `platform/web/build`, `platform/.data`, `.git` — keeps build context small/fast.

**Result:** `docker compose up` → site at `localhost:5173`, API at `localhost:3000`.

## 2. Light/dark toggle

**Goal:** a manual theme switch that persists and never flashes the wrong theme on load.

- **Drive everything off `data-theme` on `<html>`** (cleaner than the current media query, and no
  duplicated variable blocks): light vars stay in `:root`; dark vars move to `:root[data-theme="dark"]`
  (including the element-level dark tweaks: search input, inline code, blockquote, `pre` border). The
  existing `@media (prefers-color-scheme: dark)` block is replaced by these `[data-theme="dark"]`
  selectors.
- **No-flash inline script in `app.html`** (`<head>`, before paint): resolve theme as
  `localStorage.theme` if set, else the OS preference (`matchMedia('(prefers-color-scheme: dark)')`),
  and set `document.documentElement.dataset.theme`. This means: no saved choice → follow the OS; a
  saved choice → honor it; and no flash because it runs before render.
- **Toggle button in the header** (`+layout.svelte`): a sun/moon button that flips the current theme,
  sets `data-theme`, writes `localStorage.theme`, and swaps its icon. Progressive enhancement — with
  JS off, the page renders light (acceptable).

## Testing

- **Docker:** `docker compose build` succeeds; `docker compose up` serves; `curl localhost:5173/`
  renders the home and `curl localhost:3000/api/health` returns ok. (Manual run; a CI docker-build is a
  later nicety.)
- **Theme toggle:** `npm run build` passes; toggling sets `data-theme` and persists across reloads
  (manual browser check). No-flash verified by setting dark then reloading.
