---
title: "Finding the Slow Thing (Profiling 101)"
guide: "profiling-101"
phase: 0
summary: "A profiler watches your program run and tells you where the time actually goes, so you fix the real bottleneck instead of guessing. Learn to read a profile and a flame graph, then run the measure-change-remeasure loop."
tags: [profiling, performance, flame-graph, optimization, bottleneck, measurement]
category: performance
order: 3
difficulty: intermediate
synonyms: ["how to profile my code", "how to find the slow part of my program", "what is a flame graph", "how to read a profiler", "why is my code slow", "how to find a bottleneck", "self vs cumulative time"]
updated: 2026-06-19
---

# Finding the Slow Thing (Profiling 101)

Something is slow. A page takes four seconds to load, a job that should finish in a minute runs for ten, a test suite crawls. So you open the code, find the part that *looks* expensive, and start optimizing it. An hour later it's faster - and the whole thing is exactly as slow as before. You optimized the wrong thing.

This is the most common way developers waste a day on performance: they guess. The fix is almost embarrassingly simple to say and genuinely hard to make yourself do - **stop guessing and measure**. A profiler is the tool that measures for you. It watches your program actually run and tells you, with receipts, where the time really went. This guide teaches you what a profiler is, how to read what it shows you (including the flame graph, which looks scarier than it is), and how to turn that reading into a fix that sticks.

## How to read this
- **Just need to read a profile someone handed you right now?** Jump to [Phase 2: Reading a Profile](02-reading-a-profile.md) - it decodes hot functions, self vs. cumulative time, and flame graphs.
- **Want it to finally make sense?** Read in order. Each phase builds on the last: first the mental model, then how to read the output, then how to act on it.

## The phases
1. **[Measure, Don't Guess](01-measure-dont-guess.md)** - what a profiler *actually is*, why your intuition about "the slow part" is usually wrong, and the 80/20 rule that makes the whole job tractable.
2. **[Reading a Profile](02-reading-a-profile.md)** - what a profiler shows you: hot functions, self vs. cumulative time, call counts, and how to read a flame graph (the wide bar is your target).
3. **[From Profile to Fix](03-from-profile-to-fix.md)** - the measure-change-remeasure loop, the common wins (an accidental O(n²), an N+1 query, repeated work you can cache), and the two traps that make a profile lie to you.

> This guide gets you finding and fixing the obvious, high-payoff bottleneck. Deeper material - sampling vs. instrumenting profilers in detail, memory and allocation profiling, continuous production profiling, and language-specific tools - is deferred to follow-up guides. For watching performance in production rather than on your laptop, see [Observability: Logs, Metrics, and Traces](/guides/observability-logs-metrics-traces).
