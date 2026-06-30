---
title: "golang-migrate and Atlas"
guide: golang-migrate-and-atlas
phase: 0
summary: "Database migrations for Go and beyond: golang-migrate's plain up/down SQL files versus Atlas's declarative, diff-the-desired-state approach."
tags: [golang-migrate, atlas, migrations, sql, database, go, tooling]
category: tooling
group: "Database Migrations"
order: 5
difficulty: intermediate
synonyms: ["golang-migrate tutorial", "atlas migrations tutorial", "go database migrations", "declarative vs versioned migrations", "atlas schema diff", "golang-migrate up down", "imperative vs declarative migrations", "golang-migrate vs atlas"]
updated: 2026-06-30
---

# golang-migrate and Atlas

You're shipping a Go service, the schema keeps changing, and you've hit the question every backend dev hits: how do these schema changes travel from your laptop to production in the same order, every time, without someone running SQL by hand at 2am? Two tools dominate this corner of the Go world, and they answer that question from opposite ends. golang-migrate hands you raw up/down SQL files. Atlas asks you to describe the schema you *want* and figures out the SQL for you. Neither is wrong; they fit different teams and different days.

This guide builds a working mental model of both, then walks the everyday commands, then drops you into the production reality where the differences actually start to matter.

## How to read this

Read it in order the first time. Phase 1 is the mental model that makes everything after it obvious: imperative migrations (you write each step) versus declarative migrations (you write the destination). Phase 2 is the muscle memory — creating, applying, and rolling back changes with each tool, command by command. Phase 3 is the part that costs people weekends: drift, half-applied migrations, dirty state, and how each tool keeps production honest.

If you already live in one tool and are sizing up the other, skim Phase 1 for the framing, then read Phase 2's two halves side by side.

## The phases

1. [Phase 1: Two philosophies of change](01-two-philosophies.md) — what each tool actually is, and why "write the steps" and "write the destination" are different answers to the same problem.
2. [Phase 2: The everyday loop](02-the-everyday-loop.md) — create, apply, and roll back migrations with golang-migrate and Atlas, command by command.
3. [Phase 3: Production reality](03-production-reality.md) — dirty state, drift, partial failures, and the gotchas that decide which tool you'll trust.

[Phase 1: Two philosophies of change](01-two-philosophies.md) →
