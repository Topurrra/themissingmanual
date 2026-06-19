---
title: "Choosing & Combining — It's Rarely Either/Or"
guide: "warehouses-vs-lakes"
phase: 3
summary: "An honest side-by-side of warehouse vs lake, why most organizations land raw data in a lake then model curated tables in a warehouse for BI, and why governance is the difference between a useful lake and a data swamp."
tags: [data-warehouse, data-lake, lakehouse, architecture, governance, bi, data-catalog, comparison]
difficulty: intermediate
synonyms: ["data warehouse vs data lake comparison", "should I use a lake or warehouse", "lake first then warehouse pattern", "how to avoid a data swamp", "do I need both lake and warehouse", "data lake governance", "curated tables for bi"]
updated: 2026-06-19
---

# Choosing & Combining — It's Rarely Either/Or

If you've read the first two phases, you might be bracing for a verdict: warehouse or lake, pick a side. The
honest answer is that the question is mostly a false choice. The two solve different problems, and the most
common real-world setup uses **both**, deliberately, each doing the part it's good at.

This phase gives you the fair comparison first, then the pattern that ties them together, then the one
failure that quietly sinks lake projects — so you can make the call with your eyes open.

## The honest comparison

Lead with the whole picture. This table covers *both* sides fairly — neither is the hero.

| | **Data Warehouse** | **Data Lake** |
|---|---|---|
| **Stores** | Structured, modeled tables | Anything: raw files, JSON, logs, images, Parquet |
| **Structure decided** | On write (schema-on-write), up front | On read (schema-on-read), at query time |
| **Storage** | Managed inside the warehouse | Cheap object storage (S3 / GCS / Azure Blob) |
| **Best at** | Fast aggregations, BI, trustworthy curated data | Flexibility, cheap raw history, ML, unstructured data |
| **Query speed** | Fast on big structured aggregations (columnar) | Depends on file layout and engine; can be slower on raw files |
| **Cost shape** | Higher per stored/queried unit; often pay-per-query/compute | Cheap storage; cost shifts to compute and to *making sense* of the mess |
| **Main risk** | Rigidity; change has a tax; awkward with raw/unstructured data | Becomes a "data swamp" without governance |
| **Who reaches for it** | Analysts, BI teams, finance/exec reporting | Data engineers, data scientists, ML teams |

💡 **Key point.** Read the "Best at" and "Main risk" rows together and the relationship is obvious: the
warehouse's strength (trustworthy, fast structured tables) is the lake's weakness, and the lake's strength
(cheap, flexible raw everything) is the warehouse's weakness. That complementarity is *why* combining them
is so common — not indecision, but design.

## The common pattern: land in the lake, model in the warehouse

You don't have to choose, and most mature data teams don't. The dominant pattern reads top to bottom:

```text
   sources                lake (raw)              warehouse (curated)        users
   ───────                ──────────              ───────────────────        ─────
   app DB    ─┐                                                          ┌─► BI dashboards
   APIs      ─┤──►   land EVERYTHING raw   ──►   model clean, trusted  ──┤
   logs      ─┤      cheap object storage       tables for analytics    └─► exec reporting
   events    ─┘      (keep the originals)       (structured, fast)
                            │
                            └──────────────────────────────────► data science / ML
                                              (work straight from the raw lake)
```

**How it works in practice.**

1. **Land raw in the lake first.** Everything arrives in cheap object storage in roughly its original form.
   You keep the originals — cheap insurance against questions you can't predict yet.
2. **Model curated tables in the warehouse.** From that raw material you build clean, structured, trusted
   tables in the warehouse — the ones BI dashboards and finance reports run on. These are fast, reliable,
   and shaped for the questions the business actually asks.
3. **Let ML drink from the lake.** Data scientists often skip the curated warehouse tables and work directly
   from the raw lake, because models want full-resolution raw data, not pre-aggregated summaries.

*What this gets you:* the lake's cheap, flexible, keep-everything storage **and** the warehouse's fast,
trustworthy curated tables — each used for what it's genuinely good at, instead of forcing one tool to do
both jobs badly.

📝 **Where the lakehouse fits.** The lakehouse from [Phase 2](02-the-lake-and-lakehouse.md) is an attempt to
collapse this two-system pattern into one: warehouse-like curated tables living directly on lake storage,
so you don't run two separate systems. It can be a great fit — and it can also be more moving parts than a
small team needs. The pattern above (separate lake and warehouse) is still extremely common and completely
reasonable; the lakehouse is an option, not an obligation.

## A rough rule of thumb (judgment, not law)

This part is opinion, flagged as such — your context can absolutely override it.

- **Mostly structured data and BI/reporting needs, a smaller team?** A **warehouse alone** is often plenty,
  and the simplest thing that works. Don't build a lake you don't need.
- **Lots of raw, varied, or unstructured data; ML ambitions; or large cheap history to keep?** You'll want
  a **lake**, very likely **feeding a warehouse** for the BI layer.
- **Already running both and tired of two systems?** That's when a **lakehouse** earns a serious look.

The honest meta-point: start with the simplest setup that answers your actual questions, and add the other
piece when a real need shows up — not because an architecture diagram online had both boxes.

## The failure that sinks lakes: no governance

We've named the data swamp twice. Here's why it gets the last and longest word: it is the single most common
way these projects fail, and it's entirely preventable.

⚠️ **Gotcha — a lake without governance becomes a data swamp, and a swamp is worse than no lake at all.**
When data lands freely with no catalog, no owners, and no documentation, the lake fills with files nobody
can identify or trust. People can't find the right dataset, can't tell which copy is current, and eventually
stop trusting *any* of it. You've now paid to store data and *also* lost the ability to use it — strictly
worse than never having built the lake.

**Why governance is the deciding factor.** Recall the asymmetry from
[Phase 2](02-the-lake-and-lakehouse.md): the warehouse's schema-on-write *forces* someone to think about
meaning and structure at load time. The lake removes that forcing function in exchange for flexibility. If
you don't consciously replace it with discipline, nothing else does — and the flexibility curdles into chaos.
Governance isn't bureaucracy you bolt on later; it's the thing that makes a lake a lake instead of a swamp.

**What "governance" concretely means** (not abstract — these are the moves):

- **A data catalog** — a searchable record of every dataset: what it is, its schema, where it lives, who
  owns it. (For example, AWS Glue Data Catalog, or a tool like a metadata catalog layered over your
  storage.) If you can't search "what data do we have about orders?", you don't have governance yet.
- **Clear ownership** — every important dataset has a named team on the hook for its quality and meaning.
- **Defined zones** — at minimum a *raw* zone (untouched, as-landed) and a *curated* zone (cleaned,
  documented, trusted), so nobody mistakes raw mess for production-ready data.
- **Documentation and lifecycle** — what's current, what's deprecated, what can be deleted. Entropy is the
  default; documentation is how you push back.

🪖 **War story.** The saddest data project isn't the one that never got built — it's the lake that got built
*without* a catalog. Years of events faithfully captured, terabytes of genuinely valuable history, and an
analyst who needs "the orders data" facing forty folders with names like `orders_final_v2_REAL`. The data
was all there. Nobody could trust it, so in practice it may as well not have been. The cost of governance is
small and ongoing; the cost of skipping it is a swamp you can't drain.

## Recap

1. Warehouse vs lake is **rarely either/or** — they're complementary, and combining them is a design
   choice, not indecision.
2. The honest comparison: the **warehouse** wins on fast, trustworthy, structured BI; the **lake** wins on
   cheap, flexible, raw, ML-friendly storage. Each is the other's weak spot.
3. The dominant pattern is **land raw in the lake, model curated tables in the warehouse for BI**, and let
   **ML work from the raw lake**. The **lakehouse** collapses this into one system — an option, not a
   requirement.
4. Pick the **simplest setup that answers your real questions**, and add the other piece when a genuine
   need appears.
5. **Governance is the deciding factor.** Without a catalog, owners, and zones, a lake rots into a **data
   swamp** that's worse than no lake at all.

You can now hold your own in the "warehouse or lake?" conversation — and gently point out that the real
answer is usually "both, on purpose, with governance."

---

[← Phase 2: The Lake (and Lakehouse)](02-the-lake-and-lakehouse.md) · [Guide overview](_guide.md)

**Related guides:** [ETL & ELT Pipelines](/guides/etl-elt-pipelines) · [What Is Data Engineering?](/guides/what-is-data-engineering) · [BI Dashboards That Work](/guides/bi-dashboards-that-work)
