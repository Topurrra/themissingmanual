---
title: "What Fastify Is & Your First Server"
guide: "fastify-from-zero"
phase: 1
summary: "Fastify is the fast, schema-first Node.js framework — an Express alternative with validation built in. Install it, write a tiny async server, run it, and meet the two ideas that define it."
tags: [fastify, javascript, nodejs, web, getting-started]
difficulty: beginner
synonyms: ["what is fastify", "fastify first server", "fastify hello world", "fastify async handler", "fastify listen", "node fastify"]
updated: 2026-06-23
---

# What Fastify Is & Your First Server

You know [JavaScript](/guides/javascript-from-zero) — functions, `async`/`await`, modules — and you've
probably met [Express](/guides/express-from-zero), the minimalist Node web framework everyone starts
with. Fastify is what you reach for when Express's "everything's bolted on, figure it out yourself"
approach starts to bite. It's an [Express](/guides/express-from-zero) alternative built around two
promises: it's genuinely **fast** (one of the quickest Node frameworks), and it's **schema-first** —
input validation and JSON serialization are baked in, not something you wire up later.

Like Express, Fastify sits on top of the same built-in HTTP server you'd otherwise drive raw
([the node:http guide](/guides/build-a-server-with-node-http) shows what's under there, worth seeing
once). If you've read [What a Framework Even Is](/guides/what-a-framework-even-is), Fastify is the
textbook *opinionated* framework: firm ideas about how you should structure things, in exchange for
speed and safety for free.

## The mental model: two pillars

Before any code, hold the two ideas that explain everything Fastify does. The rest of this guide is
just these two getting deeper.

💡 **A route is a handler plus a schema.** A handler is the function that runs when a request arrives.
A schema is a description (in JSON Schema) of what the request body, params, and response should look
like. Hand Fastify both and it validates incoming requests *and* serializes responses fast, for free.
You'll write handlers today; schemas arrive in [Phase 2](02-routing-and-schemas.md).

💡 **The app is a tree of plugins.** Everything you add — routes, shared logic, decorators — gets
registered as a **plugin**, and plugins nest inside other plugins. That tree is how Fastify keeps a
large app organized instead of one giant file. We build the trunk today; the branches come in
[Phase 3](03-the-plugin-system.md).

Hold those two — **handler + schema**, **tree of plugins** — and Fastify stops looking like magic.

## Your first server

One install gets you the framework:

```bash
npm install fastify
```

*What just happened:* `npm` downloaded Fastify and its dependencies into `node_modules` and recorded
it in your `package.json`. The whole framework is now available to `require` (or `import`). This
assumes you've run `npm init -y` first to create a `package.json` — if you haven't, do that, then
install.

Now the smallest Fastify server that does something real. Create a file called `index.js`:

```javascript
const Fastify = require('fastify');
const app = Fastify({ logger: true });

app.get('/', async (request, reply) => {
  return { hello: 'world' };       // returned value is sent as JSON
});

app.listen({ port: 3000 }, (err, address) => {
  if (err) { app.log.error(err); process.exit(1); }
  app.log.info(`listening on ${address}`);
});
```

*What just happened:* four moves, and they're the four you'll use forever.
- `const app = Fastify({ logger: true });` calls the Fastify function to create your **instance** — the
  object that holds your routes and runs the show. The `{ logger: true }` option turns on Fastify's
  built-in logger (the fast [pino](https://getpino.io) logger), so every request gets logged with no
  extra setup.
- `app.get('/', async (request, reply) => { ... })` **registers a route**: "when a `GET` arrives for
  `/`, run this handler." You never call the handler yourself — Fastify calls it when a matching
  request comes in. Notice it's an **`async` function** taking `(request, reply)`: the request (what
  the client sent) and the reply (how you respond).
- The handler **returns a value**, and Fastify sends it as the response. Return a plain object and
  Fastify serializes it to JSON and sets `Content-Type: application/json` for you — no `res.json()`
  ceremony. Whatever you `return` *is* the response body.
- `app.listen({ port: 3000 }, callback)` starts the underlying HTTP server on port 3000. The callback
  fires once it's up (or with an `err` if the port's taken); `address` is the URL it bound to.

⚠️ **Fastify's `listen` takes an options object — `{ port: 3000 }`, not bare `3000`.** This trips up
people coming from Express, where `app.listen(3000)` works. In Fastify 4 and 5 the first argument is
an options object (`{ port, host }`); passing a bare number is deprecated and will bite you. Get this
into your fingers early.

Run it with plain Node — Fastify is a library, there's no special CLI:

```bash
node index.js
```

```console
$ node index.js
{"level":30,"time":1718000000000,"pid":12345,"hostname":"laptop","msg":"Server listening at http://127.0.0.1:3000"}
{"level":30,"time":1718000000001,"pid":12345,"hostname":"laptop","msg":"listening on http://127.0.0.1:3000"}
```

*What just happened:* Node executed your file, Fastify handed its request handler to `node:http`, and
the server is listening. Those JSON lines are the built-in logger talking — the first is Fastify's own
startup message, the second is your `app.log.info` call. The server keeps running, waiting for
requests, until you stop it with `Ctrl+C`. Open a second terminal and hit it:

```bash
curl localhost:3000
```

```console
$ curl localhost:3000
{"hello":"world"}
```

*What just happened:* `curl` sent a `GET /`. Fastify matched it to your route, called the handler, took
its returned object, serialized it to JSON, and sent it back — and logged the request in your first
terminal as it did. A working JSON API in about seven lines.

## Returning a value vs. `reply.send()`

Returning a value is the idiomatic Fastify way, and it's enough most of the time. But sometimes you
need to control the **status code** or set headers — that's what the `reply` object is for. Compare:

```javascript
// Style 1: return the value — Fastify sends it as JSON with status 200
app.get('/health', async (request, reply) => {
  return { status: 'ok', uptime: process.uptime() };
});

// Style 2: use reply when you need a non-200 status or headers
app.post('/things', async (request, reply) => {
  reply.code(201).send({ created: true });
  // 201 = "Created" — the right status for a successful POST
});
```

*What just happened:* both routes respond with JSON. The first **returns** an object — the clean
default, status 200. The second calls `reply.code(201).send(obj)` to set a `201 Created` status *and*
send the body. Rule of thumb: **return when 200 is fine; reach for `reply` when you need a different
status or custom headers.** (One catch: if you call `reply.send()`, don't *also* return a value from
the same handler — pick one. Sending twice is an error, the same way it is in Express.)

The built-in logger you turned on with `{ logger: true }` is always available as `app.log` (and
per-request as `request.log`). It writes structured JSON — ugly to read raw, but exactly what log
tooling wants in production. For pretty local output you can pipe it through `pino-pretty`, but that's
a Phase 7 concern; for now, know that real logging is on by default.

## The running example: a books API

One more thing before we go deeper. Across this guide we grow **one** real service so each concept
lands on something concrete instead of a toy. Meet the **books API** — a small catalog backend where
each book is an object shaped like this:

```javascript
const books = [
  { id: 1, title: 'The Pragmatic Programmer', author: 'Hunt & Thomas' },
  { id: 2, title: 'Clean Code', author: 'Robert Martin' },
];

app.get('/books', async (request, reply) => {
  return books;
});
```

*What just happened:* `books` is an in-memory array of objects, each with `id`, `title`, and `author`.
The `GET /books` route returns the whole list; Fastify serializes the array to JSON. This is the first
endpoint of an API we'll turn into full create/read/update/delete (CRUD) — with schemas validating the
input and plugins organizing the code — over the coming phases. In-memory means the data resets every
restart; that's fine for learning, and we'll talk real storage later. Hitting it:

```console
$ curl localhost:3000/books
[{"id":1,"title":"The Pragmatic Programmer","author":"Hunt & Thomas"},{"id":2,"title":"Clean Code","author":"Robert Martin"}]
```

*What just happened:* the route returned the array, Fastify serialized it, and `curl` printed the JSON.
You've now seen the full shape of a Fastify endpoint — method, path, async handler, returned value —
and you have a real API with one route. Next we make routes carry data (a book's `id` in the URL,
query strings) and attach **schemas** that validate it, which is
[Phase 2: Routing & Schemas](02-routing-and-schemas.md).

## Recap

1. **Fastify is the fast, schema-first Node web framework** — an [Express](/guides/express-from-zero)
   alternative that bakes in JSON-schema validation and fast serialization. It sits on top of
   `node:http`, like Express does. Install with `npm install fastify`.
2. The two big ideas: **a route is a handler plus a schema**, and **the app is a tree of plugins.**
   Schemas land in Phase 2, plugins in Phase 3 — today you write handlers and start the tree.
3. A first server is four moves: `Fastify({ logger: true })` creates the instance (with a built-in
   logger); `app.get(path, async (request, reply) => …)` registers a route; the handler's
   **returned value** is sent as JSON; `app.listen({ port })` starts it. Run with plain `node index.js`.
4. ⚠️ `app.listen` takes an **options object** (`{ port: 3000 }`), not a bare number — a common gotcha
   coming from Express.
5. **Return a value** for the clean 200 case; reach for **`reply.code(n).send(obj)`** when you need a
   specific status (like `201`) or custom headers. Don't return *and* send from the same handler.
6. Our running example is a **books API** (`{ id, title, author }`), starting from a single `GET /books`
   route and growing into full CRUD with schemas and plugins across the guide.

## Quick check

Three questions on what has to stick — what Fastify is, how a first server is wired, and how handlers
respond:

```quiz
[
  {
    "q": "What is Fastify, in one line?",
    "choices": [
      "A fast, schema-first Node.js web framework — an Express alternative with validation and JSON serialization built in",
      "A database for storing JSON documents in Node apps",
      "A standalone web server written in Rust that replaces Node entirely",
      "A frontend UI library for building components in the browser"
    ],
    "answer": 0,
    "explain": "Fastify is a fast, schema-first Node web framework. It's an Express alternative that bakes in JSON-schema validation and fast serialization, and like Express it runs on top of node:http rather than replacing Node."
  },
  {
    "q": "In a Fastify handler `async (request, reply) => { return { hello: 'world' }; }`, what happens to the returned object?",
    "choices": [
      "Fastify serializes it to JSON, sets Content-Type: application/json, and sends it as the response with status 200",
      "Nothing — you must call reply.json() yourself to send a response",
      "It's stored in memory and sent only on the next request",
      "It throws an error because handlers must not return a value"
    ],
    "answer": 0,
    "explain": "In Fastify, the value a handler returns becomes the response: a plain object is serialized to JSON with the JSON content type and sent with status 200. You only reach for reply (e.g. reply.code(201).send(obj)) when you need a different status or custom headers."
  },
  {
    "q": "Which call correctly starts a Fastify server on port 3000?",
    "choices": [
      "app.listen({ port: 3000 }, (err, address) => { ... })",
      "app.listen(3000, () => { ... })",
      "app.start(3000)",
      "app.serve({ on: 3000 })"
    ],
    "answer": 0,
    "explain": "Fastify's listen takes an options object — { port: 3000 } — not a bare number. Passing app.listen(3000) is the Express habit that's deprecated in Fastify and will bite you; always pass the options object."
  }
]
```

---

[Guide overview](_guide.md) · [Phase 2: Routing & Schemas →](02-routing-and-schemas.md)
