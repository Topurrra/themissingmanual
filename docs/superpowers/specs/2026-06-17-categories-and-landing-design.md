# Design Spec — Categories, Landing, and Category Pages

**Date:** 2026-06-17
**Status:** Design approved by user.
**Scope:** Turn the flat guide list into a categorized library: a real landing (hero + category grid +
newly-added) and per-category pages (sidebar + main, grouped by difficulty). Lays the metadata
foundation for the later learning-path wizard. The wizard itself is out of scope.

---

## 1. Content model

- **Canonical categories (7),** defined in `content-core` (`categories.rs`) so "coming soon" categories
  exist even with zero guides. Each: `slug`, `name`, `icon` (Tabler outline name), `blurb`, `order`.
  | slug | name | icon |
  |------|------|------|
  | programming-languages | Programming Languages | ti-code |
  | version-control | Version Control | ti-git-branch |
  | devops | DevOps & Infra | ti-server |
  | databases | Databases | ti-database |
  | architecture | Architecture | ti-sitemap |
  | performance | Performance | ti-gauge |
  | security | Security | ti-shield-lock |
- **Guides gain a `category`** (a category slug) set in `_guide.md` frontmatter. `Frontmatter.category`
  is **`Option<String>`** (`#[serde(default)]`) so only `_guide.md` needs it; phase files omit it.
- **Difficulty** reuses the existing `_guide.md` `difficulty` (`beginner|intermediate|advanced`),
  displayed as **Basic / Intermediate / Advanced** (`beginner → Basic`).
- The existing Git guide's `_guide.md` gets `category: version-control`.

## 2. content-core

- **`models.rs`:** `GuideSummary` gains `category: String` and `difficulty: String`. New
  `Category { slug, name, icon, blurb, count }` (Serialize/Deserialize).
- **`categories.rs` (new):** the canonical 7-entry list + helper to attach counts.
- **`store.rs`:** `guides` table gains `category TEXT` and `difficulty TEXT`. `upsert_guide` takes
  `(slug, title, summary, category, difficulty)`. `list_guides()` returns the new fields.
  `guides_for_category(slug) -> Vec<GuideSummary>` (ordered by difficulty then title).
- **`ingest.rs`:** on the phase-0 (`_guide.md`) record, pass `fm.category` (default `""`) and
  `fm.difficulty` to `upsert_guide`. The first-seen placeholder uses empty category/difficulty,
  refined when phase 0 is read.

## 3. API (server)

- `GuideSummary` (via content-core) now carries `category` + `difficulty` on every endpoint that
  returns it.
- **`GET /api/categories`** → the 7 `Category` objects (with live guide counts), in `order`.
- **`GET /api/categories/:slug`** → `{ category: Category, guides: Vec<GuideSummary> }`; 404 for an
  unknown slug. (The web groups `guides` by difficulty.)
- `GET /api/guides` still returns all guides (now with category/difficulty) — used for "newly added".

## 4. Web

- **Home (`/`) redesign:** hero (characterful headline + tagline + prominent search) → **category grid**
  (the 7 from `/api/categories`; live categories link to their page and show counts, zero-count ones
  show "Coming soon" and are non-clickable) → **"Newly added"** (most-recent guides from `/api/guides`
  sorted by `updated`, descending).
- **Category page (`/categories/[slug]`):** server-loads `/api/categories/:slug`.
  - **Sidebar:** the category's guides grouped under Basic / Intermediate / Advanced (each a link).
  - **Main:** the same three groups as richer cards (title + summary).
  - **Empty/coming-soon:** if the category has no guides, an inviting empty state ("Guides for X are on
    the way") instead of empty groups.
  - Unknown slug → SvelteKit 404.
- **Difficulty mapping** helper in `lib`: `beginner→Basic`, `intermediate→Intermediate`,
  `advanced→Advanced`; unknown → Basic.

## 5. Out of scope
The learning-path wizard / tracks / prerequisites (later north-star). No auth, no per-user state.

## 6. Testing
- **content-core:** `upsert_guide` round-trips category+difficulty; `guides_for_category` filters +
  orders; `categories()` returns 7 with correct counts after ingesting the real guides (version-control
  = 1, others = 0). Existing tests updated for the new `upsert_guide` signature.
- **server:** `GET /api/categories` returns 7 with `version-control` count = 1; `GET
  /api/categories/version-control` returns the Git guide; unknown slug → 404.
- **web:** `npm run build` passes; live browse check — home shows the grid + newly-added, the
  Version Control card links to `/categories/version-control`, that page shows the Git guide under Basic.
