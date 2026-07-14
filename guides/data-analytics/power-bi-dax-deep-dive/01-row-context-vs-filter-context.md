---
title: "Row Context vs Filter Context"
guide: "power-bi-dax-deep-dive"
phase: 1
summary: "Why does the same measure give a different number in a card visual than in a matrix cell? Because DAX evaluates every formula inside two different kinds of context, and most confusion traces back to mixing them up."
tags: [dax, power-bi, row-context, filter-context, calculated-columns, measures, sumx, iterators]
difficulty: intermediate
synonyms: ["dax row context vs filter context", "why does my measure give different results", "power bi calculated column vs measure", "dax context explained", "what is filter context in power bi", "dax sumx row context", "power bi measure wrong number in matrix", "dax context transition basics"]
updated: 2026-07-14
---
# Row Context vs Filter Context

You've written measures. `SUM`, `AVERAGE`, a `DIVIDE` or two, maybe a `CALCULATE` you copied from a forum post and it worked. Then one day the same measure gives you 4,200 on a card and 380 in a matrix cell, and nothing about the formula changed. That's not a bug in Power BI. It's DAX telling you that a formula's answer depends on *where* it's being asked, not just *what* it says. This phase gives you the mental model that makes that stop being surprising.

## Two questions DAX asks before it computes anything

Every time DAX evaluates a formula, two separate questions get answered first, and the formula's result depends on both:

1. **"Which row am I currently standing on?"** - this is row context.
2. **"Which rows in the model are currently visible at all?"** - this is filter context.

These are not two names for the same thing. They answer different questions, they get created by different mechanisms, and - this is the part that trips almost everyone up - **row context does not automatically turn into filter context.** You have to ask for that explicitly (that's the whole subject of phase 2, `CALCULATE` and context transition). For now, treat them as two independent lenses DAX looks through, and learn to ask "what context am I in right now?" before you read any formula.

## Row context: "which row am I on"

**What it actually is.** Row context exists whenever DAX is walking through a table one row at a time and evaluating an expression for each row individually. Think of it as DAX standing at a specific row and being able to reach sideways into that row's other columns, like a spreadsheet formula that says "this cell, same row."

**Where it comes from.** Two places create row context:

- **Calculated columns.** A calculated column is defined once but evaluated once *per row* of the table it lives in. Every row gets its own row context automatically.
- **Iterator functions** - the ones ending in `X` (`SUMX`, `AVERAGEX`, `RANKX`, `MAXX`), plus a few like `FILTER` that iterate without the `X`. These functions take a table and an expression, and walk the table row by row, creating a fresh row context for each one, evaluating the expression there, then combining the results.

Here's row context in its simplest form, a calculated column on a `Sales` table:

```dax
Line Total = Sales[Quantity] * Sales[Unit Price]
```

There's no `SUM`, no filter, nothing aggregating. For every single row, DAX asks "what's `Quantity` *on this row* times `Unit Price` *on this row*?" That "on this row" is row context doing the work. Change the row, the referenced values change with it, automatically, because you're always reaching into the row you're currently standing on.

Iterators give you the same row-by-row walk, but inside a measure instead of a column, and the result gets collapsed into a single number at the end:

```dax
Total Revenue =
SUMX (
    Sales,
    Sales[Quantity] * Sales[Unit Price]
)
```

Read `SUMX` as two jobs stapled together: "walk `Sales` one row at a time (row context), compute `Quantity * Unit Price` on each row, then add up everything you got." It's the calculated-column formula above, except instead of storing 10 million individual results in a column, DAX computes each one, adds it to a running total, and throws it away. This matters later for performance (phase 5) - a calculated column pays the storage cost once at refresh, `SUMX` pays a small compute cost every time the measure runs - but right now the point is just: **`SUMX`'s second argument runs once per row, inside row context, exactly like a calculated column would.**

## Filter context: "which rows are even visible"

**What it actually is.** Filter context is the set of filters currently narrowing down the whole model before any calculation runs. It answers "out of every row in every table, which ones am I even allowed to see right now?" A measure doesn't see your whole `Sales` table - it sees whatever slice survived the filter context around it.

**Where it comes from.** Filter context is built up from everything surrounding a measure's evaluation:

- Slicers and filter panes the report user has touched.
- The row and column headers of a matrix or table visual - each cell has its own filter context, built from that row's and column's labels.
- Page-level and report-level filters.
- `CALCULATE`'s filter arguments, which can add, replace, or remove filters (that's the entire subject of phase 2).

A plain `SUM` measure has no row context of its own - it doesn't walk anything - it just asks "of the rows currently visible, add up this column":

```dax
Total Revenue (Simple) = SUM ( Sales[Revenue] )
```

Drop that measure on a card with no filters, and it sums every row in `Sales` - filter context is "everything." Drop the exact same measure into a matrix with `Region` on rows and `Year` on columns, and each cell recalculates it with a *different* filter context: the cell for "West / 2025" only sees rows where `Region = West` and `Year = 2025`. Same formula, eleven different numbers, because filter context changed eleven times - once per cell - while the formula never changed once.

This is the answer to "why does my measure give a different number in different places." It isn't giving different answers to the same question. Each visual, each cell, each slicer combination is asking a genuinely different question - "what's the total *given this filter context*" - and `SUM` is answering exactly the question it was asked, every time.

## Watching both at once

Here's a formula that uses row context and filter context in the same breath, so you can see them as the two separate things they are:

```dax
Avg Line Value =
AVERAGEX (
    Sales,
    Sales[Quantity] * Sales[Unit Price]
)
```

`AVERAGEX` walks `Sales` row by row (row context) computing `Quantity * Unit Price` for each row - but *which* rows of `Sales` it walks over is decided by whatever filter context is active when the measure runs. Put this on a card with no filters: it walks every row in the table. Put it in a matrix cell for "West / 2025": it only walks the rows that survive that filter context, then averages *those*. Filter context decides the guest list; row context is what happens to each guest once they're in the room.

| | Created by | Answers | Lives inside |
|---|---|---|---|
| **Row context** | Calculated columns, iterators (`SUMX`, `FILTER`, `RANKX`, ...) | "What's on this row?" | A single row, one at a time |
| **Filter context** | Slicers, visual headers, page/report filters, `CALCULATE` | "Which rows are visible right now?" | The whole table, as a filtered slice |

## Why this is the foundation for everything else

Nearly every DAX surprise you'll hit traces back to mixing these two up:

- **"My calculated column doesn't respond to slicers."** Correct - a calculated column is computed once at refresh time, using row context only. It has no idea a filter context will exist later, because filter context comes from visuals, and visuals don't exist yet when the column is calculated. This is also why calculated columns and measures aren't interchangeable: a column bakes a value into storage per row; a measure recomputes live, in whatever filter context it's asked from.
- **"Why does referencing `Sales[Quantity]` on its own blow up inside a measure?"** Mirror-image reason - a measure has no row context of its own, so a bare column reference has no "current row" to read, which is why you have to wrap it in an aggregator (`SUM`) or an iterator. A measure only ever works through filter context, until something explicitly converts a row context into one.

That conversion - taking row context and turning it into filter context so a measure suddenly *can* see "this row" - is what `CALCULATE` does, and it's arguably the single most important mechanism in the entire language. That's next.

### Check yourself

```quiz
[
  {
    "q": "A calculated column defined as `Sales[Quantity] * Sales[Unit Price]` doesn't change when you add a slicer to the report. Why not?",
    "choices": [
      "It's computed once at refresh time using row context only, before any filter context from visuals exists",
      "Calculated columns are secretly measures and just need CALCULATE added",
      "Slicers only affect columns that use SUMX, not plain multiplication",
      "The column needs an explicit filter context in its formula to respond to slicers"
    ],
    "answer": 0,
    "explain": "Calculated columns are baked into storage once at refresh, using only row context - filter context comes from visuals that don't exist yet at that point."
  },
  {
    "q": "You put `SUM(Sales[Revenue])` on a card (no filters) and get 4,200. You drop the same measure into a matrix with Region on rows, and the 'West' cell shows 380. What changed?",
    "choices": [
      "The formula silently changed between the two visuals",
      "Nothing changed about the formula - the filter context around it changed, so it's answering a different question each time",
      "The matrix cell is using row context instead of filter context",
      "Power BI cached a stale value for the card"
    ],
    "answer": 1,
    "explain": "SUM always answers 'total of what's currently visible.' A card with no filters sees everything; a matrix cell sees only the rows its row/column headers filtered down to - same formula, different filter context, different number."
  },
  {
    "q": "In `SUMX(Sales, Sales[Quantity] * Sales[Unit Price])`, what decides *which* rows of `Sales` get walked?",
    "choices": [
      "Row context, since SUMX creates a fresh row context per row",
      "Whatever filter context is active when the measure runs - row context only governs what happens once inside a given row",
      "The order the rows appear in the table",
      "SUMX always walks the entire table regardless of filters"
    ],
    "answer": 1,
    "explain": "Filter context decides the guest list (which rows survive to be walked); row context is what SUMX does to each row once it's in the room - the two jobs are separate even inside one formula."
  }
]
```

---

[Phase 2: CALCULATE and Context Transition →](02-calculate-and-context-transition.md)
