---
title: "Middleware Is Just a Function"
guide: "build-a-server-with-node-http"
phase: 4
summary: "Middleware in node:http has no special machinery - it's a plain function you call before your handler to log, authenticate, or parse, and that can short-circuit by responding and returning."
tags: [node, nodejs, http, middleware, functions]
difficulty: intermediate
synonyms: ["node middleware", "node http middleware function", "node compose handlers", "what is middleware really", "node logging middleware", "node middleware chain"]
updated: 2026-07-10
---

# Middleware Is Just a Function

The word "middleware" gets thrown around like it's a framework feature you have to install and configure. It isn't. Here's the mental model that makes the whole thing click - hold it before you read a single line of code:

📝 **Middleware is a plain function you call before your handler.** That's the entire idea. In `node:http` there's no registration system, no `next()`, no internal chain - none of that machinery exists. There's just your `(req, res)` listener, and inside it you call some functions *before* the one that builds the response. A function that logs the request, checks for a token, or parses the body - those are "middleware." They earn the name only because of *where they run* (before the handler), not anything special about how they're written.

The simplest possible version: a function that takes `(req, res)`, does some cross-cutting work, and either responds (stopping the request) or returns quietly so your handler runs next. We're still building the running **messages** service, and the first thing every real server grows is a request logger - so let's start there.

## A logging "middleware," wired before the router

Every server you'll ever run needs to know what it's serving. The classic first middleware logs each request: method, URL, status code, and how long it took. Here it is, sitting in front of the router we built in [Routing by Hand](03-routing-by-hand.md):

```javascript
const http = require('node:http');

function logger(req, res) {
  const start = Date.now();
  res.on('finish', () => {
    console.log(`${req.method} ${req.url} ${res.statusCode} ${Date.now() - start}ms`);
  });
}

const server = http.createServer((req, res) => {
  logger(req, res);   // run "middleware" first
  route(req, res);    // then dispatch (Phase 3)
});

server.listen(3000, () => console.log('http://localhost:3000'));
```

*What just happened:* `logger` is nothing but a function. We record `start`, then attach a one-time listener to the response's `'finish'` event - fires when Node has flushed the full response - so we can read the *real* status code and elapsed time after the handler has done its work. `logger` doesn't wait around: it returns immediately, and `route(req, res)` runs right after. The logging happens later, as a side effect, when `finish` fires. Inside `createServer`, "run middleware first, then route" is literally two function calls in order - that ordering *is* the middleware pattern, no machinery underneath. Hit `GET /messages` and you'll see a line like `GET /messages 200 2ms`.

## A chain, and the art of short-circuiting

One middleware is a function call. A *chain* of middleware is several function calls in order - and the interesting part is that any one of them can **stop the request** before it reaches your handler. The way it stops is exactly what you'd guess from Phase 2: it writes a response and returns, and the caller has to know not to keep going.

The textbook case is authentication. A request with no credentials should never reach the handler - it should get a `401` and stop. Here's an auth check written as a middleware function:

```javascript
function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

function requireAuth(req, res) {
  if (!req.headers['authorization']) {
    sendJson(res, 401, { error: 'Unauthorized' });
    return false;   // tell the caller: I responded, do NOT continue
  }
  req.user = { id: 1, name: 'Ada' };   // attach data for later functions
  return true;      // authenticated - caller may continue
}
```

*What just happened:* `requireAuth` does the two things every gatekeeping middleware does. If there's no `authorization` header, it sends a `401` and returns `false` - that return value communicates "I already handled this request, stop." If the header *is* present, it attaches a `req.user` object (in real life you'd verify the token first) and returns `true`. Because there's no framework calling these functions for you, **you** are responsible for checking the return value and deciding whether to keep going. Wire it into the chain like this:

```javascript
const server = http.createServer((req, res) => {
  logger(req, res);
  if (!requireAuth(req, res)) return;   // short-circuit: stop the chain
  route(req, res);                      // reached only when authed
});
```

*What just happened:* this is a three-link chain - logger, auth, router - and `if (!requireAuth(...)) return;` is the short-circuit. When `requireAuth` responds with `401` and returns `false`, the `return` stops the listener cold and `route` never runs. ⚠️ That `return` is load-bearing: without it, the code would send the `401` *and* fall through to `route`, which would try to write a second response onto an already-ended connection - Node throws `ERR_HTTP_HEADERS_SENT`. Respond-and-return is the whole discipline; forget the `return` and you get the most common bug in hand-rolled servers.

Notice how data flows forward: `requireAuth` set `req.user`, so any handler downstream can read it. 💡 **Passing data down the chain means attaching it to `req`.** The request object is the shared scratchpad every function in the chain can see - an early middleware writes to it, a later handler reads from it. That's the same pattern every framework uses.

## This is exactly what Express formalizes

📝 If you've seen Express, the `(req, res, next)` signature and `app.use(...)` are doing *precisely* what you just wrote by hand - only Express maintains an internal list of these functions and calls `next()` for you to advance the chain, instead of you writing `if (!fn(...)) return;` between each call. Conceptually it's identical: functions that run around your handler, each able to respond-and-stop or enrich `req` and continue. Passing data down is still "attach it to `req`" (`req.user = ...`), exactly as here. When you're ready to see the same idea with the bookkeeping handled for you, that's [Express From Zero](/guides/express-from-zero) - it'll read as familiar, because you've already built the engine.

💡 Step back and look at what you've now got. You've hand-rolled a **logger**, an **auth check**, a **body parser** (back in [Handling Requests & Responses](02-requests-and-responses.md)), and a **router** ([Routing by Hand](03-routing-by-hand.md)). Stack those four together and you have, in miniature, exactly what Express *is*. That's not a coincidence - it's the entire point of this guide. A framework isn't magic; it's these same functions with the boilerplate factored out.

## Recap

- **Middleware in `node:http` is a plain function you call before your handler** - log, authenticate, parse. There is no special machinery; it's just function calls in order inside your `(req, res)` listener.
- A **chain** is several middleware called in sequence. Any one can **short-circuit** by responding and returning a signal (e.g. `false`) so the caller stops.
- The **respond-and-return** discipline is everything: forget the `return` after sending a response and you'll try to write twice, triggering `ERR_HTTP_HEADERS_SENT`.
- **Pass data down the chain by attaching it to `req`** (e.g. `req.user`). The request object is the shared scratchpad every later function can read.
- **Express formalizes this exact idea** with `(req, res, next)` and an internal chain that calls `next()` for you ([Express From Zero](/guides/express-from-zero)) - conceptually the same functions you just wrote.
- Logger + auth + body parser + router = a tiny Express. Building them by hand is the point.

## Quick check

```quiz
[
  {
    "q": "In node:http, what is 'middleware', really?",
    "choices": ["A built-in module you import", "A plain function you call before your handler", "A special config object passed to createServer", "A third-party package that registers itself automatically"],
    "answer": 1,
    "explain": "In node:http there's no machinery - middleware is just a function you call before your handler, to do cross-cutting work like logging or auth."
  },
  {
    "q": "An auth function sends a 401 and you forget to `return` before calling the router. What happens?",
    "choices": ["Nothing - Node ignores the second response", "The router runs and tries to write a second response, throwing ERR_HTTP_HEADERS_SENT", "The request silently hangs forever", "The 401 is overwritten with a 200"],
    "answer": 1,
    "explain": "Without the return, the listener falls through to the router, which writes onto an already-ended response - Node throws ERR_HTTP_HEADERS_SENT."
  },
  {
    "q": "How does an early middleware pass data (like the authenticated user) to a later handler?",
    "choices": ["By returning it from createServer", "By writing it to a global variable", "By attaching it to req (e.g. req.user = ...)", "By passing it as a third argument Node provides"],
    "answer": 2,
    "explain": "The req object is the shared scratchpad: an early function attaches data to req, and any later function in the chain can read it. Express works the same way."
  }
]
```

---

[← Phase 3: Routing by Hand](03-routing-by-hand.md) · [Guide overview](_guide.md) · [Phase 5: A JSON REST API With No Framework →](05-rest-api-no-framework.md)
