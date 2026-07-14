---
title: "Time Intelligence"
guide: "power-bi-from-zero"
phase: 7
summary: "How do I build a 'sales vs last year' or 'year-to-date' number without hand-writing date math - and why does it break if I don't have a real date table?"
tags: [power-bi, dax, time-intelligence, date-table, yoy, ytd, calculate]
difficulty: advanced
synonyms: ["power bi time intelligence", "power bi year over year", "power bi ytd measure", "SAMEPERIODLASTYEAR dax", "power bi date table required", "TOTALYTD vs DATESYTD", "power bi rolling 12 months", "dax compare to previous period", "power bi mark as date table", "why does power bi time intelligence not work"]
updated: 2026-07-14
---
# Time Intelligence

Every business question eventually turns into a time question. Not "what were sales" but "what were sales *compared to last year*." Not "what's revenue" but "what's revenue *so far this quarter*." These questions feel like they need a pile of date math - filter to last year, shift the range, subtract. In Power BI they don't. They need one thing you build once (a real date table) and a small vocabulary of DAX functions that all do the same trick: **take the filter context you already have, and move it in time.**

That's the mental model for this whole phase. Time intelligence functions don't compute anything new. They swap out the date filter underneath a measure you already wrote, then let that same measure run again. Get that idea solid and the function names stop being a list to memorize - they become five or six ways of saying "the same filter, shifted."

## The one thing you need first: a real date table

Time intelligence functions are not clever about dates. They don't parse your fact table's order dates and infer a calendar. They need an actual table of contiguous dates - one row per day, no gaps - related to your fact table, and they need Power BI to know it's a date table.

This is the payoff from [Phase 4: The Data Model & Relationships](04-the-data-model-and-relationships.md): your model is a star schema, and `Date` is a dimension like any other, sitting one hop from your fact table. If you skipped building one, stop here and build it first - nothing below works reliably without it.

```dax
Date = CALENDAR (DATE(2020,1,1), DATE(2026,12,31))
```

Add a few columns you'll actually use in visuals and slicers (`Year`, `Month`, `MonthName`, `Quarter`), then two things that are easy to skip and cause the most confusing bugs later:

1. **Relate it to the fact table** on the date column, one-to-many, filtering from `Date` to the fact.
2. **Mark it as a date table**: select the `Date` table in the Data pane → *Table tools* → *Mark as date table* → pick the column that's a true, unique, contiguous date (usually the `Date` column itself).

That second step is best practice, not decoration. Every measure below passes `Date[Date]` explicitly, so the functions shift the column you hand them - they don't need the flag to find a column. What marking does is tell Power BI to treat this as *the* date table: it turns off the automatic per-column date/time hierarchies that otherwise bloat your model, and guarantees your calendar is handled as one contiguous, day-grain table so the shifts land where you expect. Time intelligence can run on an unmarked table, but skipping the mark is how the subtle, hard-to-spot wrong-result bugs it's designed to prevent creep in.

⚠️ **The most common time-intelligence bug isn't a DAX mistake at all.** It's a fact table date column with gaps (no sales on Sundays, so no rows) being used directly instead of going through a proper `Date` table. `SAMEPERIODLASTYEAR` needs to know Sunday existed, even with zero sales, or last year's comparison silently drops days.

## CALCULATE is still the engine

Recall from [Phase 5: DAX From Intuition](05-dax-from-intuition.md): `CALCULATE` takes a measure and evaluates it inside a *modified* filter context. Every time intelligence function is really just `CALCULATE` with a filter argument that happens to describe a date range - written as a shorthand so you don't hand-build it yourself.

```dax
-- these two measures do the same thing
Sales PY (spelled out) =
CALCULATE (
    [Total Sales],
    SAMEPERIODLASTYEAR ( Date[Date] )
)

Sales PY (same idea) =
CALCULATE (
    [Total Sales],
    DATEADD ( Date[Date], -1, YEAR )
)
```

`SAMEPERIODLASTYEAR` and `DATEADD` both return a *table of dates* - not a number. `CALCULATE` takes that table, uses it to replace whatever date filter was already active (from a slicer, a row in a matrix, a page filter), and re-runs `[Total Sales]` inside that new filter. That's the whole mechanism. Once you see time intelligence functions as "date-table generators for `CALCULATE`," you can read any of them cold.

## The core vocabulary

You don't need all of DAX's ~35 time intelligence functions. A handful cover almost everything a business ever asks for.

| You want | Function | What it shifts to |
|---|---|---|
| Same day last year | `SAMEPERIODLASTYEAR ( Date[Date] )` | Every date, minus one year |
| N periods back/forward | `DATEADD ( Date[Date], -1, MONTH )` | Any offset, any grain (day/month/quarter/year) |
| Year-to-date | `TOTALYTD ( [Total Sales], Date[Date] )` | Jan 1 of current year through the current filtered date |
| Quarter/month-to-date | `TOTALQTD` / `TOTALMTD` | Same idea, smaller window |
| Rolling N-day window | `DATESINPERIOD ( Date[Date], MAX(Date[Date]), -365, DAY )` | Any trailing window you define |
| Whole prior year, no shift needed | `PARALLELPERIOD ( Date[Date], -1, YEAR )` | The full prior year, regardless of current filter width |

Two worked measures, side by side, show why this matters. Given a base measure:

```dax
Total Sales = SUM ( Sales[Amount] )
```

Year-to-date and the year-over-year comparison built from it:

```dax
Sales YTD =
TOTALYTD ( [Total Sales], Date[Date] )

Sales PY =
CALCULATE ( [Total Sales], SAMEPERIODLASTYEAR ( Date[Date] ) )

Sales YoY % =
DIVIDE ( [Total Sales] - [Sales PY], [Sales PY] )
```

Drop `Sales YoY %` into a matrix with `Year` and `Month` on rows, and it just works - because at every cell, the filter context is already "this month, this year," and the measure asks `CALCULATE` to re-run `[Total Sales]` one year earlier under that exact same shape. You wrote the comparison once. It's correct at the day, month, quarter, and year grain automatically, because it rides whatever grain the visual is already sliced to.

## TOTALYTD vs. the CALCULATE + DATESYTD version

You'll see two ways to write year-to-date and they're equivalent - `TOTALYTD` is shorthand for the second:

```dax
Sales YTD (shorthand) = TOTALYTD ( [Total Sales], Date[Date] )

Sales YTD (spelled out) =
CALCULATE ( [Total Sales], DATESYTD ( Date[Date] ) )
```

Reach for the spelled-out `DATESYTD` form when you need to combine it with something else inside the same `CALCULATE` - say, YTD sales for one specific product category regardless of slicer, `CALCULATE([Total Sales], DATESYTD(Date[Date]), Product[Category] = "Bikes")`. `TOTALYTD` only takes a measure and a date column; `DATESYTD` is a plain date-table generator you can mix with any other filter arguments `CALCULATE` accepts.

By default, YTD/QTD/MTD run on a January-December calendar year. If your business runs a fiscal year starting, say, in July, every one of these functions takes an optional `year_end_date` argument (`TOTALYTD([Total Sales], Date[Date], "06-30")`) - set it once and every YTD measure respects it.

## Recap

1. **Time intelligence functions don't compute new numbers - they generate a shifted date table, then hand it to `CALCULATE`**, which re-runs your existing measure under that new filter.
2. **They need a real, contiguous date table**, related to your fact table and explicitly marked as a date table, or comparisons silently go wrong.
3. **`SAMEPERIODLASTYEAR` / `DATEADD`** shift a period; **`TOTALYTD` / `TOTALQTD` / `TOTALMTD`** accumulate from the start of a period; **`DATESINPERIOD`** builds a custom rolling window; **`PARALLELPERIOD`** grabs a whole prior period regardless of how wide the current filter is.
4. Write the comparison measure once - it inherits whatever grain (day, month, quarter, year) the visual is already sliced to.

## Check yourself

Test yourself on the idea that makes the rest of this phase click - that these functions shift a filter rather than compute a number:

```quiz
[
  {
    "q": "What does a function like SAMEPERIODLASTYEAR actually do?",
    "choices": [
      "Returns a table of dates that CALCULATE uses to replace the current date filter, then reruns the measure",
      "Recomputes the measure directly against a hardcoded date range",
      "Duplicates the fact table for the prior period and sums it",
      "Tells the date table to relabel its rows as last year"
    ],
    "answer": 0,
    "explain": "Time intelligence functions generate a date table, not a number - CALCULATE takes that table, swaps out the existing filter, and reruns your measure inside it."
  },
  {
    "q": "Why can SAMEPERIODLASTYEAR silently give wrong numbers if you filter on the fact table's own order-date column instead of a proper Date table?",
    "choices": [
      "A fact table's date column usually has gaps (no rows on days with zero transactions), so shifting a year can miss days that had no sales but should still count",
      "CALCULATE only accepts columns literally named \"Date\"",
      "Fact tables are not allowed to store dates",
      "The function needs the date column sorted alphabetically first"
    ],
    "answer": 0,
    "explain": "A real date table has one contiguous row per day, including zero-sales days, so a year-back shift lands on every date it should; a fact table's date column only has rows where a transaction happened."
  },
  {
    "q": "You need last quarter's total, in full, no matter how much of the current quarter is actually selected. Which function is built for that?",
    "choices": [
      "PARALLELPERIOD - it returns the entire prior period regardless of how wide the current filter is",
      "TOTALYTD - it accumulates from the start of the current year",
      "SAMEPERIODLASTYEAR - it shifts whatever filter width is currently active back one year",
      "DATESINPERIOD - it builds a custom trailing window measured in days"
    ],
    "answer": 0,
    "explain": "DATEADD and SAMEPERIODLASTYEAR shift the same width you already have filtered, so a single selected day stays a single day a year back; PARALLELPERIOD always expands to the whole prior period."
  }
]
```

---

[← Phase 6: Measures vs Calculated Columns](06-measures-vs-calculated-columns.md) · [Phase 8: Visualizations That Do Not Lie →](08-visualizations-that-do-not-lie.md)
