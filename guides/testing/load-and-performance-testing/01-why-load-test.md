---
title: "Why Load-Test"
guide: "load-and-performance-testing"
phase: 1
summary: "Correctness tests ask 'is it right?' for one user; load tests ask 'does it still work when a crowd arrives at once?' Here's the mental model, the launch-day scenario, and what you're trying to learn before your users learn it for you."
tags: [load-testing, mental-model, correctness, concurrency, capacity, launch-day]
difficulty: advanced
synonyms: ["why do load testing", "difference between functional tests and load tests", "what does load testing actually prove", "will my server handle launch traffic", "what is a virtual user"]
updated: 2026-06-19
---

# Why Load-Test

Here's the trap, and almost everyone falls into it once. You've done the work. The test suite is green, you've used the app yourself, a teammate clicked through it. By every signal you have, *it works*. So when someone asks "is it ready for launch?" you say yes - because the only question you know how to answer is *does it work?*, and the answer is clearly yes.

Then launch day arrives, a few thousand people hit it in the same ten minutes, and it falls over. And the worst part is the confusion: *nothing changed*. The code that's failing right now is the exact same code that passed every test this morning. So what broke?

Nothing broke. You just answered the wrong question. Let's fix the mental model, because once you see the two questions clearly, everything about load testing follows.

## Two completely different questions

**What it actually is.** There are two separate things you can ask about a system, and they need different tools to answer:

- **"Is it correct?"** - Given this input, do I get the right output? Does the login button log you in? Does the total add up? This is what your unit tests, integration tests, and end-to-end tests check. They run one path at a time and check the answer.
- **"Does it hold?"** - When a *crowd* arrives at once, does it stay fast and keep answering, or does it slow to a crawl, start throwing errors, and tip over? This is what a **load test** checks.

A correctness test runs your code. A load test runs your code *the way a crowd would* - many requests at the same time, sustained - and watches what happens to speed and stability.

```text
   CORRECTNESS TEST                       LOAD TEST
   ──────────────────────────────        ──────────────────────────────
   one request at a time            │     hundreds/thousands at once
   asks: is the output right?       │     asks: is it still fast & up?
   passes or fails                  │     produces a curve (speed vs. load)
   green = the logic is correct     │     green = it survives the crowd
   runs in CI on every commit       │     runs before launch / big changes
```

**Why people get this wrong.** The instinct is that a green test suite means "ready." But correctness and capacity are independent. Perfectly correct code can be catastrophically slow under load, and - more confusingly - *fast* code can still collapse under a crowd for reasons that have nothing to do with the logic. The logic was never the bottleneck.

**Why this saves you later.** Once you hold these as two separate questions, "it passed all the tests but died on launch day" stops being a mystery. The tests answered *correct?* They were never asked *holds?* Load testing is you asking the second question on purpose, in private, before the crowd asks it for you in public.

## Why correct code falls over under a crowd

If the code is right, what actually breaks? It's almost never the logic - it's a **shared, finite resource** that one user never touches the edge of, but a thousand users exhaust together. A few of the usual suspects:

- **The database connection pool.** Your app keeps a small fixed set of connections to the database - say 20. One user borrows one for a few milliseconds and returns it; you'd never notice. But when 500 requests arrive at once and each wants a connection, 480 of them *wait in line* for one to free up. Requests that took 50 ms now take seconds, purely from queueing.
- **Memory.** Each in-flight request holds some memory. One at a time, trivial. Thousands at once, and the process balloons - and if it crosses the limit, the operating system kills it (the "out of memory" story from the [Processes, Memory & CPU](/guides/processes-memory-and-cpu) guide).
- **A query that doesn't scale.** A query with no index is fine at ten rows and a disaster at ten million. Your test database had ten rows. Production has ten million. The logic is identical; the behavior is not.
- **An external dependency.** You call a payment API or a third-party service. It's fast for one call and rate-limits or queues you under a flood.

📝 **Terminology.** A *resource* here means anything the system has a limited amount of and must share across requests: CPU time, memory, database connections, file handles, network sockets, threads. Load problems are almost always a story about one of these running out.

The pattern is the same every time: a resource that is effectively infinite for one user is sharply finite for a crowd. Correctness tests use one user, so they never see the edge. A load test exists to walk you up to that edge deliberately.

🪖 **War story.** A team launched a sign-up flow that passed every test and ran beautifully in the demo. The launch tweet went out; within minutes sign-ups were timing out. The code was fine. The cause was a connection pool of 10 against a sudden burst of hundreds of concurrent sign-ups - 10 requests worked, the other hundreds sat in a queue until they timed out. A thirty-minute load test the week before would have shown the exact same queue forming at a few hundred users. Nobody had thought to ask the second question.

## What you're actually trying to learn

A load test isn't a pass/fail gate like a unit test. You're not looking for a green checkmark - you're trying to *learn three numbers about your system* before reality teaches them to you:

1. **How much can it take?** At what level of traffic does it stop being fast and reliable? This is your **capacity** - the honest ceiling, not the hopeful one.
2. **What happens *at* the edge?** When you push past comfortable, does it degrade gracefully (gets a bit slower, keeps serving) or fall off a cliff (errors spike, everything times out at once)? The difference decides whether a traffic spike is a slow afternoon or a full outage.
3. **Does it stay healthy over time?** Run it for hours, not minutes - does it hold steady, or does something slowly leak (memory, connections, disk) until it dies at hour six? A short test can't see this; a sustained one can.

📝 **Terminology.** A *virtual user* (VU) is the load tool's stand-in for one person using your app - it sends requests, waits a realistic moment ("think time"), then sends the next, just like a human would. You run a test by simulating many virtual users at once. We'll use the term throughout.

⚠️ **Gotcha - don't confuse "will it hold" with "why is it slow."** Load testing tells you *that* the system slows down or breaks at, say, 800 concurrent users - the symptom. It does **not** tell you *which line of code or which query* caused it - the cause. Finding the cause is profiling and observability, a separate discipline (flame graphs, query plans, traces) that lives in the future **performance** category. Keep the jobs separate: load testing finds the breaking point; profiling explains it. Trying to do both at once is how a clear afternoon turns into a confused one.

## Recap

1. There are **two different questions**: *is it correct?* (unit/integration/[e2e tests](/guides/unit-integration-e2e)) and *does it hold under a crowd?* (load tests). Green correctness tests say nothing about capacity.
2. Correct code falls over because a **shared finite resource** - connections, memory, a slow query, an external API - is fine for one user and exhausted by a crowd.
3. A load test isn't pass/fail; it's how you **learn your real capacity, how it behaves at the edge, and whether it stays healthy over time** - before your users find out for you.
4. Load testing finds the **symptom** (it breaks at N users); **profiling** finds the cause (why). This guide stays on the first.

Now that you know *why* you're running one, you need to know what to actually watch while it runs. Three numbers tell the whole story - and one of them is measured in a way that trips up almost everyone the first time.

---

[← Guide overview](_guide.md) · [Phase 2: The Metrics That Matter →](02-the-metrics-that-matter.md)
