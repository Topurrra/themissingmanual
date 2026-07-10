---
title: "Reading API Docs & Using Postman"
guide: "reading-api-docs-postman"
phase: 0
summary: "How to go from an unfamiliar API docs page to a working request: read the reference, fire the call in Postman or curl, and read the response — without guessing."
tags: [apis, postman, curl, http, api-docs, beginner-friendly]
category: apis
order: 4
difficulty: beginner
synonyms: ["how to read api documentation", "how to use postman", "how to make an api request", "postman vs curl", "how do i call an api from the docs"]
updated: 2026-07-10
---

# Reading API Docs & Using Postman

You've been handed an API and a link to its docs, and the page is a wall of endpoints, headers, and
words like "bearer token" and "query parameter." You scroll, you copy something that looks right, you
paste it somewhere, and you get back a number you don't understand. The frustrating part isn't that
APIs are hard — it's that nobody showed you how a docs page is *organized*, so you don't know where to
look for the five things you actually need.

That's all this guide fixes. By the end you'll open any well-structured API reference, find the exact
request you need, fire it from a graphical tool (Postman) or the command line (curl), and read what
comes back. Same skill, two tools, one calm process.

## How to read this
- **Need to send one request right now?** Skim [Phase 1](01-how-to-read-api-docs.md) to find the five
  things, then jump to [Phase 2](02-making-the-request.md) for the Postman and curl steps.
- **Want it to finally make sense?** Read in order — each phase builds on the last, from reading the
  docs to firing the call to understanding the answer.

## The phases
1. **[How to Read API Docs](01-how-to-read-api-docs.md)** — the five things every reference is telling
   you (base URL, endpoint + method, parameters, auth, example), and how to skim for the one you need.
2. **[Making the Request (Postman & curl)](02-making-the-request.md)** — two equivalent ways to fire
   the same request: Postman the GUI, and curl on the command line, with an annotated transcript.
3. **[Reading the Response & Iterating](03-reading-the-response.md)** — status code first, then the
   body; tweaking and re-sending; saving requests into collections with variables — and the
   secret-leak trap to avoid.

> This guide assumes you already know roughly what an HTTP request is (a method, a URL, headers, maybe
> a body) and what JSON looks like. If those are fuzzy, read
> [HTTP & JSON API Basics](/guides/http-and-json-api-basics) first, then come back. Designing your own
> API, pagination, rate limits, and OAuth flows are deliberately left to follow-up guides — this one is
> about *using* an API someone else built.
