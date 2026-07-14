---
title: "Reading and Tuning a Real GC"
guide: "how-garbage-collectors-work"
phase: 3
summary: "What a real GC log actually shows, the handful of tuning knobs that matter versus the ones that rarely do, and the plain first move before tuning: allocate less. Plus Rust's alternative - no collector at all."
tags: [garbage-collection, gc-tuning, gc-logs, heap-sizing, allocation-pressure, rust-ownership]
difficulty: advanced
synonyms: ["how to read a gc log", "how to tune the jvm garbage collector", "what gc settings actually matter", "how to reduce garbage collection pauses", "why doesn't rust have a garbage collector", "gc tuning best practices"]
updated: 2026-07-10
---

# Reading and Tuning a Real GC

Phases 1 and 2 built the theory: counting versus tracing, generations, concurrent marking. None of it matters if you can't look at a running system and tell whether the collector is a problem. This phase closes the loop - reading the log a real collector emits, knowing which settings are worth touching, and the move that beats tuning almost every time.

## What a GC log actually says

Every production collector can emit a log line per collection. The fields differ by runtime, but the shape is universal - strip away the syntax and a JVM G1 log line and a Go GC trace line are reporting the same four facts.

```text
[12.487s][info][gc] GC(42) Pause Young (Normal) (G1 Evacuation Pause)
    5120M->1830M(8192M) 14.221ms
```

Read it left to right: **what** ran (a young/minor collection - cheap, expected to be frequent, versus a full/major collection - expensive, rare), **heap before → heap after** (5120 MB live before, 1830 MB after - the difference, 3290 MB, is what got reclaimed), **heap capacity** (8192 MB total, so this heap is nowhere near full), and **pause time** (14.221ms - how long application threads were actually stopped for this collection).

Three questions answer almost everything you need from a stream of these lines:

- **Which generation keeps collecting?** If you see wall-to-wall young collections and almost no full collections, the generational split is working as intended. If full collections show up often, objects are being promoted to the old generation faster than expected - which usually means something is living longer than it should (a cache, a listener, an accidental reference), the exact leak shape from the intro-level guide's Phase 3.
- **Is the heap shrinking back down after each collection, or creeping up over time?** `5120M->1830M` shrinking back to roughly the same floor every time is healthy - garbage in, garbage out. A floor that rises collection after collection (`1830M`, then `2400M`, then `3100M`, never coming back down) is the log-level signature of a real leak: reachable memory that's growing, not being missed by the collector.
- **Are pause times acceptable for what you're building?** 14ms is invisible to a batch job and possibly noticeable in an audio pipeline. "Good" pause time is entirely defined by your latency budget, not by a universal number.

## The knobs that matter, and the ones that don't

**Heap size** is the one setting nearly every runtime exposes and the one most worth setting deliberately (the JVM's `-Xmx`/`-Xms`, Go's `GOGC` and newer `GOMEMLIMIT`, Node's `--max-old-space-size`). A heap that's too small forces frequent, sometimes full, collections because the collector is constantly under pressure to reclaim space; the CPU cost of collection rises to fill the gap. A heap that's too large means the collector rarely triggers - fewer pauses - but a full collection, when it finally happens, has more live data to trace, so each individual pause takes longer. In containers, set this explicitly: a JVM that doesn't know it's confined to a 512MB container will assume it owns the whole host and get OOM-killed, not garbage-collected out of the problem.

**Generation sizing** (the young/old ratio, where the runtime exposes it) is worth touching only after you've read the logs and confirmed objects are getting promoted before they should. A young generation too small promotes short-lived objects into the old generation because they didn't die fast enough to be caught by a minor collection - undoing the entire benefit of Phase 2's generational split. This is a real, measurable problem, but a narrow one: diagnose it from promotion rates in the log, don't guess at it.

**What rarely helps:** switching collector algorithms (G1 vs. ZGC, say) as a first move, or hand-tuning a dozen obscure flags copied from a blog post without reading your own logs first. Different collectors trade throughput for pause time in different ways, and that trade-off is real - but it's the second move, made after you know *what* is wrong from the logs, not the first move made instead of looking.

## The move that beats tuning: allocate less

Here's the plain order of operations, and it's the same one both the Java and Go per-language guides land on independently: **the collector's total cost is roughly proportional to how much garbage you create**, not to any setting you can flip. A collector spending too much time collecting is very often a program creating unnecessary short-lived garbage in a hot path - a string concatenated in a loop instead of built once, an object allocated per iteration that could be reused, a data structure copied when a reference would do.

Reducing allocation pressure fixes the actual cause: fewer objects born means fewer minor collections, less promotion pressure, and a smaller working set for any eventual full collection. Tuning a heap size or collector flag around a wasteful allocation pattern treats the symptom - it can buy headroom, but the underlying cost is still there, and it comes back the moment load increases. Profile allocations first (both Java and Go guides show the tools for this in their own performance phases); tune the collector second, with log evidence in hand for what specifically is going wrong.

## Rust's different bet: no collector at all

Every collector in this guide - counting, tracing, generational, concurrent - exists to answer one question automatically at runtime: is this object still reachable? [Rust](/guides/rust-from-zero) answers a version of that question at **compile time** instead, through ownership and borrowing: every value has exactly one owner, the compiler tracks when that owner goes out of scope, and memory is freed deterministically at that point - no tracing, no pause, no runtime collector thread at all.

This isn't a smaller or faster garbage collector. It's the reference-counting insight from Phase 1 (deallocation tied to a countable, trackable notion of "still needed") pushed to its extreme: instead of a runtime counter checked at each mutation, the compiler proves ownership statically and inserts the `drop` calls itself. The trade is real and openly acknowledged by the language: you spend more effort upfront satisfying the borrow checker, in exchange for zero GC pauses and no runtime tracing cost, ever. For latency-critical systems where even ZGC's sub-millisecond pauses are unacceptable, that trade is often exactly right; for a good part of everyday application code, a well-tuned generational collector is genuinely less work for a comparable result. Both are legitimate engineering answers to the same underlying problem - they just move the cost to a different phase of the program's life.

```quiz
[
  {
    "q": "A GC log shows the heap floor after each collection rising from 1830M to 2400M to 3100M over time, never returning to its earlier level. What does this most likely indicate?",
    "choices": ["The heap size is set too high and should be lowered", "A real memory leak - reachable memory is genuinely growing, not just failing to be collected promptly", "The collector is broken and not running at all", "This is normal and expected behavior for any long-running program"],
    "answer": 1,
    "explain": "A shrinking-back-down floor after each collection is healthy. A floor that climbs collection after collection means live, reachable memory keeps growing - the collector is doing its job correctly, but something in the program keeps holding references it should release."
  },
  {
    "q": "According to this phase, what should you check before reaching for heap-size flags or switching collector algorithms?",
    "choices": ["Whether the CPU has enough cores", "Whether the program is allocating more short-lived garbage than necessary in its hot paths", "Whether the operating system's page cache is large enough", "Whether the source code compiles with optimizations enabled"],
    "answer": 1,
    "explain": "Collector cost scales with how much garbage the program creates. Reducing unnecessary allocation in hot paths addresses the root cause; tuning heap size or swapping collectors first treats the symptom and the cost returns as load grows."
  },
  {
    "q": "How does Rust avoid needing a garbage collector at all?",
    "choices": ["It uses reference counting for every single value automatically", "The compiler tracks ownership statically and inserts deallocation calls at compile time, with no runtime tracing", "It relies on the operating system to reclaim memory when the process exits", "It requires the programmer to call free() manually on every allocation"],
    "answer": 1,
    "explain": "Rust's ownership and borrowing rules let the compiler prove, at compile time, exactly when a value is no longer needed, and insert the drop there. There's no runtime collector thread, no tracing pass, and no GC pause - the cost moves to compile-time borrow checking instead."
  }
]
```

---

[← Phase 2: Generational and Concurrent Collectors](02-generational-and-concurrent-collectors.md) · [Guide overview](_guide.md)
