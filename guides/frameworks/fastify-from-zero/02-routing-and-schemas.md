---
title: "Routing & Schemas"
guide: "fastify-from-zero"
phase: 2
summary: "Routing in Fastify by method, params, query, and body — and attaching a JSON Schema to a route so Fastify validates input and fast-serializes output for you, no validation code required."
tags: [fastify, javascript, routing, json-schema, validation]
difficulty: intermediate
synonyms: ["fastify routing", "fastify json schema", "fastify validation", "fastify serialization", "fastify request params", "fastify route schema"]
updated: 2026-06-23
---

# Routing & Schemas

Here's the one idea that makes Fastify *Fastify*, and the thing to hold in your head for this whole phase:

> 📝 In Fastify, a route isn't only a handler. **A route is a handler PLUS a schema.** The handler is the code that runs; the schema is a description of what goes *in* (body, params, query) and what comes *out* (the response). Once you've written the schema, Fastify does two big chores for you — it **validates** incoming requests and it **serializes** outgoing responses — so you write less code, not more.

Most frameworks make you reach for a separate validation library and wire it up by hand in every handler. Fastify folds that into the route definition. You describe the shape once; the framework enforces it. That's the trade you're learning to make here, and it pays off the moment your API has more than three endpoints.

We'll keep growing the same **books API** from Phase 1 — a book is just `{ id, title, author }`.

## Routing basics

Fastify gives you a method per HTTP verb. The shape is the same one you saw in Phase 1:

```javascript
import Fastify from 'fastify';
const app = Fastify();

const books = [{ id: 1, title: 'Dune', author: 'Herbert' }];

// GET all books
app.get('/books', async () => books);

// GET one book by id  ->  /books/1
app.get('/books/:id', async (request) => {
  const id = Number(request.params.id);
  return books.find((b) => b.id === id);
});

// GET with a query string  ->  /books?author=Herbert
app.get('/books/search', async (request) => {
  const { author } = request.query;
  return books.filter((b) => b.author === author);
});

await app.listen({ port: 3000 });
```

*What just happened:* You declared three GET routes. The `:id` in the path is a **route parameter** — Fastify pulls it out and hands it to you on `request.params` (always as a string, which is why we `Number()` it). The `?author=...` part of the URL lands on `request.query`. Both are parsed for you; you only read them.

For routes that take a body — POST, PUT — Fastify reads `request.body`. Because the incoming `Content-Type` is `application/json`, Fastify parses the JSON automatically, so `request.body` is already a real object:

```javascript
app.post('/books', async (request, reply) => {
  const book = { id: books.length + 1, ...request.body };
  books.push(book);
  reply.code(201);
  return book;
});
```

*What just happened:* `request.body` is the parsed JSON the client sent. We built a new book, pushed it, set the status to `201 Created` with `reply.code(201)`, and returned the object — Fastify turns the returned value into the JSON response. Notice there's no `JSON.parse`, no `JSON.stringify`. That's all handled.

> 💡 There's also an options form of every route: `app.route({ method, url, schema, handler })`. The `app.get(...)`/`app.post(...)` shortcuts are sugar over it. You'll use the options form the moment you want to attach a `schema` — which is exactly what's next.

## Adding a schema to a route

So far that POST route trusts the client completely. If someone sends `{}` with no title, we happily store a broken book. The fix in most frameworks is hand-written `if (!request.body.title) ...` checks in every handler. In Fastify, you attach a **JSON Schema** instead and delete the checks entirely.

A schema is a plain JSON object describing shapes. You hang it on the route under `schema`, with keys for the parts you want to constrain — `body`, `params`, `querystring`, `headers`, and `response`:

```javascript
app.post('/books', {
  schema: {
    body: {
      type: 'object',
      required: ['title', 'author'],
      properties: {
        title: { type: 'string', minLength: 1 },
        author: { type: 'string' }
      }
    },
    response: {
      201: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          title: { type: 'string' },
          author: { type: 'string' }
        }
      }
    }
  }
}, async (request, reply) => {
  const book = { id: books.length + 1, ...request.body };
  books.push(book);
  reply.code(201);
  return book;
});
```

*What just happened:* The handler is unchanged — it still doesn't validate anything. The new `schema` object does the work. The `body` schema says "an object that must have `title` and `author`, and `title` must be at least one character." The `response` schema says "when you send a 201, it looks like this." Same handler as before, but now it's guarded.

> 💡 That one `schema` block is pulling **two** levers:
> 1. **Validation (input).** A request whose body violates the `body` schema never reaches your handler. Fastify rejects it with a `400 Bad Request` and a clear message like `body must have required property 'title'`. You wrote zero validation code.
> 2. **Serialization (output).** Fastify compiles your `response` schema into purpose-built code that's *faster* than the generic `JSON.stringify`, because it already knows the exact shape. Speed is a bonus; the real headline is the next section.

Send a bad request and you'll see the validation in action:

```javascript
// POST /books  with body  { "author": "Herbert" }   (no title)
//
// Fastify replies, before your handler runs:
// 400 Bad Request
// {
//   "statusCode": 400,
//   "error": "Bad Request",
//   "message": "body must have required property 'title'"
// }
```

*What just happened:* Nothing in your code ran. Fastify checked the body against the schema, found `title` missing, and short-circuited with a 400 and a human-readable message. This is the payoff: validation logic you didn't write and don't maintain.

## Reusing schemas with `addSchema`

Once you have several routes, the same shapes repeat — a `Book` here, an `id param` there. Instead of copy-pasting the JSON, register a schema with an `$id` once and point at it with `$ref`:

```javascript
app.addSchema({
  $id: 'book',
  type: 'object',
  properties: {
    id: { type: 'integer' },
    title: { type: 'string' },
    author: { type: 'string' }
  }
});

app.get('/books/:id', {
  schema: {
    response: { 200: { $ref: 'book#' } }
  }
}, async (request) => {
  const id = Number(request.params.id);
  return books.find((b) => b.id === id);
});
```

*What just happened:* `app.addSchema` filed the book shape under the id `'book'`. The route then references it with `{ $ref: 'book#' }` instead of repeating the properties. Define the shape once, reuse it across every route that touches a book. (Schemas are scoped to the plugin that registered them — more on plugins in the next phase.)

## The gotcha that catches everyone

This one surprises people, so read it twice:

> ⚠️ **The response schema FILTERS the output.** Fastify only sends the fields you *declared* in the response schema. Any property your handler returns that isn't listed is silently **stripped**. So if a field is mysteriously missing from your JSON response, don't debug your handler — check the response schema. The field is almost always just absent from the schema.

Here's the trap in miniature:

```javascript
app.get('/books/:id', {
  schema: {
    response: {
      200: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          title: { type: 'string' }
          // author is NOT listed here
        }
      }
    }
  }
}, async (request) => {
  const id = Number(request.params.id);
  return books.find((b) => b.id === id); // returns { id, title, author }
});
```

*What just happened:* The handler returns the full book including `author`. But the response schema only declares `id` and `title`, so the client receives `{ "id": 1, "title": "Dune" }` — `author` is gone. The handler did nothing wrong; the schema didn't invite `author` to the party. Add `author` to the response properties and it reappears.

This filtering is actually a feature once you expect it: it's a quiet security default. If you accidentally return a `passwordHash` or an internal field, an undeclared property won't leak — it gets stripped because it wasn't in the schema. The cost is the "where did my field go?" moment the first time it bites you. Now it won't.

## Recap

- A Fastify route is **a handler plus a schema** — the schema describes input and output so you write less code.
- Read input from `request.params` (path like `/books/:id`), `request.query` (the `?...` string), and `request.body` (auto-parsed JSON).
- Attaching a `schema` does two jobs: **validation** (bad input is auto-rejected with a `400` and a clear message — no validation code) and **fast serialization** of the response.
- Share repeated shapes with `app.addSchema({ $id, ... })` and reference them via `{ $ref: 'id#' }`.
- The **response schema filters output** to declared fields. Missing field in the response? Check the schema, not the handler — undeclared properties are stripped (which also keeps internal fields from leaking).

## Quick check

```quiz
[
  {
    "q": "A client POSTs a book with no `title`, and the route's `body` schema marks `title` as required. What happens?",
    "choices": ["The handler runs and must check for the missing title itself", "Fastify rejects the request with a 400 before the handler runs", "Fastify inserts an empty string for title and continues", "The server crashes with an unhandled error"],
    "answer": 1,
    "explain": "Schema validation runs before the handler. A body that violates the schema is auto-rejected with a 400 and a clear message, so the handler never sees invalid input."
  },
  {
    "q": "Your handler returns `{ id, title, author }`, but the response schema only lists `id` and `title`. What does the client receive?",
    "choices": ["{ id, title, author } — schemas don't affect output", "A 500 error because author isn't declared", "{ id, title } — author is stripped because it's not in the schema", "{ id, title, author: null }"],
    "answer": 2,
    "explain": "The response schema FILTERS output to declared properties. Undeclared fields like author are silently stripped — that's the #1 'where did my field go?' surprise."
  },
  {
    "q": "Where does Fastify put the value of `:id` from a path like `/books/:id`?",
    "choices": ["request.body.id", "request.query.id", "request.params.id", "request.id"],
    "answer": 2,
    "explain": "Route parameters from the path land on request.params (as strings). Query-string values go on request.query, and the parsed JSON body is request.body."
  }
]
```

[← Phase 1: What Fastify Is & Your First Server](01-what-fastify-is.md) · [Guide overview](_guide.md) · [Phase 3: The Plugin System →](03-the-plugin-system.md)
