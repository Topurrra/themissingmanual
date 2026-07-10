---
title: "Subqueries: a query inside a query"
guide: practice-sql
phase: 9
summary: "Use a scalar subquery as a value inside WHERE, comparing each row against an aggregate computed over the whole table."
tags: [sql, subquery, where, aggregate]
difficulty: intermediate
synonyms:
  - sql subquery example
  - query inside a query
  - scalar subquery in where clause
  - subquery vs join sql
updated: 2026-07-10
---

# Subqueries: a query inside a query

Every query so far has stood alone. A subquery is a query inside a query - a
full `SELECT` wrapped in parentheses and used as a value somewhere else in the
outer query, usually inside `WHERE`. The database runs the inner query first,
gets back a value, then finishes the outer query as if you'd typed that value
in by hand.

The simplest and most common shape is a scalar subquery: one that returns
exactly one row and one column, so it can stand in for a single number.
`(SELECT AVG(amount) FROM orders)` computes the average order amount once, and
you can compare every row's `amount` against it - no `JOIN`, no `GROUP BY`,
just a query used as a number.

Same `users` and `orders` tables as the join lessons - this one only needs
`orders`.

**Your task:** return each order's `item` and `amount` where the amount is
greater than the average amount across all orders.

**You'll practice:**

- Writing a subquery that returns a single value
- Using that value inside a `WHERE` comparison

```lesson
{
  "language": "sql",
  "setup": "CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, country TEXT, age INTEGER);\nINSERT INTO users (id, name, country, age) VALUES\n  (1, 'Ana', 'Georgia', 28),\n  (2, 'Luka', 'Georgia', 34),\n  (3, 'Marta', 'Spain', 22),\n  (4, 'Ben', 'USA', 41),\n  (5, 'Elin', 'Georgia', 25),\n  (6, 'Sam', 'Spain', 37);\nCREATE TABLE orders (id INTEGER PRIMARY KEY, user_id INTEGER, item TEXT, amount INTEGER);\nINSERT INTO orders (id, user_id, item, amount) VALUES\n  (1, 1, 'Book', 15),\n  (2, 1, 'Pen', 3),\n  (3, 2, 'Laptop', 900),\n  (4, 3, 'Book', 15),\n  (5, 5, 'Notebook', 5);",
  "starterCode": "-- Return each order's item and amount where amount is above the average order amount.\nSELECT item, amount FROM orders;",
  "solution": "SELECT item, amount FROM orders WHERE amount > (SELECT AVG(amount) FROM orders);",
  "hints": ["A subquery is just a SELECT wrapped in parentheses, used as a value.", "(SELECT AVG(amount) FROM orders) computes one number: the average order amount.", "Compare orders.amount to that subquery directly in WHERE - no JOIN needed."]
}
```
