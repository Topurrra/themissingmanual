---
title: "golang-migrate and Atlas"
guide: golang-migrate-and-atlas
phase: 3
summary: "Database migrations for Go and beyond: golang-migrate's plain up/down SQL files versus Atlas's declarative, diff-the-desired-state approach."
tags: [golang-migrate, atlas, migrations, sql, database, go, tooling]
difficulty: intermediate
synonyms: ["golang-migrate tutorial", "atlas migrations tutorial", "go database migrations", "declarative vs versioned migrations", "atlas schema diff", "golang-migrate up down", "imperative vs declarative migrations", "golang-migrate vs atlas"]
updated: 2026-06-30
---

# Production reality

Both tools are calm on your laptop. Production is where their differences turn into the thing you'll remember them by. This phase is the stuff that costs people weekends: what happens when a migration fails halfway, how each tool detects when the real schema has drifted from what it expects, and the decisions you'll regret if you skip them. Read this before you point either tool at a database you care about.

## golang-migrate: the dirty flag

golang-migrate's bookkeeping table, `schema_migrations`, holds two things: the current `version` and a `dirty` boolean. The dirty flag is the single most important thing to understand about this tool.

When golang-migrate starts a migration, it sets `dirty = true`. If the migration finishes, it clears the flag and bumps the version. If the migration *fails partway* — a bad `ALTER`, a constraint violation, a dropped connection — the flag stays `true`, and every future run refuses to proceed:

```console
$ migrate -database "$DATABASE_URL" -path migrations up
error: Dirty database version 3. Fix and force version.
```

*What just happened:* migration 3 died mid-flight. golang-migrate has no idea how much of it ran, so it stops and demands a human. It will not guess. This is a feature, not a bug — but it means *you* have to inspect the database, figure out what actually got applied, finish or revert it by hand, and then tell golang-migrate the truth:

```console
$ migrate -database "$DATABASE_URL" -path migrations force 3
```

*What just happened:* `force 3` cleared the dirty flag and set the recorded version to 3 — *without running any SQL*. You are asserting "the database is genuinely at version 3, trust me." Get this wrong and you'll skip or re-run a migration. The deeper lesson: golang-migrate does not wrap migrations in a transaction for you. If your database supports transactional DDL (PostgreSQL mostly does; MySQL mostly does not), the engine may roll back a failed statement — but the dirty flag is still your responsibility to clear.

> The dirty flag is golang-migrate keeping you honest. It would rather halt and make you look than silently continue on a half-applied schema. Respect it: never `force` a version without first checking the real schema with your own eyes.

## Atlas: drift and the dev database

Atlas attacks the same danger from a different angle. Because declarative mode *computes* the plan from the live database, it can also *detect* when the live database doesn't match what it expects — that's drift.

```console
$ atlas migrate apply --dir "file://migrations" --url "$DATABASE_URL"
Error: migration files mismatch: checksum of 20260630090000_add_users.sql ...
```

*What just happened:* Atlas keeps a checksum file (`atlas.sum`) over your migration directory. Someone edited an already-applied migration file, the checksum no longer matches, and Atlas refused to run rather than apply a tampered history. Editing a migration that has already shipped is the cardinal sin of versioned migrations, and Atlas turns it into a hard stop. The fix is to add a *new* migration, never to mutate an old one.

The `--dev-url` you keep passing is also a production safeguard, not a formality. Atlas uses that throwaway database to *plan and validate* a migration before it touches the real one — normalizing SQL, catching invalid statements, and computing a clean diff in a place where mistakes cost nothing.

```text
   schema.sql ──┐
                ├─► [ dev database ] ──► validated plan ──► real database
 migration dir ─┘    (throwaway)          (reviewed)         (applied)
```

*What just happened:* the dev database sits between your intent and production. Atlas rehearses there first. Skip `--dev-url` and you lose that rehearsal — Atlas can still run, but with weaker guarantees about the plan it generates.

## The destructive-change trap (declarative's sharp edge)

Declarative mode's convenience hides a real risk. When you remove a table from `schema.sql`, you are telling Atlas "this should not exist" — and Atlas will plan a `DROP TABLE` to make it so. The same goes for narrowing a column type or removing a column. The tool is doing exactly what you said; the problem is that "what you said" was a deletion you may not have meant.

```console
$ atlas schema apply --url "$DATABASE_URL" --to "file://schema.sql" --dev-url "..."
-- Planned Changes:
DROP TABLE legacy_orders;     -- ← did you mean to lose this data?
Apply changes? [y/N]
```

*What just happened:* you deleted six lines from a schema file in a pull request, and Atlas turned that into a data-destroying `DROP`. This is *the* reason you never auto-approve a declarative plan without reading it. Atlas helps here: you can run `atlas migrate lint` (or schema apply with linting) to flag destructive and risky changes in CI, so a `DROP` or a `NOT NULL` added without a default gets caught before review, not after deploy.

golang-migrate has the mirror-image risk in its `down` files. A reversal that does `DROP COLUMN` will happily destroy data if you ever roll back in production. The honest stance both tools share: **down/rollback is rarely safe to run against real data.** In production, the usual practice is roll *forward* with a new corrective migration, not roll back.

## Choosing, concretely

Here's the decision stripped to its bones:

```text
Reach for golang-migrate when:
  - you want zero generated SQL; every line is one you wrote
  - the team is comfortable owning up/down by hand
  - you value a literal, change-by-change git history

Reach for Atlas when:
  - you'd rather edit one desired schema than author each delta
  - you want generated SQL plus CI linting for destructive changes
  - you'll actually review the plans the tool produces
  - (versioned mode) you want both: generated files, committed and ordered
```

*What just happened:* the choice comes down to control versus leverage, and to whether your team will *read generated plans*. A team that auto-approves Atlas plans without looking is more dangerous than a team writing careful golang-migrate files. A team drowning in hand-written deltas is better served by Atlas generating and linting them. There's no universally right answer — there's the one that matches your review culture.

## In the wild

The pattern that survives contact with real on-call: never run rollbacks against production data, gate every migration behind code review, run `atlas migrate lint` (or your own destructive-change check) in CI, and keep migrations *small* so a failure leaves a small mess. golang-migrate's dirty flag and Atlas's checksum both exist for the same reason — to stop a tired human from applying a broken or tampered history. Treat their refusals as the tool doing its job, not an obstacle to `force` past.

For the principles underneath both tools — ordering, idempotency, forward-only discipline — see [/guides/database-migrations](/guides/database-migrations).

```quiz
[
  {
    "q": "What does golang-migrate's `dirty` flag mean, and what does `force` do?",
    "choices": [
      "Dirty means uncommitted git changes; force commits them",
      "Dirty means a migration failed partway; force sets the recorded version without running SQL, so you must verify the real schema first",
      "Dirty means the database is locked; force unlocks it and re-runs everything",
      "Dirty means a checksum mismatch; force regenerates the checksum"
    ],
    "answer": 1,
    "explain": "A failed migration leaves the database dirty. `force N` only updates the bookkeeping; you must manually confirm the schema is truly at N before using it."
  },
  {
    "q": "Why does Atlas refuse to run when a migration file's checksum doesn't match `atlas.sum`?",
    "choices": [
      "Because the database connection failed",
      "Because an already-applied migration file was edited, and applying a tampered history is unsafe",
      "Because the dev database is missing",
      "Because the file is too large"
    ],
    "answer": 1,
    "explain": "Atlas checksums the migration directory. Editing a shipped migration breaks the checksum, and Atlas hard-stops rather than apply a mutated history. Add a new migration instead."
  },
  {
    "q": "What is the key safety practice for Atlas declarative `schema apply` in production?",
    "choices": [
      "Always pass --auto-approve to avoid prompts",
      "Read and review the generated plan (and lint for destructive changes) before approving, since removing schema can plan a data-destroying DROP",
      "Delete the dev database first",
      "Run it twice to be sure"
    ],
    "answer": 1,
    "explain": "Declarative apply does exactly what the schema file says — including DROPs for things you removed. Reviewing the plan and linting for destructive changes is what keeps that safe."
  }
]
```

[← Phase 2: The everyday loop](02-the-everyday-loop.md) | [Overview](_guide.md)
