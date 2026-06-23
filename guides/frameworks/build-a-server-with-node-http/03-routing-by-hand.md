---
title: "Routing by Hand"
guide: "build-a-server-with-node-http"
phase: 3
summary: "node:http has no router — you dispatch by inspecting req.method and the URL yourself, match path params with regex, and watch the if-ladder grow into the exact problem Express solves."
tags: [node, nodejs, http, routing, url]
difficulty: intermediate
synonyms: ["node routing by hand", "node http router", "node switch method url", "node match path", "why express router", "node url pattern"]
updated: 2026-06-23
---

# Routing by Hand

Here's the thing nobody tells you when you first open `node:http`: there is no router. None. When a request arrives, Node hands your one `(req, res)` listener the whole thing and says "you figure out what they wanted." `app.get('/messages')` doesn't exist yet — *you* are the routing layer.

So let's build the right mental model first. **Routing is you reading two facts off the request — the method (`GET`, `POST`, …) and the URL path — and deciding which function should run.** That's it. A route is the pair *(method, path)*; routing is the code that maps that pair to a handler. Express, Fastify, Koa — they all eventually do this exact thing under the hood. We're about to write the thing they wrap, and once you've felt the friction by hand, every router you ever use will make sense.

We're continuing the **messages** service from the earlier phases — each message is just `{ id, text }`.

## The dispatch listener

In [Phase 2](02-requests-and-responses.md) you learned to parse the URL and write JSON. Now we use both to dispatch. The simplest router is a ladder of `if` checks:

```javascript
import http from 'node:http';

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const path = url.pathname;

  if (req.method === 'GET' && path === '/messages') return listMessages(req, res);
  if (req.method === 'POST' && path === '/messages') return createMessage(req, res);

  const idMatch = path.match(/^\/messages\/(\d+)$/);     // path params by regex
  if (req.method === 'GET' && idMatch) return getMessage(req, res, Number(idMatch[1]));

  sendJson(res, 404, { error: 'Not Found' });            // fallthrough
});

server.listen(3000);
```

*What just happened:* We built a `URL` object so we get a clean `pathname` (no query string, no surprises), then checked method + path together, in order, top to bottom. The first matching `if` calls its handler and `return`s — that `return` is load-bearing, because it stops us from falling through to the next check or the 404. Anything that matches nothing drops to the bottom and gets a `404 Not Found`. That last line is your safety net.

📝 Notice the pattern: every route is *method AND path*. `GET /messages` and `POST /messages` share a path but are different routes — the method is half the identity. Forget that and your "list" handler will try to run when someone POSTs.

## Path parameters: where it gets fiddly

Look closely at the third route — `/messages/:id`, the "get one message by its id" route. Node has **no built-in support** for path parameters. There's no `:id` placeholder, no params object handed to you. You match the shape yourself with a regular expression and pull the value out of a capture group:

```javascript
const path = '/messages/42';

const match = path.match(/^\/messages\/(\d+)$/);
//                         ^      ^      ^   ^
//                         |      |      |   end-of-string anchor
//                         |      |      capture group: one-or-more digits
//                         |      literal "/messages/"
//                         start-of-string anchor

if (match) {
  const id = Number(match[1]);   // match[0] is the whole match, match[1] is the group
  console.log(id);               // 42
}
```

*What just happened:* The regex says "from start to end, match the literal `/messages/` followed by one or more digits, and capture those digits." `match[1]` holds the captured group (`"42"`), which we convert to a number. The `^` and `$` anchors matter more than they look — without them, `/messages/42/extra` or `/oops/messages/42` would sneak through.

⚠️ This is where hand-rolled routing starts to hurt. Want to allow `/messages/abc` to return a clean `400` instead of silently not matching? More regex. Want `/users/:userId/messages/:msgId`? Now you're juggling two capture groups and remembering which index is which. Want optional trailing slashes? Another branch. Every URL shape you support is another fiddly, error-prone pattern you maintain by hand. This exact pain — escaping slashes, counting capture groups, anchoring correctly — is *precisely* why routers exist. When you later write `app.get('/messages/:id', handler)` and just read `req.params.id`, remember: a router is doing this regex dance for you.

## When the ladder stops scaling

Two or three routes? The `if`-ladder is honestly fine — don't over-engineer it. But watch what happens as the service grows: ten routes, twenty, each with its own method check and maybe a regex, all in one giant function. It becomes hard to read, easy to mis-order, and easy to forget a `return`.

The natural next move is to pull the routes into a **dispatch table** keyed by `"METHOD path"`:

```javascript
const routes = {
  'GET /messages': listMessages,
  'POST /messages': createMessage,
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const key = `${req.method} ${url.pathname}`;

  const handler = routes[key];
  if (handler) return handler(req, res);

  sendJson(res, 404, { error: 'Not Found' });   // nothing matched
});
```

*What just happened:* Instead of a ladder, we build one lookup key per request — `"GET /messages"` — and check the table. If there's a handler, we call it; otherwise, 404. It's flatter and easier to scan. But notice the catch: a plain object key is a fixed string, so this clean version only handles **static** paths. The moment you need `/messages/:id`, the table has to store patterns and loop over them with regex matching — and at that point you're writing pattern compilation, param extraction, and match ordering. You're reinventing a router.

📝 One more thing the hand-rolled versions almost always get wrong: the difference between 404 and 405. A `404 Not Found` means "that path doesn't exist here." But if the path *does* exist and only the **method** is wrong — say someone sends `DELETE /messages` when you only support `GET` and `POST` — the correct answer is `405 Method Not Allowed`, ideally with an `Allow` header listing what's permitted. Doing this by hand means checking "did the path match but the method didn't?" before falling to 404 — extra bookkeeping that's tedious enough that most hand-rolled servers skip it and return a misleading 404.

## This friction is the whole point

Step back and notice what just happened across this phase. We wanted three routes and ended up hand-writing: method checks, URL parsing, regex path matching, capture-group extraction, a dispatch structure, and the 404/405 distinction. None of it is hard in isolation. All of it is repetitive, and all of it is easy to get subtly wrong.

💡 That accumulated friction is *exactly* the gap a router fills. When you reach for [Express](/guides/express-from-zero) next, `app.get('/messages/:id', handler)` collapses everything in this phase into one line — the method, the path, the param extraction, the not-found fallthrough — because Express wrote the regex dance once so you never have to. You're not learning Express to avoid understanding routing; you're learning it *because* you now understand routing and know what it's doing for you.

## Recap

- `node:http` ships **no router** — your `(req, res)` listener inspects `req.method` and the parsed URL path and dispatches to a handler itself.
- A route is the pair *(method, path)*; the simplest router is an ordered `if`-ladder where each match `return`s, with a `404` fallthrough at the bottom.
- **Path parameters have no built-in support** — you match them with an anchored regex like `/^\/messages\/(\d+)$/` and read the capture group, which is fiddly and error-prone.
- A dispatch table keyed by `"METHOD path"` reads better for static routes, but adding params forces regex-pattern matching — at which point you're reinventing a router.
- A correct server returns `404` for unknown paths and `405 Method Not Allowed` (with an `Allow` header) for a known path hit with the wrong method — the latter is often skipped in hand-rolled code.
- This exact friction is why frameworks like [Express](/guides/express-from-zero) exist.

## Quick check

```quiz
[
  {
    "q": "In node:http, how does a request get matched to the right handler?",
    "choices": ["A built-in router parses the route table for you", "Your (req, res) listener inspects req.method and the URL and dispatches itself", "Node calls a separate function per HTTP method automatically", "You register routes with app.get() and Node wires them up"],
    "answer": 1,
    "explain": "node:http has no router. Your single listener reads the method and path and decides which handler to call — routing is code you write."
  },
  {
    "q": "Why are path parameters like /messages/:id awkward in node:http?",
    "choices": ["Node forbids numbers in URLs", "There's no built-in support, so you match with a regex and pull the value from a capture group", "You must restart the server to register each one", "req.params is read-only and can't be set"],
    "answer": 1,
    "explain": "There is no :id placeholder. You write an anchored regex like /^\\/messages\\/(\\d+)$/ and read match[1] yourself — fiddly and error-prone, which is exactly why routers exist."
  },
  {
    "q": "A client sends DELETE /messages, but you only support GET and POST on that path. What's the correct response?",
    "choices": ["404 Not Found", "405 Method Not Allowed", "400 Bad Request", "500 Internal Server Error"],
    "answer": 1,
    "explain": "The path exists; only the method is wrong, so 405 Method Not Allowed (ideally with an Allow header) is correct. Returning 404 is a common hand-rolled mistake."
  }
]
```

[← Phase 2: Handling Requests & Responses](02-requests-and-responses.md) · [Guide overview](_guide.md) · [Phase 4: Middleware Is Just a Function →](04-middleware-is-a-function.md)