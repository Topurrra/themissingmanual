---
title: "The Honest Trade-offs"
guide: "graphql-explained"
phase: 3
summary: "GraphQL isn't free: caching is harder than REST because there's no URL-per-resource, the N+1 problem hits resolvers on the server, flexible queries open the door to complexity and abuse, and you take on extra tooling. When REST or gRPC is the better choice."
tags: [graphql, caching, n-plus-one, rest, grpc, trade-offs, security, apis]
difficulty: intermediate
synonyms: ["graphql downsides", "graphql caching problem", "graphql n+1 problem", "when not to use graphql", "graphql vs rest vs grpc", "is graphql worth it", "graphql query complexity abuse"]
updated: 2026-07-10
---

# The Honest Trade-offs

Phase 2 showed GraphQL on its best day. This phase is the conversation a vendor demo skips: every benefit from the client-owns-the-shape design has a matching cost on the server and in your tooling. None of these costs are dealbreakers — but pretending they don't exist is how teams adopt GraphQL and regret it six months later.

Read this as a senior engineer would: not "GraphQL is bad," but "here's what you're signing up for, so you can decide on purpose."

## The decision cheat-card

> **Skimming to make a call? Start here, then read the section that worries you.**

| Concern | The honest reality |
|---|---|
| Caching | Harder than REST — no URL-per-resource means HTTP/CDN caching mostly doesn't apply (§1) |
| Server load | The N+1 problem is easy to introduce in resolvers; needs batching to fix (§2) |
| Abuse / cost control | Flexible queries can be deep or expensive; you must add limits (§3) |
| Tooling & ramp-up | More moving parts than a plain REST endpoint; a learning curve for the team (§4) |
| "Should we even use it?" | Great for many-client, varied-shape needs; overkill for simple or cache-heavy APIs (§5) |

---

## 1. Caching is harder than REST

REST got a huge gift almost for free: every resource has its own URL, and `GET` is cacheable. Browsers, CDNs, and proxies all understand "the response to `GET /users/42` can be reused for a while" — often powerful caching without writing a line of cache logic.

GraphQL gives that up by design. Recall Phase 2: everything is one `POST /graphql`, and `POST` isn't cached by that infrastructure (the body varies and POSTs are assumed to have effects). There's no per-resource URL to key a cache on, so the easy layer of HTTP and CDN caching mostly doesn't apply.

```text
   REST                              GraphQL
   GET /users/42  ─► [CDN cache] ─►  POST /graphql  ─► (CDN: nothing to cache,
   same URL = same cacheable hit         body varies, POST not cached)
```

Caching moves *into the client* instead. Libraries like Apollo Client and urql keep a normalized cache keyed by object type and ID, so a `User` fetched in one query is reused in another. It works well, but notice the shift: in REST, caching was free infrastructure; in GraphQL, it's a client library you adopt, configure, and reason about. Server-side approaches exist too (persisted queries, response caching), but they're deliberate work, not a default.

⚠️ **Gotcha — "GraphQL is faster" is not automatic.** GraphQL can cut round trips (Phase 1), but it also forfeits the cheap caching that often made REST feel fast. On a read-heavy, cache-friendly API, a well-cached REST endpoint can beat GraphQL. Measure for your traffic; don't assume.

## 2. The N+1 problem on the server

Remember resolvers from Phase 2 — one function per field. That per-field design has a sharp edge. Take this query:

```graphql
query {
  orders(last: 50) {
    id
    customer { name }
  }
}
```

A naive server runs one query to fetch the 50 orders, then runs the `customer` resolver once *per order* — 50 more database queries. That's 1 + 50 = 51 queries to answer one request. Scale the list up and it gets worse linearly.

📝 **Terminology — the N+1 problem.** One query to fetch a list of N items, then N more queries to fetch a related field for each item. It predates GraphQL (any ORM can do it), but GraphQL's per-field resolvers make it especially easy to introduce without noticing.

The standard fix is *batching*: collect all the customer lookups that happen in one request and resolve them in a single database call (`WHERE id IN (...)`). The well-known tool for this is DataLoader, which gathers the IDs requested during a tick and batches them. It works, but it's something you have to know about and wire in — the framework won't do it for you, and a teammate who hasn't met DataLoader will write the slow version by accident. It's typically invisible in development against ten seed rows and only shows up once a customer opens a list of hundreds in production.

## 3. Query complexity and abuse

The flexibility that helps your own clients also helps a hostile or careless one. Because the caller composes the query, they can compose an *expensive* one — deeply nested, or fanning out across relationships:

```graphql
query {
  users(first: 1000) {
    orders(last: 100) {
      items {
        product { reviews { author { orders { id } } } }
      }
    }
  }
}
```
A single small request asks the server to walk users → orders → items → products → reviews → authors → orders. The query text is tiny; the work it demands is enormous. With plain REST, an attacker is limited to the shapes your endpoints expose; with GraphQL, the surface is "any legal combination of the schema," which is much larger.

You add guardrails the schema alone doesn't give you:

- **Depth limiting** — reject queries nested beyond, say, a handful of levels.
- **Query cost analysis** — assign a cost to fields and cap the total per request.
- **Pagination limits** — don't allow `first: 1000`; enforce a sane maximum.
- **Persisted queries / allowlists** — in some setups, only let clients run queries you've pre-approved, which closes the open-ended surface entirely.

The point isn't fear; it's that an open GraphQL endpoint is not safe by default the way a fixed set of REST endpoints tends to be. Securing it is a task you own.

## 4. Added tooling and ramp-up

A minimal REST endpoint can be a function that returns JSON. A GraphQL server brings more standing machinery: you define and maintain a schema, write resolvers, usually adopt a server library (Apollo Server, GraphQL Yoga, async-graphql, and so on), and add a client library to consume it. Code generation from schema to typed client code is common and genuinely helpful — and it's another piece in the build.

A lot of that tooling pays for itself on a real product: the schema is self-documenting, tools like GraphiQL let you explore the API interactively, and end-to-end type safety from schema to client catches whole classes of bugs. But it's real surface area and a real learning curve — for a small team shipping a handful of endpoints, it can be more apparatus than the problem warrants.

## 5. So when should you actually use it?

Here's the balanced version. Reach for GraphQL when its strengths match your problem; stay with REST (or gRPC) when they don't.

| Situation | Better fit | Why |
|---|---|---|
| Many clients (web, iOS, Android) with different field needs | **GraphQL** | Each client asks for its own shape; no per-client endpoints to maintain |
| Screens that aggregate many related resources | **GraphQL** | One query replaces a waterfall of requests (Phase 1) |
| A few simple resources; read-heavy and cache-friendly | **REST** | URL-per-resource gives you HTTP/CDN caching for free (§1) |
| Public API where predictable, lockable cost matters | **REST** | Fixed endpoints are a smaller, easier-to-secure surface (§3) |
| Service-to-service calls needing low latency and a strict contract | **gRPC** | Binary protocol and generated stubs; built for internal RPC, not browser-shaped queries |
| Small team, tight timeline, modest API | **REST** | Less machinery to stand up and learn (§4) |

💡 **Key point.** GraphQL is not an upgrade to REST; it's a different trade. It buys client-controlled, single-request data fetching, and pays for that with harder caching, server-side care around N+1 and abuse, and more tooling. Worth it for many clients with varied, nested data needs; when it isn't, a clean REST API is the calmer, cheaper choice — and choosing it is not settling.

For the two alternatives this guide keeps pointing at, read them side by side: [REST APIs, Explained](/guides/rest-apis-explained) and [gRPC, Explained](/guides/grpc-explained).

## Recap

1. **Caching is harder** — no URL-per-resource, so REST's free HTTP/CDN caching doesn't apply; caching moves into a client library.
2. **The N+1 problem** is easy to introduce in per-field resolvers; the fix is batching (DataLoader), which you must wire in yourself.
3. **Flexible queries can be abused** — depth, cost, pagination limits, and persisted-query allowlists are guardrails you have to add.
4. **More tooling and ramp-up** than a plain REST endpoint — often worth it, but real surface area for a small team.
5. **Choose on purpose:** GraphQL for many-client, varied, nested needs; REST for simple/cache-heavy/lockable APIs; gRPC for strict internal service-to-service calls.

---

[← Phase 2: How GraphQL Works](02-how-graphql-works.md) · [Guide overview](_guide.md)
