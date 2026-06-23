---
title: "Testing & Production"
guide: "express-from-zero"
phase: 8
summary: "Test the tasks API in memory with supertest and a runner, then harden it for production: env config, helmet/cors/compression/rate-limit, graceful shutdown, and a reverse proxy."
tags: [express, javascript, testing, supertest, production]
difficulty: intermediate
synonyms: ["express testing", "supertest", "express jest", "express production", "express graceful shutdown", "express helmet cors", "express deploy"]
updated: 2026-06-23
---

# Testing & Production

Here's the mental model that makes Express testing click: **a test calls your app in memory — no real network, no open port.** You hand `supertest` your Express `app` object, it sends a fake request straight into the middleware chain, your routes run exactly as they would in production, and you get back the response to assert on. The request never touches a TCP socket. Nothing is "running" in the background.

This is the entire payoff of the `app` / `app.listen` split from [Phase 7](07-serving-and-structure.md). Because `app.js` exports the configured app *without* starting a listener, a test file can `require('../app')` and exercise it directly. If `app.js` had called `app.listen()` at the bottom, importing it would try to bind a port every time you ran the suite — slow, flaky, and a mess when ten test files all want port 3000. The split exists precisely so testing stays in memory.

> 💡 Hold this picture: **supertest is a fake browser that lives inside your test process.** It speaks HTTP to your app object, not over the wire. That's why tests are fast and don't need a server.

## Testing the tasks API

You need two pieces: a **test runner** (it finds tests, runs them, reports pass/fail) and **supertest** (it drives HTTP requests at your app). The runner can be `jest`, `vitest`, or Node's built-in `node:test` — the supertest part is identical for all three. Install the pair:

```bash
npm install --save-dev supertest jest
```

Now a test for the tasks API. The one line that matters is the import — the app *without* `listen`.

```javascript
const request = require('supertest');
const app = require('../app');   // the configured app, NOT a running server

test('GET /api/tasks returns 200', async () => {
  const res = await request(app).get('/api/tasks');
  expect(res.statusCode).toBe(200);
});
```

*What just happened:* `request(app)` wraps your Express app in a test client. `.get('/api/tasks')` builds a fake GET request and pushes it through the middleware chain — routers, parsers, your handler, all of it. `await` resolves once your route sends a response, and `res` holds the status, headers, and body. No port was opened; if you ran this you'd see a passing test in milliseconds.

Writes work the same way — you chain `.send()` to attach a JSON body, and supertest has a `.expect()` shorthand for asserting status inline:

```javascript
test('POST /api/tasks creates a task', async () => {
  const res = await request(app)
    .post('/api/tasks')
    .send({ title: 'write tests' })
    .expect(201);

  expect(res.body.title).toBe('write tests');
});
```

*What just happened:* `.send({ title: 'write tests' })` sets the request body and the `Content-Type: application/json` header for you, so your `express.json()` parser populates `req.body` just like a real client would. `.expect(201)` fails the test if the status isn't 201 — handy for the happy path. Then we reach into `res.body` (the parsed JSON your route returned) and assert the created task came back with the right title.

> 📝 Test the unhappy paths too, not only the happy ones. A `POST` with a missing `title` should return `400`, a `GET /api/tasks/9999` for a nonexistent id should return `404`. Those tests are where your validation and error handling from Phases 4 and 6 earn their keep — and where regressions hide.

Run the suite with your runner (`npx jest`, or a `"test": "jest"` script in `package.json`). The same `request(app)` tests become your **regression net in CI** — every push runs them before anything merges. See [Testing in CI](/guides/testing-in-ci) for wiring this into a pipeline.

> ⚠️ Shared mutable state will bite you. If the tasks API keeps tasks in an in-memory array, one test's `POST` leaks into the next test's `GET`. Reset state between tests (jest's `beforeEach`) or your suite passes alone and fails together. Order-dependent tests are a classic, maddening flake.

## Getting ready for production

A server that runs on your laptop is not a server that's ready for the open internet. Three concerns separate the two: configuration that changes per environment, middleware that protects and speeds up the app, and shutdown behavior that doesn't drop requests.

**Config comes from the environment, never from hardcoded values.** Your port, your `NODE_ENV`, your database URL — all of it lives in environment variables so the same code runs unchanged on your machine, in CI, and in production.

```javascript
const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === 'production';
```

*What just happened:* `process.env.PORT` reads the port your hosting platform assigns (most platforms set this for you); the `|| 3000` is a local fallback. `NODE_ENV === 'production'` becomes a switch you flip behaviors on — verbose logging off, error stack traces hidden. Setting `NODE_ENV=production` also makes Express itself skip some dev-only work and cache views, so it's not optional cosmetics.

**Then the production middleware.** Express's tiny core means security and performance are opt-in packages you stack at the top of the chain:

```javascript
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

app.use(helmet());          // sets safe HTTP security headers
app.use(cors());            // controls who may call your API from a browser
app.use(compression());     // gzips responses to shrink payloads
app.use(rateLimit({ windowMs: 60_000, limit: 100 }));  // caps requests per IP
```

*What just happened:* each `app.use` adds one more `(req, res, next)` function to the front of the chain — the same shape you've used since Phase 3, just from npm. `helmet` sets a batch of defensive headers (hiding `X-Powered-By`, enabling content-type protections). `cors` decides which origins a browser is allowed to call the API from. `compression` gzips response bodies, cutting bandwidth. `rateLimit` rejects an IP that fires more than 100 requests a minute, blunting abuse and runaway clients. Order matters: put these before your routes so every request passes through them.

> 💡 None of this is Express-specific magic — it's the framework's whole philosophy. Small core, middleware for everything else. Production hardening is just four more links in the chain.

## Shutting down without dropping requests

When a platform redeploys or scales down, it sends your process a `SIGTERM` and gives it a few seconds to exit before it's killed. If you ignore the signal, in-flight requests get cut off mid-response and clients see broken connections. **Graceful shutdown means: stop accepting new connections, let the current ones finish, then exit.** This is the other reason you captured the server object instead of throwing away the return value of `app.listen`.

```javascript
const server = app.listen(PORT, () => {
  console.log(`listening on ${PORT}`);
});

function shutdown() {
  console.log('shutting down...');
  server.close(() => process.exit(0));   // drains in-flight requests, then exits
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);          // Ctrl-C in your terminal
```

*What just happened:* `app.listen` returns the underlying Node HTTP server, and we keep it in `server`. When the OS sends `SIGTERM` (deploy/scale-down) or `SIGINT` (you hit Ctrl-C), `server.close()` stops the server from accepting *new* connections but lets the requests already being handled run to completion; once they're all done, the callback fires and we exit cleanly with code 0. No half-written responses, no abandoned clients.

A few more production realities, briefly:

- **Run it under a supervisor.** A process manager like **PM2**, or a container orchestrator, restarts your app if it crashes and runs multiple instances across CPU cores. Don't rely on `node app.js` in a terminal staying alive.
- **Sit behind a reverse proxy.** In production your app almost always runs behind nginx (or your platform's load balancer), which terminates TLS and forwards requests. Tell Express to trust it so `req.ip` and `req.protocol` reflect the real client, not the proxy:

```javascript
app.set('trust proxy', 1);   // honor X-Forwarded-* headers from one proxy hop
```

*What just happened:* without this, every request looks like it came from the proxy's address (often `127.0.0.1`), which quietly breaks rate limiting and any IP-based logic. `trust proxy` tells Express to read the `X-Forwarded-For` / `X-Forwarded-Proto` headers the proxy sets, so `req.ip` is the actual visitor and `req.secure` is true for HTTPS.

> ⚠️ Don't leak stack traces to clients in production. Your Phase 6 error handler should log the full error server-side (with **pino** or **winston**) but send the client only a generic message and status in prod — a stack trace exposes file paths, dependency versions, and sometimes secrets. This is exactly what the `isProd` switch is for.

When you're ready to take the whole thing live — domains, TLS, environment secrets, and the deploy itself — [Ship Your Side Project](/guides/ship-your-side-project) walks the last mile.

## Recap

- **Tests run in memory:** `request(app)` from supertest pushes fake HTTP requests through your middleware chain with no port and no network — fast and isolated.
- **The app/listen split is what makes this possible:** a test imports the configured `app`; only the entry point calls `app.listen`. Test happy *and* unhappy paths, and reset shared state between tests.
- **Production config comes from the environment** (`process.env.PORT`, `NODE_ENV=production`), never hardcoded.
- **Stack hardening middleware before your routes:** `helmet`, `cors`, `compression`, and a rate limiter — small core, middleware for everything.
- **Shut down gracefully:** capture `const server = app.listen(...)` and call `server.close()` on `SIGTERM`/`SIGINT` so in-flight requests drain.
- **Behind a proxy, set `app.set('trust proxy', 1)`**, run under PM2 or a container, and never send stack traces to clients in prod.

## Quick check

```quiz
[
  {
    "q": "Why can supertest test your Express app without opening a network port?",
    "choices": ["It mocks every route by hand", "It pushes fake requests directly through the imported app's middleware chain in memory", "It starts a hidden server on a random port", "It only works against a deployed URL"],
    "answer": 1,
    "explain": "supertest takes the app object and runs requests through its middleware chain in-process — no socket, no port. This is why the Phase 7 app/listen split matters: you import the app, not a running server."
  },
  {
    "q": "On SIGTERM during a deploy, what does server.close() do?",
    "choices": ["Kills all connections instantly", "Stops accepting new connections but lets in-flight requests finish, then exits", "Restarts the server", "Closes the database only"],
    "answer": 1,
    "explain": "server.close() stops accepting new connections and waits for current requests to complete before its callback fires — so you can exit cleanly without dropping in-flight responses."
  },
  {
    "q": "Why set app.set('trust proxy', 1) when running behind nginx?",
    "choices": ["It enables HTTPS", "It compresses responses", "So req.ip and req.protocol reflect the real client via X-Forwarded-* headers, not the proxy", "It installs helmet automatically"],
    "answer": 2,
    "explain": "Behind a proxy, requests appear to come from the proxy's address. trust proxy tells Express to read the X-Forwarded-* headers, restoring the real client IP and protocol — which rate limiting and IP logic depend on."
  }
]
```

[← Phase 7: Serving & Structuring an App](07-serving-and-structure.md) · [Guide overview](_guide.md) · [Phase 9: Where to Go Next →](09-where-to-go-next.md)
