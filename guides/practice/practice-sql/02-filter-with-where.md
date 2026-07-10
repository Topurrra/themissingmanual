---
title: "Filter rows with WHERE"
guide: practice-sql
phase: 2
summary: "Return only the rows that match a condition using the WHERE clause."
tags: [sql, where, filter]
difficulty: beginner
synonyms:
  - sql where clause
  - filter rows sql
updated: 2026-07-08
---

# Filter rows with WHERE

`WHERE` is how a query stops being "show me everything" and starts answering a
real question. It filters rows before they're returned - the condition is
checked against every row, and only the ones where it's true make it into the
result. Everything else is discarded before it ever reaches you.

You can compare a column against a fixed value (`age > 30`), against another
column, or chain conditions together with `AND`/`OR` - this lesson starts with
the simplest case: one column, one value.

Same `users` table as before: `id`, `name`, `country`, `age`.

**Your task:** show the `name` and `age` of everyone whose country is `Georgia`.

**You'll practice:**

- Adding a `WHERE` clause to a query
- Comparing a text column against a quoted value

```lesson
{
  "language": "sql",
  "setup": "CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, country TEXT, age INTEGER);\nINSERT INTO users (id, name, country, age) VALUES\n  (1, 'Ana', 'Georgia', 28),\n  (2, 'Luka', 'Georgia', 34),\n  (3, 'Marta', 'Spain', 22),\n  (4, 'Ben', 'USA', 41);",
  "starterCode": "-- Show the name and age of everyone from Georgia.\nSELECT name, age FROM users;",
  "solution": "SELECT name, age FROM users WHERE country = 'Georgia';",
  "hints": ["Add a WHERE clause after the table name.", "Text values need single quotes: country = 'Georgia'.", "Numbers don't need quotes: age > 30."]
}
```
