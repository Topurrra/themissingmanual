---
title: "Middleware"
guide: "express-from-zero"
phase: 3
summary: "Middleware is the (req, res, next) function chain that is Express's whole personality: read or modify, respond, or call next. Covers ordering, built-in and third-party middleware, and attaching data to req."
tags: [express, javascript, middleware, next, request-pipeline]
difficulty: intermediate
synonyms: ["express middleware", "req res next", "express app.use", "express middleware order", "express.json body parser", "express custom middleware"]
updated: 2026-06-23
---

# Middleware

Here's the secret that makes Express click: there is no separate "middleware feature" bolted on the side. Middleware *is* Express. Routing is middleware. Body parsing is middleware. Auth, logging, error handling — all the same shape. Once you see it, the framework stops being a pile of methods to memorize and becomes one idea you understand all the way down.

## The mental model: a chain of `(req, res, next)` functions

📝 Picture a request walking through a hallway of doors. Each door is a function. The function gets three things: `req` (the request, what came in), `res` (the response, what you'll send back), and `next` (a doorknob that opens the next door).

At each door, the function can do one of three things:

1. **Read or modify** `req`/`res`, then call `next()` to pass the request along.
2. **End the response** itself (`res.send(...)`, `res.json(...)`) — the request stops here, no more doors.
3. **Call `next()`** with nothing changed, only to hand off.

That's the entire model. A middleware function looks exactly like this:

```javascript
function myMiddleware(req, res, next) {
  // ...do something with req or res...
  next(); // open the next door
}
```

*What just happened:* This is the shape of every middleware in Express — three parameters, and a decision about whether to call `next()`. A route handler like `app.get('/tasks', (req, res) => ...)` is the same thing; it happens to be the *last* door, so it sends a response instead of calling `next()`. Routes are middleware bound to a method and a path. Hold that and the rest of this phase is variations on one theme.

💡 If you read [Build a Server with node:http](/guides/build-a-server-with-node-http), you already met `(req, res)` and the idea of "call the next function to keep going." Express didn't invent this — it formalized it and gave it a name.

## Writing your first middleware: a request logger

The classic first middleware logs every request: method, URL, status, and how long it took. We'll build it for the running **tasks API** from the previous phases.

```javascript
const express = require('express');
const app = express();

function logger(req, res, next) {
  const start = Date.now();
  res.on('finish', () => {
    console.log(`${req.method} ${req.url} ${res.statusCode} ${Date.now() - start}ms`);
  });
  next(); // hand off to the next middleware
}

app.use(logger); // runs for EVERY request

app.get('/tasks', (req, res) => {
  res.json([{ id: 1, title: 'Write the docs' }]);
});

app.listen(3000, () => console.log('http://localhost:3000'));
```

*What just happened:* `app.use(logger)` registers `logger` so it runs at the start of every request. We record `start`, then attach a one-time listener to `res`'s `'finish'` event — which fires when the response has been fully sent — so we can log the real status code and duration. Crucially, `logger` calls `next()` immediately; it doesn't wait for `finish`. It logs *as a side effect later*, but its job in the chain is to step aside and let the request continue. Hit `GET /tasks` and you'll see a line like `GET /tasks 200 2ms`.

### Three places you can register middleware

The same function can be wired in at three different scopes:

```javascript
app.use(logger);                          // GLOBAL: every request
app.use('/admin', requireLogin);          // PATH-SCOPED: only paths under /admin
app.get('/tasks/:id', loadTask, handler); // PER-ROUTE: only this route, in this order
```

*What just happened:* Same middleware mechanism, three reaches. `app.use(fn)` runs `fn` on everything. `app.use('/admin', fn)` runs it only when the path starts with `/admin`. And listing functions inside a route — `app.get(path, mw1, mw2, finalHandler)` — runs them left to right for that one route. The middleware doesn't change; only *where you mount it* does.

## ⚠️ Order matters (this is the part that bites everyone)

Middleware runs **in the order you register it**. Top to bottom. This is not a detail — it's the whole game, and getting it wrong is the most common Express bug there is.

Two concrete traps:

**Trap 1: the parser must come before the routes that need it.** `express.json()` reads the request body and fills in `req.body`. If you register your routes *before* `express.json()`, those routes run first and `req.body` is `undefined`.

```javascript
// ❌ WRONG — route runs before the body is parsed
app.post('/tasks', (req, res) => {
  res.json(req.body); // undefined — nothing parsed it yet
});
app.use(express.json());

// ✅ RIGHT — parse first, then route
app.use(express.json());
app.post('/tasks', (req, res) => {
  res.json(req.body); // { title: "..." } — parsed and ready
});
```

*What just happened:* In the wrong version, the POST handler is registered before `express.json()`, so when a request arrives it hits the handler first, sees no parsed body, and `req.body` is `undefined`. In the right version, `express.json()` is earlier in the chain, so by the time the request reaches your handler, the JSON body has already been read off the stream and attached to `req.body`. Order on the page = order at runtime.

**Trap 2: forgetting `next()` hangs the request.** A middleware that neither responds nor calls `next()` is a closed door with no knob. The request walks up to it and... stands there. Forever. The browser spins; eventually it times out.

```javascript
// ❌ This middleware silently hangs every request
app.use((req, res, next) => {
  console.log('checking request...');
  // no next(), no res.send() — DEAD END
});
```

*What just happened:* This is the number-one beginner bug. The function logs and then returns, but it never calls `next()` and never sends a response. Express has no way to know you're done, so the request hangs. Every middleware must do exactly one of two things: **respond**, or **call `next()`**. If a request seems to hang for no reason, the first thing to check is a middleware missing its `next()`.

## Built-in and third-party middleware

You rarely write parsers and security headers yourself — you reach for middleware that already exists.

**Built into Express:**

- `express.json()` — parses JSON request bodies into `req.body`.
- `express.urlencoded({ extended: true })` — parses HTML form submissions into `req.body`.
- `express.static('public')` — serves files from a folder (images, CSS, the front end).

**Popular third-party packages** (install with npm, then `app.use(...)` them):

- `cors` — adds the headers browsers need to allow cross-origin requests.
- `morgan` — a polished request logger (like ours, but configurable).
- `helmet` — sets a bundle of security-related HTTP headers.

```javascript
const cors = require('cors');
const helmet = require('helmet');

app.use(helmet());          // security headers on every response
app.use(cors());            // allow cross-origin requests
app.use(express.json());    // parse JSON bodies
app.use(morgan('dev'));     // log requests
```

*What just happened:* Each line plugs a ready-made middleware into the chain. They're listed near the top so they run early — security headers and CORS should apply to every response, and `express.json()` must come before any route that reads `req.body` (remember Trap 1). This stack — helmet, cors, json, a logger — is the boring, sensible opening for most real Express apps.

### Passing data down the chain with `req`

Middleware can **attach things to `req`**, and every later function in the chain can read them. This is how an early middleware shares its work with your route handlers. The textbook case is authentication: one middleware checks who's calling and stashes the user on `req`.

```javascript
function requireAuth(req, res, next) {
  const token = req.headers['authorization'];
  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
    // note: we DON'T call next() — the request stops here
  }
  req.user = { id: 1, name: 'Ada' }; // in real life: verify the token
  next(); // authenticated — continue to the route
}

app.use(express.json());
app.use(requireAuth);

app.get('/tasks', (req, res) => {
  res.json({ owner: req.user.name, tasks: [] }); // req.user came from the middleware
});
```

*What just happened:* `requireAuth` reads the `authorization` header. No header means an unauthenticated request, so it responds `401` and **stops** — `return res.status(401).json(...)` ends the request, and notice there's no `next()` after it. If the header is present, it sets `req.user` and calls `next()`, handing the request to the route. By the time `/tasks` runs, `req.user` is populated — the route trusts that auth already happened upstream. That's the two halves of the auth pattern: **reject and stop**, or **enrich `req` and continue**. The `return` matters — without it, the code would respond *and* fall through to `next()`, trying to send two responses.

## Recap

- **Middleware is a `(req, res, next)` function in a chain.** It can read/modify `req`/`res`, end the response, or call `next()` to pass control along. Routes are middleware bound to a method and path.
- Register at three scopes: **global** (`app.use(fn)`), **path-scoped** (`app.use('/admin', fn)`), or **per-route** (`app.get(path, mw, handler)`).
- **Order matters.** Middleware runs top to bottom. `express.json()` must come before any route that reads `req.body`.
- A middleware that neither responds nor calls `next()` **hangs the request** — the #1 beginner bug.
- Use built-ins (`express.json`, `express.urlencoded`, `express.static`) and third-party packages (`cors`, `morgan`, `helmet`) instead of writing your own.
- Share work down the chain by **attaching to `req`** (e.g. an auth middleware sets `req.user`); reject with `res.status(401)` and *don't* call `next()`.

## Quick check

```quiz
[
  {
    "q": "What are the three parameters of a standard Express middleware function?",
    "choices": ["req, res, done", "request, response, callback", "req, res, next", "app, req, res"],
    "answer": 2,
    "explain": "Standard middleware is (req, res, next): read/modify req and res, then call next() to pass control along."
  },
  {
    "q": "You register your POST route before express.json(). What happens to req.body in that route?",
    "choices": ["It contains the parsed JSON", "It is undefined because nothing parsed the body yet", "It throws an error", "Express auto-reorders the middleware for you"],
    "answer": 1,
    "explain": "Middleware runs in registration order. If express.json() is registered after the route, the route runs first and req.body is undefined."
  },
  {
    "q": "A middleware logs a message but never calls next() and never sends a response. What is the result?",
    "choices": ["The next middleware runs anyway", "Express sends an automatic 404", "The request hangs until it times out", "The response is sent with status 200"],
    "answer": 2,
    "explain": "Every middleware must either respond or call next(). Doing neither leaves the request with nowhere to go, so it hangs — the most common beginner bug."
  }
]
```

---

[← Phase 2: Routing](02-routing.md) · [Guide overview](_guide.md) · [Phase 4: Request & Response →](04-request-and-response.md)
