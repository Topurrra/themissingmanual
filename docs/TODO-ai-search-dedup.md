# TODO: De-duplicate AI Search results

**Status:** planned (do next session)
**Owner:** —
**Created:** 2026-06-22

## Problem
The "Ask the guides" feature can return near-duplicate content:
- In **search mode** (`/search`), multiple returned chunks can come from the **same
  guide + phase**, or be **near-identical passages**, so the result cards repeat.
- Passages also often **begin with the chapter title**, which repeats the source
  link's title.
- In **answer mode** (`chat/completions`), the source list is already deduped by
  key, but the model sometimes cites the same guide twice with different phrasing.

## Goal
No two result cards point to the same guide/phase, and no two passages are
effectively the same text. Keep the best/most-relevant one per source.

## Where the code lives
`platform/web/src/lib/server/aisearch.js` → `ask()`:
- search-mode `results` mapping (`chunks.map(... cleanSnippet ...)`)
- `sourcesFromChunks`-style loop (sources already dedupe by `item.key`)
- `cleanSnippet()` already strips frontmatter/markdown.

## Approach (pick when implementing)
1. **Dedup by source url** — group results by `keyToUrl(item.key)`, keep the
   highest-`score` chunk per guide/phase. Cheap, removes the obvious repeats.
2. **Near-duplicate text dedup** — normalize (lowercase, strip punctuation/space)
   and drop passages whose normalized text is a prefix/superset of one already
   kept, or above a similarity threshold (e.g. Jaccard on word shingles).
3. **Strip leading title line** — if a passage's first line ≈ the guide title,
   drop that line so the card doesn't echo the source title.
4. Keep top **N** distinct (currently 6).

Do (1) + (3) first (high value, low risk); add (2) only if repeats persist.

## Acceptance
- Same query → result cards each map to a distinct guide/phase.
- No passage card visibly repeats another's text.
- Verify with a query known to span one guide (e.g. a prompt-engineering term).
