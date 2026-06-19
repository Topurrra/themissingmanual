---
title: "ETL vs ELT"
guide: "etl-elt-pipelines"
phase: 2
summary: "ETL transforms before loading (the classic order, born when compute was scarce); ELT loads raw data first and transforms it inside a powerful cloud warehouse — preserving the raw data and letting you transform with SQL."
tags: [etl, elt, data-warehouse, sql, cloud-warehouse, raw-data]
difficulty: intermediate
synonyms: ["difference between etl and elt", "etl vs elt explained", "why elt instead of etl", "when to use etl vs elt", "transform before or after loading", "what is elt", "modern data stack etl elt"]
updated: 2026-06-19
---

# ETL vs ELT

You read the three stages in Phase 1 in the classic order: Extract, Transform, Load. Then someone on your team says "we do ELT now" and reorders two letters, and it feels like it should be a small thing. It isn't. Swapping the **T** and the **L** changes where your data gets cleaned, what hardware does the work, and whether you can ever recover the original raw data after a mistake.

The good news: there's only *one* difference between them, and once you see it the rest follows. Let's put the two side by side, then explain *why* the industry mostly moved from one to the other — because the "why" is a story about hardware getting cheaper, and it tells you which one fits *your* situation.

## The one difference, in a picture

Both pipelines do the same three jobs. The only question is whether **Transform** happens *before* or *after* the **Load**:

```text
  ETL  (transform first)
  ┌─────────┐   ┌───────────┐   ┌────────────┐
  │ EXTRACT │──►│ TRANSFORM │──►│    LOAD     │   clean data lands in the
  └─────────┘   └───────────┘   └────────────┘   warehouse; raw is discarded
                (on a separate
                 transform box)

  ELT  (load first, transform inside)
  ┌─────────┐   ┌────────────┐   ┌───────────────────────┐
  │ EXTRACT │──►│    LOAD     │──►│       TRANSFORM        │   raw lands first,
  └─────────┘   └────────────┘   │  (runs INSIDE the      │   then SQL reshapes
                  raw lands      │   warehouse, with SQL) │   it in place
                                 └───────────────────────┘
```

That's the whole distinction. **ETL transforms on the way in; ELT transforms after it's already in.** Everything else — the trade-offs, the tooling, the team debates — flows from that.

## Why ETL came first: compute used to be expensive

**The world that created ETL.** For decades, the destination was a traditional data warehouse — powerful, but expensive and capacity-limited. You did *not* want to waste its precious compute cleaning messy data; you wanted it reserved for serving queries. So teams stood up a *separate* machine (an ETL server) to do all the transforming, and loaded only the finished, cleaned result into the warehouse.

**The logic was sound for its time:** transform on cheap commodity hardware, load only what's needed, keep the costly warehouse lean. ETL is a design shaped by scarcity — when warehouse compute is the bottleneck, you protect it.

**The cost of that design.** Because only the *transformed* data lands in the warehouse, the **raw data is gone** (or sitting in files nobody queries). If you later discover your transform had a bug, or you need a field you'd dropped, you can't just re-derive it — you have to re-extract from the source, if the source even still has it.

## Why ELT took over: the cloud warehouse changed the math

**What changed.** Modern cloud warehouses (the BigQuery / Snowflake / Redshift generation) made warehouse compute cheap and elastic — you can throw a lot of processing power at a problem and pay only for what you use. The bottleneck that justified ETL largely went away.

So the order flipped. With ELT you **load the raw data straight in, then transform it in place using the warehouse's own SQL engine.** The expensive separate transform box disappears; the warehouse does the heavy lifting it was once protected from.

This unlocks two things people genuinely value:

- **The raw data is preserved.** Because you load *before* transforming, the original lands in the warehouse and stays there. Found a bug in your revenue logic six months in? Fix the SQL and re-run the transform over the raw data you already have — no re-extraction, no begging the source system for history it may have purged.
- **You transform with SQL.** Transforms become SQL queries (often managed by tools like dbt) running where the data already sits. Anyone who can write SQL can read and change the logic — you don't need a separate processing framework or language for the transform stage.

> 📝 **Terminology.** People often describe ELT transforms as turning *raw* tables into *staged* and then *modeled* tables — successive SQL layers inside the warehouse, each more refined than the last. Same Phase 1 transform work; it just runs as SQL, in stages, in place.

## The honest comparison

Neither is "better" in the abstract — they fit different constraints. Here's both sides straight:

| | **ETL** (transform first) | **ELT** (load first) |
|---|---|---|
| Where transform runs | A separate processing server | Inside the warehouse, in SQL |
| What lands in the warehouse | Only cleaned data | Raw data first, then derived tables |
| Raw data after loading | Usually discarded / hard to reach | Preserved and queryable |
| Best when | Warehouse compute is scarce/expensive; or you must clean/mask data *before* it ever lands (e.g. compliance) | You have an elastic cloud warehouse and want flexibility + raw history |
| Transform skills needed | A processing framework (Spark, custom code) | SQL (often + dbt) |
| Typical era | Traditional on-prem warehouses | Modern cloud warehouses |

⚠️ **Gotcha — ELT means raw, possibly sensitive data lands first.** Loading before transforming is exactly what preserves raw history — but it also means personal or regulated data hits the warehouse *before* any masking. If you're under rules that forbid storing certain fields, transforming (or masking) *before* the load — the ETL pattern — may be a hard requirement, not a preference. Choose the order with that in mind.

💡 **Key point.** The choice isn't fashion. ELT wins where warehouse compute is cheap and you value keeping raw data; ETL still wins where compute is constrained or where data must be cleaned/masked before it can be stored at all. The order of two letters encodes a real engineering trade-off — name the constraint, and the right order is usually obvious.

> Whether you load into a *warehouse* (structured, SQL-first) or a *lake* (raw files, any format) shapes this decision too — ELT in particular leans on a capable destination. That comparison has its own home: [Warehouses vs. Lakes](/guides/warehouses-vs-lakes).

## Recap

1. **The only difference is order:** ETL transforms *before* loading; ELT loads raw *then* transforms in place.
2. **ETL was born of scarcity** — protect expensive warehouse compute by cleaning on a separate box and loading only the result.
3. **ELT rose with cheap cloud warehouses** — load raw, transform with SQL inside the warehouse.
4. **ELT's payoffs:** raw data preserved (re-run transforms without re-extracting) and transforms written in plain SQL.
5. **ETL still wins** when compute is constrained or data must be masked before it can land at all.

You can now read the data-stage of any pipeline and know *why* it's ordered the way it is. But knowing the stages and their order isn't enough to trust a pipeline. A pipeline runs on a schedule, with steps that depend on each other, and it *will* fail at 3am. Making it run *reliably* is the final piece.

---

[← Phase 1: Extract, Transform, Load](01-extract-transform-load.md) · [Guide overview](_guide.md) · [Phase 3: Orchestration →](03-orchestration.md)
