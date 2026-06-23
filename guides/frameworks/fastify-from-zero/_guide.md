---
title: "Fastify From Zero"
guide: "fastify-from-zero"
phase: 0
summary: "Learn the fast, schema-first Node.js framework: routing with JSON-schema validation and serialization, the encapsulated plugin system, the request/reply lifecycle and hooks, building a REST API, error handling, and testing and production. A modern, performance-focused alternative to Express that bakes in validation and structure."
tags: [fastify, javascript, nodejs, typescript, web, framework, rest, api, schema]
category: frameworks
order: 34
group: "JavaScript"
difficulty: intermediate
synonyms: ["learn fastify", "fastify tutorial", "node fastify rest api", "fastify json schema", "fastify plugins encapsulation", "fastify hooks lifecycle", "fastify vs express", "fastify validation"]
updated: 2026-06-23
---

# Fastify From Zero

Fastify is the Node framework you reach for when you want [Express](/guides/express-from-zero)'s simplicity
but more speed, more structure, and validation built in rather than bolted on. Two ideas set it apart:
it's genuinely **fast** (one of the quickest Node frameworks, partly because it compiles your JSON schemas
into optimized validation and serialization), and it's **schema-first** — you describe each route's input
and output with JSON Schema, and Fastify validates requests, serializes responses, and can generate docs
from that one description. It's a popular, production-proven choice, especially for new TypeScript services.

The mental model has two pillars. First, **a route is a handler plus a schema**: you give Fastify the
method, path, an `async (request, reply)` handler, and a `schema` describing body/params/querystring/response
— and validation + fast serialization come for free. Second, **everything is a plugin**: routes, decorators,
and shared logic are registered as plugins, and plugins are **encapsulated** — what you register inside a
plugin is scoped to that plugin and its children, which is how Fastify keeps large apps organized. Hold
"routes carry schemas, and the app is a tree of encapsulated plugins," and Fastify makes sense.

> 📝 This teaches the **framework** — it assumes you know **JavaScript**/Node (functions, `async`/`await`,
> modules — [JavaScript From Zero](/guides/javascript-from-zero)); it's especially nice with
> [TypeScript](/guides/typescript-from-zero). It's most illuminating read against
> [Express](/guides/express-from-zero) (the closest comparison) and over the
> [node:http roots guide](/guides/build-a-server-with-node-http). Fastify runs on Node, so examples are
> shown with the commands to run them.

## How to read this

Read in order — it grows one service (a small **books API**) using schemas and plugins from a single route
to a tested, deployable REST API. Phases carry difficulty badges.

## The phases

**Part 1 — The core (🟢 → 🟡)**
1. **[What Fastify Is & Your First Server](01-what-fastify-is.md)** 🟢 — the instance, an async handler, and a running server.
2. **[Routing & Schemas](02-routing-and-schemas.md)** 🟡 — methods, params, and JSON-schema validation + serialization.
3. **[The Plugin System](03-the-plugin-system.md)** 🔴 — `register`, encapsulation, and `decorate`.

**Part 2 — A real API (🟡 → 🔴)**
4. **[Hooks & the Lifecycle](04-hooks-and-lifecycle.md)** 🟡 — the request/reply lifecycle and hooks (`onRequest`, `preHandler`, …).
5. **[Building a REST API](05-building-a-rest-api.md)** 🟡 — full CRUD with schemas, plugins, and a service.
6. **[Error Handling](06-error-handling.md)** 🔴 — `setErrorHandler`, validation errors, and consistent responses.

**Part 3 — Ship it (🟡 → 🟢)**
7. **[Testing & Production](07-testing-and-production.md)** 🟡 — `app.inject()`, logging, and deployment.
8. **[Where to Go Next](08-where-to-go-next.md)** 🟢 — Fastify vs Express/NestJS, the plugin ecosystem, and what to build.

> The throughline: **a route is a handler plus a schema, and the app is a tree of encapsulated plugins.**
> That schema-first, plugin-based design is Fastify's whole personality.

---

[Phase 1: What Fastify Is & Your First Server →](01-what-fastify-is.md)
