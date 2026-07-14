---
title: "Designing Endpoints - Conventions That Read Well"
guide: "rest-apis-explained"
phase: 2
summary: "The practical conventions of good REST: name URLs with nouns not verbs, treat collections and items consistently, return meaningful status codes, and use query params for filtering, sorting, and pagination."
tags: [rest, api-design, endpoints, status-codes, pagination, query-params, conventions]
difficulty: intermediate
synonyms: ["rest api naming conventions", "how to design rest endpoints", "rest api pagination", "what status code should i return", "rest filtering and sorting query params", "rest api best practices"]
updated: 2026-07-10
---

# Designing Endpoints - Conventions That Read Well

Knowing the mental model is one thing; laying out an API somebody else can use without reading a manual is
another. The good news is that REST has a well-worn set of conventions, and they're mostly common sense
once you see why each exists. Follow them and a stranger can guess your endpoints; ignore them and even
your own teammates will be grep-ing the source to find out what `/doUserThing` does.

This phase is the practical layer: how to name things, what to return, and how to handle the everyday
needs - filtering, sorting, and paging - that every real API runs into.

## The endpoint cheat sheet

> **Designing something now? Scan this, then read the section for the part you're unsure about.**

| You want to… | Do this |
|---|---|
| Name an endpoint | Use a **plural noun**: `/orders`, not `/getOrders` or `/order` (§1) |
| Act on one record vs. many | **Item** `/orders/42` vs. **collection** `/orders` (§1) |
| Say "it worked" | `200 OK` (read/update), `201 Created` (new), `204 No Content` (delete) (§2) |
| Say "you messed up" | `400` bad request, `401` not logged in, `403` not allowed, `404` not found (§2) |
| Say "we messed up" | `500` server error (§2) |
| Filter / sort / paginate a list | **Query params**: `?status=open&sort=-created&page=2` (§3) |

---

## 1. Name with nouns, and be consistent

A REST URL names a *thing*, and the HTTP method supplies the action - so the URL should be a noun, not a
verb. The verb is already in the method; repeating it in the path (`GET /getOrders`) is redundant and
breaks the pattern that makes APIs predictable.

```text
   ❌ verb-in-URL (don't)         ✅ noun + method (do)
   GET  /getAllOrders            GET    /orders
   POST /createOrder             POST   /orders
   GET  /getOrderById?id=42      GET    /orders/42
   POST /updateOrder             PATCH  /orders/42
   POST /deleteOrder?id=42       DELETE /orders/42
```

Three conventions make the noun style click:

- **Plural for collections.** Prefer `/orders` over `/order`. Then `/orders` reads as "the orders" and
  `/orders/42` as "order 42" - one consistent rule instead of guessing singular vs. plural per endpoint.
- **Nest to show ownership.** `/users/42/orders` means "the orders belonging to user 42." Nest one level
  for a clear parent-child relationship; resist nesting three or four deep - it gets unwieldy fast, and
  usually `/orders?user=42` reads better past one level.
- **Lowercase, hyphenated, no file extensions.** `/blog-posts`, not `/BlogPosts` or `/blog_posts.json`.

💡 **Key point.** Consistency beats cleverness. An API where *every* collection is a plural noun and
*every* item is `/collection/{id}` is one a developer can navigate by guessing. Each special-case
exception is a thing they now have to look up.

## 2. Return status codes that actually mean something

Every HTTP response carries a three-digit *status code* that tells the caller, at a glance, how it went.
The number isn't decoration - clients branch on it. Returning the *right* one is part of your API's
contract, not an afterthought.

📝 **Terminology - the families.** The first digit tells the whole story: **2xx** = it worked, **3xx** =
go somewhere else (redirects), **4xx** = the *caller* did something wrong, **5xx** = the *server* did.
That single digit is enough to know whose problem it is.

Here are the ones you'll reach for constantly:

```text
   2xx  success
     200 OK            standard success (a GET that found data, a PATCH that worked)
     201 Created       a POST made a new resource (return its Location)
     204 No Content    success, nothing to send back (a DELETE that worked)

   4xx  the caller's fault
     400 Bad Request   the request body/params are malformed or invalid
     401 Unauthorized  you didn't prove who you are (missing/bad credentials)
     403 Forbidden     we know who you are; you're not allowed to do this
     404 Not Found     no resource at this URL
     409 Conflict      the request clashes with current state (e.g. duplicate)

   5xx  the server's fault
     500 Internal Server Error   something blew up on our side
```

⚠️ **Gotcha - `401` vs. `403`.** They feel interchangeable; they're not. `401 Unauthorized` actually
means *unauthenticated* - "I don't know who you are, log in." `403 Forbidden` means *authenticated but not
permitted* - "I know exactly who you are, and you still can't touch this." Sending `403` for a missing
login tells the client to fix the wrong thing.

A delete, done right:

```http
DELETE /orders/42 HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiInR5cCI6...
```
```http
HTTP/1.1 204 No Content
```
The order was removed, and the server returned `204 No Content` - success, with an empty body because
there's nothing meaningful to send back about a thing that no longer exists. The caller reads `204` and
knows the delete worked without having to parse anything.

And an error, done right - note that a good `4xx` *explains itself* in the body:

```http
POST /orders HTTP/1.1
Content-Type: application/json

{ "items": [] }
```
```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "error": "validation_failed",
  "message": "An order must contain at least one item.",
  "field": "items"
}
```
The server rejected the empty order with `400` *and* a JSON body naming what was wrong and where. The
status code tells the client's code how to branch; the message tells the human reading the logs what to
fix. Returning `400` with a blank body is technically correct and practically useless.

## 3. Query params for filtering, sorting, and pagination

When you `GET` a collection, you rarely want *all* of it in *any* order. The convention is to shape the
result with **query parameters** - the `?key=value` pairs after the URL. The path still names the
collection; the query refines which slice you get and how it's arranged.

📝 **Terminology - query string.** Everything after the `?` in a URL is the *query string*:
`?status=open&sort=-created&page=2` is three parameters (`status`, `sort`, `page`) joined by `&`. They're
for *narrowing or shaping* a read, not for identifying the resource - that's the path's job.

Three jobs, three families of params:

- **Filtering** - narrow the set: `?status=open`, `?author=42`, `?created_after=2026-01-01`.
- **Sorting** - order the set: `?sort=created` (ascending) or `?sort=-created` (a leading `-` for
  descending is a common convention).
- **Pagination** - return one page at a time so you don't dump a million rows: `?page=2&per_page=25`.

"Give me the second page of open orders, newest first, 25 per page":

```http
GET /orders?status=open&sort=-created&page=2&per_page=25 HTTP/1.1
Host: api.example.com
```
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "data": [
    { "id": 1180, "status": "open", "created": "2026-06-18T09:12:00Z" },
    { "id": 1179, "status": "open", "created": "2026-06-18T08:55:00Z" }
  ],
  "page": 2,
  "per_page": 25,
  "total": 312
}
```
The path `/orders` named the collection; the query string did the rest - filtered to `open`, sorted
newest-first, and returned page 2. The server wrapped the list in an envelope with paging info (`page`,
`per_page`, `total`) so the client knows there are 312 matches and can build "page 13 of 13." Returning a
bare array instead leaves the client blind to how much more there is.

⚠️ **Gotcha - always paginate list endpoints from day one.** It's tempting to return the whole collection
while it's small. Then the table grows, one `GET /orders` tries to serialize a hundred thousand rows, and
the endpoint times out - for *every* caller at once. Bolting pagination on later is a breaking change to
everyone using it. Build it in before you need it; a default like `per_page=25` costs nothing early and
saves an outage later.

💡 **Key point - path identifies, query refines.** If a value picks out *which resource* you mean, it
belongs in the path (`/orders/42`). If it *shapes a read* of a collection - filter, sort, page - it
belongs in the query string. Keeping that line clean is most of what makes an API feel coherent.

## Recap

1. **Name with plural nouns** (`/orders`, `/orders/42`); the HTTP method is the verb, so never put the
   action in the URL.
2. **Return meaningful status codes** - `200`/`201`/`204` for success, `400`/`401`/`403`/`404` for caller
   errors, `500` for yours - and explain `4xx` errors in the body.
3. **`401` is "log in"; `403` is "you're logged in but not allowed."**
4. **Use query params** for filtering (`?status=open`), sorting (`?sort=-created`), and pagination
   (`?page=2`) - and paginate list endpoints from the start.
5. **Path identifies the resource; query string refines a read of it.**

You can now design endpoints that read cleanly. The last phase steps back and tells you the plain truth:
where this style holds up, and where it starts to hurt.

---

[← Phase 1: Resources & Verbs](01-resources-and-verbs.md) · [Guide overview](_guide.md) · [Phase 3: REST in the Real World →](03-rest-in-the-real-world.md)
