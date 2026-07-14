---
title: "Performance & the VertiPaq Engine"
guide: "power-bi-dax-deep-dive"
phase: 5
summary: "Why does one DAX measure run in milliseconds while an almost identical one grinds a report to a halt - and what is Power BI actually doing with your data in memory that explains the difference?"
tags: [power-bi, dax, vertipaq, performance, columnar-storage, compression, query-plan, cardinality]
difficulty: advanced
synonyms: ["vertipaq engine explained", "why is my dax measure slow", "power bi performance analyzer", "dax storage engine vs formula engine", "power bi columnar storage explained", "reduce dax query time", "power bi high cardinality performance", "dax studio query plan", "avoid slow dax measures", "power bi refresh performance dax"]
updated: 2026-07-14
---
# Performance & the VertiPaq Engine

You've written correct DAX. Row context, filter context, `CALCULATE` - you get it now. Then one day a
measure that looked identical to a dozen others takes eleven seconds to render a table visual, and you
have no idea why. Nothing in the formula is wrong. The *logic* is fine. What's different is how much work
Power BI has to do to answer it, and that work is decided by something you haven't looked at yet: how
your data actually sits in memory.

This phase is that missing piece. Not a list of "best practices" to memorize and hope for - the actual
mechanism, so that when you look at a DAX formula you can predict roughly how expensive it'll be, the same
way phase 1 let you predict what context a formula runs in.

## The mental model: VertiPaq doesn't think in rows

**What it actually is.** VertiPaq is the in-memory engine Power BI uses to store your model (it's the
same engine under Analysis Services and Excel's Power Pivot). The single fact that explains almost
everything else in this phase: **VertiPaq stores data by column, not by row.**

A normal database row looks like a record - `OrderID, Date, CustomerID, Product, Quantity, Amount` - all
sitting together on disk, because you usually fetch one whole order at a time. VertiPaq throws that
layout away. Instead it stores one long, separate list for *every column*: all the dates in one contiguous
block, all the amounts in another, all the customer IDs in another. A table with a million rows and eight
columns isn't one million-row structure - it's eight independent million-value lists that happen to line
up by position.

**Why this exists.** Analytical queries almost never want "the whole row." A visual asking for `SUM(Amount)
by Month` only touches two columns out of eight. If the engine stored data row-by-row, it would still have
to stream every byte of every row past to pull out just those two columns. Storing by column means it
reads *only* the columns the query actually needs, and skips the rest entirely. That's the first reason
DAX can be fast: most queries only pay for a slice of your table, not the whole thing.

## Compression: why a column of 1s and 2s is nearly free

Columnar storage on its own is a decent trick. What makes VertiPaq genuinely fast is what it does *to*
each column once it's isolated: heavy compression, and the technique depends on how many distinct values
the column has.

📝 **Terminology.** **Cardinality** is the number of *distinct* values in a column. A `Gender` column has
cardinality 2. A `TransactionID` column has cardinality equal to the row count - every value is unique.
Cardinality is the single biggest lever on model size and query speed, and you'll see it again and again
below.

VertiPaq's main trick is **dictionary encoding**. For a low-cardinality column like `Country`, it builds a
small dictionary (`0 = "USA"`, `1 = "Germany"`, `2 = "Japan"`, ...) once, then stores the column itself as
a compact list of small integers pointing into that dictionary, instead of repeating the text a million
times. A column with 5 distinct values compresses to almost nothing, no matter how many rows the table
has - VertiPaq only pays for the dictionary size and a tiny integer per row.

On top of that it applies **run-length encoding (RLE)** when a table is sorted so the same value repeats in
a run - `1,1,1,1,2,2,2,3,3` becomes "value 1 x4, value 2 x3, value 3 x2" - which is why a well-chosen sort
order at import time (something the engine tries automatically) can shrink a column further.

💡 **Key point.** This is *why* low cardinality is cheap and high cardinality is expensive - not a rule of
thumb, a direct consequence of the storage. A `TransactionID` column with a million unique values gets
almost no benefit from dictionary encoding (the dictionary is nearly as big as the data) and no benefit
from RLE (nothing repeats). A surrogate `DateKey` with 3,650 distinct values across ten years compresses
beautifully. This is exactly why star-schema modeling advice like "don't put a high-cardinality natural
key in your fact table if you can avoid it" isn't superstition - it's asking VertiPaq to do less work.

## Two engines, and where your formula actually runs

Every DAX query is actually handled by two different engines working together, and knowing which one is
doing the work explains a lot of "why is this slow" mysteries.

- **The Storage Engine (SE)** is VertiPaq itself: it scans compressed columns and answers simple requests
  - "sum this column, grouped by that one, filtered to this set of keys." It's written in native code,
  highly parallel, and very fast. It can also cache results.
- **The Formula Engine (FE)** is the part that understands DAX itself - row context, `CALCULATE`,
  iterators, anything with actual logic. It orchestrates: it asks the Storage Engine for the raw numbers
  it needs, then does whatever DAX-specific work the SE can't (row-by-row evaluation, complex branching).
  It's single-threaded and comparatively slow *per operation*.

A fast measure is one that pushes almost all the work down to SE and asks FE to do very little stitching.
A slow measure is one that forces FE to loop, row by row, doing something SE can't express as a single
scan.

```dax
-- Mostly SE: one scan, one aggregation, SE does almost everything
Total Sales := SUM(Sales[Amount])

-- Forces FE to iterate: one CALCULATE per row of Sales, evaluated by the Formula Engine
Total Sales Slow :=
SUMX(
    Sales,
    CALCULATE(SUM(Sales[Amount]))
)
```

Both formulas return the same number. The first is a single SE scan. The second asks FE to walk every row
of `Sales`, and for *each row* trigger a fresh `CALCULATE` (a context transition, from phase 2) that goes
back to SE for its own little scan. On a small table you'd never notice. On ten million rows, the second
version can be a thousand times slower for a result that was always just `SUM(Sales[Amount])`.

## Seeing it for yourself: reading the SE/FE split

You don't have to guess which engine is doing the work. Power BI's **Performance Analyzer** (View →
Performance Analyzer → Start Recording → interact with a visual) records the DAX query behind every visual
and its total duration - but it reports one number, not the split. To see how that time divides between
the two engines, copy the recorded query into **DAX Studio** (a free external tool) and run it with the
**Server Timings** tab on: that's what reports **Storage Engine time** vs **Formula Engine time**. That
split is the single most useful diagnostic in this whole phase.

| Visual | Total | SE time | FE time | Reading it |
|---|---|---|---|---|
| Card: `Total Sales` | 4 ms | 3 ms | 1 ms | Healthy - almost all SE |
| Table: `Total Sales Slow` by Product | 6,200 ms | 380 ms | 5,820 ms | FE-bound - the iterator is the problem |

When FE time dominates, the fix is almost never "make the hardware faster" - it's rewriting the measure so
more of the work can be pushed to SE. That's exactly what phase 3's patterns and phase 4's `VAR` habit were
doing all along, even before you had a name for why they helped: a `VAR` computed once and reused avoids
asking FE to redo the same context transition twice; `SUMX` only over a small aggregated table (not the
raw fact table) keeps the row-by-row work small.

## Performance habits that fall out of the model

None of these are arbitrary rules - each one is the mental model above, applied.

- **Prefer measures over calculated columns for anything that changes with filter context.** A calculated
  column is computed once at refresh and stored as a real column - so it's stored and scanned much like an
  imported one (though, being built after the initial compression pass, it often compresses less well), but
  it can't react to what's on the report, and a high-cardinality calculated column (like a
  row-by-row concatenation) bloats the model permanently. A measure is computed on demand and never stored,
  which is more query work but zero storage cost and always context-aware. Use a calculated column only
  when the value is genuinely fixed per row (a category flag, a fiscal quarter) - not as the default.
- **Avoid iterators over the raw fact table when an aggregation will do.** `SUMX(FactSales, ...)` walking
  ten million rows is FE-heavy; `SUMX` over a small pre-aggregated table (or plain `SUM`/`CALCULATE`) lets
  SE do the heavy lifting.
- **Keep an eye on cardinality in your model, not just your measures.** A high-cardinality column dragged
  into a visual (like showing every `TransactionID`) forces VertiPaq to materialize huge intermediate
  results FE then has to process. Aggregate before you visualize.
- **Bidirectional relationships and `DISTINCT COUNT` on high-cardinality columns are two of the most common
  silent performance killers.** Both force VertiPaq to do more cross-table matching per query than a
  single-direction, low-cardinality equivalent. Reach for them deliberately, not by default.
- **Variables (phase 4) aren't just for readability - they're a performance habit.** A value computed once
  into a `VAR` is evaluated once; the same expression repeated three times in a formula (accidentally, from
  copy-pasting) can genuinely be evaluated three separate times.

## Recap

1. **VertiPaq stores data by column, not by row** - a query only pays for the columns it actually touches.
2. **Compression depends on cardinality.** Dictionary encoding and run-length encoding make low-cardinality
   columns nearly free and high-cardinality columns expensive - this is *why* modeling advice about
   cardinality exists, not a rule to take on faith.
3. **Two engines split the work:** the Storage Engine (SE) does fast parallel scans; the Formula Engine
   (FE) does row-by-row DAX logic and is comparatively slow. Fast DAX pushes work to SE; slow DAX forces FE
   to loop.
4. **Performance Analyzer plus DAX Studio show you the split** - Performance Analyzer captures each visual's
   DAX query and total time; DAX Studio's Server Timings tab breaks that into SE time vs FE time - so you can
   stop guessing which part of a formula is the problem.
5. **The habits that follow:** measures over calculated columns for context-aware values, aggregate before
   you iterate, watch cardinality, use bidirectional filters and high-cardinality `DISTINCT COUNT`
   deliberately, and let `VAR` do double duty as both a readability and a performance tool.

You now have the whole arc: what context is (phase 1), how `CALCULATE` bends it (phase 2), the patterns
built from that understanding (phase 3), how to keep it readable (phase 4), and now why some of it is fast
and some of it isn't. That's the real reasoning under DAX - not tricks to copy, a system you can now
predict.

## Quick check

Test yourself on the two ideas that explain almost everything else in this phase - columnar storage plus
cardinality, and the SE/FE split:

```quiz
[
  {
    "q": "Why does VertiPaq store data by column instead of by row?",
    "choices": [
      "So a query only has to read the columns it actually needs, instead of streaming every column of every row past it",
      "Columns compress better than rows regardless of what values are in them",
      "It lets Power BI update individual cells without rewriting the whole table",
      "It's required for DAX row context to work at all"
    ],
    "answer": 0,
    "explain": "Most analytical queries only touch a handful of columns out of many - storing by column means the engine skips every column it wasn't asked for, rather than paying for whole rows it doesn't need."
  },
  {
    "q": "A column of a million unique transaction IDs compresses far worse than a column of a million rows split into 5 country values. Why?",
    "choices": [
      "Dictionary encoding stores a small dictionary plus a compact reference per row - few distinct values means a tiny dictionary, while near-unique values make the dictionary almost as big as the data itself",
      "VertiPaq only compresses numeric columns well, and IDs are usually stored as text",
      "Row count is what determines compression, and both columns have the same row count, so they compress about the same",
      "Unique values compress worse only because they're rarely sorted - sorting the ID column would fix it"
    ],
    "answer": 0,
    "explain": "Cardinality, not row count or data type, is what dictionary encoding cares about - few distinct values means a small dictionary and cheap per-row pointers; near-unique values gain almost nothing."
  },
  {
    "q": "SUMX(Sales, CALCULATE(SUM(Sales[Amount]))) returns the same number as SUM(Sales[Amount]) but is dramatically slower on a large table. What's actually happening?",
    "choices": [
      "SUMX forces the Formula Engine to iterate row by row, triggering a fresh CALCULATE context transition and a separate Storage Engine scan for every row, instead of one single SE scan for the whole column",
      "SUMX always computes a different, more precise result, so the extra time is unavoidable work",
      "The CALCULATE inside SUMX runs entirely inside the Storage Engine, so both formulas should really be equally fast",
      "The slowdown only happens because the measure hasn't been cached yet - it would match SUM after the first run"
    ],
    "answer": 0,
    "explain": "SUM(Sales[Amount]) is one SE scan; wrapping it in SUMX + CALCULATE makes the single-threaded Formula Engine repeat a context transition and a tiny SE scan once per row, which is why identical results can differ by orders of magnitude in runtime."
  }
]
```

---

[← Phase 4: Variables, Debugging & Readable DAX](04-variables-debugging-and-readable-dax.md) · [Back to DAX, Deep Dive](_guide.md)
