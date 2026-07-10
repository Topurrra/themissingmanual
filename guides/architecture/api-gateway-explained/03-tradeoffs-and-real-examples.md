---
title: "Tradeoffs and real examples"
guide: api-gateway-explained
phase: 3
summary: "A single front door in front of many backend services — what an API gateway actually does, and when it earns its keep versus when it's overkill."
tags: [architecture, api-gateway, microservices, routing, api]
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

# Tradeoffs and real examples

A gateway solves a real problem, but it isn't free. It's a piece of infrastructure sitting on the path of every single request, which means its costs are just as centralized as its benefits.

## Cost 1: a new single point of failure

Before the gateway existed, if one backend service went down, only the features depending on that service broke. The gateway sits in front of *everything*, which means if the gateway itself goes down, every service behind it becomes unreachable, even the ones that are perfectly healthy.

```text
Without a gateway:
  payments-service down -> only checkout breaks

With a gateway, if the gateway itself is down:
  gateway down -> orders, products, inventory, payments -- ALL unreachable
```

*What just happened:* you traded "one service can fail independently" for "one component's failure takes down the whole API." This is manageable — gateways are typically run in a redundant, load-balanced cluster specifically because of this risk — but it's not automatic. A gateway you didn't design for high availability is a bigger risk than not having one.

## Cost 2: an extra latency hop

Every request now passes through one more piece of infrastructure before it reaches the service that actually does the work, and the response passes back through it again on the way out.

```text
Without gateway: client -> service                    (1 hop each way)
With gateway:    client -> gateway -> service          (2 hops each way)
```

*What just happened:* the gateway adds processing time — routing logic, auth checks, possibly transformation — on top of a genuine network hop. For most systems this is small, often single-digit milliseconds, and it's a reasonable price for what you get back. But if you're building something latency-critical, it's a real cost to measure, not assume away.

## Cost 3: configuration complexity

The gateway's routing rules, auth policies, and rate limits all live in one place — which is exactly the benefit from Phase 2, and also a new liability. Get a routing rule wrong and you can misroute traffic for every service at once, not just one, because that configuration is now critical infrastructure in its own right. Someone has to own it, version it, and test changes with the same care you'd give to code.

```text
One misconfigured route in the gateway
  -> can break access to a service for every client, all at once,
     even though the service itself is fine
```

*What just happened:* centralizing cross-cutting concerns concentrates risk along with the benefit. A bug in one backend service's auth code affects that one service. A bug in the gateway's auth config can affect all of them simultaneously.

## Real products you'll run into

You don't build a gateway from scratch in most cases — you configure one. A few you'll see repeatedly:

```text
Kong              -> open-source, plugin-based, popular for self-hosted setups
AWS API Gateway    -> managed, deeply integrated with Lambda and other AWS services
nginx              -> not a dedicated gateway product, but its reverse-proxy and routing
                      features cover a genuinely lightweight version of the same idea
```

*What just happened:* these differ mostly in how much you manage yourself versus how much a cloud provider manages for you, and how much built-in tooling (plugins, dashboards, auth integrations) comes out of the box. nginx is worth calling out specifically: many small systems run something that is, functionally, a stripped-down API gateway — a reverse proxy doing path-based routing and maybe basic auth — without ever calling it a "gateway" or reaching for a dedicated product.

## When a gateway is overkill

A gateway earns its cost when there are genuinely multiple backend services, or when the cross-cutting concerns from Phase 2 — auth, rate limiting, routing — are complex enough to be worth centralizing. It earns its cost less when:

```text
One backend service, no plans to split it soon
  -> a gateway adds a hop and a new failure point, for nothing it's solving

Small internal tool, trusted network, a handful of users
  -> auth/rate-limiting needs are minimal; a gateway is machinery you'll maintain
     for a problem you don't have yet

A load balancer already does everything you actually need
  -> if all you need is "spread traffic across instances of one service,"
     that's a load balancer's job, not a gateway's
```

*What just happened:* the pattern to watch for is reaching for a gateway because it's the "correct" architecture for a system with many services, when your system doesn't actually have many services yet. The same instinct that says "don't split into microservices before you feel real pain" applies here — a gateway in front of one service is complexity paid for in advance, on the hope that you'll need it later.

> The gateway is a tool for a specific shape of problem: many services, one client-facing contract. If you don't have the "many services" part yet, you're paying the tradeoffs from this phase for a benefit you can't cash in yet.

The honest read: gateways are close to mandatory once a system has real service sprawl, and unnecessary weight before that point. The decision isn't about which is more modern — it's about whether the specific problems in Phase 1 are ones you actually have.

[← Phase 2: What a gateway actually does](02-what-a-gateway-actually-does.md) | [Overview](_guide.md)
