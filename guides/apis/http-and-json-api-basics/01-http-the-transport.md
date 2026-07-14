---
title: "HTTP, the Transport"
guide: "http-and-json-api-basics"
phase: 1
summary: "A web API rides on HTTP: every call is a request (method + URL + headers) and a response (status code + headers + body). Here's the API-shaped recap."
tags: [http, requests, responses, methods, status-codes, headers, apis]
difficulty: beginner
synonyms: ["how does an api use http", "http methods for apis", "what is a get request", "http status codes explained", "what are http headers", "request and response explained"]
updated: 2026-07-10
---

# HTTP, the Transport

When an app "calls an API," what actually leaves your computer is an **HTTP request** - the same kind of
message your browser sends when you open a web page. The reply that comes back is an **HTTP response**.
That's the whole transport layer of a web API: one request out, one response back.

You can get the full story of HTTP - caching, connections, HTTPS, the lot - in
[HTTP Explained](/guides/http-explained). This phase is the *API-shaped* recap: just the parts you need to
read and reason about an API call. Hold these four ideas and you're set.

## The shape of every call: request → response

HTTP is a strict question-and-answer protocol. Your program asks one question (the request) and the server
gives one answer (the response). Nothing is "always on"; each call is a fresh, self-contained exchange.

A request has four parts, and so does a response:

```text
  REQUEST  (what you send)              RESPONSE  (what comes back)
  ──────────────────────────           ──────────────────────────
  GET /users/42  HTTP/1.1     ◄── line │ HTTP/1.1  200 OK          ◄── status line
  Host: api.example.com                │ Content-Type: application/json
  Accept: application/json    ◄ headers │ Content-Length: 57       ◄ headers
                                        │
  (usually empty for GET)     ◄── body  │ {"id":42,"name":"Ada"}   ◄── body (the data)
```

The request says **what you want** - a method (`GET`), a path (`/users/42`), some headers (extra notes),
and sometimes a body. The response says **what you got** - a status code (`200 OK`), its own headers, and
a body holding the actual data. Once you can spot those parts, you can read any HTTP exchange.

## Methods: the verb of the request

The **method** (also called the *verb*) is the first word of the request. It tells the server what kind of
action you intend. There are several, but a handful cover almost everything you'll do with an API:

| Method   | What you're asking for                          | Has a body? |
|----------|-------------------------------------------------|-------------|
| `GET`    | "Give me this thing." (read, never changes data)| No          |
| `POST`   | "Here's some data - create something with it."  | Yes         |
| `PUT`    | "Replace this thing with what I'm sending."     | Yes         |
| `PATCH`  | "Change part of this thing."                    | Yes         |
| `DELETE` | "Remove this thing."                            | Usually no  |

📝 **Terminology.** "Read-only" methods like `GET` are called **safe** - running one is not supposed to
change anything on the server. That's why your browser fetches a page (`GET`) freely but warns you before
re-sending a form (`POST`).

The method is half of *what a call does.* `GET /users/42` reads user 42; `DELETE /users/42` deletes them.
Same URL, completely different outcome - the verb is what changed.

## Status codes: the server's one-word verdict

Every response opens with a three-digit **status code** that summarizes how it went. You don't need to
memorize all of them - you need the ranges, because the first digit tells you the category:

```text
  2xx  ✓ It worked.            200 OK · 201 Created
  3xx  ↪ Go look elsewhere.    301 Moved Permanently · 304 Not Modified
  4xx  ✗ You messed up.        400 Bad Request · 401 Unauthorized · 404 Not Found
  5xx  ✗ The server messed up. 500 Internal Server Error · 503 Service Unavailable
```

When a call fails, the status code is the first thing you read, and the digit already tells you
**whose fault it is.** A `4xx` means your request was wrong (bad data, missing credentials, wrong URL) - 
*you* fix it. A `5xx` means the request was fine but the server broke - usually *not* something you can
fix from your side.

⚠️ **Gotcha.** A `200 OK` means HTTP delivered the response successfully - it does **not** guarantee the
data inside is what you wanted. Some APIs return `200` with a body like `{"error": "not found"}`. Always
read the body, not just the status. And the famous `404 Not Found` is about *this specific URL* - often a
typo in the path, not a dead server.

## Headers: the notes attached to the message

**Headers** are `Name: value` lines that carry metadata - information *about* the request or response,
separate from the actual data in the body. Think of them as the label on a parcel versus what's inside.

A few you'll meet constantly with APIs:

- `Content-Type: application/json` - "the body is JSON." Sent on a request to describe what you're
  uploading, and on a response to describe what's coming back.
- `Accept: application/json` - on a request, "please reply in JSON if you can."
- `Authorization: Bearer <token>` - "here's my key, proving I'm allowed to do this."

📝 **Terminology.** `application/json` is a **media type** (you'll also hear the old name *MIME type*) - a
standard label for a format. It's how both sides agree that the bytes in the body are JSON and not, say,
HTML or an image.

## Putting it together: an annotated GET

Here's a complete `GET` with `curl`. The `-i` flag tells `curl` to print the response headers and status
line, not only the body - so you can see all the pieces from the diagram above for real:

```console
$ curl -i https://api.example.com/users/42
HTTP/1.1 200 OK
Content-Type: application/json
Content-Length: 57

{"id":42,"name":"Ada Lovelace","role":"admin"}
```
You sent a `GET` request for the path `/users/42`. The server answered `200 OK` - it worked. The
`Content-Type: application/json` header promises the body is JSON, and sure enough, the last line is the
data: a small JSON object describing user 42. The blank line is HTTP's way of saying "headers are done;
everything after this is the body."

Notice what you *didn't* have to do: no library, no setup. A request really is just a method, a URL, some
headers, and (sometimes) a body - and a response is a status code, headers, and a body. That's the entire
transport.

💡 **Key point.** HTTP is the envelope and the verb: it gets your message to the server and back, and the
method + status code tell you what was asked and how it went. But the envelope is almost empty without
something to *put in the body* - and for web APIs, that something is almost always JSON. That's next.

## Recap

1. Every API call is a **request** (method + URL + headers + optional body) and a **response** (status
   code + headers + body).
2. The **method** is the verb: `GET` reads, `POST` creates, `PUT`/`PATCH` change, `DELETE` removes.
3. The **status code** is the verdict: `2xx` worked, `4xx` you erred, `5xx` the server erred.
4. **Headers** are metadata notes; `Content-Type: application/json` is the one you'll see most.
5. A `200 OK` means *delivered*, not *correct* - always read the body too.

---

[← Guide overview](_guide.md) · [Phase 2: JSON, the Data Format →](02-json-the-data-format.md)
