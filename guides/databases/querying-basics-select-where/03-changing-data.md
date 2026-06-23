---
title: "Changing Data: INSERT, UPDATE, DELETE"
guide: "querying-basics-select-where"
phase: 3
summary: "Add rows with INSERT, modify them with UPDATE, and remove them with DELETE — and the career-defining gotcha: an UPDATE or DELETE without a WHERE rewrites or erases every row in the table. Learn the WHERE-first habit and how transactions can undo a mistake."
tags: [sql, insert, update, delete, where, transactions, data-modification, beginner-friendly]
difficulty: beginner
synonyms: ["how to insert a row in sql", "sql update statement", "sql delete row", "update without where danger", "delete without where deleted everything", "how to add data in sql", "sql modify data"]
updated: 2026-06-19
---

# Changing Data: INSERT, UPDATE, DELETE

So far everything you've run has been safe — `SELECT` only reads, so the worst that happens is you get
the wrong rows back and try again. This phase is different. `INSERT`, `UPDATE`, and `DELETE` *change* the
table. Used carefully they're completely routine; used carelessly, one of them can ruin an afternoon (or
worse). So we'll learn the commands *and* the habit that keeps you safe — in the same breath.

Same `users` table as before:

```text
 id │ name           │ email                 │ city        │ age │ created_at
────┼────────────────┼───────────────────────┼─────────────┼─────┼────────────
  1 │ Ada Lovelace   │ ada@example.com       │ London      │  36 │ 2026-01-04
  2 │ Grace Hopper   │ grace@example.com     │ New York    │  41 │ 2026-01-09
  3 │ Alan Turing    │ alan@example.com      │ London      │  29 │ 2026-02-15
  4 │ Katherine J.   │ kat@example.com       │ Hampton     │  52 │ 2026-03-01
  5 │ Linus T.       │ linus@example.com     │ Portland    │  33 │ 2026-03-22
```

## The cheat-card: stay safe while changing data

Before the details, here's the whole survival kit. If you remember nothing else from this phase,
remember this:

| Want to... | Use | The one rule |
|---|---|---|
| Add a new row | `INSERT INTO ... VALUES ...` | Match your columns to your values, in order. |
| Change existing rows | `UPDATE ... SET ... WHERE ...` | **Write the `WHERE` first.** No `WHERE` = changes *every* row. |
| Remove rows | `DELETE FROM ... WHERE ...` | **Write the `WHERE` first.** No `WHERE` = deletes *every* row. |
| Try before you trust | Wrap in a transaction | `BEGIN;` → run it → check → `COMMIT;` or `ROLLBACK;` |

The thread running through all of it: with `UPDATE` and `DELETE`, the `WHERE` clause is not optional
decoration — it's the seatbelt. Now let's go command by command.

## `INSERT` — add a new row

**What it actually is.** `INSERT` adds one (or more) brand-new rows to a table. You tell it which columns
you're filling and what values to put in them.

**What it does in real life.** This is how data gets *into* a table — a new user signs up, a new order
is placed. `INSERT` is the gentlest of the three: it only adds, so it can't overwrite or erase existing
rows.

**A real example.**
```sql
INSERT INTO users (name, email, city, age, created_at)
VALUES ('Margaret H.', 'margaret@example.com', 'Boston', 45, '2026-06-19');
```
```text
INSERT 0 1
```
*What just happened:* You added one new user. The first part lists the columns you're filling; `VALUES`
gives the matching values *in the same order* — `name` gets `'Margaret H.'`, `email` gets the address,
and so on. The `INSERT 0 1` reply (PostgreSQL's wording) confirms one row was inserted. Run a quick
`SELECT * FROM users WHERE name = 'Margaret H.';` and you'd see her sitting in the table.

Notice we didn't set `id`. Many tables generate `id` automatically (an auto-incrementing key), so you
leave it out and let the database assign the next number. Whether yours does depends on how the table
was defined — see [Relationships & Keys](/guides/relationships-and-keys) for how that's set up.

⚠️ **Gotcha.** The columns list and the `VALUES` list must line up — same count, same order. If you
swap two values, SQL won't catch it as long as the *types* fit: putting a city where a name goes is a
perfectly valid string, so the database happily stores `'Boston'` as someone's name. Listing the column
names explicitly (rather than relying on table order) makes these mix-ups far less likely.

## `UPDATE` — change rows that already exist

**What it actually is.** `UPDATE` modifies values in rows that are *already* in the table. You say which
column(s) to change, what to change them to, and — critically — *which rows* to change.

**What it does in real life.** Someone moves city, fixes a typo in their name, changes their email.
`UPDATE` reaches into the matching rows and rewrites the values you name. Everything you don't name stays
as it was.

**A real example.**
```sql
UPDATE users
SET city = 'Cambridge'
WHERE id = 3;
```
```text
UPDATE 1
```
*What just happened:* You changed exactly one row — Alan Turing, `id = 3` — setting his `city` to
`'Cambridge'`. His other columns (`name`, `email`, `age`, `created_at`) are untouched. The `UPDATE 1`
reply tells you one row was affected, which is a number worth reading: if you expected to change one
row and it says `UPDATE 1`, good. If it says `UPDATE 5`, stop and look.

You can change several columns at once by separating them with commas:
```sql
UPDATE users
SET city = 'Cambridge', age = 30
WHERE id = 3;
```
```text
UPDATE 1
```
*What just happened:* Same single row, two columns updated together. The `SET` list can be as long as you
like; the `WHERE` still decides *which* rows it applies to.

### ⚠️ The career-defining gotcha: `UPDATE` with no `WHERE`

Here's the one that has its own genre of horror stories. Look closely at what's missing:

```sql
-- DANGER: no WHERE clause
UPDATE users
SET city = 'Cambridge';
```
```text
UPDATE 6
```
*What just happened:* With no `WHERE` to narrow it down, the `UPDATE` applied to **every single row**.
*Everyone* in the table now lives in Cambridge — Ada, Grace, Alan, Katherine, Linus, and Margaret, all
of them, overwritten in one stroke. The `UPDATE 6` is the database calmly telling you that you just
changed six rows. There's no "are you sure?" prompt. SQL did exactly what you told it to.

This is not a rare mistake or a beginner-only mistake — experienced people have wiped production tables
this way, usually while moving fast. The fix is a *habit*, not a feature:

💡 **Key point — the WHERE-first habit.** When writing an `UPDATE` or `DELETE`, type the `WHERE` clause
*before* you type the `SET` (or before you run anything). Make narrowing the rows the first thing you do,
not the last thing you remember. A second habit that pairs with it: run a `SELECT` with the *same*
`WHERE` first to see exactly which rows you're about to touch.

```sql
-- Look before you leap: see which rows the WHERE matches
SELECT id, name, city
FROM users
WHERE id = 3;
```
```text
 id │ name        │ city
────┼─────────────┼───────────
  3 │ Alan Turing │ London
```
*What just happened:* This is a dry run. You've confirmed `WHERE id = 3` matches exactly the one row you
mean to change — Alan — *before* running the `UPDATE`. Swap the `SELECT ...` for `UPDATE users SET ...`
keeping the identical `WHERE`, and you change precisely what you just previewed.

## `DELETE` — remove rows

**What it actually is.** `DELETE` removes whole rows from a table. Same shape as `UPDATE`: a `WHERE`
decides which rows go.

**What it does in real life.** A user closes their account, a record was created by mistake, old data
gets cleaned out. `DELETE` takes the matching rows out of the table entirely.

**A real example.**
```sql
DELETE FROM users
WHERE id = 5;
```
```text
DELETE 1
```
*What just happened:* The row with `id = 5` (Linus T.) is gone — removed from the table. `DELETE 1`
confirms one row was deleted. As with `UPDATE`, read that number: it's your sanity check on how much you
just removed.

### ⚠️ The same trap, sharper: `DELETE` with no `WHERE`

`DELETE` carries the identical gotcha as `UPDATE`, except the consequence is even more final — you're not
overwriting data, you're erasing it:

```sql
-- DANGER: no WHERE clause
DELETE FROM users;
```
```text
DELETE 6
```
*What just happened:* With no `WHERE`, `DELETE` removed **every row in the table**. The `users` table is
now empty — all six users gone. The table structure (the columns) still exists, but it holds nothing.
Once committed, those rows are not coming back unless you have a backup. This is the single most
expensive line in this guide, which is exactly why the cheat-card puts "write the `WHERE` first" in bold.

## Your safety net: transactions

Habits prevent most accidents. Transactions catch the rest. Here's the idea that makes changing data far
less scary.

📝 **Terminology.** A **transaction** is a group of changes the database treats as one all-or-nothing
unit. You open it with `BEGIN`, make your changes, then either `COMMIT` (make them permanent) or
`ROLLBACK` (undo everything since the `BEGIN`, as if it never happened).

**A real example.**
```sql
BEGIN;

DELETE FROM users
WHERE city = 'London';

-- Check the damage before committing:
SELECT count(*) FROM users;
```
```text
 count
───────
     4
```
*What just happened:* You opened a transaction, ran a `DELETE`, then peeked at the table. You expected to
remove the two London users (Ada and Alan), leaving four — and `count(*)` says 4. That looks right, so
you'd make it permanent:
```sql
COMMIT;
```
But suppose the count had been wrong — say it showed `0`, meaning you'd accidentally deleted everyone.
Inside a transaction, you're not stuck:
```sql
ROLLBACK;
```
*What just happened:* `ROLLBACK` undid every change since `BEGIN`. The deleted rows snap back as if the
`DELETE` never ran. This is the seatbelt working: a transaction gives you a chance to *look* before your
change becomes permanent, and a way to back out if it's wrong.

💡 **Key point.** For any `UPDATE` or `DELETE` you're even slightly unsure about, wrap it in a
transaction: `BEGIN`, run it, `SELECT` to verify, then `COMMIT` if it's right or `ROLLBACK` if it's not.
It turns "oh no" into "phew." Transactions do more than this — they're how databases keep data consistent
even when many things happen at once — and that's its own topic. See
[Transactions & ACID](/guides/transactions-and-acid) for the full picture.

⚠️ **Gotcha.** A transaction only protects you *before you commit*. Once you run `COMMIT`, the change is
permanent and `ROLLBACK` can't help. And many tools run in "autocommit" mode by default — every statement
commits instantly unless you explicitly `BEGIN` first. So the protection isn't automatic; you have to
*start* the transaction. When the change matters, type `BEGIN` first.

## Recap

1. **`INSERT INTO ... VALUES ...`** adds new rows — line your columns up with your values, in order.
2. **`UPDATE ... SET ... WHERE ...`** changes existing rows; **`DELETE FROM ... WHERE ...`** removes
   them.
3. **The big one:** an `UPDATE` or `DELETE` with **no `WHERE` hits every row** — rewriting or erasing the
   whole table, with no confirmation prompt.
4. **Write the `WHERE` first**, and `SELECT` with the same `WHERE` to preview which rows you'll touch.
   Read the affected-row count the database reports back.
5. **Wrap risky changes in a transaction:** `BEGIN` → change → `SELECT` to check → `COMMIT` or
   `ROLLBACK`. It only protects you until you commit.

You can now read data with `SELECT`, narrow it with `WHERE`, sort and limit it, and change it safely with
`INSERT`, `UPDATE`, and `DELETE`. That's the everyday core of SQL — the same handful of shapes you'll use
for years. When you're ready to pull data from more than one table at a time, head to
[SQL Joins, Explained](/guides/sql-joins-explained).

---

[← Phase 2: Filtering & Sorting](02-filtering-and-sorting.md) · [Guide overview](_guide.md)
