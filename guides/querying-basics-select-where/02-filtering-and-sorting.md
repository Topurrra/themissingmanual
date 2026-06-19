---
title: "Filtering & Sorting: WHERE, ORDER BY, LIMIT"
guide: "querying-basics-select-where"
phase: 2
summary: "Narrow a query to the rows you actually want with WHERE (=, >, LIKE, IN, AND/OR), put them in order with ORDER BY, and take only the top few with LIMIT — plus the NULL trap that means you must use IS NULL, not = NULL."
tags: [sql, where, order-by, limit, like, in, null, filtering, sorting, beginner-friendly]
difficulty: beginner
synonyms: ["how to filter rows in sql", "sql where clause explained", "sql like operator", "sql order by", "sql limit", "why does = NULL not work", "sql is null", "and or in sql query"]
updated: 2026-06-19
---

# Filtering & Sorting: WHERE, ORDER BY, LIMIT

Returning every row was fine when the table had five of them. Real tables don't. You almost never want
*all* the users — you want the ones in London, or the ones over 40, or the single most recently created
account. This phase is where SQL gets genuinely useful: you describe the rows you want, and the database
finds them for you.

We'll keep working with the same `users` table from Phase 1:

```text
 id │ name           │ email                 │ city        │ age │ created_at
────┼────────────────┼───────────────────────┼─────────────┼─────┼────────────
  1 │ Ada Lovelace   │ ada@example.com       │ London      │  36 │ 2026-01-04
  2 │ Grace Hopper   │ grace@example.com     │ New York    │  41 │ 2026-01-09
  3 │ Alan Turing    │ alan@example.com      │ London      │  29 │ 2026-02-15
  4 │ Katherine J.   │ kat@example.com       │ Hampton     │  52 │ 2026-03-01
  5 │ Linus T.       │ linus@example.com     │ Portland    │  33 │ 2026-03-22
```

## `WHERE` — keep only the rows that match

**What it actually is.** `WHERE` is a filter. You give it a condition — a true-or-false test — and the
database checks every row against it, keeping only the rows where the test comes out true.

**What it does in real life.** It's the difference between "all users" and "users I care about." You add
it after `FROM`, and from then on the query only sees matching rows.

**A real example.**
```sql
SELECT name, city
FROM users
WHERE city = 'London';
```
```text
 name           │ city
────────────────┼────────
 Ada Lovelace   │ London
 Alan Turing    │ London
```
*What just happened:* The database tested each row's `city` against `'London'`. Rows 1 and 3 passed; the
rest failed, so they're not in the result. Note the single quotes around `'London'` — text values go in
**single quotes** in SQL. Numbers don't: you'd write `WHERE age = 36`, no quotes.

📝 **Terminology.** A **condition** (or *predicate*) is the true/false test in a `WHERE`. `city =
'London'` is true for some rows, false for others; `WHERE` keeps the true ones.

### Comparison operators: `=`, `>`, `<`, and friends

The most common tests compare a column to a value:

| Operator | Means | Example |
|---|---|---|
| `=` | equals | `WHERE age = 41` |
| `<>` or `!=` | not equal to | `WHERE city <> 'London'` |
| `>` | greater than | `WHERE age > 40` |
| `<` | less than | `WHERE age < 30` |
| `>=` | greater than or equal | `WHERE age >= 36` |
| `<=` | less than or equal | `WHERE age <= 33` |

```sql
SELECT name, age
FROM users
WHERE age > 40;
```
```text
 name           │ age
────────────────┼─────
 Grace Hopper   │  41
 Katherine J.   │  52
```
*What just happened:* The test `age > 40` was true only for Grace (41) and Katherine (52), so those are
the two rows you got. Everyone 40 or younger was filtered out.

### `LIKE` — match part of a text value

**What it actually is.** `LIKE` is for "contains" or "starts with" style matching on text, using `%` as
a wildcard meaning "any run of characters (including none)."

**A real example.**
```sql
SELECT name, email
FROM users
WHERE email LIKE '%@example.com';
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
*What just happened:* `%@example.com` means "anything, followed by `@example.com`." Every address ends
that way, so every row matched. `'A%'` would mean "starts with capital A"; `'%lan%'` would mean
"contains `lan` anywhere." The `%` is the workhorse here.

⚠️ **Gotcha.** `LIKE` matching is often case-sensitive — but whether it is depends on your database and
its settings. In some setups `'a%'` won't match `Ada`. If a `LIKE` returns fewer rows than you expect,
case is the first thing to check.

### `IN` — match any value from a list

**What it actually is.** `IN` is a tidy shorthand for "equals any of these." Instead of stringing
together `city = 'London' OR city = 'Portland'`, you write the list once.

**A real example.**
```sql
SELECT name, city
FROM users
WHERE city IN ('London', 'Portland');
```
```text
 name           │ city
────────────────┼──────────
 Ada Lovelace   │ London
 Alan Turing    │ London
 Linus T.       │ Portland
```
*What just happened:* `IN ('London', 'Portland')` matched any row whose `city` is either of those two.
It's the same result you'd get from `city = 'London' OR city = 'Portland'`, just shorter and easier to
read as the list grows.

### Combining conditions with `AND` / `OR`

**What it actually is.** `AND` means "both must be true"; `OR` means "at least one must be true." You
chain conditions together to describe more specific rows.

**A real example.**
```sql
SELECT name, city, age
FROM users
WHERE city = 'London' AND age < 35;
```
```text
 name           │ city    │ age
────────────────┼─────────┼─────
 Alan Turing    │ London  │  29
```
*What just happened:* A row had to pass *both* tests — be in London *and* be under 35. Ada is in London
but she's 36, so she failed the second test and dropped out. Only Alan satisfied both.

⚠️ **Gotcha.** When you mix `AND` and `OR` in one `WHERE`, `AND` binds tighter than `OR` — so
`A OR B AND C` is read as `A OR (B AND C)`, which is often *not* what you meant. When in doubt, add
parentheses to say exactly what you mean: `(A OR B) AND C`. Parentheses cost nothing and remove all
ambiguity.

## The `NULL` trap — use `IS NULL`, never `= NULL`

This one confuses *everybody* the first time, so let's name it clearly.

📝 **Terminology.** `NULL` is SQL's way of saying "no value here — unknown / not set." It is **not** zero,
and **not** an empty string. It's the absence of a value.

Here's the part that trips people: in SQL, `NULL` is not equal to anything — not even to another `NULL`.
The reasoning is that `NULL` means "unknown," and "is one unknown thing equal to another unknown thing?"
can't honestly be answered *yes*. So any comparison *with* `NULL` using `=` comes out as "unknown," which
`WHERE` treats as not-a-match.

That means this **does not work** the way it looks:
```sql
-- WRONG: this returns no rows, even if some emails are missing
SELECT name
FROM users
WHERE email = NULL;
```
```text
 name
──────
(0 rows)
```
*What just happened:* `email = NULL` is never true (it's "unknown" for every row), so `WHERE` kept
nothing. You got zero rows even if missing emails exist. No error — just silently empty, which is exactly
why this bites people.

To actually test for missing values, SQL gives you `IS NULL` (and `IS NOT NULL`):
```sql
-- RIGHT: this finds rows where email has no value
SELECT name
FROM users
WHERE email IS NULL;
```
*What just happened:* `IS NULL` is the proper test for "this value is absent." Use `IS NULL` to find
missing values and `IS NOT NULL` to find present ones. (Our sample `users` all have emails, so this
returns no rows here — but on a table with gaps, this is how you find them.)

💡 **Key point.** Never compare to `NULL` with `=`, `<>`, `>`, etc. — those always come out "unknown."
Use `IS NULL` / `IS NOT NULL`. The day a query mysteriously returns nothing, ask yourself: "am I
accidentally comparing against NULL?"

## `ORDER BY` — put the rows in order

**What it actually is.** Without `ORDER BY`, the database is free to hand back matching rows in *any*
order it finds convenient — you can't rely on it. `ORDER BY` lets you say "sort the result by this
column."

**A real example.**
```sql
SELECT name, age
FROM users
ORDER BY age DESC;
```
```text
 name           │ age
────────────────┼─────
 Katherine J.   │  52
 Grace Hopper   │  41
 Ada Lovelace   │  36
 Linus T.       │  33
 Alan Turing    │  29
```
*What just happened:* `ORDER BY age DESC` sorted by `age`, highest first. `DESC` means descending
(big → small); `ASC` means ascending (small → big), and ascending is the default if you write neither.
So `ORDER BY age` alone would put Alan (29) at the top.

⚠️ **Gotcha.** If you want a dependable order, you *must* say so with `ORDER BY`. Rows coming back "in
order" without it is luck, not a guarantee — and that luck can change when the data or the database does.

## `LIMIT` — take only the first few rows

**What it actually is.** `LIMIT` caps how many rows come back. Paired with `ORDER BY`, it answers "the
top N" questions — the newest order, the five highest scores, the oldest account.

**A real example.**
```sql
SELECT name, created_at
FROM users
ORDER BY created_at DESC
LIMIT 3;
```
```text
 name           │ created_at
────────────────┼────────────
 Linus T.       │ 2026-03-22
 Katherine J.   │ 2026-03-01
 Alan Turing    │ 2026-02-15
```
*What just happened:* You sorted by `created_at` newest-first, then `LIMIT 3` kept only the first three.
That's the three most recently created users. Without the `ORDER BY`, "the first 3" would be
meaningless — `LIMIT` takes the first rows *of whatever order you've established*, so it almost always
travels with `ORDER BY`.

📝 **Terminology note.** `LIMIT` is what PostgreSQL, MySQL, and SQLite use. SQL Server uses `TOP`
(`SELECT TOP 3 ...`) and Oracle has its own syntax (`FETCH FIRST 3 ROWS ONLY`). The idea is identical
everywhere; the keyword differs by database. We'll use `LIMIT` throughout.

## The order of the clauses

These pieces always go in the same order. The database expects this sequence, and writing them out of
order is a syntax error:

```text
  SELECT   columns        ← what you want
  FROM     table          ← where it lives
  WHERE    condition       ← which rows to keep
  ORDER BY column          ← how to sort them
  LIMIT    n               ← how many to take
```

Not every query needs every clause — but when they appear together, this is the order. A useful way to
read it: pick the table, filter to the rows you want, sort them, then take the top few.

## Recap

1. **`WHERE`** keeps only rows where a condition is true. Text values go in `'single quotes'`; numbers
   don't.
2. Compare with `=`, `<>`, `>`, `<`, `>=`, `<=`; match text patterns with **`LIKE`** and `%`; match a
   list with **`IN`**; combine with **`AND`** / **`OR`** (parenthesize when you mix them).
3. **`NULL` is not equal to anything** — use **`IS NULL`** / **`IS NOT NULL`**, never `= NULL`.
4. **`ORDER BY`** sorts the result (`ASC` default, `DESC` for reverse); without it, order isn't
   guaranteed.
5. **`LIMIT n`** takes the first `n` rows — pair it with `ORDER BY` to get a meaningful "top N."
6. The clauses go in a fixed order: `SELECT → FROM → WHERE → ORDER BY → LIMIT`.

You can now read exactly the data you want. Next comes the other half of SQL — *changing* it — where the
stakes go up and one missing word can rewrite an entire table. We'll make sure it never catches you.

---

[← Phase 1: Asking for Data](01-asking-for-data.md) · [Guide overview](_guide.md) · [Phase 3: Changing Data →](03-changing-data.md)
