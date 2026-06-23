---
title: "Testing & Production"
guide: "fastify-from-zero"
phase: 7
summary: "Test the books API in process with Fastify's built-in app.inject(), structure the app as a buildApp() function, then harden for production with pino logging, graceful shutdown, env config, and official plugins."
tags: [fastify, javascript, testing, inject, production]
difficulty: intermediate
synonyms: ["fastify testing", "fastify inject", "fastify app.inject", "fastify production", "fastify graceful shutdown", "fastify logger pino", "fastify deploy"]
updated: 2026-06-23
---

# Testing & Production

Here's the mental model that makes Fastify testing click: **a test sends a fake request through your real app, in the same process — no port, no socket, no network.** You hand nothing to an external library; Fastify already ships the tool. You call `app.inject()`, hand it a method and a URL, and Fastify dispatches that request through the *entire* app — every hook, every schema, every plugin, your route handler — exactly as a real HTTP request would travel. Then it hands you back the response object to assert on.

> 💡 Coming from Express, you reached for `supertest`. In Fastify you don't install anything: `app.inject()` is built in, and it's the official, recommended way to test. One less dependency, and it understands Fastify's lifecycle natively.

The reason this works cleanly is a small structural choice we make once and reuse everywhere: **build the app as a function that returns a configured-but-not-started instance.** Your tests build a fresh app and inject into it; your entry file builds the same app and calls `listen` on it. The two share one definition and never fight over a port.

## Structure: a `buildApp()` function

Everything in this phase depends on splitting "build the app" from "start the app." Put the building in a function that registers your plugins and routes and returns the instance — but never calls `listen`.

```javascript
// app.js
const Fastify = require('fastify');

function buildApp(opts = {}) {
  const app = Fastify(opts);

  app.register(require('./routes/books'));   // your CRUD plugin from Phase 5
  // ...setErrorHandler, other plugins, decorators...

  return app;                                 // configured, NOT listening
}

module.exports = buildApp;
```

*What just happened:* `buildApp()` does all the wiring — it creates a Fastify instance, registers the books routes plugin, and returns it. The crucial thing is what it *doesn't* do: it never calls `app.listen()`, so nothing binds a port. The `opts` parameter lets a caller pass options through (a test might pass `{ logger: false }` to keep output quiet; production passes `{ logger: true }`). This one function is now the single source of truth for what your app *is*.

The entry file is then tiny — it builds the app and starts it:

```javascript
// server.js
const buildApp = require('./app');

const app = buildApp({ logger: true });
const port = process.env.PORT || 3000;

app.listen({ port, host: '0.0.0.0' })
  .catch((err) => { app.log.error(err); process.exit(1); });
```

*What just happened:* `server.js` is the only place that calls `listen`. It builds the app with logging on, reads the port from the environment (more on that below), and starts accepting connections. If startup fails — a port already in use, a plugin that throws — we log the error and exit non-zero so a supervisor knows the process died. Tests will `require('./app')`, never `./server.js`, so importing your app for a test never tries to open a socket.

## Testing the books API with `app.inject()`

Now the payoff. A test builds the app, injects a request, asserts on the response, and closes the app. The runner can be `jest`, `vitest`, or Node's built-in `node:test` — `app.inject()` is identical for all of them.

```javascript
const buildApp = require('../app');

test('GET /api/books returns 200', async () => {
  const app = buildApp();
  const res = await app.inject({ method: 'GET', url: '/api/books' });

  expect(res.statusCode).toBe(200);
  expect(res.json()).toBeInstanceOf(Array);   // res.json() parses the body
  await app.close();
});
```

*What just happened:* `buildApp()` gives us a fresh instance for this test. `app.inject({ method, url })` constructs a fake GET request and pushes it through the full lifecycle — `onRequest` hooks, schema validation, your handler — without ever touching TCP. `await` resolves once your route replies, and `res` holds the status, headers, and body. `res.json()` is a Fastify convenience that parses the JSON body for you, so we can assert it came back as an array. Finally `await app.close()` runs your `onClose` hooks and frees resources — important so one test's app doesn't leak into the next.

Writes look the same, with a `payload` for the body:

```javascript
test('POST /api/books creates a book', async () => {
  const app = buildApp();
  const res = await app.inject({
    method: 'POST',
    url: '/api/books',
    payload: { title: 'Dune', author: 'Herbert' },
  });

  expect(res.statusCode).toBe(201);
  expect(res.json().title).toBe('Dune');
  await app.close();
});
```

*What just happened:* `payload` is the request body. Hand it a plain object and Fastify serializes it to JSON and sets `Content-Type: application/json` for you, so your route's body schema validates it just like a real client's POST. We assert the 201 and that the created book came back with the right title. No port, no `fetch`, no server running in the background — just a function call that exercises your real route.

> 📝 Test the unhappy paths, not only the happy ones. A `POST` missing `title` should return `400` (your Phase 2 body schema rejects it), and `GET /api/books/9999` for a missing id should return `404` (your Phase 6 error handling). Those tests are where validation and error handling earn their keep — and where regressions hide. The same `app.inject()` tests become your **regression net in CI**: every push runs them before anything merges. See [Testing in CI](/guides/testing-in-ci) for wiring this into a pipeline.

> ⚠️ Shared mutable state will bite you. If the books API keeps books in an in-memory array, one test's `POST` leaks into the next test's `GET`, and your suite passes alone but fails together. Build a fresh app per test (or reset the store in a `beforeEach`) so tests stay independent. Order-dependent tests are a classic, maddening flake.

## Getting ready for production

A server that runs on your laptop isn't a server ready for the open internet. Three concerns separate them: structured logging, configuration that changes per environment, and shutdown behavior that doesn't drop requests. Fastify gives you strong defaults for the first.

**Logging is built in — turn it on.** Fastify ships with [pino](/guides/express-from-zero), a very fast JSON logger, wired straight into the instance.

```javascript
const app = buildApp({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    redact: ['req.headers.authorization'],   // never log secrets
  },
});

app.get('/api/books/:id', async (request, reply) => {
  request.log.info({ id: request.params.id }, 'fetching book');
  // ...
});
```

*What just happened:* passing a `logger` object configures pino — `level` controls verbosity (set it from the environment so prod can be quieter or louder without a code change), and `redact` scrubs sensitive fields so an auth token never lands in your logs. Fastify automatically logs every request and response with timing, and `request.log` is a child logger that tags each line with that request's id — so when you add `request.log.info(...)`, you get structured, correlated logs you can actually search in production. Structured JSON beats `console.log` the moment you ship.

**Config comes from the environment, never hardcoded.** Port, log level, database URL — all of it lives in environment variables so the same code runs unchanged on your machine, in CI, and in production.

```javascript
const port = process.env.PORT || 3000;
const host = process.env.HOST || '0.0.0.0';
```

*What just happened:* `process.env.PORT` reads the port your platform assigns (most set it for you), with a local fallback. The `host` matters more than it looks: the default `localhost` only accepts connections from the same machine, which is invisible from outside a **container**. Listening on `0.0.0.0` binds all interfaces so the container's port mapping (or your orchestrator) can actually reach the app. Forgetting this is the classic "works locally, 502s in Docker" bug.

## Shutting down without dropping requests

When a platform redeploys or scales down, it sends your process a `SIGTERM` and gives it a few seconds before it's killed. Ignore the signal and in-flight requests get cut mid-response. **Graceful shutdown means: stop accepting new connections, let current ones finish, then exit.** Fastify's `app.close()` does exactly the draining for you.

```javascript
async function shutdown() {
  app.log.info('shutting down...');
  await app.close();          // drains in-flight requests, runs onClose hooks
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);   // Ctrl-C in your terminal
```

*What just happened:* on `SIGTERM` (deploy/scale-down) or `SIGINT` (you hit Ctrl-C), we call `await app.close()`. Fastify stops accepting new connections, lets the requests already in flight run to completion, and runs every plugin's `onClose` hook (closing DB pools, flushing logs) before the promise resolves. Only then do we `process.exit(0)`. No half-written responses, no abandoned clients, no leaked connections.

> 💡 If you'd rather not hand-write the signal handling, the official `@fastify/graceful-shutdown` plugin registers these handlers and the drain logic for you. The small handler above is fine for most apps; reach for the plugin when you want extra timeout control.

**Stack the official hardening plugins** the same way you registered everything else — Fastify keeps the core lean and ships security and limits as first-party plugins:

```javascript
app.register(require('@fastify/helmet'));    // safe HTTP security headers
app.register(require('@fastify/cors'));      // controls cross-origin access
app.register(require('@fastify/rate-limit'), { max: 100, timeWindow: '1 minute' });
```

*What just happened:* each `register` adds a first-party plugin. `@fastify/helmet` sets defensive HTTP headers, `@fastify/cors` decides which browser origins may call your API, and `@fastify/rate-limit` rejects an IP that exceeds 100 requests a minute, blunting abuse. These are official, Fastify-maintained packages — the framework's whole philosophy is a fast core plus plugins for everything else, and production hardening is just three more registrations.

## Deploying it

With logging, config, graceful shutdown, and hardening in place, deployment is mostly packaging:

- **Run it in a container, behind a reverse proxy.** In production your app almost always sits behind nginx or your platform's load balancer, which terminates TLS and forwards requests. Bind to `0.0.0.0` (above) so the proxy can reach it, and configure `trustProxy` in your Fastify options if you need the real client IP from `X-Forwarded-For`.
- **Use `fastify-cli` as a convenient runner.** Instead of a hand-written `server.js`, `fastify-cli` can start your app from the command line: `fastify start app.js`. It expects `app.js` to export a plugin function and handles `listen`, logging, and graceful shutdown for you — a nice option once your app is a clean exported function (which `buildApp` already nudges you toward).
- **Let a supervisor restart crashes.** A container orchestrator (or PM2) restarts the process if it dies and runs multiple instances across CPU cores. Don't rely on `node server.js` in a terminal staying alive.

When you're ready to take the whole thing live — a domain, TLS, environment secrets, the deploy itself — [Ship Your Side Project](/guides/ship-your-side-project) walks the last mile.

## Recap

- **Testing is `app.inject()`** — Fastify's built-in dispatcher pushes a fake request through your real app in-process (every hook, schema, and route), with no port and no network. No `supertest` needed.
- **Structure the app as `buildApp()`** that returns a configured-but-not-started instance; tests build and inject into it, and only `server.js` calls `listen`. That split is what keeps tests in memory.
- **Use `payload` for request bodies** and `res.json()` to parse responses; test the unhappy paths (400, 404) too, build a fresh app per test, and `await app.close()` to clean up.
- **Turn on the built-in pino logger** (`logger: { level, redact }`) for fast structured JSON logs and per-request child loggers; read config like `PORT` from the environment.
- **Bind to `0.0.0.0`** so containers and proxies can reach you, and shut down gracefully with `await app.close()` on `SIGTERM`/`SIGINT` so in-flight requests drain.
- **Harden with official plugins** (`@fastify/helmet`, `@fastify/cors`, `@fastify/rate-limit`), run behind a reverse proxy, and consider `fastify-cli` as the runner.

## Quick check

```quiz
[
  {
    "q": "How do you send a test request to a Fastify app without opening a network port?",
    "choices": ["Install supertest and wrap the app", "Call app.inject() with a method and url — it dispatches through the real app in-process", "Start the server on a random port", "Mock every route by hand"],
    "answer": 1,
    "explain": "app.inject() is built into Fastify. It runs a fake request through the full lifecycle (hooks, schemas, handler) in the same process — no socket, no port, and no extra dependency like supertest."
  },
  {
    "q": "Why structure the app as a buildApp() function that returns the instance without calling listen?",
    "choices": ["It makes Fastify faster at runtime", "So tests can build the app and inject into it while only the entry file calls listen — sharing one definition without binding a port", "Because listen is deprecated", "To enable the pino logger"],
    "answer": 1,
    "explain": "Building without listening means a test can require the app and inject requests in memory, while server.js is the single place that opens a port. Tests and production share one app definition and never fight over the port."
  },
  {
    "q": "What does await app.close() do when called on SIGTERM during a deploy?",
    "choices": ["Kills all connections instantly", "Stops accepting new connections, lets in-flight requests finish, and runs onClose hooks before resolving", "Restarts the process", "Closes only the logger"],
    "answer": 1,
    "explain": "app.close() stops new connections, drains the requests already in flight, and runs every plugin's onClose hook (closing pools, flushing logs) before its promise resolves — so you exit cleanly without dropping responses."
  }
]
```

[← Phase 6: Error Handling](06-error-handling.md) · [Guide overview](_guide.md) · [Phase 8: Where to Go Next →](08-where-to-go-next.md)
