# Categories, Landing, and Category Pages — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Categorize the library: guides carry a category + difficulty, a canonical 7-category list drives a real landing (hero + category grid + newly-added) and per-category pages (sidebar + main, grouped Basic/Intermediate/Advanced).

**Architecture:** `content-core` gains a canonical category list and category-aware queries; the axum server exposes `/api/categories` and `/api/categories/:slug`; the SvelteKit home is rebuilt as a landing and a new `/categories/[slug]` route renders the sidebar + grouped main. Markdown stays the source of truth (`_guide.md` gains `category`).

**Tech Stack:** Rust (content-core, axum), SvelteKit. Reuses the existing `difficulty` frontmatter.

**Source spec:** `docs/superpowers/specs/2026-06-17-categories-and-landing-design.md`

**Verification:** Rust = `cargo test`; web = `npm run build` + live browse against the running stack. Difficulty display: `beginner→Basic`, else Intermediate/Advanced.

## File Structure

```
platform/core/src/models.rs            (modify) GuideSummary += category, difficulty
platform/core/src/frontmatter.rs       (modify) Frontmatter.category: Option<String>
platform/core/src/store.rs             (modify) guides table + cols; upsert_guide sig; guides_for_category
platform/core/src/categories.rs        (new)    canonical 7 + Category + counts/with-guides
platform/core/src/ingest.rs            (modify) pass category + difficulty on phase 0
platform/core/src/lib.rs               (modify) pub mod categories; re-export Category
platform/core/tests/real_guides.rs     (modify) category assertions
guides/git-explained-like-a-human/_guide.md  (modify) add category
platform/server/src/routes.rs          (modify) /api/categories + /api/categories/:slug
platform/server/tests/api.rs           (modify) category endpoint tests
platform/web/src/lib/api.js            (modify) listCategories, getCategory
platform/web/src/lib/difficulty.js     (new)    label mapping + order
platform/web/src/routes/+page.server.js (modify) load categories + recent guides
platform/web/src/routes/+page.svelte   (modify) hero + grid + newly-added
platform/web/src/routes/categories/[slug]/+page.server.js (new)
platform/web/src/routes/categories/[slug]/+page.svelte    (new) sidebar + main
platform/web/src/app.css               (modify) hero, grid, category-page styles
```

---

## Task 1: Data layer — models, frontmatter, store, ingest, guide category

**Files:** modify `models.rs`, `frontmatter.rs`, `store.rs`, `ingest.rs`, `guides/git-explained-like-a-human/_guide.md`

- [ ] **Step 1: `GuideSummary` gains fields** — in `platform/core/src/models.rs`, replace the `GuideSummary` struct:

```rust
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct GuideSummary {
    pub slug: String,
    pub title: String,
    pub summary: String,
    pub category: String,
    pub difficulty: String,
}
```

- [ ] **Step 2: Frontmatter category is optional** — in `platform/core/src/models.rs`, add to the `Frontmatter` struct (after `synonyms`):

```rust
    #[serde(default)]
    pub category: Option<String>,
```

- [ ] **Step 3: Write failing store tests** — replace the two existing store tests that call `upsert_guide` and add a category test. In `platform/core/src/store.rs` tests mod, update `upsert_then_read_back`, `get_guide_and_phase_refs`, and add `guides_for_category_filters_and_orders`:

```rust
    #[test]
    fn upsert_then_read_back() {
        let store = Store::open_in_memory().unwrap();
        store.upsert_guide("git", "Git Guide", "All about git", "version-control", "beginner").unwrap();
        store.upsert_phase(&sample_phase()).unwrap();
        let got = store.get_phase("git", 1).unwrap().unwrap();
        assert_eq!(got.title, "The Mental Model");
        let guides = store.list_guides().unwrap();
        assert_eq!(guides.len(), 1);
        assert_eq!(guides[0].category, "version-control");
        assert_eq!(guides[0].difficulty, "beginner");
    }

    #[test]
    fn get_guide_and_phase_refs() {
        let store = Store::open_in_memory().unwrap();
        store.upsert_guide("git", "Git Guide", "All about git", "version-control", "beginner").unwrap();
        store.upsert_phase(&sample_phase()).unwrap();
        let g = store.get_guide("git").unwrap().unwrap();
        assert_eq!(g.title, "Git Guide");
        assert_eq!(g.category, "version-control");
        assert!(store.get_guide("missing").unwrap().is_none());
        let refs = store.list_phase_refs("git").unwrap();
        assert_eq!(refs.len(), 1);
        assert_eq!(refs[0].title, "The Mental Model");
    }

    #[test]
    fn guides_for_category_filters_and_orders() {
        let store = Store::open_in_memory().unwrap();
        store.upsert_guide("git", "Git Guide", "x", "version-control", "beginner").unwrap();
        store.upsert_guide("rust", "Rust Guide", "y", "programming-languages", "advanced").unwrap();
        let vc = store.guides_for_category("version-control").unwrap();
        assert_eq!(vc.len(), 1);
        assert_eq!(vc[0].slug, "git");
        assert!(store.guides_for_category("databases").unwrap().is_empty());
    }
```

- [ ] **Step 4: Run them to confirm failure**

Run: `cargo test --manifest-path platform/Cargo.toml -p content-core store 2>&1 | tail -5`
Expected: FAIL to compile — `upsert_guide` arity changed, `guides_for_category` missing, `GuideSummary` fields.

- [ ] **Step 5: Update the store** — in `platform/core/src/store.rs`:

(a) `CREATE TABLE guides` now has the columns — replace the guides table DDL:
```rust
            "CREATE TABLE IF NOT EXISTS guides (
                 slug TEXT PRIMARY KEY,
                 title TEXT NOT NULL,
                 summary TEXT NOT NULL,
                 category TEXT NOT NULL DEFAULT '',
                 difficulty TEXT NOT NULL DEFAULT ''
             );
```
(keep the `phases` table DDL exactly as is, in the same `execute_batch`.)

(b) replace `upsert_guide`:
```rust
    pub fn upsert_guide(&self, slug: &str, title: &str, summary: &str, category: &str, difficulty: &str) -> Result<(), StoreError> {
        self.conn.execute(
            "INSERT INTO guides (slug, title, summary, category, difficulty) VALUES (?1, ?2, ?3, ?4, ?5)
             ON CONFLICT(slug) DO UPDATE SET title=?2, summary=?3, category=?4, difficulty=?5",
            params![slug, title, summary, category, difficulty],
        )?;
        Ok(())
    }
```

(c) replace `list_guides` and `get_guide` to select the new columns, and add `guides_for_category`:
```rust
    pub fn list_guides(&self) -> Result<Vec<GuideSummary>, StoreError> {
        let mut stmt = self.conn.prepare(
            "SELECT slug, title, summary, category, difficulty FROM guides ORDER BY slug",
        )?;
        let rows = stmt.query_map([], Self::row_to_guide)?;
        Ok(rows.collect::<Result<Vec<_>, _>>()?)
    }

    pub fn get_guide(&self, slug: &str) -> Result<Option<GuideSummary>, StoreError> {
        let mut stmt = self.conn.prepare(
            "SELECT slug, title, summary, category, difficulty FROM guides WHERE slug = ?1",
        )?;
        let mut rows = stmt.query(params![slug])?;
        match rows.next()? {
            Some(row) => Ok(Some(Self::row_to_guide(row)?)),
            None => Ok(None),
        }
    }

    pub fn guides_for_category(&self, category: &str) -> Result<Vec<GuideSummary>, StoreError> {
        let mut stmt = self.conn.prepare(
            "SELECT slug, title, summary, category, difficulty FROM guides WHERE category = ?1 ORDER BY difficulty, title",
        )?;
        let rows = stmt.query_map(params![category], Self::row_to_guide)?;
        Ok(rows.collect::<Result<Vec<_>, _>>()?)
    }

    fn row_to_guide(row: &rusqlite::Row) -> rusqlite::Result<GuideSummary> {
        Ok(GuideSummary {
            slug: row.get(0)?,
            title: row.get(1)?,
            summary: row.get(2)?,
            category: row.get(3)?,
            difficulty: row.get(4)?,
        })
    }
```

- [ ] **Step 6: Update ingest to pass category + difficulty** — in `platform/core/src/ingest.rs`, replace the first-seen placeholder and the phase-0 lines:

```rust
        if seen_guides.insert(fm.guide.clone()) {
            writer.delete_guide(&fm.guide);
            store.upsert_guide(&fm.guide, &fm.guide, "", "", "")?;
            stats.guides += 1;
        }

        if fm.phase == 0 {
            store.upsert_guide(
                &fm.guide,
                &fm.title,
                &fm.summary,
                fm.category.as_deref().unwrap_or(""),
                &fm.difficulty,
            )?;
        }
```

- [ ] **Step 7: Add the category to the Git guide** — in `guides/git-explained-like-a-human/_guide.md` frontmatter, add after the `tags:` line:

```yaml
category: version-control
```

- [ ] **Step 8: Run the store tests to verify they pass**

Run: `cargo test --manifest-path platform/Cargo.toml -p content-core store 2>&1 | tail -6`
Expected: all three store tests PASS.

- [ ] **Step 9: Commit**

```bash
git add platform/core guides/git-explained-like-a-human/_guide.md && git commit -m "feat(content-core): guide category + difficulty, guides_for_category" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Canonical categories module

**Files:** create `platform/core/src/categories.rs`; modify `platform/core/src/lib.rs`, `platform/core/tests/real_guides.rs`

- [ ] **Step 1: Create `platform/core/src/categories.rs`**

```rust
use serde::{Deserialize, Serialize};
use crate::models::GuideSummary;
use crate::store::{Store, StoreError};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Category {
    pub slug: String,
    pub name: String,
    pub icon: String,
    pub blurb: String,
    pub count: usize,
}

struct Def {
    slug: &'static str,
    name: &'static str,
    icon: &'static str,
    blurb: &'static str,
}

const DEFS: &[Def] = &[
    Def { slug: "programming-languages", name: "Programming Languages", icon: "ti-code", blurb: "Languages and their features, explained the way they should have been." },
    Def { slug: "version-control", name: "Version Control", icon: "ti-git-branch", blurb: "Git and friends: what they actually do, and how to stay calm when they break." },
    Def { slug: "devops", name: "DevOps & Infra", icon: "ti-server", blurb: "Containers, CI/CD, servers, and the tools nobody hands you a map for." },
    Def { slug: "databases", name: "Databases", icon: "ti-database", blurb: "Schemas, queries, and the production lessons that come with them." },
    Def { slug: "architecture", name: "Architecture", icon: "ti-sitemap", blurb: "Designing systems that survive contact with real load and real teams." },
    Def { slug: "performance", name: "Performance", icon: "ti-gauge", blurb: "Finding the slow thing, and the tools that show you where it hides." },
    Def { slug: "security", name: "Security", icon: "ti-shield-lock", blurb: "The threats, the defaults, and the habits that keep you out of the news." },
];

fn to_category(def: &Def, count: usize) -> Category {
    Category {
        slug: def.slug.to_string(),
        name: def.name.to_string(),
        icon: def.icon.to_string(),
        blurb: def.blurb.to_string(),
        count,
    }
}

/// The canonical categories, in display order, with live guide counts.
pub fn categories_with_counts(store: &Store) -> Result<Vec<Category>, StoreError> {
    let guides = store.list_guides()?;
    Ok(DEFS
        .iter()
        .map(|d| to_category(d, guides.iter().filter(|g| g.category == d.slug).count()))
        .collect())
}

/// One category plus its guides; `None` if the slug isn't a known category.
pub fn category_with_guides(store: &Store, slug: &str) -> Result<Option<(Category, Vec<GuideSummary>)>, StoreError> {
    let def = match DEFS.iter().find(|d| d.slug == slug) {
        Some(d) => d,
        None => return Ok(None),
    };
    let guides = store.guides_for_category(slug)?;
    let cat = to_category(def, guides.len());
    Ok(Some((cat, guides)))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn seven_categories_in_order() {
        let store = Store::open_in_memory().unwrap();
        let cats = categories_with_counts(&store).unwrap();
        assert_eq!(cats.len(), 7);
        assert_eq!(cats[1].slug, "version-control");
        assert!(cats.iter().all(|c| c.count == 0));
    }

    #[test]
    fn counts_and_lookup() {
        let store = Store::open_in_memory().unwrap();
        store.upsert_guide("git", "Git", "x", "version-control", "beginner").unwrap();
        let cats = categories_with_counts(&store).unwrap();
        assert_eq!(cats.iter().find(|c| c.slug == "version-control").unwrap().count, 1);

        let (cat, guides) = category_with_guides(&store, "version-control").unwrap().unwrap();
        assert_eq!(cat.count, 1);
        assert_eq!(guides[0].slug, "git");
        assert!(category_with_guides(&store, "nope").unwrap().is_none());
    }
}
```

- [ ] **Step 2: Export it** — in `platform/core/src/lib.rs`, add the module and re-export `Category`:

```rust
pub mod categories;
```
and extend the `pub use`:
```rust
pub use categories::Category;
```

- [ ] **Step 3: Add a real-guides category assertion** — append to `platform/core/tests/real_guides.rs`:

```rust
#[test]
fn real_guides_categorized() {
    let (store, _index) = ingested();
    let cats = content_core::categories::categories_with_counts(&store).unwrap();
    let vc = cats.iter().find(|c| c.slug == "version-control").unwrap();
    assert_eq!(vc.count, 1, "the Git guide should be in version-control");
    let (_cat, guides) = content_core::categories::category_with_guides(&store, "version-control").unwrap().unwrap();
    assert_eq!(guides[0].slug, "git-explained-like-a-human");
}
```

- [ ] **Step 4: Run content-core tests**

Run: `cargo test --manifest-path platform/Cargo.toml -p content-core 2>&1 | grep -E "test result|FAILED"`
Expected: all PASS (unit + the real-guides category test).

- [ ] **Step 5: Commit**

```bash
git add platform/core && git commit -m "feat(content-core): canonical categories with counts + lookup" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: API — /api/categories and /api/categories/:slug

**Files:** modify `platform/server/src/routes.rs`, `platform/server/tests/api.rs`

- [ ] **Step 1: Write failing endpoint tests** — append to `platform/server/tests/api.rs`:

```rust
use content_core::Category;

#[tokio::test]
async fn lists_categories_with_counts() {
    let app = server::app(std::sync::Arc::new(server::AppState::build(&repo_root()).unwrap()));
    let res = app.oneshot(Request::builder().uri("/api/categories").body(Body::empty()).unwrap()).await.unwrap();
    assert_eq!(res.status(), StatusCode::OK);
    let bytes = axum::body::to_bytes(res.into_body(), usize::MAX).await.unwrap();
    let cats: Vec<Category> = serde_json::from_slice(&bytes).unwrap();
    assert_eq!(cats.len(), 7);
    assert_eq!(cats.iter().find(|c| c.slug == "version-control").unwrap().count, 1);
}

#[tokio::test]
async fn category_detail_and_404() {
    let state = std::sync::Arc::new(server::AppState::build(&repo_root()).unwrap());
    let app = server::app(state);
    let ok = app.clone().oneshot(Request::builder().uri("/api/categories/version-control").body(Body::empty()).unwrap()).await.unwrap();
    assert_eq!(ok.status(), StatusCode::OK);
    let bytes = axum::body::to_bytes(ok.into_body(), usize::MAX).await.unwrap();
    let v: serde_json::Value = serde_json::from_slice(&bytes).unwrap();
    assert_eq!(v["category"]["slug"], "version-control");
    assert!(v["guides"].as_array().unwrap().len() >= 1);

    let missing = app.oneshot(Request::builder().uri("/api/categories/nope").body(Body::empty()).unwrap()).await.unwrap();
    assert_eq!(missing.status(), StatusCode::NOT_FOUND);
}
```

- [ ] **Step 2: Run to confirm failure**

Run: `cargo test --manifest-path platform/Cargo.toml -p server categories 2>&1 | tail -5`
Expected: FAIL — routes 404 / `Category` import unresolved.

- [ ] **Step 3: Add routes + handlers** — in `platform/server/src/routes.rs`:

Add to `app()` before `.with_state(state)`:
```rust
        .route("/api/categories", get(list_categories))
        .route("/api/categories/:slug", get(category_detail))
```

Extend the content_core import:
```rust
use content_core::{Category, GuideSummary, PhaseRef};
```

Add the handlers (end of file):
```rust
async fn list_categories(State(state): State<Arc<AppState>>) -> Response {
    let result = {
        let store = state.store.lock().unwrap();
        content_core::categories::categories_with_counts(&store)
    };
    match result {
        Ok(cats) => Json(cats).into_response(),
        Err(e) => server_error(e),
    }
}

#[derive(Serialize)]
struct CategoryPage {
    category: Category,
    guides: Vec<GuideSummary>,
}

async fn category_detail(State(state): State<Arc<AppState>>, Path(slug): Path<String>) -> Response {
    let result = {
        let store = state.store.lock().unwrap();
        content_core::categories::category_with_guides(&store, &slug)
    };
    match result {
        Ok(Some((category, guides))) => Json(CategoryPage { category, guides }).into_response(),
        Ok(None) => (StatusCode::NOT_FOUND, Json(serde_json::json!({ "error": "category not found" }))).into_response(),
        Err(e) => server_error(e),
    }
}
```

- [ ] **Step 4: Run the server tests**

Run: `cargo test --manifest-path platform/Cargo.toml -p server 2>&1 | grep -E "test result|FAILED"`
Expected: all server tests PASS (existing + the two new category tests).

- [ ] **Step 5: Commit**

```bash
git add platform/server && git commit -m "feat(server): /api/categories and /api/categories/:slug" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Web — difficulty helper, API helpers, landing redesign

**Files:** create `platform/web/src/lib/difficulty.js`; modify `platform/web/src/lib/api.js`, `src/routes/+page.server.js`, `src/routes/+page.svelte`, `src/app.css`

- [ ] **Step 1: Difficulty helper** — `platform/web/src/lib/difficulty.js`

```js
// Display label + ordering for guide difficulty.
export const LEVELS = ['Basic', 'Intermediate', 'Advanced'];

export function levelLabel(difficulty) {
  if (difficulty === 'intermediate') return 'Intermediate';
  if (difficulty === 'advanced') return 'Advanced';
  return 'Basic'; // beginner / unknown
}

// Group an array of guides ({difficulty}) into [{ level, guides }] in LEVELS order.
export function groupByLevel(guides) {
  return LEVELS.map((level) => ({
    level,
    guides: guides.filter((g) => levelLabel(g.difficulty) === level),
  })).filter((grp) => grp.guides.length > 0);
}
```

- [ ] **Step 2: API helpers** — append to `platform/web/src/lib/api.js`:

```js
export const listCategories = (fetch) => getJson(fetch, '/api/categories');
export const getCategory = (fetch, slug) => getJson(fetch, `/api/categories/${encodeURIComponent(slug)}`);
```

- [ ] **Step 3: Home loader** — replace `platform/web/src/routes/+page.server.js`

```js
import { listCategories, listGuides } from '$lib/api.js';

export async function load({ fetch }) {
  const categories = (await listCategories(fetch)) ?? [];
  const guides = (await listGuides(fetch)) ?? [];
  // GuideSummary carries no date yet, so order deterministically by title.
  // "Newly added" becomes true recency once guide summaries carry `updated` (future).
  const recent = [...guides].sort((a, b) => a.title.localeCompare(b.title)).slice(0, 6);
  return { categories, recent };
}
```

- [ ] **Step 4: Home page** — replace `platform/web/src/routes/+page.svelte`

```svelte
<script>
  export let data;
  $: ({ categories, recent } = data);
</script>

<svelte:head><title>The Missing Manual for Developers</title></svelte:head>

<section class="hero">
  <h1>The manual a senior who actually cares would hand you.</h1>
  <p class="tagline">Real-world knowledge nobody teaches, explained with zero ego. Not "build a todo app," not a 1000-page reference. Free forever.</p>
  <form method="GET" action="/search" class="searchbar hero-search">
    <input type="search" name="q" placeholder="Search… e.g. how to revert a commit" aria-label="Search guides" />
    <button type="submit">Search</button>
  </form>
</section>

<h2 class="section-eyebrow">Browse by topic</h2>
<div class="cat-grid">
  {#each categories as c}
    {#if c.count > 0}
      <a class="cat-card on" href={`/categories/${c.slug}`}>
        <i class={`ti ${c.icon}`} aria-hidden="true"></i>
        <span class="cat-name">{c.name}</span>
        <span class="cat-meta">{c.count} guide{c.count === 1 ? '' : 's'} →</span>
      </a>
    {:else}
      <div class="cat-card">
        <i class={`ti ${c.icon}`} aria-hidden="true"></i>
        <span class="cat-name">{c.name}</span>
        <span class="cat-meta">Coming soon</span>
      </div>
    {/if}
  {/each}
</div>

{#if recent.length}
  <h2 class="section-eyebrow">Newly added</h2>
  <ul class="guides">
    {#each recent as g}
      <li>
        <a href={`/guides/${g.slug}`}>{g.title}</a>
        <span class="summary">{g.summary}</span>
      </li>
    {/each}
  </ul>
{/if}
```

(Tabler icons: SvelteKit doesn't ship them. Add the Tabler icon webfont via a `<link>` in `app.html` — see Step 6.)

- [ ] **Step 5: Styles** — append to `platform/web/src/app.css`

```css
/* Landing hero */
.hero { padding: 1.5rem 0 0.5rem; }
.hero h1 { font-size: 2.4rem; line-height: 1.06; max-width: 18ch; margin: 0 0 0.6rem; }
.hero .tagline { max-width: 56ch; font-size: 1.1rem; }
.hero-search { max-width: 480px; margin-top: 1.2rem; }
.hero-search input { font-size: 1rem; padding: 0.7rem 0.9rem; }
.hero-search button { padding: 0.7rem 1.1rem; }
.section-eyebrow {
  font-family: var(--font-mono);
  font-size: 0.72rem; letter-spacing: 0.09em; text-transform: uppercase;
  color: var(--muted); font-weight: 400; margin: 2.4rem 0 1rem;
}
/* Category grid */
.cat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 0.8rem; }
.cat-card {
  display: flex; flex-direction: column; gap: 0.45rem;
  border: 1px solid var(--line); border-radius: 12px; padding: 1rem 1.05rem;
  background: var(--bg);
}
.cat-card i { font-size: 22px; color: var(--faint); }
.cat-card .cat-name { font-family: var(--font-display); font-weight: 600; font-size: 1.05rem; letter-spacing: -0.01em; color: var(--ink); }
.cat-card .cat-meta { font-size: 0.85rem; color: var(--faint); }
a.cat-card.on { border-color: var(--accent); }
a.cat-card.on:hover { background: var(--surface); text-decoration: none; }
a.cat-card.on i { color: var(--accent); }
a.cat-card.on .cat-name { color: var(--ink); }
a.cat-card.on .cat-meta { color: var(--accent); font-weight: 500; }
/* Category page */
.cat-page { display: grid; grid-template-columns: 200px 1fr; gap: 2rem; align-items: start; }
.cat-side { position: sticky; top: 5rem; font-size: 0.95rem; }
.cat-side h3, .cat-main h3 {
  font-family: var(--font-mono); font-size: 0.72rem; letter-spacing: 0.08em; text-transform: uppercase;
  color: var(--muted); font-weight: 400; margin: 1.2rem 0 0.5rem;
}
.cat-side ul { list-style: none; padding: 0; margin: 0; }
.cat-side li { padding: 0.25rem 0; }
.cat-main .level-group { border-bottom: 1px solid var(--line); padding-bottom: 0.5rem; margin-bottom: 1rem; }
.cat-empty { color: var(--muted); padding: 1.5rem 0; }
@media (max-width: 640px) { .cat-page { grid-template-columns: 1fr; } .cat-side { position: static; } }
```

- [ ] **Step 6: Tabler icons font** — in `platform/web/src/app.html`, add inside `<head>` (after the Google Fonts link):

```html
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3/dist/tabler-icons.min.css" />
```

- [ ] **Step 7: Verify build**

Run: `(cd platform/web && npm run build 2>&1 | grep -E "built|error" | head -3)`
Expected: `✓ built`.

- [ ] **Step 8: Commit**

```bash
git add platform/web/src && git commit -m "feat(web): landing redesign — hero, category grid, newly added" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Web — category page (sidebar + grouped main)

**Files:** create `platform/web/src/routes/categories/[slug]/+page.server.js`, `platform/web/src/routes/categories/[slug]/+page.svelte`

- [ ] **Step 1: Loader** — `platform/web/src/routes/categories/[slug]/+page.server.js`

```js
import { error } from '@sveltejs/kit';
import { getCategory } from '$lib/api.js';

export async function load({ fetch, params }) {
  const detail = await getCategory(fetch, params.slug);
  if (!detail) throw error(404, 'Category not found');
  return detail; // { category, guides }
}
```

- [ ] **Step 2: Page** — `platform/web/src/routes/categories/[slug]/+page.svelte`

```svelte
<script>
  import { groupByLevel } from '$lib/difficulty.js';
  export let data;
  $: ({ category, guides } = data);
  $: groups = groupByLevel(guides);
</script>

<svelte:head><title>{category.name} — The Missing Manual</title></svelte:head>

<p class="nav-foot"><a href="/">← All topics</a></p>
<h1>{category.name}</h1>
<p class="tagline">{category.blurb}</p>

{#if guides.length === 0}
  <p class="cat-empty">Guides for {category.name} are on the way. In the meantime, browse what's live from the home page.</p>
{:else}
  <div class="cat-page">
    <aside class="cat-side">
      {#each groups as grp}
        <h3>{grp.level}</h3>
        <ul>
          {#each grp.guides as g}
            <li><a href={`/guides/${g.slug}`}>{g.title}</a></li>
          {/each}
        </ul>
      {/each}
    </aside>
    <div class="cat-main">
      {#each groups as grp}
        <h3>{grp.level}</h3>
        {#each grp.guides as g}
          <div class="level-group">
            <a href={`/guides/${g.slug}`} style="font-family:var(--font-display);font-weight:600;font-size:1.1rem;">{g.title}</a>
            <span class="summary">{g.summary}</span>
          </div>
        {/each}
      {/each}
    </div>
  </div>
{/if}
```

- [ ] **Step 3: Build, then live-verify the full flow**

Run (build): `(cd platform/web && npm run build 2>&1 | grep -E "built|error" | head -3)` → `✓ built`.

Then with the API + dev servers running, verify with browse:
```bash
B="$HOME/.claude/skills/gstack/browse/dist/browse"
"$B" goto "http://localhost:5173/" 2>&1 | tail -1
echo "category cards: $("$B" js "document.querySelectorAll('.cat-card').length" 2>&1 | tail -1)"
echo "VC card links: $("$B" js "(document.querySelector('a.cat-card.on')||{}).getAttribute && document.querySelector('a.cat-card.on').getAttribute('href')" 2>&1 | tail -1)"
"$B" goto "http://localhost:5173/categories/version-control" 2>&1 | tail -1
echo "git guide on category page: $("$B" js "document.body.innerText.includes('Git, Explained')" 2>&1 | tail -1)"
echo "has Basic group: $("$B" js "[...document.querySelectorAll('h3')].some(h=>h.textContent.trim()==='Basic')" 2>&1 | tail -1)"
"$B" screenshot /tmp/dr/category.png 2>&1 | tail -1
```
Expected: 7 cards; the Version Control card links to `/categories/version-control`; that page shows the Git guide under a "Basic" group.

- [ ] **Step 4: Commit**

```bash
git add platform/web/src && git commit -m "feat(web): category page with difficulty-grouped sidebar + main" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Definition of Done

- `cargo test` green (store + categories + server category endpoints).
- Home shows the hero, a 7-card category grid (Version Control live, rest "coming soon"), and a "Newly added" list.
- `/categories/version-control` shows the Git guide grouped under Basic, with a working sidebar; unknown category → 404; empty categories show the coming-soon state.
- `docker compose up` and local dev both still work.

## Self-Review

**Spec coverage:** §1 model (Task 1: category Option, difficulty, the 7 in Task 2). §2 content-core (Tasks 1-2). §3 API (Task 3). §4 web — home redesign (Task 4), category page sidebar+main grouped (Task 5), difficulty mapping (Task 4 Step 1), coming-soon empty state (Task 5 Step 2). §6 tests covered per task.
**Placeholders:** none — full code per file. Step 4.3 sorts the "newly added" list on `title` (GuideSummary has no date yet); true recency is a future add.
**Consistency:** `upsert_guide(slug,title,summary,category,difficulty)` used identically in store impl, store tests, and ingest. `GuideSummary {slug,title,summary,category,difficulty}` and `Category {slug,name,icon,blurb,count}` match across content-core, server (`CategoryPage`), and the web (`c.slug/c.icon/c.name/c.count/c.blurb`, `g.difficulty`). Routes `/api/categories` + `/api/categories/:slug` match the web's `listCategories`/`getCategory`. `groupByLevel`/`levelLabel` names match between `difficulty.js` and the category page.
