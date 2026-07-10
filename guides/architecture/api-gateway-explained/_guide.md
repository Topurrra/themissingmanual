---
title: "API Gateway, Explained"
guide: api-gateway-explained
phase: 0
summary: "A single front door in front of many backend services — what an API gateway actually does, and when it earns its keep versus when it's overkill."
tags: [architecture, api-gateway, microservices, routing, api]
category: architecture
order: 8
difficulty: intermediate
synonyms:
  - what is an api gateway
  - api gateway vs load balancer
  - why use an api gateway
  - kong vs aws api gateway
  - api gateway explained
  - single entry point for microservices
updated: 2026-07-10
---

# API Gateway, Explained

Once a system grows past one service, clients face an awkward question: which address do I call for what? The orders service, the payments service, the search service — each with its own host, its own auth, its own quirks. An API gateway exists to make that question disappear: one address, one door, everything behind it becomes the gateway's problem instead of the client's — this guide covers why that door exists, what it actually does once it's there, and the tradeoffs nobody mentions in the pitch.

## How to read this

Read it in order. Phase 1 is the problem the gateway solves — what life looks like without one; Phase 2 is what a gateway actually does day to day: routing, auth, rate limiting, and more. Phase 3 is the honest tradeoffs, real products you'll encounter, and when a gateway is more machinery than a small system needs.

## The phases

1. [The single front door](01-the-single-front-door.md) — the problem: clients otherwise juggle N services, N addresses, N auth schemes.
2. [What a gateway actually does](02-what-a-gateway-actually-does.md) — routing, authentication, rate limiting, transformation, and aggregation.
3. [Tradeoffs and real examples](03-tradeoffs-and-real-examples.md) — the new failure point, the latency cost, real products, and when to skip it.

[Phase 1: The single front door](01-the-single-front-door.md) →
