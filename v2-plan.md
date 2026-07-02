# V2 Plan — deferred ideas

Ideas raised and agreed worth doing, but not in the current build round (inline exercises,
skill map + roadmap, interactive explainers, TIL cards). Captured here so they aren't lost.
Roughly ordered by cost/impact, cheapest first within each group. Nothing here is scheduled.

---

## Near-term (cheap, high-trust, no new infrastructure)

### 1. "Edit this page" → GitHub PR
Every guide is already Markdown in git. Add a small link at the foot of each phase
("Found a mistake? Edit this page →") that opens the file directly in GitHub's web editor
(`github.com/<repo>/edit/main/guides/<slug>/<file>.md`), which walks a visitor straight into
a fork + PR with zero local setup. Near-zero engineering cost, and it's how MDN and Wikipedia
built their contributor base. Requires only a public repo URL in config.

### 2. Public backlog voting
The admin backlog already harvests failed/low-hit searches (`admin/backlog`). Expose a
read-only public page ("What should we write next?") listing the same queries, with a
lightweight upvote (localStorage-deduped, no accounts). Turns the backlog into something
readers help prioritize instead of a private admin report. Reuses existing data; only new
work is a public route + a vote counter (small server-side counter table, or store votes as
another `events`-style row and aggregate the same way analytics does).

### 3. Shareable TIL cards, phase 2: auto-suggested facts
V1 (this round) shares a hand-placed fact. A v2 pass could auto-surface a candidate
"shareable line" per phase (e.g. the most distinctive sentence, or the phase `summary`) so
authors don't have to mark one manually. Nice-to-have polish once v1 usage data exists.

---

## Medium-term (real feature work)

### 4. Offline PWA + EPUB export
A text-first site is unusually well-suited to offline reading. A service worker cache for
visited guides (installable PWA) covers commuters and flaky connections; a per-guide or
per-path EPUB export covers e-readers. Makes "free for everyone" literal for low-bandwidth
readers. Medium cost (service worker + cache strategy; EPUB generation is a straightforward
Markdown→EPUB pipeline given the content is already clean Markdown).

### 5. The comeback loop
`/review` (spaced repetition) exists but nothing pulls people back to it. Local streak
tracking (already close to what the skill map, item 2 of the current round, will store) plus
an **opt-in** web-push reminder ("5 cards are due") closes the loop without accounts or email.
Depends on the skill map's local data model landing first — build this right after.

### 6. Interview-question mapping
The `tooling` category (54 tools) and concept guides already cover what job postings name.
Map guides → real interview questions ("what an interviewer actually asks about X") so
"I read the Git guide" becomes "I can handle the Git round." High perceived value for the
job-hunting audience; mechanically it's a new frontmatter field or a mapping table plus a
per-guide "Interview angle" callout. See `job-tooling-plan.md` for the tool inventory this
would hang off.

### 7. Content-gap detection, automated
The backlog already surfaces high-search/low-hit queries. A v2 pass could turn that into a
standing "content radar": cluster related failed queries, estimate a topic from them, and
draft a `_guide.md` stub automatically for a human to finish. Speeds up the write pipeline;
depends on public backlog voting (item 2) for a second, human-ranked signal to combine with.

### 8. Distribution automation
`MARKETING-BRIEF.md` makes posting *possible*; this would make it *routine* — e.g. a small
scheduled job that drafts a post from the latest changelog entry using the brief's rules, for
a human to review and publish (never auto-posts unattended). Depends on the brief staying
current and on deciding which platform APIs are worth wiring up.

### 9. AI tutor: add Ollama Cloud as a provider
The tutor's free-tier router (Groq/Cerebras/Mistral/OpenRouter/uncloseai) could add Ollama
Cloud as another independent free quota. Real free tier ($0/mo, usage-based rather than
token-capped, resets every 5h/7d, 1 concurrent model) from an actual company, not a hobbyist
project. The catch: unlike the other five, it's not OpenAI-compatible — it's Ollama's own
`ollama.com/api/chat` shape (Bearer key via `OLLAMA_API_KEY`, `{model, messages}` request,
different response envelope). Needs its own adapter function alongside `callProvider()` in
`providers.js`, not just a new `CLOUD` table entry — LocalAIs already has this exact adapter
(`streamOllama`, kept separate from `streamCloud` for the same reason), so it's a port, not new
design. Small, well-scoped addition; deferred only because it's not a drop-in single-line
config add like uncloseai was.

---

## Larger bets (bigger scope, decide deliberately before starting)

### 10. Translations (pilot one language)
The single biggest reach lever, and the most expensive to maintain. Do not start with "all
guides, all languages." Pilot one flagship guide in one language (AI-assisted draft + a human
pass), ship it, and measure actual demand via analytics before deciding whether to scale.
Translated content needs its own staleness-tracking against the English source (a changed
English phase should flag its translations as needing a re-check).

### 11. Tier 2 — omnis-x-graded capstones
Full plan already exists (see the `exercises-grader-pending` memory / `job-tooling-plan.md`
lineage). End-of-guide take-home projects graded by the user's own omnis-x platform (scores
across architecture / performance / maintainability / vibe-check / security). **Hard
prerequisite: accounts** (per-user quotas, submission history, billing funnel into paid
omnis-x). **Currently blocked** on omnis-x's API docs (auth, ingestion shape, sync vs async).
Do not start before: accounts exist, a server-side global spend cap is designed, and the docs
arrive. This is the natural home for "real feedback on a real project," which free
alternatives don't offer — worth doing right rather than fast.

---

### 12. AI tutor: cite sources when search_guides fires
When the tutor's `search_guides` tool fires for a cross-guide question, `makeSearchExecutor` in
`tutor.js` already gets back titles + links - the client just never sees which guides were
actually used. Have `tutorAsk()` report which guides the tool call touched alongside the
answer, and render a small "Referenced: <guide title>" line under the reply in
`TutorChat.svelte`. Makes an answer checkable instead of a black box, which fits this site's
text-first, source-visible ethos better than a bare chat reply. Cheap: the data already exists
in the tool's return value, this is plumbing plus one line of UI.

### 13. AI tutor: "ask about this" from a wrong quiz answer
`Quiz.svelte` already knows the instant an answer is wrong. Add a small "Ask the tutor why"
link next to a wrong answer that opens the tutor drawer with the question pre-filled (e.g.
`Why is "<their answer>" wrong for: <question>?`) - the same open-drawer-and-prefill-the-input
mechanism the reader's select-to-ask affordance uses (`tutorOpen` store + `draft` binding in
`TutorChat.svelte`). Turns a dead-end wrong answer into a teaching moment for free - no new
grounding or infra needed, just wiring an existing mechanism to a second trigger.

---

## Explicitly not doing (unless something changes)

- **Accounts, on their own** — only build them when a real feature needs them (capstones,
  comeback-loop push). Don't add an account system speculatively.
- **Badges / streak-spam gamification** — cheapens the calm, trustworthy tone that's the
  actual differentiator.
- **Video** — off-brand for a text-first product; would also dilute focus and budget.
