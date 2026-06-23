---
title: "Async, Streams & Structure"
guide: "build-a-server-with-node-http"
phase: 6
summary: "Real node:http servers are async, stream data instead of buffering it, shut down gracefully on SIGTERM, and split one growing file into modules. The production-shaped version of everything you've built."
tags: [node, nodejs, http, async, streams, graceful-shutdown]
difficulty: advanced
synonyms: ["node async handlers", "node streams pipe response", "node graceful shutdown", "node server.close", "node http error handling", "node server structure"]
updated: 2026-06-23
---

# Async, Streams & Structure

You've got a working messages API now ([A JSON REST API With No Framework](05-rest-api-no-framework.md)). It routes, it parses bodies, it does CRUD. But it's the demo version. The thing you'd actually deploy is shaped differently in four ways, and I want you to hold all four at once before we touch code:

📝 **Real servers are async, they stream data instead of buffering it, they fail gracefully, and they're split into modules.** That's the whole phase. Your handlers will `await` things (a database, a file read), so an error inside them has to be caught or the request hangs. Big responses get *piped* through `res` instead of loaded into memory. A deploy or restart needs to drain in-flight requests instead of severing them. And the one-file server splits into `store.js`, `router.js`, `handlers.js`, `http-helpers.js`, and `server.js`. None of these are framework features — they're the same `node:http` you already know, grown up.

## Async handlers, and the error that hangs

The moment your handler does real work — reads from a database, calls another service, awaits `readJson` — it becomes `async`. And async handlers have a trap that bites everyone exactly once.

⚠️ **An unhandled rejection in an async handler does NOT auto-respond.** There's no framework standing behind your function to catch the throw and send a `500`. If an `await` rejects and nothing catches it, the request never gets a response — it hangs until the client times out, or the rejection takes the whole process down. The connection just sits there. So you wrap your dispatch in one `try/catch` at the top, and that single catch becomes the safety net for every handler underneath it:

```javascript
const http = require('node:http');

const server = http.createServer(async (req, res) => {
  try {
    await route(req, res);
  } catch (err) {
    console.error(err);
    if (!res.headersSent) sendJson(res, 500, { error: 'Internal Server Error' });
  }
});
```

*What just happened:* the listener is now `async`, and `await route(req, res)` means any handler the router calls can reject and the rejection will surface right here in the `catch`. We log the real error server-side (you want the stack trace in your logs, not in the client's response) and send a generic `500`. The `if (!res.headersSent)` guard is the load-bearing part: `headersSent` is a boolean Node flips to `true` the instant `res.writeHead` runs. If the handler already started writing a response and *then* threw partway through, the headers are already on the wire — trying to send a second response would throw `ERR_HTTP_HEADERS_SENT` (the same double-write bug from [Middleware Is Just a Function](04-middleware-is-a-function.md)). The guard says "only send the 500 if nobody's responded yet." One `try/catch` at the dispatch boundary covers every async handler in the app — that's the pattern.

💡 This is the event loop biting you. An async handler that rejects without a catch is just an unhandled promise rejection, and Node's default for those is increasingly hostile (it can crash the process). If the mechanics of why `await` rejections behave this way feel fuzzy, [Async/Await and the Event Loop](/guides/async-await-and-the-event-loop) is the prerequisite — this phase assumes you've got that model.

## Streaming: `res` is a writable stream

Here's the `node:http` superpower most people never reach for. Up to now you've built responses in memory — `JSON.stringify(body)`, then `res.end(string)`. That's fine for small JSON. It's a disaster for a large file, because you'd load the entire thing into memory before sending a single byte. A 2 GB file means 2 GB of RAM, per request.

📝 **`res` is a writable stream, and `req` is a readable one.** That's not a metaphor — they're real Node stream objects. Which means you can take a readable stream (a file on disk) and *pipe* it straight into `res`, and Node moves the data through in small chunks. Constant memory, regardless of file size:

```javascript
const fs = require('node:fs');

function streamFile(req, res) {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  fs.createReadStream('big.json').pipe(res);
}
```

*What just happened:* `fs.createReadStream('big.json')` opens the file as a readable stream — it does *not* read the file into memory. `.pipe(res)` connects that readable to the writable response, and Node pumps the file through in chunks, handling backpressure for you (if the client reads slowly, Node slows the file read to match). `pipe` also calls `res.end()` automatically when the file is exhausted, so you don't. The one thing you *must* do first is `writeHead` with the right `Content-Type` — once data starts flowing through the pipe, the headers are locked. A 2 GB file streamed this way uses kilobytes of memory, not gigabytes.

💡 And `req` being a readable stream isn't new to you — it's what you've been consuming since Phase 2. When you read a request body by listening for `'data'` and `'end'` events, you were draining the `req` readable stream chunk by chunk. Reading the body and piping a file are the same mechanism pointed in opposite directions: `req` flows *in*, `res` flows *out*. Once you see both as streams, the body-reading code from earlier stops looking like boilerplate and starts looking like "consuming a readable," which is exactly what it is.

## Graceful shutdown: let in-flight requests finish

Your server doesn't run forever. It gets deployed over, restarted, scaled down — and when that happens, the orchestrator (a container runtime, systemd, whatever) sends your process a signal: `SIGTERM`, usually, or `SIGINT` when you hit Ctrl-C locally. The default behavior is brutal: the process dies immediately, and any request that was mid-response gets its connection severed. The client sees a dropped connection. A half-written database transaction. A truncated file download.

⚠️ **Without graceful shutdown, every deploy kills your in-flight requests.** On a busy server, a restart means a burst of errors for whoever happened to be mid-request. The fix is small — capture the server object and handle the signal:

```javascript
const server = http.createServer(/* ... */);
server.listen(3000, () => console.log('http://localhost:3000'));

process.on('SIGTERM', () => {
  server.close(() => {
    console.log('drained, exiting');
    process.exit(0);
  });
});
```

*What just happened:* `process.on('SIGTERM', ...)` registers a handler for the terminate signal. Inside it, `server.close(callback)` does two things: it stops accepting *new* connections immediately, and it waits for all *in-flight* requests to finish before calling your callback. So new traffic gets refused (the load balancer routes it elsewhere), the requests already being handled run to completion, and only then — once the server has fully drained — do we log and exit cleanly with code `0`. The deploy waits a few hundred milliseconds for the drain instead of guillotining live requests. Add a matching `process.on('SIGINT', ...)` if you want Ctrl-C to drain too. In production you'd also set a timeout so a stuck request can't block shutdown forever, but `server.close` is the core of it.

💡 This is the piece that turns a hobby server into something you can actually deploy. When you put this messages service behind a real deployment pipeline, graceful shutdown is what keeps rolling restarts invisible to users — see [Ship Your Side Project](/guides/ship-your-side-project) for where this fits in the deploy story.

## Structure: one file becomes five

Everything so far has lived in a single growing file, and it's gotten crowded — `createServer`, the router, every handler, the JSON helpers, the in-memory store, all stacked together. That's correct for *learning* (you can see the whole machine on one screen) and wrong for *maintaining*. As it grows you split it along the seams that are already there:

- **`store.js`** — the data layer. The messages array and the functions that touch it (`getAll`, `getById`, `create`, `remove`). Nothing here knows about HTTP.
- **`http-helpers.js`** — `readJson(req)` and `sendJson(res, status, body)`. The reusable request/response plumbing.
- **`handlers.js`** — the operations. `listMessages`, `createMessage`, etc. — each reads the request, calls the store, sends a response.
- **`router.js`** — the dispatch. Matches method + path and calls the right handler (the `route` function from Phase 3).
- **`server.js`** — wires it together: `createServer` with the `try/catch`, then `listen`, plus the shutdown handler.

📝 The one split that matters most: **separate creating the server from calling `listen` on it.** Have `server.js` (or a small `app.js`) build and *export* the server object, and let the entry point be the only thing that calls `.listen(3000)`. Why? Because now a test can `require` your server, fire requests at it without ever binding to a port, and assert on the responses — no live socket, no port conflicts in CI. The server-as-a-value, listen-separately pattern is exactly the testability discipline Express formalizes when you `module.exports = app` and let the test runner drive it. You're setting up for the next phase.

These five files are still pure `node:http`. Nothing changed about how the server *works* — you just drew lines between the data, the plumbing, the operations, the routing, and the wiring, so each piece can be read, tested, and changed on its own. That separation of concerns is the last thing standing between your hand-rolled server and the structure a framework hands you for free.

## Recap

- **Handlers become `async`** the moment they do real work, and an unhandled rejection inside one will NOT auto-respond — the request hangs or the process crashes. Wrap dispatch in one top-level `try/catch` and send a `500`.
- **Guard the 500 with `if (!res.headersSent)`** — if a handler already started writing before it threw, a second response triggers `ERR_HTTP_HEADERS_SENT`.
- **`res` is a writable stream and `req` is a readable one.** Pipe a file straight into the response (`fs.createReadStream(...).pipe(res)`) for constant memory regardless of size. Set `Content-Type` first. Reading a body is just consuming the `req` stream.
- **Graceful shutdown** means handling `SIGTERM`/`SIGINT` with `server.close(cb)`: stop accepting new connections, let in-flight ones finish, then exit. Without it, every deploy severs live requests.
- **Split the one file into modules** — `store`, `http-helpers`, `handlers`, `router`, `server` — along the seams already in the code.
- **Separate building the server from calling `listen`** so tests can drive it without binding a port — the same testability idea Express formalizes.

## Quick check

```quiz
[
  {
    "q": "An async handler awaits a database call that rejects, and nothing catches it. With no try/catch around dispatch, what happens?",
    "choices": ["Node automatically sends a 500 response", "The request gets no response — it hangs, and the unhandled rejection can crash the process", "The handler is retried automatically", "The client receives the raw error and stack trace"],
    "answer": 1,
    "explain": "There's no framework behind your handler to catch the throw. An unhandled rejection means the request never gets a response and Node may crash the process — so you wrap dispatch in a try/catch and send a 500 yourself."
  },
  {
    "q": "Why pipe a large file with fs.createReadStream('big.json').pipe(res) instead of reading it and calling res.end()?",
    "choices": ["pipe is faster to type", "Streaming sends the file in chunks, using constant memory regardless of file size, instead of loading the whole file into RAM", "res.end can't send files", "pipe sets the Content-Type automatically"],
    "answer": 1,
    "explain": "res is a writable stream, so piping a readable file into it moves data in small chunks with constant memory. Reading the whole file first would load all of it into RAM — fatal for large files."
  },
  {
    "q": "What does server.close(callback) do when called on SIGTERM?",
    "choices": ["Kills all connections instantly, then runs the callback", "Stops accepting new connections, waits for in-flight requests to finish, then runs the callback", "Closes only idle connections and leaves the server listening", "Restarts the server on a new port"],
    "answer": 1,
    "explain": "server.close stops accepting new connections immediately but lets in-flight requests complete, calling the callback once the server has fully drained — so a deploy doesn't sever live requests."
  }
]
```

---

[← Phase 5: A JSON REST API With No Framework](05-rest-api-no-framework.md) · [Guide overview](_guide.md) · [Phase 7: What Express Adds →](07-what-express-adds.md)
