---
title: "Count and summarize"
guide: practice-sql
phase: 4
summary: "Use aggregate functions like COUNT and MAX to summarize a whole table into one row."
tags: [sql, aggregate, count, functions]
difficulty: beginner
synonyms:
  - sql count function
  - sql aggregate functions
  - count rows sql
updated: 2026-07-08
---

# Count and summarize

Sometimes you don't want the rows themselves - you want a fact about all of
them. `COUNT(*)` answers "how many rows?" `MAX`, `MIN`, `SUM`, and `AVG` answer
similar questions about a column: the biggest value, the smallest, the total,
the average. These are aggregate functions - they collapse many rows into one.

Put more than one in the same `SELECT` and you get several summary numbers back
in a single row, no `GROUP BY` required (that's next lesson - this one
summarizes the *whole* table at once).

The `users` table grew a little since last time - it now has six rows instead
of four, still with `id`, `name`, `country`, `age`.

**Your task:** return the total number of users (as `total`) and the oldest age
among them (as `oldest`).

**You'll practice:**

- Counting rows with `COUNT(*)`
- Finding an extreme value with `MAX`
- Naming a result column with `AS`

```lesson
{
  "language": "sql",
  "setup": "CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, country TEXT, age INTEGER);\nINSERT INTO users (id, name, country, age) VALUES\n  (1, 'Ana', 'Georgia', 28),\n  (2, 'Luka', 'Georgia', 34),\n  (3, 'Marta', 'Spain', 22),\n  (4, 'Ben', 'USA', 41),\n  (5, 'Elin', 'Georgia', 25),\n  (6, 'Sam', 'Spain', 37);",
  "starterCode": "-- Return the total number of users and the oldest age, as `total` and `oldest`.\nSELECT * FROM users;",
  "solution": "SELECT COUNT(*) AS total, MAX(age) AS oldest FROM users;",
  "hints": ["COUNT(*) counts every row in the result.", "MAX(age) returns the single biggest age value.", "Give each one a name with AS: COUNT(*) AS total."]
}
```
