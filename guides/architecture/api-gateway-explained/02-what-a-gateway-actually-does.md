---
title: "What a gateway actually does"
guide: api-gateway-explained
phase: 2
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
updated: 2026-07-04
---

# What a gateway actually does

"One front door" describes the shape, not the job. Once a request walks through that door, the gateway does real work on it before deciding where it goes. Five things show up in almost every gateway you'll encounter.

## Path-based routing

The most basic job: look at the incoming request and decide which backend service actually handles it. The client only sees one host; the gateway is the thing that knows the real map.

```text
Request path              -> routed to
/orders/*                 -> orders-service
/products/*                -> products-service
/inventory/*               -> inventory-service
/charge                    -> payments-service
```

*What just happened:* the gateway inspects the path (sometimes the hostname, sometimes a header) and forwards the request to whichever service owns that piece of the API. This is the piece that makes "one address, many services" actually work — the client's illusion of a single API is a routing table on the gateway's side.

## Authentication and authorization at the edge

Instead of every backend service independently verifying who's calling and what they're allowed to do, the gateway does it once, at the door, before the request goes anywhere.

```text
1. Request arrives with a token
2. Gateway validates the token (is it real? is it expired?)
3. Gateway checks: is this user allowed to hit this route?
4. Only if both pass -> forward to the backend service
```

*What just happened:* the backend services can now largely trust that anything reaching them has already been vetted, instead of every one of them reimplementing token validation and permission checks. This isn't just convenience — it's a real security posture. One well-tested piece of auth code protecting every service beats fifteen homegrown copies of the same logic, some of which will inevitably be wrong.

## Rate limiting

The gateway sees every request to every service, which makes it the natural place to enforce "this client can make at most N requests per minute."

```text
client_id: acme-corp   requests this minute: 118   limit: 120   -> allow
client_id: acme-corp   requests this minute: 121   limit: 120   -> reject (429)
```

*What just happened:* one client hammering the API gets stopped at the door, before its flood of requests ever reaches — and potentially overwhelms — a backend service. Without a gateway, you'd need to build rate limiting into every service separately, or hope none of them ever need it.

## Request and response transformation

Clients and backend services don't always want to speak in exactly the same shape. The gateway can reshape a request or response in flight.

```text
Client sends:     { "user_id": "482" }
Gateway forwards: { "userId": "482", "apiVersion": "2" }   <- old service still expects this shape

Service returns:  { "userId": "482", "internal_flags": {...}, "balance_cents": 4200 }
Gateway returns:  { "userId": "482", "balance": 42.00 }    <- strips internals, client-friendly units
```

*What just happened:* the gateway acts as a translator in both directions. This is genuinely useful when a backend service is old, written by a different team with different conventions, or exposes internal fields that have no business reaching a client. The client gets a clean, stable contract; the backend keeps whatever shape is convenient for it.

## Aggregating multiple calls into one

Sometimes a single client request logically needs data from several backend services. Instead of making the client fire off three requests and stitch the results together itself, the gateway can do the fan-out internally and hand back one combined response.

```text
Client requests:  GET /order-summary/482

Gateway internally calls:
  orders-service     -> order details
  products-service   -> product names for the items in the order
  inventory-service  -> current stock status

Gateway returns one combined JSON response to the client.
```

*What just happened:* the client made one request and got one response, even though three services were involved. This pattern is sometimes called "backend for frontend" when it's tailored to a specific client type (mobile vs. web), but the underlying move is the same: push the fan-out and stitching work to the gateway, which is already positioned to talk to everything, instead of making every client re-implement that orchestration.

## Why all five live in one place

None of these five jobs strictly requires a gateway — you could build auth checks into every service, rate limiting into every service, and so on. The reason they cluster into one component is that they're all *cross-cutting*: every service needs some version of routing awareness, auth, and rate limiting, and duplicating that logic N times means N chances to get it wrong and N places to update when the policy changes. Centralizing it in the gateway means one implementation, one place to patch a bug, one dashboard to watch.

```quiz
[
  {
    "q": "Why do authentication and rate limiting typically live in the gateway rather than in each backend service?",
    "choices": [
      "Backend services are incapable of running auth code",
      "They're cross-cutting concerns — duplicating them in every service means more chances to get it wrong",
      "It's required by the HTTP specification",
      "Gateways are the only place that can see a bearer token"
    ],
    "answer": 1,
    "explain": "Auth and rate limiting apply to nearly every request. Centralizing them means one correct implementation instead of N slightly-different copies scattered across services."
  },
  {
    "q": "A client requests order-summary data, and the gateway internally calls three separate backend services, then returns one combined response. What is this pattern called?",
    "choices": [
      "Path-based routing",
      "Rate limiting",
      "Aggregation (sometimes backend-for-frontend)",
      "Request transformation"
    ],
    "answer": 2,
    "explain": "Aggregation is the gateway fanning a single client request out to multiple backend services and stitching the results into one response."
  },
  {
    "q": "What does path-based routing let a gateway do?",
    "choices": [
      "Encrypt traffic between the client and the gateway",
      "Decide which backend service should handle a request based on its path or host",
      "Automatically retry failed requests forever",
      "Convert JSON responses into XML"
    ],
    "answer": 1,
    "explain": "Path-based routing is the gateway's map from incoming request paths (or hosts) to the backend service that actually owns that piece of the API."
  }
]
```

Watch it animated: [an API gateway](/explainers/APIGateway.dc.html)

[← Phase 1: The single front door](01-the-single-front-door.md) | [Overview](_guide.md) | [Phase 3: Tradeoffs and real examples →](03-tradeoffs-and-real-examples.md)
