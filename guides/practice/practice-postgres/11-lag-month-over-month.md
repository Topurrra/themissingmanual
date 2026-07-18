---
title: "LAG: comparing to the previous row"
guide: practice-postgres
phase: 11
summary: "Use LAG() to pull a value from the previous row into the current one - the standard tool for month-over-month change, with NULL marking the first row of each group."
tags: [postgres, window-functions, lag, lead, time-series]
difficulty: advanced
synonyms:
  - lag function postgres example
  - month over month change sql
  - compare row to previous row
  - lag over partition by
updated: 2026-07-18
---

# LAG: comparing to the previous row

"How did each rep's sales change from month 1 to month 2?" needs something
SQL rows famously don't have: a way to look at the *previous* row. Each row
knows its own month's amount; the change requires this month minus last
month - two different rows in one calculation.

`LAG()` is the window function built for exactly this. It reaches back one
row within the window and hands you a value from there:

```sql
LAG(amount) OVER (PARTITION BY rep ORDER BY month)
```

`PARTITION BY rep` keeps each rep's timeline separate - ana's month 1 must
never be treated as the "previous month" of ben's. `ORDER BY month` defines
what "previous" means. Subtract the lagged value from the current one and
you have the month-over-month change.

One behavior to expect rather than fear: the **first row of each partition
has no previous row**, so `LAG` returns `NULL` there - and anything minus
NULL is NULL. That's correct output, not a bug: month 1 genuinely has no
change to report. (`LEAD()` is the mirror image - it looks *forward* one
row.)

Same `sales` table: `rep`, `region`, `month`, `amount`.

**Your task:** for every sale, show `rep`, `month`, `amount`, and the change
from that rep's previous month as a column named `change` (current amount
minus the LAG of amount, partitioned by rep, ordered by month). Order the
results by rep, then month.

**You'll practice:**

- Reaching into the previous row with LAG() OVER (...)
- Partitioning so each rep's timeline stays independent

```lesson
{
  "language": "postgres",
  "setup": "CREATE TABLE sales (rep TEXT, region TEXT, month INTEGER, amount INTEGER);\nINSERT INTO sales (rep, region, month, amount) VALUES\n  ('ana', 'north', 1, 500), ('ana', 'north', 2, 700),\n  ('ben', 'north', 1, 400), ('ben', 'north', 2, 900),\n  ('cho', 'south', 1, 650), ('cho', 'south', 2, 600),\n  ('dev', 'south', 1, 300), ('dev', 'south', 2, 450);",
  "starterCode": "-- Show each rep's month-over-month change.\n-- The change needs this row's amount MINUS the previous row's amount.\nSELECT rep, month, amount\nFROM sales\nORDER BY rep, month;",
  "solution": "SELECT rep, month, amount,\n       amount - LAG(amount) OVER (PARTITION BY rep ORDER BY month) AS change\nFROM sales\nORDER BY rep, month;",
  "hints": ["LAG(amount) OVER (PARTITION BY rep ORDER BY month) is the previous month's amount for the same rep.", "The change column is amount minus that LAG expression, all in the SELECT list.", "Each rep's month 1 shows NULL for change - there's no previous month, and that's the correct answer. Month 2 changes: ana +200, ben +500, cho -50, dev +150."]
}
```
