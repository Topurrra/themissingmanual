---
title: "A JSON REST API With No Framework"
guide: "build-a-server-with-node-http"
phase: 5
summary: "Assemble the request/response helpers, hand-rolled routing, and middleware into a full CRUD messages API - five operations, manual validation, correct status codes, standard library only."
tags: [node, nodejs, http, rest, api, crud]
difficulty: advanced
synonyms: ["node rest api no framework", "node http crud", "node messages api", "node json api no express", "node http full server", "node crud by hand"]
updated: 2026-07-10
---

# A JSON REST API With No Framework

This is the payoff phase. Everything you built in the last three chapters - reading and writing JSON ([Phase 2](02-requests-and-responses.md)), dispatching by method and path ([Phase 3](03-routing-by-hand.md)), wrapping handlers in a logger ([Phase 4](04-middleware-is-a-function.md)) - has been one piece of the same machine. Now we bolt them together into a real, working REST API. No Express, no Fastify, no npm install - just `node:http` and the helpers you already wrote.

Here's the mental model to carry through this whole phase: **a REST resource is five operations, dispatched by method plus path.** That's the entire shape of CRUD.

| Operation | Method + path | Success status |
|-----------|---------------|----------------|
| List all | `GET /messages` | 200 OK |
| Read one | `GET /messages/:id` | 200 OK (or 404) |
| Create | `POST /messages` | 201 Created (or 400) |
| Update | `PUT /messages/:id` | 200 OK (or 404) |
| Delete | `DELETE /messages/:id` | 204 No Content (or 404) |

This is the *same five-operation shape* every framework hands you. The difference is that here you can see all of it - there's no magic layer doing the wiring. We're building the thing `app.get(...)` wraps. Once you've built it once by hand, the framework stops being mysterious and starts being a convenience you understand.

We're finishing the **messages** service that's run through the whole guide. Each message is `{ id, text }`.

## The server and the store

First, the foundation: one `http.createServer`, an in-memory store, and the helpers from earlier phases.

```javascript
import http from 'node:http';

// --- helpers from Phase 2 ---
function readJson(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try { resolve(body ? JSON.parse(body) : {}); }
      catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}

function sendJson(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

// --- the in-memory store ---
let messages = [];   // each item: { id, text }
let nextId = 1;
```

*What just happened:* we pulled in `readJson` and `sendJson` exactly as we wrote them in Phase 2 - no changes needed, the whole point of building them as standalone helpers. The store is two plain variables: an array of messages and a counter for the next id. No database, no ORM, nothing to install.

📝 Notice there are **no locks** anywhere, and that's correct, not lazy. Node runs your JavaScript on a single thread, so two requests never mutate `messages` at literally the same instant - one handler runs to its next `await` before another gets a turn. A multi-threaded server (Java, Go) needs synchronization around shared state; here you don't. (The flip side: this data vanishes when the process restarts. A real app swaps these two variables for a database - the only part that changes.)

## The five handlers

Each handler does one operation. They all read from `req` and answer with `sendJson` (or, for delete, a bare 204). Read them as a set - the symmetry is the lesson.

```javascript
// GET /messages - list all
function listMessages(req, res) {
  sendJson(res, 200, messages);
}

// GET /messages/:id - read one
function getMessage(req, res, id) {
  const msg = messages.find(m => m.id === id);
  if (!msg) return sendJson(res, 404, { error: 'Message not found' });
  sendJson(res, 200, msg);
}

// POST /messages - create
async function createMessage(req, res) {
  const body = await readJson(req);

  if (typeof body.text !== 'string' || body.text.trim() === '') {
    return sendJson(res, 400, { error: 'Field "text" is required and must be a non-empty string' });
  }

  const msg = { id: nextId++, text: body.text };
  messages.push(msg);
  sendJson(res, 201, msg);
}

// PUT /messages/:id - update
async function updateMessage(req, res, id) {
  const msg = messages.find(m => m.id === id);
  if (!msg) return sendJson(res, 404, { error: 'Message not found' });

  const body = await readJson(req);
  if (typeof body.text !== 'string' || body.text.trim() === '') {
    return sendJson(res, 400, { error: 'Field "text" is required and must be a non-empty string' });
  }

  msg.text = body.text;
  sendJson(res, 200, msg);
}

// DELETE /messages/:id - delete
function deleteMessage(req, res, id) {
  const index = messages.findIndex(m => m.id === id);
  if (index === -1) return sendJson(res, 404, { error: 'Message not found' });

  messages.splice(index, 1);
  res.writeHead(204);
  res.end();           // 204 = no body, by definition
}
```

*What just happened:* five operations, each mapping a status code to an outcome. `listMessages` always returns the array with 200. `getMessage` looks up by id and returns the message, or 404 if there's no match. `createMessage` and `updateMessage` both `await readJson(req)` then **validate `text` by hand** - if it's missing, not a string, or blank, they bail out with a 400 and never touch the store. `createMessage` mints a fresh id and answers 201 Created; `deleteMessage` removes the item and answers 204 with `res.end()` and no body. Every "not found" path `return`s early, so we never accidentally respond twice.

⚠️ That validation is doing real work - **never trust input.** A framework would give you a `body-parser` plus a schema validator; here, *you* are the validator. Check the shape before acting on it, and reject bad input with a 400 that says what was wrong. Without these guards, a client sending `{}` would create a message with `text: undefined`, and your "list" endpoint would start serving garbage.

## Wiring it together: dispatch

Now the part that ties the handlers to the wire. One `createServer` listener runs the logger from Phase 4, parses the path, and dispatches by method plus path - including the regex match for `/:id` from Phase 3 - all inside a `try/catch`.

```javascript
function log(req) {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
}

const server = http.createServer(async (req, res) => {
  log(req);   // middleware from Phase 4 - runs before any handler

  try {
    const url = new URL(req.url, 'http://localhost');
    const path = url.pathname;
    const idMatch = path.match(/^\/messages\/(\d+)$/);   // capture the :id

    // collection routes
    if (req.method === 'GET'  && path === '/messages') return listMessages(req, res);
    if (req.method === 'POST' && path === '/messages') return createMessage(req, res);

    // item routes (/messages/:id)
    if (idMatch) {
      const id = Number(idMatch[1]);
      if (req.method === 'GET')    return getMessage(req, res, id);
      if (req.method === 'PUT')    return updateMessage(req, res, id);
      if (req.method === 'DELETE') return deleteMessage(req, res, id);
    }

    sendJson(res, 404, { error: 'Not Found' });   // nothing matched
  } catch (err) {
    console.error(err);
    sendJson(res, 500, { error: 'Internal Server Error' });
  }
});

server.listen(3000, () => console.log('messages API on http://localhost:3000'));
```

*What just happened:* the listener is the conductor. It logs first (the entire "middleware" idea from Phase 4 - a function you call before the handler), parses the URL once, and runs the regex once to capture any `:id`. Then it dispatches: collection routes (`/messages`) by method, item routes (`/messages/:id`) by method, and a 404 fallthrough for anything else. Each match `return`s so dispatch stops at the first hit.

⚠️ The whole dispatch sits inside a `try/catch` for a reason: if any handler throws - a bug, unexpected input, `readJson` rejecting on malformed JSON - the `catch` turns it into a clean **500 Internal Server Error** instead of crashing the process or leaving the client hanging. This is your last line of defense (sturdier and more structured in [Phase 6](06-async-streams-structure.md), but even this minimal version is non-negotiable).

## Driving it with curl

Start the server (`node server.mjs`) and exercise all five operations. Here's a full session, including the failure cases - those matter as much as the happy path.

```bash
# Create one (201)
$ curl -s -X POST localhost:3000/messages -d '{"text":"hello"}'
{"id":1,"text":"hello"}

# Create another (201)
$ curl -s -X POST localhost:3000/messages -d '{"text":"world"}'
{"id":2,"text":"world"}

# List all (200)
$ curl -s localhost:3000/messages
[{"id":1,"text":"hello"},{"id":2,"text":"world"}]

# Read one (200)
$ curl -s localhost:3000/messages/1
{"id":1,"text":"hello"}

# Update (200)
$ curl -s -X PUT localhost:3000/messages/1 -d '{"text":"hi there"}'
{"id":1,"text":"hi there"}

# Delete (204 - no body comes back)
$ curl -s -i -X DELETE localhost:3000/messages/2 | head -1
HTTP/1.1 204 No Content

# --- the failure cases ---

# Missing text → 400
$ curl -s -X POST localhost:3000/messages -d '{}'
{"error":"Field \"text\" is required and must be a non-empty string"}

# No such id → 404
$ curl -s localhost:3000/messages/999
{"error":"Message not found"}
```

*What just happened:* every row is one of the five operations answering with the right status and body. The two failure cases are the important ones to internalize: a `POST` with no `text` gets a **400** and never enters the store, a `GET` for an id that doesn't exist gets a **404** - the guards from your handlers firing exactly as designed. A 204 delete returns no body at all (`-i` shows the status line - there's nothing else to show).

## You built a complete API - now count the cost

Step back and look at what this is. A fully working REST API: five CRUD operations, JSON in and out, path parameters, input validation, correct status codes (200/201/204/400/404/500), request logging, and a crash-proof error boundary. **Zero dependencies.** Your `node_modules` folder doesn't exist. You could ship this.

💡 But now count the boilerplate. To get those five routes you hand-wrote: URL parsing, a regex for `:id`, capture-group extraction, a method-and-path `if`-ladder, two near-identical validation blocks, the 404 fallthrough, and the `try/catch`. In [Express (Phase 7)](07-what-express-adds.md) the same API is `app.get`, `app.post`, `app.put`, `app.delete`, `express.json()`, and `req.params.id` - routing, body parsing, and param extraction all collapse into declarations. **That delta - everything you wrote here that Express writes for you - is precisely the value a framework adds.** You're not learning Express to skip understanding this; you're learning it *because* you now understand exactly what it's doing on your behalf, and can tell when you don't need it.

## Recap

- A REST resource is **five operations dispatched by method plus path** - list, read-one, create, update, delete - and that shape is identical to what every framework gives you.
- The store is a plain `let messages = []` and a `nextId` counter; **Node's single thread means no locks** on shared state, but the data is in-memory and vanishes on restart (a real app uses a DB).
- One `createServer` listener runs the logger, parses the URL, dispatches by method/path (regex for `/:id`), and answers with `sendJson` - reusing the Phase 2–4 pieces unchanged.
- **Validate every input by hand** - reject missing or non-string `text` with a 400 before touching the store; never trust the client.
- Wrap the whole dispatch in a `try/catch` so any thrown error becomes a clean **500** instead of a crash (deepened in [Phase 6](06-async-streams-structure.md)).
- This is a complete, dependency-free API - and the boilerplate it took is exactly what a framework removes.

## Quick check

```quiz
[
  {
    "q": "Why does this in-memory messages store need no locks around `messages.push(...)`?",
    "choices": ["Arrays in JavaScript are immutable", "Node runs your JS on a single thread, so two handlers never mutate it at the same instant", "node:http serializes every request through a queue you configure", "The `let` keyword makes the variable thread-safe"],
    "answer": 1,
    "explain": "Node executes your JavaScript on one thread. A handler runs until its next await before another gets a turn, so shared in-memory state is never touched concurrently - unlike a multi-threaded server."
  },
  {
    "q": "A client sends POST /messages with body {} (no text field). What should the handler do?",
    "choices": ["Create a message with text: undefined and return 201", "Return 400 Bad Request and not touch the store", "Return 404 Not Found", "Return 204 No Content"],
    "answer": 1,
    "explain": "You validate input by hand: if `text` is missing or not a non-empty string, respond 400 and never add to the store. Trusting the client would serve garbage from your list endpoint."
  },
  {
    "q": "Why is the whole dispatch wrapped in a try/catch?",
    "choices": ["To make the handlers run faster", "So a thrown error becomes a clean 500 instead of crashing the process or hanging the client", "Because await can only be used inside try/catch", "To automatically retry failed requests"],
    "answer": 1,
    "explain": "Any handler can throw - a bug, bad input, a rejected readJson. The catch converts that into a 500 Internal Server Error response, keeping the server alive and the client informed."
  }
]
```

[← Phase 4: Middleware Is Just a Function](04-middleware-is-a-function.md) · [Guide overview](_guide.md) · [Phase 6: Async, Streams & Structure →](06-async-streams-structure.md)
