---
title: "Redis, From Zero"
guide: redis-from-zero
phase: 1
summary: "The in-memory data store that does ten jobs: cache, session store, queue, rate limiter, and lock — with data structures, TTLs, and the persistence tradeoff."
tags: [redis, cache, in-memory, data-structures, ttl, pub-sub, persistence, distributed-lock]
difficulty: intermediate
synonyms: ["what is redis", "redis cache tutorial", "redis data types", "redis ttl expire", "rdb vs aof", "redis distributed lock", "cache aside pattern", "redis vs memcached"]
updated: 2026-06-30
---

# The mental model: one RAM-speed dictionary

Here's the thing that trips people up: Redis looks like a database, so you assume it works like one — rows, tables, queries, a disk you trust. It doesn't. The fastest way to understand Redis is to stop comparing it to Postgres and start comparing it to a Python dict or a Java HashMap. It's a giant key-value dictionary that lives in RAM, that one process owns, that happens to be reachable over the network.

Once that clicks, everything else — why it's fast, why it's single-threaded, why caching is its natural job — falls out of it.

## A dictionary that lives in memory and answers over the network

A normal database keeps your data on disk and pulls it into memory when you ask. Redis flips that: your data lives in RAM all the time, and disk is only a backup copy (more on that in phase 3). Reading from RAM is roughly a hundred thousand times faster than a random read from a spinning disk and still far faster than an SSD. That single fact — data is already in memory — is most of why Redis is fast.

The other part is that Redis does almost no work per request. A `GET` is a hash lookup. There's no query planner, no join, no scanning rows. You hand it a key, it hands you a value.

```text
redis-cli
127.0.0.1:6379> SET user:42:name "Ada"
OK
127.0.0.1:6379> GET user:42:name
"Ada"
127.0.0.1:6379> EXISTS user:42:name
(integer) 1
127.0.0.1:6379> DEL user:42:name
(integer) 1
```

*What just happened:* you stored a value under a key, read it back, asked whether it exists (1 = yes), and deleted it. The colons in `user:42:name` are pure convention — Redis has no namespaces or tables, but `type:id:field` keys keep a flat keyspace readable, and most tooling assumes that style.

## Single-threaded is a feature, not a flaw

The first time someone hears Redis runs your commands on a single thread, it sounds like a bottleneck. In a world of 32-core machines, one thread? But it's the source of two properties you'd otherwise pay dearly for.

First, **speed through simplicity.** No locks, no mutexes, no coordinating threads fighting over the same dictionary. A command runs start to finish with nothing else touching the data. The CPU spends its time on your work, not on synchronization.

Second, and this is the one people underuse: **every single command is atomic.** Because only one command runs at a time, there's no "halfway" state another client can observe. `INCR` reads, adds one, and writes back as one indivisible step. Two clients hammering the same counter can't lose an update.

```text
127.0.0.1:6379> SET page:views 0
OK
127.0.0.1:6379> INCR page:views
(integer) 1
127.0.0.1:6379> INCR page:views
(integer) 2
127.0.0.1:6379> INCRBY page:views 10
(integer) 12
```

*What just happened:* `INCR` did read-add-write as one atomic step. In application code you'd have a race — two threads read 1, both write 2, you lost a view. Redis can't race here because no two commands overlap. This is why Redis is a natural fit for counters, rate limiters, and ID generators.

> The flip side: one slow command blocks everything. A `KEYS *` on a million-key database, or a huge `SORT`, freezes every other client until it finishes. The single thread that gives you atomicity also gives you one shared lane — phase 3 covers the commands that abuse it.

## The data types are the whole point

If Redis were only a string-to-string dictionary, it'd be a faster Memcached and not much more. What makes it Redis is that the *value* can be a real data structure, and each command operates on that structure server-side. You don't fetch a list, modify it in your app, and write it back. You push onto the list with one command, and Redis does the work next to the data.

Here are the five you'll use constantly, and the shape of problem each one is for.

```text
String   "Ada"                       a value, a counter, a cached JSON blob, a flag
Hash     {name: "Ada", age: 36}      an object with fields — a user, a session
List     [a, b, c]                   ordered, push/pop both ends — a queue or stack
Set      {a, b, c}                   unique members, no order — tags, unique visitors
Sorted   {a:1.0, b:2.5, c:9.0}       members each with a score — leaderboards, ranges
  Set
```

*What just happened:* same key-value model, but the value carries structure. The skill of using Redis well is mostly matching a problem to the right type — a leaderboard is a sorted set, a session is a hash, a job queue is a list.

A hash is worth seeing concretely, because storing an object as one hash beats jamming JSON into a string when you want to read or update single fields:

```text
127.0.0.1:6379> HSET user:42 name "Ada" age 36 plan "pro"
(integer) 3
127.0.0.1:6379> HGET user:42 plan
"pro"
127.0.0.1:6379> HINCRBY user:42 age 1
(integer) 37
127.0.0.1:6379> HGETALL user:42
1) "name"
2) "Ada"
3) "age"
4) "37"
5) "plan"
6) "pro"
```

*What just happened:* you stored a user as a hash, read one field without fetching the rest, and bumped `age` atomically in place. With a JSON-in-a-string approach you'd have to read the whole blob, parse it, change one number, and write it all back — three round trips and a race condition where a hash gives you one atomic command.

And a sorted set, the type people are most surprised Redis has built in — a leaderboard in four commands:

```text
127.0.0.1:6379> ZADD scores 100 "ada" 250 "linus" 175 "grace"
(integer) 3
127.0.0.1:6379> ZADD scores 300 "ada"
(integer) 0
127.0.0.1:6379> ZREVRANGE scores 0 2 WITHSCORES
1) "ada"
2) "300"
3) "linus"
4) "250"
5) "grace"
6) "175"
```

*What just happened:* each member carries a score; Redis keeps them sorted for you. `ZADD scores 300 "ada"` returned `0` because ada already existed — it updated her score rather than adding a new member. `ZREVRANGE 0 2` pulled the top three highest-first. Building this yourself means re-sorting on every write; Redis maintains the order as a side effect of insertion.

## Where this fits

This same dictionary, with these same types, is what people mean by all those different uses. A cache is strings (or hashes) with an expiry. A session store is a hash per user. A job queue is a list you push to and pop from. A rate limiter is a counter with a TTL. A leaderboard is a sorted set. There is no separate "Redis cache product" versus "Redis queue product" — it's one in-memory dictionary, and the use case is which type you pick and what you do with it.

That's the whole mental model. Phase 2 turns it into the patterns you'll actually write: caching with TTLs, the cache-aside flow, and how Redis decides what to evict when RAM fills up.

> **For builders:** this is the same idea behind any cache layer — see [Caching Explained](/guides/caching-explained) for the why-and-when of caching in general, then come back here for the how with Redis specifically.

```quiz
[
  {
    "q": "Why is Redis fast, in one sentence?",
    "choices": [
      "It uses a smarter query planner than relational databases",
      "Data already lives in RAM and each command does almost no work — typically a hash lookup",
      "It runs every command on a separate CPU core in parallel",
      "It compresses data so disk reads are smaller"
    ],
    "answer": 1,
    "explain": "Data is in memory all the time and commands like GET are simple lookups — no planning, no joins, no disk read on the hot path."
  },
  {
    "q": "What does Redis being single-threaded give you, besides simplicity?",
    "choices": [
      "Automatic sharding across cores",
      "Every command is atomic — no two commands overlap, so counters can't race",
      "Unlimited memory because threads share the heap",
      "Faster disk persistence"
    ],
    "answer": 1,
    "explain": "Only one command runs at a time, so operations like INCR are indivisible and two clients can't lose an update. The cost is that one slow command blocks all others."
  },
  {
    "q": "You need a leaderboard that stays sorted by score. Which data type fits?",
    "choices": [
      "A list, pushing each new score",
      "A hash, with player names as fields",
      "A sorted set, with the score as each member's score",
      "A plain string holding sorted JSON"
    ],
    "answer": 2,
    "explain": "A sorted set keeps members ordered by score as a side effect of insertion, so ZREVRANGE gives you the top N without re-sorting."
  }
]
```

[← Overview](_guide.md) | [Phase 2: The everyday core →](02-the-everyday-core.md)
