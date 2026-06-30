---
title: "The Final Report"
guide: sql-expense-analytics
phase: 4
summary: "Fold category share-of-total and the month-over-month trend into one report query you could drop into a dashboard."
tags: [sql, report, window-functions, cte, analytics]
difficulty: intermediate
synonyms:
  - final sql report
  - category share of total
  - percent of total sql
  - combined analytics query
  - dashboard query
updated: 2026-06-30
---

# The Final Report

You've built every piece: the table, the grouped totals, the running total, the
month-over-month change. This phase ties them into the two queries a real
expense report leads with - *where did the money go* (category share of total)
and *which way is it trending* (the monthly trend) - each as one self-contained
statement you could paste straight into a dashboard.

## Report part one: category share of total

A category total is useful. A category's **share of total** is the line that
ends arguments - "dining was 9% of everything" lands harder than a raw dollar
figure.

To get a percentage you need two numbers in the same row: each category's total,
and the grand total across all categories. The grand total is a single number
that has to be available on every row, and that's exactly a window function with
an empty `OVER ()` - no `ORDER BY`, no `PARTITION BY`, meaning "sum over the
whole result."

A CTE (the `WITH ... AS (...)` block) computes the per-category totals once, and
the outer query divides each by the windowed grand total.

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

WITH by_category AS (
  SELECT category, SUM(amount) AS total
  FROM expenses
  GROUP BY category
)
SELECT
  category,
  ROUND(total, 2)                                   AS total,
  ROUND(100.0 * total / SUM(total) OVER (), 1)      AS pct_of_total
FROM by_category
ORDER BY total DESC;
```

Now you've got the headline. Rent is the biggest slice by far; the discretionary
categories - dining, travel - are the ones you can actually act on. The
`pct_of_total` column adds up to 100 across all rows, because the denominator is
the same grand total on every row. The `100.0 *` (not `100 *`) forces
floating-point division so you get `8.7`, not `0`.

## Report part two: the monthly trend

The second half of the report is the trend over time, with the running total and
the month-over-month change side by side - everything from phase 3, assembled
into one statement. This is the query you'd chart.

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

WITH by_month AS (
  SELECT
    strftime('%Y-%m', spent_on) AS month,
    SUM(amount)                  AS total
  FROM expenses
  GROUP BY month
)
SELECT
  month,
  ROUND(total, 2)                                          AS total,
  ROUND(SUM(total) OVER (ORDER BY month), 2)               AS cumulative,
  ROUND(total - LAG(total) OVER (ORDER BY month), 2)       AS mom_change
FROM by_month
ORDER BY month;
```

One table, the full trend: each month's spend, the cumulative total across all
months, and how each month moved versus the last. January's `mom_change` is
empty (no prior month), `cumulative` ends at the grand total. This is a report -
the kind you'd refresh monthly and glance at to know whether you're drifting.

## You built a report

Step back and look at what you have. From a flat table of 26 expenses, in four
short phases, you produced:

| You learned | You used it for |
|-------------|-----------------|
| `GROUP BY` + `SUM` | Category and monthly totals |
| `HAVING` | Filtering to categories that matter |
| `SUM() OVER` | Running totals, with and without partitions |
| `LAG` | Month-over-month change |
| `OVER ()` + CTEs | Share-of-total in one query |

Those five techniques cover the vast majority of analytical SQL you'll ever
write. Sales, signups, errors per day - it's the same shapes with different
column names.

## Extend it

The data is yours - keep going:

- **Add March.** Insert a handful of `'2026-03-...'` rows and re-run the trend
  query. The trend extends with no code change - that's the payoff of writing it
  against the data instead of hardcoding two months.
- **Category trend.** Combine the techniques: `GROUP BY month, category`, then
  `PARTITION BY category ORDER BY month` to get each category's own
  month-over-month change. Which category is creeping up fastest?
- **Biggest expense per month.** Use `RANK() OVER (PARTITION BY month ORDER BY
  amount DESC)` and keep the rows where rank = 1.
- **A budget column.** Add a `budgets` table (`category`, `monthly_limit`), join
  it to your monthly category totals, and flag where you went over.

Each of those is a small variation on what you've already done. Pick one, open
any block above, swap the bottom query, and run it. You've got the loop now -
edit, run, read the output, repeat. That's how SQL stops being syntax and starts
being a tool you reach for.
