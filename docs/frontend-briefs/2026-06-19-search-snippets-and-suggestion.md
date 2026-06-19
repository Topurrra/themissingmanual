# Frontend brief — surface search snippets + "did you mean"

**For:** the web/designer agents. **From:** backend. **Status:** backend shipped (`e09429a`).
**Breaking?** No. Search keeps working untouched; everything below is opt-in polish.

The search backend got hardened (stemming, sentence relaxation, typo tolerance, per-guide dedup). Two new
user-facing bits are now available — adopt when convenient.

## 1. Per-hit snippet (the matching passage)
Each object in the `/api/search` array now has an extra field:
```json
{ "guide_slug": "...", "phase_no": 3, "title": "...", "summary": "...",
  "snippet": "…stay calm when a <b>merge</b> <b>conflict</b> hits…", "score": 4.1 }
```
- `snippet` is **HTML** with `<b>` around the matched words (server-generated from our own content — safe to render).
- In `routes/search/+page.svelte`, render it under each result with `{@html hit.snippet}` and style the
  marks. It shows *why* a result matched (better than the static summary). Fall back to `summary` when
  `snippet` is empty.
- Suggested CSS: `.result .snippet b { color: var(--accent); font-weight: 600; }`.
- The command palette (`$lib/CommandPalette.svelte`) can optionally show it too.

## 2. "Did you mean …" (a spelling correction)
When results are thin and the query looks misspelled, `/api/search` returns a response **header**:
```
x-search-suggestion: revert
```
(No header = no suggestion.) It's a header, not a body field, specifically so the existing array response
stays non-breaking.

To use it, the loader needs the response headers (today `$lib/api.js`'s `search()` returns only parsed
JSON). Two small options:
- **In `routes/search/+page.server.js`** fetch directly and read the header:
  ```js
  const res = await fetch(`${API_BASE}/api/search?q=${encodeURIComponent(q)}`);
  const hits = res.ok ? await res.json() : [];
  const suggestion = res.headers.get('x-search-suggestion');   // string | null
  return { q, hits, suggestion };
  ```
  Then in `+page.svelte`, above the results:
  `{#if suggestion}<p class="did-you-mean">Did you mean <a href="/search?q={encodeURIComponent(suggestion)}">{suggestion}</a>?</p>{/if}`
- **Command palette** (`routes/search.json/+server.js`): include it in the JSON it already returns, e.g.
  `return json({ hits, suggestion })` after reading the header from the upstream fetch.

(If you'd rather a clean `{ hits, suggestion }` body everywhere instead of the header, say so and I'll switch
`/api/search` to that shape — it's a one-line backend change + this becomes a coordinated cutover.)

## Files likely touched
- `routes/search/+page.svelte` — render `snippet`; show `suggestion`.
- `routes/search/+page.server.js` — read the header.
- `routes/search.json/+server.js` — forward `suggestion` for the palette.
- `$lib/CommandPalette.svelte` — optional snippet.

Nothing here is required — the current search UI keeps working as-is.
