---
title: "Request & Response"
guide: "express-from-zero"
phase: 4
summary: "Read input from req (params, query, body, headers), write output with res (status + json), pick honest status codes, and validate untrusted input before you ever touch it."
tags: [express, javascript, request, response, validation]
difficulty: intermediate
synonyms: ["express req body", "express res json status", "express request object", "express response object", "express validation", "express body parsing"]
updated: 2026-07-10
---

# Request & Response

The whole job of a route handler, stripped of ceremony: **it reads from `req` and writes through
`res`.** Input arrives on the request object — URL params, query string, parsed body, headers. You do
something with it, then reach for the response object and send exactly one answer back: a status code
and usually some JSON.

A handler is a small machine with one input port (`req`) and one output port (`res`). Everything in
this phase is just more knobs on those two ports.

> 📝 One thing that trips up everyone once: `req.body` does **not** exist by default. It only gets
> populated if a body-parsing middleware ran first — `express.json()` from [Phase 3: Middleware](03-middleware.md).
> No parser, no `req.body`. Hold that thought; we'll hit it again with code.

## Reading the request

The `req` object carries four sources of input. You'll use all four constantly, so let's name them
plainly.

```javascript
import express from 'express';

const app = express();
app.use(express.json()); // so req.body works for JSON requests

app.post('/tasks/:id', (req, res) => {
  console.log(req.params);  // { id: '42' }  ← from the URL path
  console.log(req.query);   // { sort: 'date' } ← from ?sort=date
  console.log(req.body);    // { title: 'Buy milk' } ← parsed JSON body
  console.log(req.method);  // 'POST'
  console.log(req.path);    // '/tasks/42'
  console.log(req.get('Authorization')); // 'Bearer abc...' ← a header

  res.json({ ok: true });
});

app.listen(3000, () => console.log('http://localhost:3000'));
```

*What just happened:* the same request handed us input through four doors. `req.params` holds the
named pieces of the route pattern (`:id` became `'42'`). `req.query` holds everything after the `?`.
`req.body` holds the parsed body — **but only because `express.json()` ran first**. `req.headers` is
the raw header object; `req.get('Authorization')` is the case-insensitive, one-header shortcut. Note
`req.params.id` is the string `'42'`, not the number `42` — everything from `params` and `query` is
text. Convert when you need a number.

> ⚠️ If you forget `app.use(express.json())` and then read `req.body`, you won't get an error — you'll
> get `undefined`. That silent `undefined` is the single most common "why is my POST broken" moment in
> Express. When `req.body` is empty and you swear you sent a body, check the parser first.

## Writing the response

Now the output port. The `res` object is how you reply, and the methods you'll live in are small.

```javascript
app.get('/tasks/:id', (req, res) => {
  const task = { id: req.params.id, title: 'Buy milk', done: false };

  res.json(task); // sends JSON, sets Content-Type: application/json
});

app.post('/tasks', (req, res) => {
  const task = { id: '7', title: req.body.title };

  res.status(201).json(task); // chain: set the status, then send the body
});

app.delete('/tasks/:id', (req, res) => {
  // ... delete it ...
  res.sendStatus(204); // 204 No Content — empty body, status only
});
```

*What just happened:* `res.json(obj)` serializes an object to JSON and sets `Content-Type` for you —
the workhorse. `res.status(code)` sets the status code and **returns `res`**, so you can chain it:
`res.status(201).json(task)`. `res.sendStatus(204)` sends a status with an empty body — perfect for a
successful delete. A few more you'll meet: `res.set('X-Foo', 'bar')` for a custom header, `res.send(...)`
for text/HTML/buffers, `res.redirect(url)` for a redirect.

> ⚠️ **Send exactly one response per request.** Each `req`/`res` pair gets one reply, and once you've
> sent it the headers are flushed. Call `res.json()` (or any send) a second time and Express throws
> `Error: Cannot set headers after they are sent to the client`. This usually happens when you forget a
> `return` after an early response:
>
> ```javascript
> if (!task) {
>   res.status(404).json({ error: 'Not found' });
>   // forgot `return` here ↓ — code keeps running and sends again
> }
> res.json(task); // 💥 headers already sent
> ```
>
> 💡 The fix is a habit: `return res.status(404).json(...)`. Returning the response ends the handler
> right there.

## Choosing honest status codes

The status code is a promise to the client about what happened. Lying with `200 OK` on a failure makes
every consumer of your API guess. Use the codes that match reality:

- **200 OK** — the standard "here's your data" success (a GET that found something).
- **201 Created** — you created a resource (a successful POST). Often paired with the new object in the body.
- **204 No Content** — success, but there's nothing to send back (a DELETE).
- **400 Bad Request** — the client sent something wrong (missing or invalid input). This is *their* fault.
- **404 Not Found** — the thing they asked for doesn't exist.

💡 Rough rule of thumb: `2xx` means "it worked," `4xx` means "you (the client) messed up," `5xx` means
"I (the server) messed up." Reaching for the honest code costs you nothing and saves whoever calls your
API hours of confusion.

## Never trust the input — validate it

Express has **no built-in validation.** None. It happily hands you whatever the client sent, including
nothing, garbage, or hostile junk. That's not a gap to apologize for — it's the minimalist philosophy.
But it means validation is *your* job, and skipping it is how APIs crash on a missing field or save
nonsense to the database.

The simplest approach is a manual guard at the top of the handler: check what you require, and bail
early with `400` if it's missing.

```javascript
app.post('/tasks', (req, res) => {
  const { title } = req.body ?? {}; // ?? {} guards against body being undefined

  if (typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json({ error: 'title is required and must be a non-empty string' });
  }

  const task = { id: '7', title: title.trim(), done: false };
  res.status(201).json(task);
});
```

*What just happened:* before trusting `title` for anything, we checked it — pulled it from `req.body`
(defaulting to `{}` so a missing body doesn't crash us), confirmed it's a non-empty string, and
`return`ed a `400` with a specific message if not. Only past that guard do we build the task. The early
`return` does double duty: it sends one response and stops the handler.

For one or two fields, a hand-written guard is honest and readable. As rules grow (optional fields,
types, lengths, nested objects), reach for a library: **[express-validator](https://express-validator.github.io/)**
layers validation onto the request, or a schema library like **zod** or **joi** lets you declare the
shape once and validate against it.

> ⚠️ The rule never bends: **never trust client input.** Validate before you read it, save it, or pass
> it anywhere. Anyone can send any bytes to your endpoint — assume someone will.

## Recap

- A handler reads from **`req`** (`params`, `query`, `body`, `headers`/`req.get()`) and writes through **`res`** (status + body).
- `req.body` only exists if a body parser like `express.json()` ran first — otherwise it's `undefined`, silently.
- Reply with `res.json(obj)`, set the code with the chainable `res.status(code).json(obj)`, and use `res.sendStatus(204)` for empty successes.
- Send **exactly one response per request** — a second send throws "Cannot set headers after they are sent." Habitually `return` your responses.
- Pick honest status codes: 201 created, 400 bad input, 404 not found, 204 no content.
- Express has no built-in validation. Guard required input by hand (return 400) or use express-validator/zod — and never trust the client.

## Quick check

```quiz
[
  {
    "q": "You POST JSON to an Express route and read req.body, but it's undefined. What's the most likely cause?",
    "choices": ["The client didn't send a body", "You forgot app.use(express.json()) so no body parser ran", "req.body was renamed to req.data", "Express only parses bodies on GET requests"],
    "answer": 1,
    "explain": "req.body is only populated if a body-parsing middleware like express.json() ran first. Without it, req.body is silently undefined."
  },
  {
    "q": "Which line sends a '201 Created' response with the new task as JSON?",
    "choices": ["res.json(task).status(201)", "res.status(201).json(task)", "res.sendStatus(201, task)", "res.created(task)"],
    "answer": 1,
    "explain": "res.status(code) returns res so it's chainable: set the status first, then send the body with res.json(task)."
  },
  {
    "q": "Your handler validates input and returns a 400 if a field is missing, but you still get 'Cannot set headers after they are sent.' What's the fix?",
    "choices": ["Call res.json() twice on purpose", "Use return res.status(400).json(...) so the handler stops after responding", "Add a second express.json() middleware", "Switch the status code to 200"],
    "answer": 1,
    "explain": "Without return, code keeps running after the early response and sends a second one. Returning the response ends the handler so only one response is sent."
  }
]
```

[← Phase 3: Middleware](03-middleware.md) · [Guide overview](_guide.md) · [Phase 5: Building a REST API →](05-building-a-rest-api.md)
