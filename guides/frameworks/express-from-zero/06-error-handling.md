---
title: "Error Handling"
guide: "express-from-zero"
phase: 6
summary: "Express routes errors to a special four-argument middleware registered last. Covers next(err), a custom AppError class, the async-error trap (Express 4 vs 5), the asyncHandler wrapper, and a 404 catch-all."
tags: [express, javascript, error-handling, async, middleware]
difficulty: advanced
synonyms: ["express error handling", "express error middleware", "express async errors", "next(err)", "express 5 async", "express custom error class"]
updated: 2026-07-10
---

# Error Handling

In [Phase 5](05-building-a-rest-api.md) every handler sprinkled its own
`res.status(404).json({ error: 'Not found' })` and its own `try`/`catch`. Each route reinvented "what
does an error look like to the client?" - and they didn't all agree.

The better way is an idea you already know: **errors are routed to a special piece of middleware.**
You don't handle errors where they happen - you hand them off, and one function at the end of the
chain decides what the client sees.

## The mental model: an error is routed to a special door

📝 Remember the hallway of doors from [Phase 3](03-middleware.md)? Normal middleware has the shape
`(req, res, next)`. Express has one more kind of door - an error handler - with a four-argument shape:
`(err, req, res, next)`. That extra first parameter is the whole signal: Express counts your function's
parameters, and four means "this is the error door," skipped during normal traffic.

A request reaches the error door two ways:

1. You **call `next(err)`** with an argument - Express stops the normal chain and jumps to the error handler.
2. You **throw in synchronous code** - Express catches the throw and does the same jump.

So the rule: anywhere something goes wrong, don't respond - call `next(err)` (or throw). One handler,
one consistent error response, everywhere.

```javascript
const express = require('express');
const app = express();
app.use(express.json());

app.get('/tasks/:id', (req, res, next) => {
  const task = findTask(req.params.id);
  if (!task) {
    return next(new Error('Task not found')); // hand off - don't respond here
  }
  res.json(task);
});
```

*What just happened:* the handler doesn't build a 404 itself - it creates an `Error` and passes it to
`next()`. Because `next` received an argument, Express abandons the normal chain and looks for an
error-handling middleware. The handler's job ends at "something is wrong, here's what."

## The error-handling middleware (and a custom error that carries its status)

The error door must be registered **last**, after every route, so it catches whatever gets sent its
way. A plain `new Error('Task not found')` has a message but no notion of "this should be a 404" - fix
that with a tiny custom error class that carries a status code.

```javascript
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

// ...routes go here...

// LAST: the one error handler for the whole app
app.use((err, req, res, next) => {
  const status = err.statusCode || 500;
  res.status(status).json({ error: err.message || 'Internal Server Error' });
});
```

*What just happened:* `AppError` is a normal `Error` with one extra field, `statusCode`. A route can
now throw `new AppError('Task not found', 404)` and the handler reads `err.statusCode` to set the
response code. Anything without one - a real bug, a thrown string, a library blowing up - falls through
to `500`, your safety net against leaking a stack trace. Note the handler keeps all four parameters;
that signature is the only thing marking it as the error door, so keep `next` even unused.

⚠️ Order is everything (Phase 3's Trap 1, again). The error handler goes **after** all your routes.
Register it early and it sits in front of routes that never produce errors during normal flow - useless
 - while the real errors at the end have nowhere to land.

## ⚠️ The async-error trap (this one bites everyone)

The "throw and Express catches it" magic **only works for synchronous code.** Watch an `async` handler
on **Express 4**:

```javascript
// ⚠️ EXPRESS 4: this error vanishes - it never reaches your handler
app.get('/tasks/:id', async (req, res) => {
  const task = await db.findTask(req.params.id); // if this rejects...
  if (!task) throw new AppError('Task not found', 404); // ...or this throws
  res.json(task);
});
```

*What just happened:* when an `async` function throws (or an `await`ed promise rejects), it doesn't
throw *synchronously* - it returns a **rejected promise**. Express 4 never looks at that promise, so
the rejection floats off as an unhandled promise rejection. Your error handler is never called, the
request hangs until it times out, and your terminal prints a scary warning. The error went nowhere.

Three ways out, in order of how much you should reach for them:

**Option A - `try`/`catch` and call `next(err)` by hand.** Explicit, no dependencies, but repeated in
every async handler:

```javascript
app.get('/tasks/:id', async (req, res, next) => {
  try {
    const task = await db.findTask(req.params.id);
    if (!task) throw new AppError('Task not found', 404);
    res.json(task);
  } catch (err) {
    next(err); // manually ferry it to the error handler
  }
});
```

*What just happened:* `try`/`catch` turns the async rejection back into something you control. A throw
inside `try` - your `AppError` or a rejected `await` - lands in `catch`, and `next(err)` does the
hand-off Express 4 wouldn't. Correct, but repeating this in twenty routes rots fast.

**Option B - wrap once, reuse everywhere.** A tiny higher-order function wraps an async handler and
auto-forwards any rejection:

```javascript
const asyncHandler = fn => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

app.get('/tasks/:id', asyncHandler(async (req, res) => {
  const task = await db.findTask(req.params.id);
  if (!task) throw new AppError('Task not found', 404);
  res.json(task); // no try/catch - the wrapper handles rejections
}));
```

*What just happened:* `asyncHandler` runs `fn`, wraps the result in `Promise.resolve(...)` to guarantee
a promise, and attaches `.catch(next)` - any rejection routes straight to the error door. Handlers go
back to clean linear code with no `try`/`catch`, and every error still lands in one place. (The popular
[`express-async-errors`](03-middleware.md) package does the same globally via a one-line `require`.)

💡 **Express 5 fixes this at the source.** A rejected promise from an `async` handler is forwarded to
your error handler automatically - no wrapper, no `try`/`catch`. Starting fresh, use Express 5 and write
plain `async` handlers. On an existing Express 4 codebase (still extremely common), reach for
`asyncHandler`. Knowing which world you're in is the whole game.

## The 404 catch-all

The error handler covers things that go *wrong*. But a request to a path no route matches - `GET /taks`
with a typo - fires no route, so Express falls through to its bland default HTML 404. For a JSON API
you want a JSON 404, in the same shape as every other error.

The fix is a catch-all middleware placed **after all your routes but before the error handler**:

```javascript
app.use(express.json());

app.get('/tasks/:id', /* ... */);
app.post('/tasks', /* ... */);
// ...all other routes...

// 1) nothing matched above → it's a 404
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// 2) LAST: the error handler (four args)
app.use((err, req, res, next) => {
  const status = err.statusCode || 500;
  res.status(status).json({ error: err.message || 'Internal Server Error' });
});
```

*What just happened:* `app.use(...)` with no path matches every request, but registered after all real
routes, it only runs when nothing else responded - an unmatched path. It sits *above* the error handler
because the error handler (four args) is reserved for errors routed via `next(err)`; this catch-all
(three args) handles "nobody answered." Together they cover both dead ends: "doesn't exist" and
"something broke."

## Thin handlers, one central translator

💡 Compare to Phase 5, where each handler did its own `res.status(404)`. Now handlers get to be *thin*:
they do the happy path and **throw a typed error** when reality disagrees, never thinking about status
codes or JSON envelopes.

```javascript
function getTaskOr404(id) {
  const task = db.findTask(id);
  if (!task) throw new AppError('Task not found', 404);
  return task;
}

app.get('/tasks/:id', asyncHandler(async (req, res) => {
  const task = getTaskOr404(req.params.id); // throws AppError(404) if missing
  res.json(task); // only the success case lives here
}));
```

*What just happened:* the "not found" decision moved into a small service function that throws
`AppError('Task not found', 404)`. The route handler reads like a sentence - get the task, send it - 
with the failure path delegated. `asyncHandler` forwards the throw, and the central error handler maps
its `statusCode` and `message` to the response. Every error now flows through one function: one
consistent shape, one place to log, one place to hide stack traces in production.

## Recap

- Errors are **routed to a special four-argument middleware** `(err, req, res, next)`, registered
  **last**. The four-arg signature is the only thing that marks it as the error door.
- Reach it by calling **`next(err)`** or by **throwing in synchronous code** (Express catches sync
  throws automatically).
- A custom **`AppError extends Error`** carrying a `statusCode` lets handlers throw
  `new AppError('not found', 404)`; anything without a `statusCode` falls through to `500`.
- ⚠️ **Async errors are the trap:** Express 4 does **not** catch rejected promises from `async`
  handlers - use `try`/`catch` + `next(err)`, an `asyncHandler` wrapper, or `express-async-errors`.
  **Express 5 forwards them automatically.**
- Add a **404 catch-all** after all routes and **before** the error handler, so unmatched paths return
  JSON in the same shape.
- The payoff: **thin handlers throw typed errors; one central handler translates them to status + JSON.**

## Quick check

```quiz
[
  {
    "q": "What makes Express treat a middleware function as an error handler?",
    "choices": ["A call to app.error() instead of app.use()", "Its four-argument signature (err, req, res, next)", "Registering it before all routes", "Naming the function errorHandler"],
    "answer": 1,
    "explain": "Express identifies the error handler purely by its arity: four parameters (err, req, res, next). It must also be registered last, after all routes."
  },
  {
    "q": "On Express 4, an async route handler does `await db.find()` and the promise rejects. With no try/catch and no wrapper, what happens?",
    "choices": ["Express automatically routes it to the error handler", "The rejection becomes an unhandled promise rejection and the request hangs", "Express sends a 500 with the stack trace", "The 404 catch-all handles it"],
    "answer": 1,
    "explain": "Express 4 ignores the rejected promise an async handler returns, so the error never reaches your handler - the request hangs. Express 5 fixes this; on 4 you need try/catch, an asyncHandler wrapper, or express-async-errors."
  },
  {
    "q": "Where does the JSON 404 catch-all middleware belong relative to the routes and the error handler?",
    "choices": ["Before all routes, so it runs first", "After all routes, but before the error handler", "After the error handler", "It replaces the error handler"],
    "answer": 1,
    "explain": "Placed after all routes, the catch-all only runs when no route matched (an unmatched path). It must sit before the four-arg error handler, which is reserved for actual errors routed via next(err)."
  }
]
```

---

[← Phase 5: Building a REST API](05-building-a-rest-api.md) · [Guide overview](_guide.md) · [Phase 7: Serving & Structuring an App →](07-serving-and-structure.md)
