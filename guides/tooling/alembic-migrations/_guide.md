---
title: "Alembic, From Zero"
guide: alembic-migrations
phase: 0
summary: "Schema migrations for Python and SQLAlchemy with Alembic: autogenerate from your models, review the diff, and apply with upgrade/downgrade."
tags: [alembic, sqlalchemy, migrations, python, database, schema]
category: tooling
group: "Database Migrations"
order: 3
difficulty: intermediate
synonyms:
  - alembic tutorial
  - sqlalchemy migrations
  - alembic autogenerate
  - alembic revision upgrade downgrade
  - how to use alembic
  - alembic multiple heads
updated: 2026-06-30
---

# Alembic, From Zero

You changed a model in your SQLAlchemy code, the table in the database still has the old shape, and now they disagree. Your app boots, then explodes the first time it touches that column. Alembic is the tool that keeps your models and your real database in step, version by version, with a paper trail you can move forward and backward through.

The thing that trips everyone up is autogenerate. It reads your models, looks at the database, and writes a migration for you. It feels like magic, and most of the time it is right. But it quietly misses things, and if you ship its output without reading it, it will eventually drop a column you meant to keep or skip a change you needed. This guide teaches you to drive it, not trust it blind.

## How to read this

Read the three phases in order. Phase 1 builds the mental model: what a migration is, how Alembic pairs with SQLAlchemy, and why a version table on the database is the whole trick. Phase 2 is the daily loop you will actually run: edit a model, autogenerate, review, upgrade. Phase 3 is the reality of a team: the autogenerate trap in detail, plus branching, multiple heads, and merging them back together.

If you want the vendor-neutral picture of why migrations exist at all, the companion guide [Database Migrations](/guides/database-migrations) covers the concept across tools. This guide is the SQLAlchemy-specific one.

## The phases

1. [The version table is the whole idea](01-the-version-table-is-the-whole-idea.md) - what a migration is and how Alembic tracks where your database is.
2. [The daily loop: autogenerate, review, upgrade](02-the-daily-loop.md) - the workflow you run every time a model changes.
3. [The autogenerate trap, heads, and merges](03-the-autogenerate-trap-and-heads.md) - what autogenerate misses, and how branching and merging work on a team.

[Phase 1: The version table is the whole idea](01-the-version-table-is-the-whole-idea.md) →
