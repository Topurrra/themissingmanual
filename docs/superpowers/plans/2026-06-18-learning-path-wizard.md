# Learning-Path Wizard — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Builds to the approved spec
> `docs/superpowers/specs/2026-06-17-learning-path-wizard-design.md`. Rust via `cargo test`; web via build + browse.

**Goal:** Curated learning tracks (ordered steps; each fixed-to-a-guide or bound to a choice dimension) that
resolve — given URL-encoded choices — into a personalized, shareable roadmap of real guides (or honest
"coming soon"). Tracks listed on the landing + at `/paths`.

**Architecture:** a `content-core::tracks` curated-config module (like `categories`) with a stateless
`resolve_roadmap`; two read API endpoints; SvelteKit `/paths` + `/paths/[track]` pages rendering inside the
existing global shell (no second sidebar — consistent with the redesigned category page).

**Test command:** `cargo test --manifest-path platform/Cargo.toml`

---

### Task 1: `content-core::tracks` — types, curated data, resolve

**Files:** Create `platform/core/src/tracks.rs`; modify `platform/core/src/lib.rs`

- [ ] **Step 1: Types + curated config.** Create `tracks.rs`:
```rust
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use crate::models::GuideSummary;
use crate::store::{Store, StoreError};

#[derive(Debug, Clone, Serialize)]
pub struct ChoiceOption { pub value: String, pub label: String, pub guide_slug: Option<String> }
#[derive(Debug, Clone, Serialize)]
pub struct ChoiceDimension { pub id: String, pub label: String, pub options: Vec<ChoiceOption> }

#[derive(Debug, Clone)]
struct StepDef { id: &'static str, title: &'static str, category: &'static str,
                 choice: Option<&'static str>, guide_slug: Option<&'static str>, note: Option<&'static str> }
#[derive(Debug, Clone)]
struct TrackDef { slug: &'static str, name: &'static str, blurb: &'static str,
                  choices: &'static [&'static str], steps: &'static [StepDef] }

#[derive(Debug, Clone, Serialize)]
pub struct TrackSummary { pub slug: String, pub name: String, pub blurb: String,
                          pub step_count: usize, pub categories: Vec<String> }
#[derive(Debug, Clone, Serialize)]
pub struct ResolvedStep { pub id: String, pub title: String, pub category: String,
                          pub note: Option<String>, pub choice: Option<String>,
                          pub guide: Option<GuideSummary>, pub coming_soon: bool }
```
Define a `dimension(id) -> Option<ChoiceDimension>` registry (hand-authored) covering: `version-control`
(Git → `git-explained-like-a-human`), `language` (Go/Rust/Python/Node — no guides yet), `database`
(PostgreSQL/MySQL/MongoDB/SQLite), `api-style` (REST/GraphQL/gRPC), `deployment` (Docker/Kubernetes/VPS),
`testing` (unit-first/e2e-first). Most options have `guide_slug: None` (coming soon).
Define `const TRACKS: &[TrackDef]` with two tracks:
- `backend-developer` ("Backend Developer"), choices `[language, database, api-style, deployment, testing]`,
  steps: version control (fixed → `git-explained-like-a-human`, category `version-control`), then one
  choice-bound step per declared dimension (categories: programming-languages, databases, architecture,
  devops, architecture).
- `devops-engineer` ("DevOps Engineer"), choices `[deployment]`, steps: version control (fixed → git),
  containers & deploy (choice → deployment), plus 1–2 fixed coming-soon steps (CI/CD, observability).
- [ ] **Step 2: Public fns:**
```rust
pub fn list_tracks() -> Vec<TrackSummary>;          // map TRACKS, dedupe categories in order
pub fn dimensions_for(track_slug: &str) -> Option<Vec<ChoiceDimension>>;  // the track's declared dims
pub fn resolve_roadmap(track_slug: &str, choices: &HashMap<String,String>, store: &Store)
    -> Result<Option<Vec<ResolvedStep>>, StoreError>;
pub fn track_meta(track_slug: &str) -> Option<TrackSummary>;
```
`resolve_roadmap`: for each step — fixed → resolve `guide_slug` via `store.get_guide` (published);
choice-bound → if `choices[dim]` set, find the option, resolve its `guide_slug`; `guide=None` ⇒
`coming_soon=true`. `choice` field = the chosen value (for chips).
- [ ] **Step 3: Tests** (`tracks.rs`):
```rust
#[test]
fn backend_track_resolves_git_and_marks_rest_coming_soon() {
    let s = Store::open_in_memory().unwrap();
    s.upsert_guide("git-explained-like-a-human","Git","x","version-control","beginner").unwrap();
    let mut choices = std::collections::HashMap::new();
    choices.insert("language".to_string(), "go".to_string());
    let road = resolve_roadmap("backend-developer", &choices, &s).unwrap().unwrap();
    assert!(road[0].guide.is_some());           // version control → live git guide
    assert!(road.iter().any(|st| st.coming_soon)); // language=go has no guide yet
    assert!(list_tracks().iter().any(|t| t.slug=="backend-developer"));
    assert!(resolve_roadmap("nope", &choices, &s).unwrap().is_none());
}
```
- [ ] **Step 4:** `lib.rs`: add `pub mod tracks;`. **Step 5: Run** → PASS. **Commit** `feat(core): learning-path tracks + resolve_roadmap`.

---

### Task 2: Tracks API

**Files:** Modify `platform/server/src/routes.rs`

- [ ] **Step 1: Test** (`tests/api.rs`): `GET /api/tracks` → array incl. `backend-developer`;
`GET /api/tracks/backend-developer?language=go` → JSON has `track`, `dimensions`, `roadmap` (roadmap[0]
resolves the git guide); unknown track → 404.
- [ ] **Step 2: Implement** handlers (public):
- `GET /api/tracks` → `Json(tracks::list_tracks())`.
- `GET /api/tracks/:slug` (read `Query<HashMap<String,String>>` for choices) → 404 if `track_meta` None;
  else `Json({ track: track_meta, dimensions: dimensions_for, roadmap: resolve_roadmap, choices })`.
- Routes: `.route("/api/tracks", get(list_tracks_h))`, `.route("/api/tracks/:slug", get(track_detail_h))`.
- [ ] **Step 3: Run** → PASS. **Commit** `feat(server): /api/tracks endpoints`.

---

### Task 3: Web — `/paths` list + `/paths/[track]` roadmap

**Files:** `platform/web/src/lib/api.js`; create `routes/paths/+page.{server.js,svelte}`,
`routes/paths/[track]/+page.{server.js,svelte}`; `app.css`

- [ ] **Step 1:** `lib/api.js` — add `listTracks(fetch)` → `/api/tracks`; `getTrack(fetch, slug, search)` →
`/api/tracks/${slug}${search}` (pass through the querystring for choices).
- [ ] **Step 2:** `/paths/+page.server.js` loads `listTracks`; `+page.svelte` renders track cards
(name, blurb, step count, categories) linking to `/paths/<slug>`.
- [ ] **Step 3:** `/paths/[track]/+page.server.js` loads `getTrack(fetch, params.track, url.search)` (404 →
SvelteKit `error(404)`); `+page.svelte`:
  - **Choice form** — a `<select>` per `dimensions` entry, pre-selected from `data.choices`; GET form to
    `/paths/<track>` (so submitting encodes choices in the URL → shareable). A "Build roadmap" submit.
  - **Roadmap** — chosen choices as chips; the ordered steps: each shows its number + category eyebrow +
    title; live steps link to `/guides/<slug>` (use guide.title), coming-soon steps show a muted "Coming soon"
    tag. Renders in the global shell's main column (no second sidebar).
- [ ] **Step 4:** `app.css` — styles for `.track-cards`, `.roadmap`, `.road-step`, `.chip`, `.soon-tag`,
choice form, using existing tokens.
- [ ] **Step 5:** `(cd platform/web && npm run build)` → passes. **Commit** `feat(web): learning paths (/paths + track roadmap)`.

---

### Task 4: Landing — "Learning paths" section

**Files:** Modify `platform/web/src/routes/+page.server.js`, `platform/web/src/routes/+page.svelte`

- [ ] **Step 1:** Home loader also calls `listTracks(fetch)` → returns `tracks`.
- [ ] **Step 2:** Add a "Learning paths" section (eyebrow + track cards) above or below "Browse by topic",
linking to `/paths/<slug>`; a "See all paths →" link to `/paths`.
- [ ] **Step 3:** Build → passes. **Commit** `feat(web): learning paths on the landing`.

---

### Task 5: Live verify
- [ ] API + web. Home shows "Learning paths"; `/paths` lists both tracks; `/paths/backend-developer` shows the
choice form; submitting `language=go&database=postgresql` updates the URL and roadmap; the version-control
step links to the live Git guide while the rest show "Coming soon"; the page sits in the global shell.
Screenshot the track roadmap.

---

## Self-review
- **Spec coverage:** curated tracks + choice dimensions + fixed/choice steps (T1); stateless
  `resolve_roadmap` + shareable URL choices (T1/T3); `/api/tracks[/:slug]` (T2); `/paths` + track page
  mirroring-but-shell-consistent (T3); landing section (T4). No new guide frontmatter (spec §7) — tracks
  reference existing slugs + categories.
- **Naming:** `list_tracks`/`dimensions_for`/`resolve_roadmap`/`track_meta` (core) consistent across T1/T2;
  `listTracks`/`getTrack` (web) across T3/T4.
- **Content caveat:** with only the Git guide live, most steps resolve to `coming_soon` (expected; honest).
