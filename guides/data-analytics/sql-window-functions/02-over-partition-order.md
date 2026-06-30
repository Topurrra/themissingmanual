---
title: "SQL Window Functions"
guide: sql-window-functions
phase: 2
summary: "The analyst superpower: running totals, rankings, and row-to-row comparisons without collapsing rows. OVER, PARTITION BY, and lag and lead."
tags: [sql, window-functions, analytics, ranking, running-total]
difficulty: intermediate
synonyms: [sql window functions, sql running total, partition by, row_number vs rank, lag lead sql, moving average sql, top n per group sql, over clause sql]
updated: 2026-06-30
---

# OVER, PARTITION BY, ORDER BY

Phase 1 gave you the idea. Now let's make it muscle memory. Almost every window function you'll ever write is the same shape:

```text
some_function(...) OVER (
  PARTITION BY <columns that split the data into independent windows>
  ORDER BY    <column that orders rows inside each window>
)
```

Three parts. The function on the outside. `PARTITION BY` to slice your data into independent groups. `ORDER BY` to give the rows a sequence inside each slice. You can use one, both, or neither — and each combination unlocks a different question. Let's build it up one piece at a time, all runnable against the same little table.

## PARTITION BY — "do this separately for each group"

`PARTITION BY` is the windowed cousin of `GROUP BY`. It splits the rows into groups, and the function runs independently inside each one — but the rows stay. Leave it out, and the whole result is one big window.

```sql runnable
WITH sales(salesperson, region, amount) AS (
  VALUES
    ('Ana', 'East', 400),
    ('Ana', 'East', 300),
    ('Ben', 'East', 250),
    ('Cy',  'West', 600),
    ('Cy',  'West', 100)
)
SELECT
  salesperson,
  region,
  amount,
  SUM(amount) OVER ()                       AS grand_total,
  SUM(amount) OVER (PARTITION BY region)    AS region_total
FROM sales;
```

```text
salesperson | region | amount | grand_total | region_total
------------+--------+--------+-------------+-------------
Ana         | East   |    400 |        1650 |          950
Ana         | East   |    300 |        1650 |          950
Ben         | East   |    250 |        1650 |          950
Cy          | West   |    600 |        1650 |          700
Cy          | West   |    100 |        1650 |          700
```

*What just happened:* `OVER ()` with an empty parens treats the entire table as one window — every row gets the same grand total, 1650. Add `PARTITION BY region` and the window narrows to each region, so East rows get 950 and West rows get 700. Same function, different window, and not a single row was lost. You can now show each amount *next to* its share of the regional total — something `GROUP BY` could never hand you in one query.

## ORDER BY inside OVER — this is what makes a total "run"

Here's the part that surprises people. Inside `OVER`, adding `ORDER BY` changes the *meaning* of an aggregate. Without it, `SUM` covers the whole window. *With* it, `SUM` covers "everything from the start of the window up to and including this row" — a **running total**.

```sql runnable
WITH sales(salesperson, day, amount) AS (
  VALUES
    ('Ana', 1, 400),
    ('Ana', 2, 300),
    ('Ana', 3, 200),
    ('Ben', 1, 250),
    ('Ben', 2, 250)
)
SELECT
  salesperson,
  day,
  amount,
  SUM(amount) OVER (PARTITION BY salesperson ORDER BY day) AS running_total
FROM sales;
```

```text
salesperson | day | amount | running_total
------------+-----+--------+--------------
Ana         |   1 |    400 |           400
Ana         |   2 |    300 |           700
Ana         |   3 |    200 |           900
Ben         |   1 |    250 |           250
Ben         |   2 |    250 |           500
```

*What just happened:* Within each salesperson's window, the rows are now ordered by day, and `SUM` accumulates as it goes: 400, then 400+300, then +200. When the partition switches to Ben, the running total resets, because Ben is a separate window. That single `ORDER BY day` is the difference between "Ana's total" and "Ana's total *so far*." This is the single most useful trick in the whole feature.

> The rule to memorize: an aggregate `OVER` with no `ORDER BY` covers the **whole window**; add `ORDER BY` and it covers **the start through the current row**. Same function, two completely different answers.

## Ranking — ROW_NUMBER, RANK, DENSE_RANK

Ranking functions need an order to rank by, so they always pair with `ORDER BY` inside `OVER`. The three you'll reach for look similar but differ exactly on how they treat ties.

```sql runnable
WITH scores(player, points) AS (
  VALUES
    ('Ana', 90),
    ('Ben', 90),
    ('Cy',  80),
    ('Dee', 70)
)
SELECT
  player,
  points,
  ROW_NUMBER() OVER (ORDER BY points DESC) AS row_num,
  RANK()       OVER (ORDER BY points DESC) AS rnk,
  DENSE_RANK() OVER (ORDER BY points DESC) AS dense_rnk
FROM scores;
```

```text
player | points | row_num | rnk | dense_rnk
-------+--------+---------+-----+----------
Ana    |     90 |       1 |   1 |         1
Ben    |     90 |       2 |   1 |         1
Cy     |     80 |       3 |   3 |         2
Dee    |     70 |       4 |   4 |         3
```

*What just happened:* Ana and Ben tie at 90 points. `ROW_NUMBER` ignores the tie and assigns 1 and 2 arbitrarily — it just numbers rows. `RANK` gives them both 1, then *skips* to 3 (it leaves a gap the size of the tie). `DENSE_RANK` gives them both 1 but does *not* skip, so the next value is 2. Pick by intent: `ROW_NUMBER` when you need one unique number per row (great for "keep exactly one"), `RANK` when ties should share a place and gaps are fine ("you came joint-1st, next person is 3rd"), `DENSE_RANK` when you want tiers with no gaps.

## LAG and LEAD — reach into the previous or next row

`LAG` pulls a value from a row *before* the current one; `LEAD` pulls from a row *after*. This is how you compare a row to its neighbor — yesterday vs today, this order vs the last one — without a self-join.

```sql runnable
WITH revenue(month, amount) AS (
  VALUES
    (1, 1000),
    (2, 1200),
    (3, 1100),
    (4, 1500)
)
SELECT
  month,
  amount,
  LAG(amount) OVER (ORDER BY month)            AS prev_month,
  amount - LAG(amount) OVER (ORDER BY month)   AS change_vs_prev
FROM revenue;
```

```text
month | amount | prev_month | change_vs_prev
------+--------+------------+---------------
    1 |   1000 |            |
    2 |   1200 |       1000 |            200
    3 |   1100 |       1200 |           -100
    4 |   1500 |       1100 |            400
```

*What just happened:* `LAG(amount)` reaches one row back (in `month` order) and hands you the previous month's amount. Subtract and you've got month-over-month change in a single, readable line. Month 1 has no prior row, so `LAG` returns `NULL` and the subtraction is `NULL` too — that empty first cell is expected, not a bug. `LEAD` works identically but looks forward; swap it in when you want "the next row's value." You can also pass an offset and a default, like `LAG(amount, 1, 0)`, to look back further or replace that `NULL` with 0.

For builders: `LAG`/`LEAD` are the natural tool for detecting state changes in event logs — "did this row's status differ from the previous row's?" — and for measuring gaps between timestamps, like the time between a user's consecutive actions. The order you put in `OVER (ORDER BY ...)` *is* your definition of "previous," so choose it deliberately.

Window functions also relate to joins: a self-join was the old way to compare a row to its neighbor, and window functions replace most of that. If joins are still shaky, [/guides/sql-joins-explained](/guides/sql-joins-explained) is worth a detour before phase 3.

```quiz
[
  {
    "q": "Inside OVER(...), what does adding ORDER BY do to a SUM aggregate?",
    "choices": [
      "Nothing — ORDER BY only affects the final result order",
      "It turns the total into a running total: start of the window through the current row",
      "It removes duplicate rows before summing",
      "It makes the SUM cover the next row instead of the current one"
    ],
    "answer": 1,
    "explain": "With no ORDER BY, an aggregate covers the whole window. Add ORDER BY and it accumulates from the window's start up to the current row — a running total."
  },
  {
    "q": "Players score 90, 90, 80. Which function gives them ranks 1, 1, 2 (no gap)?",
    "choices": ["ROW_NUMBER", "RANK", "DENSE_RANK", "NTILE"],
    "answer": 2,
    "explain": "DENSE_RANK shares the rank for ties and does not skip, so after two 1st-places the next is 2. RANK would skip to 3; ROW_NUMBER never ties."
  },
  {
    "q": "You want each row to show the previous row's value (by date) without a self-join. Which function?",
    "choices": ["LEAD", "LAG", "FIRST_VALUE", "RANK"],
    "answer": 1,
    "explain": "LAG reaches backward to an earlier row in the window's order. LEAD reaches forward; LAG is the one for 'the previous row's value'."
  }
]
```

[← Phase 1](01-the-window-not-the-group.md) | [Overview](_guide.md) | [Phase 3: Frames, moving averages, and top-N-per-group →](03-frames-and-top-n.md)
