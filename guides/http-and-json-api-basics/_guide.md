---
title: "HTTP & JSON: the API Building Blocks"
guide: "http-and-json-api-basics"
phase: 0
summary: "Every web API is made of two things: HTTP carries the message, JSON carries the data. Learn both well enough to read any API call with confidence."
tags: [http, json, apis, beginner-friendly, rest]
category: apis
order: 2
difficulty: beginner
synonyms: ["what are http and json", "http and json explained", "what is a web api made of", "how do api calls work", "json basics for apis", "http methods and status codes for apis"]
updated: 2026-06-19
---

# HTTP & JSON: the API Building Blocks

You keep hearing that an app "calls an API" — and somewhere a request goes out, some data comes back,
and a screen fills with results. It can feel like magic happening behind a curtain. It isn't. Almost
every web API you'll ever touch is built from exactly two things: **HTTP**, the way the message travels,
and **JSON**, the way the data is written down. Learn those two, and the curtain disappears — you'll be
able to read an API call and actually understand what's going on.

This guide is the calm walkthrough of those two building blocks. No framework, no SDK, no special tools —
just `curl` in a terminal so you can see the raw request and the raw response with nothing in the way.

> ⏭️ Brand new to the whole idea of an API? Read [What an API Is](/guides/what-an-api-is) first, then
> come back here.

## How to read this

- **Want it to finally make sense?** Read in order. Phase 1 recaps the transport (HTTP), Phase 2 teaches
  the data format (JSON), and Phase 3 puts them together in real calls. Each phase builds on the last.
- **Already comfortable with HTTP?** You can skim [Phase 1](01-http-the-transport.md) and start at
  [Phase 2: JSON, the Data Format](02-json-the-data-format.md).

## The phases

1. **[HTTP, the Transport](01-http-the-transport.md)** — how a web API rides on HTTP: request and
   response, the methods (GET/POST/...), status codes, and headers — focused on the API angle. An
   annotated `GET` request, start to finish.
2. **[JSON, the Data Format](02-json-the-data-format.md)** — what JSON actually is (objects, arrays,
   strings, numbers, booleans, null), why it won, and how to read and write it. With the mental map from
   JSON to objects in your code, and the punctuation gotchas that bite everyone.
3. **[A Real API Call](03-a-real-api-call.md)** — the two halves together: `curl` a JSON API and read
   what comes back, then send a `POST` with a JSON body and the right headers. Annotated transcripts of
   both.

> This guide deliberately stays at "the two building blocks." The deeper mechanics of HTTP (caching,
> connections, cookies, HTTPS) live in [HTTP Explained](/guides/http-explained). How APIs are *organized*
> into resources and conventions is the job of [REST APIs Explained](/guides/rest-apis-explained), which
> this guide sets you up for.
