---
title: "dbmate and Sqitch"
guide: dbmate-and-sqitch
phase: 0
summary: "Lightweight, framework-agnostic database migrations: dbmate's simple timestamped SQL files and Sqitch's dependency-graph approach with verify and revert."
tags: [dbmate, sqitch, migrations, sql, database, tooling]
category: tooling
group: "Database Migrations"
order: 6
difficulty: intermediate
synonyms: ["dbmate tutorial", "sqitch tutorial", "plain sql migrations", "framework agnostic migrations", "database migrations without orm", "sqitch deploy revert verify", "dbmate vs sqitch"]
updated: 2026-06-30
---

# dbmate and Sqitch

You have a database and a problem most frameworks pretend doesn't exist: your schema changes over time, and those changes have to travel from your laptop to staging to production in the same order, every time, without anyone running a SQL file by hand and hoping. You don't have an ORM. You don't want one. You want plain SQL, version-controlled, applied predictably. That's exactly the gap these two tools fill, and they fill it in two very different ways.

This guide gives you a working mental model of both, then shows you the day-to-day commands, then walks into the parts that bite people in production.

## How to read this

Read it in order the first time. Phase 1 builds the mental model that makes everything else obvious: both tools turn schema change into ordered, repeatable SQL, but dbmate orders by timestamp and Sqitch orders by a dependency graph. Phase 2 is the muscle memory: creating, applying, and rolling back changes with each tool. Phase 3 is the production reality: drift, failed deploys mid-flight, verify scripts, and the choices you'll regret if you skip them.

If you already use one tool and are eyeing the other, you can skip to Phase 2 and read the two halves side by side.

## The phases

1. [Phase 1: Two ways to order change](01-the-mental-model.md) — what these tools actually are, and why timestamps and dependency graphs are different answers to the same question.
2. [Phase 2: The everyday loop](02-the-everyday-loop.md) — create, apply, and revert migrations with dbmate and Sqitch, command by command.
3. [Phase 3: Production reality](03-production-reality.md) — drift, half-applied deploys, verify scripts, and the gotchas that cost you a weekend.

[Phase 1: Two ways to order change](01-the-mental-model.md) →
