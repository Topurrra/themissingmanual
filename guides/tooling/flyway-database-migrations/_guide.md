---
title: "Flyway, From Zero"
guide: flyway-database-migrations
phase: 0
summary: "Version-control your database schema with Flyway: numbered, immutable migration files applied in order, so every environment ends up with the exact same schema."
tags: [flyway, migrations, database, schema, sql, devops]
category: tooling
group: "Database Migrations"
order: 1
difficulty: intermediate
synonyms:
  - flyway tutorial
  - database schema versioning
  - sql migrations flyway
  - flyway V1 V2 naming
  - flyway baseline existing database
  - flyway repeatable migrations
  - how to migrate database schema
updated: 2026-06-30
---

# Flyway, From Zero

You changed a column on your laptop, it worked, and now staging is broken because nobody else has that column. Someone ran a script by hand last Tuesday and can't remember if prod got it. Your schema lives in tribal memory and Slack screenshots, and every deploy is a small prayer. Flyway turns that mess into something boring: your schema becomes a folder of numbered SQL files that run in order, exactly once, the same way everywhere.

This guide gets you from "I have a database and some SQL" to "every environment converges on the identical schema, and I can prove which migrations ran." No magic, no ORM required, no rollback fantasies.

## How to read this

Read the phases in order. Phase 1 builds the mental model: why a schema is code, and the three rules Flyway enforces. Phase 2 is the everyday loop: writing migrations, running them, repeatable migrations. Phase 3 is production reality: baselining a database that already exists, what happens when a migration fails, and why "rollback" mostly means writing the next migration. If you only have five minutes, read Phase 1 - it's the part that changes how you think.

## The phases

1. [Phase 1: A Schema Is Code](01-schema-is-code.md) - what Flyway actually is, the history table, and the three rules
2. [Phase 2: The Everyday Loop](02-the-everyday-loop.md) - writing V-migrations, running them, repeatable migrations
3. [Phase 3: Production Reality](03-production-reality.md) - baselining, failed migrations, and the rollback truth

[Phase 1: A Schema Is Code](01-schema-is-code.md) →
