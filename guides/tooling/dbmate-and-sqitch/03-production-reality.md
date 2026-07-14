---
title: "Production reality"
guide: dbmate-and-sqitch
phase: 3
summary: "Lightweight, framework-agnostic database migrations: dbmate's simple timestamped SQL files and Sqitch's dependency-graph approach with verify and revert."
tags: [dbmate, sqitch, migrations, sql, database, tooling]
difficulty: intermediate
synonyms: ["dbmate tutorial", "sqitch tutorial", "plain sql migrations", "framework agnostic migrations", "database migrations without orm", "sqitch deploy revert verify", "dbmate vs sqitch"]
updated: 2026-06-30
---

# Production reality

The demos in Phase 2 always worked. Production doesn't. A migration fails halfway. Two teammates pick the same timestamp. The revert script you never tested turns out to be wrong on the day you need it. This phase is the set of failures that actually happen with plain-SQL migration tools, and how each tool helps or doesn't.

## The half-applied migration

This is the one that ruins evenings. Your migration has two statements; the first succeeds, the second fails. Where does that leave the database?

The answer depends entirely on **transactions**, and most engines wrap a migration in one by default - but not all DDL is transactional. On PostgreSQL most DDL *is* transactional, so a failed migration rolls back cleanly. On MySQL, many DDL statements (like `CREATE TABLE`, `ALTER TABLE`) cause an **implicit commit** - they can't be rolled back, so a failure mid-migration leaves the earlier statements permanently applied.

```sql
-- migrate:up
ALTER TABLE users ADD COLUMN phone TEXT;   -- on MySQL: implicitly commits
ALTER TABLE users ADD COLUMN phon TEXT;    -- typo, fails - but the first ALTER already stuck
```

*What just happened:* On PostgreSQL the whole thing rolls back and the table is untouched. On MySQL the first `ALTER` is already committed, the second errors, and now `phone` exists but the ledger has *no* record of this migration. The tool thinks the migration is pending; the database disagrees. That mismatch is the worst state to be in.

Two defenses, and use both:

- **Keep migrations small** - ideally one logical change per migration. A migration that does one thing can't be half-done.
- **Know your engine's transaction rules.** On Postgres you're mostly safe. On MySQL, assume no rollback for DDL and design so each migration is atomic on its own.

dbmate runs each migration in a transaction where the engine supports it, and lets you opt a migration out with `-- migrate:up transaction:false` when you need a statement that can't run inside one (for example, Postgres's `CREATE INDEX CONCURRENTLY`).

```sql
-- migrate:up transaction:false
CREATE INDEX CONCURRENTLY idx_users_email ON users (email);
```

*What just happened:* `CREATE INDEX CONCURRENTLY` builds an index without locking writes, but Postgres forbids it inside a transaction. The `transaction:false` flag tells dbmate to run this migration unwrapped - at the cost that if it fails partway, there's no automatic rollback. Sqitch handles the same need with `verify` plus careful scripts; some engines let you mark a Sqitch deploy script to run without a transaction in `sqitch.conf`.

## Schema drift: when the database stops matching the files

Drift is when the live schema no longer matches what your migrations describe. Someone ran an `ALTER` by hand in prod during an incident. A migration was edited *after* it was applied somewhere. A failed-but-not-recorded migration (above) left a column the ledger doesn't know about.

The ledger only tracks *which files ran*, not *whether the result still matches the files*. So drift is invisible to a naive `up` - the tool sees nothing pending and reports all clear, while the actual columns differ.

This is where dbmate's `db/schema.sql` dump earns its keep. Because dbmate rewrites that file after every migration, you can diff the committed schema against a fresh dump of production:

```bash
$ pg_dump --schema-only "$PROD_URL" > /tmp/prod-schema.sql
$ diff db/schema.sql /tmp/prod-schema.sql
```

*What just happened:* A non-empty diff means prod's actual structure has drifted from what your migrations produce. dbmate won't catch this for you - but the schema dump gives you something concrete to compare against, which a tool that only keeps a ledger does not.

Sqitch's answer to a related question is `sqitch verify`: run all verify scripts against prod and confirm each deployed change still holds. It won't catch a *new* hand-added column, but it will catch a deployed change that's been broken or partially reverted - verify scripts fail loudly when reality stops matching intent.

> The rule that prevents most drift: **never edit a migration that has been applied to any shared environment.** Once it's run on staging or prod, that file is history. Need a fix? Write a *new* migration. Editing an applied file means the ledger says "ran" while the file now says something different - drift you authored yourself.

## Timestamp collisions and merge order (dbmate)

dbmate's timestamps are per-second. Two teammates branching off the same point can create migrations seconds apart, and once both branches merge, the *filename order* may not match the order anyone deployed in. Worse, two migrations can collide if generated in the same second.

Because dbmate applies strictly by ascending timestamp, a migration with an earlier timestamp that merges *later* will sit "before" already-applied ones in the list - and dbmate won't go back and run it if a later-timestamped migration is already recorded. The fix is discipline: rebase, regenerate the timestamp on the newer migration if there's a clash, and re-run `dbmate status` after every merge to confirm what's actually pending.

This is precisely the problem Sqitch's graph sidesteps. Sqitch doesn't order by time; it orders by declared dependencies, so two independent changes merging together both deploy, and a change that requires another can't jump ahead of it regardless of when its line was added to the plan.

## Reverts you never tested are not reverts

Both tools let you write a down/revert script. Neither forces you to make it *correct*. A revert that drops a table you've since added data to, or one that's subtly wrong, is a trap that springs only during an incident - the worst possible time to discover it.

```text
the lie:    "we have rollbacks, we wrote down scripts"
the truth:  a revert is only real if you've run it against a DB shaped like prod
```

*What just happened:* Writing the script is necessary but not sufficient. The practice that makes rollback real: in CI, after applying a migration, immediately revert it and re-apply it. dbmate gives you `dbmate up && dbmate down && dbmate up`; Sqitch gives you `sqitch deploy && sqitch revert && sqitch deploy`. If that round-trip fails in CI, you found a broken revert on a calm Tuesday instead of during an outage.

And be clear-eyed about what revert *can't* undo: a migration that dropped a column and lost its data cannot be reverted into existence. For destructive changes, the real rollback plan is a backup and a forward-fix migration, not a `down` script. Reverts handle structural mistakes, not data loss.

## In the wild: where they sit in a pipeline

Both tools are single commands with no application runtime, so they slot anywhere - a CI step, a Kubernetes init container, a line in a deploy script. The common shape: run migrations as a discrete, gated step *before* the new app version starts, never lazily on first request. Gate prod migrations behind the same review as code. And whichever tool you choose, the non-negotiables are the same across every migration tool: small atomic changes, never edit applied migrations, and test your reverts. For the broader strategy of safe schema change - expand/contract, backfills, zero-downtime sequencing - see [/guides/database-migrations](/guides/database-migrations).

```quiz
[
  {
    "q": "Why is a failed migration especially dangerous on MySQL compared to PostgreSQL?",
    "choices": ["MySQL has no ledger table", "Many MySQL DDL statements implicitly commit and can't be rolled back, leaving a half-applied state", "MySQL ignores timestamps", "PostgreSQL can't run migrations at all"],
    "answer": 1,
    "explain": "MySQL DDL like CREATE/ALTER TABLE causes implicit commits, so a mid-migration failure leaves earlier statements applied with no ledger record - a drift you didn't intend."
  },
  {
    "q": "What is the single rule that prevents most self-inflicted schema drift?",
    "choices": ["Always use SQLite locally", "Never edit a migration that has already been applied to a shared environment", "Always run migrations on first request", "Delete the ledger table monthly"],
    "answer": 1,
    "explain": "Once a migration has run on staging or prod it is history; fixes go in a new migration. Editing an applied file makes the ledger and the file disagree."
  },
  {
    "q": "What actually makes a revert/down script trustworthy?",
    "choices": ["Writing it at all", "Having it generated automatically", "Running the deploy-revert-redeploy round-trip in CI against a prod-shaped database", "Marking it transaction:false"],
    "answer": 2,
    "explain": "A revert is only real once you've exercised it. CI that applies, reverts, and re-applies catches broken rollbacks before an incident does."
  }
]
```

[← Phase 2](02-the-everyday-loop.md) | [Overview](_guide.md)
