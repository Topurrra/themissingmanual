---
title: "Running Totals with Window Functions"
guide: sql-expense-analytics
phase: 3
summary: "Compute a running total and a month-over-month change with SUM() OVER and LAG, keeping every row instead of collapsing it."
tags: [sql, window-functions, running-total, lag, over]
difficulty: intermediate
synonyms:
  - sum over partition
  - running total sql
  - lag function
  - month over month
  - window frame
updated: 2026-06-30
---

# Running Totals with Window Functions

`GROUP BY` is great at one thing and bad at another. Great: collapsing many rows
into one total. Bad: keeping the original rows *and* showing a total next to
each. The moment you want "this expense, and the running total up to and
including it," `GROUP BY` can't help - it already threw the individual rows away.

Window functions are the fix. They compute across a set of rows like an
aggregate does, but they hand the answer back **on every row** instead of
collapsing them. You keep your detail and get the rolling math too.

## The shape of a window function

A window function is an aggregate followed by `OVER (...)`. The `OVER` clause
defines the "window" - which rows this calculation looks at, and in what order.

```
SUM(amount) OVER (ORDER BY spent_on)
        ^                  ^
   the aggregate     the window: all rows up to this one, by date
```

Two pieces inside `OVER` matter most:

- `ORDER BY` - sets the order the window walks through rows. For a running
  total, that's chronological.
- `PARTITION BY` (optional) - splits the rows into independent groups, and the
  window resets at each group boundary. Think of it as "do this separately per
  category" or "per month."

If you've ever wanted a cumulative column in a spreadsheet - each cell adding
the one above - that's exactly a `SUM() OVER (ORDER BY ...)`.

## A running total of spending

Here's the cumulative spend over the whole period: each expense, plus the total
accumulated up to and including it. Run it.

```sql runnable
CREATE TABLE expenses (
  id          INTEGER PRIMARY KEY,
  spent_on    TEXT    NOT NULL,
  category    TEXT    NOT NULL,
  description TEXT    NOT NULL,
  amount      REAL    NOT NULL
);

INSERT INTO expenses (spent_on, category, description, amount) VALUES
  ('2026-01-01', 'rent',          'January rent',        1450.00),
  ('2026-01-02', 'subscriptions', 'Streaming service',      15.99),
  ('2026-01-03', 'groceries',     'Corner market',          54.20),
  ('2026-01-05', 'dining',        'Lunch with Sam',         28.75),
  ('2026-01-07', 'transport',     'Metro card refill',      40.00),
  ('2026-01-09', 'groceries',     'Weekly shop',            96.40),
  ('2026-01-12', 'utilities',     'Electricity',            72.10),
  ('2026-01-14', 'dining',        'Pizza night',            34.50),
  ('2026-01-16', 'subscriptions', 'Music service',           9.99),
  ('2026-01-18', 'groceries',     'Farmers market',         61.30),
  ('2026-01-21', 'transport',     'Rideshare home',         18.40),
  ('2026-01-24', 'dining',        'Dinner out',             52.00),
  ('2026-01-27', 'groceries',     'Weekly shop',            88.15),
  ('2026-01-30', 'utilities',     'Water bill',             31.25),
  ('2026-02-01', 'rent',          'February rent',        1450.00),
  ('2026-02-02', 'subscriptions', 'Streaming service',      15.99),
  ('2026-02-04', 'groceries',     'Corner market',          49.80),
  ('2026-02-06', 'travel',        'Weekend flights',       312.00),
  ('2026-02-07', 'dining',        'Airport food',           22.60),
  ('2026-02-10', 'groceries',     'Weekly shop',           102.55),
  ('2026-02-13', 'dining',        'Valentine dinner',       96.00),
  ('2026-02-15', 'subscriptions', 'Music service',           9.99),
  ('2026-02-17', 'transport',     'Metro card refill',      40.00),
  ('2026-02-20', 'groceries',     'Weekly shop',            79.90),
  ('2026-02-23', 'utilities',     'Electricity',            68.40),
  ('2026-02-26', 'dining',        'Takeout',                31.20);

SELECT
  spent_on,
  category,
  amount,
  ROUND(SUM(amount) OVER (ORDER BY spent_on, id), 2) AS running_total
FROM expenses
ORDER BY spent_on, id;
```

Read the `running_total` column down the page. It starts at the January rent and
climbs with every expense, ending at your grand total on the last row. Every
detail row is still there - that's the whole point. You'd never get this from
`GROUP BY`.

Two small but important details:

- We order by `spent_on, id`, not only `spent_on`. When two expenses share a
  date, `id` breaks the tie so the running total is deterministic. Order by a
  non-unique column alone and the cumulative value on tied rows can wobble.
- The `ORDER BY` inside `OVER` controls the math; the `ORDER BY` at the end
  controls how the result is displayed. Keep them aligned or the running total
  column will look scrambled even though it's correct.

## A running total that resets each month

Add `PARTITION BY` and the window restarts at each boundary. Here's the same
running total, but reset at the start of every month - useful for "how far into
this month's spending am I?"

```sql runnable
CREATE TABLE expenses (
  id          INTEGER PRIMARY KEY,
  spent_on    TEXT    NOT NULL,
  category    TEXT    NOT NULL,
  description TEXT    NOT NULL,
  amount      REAL    NOT NULL
);

INSERT INTO expenses (spent_on, category, description, amount) VALUES
  ('2026-01-01', 'rent',          'January rent',        1450.00),
  ('2026-01-02', 'subscriptions', 'Streaming service',      15.99),
  ('2026-01-03', 'groceries',     'Corner market',          54.20),
  ('2026-01-05', 'dining',        'Lunch with Sam',         28.75),
  ('2026-01-07', 'transport',     'Metro card refill',      40.00),
  ('2026-01-09', 'groceries',     'Weekly shop',            96.40),
  ('2026-01-12', 'utilities',     'Electricity',            72.10),
  ('2026-01-14', 'dining',        'Pizza night',            34.50),
  ('2026-01-16', 'subscriptions', 'Music service',           9.99),
  ('2026-01-18', 'groceries',     'Farmers market',         61.30),
  ('2026-01-21', 'transport',     'Rideshare home',         18.40),
  ('2026-01-24', 'dining',        'Dinner out',             52.00),
  ('2026-01-27', 'groceries',     'Weekly shop',            88.15),
  ('2026-01-30', 'utilities',     'Water bill',             31.25),
  ('2026-02-01', 'rent',          'February rent',        1450.00),
  ('2026-02-02', 'subscriptions', 'Streaming service',      15.99),
  ('2026-02-04', 'groceries',     'Corner market',          49.80),
  ('2026-02-06', 'travel',        'Weekend flights',       312.00),
  ('2026-02-07', 'dining',        'Airport food',           22.60),
  ('2026-02-10', 'groceries',     'Weekly shop',           102.55),
  ('2026-02-13', 'dining',        'Valentine dinner',       96.00),
  ('2026-02-15', 'subscriptions', 'Music service',           9.99),
  ('2026-02-17', 'transport',     'Metro card refill',      40.00),
  ('2026-02-20', 'groceries',     'Weekly shop',            79.90),
  ('2026-02-23', 'utilities',     'Electricity',            68.40),
  ('2026-02-26', 'dining',        'Takeout',                31.20);

SELECT
  spent_on,
  category,
  amount,
  ROUND(
    SUM(amount) OVER (
      PARTITION BY strftime('%Y-%m', spent_on)
      ORDER BY spent_on, id
    ), 2
  ) AS month_running_total
FROM expenses
ORDER BY spent_on, id;
```

Watch the `month_running_total` column: it climbs through January, then drops
back down at the first February row and climbs again. The `PARTITION BY` split
the data into a January window and a February window, each with its own
independent running total.

## Month-over-month change with LAG

Now the question every report wants to answer: did spending go up or down versus
last month, and by how much?

`LAG` is the tool. It reaches back to a previous row and pulls a value from it.
`LAG(total)` over months ordered by date means "the total from the row before
this one" - last month's number, sitting right next to this month's.

The trick is doing it in two steps. First collapse to monthly totals with
`GROUP BY` (a subquery), then run `LAG` over those monthly rows. Window
functions operate after grouping, so the subquery gives them clean monthly rows
to walk.

```sql runnable
CREATE TABLE expenses (
  id          INTEGER PRIMARY KEY,
  spent_on    TEXT    NOT NULL,
  category    TEXT    NOT NULL,
  description TEXT    NOT NULL,
  amount      REAL    NOT NULL
);

INSERT INTO expenses (spent_on, category, description, amount) VALUES
  ('2026-01-01', 'rent',          'January rent',        1450.00),
  ('2026-01-02', 'subscriptions', 'Streaming service',      15.99),
  ('2026-01-03', 'groceries',     'Corner market',          54.20),
  ('2026-01-05', 'dining',        'Lunch with Sam',         28.75),
  ('2026-01-07', 'transport',     'Metro card refill',      40.00),
  ('2026-01-09', 'groceries',     'Weekly shop',            96.40),
  ('2026-01-12', 'utilities',     'Electricity',            72.10),
  ('2026-01-14', 'dining',        'Pizza night',            34.50),
  ('2026-01-16', 'subscriptions', 'Music service',           9.99),
  ('2026-01-18', 'groceries',     'Farmers market',         61.30),
  ('2026-01-21', 'transport',     'Rideshare home',         18.40),
  ('2026-01-24', 'dining',        'Dinner out',             52.00),
  ('2026-01-27', 'groceries',     'Weekly shop',            88.15),
  ('2026-01-30', 'utilities',     'Water bill',             31.25),
  ('2026-02-01', 'rent',          'February rent',        1450.00),
  ('2026-02-02', 'subscriptions', 'Streaming service',      15.99),
  ('2026-02-04', 'groceries',     'Corner market',          49.80),
  ('2026-02-06', 'travel',        'Weekend flights',       312.00),
  ('2026-02-07', 'dining',        'Airport food',           22.60),
  ('2026-02-10', 'groceries',     'Weekly shop',           102.55),
  ('2026-02-13', 'dining',        'Valentine dinner',       96.00),
  ('2026-02-15', 'subscriptions', 'Music service',           9.99),
  ('2026-02-17', 'transport',     'Metro card refill',      40.00),
  ('2026-02-20', 'groceries',     'Weekly shop',            79.90),
  ('2026-02-23', 'utilities',     'Electricity',            68.40),
  ('2026-02-26', 'dining',        'Takeout',                31.20);

SELECT
  month,
  total,
  LAG(total) OVER (ORDER BY month)                 AS prev_month,
  ROUND(total - LAG(total) OVER (ORDER BY month), 2) AS change
FROM (
  SELECT
    strftime('%Y-%m', spent_on) AS month,
    ROUND(SUM(amount), 2)        AS total
  FROM expenses
  GROUP BY month
) AS monthly
ORDER BY month;
```

January's `prev_month` is empty - there's no month before it, so `LAG` returns
nothing, and the subtraction is empty too. That's correct, not a bug: the first
row has nothing to compare against. February shows last month's total beside
this month's and the difference between them. Positive `change` means you spent
more; the February travel and dining pushed it up.

## What you can do now

You can keep every detail row and still answer "how much so far?" and "up or
down from last time?" - two questions `GROUP BY` alone can't touch. In the final
phase, you'll fold the category breakdown, the share-of-total, and this monthly
trend into one report query. Onward.
