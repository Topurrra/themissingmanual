# Design Spec — The Missing Manual: Flagship Guide & Foundation

**Date:** 2026-06-17
**Status:** Draft for review
**Scope of this spec:** The first sub-project — produce one flagship guide (Git) that proves the
voice and quality bar, on a deliberately minimal platform, structured so the *real product*
(phased content + natural-language search + Rust/Tantivy backend) is a clean additive step later.

---

## 1. The Soul (non-negotiable)

The missing manual for developers: a text-first, self-paced, completely free library of real-world
knowledge that nobody teaches. Not oversimplified ("build a todo app"), not a dry 1000-page
reference. Every piece answers one question:

> **"Would this have saved me from a terrible day at work?"** If yes, it belongs.

Voice: a battle-hardened friend who *remembers being lost*. Explains **what a thing actually is**,
**what each command really does in real life**, **when you actually need it**, and **how to stay
calm when it breaks** — with concrete examples. Zero ego. No "read the docs."

Audience: junior and mid-level devs drowning in undocumented enterprise reality, career-switchers,
and anyone tired of toy projects.

---

## 2. Strategy: Content-First

The content is the soul; the platform serves it. The fastest way to kill this project is to spend
weeks building a slick platform that serves zero guides. So: **prove the soul with one genuinely
great guide first**, on the lightest real platform, then let the platform earn its complexity.

The flagship does double duty — it is our first guide *and* the reusable template every future
guide is measured against.

---

## 3. In Scope (this sub-project) / Out of Scope (for now)

**In scope**
- One flagship guide on Git: "Foundation done right" (see §4).
- The reusable **voice + format template** (§4.5).
- The **content model + phasing model + frontmatter schema** (§5) — so content is search-ready and
  phase-ready from day one.
- Minimal **Markdown-first** delivery (§6) that reads perfectly on GitHub today.
- The **soul doc** (`CONTRIBUTING.md`) that enshrines the voice + quality bar for future authors.

**Out of scope now (but explicitly designed-for — see §7)**
- The static-site front-end (Astro/VitePress/mdBook).
- The Rust backend + Tantivy natural-language search.
- Live/interactive runnable code sandboxes.
- Community, donations, premium perks.
- Deep Git disaster recovery (reflog spelunking, undoing *pushed* history, rebase rescue) → that is
  **guide #2**, intentionally cut from the flagship to keep it finishable.

---

## 4. The Flagship Guide

**Working title:** "Git, Explained Like You're a Human — what it actually is, what every command
really does, and how to stay calm when it breaks."

### 4.1 Reader (confirmed)
The reader has *used* Git — can `clone`, `add`, `commit`, `push` — but nobody ever *explained* it.
They copy commands and pray, and panic when it breaks because they don't know what's underneath.
We meet them exactly there. Not the never-touched-a-terminal beginner; not someone who already
groks the object model.

### 4.2 Phase 1 — The mental model (the spine)
*Understanding beats memorizing.* Each concept: plain language + a diagram + a real example.
- A **commit** = a snapshot of your whole project, with a name (hash) and a parent.
- A **branch** = a sticky note pointing at a commit. *(This one realization demystifies almost everything.)*
- **HEAD** = "you are here."
- **The three places**: working directory → staging area (index) → repository. What "staged" actually means.
- **The remote** = just another copy; push/pull/fetch are sync operations between copies.

### 4.3 Phase 2 — The everyday commands, explained for real
For *each* command: what it actually does (in terms of Phase 1), when you reach for it in real life,
a **real annotated example** (command → realistic output → plain-English "here's what just
happened"), and the gotcha. Curated set — the commands you actually use, not every flag:
`status`, `add`, `commit`, `log`, `diff`, `branch`, `switch`/`checkout`, `merge`, `fetch`/`pull`,
`push`, `stash`.

### 4.4 Phase 3 — The common "oh no" moments
The payoff, each tied back to the model:
- "I committed to the wrong branch."
- "Undo my last commit but keep the work." (`reset --soft` vs `--mixed` vs `--hard`, finally made clear.)
- "I have a merge conflict and I'm terrified." (What a conflict *is*; how to read the markers.)
- "Typo in my last commit message."
- "I changed my mind about what I staged."

### 4.5 Voice & format template (the reusable asset)
- Second person, warm, zero ego.
- A **"When you actually need this"** framing on every section.
- **Annotated terminal transcripts** as the example format (command → realistic output →
  "what just happened"). Not live sandboxes — that's a later platform feature.
- **War-story callouts** ("The day I force-pushed over the lead's work…").
- **Simple diagrams** (inline SVG or ASCII so they render anywhere, including raw GitHub).
- A **cheat-card at the top** for the reader mid-emergency who needs the fix *now*, with the calm
  explanation below for when they have time.

---

## 5. Content Model & Phasing

### 5.1 The phasing rule (first-class principle)
No guide and no phase becomes a doorstop. Phasing operates at two levels:
- **Within a guide:** ordered, independently-readable phase files (the flagship = 3 phases).
- **Across the library:** the library grows as a sequence of focused guides, each its own folder.

This keeps reading digestible *and* makes every phase an independently indexable, deep-linkable
search result.

### 5.2 Frontmatter schema (search-readiness, bought cheap now)
Every phase file carries YAML frontmatter. This is what makes the future Tantivy index essentially
pre-built — title/tags become boosted fields, `summary` becomes the result snippet, `synonyms`
bridges natural-language queries to lexical content.

```yaml
---
title: "The Mental Model — What Git Actually Is"
guide: "git-explained-like-a-human"
phase: 1                       # order within the guide
summary: "Commits are snapshots, branches are sticky notes pointing at commits, HEAD is 'you are here'."
tags: [git, version-control, commits, branches, head, staging]
difficulty: beginner           # beginner | intermediate | advanced
synonyms: ["what is a git commit", "what is a branch", "what does HEAD mean", "git staging area"]
updated: 2026-06-17
---
```

`synonyms` is the cheap mechanism that lets "undo a commit" match a doc that says "revert/reset"
without reaching for embeddings.

---

## 6. File / Repo Structure (minimal, Markdown-first)

```
/guides/
  git-explained-like-a-human/
    _guide.md              ← guide overview + ordered phase list (frontmatter: title, summary, tags)
    01-the-mental-model.md
    02-everyday-commands.md
    03-when-it-breaks.md
    /assets/               ← diagrams (SVG)
/CONTENTS.md               ← library index (grows with each guide)
/CONTRIBUTING.md           ← THE SOUL DOC: voice, format template, and the
                             "would this have saved me from a terrible day at work?" quality bar
/README.md                 ← what this project is, how to read it, how to help
```

Markdown is the source of truth. It reads perfectly on GitHub today with zero tooling. A static
site and search layer are added later (§7) and read these same files — no rewrite.

---

## 7. Real-Product Architecture (design-for, build-later)

This section is **not** built in this sub-project. It records the target so today's decisions don't
paint us into a corner. The content-first start blocks none of it.

### 7.1 The clean seam
```
Markdown (source of truth, with frontmatter)
        │
        ├──► build step ──► rendered static site (HTML)
        │
        └──► build step ──► Tantivy index
                                  │
                          Rust service serves GET /search?q=...
                                  │
                          front-end search box calls it
```
The Rust + Tantivy layer is **purely additive** and reads the same Markdown files. Content authoring
never depends on the backend existing.

### 7.2 Natural-language search
- **Engine:** Tantivy (Rust, BM25/full-text), reusing the user's existing file-content indexer —
  guides are just files with content, which that setup already handles.
- **v1 approach:** full-text + per-document `synonyms` + stemming. Handles "how to revert commit",
  "how lambda works in java" well, *provided* content/metadata carry the terms (which the
  frontmatter schema guarantees). Boost `title`/`tags`, snippet from `summary`, deep-link to the phase.
- **Future option (only if proven necessary):** embedding/vector search for true semantic matching
  (e.g., paraphrases with no shared keywords). Adds ML infra; deferred under YAGNI.
- **Open decision for the search phase:** stay full-text+synonyms, or go semantic from day one?
  (Recommendation: full-text first.)

### 7.3 Backend / platform
- Backend in **Rust** (to host Tantivy + the search API; optionally serve the site).
- Static front-end (framework TBD when we reach the platform phase) consuming rendered Markdown +
  the search API.

---

## 8. Non-Goals (now)
- No platform/framework selection beyond "Markdown that renders on GitHub."
- No backend, no search service, no live sandboxes.
- No community/donation/premium features.
- No exhaustive Git coverage — curation over completeness, always.

---

## 9. Success Criteria
The flagship succeeds if:
1. A reader who "uses Git but doesn't get it" finishes Phase 1 and can correctly explain what a
   branch is in one sentence.
2. Every command in Phase 2 has a real annotated example and a "when you actually need this."
3. The "oh no" fixes in Phase 3 are each tied back to the mental model, not presented as magic spells.
4. The voice never condescends and never hand-waves ("just run X").
5. `CONTRIBUTING.md` captures the voice + quality bar well enough that a stranger could write
   guide #2 in the same spirit.
6. Every phase file has complete frontmatter (the search-readiness bar).

---

## 10. Decisions Confirmed / Open
**Confirmed**
- Content-first; flagship = Git, "Foundation done right."
- Reader = "uses Git but it was never explained" (§4.1).
- Markdown-first, GitHub-readable; static site later.
- Phasing is a first-class structural principle (§5.1).
- Tantivy/Rust search is the real-product target, designed-for now (§7).

**Open (not blocking the flagship)**
- Search v1: full-text + synonyms vs. semantic/embeddings (rec: full-text first).
- Static-site framework (decided at the platform phase).
- Final guide title.
