---
title: "Database Connection Pools"
guide: connection-pools
phase: 3
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
updated: 2026-06-30
---

# When pools break: exhaustion, leaks, and serverless storms

You've got a pool. It's sized sensibly. And then one night the pager goes off anyway: requests are timing out, latency is a sawtooth, and the database logs show connections maxed. A pool doesn't make connection problems disappear — it makes them *legible*. The failures now show up at the pool boundary, and once you know the three classic shapes, you can read them like a chart.

## Failure one: exhaustion (the pool is genuinely too small)

The honest case first. Sometimes the pool is exhausted because real demand genuinely exceeds it. Traffic spiked, or your queries got slower, so each connection is held longer, so the box drains faster than it refills.

The symptom is the two-stage decline from Phase 2: latency climbs first (requests waiting for a free connection), then `pool timeout` errors appear (requests giving up). The tell that this is *honest* exhaustion and not a bug: the pressure tracks traffic. It's worst at peak, it eases when traffic drops, and connections do come back.

```text
  latency
    │            ╭─╮        ← peak traffic: requests queue for connections
    │        ╭───╯ ╰──╮
    │   ╭────╯        ╰────  ← off-peak: pool drains slower, recovers
    └────────────────────── time
```

*What just happened:* the latency hump lines up with the traffic curve and recovers on its own. That correlation is the signature of true exhaustion — the fix is more capacity (a slightly bigger pool, faster queries so connections are held less time, or scaling the database itself, which is [scaling a database](/guides/scaling-a-database)).

## Failure two: the leak (connections borrowed and never returned)

This is the cruel one, because it looks like exhaustion but it never recovers. A **connection leak** is code that borrows a connection from the pool and forgets to return it. The connection is gone from the box forever — not closed, not usable, merely held by some code path that wandered off.

Leak a connection per request and your pool drains one slot at a time. The box empties. Then *every* request starts timing out, traffic high or low, and a restart "fixes" it (the pool refills) only for it to drain again. The classic cause is exactly the missing `finally` from Phase 2: an error fires mid-request, the code jumps to the error handler, and the line that releases the connection never runs.

```text
  Healthy:   acquire ──▶ use ──▶ release        (box stays full)

  Leak:      acquire ──▶ use ──▶ 💥 error
                                  │
                                  └─ jumps to handler, release SKIPPED
                                     connection lost from the box forever
```

*What just happened:* one error path skipped the release, so that connection never came back. Repeat per request and the pool bleeds dry. The signature that distinguishes a leak from honest exhaustion: it gets monotonically worse over time regardless of traffic, and a restart resets the clock instead of fixing the cause.

The fix is structural, not heroic. **Never release by hand on the happy path and hope.** Use the language's scoped form so the connection is returned no matter how the block exits:

```python
# Good: the context manager releases on every exit — return, raise, anything.
with pool.acquire() as conn:
    rows = conn.execute("SELECT ...").fetchall()
# connection is back in the box here, even if execute() raised
```

*What just happened:* the `with` block guarantees the connection returns to the pool whether the body finishes normally or throws. This is the same `try/finally` from Phase 2, made automatic — and it's the single most effective leak prevention there is.

> Most pool libraries can also set a **leak detection threshold**: log a warning if a connection is held longer than, say, 30 seconds. Turn it on. It points a finger at the exact code path holding connections hostage, instead of leaving you guessing.

## Failure three: the serverless connection storm

This one blindsides people moving to serverless (Lambda, Cloud Functions, and friends), because the platform's whole model fights the pool's whole model.

A pool works because it's *long-lived*: one process, holding a box of connections, reusing them across thousands of requests. Serverless is the opposite — each function instance is short-lived and isolated, and the platform spins up a *fresh instance per concurrent request* to scale. There's no shared long-lived process to host a shared pool.

So the naive approach — open a connection (or a tiny pool) inside the function — turns catastrophic under load. Traffic spikes to 1,000 concurrent requests, the platform obliges by launching 1,000 function instances, and each one independently opens a connection. That's 1,000 connections stampeding your database at once. The ceiling from Phase 1 is obliterated instantly.

```text
  1 request   →  1 function instance  →  1 connection
  1,000 requests at once
       → platform spins up ~1,000 instances
       → ~1,000 connections opened simultaneously
       → database max_connections (≈100) → instant "too many clients"
```

*What just happened:* serverless scales by multiplying isolated instances, and each instance opening its own connection multiplies connections in lockstep with traffic. The pool's "reuse across requests" superpower can't happen, because there's no shared process to reuse across.

The fix is an **external pooler** — a connection-pooling proxy that lives *between* your functions and the database, as its own long-lived service. Your thousand function instances connect to the pooler (which is cheap to connect to); the pooler maintains one small, sane pool of real connections to the database and multiplexes everyone's queries over them. In the PostgreSQL world this is PgBouncer (or a managed equivalent your cloud or database provider offers); other databases have their analogues.

```text
  1,000 function instances
        │  (cheap client connections)
        ▼
   ┌──────────────┐
   │   pooler     │   holds ONE small real pool
   │  (PgBouncer) │
   └──────┬───────┘
          │  (e.g. 20 real connections)
          ▼
      database  ✓ never sees the storm
```

*What just happened:* the pooler absorbs the stampede. A thousand functions hit the pooler, but the database only ever sees the pooler's small, fixed set of real connections. The "reuse a fixed set" idea from Phase 2 still wins — it just had to move out of the function and into a shared proxy.

## How to read the three at a glance

When connections are maxed and the pager's screaming, this is the triage:

- **Tracks traffic, recovers on its own?** → honest exhaustion. Add capacity or speed up queries.
- **Monotonically worse, restart resets it?** → a leak. Find the unreturned connection; switch to scoped acquire.
- **On serverless and spikes instantly with concurrency?** → connection storm. Put a pooler in front.

For builders: the throughline across all three failures and both earlier phases is one idea — **a fixed, reused set of connections, always returned, sized to what the database can actually serve.** Pools, scoped acquires, and external poolers are three forms of that same discipline. Get it right and the database stops being the thing that takes you down at 3am.

```quiz
[
  {
    "q": "A connection leak and honest exhaustion both show pool-timeout errors. What distinguishes a leak?",
    "choices": [
      "A leak only happens at peak traffic",
      "A leak gets monotonically worse over time regardless of traffic, and a restart temporarily resets it",
      "A leak shows no errors, only slower queries",
      "A leak fixes itself when traffic drops"
    ],
    "answer": 1,
    "explain": "Honest exhaustion tracks the traffic curve and recovers. A leak drains the pool steadily no matter the load, and restarting only refills the box until it bleeds out again."
  },
  {
    "q": "What is the single most reliable way to prevent connection leaks?",
    "choices": [
      "Increase the pool size so leaks don't matter",
      "Call release() at the end of every function",
      "Use the language's scoped form (e.g. a context manager) that returns the connection on every exit path",
      "Restart the app on a schedule"
    ],
    "answer": 2,
    "explain": "A scoped acquire returns the connection whether the block finishes normally or throws, eliminating the missing-finally bug that causes most leaks."
  },
  {
    "q": "Why does a naive in-function pool cause a 'connection storm' on serverless platforms?",
    "choices": [
      "Serverless functions run queries more slowly",
      "The platform spins up an isolated instance per concurrent request, so each opens its own connection — connections scale with traffic",
      "Serverless disables connection pooling entirely",
      "Functions share one connection that gets overloaded"
    ],
    "answer": 1,
    "explain": "Serverless scales by multiplying isolated short-lived instances. With no shared long-lived process, each instance opens its own connection, so a traffic spike becomes a connection spike. An external pooler absorbs it."
  }
]
```

[← Phase 2: How a pool works and how to size it](02-how-a-pool-works.md) | [Overview](_guide.md)
