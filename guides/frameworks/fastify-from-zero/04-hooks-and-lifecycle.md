---
title: "Hooks & the Lifecycle"
guide: "fastify-from-zero"
phase: 4
summary: "Every request flows through a named request/reply lifecycle. Hooks let you run code at each stage — onRequest, preHandler, onSend — and they respect plugin encapsulation, so you can guard one route group cleanly."
tags: [fastify, javascript, hooks, lifecycle, prehandler]
difficulty: intermediate
synonyms: ["fastify hooks", "fastify lifecycle", "fastify onRequest preHandler", "fastify onSend onResponse", "fastify auth hook", "fastify request lifecycle"]
updated: 2026-06-23
---

# Hooks & the Lifecycle

In [Phase 3](03-the-plugin-system.md) you learned that the app is a tree of encapsulated plugins. Now
we put that tree to work. The question this phase answers is the one every real API hits sooner or
later: *"I need to run some code before my handler — check a token, log the request, set a header — but
not copy-paste it into every route. Where does that go?"*

## The mental model: a request flows a named lifecycle

Here's the idea to hold before any code. When a request arrives, Fastify doesn't jump straight to your
handler. It walks the request through a **fixed sequence of stages** — parse the body, validate it
against the schema, run the handler, serialize the response, send it. That sequence is the
**request/reply lifecycle**.

💡 A **hook** is a function you attach to one of those named stages. When the request reaches that
stage, your hook runs. That's Fastify's answer to what other frameworks call "middleware" — but instead
of one generic slot you cram everything into, you pick the *named* stage where your code belongs.

So "run code before the handler" isn't a vague instruction in Fastify. It's a specific stage with a
specific name (`preHandler`), and you hook into it.

## The lifecycle, stage by stage

Every request flows through these stages in order (failures jump to `onError`):

```
onRequest → preParsing → preValidation → preHandler → [your handler]
          → preSerialization → onSend → onResponse
```

You don't need to memorize all of them — most code only ever touches three or four. Here are the ones
that earn their keep:

- **`onRequest`** — the *earliest* stage. The body hasn't been parsed yet, so you can't read it, but
  the URL, method, and headers are all there. This is where logging and cheap auth checks (is there an
  `Authorization` header at all?) live. Rejecting here is the cheapest possible rejection.
- **`preValidation`** — runs *before* Fastify validates the request against your JSON schema. Handy when
  you need to massage incoming data before the schema judges it.
- **`preHandler`** — runs *after* validation, *right before* your handler. The request is fully parsed
  and validated by now, so this is the usual home for authorization that needs to look at the real,
  trustworthy request (the parsed body, validated params).
- **`onSend`** — runs as the response is about to go out, and it can *modify the payload* (add a header,
  rewrite the body).
- **`onResponse`** — runs *after* the response has been sent. Too late to change anything, which is
  exactly why it's perfect for metrics and timing.
- **`onError`** — runs when something throws. We'll lean on it in [Phase 6](06-error-handling.md).

📝 The shape to keep: `onRequest` is "I just arrived, body unknown"; `preHandler` is "I'm validated and
ready, last stop before the handler"; `onResponse` is "I'm already gone, just record it."

## Adding a hook with `addHook`

You attach a hook with `app.addHook(stageName, asyncFunction)`. The function receives the same
`request` and `reply` your handlers get:

```javascript
const Fastify = require('fastify');
const app = Fastify({ logger: true });

app.addHook('onRequest', async (request, reply) => {
  request.log.info({ url: request.url }, 'incoming request');
});

app.get('/health', async () => {
  return { status: 'ok' };
});

app.listen({ port: 3000 });
```

*What just happened:* we registered an `onRequest` hook on the whole app. Before *any* handler runs,
Fastify calls our function and logs the URL. Notice we didn't call a `next()` or `done()` — because the
hook is `async`, Fastify waits for the promise to resolve, then moves to the next stage on its own.
Hit `GET /health` and you'll see the log line print before the response.

## Short-circuiting: a `preHandler` auth hook

The real power of hooks is that they can *stop* a request. If a hook throws (or calls `reply.send`),
Fastify abandons the lifecycle right there — your handler never runs. That's how you build auth.

Let's guard our running **books API**. Back in [Phase 3](03-the-plugin-system.md) the books routes
lived in a `booksPlugin`. We add a `preHandler` hook *inside that plugin* that demands an
`Authorization` header:

```javascript
async function booksPlugin(app, opts) {
  // Runs before every handler in THIS plugin, after validation.
  app.addHook('preHandler', async (request, reply) => {
    if (!request.headers.authorization) {
      reply.code(401);
      throw new Error('Unauthorized');   // stops the request before the handler
    }
  });

  app.get('/books', async () => {
    return [{ id: 1, title: 'Dune' }];
  });

  app.post('/books', async (request) => {
    return { id: 2, ...request.body };
  });
}

module.exports = booksPlugin;
```

*What just happened:* every request to `/books` — `GET` or `POST` — now passes through the `preHandler`
hook first. If there's no `Authorization` header, we set the status to `401` and `throw`. The throw is
the short-circuit: Fastify catches it, the handler never runs, and the client gets a `401`. With a
header present, the hook returns normally and the request continues to the handler as usual. Because
this is `preHandler`, validation has already happened, so by the time auth runs you're looking at a
clean, validated request.

⚠️ Don't reach for `onRequest` to read the request body — at that stage it isn't parsed yet, so
`request.body` is `undefined`. Body-aware checks belong in `preHandler` or later.

## Encapsulation: the hook only guards its own plugin

Here's the payoff of plugins being encapsulated. That `preHandler` hook was added *inside*
`booksPlugin`, so it runs **only for routes registered inside `booksPlugin`** — and nowhere else. A
public `/health` route registered at the top level never sees it:

```javascript
const Fastify = require('fastify');
const app = Fastify();

app.register(require('./books-plugin'));   // /books — guarded by the auth hook

app.get('/health', async () => {           // top level — NOT guarded
  return { status: 'ok' };
});

app.listen({ port: 3000 });
```

*What just happened:* `/books` requires an `Authorization` header (the hook lives in the plugin that
owns those routes), while `/health` answers freely (it's registered outside that plugin's scope). You
protected one route group without touching the others, and without a single `if` inside your handlers.
This is the encapsulation rule from Phase 3 doing real work: **a hook added inside a plugin is scoped
to that plugin and its children.** Want a route group public? Register it outside the guarded plugin.
Want everything guarded? Add the hook at the root.

## Per-route hooks: guarding exactly one route

Sometimes you don't want a whole plugin guarded — just one route. Pass the hook in the route's options
instead of calling `addHook`:

```javascript
async function checkAuth(request, reply) {
  if (!request.headers.authorization) {
    reply.code(401);
    throw new Error('Unauthorized');
  }
}

app.post('/books', { preHandler: checkAuth }, async (request) => {
  return { id: 2, ...request.body };
});

app.get('/books', async () => {            // no preHandler — open to all
  return [{ id: 1, title: 'Dune' }];
});
```

*What just happened:* only `POST /books` runs `checkAuth`, because we listed it in *that route's*
options. The `GET /books` route, defined without a `preHandler`, stays open. Use `addHook` when a whole
plugin (or app) shares a hook; use the per-route option when a single route is the exception.

## Why named stages beat one generic slot

💡 If you've used [Express](/guides/express-from-zero), this is the moment the two frameworks diverge.
Express gives you *one* generic middleware signature — `(req, res, next)` — and you stack functions in
the order you happen to call `app.use`. It works, but the *meaning* of each function (auth? logging?
parsing?) lives only in your head and the call order. Get the order wrong and auth runs after the
handler.

Fastify replaces that single slot with **named lifecycle stages**. "Run before validation" and "run
after the response is sent" aren't conventions you enforce by ordering `app.use` calls — they're
distinct, named hooks (`preValidation`, `onResponse`) that *can't* run at the wrong time. That
explicitness is also what lets Fastify optimize: it knows exactly which stages a route uses and can
compile a tight path through them. Same idea as Express middleware, but the framework, not you, owns the
ordering.

## Recap

- A request flows a **fixed, named lifecycle**: `onRequest → preValidation → preHandler → handler →
  onSend → onResponse` (and `onError` on failure). **Hooks** let you run code at any stage.
- Add a hook with `app.addHook('stage', async (request, reply) => { ... })`. Async hooks need no
  `next()` — Fastify awaits the promise and moves on.
- A hook that **throws** (or calls `reply.send`) short-circuits the lifecycle: the handler never runs.
  That's how you build auth — `reply.code(401); throw` in a `preHandler`.
- Use **`onRequest`** for early/cheap checks (body not parsed yet) and **`preHandler`** for auth that
  needs the validated request; **`onResponse`** for metrics after the fact.
- Hooks respect **encapsulation**: a hook added inside a plugin guards only that plugin's routes — so
  you can protect one route group and leave `/health` public. For a single route, pass the hook in the
  route options instead.

## Quick check

```quiz
[
  {
    "q": "Which stage should an auth check that reads the parsed, validated request body run in?",
    "choices": ["onRequest", "preHandler", "onResponse", "onSend"],
    "answer": 1,
    "explain": "preHandler runs after validation and right before the handler, so the request is fully parsed and validated. onRequest is too early — the body isn't parsed yet."
  },
  {
    "q": "Inside a preHandler hook, what happens if you set reply.code(401) and then throw?",
    "choices": ["The handler still runs, then the error is logged", "Fastify retries the request", "The lifecycle short-circuits and the handler never runs", "Nothing — hooks can't change the response"],
    "answer": 2,
    "explain": "Throwing (or calling reply.send) in a hook abandons the lifecycle right there. The handler is skipped and the client gets the response you set."
  },
  {
    "q": "You add a preHandler hook with addHook INSIDE booksPlugin. Which routes does it run for?",
    "choices": ["Every route in the whole app", "Only routes registered inside booksPlugin and its children", "Only the first route in booksPlugin", "No routes until you call app.use"],
    "answer": 1,
    "explain": "Hooks respect plugin encapsulation. A hook added inside a plugin is scoped to that plugin and its children, so a top-level /health route stays unguarded."
  }
]
```

---

[← Phase 3: The Plugin System](03-the-plugin-system.md) · [Guide overview](_guide.md) · [Phase 5: Building a REST API →](05-building-a-rest-api.md)
