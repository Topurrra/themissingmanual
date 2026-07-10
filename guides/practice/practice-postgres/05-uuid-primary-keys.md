---
title: "UUID primary keys with gen_random_uuid()"
guide: practice-postgres
phase: 5
summary: "Use a UUID column with a gen_random_uuid() default instead of an auto-incrementing integer primary key."
tags: [postgres, uuid, gen_random_uuid, primary-key]
difficulty: intermediate
synonyms:
  - postgres uuid primary key
  - gen_random_uuid example
  - uuid vs serial postgres
  - postgres generate uuid
updated: 2026-07-10
---

# UUID primary keys with gen_random_uuid()

A `SERIAL` primary key is simple and fast, but it leaks information (row
count, insert order) and it only stays unique within one table in one
database - two services each handing out their own `1, 2, 3...` will collide
the moment you try to merge their data. A `UUID` primary key sidesteps both
problems: it's a 128-bit value that's effectively guaranteed unique no matter
where or when it's generated, so services can create IDs independently and
never clash.

Postgres can generate one for you automatically with `gen_random_uuid()` as
the column's `DEFAULT` - you never have to invent an ID yourself, just leave
the column out of your `INSERT`'s column list and Postgres fills it in.

You have a `sessions` table: `id` (`UUID PRIMARY KEY DEFAULT gen_random_uuid()`),
`label`. It already has one row (`'login'`).

**Your task:** insert a new session labeled `'checkout'` - without specifying
`id` - then return the total number of sessions.

**You'll practice:**

- Letting a `DEFAULT` generate a `UUID` instead of supplying one
- Leaving a column out of an `INSERT`'s column list entirely

```lesson
{
  "language": "postgres",
  "setup": "CREATE TABLE sessions (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), label TEXT);\nINSERT INTO sessions (label) VALUES ('login');",
  "starterCode": "-- Insert a new session labeled 'checkout' - don't set id, the DEFAULT handles it.\n-- Then count how many sessions exist.\nSELECT COUNT(*) FROM sessions;",
  "solution": "INSERT INTO sessions (label) VALUES ('checkout'); SELECT COUNT(*) FROM sessions;",
  "hints": ["id has DEFAULT gen_random_uuid() - leave it out of your INSERT's column list entirely and Postgres fills it in.", "Two statements are fine here: the INSERT first, then the SELECT COUNT(*) that actually gets checked.", "There's 1 session already ('login') - after your insert there should be 2."]
}
```
