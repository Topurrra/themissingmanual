---
title: "Asking for Data: SELECT ... FROM"
guide: "querying-basics-select-where"
phase: 1
summary: "Every query starts from the same shape — SELECT which columns FROM which table. Learn to pick specific columns vs. grab everything with *, and how to read the rows-and-columns result set you get back."
tags: [sql, select, from, columns, result-set, queries, beginner-friendly]
difficulty: beginner
synonyms: ["what does SELECT do in sql", "select from table sql", "select all columns sql", "select star meaning", "how to read sql results", "sql query basics"]
updated: 2026-06-19
---

# Asking for Data: SELECT ... FROM

A database is, at heart, a set of tables — and a table is just a grid: columns across the top
(the *kinds* of things you store), rows going down (one row per actual thing). A query is you
pointing at that grid and saying "give me *these* columns, from *that* table." That's it. Master that
one sentence and you've got the spine of every `SELECT` you'll ever write.

Let's meet the table we'll use for the whole guide. Picture a `users` table like this:

```text
 id │ name           │ email                 │ city        │ age │ created_at
────┼────────────────┼───────────────────────┼─────────────┼─────┼────────────
  1 │ Ada Lovelace   │ ada@example.com       │ London      │  36 │ 2026-01-04
  2 │ Grace Hopper   │ grace@example.com     │ New York    │  41 │ 2026-01-09
  3 │ Alan Turing    │ alan@example.com      │ London      │  29 │ 2026-02-15
  4 │ Katherine J.   │ kat@example.com       │ Hampton     │  52 │ 2026-03-01
  5 │ Linus T.       │ linus@example.com     │ Portland    │  33 │ 2026-03-22
```

📝 **Terminology.** A **column** is one labeled slot every row has (`name`, `age`). A **row** (also
called a **record**) is one complete entry — one user. A **table** is the whole grid. When you query,
you choose which columns you want back and the database hands you matching rows.

## The query shape: `SELECT ... FROM ...`

**What it actually is.** A `SELECT` query is a request with two essential parts: *what* you want
(the columns) and *where it lives* (the table). You read it almost like English: "SELECT name, email
FROM users" means "get me the name and email columns, from the users table."

**What it does in real life.** The database finds the table, walks its rows, and returns a fresh grid
containing only the columns you asked for. It doesn't change anything — `SELECT` only reads. You can
run it as many times as you like with zero risk.

**A real example.**
```sql
SELECT name, email
FROM users;
```
```text
 name           │ email
────────────────┼───────────────────────
 Ada Lovelace   │ ada@example.com
 Grace Hopper   │ grace@example.com
 Alan Turing    │ alan@example.com
 Katherine J.   │ kat@example.com
 Linus T.       │ linus@example.com
```
*What just happened:* You asked for two columns, `name` and `email`, from `users`. The database gave
back every row, but *only those two columns* — the `id`, `city`, `age`, and `created_at` values are
still in the table, you just didn't ask for them, so they're not in the result. The result you get
back is itself a little grid: this rows-and-columns answer is called the **result set**.

📝 **Terminology.** The grid a query returns is the **result set** — a temporary table of rows that
matched, built just to answer your question. It vanishes once you've read it; it doesn't live in the
database.

The semicolon `;` at the end marks where your statement finishes. Some tools require it, others are
forgiving — it's a good habit to always include it, especially once you start running several
statements at once.

## Picking columns vs. grabbing everything with `*`

**What it actually is.** The `*` (say "star") is a shortcut meaning "every column in this table." Instead
of listing column names, you let the database fill them all in for you.

**What it does in real life.** `SELECT *` returns every column for the matching rows — handy when you're
exploring a table and want to see what's even in there.

**A real example.**
```sql
SELECT *
FROM users;
```
```text
 id │ name           │ email                 │ city        │ age │ created_at
────┼────────────────┼───────────────────────┼─────────────┼─────┼────────────
  1 │ Ada Lovelace   │ ada@example.com       │ London      │  36 │ 2026-01-04
  2 │ Grace Hopper   │ grace@example.com     │ New York    │  41 │ 2026-01-09
  3 │ Alan Turing    │ alan@example.com      │ London      │  29 │ 2026-02-15
  4 │ Katherine J.   │ kat@example.com       │ Hampton     │  52 │ 2026-03-01
  5 │ Linus T.       │ linus@example.com     │ Portland    │  33 │ 2026-03-22
```
*What just happened:* The `*` told the database "don't make me name them — give me all the columns."
You got the entire table back, every column, every row. Same rows as before; you just widened what
came back.

⚠️ **Gotcha.** `SELECT *` is great for poking around by hand, but reach for named columns in real code
(an app, a script, a saved report). Two reasons that bite later: (1) it pulls back columns you don't
need, including possibly large or sensitive ones, which is wasteful; and (2) if someone later adds or
reorders columns in the table, code that relied on `SELECT *` and the old column order can quietly
break. Naming the columns you want is a small act of kindness to future-you.

💡 **Key point.** Every `SELECT` answers the question "*which columns*, from *which table*?" List the
columns to be precise, or use `*` to grab them all while exploring. Either way, you get back a result
set — a grid of rows — and the underlying table is untouched.

## Reading the result set

When a query comes back, read it the same way every time: the **header row** at the top tells you which
columns you got and in what order; each row underneath is one matching record. If your `SELECT` listed
columns in a particular order, the result honors that order — `SELECT email, name` puts `email` first,
even though it sits second in the table. The database gives you the columns *in the order you asked*,
not the order they're stored.

```sql
SELECT email, name
FROM users;
```
```text
 email                 │ name
───────────────────────┼────────────────
 ada@example.com       │ Ada Lovelace
 grace@example.com     │ Grace Hopper
 alan@example.com      │ Alan Turing
 kat@example.com       │ Katherine J.
 linus@example.com     │ Linus T.
```
*What just happened:* Same data, same rows — but because you wrote `email` first in the `SELECT`, the
result set leads with `email`. The order of names in your `SELECT` list controls the order of columns
in the answer.

One thing you've surely noticed: every example so far returned *all five rows*. That's because we
haven't told the database to narrow things down yet. Asking for "all the rows" is fine on a five-row
table; on a table with millions of rows, you'll want to filter. That's exactly what the next phase is
about.

## Recap

1. A query asks "**which columns**, from **which table**?" — that's the `SELECT ... FROM` shape.
2. `SELECT name, email FROM users;` returns only the columns you name, for every row.
3. `SELECT *` returns **every column** — perfect for exploring, but name your columns in real code.
4. What comes back is a **result set**: a temporary grid of rows. `SELECT` only reads; it never
   changes the table.
5. The column order in your result follows the order you listed them in the `SELECT`.

You can now ask any table for any of its columns. Next, you'll learn to ask for only the *rows* you
care about — by far the most useful skill in everyday SQL.

---

[← Guide overview](_guide.md) · [Phase 2: Filtering & Sorting →](02-filtering-and-sorting.md)
