---
title: "Event-Driven Architecture"
guide: "event-driven-architecture"
phase: 0
summary: "Systems that talk by emitting events instead of calling each other directly: queues, pub/sub, and choreography versus orchestration."
tags: [architecture, event-driven, pub-sub, message-queue, distributed-systems, decoupling, eventual-consistency]
category: architecture
order: 6
difficulty: intermediate
synonyms: ["what is event driven architecture", "pub sub vs message queue", "events vs direct calls", "choreography vs orchestration", "at least once delivery", "why idempotent consumers", "eventual consistency events", "event broker", "kafka vs rabbitmq concepts", "decoupling services with events"]
updated: 2026-06-30
---

# Event-Driven Architecture

Right now, somewhere in your system, service A picks up the phone and calls service B directly: "Hey, a user signed up - go send the welcome email." It works. Then you add a service that gives out signup bonuses, and another that warms a cache, and another that pings analytics. Suddenly the signup code knows about five other services, breaks when any of them is down, and slows to the speed of its slowest dependency. There's a calmer way to build this, and it starts with a single shift: instead of *calling* the others, A announces "a user signed up" and walks away. Whoever cares, reacts.

This guide gives you the mental model - producers, a broker, consumers - and then makes you clear-eyed about the bill that comes with it: eventual consistency, harder debugging, and messages that sometimes arrive twice. You'll leave knowing not only how event-driven systems work, but when the trade is worth it and when it isn't.

## How to read this
- **Want the core idea fast?** Read [Phase 1](01-the-mental-model.md). It's the whole "announce, don't call" shift in one sitting.
- **Want it to actually stick?** Read in order. Phase 1 builds the model, Phase 2 shows how events really flow (queues, pub/sub, choreography vs orchestration), and Phase 3 is the hard-won reality: where this bites and how to survive it.

## The phases
1. **[Announce, Don't Call](01-the-mental-model.md)** - the core shift: a producer emits an event, a broker holds it, consumers react. Why this decouples your system, and what an "event" actually is.
2. **[How Events Really Flow](02-how-events-flow.md)** - queues vs pub/sub, choreography vs orchestration, and the delivery guarantees you actually get. The day-to-day mechanics.
3. **[The Bill Comes Due](03-the-bill-comes-due.md)** - eventual consistency, debugging across hops, ordering, and duplicate delivery. Why consumers must be idempotent, and when *not* to go event-driven at all.

[Phase 1: Announce, Don't Call](01-the-mental-model.md) →
