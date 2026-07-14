---
title: "DAX From Intuition"
guide: "power-bi-from-zero"
phase: 5
summary: "DAX looks like Excel formulas but evaluates in a completely different way - this phase builds the mental model of row context and filter context so DAX formulas stop feeling like magic incantations."
tags: [power-bi, dax, row-context, filter-context, calculate, measures, formulas]
difficulty: advanced
synonyms: ["what is dax", "dax for beginners", "power bi formulas", "dax explained simply", "row context vs filter context", "how does calculate work in dax", "dax intuition", "learn dax from scratch", "power bi dax tutorial", "why is my dax measure wrong"]
updated: 2026-07-14
---
# DAX From Intuition

If you've written Excel formulas, DAX looks familiar and that familiarity is a trap. `SUM`, `IF`, `AVERAGE` - the names are the same, and the first few formulas you write will just work, so you'll assume you already understand DAX. Then you'll write something that looks identical in spirit to a formula that worked yesterday, and it'll return a number that's obviously wrong, and you won't have any idea why. That gap - between "the syntax looks like Excel" and "the evaluation model is nothing like Excel" - is where almost everyone gets stuck. This phase closes that gap by building the model *before* the syntax.

## The mental model: two kinds of context

**What it actually is.** Every DAX formula is evaluated inside a *context* - a set of filters that determines which rows of your tables are "visible" when the formula runs. There are two kinds of context, and the entire language makes sense once you can tell them apart:

- **Row context** - "I am currently standing on one specific row. I can reach across that row to read its columns." This is what you get inside a calculated column, and inside iterator functions like `SUMX`.
- **Filter context** - "A set of filters is currently narrowing down which rows count." This is what you get from slicers, from rows/columns in a visual, and from filters you write yourself. This is the context a *measure* lives in.

**Why this exists.** In Excel, a formula lives in one cell and only ever sees that cell's row - there's no such thing as "the currently selected region of the report" reaching into your formula. Power BI is built to answer a different question: *"given whatever the user just clicked, filtered, or sliced, what's the total?"* That question can't be answered by a formula that only knows about one row. DAX needed a way for a single formula to be aware of "everything currently filtered" - that's filter context, and it doesn't exist in spreadsheet formulas at all.

**Why people get this wrong.** They write a measure, test it in one visual where it looks right, drop it into a table with different rows and columns, and it now returns a different (correct, but unexpected) number. That's not a bug. The measure is recalculating for *every* combination of filters the report throws at it. A measure has no fixed answer - it's a question that gets re-asked for every cell of every visual.

## Watching filter context happen

You don't have to imagine this - drop one measure into a matrix visual and watch it live:

```dax
Total Sales = SUM(Sales[SalesAmount])
```

Put this measure on a card by itself and it sums every row in the `Sales` table - no filters, no context, just the grand total. Now drag `Region` onto the rows of a table visual with `Total Sales` in the values. Suddenly you see four different numbers, one per region, and the visual didn't touch your formula at all. Power BI evaluated `Total Sales` once *per row of the visual*, each time with a different filter context: "only rows where Region = West," then "only rows where Region = East," and so on. The formula never changed. The context around it did.

This is the single biggest shift from spreadsheet thinking: **you don't write one formula per answer. You write one formula, and the report supplies the context that turns it into many answers.**

## CALCULATE: the function that changes the question

Once filter context clicks, `CALCULATE` stops being a scary function and becomes the obvious next step: it's the function that lets *you* change the filter context instead of waiting for a visual to do it.

```dax
Sales Last Year =
CALCULATE(
    [Total Sales],
    SAMEPERIODLASTYEAR('Date'[Date])
)
```

**What it actually is.** `CALCULATE` takes an expression (here, the `Total Sales` measure) and a list of filter arguments, and evaluates the expression inside a *modified* filter context - the existing filters, overridden or added to by whatever you pass in. `SAMEPERIODLASTYEAR` shifts the date filter back one year, so `Total Sales` gets computed as if the report were showing last year instead of this year, while every other filter (region, product, whatever the user picked) stays exactly as it was.

**Why this exists.** Without `CALCULATE`, a measure can only ever answer "what does the *current* filter context say?" There'd be no way to ask "what if the year were different" or "what if we ignored the product filter" from inside a formula. `CALCULATE` is the one function that reaches out and edits the question before answering it - which is why nearly every non-trivial DAX pattern (year-over-year, running totals, "% of total," excluding a filter) is `CALCULATE` wearing a different outfit.

A simpler example, filtering with a plain condition instead of a time function:

```dax
High Value Sales =
CALCULATE(
    [Total Sales],
    Sales[SalesAmount] > 1000
)
```

This computes total sales, but only counting the rows where the sale itself was over 1000 - regardless of what a slicer elsewhere on the page is doing. `CALCULATE`'s filter argument doesn't add to the existing SalesAmount filter, it replaces any filter on that column with this new one, then everything else (region, date, whatever) stays untouched.

## Row context: the other half of the story

Filter context governs measures. Row context governs a different situation: when DAX is walking through a table one row at a time.

```dax
Line Total = Sales[Quantity] * Sales[UnitPrice]
```

Add this as a *calculated column* on the `Sales` table, and DAX evaluates it once per row, and on each row `Sales[Quantity]` and `Sales[UnitPrice]` mean "the value in *this* row." That's row context - "I'm standing on a row, I can read across it." There's no filtering happening here at all; it's just arithmetic, one row at a time, exactly like dragging an Excel formula down a column.

The two contexts collide in iterator functions like `SUMX`, which is worth seeing once so it stops looking like a typo of `SUM`:

```dax
Total Revenue =
SUMX(
    Sales,
    Sales[Quantity] * Sales[UnitPrice]
)
```

**What it actually is.** `SUMX` takes a table and an expression, walks the table row by row (creating row context for each row, just like the calculated column above), evaluates the expression on each row, and adds up the results. `SUM(Sales[Revenue])` only works if a `Revenue` column already exists. `SUMX` lets you compute the same total *without* materializing that column first - it builds the per-row value and sums it in one pass. This matters because every calculated column you add makes your model bigger and slower to refresh; an iterator that computes the same number on the fly often costs you nothing extra.

## Why your first "obviously correct" measure returns the wrong number

Here's the classic trap, now that you have the vocabulary for it:

```dax
Profit Margin = ([Total Sales] - [Total Cost]) / [Total Sales]
```

This looks right and mostly is - but put it in a visual total row, or a card with no filters, and if `[Total Sales]` happens to be blank for some slice (a product with no sales this month, say), the plain `/` operator hands back `Infinity` (or `NaN` when both sides are zero) instead of a clean 0%. The fix uses a function you'll reach for constantly:

```dax
Profit Margin =
DIVIDE(
    [Total Sales] - [Total Cost],
    [Total Sales],
    0
)
```

`DIVIDE` is just division with a built-in "if the denominator is blank or zero, return this instead" - a third argument that plain `/` doesn't give you. It's a small function, but it's the difference between a report that silently breaks on an edge case and one that doesn't. The lesson underneath it is bigger than this one function though: **a DAX formula's correctness depends on the contexts it might run in, not just the logic that looks right for one case.** Always ask "what happens when this filter context is empty, or narrowed to one weird row?" - that question is where most DAX bugs live.

## What to carry forward

You now have the two ideas that everything else in DAX builds on:

- **Row context**: "I'm on one row, I can read across it" - calculated columns and the inside of iterators like `SUMX`.
- **Filter context**: "a set of filters is narrowing what's visible" - what a measure evaluates inside, driven by slicers, visuals, and `CALCULATE`.
- **`CALCULATE`** is the function that lets you rewrite the filter context yourself, which is why it underlies almost every advanced DAX pattern you'll meet.

None of this replaces knowing individual functions - you'll still look up `SAMEPERIODLASTYEAR` or `ALLEXCEPT` when you need them. But now, when a formula behaves strangely, you have a real question to ask: *"what row context or filter context is this actually running in?"* That question, more than any function reference, is what makes DAX click.

### Check yourself

```quiz
[
  {
    "q": "A measure `Total Sales = SUM(Sales[SalesAmount])` shows $40,000 on a card, then $12,000 when you drop it into a table row filtered to one region. What changed?",
    "choices": [
      "The measure's formula was silently rewritten by Power BI for that visual",
      "Nothing about the formula changed - the filter context around it changed",
      "This is a bug; a measure should always return the same number everywhere"
    ],
    "answer": 1,
    "explain": "A measure has no fixed answer - it re-evaluates inside whatever filter context the visual supplies, so the same formula legitimately returns different numbers in different places."
  },
  {
    "q": "You write `CALCULATE([Total Sales], Sales[SalesAmount] > 1000)` on a page that already has a slicer filtering `SalesAmount` to a different range. What happens to the slicer's filter on that column?",
    "choices": [
      "It stays in effect alongside the new condition, so both filters apply together",
      "CALCULATE's filter argument replaces any existing filter on that same column",
      "CALCULATE ignores the new condition and just returns the slicer's filtered total"
    ],
    "answer": 1,
    "explain": "A CALCULATE filter argument overrides the existing filter on that column rather than stacking on top of it - only filters on other columns are left untouched."
  },
  {
    "q": "Why write `DIVIDE([Total Sales] - [Total Cost], [Total Sales], 0)` instead of just `([Total Sales] - [Total Cost]) / [Total Sales]`?",
    "choices": [
      "DIVIDE runs faster because it's a native DAX function instead of an operator",
      "They're equivalent - DIVIDE is only there for readability",
      "Plain division errors or blanks out when the denominator is blank or zero; DIVIDE lets you supply a fallback"
    ],
    "answer": 2,
    "explain": "DIVIDE's third argument controls what comes back when the denominator is blank or zero, which plain `/` has no way to express."
  }
]
```

---

[← Phase 4: The Data Model & Relationships](04-the-data-model-and-relationships.md) · [Phase 6: Measures vs Calculated Columns →](06-measures-vs-calculated-columns.md)
