---
title: "Liquibase, From Zero"
guide: liquibase-database-migrations
phase: 0
summary: "Database migrations with Liquibase: changesets in SQL, YAML, or XML, a tracked changelog, and database-agnostic changes when you need to target more than one engine."
tags: [liquibase, database, migrations, changelog, changeset, schema, devops]
category: tooling
group: "Database Migrations"
order: 2
difficulty: intermediate
synonyms:
  - liquibase tutorial
  - liquibase changelog
  - liquibase changeset
  - liquibase vs flyway
  - liquibase rollback
  - database migrations liquibase
  - liquibase yaml changelog
updated: 2026-06-30
---

# Liquibase, From Zero

You have a database that already has tables in it, a team that keeps changing the schema, and a deploy that breaks the moment two people edit the same column. You have heard Liquibase can track all of this for you, but the first thing you saw was an XML file with twelve namespaces and you closed the tab. This guide gets you past that. We will treat Liquibase as what it actually is: a ledger of small, ordered changes that the database remembers it has run.

## How to read this

Read it in order the first time. Phase 1 builds the mental model, the changelog and the changeset, so the rest stops looking like magic. Phase 2 is the loop you will live in: write a change, run it, check status, roll back. Phase 3 is where the abstraction either pays for itself or gets in your way, contexts, labels, database-agnostic change types, and the gotchas that page you at 2am. If you already run migrations with another tool, skim Phase 1 and slow down at the contrast sections.

If migrations as a concept are new to you, read [the migrations guide](/guides/database-migrations) first; this guide assumes you know *why* you would version a schema and focuses on *how Liquibase does it*.

## The phases

1. [The mental model: changelog and changeset](01-the-changelog-and-the-changeset.md) — what Liquibase actually tracks and why it never re-runs a change.
2. [The everyday loop: write, update, status, rollback](02-the-everyday-loop.md) — the commands and changeset patterns you use daily.
3. [When the abstraction earns its keep](03-when-abstraction-earns-its-keep.md) — contexts, labels, DB-agnostic changes, and the gotchas of production.

[Phase 1: The mental model: changelog and changeset](01-the-changelog-and-the-changeset.md) →
