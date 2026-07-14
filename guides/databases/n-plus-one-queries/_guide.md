---
title: "The N+1 Query Problem"
guide: n-plus-one-queries
phase: 0
summary: "The ORM trap that is fast on seed data and dead in production: one query quietly becomes N+1. How to spot it and fix it."
tags: [databases, orm, performance, n+1, queries, eager-loading]
category: databases
order: 11
difficulty: intermediate
synonyms:
  - n+1 query problem
  - n plus one queries
  - orm fires too many queries
  - why is my orm slow
  - eager loading vs lazy loading
  - loop firing one query per row
updated: 2026-06-30
---

# The N+1 Query Problem

You shipped a page. It flew on your laptop with ten rows of seed data. Then production filled up, and the same page started taking four seconds, then eight, then timing out - and nothing in your code changed. The bug was there the whole time, hiding behind a line that looked completely innocent. This guide shows you exactly what that line does, how to see it, and the three ways to fix it.

## How to read this

Read it in order, once, start to finish. Phase 1 builds the mental model so the rest stops feeling like magic. Phase 2 is the day-job skill: seeing the extra queries in your own logs. Phase 3 is the fix, plus the tradeoff nobody warns you about. The examples are deliberately plain - the trap is the same whether you write Python, Ruby, PHP, Java, or JavaScript, so don't get hung up on one ORM's spelling.

## The phases

1. [What N+1 actually is](01-what-n-plus-one-is.md) - the mental model: one query, then one more per row.
2. [Seeing it in your logs](02-seeing-it-in-the-logs.md) - how to catch it red-handed with query logs and APM.
3. [Fixing it without over-fetching](03-fixing-it.md) - eager loading, the single JOIN, batching, and the tradeoff.

[Phase 1: What N+1 actually is](01-what-n-plus-one-is.md) →
