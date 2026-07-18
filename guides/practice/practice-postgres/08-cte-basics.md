---
title: "CTEs: naming a step with WITH"
guide: practice-postgres
phase: 8
summary: "Use a WITH clause (a Common Table Expression) to name an intermediate result, then query it - turning a nested subquery mess into two readable steps."
tags: [postgres, cte, with-clause, subqueries]
difficulty: intermediate
synonyms:
  - postgres with clause example
  - what is a cte in postgres
  - common table expression tutorial
  - replace subquery with cte
updated: 2026-07-18
---

# CTEs: naming a step with WITH

"Which sales reps beat the average?" sounds like one question, but it's two
stacked queries: first total up each rep's sales, *then* compare those totals
to their own average. Written with subqueries, the same `GROUP BY` ends up
pasted in twice, nested inside itself - correct, and nearly unreadable a
week later.

A **CTE** (Common Table Expression) lets you name the first step and then
treat it like a table:

```sql
WITH rep_totals AS (
  SELECT rep, SUM(amount) AS total
  FROM sales
  GROUP BY rep
)
SELECT ... FROM rep_totals ...
```

Everything after the `WITH` block can query `rep_totals` as if it were a
real table - including using it *twice*: once for the rows, once inside an
aggregate to get the average. One definition, two uses, zero duplication.
That's the whole pitch of CTEs: name your steps, and stacked questions read
top-to-bottom like a recipe.

You have a `sales` table: `rep`, `region`, `month`, `amount` - two months of
sales for four reps.

**Your task:** using a CTE named `rep_totals` (rep, total), list the `rep`
and `total` of every rep whose total is above the average of all reps'
totals. Order by rep.

**You'll practice:**

- Writing WITH name AS (...) and querying it
- Referencing the same CTE twice - as rows and inside an aggregate

```lesson
{
  "language": "postgres",
  "setup": "CREATE TABLE sales (rep TEXT, region TEXT, month INTEGER, amount INTEGER);\nINSERT INTO sales (rep, region, month, amount) VALUES\n  ('ana', 'north', 1, 500), ('ana', 'north', 2, 700),\n  ('ben', 'north', 1, 400), ('ben', 'north', 2, 900),\n  ('cho', 'south', 1, 650), ('cho', 'south', 2, 600),\n  ('dev', 'south', 1, 300), ('dev', 'south', 2, 450);",
  "starterCode": "-- Which reps' totals beat the average total?\n-- Step 1: total per rep. Step 2: compare to the average of those totals.\nWITH rep_totals AS (\n  SELECT rep, SUM(amount) AS total\n  FROM sales\n  GROUP BY rep\n)\nSELECT rep, total FROM rep_totals ORDER BY rep;",
  "solution": "WITH rep_totals AS (\n  SELECT rep, SUM(amount) AS total\n  FROM sales\n  GROUP BY rep\n)\nSELECT rep, total\nFROM rep_totals\nWHERE total > (SELECT AVG(total) FROM rep_totals)\nORDER BY rep;",
  "hints": ["The starter already builds rep_totals and shows all four rows - your job is the WHERE clause that filters them.", "A CTE can be used twice: FROM rep_totals for the rows, and (SELECT AVG(total) FROM rep_totals) as the comparison value.", "The average total is 1125, so ana (1200), ben (1300), and cho (1250) qualify - dev (750) does not."]
}
```
