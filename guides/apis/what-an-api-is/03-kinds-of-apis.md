---
title: "Kinds of APIs"
guide: "what-an-api-is"
phase: 3
summary: "APIs come in two broad kinds - local/library APIs that live inside your own program, and web APIs you reach across the network - and within web APIs there are a few common styles (REST, GraphQL, gRPC) that this guide names but doesn't teach, pointing you to HTTP and JSON next."
tags: [apis, web-apis, library-apis, rest, graphql, grpc]
difficulty: beginner
synonyms: ["types of apis", "library api vs web api", "what is a web api", "rest vs graphql vs grpc", "what is a rest api", "local api vs remote api"]
updated: 2026-07-10
---

# Kinds of APIs

You've got the core idea now: an API is a contract that hides a kitchen, and it exists to let software reuse, separate, and integrate. The word "API," though, gets used for two genuinely different situations, and conflating them is a common source of quiet confusion. Let's split them cleanly, then name the styles you'll keep hearing about so they stop sounding like a secret language.

## The big split: local vs over-the-network

Every API falls on one side of a simple line - **is the kitchen in the same building as you, or across town?**

```text
   ┌─────────────────────────────┐     ┌─────────────────────────────┐
   │  LIBRARY / LOCAL API        │     │  WEB API                    │
   │                             │     │                             │
   │  the other "program" is     │     │  the other program is on    │
   │  code already inside YOUR   │     │  a different machine,       │
   │  program - same building    │     │  reached over the network   │
   │                             │     │                             │
   │  the call is instant and    │     │  the request travels across │
   │  free; no network involved  │     │  the internet and back      │
   └─────────────────────────────┘     └─────────────────────────────┘
```

### Library APIs - the kitchen is in your own house

A **library** is a chunk of pre-written code you pull into your program to reuse. It exposes an API: a set of functions you're allowed to call.

📝 **Terminology.** A *library* is reusable code someone else wrote that you include in your own program - for example, code that knows how to do date math, or compress an image. Its API is the list of functions it lets you call.

When you call a library function, nothing leaves your machine. It's like ordering from a kitchen *in your own house* - the menu still hides how it works, but the food arrives instantly because nothing had to travel anywhere. Calling `round(3.7)` to round a number, or asking a date library "what's 30 days from today?" - those use library APIs. Same contract idea, no network.

### Web APIs - the kitchen is a restaurant across town

A **web API** is the kind most people mean when they say "API" today. Here the other program lives on a *different machine* - a server somewhere on the internet - and your request has to **travel over the network** to reach it and travel back with the answer.

📝 **Terminology.** A *web API* (also called a *remote* API) is an API you reach over a network rather than from code inside your own program. The weather, maps, and payments examples from earlier are all web APIs.

That journey across the network changes things in ways worth knowing up front:

- **It takes time.** A round trip to a server is far slower than calling code in your own program. Not slow like watching paint dry - but slow enough that it matters.
- **It can fail.** The network can drop, the other server can be down or busy. A library call in your own house can't "fail to arrive"; a request across town can.
- **It needs an address and rules.** To reach a kitchen across town, you need its address and an agreed language for placing orders.

⚠️ **Gotcha.** This is the single biggest difference to internalize: a **web API call can be slow and can fail**, where a local function call effectively can't. A lot of real-world bugs and confusion come from treating a request across the internet as if it were as instant and reliable as calling code next door. It isn't. Code that talks to web APIs has to expect waiting and has to expect failure.

**This category - `apis` - is about web APIs.** Library APIs are real and everywhere, but when this part of The Missing Manual says "API," it means the over-the-network kind, because that's where most of the questions, the integrations, and the 2am incidents live.

## The styles of web API (a preview, not a lesson)

Once two programs talk across a network, they need a shared *style* for how requests and responses are shaped - the agreed language for placing orders. You'll hear a few names. Here's just enough to recognize them; each is its own topic for later.

| Style | The one-line gist | You'll hear it called |
|---|---|---|
| **REST** | Treat everything as a "resource" (a user, an order) you fetch and change with simple, standard actions. The most common style on the public web. | "a REST API," "RESTful" |
| **GraphQL** | The caller describes *exactly* the data it wants in one query, and gets back that shape - no more, no less. | "a GraphQL API" |
| **gRPC** | A fast, compact style aimed at programs talking to programs at high volume, often *inside* a company rather than on the public web. | "gRPC," "a gRPC service" |

Don't memorize these. The only thing to take away right now is that **"web API" isn't one single thing** - it's a family with a few common dialects, and REST is the one you're most likely to meet first. When you read "they have a REST API," you can now translate it: *they offer a contract you call over the network, in the most common style.*

💡 **Key point.** Two splits, in order: first **local vs over-the-network** (library API vs web API); then, within web APIs, a few **styles** (REST, GraphQL, gRPC). Get the first split solid; treat the styles as names to grow into.

## Where to go next

You now have the whole mental model: what an API is (a contract that hides a kitchen), why it exists (reuse, separation, integration - a stable boundary), and the kinds you'll meet (local vs web, and the web styles). That's the foundation this category is built on.

The natural next step is to see a web API actually *work* - how a request travels, and what the answer looks like when it comes back. Almost every web API speaks over **HTTP** and answers in **JSON**, so that's where to head:

- **[HTTP and JSON API basics](/guides/http-and-json-api-basics)** - how a web request and its response are actually shaped. Read this next.
- **[HTTP explained](/guides/http-explained)** - a deeper look at the protocol the whole web (and most web APIs) runs on.
- **[REST APIs explained](/guides/rest-apis-explained)** - once HTTP and JSON make sense, this unpacks the most common web-API style in full.

## Recap

1. APIs split first into **library/local** (the kitchen is in your own program; calls are instant) and **web** (the kitchen is across the network; requests travel and take time).
2. Web API calls are **slower and can fail** in ways local calls can't - internalize that early.
3. This category focuses on **web APIs.**
4. Web APIs come in a few **styles** - REST (most common), GraphQL, gRPC - which are names to recognize now and learn later.
5. Next stop: how a web request and response are actually shaped, over **HTTP and JSON**.

---

[← Phase 2: Why APIs Exist](02-why-apis-exist.md) · [Guide overview →](_guide.md)
