---
title: "Database Migrations Without Fear"
guide: "database-migrations"
phase: 0
summary: "What a migration actually is (git for your schema), the golden pattern for changing live data safely, and the dangerous migrations that lock tables or break the running app — so you can change a production schema without losing data or taking downtime."
tags: [databases, migrations, schema, sql, ddl, zero-downtime, expand-contract]
category: databases
order: 7
difficulty: intermediate
synonyms: ["what is a database migration", "how to change a database schema safely", "zero downtime schema change", "how to rename a column without downtime", "expand contract migration", "alter table locks production", "add not null column without default", "how to roll back a migration"]
updated: 2026-07-10
---

# Database Migrations Without Fear

There's a particular flavor of dread that comes with changing a database that real users are
hitting right now. The code you can roll back in seconds. The *data* — the orders, the accounts, the
thing your whole company runs on — you can't un-spill. So a schema change that felt trivial on your
laptop turns into a held breath in the deploy channel: *did that just lock the table? is the app
still up? did I lose anything?*

That dread comes from not knowing what the change is actually doing to the live system. This guide
fixes that: the mental model of what a migration *is*, the one pattern that lets you change live data
without downtime, and the specific migrations that bite people — so you see them coming instead of
discovering them in an incident.

## How to read this

- **About to ship a scary schema change right now?** Skip to [Phase 3: The Dangerous Migrations](03-the-dangerous-migrations.md)
  and check the cheat-card at the top against what you're about to run.
- **Want migrations to finally make sense?** Read in order — each phase builds on the last. Phase 1
  gives you the mental model, Phase 2 the safe pattern, Phase 3 the landmines.

## The phases

1. **[What a Migration Is](01-what-a-migration-is.md)** — a versioned, ordered change to your schema,
   checked into source control and applied identically in every environment. The "git for your
   schema" mental model, up/down (apply/rollback), and an annotated example migration.
2. **[Doing It Safely on Live Data](02-doing-it-safely-on-live-data.md)** — the golden pattern:
   additive changes first, backfill the data, then switch. The expand/contract (parallel-change)
   approach that keeps the running app working *during* a rename or type change.
3. **[The Dangerous Migrations](03-the-dangerous-migrations.md)** — the ones that bite: long locks on
   big tables, dropping or renaming columns the running app still uses, and non-nullable columns
   without defaults. Plus the two things you always want first: a rollback plan and a backup.

> Database-engine specifics (how Postgres vs. MySQL differ on locking, online-DDL tools like
> `pg_repack`, `gh-ost`, or `pt-online-schema-change`) are deliberately deferred. This guide teaches
> the patterns that hold across engines; the engine-specific tooling is a follow-up once the patterns
> are second nature.

**Related:** [Relationships and Keys](/guides/relationships-and-keys) ·
[Transactions and ACID](/guides/transactions-and-acid)
