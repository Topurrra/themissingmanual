---
title: "RETURNING: get the row back from an INSERT"
guide: practice-postgres
phase: 4
summary: "Use RETURNING on an INSERT to get the inserted row's generated columns back in the same statement, instead of a separate SELECT."
tags: [postgres, returning, insert, serial]
difficulty: intermediate
synonyms:
  - postgres returning clause
  - insert returning id
  - get id after insert postgres
  - returning insert example
updated: 2026-07-10
---

# RETURNING: get the row back from an INSERT

You insert a new order and need its `id` right away - to link a payment
record to it, to show it in a confirmation message, whatever comes next. The
`id` column is `SERIAL`, so the database picks its value; without `RETURNING`
you'd have to run a second query afterward to find it (and, depending on what
else is happening, you can't always be sure which row is "the one you just
inserted"). `RETURNING` solves this by handing the row straight back as part
of the `INSERT` itself.

(SQLite added its own `RETURNING` clause a few years after Postgres - so this
isn't exclusive to Postgres today, but it's the exact same idea Postgres
popularized, and it's worth knowing either way.)

You have an `orders` table: `id` (`SERIAL PRIMARY KEY`), `item`, `amount`.

**Your task:** insert a new order for `'Notebook'` at amount `5`, and return
its generated `id` and `item` in the same statement.

**You'll practice:**

- Adding `RETURNING` to an `INSERT`
- Getting a generated column's value without a follow-up `SELECT`

```lesson
{
  "language": "postgres",
  "setup": "CREATE TABLE orders (id SERIAL PRIMARY KEY, item TEXT, amount INTEGER);\nINSERT INTO orders (item, amount) VALUES ('Book', 15), ('Pen', 3);",
  "starterCode": "-- Insert a new order for 'Notebook' at amount 5, then look at what came back.\nINSERT INTO orders (item, amount) VALUES ('Notebook', 5);",
  "solution": "INSERT INTO orders (item, amount) VALUES ('Notebook', 5) RETURNING id, item;",
  "hints": ["RETURNING goes at the end of the INSERT - list the columns you want handed back, the same way you'd list them in a SELECT.", "id is SERIAL, so Postgres assigns it - RETURNING is how you find out what it assigned without a second query.", "The starter code inserts the row but throws away the result - add RETURNING id, item to the same statement."]
}
```
