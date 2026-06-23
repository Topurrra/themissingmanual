---
title: "Building a REST API"
guide: "express-from-zero"
phase: 5
summary: "Assemble routing, middleware, and request/response validation into a full CRUD REST API: a tasks resource with five route handlers on one Router, an in-memory store, and the right status codes."
tags: [express, javascript, rest, api, crud]
difficulty: intermediate
synonyms: ["express rest api", "express crud", "express tasks api", "node rest api example", "express router crud", "express json api"]
updated: 2026-06-23
---

# Building a REST API

This is the payoff phase. Everything you've built so far — routing in Phase 2, the
middleware chain in Phase 3, reading the body and validating it in
[Phase 4](04-request-and-response.md) — clicks together here into one working API.

## The mental model: five handlers over one collection

Here's the shape to hold in your head before you write a line of code. A **REST
resource** is a collection of things — tasks, users, orders, anything — and almost
every operation you'll ever do on a collection is one of five:

| You want to… | HTTP method + path | Express handler |
|--------------|--------------------|-----------------|
| **List** them all | `GET /api/tasks` | `res.json(tasks)` |
| **Get** one by id | `GET /api/tasks/:id` | find, or 404 |
| **Create** a new one | `POST /api/tasks` | validate, add, 201 |
| **Update** one | `PUT /api/tasks/:id` | find + replace, or 404 |
| **Delete** one | `DELETE /api/tasks/:id` | remove, 204, or 404 |

That's it. List, get, create, update, delete. This is not an Express idea — it's
how REST works in every framework, in every language. What changes from framework
to framework is only the *costume*: in Django it's a `ViewSet`, in Rails a
`controller`, in Express it's **five route handlers wired onto a Router**.

> 💡 If you internalize "a resource = these five handlers," learning any new web
> framework becomes a game of "where do they put the five?" The concept transfers;
> only the syntax is new.

We'll build the running **tasks API** — the same little service this guide has been
growing all along.

## The setup: a Router, `express.json()`, and a store

Three pieces before the handlers. First, mount a **Router** for the resource — a
mini-app you attach all the task routes to, then plug into the main app under one
path. Second, add `express.json()` so incoming JSON bodies actually get parsed.
Third, a place to keep the data.

```javascript
const express = require('express');
const app = express();

app.use(express.json()); // parse JSON request bodies into req.body

const router = express.Router();

// In-memory store — a stand-in for a database
let tasks = [];
let nextId = 1;

app.use('/api/tasks', router); // every router route lives under /api/tasks
app.listen(3000, () => console.log('Tasks API on http://localhost:3000'));
```

*What just happened:* `express.Router()` gives us an isolated bundle of routes.
`app.use('/api/tasks', router)` mounts that bundle so a route defined as `'/'` on
the router answers at `/api/tasks`, and `'/:id'` answers at `/api/tasks/:id`. The
`app.use(express.json())` line is doing real work — without it, `req.body` would be
`undefined` and every create/update would silently fail. The store is two
variables: an array of tasks and a counter for handing out unique ids.

> 📝 **Why a plain array is safe here.** Node runs your JavaScript on a single
> thread per process, so two requests never mutate `tasks` *at the same instant* —
> there's no torn read, no lost update, no need for locks. That's a genuine
> convenience for a demo. It is **not** a substitute for a database: the array
> vanishes when the process restarts, and it doesn't survive across multiple
> processes if you scale out. Treat it as scaffolding.

## The five handlers

Now the heart of it. We define all five on the router. Watch how each one maps to a
row in that table above — and how create and update reuse the validation idea from
Phase 4.

```javascript
// LIST — GET /api/tasks
router.get('/', (req, res) => {
  res.json(tasks);
});

// GET ONE — GET /api/tasks/:id
router.get('/:id', (req, res) => {
  const task = tasks.find((t) => t.id === Number(req.params.id));
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  res.json(task);
});

// CREATE — POST /api/tasks
router.post('/', (req, res) => {
  const { title } = req.body;
  if (typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json({ error: 'title is required' });
  }
  const task = { id: nextId++, title: title.trim(), done: false };
  tasks.push(task);
  res.status(201).json(task);
});

// UPDATE — PUT /api/tasks/:id
router.put('/:id', (req, res) => {
  const task = tasks.find((t) => t.id === Number(req.params.id));
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  const { title, done } = req.body;
  if (title !== undefined) {
    if (typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({ error: 'title must be a non-empty string' });
    }
    task.title = title.trim();
  }
  if (done !== undefined) {
    task.done = Boolean(done);
  }
  res.json(task);
});

// DELETE — DELETE /api/tasks/:id
router.delete('/:id', (req, res) => {
  const index = tasks.findIndex((t) => t.id === Number(req.params.id));
  if (index === -1) {
    return res.status(404).json({ error: 'Task not found' });
  }
  tasks.splice(index, 1);
  res.sendStatus(204);
});
```

*What just happened:* each handler is small and does one job. A few details earn
their keep:

- **`Number(req.params.id)`** — route params always arrive as *strings*. The store
  uses numeric ids, so `'3' === 3` would be `false` and every lookup would miss.
  Coercing once at the top fixes it.
- **`return res.status(...)`** — the `return` matters. Without it, the handler keeps
  running after sending the 404 and tries to send a second response, which throws
  "Cannot set headers after they are sent."
- **The status codes are the API's vocabulary.** `200` (the default for `res.json`)
  means "here it is." `201 Created` means "I made it, here's the new thing." `204
  No Content` means "done, nothing to send back" — which is why delete uses
  `res.sendStatus(204)` instead of `res.json(...)`. `400` means "your input was
  bad," `404` means "no such thing."
- **Create and update validate before touching the store.** That's the Phase 4
  habit: check the body, reject early with `400`, only then mutate.

## Trying it out

With the server running, drive it from another terminal with `curl`. Walk down the
list and you'll see every status code from the table.

```bash
# Create one
curl -s -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Write the README"}'
# → 201  {"id":1,"title":"Write the README","done":false}

# List them
curl -s http://localhost:3000/api/tasks
# → 200  [{"id":1,"title":"Write the README","done":false}]

# Mark it done
curl -s -X PUT http://localhost:3000/api/tasks/1 \
  -H "Content-Type: application/json" \
  -d '{"done":true}'
# → 200  {"id":1,"title":"Write the README","done":true}

# Ask for one that doesn't exist
curl -s -i http://localhost:3000/api/tasks/999
# → HTTP/1.1 404 Not Found
#   {"error":"Task not found"}

# Delete it
curl -s -i -X DELETE http://localhost:3000/api/tasks/1
# → HTTP/1.1 204 No Content
```

*What just happened:* you exercised all five handlers and saw the four status codes
the API speaks. The `-i` flag prints the response headers, which is how you confirm
the `404` and `204` — a `204` has an *empty body* by design, so the status line is
the only signal you get. The `-H "Content-Type: application/json"` header is what
tells `express.json()` to parse the body; drop it and `req.body` comes back empty.

## The array is a placeholder — and the errors are repetitive

Two honest observations about what you just built.

💡 **The in-memory array is a database stand-in.** The whole point of keeping the
store behind `tasks.find(...)`, `tasks.push(...)`, and `tasks.splice(...)` is that
the *handlers don't care what's underneath*. When you swap the array for a real
database — through an ORM like Prisma or TypeORM, or raw SQL — the handler shapes
barely change: `tasks.find(...)` becomes `await db.task.findUnique(...)`, and the
`201`/`404`/`204` logic stays exactly as it is. If the concept is fuzzy, the
[how an ORM works](/guides/how-an-orm-works) guide explains the layer that sits
between your handlers and the database.

⚠️ **Notice how repetitive the error handling already is.** Look back: the
`if (!task) return res.status(404)...` block appears in three different handlers,
word for word. The validation `400`s repeat too. Right now each handler is its own
little island of error logic. That works, but it doesn't scale — by the time you
have ten resources you'll have copy-pasted that 404 fifty times, and an unhandled
exception in any handler would crash the process. [Phase 6](06-error-handling.md)
fixes this properly: one centralized error-handling middleware that every handler
delegates to, so the five handlers go back to describing only the *happy path*.

## Recap

- A REST resource is **five handlers over one collection**: list, get, create,
  update, delete. The concept is universal; Express just expresses it as routes on a
  Router.
- The setup is three pieces: `express.Router()` for the resource, `app.use(express.json())`
  to parse bodies, and a store (here, an in-memory array — fine for a demo, not for production).
- Status codes are the API's vocabulary: `200` (here it is), `201` (created),
  `204` (done, no body), `400` (bad input), `404` (not found).
- Coerce `req.params.id` to a `Number`, and always `return` after sending a
  response so a handler doesn't try to respond twice.
- The array is a database stand-in — handler shapes survive the swap to a real
  DB/ORM. See [how an ORM works](/guides/how-an-orm-works).
- The duplicated `404` and `400` logic is a smell; Phase 6 centralizes it.

## Quick check

```quiz
[
  {
    "q": "Why coerce req.params.id with Number() before comparing it to a task's id?",
    "choices": ["To make the URL shorter", "Route params arrive as strings, so '3' === 3 is false and the lookup would always miss", "Express requires all ids to be numbers", "It prevents SQL injection"],
    "answer": 1,
    "explain": "Route params are always strings. Without coercion, comparing the string '3' to the numeric id 3 is false, so every find() misses."
  },
  {
    "q": "Which status code should a successful DELETE that returns no body use?",
    "choices": ["200 OK", "201 Created", "204 No Content", "404 Not Found"],
    "answer": 2,
    "explain": "204 No Content means the action succeeded and there's nothing to send back — which is why delete uses res.sendStatus(204)."
  },
  {
    "q": "What is the in-memory tasks array meant to represent in a real application?",
    "choices": ["A permanent storage solution", "A cache layer in front of Redis", "A stand-in for a database that you swap for a real DB/ORM later", "A required part of every Express app"],
    "answer": 2,
    "explain": "The array is scaffolding. The handlers are written so that swapping it for a real database (often via an ORM) leaves their shape mostly unchanged."
  }
]
```

[← Phase 4: Request & Response](04-request-and-response.md) · [Guide overview](_guide.md) · [Phase 6: Error Handling →](06-error-handling.md)
