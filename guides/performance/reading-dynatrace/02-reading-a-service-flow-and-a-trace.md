---
title: "Reading a Service Flow & a Trace"
guide: "reading-dynatrace"
phase: 2
summary: "Follow one request across services, read the response-time breakdown to see where the milliseconds actually go, and spot the slow tier or failing dependency in a distributed trace."
tags: [dynatrace, distributed-tracing, service-flow, response-time, waterfall, span, latency]
difficulty: intermediate
synonyms: ["read a dynatrace trace", "dynatrace service flow", "dynatrace response time breakdown", "where do the milliseconds go", "dynatrace distributed trace waterfall", "find the slow service in a trace", "dynatrace span explained"]
updated: 2026-06-19
---

# Reading a Service Flow & a Trace

"It's slow" is the least useful sentence in an incident — and it's usually where you start. Someone points at
a trace and the obvious next question is the hard one: slow *where*? Slow in your code, slow waiting on a
database, slow because of one bad dependency three hops away? Staring at a chart of average response time
won't tell you. A single trace will.

A **distributed trace** is the record of *one request* as it travels through every service it touches. This
phase teaches you to read one: to follow the request across services, see where the milliseconds actually go,
and point at the tier that's eating the time. This is the difference between "checkout is slow" and "checkout
spends 90% of its time waiting on orders-db, which is fine until you look at the query."

> ⏭️ If "trace" and "span" are fuzzy, they're defined properly in
> [Observability: Logs, Metrics & Traces](/guides/observability-logs-metrics-traces). One line to carry in:
> a **trace** is the whole request's journey; a **span** is one timed segment of it (one service's piece, or
> one database call).

## What a trace is showing you — one request, broken into timed segments

**What it actually is.** Picture following a single customer's checkout click through your system. It hits
`checkout-svc`, which calls `pricing-svc`, which queries `orders-db`. The trace records each of those hops with
*when it started* and *how long it took*. Dynatrace draws this as a **waterfall**: nested bars, where bar
length is time and indentation is "who called whom."

**Why people get this wrong.** The common mistake is reading the waterfall like a to-do list — top to bottom,
as if each bar happens after the one above. It doesn't. A child bar sits *inside* its parent's time: the
parent is *waiting* while the child runs. The shape you're reading is "who is blocked on whom," not a sequence
of independent steps.

```text
   ONE TRACE AS A WATERFALL  (time flows left → right; illustrative ms)

   checkout-svc          |■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■|   480 ms total
     ├ own work          |■■|                              20 ms (its own code)
     ├ pricing-svc       |  ■■■■■■■■■■■■■■■■■■■■■■■■■■■|    440 ms
     │   ├ own work      |  ■■|                            25 ms
     │   └ orders-db     |    ■■■■■■■■■■■■■■■■■■■■■■■■|     410 ms   ◄── the time sink
     └ render response   |                          ■■|    20 ms
```

*What just happened:* The total is ~480 ms, but `checkout-svc`'s *own* code only spent ~20 ms. Almost all the
time is inside `pricing-svc`, and almost all of *that* is one `orders-db` call at ~410 ms. The request isn't
slow because of checkout — checkout is mostly *waiting*. The waterfall just walked you three hops down to the
actual time sink. (Numbers here are illustrative, to show the shape — yours will differ.)

## The response-time breakdown — where the milliseconds actually go

**What it actually is.** For a service, Dynatrace summarizes *across many requests* where time is spent: how
much in the service's **own code** (CPU, in-process work) versus how much **waiting on calls to other
services and databases**. It's the waterfall idea aggregated — the same "self time vs. waiting time" split,
but for the service as a whole.

**What it does in real life.** This one breakdown settles the argument that wastes the most incident minutes:
*is it us or is it downstream?* If the bulk of a service's time is its own code, the problem is in this
service — a hot loop, a slow algorithm, garbage-collection pauses. If the bulk is waiting on a downstream
call, this service is healthy and you should follow the arrow to whatever it's waiting on.

💡 **Key point.** "Self time" (the service's own work) vs. "waiting time" (blocked on something downstream) is
the single most useful split on the screen. Read it first. It tells you whether to dig into *this* code or to
keep walking down the trace.

⚠️ **Gotcha — a fast bar can hide a slow truth.** A downstream span that looks quick might be quick because it
*failed fast* (errored in 5 ms instead of doing real work), or because that hop is uninstrumented and its real
time is invisible (see Phase 1). Don't read "short bar" as "healthy" on reflex. Cross-check with the failure
indicator on that span and with whether the tier is actually instrumented.

## Spotting the slow tier or the failing dependency

**What it actually is.** With the waterfall and the self-vs-waiting split, finding the culprit becomes a short
walk: start at the top, follow the longest child bar down, and stop where the time is being *spent* rather
than *passed along*. The deepest bar that's long *and* mostly its own work is your slow tier.

**A real example — reading a failing dependency.** Failures show up on the span itself. Suppose the same trace
comes back not slow but broken:

```console
Trace  checkout-svc  ·  POST /api/checkout  ·  Failed
  checkout-svc        18 ms   OK
    pricing-svc       12 ms   OK
      orders-db        6 ms   Failed
        error: connection refused (orders-db:5432)
  checkout-svc                Failed   HTTP 500 returned to caller
```

*What just happened:* The trace is fast — only ~18 ms — so this is *not* a performance problem. The failure
originates at the bottom: `orders-db` refused the connection in ~6 ms, `pricing-svc` couldn't get its data,
and the error bubbled up until `checkout-svc` returned a 500 to the user. Reading bottom-up, the *origin* of
the failure is the database connection, not the two services that faithfully reported it. The services aren't
broken; they're messengers.

📝 **Terminology — origin vs. impact.** The span where an error *first appears* is the **origin**. The spans
above it are the **impact** (they failed *because* the origin did). Incident time gets wasted when people debug
the impact. Trace the error to its origin span first.

**Why this saves you later.** A metric tells you a service got slower or started failing. A trace tells you
*which hop, and whether it's spending time or waiting, and where an error was born.* When you can read one
trace end to end, you can answer "is it us or them?" in under a minute — and stop debugging the service that's
merely downwind of the real problem.

## Recap

1. **A trace is one request's journey**; the **waterfall** shows nesting (who waits on whom), not a sequence —
   a child bar runs *inside* its parent's time.
2. **The response-time breakdown** splits a service's time into **own code** vs. **waiting on downstream** —
   read this first to settle "is it us or downstream?"
3. **Find the slow tier** by following the longest child bar to the deepest span that's long *and* mostly its
   own work.
4. **Find a failing dependency** by tracing the error to its **origin span** — the spans above it are impact,
   not cause.
5. **A short bar isn't automatically healthy** — it can mean a fast failure or an uninstrumented hop.

You can now read a single request. The last step is what Dynatrace does when *many* requests go wrong at once
— and how it tries to name the cause for you.

---

[← Phase 1: What Dynatrace Actually Is](01-what-dynatrace-actually-is.md) · [Guide overview](_guide.md) · [Phase 3: Problems & Root Cause →](03-problems-and-root-cause.md)
