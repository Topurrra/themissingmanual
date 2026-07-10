---
title: "Routing"
guide: "express-from-zero"
phase: 2
summary: "How Express turns a method and a path into a handler: method routes, route params via req.params, query strings via req.query, modular routers, and why route order decides which handler wins."
tags: [express, javascript, routing, params, router]
difficulty: beginner
synonyms: ["express routing", "express route params", "express query string", "express router", "express http methods", "express app.use router"]
updated: 2026-07-10
---

# Routing

One idea for this whole phase: **a route is a method plus a path, pointing at a handler.** When a
request arrives, Express looks at *what verb* it used (`GET`, `POST`, `DELETE`…) and *what URL path*
it asked for (`/tasks`, `/tasks/42`), then runs the first handler you registered that matches both.
Everything else — params, query strings, routers — is detail layered onto that sentence.

> 📝 Routing answers a different question than the response does. Routing decides *which* function runs;
> the function decides *what* to send back. Keep those two jobs separate in your head and Express stays
> simple.

Two things ride along inside the request, and we'll spend most of this phase on them:

- The **path** can carry variable pieces — `/tasks/42` — that Express hands you as **route params**.
- The **URL** can carry a question-mark **query string** — `/tasks?done=true` — that Express hands you as
  the **query**.

We'll grow the running **tasks API** (each task is `{ id, title, done }`) one route at a time.

## Method routes: one verb, one path

Express gives you a method for each HTTP verb. The shape is always the same: `app.VERB(path, handler)`.

```javascript
const express = require('express')
const app = express()
app.use(express.json()) // lets us read JSON request bodies (more in Phase 3)

let tasks = [
  { id: 1, title: 'Buy milk', done: false },
  { id: 2, title: 'Write guide', done: true },
]

app.get('/tasks', (req, res) => {
  res.json(tasks)
})

app.post('/tasks', (req, res) => {
  const task = { id: tasks.length + 1, title: req.body.title, done: false }
  tasks.push(task)
  res.status(201).json(task)
})

app.listen(3000, () => console.log('listening on http://localhost:3000'))
```

*What just happened:* the **same path** `/tasks` is registered twice, for different verbs. `GET /tasks`
runs the first handler and returns the list; `POST /tasks` runs the second and creates a task. Express
never confuses them — a route is method *and* path, not path alone. The `201` is the HTTP status for
"created"; we set it explicitly because the default would be `200`.

The full set you'll reach for: `app.get`, `app.post`, `app.put`, `app.delete`, `app.patch`. There's also
`app.all(path, handler)`, which matches *every* method for that path — handy for cross-cutting things like
a path-specific guard.

> 💡 You can pass more than one handler: `app.get('/x', mw1, handler)`. Express runs them in order, each
> deciding whether to continue. That's a preview of Phase 3 — under the hood, a route is just middleware
> bound to a method and path.

## Route params: variable pieces of the path

A real API can't register a separate route for task 1, task 2, task 99. Instead you mark a slot in the
path with a colon, and Express fills it in from the actual URL.

```javascript
app.get('/tasks/:id', (req, res) => {
  const id = Number(req.params.id)
  const task = tasks.find((t) => t.id === id)
  if (!task) {
    return res.status(404).json({ error: 'Task not found' })
  }
  res.json(task)
})
```

*What just happened:* `:id` is a **named slot**. A request to `/tasks/2` makes Express set
`req.params.id` to `"2"`, and we look up the matching task. If nothing matches, we send a `404` and
`return` so the rest of the handler doesn't run.

⚠️ **Route params are always strings.** `req.params.id` is `"2"`, not the number `2`. Our tasks have
numeric `id`s, so `tasks.find((t) => t.id === id)` would silently fail with `"2" === 2` being `false` —
nothing matches, every lookup 404s, and it *looks* like your data is missing. That's why we wrap it in
`Number(req.params.id)`. This bites everyone once; let it bite you here instead of in production.

You can have several params in one path:

```javascript
app.get('/users/:userId/tasks/:taskId', (req, res) => {
  const userId = Number(req.params.userId)
  const taskId = Number(req.params.taskId)
  res.json({ userId, taskId })
})
```

*What just happened:* a request to `/users/7/tasks/3` gives you `req.params.userId === "7"` and
`req.params.taskId === "3"`. Each colon-name becomes its own key on `req.params`. The path reads like the
relationship it models: this task belongs to that user.

## Query strings: optional extras after the `?`

Params live *in* the path and are usually required to identify a thing. **Query strings** live after a `?`
and are for the optional stuff: filtering, sorting, paging. Express parses them into `req.query`.

```javascript
app.get('/tasks', (req, res) => {
  let result = tasks
  if (req.query.done !== undefined) {
    const wantDone = req.query.done === 'true'
    result = result.filter((t) => t.done === wantDone)
  }
  res.json(result)
})
```

*What just happened:* a request to `/tasks?done=true` gives `req.query.done === "true"`. We compare
against the string `'true'` (⚠️ same string-not-boolean trap as params — there's no `true` boolean
hiding in a URL) and filter accordingly. A plain `/tasks` with no query returns everything, because
`req.query.done` is `undefined` and we skip the filter. Multiple params work the same way:
`/tasks?done=true&tag=home` gives you both `req.query.done` and `req.query.tag`.

> 📝 Rule of thumb: **path params identify a resource** (`/tasks/42` — *this* task), **query strings
> shape a collection** (`/tasks?done=true` — *which* tasks). When you're unsure which to use, ask whether
> the value names a thing or filters a list.

## Routers: splitting routes into modules

Pile every route onto `app` and one file balloons fast. `express.Router()` gives you a **mini-app** —
you define routes on it exactly like you do on `app`, then **mount** it under a path prefix.

```javascript
// routes/tasks.js
const express = require('express')
const router = express.Router()

router.get('/', (req, res) => {
  res.json(tasks) // GET /api/tasks
})

router.get('/:id', (req, res) => {
  res.json({ id: Number(req.params.id) }) // GET /api/tasks/42
})

module.exports = router
```

```javascript
// app.js
const tasksRouter = require('./routes/tasks')
app.use('/api/tasks', tasksRouter)
```

*What just happened:* the router's paths are written **relative to where it's mounted**. Inside the
router, `'/'` and `'/:id'` look like they'd answer the site root, but because we mounted it at
`/api/tasks`, they answer `GET /api/tasks` and `GET /api/tasks/42` — the mount prefix is glued in front
of every route the router defines. This is exactly how you'll split routes across files in Phase 7; a
router *is* an `app` you can carry around and plug in.

## Route order: first match wins

Express checks routes **top to bottom and stops at the first match.** Order is not cosmetic — it changes
behavior.

```javascript
// ⚠️ WRONG ORDER
app.get('/tasks/:id', (req, res) => {
  res.json({ id: req.params.id })
})
app.get('/tasks/done', (req, res) => {
  res.json(tasks.filter((t) => t.done))
})
```

*What just happened:* a request to `/tasks/done` is meant for the second handler — but the first one,
`/tasks/:id`, matches *anything* after `/tasks/`, including the literal word `done`. So `:id` captures
`"done"`, the specific route never runs, and you get `{ "id": "done" }`. The fix is to register the
**specific route before the general one**:

```javascript
// ✅ RIGHT ORDER
app.get('/tasks/done', (req, res) => {
  res.json(tasks.filter((t) => t.done))
})
app.get('/tasks/:id', (req, res) => {
  res.json({ id: req.params.id })
})
```

*What just happened:* now `/tasks/done` hits the exact-match route first and never falls through to the
param route. The guideline that saves you: **specific paths before wildcards, narrow before broad.** The
same logic applies to catch-all "404" routes — they go *last*, because anything above them gets first dibs.

## Recap

- A route is **a method + a path → a handler**. `app.get/post/put/delete/patch`, plus `app.all` for every
  verb on one path.
- **Route params** (`:id`) come through `req.params`, and they are **always strings** — convert with
  `Number(...)` before comparing to numeric data.
- **Query strings** (`?done=true&tag=x`) come through `req.query`; use them for optional filtering and
  sorting. Path params identify a resource; query strings shape a collection.
- `express.Router()` is a mountable mini-app. `app.use('/api/tasks', router)` prefixes every route the
  router defines — this is how you split routes across files.
- Express matches **top to bottom, first match wins.** Put specific routes before wildcards and catch-alls.

Check yourself before moving on:

```quiz
[
  {
    "q": "A request hits GET /tasks/5. What is the value of req.params.id inside the handler?",
    "choices": ["The number 5", "The string \"5\"", "undefined", "An object { id: 5 }"],
    "answer": 1,
    "explain": "Route params are always strings. /tasks/5 gives req.params.id === \"5\", so you must call Number(req.params.id) before comparing to a numeric id."
  },
  {
    "q": "You register app.get('/tasks/:id', ...) and then app.get('/tasks/done', ...) below it. What happens at GET /tasks/done?",
    "choices": ["The /tasks/done handler runs", "The /:id handler runs and captures id = \"done\"", "Express runs both handlers", "Express returns a 404"],
    "answer": 1,
    "explain": "First match wins. /:id matches anything after /tasks/, including \"done\", so it runs first. Put the specific route before the param route."
  },
  {
    "q": "You mount a router with app.use('/api/tasks', router) and the router defines router.get('/:id', ...). Which URL does that route answer?",
    "choices": ["GET /:id", "GET /api/tasks", "GET /api/tasks/:id", "GET /router/:id"],
    "answer": 2,
    "explain": "A router's paths are relative to its mount point. The /api/tasks prefix is glued in front, so router.get('/:id') answers GET /api/tasks/:id."
  }
]
```

[← Phase 1: What Express Is & Your First Server](01-what-express-is.md) · [Guide overview](_guide.md) · [Phase 3: Middleware →](03-middleware.md)
