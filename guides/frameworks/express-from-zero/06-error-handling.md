---
title: "Error Handling"
guide: "express-from-zero"
phase: 6
summary: "Express routes errors to a special four-argument middleware registered last. Covers next(err), a custom AppError class, the async-error trap (Express 4 vs 5), the asyncHandler wrapper, and a 404 catch-all."
tags: [express, javascript, error-handling, async, middleware]
difficulty: advanced
synonyms: ["express error handling", "express error middleware", "express async errors", "next(err)", "express 5 async", "express custom error class"]
updated: 2026-06-23
---

# Error Handling

In [Phase 5](05-building-a-rest-api.md) you wired up full CRUD, and along the way you probably noticed something annoying: every handler was sprinkling its own `res.status(404).json({ error: 'Not found' })` and its own `try`/`catch`. Each route reinvented "what does an error look like to the client?" — and they didn't all agree.

Here's the better way, and it's the same idea you already know: **errors are routed to a special piece of middleware.** You don't handle errors where they happen. You hand them off, and one function at the end of the chain decides what the client sees.

## The mental model: an error is just routed to a special door

📝 Remember the hallway of doors from [Phase 3](03-middleware.md)? Normal middleware has the shape `(req, res, next)`. Express has **one more kind of door** — an error handler — and it has a four-argument shape: `(err, req, res, next)`. That extra first parameter is the whole signal. Express looks at how many parameters your function declares; if it's four, Express treats it as the error door and skips it during normal traffic.

A request reaches the error door in exactly two ways:

1. You **call `next(err)`** with an argument. The moment `next` gets anything truthy, Express stops walking the normal chain and jumps straight to the error handler.
2. You **throw in synchronous code** inside a handler. Express catches that throw and does the same jump.

So the rule is: anywhere something goes wrong, you don't respond — you call `next(err)` (or throw). Express ferries it to the one handler at the end, and that handler turns it into a status code and a JSON shape. **One handler, one consistent error response, everywhere.**

```javascript
const express = require('express');
const app = express();
app.use(express.json());

app.get('/tasks/:id', (req, res, next) => {
  const task = findTask(req.params.id);
  if (!task) {
    return next(new Error('Task not found')); // hand off — don't respond here
  }
  res.json(task);
});
```

*What just happened:* When the task is missing, the handler doesn't build a 404 itself. It creates an `Error` and passes it to `next()`. Because `next` received an argument, Express abandons the normal chain and looks for an error-handling middleware. The handler's job ends at "something is wrong, here's what" — deciding the HTTP response is somebody else's job now.

## The error-handling middleware (and a custom error that carries its status)

The error door must be registered **last** — after every route — so it sits at the end of the chain ready to catch whatever gets sent its way. There's a catch, though: a plain `new Error('Task not found')` has a *message* but no notion of "this should be a 404." We fix that with a tiny custom error class that carries a status code.

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

*What just happened:* `AppError` is a normal `Error` with one extra field, `statusCode`. Now a route can throw `new AppError('Task not found', 404)` and the error handler reads `err.statusCode` to set the response code. Anything that *isn't* an `AppError` — a real bug, a thrown string, a library blowing up — has no `statusCode`, so it falls through to `500`. That `|| 500` is your safety net: unexpected failures become a generic server error instead of leaking a stack trace. Notice the handler has all four parameters; that signature is the *only* thing that tells Express "this is the error door," so keep `next` in the list even though we don't use it here.

⚠️ Order is everything (just like [Phase 3](03-middleware.md)'s Trap 1). The error handler goes **after** all your routes. Register it early and it sits in front of routes that never produce errors during normal flow — so it does nothing useful, and the actual errors at the end have nowhere to land.

## ⚠️ The async-error trap (this one bites everyone)

Here's where Express versions matter, and where most people lose an afternoon. The "throw and Express catches it" magic **only works for synchronous code.** Watch what happens with an `async` handler on **Express 4**:

```javascript
// ⚠️ EXPRESS 4: this error vanishes — it never reaches your handler
app.get('/tasks/:id', async (req, res) => {
  const task = await db.findTask(req.params.id); // if this rejects...
  if (!task) throw new AppError('Task not found', 404); // ...or this throws
  res.json(task);
});
```

*What just happened:* When an `async` function throws (or an `await`ed promise rejects), it doesn't throw *synchronously* — it returns a **rejected promise**. Express 4 calls your handler but never looks at the promise it returns, so the rejection floats off as an *unhandled promise rejection*. Your error handler is never called, the client's request just hangs until it times out, and your terminal prints a scary `UnhandledPromiseRejection` warning. The error didn't go to the error door — it went nowhere.

There are three ways out, in order of how much you should reach for them:

**Option A — `try`/`catch` and call `next(err)` by hand.** Explicit, no dependencies, but you'll write it in every async handler:

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

*What just happened:* The `try`/`catch` turns the async rejection back into something you control. A throw inside the `try` — whether it's your `AppError` or a rejected `await` — lands in `catch`, and `next(err)` does the hand-off Express 4 wouldn't do for you. Correct, but repeating this boilerplate in twenty routes is exactly the kind of thing that rots.

**Option B — wrap once, reuse everywhere.** Write a tiny higher-order function that wraps an async handler and auto-forwards any rejection:

```javascript
const asyncHandler = fn => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

app.get('/tasks/:id', asyncHandler(async (req, res) => {
  const task = await db.findTask(req.params.id);
  if (!task) throw new AppError('Task not found', 404);
  res.json(task); // no try/catch — the wrapper handles rejections
}));
```

*What just happened:* `asyncHandler` takes your handler `fn` and returns a *new* handler. It runs `fn`, wraps the result in `Promise.resolve(...)` so a returned promise is guaranteed, and attaches `.catch(next)` — so any rejection is passed straight to `next`, which routes it to the error door. Your handlers go back to clean linear code with no `try`/`catch`, and every error still lands in one place. (The popular [`express-async-errors`](03-middleware.md) package does the same thing globally via a one-line `require`, if you'd rather not wrap each route.)

💡 **Express 5 fixes this at the source.** In Express 5, if an `async` handler returns a rejected promise, Express forwards it to your error handler automatically — no wrapper, no `try`/`catch`. So on Express 5 the trap above is no longer a trap; the first "vanishing error" example would just work. If you're starting fresh today, use Express 5 and write plain `async` handlers. If you're on an existing Express 4 codebase (still extremely common), reach for the `asyncHandler` wrapper. Knowing *which* world you're in is the whole game here.

## The 404 catch-all

The error handler covers things that go *wrong*. But what about a request to a path no route matches — `GET /taks` with a typo? No route fires, so Express falls through to its bland default HTML 404. For a JSON API you want a JSON 404, in the same shape as every other error.

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

*What just happened:* `app.use(...)` with no path matches *every* request, but because it's registered after all the real routes, it only runs when none of them sent a response — i.e. the path was unmatched. It returns a clean JSON 404. Crucially, it sits *above* the error handler, because the error handler (four args) is reserved for actual errors routed via `next(err)`; this catch-all (three args) handles the "nobody answered" case. The two together cover both kinds of dead end: "you asked for something that doesn't exist" and "something broke."

## Thin handlers, one central translator

💡 Step back and look at what this buys you. Compare to [Phase 5](05-building-a-rest-api.md), where each handler did its own `res.status(404)`. Now your handlers get to be *thin*: they do the happy path and **throw a typed error** when reality disagrees. They never think about status codes or JSON envelopes.

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

*What just happened:* The "not found" decision moved into a small service function that throws `AppError('Task not found', 404)`. The route handler reads like a sentence — get the task, send it — with the failure path delegated. When the `AppError` is thrown, `asyncHandler` forwards it, and the central error handler maps its `statusCode` and `message` to the response. Every error in your app now flows through one function, so you get one consistent shape, one place to add logging, one place to hide stack traces in production. That's the payoff: errors stop being scattered `res.status(...)` calls and become **typed values that one translator turns into HTTP.**

## Recap

- Errors are **routed to a special four-argument middleware** `(err, req, res, next)`, registered **last**. The four-arg signature is the *only* thing that marks it as the error door.
- Reach the error handler by calling **`next(err)`** (any version) or by **throwing in synchronous code** (Express catches sync throws automatically).
- A custom **`AppError extends Error`** carrying a `statusCode` lets handlers throw `new AppError('not found', 404)` and the central handler renders status + JSON. Anything without a `statusCode` falls through to `500`.
- ⚠️ **Async errors are the trap:** Express 4 does **not** catch rejected promises from `async` handlers — use `try`/`catch` + `next(err)`, an `asyncHandler` wrapper, or `express-async-errors`. **Express 5 forwards them automatically.**
- Add a **404 catch-all** (`app.use((req, res) => res.status(404).json(...))`) after all routes and **before** the error handler, so unmatched paths return JSON in the same shape.
- The payoff: **thin handlers throw typed errors; one central handler translates them to status + JSON** — cleaner than per-handler 404s.

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
    "explain": "Express 4 ignores the rejected promise an async handler returns, so the error never reaches your handler — the request hangs. Express 5 fixes this; on 4 you need try/catch, an asyncHandler wrapper, or express-async-errors."
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
