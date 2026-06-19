---
title: "REST APIs, Explained"
guide: "rest-apis-explained"
phase: 0
summary: "The mental model behind the web's dominant API style — things live at URLs, HTTP methods are the verbs you apply to them, and every request stands on its own."
tags: [rest, api, http, web-api, endpoints]
category: apis
order: 3
difficulty: intermediate
synonyms: ["what is a rest api", "how do rest apis work", "rest vs http", "rest api design", "what does restful mean", "http methods get post put delete"]
updated: 2026-06-19
---

# REST APIs, Explained

You've called REST APIs. You've sent a `GET` to fetch some users, `POST`ed a form, maybe seen a `404`
and sighed. But "REST" itself has probably stayed a fuzzy word — something everyone says, nobody
defines, and that somehow describes most of the APIs you'll ever touch.

Here's the relief this guide gives you: REST is not a framework, a library, or a magic protocol. It's a
small set of ideas about how to lay an API out — *things live at addresses, and you act on them with a
fixed handful of verbs.* Once those ideas click, you can read almost any web API on sight, and design
one that other people can read too.

## How to read this

- **Need a quick reference?** Phase 1 has the resource-and-method grid, and Phase 2 has the status-code
  and convention cheat sheet — both are scannable on their own.
- **Want REST to finally make sense?** Read in order. Phase 1 installs the mental model, Phase 2 turns
  it into real endpoints, and Phase 3 tells you the honest truth about where REST strains.

## The phases

1. **[Resources & Verbs](01-resources-and-verbs.md)** — the core mental model: resources live at URLs,
   HTTP methods are the verbs, and every request is self-contained (stateless).
2. **[Designing Endpoints](02-designing-endpoints.md)** — the practical conventions: nouns not verbs,
   collections vs. items, meaningful status codes, and query params for filtering, sorting, and paging.
3. **[REST in the Real World](03-rest-in-the-real-world.md)** — the honest part: REST is a *style*, not
   a law, and the pain points (over-fetching, round trips, versioning) that lead people to other tools.

> This guide stays on the dominant request/response style. GraphQL — a different answer to REST's
> pain points — gets its own home in [GraphQL, Explained](/guides/graphql-explained), and the deeper
> craft of evolving an API safely lives in [Designing APIs That Last](/guides/designing-apis-that-last).
