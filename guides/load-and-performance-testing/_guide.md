---
title: "Load & Performance Testing"
guide: "load-and-performance-testing"
phase: 0
summary: "Your tests prove the app is correct; load tests prove it survives a thousand people showing up at once. Here's the mental model, the metrics that actually matter (percentiles, not averages), and how to run one test and read where it breaks."
tags: [load-testing, performance-testing, percentiles, latency, throughput, stress-testing, soak-testing, capacity]
category: testing
order: 7
difficulty: advanced
synonyms: ["what is load testing", "load testing vs stress testing", "why use percentiles not average latency", "p95 p99 latency explained", "will my app handle traffic", "how to do a load test", "what is a soak test", "find the breaking point of a server"]
updated: 2026-06-19
---

# Load & Performance Testing

You've got green tests. Every unit test passes, the integration suite is clean, you clicked through the app yourself and it worked. So why does the launch announcement still tighten your stomach? Because every test you've written so far asked one question — *is it correct?* — and not the one that takes prod down at the worst possible moment: *does it still work when a thousand people show up at the same second?*

Those are different questions with different answers. Code that is perfectly correct for one user can fall apart under a crowd: the database connection pool runs dry, a query that was fine at ten rows crawls at ten million, memory creeps up over six hours until the process is killed. None of that shows up in a passing test suite. It shows up on launch day — unless you go looking for it first.

This guide is about going looking for it first. It won't make your app faster (that's profiling, a different skill — we'll point you there). It answers a narrower, more urgent question: **will it hold?**

## How to read this

- **Want it to finally make sense?** Read in order. Each phase builds on the last: first *why* load testing is its own discipline, then *what to measure*, then *how to run one and read the result*.
- **Need a specific answer fast?** Phase 2 defines every metric and test type (throughput, latency percentiles, error rate; load vs. stress vs. soak vs. spike). Phase 3 is the hands-on workflow and how to spot the breaking point.

## The phases

1. **[Why Load-Test](01-why-load-test.md)** — the mental model: correctness tests ask "is it right?", load tests ask "does it survive a crowd?" The launch-day scenario, and what you're trying to learn before your users learn it for you.
2. **[The Metrics That Matter](02-the-metrics-that-matter.md)** — throughput, latency and why you measure *percentiles* not averages (the slow tail is what users feel), error rate under load — plus the four test types: load, stress, soak, spike.
3. **[Running One & Reading It](03-running-one-and-reading-it.md)** — the workflow end to end: pick a realistic scenario, ramp up virtual users, watch the numbers, and find the *knee* where latency spikes and errors climb. With an illustrative readout, and the traps that make the numbers lie.

> Deliberately deferred: *why* a given endpoint is slow — flame graphs, query plans, CPU profiles, distributed tracing. That's a future **performance** category (profiling and observability). This guide stops at finding the *symptom* under load; the cause is a separate hunt.
