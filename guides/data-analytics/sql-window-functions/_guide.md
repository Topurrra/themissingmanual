---
title: "SQL Window Functions"
guide: sql-window-functions
phase: 0
summary: "The analyst superpower: running totals, rankings, and row-to-row comparisons without collapsing rows. OVER, PARTITION BY, and lag and lead."
tags: [sql, window-functions, analytics, ranking, running-total]
category: data-analytics
order: 8
difficulty: intermediate
synonyms: [sql window functions, sql running total, partition by, row_number vs rank, lag lead sql, moving average sql, top n per group sql, over clause sql]
updated: 2026-06-30
---

# SQL Window Functions

You know how to `GROUP BY`. But the moment a question is "what's each row's rank within its group?" or "how does this row compare to the one before it?" or "show me a running total alongside every line," `GROUP BY` lets you down — it crushes your rows into summaries and throws away the detail you wanted to keep. Window functions are the fix. They run the same kind of math across a set of related rows but leave every row standing, with its answer attached.

This is the feature that separates people who *query* data from people who *analyze* it. Once it clicks, a whole class of "I'd have to do that in a spreadsheet" problems becomes one line of SQL.

## How to read this

Read the three phases in order — they build on each other. Phase 1 gives you the mental model that makes everything else obvious: a window function adds a column without removing a row. Phase 2 is the working core you'll use daily. Phase 3 is the patterns that look like magic until you've seen them once. Run the SQL examples in any database that supports windows (PostgreSQL, SQLite 3.25+, MySQL 8+, SQL Server, BigQuery, DuckDB) — that's nearly all of them now.

## The phases

1. [The window, not the group](01-the-window-not-the-group.md) — what a window function actually is, and why it doesn't collapse rows
2. [OVER, PARTITION BY, ORDER BY](02-over-partition-order.md) — the everyday core: ranking, running totals, comparing to the previous row
3. [Frames, moving averages, and top-N-per-group](03-frames-and-top-n.md) — the deeper payoff and the patterns that earn their keep

[Phase 1: The window, not the group](01-the-window-not-the-group.md) →
