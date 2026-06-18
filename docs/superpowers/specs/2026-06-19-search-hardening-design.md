# Design Spec — Search Hardening (lexical)

**Date:** 2026-06-19
**Status:** Approach approved by user. Spec for review before build.
**Scope:** Harden the existing Tantivy search in `content-core` (and the `/api/search` shape) so
natural-language queries, typos, and relevance all work better. **Backend only.** One coordinated,
documented change to the API response shape (see §7) — the frontend search page + command palette consume it.

**Non-goals:** semantic/vector search (a separate, bigger phase), accounts-based frecency/recency ranking.

---

## What exists today
`content-core::index` already does BM25 ranking with field boosts (title ×3, tags ×2), AND-by-default
matching, and a fixed Levenshtein-distance-1 fuzzy fallback OR'd in. Fields: title, summary, body, tags,
synonyms. The index is in-RAM, rebuilt from the DB on boot — so analyzer changes apply on the next boot
(no migration).

## 1. Stemming analyzer (biggest recall win)
Register a custom Tantivy `TextAnalyzer` `"en_stem"` = `SimpleTokenizer` → `RemoveLongFilter` →
`LowerCaser` → `StopWordFilter(English)` → `Stemmer(English)`, and set it as the tokenizer on the text
fields (title, summary, body, synonyms) via `TextFieldIndexing::set_tokenizer("en_stem")`. `tags` stays a
raw keyword-ish field (or gets the same analyzer — decide at build; tags are short).
- Effect: "commits" matches "commit", "running" matches "run". Query and index use the same analyzer.
- Stop words are dropped at index + query time, which also powers §2.
- Requires a re-index — automatic via the existing boot rebuild.

## 2. Query relaxation for full sentences
Stop relying on `set_conjunction_by_default()` (strict AND), which makes "how do I undo my last commit"
return nothing. Instead build the query ourselves:
- Tokenize the query through `en_stem` (drops stop words like how/do/i/the/my).
- Build a `BooleanQuery` of `Should` clauses with a **minimum-should-match** (~70% of content terms, min 1).
  If the Tantivy version lacks a direct min-match setter, fall back to **AND first, then OR** (re-run as
  OR when the strict pass returns too few hits).
- Keep the field boosts (title ×3, tags ×2) and add a small **exact-phrase boost** when the whole query
  appears in title/summary.

## 3. Adaptive fuzzy (typo tolerance without noise)
Per query term, pick the Levenshtein distance by length: `len ≤ 4 → 0`, `5–7 → 1`, `≥ 8 → 2`. Build
`FuzzyTermQuery` at that distance over title/body/tags as lower-boosted `Should` clauses. (Today it's a
fixed distance 1 for every term.)

## 4. Snippets (show *why* it matched)
Use Tantivy `SnippetGenerator` on the `body` field to produce a highlighted passage per hit. Add
`snippet: String` (HTML with `<b>`/`<mark>` around matches) to `SearchHit`. **Additive** — existing
consumers ignore it until they render it.

## 5. Per-guide dedup
After ranking, collapse hits so each `guide_slug` appears once (its best-scoring phase), then take the top
`limit`. Results become guide-diverse instead of three phases of the same guide. Transparent to callers.

## 6. "Did you mean …"
When the query's terms match mainly via fuzzy (not exact) against the term dictionary, build a corrected
query string by swapping each unmatched term for its nearest indexed term, and return it as a top-level
`suggestion`. Best-effort; `null` when nothing better is found.

## 7. API contract (one coordinated change)
`GET /api/search?q=` today returns a bare array `SearchHit[]`. To carry the suggestion, wrap it:
```json
{ "hits": [ { "guide_slug": "...", "phase_no": 2, "title": "...", "summary": "...",
              "snippet": "…<b>commit</b>…", "score": 4.1 } ],
  "suggestion": null }
```
- `snippet` (per hit) is additive/safe.
- The wrapper (`{hits, suggestion}` instead of `[...]`) is a **breaking shape change**. Consumers:
  `web/src/routes/search/+page.server.js`, `web/src/routes/search.json/+server.js`,
  `$lib/CommandPalette.svelte`. → A short **frontend brief** ships with this (read `data.hits`, optionally
  show `suggestion` + render `snippet`). Coordinate the cutover so search doesn't break mid-flight.

## 8. Testing (content-core + server)
- Stemming: a doc with "commit" is found by query "commits".
- Relaxation: "how do I undo a commit" returns the relevant phase (not empty).
- Adaptive fuzzy: a 1-char typo on a long word matches; a 3-letter word isn't over-fuzzed.
- Snippet: a hit's `snippet` contains the matched term wrapped in `<b>`/`<mark>`.
- Dedup: a guide matching in two phases returns once.
- Did-you-mean: a misspelled query yields a non-null `suggestion`.
- API: `/api/search` returns `{hits, suggestion}`; empty `q` still 400s.

## 9. Build order
content-core (analyzer → query builder → adaptive fuzzy → snippet → dedup → suggestion) with tests at each
step, then the server response wrapper + its test, then the frontend brief. Re-index is automatic on boot.
