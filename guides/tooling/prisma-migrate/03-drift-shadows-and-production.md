---
title: "Prisma Migrate, From Zero"
guide: prisma-migrate
phase: 3
summary: "Schema-first migrations in the Node world: edit your Prisma schema, generate a migration, and keep dev and production in sync without drift."
tags: [prisma, migrations, node, typescript, database, orm, schema]
difficulty: intermediate
synonyms:
  - prisma migrate dev
  - prisma migrate deploy
  - prisma schema migrations
  - shadow database prisma
  - prisma drift detection
  - how to use prisma migrate
  - prisma migration workflow
updated: 2026-06-30
---

# Drift, shadows, and production

The everyday loop is smooth until someone reaches into the database by hand, or a migration half-fails in production, or two people generate migrations on the same day. This phase is about those moments — the ones that turn a calm Tuesday into an incident. None of them are mysterious once you understand what Prisma is checking and why.

## The shadow database, demystified

When `migrate dev` generates a migration, it needs to answer a sharp question: *does the recorded migration history actually produce the schema I wrote?* To check this without touching your real dev data, Prisma spins up a temporary, throwaway database — the **shadow database** — replays every migration into it from scratch, and compares the result against your schema.

```console
$ npx prisma migrate dev --name add_index

Prisma needs to create a shadow database...
Replaying migrations into shadow database...
Comparing against schema.prisma...

The following migration(s) have been created and applied:
  └─ 20260630140000_add_index/
```

*What just happened:* Prisma built a clean database, ran your whole migration history into it, and used that as a trustworthy reference point to compute the diff for the new migration. It's created and dropped automatically. The shadow database is *only* used by `migrate dev` — `migrate deploy` never needs one, which is good, because production database users often can't create databases.

> If your dev database user lacks permission to create a database, the shadow step fails. The fix is to point Prisma at a separate shadow database you provision yourself, via the `shadowDatabaseUrl` field in your `datasource` block. This is common on hosted Postgres where your user can't create databases.

## Drift detection: when reality diverges

**Drift** is when the actual database no longer matches what the migration history says it should be. Someone added a column in a SQL console, or restored an old backup, or edited a migration after it ran. `migrate dev` catches this and refuses to proceed quietly:

```console
$ npx prisma migrate dev

Drift detected: Your database schema is not in sync with your migration history.

[+] Added column `phone` to table `User`
```

*What just happened:* Prisma replayed history into the shadow database, compared it to your real database, and found a column in reality that no migration ever created. It stops rather than generating a migration on top of an unknown state. In development, the resolution is usually to let Prisma reset and reapply (you'll lose dev data), or to fold that manual change into a proper migration so history tells the truth again.

## The one rule: never edit an applied migration

Here is the rule that protects the whole system: **once a migration has been applied anywhere real, never change its `migration.sql`.**

Why? Because Prisma records a checksum of each migration in `_prisma_migrations`. On the next `migrate deploy`, it verifies that the file on disk still matches what was applied. Edit the file and the checksums disagree:

```console
$ npx prisma migrate deploy

Error: The migration `20260630131500_add_user_bio` was modified after it was applied.
```

*What just happened:* the on-disk file no longer matches the recorded checksum, so deploy halts. This is a feature, not an annoyance — it guarantees that what ran on production is exactly what's in your repo. If you need to change something, you add a *new* migration that alters it. History is append-only, like a ledger.

## When a migration fails halfway

In production, a migration can fail partway — a unique constraint hits existing duplicate data, a statement times out. Prisma marks that migration as failed in `_prisma_migrations`, and subsequent `migrate deploy` runs refuse to continue until you resolve it:

```console
$ npx prisma migrate resolve --rolled-back 20260630131500_add_user_bio
```

*What just happened:* you told Prisma "I manually reverted that failed migration's effects; mark it rolled back so it can be retried." Use `--applied` instead if you finished the migration's work by hand and want Prisma to consider it done. Either way, *you* fix the database state; `resolve` only updates Prisma's bookkeeping to match the reality you've restored.

> Before risky migrations on a live database, take a backup. Prisma does not roll back automatically across statements on every database, so a partial failure can leave you in a state only a human (or a backup) can sort out. Test the migration against a copy of production data first when the change touches a large or constrained table.

## A team-safe checklist

```text
- Commit schema.prisma AND the new migration folder in the same commit.
- Never run `migrate dev` against staging or production.
- Never edit a migration that has already been applied anywhere; add a new one.
- Run `migrate deploy` as a release step before new code serves traffic.
- Back up production before migrations that touch large or constrained tables.
- Rebased a branch and now have two migrations same-day? Verify their order
  by timestamp and that both still apply cleanly into a fresh database.
```

*What just happened:* every item traces back to the same idea from phase 1 — schema, history, and database must keep agreeing. Drift detection and checksums are the guardrails; this checklist is how you avoid tripping them.

## In the wild

On teams, the painful drift case is two developers each running `migrate dev` the same day on separate branches. Both migrations apply fine alone, but when both land on `main`, their timestamp order may differ from the order they were authored in. Before merging, it's worth confirming the combined set applies cleanly into a fresh database — that's exactly what the shadow database does for you locally, and what a CI step running `migrate deploy` against an empty database confirms for the team. For the deeper theory of ordering and reversibility, see [/guides/database-migrations](/guides/database-migrations).

```quiz
[
  {
    "q": "What is the shadow database used for?",
    "choices": ["Storing production backups", "Replaying migration history to safely compute a new migration's diff", "Caching query results", "Holding rolled-back migrations"],
    "answer": 1,
    "explain": "migrate dev builds a clean throwaway DB, replays all migrations, and compares to schema.prisma to generate the next migration safely."
  },
  {
    "q": "Why must you never edit a migration that has already been applied?",
    "choices": ["It makes the file too large", "Prisma verifies a checksum and deploy halts if the file changed", "The database deletes edited files", "Editing is fine if you're careful"],
    "answer": 1,
    "explain": "Each applied migration's checksum is recorded; editing the file breaks the match so deploy stops, guaranteeing repo == what ran."
  },
  {
    "q": "A production migration failed halfway. What does `prisma migrate resolve` actually do?",
    "choices": ["Automatically rolls back the SQL", "Updates Prisma's bookkeeping to match the state you fixed by hand", "Deletes the failed migration file", "Restores the last backup"],
    "answer": 1,
    "explain": "resolve only updates _prisma_migrations (marking applied or rolled-back). You restore the actual database state yourself."
  }
]
```

[← Phase 2: The everyday loop](02-the-everyday-loop.md) | [Overview](_guide.md)
