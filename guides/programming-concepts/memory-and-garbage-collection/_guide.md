---
title: "Memory & Garbage Collection, Explained"
guide: "memory-and-garbage-collection"
phase: 0
summary: "What actually happens to the objects your code creates: where they live in memory, why some of them have to be cleaned up, and how the two big approaches - freeing memory by hand versus a garbage collector that does it for you - really work."
tags: [memory, garbage-collection, heap, stack, allocation, leaks, mark-and-sweep]
category: programming-concepts
order: 6
difficulty: intermediate
synonyms: ["what is garbage collection", "how does garbage collection work", "what is a memory leak", "manual vs automatic memory management", "what is the heap", "stack vs heap", "why does my program pause", "what is mark and sweep", "do garbage collected languages have memory leaks"]
updated: 2026-06-19
---

# Memory & Garbage Collection, Explained

You've created plenty of objects. A list here, a user record there, a string you built up in a loop - you wrote `new` or `{}` or just assigned a value and moved on. The thing appeared, did its job, and you never thought about it again. Which is exactly the point: most of the time, you're not *supposed* to think about it.

But "you never think about it" is hiding a real question, and one day it stops hiding. Why does a Java service pause for a fraction of a second under load? Why does a long-running Node process slowly eat more and more memory until it's restarted? Why do C programmers talk about "use-after-free" like it's a horror story? All three are the same topic wearing different clothes: **what happens to the objects you create, and who is responsible for cleaning them up.**

Once you can picture where your objects live and how memory gets reclaimed, these stop being folklore. You'll know why garbage collectors exist, what they're protecting you from, what they cost, and - the part that surprises people - why they don't save you from every kind of memory bug.

## How to read this
- **Want the one big idea?** Read [Phase 3: How Garbage Collection Actually Works](03-how-garbage-collection-works.md) - *reachability* is the concept the whole thing rests on. The first two phases make it land harder.
- **Want it to finally make sense?** Read in order. We start with *where objects live*, then *who cleans them up* (by hand vs. automatically), then *how* the automatic version actually does it.

## The phases
1. **[Where Objects Live & How They're Allocated](01-where-objects-live.md)** - a quick recap of the stack vs. the heap, then a focus on the heap: where things that outlive a function go, and the hard question it raises - when is it actually *safe* to reclaim a piece of memory?
2. **[Manual vs Automatic Memory](02-manual-vs-automatic.md)** - the two worlds. In C and C++ you free memory by hand (total control, sharp edges like leaks and use-after-free). In Java, Go, Python, and JavaScript a garbage collector frees it for you (safety, at a cost). The trade-off, and where Rust fits as a third way.
3. **[How Garbage Collection Actually Works](03-how-garbage-collection-works.md)** - the core idea of *reachability*, mark-and-sweep at a gentle level, why a garbage-collected program can hiccup, and the uncomfortable truth that memory leaks still happen in these languages - plus the classic cause and its cure.

> This guide is about the *concepts* - the mental model that makes every garbage-collected language readable. Deep, language-specific tuning (generational GC details, choosing a collector, sizing heaps, reading GC logs) is real and worth learning, but it belongs in a per-language follow-up rather than here. For the layers underneath this one, see [What Actually Happens When Your Code Runs](/guides/what-happens-when-code-runs) and [Processes, Memory & the CPU](/guides/processes-memory-and-cpu).
