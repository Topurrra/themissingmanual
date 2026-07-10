---
title: "Frames, moving averages, and top-N-per-group"
guide: sql-window-functions
phase: 3
summary: "The analyst superpower: running totals, rankings, and row-to-row comparisons without collapsing rows. OVER, PARTITION BY, and lag and lead."
tags: [sql, window-functions, analytics, ranking, running-total]
difficulty: intermediate
synonyms: [sql window functions, sql running total, partition by, row_number vs rank, lag lead sql, moving average sql, top n per group sql, over clause sql]
updated: 2026-07-11
---

# Frames, moving averages, and top-N-per-group

You can already do most of what people need. This phase is the deeper layer: controlling exactly how wide the window is around each row (the *frame*), which unlocks moving averages — and the single most-reached-for pattern in real analytics work, **top-N-per-group**. It's also where the two classic gotchas live, so we'll name them clearly.

## The frame: the window inside the window

Here's a subtlety phase 2 glossed over. When you write `SUM(...) OVER (ORDER BY day)`, what exactly is the window? By default, with an `ORDER BY` present, it's *"every row from the start of the partition up to the current row"* — why you got a running total. That default has a formal name:

```text
RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
```

The **frame** is the slice of the window the function actually operates on, relative to the current row. You usually let the default ride — but when you want a *moving* window ("the last 3 rows," not "everything so far"), you spell the frame out yourself with `ROWS BETWEEN`.

```sql runnable
WITH t(day, amount) AS (
  VALUES (1, 10), (2, 20), (3, 30), (4, 40), (5, 50)
)
SELECT
  day,
  amount,
  AVG(amount) OVER (
    ORDER BY day
    ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
  ) AS moving_avg_3
FROM t;
```

```text
day | amount | moving_avg_3
----+--------+-------------
  1 |     10 |         10.0
  2 |     20 |         15.0
  3 |     30 |         20.0
  4 |     40 |         30.0
  5 |     50 |         40.0
```

*What just happened:* `ROWS BETWEEN 2 PRECEDING AND CURRENT ROW` defines a frame of "this row plus the two before it" — a 3-row sliding window. So day 3's average is (10+20+30)/3 = 20, and day 4's is (20+30+40)/3 = 30. At the start the frame is short (day 1 only has itself, day 2 has two rows), so those averages cover fewer points. That's a moving average, the workhorse of smoothing noisy time series — and a frame is what makes it possible.

> `ROWS` counts physical rows; `RANGE` counts by the `ORDER BY` *value* (so tied values share a frame). For most "last N rows" jobs you want `ROWS`. Reach for `RANGE` when you mean "everything within the same date," not "the last N records."

## Top-N-per-group: the pattern you'll use forever

This is the one. "The top 3 products per category." "Each customer's most recent order." "The highest-paid employee in each department." Every one of these is the same shape, and window functions turn it into almost a template.

The trick: you can't filter on a window function in `WHERE` (more on why in a moment), so you compute the rank in a subquery or CTE, then filter on it in the outer query.

```sql runnable
WITH sales(product, category, revenue) AS (
  VALUES
    ('Widget',  'Tools', 500),
    ('Gizmo',   'Tools', 300),
    ('Gadget',  'Tools', 200),
    ('Apple',   'Food',  900),
    ('Banana',  'Food',  400),
    ('Cherry',  'Food',  100)
),
ranked AS (
  SELECT
    product,
    category,
    revenue,
    ROW_NUMBER() OVER (PARTITION BY category ORDER BY revenue DESC) AS rn
  FROM sales
)
SELECT product, category, revenue
FROM ranked
WHERE rn <= 2;
```

```text
product | category | revenue
--------+----------+--------
Widget  | Tools    |     500
Gizmo   | Tools    |     300
Apple   | Food     |     900
Banana  | Food     |     400
```

*What just happened:* inside the `ranked` CTE, `ROW_NUMBER` numbers each category's products from highest revenue down — and because we `PARTITION BY category`, the numbering restarts at 1 for each category. The outer query then keeps only `rn <= 2`, giving the top 2 per category, *as full rows with all their columns intact*. Want top 3? Change one number. Want each customer's single newest order? `PARTITION BY customer ORDER BY order_date DESC` and keep `rn = 1`. This one pattern replaces a whole genre of gnarly correlated subqueries.

One design choice worth naming: `ROW_NUMBER` here means "exactly N rows even if there are ties." If you'd rather *include* ties for the cutoff (three products tied for 3rd all make the cut), swap in `RANK` — the structure is identical, only the ranking function changes.

## The two gotchas that trip everyone

**1. You can't use a window function in `WHERE` or `GROUP BY`.** Try `WHERE ROW_NUMBER() OVER (...) <= 2` and you'll get an error. This isn't an arbitrary restriction — it's about *ordering of operations*. SQL evaluates `WHERE` to decide which rows exist *before* it computes window functions, because windows operate over the surviving rows: the window literally hasn't been calculated yet when `WHERE` runs. The fix is the pattern above: compute the window in a subquery/CTE, then filter in the outer query. (`QUALIFY`, available in Snowflake, BigQuery, and DuckDB, is a shorthand for exactly this — but the CTE works everywhere.)

**2. `COUNT(*) OVER (ORDER BY x)` is not the total count.** People expect it to return the number of rows in the partition. But with `ORDER BY` present, the default frame is "start through current row," so it gives a *running count* — 1, 2, 3, ... — not the total. If you want the partition total, drop the `ORDER BY` (or write an explicit full frame). Same trap as the running-sum behavior from phase 2, and it bites people who only meant to add an order for readability.

```text
-- running count (probably not what you wanted):
COUNT(*) OVER (PARTITION BY category ORDER BY revenue)

-- total count for the whole category:
COUNT(*) OVER (PARTITION BY category)
```

*What just happened:* the only difference is the `ORDER BY`, and it silently changes the answer from "total" to "running tally." When a windowed count or sum looks wrong, the `ORDER BY` is the first thing to check.

## Where this leaves you

You now have the full kit: `PARTITION BY` to slice, `ORDER BY` to sequence, frames to size the window, ranking to order, `LAG`/`LEAD` to compare neighbors, and the top-N-per-group template to keep the best rows per group. That covers the overwhelming majority of analytical SQL you'll ever write.

For builders: these patterns scale down to application code beautifully. Deduplication is top-N-per-group with `rn = 1`. Sessionization uses `LAG` on timestamps to detect gaps, then a running `SUM` of "is this a new session?" flags to assign session IDs. Gap-and-island detection — finding runs of consecutive values — is built entirely from `ROW_NUMBER` arithmetic. The same six ideas keep reappearing. To see where this fits in the larger picture of moving and shaping data at scale, [/guides/what-is-data-engineering](/guides/what-is-data-engineering) is the natural next stop.

The honest summary: window functions feel like a separate, intimidating corner of SQL until you internalize one sentence from phase 1 — *add a column without removing a row* — and one rule from phase 2 — *`ORDER BY` inside `OVER` turns "the whole window" into "the window so far."* Everything else is variations on those two ideas.

```quiz
[
  {
    "q": "Why can't you filter on a window function directly in WHERE (e.g. WHERE ROW_NUMBER() OVER(...) <= 3)?",
    "choices": [
      "Window functions are too slow to use in WHERE",
      "WHERE is evaluated before window functions are computed, so the value doesn't exist yet",
      "It's allowed in every database; the syntax is just unusual",
      "WHERE can only compare literal values"
    ],
    "answer": 1,
    "explain": "SQL filters rows with WHERE before computing window functions over the survivors. Compute the window in a CTE/subquery, then filter in the outer query."
  },
  {
    "q": "ROWS BETWEEN 2 PRECEDING AND CURRENT ROW with AVG produces what?",
    "choices": [
      "The average of the entire partition",
      "The average of the current row and the two rows before it (a 3-row moving average)",
      "The average of the next two rows",
      "The average of only the current row"
    ],
    "answer": 1,
    "explain": "That frame is 'this row plus the two before it' — a sliding 3-row window, which is exactly how you build a moving average."
  },
  {
    "q": "To keep the single most recent order per customer, you'd use ROW_NUMBER() OVER (PARTITION BY customer ORDER BY order_date DESC) and then filter on...",
    "choices": ["rn >= 1", "rn = 1", "rn <= customer", "the highest order_date in WHERE"],
    "answer": 1,
    "explain": "Numbering each customer's orders newest-first means rn = 1 is the most recent. Filter rn = 1 in the outer query to keep one row per customer."
  }
]
```

[← Phase 2](02-over-partition-order.md) | [Overview](_guide.md)
