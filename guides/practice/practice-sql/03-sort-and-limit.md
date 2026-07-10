---
title: "Sort and limit results"
guide: practice-sql
phase: 3
summary: "Order query results with ORDER BY and cut them down to a fixed number with LIMIT."
tags: [sql, order-by, limit, sorting]
difficulty: beginner
synonyms:
  - sql order by
  - sql limit rows
  - sort query results sql
updated: 2026-07-10
---

# Sort and limit results

A raw query returns rows in whatever order the database feels like - which is
rarely the order you actually want. `ORDER BY` fixes that: it sorts the result
by one or more columns, ascending by default (`ASC`) or descending if you add
`DESC`.

`LIMIT` trims the result down to a fixed number of rows. The two work together
constantly - "top 5", "oldest first", "most recent 10" are all `ORDER BY` plus
`LIMIT`. Order the rows the way you want, then cut off everything past the
number you need.

Same `users` table as before: `id`, `name`, `country`, `age`.

**Your task:** return the `name` and `age` of the two oldest users, oldest first.

**You'll practice:**

- Sorting results with `ORDER BY column DESC`
- Capping the number of rows with `LIMIT`

```lesson
{
  "language": "sql",
  "setup": "CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, country TEXT, age INTEGER);\nINSERT INTO users (id, name, country, age) VALUES\n  (1, 'Ana', 'Georgia', 28),\n  (2, 'Luka', 'Georgia', 34),\n  (3, 'Marta', 'Spain', 22),\n  (4, 'Ben', 'USA', 41);",
  "starterCode": "-- Show the two oldest users' name and age, oldest first.\nSELECT name, age FROM users;",
  "solution": "SELECT name, age FROM users ORDER BY age DESC LIMIT 2;",
  "hints": ["Sort the rows with ORDER BY before you think about how many you need.", "\"Oldest first\" means descending order - which keyword reverses the default ascending sort?", "ORDER BY age DESC LIMIT 2 sorts oldest-first, then keeps only the first 2 rows."]
}
```
