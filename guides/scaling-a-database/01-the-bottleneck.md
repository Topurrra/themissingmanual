---
title: "The Bottleneck"
guide: "scaling-a-database"
phase: 1
summary: "Before you scale out, scale up and optimize: indexes, queries, caching, and connection pooling fix most 'we need to scale' problems. And first figure out whether you're read-heavy or write-heavy — the two have completely different cures."
tags: [databases, scaling, scale-up, scale-out, indexes, caching, connection-pooling, read-heavy, write-heavy]
difficulty: advanced
synonyms: ["scale up vs scale out database", "do i need to scale my database", "read heavy vs write heavy", "database connection pooling", "cache before scaling database", "optimize before scaling"]
updated: 2026-06-19
---

# The Bottleneck

Before you provision a single new machine, let's slow down — because the most expensive scaling decisions are the ones made in a panic. A database under load *feels* like a database that needs more hardware. It almost never is, at first. The instinct to add machines is the instinct to throw money at a problem you haven't located yet, and machines you add for scaling are very hard to remove later.

So this phase is the discipline that comes before any of the dramatic stuff: find the actual bottleneck, fix it cheaply, and only then ask whether you've outgrown one box. Two ideas do most of the work here. First: **scale the query before you scale the hardware.** Second: **a read-heavy problem and a write-heavy problem are different illnesses** — and almost everything in the next two phases hinges on which one you have.

## Scale up before you scale out

📝 **Terminology.** *Scaling up* (also called *vertical scaling*) means giving your one database machine more resources — more CPU, more RAM, faster disk. *Scaling out* (*horizontal scaling*) means adding more machines and spreading the work across them. Replication and sharding are both forms of scaling out.

**What it actually is.** Scaling up is moving your database to a bigger box. Scaling out is turning your database into *several* boxes that have to coordinate. Those are not two points on the same line — they're different worlds. A bigger single box is still one database: same queries, same transactions, same mental model, only with more room. The moment you go to multiple machines, you inherit a permanent tax of coordination, consistency, and operational complexity that never goes away.

**Why people get this wrong.** "Scaling out" sounds more serious and more permanent, so it feels like the grown-up answer. But a single modern server is enormous — you can rent machines with hundreds of gigabytes of RAM and dozens of cores. An astonishing number of applications will never outgrow one well-tuned box. Reaching for a cluster when a bigger instance would do is paying the coordination tax for capacity you didn't need.

**Why this saves you later.** Every problem is easier to reason about on one machine. Bugs, backups, transactions, "where is this row" — all trivial on a single box and all genuinely hard across many. So the order is: optimize what you have, then scale *up* if you must, and treat scaling *out* as the move you make when a single machine truly can't keep up — not as the default.

⚠️ **Gotcha — scale the query before you scale the hardware.** The slow-database feeling is, far more often than not, a *missing index* or a *bad query* — one query doing a full table scan, an N+1 loop firing a thousand small queries per page, a `SELECT *` dragging back columns nobody reads. Throwing hardware at that buys you a little headroom and hides the real problem until it comes back bigger. Before you add a single machine, go find the expensive queries and fix them. That's the entire subject of [Why Is My Query Slow?](/guides/why-is-my-query-slow), and it is genuinely the first thing to do. A well-placed index can turn a query from seconds to milliseconds — which is a bigger win than any amount of new hardware, and it's free.

## The cheap wins, in order

Before "we need to scale" becomes a project, walk this list. Each step is cheaper and less permanent than the one after it.

```text
   CHEAPEST / LEAST PERMANENT
   ─────────────────────────────────────────────
   1. Fix the queries        → indexes, kill N+1, stop SELECT *
   2. Add a cache            → stop asking the DB the same thing
   3. Pool the connections   → reuse connections, don't drown the DB
   4. Scale UP               → a bigger single box
   ─────────────────────────────────────────────
   5. Scale OUT: replication → more machines, more reads      (Phase 2)
   6. Scale OUT: sharding    → split the data, more writes    (Phase 3)
   ─────────────────────────────────────────────
   MOST EXPENSIVE / HARDEST TO UNDO
```

### Add a cache

**What it actually is.** A cache is a fast, temporary store (commonly Redis or Memcached, often just in-memory) that holds the answers to expensive or frequently-repeated questions, so your app can get them without touching the database at all. The classic pattern is *cache-aside*: check the cache first; on a miss, query the database and store the result for next time.

**What it does in real life.** If your homepage runs the same "top 10 articles" query for every visitor, you're asking the database the identical question thousands of times a minute for an answer that changes maybe once an hour. A cache turns thousands of database hits into one, plus thousands of fast cache reads. For read-heavy workloads, a good cache is often the single highest-leverage change you can make — and it's reversible, unlike adding machines.

⚠️ **Gotcha.** Caching introduces *staleness*: the cached answer can be out of date until it expires or you invalidate it. You're trading perfect freshness for speed, on purpose. (Hold onto that idea — replication in Phase 2 has the same trade-off in a different costume.) The hard part of caching isn't the cache; it's deciding when to throw entries away. Phil Karlton's line — "there are only two hard things in computer science: cache invalidation and naming things" — is a joke that stops being funny the first time stale data ships to a user.

### Pool your connections

**What it actually is.** A connection pool is a fixed set of already-open database connections that your application borrows and returns, instead of opening a brand-new connection for every request.

**Why people get this wrong.** It's tempting to think "the database is slow" when the real problem is that you're *opening and closing* connections constantly. Every new database connection costs real work to set up — authentication, a new backend process or thread on the server — and databases have a hard ceiling on how many connections they can hold open at once. A flood of connections can bring a database to its knees while CPU and disk sit nearly idle.

**What it does in real life.** With a pool, your hundred concurrent web requests share, say, twenty long-lived connections, taking turns. The database does far less connection-setup work and never gets buried under connection count. Most web frameworks and ORMs have pooling built in or one config flag away — and in front of databases like PostgreSQL, a dedicated pooler (PgBouncer is the common one) sits between app and database to manage this at scale.

**Why this saves you later.** A team once "scaled" their database to a bigger instance because it kept hitting connection limits under load. The bigger box hit the same wall a week later, because the limit was self-inflicted: every request opened its own connection. A connection pool fixed in an afternoon what a hardware upgrade couldn't fix at all.

## Read-heavy or write-heavy? This decides everything

Here is the question that determines which scaling tool you'll eventually reach for, and it's the most important idea in this guide:

**Is your bottleneck reads or writes?**

📝 **Terminology.** A *read* is any query that fetches data without changing it (`SELECT`). A *write* is anything that modifies data (`INSERT`, `UPDATE`, `DELETE`). A *read-heavy* workload does far more reads than writes; a *write-heavy* workload is dominated by writes.

**Why this matters so much.** The two scaling tools in this guide solve different problems:

```text
   YOUR BOTTLENECK IS...        THE TOOL THAT HELPS...
   ─────────────────────        ──────────────────────────────────
   too many READS         ───▶  REPLICATION (Phase 2)
                                copies of the DB serving reads

   too many WRITES        ───▶  SHARDING (Phase 3)
                                the data split across machines
   ─────────────────────        ──────────────────────────────────
```

Most applications are overwhelmingly read-heavy — a social feed, a news site, a store catalog: read constantly, written rarely. That's good news, because **reads are the easy thing to scale.** You can make as many copies of the data as you like and spread reads across them; that's replication, and it's the well-trodden path.

Writes are the hard thing. Every copy of the database has to agree on the new value, so you can't add more copies to absorb more writes — a write has to land everywhere. When *writes* are your wall, copies don't help; you have to split the data itself so different machines own different writes. That's sharding, and it's hard precisely because writes are hard.

**Why this saves you later.** If you misdiagnose this, you'll reach for the wrong tool and the pain won't go away. Teams add read replicas (Phase 2) to a database that's actually drowning in writes and are baffled when nothing improves — replicas don't take writes off the leader; in some ways they add to its load. Before you pick a scaling strategy, measure your read/write ratio. Your database can tell you (for example, PostgreSQL's `pg_stat_statements` breaks down where time goes). Diagnose first. The cure depends entirely on the disease.

## Recap

1. **Scale up before you scale out.** One bigger box keeps the simple mental model; multiple machines impose a permanent coordination tax. Most apps never truly outgrow one well-tuned server.
2. **Scale the query before you scale the hardware.** Missing indexes, N+1 queries, and `SELECT *` masquerade as capacity problems. Fix them first — it's free and it's the biggest win. (See [Why Is My Query Slow?](/guides/why-is-my-query-slow).)
3. **Add a cache** for repeated reads, and **pool your connections** so you don't drown the database — both cheap, both reversible.
4. **Diagnose read-heavy vs. write-heavy.** Reads are scaled with replication (Phase 2); writes, much harder, with sharding (Phase 3). Measure before you choose.

Next: the most common real scaling move there is — making copies of your database so they can share the read load.

---

[← Guide overview](_guide.md) · [Phase 2: Replication →](02-replication.md)
