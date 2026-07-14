---
title: "Data Quality & Pipeline Observability"
guide: "data-quality-and-observability"
phase: 0
summary: "How to trust the numbers your pipelines produce: why a green job can still ship wrong data, the checks that catch silent breakage, and the observability that finds it before a human makes a decision on it."
tags: [data-quality, observability, data-engineering, pipelines, monitoring, data-testing, lineage]
category: data-analytics
order: 7
difficulty: advanced
synonyms: ["how to trust pipeline data", "what is data quality", "data quality checks", "what is data observability", "freshness volume schema checks", "pipeline succeeded but data is wrong", "silent data bugs", "data lineage explained", "data SLA", "alert fatigue data monitoring"]
updated: 2026-06-19
---

# Data Quality & Pipeline Observability

Your pipeline ran. The orchestrator shows a row of green checkmarks. The job exited zero, the dashboard
refreshed, and you moved on. A week later someone in a meeting says revenue is down 12% - and acts on it.
Budgets shift, a hire gets paused. Then someone notices the number is wrong: an upstream column quietly
started arriving as `null`, the pipeline averaged over the nulls, and nobody told anyone, because nothing
*crashed*. The job was green the whole time.

That is the nightmare this guide is about. Not the loud failure that pages you at 2am - you'll catch that.
The quiet one: a pipeline that *succeeds* while producing wrong data, and stays wrong until a decision is
built on top of it. Here's the relief: this is a solvable problem. Data can be tested like code, and a
running pipeline can be watched like a production service. This guide gives you the mental model for why
green isn't enough, the specific checks that catch silent breakage, and the observability that surfaces it
before a human ever sees the bad number.

## How to read this
- **Already convinced and want the checks?** Jump to [Phase 2: Data Quality Checks](02-data-quality-checks.md) for the dimensions worth testing and where to run them.
- **Want it to actually click - why trust is the whole product?** Read in order. Phase 1 installs the mental model the rest depends on.

## The phases
1. **[Why Trust Is the Whole Product](01-why-trust-is-the-whole-product.md)** - the mental model: data can be broken even when the job is green, and a silent data bug is worse than a loud crash, because no one knows to look.
2. **[Data Quality Checks](02-data-quality-checks.md)** - the dimensions worth testing automatically (freshness, volume, schema, validity), where to run them, and an annotated check that fails the pipeline before bad data spreads.
3. **[Pipeline Observability](03-pipeline-observability.md)** - seeing the whole system: lineage, monitoring and alerting on those checks, data SLAs, and avoiding the alert fatigue that turns every signal into noise.

> This guide is about *trusting* the data a pipeline produces. How those pipelines are built - the
> extract/transform/load mechanics, batch vs. streaming, the orchestration - lives in
> [ETL & ELT Pipelines](/guides/etl-elt-pipelines). If the words "pipeline" or "transform" feel fuzzy,
> read that first, then come back here to make what they produce trustworthy.
