---
title: "Handling Requests & Responses"
guide: "build-a-server-with-node-http"
phase: 2
summary: "Read method, URL, headers, and the body-stream off req; write a status, headers, and JSON to res. The manual request/response work that express.json() hides from you."
tags: [node, nodejs, http, request, response, json]
difficulty: intermediate
synonyms: ["node req res", "node read request body", "node write json response", "node IncomingMessage ServerResponse", "node http headers status", "node parse url"]
updated: 2026-07-10
---

# Handling Requests & Responses

In [Phase 1](01-the-mental-model.md) you stood up a server and watched it call your `(req, res)`
function for every request. That function is the whole job — everything a web server does, reading what
came in and deciding what to send back, happens inside it. Let's get specific about the two objects
you've been handed.

## The mental model: read from `req`, write to `res`

Here's the picture to carry through this phase:

- **`req` is the incoming request.** You *read* from it: the method, the URL, the headers, and — the
  awkward one — the body. It's a **readable stream**, which matters for the body and nothing else.
- **`res` is the outgoing response.** You *write* to it: a status code, some headers, and a body.
  It's a **writable stream**.

That's the entire dance. A handler reads `req` and writes `res`. There is no built-in "give me the
JSON body" and no built-in "send this object as JSON" — both directions are manual, and in this phase
you'll write the two small helpers that do them. When you later see `express.json()` and `res.json()`,
you'll recognize them as exactly these helpers, pre-installed.

> 📝 We're building a **messages** service throughout this guide — a list of `{ id, text }` objects.
> This phase is about the plumbing for one request; [Phase 5](05-rest-api-no-framework.md) wires it
> into full CRUD. For now, focus on getting data *in* and JSON *out*.

## Reading the request: method, URL, headers

The easy parts come for free as plain properties on `req`:

```javascript
const http = require('node:http');

const server = http.createServer((req, res) => {
  console.log(req.method);           // 'GET', 'POST', 'DELETE', ...
  console.log(req.url);              // '/messages?limit=5'
  console.log(req.headers['host']); // 'localhost:3000'

  res.end('ok');
});

server.listen(3000);
```

*What just happened:* `req.method` and `req.url` tell you what the client asked for, and `req.headers`
is a plain object of every header (keys are lowercased for you — always `req.headers['host']`, never
`'Host'`). No parsing required; these are populated the moment your function runs.

One trap: `req.url` is **not** a tidy path. It's everything after the host — path *and* query string
smooshed together, like `/messages?limit=5`. Picking it apart by hand with string splits is
error-prone, so don't. Node ships the `URL` class for exactly this:

```javascript
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');

  console.log(url.pathname);                  // '/messages'
  console.log(url.searchParams.get('limit')); // '5'  (a string, or null if absent)

  res.end('ok');
});
```

*What just happened:* `new URL(...)` needs a full absolute URL, but `req.url` is only a path — so we
hand it a throwaway base of `'http://localhost'` just to satisfy the parser. We never use that base
for anything; we only read `url.pathname` (the clean route) and `url.searchParams` (a tiny key/value
API over the query string). `searchParams.get` always returns a string or `null`, so remember to
convert when you want a number: `Number(url.searchParams.get('limit'))`.

## ⚠️ Reading the body: it arrives as a stream, not a string

This is the part that surprises people coming from frameworks. When a client `POST`s JSON, **the body
is not sitting on `req` waiting for you.** `req` is a readable stream, and the body shows up in pieces
("chunks") over time. You have to listen for those chunks, stitch them together, and only *then* parse.

Here's the helper that does it — read it slowly, it's the heart of this phase:

```javascript
function readJson(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}
```

*What just happened:* we wrap the stream in a Promise so callers can `await readJson(req)` instead of
juggling events. The `'data'` event fires once per chunk and we append each to a string. The `'end'`
event fires when the body is fully received — that's where we parse, defaulting to `{}` if the body
was empty (a body-less POST shouldn't crash). `JSON.parse` sits inside a `try/catch` because a client
can send garbage, and a parse error should `reject` cleanly rather than throw out of the event callback
where nothing can catch it. The `'error'` event handles the stream itself dying mid-transfer.

> 💡 This helper *is* `express.json()`. When you write `app.use(express.json())` in Express, this exact
> collect-chunks-then-parse logic runs before your route, and the result lands on `req.body`. The
> framework didn't invent a feature — it bundled this boilerplate so you stop rewriting it.

Using it in a handler:

```javascript
const server = http.createServer(async (req, res) => {
  if (req.method === 'POST') {
    let data;
    try {
      data = await readJson(req);
    } catch {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid JSON' }));
      return;
    }
    console.log('client sent:', data.text);
  }
  res.end('ok');
});
```

*What just happened:* the handler is now `async` so we can `await` the body. If `readJson` rejects —
malformed JSON, a broken connection — we catch it and answer **400 Bad Request** instead of letting the
whole server crash. Notice the `return` after sending the error: without it, execution falls through
and tries to respond a second time, which throws (more on that ordering rule next).

⚠️ One more guard for the real world: this helper appends every chunk with no limit, so a malicious
client could stream gigabytes and exhaust your memory. In production you'd cap `body.length` and
`reject` once it crosses a threshold (a few hundred KB is plenty for JSON). Express's `json()` does
this too, via its `limit` option.

## Writing JSON: status, headers, body — in that order

Sending a response is three moves: set the status and headers, serialize your data, end the stream.
Here's the companion helper:

```javascript
function sendJson(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}
```

*What just happened:* `res.writeHead(status, headers)` sets the status line and headers in one call.
`JSON.stringify(data)` turns your object into the wire format, and `res.end(...)` writes that string
and closes the response. We set `Content-Type: application/json` so the client knows it's getting
JSON, not plain text. Now `sendJson(res, 200, { messages: [...] })` replaces four lines with one.

⚠️ **Order is not optional.** Headers and status must be set *before* you write any body. The first
`res.write()` or `res.end()` "flushes the head" — sends the status line and headers down the wire, and
after that they're locked. Try to set a header afterward and Node throws the error every Node dev meets
eventually:

```javascript
// WRONG — throws "Cannot set headers after they are sent to the client"
res.end(JSON.stringify({ ok: true }));   // body goes out, head is now flushed
res.writeHead(200);                      // too late — head already left the building
```

*What just happened:* `res.end(...)` already committed the status and headers, so the later
`writeHead` has nothing to write into. The fix is always the same: `writeHead` (or `setHeader`) first,
body last. Hitting this is almost always a missing `return` after an early response — two code paths
both trying to answer the same request.

> 💡 `res.setHeader('X', 'y')` sets one header at a time and can be called repeatedly *before* the
> first write; `res.writeHead(status, {...})` sets the status plus a batch of headers in one shot.
> Same rule binds both: nothing after the body starts flowing.

### Status codes

The status code is just a number, and you can pass it straight to `writeHead`. The handful you'll use
constantly for a JSON API:

- **200** OK — a successful GET.
- **201** Created — you made a new resource (a fresh message).
- **204** No Content — success, but there's nothing to send back (e.g. a delete).
- **400** Bad Request — the client sent something wrong (that invalid JSON).
- **404** Not Found — no such route or resource.

If you'd rather not memorize numbers, `node:http` ships `http.STATUS_CODES` — a lookup from number to
its text, e.g. `http.STATUS_CODES[404]` is `'Not Found'`. Handy for building a generic error
responder.

**204 is the special one** — "No Content" means literally no body, so you set the status and end
immediately, writing nothing:

```javascript
function sendNoContent(res) {
  res.writeHead(204);
  res.end();          // no argument — no body, by definition
}
```

*What just happened:* a 204 promises an empty body, so we call `res.end()` with no argument — no
`Content-Type`, no stringify, nothing to describe. The right answer for a successful `DELETE
/messages/3`: it worked, and there's nothing meaningful to return.

## Recap

- A handler **reads from `req`** (method, URL, headers, body-stream) and **writes to `res`** (status,
  headers, body). Both are streams; JSON is manual in both directions.
- `req.method`, `req.url`, and `req.headers` are free properties. Parse `req.url` with
  `new URL(req.url, 'http://localhost')` to get `pathname` and `searchParams`.
- The body is **not** on `req` — it streams in as chunks. Collect them on `'data'`, parse on `'end'`,
  and guard invalid JSON with `try/catch`. That collect-and-parse helper is what `express.json()` does.
- Writing JSON is set-header, set-status, serialize, end — and **headers/status must come before any
  body write**, or you get "Cannot set headers after they are sent." A stray missing `return` is the
  usual culprit.
- Reach for the right status: 200/201/400/404, and **204 means no body at all** (`writeHead(204)` then
  `res.end()`).

## Quick check

```quiz
[
  {
    "q": "Why can't you read the request body directly off req.body in node:http?",
    "choices": ["req.body only works for GET requests", "req is a readable stream — the body arrives as chunks you must collect, then parse", "You must call req.parse() first", "node:http strips the body for security"],
    "answer": 1,
    "explain": "req is a readable stream. You listen for 'data' chunks, concatenate them, and parse on 'end'. That collect-and-parse work is exactly what express.json() bundles for you."
  },
  {
    "q": "You call res.end(JSON.stringify(data)) and then res.writeHead(200). What happens?",
    "choices": ["It works fine", "Node throws 'Cannot set headers after they are sent' — the first write already flushed the head", "The status silently defaults to 500", "writeHead overrides the body"],
    "answer": 1,
    "explain": "The first res.write/res.end flushes the status and headers. After that they're locked, so a later writeHead throws. Set status/headers before writing the body — a missing return is the usual cause."
  },
  {
    "q": "A successful DELETE /messages/3 has nothing to return. What's the right response?",
    "choices": ["200 with an empty {} body", "404 Not Found", "204 with writeHead(204) and res.end() — no body", "201 Created"],
    "answer": 2,
    "explain": "204 No Content means success with nothing to send. You set the status and call res.end() with no argument — no Content-Type, no stringify, no body."
  }
]
```

[← Phase 1: The node:http Mental Model](01-the-mental-model.md) · [Guide overview](_guide.md) · [Phase 3: Routing by Hand →](03-routing-by-hand.md)
