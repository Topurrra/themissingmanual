---
title: "Next.js from Zero - React Grows a Server"
guide: "nextjs-from-zero"
phase: 0
summary: "What Next.js adds to React and why - file routing, server components, data fetching, caching - explained from the request up, so the framework stops feeling like magic conventions."
tags: [nextjs, react, frontend, server-components, app-router]
category: frontend
order: 2
difficulty: intermediate
synonyms: ["learn nextjs", "nextjs tutorial from scratch", "what is nextjs", "nextjs app router explained", "nextjs vs react", "server components explained"]
updated: 2026-07-18
---

# Next.js from Zero - React Grows a Server

You know React. Then you open a Next.js project and the rules seem to have changed: components run
on a server now, some files are magically routes, `useState` throws an error in one file and works
fine in the next, and pages are somehow stale until you sprinkle the right incantation. None of it
is magic - all of it follows from one move: **Next.js puts a server in front of your React app**,
and everything the framework does is about deciding what happens on that server versus in the
browser.

This guide builds that model from the request up. By the end, "why is this a server component," "why
is this page cached," and "why did hydration fail" all have answers you can reason to, not memorize.

> ⏭️ New to React itself? Read [React from Zero](../react-from-zero/_guide.md) first - this guide
> assumes components, props, state, and effects are already solid.

## How to read this

- **In a panic right now?** Jump to [Phase 7: When Next.js Breaks](07-when-it-breaks.md) and use the
  cheat-card at the top.
- **Want it to finally make sense?** Read in order - the server/client split in Phase 3 is the hinge
  the whole framework turns on.

## The phases

1. **[What Next.js Actually Is](01-what-nextjs-actually-is.md)** - what a plain React app can't do,
   and what putting a server in front of it buys you.
2. **[Routing with Files](02-routing-with-files.md)** - folders become URLs; `page`, `layout`, and
   dynamic segments.
3. **[Server and Client Components](03-server-and-client-components.md)** - the big split: what runs
   where, and what `'use client'` really marks.
4. **[Data on the Server](04-data-on-the-server.md)** - async components, `loading.tsx`, streaming,
   and error boundaries.
5. **[Mutations: Forms and Server Actions](05-mutations-and-server-actions.md)** - writing data
   without hand-building an API layer.
6. **[Static, Dynamic, and the Cache](06-static-dynamic-and-the-cache.md)** - why your page is stale
   (or slow), and how Next decides at build time.
7. **[When Next.js Breaks](07-when-it-breaks.md)** - hydration mismatches, hook errors, serialization
   walls, and stale pages, decoded.
8. **[Where to Go Next](08-where-to-go-next.md)** - deployment, metadata, images, and what to ignore.

> Deliberately deferred to follow-up guides: authentication patterns, advanced caching internals,
> parallel/intercepting routes, middleware-heavy architectures, and testing. Core model first.
