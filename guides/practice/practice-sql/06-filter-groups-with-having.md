---
title: "Filter groups with HAVING"
guide: practice-sql
phase: 6
summary: "Use HAVING to filter groups after aggregation, when WHERE can't see the aggregate yet."
tags: [sql, having, group-by, aggregate]
difficulty: intermediate
synonyms:
  - sql having clause
  - filter grouped results sql
  - having vs where sql
updated: 2026-07-08
---

# Filter groups with HAVING

`WHERE` filters rows *before* grouping - it can't see `COUNT(*)` or any other
aggregate, because those don't exist yet at that point in the query. `HAVING`
runs *after* `GROUP BY`, so it can filter on the aggregate result: "only groups
where the count is over 1", "only countries with an average age above 30", and
so on.

Same idea as `WHERE`, different stage of the query. If the condition mentions a
plain column, `WHERE` usually works; if it mentions an aggregate like
`COUNT(*)` or `SUM(...)`, you need `HAVING`.

Same six-row `users` table again.

**Your task:** return only the countries with more than one user, along with
the count, as `total`.

**You'll practice:**

- Filtering grouped results with `HAVING`
- Using an aggregate inside a `HAVING` condition

```lesson
{
  "language": "sql",
  "setup": "CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, country TEXT, age INTEGER);\nINSERT INTO users (id, name, country, age) VALUES\n  (1, 'Ana', 'Georgia', 28),\n  (2, 'Luka', 'Georgia', 34),\n  (3, 'Marta', 'Spain', 22),\n  (4, 'Ben', 'USA', 41),\n  (5, 'Elin', 'Georgia', 25),\n  (6, 'Sam', 'Spain', 37);",
  "starterCode": "-- Return only countries with more than one user, with the count as `total`.\nSELECT country, COUNT(*) AS total FROM users GROUP BY country;",
  "solution": "SELECT country, COUNT(*) AS total FROM users GROUP BY country HAVING COUNT(*) > 1;",
  "hints": ["HAVING goes after GROUP BY.", "The condition is the same COUNT(*) you're already selecting.", "COUNT(*) > 1 keeps groups with 2 or more rows."]
}
```
