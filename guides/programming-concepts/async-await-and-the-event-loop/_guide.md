---
title: "Async/Await & the Event Loop"
guide: "async-await-and-the-event-loop"
phase: 0
summary: "Async exists because programs spend most of their time waiting; the event loop is a single thread plus a queue of ready-to-continue work; and async/await is just readable syntax over 'a value that isn't here yet.'"
tags: [async, await, event-loop, promises, concurrency, javascript, non-blocking]
category: programming-concepts
difficulty: intermediate
synonyms: ["why does async exist", "what is the event loop", "how does async await work", "what is a promise", "blocking vs non-blocking", "single threaded but concurrent", "what does await do", "dont block the event loop"]
order: 5
updated: 2026-07-10
---

# Async/Await & the Event Loop

You've written `await` because the tutorial told you to, and it worked - until a function returned `Promise { <pending> }`, or a missing `await` let the next line run too early, or someone said "don't block the event loop" and you nodded along. Async code works until it suddenly doesn't, and then it feels like magic that turned on you.

It isn't magic. Async solves an ordinary problem: waiting is slow, and a worker who stands idle while waiting is a worker wasted. This guide builds the model in order - the problem, then the engine, then the syntax - so `await` stops being a spell and becomes something you can reason about.

We'll use JavaScript for the examples because it has the clearest, most-visible async model - but the underlying idea (waiting is wasteful; let the worker do other things) is universal. Python's `asyncio`, Rust's `async`/`.await`, C#'s `async`/`await`, and Kotlin's coroutines are all the same idea wearing different clothes.

## How to read this
- **Want the one-sentence version?** Async exists so a single worker doesn't sit frozen while waiting on the network, disk, or a timer. Read [Phase 1](01-why-async-exists.md) and you'll have the whole point.
- **Want it to finally make sense?** Read in order. Each phase builds on the last: the *problem* (Phase 1), the *engine* (Phase 2), then the *syntax* (Phase 3).

## The phases
1. **[Why Async Exists](01-why-async-exists.md)** - the problem nobody states plainly: a huge fraction of programming is *waiting*. We compare blocking (stop and wait) against non-blocking (start it, do other work, come back) with a restaurant-waiter analogy and a timeline you can see.
2. **[The Event Loop](02-the-event-loop.md)** - the engine that makes non-blocking work: one thread running your code, plus a queue of "things ready to continue." Why "single-threaded but concurrent" isn't a contradiction, and what "don't block the event loop" actually means.
3. **[Promises & async/await](03-promises-and-async-await.md)** - how the syntax maps to the model. A promise is "a value that isn't here yet"; `await` means "pause *this* function until it's ready, without freezing the loop." Annotated before/after, plus the two gotchas that bite everyone.

> This guide is about the *model* - why async exists and how to read it. Deep operational topics (cancellation, backpressure, parallelism across multiple cores, async streams) are deliberately deferred to a follow-up so this one stays a clean mental model rather than a reference manual.

Related reading: [What Happens When Code Runs](/guides/what-happens-when-code-runs) · [Processes, Memory & the CPU](/guides/processes-memory-and-cpu)
