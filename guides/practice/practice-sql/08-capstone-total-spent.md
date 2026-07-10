---
title: "Capstone: total spent per customer"
guide: practice-sql
phase: 8
summary: "Combine JOIN, GROUP BY, an aggregate, and ORDER BY in one practical query."
tags: [sql, join, group-by, order-by, capstone]
difficulty: intermediate
synonyms:
  - sql capstone project
  - total spent per customer sql
  - sql join group by order by
updated: 2026-07-08
---

# Capstone: total spent per customer

This is the query you'd actually write at a job: "who are our biggest
customers?" It needs everything from this module - a `JOIN` to connect orders
to the people who placed them, `GROUP BY` to bucket by customer, `SUM` to add
up what each one spent, and `ORDER BY` to rank them.

None of these pieces is new. What's new is stacking them: join first, group the
joined rows, aggregate within each group, then sort the final result. That
order - join, group, aggregate, sort - is the shape of most real reporting
queries, not just this one.

Same `users` and `orders` tables as the JOIN lesson.

**Your task:** for each user who has placed at least one order, return their
`name` and the total amount they've spent (as `total_spent`), ordered from
highest spender to lowest.

**You'll practice:**

- Joining, grouping, and aggregating in a single query
- Ordering by an aggregated column

```lesson
{
  "language": "sql",
  "setup": "CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, country TEXT, age INTEGER);\nINSERT INTO users (id, name, country, age) VALUES\n  (1, 'Ana', 'Georgia', 28),\n  (2, 'Luka', 'Georgia', 34),\n  (3, 'Marta', 'Spain', 22),\n  (4, 'Ben', 'USA', 41),\n  (5, 'Elin', 'Georgia', 25),\n  (6, 'Sam', 'Spain', 37);\nCREATE TABLE orders (id INTEGER PRIMARY KEY, user_id INTEGER, item TEXT, amount INTEGER);\nINSERT INTO orders (id, user_id, item, amount) VALUES\n  (1, 1, 'Book', 15),\n  (2, 1, 'Pen', 3),\n  (3, 2, 'Laptop', 900),\n  (4, 3, 'Book', 15),\n  (5, 5, 'Notebook', 5);",
  "starterCode": "-- Name and total spent per customer, as `total_spent`, highest spender first.\nSELECT users.name, orders.amount FROM orders JOIN users ON orders.user_id = users.id;",
  "solution": "SELECT users.name, SUM(orders.amount) AS total_spent FROM orders JOIN users ON orders.user_id = users.id GROUP BY users.name ORDER BY total_spent DESC;",
  "hints": ["Join the tables first, same as the previous lesson.", "Group by users.name, then SUM(orders.amount) for each group.", "Finish with ORDER BY total_spent DESC to rank highest first."]
}
```
