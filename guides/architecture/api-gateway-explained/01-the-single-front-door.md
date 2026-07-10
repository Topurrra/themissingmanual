---
title: "The single front door"
guide: api-gateway-explained
phase: 1
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

# The single front door

Imagine a mobile app for an online store. It needs product data, order history, inventory status, and to process a payment. If the backend is split into an orders service, a products service, an inventory service, and a payments service, the app now needs to know all four addresses, speak whatever protocol each one prefers, and handle four different ways of proving who the user is.

That's the situation an API gateway exists to erase.

## What the client has to deal with, without a gateway

Picture the app calling each service directly:

```text
GET  https://orders-svc.internal.example.com/v2/orders/482
GET  https://products-svc.internal.example.com/api/products?ids=9,14,22
GET  https://inventory.internal.example.com/stock/check
POST https://payments-svc.internal.example.com/v1/charge
```

*What just happened:* the client needs to know four hostnames, four different URL shapes, and — this is the painful part — probably four different ways of authenticating, because four teams built these services at different times with different conventions. One might expect an API key in a header, another a bearer token, another a signed request. The client also now has a hard dependency on internal details: if the payments team renames their service or moves it to a new host, every client needs to know.

```text
Client's job without a gateway:
  - know every service's address
  - know every service's auth scheme
  - handle failures from each one separately
  - update itself whenever a service moves or changes shape
```

*What just happened:* the client just wants "give me this order" and "charge this card" — not a directory of internal infrastructure. None of those bullet points touch the app's actual job, and the list grows with every service you add.

## What the client deals with, with a gateway

Now put one thing in front of all four services — a gateway that the client is the only thing it talks to:

```text
GET  https://api.example.com/orders/482
GET  https://api.example.com/products?ids=9,14,22
GET  https://api.example.com/inventory/check
POST https://api.example.com/charge
```

*What just happened:* one hostname. One auth scheme — the client authenticates once, to the gateway, and the gateway is trusted to sort out the rest. The client has no idea there are four services back there, doesn't know their addresses, and doesn't care if the payments team rewrites their entire service next month, as long as the gateway's contract with the client stays the same.

> The gateway's whole job is to be the one thing a client has to know about. Everything behind it can change shape without the client noticing.

## Why this matters more as a system grows

With one or two backend services, this is barely a problem — hardcode two addresses and move on. The pain scales worse than you'd guess, because it isn't just "one more address": every new service brings its own auth quirks, failure modes, versioning scheme, and error conventions. A system with fifteen services and no gateway means every client re-solves the same integration problem fifteen times over.

```text
2 services, no gateway   -> mildly annoying
5 services, no gateway   -> every client hardcodes 5 addresses and 5 auth flows
15 services, no gateway  -> nobody actually knows the full list anymore
15 services, one gateway -> clients still see exactly one address
```

*What just happened:* the gateway doesn't remove the complexity of having many services — that complexity is real and it's still there. What it does is move that complexity to one place, behind one door, instead of scattering it across every client that ever needs to talk to the backend. Phase 2 covers what actually happens at that door once traffic arrives there.

[← Overview](_guide.md) | [Phase 2: What a gateway actually does →](02-what-a-gateway-actually-does.md)
