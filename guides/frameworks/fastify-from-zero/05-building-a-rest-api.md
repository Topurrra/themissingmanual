---
title: "Building a REST API"
guide: "fastify-from-zero"
phase: 5
summary: "Assemble routing, schemas, plugins, and hooks into a full books CRUD API: five schema-backed routes in one encapsulated plugin over an in-memory collection, with tiny handlers because validation lives in the schema."
tags: [fastify, javascript, rest, api, crud]
difficulty: intermediate
synonyms: ["fastify rest api", "fastify crud", "fastify books api", "fastify plugin routes crud", "fastify schema crud", "node fastify json api"]
updated: 2026-07-10
---

# Building a REST API

This is the payoff phase. Everything you've collected — routes carrying schemas (Phase 2), code organized into encapsulated plugins (Phase 3), and the request lifecycle with hooks (Phase 4) — clicks together here into one working CRUD service. Nothing new to learn here; this is assembly.

Here's the mental model to carry through the whole phase:

> 📝 A REST resource is **five schema-backed routes living in one plugin**, all operating over a single collection. List, read-one, create, update, delete — that's the shape of *every* resource in *every* framework. What makes it Fastify is the schema-first form: each route hangs a `schema` on itself, so the handlers shrink to almost nothing.

We've grown the **books API** since Phase 1. A book is `{ id, title, author }`. Now we'll give it the full set of operations and a proper home.

## The books plugin and its store

A resource belongs in its own plugin (Phase 3) — a self-contained feature, encapsulated, mounted under a prefix. Inside it we need somewhere to keep the books. For now that's an array and a counter:

```javascript
// book-routes.js
async function bookRoutes(fastify, opts) {
  const books = [{ id: 1, title: 'Dune', author: 'Herbert' }];
  let nextId = 2;

  // routes go here (next section)
}

module.exports = bookRoutes;
```

*What just happened:* we declared the plugin as `async (fastify, opts)` — the exact shape from Phase 3. The `books` array and `nextId` counter live *inside* the plugin function, so they're private to it; no other plugin can poke at the data directly. Reads and writes go through the routes. Because Node runs your JavaScript on a single thread, two requests never touch the array at the literal same instant — there are no locks to think about, no race conditions over `nextId`.

> 📝 This array is a stand-in for a database. It works perfectly in dev and vanishes the moment the process restarts. That's fine — it lets us focus on the *routes*, which are the part that stays the same when you swap in a real store.

## The five routes, each with a schema

Now the heart of it. Five routes, each carrying a `schema` (Phase 2) for validation and serialization. Notice how little code is in each handler — that's the whole point, and we'll name it after the block.

First, a small base schema for a book, so the response schemas don't repeat themselves:

```javascript
const bookSchema = {
  type: 'object',
  properties: {
    id: { type: 'integer' },
    title: { type: 'string' },
    author: { type: 'string' }
  }
};

const idParams = {
  type: 'object',
  properties: { id: { type: 'integer' } },
  required: ['id']
};

const bookBody = {
  type: 'object',
  required: ['title', 'author'],
  properties: {
    title: { type: 'string', minLength: 1 },
    author: { type: 'string', minLength: 1 }
  }
};
```

*What just happened:* we hoisted the three shapes we'll reuse — the book itself, the `:id` param, and the create/update body. `idParams` declares `id` as an `integer`; Fastify will coerce the string from the URL into a number for you and reject anything that isn't numeric. `bookBody` requires both fields, each non-empty. Defining these once keeps the routes readable.

Now the routes, all inside `bookRoutes`:

```javascript
// GET /  -> list every book
fastify.get('/', {
  schema: {
    response: { 200: { type: 'array', items: bookSchema } }
  }
}, async () => books);

// GET /:id  -> one book, or 404
fastify.get('/:id', {
  schema: {
    params: idParams,
    response: { 200: bookSchema }
  }
}, async (request, reply) => {
  const book = books.find((b) => b.id === request.params.id);
  if (!book) {
    reply.code(404);
    return { error: 'Book not found' };
  }
  return book;
});

// POST /  -> create
fastify.post('/', {
  schema: {
    body: bookBody,
    response: { 201: bookSchema }
  }
}, async (request, reply) => {
  const book = { id: nextId++, ...request.body };
  books.push(book);
  reply.code(201);
  return book;
});

// PUT /:id  -> update, or 404
fastify.put('/:id', {
  schema: {
    params: idParams,
    body: bookBody,
    response: { 200: bookSchema }
  }
}, async (request, reply) => {
  const book = books.find((b) => b.id === request.params.id);
  if (!book) {
    reply.code(404);
    return { error: 'Book not found' };
  }
  book.title = request.body.title;
  book.author = request.body.author;
  return book;
});

// DELETE /:id  -> remove, or 404
fastify.delete('/:id', {
  schema: {
    params: idParams
  }
}, async (request, reply) => {
  const index = books.findIndex((b) => b.id === request.params.id);
  if (index === -1) {
    reply.code(404);
    return { error: 'Book not found' };
  }
  books.splice(index, 1);
  reply.code(204);
  return null;
});
```

*What just happened:* the full CRUD surface, five routes. `GET /` returns the array (response schema says it's an array of books). `GET /:id` and `PUT /:id` look up by id and either return the book or set `404` and return an error object. `POST /` builds a book with the next id, pushes it, and sends `201 Created`. `DELETE /:id` removes the book and sends `204 No Content` with no body — that's why it returns `null`. Each route declares only the schema parts it actually uses: a list needs no `body`, a delete needs no `response` shape.

> 💡 Look at how *thin* the handlers are. Not one line of `if (!request.body.title)`, no type-checking, no "is this id even a number?" None of it. That work moved into the `schema`, where Fastify does it before your handler ever runs. Bad input is auto-rejected with a `400` (Phase 2) up front, so by the time your code executes, the input is already known-good. Schema-first routing is what makes these handlers small enough to read at a glance.

Finally, mount the plugin under a prefix in your main file (Phase 3):

```javascript
// server.js
const Fastify = require('fastify');
const bookRoutes = require('./book-routes');

const app = Fastify({ logger: true });

app.register(bookRoutes, { prefix: '/api/books' });

app.listen({ port: 3000 });
```

*What just happened:* `register` mounts the whole resource under `/api/books`, so the plugin's `'/'` becomes `GET /api/books`, its `'/:id'` becomes `GET /api/books/:id`, and so on. The plugin stays unaware of where it lives; the prefix is decided here, at the mount point.

## Driving it from the command line

Let's exercise every route with `curl` and watch the responses. Start the server first, then in another terminal:

```bash
# List all books
curl http://localhost:3000/api/books
# -> [{"id":1,"title":"Dune","author":"Herbert"}]

# Get one book
curl http://localhost:3000/api/books/1
# -> {"id":1,"title":"Dune","author":"Herbert"}

# Get a missing book -> 404
curl -i http://localhost:3000/api/books/999
# -> HTTP/1.1 404 Not Found
# -> {"error":"Book not found"}

# Create a book -> 201
curl -i -X POST http://localhost:3000/api/books \
  -H 'Content-Type: application/json' \
  -d '{"title":"Neuromancer","author":"Gibson"}'
# -> HTTP/1.1 201 Created
# -> {"id":2,"title":"Neuromancer","author":"Gibson"}

# Update it -> 200
curl -X PUT http://localhost:3000/api/books/2 \
  -H 'Content-Type: application/json' \
  -d '{"title":"Neuromancer","author":"William Gibson"}'
# -> {"id":2,"title":"Neuromancer","author":"William Gibson"}

# Delete it -> 204 (no body)
curl -i -X DELETE http://localhost:3000/api/books/2
# -> HTTP/1.1 204 No Content
```

*What just happened:* the five routes, walked end to end. The `-i` flag prints the status line so you can see `201`, `404`, and `204` for yourself. The 204 returns no body at all — that's the correct "done, nothing to send back" answer for a delete.

Now the interesting one — send a body that breaks the schema, and watch Fastify reject it before your handler runs:

```bash
# Create with no title -> 400, auto-generated by the schema
curl -i -X POST http://localhost:3000/api/books \
  -H 'Content-Type: application/json' \
  -d '{"author":"Gibson"}'
# -> HTTP/1.1 400 Bad Request
# -> {
# ->   "statusCode": 400,
# ->   "error": "Bad Request",
# ->   "message": "body must have required property 'title'"
# -> }
```

*What just happened:* nothing in `bookRoutes` executed. The `bookBody` schema marks `title` required; the request omitted it; Fastify short-circuited with a `400` and a human-readable message. You wrote zero lines to produce this — it fell out of the schema you'd already declared for serialization. That's validation and structure for free.

## Where this goes next

Two threads to pull on, both pointing forward.

> 💡 That `books` array is a database with the lifespan of a process. When you're ready for data that survives a restart, you swap the array for a real store — most likely through an ORM, which maps your `{ id, title, author }` objects to rows in a table (see [how an ORM works](/guides/how-an-orm-works)). Here's the good news: the **routes don't change shape**. `GET /:id` still finds-or-404s; `POST /` still creates-and-201s. Only the four lines that touch `books` become calls into the store. The schema-backed skeleton is the durable part.

> 💡 You probably noticed the same `if (!book) { reply.code(404); return { error: '...' } }` block copy-pasted across three routes. That repetition is a smell, and it's exactly what **Phase 6** fixes: a centralized error handler (`setErrorHandler`) and a single way to signal "not found," so the handlers stop repeating themselves and the error responses stay consistent across the whole API.

## Recap

- A REST resource is **five schema-backed routes in one plugin** over a single collection — the same shape in every framework, here in Fastify's schema-first form.
- Put the resource in its own encapsulated plugin (Phase 3) with a private in-memory store; Node's single thread means no locks and no race over `nextId`.
- The five routes map to verbs and status codes: `GET /` (200 list), `GET /:id` (200 or 404), `POST /` (201), `PUT /:id` (200 or 404), `DELETE /:id` (204 or 404).
- Handlers stay tiny because validation lives in the `schema` (Phase 2): bad input is auto-rejected with a `400` before your code runs — no hand-written checks.
- The array is a database stand-in — swap it for a real store via an [ORM](/guides/how-an-orm-works) and the routes keep their shape; the repeated 404 block gets centralized in Phase 6.

## Quick check

```quiz
[
  {
    "q": "Why are the CRUD handlers so short — almost no validation code inside them?",
    "choices": ["Fastify hides the validation in a separate file it generates", "The schema attached to each route validates input before the handler runs, so bad input never reaches it", "Validation only runs in production builds", "request.body is pre-validated by Node, not Fastify"],
    "answer": 1,
    "explain": "Each route's schema does validation (and serialization). A request that violates the body/params schema is auto-rejected with a 400 before the handler executes, so the handler only ever sees known-good input — no manual checks needed."
  },
  {
    "q": "What status code should DELETE /:id return on a successful delete, and what body?",
    "choices": ["200 with the deleted book", "201 with no body", "204 with no body", "404 with an error object"],
    "answer": 2,
    "explain": "A successful delete returns 204 No Content with no body — there's nothing meaningful to send back. The handler sets reply.code(204) and returns null. (404 is for when the book isn't found.)"
  },
  {
    "q": "You want to replace the in-memory `books` array with a real database later. What happens to the five routes?",
    "choices": ["They must be rewritten from scratch with new schemas", "They keep their shape — only the few lines touching `books` become store calls", "Each route needs its own database connection plugin", "The schemas have to be removed because the DB validates instead"],
    "answer": 1,
    "explain": "The schema-backed route skeleton is the durable part. Swapping the array for a store (typically via an ORM) only changes the handful of lines that read/write `books`; the routing, status codes, and schemas stay the same."
  }
]
```

[← Phase 4: Hooks & the Lifecycle](04-hooks-and-lifecycle.md) · [Guide overview](_guide.md) · [Phase 6: Error Handling →](06-error-handling.md)