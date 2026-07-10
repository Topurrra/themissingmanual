---
title: "CTEs: naming a subquery with WITH"
guide: practice-sql
phase: 15
summary: "Rewrite an inline subquery as a named CTE using WITH ... AS (...), the same computation with a name you can read."
tags: [sql, cte, with, subquery]
difficulty: intermediate
synonyms:
  - sql cte example
  - with clause sql
  - common table expression sql
  - named subquery sql
updated: 2026-07-10
---

# CTEs: naming a subquery with WITH

Back in the subquery lesson, you compared each order's amount against
`(SELECT AVG(amount) FROM orders)` - a query wrapped in parentheses, dropped
inline wherever you needed its value. That works, but as queries grow, inline
subqueries pile up and get hard to read. A **CTE** (common table expression)
is the same idea with a name attached.

`WITH avg_amount AS (SELECT AVG(amount) AS a FROM orders)` runs the inner
query once, gives the result a name (`avg_amount`), and lets the rest of the
query - the part after `WITH ... AS (...)` - refer to it like a regular
table. It computes exactly the same thing as the inline subquery; it's purely
a readability upgrade, not a different result.

Same single `orders` table (`id`, `item`, `amount`) as the subquery lesson.

**Your task:** return each order's `item` and `amount` where the amount is
greater than the average amount across all orders - the same comparison as
before, but written as a `WITH` clause instead of an inline subquery.

**You'll practice:**

- Defining a CTE with `WITH name AS (SELECT ...)`
- Referring to a CTE's column in the outer query, the same way you'd refer to
  a table's column

```lesson
{
  "language": "sql",
  "setup": "CREATE TABLE orders (id INTEGER PRIMARY KEY, item TEXT, amount INTEGER);\nINSERT INTO orders (id, item, amount) VALUES\n  (1, 'Book', 15),\n  (2, 'Pen', 3),\n  (3, 'Laptop', 900),\n  (4, 'Book', 15),\n  (5, 'Notebook', 5);",
  "starterCode": "-- Return item, amount, for orders above the average amount - using a WITH clause instead of a subquery.\nSELECT item, amount FROM orders;",
  "solution": "WITH avg_amount AS (SELECT AVG(amount) AS a FROM orders) SELECT item, amount FROM orders, avg_amount WHERE amount > avg_amount.a;",
  "hints": ["WITH avg_amount AS (SELECT AVG(amount) AS a FROM orders) computes the average once and names it avg_amount.", "List avg_amount alongside orders (comma-separated, like a second table) so you can reach its column.", "Compare orders.amount to avg_amount.a in WHERE - same comparison as the subquery version, just named."]
}
```
