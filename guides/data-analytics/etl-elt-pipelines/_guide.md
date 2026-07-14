---
title: "ETL & ELT Pipelines, Explained"
guide: "etl-elt-pipelines"
phase: 0
summary: "What a data pipeline actually is, the difference between transforming before or after you load, and what it takes to make a scheduled pipeline run reliably instead of just running."
tags: [etl, elt, data-pipelines, orchestration, data-engineering]
category: data-analytics
order: 3
difficulty: intermediate
synonyms: ["what is etl", "etl vs elt", "what is a data pipeline", "extract transform load explained", "how do data pipelines work", "what is pipeline orchestration", "what is a dag in data engineering", "idempotent pipeline", "data pipeline backfill"]
updated: 2026-06-19
---

# ETL & ELT Pipelines, Explained

Somewhere between "we have data in a few places" and "the dashboard updates itself every morning," a pipeline appeared. Maybe you inherited one - a tangle of scripts, a scheduler nobody fully understands, a Slack channel that lights up red at 6am. Maybe you're being asked to build one and the acronyms (ETL? ELT? DAG?) are flying past faster than you can pin them down.

Here's the reassuring part: underneath the jargon, a data pipeline is a small set of plain ideas. Data gets pulled out of where it lives, reshaped into something usable, and written where people can actually use it. Everything else - the tools, the schedulers, the "modern data stack" - is detail layered on top of those three moves.

This guide installs the mental model first, then shows you the one design choice that splits the whole field (transform *before* loading, or *after*), and finally what separates a pipeline that "ran" from one that ran *correctly*.

## How to read this
- **Need the ETL-vs-ELT answer right now?** Jump to [Phase 2: ETL vs ELT](02-etl-vs-elt.md) - it leads with the difference and the trade-off.
- **Want it to finally make sense?** Read in order. Each phase builds on the last: the three stages, then the order swap, then making it run reliably.

## The phases
1. **[Extract, Transform, Load](01-extract-transform-load.md)** - the three stages plainly, as an assembly line: pull data from sources, clean and reshape it, write it where it's used.
2. **[ETL vs ELT](02-etl-vs-elt.md)** - the order swap and why it matters: transform before loading (classic) vs. load raw then transform inside a powerful warehouse (modern), and the trade-off.
3. **[Orchestration: Making It Run Reliably](03-orchestration.md)** - pipelines are scheduled, multi-step jobs: dependencies as a DAG, scheduling, retries, idempotency, and backfills. Why "it ran" isn't "it ran correctly."

> This guide stops at the shape of pipelines and how to run them safely. Where the data lands - warehouse vs. lake vs. lakehouse - is its own topic, covered in [Warehouses vs. Lakes](/guides/warehouses-vs-lakes). How to *trust* what comes out the far end is in [Data Quality & Observability](/guides/data-quality-and-observability).

---

Related guides: [Spreadsheets to SQL to Pipelines](/guides/spreadsheets-to-sql-to-pipelines) · [Warehouses vs. Lakes](/guides/warehouses-vs-lakes) · [Data Quality & Observability](/guides/data-quality-and-observability)
