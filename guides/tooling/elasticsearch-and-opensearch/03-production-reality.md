---
title: "Phase 3: Near-real-time, consistency, and when to add search at all"
guide: elasticsearch-and-opensearch
phase: 3
summary: "Full-text search at scale: the inverted index, analyzers and relevance scoring, and how a search engine differs from a database WHERE clause."
tags: [elasticsearch, opensearch, search, inverted-index, bm25, analyzers]
difficulty: intermediate
synonyms: ["elasticsearch tutorial", "opensearch vs elasticsearch", "full text search engine", "inverted index explained", "why is LIKE slow", "BM25 relevance", "elasticsearch analyzers", "near real time search"]
updated: 2026-06-30
---

# Phase 3: Near-real-time, consistency, and when to add search at all

The model is clear and the queries work. Now meet the parts that bite in production, the behaviors that feel like bugs until you understand they are deliberate trade-offs. Most search outages and "why is this data wrong" tickets come from expecting a search engine to behave like the database it sits next to. It does not, on purpose.

## Near-real-time: your write is not instantly searchable

You index a document, immediately search for it, and it is not there. Nothing is broken. Search engines are **near-real-time**, not real-time. There is a small delay, often around a second, between writing a document and it appearing in results.

```text
t=0.0s  PUT /products/_doc/99   -> 201 Created   (document is saved)
t=0.2s  search for it           -> 0 hits        (not visible yet)
t=1.1s  search for it           -> 1 hit         (now visible)
```

*What just happened:* the engine batches new documents in memory and periodically does a **refresh** that makes them searchable. Refreshing on every single write would destroy throughput, building the inverted-index segments is expensive, so the engine trades a sliver of latency for the ability to ingest fast. The fix is almost never "force a refresh after every write" (that throws away the whole performance win); it is to design your app to tolerate the delay, or to refresh explicitly only in a test where you need determinism.

## Eventual consistency: the source of truth is not here

This is the rule that saves you from data-loss incidents: **a search engine is not your system of record.** It is built for fast, distributed search, not for transactions. It has no joins, no foreign keys, and no all-or-nothing commits across documents. If your indexing job dies halfway, you can end up with a search index that disagrees with your database.

The pattern that survives contact with production is one-directional:

```text
[ your database ]  <- source of truth, transactions live here
        |
        |  on change: enqueue a job
        v
[ indexing worker ] -> writes/updates the document in the search engine
        |
        v
[ search engine ]  <- a fast, rebuildable copy, NOT authoritative
```

*What just happened:* the database stays authoritative; the search engine is a derived, eventually-consistent copy you can rebuild from scratch at any time. That last property is the safety net, if the index gets corrupted, falls behind, or you change a mapping (which often requires reindexing), you re-stream from the database and you are whole again. Never let data exist *only* in the search engine. Treat it as a cache that happens to be searchable.

> The single most useful sentence about operating search: if you deleted the entire cluster right now, could you rebuild every document from your database? If yes, you are holding it correctly. If no, you have put your only copy in the wrong place.

## "Why is the result order weird in tests?"

A subtler gotcha: because the index is distributed across pieces called **shards**, and BM25's statistics (like how rare a term is) are computed *per shard*, the exact `_score` for a document can vary slightly depending on which shard it landed on. With lots of data this evens out. With a tiny test dataset it can make rankings look unstable or surprising.

```text
small index, 2 shards:
  doc on shard A and doc on shard B can get different scores
  for the same terms, because each shard counts term rarity locally
```

*What just happened:* this is not a bug and not something to fix in production, it is just why a five-document test fixture can rank in an order that feels arbitrary. Knowing it exists saves an afternoon of chasing a ghost.

## The real question: did you need search at all?

Before you stand up a cluster, run the ladder. A search engine is real operational weight, another system to run, monitor, secure, keep in sync, and pay for. Often you do not need it:

- **A few exact filters on indexed columns?** Your database already does this well. Add the right index and move on. If a database query is slow, the fix is usually in the query plan, not a new system, see [/guides/why-is-my-query-slow](/guides/why-is-my-query-slow).
- **Modest data and the occasional `LIKE`?** It may be fine. "Slow on a million rows" is a real reason; "might be slow someday" is not yet one.
- **Postgres already in the stack and search needs are light-to-medium?** Its built-in full-text search (`tsvector`/`tsquery`) gives you a real inverted index without a second system. Reach for a dedicated engine when you outgrow it, not before.

You genuinely want Elasticsearch or OpenSearch when search *is* the feature: relevance ranking that must be good, typo tolerance, faceted navigation, autocomplete, searching huge text corpora, or aggregations over large volumes. Then the operational cost buys something your database cannot do.

```text
decision sketch:
  exact filters / joins / transactions      -> database
  light full-text, already on Postgres      -> Postgres FTS
  relevance, typos, facets, scale, big text -> Elasticsearch / OpenSearch
```

*What just happened:* the question was never "search engine or database." It is "which tool for which job," and the most senior move is the smallest one that works. Add search when the job is search; otherwise let the database you already run do what it is good at.

## In the wild

Mature systems almost always run both: the database as the transactional source of truth, the search engine fed asynchronously beside it for the searching, ranking, and faceting the database cannot do well. The reindex-from-scratch capability is treated as a first-class operation, not an emergency, because mapping changes and the occasional desync are normal life, not disasters. Build it that way from day one and search becomes boring, which is the goal.

```quiz
[
  {
    "q": "You index a document and immediately search for it, but get zero hits. What is happening?",
    "choices": [
      "The write failed silently and was never saved",
      "Search engines are near-real-time; a refresh delay means it is not searchable yet",
      "The document needs a manual commit like a SQL transaction",
      "The inverted index is corrupted"
    ],
    "answer": 1,
    "explain": "Writes are batched and made searchable on periodic refresh, so there is a short delay. The document is saved; it is just not visible to search yet."
  },
  {
    "q": "Why should the search engine never be your only copy of the data?",
    "choices": [
      "It is too slow to read from",
      "It cannot store JSON",
      "It is eventually consistent and not transactional; treat it as a rebuildable copy of an authoritative database",
      "It deletes documents after 30 days by default"
    ],
    "answer": 2,
    "explain": "A search engine is a derived, eventually-consistent copy with no transactions or joins. Keep the database authoritative so you can always rebuild the index."
  },
  {
    "q": "Your app already runs Postgres and needs light full-text search. What is the lazy correct move?",
    "choices": [
      "Stand up an Elasticsearch cluster immediately for future-proofing",
      "Use Postgres's built-in full-text search before adding a separate engine",
      "Switch the whole app to a search engine as the primary store",
      "Run LIKE '%term%' and add more CPU"
    ],
    "answer": 1,
    "explain": "Postgres full-text search gives a real inverted index with no second system. Add a dedicated engine only when you outgrow it, not preemptively."
  }
]
```

[← Phase 2: Indexing, mappings, analyzers, and getting ranked results](02-indexing-and-relevance.md) | [Overview](_guide.md)
