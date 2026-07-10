---
title: "Resources & Verbs — The REST Mental Model"
guide: "rest-apis-explained"
phase: 1
summary: "The whole of REST rests on three ideas: things (resources) live at URLs, HTTP methods are the verbs you apply to them, and every request carries everything the server needs (statelessness)."
tags: [rest, resources, http-methods, get, post, put, patch, delete, stateless]
difficulty: intermediate
synonyms: ["what is a resource in rest", "rest http verbs explained", "difference between put and patch", "what does stateless mean in rest", "get post put delete meaning"]
updated: 2026-07-10
---

# Resources & Verbs — The REST Mental Model

The word "REST" gets thrown around like it's a piece of technology you install. It isn't. REST is a way
of *thinking* about an API, and it rests on a surprisingly small foundation. Learn these three ideas and
you'll be able to look at an unfamiliar API and predict how it works before reading a line of its docs.

The three ideas:

1. **Resources** — the "things" your API is about — each live at a URL.
2. **HTTP methods** are the **verbs** — the small fixed set of actions you apply to those things.
3. **Statelessness** — every request carries everything the server needs to handle it, on its own.

Let's install them one at a time.

## 1. A resource is a "thing" that lives at an address

A *resource* is any noun your API cares about: a user, an order, a blog post, a photo. REST's first move
is to give every one of those things its own address — a URL. The URL is the thing's name and its
location, both at once.

📝 **Terminology — resource.** A resource is the conceptual "thing" (a particular user). The URL
(`/users/42`) is how you refer to it. The actual bytes you get back (the JSON describing that user) are a
*representation* of the resource — one snapshot of it, in one format.

There are two flavors of address, and the difference matters:

```text
   /users          ← a COLLECTION: "all the users" (the whole shelf)
   /users/42       ← an ITEM:       "the one user with id 42" (one book on the shelf)
```

A collection URL points at the group; an item URL points at one member of it, usually identified by an
ID. Almost every REST URL you'll ever see is one of these two shapes, sometimes nested
(`/users/42/orders` — "the orders belonging to user 42").

Coming from older code, people are tempted to put the *action* in the URL: `/getUser?id=42`,
`/createUser`, `/deleteUser`. That feels natural — it reads like a function call — but it throws away the
whole idea. In REST the URL names the *thing*, never the action. The action comes from the HTTP method,
which is the next idea.

## 2. HTTP methods are the verbs

HTTP already ships with a small set of verbs — `GET`, `POST`, `PUT`, `PATCH`, `DELETE`. REST's second
move is to use those as *the* actions on a resource. The URL says *which thing*; the method says *what to
do to it*. You don't invent new verbs; you reuse these five.

Here's the grid that, once it's in your head, lets you read most of REST. Pair a method with a URL and
the meaning is unambiguous:

```text
                 /users  (the collection)        /users/42  (one item)
              ┌─────────────────────────────┬─────────────────────────────┐
   GET        │ list all users              │ read user 42                │
   POST       │ create a new user           │ (rarely used on an item)    │
   PUT        │ (rarely used on collection) │ replace user 42 entirely    │
   PATCH      │ (rarely used on collection) │ update part of user 42      │
   DELETE     │ (rarely used on collection) │ remove user 42              │
              └─────────────────────────────┴─────────────────────────────┘

   read = GET   create = POST   replace = PUT   modify = PATCH   remove = DELETE
```

The natural pairings are the ones that map to the four things you do with data — create, read, update,
delete (often abbreviated **CRUD**): `POST` to a collection creates, `GET` reads, `PUT`/`PATCH` update,
`DELETE` removes.

Watch the same noun, `/articles`, do four different jobs purely by changing the verb:

```http
GET /articles/108 HTTP/1.1
Host: api.example.com
```
```http
HTTP/1.1 200 OK
Content-Type: application/json

{ "id": 108, "title": "Reading a Stack Trace", "published": true }
```
You asked to *read* the article at `/articles/108`. The server answered `200 OK` and handed back a
representation of it as JSON. `GET` only reads — it changed nothing on the server.

```http
POST /articles HTTP/1.1
Host: api.example.com
Content-Type: application/json

{ "title": "Untitled draft", "published": false }
```
```http
HTTP/1.1 201 Created
Location: /articles/109

{ "id": 109, "title": "Untitled draft", "published": false }
```
You `POST`ed to the *collection* `/articles` to create a new one. The server made the article, assigned
it the id `109`, and told you two things: the status `201 Created` (a new resource exists now) and a
`Location` header pointing at its fresh URL. You didn't choose the id — the server did.

### `PUT` vs. `PATCH` — the one that trips everyone up

This pair confuses almost everybody the first time, so here it is plainly. Both update an existing item;
the difference is *how much* you send.

- **`PUT` replaces the whole thing.** You send the complete resource, and the server overwrites it with
  exactly that. Any field you leave out is treated as "make it empty/gone," because you sent the *whole*
  new version.
- **`PATCH` changes only the parts you send.** You send just the fields you want to alter; everything
  else stays as it was.

```http
PATCH /articles/108 HTTP/1.1
Content-Type: application/json

{ "published": true }
```
```http
HTTP/1.1 200 OK

{ "id": 108, "title": "Reading a Stack Trace", "published": true }
```
You sent only `published`, and only that field changed — the `title` was untouched because `PATCH` means
"merge these changes in." Had you used `PUT` with that same one-field body, a strict server would read it
as "the article is now *only* `published: true`," wiping the title.

⚠️ **Gotcha — `PUT` with a partial body silently deletes fields.** This is the classic data-loss bug:
you mean to flip one flag, you reach for `PUT`, you send a small body, and fields you never mentioned get
blanked out because `PUT` means "replace everything." When you want a partial update, reach for `PATCH`.
Use `PUT` only when you genuinely intend to send the complete resource.

💡 **Key point — safe and idempotent.** Two properties explain a lot of REST's behavior. `GET` is
*safe*: it never changes server state, so it's fine to retry, cache, or prefetch. `PUT` and `DELETE` are
*idempotent*: doing them twice lands you in the same place as doing them once (deleting an already-deleted
thing still leaves it deleted). `POST` is neither — `POST` twice and you'll often create two records.
That's why a refreshed checkout page sometimes warns you about double-submitting.

## 3. Statelessness — every request stands on its own

*Stateless* means the server keeps no memory of your previous requests between calls. Each request must
carry everything the server needs to understand and authorize it — who you are, what you want, any data
involved. The server handles it and forgets you the moment it responds.

It's tempting to imagine the server "remembers you're logged in" the way a desktop program remembers you
opened a file. It doesn't. That's why nearly every request to a protected API re-sends proof of identity
— typically a token in a header — *every single time:*

```http
GET /account/settings HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiInR5cCI6...
```
You re-presented your credentials on this request, because the server didn't retain them from your last
one. The token *is* the request's memory — it travels with the call instead of living on the server.

Statelessness sounds like extra work, but it's the reason REST APIs scale and stay debuggable. Because no
single server is holding "your session," any server behind a load balancer can answer any request —
they're interchangeable. And because each request is self-contained, you can copy one into a tool like
`curl` or Postman and replay it in isolation to reproduce a bug.

## Recap

1. **Resources are the nouns** — the things your API is about — and each lives at a **URL**, either a
   *collection* (`/users`) or an *item* (`/users/42`).
2. **HTTP methods are the verbs** — `GET` read, `POST` create, `PUT` replace, `PATCH` partial-update,
   `DELETE` remove — and method + URL together name an unambiguous action.
3. **`PUT` replaces the whole resource; `PATCH` changes only what you send** — mixing them up silently
   deletes fields.
4. **Statelessness** means each request carries everything the server needs, so any server can answer it
   and any request can be replayed on its own.

With the mental model in place, the next phase turns it into endpoints you'd actually be proud to ship.

---

[← Guide overview](_guide.md) · [Phase 2: Designing Endpoints →](02-designing-endpoints.md)
