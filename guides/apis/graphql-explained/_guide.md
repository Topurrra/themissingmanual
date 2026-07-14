---
title: "GraphQL, Explained"
guide: "graphql-explained"
phase: 0
summary: "What GraphQL actually is, the REST pain it was built to fix, how its typed schema and single endpoint work, and the real trade-offs that tell you when to reach for it and when not to."
tags: [graphql, apis, rest, schema, query-language, backend]
category: apis
order: 5
difficulty: intermediate
synonyms: ["what is graphql", "graphql vs rest", "why use graphql", "graphql over-fetching under-fetching", "is graphql worth it", "when not to use graphql"]
updated: 2026-07-10
---

# GraphQL, Explained

You've built a screen against a REST API and felt the friction: one endpoint hands you a wall of fields you'll never use, while the three things you actually need live behind three separate requests. You stitch them together on the client, write yet another `/users/:id/with-everything` endpoint, and quietly wonder if there's a better way.

There is: instead of the server deciding what each endpoint returns, the *client* asks for exactly the fields it wants and gets exactly those back, in a single request. That's GraphQL's whole pitch. The catch is that it moves the difficulty around rather than deleting it - and this guide is upfront about where it lands, plus when REST is still the better call.

## How to read this

- **Want to know if GraphQL is even worth it?** Skim [Phase 1: The Problem REST Leaves](01-the-problem-rest-leaves.md) for the motivation, then jump straight to [Phase 3: The Real Trade-offs](03-the-honest-trade-offs.md).
- **Want it to finally make sense?** Read in order - each phase builds on the last. The mental model in Phase 1 makes the machinery in Phase 2 obvious, and the trade-offs in Phase 3 only land once you've seen how it works.

## The phases

1. **[The Problem REST Leaves](01-the-problem-rest-leaves.md)** - over-fetching and under-fetching, the two everyday REST frustrations, and the one-sentence pitch GraphQL makes in response.
2. **[How GraphQL Works](02-how-graphql-works.md)** - the pieces: a typed schema (the contract), one endpoint, queries vs mutations, and the idea that the response mirrors the request. With an annotated query and its matching JSON.
3. **[The Real Trade-offs](03-the-honest-trade-offs.md)** - what GraphQL costs you: harder caching, the N+1 problem, query-complexity and abuse concerns, and added tooling. When REST (or gRPC) is the better choice.

> This guide is the mental model and the decision, not a build tutorial. Schema-design patterns, resolver internals, subscriptions, and federation are deep topics deferred to a follow-up guide. Sibling reads: [REST APIs, Explained](/guides/rest-apis-explained) and [gRPC, Explained](/guides/grpc-explained).
