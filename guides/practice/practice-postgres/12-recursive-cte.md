---
title: "Recursive CTEs (capstone)"
guide: practice-postgres
phase: 12
summary: "Walk a tree stored in a table - an org chart of manager_id references - with WITH RECURSIVE: a base case, a UNION ALL, and a step that joins back to itself."
tags: [postgres, cte, recursive, trees, hierarchies, capstone]
difficulty: advanced
synonyms:
  - with recursive postgres example
  - query org chart sql
  - find all reports under a manager
  - recursive query parent child table
updated: 2026-07-18
---

# Recursive CTEs (capstone)

Org charts, category trees, folder structures - hierarchies get stored in
SQL as a table pointing at itself: each row carries the `id` of its parent.
Simple to store, awkward to query: "everyone under Ken" includes Ken's
direct reports, *their* reports, and so on - a walk of unknown depth, which
no fixed number of JOINs can express.

`WITH RECURSIVE` is SQL's answer. It has three parts, always the same shape:

```sql
WITH RECURSIVE reports AS (
  SELECT ...   -- 1. base case: where the walk starts
  UNION ALL
  SELECT ...   -- 2. step: joins the table to `reports` itself
)
SELECT ...     -- 3. use the accumulated result
```

The engine runs the base case, then applies the step to the rows it just
produced, then applies it again to *those* results - until a step produces
no new rows. The magic line is the step's join: it references the CTE being
defined (`JOIN reports r ON e.manager_id = r.id` - "employees whose manager
is someone already in the result").

You have an `employees` table: `id`, `name`, `manager_id` (NULL for the CEO).
Rosa runs the company; Ken and Ana report to her; Ben and Cho report to Ken;
Dev reports to Ana; Eli reports to Ben.

**Your task:** list the `name` of every employee under Ken (`id` 2) at any
depth - his direct reports and their reports, but not Ken himself. Order by
name.

**You'll practice:**

- The base-case / UNION ALL / recursive-step shape
- A step that joins the table back to the CTE being built

```lesson
{
  "language": "postgres",
  "setup": "CREATE TABLE employees (id INTEGER PRIMARY KEY, name TEXT, manager_id INTEGER);\nINSERT INTO employees (id, name, manager_id) VALUES\n  (1, 'Rosa', NULL), (2, 'Ken', 1), (3, 'Ana', 1),\n  (4, 'Ben', 2), (5, 'Cho', 2), (6, 'Dev', 3), (7, 'Eli', 4);",
  "starterCode": "-- Everyone under Ken (id 2), any depth. A plain query only gets one level:\nSELECT id, name FROM employees WHERE manager_id = 2;\n-- Eli (who reports to Ben, who reports to Ken) is missing. Recursion fixes that.",
  "solution": "WITH RECURSIVE reports AS (\n  SELECT id, name FROM employees WHERE manager_id = 2\n  UNION ALL\n  SELECT e.id, e.name\n  FROM employees e\n  JOIN reports r ON e.manager_id = r.id\n)\nSELECT name FROM reports ORDER BY name;",
  "hints": ["The base case is the starter's own query: direct reports of id 2 (Ben and Cho).", "The recursive step joins employees to the CTE itself: JOIN reports r ON e.manager_id = r.id - people managed by anyone already found.", "The walk finds Ben and Cho, then Eli (under Ben), then stops - three names: Ben, Cho, Eli."]
}
```
