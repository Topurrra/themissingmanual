---
title: "JSONB: filter rows with @>"
guide: practice-postgres
phase: 2
summary: "Use the @> containment operator to filter rows by a shape inside a JSONB column, without extracting each field first."
tags: [postgres, jsonb, json, containment-operator]
difficulty: intermediate
synonyms:
  - postgres jsonb containment
  - jsonb @> operator
  - filter json column postgres
  - postgres json contains
updated: 2026-07-10
---

# JSONB: filter rows with @>

`attrs->>'wireless' = 'true'` would work for filtering on a single JSON field,
but it means comparing against the text `'true'`, not a real boolean - easy to
get subtly wrong once the JSON gets more nested. Postgres has a better tool
for "does this JSON document contain this shape": the `@>` containment
operator. `attrs @> '{"wireless": true}'` asks "does the `attrs` JSON contain
a `wireless` key set to `true`, alongside whatever else it has?" - and it
compares against the real JSON value, not text.

Same `products` table as the last lesson: `id`, `name`, `attrs` (`JSONB`,
with a `"wireless"` boolean in every row).

**Your task:** return the `name` of every product where `attrs` shows
`wireless` as `true`.

**You'll practice:**

- Filtering on a JSONB field's real type (boolean) with `@>`, not a text comparison
- Writing a JSON literal inside a SQL string

```lesson
{
  "language": "postgres",
  "setup": "CREATE TABLE products (id INTEGER PRIMARY KEY, name TEXT, attrs JSONB);\nINSERT INTO products (id, name, attrs) VALUES\n  (1, 'Keyboard', '{\"color\": \"black\", \"wireless\": true}'),\n  (2, 'Mouse', '{\"color\": \"white\", \"wireless\": false}'),\n  (3, 'Monitor', '{\"color\": \"black\", \"wireless\": false}');",
  "starterCode": "-- Return the name of every product where attrs shows wireless: true.\nSELECT name, attrs FROM products;",
  "solution": "SELECT name FROM products WHERE attrs @> '{\"wireless\": true}';",
  "hints": ["@> means \"contains\" - the JSONB column on the left must contain the JSON shape on the right, other keys are ignored.", "The right side is a JSON literal written inside a single-quoted SQL string: '{\"wireless\": true}' - the outer quotes are SQL, the inner ones are JSON.", "Only Keyboard has wireless: true - Mouse and Monitor both have it set to false."]
}
```
