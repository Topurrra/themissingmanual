---
title: "What a connection actually costs"
guide: connection-pools
phase: 1
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

# What a connection actually costs

Here's the trap, and almost everyone falls in it once. You learned that a database is a thing you talk to. You send a query, you get rows back. So when you needed to talk to it from your code, you opened a connection, ran the query, and moved on. It worked. It worked in development, it worked in the demo, it worked for the first thousand users.

Then it didn't. And the error wasn't `query too slow` - it was `FATAL: sorry, too many clients already` or `remaining connection slots are reserved`. Your queries were fine. You ran out of *doors*.

To understand why, you have to unlearn one thing: a connection is not like calling a function. It feels free because the code looks tiny. It is not free.

## A connection is a living thing on the server

When your app opens a database connection, the database doesn't hand you a lightweight token. On a server like PostgreSQL, it forks a whole backend process to serve you. That process holds memory for your session: work buffers for sorting and joins, caches, the state of your current transaction, prepared statements, temporary tables. It sits there, alive, waiting for your next query - even when you're doing nothing.

Think of it less like dialing a phone number and more like hiring an employee. Opening a connection is an interview and onboarding. The connection sitting idle is that employee on payroll, taking up a desk, whether or not there's work to do.

```text
Your app                          PostgreSQL server
   |                                     |
   |---- TCP connect ------------------->|   (network round trip)
   |<--- "who are you?" -----------------|
   |---- auth / password / TLS -------->|   (more round trips)
   |<--- "ok, here's your backend" -----|   (server forks a process,
   |                                     |    allocates memory for it)
   |---- SELECT ... -------------------->|
   |<--- rows ---------------------------|
   |        (process stays alive,        |
   |         holding memory, idle)       |
```

*What just happened:* opening one connection cost several network round trips for the handshake, plus the server spinning up a dedicated process that now consumes memory for as long as the connection lives. None of that is the query. That's the price of admission, paid before you run anything.

## Two costs, and they bite at different times

It helps to separate the two ways a connection costs you, because they hurt in different situations.

**The setup cost (latency).** The TCP handshake, the authentication, the TLS negotiation if you're encrypting - these are round trips across the network. If your database is a millisecond away and you open a connection per request, you've added that handshake to every single request. A query that takes 2ms now lives behind 5ms of "hello, who are you, let me allocate you a process." You made the fast part wait on the slow part.

**The standing cost (memory and slots).** Every open connection holds server memory whether it's busy or idle. And the database has a hard ceiling on how many it will accept at once - in PostgreSQL that's the `max_connections` setting, often defaulted to around 100. Hit that ceiling and the next connection attempt is *rejected*. Not slowed. Rejected, with the `too many clients` error. The database is protecting itself, because each connection it accepts is more memory it has promised to hold.

> The dangerous part: the standing cost is invisible in development. With one developer and a handful of requests, you never approach the ceiling. The wall is real, but you only meet it under load - in production, at the worst possible moment.

## Why "open one per request" melts the database

Now put it together. Imagine your app opens a fresh connection for every incoming web request, runs its query, and closes it.

At ten requests a second, that's ten handshakes a second, ten processes flickering into existence and dying. Wasteful, but survivable. Now you go viral and it's five hundred requests a second, each holding its connection for the few hundred milliseconds it takes to do real work. Do the arithmetic: requests arriving faster than they finish means open connections pile up. You blow past `max_connections` in seconds.

```text
Requests per second climbing →

   10 req/s  : ~a few connections alive at once   → fine
  100 req/s  : ~dozens alive at once              → getting warm
  500 req/s  : hundreds wanted, ceiling is 100    → REJECTED
                                                     "too many clients"
```

*What just happened:* the failure isn't gradual degradation - it's a cliff. Below the ceiling you're fine; cross it and new connections are flatly refused. CPU can be near idle while the database refuses everyone, because the limit you hit was the *connection count*, not the *compute*. This is exactly the "20% CPU, total outage" mystery from the overview.

For builders: this is the moment most people first reach for a connection pool - not because they read about it, but because production taught them. The pool exists precisely so you stop paying the setup cost on every request and stop piling toward the standing-cost ceiling. That's Phase 2.

## The mental model to keep

Burn this one sentence in: **a connection is expensive to open and expensive to keep, and the database can only keep so many.** Everything else in this guide is a consequence of that one fact. Pools, sizing, leaks, the serverless storm - all of it is people trying to live within those two costs and that one hard ceiling.

If a database is new to you, the broader picture of what you're connecting *to* lives in [what a database is](/guides/what-a-database-is). And when the ceiling itself becomes the bottleneck no matter how clever your pool is, that's a scaling problem - see [scaling a database](/guides/scaling-a-database).

```quiz
[
  {
    "q": "On a server like PostgreSQL, what does opening a single connection typically allocate?",
    "choices": [
      "Nothing until you run a query",
      "A dedicated backend process holding memory for your session",
      "A shared read-only buffer used by all clients",
      "A temporary file on disk that is deleted on the next query"
    ],
    "answer": 1,
    "explain": "The server forks a backend process that holds session memory for as long as the connection lives - even while idle."
  },
  {
    "q": "Why can the database refuse new connections while its CPU is nearly idle?",
    "choices": [
      "The query planner is broken under load",
      "CPU and connections are the same limit",
      "It hit max_connections - a hard ceiling on connection count, not compute",
      "Idle CPU always means the disk is full"
    ],
    "answer": 2,
    "explain": "max_connections caps how many connections the server will accept. Hit it and new ones are rejected outright, regardless of CPU headroom."
  },
  {
    "q": "What is the 'setup cost' of a connection?",
    "choices": [
      "The memory a connection holds while idle",
      "The handshake round trips: TCP, auth, and TLS before any query runs",
      "The time the query itself takes to execute",
      "The cost of writing the result rows to disk"
    ],
    "answer": 1,
    "explain": "Setup cost is latency from the handshake - TCP, authentication, TLS - paid before a single query runs. Standing cost is the idle memory and slot."
  }
]
```

[← Overview](_guide.md) | [Phase 2: How a pool works and how to size it →](02-how-a-pool-works.md)
