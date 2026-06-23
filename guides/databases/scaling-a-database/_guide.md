---
title: "Scaling a Database (Replication & Sharding)"
guide: "scaling-a-database"
phase: 0
summary: "When one database box isn't enough: how to scale up and optimize first, scale reads with replication (and live with replication lag), and only then scale writes with sharding — and why sharding is the expensive last resort."
tags: [databases, scaling, replication, sharding, read-replicas, replication-lag, shard-key, performance]
category: databases
order: 9
difficulty: advanced
synonyms: ["how to scale a database", "replication vs sharding", "what is a read replica", "what is database sharding", "how to scale database reads", "how to scale database writes", "what is replication lag", "when should i shard my database", "scale up vs scale out database"]
updated: 2026-06-19
---

# Scaling a Database (Replication & Sharding)

There's a particular kind of pressure that builds slowly. The product is working. Traffic is climbing — which is the good news. And the database, the one box that everything depends on, is starting to breathe hard. Queries that used to return instantly now hang. The dashboard graphs are creeping toward the top. Someone in a meeting says the word "scale," and suddenly people are talking about replication and sharding as if they're the obvious next step.

Here's what nobody tells you in that meeting: **most databases that "need to scale" don't.** They need a better index, a fixed query, or a cache — fixes that cost an afternoon, not a re-architecture. Reaching for replication or sharding before you've exhausted the cheap wins is one of the most expensive mistakes a team can make, because both of them are *permanent complexity* you can't easily take back.

This guide is about doing it in the right order. First, make the one box you have do less work. Then, when you genuinely need more capacity, scale **reads** with replication — the safe, common, well-understood move. And only when writes themselves are the wall do you reach for **sharding**, the powerful, costly, hard-to-undo option that splits your data across machines. We'll be honest about every trade-off, because the people who get burned are the ones who were sold the shiny version.

This guide assumes you're comfortable with what a database is and how queries work. If a query is slow and you're not yet sure *why*, start with [Why Is My Query Slow?](/guides/why-is-my-query-slow) first — most of Phase 1 builds directly on it.

## How to read this
- **Under pressure to "scale the database" right now?** Read [Phase 1: The Bottleneck](01-the-bottleneck.md) before you let anyone provision a single new machine. It will probably save you the whole project.
- **Want it to finally make sense?** Read in order — the bottleneck mindset tells you *whether* to scale, replication tells you how to scale reads, and sharding tells you the real cost of scaling writes.

## The phases
1. **[The Bottleneck](01-the-bottleneck.md)** — scale *up* and optimize before you scale *out*: indexes, queries, caching, connection pooling. The crucial distinction between a read-heavy problem and a write-heavy one, because they have completely different cures.
2. **[Replication](02-replication.md)** — keeping live copies of the database: a leader takes writes, followers serve reads. How this scales reads and gives you failover — and what replication lag means for your app the day a user reads stale data.
3. **[Sharding](03-sharding.md)** — splitting the *data* itself across machines by a shard key to scale writes. The hard parts told honestly: choosing the key, cross-shard queries and joins, rebalancing, and the transactions you lose. Why it's the last resort.

> Deliberately deferred to follow-up guides: the deep mechanics of [transactions and ACID](/guides/transactions-and-acid) (which sharding quietly breaks), and the [SQL vs NoSQL](/guides/sql-vs-nosql) decision (many NoSQL systems shard for you by default). This guide is about understanding the moves and their costs — so that whether you do it by hand or pick a managed system that does it for you, you know what's actually happening underneath.
