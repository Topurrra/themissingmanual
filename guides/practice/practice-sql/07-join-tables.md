---
title: "Combine tables with JOIN"
guide: practice-sql
phase: 7
summary: "Use JOIN to pull matching rows from two related tables into one result."
tags: [sql, join, foreign-key]
difficulty: intermediate
synonyms:
  - sql join tables
  - inner join example
  - combine two tables sql
updated: 2026-07-08
---

# Combine tables with JOIN

Real data rarely lives in one table. Users go in a `users` table, their orders
go in an `orders` table, and each order points back to the user who placed it
with a `user_id` column. To answer "which user bought what", you need both
tables at once - that's what `JOIN` is for.

`JOIN ... ON` matches rows across tables where a condition holds, usually an id
column on one side equalling a foreign key on the other. Each matched pair
becomes one row in the result, so you can select columns from either table as
if they'd always been in the same place.

There are now two tables: `users` (`id`, `name`, `country`, `age`) and `orders`
(`id`, `user_id`, `item`, `amount`), where `orders.user_id` points at `users.id`.

**Your task:** return the user's `name` and the `item` they ordered, for every
order.

**You'll practice:**

- Joining two tables with `JOIN ... ON`
- Selecting columns from both sides of the join

```lesson
{
  "language": "sql",
  "setup": "CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, country TEXT, age INTEGER);\nINSERT INTO users (id, name, country, age) VALUES\n  (1, 'Ana', 'Georgia', 28),\n  (2, 'Luka', 'Georgia', 34),\n  (3, 'Marta', 'Spain', 22),\n  (4, 'Ben', 'USA', 41),\n  (5, 'Elin', 'Georgia', 25),\n  (6, 'Sam', 'Spain', 37);\nCREATE TABLE orders (id INTEGER PRIMARY KEY, user_id INTEGER, item TEXT, amount INTEGER);\nINSERT INTO orders (id, user_id, item, amount) VALUES\n  (1, 1, 'Book', 15),\n  (2, 1, 'Pen', 3),\n  (3, 2, 'Laptop', 900),\n  (4, 3, 'Book', 15),\n  (5, 5, 'Notebook', 5);",
  "starterCode": "-- Return the user's name and the item they ordered, for every order.\nSELECT * FROM orders;",
  "solution": "SELECT users.name, orders.item FROM orders JOIN users ON orders.user_id = users.id;",
  "hints": ["JOIN users ON orders.user_id = users.id links the two tables.", "Once joined, refer to columns as table.column: users.name, orders.item.", "A user with no orders won't appear - JOIN only keeps matches."]
}
```
