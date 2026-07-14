---
title: "Measures vs Calculated Columns"
guide: "power-bi-from-zero"
phase: 6
summary: "Why does the same DAX formula behave differently depending on where you type it, and how do you know whether a calculation belongs in a measure or a calculated column?"
tags: [power-bi, dax, measures, calculated-columns, row-context, filter-context, context-transition]
difficulty: intermediate
synonyms: ["measure vs calculated column power bi", "when to use calculated column dax", "dax row context vs filter context", "power bi measure not working", "calculated column vs measure performance", "should i use a measure or a column", "dax context transition explained", "power bi ratio of sums vs average of ratios"]
updated: 2026-07-14
---
# Measures vs Calculated Columns

You just met DAX in the last phase and it felt like a spreadsheet formula language. It mostly is - except for one decision that trips up nearly everyone new to Power BI: the exact same-looking formula, `[Price] * [Quantity]`, behaves completely differently depending on whether you type it into a **calculated column** or a **measure**. Same syntax, different universe. This phase is entirely about that difference, because getting it wrong is the single most common source of "why is my number wrong" bugs in real Power BI reports.

## The mental model: stored value vs. live answer

**What a calculated column actually is.** A calculated column computes one value *per row*, at the moment you refresh the data, and then stores that value physically in the model - exactly like a column that came from your source data. Once it's calculated, it just sits there as data. If you open Excel and add a column `= B2 * C2` and drag it down, that is precisely the mental model: a value glued to each row.

**What a measure actually is.** A measure computes nothing until a visual asks for it, and even then it never computes "a row" - it computes one aggregated number for whatever is currently being looked at. Put a measure into a table visual sliced by Region, and it silently reruns once per region, each time asking "given only the rows visible right now, what's the answer?" Nothing is stored. A measure is a formula on standby, waiting to be asked a question shaped by whatever filters, slicers, and groupings are on screen at that instant.

That's the whole idea in one line: **a calculated column answers "what's this row's value?" once, up front. A measure answers "what's the total, right now, for whatever you've selected?" every single time you look.**

## Why the same formula gives different numbers

This is where it stops being an abstract distinction and starts mattering. Say you have a `Sales` table with `UnitPrice` and `Quantity` columns, and you want revenue.

As a **calculated column**:

```dax
Revenue Column = Sales[UnitPrice] * Sales[Quantity]
```

This runs once per row, in what DAX calls **row context** - the formula knows "the current row" the way a spreadsheet formula knows "this row." It stores a `Revenue Column` value on every single row of `Sales`, forever, until the next refresh.

As a **measure**:

```dax
Revenue Measure = SUMX(Sales, Sales[UnitPrice] * Sales[Quantity])
```

This computes nothing until a visual asks for it. Drop it into a card visual, and it runs `SUMX` over every row currently in **filter context** - the set of rows left after every slicer, page filter, and visual grouping has been applied - multiplies each one, and sums the result on the fly. Slice by Region and it reruns, using only that region's rows.

For a straight sum like revenue, both approaches land on the same final number if you total everything. But they get there completely differently, and that difference has real consequences the moment you do anything other than a plain sum.

## Where it breaks: ratios and averages

Here's the example that actually teaches the lesson. Suppose you want Profit Margin = Profit / Revenue, per product category.

**The tempting, wrong instinct** is a calculated column:

```dax
Margin Column = DIVIDE(Sales[Profit], Sales[Revenue])
```

Then in a visual, you set it to "Average" and get an average of a bunch of per-row percentages. That number is almost never the number a stakeholder actually wants, because it treats a $2 sale and a $200,000 sale as equally important to the average. This is the classic "average of ratios" trap - it's mathematically a different question than "overall margin," and the two can disagree by a lot when order sizes vary.

**The correct instinct** is a measure that sums first, divides second:

```dax
Profit Margin = DIVIDE(SUM(Sales[Profit]), SUM(Sales[Revenue]))
```

Now, no matter how the visual slices the data - by category, by month, by nothing at all - the measure always sums the numerator, sums the denominator over exactly those same rows, and divides once. That's "ratio of sums," and it's almost always what "margin" means in a real business conversation. `DIVIDE()` is DAX's safe division: it returns blank instead of erroring on divide-by-zero, so use it instead of the raw `/` operator inside measures.

This single example is why the rule of thumb exists: **ratios, percentages, and anything with an aggregation word in front of it ("total," "average," "count of") belong in a measure, not a column.**

## Context transition: turning a row into a filter

First, the everyday reason a measure written once works everywhere: dropped into a card, table, matrix, or chart axis, it simply re-evaluates against whatever **filter context** that visual hands it - the rows left after every slicer, filter, and grouping. You never rewrite it; each spot supplies a different filter context and the measure re-runs against it. That's the plain mechanism behind "it just adapts."

**Context transition** is a related trick worth knowing, because it explains behavior you'll see constantly. It kicks in specifically when a measure is evaluated inside a *row context* - inside an iterator like `SUMX`, inside a calculated column, or wrapped in `CALCULATE`. There, DAX takes "the current row" and turns it into an equivalent filter, as if you'd clicked that one row as a slicer. It's what lets you reference a measure row by row - say, pulling a `Sales` measure while iterating a `Product` table - and have each evaluation mean "just this row's rows." Calculated columns get no such magic on their own: they only ever see their own row, forever fixed at refresh time.

## So which do you actually pick?

| Use a **calculated column** when... | Use a **measure** when... |
|---|---|
| You need a new field to group, slice, or filter by (e.g. a "Price Tier" bucket from `IF(Sales[UnitPrice] > 100, "Premium", "Standard")`) | You need a total, average, ratio, count, or any other aggregation |
| The value is a genuine per-row attribute that should exist as data (e.g. pulling a related table's value with `RELATED()`) | The value should recalculate as the user slices, filters, or drills through the report |
| You'll put it on a chart axis or in a slicer | You'll put it in a card, table cell, KPI, or chart value |

The practical bias should lean hard toward measures. Calculated columns are computed at refresh and stored - which means they take up space in the model and, because high-cardinality calculated columns compress worse than columns loaded from source, they can noticeably bloat file size on large tables. Only reach for a calculated column when you genuinely need a static, row-level value to exist as a field you can group or filter by - something a measure structurally cannot do, since a measure has no rows of its own to group with. For everything else - and in a well-built report, that's the vast majority of your calculations - measures are the default, and they're what phase 7 builds on directly.

## Recap

1. A **calculated column** computes once per row at refresh time and is stored in the model, like a spreadsheet formula dragged down a column.
2. A **measure** computes nothing until a visual asks for it, then aggregates over whatever filter context is active right now - it's a live answer, not stored data.
3. Ratios and averages must be measures that sum first and divide second (`DIVIDE(SUM(...), SUM(...))`); doing the division per row in a calculated column and then averaging gives the wrong number.
4. A measure adapts to any visual because it re-evaluates against that visual's filter context. **Context transition** is the separate trick that turns "the current row" into an equivalent filter when a measure runs inside a row context (an iterator, a calculated column, or `CALCULATE`).
5. Default to measures. Reach for a calculated column only when you need a genuine per-row field to group, slice, or filter by.

Test yourself on the distinction that causes the most "why is my number wrong" bugs in Power BI:

```quiz
[
  {
    "q": "You write `Margin Column = DIVIDE(Sales[Profit], Sales[Revenue])` as a calculated column, then average it in a visual. Why is that number usually wrong?",
    "choices": [
      "It averages a per-row percentage across rows, treating a $2 sale and a $200,000 sale as equally important, instead of summing profit and revenue first",
      "Calculated columns can't use the DIVIDE() function",
      "The column only calculates for the first row and copies that value down",
      "Averaging always rounds the result down"
    ],
    "answer": 0,
    "explain": "That's the 'average of ratios' trap - a measure that sums the numerator and denominator over the same rows before dividing gives the correct 'ratio of sums' instead."
  },
  {
    "q": "A calculated column and a measure both use the formula `[Price] * [Quantity]`. What's the real difference between them?",
    "choices": [
      "The calculated column computes once per row at refresh and stores the result; the measure computes nothing until a visual asks, then aggregates over whatever filter context is active",
      "They behave identically - the only difference is where you type them",
      "A measure is just a faster calculated column",
      "A calculated column updates live as you slice a visual, while a measure is fixed at refresh"
    ],
    "answer": 0,
    "explain": "A calculated column is a stored, per-row value from refresh time; a measure is a live formula that reruns for whatever rows are currently in filter context."
  },
  {
    "q": "You need a field called \"Price Tier\" (Premium or Standard) so you can put it on a chart axis and slice by it. Should it be a measure or a calculated column?",
    "choices": [
      "A calculated column, because it's a genuine per-row attribute you need to group and filter by, which a measure has no rows of its own to do",
      "A measure, because the default should always lean toward measures",
      "Either works identically for slicing and grouping",
      "A measure, because calculated columns can't hold text values"
    ],
    "answer": 0,
    "explain": "Measures aggregate over rows and have none of their own to group with - a value you need on a slicer or chart axis has to exist as a stored per-row field, which is exactly what a calculated column is for."
  }
]
```

---

[← Phase 5: DAX From Intuition](05-dax-from-intuition.md) · [Phase 7: Time Intelligence →](07-time-intelligence.md)
