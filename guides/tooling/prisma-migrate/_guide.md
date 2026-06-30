---
title: "Prisma Migrate, From Zero"
guide: prisma-migrate
phase: 0
summary: "Schema-first migrations in the Node world: edit your Prisma schema, generate a migration, and keep dev and production in sync without drift."
tags: [prisma, migrations, node, typescript, database, orm, schema]
category: tooling
group: "Database Migrations"
order: 4
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

# Prisma Migrate, From Zero

You changed your `schema.prisma`, your editor is happy, your types check, and then your app blows up at runtime because the database never got the memo. Prisma's schema is a description of what you *want*; the database is what you *have*; migrations are the bridge between them. This guide makes that bridge boring and predictable so you stop guessing whether dev and production actually match.

By the end you'll know which command to run where, what that mysterious shadow database is for, and why editing an already-applied migration is the one thing that quietly wrecks a team.

## How to read this

Read it in order the first time. Phase 1 builds the mental model (schema as source of truth, what a migration actually is) and the rest won't click without it. Phase 2 is the loop you'll run every day. Phase 3 is the stuff that bites you on a real team with a real production database, so don't skip it before you ship.

If you've never touched a migration tool before, the sibling guide [/guides/database-migrations](/guides/database-migrations) explains the idea independent of any one tool, and [/guides/how-an-orm-works](/guides/how-an-orm-works) explains what Prisma is doing underneath.

## The phases

1. [Schema is the source of truth](01-schema-is-the-source-of-truth.md) - what Prisma Migrate actually is, and what a migration file really contains.
2. [The everyday loop](02-the-everyday-loop.md) - `migrate dev`, `migrate deploy`, and the workflow you'll repeat hundreds of times.
3. [Drift, shadows, and production](03-drift-shadows-and-production.md) - the shadow database, drift detection, failed migrations, and the rules that keep a team sane.

[Phase 1: Schema is the source of truth](01-schema-is-the-source-of-truth.md) →
