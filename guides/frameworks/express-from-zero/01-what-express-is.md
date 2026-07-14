---
title: "What Express Is & Your First Server"
guide: "express-from-zero"
phase: 1
summary: "Express is the minimalist Node.js web framework - a thin layer over the built-in http module. Install it, write a tiny server, run it, and meet the one idea: the middleware chain."
tags: [express, javascript, nodejs, web, getting-started]
difficulty: beginner
synonyms: ["what is express", "express first server", "express hello world", "node express app", "express listen", "express minimal"]
updated: 2026-07-10
---

# What Express Is & Your First Server

You know [JavaScript](/guides/javascript-from-zero) and want to put something on the web - an API a
phone app or frontend can talk to. You could build it on Node's raw HTTP server ([that guide](/guides/build-a-server-with-node-http)
is worth seeing once), but you'd rewrite the same plumbing every time: matching URLs, parsing bodies,
sending JSON. That plumbing, packaged into something small and well-worn, is **Express**.

Express is **deliberately tiny** - a thin layer over `node:http`. It gives you two things: a clean way
to **route** requests, and a **middleware** system for everything else. Body parsing, auth, logging,
validation - none of that is built in; you add it as middleware when you need it. That minimalism is
why over a decade of Node jobs, tutorials, and production servers run on it. It's the framework you're
most likely to meet.

📝 **Express** - the dominant minimalist web framework for Node.js. Small core (routing + middleware),
everything else bolted on. It sits on top of Node's HTTP server rather than replacing it. If you've read
[What a Framework Even Is](/guides/what-a-framework-even-is), Express is the textbook case: small and
unopinionated, staying out of your way.

## The mental model: a pipeline of functions

💡 **An Express app is a pipeline of `(req, res, next)` functions, and a route is one of them bound to
a method and a path.** A request flows through an ordered chain; each function can read the request,
change it, send a response, or call `next()` to pass it along. Routing, body parsing, auth, error
handling - all the same shape, different costumes. This chain is the heart of Express (full treatment in
Phase 3). For now: **request → functions → response.**

A route is the simplest member of that family - a function bound to one HTTP method (`GET`) and one path
(`/`). Let's build one.

## Your first server

One install gets you the framework:

```bash
npm install express
```

*What just happened:* `npm` downloaded Express into `node_modules` and recorded it in `package.json`.
This assumes you've run `npm init -y` first - do that if you haven't.

Now the smallest server that does something. Create `index.js`:

```javascript
const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('Hello from Express');
});

app.listen(3000, () => console.log('listening on http://localhost:3000'));
```

*What just happened:* four moves you'll use forever.
- `const app = express();` creates your **application object** - it holds your routes and middleware.
- `app.get('/', handler)` **registers a route**: "when a `GET` request hits `/`, run this handler."
  You never call the handler yourself - Express calls it when a matching request arrives (the
  framework's *"don't call us, we'll call you"* relationship).
- The handler gets `(req, res)` - the **request** and the **response**. `res.send(...)` writes the
  string as the response body and finishes the request, with Express setting sensible headers for you.
- `app.listen(3000, ...)` starts the HTTP server on port 3000; the callback fires once it's up.

Run it with plain Node - Express is just a library, no special CLI:

```bash
node index.js
```

```console
$ node index.js
listening on http://localhost:3000
```

Open a second terminal and hit it:

```bash
curl localhost:3000
```

```console
$ curl localhost:3000
Hello from Express
```

*What just happened:* `curl` sent a `GET /` request, Express matched it to your route, called the
handler, and sent back the string. A working web server in seven lines.

⚠️ **The handler must end the request - exactly once.** Every request needs a response. If your handler
never calls `res.send` (or `res.json`, `res.end`), the client hangs until it times out. Call `res.send`
twice and Node throws `ERR_HTTP_HEADERS_SENT` - you can't send a response that's already been sent. One
request, one response.

> 📝 **CommonJS vs ESM.** The example uses `require` (CommonJS), the long-standing Node default. If your
> `package.json` has `"type": "module"`, use `import express from 'express';` instead - everything else
> is identical. We stick with `require` here so examples run on any setup.

## Sending JSON, not just text

A string is fine for "hello world," but real backends speak JSON. Add a second route:

```javascript
app.get('/', (req, res) => {
  res.send('Hello from Express');
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});
```

*What just happened:* `res.json(obj)` serializes an object to JSON **and** sets
`Content-Type: application/json` automatically - that header is the real difference from
`res.send(JSON.stringify(obj))`, which leaves you to set it yourself. `res.send` is the generalist
(strings, Buffers, even objects, guessing the type); reach for `res.json` whenever you mean JSON.

Restart the server (`Ctrl+C`, then `node index.js` - no auto-reload yet, that's a later phase) and
check the new route:

```console
$ curl localhost:3000/health
{"status":"ok","uptime":4.21}
```

*What just happened:* the request matched the second route, Express called its handler, serialized the
object, and sent it back with the JSON content type. Add a hundred routes and it's this idea a hundred
times.

## The running example: a tasks API

Across this guide we'll grow one real service so each concept lands on something concrete. Meet the
**tasks API** - a small to-do backend where each task looks like this:

```javascript
const tasks = [
  { id: 1, title: 'Learn Express routing', done: false },
  { id: 2, title: 'Understand middleware', done: false },
];

app.get('/tasks', (req, res) => {
  res.json(tasks);
});
```

*What just happened:* `tasks` is an in-memory array of objects. `GET /tasks` returns it as JSON - the
first endpoint of an API we'll grow into full create/read/update/delete (CRUD). In-memory means data
resets on restart; fine for learning, and we'll cover real storage later.

```console
$ curl localhost:3000/tasks
[{"id":1,"title":"Learn Express routing","done":false},{"id":2,"title":"Understand middleware","done":false}]
```

You've now seen the entire shape of an Express endpoint - method, path, handler, response. Next: routes
that carry data (a task's `id` in the URL, query strings, separate router files) - **Phase 2: Routing**.

## Recap

1. **Express is the minimalist Node.js web framework** - a thin layer over `node:http`. Small core
   (routing + middleware), everything else added on. Install with `npm install express`.
2. The big idea: **an Express app is a pipeline of `(req, res, next)` functions, and a route is one
   bound to a method + path.** Routing, parsing, auth, and errors are all that same shape (Phase 3).
3. A first server is four moves: `express()` creates the app; `app.get(path, handler)` registers a
   route; the handler gets `(req, res)`; `app.listen(port)` starts it. Run with plain `node index.js`.
4. **`res.send` vs `res.json`:** `res.json(obj)` serializes an object *and* sets
   `Content-Type: application/json`. Use it whenever you mean JSON.
5. ⚠️ Every request needs **exactly one** response. Skip it and the client hangs; respond twice and
   Node throws `ERR_HTTP_HEADERS_SENT`.
6. Our running example is a **tasks API** (`{ id, title, done }`), starting from `GET /tasks` and
   growing into full CRUD across the guide.

## Quick check

Three questions on what has to stick - what Express is, how a first server is wired, and how to
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
    "explain": "Express is the dominant minimalist Node.js web framework. It doesn't replace Node's HTTP server - it sits on top of node:http and adds clean routing plus a middleware system, leaving everything else to middleware you add."
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
    "explain": "app.get(path, handler) registers a route. You never call the handler yourself - Express matches incoming requests by method and path and calls the handler for you. That's the framework's 'don't call us, we'll call you' relationship."
  },
  {
    "q": "What does `res.json(obj)` do that `res.send(JSON.stringify(obj))` does not?",
    "choices": [
      "It serializes the object to JSON AND automatically sets the Content-Type header to application/json",
      "It saves the object to a database before responding",
      "It validates that the object matches a schema",
      "Nothing - they are exactly identical in every way"
    ],
    "answer": 0,
    "explain": "Both produce a JSON string, but res.json also sets Content-Type: application/json automatically, so the client knows it's receiving JSON. With res.send(JSON.stringify(obj)) you'd have to set that header yourself. Reach for res.json whenever you mean JSON."
  }
]
```

---

[Guide overview](_guide.md) · [Phase 2: Routing →](02-routing.md)
