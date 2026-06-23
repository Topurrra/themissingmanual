---
title: "Methods & Status Codes — the verbs and the replies"
guide: "http-explained"
phase: 2
summary: "The four everyday HTTP methods (GET, POST, PUT, DELETE) and what each one means, plus the four families of status codes (2xx success, 3xx redirect, 4xx your fault, 5xx server's fault) and how to read any code calmly."
tags: [http, methods, get, post, put, delete, status-codes, 404, 500]
difficulty: beginner
synonyms: ["what does get and post mean", "difference between get and post", "what is a 404 error", "what is a 500 error", "http status codes explained", "what do http methods mean", "what is a 301 redirect"]
updated: 2026-06-19
---

# Methods & Status Codes — the verbs and the replies

In [Phase 1](01-request-and-response.md) you saw the shape of the conversation: a request goes out, a
response comes back. Now we'll fill in the two most important words in that exchange — the **method**
(the verb the client uses to ask) and the **status code** (the three-digit reply the server uses to
answer).

These are the parts you'll actually run into by name. A teammate says "make it a POST." A page shows
`Error 500`. A tool prints `301`. None of it is cryptic once you know the small set of verbs and the
four families of replies.

## Methods — what the client is asking for

**What they actually are.** A **method** is the verb at the very start of a request. It tells the
server not just *which* thing you want, but *what you want to do* with it — read it, create one, replace
it, or delete it. There are several, but four cover almost everything you'll meet.

📝 **Terminology.** "Method," "HTTP verb," and "request type" all mean the same thing: that first word
(`GET`, `POST`, …) in the request.

| Method | What it means | A plain-English example |
|---|---|---|
| `GET` | **Read** — fetch something, change nothing | Loading a page, viewing a profile, running a search |
| `POST` | **Create / submit** — send data to make something new | Submitting a sign-up form, posting a comment |
| `PUT` | **Replace** — overwrite an existing thing with new contents | Saving an edited profile, updating a document |
| `DELETE` | **Remove** — delete a thing | Deleting a photo, removing an account |

The one distinction worth burning in: **`GET` only reads; everything else changes something.** When
you click a link or type an address, your browser sends a `GET` — that's why merely *looking* at a page
is safe to repeat. When you submit a form, it's usually a `POST`, because you're asking the server to
*do* something that sticks.

Here's a `POST` carrying form data, so you can see how it differs from the `GET` in Phase 1:

```http
POST /comments HTTP/1.1
Host: example.com
Content-Type: application/json

{"article": 42, "text": "Great write-up, thanks!"}
```
*What just happened:* The client asked the server to *create* something. The verb is `POST`, the path
`/comments` is where comments live, and — unlike a `GET` — this request carries a **body**: the new
comment itself, here written as JSON (a common text format for structured data). A `GET` asks "show
me"; a `POST` says "here, take this and do something with it."

⚠️ **Gotcha.** Because `GET` is meant to be safe and repeatable, browsers feel free to retry it, cache
it, and prefetch it. So never wire up a `GET` to *do* something with consequences — a link like
`/delete?id=42` is a classic mistake, because anything that follows links (a browser, a preview bot,
your antivirus) might fire it without anyone clicking. Actions that change things belong on `POST`,
`PUT`, or `DELETE`.

**Why this saves you later.** When you read API instructions or watch your browser's network panel,
you'll see these verbs everywhere. Knowing that `GET` reads and the others change things lets you guess
what a request does before anyone explains it — and explains why refreshing a payment page sometimes
warns "are you sure you want to resubmit?" (that page was a `POST`).

## Status codes — how the server answers

**What they actually are.** Every response opens with a three-digit **status code** — the server's
one-glance verdict on how the request went. You met `200 OK` in Phase 1. The trick that makes all of
them readable is this: **the first digit tells you the whole story.** The other two are just detail.

📝 **Terminology.** A **status code** (or "HTTP status") is that number — `200`, `404`, `500`. The
short text beside it (`OK`, `Not Found`) is just a human-friendly label for the same thing.

There are five families. These four are the ones you'll meet daily:

| Family | Meaning | Read it as | Common members |
|---|---|---|---|
| **2xx** | **Success** | "It worked." | `200 OK`, `201 Created` |
| **3xx** | **Redirect** | "It moved — go look over there." | `301 Moved Permanently`, `302 Found` |
| **4xx** | **Client error** | "*Your* request was wrong." | `404 Not Found`, `403 Forbidden`, `401 Unauthorized` |
| **5xx** | **Server error** | "*The server* broke." | `500 Internal Server Error`, `503 Service Unavailable` |

(There's also **1xx**, an "informational, hold on" family you'll almost never see by hand. The four
above are the working set.)

The two families that cause the most stress are `4xx` and `5xx`, so let's be clear about the difference,
because it tells you who can fix it:

- **`4xx` means the problem is on the asking side.** The request itself was off — wrong address, no
  permission, not logged in. `404 Not Found` is the famous one: you asked for a path that isn't there
  (a typo'd URL, a deleted page, a dead link). `401` and `403` mean "you're not allowed" — log in, or
  you don't have access. The server is fine; the *request* needs fixing.
- **`5xx` means the problem is on the answering side.** Your request was reasonable, but the server
  tripped over its own feet — a bug, a crash, an overloaded machine. `500 Internal Server Error` is
  the generic "something blew up back here." There's usually nothing *you* did wrong, and often nothing
  you can do except wait or tell whoever runs the site.

Here's how a redirect actually looks, since `3xx` is the family people understand least:

```http
HTTP/1.1 301 Moved Permanently
Location: https://example.com/new-home
```
*What just happened:* The server didn't send a page — it sent a forwarding address. `301` says "this
moved for good," and the `Location` header says where. Your browser reads that and quietly sends a
*second* request to the new URL, so you usually never notice. That's why an old bookmark can still land
you on the right page: a redirect caught it and pointed the way.

💡 **Key point — how to read any code calmly.** Glance at the first digit. `2` = it worked. `3` = it
moved. `4` = the request was wrong (check the address, check whether you're logged in). `5` = the
server broke (not your code's fault; wait or report it). You don't need to memorize the rest — the
family tells you who's responsible and what to try next.

⚠️ **Gotcha.** A `200 OK` only means *the HTTP exchange* succeeded — the server received the request
and sent a response. It does **not** guarantee the response is the thing you wanted. A buggy site can
return `200` with an error message painted inside the page, or an empty result. So "I got a 200" means
"the conversation completed," not "everything is correct." When something looks wrong despite a `200`,
look at the response *body*, not just the code.

**Why this saves you later.** The next time a page breaks or a script prints a number, you won't spiral.
You'll read the first digit, know instantly whether to fix your request or wait on the server, and skip
the panic entirely. That single habit — *first digit first* — is most of what separates calm debugging
from flailing.

## Recap

1. The **method** is the request's verb: `GET` reads (and only reads), while `POST`, `PUT`, and
   `DELETE` create, replace, and remove.
2. Never put a consequential action behind a `GET` — it can fire without a real click.
3. A **status code**'s first digit is the whole story: **2xx** worked, **3xx** moved, **4xx** your
   request was wrong, **5xx** the server broke.
4. `4xx` = fix the request (address, login, permission). `5xx` = wait or report it.
5. A `200` means the exchange completed, not that the content is correct — check the body when in doubt.

You can now read both halves of an HTTP exchange. The last phase covers the extras that ride along on
every message — the headers, the cookies that let a site remember you, and the encryption behind
`https://`.

Build a request and see the raw HTTP that goes over the wire, plus the response it gets back:

```playground-http
```

---

[← Phase 1: Request & Response](01-request-and-response.md) · [Guide overview](_guide.md) · [Phase 3: Headers, Cookies & the S in HTTPS →](03-headers-cookies-and-https.md)
