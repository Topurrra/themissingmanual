---
title: "Upsert: ON CONFLICT DO UPDATE"
guide: practice-postgres
phase: 6
summary: "Use INSERT ... ON CONFLICT DO UPDATE to insert a row or update it in place when it already exists, in a single statement."
tags: [postgres, upsert, on-conflict, insert]
difficulty: intermediate
synonyms:
  - postgres upsert
  - on conflict do update example
  - insert or update postgres
  - postgres on conflict
updated: 2026-07-10
---

# Upsert: ON CONFLICT DO UPDATE

Restocking an item means "insert it if it's new, update it if it already
exists" - the classic upsert. Written naively as a plain `INSERT`, it crashes
the moment the row already exists: the primary key constraint rejects the
duplicate. You could check first with a `SELECT`, then branch between
`INSERT` and `UPDATE` - but that's two round trips and a race condition if
two requests restock the same item at once.

`ON CONFLICT (column) DO UPDATE` handles it in one statement: try the insert,
and if it collides with an existing primary key (or other unique
constraint), run the given `UPDATE` instead. Inside that `UPDATE`,
`EXCLUDED` refers to the row you were trying to insert - so you can combine
it with the row already there.

You have an `inventory` table: `sku` (`TEXT PRIMARY KEY`), `qty`. It already
has one row: `('A1', 10)`.

**Your task:** insert `('A1', 3)` - since `A1` already exists, instead *add*
3 to its existing `qty` rather than crashing or overwriting it - and return
the row's final `sku` and `qty`.

**You'll practice:**

- Writing `INSERT ... ON CONFLICT (col) DO UPDATE SET ...`
- Referencing the attempted row's values with `EXCLUDED`

```lesson
{
  "language": "postgres",
  "setup": "CREATE TABLE inventory (sku TEXT PRIMARY KEY, qty INTEGER);\nINSERT INTO inventory (sku, qty) VALUES ('A1', 10);",
  "starterCode": "-- A1 already exists with qty 10. Add 3 more to it in one statement -\n-- insert if missing, update (adding to the existing qty) if present.\nINSERT INTO inventory (sku, qty) VALUES ('A1', 3);",
  "solution": "INSERT INTO inventory (sku, qty) VALUES ('A1', 3)\n      ON CONFLICT (sku) DO UPDATE SET qty = inventory.qty + EXCLUDED.qty\n      RETURNING sku, qty;",
  "hints": ["The starter code as written will error - a plain INSERT can't handle a sku that already exists. That's the problem ON CONFLICT solves.", "ON CONFLICT (sku) DO UPDATE only fires when the INSERT would violate the sku primary key - otherwise the row just inserts normally.", "EXCLUDED.qty is the value you tried to insert (3); inventory.qty is the row already there (10). Set qty = inventory.qty + EXCLUDED.qty to add them, then RETURNING sku, qty to see the result: 13."]
}
```
