---
title: "Serving & Structuring an App"
guide: "express-from-zero"
phase: 7
summary: "Grow the one-file tasks API into a real shape: serve static files, split by responsibility into routes/controllers/services, separate app-building from server-starting, and read config from the environment."
tags: [express, javascript, static-files, structure, config]
difficulty: intermediate
synonyms: ["express static files", "express project structure", "express routes controllers services", "express config env", "express app vs server", "express dotenv"]
updated: 2026-07-10
---

# Serving & Structuring an App

Up to now the tasks API has lived in one file — the easiest thing to read while learning the shapes.
But every real app outgrows a single file, and the way it grows isn't random. There's a standard
Express layout you'll recognize in nearly every Node codebase you open.

## The mental model: split by responsibility

You don't split a growing app by *file size* — you split it by **responsibility**. Each piece answers
one question:

- **Routes** — *which URL maps to which handler?* (the wiring)
- **Controllers** — *how do I read the HTTP request and shape the HTTP response?* (the web layer)
- **Services** — *what's the actual business logic and data access?* (the brains)
- **Middleware** — *what runs in the chain around the handlers?* (auth, error handling)

One more split, easy to miss, that pays off hugely: **building the app** is a different job from
**starting the server**. `app.js` assembles the middleware and routers and exports the app; `server.js`
imports it and calls `app.listen`.

💡 This is the Node echo of MVC. Routes point at controllers, controllers stay thin and delegate to
services, services hold the logic. Keep handlers thin and the logic lands somewhere you can test
without spinning up a web server.

First, a quick win that needs almost no structure: serving files.

## Serving static files

A backend rarely serves only JSON — sooner or later you have a built frontend, images, a PDF, a
favicon, plain files to hand the browser as-is. Express has one line for that.

```javascript
const express = require('express');
const app = express();

app.use(express.static('public'));

app.listen(3000);
```

*What just happened:* `express.static('public')` is built-in middleware that serves everything inside
a `public` folder at the **root** of your site. `public/index.html` answers at `http://localhost:3000/`;
`public/styles.css` answers at `/styles.css`. Images, JS bundles, fonts — all served automatically with
the right headers, no routes written. This is how you'd serve a built React/Svelte/Vue frontend out of
the same Express app that serves your API.

📝 The path is relative to where you *start the process*, not where `express.static` is called from —
use `path.join(__dirname, 'public')` if you ever run the server from a different directory.

For assets that don't change often, add `{ maxAge: '1d' }` — `app.use(express.static('public', { maxAge: '1d' }))`
sets `Cache-Control: max-age=86400` so browsers hold the files for a day instead of re-fetching every
load. (Files that *do* change typically rely on hashed filenames so a new build gets a new URL.)

## Structure beyond one file

Now the real refactor: spread the tasks API from [Phase 5](05-building-a-rest-api.md) and
[Phase 6](06-error-handling.md) across the standard layout. **Nothing about the behavior changes** —
same routes, same status codes, same logic. We're only moving code into the box that matches its job.

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

The service knows nothing about `req` or `res`. It deals in plain data and throws plain errors — the
whole point is that it's testable without a web server.

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

*What just happened:* the array and its operations now live behind named functions, with no `res.json`
or status code — the service returns data (`getTask` returns the task or `undefined`) and lets the
caller decide what HTTP means. This is the seam Phase 5 promised: swap this file for one backed by a
real database and the controllers above it don't change.

### The controller: read the request, shape the response

The controller is the *only* layer that touches `req` and `res`. It parses input, calls the service,
and translates the result into HTTP.

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
`Number(req.params.id)` coercion and `return res.status(...)` discipline from Phase 5 still live here,
since those are genuinely HTTP concerns; the "find it, mutate the array" mechanics moved to the service.
A controller should read like a description of the request/response contract, nothing more.

### The routes: pure wiring

The route file does one job: connect a method and path to a controller function. No logic, no
validation, no `res` — just the map.

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

*What just happened:* this is the Phase 5 router, stripped to the wiring. You can read the entire
surface of the resource in five lines — exactly what you want coming back in six months to remember
"what URLs does this thing answer?"

### app.js vs server.js: build it, then start it

This is the split that trips people up. `app.js` assembles the application and **exports** it — it does
not call `listen`. `server.js` imports that app and starts listening.

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

*What just happened:* `app.js` is now a pure *recipe* for an Express app — middleware, routers, error
handler, in the right order (`express.json()` before routes that need a parsed body; the error handler
dead last, per Phase 6). `server.js` is the one place that actually opens a port.

📝 **Why this split is worth the extra file.** A test wants to fire requests at your app, not squat a
real server on port 3000 (tests run in parallel, ports collide, a left-open server hangs the run).
Because `app.js` exports the app *without* listening, a test can `require('./app')` and hand it to a
tool like supertest, which drives it in-memory — no port, no `listen`, no cleanup. That's exactly what
[Phase 8](08-testing-and-production.md) does.

## Config via the environment

`server.js` used `process.env.PORT` — the start of the last piece: **configuration belongs in the
environment, not in your code.**

The same app runs on your laptop, in CI, and in production, and each needs different settings: a
different port, database URL, API keys. Hard-coding those means editing source on every deploy and,
far worse, committing secrets into git. The fix is `process.env` — Node hands you every environment
variable on that object.

```javascript
const port = process.env.PORT || 3000;
const databaseUrl = process.env.DATABASE_URL;
```

*What just happened:* `process.env.PORT` reads whatever the environment provides; `|| 3000` is a
fallback for local dev. Your host (Render, Railway, Fly, a Docker `ENV`) sets `PORT` and
`DATABASE_URL` in production, and the same code picks them up with zero edits.

Typing `PORT=3000 DATABASE_URL=... node server.js` every time is miserable. In dev, keep those in a
`.env` file and load it. Two ways:

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

*What just happened:* both read a `.env` file like the one below and load each line into `process.env`
before your code runs. `dotenv` is the long-standing package that works everywhere; `--env-file` is the
newer built-in needing no dependency — pick one.

```bash
# .env  — values for local development only
PORT=3000
DATABASE_URL=postgres://localhost:5432/tasks_dev
```

⚠️ **Never commit `.env`, and never hard-code secrets.** Add `.env` to `.gitignore` on day one. A real
secret checked into git is checked in *forever* — it lives in history even after you delete it, and
scanners find leaked keys within minutes. Commit a `.env.example` with the *keys* but **fake values**,
so a teammate knows what to set without seeing the real thing. In production, you don't use a `.env`
file at all — set real environment variables through your host's dashboard or secrets manager.

## Why all this splitting pays off

The controllers are thin — they describe the HTTP contract and nothing else. The logic sits in a
service with no web dependencies, so you can test it as plain functions. The routes are a five-line map
of the resource. And `app.js` builds an app that a test can import without ever opening a port.

💡 That's the throughline into the next phase: **the layered split keeps handlers thin and logic
testable — Node's take on MVC.** You restructured so Phase 8 can write real tests against real code
without fighting the framework.

## Recap

- Split a growing app **by responsibility**, not by file length: routes (wiring), controllers (HTTP),
  services (logic + data), middleware (the chain).
- `express.static('public')` serves a folder of files at the site root — perfect for a built frontend
  or assets; add `{ maxAge: '1d' }` to let browsers cache them.
- Separate **building the app** (`app.js`, exports the app, no `listen`) from **starting it**
  (`server.js`, calls `app.listen`) — so tests can import the app without a running server.
- Read config from `process.env` (`PORT`, `DATABASE_URL`); load a `.env` in dev via `dotenv` or Node's
  built-in `--env-file`.
- Never commit `.env` or hard-code secrets — gitignore it, ship a `.env.example` with fake values, and
  set real env vars in production.

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
