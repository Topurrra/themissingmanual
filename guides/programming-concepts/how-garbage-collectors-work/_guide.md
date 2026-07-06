---
title: "How Garbage Collectors Actually Work"
guide: "how-garbage-collectors-work"
phase: 0
summary: "The engineering deep dive behind automatic memory management: reference counting vs. mark-and-sweep, why generational and concurrent collectors exist, and how to read a real GC log and tune the knobs that matter."
tags: [garbage-collection, memory-management, reference-counting, mark-and-sweep, generational-gc, tri-color, gc-tuning]
category: programming-concepts
order: 15
difficulty: advanced
synonyms: ["how does garbage collection really work", "reference counting vs mark and sweep", "what is a generational garbage collector", "how does concurrent gc work", "tri-color marking explained", "how to read a gc log", "how to tune garbage collection", "why doesn't rust have a garbage collector"]
updated: 2026-07-06
---

# How Garbage Collectors Actually Work

You know garbage collection exists: you allocate objects, stop referencing them, and eventually the memory comes back without a `free()` call. [Memory & Garbage Collection, Explained](/guides/memory-and-garbage-collection) covers that mental model - reachability, a gentle pass at mark-and-sweep, why pauses happen. This guide starts where that one stops. It's the algorithm-level view: the two competing ideas GC is built from, why almost no production collector uses either one in its pure form, and what to actually do when a GC log says your service is spending too much time collecting.

This is language-agnostic on purpose. Whether you write [Java](/guides/java-from-zero), [C#](/guides/csharp-from-zero), [Go](/guides/go-from-zero), [Python](/guides/python-from-zero), or [JavaScript](/guides/javascript-from-zero), your runtime's collector is some combination of the ideas in these three phases. [Rust](/guides/rust-from-zero) is the interesting exception - no GC at all - and Phase 3 explains why that trade-off works.

## The phases

1. **[Reference Counting and Mark-Sweep, the Two Basic Ideas](01-reference-counting-and-mark-sweep.md)** - the two foundational strategies: count references and free at zero, or trace reachability from roots and sweep the rest. What each gets right, and the cycle problem that reference counting can't solve alone.
2. **[Generational and Concurrent Collectors](02-generational-and-concurrent-collectors.md)** - why "most objects die young" reshapes the whole design, and how tri-color marking lets a collector work while your program keeps running instead of freezing it.
3. **[Reading and Tuning a Real GC](03-reading-and-tuning-a-real-gc.md)** - what a GC log actually tells you, the few settings worth touching, and why reducing allocations beats fighting the collector. Plus Rust's alternative: no collector, ownership enforced at compile time.

By the end, a GC log stops being noise, a `-Xmx` flag stops being folklore, and "why doesn't X language just use a GC" has a real answer instead of a vibe.
