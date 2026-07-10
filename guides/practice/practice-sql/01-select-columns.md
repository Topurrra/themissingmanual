---
title: "Select specific columns"
guide: practice-sql
phase: 1
summary: "Pick exactly the columns you want instead of grabbing everything with SELECT *."
tags: [sql, select, columns]
difficulty: beginner
synonyms:
  - select column sql
  - sql choose columns
updated: 2026-07-08
---

# Select specific columns

`SELECT *` grabs every column of every row. It works, and it's the fastest way
to peek at a table you don't know yet - but real, day-to-day queries almost
always name the columns they need instead. Naming columns is faster to send
back, clearer to read six months later, and it doesn't quietly change shape
when someone adds a column to the table.

You have a `users` table with columns `id`, `name`, `country`, and `age`. Every
query on this page runs against a real, live copy of it - nothing you do here
can break anything.

**Your task:** return only the `name` column, for every user.

**You'll practice:**

- Naming columns in a `SELECT` instead of using `*`
- Reading a small table's schema before you query it

```lesson
{
  "language": "sql",
  "setup": "CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, country TEXT, age INTEGER);\nINSERT INTO users (id, name, country, age) VALUES\n  (1, 'Ana', 'Georgia', 28),\n  (2, 'Luka', 'Georgia', 34),\n  (3, 'Marta', 'Spain', 22),\n  (4, 'Ben', 'USA', 41);",
  "starterCode": "-- The table is called users. Show ONLY the name column.\nSELECT * FROM users;",
  "solution": "SELECT name FROM users;",
  "hints": ["Replace * with the column you want.", "Column names go right after SELECT, separated by commas.", "You only need one column here: name."]
}
```
