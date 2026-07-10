---
title: "How to Read API Docs"
guide: "reading-api-docs-postman"
phase: 1
summary: "Every API reference is telling you the same five things: the base URL, the endpoint and method, the parameters, the auth requirement, and an example request and response. Learn where each one lives so you can skim straight to it."
tags: [apis, api-docs, http, base-url, endpoint, parameters, authentication, beginner-friendly]
difficulty: beginner
synonyms: ["how to read api documentation", "what is a base url", "what is an endpoint", "what are query parameters", "where is the api key in the docs"]
updated: 2026-07-10
---

# How to Read API Docs

A docs page looks like a wall of text because you're reading it like prose — top to bottom, hoping the
answer appears. It isn't prose. It's a *reference*, and every reference is laid out to answer the same
handful of questions. Once you know the five things you're looking for, the wall turns into a form you
fill in, and you can scan straight to the box you need.

Here's the whole mental model, and the rest of this phase is just the five fields explained one at a
time:

```text
   To make ONE request, the docs always tell you five things:

   1. BASE URL        where the API lives          https://api.example.com/v1
   2. ENDPOINT+METHOD which thing, what action     GET /users/{id}
   3. PARAMETERS      the details you fill in       id (required), fields (optional)
   4. AUTH            how you prove who you are     Authorization: Bearer <token>
   5. EXAMPLE         a sample call + response      copy it, adapt it, send it

   Put 1+2+3 together and you have the URL. Add 4 and it's allowed.
   Check 5 to confirm you assembled it right.
```

We'll use a made-up but typical service — a "Bookshelf API" — as the running example, so the shapes are
realistic without leaning on any one vendor's website.

## 1. The base URL — where the API lives

The base URL is the front door of the whole API: the part of the address that's the same for *every*
request. Everything else you read in the docs gets tacked onto the end of it. Find this once and you've
found the foundation for every call.

Look for a section near the top called "Base URL," "Getting Started," or "Introduction." It almost always
shows a version number in the path.

```text
   https://api.bookshelf.dev/v1
   └──────┬───────────────┘ └┬┘
      the host (the server)  the version
```

📝 **Terminology.** The `/v1` is the **API version**. APIs change over time, so providers freeze old
behavior under `/v1` and ship new behavior under `/v2`, letting your code keep working. Use the version
the docs tell you to — usually the newest one shown in their examples.

⚠️ **Gotcha.** Some docs print the base URL in one place and then show *only the endpoint* (like `/books`)
everywhere else, assuming you'll remember to glue them together. If a request 404s with "not found," the
first thing to check is whether you dropped the base URL or the version.

## 2. The endpoint and method — which thing, what action

An **endpoint** is the path to a specific resource — the books, one book, the reviews on a book. The
**method** is the verb that says what you want to *do* to it. Together they read almost like a sentence:
"`GET /books`" means "fetch the list of books."

📝 **Terminology.** The four you'll meet constantly:

| Method | What it does | Sentence |
|---|---|---|
| `GET` | read, change nothing | "show me the books" |
| `POST` | create something new | "add a new book" |
| `PUT` / `PATCH` | update something existing | "edit this book" |
| `DELETE` | remove something | "delete this book" |

Reference pages list one endpoint per entry, almost always with the method in bold or color right next to
the path:

```text
   GET    /books            list all books
   GET    /books/{id}       get one book by its id
   POST   /books            create a book
   DELETE /books/{id}       delete a book
```

That `{id}` in curly braces is a **path parameter** — a blank you fill in. `GET /books/42` asks for the
book whose id is `42`. The braces are the docs' way of saying "put a real value here"; you never send
the braces themselves.

When a teammate says "the API returns a 405," knowing methods tells you instantly what happened: you sent
the wrong verb to a real path — like a `POST` to an endpoint that only accepts `GET`. The path was fine;
the action wasn't allowed.

## 3. The parameters — the details you fill in

Parameters are the inputs to a request — the specifics that turn "get some books" into "get me 10
science-fiction books, newest first." The docs list every parameter an endpoint accepts, and crucially,
marks which are **required** and which are **optional**.

There are three places a parameter can ride along, and the docs will tell you which:

- **Path** — baked into the URL, like the `{id}` above. Always required.
- **Query** — tacked onto the end of the URL after a `?`, for filtering and options:
  `/books?genre=scifi&limit=10`. The `?` starts the list; `&` separates each one.
- **Body** — a chunk of JSON you send along with `POST`/`PUT`, describing the thing you're creating or
  changing.

Usually a table right under the endpoint. The "Required" column is the one to read first — it tells you
the minimum you must supply for the call to work at all.

```text
   GET /books — query parameters

   Name    Required  Type     Description
   genre   no        string   filter to one genre, e.g. "scifi"
   limit   no        integer  how many to return (default 20, max 100)
   sort    no        string   "newest" or "title"
```

Nothing is required here, so `GET /books` alone works and gives you the default 20. Want fewer, filtered,
sorted? That's what the optional query parameters are for. Note the docs even tell you the **default**
(`20`) and the **limit** (`max 100`) — real numbers from the reference, not ones to guess at.

⚠️ **Gotcha.** "Optional" doesn't mean "ignored." If you send a query parameter the API doesn't
recognize (a typo like `limt=10`), most APIs quietly ignore it rather than erroring — so you'll get the
default behavior and wonder why your limit "didn't work." When a request behaves unexpectedly, re-check
your parameter *names* against the table, character for character.

## 4. The auth requirement — how you prove who you are

Most useful APIs won't talk to a stranger. **Authentication** is how you prove you're an allowed caller,
usually by attaching a secret — an **API key** or a **token** — to your request. The docs have a section,
normally called "Authentication," that tells you exactly two things: *what* secret to send and *where* to
put it.

📝 **Terminology.** A **bearer token** is the most common pattern: a long secret string you place in a
header, and whoever "bears" (carries) it is treated as you. The header looks like this:

```text
   Authorization: Bearer sk_live_8Kd... (your secret token)
   └──────┬──────┘ └─┬──┘ └──────┬──────┘
     header name    scheme      the actual secret
```

The "Authentication" section spells out the exact header. It will say something like: *"Authenticate by
sending your API key as a bearer token in the `Authorization` header."* That one sentence tells you the
header name (`Authorization`), the scheme (`Bearer`), and that the value is your key.

⚠️ **Gotcha.** A request with the secret missing or malformed comes back as **401 Unauthorized**; a
request where the secret is valid but isn't *allowed* to do that thing comes back as **403 Forbidden**.
People conflate them and chase the wrong fix. 401 means "I don't know who you are" (check the token is
present and spelled right). 403 means "I know who you are, and no" (your key lacks permission). You'll
meet both again in [Phase 3](03-reading-the-response.md).

⚠️ **Gotcha — and this is the big one.** That token *is* your account. Anyone who has it can act as you.
We'll return to keeping it out of your code and your shared collections in
[Phase 3](03-reading-the-response.md), but plant the flag now: treat it like a password, because it is
one.

## 5. The example — a request and response you can copy

Good docs give you a worked example for each endpoint: a sample request and the response it produces.
This is the most valuable thing on the page, because it shows all four pieces above *already assembled
correctly*. Your job becomes "copy this and change the values to mine," not "build it from scratch."

Typically a request snippet (often already written as curl — which you'll recognize after
[Phase 2](02-making-the-request.md)) and a JSON response:

```text
   Example response — GET /books/42

   {
     "id": 42,
     "title": "The Left Hand of Darkness",
     "author": "Ursula K. Le Guin",
     "genre": "scifi",
     "year": 1969
   }
```

This is your map of what the answer *will look like* before you ever send the call. If your code needs
the publication year, you now know it'll arrive under the key `year`. Reading the example response is how
you know what fields to expect — no guessing. When your real response doesn't match — a field is missing,
or the shape is different — that mismatch is the bug, and now you can see it.

## Putting the five together

Here's the whole skim, start to finish. Say the task is *"get the details of book 42."* You go to the
docs and answer five questions in order:

```text
   1. Base URL?   https://api.bookshelf.dev/v1   (from "Getting Started")
   2. Endpoint?   GET /books/{id}                (from the reference list)
   3. Params?     id = 42 (required, path)       (from the parameter table)
   4. Auth?       Authorization: Bearer <token>  (from "Authentication")
   5. Example?    returns {id, title, author...} (from the sample response)

   Assembled request:
     GET https://api.bookshelf.dev/v1/books/42
     Authorization: Bearer sk_live_...
```

That's it. You've read a docs page the way it's meant to be read — not front to back, but as a form with
five fields. Next, let's actually send this request, two different ways.

## Recap

1. A docs page is a **reference, not prose** — skim for five things, don't read top to bottom.
2. **Base URL** is the unchanging front door (with a version like `/v1`).
3. **Endpoint + method** is which resource and what action (`GET /books/{id}`).
4. **Parameters** are your inputs — note which are *required*, and whether they ride in the path, the
   query (`?key=value`), or the body.
5. **Auth** is the secret you attach (usually `Authorization: Bearer <token>`) — treat it like a
   password.
6. The **example** shows it all assembled correctly and tells you the response shape in advance.

---

[← Guide overview](_guide.md) · [Phase 2: Making the Request (Postman & curl) →](02-making-the-request.md)
