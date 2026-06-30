---
title: "Database Connection Pools"
guide: connection-pools
phase: 0
summary: "Why too many connections takes down production, what a database connection actually costs, and how pool sizing keeps app and database alive."
tags: [databases, connection-pool, performance, scaling, postgres]
category: databases
order: 12
difficulty: intermediate
synonyms:
  - what is a connection pool
  - too many database connections error
  - postgres max connections exhausted
  - connection pool sizing
  - database connection leak
  - serverless connection storm
updated: 2026-06-30
---

# Database Connection Pools

Your app was fine all week. Then traffic doubled, and the database fell over with `too many connections` while CPU sat at 20% — plenty of headroom, yet everything timed out. The villain is almost never query speed here. It's how many doors you tried to open into the database at once. This guide gives you the mental model for what a connection actually costs, why a pool fixes it, and how to size one without guessing.

## How to read this

Read the three phases in order — they build on each other. Phase 1 gives you the picture in your head: what a connection is and why it isn't free. Phase 2 is the everyday machinery: how a pool reuses connections and what the knobs mean. Phase 3 is where it bites in real life: exhaustion, leaks, and the serverless storm. If you've ever stared at a `connection pool timeout` log line at 3am, Phase 3 is your destination — but the first two phases are what make it make sense.

## The phases

1. [What a connection actually costs](01-what-a-connection-costs.md) — the mental model: a connection is memory plus a handshake, not a free function call.
2. [How a pool works and how to size it](02-how-a-pool-works.md) — reuse a fixed set of connections, and pick the number on purpose.
3. [When pools break: exhaustion, leaks, and serverless storms](03-when-pools-break.md) — the failure modes that page you, and how to survive them.

[Phase 1: What a connection actually costs](01-what-a-connection-costs.md) →
