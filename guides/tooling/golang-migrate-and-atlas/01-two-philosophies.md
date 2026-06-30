---
title: "Two philosophies of change"
guide: golang-migrate-and-atlas
phase: 1
summary: "Database migrations for Go and beyond: golang-migrate's plain up/down SQL files versus Atlas's declarative, diff-the-desired-state approach."
tags: [golang-migrate, atlas, migrations, sql, database, go, tooling]
difficulty: intermediate
synonyms: ["golang-migrate tutorial", "atlas migrations tutorial", "go database migrations", "declarative vs versioned migrations", "atlas schema diff", "golang-migrate up down", "imperative vs declarative migrations", "golang-migrate vs atlas"]
updated: 2026-06-30
---

# Two philosophies of change

Here's the situation you're actually in. Your database has a shape - tables, columns, indexes, constraints. That shape needs to change as the product grows. And the change has to be *reproducible*: the same change, in the same order, on your laptop, in CI, on staging, and finally in production. If two environments drift apart, you get the bug that only happens in prod, and you lose an afternoon proving it's a schema problem and not your code.

Every migration tool exists to make schema change ordered and repeatable. The interesting question is *what you write down*. There are two answers, and golang-migrate and Atlas each pick one.

## Imperative: write the steps

golang-migrate is **imperative**. You write each change as a pair of SQL files - one to apply the change (`up`), one to undo it (`down`). The tool keeps a counter of which migrations have run, and applying "up" means running every file you haven't run yet, in numeric order.

```text
migrations/
  000001_create_users.up.sql
  000001_create_users.down.sql
  000002_add_email_index.up.sql
  000002_add_email_index.down.sql
```

The `up` file says what to do; the `down` file says how to take it back:

```sql
-- 000002_add_email_index.up.sql
CREATE INDEX idx_users_email ON users (email);

-- 000002_add_email_index.down.sql
DROP INDEX idx_users_email;
```

*What just happened:* you described the *transition* - the exact SQL to move from one schema version to the next, and the exact SQL to reverse it. golang-migrate never inspects your database to figure out what to run; it trusts the version counter and runs the files in order. You own the correctness of every line.

The mental model: golang-migrate is a **ledger of edits**. Each migration is one entry. History is the sum of all edits applied so far. You think in *changes*.

## Declarative: write the destination

Atlas can also do versioned migrations (more on that in Phase 2), but its signature mode is **declarative**. You don't write the steps - you write the schema you *want*, and Atlas computes the steps to get there by comparing the desired schema against the current database.

You describe the destination in a schema file. Atlas supports its own HCL format and also plain SQL:

```sql
-- schema.sql - the desired state, not a migration
CREATE TABLE users (
  id    BIGINT PRIMARY KEY,
  email TEXT NOT NULL
);
CREATE INDEX idx_users_email ON users (email);
```

Then you ask Atlas to make reality match that file:

```console
$ atlas schema apply \
    --url "postgres://localhost:5432/app?sslmode=disable" \
    --to "file://schema.sql" \
    --dev-url "docker://postgres/16/dev"
-- Planned Changes:
CREATE INDEX idx_users_email ON users (email);
Apply changes? [y/N]
```

*What just happened:* Atlas inspected the live database, inspected your `schema.sql`, found the only difference (the index didn't exist yet), and generated exactly the SQL to close the gap. You never wrote `CREATE INDEX`. You said "the index should exist" and Atlas worked out the rest. The `--dev-url` points at a throwaway database Atlas spins up to safely normalize and plan the diff - it never plans against production blindly.

The mental model: Atlas declarative is a **thermostat**. You set the target; it figures out whether to heat or cool. You think in *desired state*, not in changes.

## Why the difference matters

This isn't a cosmetic distinction - it changes who is responsible for what.

```text
              IMPERATIVE                 DECLARATIVE
              (golang-migrate)           (Atlas declarative)

you write     each up/down step          the final schema
tool does     run files in order         diff current vs desired
truth lives   in the migration files     in the schema file
git diff      shows the transition       shows the destination
```

With imperative migrations, your git history reads like a changelog: "added this index", "dropped that column". You can see exactly what ran and when. The cost is that *you* write the SQL for every step, including the tricky reversals, and nothing stops two engineers from writing migrations that conflict.

With declarative migrations, your git history reads like a spec: here is what the schema should look like *now*. Reviewing a pull request means reading the desired state, not reconstructing it from a pile of deltas. The cost is that the diff is computed, so you have to *trust and review the plan* the tool generates before it touches anything - a generated plan can choose a destructive path (drop-and-recreate) when you expected a gentle one.

> Neither philosophy is "the modern one." Imperative gives you total control and a literal audit trail of edits. Declarative gives you a readable source of truth and less hand-written SQL. The right call depends on how much you trust generated plans and how much you value the changelog-style history.

## For builders

A useful way to predict which you'll reach for: **how often does your schema change in ways that are hard to express as a clean step?** If most changes are "add a column, add an index, add a table," imperative files stay short and obvious. If you maintain a large schema where you'd rather reason about the whole shape than a hundred accumulated deltas - and you have a review culture that will actually read generated plans - declarative starts paying off. Atlas also lets you run declarative *during development* to generate versioned files you commit, which is a common middle path. You'll see that in Phase 2.

For the bigger picture of why ordered, repeatable schema change matters at all, see [/guides/database-migrations](/guides/database-migrations). If Go itself is still new to you, [/guides/go-from-zero](/guides/go-from-zero) gets you to the point where golang-migrate's library mode makes sense.

```quiz
[
  {
    "q": "In golang-migrate, what does a `.down.sql` file contain?",
    "choices": [
      "The desired final state of that table",
      "The SQL to reverse the change made by its matching `.up.sql`",
      "A backup of the data before the migration",
      "The diff between the current and target schema"
    ],
    "answer": 1,
    "explain": "golang-migrate is imperative: each migration is a pair of steps, `up` to apply and `down` to reverse. You write both."
  },
  {
    "q": "What does Atlas's declarative mode do that golang-migrate does not?",
    "choices": [
      "It runs SQL files in numeric order",
      "It inspects the live database and computes the SQL needed to reach a desired schema",
      "It stores migrations as timestamped files only",
      "It refuses to apply any change without a down file"
    ],
    "answer": 1,
    "explain": "Declarative Atlas diffs current state against the desired schema you describe, then generates the steps. You write the destination, not the transition."
  },
  {
    "q": "Which statement best captures the core tradeoff between the two philosophies?",
    "choices": [
      "Imperative is faster; declarative is slower",
      "Imperative gives a literal edit history but you write every step; declarative gives a readable source of truth but you must trust the generated plan",
      "Declarative cannot be used in production",
      "Imperative only works with PostgreSQL"
    ],
    "answer": 1,
    "explain": "Imperative = changelog of steps you author. Declarative = a spec the tool diffs into steps you review. That's the real difference."
  }
]
```

[← Overview](_guide.md) | [Phase 2: The everyday loop](02-the-everyday-loop.md) →
