---
title: "How a pool works and how to size it"
guide: connection-pools
phase: 2
summary: "Why too many connections takes down production, what a database connection actually costs, and how pool sizing keeps app and database alive."
tags: [databases, connection-pool, performance, scaling, postgres]
difficulty: intermediate
synonyms:
  - what is a connection pool
  - too many database connections error
  - postgres max connections exhausted
  - connection pool sizing
  - database connection leak
  - serverless connection storm
updated: 2026-07-10
---

# How a pool works and how to size it

Phase 1 left you with a problem: opening a connection per request is expensive to do and expensive to keep, and the database has a hard ceiling. The fix isn't "open connections faster" - it's to stop opening them per request at all.

A connection pool does that, and the idea is almost embarrassingly simple. Keep a small set of connections open all the time. Lend one out when code needs it, take it back when the code is done, and lend the same one to the next request. Connections never close between requests - they get *reused*.

## The pool is a box of pre-opened connections

Picture a box. When your app starts, the pool opens, say, ten connections and parks them in the box, ready to go. The handshake - the expensive setup from Phase 1 - happens once, at startup, not on the hot path.

Now a request comes in and needs the database. Instead of opening a connection, it asks the pool: *give me one*. It borrows a connection from the box, runs its query, and - this is the crucial part - **returns it to the box** instead of closing it. The next request borrows that same warm, already-authenticated connection.

```text
  Connection pool (size 10)
  ┌─────────────────────────────┐
  │  [c1][c2][c3][c4] ... [c10]  │   all opened once, at startup
  └─────────────────────────────┘
        │ borrow          ▲ return
        ▼                 │
   request A runs query, gives it back
        │ borrow          ▲ return
        ▼                 │
   request B reuses the SAME connection
```

*What just happened:* the handshake cost from Phase 1 got paid once per connection at startup and then amortized across thousands of requests. Each request now pays roughly zero setup cost - it borrows a connection that's already open and authenticated.

## "Acquire, use, release" - and release is sacred

Almost every pool library, in every language, gives you the same three-beat rhythm: **acquire** a connection, **use** it, **release** it back. Names differ - get/borrow/checkout, return/release/close - but it's always those three beats.

```text
conn = pool.acquire()      # borrow from the box (may wait if box is empty)
try:
    conn.execute("SELECT ...")
    rows = conn.fetch()
finally:
    pool.release(conn)     # ALWAYS give it back, even if the query threw
```

*What just happened:* the connection is borrowed, used, and returned in a `try/finally` so it goes back to the box even if the query raises an error. That `finally` is not decoration - it's the difference between a healthy pool and a slow death we'll cover in Phase 3.

Most mature libraries wrap this for you so you can't forget. In Python it's a context manager (`with pool.acquire() as conn:`); in other ecosystems it's a callback or a scope that auto-releases at the end. **Prefer the wrapped form every time.** The manual `acquire`/`release` above is shown so you understand what the wrapper is doing - in real code, let the language hand the connection back for you.

## Sizing: bigger is not better

Here's where intuition lies to you. You had an outage from too few connections, so the instinct is to crank the pool size way up - set it to 500 and never run out, right?

No. A bigger pool makes things *worse* past a point, for two reasons.

**Reason one: the database's hard ceiling is still there.** Your pool size is how many connections *you* hold open. The database's `max_connections` is how many it will accept *total*, across every client. If you run five copies of your app (five servers, five containers) and each has a pool of 100, that's 500 connections demanded against a ceiling of maybe 100. You didn't fix the outage - you moved it. Pool size must be reasoned about *per total deployment*, not per process.

```text
  3 app instances × pool size 100 = 300 connections demanded
  database max_connections        = 100
                                    └─ 200 over the ceiling → rejections
```

*What just happened:* the math that matters is instances times pool size against the server ceiling. A pool that looks safe on one box becomes an overdraft when you scale out horizontally. Always multiply.

**Reason two: the database does less work when you stop over-feeding it.** A database has a finite number of CPU cores and disk spindles. Throw 200 concurrent queries at a machine with 8 cores and they don't all run at once - they fight over the same cores, locks, and disk, generating context-switching overhead and contention. Throughput can actually *drop* past the sweet spot, because queries spend their time waiting on each other instead of finishing.

A widely cited starting point from the PostgreSQL community, popularized by the HikariCP pool, is to begin near `connections = (cores × 2) + effective_spindle_count` and then measure. The exact formula matters less than the lesson: **the right number is small, often surprisingly small - typically dozens, not hundreds - and you find it by measuring, not by maximizing.** Start conservative, watch your latency and throughput under real load, and adjust.

> A small pool that keeps the database happy will out-throughput a huge pool that makes the database thrash. Counterintuitive, but it's the whole reason sizing is a skill and not "set it to a big number."

## What happens when the box is empty

So the pool is small on purpose. What happens when every connection is borrowed and a new request shows up wanting one?

The pool makes that request **wait**. It blocks, holding its place in line, until someone releases a connection back into the box. This is by design and it's healthy - a short wait under a brief spike is far better than crashing the database with unbounded connections.

But waiting has a limit too. Every pool has an **acquire timeout** (sometimes called connection timeout - confusingly, since it's not about the network). If no connection frees up within that window - say, 30 seconds - the waiting request gives up and throws a `pool timeout` / `unable to acquire connection` error. That error means "I asked for a connection, waited my whole patience, and the box never had one free."

```text
  pool full, all 10 borrowed
       │
  request K asks for a connection
       │
       ├─ a connection frees up in time  → K gets it, runs  ✓
       │
       └─ nothing frees up before timeout → K throws "pool timeout"  ✗
```

*What just happened:* an exhausted pool degrades in two stages - first requests *wait* (latency climbs), then they *time out* (errors appear). Seeing pool-timeout errors is your signal that demand is outrunning the pool, the queries are too slow, or - the nasty one - connections aren't being given back. That last case is Phase 3.

For builders: the three numbers you'll actually configure are **pool size** (how many connections in the box), **acquire timeout** (how long a request waits for a free one), and often a **max idle / max lifetime** (when to retire and reopen a connection so it doesn't go stale). Start with a small pool, a sane timeout, and measure before you touch anything.

```quiz
[
  {
    "q": "What makes a connection pool faster than opening a connection per request?",
    "choices": [
      "It compresses query results before sending them",
      "It pays the handshake cost once at startup, then reuses warm connections",
      "It runs queries on the app server instead of the database",
      "It caches query results so the database is never touched"
    ],
    "answer": 1,
    "explain": "The expensive setup (TCP, auth, TLS) happens once when connections are opened. Requests then borrow and return already-open connections, paying almost no setup cost."
  },
  {
    "q": "You run 3 app instances, each with a pool size of 100, against a database with max_connections = 100. What's the problem?",
    "choices": [
      "Nothing - 100 is the per-instance limit",
      "The pools demand up to 300 connections against a ceiling of 100, causing rejections",
      "The database will automatically raise its ceiling to 300",
      "Each instance only ever uses one connection"
    ],
    "answer": 1,
    "explain": "Pool size is per process; the database ceiling is total. Multiply instances by pool size and compare against max_connections - 300 demanded vs 100 allowed overflows."
  },
  {
    "q": "Why can a pool that is too LARGE reduce throughput?",
    "choices": [
      "Large pools use more network bandwidth per query",
      "Too many concurrent queries contend for finite cores, disk, and locks, causing thrash",
      "The pool library scans all connections on every acquire",
      "Larger pools force the database into read-only mode"
    ],
    "answer": 1,
    "explain": "A database has finite CPU and disk. Past a sweet spot, more concurrent connections fight over those resources, and throughput can drop instead of rise."
  }
]
```

[← Phase 1: What a connection actually costs](01-what-a-connection-costs.md) | [Overview](_guide.md) | [Phase 3: When pools break →](03-when-pools-break.md)
