---
title: "Designing for Failure (Retries, Timeouts & Circuit Breakers)"
guide: "designing-for-failure"
phase: 0
summary: "How to build distributed systems that bend instead of break: assume failure everywhere, add timeouts and backoff retries and circuit breakers, then fail soft with degradation, fallbacks, and bulkheads so one sick dependency can't sink the whole ship."
tags: [reliability, resilience, distributed-systems, retries, timeouts, circuit-breaker, fault-tolerance]
category: architecture
difficulty: advanced
order: 5
synonyms: ["how to design for failure", "retries with backoff and jitter", "what is a circuit breaker", "why does one slow service take down everything", "cascading failure", "graceful degradation", "fault tolerant system design", "timeout best practices", "resilient distributed systems"]
updated: 2026-06-19
---

# Designing for Failure (Retries, Timeouts & Circuit Breakers)

You built the happy path. The request comes in, you call the database, you call the payment service,
you call the recommendations API, you stitch the results together, you return a response. It works on
your laptop. It works in the demo. Then it goes to production, and one Tuesday afternoon a single
downstream service gets slow — not down, just *slow* — and within ninety seconds your entire app is
unresponsive and your phone is buzzing. Nothing in your code "broke." And yet everything is on fire.

Here's the shift that fixes this: in a system made of many moving parts talking over a network, failure
is not an exception you handle at the edges. It's the normal weather. Networks drop packets, services
get slow, dependencies fall over, machines reboot without asking. The question was never *if* — it's
*when*, and *how gracefully*. This guide is about building systems that **bend instead of break**: that
give a little when a part fails, isolate the damage, and keep serving what they still can — instead of
toppling like dominoes.

This is the architecture that means you *don't* get the 2am page.

## How to read this

- **Want the patterns right now?** Jump to [Phase 2: The Core Patterns](02-the-core-patterns.md) —
  timeouts, retries with backoff and jitter, and circuit breakers, each with a mental model and an
  ASCII diagram. That's the toolkit.
- **Want it to finally make sense?** Read in order. Phase 1 installs the mindset (why one slow
  dependency cascades), Phase 2 gives you the three core defenses, and Phase 3 shows you how to fail
  *soft* — degrade, fall back, isolate — so an outage shrinks instead of spreads.

## The phases

1. **[Everything Fails](01-everything-fails.md)** — the mindset shift. In a distributed system,
   networks drop, services slow, and dependencies die — not *if* but *when*. The fallacies of
   distributed computing, and why a single slow dependency can drag your whole system down (cascading
   failure).
2. **[The Core Patterns](02-the-core-patterns.md)** — the three defenses you reach for constantly:
   **timeouts** (never wait forever — the most commonly missing safeguard there is), **retries** with
   backoff and jitter (and only for safe-to-repeat operations), and **circuit breakers** (stop
   hammering a dead dependency; fail fast, then recover).
3. **[Failing Soft: Degradation & Redundancy](03-failing-soft.md)** — when a part fails anyway, lose a
   feature instead of the product. Graceful degradation, fallbacks, bulkheads (isolate failures so one
   drowning feature can't drown the rest), and redundancy — plus the retry storm that turns a small
   outage into a big one.

> Deep dives into specific tooling — service meshes, distributed tracing, chaos engineering, and
> SLO/error-budget math — are deliberately left to follow-up guides. This one is about the patterns and
> the mindset that work no matter what your stack is. For scaling the system you're protecting, see
> [Designing for Scale](/guides/designing-for-scale); for the human side of an outage in progress, see
> [When Prod Is Down](/guides/when-prod-is-down).
