---
title: "JSONB: read fields out of a JSON column"
guide: practice-postgres
phase: 1
summary: "Use the ->> operator to pull a field out of a JSONB column as text."
tags: [postgres, jsonb, json, arrow-operator]
difficulty: intermediate
synonyms:
  - postgres jsonb example
  - jsonb arrow operator
  - extract field from json column sql
  - postgres json ->>
updated: 2026-07-10
---

# JSONB: read fields out of a JSON column

Standard SQL columns hold one value each: a name, an age, a price. Real data
doesn't always fit that shape - a product might have a handful of optional
attributes that vary from row to row (`color`, `wireless`, `size`...), and
adding a column for every possible attribute gets unwieldy fast. Postgres's
`JSONB` column type stores a whole JSON document in one column, so each row
can carry its own shape.

To pull a value back out, Postgres gives you two arrow operators. `->` returns
the value as JSON (useful when you're nesting further into an object or
array). `->>` returns it as plain text - what you want anywhere you're
displaying the value or comparing it as a string.

You have a `products` table with columns `id`, `name`, and `attrs` (a `JSONB`
column). Every product's `attrs` has a `"color"` key.

**Your task:** return each product's `name` and its color (from `attrs`), as
`color`.

**You'll practice:**

- Pulling a field out of a `JSONB` column with `->>`
- Knowing when to reach for `->>` (text) instead of `->` (JSON)

```lesson
{
  "language": "postgres",
  "setup": "CREATE TABLE products (id INTEGER PRIMARY KEY, name TEXT, attrs JSONB);\nINSERT INTO products (id, name, attrs) VALUES\n  (1, 'Keyboard', '{\"color\": \"black\", \"wireless\": true}'),\n  (2, 'Mouse', '{\"color\": \"white\", \"wireless\": false}'),\n  (3, 'Monitor', '{\"color\": \"black\", \"wireless\": false}');",
  "starterCode": "-- attrs is a JSONB column with a \"color\" key on every row.\n-- Pull it out as plain text, aliased as color.\nSELECT name, attrs FROM products;",
  "solution": "SELECT name, attrs->>'color' AS color FROM products;",
  "hints": ["attrs->>'color' pulls the color key out of the JSON as plain text - the double arrow is the one you want here.", "attrs->'color' (single arrow) would give you back JSON instead of text - that matters once you're nesting further, not for a plain value like this.", "Alias it so the column heading is clean: attrs->>'color' AS color."]
}
```
