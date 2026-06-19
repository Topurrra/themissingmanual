---
title: "The Lake (and Lakehouse) — Store Everything, Decide Later"
guide: "warehouses-vs-lakes"
phase: 2
summary: "A data lake stores everything raw and cheap as files in object storage with schema-on-read, which buys flexibility for ML and unstructured data but risks becoming a data swamp; the lakehouse adds warehouse-like tables on top of lake storage."
tags: [data-lake, lakehouse, object-storage, schema-on-read, data-swamp, governance, parquet, machine-learning]
difficulty: intermediate
synonyms: ["what is a data lake", "schema on read explained", "what is a data swamp", "data lake vs data warehouse storage", "what is a lakehouse", "object storage for analytics", "store raw data cheaply"]
updated: 2026-06-19
---

# The Lake (and Lakehouse) — Store Everything, Decide Later

The warehouse in [Phase 1](01-the-warehouse.md) asked you to decide the shape of your data before you could
store it. That's a reasonable deal for clean, structured tables. But a lot of valuable data doesn't arrive
clean or structured — server logs, clickstreams, images, sensor readings, half-documented JSON from some
third-party API. And sometimes you don't yet know which questions you'll ask, so committing to a schema up
front feels like guessing.

The data lake is the answer to a simple, slightly rebellious idea: *what if we just kept everything, cheaply,
exactly as it arrived, and figured out the structure later?* It's a powerful idea — and a dangerous one if
nobody's tending it. Let's make both halves clear.

## What a lake actually is: files in cheap object storage

**What it actually is.** A data lake is, at its core, a big pile of **files in object storage** — services
like Amazon S3, Google Cloud Storage, or Azure Blob Storage. Not a database engine; *storage*. You drop
files in: CSVs, JSON, logs, Parquet, images, whatever. The lake doesn't insist they share a shape.

📝 **Object storage** is cloud storage built for huge numbers of files ("objects"), addressed by a path/key,
designed to be cheap and effectively unlimited. It's the same kind of storage that backs file uploads and
backups — which is exactly why it's so inexpensive to park enormous amounts of data there.

**Why people get this wrong.** People hear "lake" and picture a fancy queryable system. It's the opposite:
the lake's whole trick is that *storing* is dumb and cheap, and the cleverness happens later, at query time.
Separating storage from compute like this is the lake's defining move.

```text
        DATA LAKE = object storage (S3 / GCS / Azure Blob)
        ┌──────────────────────────────────────────────┐
        │  /raw/orders/2026-06-19.json                   │
        │  /raw/clickstream/part-0001.parquet            │
        │  /raw/support-tickets/*.csv                     │
        │  /raw/product-images/*.jpg                      │
        │  /raw/iot/sensor-dump.log                       │
        └──────────────────────────────────────────────┘
          one cheap bucket, any format, no shared schema
```

## Schema-on-read: decide the structure when you ask

**What it actually is.** This is the lake's mirror-image of the warehouse's schema-on-write. A lake is
**schema-on-read**: the files have no enforced structure sitting still in storage. You impose a structure
*at the moment you query*, by telling the query engine how to interpret the files.

**What it does in real life.** A query engine (for example, AWS Athena, which runs SQL over files in S3)
reads the raw files and applies the columns and types you declare, right then:

```console
$ aws athena start-query-execution \
  --query-string \
  "SELECT user_id, COUNT(*) AS events
   FROM raw_clickstream
   WHERE event_date = '2026-06-19'
   GROUP BY user_id"
{
    "QueryExecutionId": "b1b2c3d4-e5f6-7890-abcd-1234567890ef"
}
```
*What just happened:* The engine went out to the raw clickstream files sitting in object storage and
interpreted them through the `raw_clickstream` definition *at query time* — the structure was applied on the
way out, not forced on the way in. The files themselves never had to be reshaped to be stored. That's
schema-on-read in one sentence: structure is a lens you put on at read time, not a cage you build at write
time.

💡 **Key point.** Schema-on-write (warehouse) front-loads the discipline; schema-on-read (lake) defers it.
Neither is "better" — they move the same work to different moments. The warehouse pays up front for fast,
trustworthy queries. The lake stays cheap and flexible now and pays later, every time it has to make sense
of the raw files.

## What the lake is great at

**Flexibility.** You can store data whose structure you don't fully know yet, and decide how to read it once
you understand the question. Nothing is rejected at the door for not fitting a schema.

**Cost at scale.** Object storage is cheap, so keeping years of raw history is affordable in a way that
loading all of it into a warehouse usually isn't.

**Unstructured and ML-friendly.** Images, audio, free text, raw event logs — the stuff that doesn't fit neat
columns — lives comfortably in a lake. And machine-learning workflows specifically *want* the raw,
unaggregated data: training a model often means reaching for the full-resolution original, not a tidy
pre-summarized table. The lake keeps that raw material available.

**Why this saves you later.** When someone asks "can we analyze a signal we weren't tracking on purpose six
months ago?", a warehouse-only shop often can't — the data was never modeled or kept. A lake that quietly
retained the raw events can. Keeping the raw material is itself a kind of insurance.

## The risk: the data swamp

Now the honest part. The same trait that makes a lake flexible — *anything goes in, no structure
enforced* — is exactly how it rots.

⚠️ **Gotcha — without governance, a lake becomes a "data swamp."** A **data swamp** is a lake nobody can
use: thousands of files with no catalog of what they are, no owners, no documentation, duplicate and
contradictory copies, no idea which dataset is current or trustworthy. The data is technically *there*, but
finding the right thing and trusting it becomes so hard that people give up and the lake's value collapses.

**Why it happens.** Schema-on-write forced *someone* to think about structure and meaning at load time. The
lake removes that forcing function. If no one deliberately replaces it with discipline, entropy wins —
quietly, file by file, until one day no one can answer "where's the authoritative orders data?"

**What prevents it.** Governance and cataloging — the deliberate discipline a lake doesn't enforce for you:

- A **data catalog** (for example, AWS Glue Data Catalog) recording what each dataset is, its schema, and
  where it lives.
- **Clear ownership** — every important dataset has a team responsible for it.
- **Documented zones**, commonly a raw/landing zone for untouched data and a cleaned/curated zone for
  trusted, ready-to-use data, so "raw mess" and "trusted data" don't blur together.

We come back to governance as *the* deciding failure mode in
[Phase 3](03-choosing-and-combining.md) — it's that important.

## The lakehouse: where the two ideas converge

For years this was a real either/or: cheap-but-undisciplined lake, or fast-but-rigid warehouse. The
**lakehouse** is the industry's attempt to get both at once, and it's why the old debate has blurred.

**What it actually is.** A lakehouse keeps your data in cheap lake storage (object storage) but adds a
**table layer** on top that gives you warehouse-like behavior — defined tables, schemas, and reliable
updates — directly over those files. Open table formats such as **Apache Iceberg**, **Delta Lake**, and
**Apache Hudi** are what make this work: they sit over the files and track which files make up a table, what
its schema is, and how it changes over time.

**What it does in real life.** Instead of "dump raw files and hope" *or* "load everything into a separate
warehouse," you get structured, queryable, governed tables that live on the same cheap storage as the raw
data — one place, two behaviors.

```text
        LAKEHOUSE
        ┌──────────────────────────────────────────────┐
        │  table layer  (Iceberg / Delta Lake / Hudi)   │  ← schemas, reliable
        │  ── gives files warehouse-like tables ──       │    tables, updates
        ├──────────────────────────────────────────────┤
        │  object storage  (S3 / GCS / Azure Blob)      │  ← cheap raw files
        └──────────────────────────────────────────────┘
          warehouse-style tables ON TOP of lake-cheap storage
```

📝 **A note on honesty.** "Lakehouse" is also a marketing term, and a lakehouse isn't automatically the
right answer — it adds its own moving parts and operational complexity. The mental model to keep is the
*architecture*: warehouse-like tables layered over lake-cheap storage. Whether that's the right call for you
is the subject of the final phase.

## Recap

1. A data lake is **files in cheap object storage** (S3/GCS/Azure Blob) — storage, not a database engine.
2. It's **schema-on-read**: structure is applied at query time, not enforced at storage time — the mirror
   image of the warehouse.
3. Lakes are great at **flexibility, cost at scale, and unstructured/ML data**, because they keep raw
   material cheaply and don't reject anything at the door.
4. The risk is the **data swamp** — an ungoverned, uncataloged lake nobody can trust — which is why
   **governance and cataloging** are non-negotiable.
5. The **lakehouse** layers warehouse-like tables (Iceberg/Delta/Hudi) over lake storage, converging the
   two — useful, but not automatically the right choice.

You now understand both landing spots and the hybrid. The last question is the practical one: which do *you*
use, and how do they fit together?

---

[← Phase 1: The Warehouse](01-the-warehouse.md) · [Guide overview](_guide.md) · [Phase 3: Choosing & Combining →](03-choosing-and-combining.md)
