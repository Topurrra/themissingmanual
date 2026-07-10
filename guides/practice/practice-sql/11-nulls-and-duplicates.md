---
title: "Messy data: NULLs and duplicate names"
guide: practice-sql
phase: 11
summary: "Use COALESCE to show a fallback value instead of NULL, and watch out for the classic NULL comparison gotcha."
tags: [sql, null, coalesce, duplicates]
difficulty: intermediate
synonyms:
  - sql coalesce example
  - handle null values in sql
  - null vs empty string sql
  - sql default value for missing data
updated: 2026-07-10
---

# Messy data: NULLs and duplicate names

Real tables are messier than the ones you've queried so far. Values go missing
(`NULL`), and two completely different people can share the same `name`.
Neither breaks SQL, but both need handling - a raw `NULL` looks bad in a
report, and a duplicate name is not a safe way to identify a row.

`COALESCE(a, b)` returns `a` if it isn't `NULL`, otherwise it falls back to
`b`. Chain in a third or fourth argument and it keeps falling back until
something isn't `NULL`. It's the standard way to turn a missing value into a
sensible default before you display it.

There's a new `people` table: `id`, `name`, `country`. One row has no
`country` on file, and two different people are both named `Sam`.

⚠️ **Gotcha.** `NULL` breaks `!=` the same way it breaks `=`. `WHERE country !=
'USA'` looks like it should return everyone *not* from the USA - but any row
where `country` is `NULL` gets silently dropped too, because `NULL != anything`
isn't false, it's `NULL`, and `WHERE` only keeps rows where the condition is
true. To actually match or exclude missing values, you need `IS NULL` /
`IS NOT NULL` alongside your comparison.

**Your task:** return each person's `name` and their `country`, showing
`'Unknown'` instead of `NULL` for anyone with no country on file.

**You'll practice:**

- Replacing `NULL` with a fallback value using `COALESCE`
- Recognizing why `NULL` needs special handling instead of a normal comparison

```lesson
{
  "language": "sql",
  "setup": "CREATE TABLE people (id INTEGER PRIMARY KEY, name TEXT, country TEXT);\nINSERT INTO people (id, name, country) VALUES\n  (1, 'Sam', 'Canada'),\n  (2, 'Sam', 'Germany'),\n  (3, 'Priya', 'India'),\n  (4, 'Wei', NULL),\n  (5, 'Noah', 'USA');",
  "starterCode": "-- Return each person's name and country, showing 'Unknown' instead of NULL.\nSELECT name, country FROM people;",
  "solution": "SELECT name, COALESCE(country, 'Unknown') AS country FROM people;",
  "hints": ["COALESCE(country, 'Unknown') returns country when it's set, and 'Unknown' when it's NULL.", "You don't need a WHERE clause - COALESCE runs on every row, right in the SELECT list.", "The two Sams keep their own rows; COALESCE only changes what's shown for a missing country, not which rows come back."]
}
```
