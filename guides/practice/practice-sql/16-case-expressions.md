---
title: "CASE: bucket rows into categories"
guide: practice-sql
phase: 16
summary: "Use a CASE expression to turn a raw column value into a labeled category, right inside SELECT."
tags: [sql, case, conditional]
difficulty: intermediate
synonyms:
  - sql case when example
  - sql case expression
  - if else in sql select
  - bucket rows sql
updated: 2026-07-10
---

# CASE: bucket rows into categories

Every column so far has come back exactly as stored. Sometimes what you want
isn't the raw value but a label based on it - "young" instead of `22`,
"senior" instead of `61`. `CASE` is SQL's inline if/else: it checks a series
of conditions in order and returns the first matching branch's value, right
inside a `SELECT` list.

```sql
CASE
  WHEN age < 30 THEN 'young'
  WHEN age < 50 THEN 'adult'
  ELSE 'senior'
END
```

Each `WHEN` is checked top to bottom; the first one that's true wins, and
`ELSE` catches everything left over. Give the whole expression an alias with
`AS` and it behaves like any other column in your result.

There's a `users` table: `id`, `name`, `age`.

**Your task:** return each user's `name`, `age`, and a `bracket` column:
`'young'` if under 30, `'adult'` if under 50, otherwise `'senior'`.

**You'll practice:**

- Writing a multi-branch `CASE WHEN ... THEN ... ELSE ... END`
- Aliasing a `CASE` expression as a normal output column with `AS`

```lesson
{
  "language": "sql",
  "setup": "CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, age INTEGER);\nINSERT INTO users (id, name, age) VALUES\n  (1, 'Ana', 22),\n  (2, 'Luka', 35),\n  (3, 'Marta', 58),\n  (4, 'Ben', 29),\n  (5, 'Elin', 61),\n  (6, 'Sam', 44);",
  "starterCode": "-- Return name, age, and a bracket ('young' under 30, 'adult' under 50, else 'senior') as bracket.\nSELECT name, age FROM users;",
  "solution": "SELECT name, age, CASE WHEN age < 30 THEN 'young' WHEN age < 50 THEN 'adult' ELSE 'senior' END AS bracket FROM users;",
  "hints": ["CASE WHEN condition THEN value ... END goes right in the SELECT list, alongside name and age.", "Order matters: WHEN age < 30 must come before WHEN age < 50, or a 22-year-old would never reach the first branch.", "ELSE catches everyone who didn't match an earlier WHEN - here, anyone 50 or older.", "Alias the whole CASE expression with AS bracket, just like you'd alias any column."]
}
```
