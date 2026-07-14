---
title: "Error Handling"
guide: "fastify-from-zero"
phase: 6
summary: "How Fastify makes most error handling automatic - schema-validation 400s and auto-caught async throws - and how one setErrorHandler, typed errors, and setNotFoundHandler shape the rest into consistent responses."
tags: [fastify, javascript, error-handling, validation, setErrorHandler]
difficulty: advanced
synonyms: ["fastify error handling", "fastify setErrorHandler", "fastify validation error", "fastify setNotFoundHandler", "fastify httperrors", "fastify custom error"]
updated: 2026-07-10
---

# Error Handling

Here's the reframe that makes this whole phase click, so hold it before you write a single line of error code:

> 📝 In Fastify, **error handling is mostly something you DON'T do**. A request that fails your route schema is rejected for you with a `400`. An error thrown inside an `async` handler is caught for you and routed to one place. Your job isn't to wrap everything in `try/catch` - it's to **throw the right error** and then **decide, in one spot, how errors become responses**. The framework does the catching; you do the shaping.

If you came from [Express](/guides/express-from-zero), this is a genuine relief. There, an unhandled throw in an async route handler in Express 4 silently hangs the request unless you wired up `express-async-errors` or hand-passed errors to `next(err)`. Fastify removes that whole category of bug. We'll keep growing the same **books API**.

## The wins you already have for free

Before customizing anything, take inventory of what Fastify already does. Two big ones.

**Schema validation rejects bad input for you (a 400, no code).** You saw this back in [Routing & Schemas](02-routing-and-schemas.md): a body that violates the route's `body` schema never reaches your handler. Fastify short-circuits with a `400` and a structured message.

```javascript
// POST /books  with body  { "author": "Herbert" }   (no title)
//
// Fastify replies BEFORE your handler runs:
// 400 Bad Request
// {
//   "statusCode": 400,
//   "error": "Bad Request",
//   "message": "body must have required property 'title'"
// }
```

*What just happened:* Nothing of yours executed. The schema said `title` is required, the body lacked it, and Fastify produced a 400 with a clear message on its own. That's error handling you didn't write and don't maintain - the cheapest kind.

**Async throws are caught automatically.** In an `async` handler, you can just `throw`, and Fastify catches it and turns it into a response. Compare the two worlds:

```javascript
// Express 4: this throw is NOT caught - the request hangs.
app.get('/books/:id', async (req, res) => {
  const book = await db.find(req.params.id);
  if (!book) throw new Error('not found'); // request stalls; needs next(err) or a wrapper
  res.json(book);
});

// Fastify: this throw IS caught - it flows to the error handler.
app.get('/books/:id', async (request) => {
  const book = await db.find(request.params.id);
  if (!book) throw new Error('not found'); // caught for you → goes to setErrorHandler
  return book;
});
```

*What just happened:* Same logic, different safety net. Fastify wraps your async handler so a thrown error becomes a forwarded error rather than a hung socket. That's why, in Fastify, **throwing is the idiomatic way to bail out** of a handler - you don't need `try/catch` around your own logic just to send an error response.

## Shaping errors with `setErrorHandler`

Everything that gets thrown or forwarded - your throws, downstream plugin errors, validation failures - funnels into one function you can define: `setErrorHandler`. This is where you decide what an error *looks like* to the client.

```javascript
app.setErrorHandler((error, request, reply) => {
  request.log.error(error);
  const status = error.statusCode || 500;
  reply.code(status).send({ error: error.message || 'Internal Server Error' });
});
```

*What just happened:* Every error that reaches Fastify now passes through here. We log it with the request-scoped logger (so the log line carries the request id - handy in production), read a `statusCode` off the error if it has one (defaulting to `500`), and send a small, consistent body. From now on, every error response in the app has the same shape. That consistency is the entire point - clients shouldn't have to guess whether an error is `{ error }` or `{ message }` or `{ msg }` depending on which route blew up.

Notice the lever that makes this work: **`error.statusCode`**. Fastify reads it to set the HTTP status. So the way you control *which* status a thrown error produces is by putting a `statusCode` on the error before you throw it:

```javascript
app.get('/books/:id', async (request) => {
  const id = Number(request.params.id);
  const book = books.find((b) => b.id === id);
  if (!book) {
    const err = new Error('Book not found');
    err.statusCode = 404;
    throw err;
  }
  return book;
});
```

*What just happened:* We built a plain `Error`, tagged it with `statusCode = 404`, and threw it. Fastify caught it, ran it through `setErrorHandler`, which read `error.statusCode` and replied `404 { "error": "Book not found" }`. No `reply.code(404)` scattered in the handler - the handler just states "this is a 404 situation" and the central handler renders it.

## Typed errors without the boilerplate: `@fastify/sensible`

Hand-stamping `err.statusCode = 404` on every error gets old. The official `@fastify/sensible` plugin gives you a set of ready-made HTTP error throwers under `app.httpErrors`, so you don't construct errors by hand.

```javascript
import sensible from '@fastify/sensible';

await app.register(sensible);

app.get('/books/:id', async (request) => {
  const id = Number(request.params.id);
  const book = books.find((b) => b.id === id);
  if (!book) throw app.httpErrors.notFound('Book not found'); // a 404, fully formed
  return book;
});
```

*What just happened:* `app.httpErrors.notFound('Book not found')` returns an error object that already carries `statusCode: 404` and the right message, so throwing it produces a clean 404. There are throwers for the whole family - `badRequest`, `unauthorized`, `forbidden`, `conflict`, `unprocessableEntity`, and so on. It reads like the intent (`throw app.httpErrors.conflict('that ISBN already exists')`) instead of error plumbing.

> 💡 This is the rhythm to internalize: **throw typed errors from your handlers, let schema validation throw for you on bad input, and let one `setErrorHandler` render all of it.** Your handlers stay focused on the happy path and `throw` to bail; the shape of every error response lives in exactly one place.

## The 404 for unknown routes: `setNotFoundHandler`

There's one error the error handler does *not* catch by default: a request to a route that doesn't exist at all (say `DELETE /widgets` when you have no widgets route). That's not a thrown error - there's no handler to run. Fastify replies with its own default 404. To make that 404 match the rest of your API, set a not-found handler:

```javascript
app.setNotFoundHandler((request, reply) => {
  reply.code(404).send({ error: 'Not Found' });
});
```

*What just happened:* Now an unmatched URL returns *your* `{ "error": "Not Found" }` body with a 404, consistent with what `setErrorHandler` produces for thrown errors. Two different doors (no-such-route vs. error-while-handling), but the client sees one consistent house style.

## Reshaping validation errors

By default a schema-validation failure produces `{ statusCode, error, message }`. That's fine for most APIs, but sometimes you want your own envelope - say, a `fields` array a frontend can map to form inputs. You don't disable validation to do this; you reshape it *inside* `setErrorHandler` by checking `error.validation`.

When Fastify rejects a request for schema reasons, the error it forwards carries a `validation` property: an array of the individual schema violations. Branch on it:

```javascript
app.setErrorHandler((error, request, reply) => {
  if (error.validation) {
    // schema-validation failure → return our own shape
    return reply.code(400).send({
      error: 'Validation failed',
      fields: error.validation.map((v) => v.instancePath || v.params.missingProperty)
    });
  }
  // everything else → the generic path
  request.log.error(error);
  const status = error.statusCode || 500;
  reply.code(status).send({ error: error.message || 'Internal Server Error' });
});
```

*What just happened:* The same central handler now has two branches. When `error.validation` is present, we know this came from schema validation and we emit our custom `{ error, fields }` shape with a 400. Everything else falls through to the generic logging-and-status path from before. Validation still runs automatically and still rejects bad input before your handler - we only changed how that rejection is *presented*.

> ⚠️ `error.validation` exists **only** on errors that come from schema validation. Don't read `error.validation.map(...)` unconditionally - on a regular thrown error it's `undefined` and you'll crash your own error handler (the one place you really don't want to throw). Always gate it behind the `if (error.validation)` check, as above.

## Recap

- Most error handling in Fastify is **automatic**: schema validation rejects bad input with a `400` you didn't write, and `async` throws are caught for you (unlike bare Express 4) and forwarded.
- **Throwing is the idiomatic way to bail** out of a handler - no `try/catch` needed just to send an error response.
- `setErrorHandler` is the **one place** all thrown/forwarded errors become responses; it reads `error.statusCode` to set the HTTP status, so give your errors a `statusCode`.
- `@fastify/sensible` gives you `app.httpErrors.notFound(...)` and friends - typed errors with the right `statusCode` baked in, no hand-stamping.
- `setNotFoundHandler` customizes the 404 for **unmatched routes** (a separate door from `setErrorHandler`); reshape **validation** responses by checking `error.validation` inside `setErrorHandler`.

## Quick check

```quiz
[
  {
    "q": "A handler does `throw app.httpErrors.notFound('Book not found')`. How does that become a 404 response?",
    "choices": ["You must also call reply.code(404) in the handler", "Fastify catches the throw and setErrorHandler reads error.statusCode (404) to set the status", "@fastify/sensible sends the response directly, bypassing the error handler", "It returns a 500 unless you wrap the handler in try/catch"],
    "answer": 1,
    "explain": "httpErrors.notFound() returns an error already carrying statusCode 404. Fastify catches the async throw and routes it to setErrorHandler, which reads error.statusCode to set the HTTP status."
  },
  {
    "q": "Inside setErrorHandler, what does the presence of `error.validation` tell you?",
    "choices": ["The error came from schema validation, and validation holds the list of violations", "The response was successfully validated against the response schema", "Validation is disabled for this route", "The error has no statusCode and must be a 500"],
    "answer": 0,
    "explain": "Schema-validation failures forward an error with a `validation` array of the individual violations. Gate any custom reshaping behind `if (error.validation)` - it's undefined on ordinary thrown errors."
  },
  {
    "q": "A request hits `DELETE /widgets`, a route you never defined. Which handler shapes that response?",
    "choices": ["setErrorHandler, because every error goes through it", "Neither - Fastify always returns its built-in 404", "setNotFoundHandler, because no route matched (it isn't a thrown error)", "The body schema's validation handler"],
    "answer": 2,
    "explain": "An unmatched route isn't a thrown error, so setErrorHandler doesn't see it. setNotFoundHandler customizes the 404 for routes that don't exist."
  }
]
```

[← Phase 5: Building a REST API](05-building-a-rest-api.md) · [Guide overview](_guide.md) · [Phase 7: Testing & Production →](07-testing-and-production.md)