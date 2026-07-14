---
title: "Build a Server With Only node:http"
guide: "build-a-server-with-node-http"
phase: 0
summary: "Build a real web server using nothing but Node's built-in http module: the server/request/response model, reading requests and writing JSON, routing by hand, middleware as plain functions, a full REST API with no framework, async and streams and structure, and exactly what Express adds on top. The foundation every Node framework is built on."
tags: [node, nodejs, http, javascript, web, rest, api, framework-internals]
category: frameworks
order: 36
group: "JavaScript"
difficulty: intermediate
synonyms: ["node http module", "node server no framework", "node createServer", "node http request response", "node rest api no express", "what express is built on", "node http routing by hand"]
updated: 2026-06-23
---

# Build a Server With Only node:http

Before you reach for Express or Fastify, it's worth knowing this: Node ships with everything you need to
run a real web server in its built-in **`node:http`** module. Express and Fastify are conveniences *over
this* - and once you've built a JSON API with only the standard library, every Node framework reads as
"`node:http` with the boilerplate removed." This is the **roots** guide: learn it and `app.get(...)` stops
being magic, because you'll have written the thing it wraps.

The mental model is small. **`http.createServer`** gives you a server; you hand it one **request listener**
 - a function `(req, res)` called for every request. `req` is a readable stream of the incoming request
(method, url, headers, body); `res` is a writable stream you set a status + headers on and write the
response to. There's no router and no middleware - you write a router by switching on `req.method` and
`req.url`, and "middleware" is just a function you call before your handler. Hold "a server calls your
`(req, res)` function for each request, and you do the rest," and the whole Node web stack opens up.

> 📝 This is a **roots** guide - it assumes **JavaScript**/Node: functions, `async`/`await`, callbacks,
> streams basics ([JavaScript From Zero](/guides/javascript-from-zero)) and basic **HTTP**
> ([HTTP, Explained](/guides/http-explained)). It's the JS parallel to the Go
> [net/http roots guide](/guides/web-services-with-only-net-http) and is best read before or alongside
> [Express](/guides/express-from-zero) so you can see what it adds. Examples run with `node`.

## How to read this

Short and foundational - read in order. It builds a bare server, then a full JSON API (a small **messages**
service), then maps it onto Express. Phases carry difficulty badges.

## The phases

1. **[The node:http Mental Model](01-the-mental-model.md)** 🟢 - `createServer`, the `(req, res)` listener, and how a request flows.
2. **[Handling Requests & Responses](02-requests-and-responses.md)** 🟡 - method/url/headers, reading the body, and writing JSON with a status.
3. **[Routing by Hand](03-routing-by-hand.md)** 🟡 - switching on method + path, and why a real router exists.
4. **[Middleware Is Just a Function](04-middleware-is-a-function.md)** 🟡 - wrapping handlers, and the chain Express formalizes.
5. **[A JSON REST API With No Framework](05-rest-api-no-framework.md)** 🔴 - full CRUD for the messages resource, standard library only.
6. **[Async, Streams & Structure](06-async-streams-structure.md)** 🔴 - promises in handlers, streaming, graceful shutdown, and layout.
7. **[What Express Adds](07-what-express-adds.md)** 🟢 - mapping Express back onto this, and when you don't need a framework.

> The throughline: **`http.createServer` calls your `(req, res)` function per request; routing and
> middleware are code you write.** That's `node:http`, and it's the skeleton inside every Node framework.

---

[Phase 1: The node:http Mental Model →](01-the-mental-model.md)
