---
title: "Common DAX Patterns (running totals, YoY, ranking, top-N)"
guide: "power-bi-dax-deep-dive"
phase: 3
summary: "Running totals, year-over-year, ranking, and top-N all look like separate problems, but they're the same two moves - CALCULATE rewriting filter context, and a table function creating row context - recombined four different ways."
tags: [power-bi, dax, calculate, running-total, year-over-year, rankx, topn, all, allexcept, filter]
difficulty: advanced
synonyms: ["dax running total pattern", "power bi cumulative total measure", "dax year over year formula", "RANKX explained", "power bi top n dax", "dax ALL vs ALLEXCEPT", "how to rank products in power bi", "dynamic top 5 dax measure", "power bi ytd not resetting", "dax ranking within visual"]
updated: 2026-07-14
---
# Common DAX Patterns (running totals, YoY, ranking, top-N)

By now you've internalized the two ideas that matter: a measure lives inside a filter context, and `CALCULATE` is how you rewrite that context before your expression runs. If you're shaky on either, go back to [Phase 1: Row Context vs Filter Context](01-row-context-vs-filter-context.md) and [Phase 2: CALCULATE and Context Transition](02-calculate-and-context-transition.md) first - everything here assumes you can read a `CALCULATE` call and say, in a sentence, what filter it just replaced.

Here's the payoff for that work: the "advanced DAX patterns" everyone treats as a checklist to memorize - running totals, year-over-year, ranking, top-N - are not four unrelated tricks. Each one is `CALCULATE` paired with one of a small number of table functions (`ALL`, `ALLEXCEPT`, `FILTER`, `TOPN`) or an iterator (`RANKX`). Learn to read what each function does to the *candidate table* it's handed, and you stop memorizing patterns and start deriving them.

## Running totals: widening the filter, not resetting it

**What it actually is.** A running total needs a filter context that says "every date up to and including this one" - not "just this one," which is what a table or matrix visual normally gives you.

```dax
Cumulative Sales =
CALCULATE(
    [Total Sales],
    FILTER(
        ALL('Date'[Date]),
        'Date'[Date] <= MAX('Date'[Date])
    )
)
```

Read this from the inside out, because that's the order it evaluates:

1. `ALL('Date'[Date])` hands back *every* date in the table, ignoring whatever filter context already narrowed it down. This is the step people skip and then can't figure out why their "running total" shows one day's sales instead of a cumulative number - without `ALL`, the table `FILTER` is scanning is already restricted to the single date the visual put you on, so `<= MAX(...)` just gives that same one date back.
2. `MAX('Date'[Date])` still sees the *original* filter context (it's not wrapped in `CALCULATE`), so inside a matrix it correctly returns "the date this row represents."
3. `FILTER` walks the full, unfiltered date table and keeps only the dates on or before that row's date.
4. `CALCULATE` takes that filtered table and uses it to replace the date filter, then re-evaluates `[Total Sales]` underneath it.

The result: at the March 15th row, this measure sums every sale from the beginning of the table through March 15th - a genuine running total, one that keeps accumulating across year boundaries, unlike `TOTALYTD` which deliberately resets every January 1st. That difference is the whole reason this pattern exists as its own thing, distinct from the time intelligence functions you already know: `TOTALYTD` answers "how much so far *this year*," this pattern answers "how much *ever*."

## Year-over-year: the same move, applied to a comparison

You already know `CALCULATE` plus `SAMEPERIODLASTYEAR` shifts a date filter back a year. The pattern worth internalizing here is what you do *with* that shifted measure - because "YoY" almost always means the growth percentage, not the prior-year number by itself:

```dax
Sales PY =
CALCULATE( [Total Sales], SAMEPERIODLASTYEAR( 'Date'[Date] ) )

Sales YoY % =
DIVIDE( [Total Sales] - [Sales PY], [Sales PY] )
```

Nothing new mechanically - `SAMEPERIODLASTYEAR` is a date-table generator, same category as the `ALL('Date'[Date])` from the running total above, just narrower. The lesson to carry forward: any "compare X to some other slice of X" measure is the same three-line shape - build the comparison measure with `CALCULATE` and a filter generator, then `DIVIDE` the difference by the comparison value. Month-over-month, quarter-over-quarter, this-region-vs-all-regions - it's the identical skeleton with a different filter argument.

## Ranking: row context, one candidate at a time

**What it actually is.** `RANKX` takes a table and an expression, and for *each row* of that table, evaluates the expression and counts how many other rows scored higher (or lower, if you ask for ascending). It's an iterator, like `SUMX` - it creates row context on the table you give it, one row at a time.

```dax
Product Rank by Sales =
RANKX(
    ALL('Product'[Product Name]),
    [Total Sales]
)
```

Two things trip people up here, and both are the same underlying idea:

**Why `ALL` is doing real work again.** If a matrix visual has already filtered you down to one product, `RANKX` only has one row to rank - it'll always return 1, for everyone. `ALL('Product'[Product Name])` gives `RANKX` the *full* universe of products to compare against, regardless of what the current row's filter narrowed things to.

**Why `[Total Sales]` recalculates per candidate.** For every product `RANKX` walks past, it puts that one product into row context, then evaluates `[Total Sales]` - and because `[Total Sales]` is a measure, evaluating it inside a fresh row context triggers context transition (Phase 2): that single product name becomes a one-item filter context, and `[Total Sales]` computes that product's total from scratch. `RANKX` does this once per candidate row, collects every result, and only then figures out where the *current* row's value lands among them. This is exactly the row-context-to-filter-context handoff you learned to watch for - `RANKX` is just the function that makes you do it dozens or thousands of times in one call.

## Top-N: the same ranking idea, but returning a table

`RANKX` answers "where does this row rank" - a number, one per row, useful for a rank column or for filtering ("show me rank <= 5"). `TOPN` answers a related but different question - "give me the N highest-scoring rows as a table" - which makes it the right tool when you want a fixed top-N total that ignores whatever a slicer elsewhere on the page is doing:

```dax
Top 5 Products Sales =
CALCULATE(
    [Total Sales],
    TOPN(5, ALL('Product'[Product Name]), [Total Sales], DESC)
)
```

`TOPN` walks `ALL('Product'[Product Name])` the same way `RANKX` did, scoring each product by `[Total Sales]`, and hands `CALCULATE` back a table containing only the five highest-scoring rows. `CALCULATE` then uses that five-row table as the new product filter and re-evaluates `[Total Sales]` underneath it - so this measure sums the top five products' sales, on a card, in a total row, anywhere - even sitting next to a slicer someone has set to a single, unrelated product. It never lies about which five it means, because `ALL` refuses to let the surrounding filter context sneak into the candidate list in the first place. (One edge worth knowing: if two products tie at the fifth-place score, `TOPN` returns *all* the tied rows rather than picking one, so you can occasionally get six or more - it widens rather than silently dropping a real tie to force the count to exactly five.)

## The pattern behind the patterns

All four of these boil down to answering one question before you write a line of DAX: **what table should `CALCULATE` (or an iterator) be looking at, and does the existing filter context need to be widened, replaced, or ranked before I use it?**

- Running total: widen the date filter to "everything up to here" with `ALL` + `FILTER`.
- Year-over-year: replace the date filter with a shifted one, then `DIVIDE` two calls of the same measure.
- Ranking: widen the candidate table with `ALL`, then let `RANKX` re-run your measure once per candidate through context transition.
- Top-N: widen the candidate table with `ALL`, let `TOPN` keep only the best rows, then `CALCULATE` on what's left.

Every advanced pattern you'll meet after this - "% of parent category," "new customers this month," "average of the last 3 non-blank months" - is built from this same short list of moves. The functions change; the reasoning doesn't.

## Quick check

Test yourself on the move that shows up in all four patterns - widening a table with `ALL` before `CALCULATE` or an iterator gets to use it:

```quiz
[
  {
    "q": "In the Cumulative Sales measure, what would happen if you dropped ALL('Date'[Date]) and wrote FILTER('Date'[Date], 'Date'[Date] <= MAX('Date'[Date])) instead?",
    "choices": [
      "The measure would still compute a correct running total, just slower",
      "FILTER would walk the table the visual already narrowed to one date, so <= MAX would just hand back that same single date - no different from the plain total",
      "DAX would throw a circular reference error at that row",
      "The measure would sum every date in the table regardless of row context"
    ],
    "answer": 1,
    "explain": "Without ALL, FILTER never sees the full date table - it only sees what the visual already filtered down to, so the 'running' part disappears and you get the same number as a plain total."
  },
  {
    "q": "Why does RANKX(('Product'[Product Name]), [Total Sales]) - without wrapping the table in ALL - return 1 for every product in a matrix visual?",
    "choices": [
      "RANKX only ranks correctly in ascending order",
      "Each row's filter context has already narrowed the table to one product, so RANKX only ever has that single candidate to compare against",
      "RANKX needs ALLEXCEPT, not ALL, to rank correctly",
      "[Total Sales] can't be evaluated inside RANKX without first being stored in a variable"
    ],
    "answer": 1,
    "explain": "The visual's filter context narrows the candidate table before RANKX ever sees it, so without ALL widening it back to every product, each row is ranked against a field of one - itself."
  },
  {
    "q": "What's the real difference between RANKX and TOPN, based on how this phase used them?",
    "choices": [
      "RANKX returns a table of winning rows; TOPN returns a rank number per row",
      "RANKX returns one rank number per row; TOPN returns a table of the top-scoring rows, which CALCULATE can then use to filter",
      "They're interchangeable - either can be wrapped in CALCULATE to build a top-5 measure",
      "RANKX needs ALL to work but TOPN never does"
    ],
    "answer": 1,
    "explain": "RANKX scores rows one at a time and hands back a number; TOPN hands back a whole table of winners, which is exactly the shape CALCULATE needs to use as a new filter for the top-N pattern."
  }
]
```

---

[← Phase 2: CALCULATE and Context Transition](02-calculate-and-context-transition.md) · [Phase 4: Variables, Debugging & Readable DAX →](04-variables-debugging-and-readable-dax.md)
