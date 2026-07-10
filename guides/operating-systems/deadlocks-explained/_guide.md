---
title: "Deadlocks Explained"
guide: deadlocks-explained
phase: 0
summary: "What a deadlock actually is, the four conditions that must all be true for one to happen, and how to prevent and detect them in real code."
tags: [operating-systems, concurrency, deadlock, threads, locks, multithreading]
category: operating-systems
order: 11
difficulty: intermediate
synonyms:
  - what is a deadlock
  - why is my program hanging forever
  - two threads waiting on each other
  - how to prevent a deadlock
  - how to detect a deadlock
  - lock ordering deadlock
updated: 2026-07-11
---

# Deadlocks Explained

Your program hangs. Not crashed, not slow — frozen, forever, using zero CPU, doing absolutely nothing. Two threads are alive and technically "running," except each one is waiting for something the other thread is holding, and neither will ever let go first. That's a deadlock: not a bug that produces a wrong answer, but a bug that produces no answer at all.

This guide builds the concept from one concrete example, gives you the checklist for recognizing a deadlock, and ends with what to put in your code so it doesn't happen — and what to do when it happens anyway.

## How to read this

Read it in order. Phase 1 walks through one concrete two-lock example and the mental model behind it. Phase 2 is the checklist: four conditions that must *all* be true simultaneously for a deadlock to occur. Phase 3 is practical — lock ordering, timeouts, detection tools, and what to do when a production process is hung right now. Examples use plain pseudocode; the trap is identical whether you're writing Java, C++, Go, Python, or Rust.

## The phases

1. [What a deadlock actually is](01-what-a-deadlock-is.md) — two threads, two locks, each waiting on the other forever.
2. [The four conditions that must all be true](02-the-four-conditions.md) — mutual exclusion, hold-and-wait, no preemption, circular wait.
3. [Preventing and detecting them in real code](03-preventing-and-detecting.md) — lock ordering, timeouts, detection tools, and what to do about a live hang.

[Phase 1: What a deadlock actually is](01-what-a-deadlock-is.md) →
