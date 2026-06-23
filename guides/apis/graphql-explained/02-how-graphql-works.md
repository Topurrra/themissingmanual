---
title: "How GraphQL Works"
guide: "graphql-explained"
phase: 2
summary: "The pieces that make GraphQL run: a typed schema as the contract, one endpoint for everything, queries for reads and mutations for writes, and the rule that the response mirrors the request — shown with an annotated query and its matching JSON."
tags: [graphql, schema, query, mutation, resolver, json, apis]
difficulty: intermediate
synonyms: ["how does graphql work", "what is a graphql schema", "graphql query vs mutation", "graphql single endpoint", "graphql response shape", "graphql query example with json"]
updated: 2026-06-19
---

# How GraphQL Works

In Phase 1 we landed on the one move that defines GraphQL: the client decides the shape of the response. This phase shows the four pieces that make that move safe and predictable, so it doesn't collapse into "the client can ask for anything and hope."

None of these pieces are exotic. By the end you'll be able to read a GraphQL query and predict the JSON it returns without running it.

## Piece 1: the schema — the contract

**What it actually is.** The schema is a typed description of everything the API can do: which fields exist, what type each one is, how objects relate, and which operations are allowed. It's written in the Schema Definition Language (SDL), and it's the single source of truth both sides agree on.

**Why this matters.** "The client asks for what it wants" only works if there's a shared, enforced list of what's *askable*. The schema is that list. Ask for a field that isn't in it, and the request is rejected before any data is touched — a typo becomes a clear error, not a silent `null`.

**A real example.** Here's a small slice of a schema:

```graphql
type User {
  id: ID!
  name: String!
  avatarUrl: String
  orders(last: Int): [Order!]!
}

type Order {
  id: ID!
  total: Float!
  placedAt: String!
  shipment: Shipment
}

type Shipment {
  status: String!
  carrier: String!
}

type Query {
  user(id: ID!): User
}
```
*What just happened:* This declares three object types and their fields. `String!` means "a string that is never null"; the plain `String` on `avatarUrl` means it may be null. `[Order!]!` is "a non-null list of non-null Orders." `orders(last: Int)` shows a field can take arguments. And `type Query` is special — it lists the entry points a client is allowed to start a read from. Here there's one: fetch a `user` by `id`.

📝 **Terminology — the `!` (bang).** In a GraphQL schema, `!` means non-nullable: the field is guaranteed to have a value. No `!` means it can be null. This is the schema's way of telling you, up front, which fields you can rely on and which you must guard against.

## Piece 2: one endpoint

**What it actually is.** A GraphQL API almost always lives at a single URL — by convention `/graphql` — and you reach it with one HTTP method, `POST`, carrying your query in the request body.

**Why this is a deliberate design choice.** REST spreads behavior across many URLs (`/users/42`, `/orders/9001`) and HTTP verbs. GraphQL collapses that to one address. The trade is intentional: you lose URL-per-resource (which, as Phase 3 will show, is exactly what made REST caching easy) and you gain a single place where the *query itself* describes what you want. The endpoint stops being the thing that varies; the query becomes it.

```text
   REST                          GraphQL
   GET  /users/42                POST /graphql
   GET  /orders/9001               body: { the query you want }
   GET  /shipments/by-order/...    body: { a different query }
   many URLs + verbs             one URL, the query varies
```

## Piece 3: queries (read) vs mutations (write)

**What it actually is.** GraphQL splits operations into two kinds, by intent:

- A **query** reads data. It should never change anything on the server — it's the GraphQL equivalent of a `GET`.
- A **mutation** writes data: create, update, delete. It's the equivalent of `POST`/`PUT`/`PATCH`/`DELETE`, all under one name.

**Why the split exists.** Separating reads from writes makes intent explicit and lets the server treat them differently — for example, running a list of mutations strictly one after another (so two writes don't race), while queries can be resolved in parallel. The keyword you write (`query` or `mutation`) tells the server which contract it's operating under.

**A real example — a mutation:**

```graphql
mutation {
  updateUserName(id: "42", name: "Dana O.") {
    id
    name
  }
}
```
*What just happened:* You asked the server to change a user's name (the write), and in the *same* request you said which fields you want back afterward — `id` and `name`. A mutation does the change and then returns data you select, so you can update your UI from the response without a second read.

⚠️ **Gotcha — "query" never enforces read-only for you.** GraphQL trusts the server author to keep `query` fields side-effect-free. Nothing in the protocol stops someone from writing a `query` field that secretly mutates data. If you build a GraphQL API, honor the convention: reads under `Query`, writes under `Mutation`. Breaking it confuses every caller and every caching layer that assumed queries were safe to repeat.

## Piece 4: the response mirrors the request

This is the idea that makes GraphQL feel different the first time you use it, and it's worth slowing down on.

**What it actually is.** The JSON you get back has the *same shape* as the query you sent. The fields you named, nested the way you nested them, are the keys in the response — under a top-level `"data"` object. You don't decode an unfamiliar payload; you described it, so you already know it.

**A real example — the dashboard header from Phase 1, now as one query:**

```graphql
query {
  user(id: "42") {        # entry point: one user
    name                  # scalar field
    avatarUrl
    orders(last: 3) {     # a relationship, with an argument
      id
      total
      shipment {          # a relationship on the order
        status
        carrier
      }
    }
  }
}
```

And the response, sent back over that single request:

```json
{
  "data": {
    "user": {
      "name": "Dana Okoro",
      "avatarUrl": "https://cdn.example.com/u/42.jpg",
      "orders": [
        {
          "id": "9003",
          "total": 48.50,
          "shipment": { "status": "in_transit", "carrier": "UPS" }
        },
        {
          "id": "9002",
          "total": 12.00,
          "shipment": { "status": "delivered", "carrier": "USPS" }
        },
        {
          "id": "9001",
          "total": 91.20,
          "shipment": null
        }
      ]
    }
  }
}
```
*What just happened:* The seven chained REST round trips from Phase 1 became one request. The response is your query with values filled in — `name`, `avatarUrl`, and exactly three orders, each with its shipment nested inside. Order `9001` has no shipment yet, so `shipment` is `null` — which the schema allowed, because `Order.shipment` wasn't marked `!`. No bio, no billing address, no fields you didn't ask for.

📝 **Terminology — resolver.** Behind each field is a small server-side function called a *resolver* that knows how to fetch that field's value (read the user row, look up the orders, call the shipment service). You don't see them as a caller, but they're the machinery that walks the relationships in your query. Keep the word in your pocket — it's the star of one of Phase 3's trade-offs.

💡 **Key point.** A GraphQL query is a *shape you want filled in*. The schema says what shapes are legal, the single endpoint receives them, query/mutation declares read vs write, and the server returns your shape with data. That's the entire model.

You now know enough to read GraphQL and predict its output. But everything above describes the *happy path*. The next phase is the part vendors gloss over: what this design costs you, and when you shouldn't pay it.

## Recap

1. **The schema** is the typed contract — every field, type, and relationship the API allows, with `!` marking non-null.
2. **One endpoint** (`POST /graphql`) handles everything; the query varies instead of the URL.
3. **Queries read, mutations write** — the split makes intent explicit, but the server, not the protocol, enforces that queries stay side-effect-free.
4. **The response mirrors the request** — the JSON under `"data"` has the exact shape you asked for, so you always know what you're getting.
5. **Resolvers** are the per-field server functions that actually fetch the data — remember them for Phase 3.

---

[← Phase 1: The Problem REST Leaves](01-the-problem-rest-leaves.md) · [Guide overview](_guide.md) · [Phase 3: The Honest Trade-offs →](03-the-honest-trade-offs.md)
