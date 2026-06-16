# Git Flagship Guide — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce one flagship Git guide ("Foundation done right") that proves the project's voice and quality bar, on a minimal, phase-structured, search-ready Markdown foundation.

**Architecture:** Content-first. Markdown is the source of truth, structured to read perfectly on GitHub *today*. A static site + Rust/Tantivy search are deliberately deferred. Content is split into independently-readable **phase files** with rich YAML frontmatter so a future Tantivy index is essentially pre-built.

**Tech Stack:** Markdown + YAML frontmatter. Git for versioning. Inline **ASCII diagrams** for v1 (they render in raw GitHub); SVG later. No build tooling, no backend, no test framework in this phase.

**Source spec:** `docs/superpowers/specs/2026-06-17-git-flagship-guide-design.md`

---

## How "tests" work in this plan

This is a content project. The TDD "failing test" step is adapted to **acceptance checks**: a concrete, verifiable bar each task must pass before commit (voice, completeness, frontmatter validity), plus real commands where they apply (`git`, frontmatter key checks). Treat the acceptance checklist as the gate.

## Authoring policy (what's in this plan vs. written at execution)

- **Structural / contract files** (`.gitignore`, `README.md`, `CONTRIBUTING.md`, `_guide.md`, `CONTENTS.md`) — full or near-final content is given here.
- **Phase content files** — given as a **complete outline**: the exact item list, the mandatory per-item structure, voice exemplars, sample diagrams, and acceptance criteria. The prose is authored during execution *against this spec*. This keeps the plan a blueprint, not a duplicate of the guide.

## Commit convention

Conventional commits. `chore:` for scaffolding, `docs:` for content. Every commit message ends with the trailer (shown via a second `-m`):
```
-m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

All file creation uses the editor/Write tool (it creates parent directories automatically) — no `mkdir` needed, which keeps steps shell-agnostic. Only `git` commands are run in the shell.

---

## File Structure

Created by this plan:

| Path | Responsibility |
|------|----------------|
| `.gitignore` | Ignore OS/editor cruft. |
| `README.md` | What the project is, how to read it, how to help. |
| `CONTRIBUTING.md` | **The soul doc** — voice, format template, quality bar, frontmatter schema. The contract every guide is measured against. |
| `CONTENTS.md` | The library index. One flagship entry now; grows per guide. |
| `guides/git-explained-like-a-human/_guide.md` | Guide overview + ordered phase list (frontmatter). |
| `guides/git-explained-like-a-human/01-the-mental-model.md` | Phase 1 — the mental model. |
| `guides/git-explained-like-a-human/02-everyday-commands.md` | Phase 2 — everyday commands. |
| `guides/git-explained-like-a-human/03-when-it-breaks.md` | Phase 3 — common "oh no" fixes. |
| `guides/git-explained-like-a-human/assets/.gitkeep` | Reserve folder for future SVG diagrams (v1 uses inline ASCII). |

**Boundaries:** each phase file is independently readable and indexable. `CONTRIBUTING.md` owns the voice/format contract; phase files own content; `CONTENTS.md` owns navigation.

---

## Task 0: Scaffold the project + initialize git

**Files:**
- Create: `.gitignore`
- Create: `README.md`
- Create: `guides/git-explained-like-a-human/assets/.gitkeep`

- [ ] **Step 1: Initialize the repository**

Run: `git init`
Expected: `Initialized empty Git repository in F:/Projects/KnowledgeBase/.git/`

- [ ] **Step 2: Create `.gitignore`**

```gitignore
# OS
.DS_Store
Thumbs.db
# Editors
.vscode/
.idea/
*.swp
# Build output (future static site)
/dist/
/.cache/
```

- [ ] **Step 3: Create `README.md`**

```markdown
# The Missing Manual for Developers

The text-first, self-paced, completely free library of real-world knowledge nobody teaches.

Not "build a todo app." Not a dry 1000-page reference. Just the stuff that makes you competent
in a real job — explained like advice from a battle-hardened friend, with zero ego.

Every page answers one question: **"Would this have saved me from a terrible day at work?"**

## Start here
- **[Git, Explained Like You're a Human](guides/git-explained-like-a-human/_guide.md)** — what Git
  actually is, what every command really does, and how to stay calm when it breaks.

See **[CONTENTS.md](CONTENTS.md)** for the full (growing) library, and
**[CONTRIBUTING.md](CONTRIBUTING.md)** for the voice and quality bar if you want to write one.

## Status
Early. Content-first: we're proving the voice with one great guide before building the platform.
Free forever.
```

- [ ] **Step 4: Create `guides/git-explained-like-a-human/assets/.gitkeep`**

Empty file (reserves the folder for future SVG diagrams).

- [ ] **Step 5: Acceptance check**

- `git status` shows `.gitignore`, `README.md`, and the `guides/.../assets/.gitkeep` path as untracked.
- `README.md` renders cleanly (headings, links) in a Markdown preview.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: scaffold project (readme, gitignore, guide folder)" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 1: Write the soul doc (`CONTRIBUTING.md`)

This is the most important reusable asset: the contract that lets *anyone* write a guide in the right spirit. Write it near-final.

**Files:**
- Create: `CONTRIBUTING.md`

- [ ] **Step 1: Author `CONTRIBUTING.md` with these mandatory sections (content below is the spec to write to):**

1. **The one quality bar** — "Would this have saved me from a terrible day at work?" If no, cut it.
2. **Who we write for** — devs who *use* a tool but were never taught it; they copy commands and panic when it breaks. Meet them there. Never condescend.
3. **The voice — do / don't:**
   - DO: second person, warm, plain language; explain *what a thing actually is* before how to use it; say *when you actually need this*; admit when something is genuinely confusing.
   - DON'T: hand-wave ("just run X"); dump flags; assume prior knowledge silently; show a command without showing its realistic output and what it means.
4. **The anatomy of a guide** — guides are split into **phases** (no doorstops). Each teaching unit follows: **What it actually is → What it does in real life → When you actually need it → Real example → The gotcha.**
5. **Example format — annotated terminal transcript.** Include this exemplar verbatim:
   ````markdown
   ```console
   $ git status
   On branch main
   Changes not staged for commit:
     modified:   app.js
   ```
   *What just happened:* Git is telling you `app.js` has edits it hasn't been told to save yet
   ("not staged"). Nothing has been recorded — this command only *looks*, it never changes anything.
   ````
6. **Diagrams** — ASCII-first (renders in raw GitHub). SVG only when it genuinely adds clarity.
7. **Cheat-card rule** — every guide opens with a scannable cheat-card for the reader mid-emergency; the calm explanation lives below.
8. **The frontmatter schema (REQUIRED on every phase file)** — copy verbatim:
   ```yaml
   ---
   title: "Human-readable title"
   guide: "guide-folder-slug"
   phase: 1                 # order within the guide
   summary: "One sentence used as the search-result snippet."
   tags: [topic, subtopic]
   difficulty: beginner     # beginner | intermediate | advanced
   synonyms: ["natural language phrases a reader might search"]
   updated: 2026-06-17
   ---
   ```
   Explain *why*: title/tags become boosted search fields, `summary` is the snippet, `synonyms`
   bridges natural-language queries (e.g. "undo a commit") to lexical content.
9. **A worked voice example (bad → good)** — include verbatim:
   > **Don't:** "To undo a commit, run `git reset --hard HEAD~1`."
   > **Do:** "Want your last commit gone but your work kept? `git reset --soft HEAD~1` moves the
   > branch pointer back one commit — your changes are still right there, staged, as if you never
   > hit commit. (`--hard` would *also* throw away the work. We'll come back to why that distinction
   > matters.)"

- [ ] **Step 2: Acceptance check**

- All 9 sections present.
- The frontmatter schema matches the spec (`§5.2`) exactly — same keys.
- Contains at least one annotated-transcript exemplar and the bad→good voice example.
- A stranger could read it and write guide #2 in the same spirit.

- [ ] **Step 3: Commit**

```bash
git add CONTRIBUTING.md
git commit -m "docs: add CONTRIBUTING soul doc (voice, format, frontmatter schema)" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Create the guide overview (`_guide.md`)

**Files:**
- Create: `guides/git-explained-like-a-human/_guide.md`

- [ ] **Step 1: Create the file with frontmatter + overview**

```markdown
---
title: "Git, Explained Like You're a Human"
guide: "git-explained-like-a-human"
phase: 0
summary: "What Git actually is, what every everyday command really does, and how to stay calm when it breaks."
tags: [git, version-control, beginner-friendly]
difficulty: beginner
synonyms: ["learn git", "understand git", "git explained simply", "git for beginners who already use it"]
updated: 2026-06-17
---

# Git, Explained Like You're a Human

You already *use* Git. You `add`, `commit`, `push`. And yet when something goes sideways, your
stomach drops — because nobody ever told you what Git is *actually doing*. This guide fixes that.

By the end, branches, HEAD, staging, and merge conflicts won't be scary words — they'll be obvious,
because you'll understand the handful of simple ideas underneath all of them.

## How to read this
- **In a panic right now?** Jump to [Phase 3: When it breaks](03-when-it-breaks.md) and use the
  cheat-card at the top.
- **Want it to finally make sense?** Read in order — each phase builds on the last.

## The three phases
1. **[The Mental Model](01-the-mental-model.md)** — what Git *actually is*. Five ideas that make
   everything else click.
2. **[The Everyday Commands](02-everyday-commands.md)** — the commands you use daily, what each one
   *really* does, with real examples.
3. **[When It Breaks](03-when-it-breaks.md)** — the common "oh no" moments and how to fix them calmly.

> Deep disaster recovery (recovering lost commits with the reflog, undoing *already-pushed* history,
> rescuing a botched rebase) is its own guide — coming next.
```

- [ ] **Step 2: Acceptance check**

- Frontmatter complete and valid (all required keys).
- Links to all three phase files resolve (filenames match Task 3/4/5).
- Opens with the "you already use Git but were never told what it does" hook.

- [ ] **Step 3: Commit**

```bash
git add guides/git-explained-like-a-human/_guide.md
git commit -m "docs: add Git guide overview and phase index" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Write Phase 1 — The Mental Model

**Files:**
- Create: `guides/git-explained-like-a-human/01-the-mental-model.md`

**Per-concept structure (mandatory):** plain-language definition → ASCII diagram → a real example → one-line "why this saves you later."

- [ ] **Step 1: Create the file with frontmatter + section scaffold**

Frontmatter:
```yaml
---
title: "The Mental Model — What Git Actually Is"
guide: "git-explained-like-a-human"
phase: 1
summary: "Commits are snapshots, branches are sticky notes pointing at commits, HEAD is 'you are here', and almost nothing is ever truly deleted."
tags: [git, commits, branches, head, staging, remote, mental-model]
difficulty: beginner
synonyms: ["what is a git commit", "what is a git branch", "what does HEAD mean", "git staging area explained", "what is origin in git"]
updated: 2026-06-17
---
```
Section headings (author in Step 2): `Why your Git pain is really a model problem` · `A commit is a snapshot` · `A branch is a sticky note` · `HEAD is "you are here"` · `The three places` · `The remote is just another copy` · `The five ideas, recapped`.

- [ ] **Step 2: Author each concept to the per-concept structure.** Key points per concept:

  - **Why it's a model problem (hook):** Most Git terror = not knowing what's happening underneath. Promise: 5 ideas and the fear goes away.
  - **A commit is a snapshot (not a diff):** A commit records the state of your *whole* project at a moment, with a unique id (hash) and a pointer to its parent. Example: two commits in a row; show each as a full snapshot, linked child→parent. Why later: this is why you can always go back.
  - **A branch is a sticky note pointing at a commit.** Creating a branch is cheap — it's just a movable label. Use this exemplar diagram:
    ```text
    C1 ◄── C2 ◄── C3   (commits; each points at its parent)
                  ▲
                  │
                main          ← a branch is just a label on a commit
    ```
    Example: `git branch feature` makes a second label on the *same* commit — nothing is copied. Why later: merges, "lost" work, and switching all stop being mysterious.
  - **HEAD is "you are here".** HEAD points at the branch (or commit) you're currently on. Diagram showing `HEAD → main → C3`. Example: switching branches just moves HEAD. Why later: "detached HEAD" becomes a shrug.
  - **The three places:** working directory (your files) → staging area/index (what'll go in the next commit) → repository (committed history). Diagram of the three boxes with `add` and `commit` as the arrows. Example: edit → `add` → `commit` lifecycle. Why later: "staged vs unstaged" confusion ends here.
  - **The remote is just another copy.** `origin` is a full copy living elsewhere; `fetch`/`pull`/`push` sync between copies. Diagram: local repo ↔ origin. Why later: push/pull rejections make sense.
  - **Recap:** the five ideas in five lines; "now nothing can truly scare you."

- [ ] **Step 3: Acceptance check**

- Every concept has: plain definition + ASCII diagram + real example + "why later".
- No term used before it's defined in plain language.
- A reader could now write one true sentence: "A branch is a movable label pointing at a commit."
- Frontmatter complete.

- [ ] **Step 4: Commit**

```bash
git add guides/git-explained-like-a-human/01-the-mental-model.md
git commit -m "docs: write Phase 1 — Git mental model" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Write Phase 2 — The Everyday Commands

**Files:**
- Create: `guides/git-explained-like-a-human/02-everyday-commands.md`

**Per-command structure (mandatory, from CONTRIBUTING):** What it actually does (in mental-model terms) → When you actually reach for it → Real annotated example (transcript) → The gotcha.

- [ ] **Step 1: Create the file with frontmatter + the cheat-card**

Frontmatter:
```yaml
---
title: "The Everyday Commands — What Each One Really Does"
guide: "git-explained-like-a-human"
phase: 2
summary: "status, add, commit, log, diff, branch, switch, merge, fetch, pull, push, and stash — what each actually does, when to reach for it, and the gotcha."
tags: [git, commands, status, add, commit, log, diff, branch, switch, merge, pull, push, stash]
difficulty: beginner
synonyms: ["what does git add do", "git commit vs push", "difference between fetch and pull", "what is git stash", "git diff staged"]
updated: 2026-06-17
---
```
Cheat-card (author verbatim — the mid-task reader scans this):
```markdown
| Command | What it really does |
|---|---|
| `git status` | What's changed, what's staged, what branch you're on. Your dashboard — run it constantly. |
| `git add` | Move a file's current state into the staging area (the box for your next commit). |
| `git commit` | Save a snapshot of everything staged, with a message. A save point you can return to. |
| `git log` | The history of snapshots — who saved what, when, and why. |
| `git diff` | The exact lines that changed (working vs staged vs last commit). |
| `git branch` | List / create / delete the sticky-note labels that point at commits. |
| `git switch` / `checkout` | Move HEAD ("you are here") to another branch or commit. `switch` is the modern, safer name. |
| `git merge` | Combine another branch's commits into your current branch. |
| `git fetch` | Download the remote's new commits but DON'T touch your files. Just look. |
| `git pull` | `fetch` + `merge`: download remote commits and apply them now. |
| `git push` | Upload your commits to the remote so others get them. |
| `git stash` | Shelve uncommitted changes for a clean tree; `pop` them back later. |
```

- [ ] **Step 2: Author `status`, `add`, `commit` to the per-command structure.** Key points:
  - `status` — looks at all three places + branch; run before every add/commit; example shows modified/untracked/staged; gotcha: it only *reads*, never changes anything (totally safe).
  - `add` — copies the file's state *right now* into staging; choosing what goes in the commit; example: `add` one file, `status` shows it staged; gotcha: edit again after `add` and those new edits are **not** staged — re-add.
  - `commit` — records the staged snapshot, parent = current HEAD, moves the branch label forward; for meaningful checkpoints; example: `commit -m`, then `log` shows it; gotcha: commits only what's **staged**; empty message aborts.

- [ ] **Step 3: Author `log`, `diff`.** Key points:
  - `log` — walks commits backward from HEAD via parent links; to read history / find a hash; example: `git log --oneline`; gotcha: it's the view *from your current branch*; `--oneline --graph` for sanity.
  - `diff` — compares two of the three places; review before staging/committing; example: `git diff` (working vs staged) and `git diff --staged` (staged vs last commit); gotcha: plain `diff` hides already-staged changes — the #1 "why is diff empty?!" moment.

- [ ] **Step 4: Author `branch`, `switch`/`checkout`, `merge`.** Key points:
  - `branch` — manage the sticky-note labels; example: `git branch` (list), `git branch feature` (create); gotcha: creating a branch does **not** switch to it.
  - `switch`/`checkout` — move HEAD; example: `git switch -c feature` (create + switch); gotcha: `checkout` is overloaded (it also restores files) — prefer `switch`; a dirty tree can block switching.
  - `merge` — fast-forwards or creates a merge commit joining histories; bring a feature into `main`; example: on `main`, `git merge feature`; gotcha: conflicts happen when both sides changed the same lines (→ Phase 3).

- [ ] **Step 5: Author `fetch`, `pull`, `push`.** Key points:
  - `fetch` — downloads remote commits into `origin/*` refs only; safe, changes nothing in your working tree; example: `git fetch` then `git log origin/main`.
  - `pull` — `fetch` + `merge`; syncs and applies now; gotcha: can trigger conflicts/surprise merges — `fetch` then look is the calmer habit.
  - `push` — uploads local commits, advances the remote branch; example: `git push`, first time `git push -u origin feature`; gotcha: rejected if the remote has commits you don't (pull first); never force-push a shared branch (→ guide #2).

- [ ] **Step 6: Author `stash`.** Key points: saves dirty changes onto a stack and cleans the tree; switch tasks without committing half-work; example: `git stash` → `git switch main` → `git stash pop`; gotcha: it's a stack — easy to forget entries; `git stash list`.

- [ ] **Step 7: Acceptance check**

- All 12 cheat-card commands appear in the body, each with all four structure parts.
- Every command body has a real annotated transcript (command → realistic output → "what just happened").
- Explanations reference Phase 1 (staging, snapshot, label, HEAD, copy) — not standalone definitions.
- No flag appears without being explained. Frontmatter complete.

- [ ] **Step 8: Commit**

```bash
git add guides/git-explained-like-a-human/02-everyday-commands.md
git commit -m "docs: write Phase 2 — everyday Git commands" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Write Phase 3 — When It Breaks

**Files:**
- Create: `guides/git-explained-like-a-human/03-when-it-breaks.md`

**Per-scenario structure (mandatory):** The situation (relatable) → What's actually happening (mental model) → The calm fix (annotated transcript) → Why it works → How to avoid it next time.

- [ ] **Step 1: Create the file with frontmatter + the emergency cheat-card**

Frontmatter:
```yaml
---
title: "When It Breaks — Common 'Oh No' Moments, Calmly Fixed"
guide: "git-explained-like-a-human"
phase: 3
summary: "Committed to the wrong branch, undo a commit but keep the work, merge conflicts, fix a commit message, unstage files — the everyday Git scares and their calm fixes."
tags: [git, recovery, reset, merge-conflict, amend, restore, undo]
difficulty: beginner
synonyms: ["how to revert a commit", "undo last git commit", "git committed to wrong branch", "fix merge conflict", "change last commit message", "unstage a file"]
updated: 2026-06-17
---
```
Emergency cheat-card (author verbatim — for the reader mid-panic):
```markdown
> **In a panic? Find your situation, breathe, then read the section below it.**

| "Oh no…" | The calm fix |
|---|---|
| I committed to the wrong branch | Make a branch here, move the wrong one back (§1) |
| Undo my last commit but keep my work | `git reset --soft HEAD~1` (§2) |
| Merge conflict, markers everywhere | Edit, remove the `<<<<`/`====`/`>>>>` markers, `add`, commit (§3) |
| Typo in my last commit message | `git commit --amend` — **only if not pushed** (§4) |
| Staged the wrong file | `git restore --staged <file>` (§5) |
```

- [ ] **Step 2: Author §1 "I committed to the wrong branch".** Situation: committed to `main`, meant `feature`. Happening: the `main` label moved forward onto your new commit. Fix (not yet pushed): `git branch feature` (label the commit), then `git reset --hard origin/main` *or* `git reset --hard HEAD~1` on `main` to move `main` back — explain each carefully and what `--hard` discards. Why it works: branches are just labels (Phase 1). Avoid: glance at the branch line in `git status` before committing.

- [ ] **Step 3: Author §2 "Undo my last commit but keep the work" — the three resets.** Explain with a pointer diagram:
  ```text
  before:  C1 ◄── C2 ◄── C3   (main, HEAD)
  reset:   C1 ◄── C2          (main, HEAD)   ← C3's snapshot is "uncommitted"
  ```
  - `--soft HEAD~1` — move the label back; changes stay **staged** (as if you never committed).
  - `--mixed HEAD~1` (default) — move back; changes kept but **unstaged**.
  - `--hard HEAD~1` — move back and **throw away** the changes too. The dangerous one.
  Why it works: a commit is a snapshot and the branch is a label; reset just moves the label. Gotcha: never `--hard` when you'd cry to lose the work; never rewrite history you've pushed (→ guide #2).

- [ ] **Step 4: Author §3 "Merge conflict, and I'm terrified".** What it *is*: both branches changed the same lines, so Git refuses to guess. Reading the markers:
  ```text
  <<<<<<< HEAD
  your version
  =======
  their version
  >>>>>>> feature
  ```
  Fix: open the file, choose the right result, delete all three marker lines, `git add <file>`, then `git commit` (or `git merge --continue`). Escape hatch: `git merge --abort` puts everything back. Why it works: a conflict is just an unfinished merge; resolving = telling Git the final text. Avoid: integrate often, keep changes small.

- [ ] **Step 5: Author §4 "Typo in my last commit message".** Fix: `git commit --amend` (opens editor) or `git commit --amend -m "fixed message"`. What's happening: `--amend` *replaces* the last commit with a new one (new hash). Gotcha (critical): don't amend a commit you've already pushed/shared — you'd be rewriting shared history (the safe way to handle that is guide #2). Avoid: nothing to avoid — typos happen; just don't amend after pushing.

- [ ] **Step 6: Author §5 "I staged the wrong file / changed my mind".** Fixes: `git restore --staged <file>` unstages but keeps your edits (older syntax: `git reset HEAD <file>`). Contrast carefully with `git restore <file>` (no `--staged`), which **discards your working-tree edits** — flag this as destructive. Why it works: staging is just the box for the next commit (Phase 1); unstaging takes the file out of the box without touching it.

- [ ] **Step 7: Acceptance check**

- All 5 scenarios present, each with all five structure parts.
- Every fix is tied back to the Phase 1 model (label/snapshot/box), not presented as a magic spell.
- Every destructive command (`reset --hard`, `restore <file>`, `--amend` after push) carries an explicit "when NOT to do this" warning.
- At least one short **war-story callout** (a real "the day I…" aside — e.g. losing an afternoon's work to `reset --hard`) appears where it fits naturally. This is the voice device from `CONTRIBUTING.md`.
- The emergency cheat-card's section references (§1–§5) match the body.
- Deep recovery is forward-referenced to guide #2. Frontmatter complete.

- [ ] **Step 8: Commit**

```bash
git add guides/git-explained-like-a-human/03-when-it-breaks.md
git commit -m "docs: write Phase 3 — when Git breaks, calmly fixed" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: Integration pass + library index

**Files:**
- Create: `CONTENTS.md`
- Modify: any phase file needing cross-link fixes.

- [ ] **Step 1: Create `CONTENTS.md`**

```markdown
# Library Contents

The growing index of guides. Each guide is self-contained and split into readable phases.

## Git
- **[Git, Explained Like You're a Human](guides/git-explained-like-a-human/_guide.md)**
  - [Phase 1 — The Mental Model](guides/git-explained-like-a-human/01-the-mental-model.md)
  - [Phase 2 — The Everyday Commands](guides/git-explained-like-a-human/02-everyday-commands.md)
  - [Phase 3 — When It Breaks](guides/git-explained-like-a-human/03-when-it-breaks.md)

## Coming next
- Git disaster recovery (reflog, undoing pushed history, rescuing a botched rebase).
```

- [ ] **Step 2: Verify every internal link resolves.** Open `README.md`, `_guide.md`, and `CONTENTS.md`; click/preview each link. Each phase should also link "← back to guide overview" and forward/back to its siblings — add those links if missing.

- [ ] **Step 3: Verify frontmatter completeness across all phase files.**

Run (PowerShell, from repo root) — lists any phase file missing a required key:
```powershell
$req = 'title','guide','phase','summary','tags','difficulty','synonyms','updated'
Get-ChildItem guides -Recurse -Filter *.md | ForEach-Object {
  $c = Get-Content $_.FullName -Raw
  $missing = $req | Where-Object { $c -notmatch "(?m)^$_\s*:" }
  if ($missing) { "$($_.Name): missing $($missing -join ', ')" }
}
```
Expected output: **nothing** (all keys present in every file).

- [ ] **Step 4: Read-through against the spec's success criteria** (`spec §9`). Confirm each:
  1. After Phase 1, a reader can explain what a branch is in one sentence.
  2. Every Phase 2 command has a real annotated example + "when you actually need this".
  3. Every Phase 3 fix is tied back to the mental model.
  4. The voice never condescends and never hand-waves.
  5. `CONTRIBUTING.md` would let a stranger write guide #2 in the same spirit.
  6. Every phase file has complete frontmatter (verified in Step 3).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "docs: add library index, cross-links, and integration pass" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Definition of Done

- Six commits, one per task, all on the default branch.
- The flagship guide reads end-to-end with a consistent voice and no hand-waving.
- All internal links resolve; all phase files have complete frontmatter.
- `CONTRIBUTING.md` captures the voice + quality bar + frontmatter schema.
- Deep disaster recovery is cleanly scoped out to guide #2.
```