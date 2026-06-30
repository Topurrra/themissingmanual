---
title: "Production Reality"
guide: flyway-database-migrations
phase: 3
summary: "Version-control your database schema with Flyway: numbered, immutable migration files applied in order, so every environment ends up with the exact same schema."
tags: [flyway, migrations, database, schema, sql, devops]
difficulty: intermediate
synonyms:
  - flyway baseline existing database
  - flyway failed migration recovery
  - flyway rollback
  - flyway repair
  - flyway production
  - flyway clean danger
updated: 2026-06-30
---

# Production Reality

Everything up to now assumed a clean world: an empty database, a tidy folder of migrations, every command succeeding. Production is not that world. You'll adopt Flyway on a database that's already years old. A migration will blow up halfway through at 2am. Someone will ask you to "roll back" and you'll have to explain why that word doesn't mean what they think. This phase is about those moments, because how a tool behaves when things go wrong is what actually decides whether you trust it.

## Adopting an existing database: baseline

Here's the most common first stumble. You introduce Flyway to a database that already has fifty tables in it, built up over years by hand. You write `V1__...sql` to create your first new table and run `flyway migrate`. Flyway looks at the empty history table, concludes nothing has ever run, and tries to apply V1 from scratch - against a database that already has those objects. Chaos.

The fix is **baselining**: telling Flyway "this existing database is the starting line; consider everything up to this version as already done."

```console
$ flyway baseline -baselineVersion=1 -baselineDescription="legacy schema"

Creating Schema History table "public"."flyway_schema_history" ...
Successfully baselined schema with version: 1
```

*What just happened:* Flyway created its history table and inserted a single special row marking version 1 as the baseline - a `Baseline` type row, not a real migration. From now on Flyway treats versions at or below the baseline as pre-existing and only applies migrations *above* it. So you'd name your first real change `V2__...` and up. The years of hand-built schema stay exactly as they are; Flyway picks up the story from here.

```text
+-----------+---------+---------------+----------+---------+
| Category  | Version | Description   | Type     | State   |
+-----------+---------+---------------+----------+---------+
| Baseline  | 1       | legacy schema | BASELINE | Baseline|
| Versioned | 2       | add tax field | SQL      | Pending |
+-----------+---------+---------------+----------+---------+
```

*What just happened:* version 1 is the baseline marker (the old hand-built schema), and V2 is your first Flyway-managed change, pending. You only baseline once, when you first adopt Flyway on a populated database.

## When a migration fails mid-flight

A migration runs real SQL, and real SQL fails - a typo, a constraint violation, a column that already exists. What Flyway does next depends heavily on your database, and this is the single most important production detail to understand.

```console
$ flyway migrate

Migrating schema "public" to version "4 - add status column"
ERROR: Migration V4__add_status_column.sql failed
SQL State  : 42701
Error Code : 0
Message    : ERROR: column "status" of relation "orders" already exists
```

*What just happened:* V4 failed. The crucial question is what state your database is in now, and the answer is: it depends on whether your database supports **transactional DDL**.

- **Postgres** wraps DDL in transactions. A failed migration is rolled back as a unit - the database is left as if V4 never ran, and no failed row is recorded. You fix the SQL and re-run. Clean.
- **MySQL, Oracle** (older versions) do *not* fully support transactional DDL. A migration that does three `ALTER`s and fails on the third leaves the first two applied. The database is now half-migrated, and Flyway records a failed entry it won't run past until you sort it out.

> This is not a Flyway quirk - it's a property of your database engine, and Flyway is honest about it. The practical takeaway: on databases without transactional DDL, **keep each migration small and ideally single-statement**, so "it failed halfway" has the smallest possible blast radius.

When you do end up with a recorded failure on a non-transactional database, you fix the SQL (or manually undo the partial work) and then run `flyway repair`:

```console
$ flyway repair

Repaired failed migration entry for version 4.
```

*What just happened:* `repair` cleans up the failed-migration bookkeeping in the history table so Flyway will attempt the (now-corrected) migration again on the next `migrate`. `repair` also re-syncs checksums for migrations whose files legitimately changed. It does **not** touch your actual data - it only fixes Flyway's records of what happened.

## The rollback truth: forward-fix, not undo

Now the conversation everyone eventually has. A bad migration went out. Someone says "roll it back." Here's the reality you need to hold firmly: **Flyway does not give you a free, automatic undo, and you should be suspicious of any tool that claims to.**

The reason isn't laziness - it's that a true undo is often impossible. If V5 ran `DROP COLUMN phone_number`, the data in that column is gone. No `undo` script can conjure it back. If V6 transformed a million rows, reversing the transform may not be lossless. The forward direction destroyed information the backward direction would need.

So the production-grade answer is the **forward fix**: when a migration causes a problem, you don't rewind history - you write the *next* migration that corrects it.

```sql
-- V5__add_status_to_orders.sql  (the change that caused trouble)
ALTER TABLE orders ADD COLUMN status TEXT NOT NULL DEFAULT 'unknown';

-- V6__fix_status_default.sql  (the forward fix, a NEW migration)
ALTER TABLE orders ALTER COLUMN status SET DEFAULT 'pending';
UPDATE orders SET status = 'pending' WHERE status = 'unknown';
```

*What just happened:* V5 shipped a bad default. Instead of editing V5 (forbidden - it already ran) or trying to undo it, you ship V6 to correct it. The history table now reads V5 then V6, which is the literal truth of what happened to the database. This keeps every environment converging and keeps your migration history an honest, append-only log. (Flyway's commercial editions do offer scripted `U` undo migrations, but even there you write the reversal SQL yourself - there is no magic.)

> Design migrations to make forward-fixing easy: prefer additive changes, and split risky changes into stages. To remove a column safely, first stop writing to it (one deploy), then drop it in a later migration once you're sure nothing breaks - so a bad step is always recoverable by *not proceeding*, rather than by reversing.

## The one command to fear: clean

Flyway has a command called `flyway clean`. It drops every object in the configured schema - tables, data, everything - leaving it empty.

```console
$ flyway clean
Successfully dropped pre-schema database level objects (...)
Successfully cleaned schema "public" (execution time 00:00.213s)
```

*What just happened:* your schema is now empty. Gone. `clean` is genuinely useful in disposable environments - wiping a local dev database or a CI database between test runs to start fresh. It is also a loaded gun pointed at production. Modern Flyway ships with `flyway.cleanDisabled=true` by default for exactly this reason. **Leave clean disabled everywhere except throwaway databases, and never give a production connection a path to it.**

## Putting it together

Production Flyway is mostly three disciplines. Baseline once when you adopt it on an existing database. Keep migrations small so a mid-flight failure on a non-transactional database has a tiny blast radius, and reach for `repair` to clean up the bookkeeping when one does fail. And treat history as append-only: you fix forward with a new migration, you never rewind. Do those three things and Flyway stops being a tool you wrestle and becomes the boring, reliable layer it's meant to be - the one part of your deploy you stop worrying about.

For the wider why behind these patterns - expand/contract migrations, online schema changes, zero-downtime deploys - [/guides/database-migrations] goes deeper on the strategy that applies no matter which migration tool you use.

```quiz
[
  {
    "q": "You're adopting Flyway on a database that already has dozens of hand-built tables. What's the first step?",
    "choices": ["Run flyway clean to start fresh", "Run flyway baseline to mark the existing schema as the starting version", "Write V1 to recreate every existing table", "Run flyway repair"],
    "answer": 1,
    "explain": "baseline records the existing schema as the starting line so Flyway only applies migrations above the baseline version, leaving the legacy schema untouched."
  },
  {
    "q": "A migration shipped a bad default. What's the production-correct way to fix it?",
    "choices": ["Edit the original migration and re-run it", "Run an automatic Flyway undo", "Write a new, higher-versioned migration that corrects the problem", "Delete the migration's history row"],
    "answer": 2,
    "explain": "Applied migrations are immutable and true undo is often impossible (dropped data is gone). You fix forward with a new migration, keeping history an honest append-only log."
  },
  {
    "q": "Why does a failed migration leave a Postgres database clean but can leave a MySQL database half-migrated?",
    "choices": ["Flyway behaves differently per vendor by choice", "Postgres supports transactional DDL so a failed migration rolls back as a unit; older MySQL does not", "MySQL ignores the history table", "Postgres runs migrations twice for safety"],
    "answer": 1,
    "explain": "Transactional DDL is a database-engine property. Postgres rolls a failed migration back atomically; engines without it can leave partial changes, so keep those migrations small."
  }
]
```

[← Phase 2: The Everyday Loop](02-the-everyday-loop.md) · [Overview](_guide.md)
