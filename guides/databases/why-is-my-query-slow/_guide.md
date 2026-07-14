---
title: "Why Is My Query Slow? (Indexes & EXPLAIN)"
guide: "why-is-my-query-slow"
phase: 0
summary: "A query that's instant on your laptop crawls in production because the database is reading every row to find matches; an index lets it jump straight to them, and EXPLAIN lets you see which one is happening."
tags: [databases, sql, indexes, explain, query-performance, b-tree]
category: databases
order: 5
difficulty: intermediate
synonyms: ["why is my sql query slow", "why is my query fast on my laptop but slow in prod", "what is a database index", "how do indexes work", "how to read explain", "what is a full table scan", "how to speed up a slow query", "what does seq scan mean"]
updated: 2026-07-10
---

# Why Is My Query Slow? (Indexes & EXPLAIN)

You wrote a query. On your laptop, against a few hundred rows of test data, it returned instantly. You shipped it. Then production - with ten million real rows - turned that same query into a thirty-second hang, a timeout, a page at 2am. Nothing about the *query* changed. The only thing that changed was the size of the table.

This is the most common performance surprise in all of databases, and it has a single, learnable cause. Once you understand the one mental model behind it, most "my query is slow" problems stop being mysteries and become a short checklist: see exactly what the database is doing, understand *why* it's slow, and fix it with a precise change instead of guessing.

## How to read this

- **In a hurry, query already slow?** Skim [Phase 1](01-the-full-table-scan.md) for the cause, then jump to [Phase 3: Reading EXPLAIN](03-reading-explain.md) to diagnose your actual query and add the right index.
- **Want it to finally make sense?** Read in order. Each phase builds on the last: the problem (Phase 1), the fix (Phase 2), and how to see both with your own eyes (Phase 3).

## The phases

1. **[The Full-Table Scan](01-the-full-table-scan.md)** - why a query that's instant on 100 rows crawls on 10 million. Without help, the database reads *every row* to find your matches. This one idea explains most slowness.
2. **[Indexes](02-indexes.md)** - what an index actually is: a separate, sorted structure that lets the database jump straight to matching rows, like the index at the back of a book. How to create one, and the real cost of having too many.
3. **[Reading EXPLAIN](03-reading-explain.md)** - how to *see* what the database is doing. Reading `EXPLAIN` and `EXPLAIN ANALYZE`, telling a scan from an index lookup, comparing estimated vs. actual rows, and spotting the missing index. Then: measure, fix, re-check.

> This guide is about the everyday 90% - the slow query you can fix by understanding scans and adding the right index. Deep profiling (composite-index ordering, partial and covering indexes, query-planner tuning, lock contention) is a future *performance* topic; we'll point there when it's the right next step.

Related reading: [SQL Joins Explained](/guides/sql-joins-explained) and [Relationships & Keys](/guides/relationships-and-keys) - joins and keys are exactly the columns you'll most often want to index.
