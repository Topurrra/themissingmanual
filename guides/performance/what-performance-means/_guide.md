---
title: "What \"Performance\" Even Means"
guide: "what-performance-means"
phase: 0
summary: "Performance is two different numbers (latency and throughput), the rule that you measure before you optimize, and the truth that 'fast enough' is defined by a requirement and by what users actually feel."
tags: [performance, latency, throughput, optimization, mental-model, beginner-friendly]
category: performance
difficulty: beginner
synonyms: ["what is performance", "what does performance mean", "latency vs throughput", "is my code fast enough", "what does it mean for software to be fast"]
order: 1
updated: 2026-06-19
---

# What "Performance" Even Means

Someone says your code is "slow." Someone else says the system needs to be "faster." A ticket lands titled "performance improvements." And nobody — not the ticket, not the person who filed it — tells you what *fast* actually means. Slow how? Slow for whom? Measured against what?

That vagueness is the real problem. "Performance" is one word standing in for several different ideas that pull in different directions, and if you don't separate them you'll spend a week speeding up the wrong thing. This guide gives you the small set of ideas the whole topic rests on — so the next time someone says "make it faster," you'll know exactly what to ask.

## How to read this

- **Want it to finally make sense?** Read in order — each phase builds on the last. It's short.
- **Just need the one big rule?** Jump to [Phase 2: Measure Before You Optimize](02-measure-before-you-optimize.md). It's the rule that saves the most time.

## The phases

1. **[Latency vs Throughput](01-latency-vs-throughput.md)** — the two core numbers people constantly conflate: how long *one* thing takes versus how many things you can do per second, and why pushing one can hurt the other.
2. **[Measure Before You Optimize](02-measure-before-you-optimize.md)** — the cardinal rule. Humans guess wrong about what's slow. Find the real bottleneck first, then fix *that*.
3. **[What "Fast Enough" Means](03-what-fast-enough-means.md)** — performance is relative to a requirement and to human perception; why the slowest requests are the ones users remember; and how to know when to stop.

> This guide is the mental model — the "A" of performance. The how-to skills it sets up live in their own guides: the cost of an algorithm in [Big-O Without the Math Panic](/guides/big-o-without-the-math-panic), finding the slow part in [Profiling 101](/guides/profiling-101), and proving a system holds up under real traffic in [Load and Performance Testing](/guides/load-and-performance-testing).
