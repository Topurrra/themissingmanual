---
title: "Redis, From Zero"
guide: redis-from-zero
phase: 0
summary: "The in-memory data store that does ten jobs: cache, session store, queue, rate limiter, and lock - with data structures, TTLs, and the persistence tradeoff."
tags: [redis, cache, in-memory, data-structures, ttl, pub-sub, persistence, distributed-lock]
category: tooling
group: "Messaging & Caching"
order: 14
difficulty: intermediate
synonyms: ["what is redis", "redis cache tutorial", "redis data types", "redis ttl expire", "rdb vs aof", "redis distributed lock", "cache aside pattern", "redis vs memcached"]
updated: 2026-06-30
---

# Redis, From Zero

You added Redis because someone said "put a cache in front of it," and now there's a box in your architecture diagram that holds important state in RAM and you're not totally sure what happens when it restarts. Or you keep seeing Redis used for caching, queues, sessions, locks, leaderboards - and you can't tell if it's one tool or five wearing a trench coat. This guide gives you the single mental model that makes all of those uses click, so you reach for the right data structure instead of cargo-culting commands off a blog post.

## How to read this

Read it in order - each phase builds the model the next one assumes. Phase 1 is the "what it actually is" that everything else hangs off; don't skip it even if you've typed `SET` before. Type the commands into a real `redis-cli` as you go; Redis is fast to poke at, and ten minutes at the prompt beats an hour of reading. By the end you'll know which data type fits a problem, how TTLs turn Redis into a cache, and what the persistence settings really promise.

## The phases

1. [The mental model: one RAM-speed dictionary](01-the-mental-model.md) - why Redis is fast, why single-threaded is a feature, and the data types as the whole point.
2. [The everyday core: caching, TTLs, and the patterns](02-the-everyday-core.md) - cache-aside, expiry, eviction, pub/sub and streams, and the day-to-day commands.
3. [Production reality: persistence, locks, and the sharp edges](03-production-reality.md) - RDB vs AOF, what you lose on a crash, distributed locks and their caveats.

[Phase 1: The mental model: one RAM-speed dictionary](01-the-mental-model.md) →
