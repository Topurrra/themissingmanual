---
title: "ALTER TABLE: changing a table's shape"
guide: practice-sql
phase: 18
summary: "Add a column to an existing table with ALTER TABLE, then confirm the change by inspecting the table's own schema with PRAGMA table_info."
tags: [sql, alter-table, ddl, schema, pragma]
difficulty: intermediate
synonyms:
  - sql alter table add column
  - add not null column with default sql
  - pragma table_info example
  - change table schema sql
updated: 2026-07-10
---

# ALTER TABLE: changing a table's shape

Every lesson so far has queried tables whose shape was already fixed by
`setup`. In practice, a table's shape changes after it's created and full of
data - a new feature needs a new column. `ALTER TABLE` changes an existing
table's structure without touching the rows already in it.

```sql
ALTER TABLE users ADD COLUMN email TEXT NOT NULL DEFAULT '';
```

*What just happened:* every existing row instantly gets an `email` column set
to `''` (the default), and the `NOT NULL` means no future row can leave it
out. `ALTER TABLE` itself doesn't return any rows to look at, though - so
this lesson's task is really two statements: the `ALTER TABLE` that makes the
change, and a `SELECT` afterward that proves it happened. Only that last
statement is what gets checked, same as the transactions lesson - write both,
in order, in the same script.

`PRAGMA table_info(<table>)` is a query built into SQLite that lists a
table's columns: name, declared type, whether it's `NOT NULL`, and its
default value - a live look at the schema, right from SQL.

There's a `users` table: `id`, `name`, `age`.

**Your task:** add a `NOT NULL` column called `email` to `users` with a
default value of `''` (empty string), then run `PRAGMA table_info(users)` so
there's something to check.

**You'll practice:**

- Adding a column with `ALTER TABLE ... ADD COLUMN ... NOT NULL DEFAULT ...`
- Inspecting a table's schema with `PRAGMA table_info`
- Writing a multi-statement script where only the final query is graded

```lesson
{
  "language": "sql",
  "setup": "CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, age INTEGER);\nINSERT INTO users (id, name, age) VALUES (1, 'Ana', 28), (2, 'Luka', 34), (3, 'Marta', 22);",
  "starterCode": "-- Add a NOT NULL 'email' column (default '') to users, then show the table's schema.\nSELECT * FROM users;",
  "solution": "ALTER TABLE users ADD COLUMN email TEXT NOT NULL DEFAULT '';\nPRAGMA table_info(users);",
  "hints": ["ALTER TABLE users ADD COLUMN email TEXT NOT NULL DEFAULT ''; adds the column - it needs its own semicolon.", "ALTER TABLE returns no rows, so follow it with PRAGMA table_info(users); on its own line.", "Only the last statement's result gets graded - PRAGMA table_info(users) has to be last."]
}
```
