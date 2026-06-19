---
title: "Primary Keys"
guide: "relationships-and-keys"
phase: 2
summary: "A primary key is the one column whose value uniquely and permanently names each row, so the rest of the database has a stable thing to point at; auto-incrementing numbers usually beat real-world values for the job."
tags: [databases, primary-key, surrogate-key, natural-key, auto-increment, data-modeling]
difficulty: beginner
synonyms: ["what is a primary key", "natural vs surrogate key", "what makes a good primary key", "should i use auto increment id", "why not use email as primary key"]
updated: 2026-06-19
---

# Primary Keys

In Phase 1 you split one big table into `customers` and `orders`, and each order pointed at its customer
with a number: "this order belongs to customer 1." That whole arrangement rests on one quiet assumption —
that "customer 1" reliably means *one specific row*, today and forever. The column that makes that
assumption true is the **primary key**.

It's a small idea with a big job: it's how every row in your database gets a name that nothing else can
claim and nothing can change out from under it.

## What a primary key actually is

**What it actually is.** A primary key is the column (occasionally a couple of columns together) whose
value is the official, unique name for each row in a table. Give the database a primary key value and it
can find exactly one row — never zero by accident, never two.

**Why it exists.** A table without a way to name a single row is a bag of rows you can only describe
vaguely ("the customer called Ada" — but what if there are two?). The primary key turns "that one over
there, roughly" into "row 1, precisely." That precision is what lets other tables point at this one, and
what lets *you* update or delete one specific record without disturbing its neighbors.

Here's our `customers` table with the primary key called out:

```text
  customers
  ┌──────┬───────────────┬──────────────────┐
  │ id   │ name          │ email            │
  ├──────┼───────────────┼──────────────────┤
  │  1   │ Ada Lovelace  │ ada@example.com  │
  │  2   │ Grace Hopper  │ grace@example.com│
  │  3   │ Alan Turing   │ alan@example.com │
  └──┬───┴───────────────┴──────────────────┘
     │
     └─ PRIMARY KEY: unique for every row, and it never changes.
        "customer 2" means this exact row, permanently.
```

## The two rules a primary key must obey

A value earns the right to be a primary key only if it satisfies both of these, always:

**1. Unique — no two rows may share it.** If two customers could both be "id 2," then "customer 2" is
ambiguous and every pointer to it is broken. The database *enforces* this for you: try to insert a second
row with an existing primary key and it refuses.

```sql
INSERT INTO customers (id, name, email)
VALUES (2, 'Katherine Johnson', 'katherine@example.com');
```

```text
  ERROR:  duplicate key value violates unique constraint "customers_pkey"
  DETAIL: Key (id)=(2) already exists.
```

*What just happened:* the database checked whether `id` 2 was already taken, saw Grace Hopper sitting
there, and rejected the insert before it could create a second "customer 2." The primary key is a promise
the database keeps on your behalf — and this is it keeping the promise.

**2. Stable — it must never change.** Other tables (and reports, and bookmarks, and integrations) are
out there holding this value as a pointer. If you change a customer's primary key, every pointer aimed at
the old value is now aimed at nothing. So a primary key, once assigned, is for life.

⚠️ **A primary key can never be empty.** "No value" — `NULL` in database terms — isn't a name; it's the
absence of one. A row with no primary key can't be referred to, so the database forbids `NULL` in a
primary key column entirely. Every row gets a real name, no exceptions.

## Natural vs. surrogate: where does the value come from?

So a primary key must be unique and unchanging. The big design question is *what to use for it* — and
there are two schools.

📝 **Natural key.** A value that already exists in the real world and happens to identify the thing — a
person's email, a book's ISBN, a country code. You're reusing a real attribute as the name.

📝 **Surrogate key.** A value with no meaning outside the database, invented purely to be the name —
almost always an auto-incrementing integer (`1, 2, 3, …`), sometimes a UUID. "Surrogate" because it
stands in *for* the row without describing it.

Let's hold a natural key up to the two rules and watch it struggle. Email feels like a great identifier —
surely no two customers share one?

- **Unique?** Today, maybe. But people share family emails, and businesses recycle them. Risky.
- **Stable?** This is where it falls apart. People *change their email all the time.* The moment Ada
  updates hers, her "name" changes — and remember from Phase 1, every order pointed at that customer.
  Change a natural primary key and you've broken every link to the row. The very thing you needed to be
  permanent is the thing most likely to move.

This is why most tables reach for a **surrogate auto-increment key** instead:

```text
  customers
  ┌──────┬───────────────┬──────────────────────┐
  │ id   │ name          │ email                │
  ├──────┼───────────────┼──────────────────────┤
  │  1   │ Ada Lovelace  │ ada.lovelace@new.com │ ← email changed...
  │  2   │ Grace Hopper  │ grace@example.com    │
  └──────┴───────────────┴──────────────────────┘
     ▲
     └─ id stayed 1 through the email change. Every pointer still works.
```

The `id` has no real-world meaning, which is exactly its strength: a meaningless number has no reason to
ever change. Ada can change her name, her email, her everything — `id` 1 stays `id` 1, and all the orders
pointing at customer 1 stay correctly attached.

💡 **The rule of thumb.** When in doubt, use a surrogate auto-increment integer `id`. It's unique by
construction (the database hands out the next number itself) and stable by nature (it means nothing, so
nothing makes it change). Reserve natural keys for values that are genuinely fixed for all time — like an
ISO country code — and even then, many teams still add a surrogate `id` for peace of mind.

## How you actually declare one

You don't enforce uniqueness and non-emptiness by hand — you tell the database "this is the primary key"
and it does the guarding forever after. In SQL that's the `PRIMARY KEY` declaration, and the
auto-increment part means you don't even supply the value:

```sql
CREATE TABLE customers (
    id    SERIAL PRIMARY KEY,
    name  TEXT NOT NULL,
    email TEXT NOT NULL
);

INSERT INTO customers (name, email) VALUES ('Ada Lovelace', 'ada@example.com');
INSERT INTO customers (name, email) VALUES ('Grace Hopper', 'grace@example.com');

SELECT * FROM customers;
```

```text
  ┌────┬───────────────┬──────────────────┐
  │ id │ name          │ email            │
  ├────┼───────────────┼──────────────────┤
  │  1 │ Ada Lovelace  │ ada@example.com  │
  │  2 │ Grace Hopper  │ grace@example.com│
  └────┴───────────────┴──────────────────┘
```

*What just happened:* `SERIAL PRIMARY KEY` told the database two things at once — *number these rows
automatically* and *this column is the primary key.* You never typed an `id`; the database assigned `1`,
then `2`, on its own, and from now on it will reject any duplicate or empty `id`. (`SERIAL` is
PostgreSQL's spelling; MySQL writes `AUTO_INCREMENT`, SQLite uses `INTEGER PRIMARY KEY` — the idea is
identical.)

Try a self-contained version you can run — declare a primary key, add rows, and read them back:

```sql runnable
CREATE TABLE members (
  id   INTEGER PRIMARY KEY,
  name TEXT
);
INSERT INTO members (id, name) VALUES (1, 'Ada'), (2, 'Grace'), (3, 'Alan');
SELECT * FROM members;
```
*What just happened:* `id INTEGER PRIMARY KEY` told the database this column is each row's unique,
permanent name. The three rows went in, each with its own `id`, and the `SELECT` reads them back —
every member now has a stable handle the rest of a schema could point at.

**Why this saves you later.** Every time you fix one specific record, link one table to another, or
de-duplicate a messy import, you're leaning on the primary key. A table with a clean surrogate key is one
you can reason about; a table keyed on something that drifts (an email, a name) is a slow-motion bug
that surfaces the day someone's details change.

## Recap

1. **A primary key is the unique, permanent name for each row** — give the database its value and it
   finds exactly one row.
2. **Two rules, always:** *unique* (no duplicates — the database enforces it) and *stable* (it must
   never change, because other things point at it). It also can never be empty (`NULL`).
3. **Natural key** = a real-world value (email, ISBN). Tempting, but real-world values change, and
   changing a key breaks everything pointing at it.
4. **Surrogate key** = a meaningless invented value, usually an **auto-increment integer**. Its lack of
   meaning is its strength: nothing ever forces it to change.
5. **Default to a surrogate `id`** unless you have a value that's truly fixed forever.

Now that every row has a dependable name, the next phase is the other half of a relationship: the column
in *another* table that holds that name and points back — the **foreign key**.

---

[← Phase 1: Why Split Data Into Tables](01-why-split-data-into-tables.md) · [Guide overview](_guide.md) · [Phase 3: Foreign Keys & Referential Integrity →](03-foreign-keys-and-referential-integrity.md)
