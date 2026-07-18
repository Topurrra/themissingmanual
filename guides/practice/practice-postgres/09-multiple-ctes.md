---
title: "Chaining CTEs"
guide: practice-postgres
phase: 9
summary: "Define two CTEs in one WITH clause, the second building on the first - a pipeline of named steps inside a single query."
tags: [postgres, cte, with-clause, query-pipelines]
difficulty: intermediate
synonyms:
  - multiple ctes in one query
  - cte referencing another cte
  - chained with clauses postgres
updated: 2026-07-18
---

# Chaining CTEs

One CTE names one step. Real questions often take two or three: "total sales
per month, then find the best month, then show me who sold what *in* that
month." Each step consumes the previous one - a pipeline.

A single `WITH` clause can hold several CTEs, separated by commas, and each
one can query the ones defined **before** it:

```sql
WITH monthly AS (
  SELECT month, SUM(amount) AS total FROM sales GROUP BY month
),
best AS (
  SELECT month FROM monthly ORDER BY total DESC LIMIT 1
)
SELECT ...
```

`best` reads from `monthly` as if it were a table - the second step consumes
the first. The final query after the `WITH` block can then use either one.
Note the comma between CTEs, and that `WITH` is written only once - two
classic syntax stumbles when chaining for the first time.

Same `sales` table as the last lesson: `rep`, `region`, `month`, `amount`.

**Your task:** using two CTEs - `monthly` (month, total) and `best` (the
single month with the highest total) - list the `rep` and `amount` of every
sale that happened in the best month. Order by rep.

**You'll practice:**

- Defining two CTEs in one WITH clause, comma-separated
- Having the second CTE query the first

```lesson
{
  "language": "postgres",
  "setup": "CREATE TABLE sales (rep TEXT, region TEXT, month INTEGER, amount INTEGER);\nINSERT INTO sales (rep, region, month, amount) VALUES\n  ('ana', 'north', 1, 500), ('ana', 'north', 2, 700),\n  ('ben', 'north', 1, 400), ('ben', 'north', 2, 900),\n  ('cho', 'south', 1, 650), ('cho', 'south', 2, 600),\n  ('dev', 'south', 1, 300), ('dev', 'south', 2, 450);",
  "starterCode": "-- Step 1: total per month. Step 2: the best month. Step 3: that month's sales.\nWITH monthly AS (\n  SELECT month, SUM(amount) AS total\n  FROM sales\n  GROUP BY month\n)\nSELECT month, total FROM monthly ORDER BY month;",
  "solution": "WITH monthly AS (\n  SELECT month, SUM(amount) AS total\n  FROM sales\n  GROUP BY month\n),\nbest AS (\n  SELECT month FROM monthly ORDER BY total DESC LIMIT 1\n)\nSELECT rep, amount\nFROM sales\nWHERE month = (SELECT month FROM best)\nORDER BY rep;",
  "hints": ["Add the second CTE after a comma: WITH monthly AS (...), best AS (...) - WITH is only written once.", "best picks one row from monthly: ORDER BY total DESC LIMIT 1. Month 2 wins (2650 vs 1850).", "The final query filters sales WHERE month = (SELECT month FROM best) - four rows: ana 700, ben 900, cho 600, dev 450."]
}
```
