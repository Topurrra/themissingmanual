---
title: "Fix the bug: rows go missing, no error"
guide: practice-sql
phase: 20
summary: "This query runs fine and returns real rows - it's just missing some of them. Find the JOIN that's silently dropping users with no orders."
tags: [sql, join, left-join, debugging]
difficulty: intermediate
synonyms:
  - sql join missing rows
  - inner join vs left join bug
  - why does my join drop rows
  - debug a sql join silently wrong
updated: 2026-07-16
---

# Fix the bug: rows go missing, no error

Every lesson so far either handed you working code or asked you to write it
from scratch. Real work is often a third thing: someone else's query already
runs, returns a result, and nothing looks wrong at a glance - it's just
missing rows. No traceback, no red error text, nothing pointing at a line
number. The only way to catch it is to actually read what came back and
notice it's short.

The query below runs without error. It just drops anyone who hasn't placed an
order - a plain `JOIN` only keeps rows where *both* sides match, so a user
with zero orders has nothing on the `orders` side to match against, and
vanishes from the result instead of showing up with an empty order. That's
the classic gap between `JOIN` (inner join) and `LEFT JOIN`: inner join keeps
matches only, left join keeps every row from the left table and fills in
`NULL` where there's no match on the right.

Same `users` and `orders` tables as the earlier JOIN lessons - six users,
five orders, and two users (`Ben` and `Sam`) who haven't ordered anything.

**Your task:** return every user's `name` alongside the `item` they ordered -
including users who haven't ordered anything, with `NULL` for their item.

**You'll practice:**

- Recognizing when `JOIN` silently drops rows instead of erroring
- Switching to `LEFT JOIN` to keep every row from one side regardless of a match

```lesson
{
  "language": "sql",
  "setup": "CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, country TEXT, age INTEGER);\nINSERT INTO users (id, name, country, age) VALUES\n  (1, 'Ana', 'Georgia', 28),\n  (2, 'Luka', 'Georgia', 34),\n  (3, 'Marta', 'Spain', 22),\n  (4, 'Ben', 'USA', 41),\n  (5, 'Elin', 'Georgia', 25),\n  (6, 'Sam', 'Spain', 37);\nCREATE TABLE orders (id INTEGER PRIMARY KEY, user_id INTEGER, item TEXT, amount INTEGER);\nINSERT INTO orders (id, user_id, item, amount) VALUES\n  (1, 1, 'Book', 15),\n  (2, 1, 'Pen', 3),\n  (3, 2, 'Laptop', 900),\n  (4, 3, 'Book', 15),\n  (5, 5, 'Notebook', 5);",
  "starterCode": "-- This is supposed to list every user with what they ordered, but rows are going missing - fix it.\nSELECT users.name, orders.item FROM orders JOIN users ON orders.user_id = users.id;",
  "solution": "SELECT users.name, orders.item FROM users LEFT JOIN orders ON orders.user_id = users.id;",
  "hints": ["Run it and count the rows - there are six users in the table. Does the result have six rows, or fewer?", "JOIN only keeps a row when both sides match. A user with zero orders has no matching row in orders, so JOIN drops them entirely instead of showing NULL.", "Switch JOIN to LEFT JOIN, and make sure users is the first (left) table: FROM users LEFT JOIN orders ON orders.user_id = users.id."]
}
```
