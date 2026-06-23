---
title: "Serving & Structuring an App"
guide: "express-from-zero"
phase: 7
summary: "Grow the one-file tasks API into a real shape: serve static files, split by responsibility into routes/controllers/services, separate app-building from server-starting, and read config from the environment."
tags: [express, javascript, static-files, structure, config]
difficulty: intermediate
synonyms: ["express static files", "express project structure", "express routes controllers services", "express config env", "express app vs server", "express dotenv"]
updated: 2026-06-23
---

# Serving & Structuring an App

Up to now the entire tasks API has lived in one file, and that was the right call —
one file is the easiest thing in the world to read while you're learning the shapes.
But every real app outgrows a single file, and the way it grows is not random. There
is a standard Express layout, and once you've seen it you'll recognize it in nearly
every Node codebase you ever open.

## The mental model: split by responsibility

Here's the idea to hold before you move a single line of code. As an app grows, you
don't split it by *file size* ("this file is too long, cut it in half") — you split
it by **responsibility**. Each piece should answer one question:

- **Routes** — *which URL maps to which handler?* (the wiring)
- **Controllers** — *how do I read the HTTP request and shape the HTTP response?* (the web layer)
- **Services** — *what's the actual business logic and data access?* (the brains)
- **Middleware** — *what runs in the chain around the handlers?* (auth, error handling)

And one more split that's easy to miss but pays off hugely: **building the app** is a
different job from **starting the server**. `app.js` assembles the middleware and
routers and exports the app; `server.js` imports it and calls `app.listen`.

💡 This is the Node echo of MVC. Routes point at controllers, controllers stay thin
and delegate to services, services hold the logic. Keep handlers thin and the logic
lands somewhere you can test without spinning up a web server at all.

We'll get there in steps. First, a quick win that needs almost no structure: serving files.

## Serving static files

A backend rarely serves only JSON. Sooner or later you have a built frontend, some
images, a downloadable PDF, a favicon — plain files you want handed to the browser
as-is. Express has one line for that.

```javascript
const express = require('express');
const app = express();

app.use(express.static('public'));

app.listen(3000);
```

*What just happened:* `express.static('public')` is built-in middleware that serves
everything inside a folder named `public` at the **root** of your site. Drop a file
at `public/index.html` and it answers at `http://localhost:3000/`. Put
`public/styles.css` there and it's at `/styles.css`. Images, JS bundles, fonts — all
served automatically, with the right `Content-Type` and `Last-Modified` headers,
without you writing a single route. This is exactly how you'd serve a built
React/Svelte/Vue frontend out of the same Express app that serves your API.

📝 The path you pass is relative to where you *start the process*, not to the file
`express.static` is called from. If you sometimes run the server from a different
directory, make it absolute with `path.join(__dirname, 'public')` so it never breaks.

For assets that don't change often, let browsers cache them:

```javascript
app.use(express.static('public', { maxAge: '1d' }));
```

*What just happened:* `maxAge: '1d'` adds a `Cache-Control: max-age=86400` header so
the browser holds onto those files for a day instead of re-fetching on every page
load. For a CSS file that changes twice a year, that's a free performance win — fewer
round trips, faster pages. (For files that *do* change, you'd typically rely on
hashed filenames so a new build gets a new URL.)

## Structure beyond one file

Now the real refactor. We're going to take the exact same tasks API from
[Phase 5](05-building-a-rest-api.md) and [Phase 6](06-error-handling.md) and spread it
across the standard layout. **Nothing about the behavior changes** — same routes, same
status codes, same logic. We're only moving code into the box that matches its job.

Here's the tree we're aiming for:

```
tasks-api/
  app.js                       ← builds the app (middleware + routers), exports it
  server.js                    ← imports app, calls app.listen
  routes/
    tasks.routes.js            ← maps URLs → controller functions
  controllers/
    tasks.controller.js        ← reads req, shapes res (thin)
  services/
    tasks.service.js           ← business logic + the data store
  middleware/
    error-handler.js           ← the centralized error handler from Phase 6
  public/                      ← static files (optional)
```

Let's build it bottom-up — logic first, then the web layer, then the wiring.

### The service: logic and data, no HTTP

The service knows nothing about `req` or `res`. It deals in plain data and throws
plain errors. That's the whole point — it's testable without a web server.

```javascript
// services/tasks.service.js
let tasks = [];
let nextId = 1;

function listTasks() {
  return tasks;
}

function getTask(id) {
  return tasks.find((t) => t.id === id);
}

function createTask(title) {
  const task = { id: nextId++, title, done: false };
  tasks.push(task);
  return task;
}

function deleteTask(id) {
  const index = tasks.findIndex((t) => t.id === id);
  if (index === -1) return false;
  tasks.splice(index, 1);
  return true;
}

module.exports = { listTasks, getTask, createTask, deleteTask };
```

*What just happened:* the in-memory array and the operations on it now live in one
place, behind named functions. Notice there's not a single `res.json` or status code
in here — the service returns data (`getTask` returns the task or `undefined`,
`deleteTask` returns `true`/`false`) and lets the caller decide what HTTP means. This
is exactly the seam Phase 5 promised: swap this file for one backed by a real
database and the controllers above it don't change.

### The controller: read the request, shape the response

The controller is the *only* layer that touches `req` and `res`. It parses input,
calls the service, and translates the result into HTTP.

```javascript
// controllers/tasks.controller.js
const service = require('../services/tasks.service');

function list(req, res) {
  res.json(service.listTasks());
}

function getOne(req, res) {
  const task = service.getTask(Number(req.params.id));
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  res.json(task);
}

function create(req, res) {
  const { title } = req.body;
  if (typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json({ error: 'title is required' });
  }
  res.status(201).json(service.createTask(title.trim()));
}

function remove(req, res) {
  const deleted = service.deleteTask(Number(req.params.id));
  if (!deleted) {
    return res.status(404).json({ error: 'Task not found' });
  }
  res.sendStatus(204);
}

module.exports = { list, getOne, create, remove };
```

*What just happened:* each function is *thin* — parse → call service → respond. The
`Number(req.params.id)` coercion and the `return res.status(...)` discipline from
Phase 5 still live here, because those are genuinely HTTP concerns. But the "find it,
mutate the array" mechanics are gone — they moved down to the service. A controller
should read like a description of the request/response contract, nothing more.

### The routes: pure wiring

The route file does one job: connect a method and path to a controller function. No
logic, no validation, no `res` — just the map.

```javascript
// routes/tasks.routes.js
const express = require('express');
const controller = require('../controllers/tasks.controller');

const router = express.Router();

router.get('/', controller.list);
router.get('/:id', controller.getOne);
router.post('/', controller.create);
router.delete('/:id', controller.remove);

module.exports = router;
```

*What just happened:* this is the Phase 5 router, stripped down to the wiring. You can
read the entire surface of the resource in five lines — which is exactly what you want
when you come back in six months trying to remember "wait, what URLs does this thing
answer?"

### app.js vs server.js: build it, then start it

This is the split that trips people up, so let's be deliberate. `app.js` assembles the
application and **exports** it — it does not call `listen`. `server.js` imports that
app and starts listening.

```javascript
// app.js
const express = require('express');
const tasksRoutes = require('./routes/tasks.routes');
const errorHandler = require('./middleware/error-handler');

const app = express();

app.use(express.json());
app.use(express.static('public'));
app.use('/api/tasks', tasksRoutes);

app.use(errorHandler); // error-handling middleware goes LAST

module.exports = app;
```

```javascript
// server.js
const app = require('./app');

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Tasks API on http://localhost:${port}`);
});
```

*What just happened:* `app.js` is now a pure *recipe* for an Express app — middleware,
routers, error handler, in the right order (`express.json()` before the routes that
need a parsed body; the error handler dead last, as Phase 6 drilled in). It hands back
a fully-built app and stops there. `server.js` is the one place that actually opens a
port.

📝 **Why this split is worth the extra file.** A test wants to fire requests at your
app — but it does *not* want a real server squatting on port 3000 (tests run in
parallel, ports collide, and a left-open server hangs the test run). Because `app.js`
exports the app *without* listening, a test can do `require('./app')` and hand it
straight to a tool like supertest, which drives the app in-memory. No port, no
`listen`, no cleanup. That's precisely what [Phase 8](08-testing-and-production.md)
does — and it only works because you drew this line here.

## Config via the environment

One thing was hiding in `server.js` above: `process.env.PORT`. That's the start of the
last piece — **configuration belongs in the environment, not in your code.**

The same app runs on your laptop, in CI, and in production, and each place needs
different settings: a different port, a different database URL, different API keys.
Hard-coding those means editing source every time you deploy and — far worse —
committing secrets into git. The fix is `process.env`: Node hands you every
environment variable on that object.

```javascript
const port = process.env.PORT || 3000;
const databaseUrl = process.env.DATABASE_URL;
```

*What just happened:* `process.env.PORT` reads whatever the environment provides; the
`|| 3000` is a sensible fallback for local dev. In production your host (Render,
Railway, Fly, a Docker `ENV`, whatever) sets `PORT` and `DATABASE_URL` for you, and
the same code picks them up with zero edits.

But typing `PORT=3000 DATABASE_URL=... node server.js` every time you develop is
miserable. In dev, you keep those in a `.env` file and load it. Two ways:

```bash
# Option A — the dotenv package (works on any Node version)
npm install dotenv
```

```javascript
// at the very top of server.js, before anything reads process.env
require('dotenv').config();
```

```bash
# Option B — Node's built-in flag (Node 20.6+, no package needed)
node --env-file=.env server.js
```

*What just happened:* both read a `.env` file like the one below and load each line
into `process.env` before your code runs. `dotenv` is the long-standing package that
works everywhere; `--env-file` is the newer built-in that needs no dependency. Pick
one — they do the same job.

```bash
# .env  — values for local development only
PORT=3000
DATABASE_URL=postgres://localhost:5432/tasks_dev
```

⚠️ **Never commit `.env`, and never hard-code secrets.** Add `.env` to your
`.gitignore` on day one. A real secret (a database password, an API key) checked into
git is checked in *forever* — it lives in the history even after you delete it, and
scanners find leaked keys within minutes. The convention is to commit a
`.env.example` with the *keys* but **fake values**, so a teammate knows what to set
without ever seeing the real thing. In production, you don't use a `.env` file at all —
you set real environment variables through your host's dashboard or secrets manager.

## Why all this splitting pays off

Step back and look at what the refactor bought you. The controllers are thin — they
describe the HTTP contract and nothing else. The logic sits in a service with no web
dependencies, so you can test it as plain functions. The routes are a five-line map of
the resource. And `app.js` builds an app that a test can import without ever opening a
port.

💡 That last point is the throughline into the next phase: **the layered split keeps
handlers thin and logic testable — Node's take on MVC.** You didn't restructure for
the sake of tidiness; you restructured so that Phase 8 can write real tests against
real code without fighting the framework.

## Recap

- Split a growing app **by responsibility**, not by file length: routes (wiring),
  controllers (HTTP), services (logic + data), middleware (the chain).
- `express.static('public')` serves a folder of files at the site root — perfect for a
  built frontend or assets; add `{ maxAge: '1d' }` to let browsers cache them.
- Separate **building the app** (`app.js`, exports the app, no `listen`) from
  **starting it** (`server.js`, calls `app.listen`) — so tests can import the app
  without a running server.
- Read config from `process.env` (`PORT`, `DATABASE_URL`); load a `.env` in dev via
  `dotenv` or Node's built-in `--env-file`.
- Never commit `.env` or hard-code secrets — gitignore it, ship a `.env.example` with
  fake values, and set real env vars in production.

## Quick check

```quiz
[
  {
    "q": "Why does app.js export the app instead of calling app.listen() itself?",
    "choices": ["Because express.json() requires it", "So tests can import the fully-built app and drive it without starting a real server on a port", "Because app.listen only works in production", "To make the file shorter"],
    "answer": 1,
    "explain": "Splitting build (app.js) from start (server.js) lets a test require the app and hand it to a tool like supertest in-memory — no port, no listen, no cleanup. That's what Phase 8 relies on."
  },
  {
    "q": "What does express.static('public') do?",
    "choices": ["Caches all API responses for one day", "Serves the files in the 'public' folder at the site root, with correct content types", "Disables dynamic routes", "Validates incoming JSON bodies"],
    "answer": 1,
    "explain": "It's built-in middleware that serves a folder of files (HTML, CSS, JS, images) at the root — public/index.html answers at /, public/styles.css at /styles.css."
  },
  {
    "q": "Where should the database URL and port come from, and how do you handle secrets?",
    "choices": ["Hard-coded in app.js and committed to git", "From process.env, loaded from a .env in dev that is gitignored; set real env vars in production", "Always passed as command-line arguments by hand", "Stored in the public folder so the frontend can read them"],
    "answer": 1,
    "explain": "Config belongs in the environment (process.env). In dev, load a .env via dotenv or --env-file, but gitignore it and never commit secrets; production sets real environment variables through the host."
  }
]
```

[← Phase 6: Error Handling](06-error-handling.md) · [Guide overview](_guide.md) · [Phase 8: Testing & Production →](08-testing-and-production.md)
