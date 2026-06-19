---
title: "Caching, Explained"
guide: "caching-explained"
phase: 0
summary: "A cache is a copy of an expensive-to-produce answer kept somewhere fast so you don't redo the work. This guide covers what a cache really is, where caches live, and why keeping them honest is the genuinely hard part."
tags: [caching, performance, architecture, cdn, redis, ttl]
category: architecture
order: 3
difficulty: intermediate
synonyms: ["what is a cache", "what is caching", "cache hit vs miss", "what is a cdn", "what is redis used for", "what is cache invalidation", "why is my cache stale", "what is a ttl"]
updated: 2026-06-19
---

# Caching, Explained

You've heard "we should cache that" in a hundred meetings, and it always sounds like the easy win — the magic word that makes slow things fast. Then one day a user swears they updated their profile but the old name keeps showing, and suddenly caching is the reason something is *wrong*, not fast. Both of those moments come from the same small idea, and once you hold that idea clearly, caching stops being a black box.

A cache is one thing: a copy of an expensive answer, kept somewhere fast, so you don't have to produce that answer again. Everything else — CDNs, Redis, browser caches, TTLs, the famous invalidation jokes — is a variation on that single move. This guide builds the idea up cleanly so you can reason about any cache you meet, instead of memorizing rules.

## How to read this

- **Want it to finally make sense?** Read in order. Phase 1 installs the mental model, Phase 2 shows you where caches actually live, and Phase 3 covers the part everyone gets bitten by.
- **Already comfortable and here for the hard part?** Jump to [Phase 3: The Hard Part — Invalidation & Staleness](03-invalidation-and-staleness.md) — that's where stale data, TTLs, and eviction live.

## The phases

1. **[What a Cache Actually Is](01-what-a-cache-actually-is.md)** — a copy of an expensive answer kept somewhere fast; hits, misses, and the notepad mental model.
2. **[Where Caches Live](02-where-caches-live.md)** — the browser, the CDN at the edge, your application cache (in-memory / Redis), and the database's own caches; a request traveling through all of them.
3. **[The Hard Part — Invalidation & Staleness](03-invalidation-and-staleness.md)** — why the cached copy and the truth drift apart, TTLs, eviction (LRU), write-through vs. cache-aside, and when *not* to cache.

> This guide stays at the "reason about it" level. Cache stampedes, distributed cache coherence, and tuning Redis for production are deliberately left for a follow-up — you want the mental model solid before any of that helps.

**Related:** [Why Is My Query Slow?](/guides/why-is-my-query-slow) · [Designing for Scale](/guides/designing-for-scale)
