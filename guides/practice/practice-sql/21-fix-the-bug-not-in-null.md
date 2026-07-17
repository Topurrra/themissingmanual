---
title: "Fix the bug: NOT IN quietly returns nothing"
guide: practice-sql
phase: 21
summary: "The query runs, returns zero rows, and says nobody has ever failed to order. Look at the table: that is plainly false. One NULL is doing it."
tags: [sql, null, not-in, subquery, debugging, three-valued-logic]
difficulty: advanced
synonyms:
  - sql not in returns no rows
  - not in with null subquery
  - why does not in return nothing
  - sql null comparison unknown
  - not in vs not exists
updated: 2026-07-16
---

# Fix the bug: NOT IN quietly returns nothing

The last lesson's query was short a few rows. This one is worse: it returns
*nothing at all*, and nothing is a perfectly plausible-looking answer. An empty
result reads as "there are none" - so this query is quietly claiming that every
single user has placed an order.

Look at the tables and you can see that is false. `Ben` and `Sam` are sitting
right there with no orders against their names. The query is not asking the
database a hard question. It is asking a question the database cannot answer
`true` to, for any row, ever.

One thing changed since the last lesson: `orders` now has a sixth row - a gift
card someone bought without logging in, so its `user_id` is `NULL`. Nothing
else moved. That single row is what turned a working query into a query that
returns nothing.

**Your task:** return the `name` of every user who has never placed an order.
The answer is `Ben` and `Sam`.

**You'll practice:**

- Reading an empty result as a claim, and checking whether the claim is true
- Spotting that one `NULL` in a subquery can silently empty out `NOT IN`

```lesson
{
  "language": "sql",
  "setup": "CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, country TEXT, age INTEGER);\nINSERT INTO users (id, name, country, age) VALUES\n  (1, 'Ana', 'Georgia', 28),\n  (2, 'Luka', 'Georgia', 34),\n  (3, 'Marta', 'Spain', 22),\n  (4, 'Ben', 'USA', 41),\n  (5, 'Elin', 'Georgia', 25),\n  (6, 'Sam', 'Spain', 37);\nCREATE TABLE orders (id INTEGER PRIMARY KEY, user_id INTEGER, item TEXT, amount INTEGER);\nINSERT INTO orders (id, user_id, item, amount) VALUES\n  (1, 1, 'Book', 15),\n  (2, 1, 'Pen', 3),\n  (3, 2, 'Laptop', 900),\n  (4, 3, 'Book', 15),\n  (5, 5, 'Notebook', 5),\n  (6, NULL, 'Gift Card', 25);",
  "starterCode": "-- This should list users who have never ordered. It returns nothing at all - fix it.\nSELECT name FROM users WHERE id NOT IN (SELECT user_id FROM orders);",
  "solution": "SELECT u.name FROM users u WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.user_id = u.id);",
  "hints": [
    "Run it. Zero rows means 'every user has ordered'. Now look at the orders table: whose user_id is missing? The result is lying, so the query is wrong, not the data.",
    "Look at the sixth order. Its user_id is NULL. Now read the query as the database does: is Ben's id (4) 'not in' a list that contains an unknown value? SQL cannot say true - it does not know what that NULL is, so the answer is UNKNOWN, and UNKNOWN is not true. WHERE only keeps rows that are true, so every row is dropped.",
    "NOT EXISTS asks a different question, one NULL cannot poison: 'is there any order row belonging to this user?' Try: SELECT u.name FROM users u WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.user_id = u.id);"
  ]
}
```
