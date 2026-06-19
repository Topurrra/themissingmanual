---
title: "gRPC, Explained"
guide: "grpc-explained"
phase: 0
summary: "What gRPC actually is — a contract-first way for internal services to call each other fast — how the .proto file, code generation, and HTTP/2 streaming fit together, and the honest trade-offs versus REST and GraphQL."
tags: [grpc, protobuf, http2, microservices, rpc, apis]
category: apis
difficulty: intermediate
order: 6
synonyms: ["what is grpc", "grpc vs rest", "what is a proto file", "how does grpc work", "protocol buffers explained", "when to use grpc", "grpc streaming"]
updated: 2026-06-19
---

# gRPC, Explained

You've shipped REST APIs. You know how to design a JSON endpoint, read a `404`, and `curl` something to
see what comes back. Then someone on your team says "we're putting this service behind gRPC" and suddenly
there's a `.proto` file, a code-generation step in the build, and a binary payload you can't read in your
browser. It feels like a different universe with its own rules nobody wrote down for you.

It isn't magic, and it isn't a replacement for everything you know. gRPC is a focused tool that solves one
problem really well: letting *internal services call each other* quickly, with a strict typed contract both
sides agree on in advance. This guide installs the mental model first — define the functions once, both
sides agree — then shows how the pieces actually work, and ends with an honest look at when gRPC is the
right call and when it absolutely isn't.

## How to read this
- **Just need the "REST vs GraphQL vs gRPC, when do I use which" answer?** Jump to the table at the top of
  [Phase 3: The Honest Trade-offs](03-the-honest-trade-offs.md).
- **Want it to finally make sense?** Read in order — each phase builds on the last. The mental model in
  Phase 1 is what makes the machinery in Phase 2 feel obvious.

## The phases
1. **[The Problem gRPC Solves](01-the-problem-grpc-solves.md)** — why services that call each other
   thousands of times need speed *and* a strict typed contract, and how gRPC delivers both.
2. **[How gRPC Works](02-how-grpc-works.md)** — the `.proto` file, code generation, binary serialization,
   and the four call types (unary plus three streaming modes), at a gentle level.
3. **[The Honest Trade-offs](03-the-honest-trade-offs.md)** — what you give up (human-readable payloads,
   easy browser support), what you gain, and a fair REST-vs-GraphQL-vs-gRPC "when to use which" table.

> Deep material — custom interceptors, deadlines and retries, load balancing, mutual TLS, and the wire
> format byte-by-byte — is deliberately left out so this stays a guide and not a reference manual. Once the
> model here clicks, the official docs at grpc.io read much more easily.

## Related guides
- [REST APIs, Explained](/guides/rest-apis-explained) — the model gRPC is most often compared to.
- [GraphQL, Explained](/guides/graphql-explained) — the other "beyond REST" option, with different goals.
