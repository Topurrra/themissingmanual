---
title: "The everyday loop"
guide: golang-migrate-and-atlas
phase: 2
summary: "Database migrations for Go and beyond: golang-migrate's plain up/down SQL files versus Atlas's declarative, diff-the-desired-state approach."
tags: [golang-migrate, atlas, migrations, sql, database, go, tooling]
difficulty: intermediate
synonyms: ["golang-migrate tutorial", "atlas migrations tutorial", "go database migrations", "declarative vs versioned migrations", "atlas schema diff", "golang-migrate up down", "imperative vs declarative migrations", "golang-migrate vs atlas"]
updated: 2026-06-30
---

# The everyday loop

The mental model is set. Now the muscle memory. The daily rhythm with both tools is the same shape — create a change, apply it, sometimes undo it — but the commands and the feel are different. We'll do golang-migrate first because it maps directly to the imperative model, then Atlas in both its versioned and declarative modes.

Throughout, the connection string is a URL. For golang-migrate's CLI you'll often set it once:

```bash
export DATABASE_URL="postgres://app:secret@localhost:5432/app?sslmode=disable"
```

*What just happened:* you put the database location in one place so the commands below stay short. Both tools read connection details from a URL like this; the scheme (`postgres://`, `mysql://`, `sqlite://`) tells them which driver to use.

## golang-migrate: create

A migration is a numbered pair of files. The CLI scaffolds both:

```console
$ migrate create -ext sql -dir migrations -seq add_users_table
.../migrations/000001_add_users_table.up.sql
.../migrations/000001_add_users_table.down.sql
```

*What just happened:* `-seq` gave you zero-padded sequential numbers (`000001`) instead of a timestamp — a clean, readable order. `-ext sql` set the file extension; `-dir` chose where they land. You now have two empty files to fill in.

Fill them in with the change and its reversal:

```sql
-- 000001_add_users_table.up.sql
CREATE TABLE users (
  id    BIGSERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE
);

-- 000001_add_users_table.down.sql
DROP TABLE users;
```

## golang-migrate: apply and roll back

```console
$ migrate -database "$DATABASE_URL" -path migrations up
1/u add_users_table (18.4ms)
```

*What just happened:* golang-migrate looked at its bookkeeping table (`schema_migrations`) in your database, saw version 0, and ran every `up` file after that in order — here, only migration 1. It then recorded the new current version as 1. Run it again and nothing happens, because there's nothing newer.

To undo, you step *down* by a count:

```console
$ migrate -database "$DATABASE_URL" -path migrations down 1
1/d add_users_table (12.1ms)
```

*What just happened:* `down 1` ran exactly one `down` file — the most recent applied migration's reversal — and rolled the recorded version back to 0. Plain `down` with no number rolls back *everything*, which is rarely what you want; always pass a count.

You can also jump to a specific version or check where you are:

```console
$ migrate -database "$DATABASE_URL" -path migrations version
1
$ migrate -database "$DATABASE_URL" -path migrations goto 1
```

*What just happened:* `version` printed the current recorded version; `goto N` migrated up or down as needed to land exactly on version N. This is the imperative model in action — everything keys off that integer counter.

## golang-migrate: from Go code

The same migrations can run from inside your service at startup, which many teams prefer over a separate CLI step. The library embeds the files and applies them:

```go
import (
    "github.com/golang-migrate/migrate/v4"
    _ "github.com/golang-migrate/migrate/v4/database/postgres"
    _ "github.com/golang-migrate/migrate/v4/source/file"
)

m, err := migrate.New("file://migrations", databaseURL)
if err != nil { log.Fatal(err) }
if err := m.Up(); err != nil && err != migrate.ErrNoChange {
    log.Fatal(err)
}
```

*What just happened:* `m.Up()` did exactly what the CLI's `up` did, from inside your program. The two blank imports register the Postgres driver and the file source — golang-migrate's drivers are opt-in, so you import only what you use. Note the `ErrNoChange` check: when there's nothing new to apply, `Up()` returns that sentinel error, and treating it as fatal would crash every clean boot.

## Atlas: versioned mode (the familiar shape)

Atlas can work like golang-migrate — generating versioned files you commit — but with a twist: it can *author the SQL for you* by diffing your desired schema against the migration history.

You keep a desired-state file and ask Atlas for the next migration:

```console
$ atlas migrate diff add_users_table \
    --dir "file://migrations" \
    --to "file://schema.sql" \
    --dev-url "docker://postgres/16/dev"
Generated migrations/20260630090000_add_users_table.sql
```

*What just happened:* Atlas replayed your existing migrations onto a throwaway dev database (`--dev-url`), compared the result against `schema.sql`, and *wrote the SQL for the difference* into a new timestamped migration file. You get a versioned, committable file like golang-migrate, but you didn't hand-write the `CREATE TABLE` — you edited the desired schema and Atlas produced the step. Applying it is then ordinary:

```console
$ atlas migrate apply \
    --dir "file://migrations" \
    --url "$DATABASE_URL"
Migrating to version 20260630090000 (1 migration in total):
  -- migrating version 20260630090000
    -> CREATE TABLE users (...);
  -- ok (9.2ms)
```

*What just happened:* Atlas applied the pending versioned files in order and recorded them in its own tracking table (`atlas_schema_revisions`). Same destination as golang-migrate's `up`, reached through generated rather than hand-written SQL.

## Atlas: declarative mode (skip the files)

In declarative mode there are no migration files at all. You keep only the desired schema and let Atlas reconcile reality to it:

```console
$ atlas schema apply \
    --url "$DATABASE_URL" \
    --to "file://schema.sql" \
    --dev-url "docker://postgres/16/dev"
-- Planned Changes:
ALTER TABLE users ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT now();
Apply changes? [y/N] y
```

*What just happened:* you added one line to `schema.sql` (a `created_at` column), and Atlas computed the single `ALTER TABLE` needed to make the live database match. There's no migration file to write or name — the schema file *is* the source of truth. The `[y/N]` prompt is the safety gate: you read the plan, then approve. In CI you'd pass `--auto-approve`, but only after a separate review of the plan.

> Pick one mode per project and commit. Mixing hand-edited golang-migrate files with Atlas declarative apply against the same database is how you get two tools fighting over the same schema and neither one trusting its own bookkeeping.

## In the wild

A common, sane setup: **Atlas versioned mode** as the team default — you edit a desired schema, Atlas generates reviewable SQL files, and those files apply identically in CI and prod. You get the readability of declarative *authoring* with the audit trail and predictability of committed versioned files. Pure declarative `schema apply` shines for prototyping and internal tools where the schema file as single source of truth is worth more than a file-by-file history. golang-migrate stays the lean choice when you want zero magic — every line of SQL is one you wrote and can point to.

```quiz
[
  {
    "q": "In golang-migrate, what does `migrate ... down` with no number do?",
    "choices": [
      "Rolls back exactly one migration",
      "Rolls back every applied migration",
      "Does nothing without a confirmation flag",
      "Rolls back to the previous timestamp"
    ],
    "answer": 1,
    "explain": "Bare `down` reverses everything. To undo a single step you must pass a count, e.g. `down 1`."
  },
  {
    "q": "What does `atlas migrate diff` produce?",
    "choices": [
      "A live ALTER applied immediately to production",
      "A new versioned migration file containing the SQL to reach the desired schema",
      "A backup of the current database",
      "A report with no files written"
    ],
    "answer": 1,
    "explain": "`migrate diff` compares the migration history (replayed on the dev database) against the desired schema and writes a new committable migration file."
  },
  {
    "q": "Why does the golang-migrate Go example check for `migrate.ErrNoChange`?",
    "choices": [
      "Because Up() always fails the first time",
      "Because Up() returns that sentinel when there is nothing to apply, and treating it as fatal would crash a clean boot",
      "Because it confirms the database URL is valid",
      "Because it rolls back on error automatically"
    ],
    "answer": 1,
    "explain": "When no new migrations exist, Up() returns ErrNoChange. You filter it out so a fully-migrated service can start normally."
  }
]
```

[← Phase 1: Two philosophies of change](01-two-philosophies.md) | [Overview](_guide.md) | [Phase 3: Production reality](03-production-reality.md) →
