---
title: "Rank rows with a window function"
guide: practice-sql
phase: 10
summary: "Use RANK() OVER (ORDER BY ...) to compute a rank per row without collapsing rows the way GROUP BY does."
tags: [sql, window-function, rank, over]
difficulty: intermediate
synonyms:
  - sql window function example
  - rank over order by
  - sql rank without group by
  - over clause sql
updated: 2026-07-10
---

# Rank rows with a window function

`GROUP BY` answers questions by collapsing rows together - you lose the
individual rows and keep only the group totals. Sometimes you want the
opposite: a number computed *across* a set of rows, like a rank, but with
every original row still intact. That's what a window function does.

`RANK() OVER (ORDER BY amount DESC)` looks at every row's `amount`, works out
where it stands relative to all the others, and hands back a rank - but the
query still returns one row per order, not one row per rank. The `ORDER BY`
inside the parentheses only controls how the ranking is computed; it's
independent of a top-level `ORDER BY` at the end of a query (this lesson
doesn't need one at all).

Same tables as the subquery lesson.

**Your task:** return each order's `item`, `amount`, and its rank by amount
(highest first, as `rank`), without collapsing any rows.

**You'll practice:**

- Writing a window function with `OVER (ORDER BY ...)`
- Seeing that a window function keeps one row per input row, unlike `GROUP BY`

```lesson
{
  "language": "sql",
  "setup": "CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, country TEXT, age INTEGER);\nINSERT INTO users (id, name, country, age) VALUES\n  (1, 'Ana', 'Georgia', 28),\n  (2, 'Luka', 'Georgia', 34),\n  (3, 'Marta', 'Spain', 22),\n  (4, 'Ben', 'USA', 41),\n  (5, 'Elin', 'Georgia', 25),\n  (6, 'Sam', 'Spain', 37);\nCREATE TABLE orders (id INTEGER PRIMARY KEY, user_id INTEGER, item TEXT, amount INTEGER);\nINSERT INTO orders (id, user_id, item, amount) VALUES\n  (1, 1, 'Book', 15),\n  (2, 1, 'Pen', 3),\n  (3, 2, 'Laptop', 900),\n  (4, 3, 'Book', 15),\n  (5, 5, 'Notebook', 5);",
  "starterCode": "-- Return item, amount, and each order's rank by amount, highest first, as `rank`.\nSELECT item, amount FROM orders;",
  "solution": "SELECT item, amount, RANK() OVER (ORDER BY amount DESC) AS rank FROM orders;",
  "hints": ["RANK() OVER (ORDER BY amount DESC) computes a rank per row - it doesn't merge or drop any rows.", "The ORDER BY inside OVER(...) only controls the ranking - it's independent of any top-level ORDER BY.", "Every one of the 5 orders keeps its own row, just with an extra rank column."]
}
```
