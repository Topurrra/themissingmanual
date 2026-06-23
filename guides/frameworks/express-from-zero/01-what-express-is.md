---
title: "What Express Is & Your First Server"
guide: "express-from-zero"
phase: 1
summary: "Express is the minimalist Node.js web framework — a thin layer over the built-in http module. Install it, write a tiny server, run it, and meet the one idea: the middleware chain."
tags: [express, javascript, nodejs, web, getting-started]
difficulty: beginner
synonyms: ["what is express", "express first server", "express hello world", "node express app", "express listen", "express minimal"]
updated: 2026-06-23
---

# What Express Is & Your First Server

You know [JavaScript](/guides/javascript-from-zero) — functions, callbacks, `async`/`await`,
modules. You want to put something on the web: an API a phone app or a frontend can talk to. You
*could* build it on Node's built-in HTTP server by hand ([that guide](/guides/build-a-server-with-node-http)
shows exactly how, and it's worth seeing once). But you'll quickly find yourself rewriting the same
plumbing — matching URLs, parsing bodies, sending JSON — for every project. That plumbing, packaged
into something small and well-worn, is **Express**.

Here's the one idea to hold before any code. Express is **deliberately tiny** — a thin layer wrapped
around the `node:http` module you'd otherwise use raw. It gives you two things: a clean way to
**route** requests, and a system called **middleware** for everything else. Body parsing, auth,
logging, validation? Those aren't built in — you add them as middleware when you need them. That
minimalism is Express's whole personality, and it's why a decade-plus of Node jobs, tutorials, and
production servers run on it. It's the framework you're most likely to meet.

📝 **Express** — the dominant minimalist web framework for Node.js. Small core (routing + middleware),
everything else bolted on. It doesn't replace Node's HTTP server; it sits on top of it and makes it
pleasant to use. If you've read [What a Framework Even Is](/guides/what-a-framework-even-is), Express
is the textbook case: a small, unopinionated one that stays out of your way.

## The mental model: a pipeline of functions

Before the code, the single picture that explains everything Express does.

💡 **An Express app is a pipeline of `(req, res, next)` functions, and a route is one of them bound
to a method and a path.** A request comes in, flows through an ordered chain of functions, and each
one can read the request, change it, send a response, or call `next()` to hand off to the next
function in line. That's it. Routing, body parsing, auth, error handling — they're all the same
shape (`(req, res, next)`) in different costumes. This chain is the heart of Express, and Phase 3 is
devoted to it. For now, hold the picture: **request → functions → response.**

A route is the simplest member of that family: a function bound to one HTTP method (like `GET`) and
one path (like `/`). Let's build one.

## Your first server

One install gets you the framework:

```bash
npm install express
```

*What just happened:* `npm` downloaded Express and its dependencies into `node_modules`, and recorded
it in your `package.json`. You now have the whole framework available to `require` (or `import`). This
assumes you've run `npm init -y` first to create a `package.json` — if you haven't, do that, then
install.

Now the smallest server that does something. Create a file called `index.js`:

```javascript
const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('Hello from Express');
});

app.listen(3000, () => console.log('listening on http://localhost:3000'));
```

*What just happened:* four moves, and they're the four you'll use forever.
- `const app = express();` calls the Express function to create your **application object** — the
  thing that holds your routes and middleware and, eventually, runs the show.
- `app.get('/', handler)` **registers a route**: "when a `GET` request arrives for the path `/`, run
  this handler." You never call the handler yourself — Express calls it when a matching request comes
  in. (That's the framework's *"don't call us, we'll call you"* relationship.)
- The handler receives `(req, res)` — the **request** (what the client sent) and the **response**
  (what you send back). `res.send('Hello from Express')` writes that string as the response body and
  finishes the request. Express sets sensible headers (like `Content-Type: text/html`) for you.
- `app.listen(3000, ...)` starts the underlying HTTP server and binds it to port 3000. The callback
  fires once it's up, so you know where to look.

Run it with plain Node — Express is just a library, there's no special CLI:

```bash
node index.js
```

```console
$ node index.js
listening on http://localhost:3000
```

*What just happened:* Node executed your file, Express handed its request handler to `node:http`, and
the server is now listening. It will keep running, waiting for requests, until you stop it with
`Ctrl+C`. Open a second terminal and hit it:

```bash
curl localhost:3000
```

```console
$ curl localhost:3000
Hello from Express
```

*What just happened:* `curl` sent a `GET /` request. Express matched it against the route you
registered, called your handler, and sent back the string. You have a working web server in seven
lines of real code.

⚠️ **The handler must end the request — exactly once.** Every request needs a response. If your
handler never calls `res.send` (or `res.json`, or `res.end`), the client just hangs until it times
out. And if you call `res.send` *twice* in one handler, Node throws `ERR_HTTP_HEADERS_SENT` — the
response was already sent, you can't send it again. One request, one response. Keep that in your
bones and a whole category of confusing bugs never happens.

> 📝 **CommonJS vs ESM.** The example uses `require` (CommonJS), the long-standing Node default and
> what most Express tutorials show. If your `package.json` has `"type": "module"`, use the modern ESM
> form instead: `import express from 'express';`. The rest is identical. We'll stick with `require`
> through this guide so examples are copy-paste runnable on any setup.

## Sending JSON, not just text

A string is fine for "hello world," but real backends usually speak JSON. Express has a dedicated
method for it. Add a second route:

```javascript
app.get('/', (req, res) => {
  res.send('Hello from Express');
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});
```

*What just happened:* `res.json(obj)` serializes a JavaScript object to a JSON string **and** sets
`Content-Type: application/json` automatically — so the client knows it's getting JSON, not plain
text. That header is the real difference between `res.send` and `res.json`. You *could* call
`res.send(JSON.stringify(obj))`, but then you'd be setting the content type yourself; `res.json` is
the honest, complete way to return JSON. (`res.send` is the generalist — it'll send strings, Buffers,
and even objects, guessing the type — but reach for `res.json` whenever you mean JSON.)

Restart the server (`Ctrl+C`, then `node index.js` — Node doesn't auto-reload on file changes; we'll
fix that in a later phase) and check the new route:

```console
$ curl localhost:3000/health
{"status":"ok","uptime":4.21}
```

*What just happened:* the request for `/health` matched the second route, Express called its handler,
serialized the object, and sent it back with the JSON content type. Two paths, two handlers, same
pattern — add a hundred routes and it's this idea a hundred times.

## The running example: a tasks API

One more thing before we go deeper. Across this guide we'll grow one real service so each concept
lands on something concrete instead of a toy. Meet the **tasks API** — a small to-do backend where
each task is an object shaped like this:

```javascript
const tasks = [
  { id: 1, title: 'Learn Express routing', done: false },
  { id: 2, title: 'Understand middleware', done: false },
];

app.get('/tasks', (req, res) => {
  res.json(tasks);
});
```

*What just happened:* `tasks` is just an in-memory array of objects, each with `id`, `title`, and
`done`. The `GET /tasks` route returns the whole list as JSON — the first endpoint of an API we'll
turn into full create/read/update/delete (CRUD) over the next phases. In-memory means the data resets
every time the server restarts; that's fine for learning, and we'll talk about real storage later.
Hitting it:

```console
$ curl localhost:3000/tasks
[{"id":1,"title":"Learn Express routing","done":false},{"id":2,"title":"Understand middleware","done":false}]
```

*What just happened:* the route returned the array, `res.json` serialized it, and `curl` printed the
JSON. You've now seen the entire shape of an Express endpoint — method, path, handler, response — and
you have a real API with one route. Next we make routes carry data (a task's `id` in the URL, query
strings, separate router files), which is **Phase 2: Routing**.

## Recap

1. **Express is the minimalist Node.js web framework** — a thin layer over the built-in `node:http`
   module. Small core (routing + middleware), everything else added on. Install with
   `npm install express`.
2. The one big idea: **an Express app is a pipeline of `(req, res, next)` functions, and a route is
   one bound to a method + path.** Routing, parsing, auth, and errors are all that one shape. (Full
   treatment in Phase 3.)
3. A first server is four moves: `const app = express()` creates the app; `app.get(path, handler)`
   registers a route; the handler gets `(req, res)`; `app.listen(port)` starts it. Run it with plain
   `node index.js` — Express has no special CLI.
4. **`res.send` vs `res.json`:** `res.send` is the generalist; `res.json(obj)` serializes an object
   *and* sets `Content-Type: application/json`. Use `res.json` whenever you mean JSON.
5. ⚠️ Every request needs **exactly one** response. Forget to respond and the client hangs; respond
   twice and Node throws `ERR_HTTP_HEADERS_SENT`.
6. Our running example is a **tasks API** (`{ id, title, done }`), starting from a single `GET /tasks`
   route and growing into full CRUD across the guide.

## Quick check

Three questions on what has to stick — what Express is, how a first server is wired, and how to
return JSON:

```quiz
[
  {
    "q": "What is Express, in one line?",
    "choices": [
      "A minimalist web framework that's a thin layer over Node's built-in http module, giving you routing and a middleware system",
      "A standalone web server written in C that replaces Node entirely",
      "A database for storing JSON documents in Node apps",
      "A frontend UI library for building components in the browser"
    ],
    "answer": 0,
    "explain": "Express is the dominant minimalist Node.js web framework. It doesn't replace Node's HTTP server — it sits on top of node:http and adds clean routing plus a middleware system, leaving everything else to middleware you add."
  },
  {
    "q": "In `app.get('/', (req, res) => { ... })`, what does this line do and who calls the handler?",
    "choices": [
      "It registers a route for GET requests to '/', and Express calls the handler when a matching request arrives",
      "It immediately runs the handler once and caches the result",
      "It sends a GET request to '/' and returns the response",
      "It defines a route but you must call the handler yourself in app.listen"
    ],
    "answer": 0,
    "explain": "app.get(path, handler) registers a route. You never call the handler yourself — Express matches incoming requests by method and path and calls the handler for you. That's the framework's 'don't call us, we'll call you' relationship."
  },
  {
    "q": "What does `res.json(obj)` do that `res.send(JSON.stringify(obj))` does not?",
    "choices": [
      "It serializes the object to JSON AND automatically sets the Content-Type header to application/json",
      "It saves the object to a database before responding",
      "It validates that the object matches a schema",
      "Nothing — they are exactly identical in every way"
    ],
    "answer": 0,
    "explain": "Both produce a JSON string, but res.json also sets Content-Type: application/json automatically, so the client knows it's receiving JSON. With res.send(JSON.stringify(obj)) you'd have to set that header yourself. Reach for res.json whenever you mean JSON."
  }
]
```

---

[Guide overview](_guide.md) · [Phase 2: Routing →](02-routing.md)
