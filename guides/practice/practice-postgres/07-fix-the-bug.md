---
title: "Fix the bug: Postgres's strict GROUP BY"
guide: practice-postgres
phase: 7
summary: "The query below throws before it returns a single row - Postgres requires every non-aggregate column in SELECT to appear in GROUP BY, and the error names the exact column to fix."
tags: [postgres, debugging, group-by, aggregates]
difficulty: intermediate
synonyms:
  - postgres group by error
  - must appear in the group by clause or be used in an aggregate function
  - postgres strict group by
  - fix a group by query
updated: 2026-07-16
---

# Fix the bug: Postgres's strict GROUP BY

Every lesson so far in this module asked you to write a query from a blank
slate. Real work is more often the opposite: someone else's query is already
there, and it's broken.

SQLite and MySQL let you `SELECT` a column that's neither grouped nor
wrapped in an aggregate function - they just hand back one arbitrary row's
value for it, silently, per group. Postgres refuses. Every non-aggregate
column in `SELECT` must appear in `GROUP BY`, or the query doesn't run at
all. That's not Postgres being pedantic - the value SQLite would pick for an
ungrouped column depends on internal row order, not anything you asked for,
and Postgres would rather error than hand you a number that looks right but
isn't tied to anything real.

The query below throws the moment you run it, and the error names the exact
column that's the problem.

You have a `sales` table: `id`, `region`, `rep`, `amount`.

**Your task:** fix the query so it returns each `region` and the `total`
amount sold there.

**You'll practice:**

- Reading a Postgres "must appear in the GROUP BY clause" error
- Knowing when a column belongs in `GROUP BY`, in an aggregate, or in
  neither

```lesson
{
  "language": "postgres",
  "setup": "CREATE TABLE sales (id INTEGER PRIMARY KEY, region TEXT, rep TEXT, amount INTEGER);\nINSERT INTO sales (id, region, rep, amount) VALUES\n  (1, 'East', 'Ana', 100),\n  (2, 'East', 'Ben', 150),\n  (3, 'West', 'Cy', 300),\n  (4, 'West', 'Ana', 50);",
  "starterCode": "-- This throws - fix it. It should return each region and its total amount sold.\nSELECT region, rep, SUM(amount) AS total FROM sales GROUP BY region;",
  "solution": "SELECT region, SUM(amount) AS total FROM sales GROUP BY region;",
  "hints": ["Run it first - Postgres won't return any rows, it throws an error naming the exact column that's the problem.", "The error says sales.rep must appear in the GROUP BY clause or be used in an aggregate function - every non-aggregate column in SELECT has to satisfy one of those two.", "The task only asks for region and the total, not rep - drop rep from the SELECT list rather than adding it to GROUP BY (that would split each region back into one row per rep instead of one per region)."]
}
```
