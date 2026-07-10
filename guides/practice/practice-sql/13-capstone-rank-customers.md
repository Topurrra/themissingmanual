---
title: "Capstone: rank customers, gaps included"
guide: practice-sql
phase: 13
summary: "Combine LEFT JOIN, GROUP BY, COALESCE, and a window function - the advanced version of the total-spent capstone, including customers who've never ordered anything."
tags: [sql, left-join, group-by, coalesce, window-function, capstone]
difficulty: advanced
synonyms:
  - advanced sql capstone
  - left join group by rank sql
  - rank customers by total spent sql
  - coalesce with window function sql
updated: 2026-07-10
---

# Capstone: rank customers, gaps included

The first capstone answered "who are our biggest customers?" using an `INNER
JOIN`, which quietly drops anyone with zero orders - they don't show up as a
zero, they just vanish. A real reporting query usually needs to show
*everyone*, including the customers who haven't bought anything yet.

That means swapping the `INNER JOIN` for a `LEFT JOIN`, and handling the
`NULL` it produces for a no-order customer's total with `COALESCE`. Add in a
`RANK()` window function over the grouped totals and you've combined
everything this module has covered into one query - the kind you'd actually be
asked to write.

Same `users` and `orders` shape as the earlier join lessons, with one extra
small order and one user - Ben - who has never ordered anything.

**Your task:** for each user, return their `name`, their total spent (as
`total_spent`, using `COALESCE` so a user with no orders shows `0` instead of
`NULL`), and their rank among all users by total spent (as `rank`, using
`RANK() OVER (ORDER BY ... DESC)`) - ordered from highest spender to lowest.

**You'll practice:**

- Using `LEFT JOIN` instead of `INNER JOIN` so no customer is silently dropped
- Combining `COALESCE`, `GROUP BY`, and a window function in one query

```lesson
{
  "language": "sql",
  "setup": "CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, country TEXT, age INTEGER);\nINSERT INTO users (id, name, country, age) VALUES\n  (1, 'Ana', 'Georgia', 28),\n  (2, 'Luka', 'Georgia', 34),\n  (3, 'Marta', 'Spain', 22),\n  (4, 'Ben', 'USA', 41),\n  (5, 'Elin', 'Georgia', 25),\n  (6, 'Sam', 'Spain', 37);\nCREATE TABLE orders (id INTEGER PRIMARY KEY, user_id INTEGER, item TEXT, amount INTEGER);\nINSERT INTO orders (id, user_id, item, amount) VALUES\n  (1, 1, 'Book', 15),\n  (2, 1, 'Pen', 3),\n  (3, 2, 'Laptop', 900),\n  (4, 3, 'Book', 15),\n  (5, 5, 'Notebook', 5),\n  (6, 6, 'Mug', 8);",
  "starterCode": "-- Name, total spent (0 if no orders), and rank by total spent, highest first.\nSELECT users.name, orders.amount FROM users JOIN orders ON orders.user_id = users.id;",
  "solution": "SELECT users.name, COALESCE(SUM(orders.amount), 0) AS total_spent, RANK() OVER (ORDER BY COALESCE(SUM(orders.amount), 0) DESC) AS rank FROM users LEFT JOIN orders ON orders.user_id = users.id GROUP BY users.name ORDER BY total_spent DESC;",
  "hints": ["Use LEFT JOIN, not JOIN - it keeps Ben even though he has no matching order.", "SUM(orders.amount) is NULL for a user with no orders at all; wrap it in COALESCE(..., 0).", "RANK() OVER (ORDER BY ... DESC) runs after GROUP BY, ranking the already-grouped totals."]
}
```
