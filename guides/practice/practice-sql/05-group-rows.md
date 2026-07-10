---
title: "Group rows together"
guide: practice-sql
phase: 5
summary: "Use GROUP BY to run an aggregate function separately for each distinct value in a column."
tags: [sql, group-by, aggregate]
difficulty: intermediate
synonyms:
  - sql group by
  - group rows sql
  - aggregate by category sql
updated: 2026-07-08
---

# Group rows together

`COUNT`, `MAX`, and friends get more useful once you can run them per-group
instead of over the whole table. `GROUP BY column` buckets the rows by every
distinct value in that column, then applies the aggregate to each bucket
separately - one output row per group.

"How many users per country" is a classic `GROUP BY`: without it you'd get one
number for everyone; with it you get one number for *each* country. Any column
you `SELECT` alongside an aggregate has to be the column (or one of the
columns) you're grouping by - otherwise SQL doesn't know which row's value to
show.

Same six-row `users` table as last lesson.

**Your task:** return each `country` and how many users are from it, as `total`.

**You'll practice:**

- Grouping rows with `GROUP BY`
- Combining a plain column with an aggregate in the same `SELECT`

```lesson
{
  "language": "sql",
  "setup": "CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, country TEXT, age INTEGER);\nINSERT INTO users (id, name, country, age) VALUES\n  (1, 'Ana', 'Georgia', 28),\n  (2, 'Luka', 'Georgia', 34),\n  (3, 'Marta', 'Spain', 22),\n  (4, 'Ben', 'USA', 41),\n  (5, 'Elin', 'Georgia', 25),\n  (6, 'Sam', 'Spain', 37);",
  "starterCode": "-- Return each country and how many users are from it, as `total`.\nSELECT country FROM users;",
  "solution": "SELECT country, COUNT(*) AS total FROM users GROUP BY country;",
  "hints": ["Add GROUP BY country after the FROM clause.", "Select both the country column and COUNT(*).", "One output row per distinct country."]
}
```
