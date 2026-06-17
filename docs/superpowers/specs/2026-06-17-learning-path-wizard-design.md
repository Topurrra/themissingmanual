# Design Spec — Learning-Path Wizard (north-star, parked)

**Date:** 2026-06-17
**Status:** APPROVED DESIGN — **parked / design-for-later. Not to be built yet.**
**Build trigger:** enough content exists to fill at least one real track (most of a track's steps resolve
to live guides). Today only the Git guide is live, so building now would ship an all-"coming soon" shell.
**Scope:** the personalized learning-path wizard — pick a track, make choices, get an ordered roadmap of
real guides. Builds directly on the categories foundation (guide `category` + `difficulty`).

---

## 1. Goal

Turn the library from a browsable reference into a **guided depth-learning** product: a user picks a track
(e.g. *Backend Developer*), answers a few choices (language, framework, database…), and gets an ordered
roadmap of real guides — "the roadmap a senior who cares would hand you." Personalized, shareable, and
honest about gaps ("coming soon" steps double as the content backlog).

## 2. Model — curated spine + choice slots

A **Track** is a hand-authored, ordered list of **steps**. Each step carries a **category** and is either:
- **fixed** — bound to a specific guide (or coming-soon if that guide doesn't exist yet), or
- **choice-bound** — bound to a **choice dimension**; the user's answer selects which guide fills it.

This keeps senior-curated ordering while personalizing the content. A track is a journey *across*
categories, which is why the track page groups by category (§6) — consistent with category pages.

## 3. Choice dimensions (expanded)

Reusable, track-referenced dimensions. A track declares the subset relevant to it.
- `language` — Go / Rust / Python / Node / …
- `framework` — (depends on language/role) e.g. Axum / Express / FastAPI / React / Svelte …
- `api-style` — REST / GraphQL / gRPC
- `database` — PostgreSQL / MySQL / MongoDB / SQLite
- `version-control` — Git (one option today)
- `deployment` — Docker / Kubernetes / serverless / VPS
- `testing` — unit-first / e2e-first / property-based

Each dimension: `{ id, label, options: [{ value, label, guide_slug? }] }`. An option maps to a guide slug
*when that guide exists* (else the resolved step is coming-soon).

## 4. Wizard flow (stateless, shareable)

- `/paths` — list the tracks (cards).
- `/paths/<track>` with no choices → show the track's choice questions (simple selects) → submit.
- Submitting encodes choices in the URL: `/paths/<track>?language=go&database=postgresql&…` → the
  resolved roadmap renders (server-side). No accounts needed; the URL *is* the saved/shareable roadmap.

## 5. Landing additions

The home gains a **"Learning paths"** section (curated tracks as cards) alongside the existing
"Browse by topic" (categories) and "Newly added." Two ways in: follow a path, or browse a topic.

## 6. Track page — sidebar + main (mirrors the category page)

`/paths/<track>`:
- **Sidebar** — the categories the track spans, each with the track's items (steps) under it
  (Version Control → the Git guide; Programming Languages → "Go fundamentals"; Databases →
  "PostgreSQL"…). Navigation outline, same pattern as the category page.
- **Main** — the **ordered roadmap**: steps in track order, each linking to its guide (live) or marked
  "coming soon," with the user's choices reflected (chips at top).
- Pick a step from either the sidebar or the main list.

## 7. Data model & API

- **content-core `tracks` module** (curated config, like `categories`): `Track { slug, name, blurb,
  choices: Vec<DimensionId>, steps: Vec<Step> }`; `Step { id, title, category, choice_binding:
  Option<DimensionId>, guide_slug: Option<String>, note: Option<String> }`; `ChoiceDimension { id,
  label, options: Vec<ChoiceOption> }`.
- **Resolution** (testable, in content-core): `resolve_roadmap(track, choices: &Map<DimensionId, Value>,
  store) -> Vec<ResolvedStep>` where `ResolvedStep { title, category, guide: Option<GuideSummary>,
  coming_soon: bool }`. Fixed steps resolve their `guide_slug`; choice-bound steps resolve the chosen
  option's `guide_slug`; unresolved/missing → `coming_soon`.
- **API:** `GET /api/tracks` → track summaries (slug, name, blurb, step count, categories touched);
  `GET /api/tracks/:slug` → the track + its choice dimensions (for the choice UI) + the resolved roadmap
  given `?choice` query params.
- **No new guide frontmatter** is required — tracks reference existing guide slugs and the existing
  `category`. (A guide can belong to many tracks.)

## 8. Out of scope / future (post-accounts)

- Progress tracking (checkmarks per step), saved roadmaps, "resume where you left off."
- **Frecency + recency** personalized ordering of search/results (the original post-accounts item).
- Adaptive difficulty, prerequisite enforcement, multi-track combos.

## 9. Testing (when built)

- `resolve_roadmap`: fixed step → its guide; choice-bound step → the chosen option's guide; missing
  guide → coming_soon; unknown choice value → coming_soon.
- API: `/api/tracks` lists tracks; `/api/tracks/:slug?language=go` resolves the Go step; unknown track → 404.
- Web: `/paths` lists tracks; `/paths/<track>` renders the choice form then the roadmap; sidebar groups by
  category; live steps link, coming-soon steps don't.

## 10. Why parked

The wizard's value scales with content breadth. With one live guide, every track is ~95% "coming soon" —
a promise, not a product. **Build it once a track can be mostly filled** (write guides across Programming
Languages, Databases, DevOps). Until then this spec is the contract, and the "coming soon" steps are the
prioritized content backlog. The categories work already shipped the metadata foundation it needs.
