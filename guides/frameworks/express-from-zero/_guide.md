---
title: "Express From Zero"
guide: "express-from-zero"
phase: 0
summary: "Learn the minimalist web framework that defined Node.js backends: routing, the middleware chain that is Express's whole personality, the request and response objects, building a REST API, error handling, serving and structuring an app, and testing and production. Small core, middleware for everything else."
tags: [express, javascript, nodejs, web, framework, rest, api, middleware]
category: frameworks
order: 33
group: "JavaScript"
difficulty: intermediate
synonyms: ["learn express", "express js tutorial", "node express rest api", "express routing", "express middleware", "express req res", "express error handling", "express vs fastify"]
updated: 2026-06-23
---

# Express From Zero

Express is the framework that defined what a Node.js backend looks like. It's deliberately tiny - a thin
layer over Node's built-in HTTP server - and that minimalism is its whole identity: Express gives you
routing and a middleware system, and leaves everything else (body parsing, auth, validation, templating)
to middleware you add. A decade-plus of Node tutorials, jobs, and production apps run on it, so even as
newer frameworks appear, Express is the one you're most likely to meet and the clearest lens on how Node
web servers work.

The mental model is one idea repeated everywhere: **the middleware chain**. A request enters and flows
through an ordered series of functions, each with the shape `(req, res, next)`. Each one can read or change
the request, send a response, or call `next()` to pass control to the next function. Routes are just
middleware bound to a method and path; error handlers are middleware with an extra argument. Hold "an
Express app is a pipeline of `(req, res, next)` functions," and the entire framework - routing, parsing,
auth, errors - is the same shape in different costumes.

> 📝 This teaches the **framework** - it assumes you know **JavaScript**: functions, callbacks, promises,
> `async`/`await`, and modules ([JavaScript From Zero](/guides/javascript-from-zero)). It pairs with
> [What a Framework Even Is](/guides/what-a-framework-even-is), and the
> [node:http roots guide](/guides/build-a-server-with-node-http) shows exactly what Express wraps. Compare
> it with [Fastify](/guides/fastify-from-zero) and [NestJS](/guides/nestjs-from-zero). Express runs on
> Node, so examples are shown with the commands to run them.

## How to read this

Read in order - it grows one service (a small **tasks API**) from a single route to a structured, tested,
deployable REST API. Phases carry difficulty badges.

## The phases

**Part 1 - The core (🟢 Basic)**
1. **[What Express Is & Your First Server](01-what-express-is.md)** 🟢 - the app, a route, and a running server in a few lines.
2. **[Routing](02-routing.md)** 🟢 - methods, route params, query strings, and routers.
3. **[Middleware](03-middleware.md)** 🟡 - the `(req, res, next)` chain, ordering, and built-in + third-party middleware.

**Part 2 - A real API (🟡 → 🔴)**
4. **[Request & Response](04-request-and-response.md)** 🟡 - reading the body/params, `res.json`/status, and validation.
5. **[Building a REST API](05-building-a-rest-api.md)** 🟡 - full CRUD wired through routes and middleware.
6. **[Error Handling](06-error-handling.md)** 🔴 - the error-handling middleware, async errors, and one consistent shape.

**Part 3 - Ship it (🟡 → 🟢)**
7. **[Serving & Structuring an App](07-serving-and-structure.md)** 🟡 - static files, structure beyond one file, and config.
8. **[Testing & Production](08-testing-and-production.md)** 🟡 - supertest, environment config, and deployment.
9. **[Where to Go Next](09-where-to-go-next.md)** 🟢 - Express vs Fastify/NestJS, the ecosystem, and what to build.

> The throughline: an Express app is **a chain of `(req, res, next)` functions** - routes, parsers, auth,
> and error handlers are all that one shape. Hold it and Express is a small tool you fully understand.

---

[Phase 1: What Express Is & Your First Server →](01-what-express-is.md)
