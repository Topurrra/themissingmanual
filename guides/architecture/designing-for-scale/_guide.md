---
title: "Designing for Scale (Load Balancing & Statelessness)"
guide: "designing-for-scale"
phase: 0
summary: "How to take on more load without falling over: scale out instead of just up, make your servers stateless so any box can handle any request, put a load balancer in front, and push the parts that can't be cloned - sessions, the database, the cache - out to the edges."
tags: [architecture, scaling, load-balancing, statelessness, horizontal-scaling, sessions, high-availability]
category: architecture
order: 4
difficulty: advanced
synonyms: ["how to scale a web application", "scale up vs scale out", "what is a load balancer", "why do servers need to be stateless", "sticky sessions problem", "horizontal vs vertical scaling", "how to handle more traffic", "where to store session state"]
updated: 2026-06-19
---

# Designing for Scale (Load Balancing & Statelessness)

Your app works. Then it works *too well* - traffic climbs, the one server you've been running starts to sweat, response times creep up, and you get the message every engineer eventually gets: "it needs to handle more load." The panic move is to buy a bigger box and hope. That buys you a little time and teaches you nothing, and one day there is no bigger box to buy.

This guide is about the calm alternative: designing a system that grows by *adding* machines instead of *replacing* them - and the one property that makes that possible. Almost all of scaling comes down to a single idea, and once you see it, the architecture diagrams stop looking like magic. The idea is this: **if any server can handle any request, you can add servers freely.** Everything else here - load balancers, stateless services, shared session stores - is in service of that one sentence.

## How to read this
- **Need the mental model fast?** Read [Phase 1: Scale Up vs Scale Out](01-scale-up-vs-scale-out.md) - statelessness is the whole game, and it's explained there first.
- **Want it to finally make sense?** Read in order. The statelessness idea makes load balancing make sense, and load balancing makes the "what about the stateful bits?" question make sense.

## The phases
1. **[Scale Up vs Scale Out, and Why Statelessness Matters](01-scale-up-vs-scale-out.md)** - bigger box (simple, capped) vs more boxes (the real answer for big scale), and the property that unlocks the second one: statelessness.
2. **[Load Balancing](02-load-balancing.md)** - spreading requests across many identical servers: what a load balancer actually does, health checks, and the sticky-session trap.
3. **[Scaling the Stateful Bits](03-scaling-the-stateful-bits.md)** - the parts you can't just clone: sessions (move them to a shared store), the database (the usual bottleneck), and caching to shed load.

> Deliberately deferred to follow-up guides: scaling the database itself (replication and sharding) lives in [Scaling a Database](/guides/scaling-a-database); the mechanics of caching live in [Caching, Explained](/guides/caching-explained); and what to do when a machine *dies* rather than just gets busy is [Designing for Failure](/guides/designing-for-failure). This guide is about handling more load. Those are about handling everything around it.
