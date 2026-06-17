# Design Spec — Web-First Platform (The Missing Manual)

**Date:** 2026-06-17
**Status:** Design approved by user; spec for the record.
**Scope of this spec:** The platform sub-project — a real, searchable website over the existing
Markdown guides, backed by SQLite + Tantivy, built on a reusable Rust core so the Phase-2 desktop app
(Tauri) reuses the engine. Builds on the content flagship and the search direction in
`2026-06-17-git-flagship-guide-design.md` (§7).

---

## 1. Goal

Turn the Markdown guide library into a real product: **browse → read → natural-language search**, on a
real database + search engine, discoverable by search engines, and architected so a desktop app reuses
the same core later. Markdown in git stays the source of truth.

## 2. Principles

- **Markdown in git is the source of truth** (authoring, review, history). The DB + index are a derived
  serving layer.
- **One reusable core** (`content-core`) owns models + ingest + search. HTTP and UI are thin layers over
  it, so web and (later) desktop share one engine.
- **Lexical-first search**: BM25 + synonyms + Levenshtein typo tolerance now; smart/personalized ranking
  deferred to post-accounts.
- **YAGNI**: ship the smallest *real* product (browse/read/search); defer desktop, accounts, CMS.

## 3. Architecture — one core, thin layers

```text
   Markdown guides (git — source of truth)
            │   ingest: parse frontmatter + render MD->HTML + index
            ▼
   ┌─────────────────────────────┐
   │  content-core  (Rust crate) │   models · ingest · query/search
   │  SQLite  +  Tantivy index   │   (knows nothing about HTTP)
   └──────────────┬──────────────┘
                  │  Rust calls
   ┌──────────────▼──────────────┐
   │  server  (axum, Rust)       │   REST API: /api/guides, /api/search
   └──────────────┬──────────────┘
                  │  HTTP JSON
   ┌──────────────▼──────────────┐
   │  web  (SvelteKit)           │   reading UI + search; content pages
   │  prerendered for SEO        │   prerendered, search is live
   └─────────────────────────────┘
   Phase 2 desktop: Tauri wraps the SvelteKit UI + embeds content-core (offline)
```

**Components & boundaries**

- **`content-core` (Rust library crate).** Domain models (`Guide`, `Phase`, frontmatter); **ingest**
  (parse frontmatter, render Markdown→HTML, populate SQLite + Tantivy); **query** (list/get guide/phase,
  search). No HTTP knowledge. Public interface: `ingest(content_dir) -> Stats`, `list_guides()`,
  `get_guide(slug)`, `get_phase(slug, phase_no)`, `search(query, opts) -> Vec<SearchHit>`.
  Depends on: comrak (MD→HTML, GFM tables/code), Tantivy (search), rusqlite (SQLite), serde +
  serde_yaml (frontmatter).
- **`server` (Rust binary, axum).** Thin HTTP layer over `content-core`. Endpoints in §6. Also exposes an
  **`ingest` subcommand** that calls `content-core::ingest`. Serves JSON; in production can also serve the
  built SvelteKit static assets.
- **`web` (SvelteKit app).** Reading UI + search. Content pages **prerendered** (SEO + fast first paint);
  search is live against the API. Built so a static adapter output can be wrapped by Tauri in Phase 2.

## 4. Data model

**SQLite** (populated entirely by ingest):
- `guides(slug PK, title, summary, tags_json, difficulty, sort_order)`
- `phases(id PK, guide_slug FK, phase_no, title, summary, tags_json, difficulty, synonyms_json, html,
  updated, UNIQUE(guide_slug, phase_no))`

**Tantivy index** — one document per phase (and per guide overview):
- Searched fields: `title` (boosted), `tags` (boosted), `summary`, `body`, `synonyms`.
- Stored fields for results: `slug`, `phase_no`, `title`, `summary` (snippet + deep link).

## 5. Search design

- **Lexical (BM25):** query across `title`/`tags`/`summary`/`body`/`synonyms` with field boosts (title
  and tags highest).
- **Synonyms:** the per-doc `synonyms` field (from frontmatter) bridges natural-language phrasings —
  e.g., "undo a commit" matches a doc that says "revert/reset".
- **Typo tolerance (Levenshtein):** use Tantivy's `FuzzyTermQuery` (Levenshtein automaton) so
  misspellings match within edit distance 1–2 — "rebse" → "rebase", "comit" → "commit". Fuzzy matches are
  combined with exact/boosted matches so clean hits still rank first.
- **Results:** ranked `{title, summary snippet, guide slug, phase_no, deep link}`.
- **Quality bar (becomes tests):** "how to revert a commit" → Phase 3; "what is HEAD" → Phase 1; "git
  stash" → Phase 2; "rebse" still finds rebase content.

## 6. API (server)

- `GET /api/guides` → list of guide summaries.
- `GET /api/guides/:slug` → guide overview + phase list.
- `GET /api/guides/:slug/:phase` → one phase (rendered HTML + metadata).
- `GET /api/search?q=<query>` → ranked search hits.
- Errors: 404 (unknown guide/phase), 400 (empty/invalid query); JSON error bodies.

## 7. Data flow

- **Authoring:** edit Markdown → run `ingest` → validates frontmatter against our schema, renders
  Markdown→HTML (comrak), upserts SQLite + rebuilds the Tantivy index.
- **Reading:** SvelteKit prerenders guide/phase pages by calling the API → server → `content-core` →
  SQLite.
- **Searching:** search box → `GET /api/search?q=` → `content-core::search` → Tantivy → ranked hits.

## 8. Smooth updates

- **Web (v1):** re-run `ingest` → SQLite + index updated → server serves new content. Ingest builds a
  fresh index and swaps it atomically (simple rebuild acceptable for v1).
- **Desktop (Phase 2, deferred):** desktop app syncs content from a remote (pull updated DB/index, or
  fetch Markdown and re-ingest locally).

## 9. Repo structure (monorepo — adds to the existing repo)

```
/guides/                     (existing Markdown — untouched, still source of truth)
/platform/
  Cargo.toml                 (Rust workspace)
  /core/                     (crate: content-core)
  /server/                   (bin: axum API + `ingest` subcommand)
  /web/                      (SvelteKit app)
/docs/superpowers/...        (specs + plans)
```

## 10. Scope

**In (v1):** browse, read, natural-language search (lexical + synonyms + Levenshtein typo tolerance),
the ingest pipeline, the prerendered public site, tests.

**Out (deferred):** desktop app + offline sync (Phase 2); accounts/registration; frecency+recency
personalized ranking (post-accounts, §11); bookmarks; comments; donations; admin/CMS UI. Authoring stays
in Markdown.

## 11. Future enhancements (planned, not built now)

- **Desktop app (Tauri)** reusing `content-core` + the SvelteKit UI: offline reading + content sync.
  (Platform Phase 2.)
- **Smart search ranking — frecency + recency.** Once accounts/registration exist, blend lexical
  relevance with per-user **frequency + recency** signals (frecency) and global recency/popularity, so
  frequently/recently used results surface first. Requires: accounts, per-user search/click logging, and a
  ranking layer on top of Tantivy's scores. **Post-accounts — explicitly not v1.**
- Accounts, bookmarks, contributions, donations.

## 12. Testing (real code → TDD)

- **content-core:** unit tests (frontmatter parse, MD→HTML, SQLite upsert) + integration tests (ingest the
  real `guides/` → assert expected rows; `search("how to revert a commit")` → Phase 3 doc; fuzzy:
  `search("rebse")` → rebase content).
- **server:** endpoint tests (JSON shapes, 404/400).
- **web:** minimal smoke tests (routes render; search box calls the API).

## 13. Tech summary

Rust: `axum`, `tantivy`, `rusqlite`, `comrak`, `serde` + `serde_yaml`. Frontend: **SvelteKit**
(prerender/SSR + static adapter for Phase-2 Tauri). One Cargo workspace + one SvelteKit app.

## 14. Decisions confirmed / open

**Confirmed:** web-first; Markdown → SQLite + Tantivy; SvelteKit (prerendered); comrak; Levenshtein typo
tolerance in v1; frecency+recency deferred to post-accounts.

**Open (non-blocking; settle during build):** rusqlite vs sqlx; fuzzy edit distance (1 vs 2); index-swap
vs in-place rebuild; whether `server` serves the SvelteKit assets or they deploy separately.
