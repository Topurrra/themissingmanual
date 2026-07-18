---
title: "Window functions: RANK with PARTITION BY"
guide: practice-postgres
phase: 10
summary: "Rank rows within groups using RANK() OVER (PARTITION BY ... ORDER BY ...) - every row keeps its detail, and gains its standing inside its group."
tags: [postgres, window-functions, rank, partition-by]
difficulty: advanced
synonyms:
  - rank over partition by example
  - postgres window function rank
  - rank within each group sql
  - row_number vs rank
updated: 2026-07-18
---

# Window functions: RANK with PARTITION BY

`GROUP BY` answers "what's the total per region?" - but it *collapses* the
rows to answer. The moment the question becomes "how does each individual
sale rank **within** its region?", GROUP BY can't help: you need every row
to survive, each annotated with information about its group.

That's a **window function**. It looks over a "window" of related rows while
leaving the rows themselves intact:

```sql
RANK() OVER (PARTITION BY region ORDER BY amount DESC)
```

Read the `OVER` clause inside-out: `PARTITION BY region` splits the rows into
per-region windows (like GROUP BY, but without collapsing), and
`ORDER BY amount DESC` says what "rank 1" means inside each window - highest
amount first. Each region gets its own independent 1, 2, 3, ... - the
numbering restarts at every partition boundary.

(`ROW_NUMBER()` is the sibling that never ties; `RANK()` gives equal values
equal rank and skips ahead after a tie. With no ties in this data they agree -
knowing both names helps when reading other people's queries.)

Same `sales` table: `rep`, `region`, `month`, `amount`.

**Your task:** show every sale's `rep`, `region`, `amount`, and its rank
within its region by amount (highest = 1), as a column named
`rank_in_region`. Order by region, then rank.

**You'll practice:**

- Writing RANK() OVER (PARTITION BY ... ORDER BY ...)
- Keeping row-level detail while adding group-level standing

```lesson
{
  "language": "postgres",
  "setup": "CREATE TABLE sales (rep TEXT, region TEXT, month INTEGER, amount INTEGER);\nINSERT INTO sales (rep, region, month, amount) VALUES\n  ('ana', 'north', 1, 500), ('ana', 'north', 2, 700),\n  ('ben', 'north', 1, 400), ('ben', 'north', 2, 900),\n  ('cho', 'south', 1, 650), ('cho', 'south', 2, 600),\n  ('dev', 'south', 1, 300), ('dev', 'south', 2, 450);",
  "starterCode": "-- Rank each sale within its region (highest amount = rank 1).\n-- GROUP BY would collapse the rows - a window function keeps them.\nSELECT rep, region, amount\nFROM sales\nORDER BY region, amount DESC;",
  "solution": "SELECT rep, region, amount,\n       RANK() OVER (PARTITION BY region ORDER BY amount DESC) AS rank_in_region\nFROM sales\nORDER BY region, rank_in_region;",
  "hints": ["The window function is an extra SELECT column, not a WHERE or GROUP BY: RANK() OVER (...) AS rank_in_region.", "PARTITION BY region restarts the numbering per region; ORDER BY amount DESC inside OVER decides what rank 1 means.", "North ranks: ben 900, ana 700, ana 500, ben 400. South ranks: cho 650, cho 600, dev 450, dev 300."]
}
```
