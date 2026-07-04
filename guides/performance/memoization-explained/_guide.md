---
title: "Memoization Explained"
guide: memoization-explained
phase: 0
summary: "How caching a pure function's return value by its arguments lets you skip redoing the same expensive work twice, and where that trick quietly breaks."
tags: [performance, memoization, caching, functions, recursion]
category: performance
order: 11
difficulty: intermediate
synonyms:
  - what is memoization
  - memoization vs caching
  - functools lru_cache
  - useMemo explained
  - cache function results by arguments
  - why is recursive fibonacci slow
updated: 2026-07-04
---

# Memoization Explained

A pure function called twice with the same arguments does the same work twice and produces the same answer twice. If that work is expensive, the second call is pure waste — you already know the answer, and you made the function recompute it anyway. Memoization is the fix: remember the answer the first time, keyed by the arguments, and hand back the memory instead of redoing the work. This guide covers the idea using the classic slow example, how to actually implement it, and where it backfires.

## How to read this

Phase 1 introduces the core idea through naive recursive Fibonacci — the textbook case where the same subproblem gets solved an exponential number of times. Phase 2 covers the actual mechanics: a cache keyed by arguments, and the tools (decorators, higher-order functions) that wrap a function in that cache for you. Phase 3 is the honest tradeoff — unbounded memory, silently wrong answers when the function isn't really pure, and how memoization differs from a general-purpose cache like Redis.

## The phases

1. [Don't compute the same answer twice](01-dont-compute-twice.md) — the core idea, with exponential recursive Fibonacci as the motivating example.
2. [How to actually implement it](02-how-to-implement-it.md) — a cache keyed by arguments, decorators, and the purity requirement.
3. [When it backfires](03-when-it-backfires.md) — unbounded memory, false purity, and memoization vs. general caching.

[Phase 1: Don't compute the same answer twice](01-dont-compute-twice.md) →
