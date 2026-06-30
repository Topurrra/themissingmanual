---
title: "The everyday core: caching, TTLs, and the patterns"
guide: redis-from-zero
phase: 2
summary: "The in-memory data store that does ten jobs: cache, session store, queue, rate limiter, and lock — with data structures, TTLs, and the persistence tradeoff."
tags: [redis, cache, in-memory, data-structures, ttl, pub-sub, persistence, distributed-lock]
difficulty: intermediate
synonyms: ["what is redis", "redis cache tutorial", "redis data types", "redis ttl expire", "rdb vs aof", "redis distributed lock", "cache aside pattern", "redis vs memcached"]
updated: 2026-06-30
---

# The everyday core: caching, TTLs, and the patterns

Most of the Redis you'll write in your life is one pattern: put a copy of something slow in front of the slow thing, with an expiry on it. This phase is that pattern, plus the two things that make it safe — TTLs and eviction — and the day-to-day moves around them. By the end you'll be able to write a cache that doesn't go stale forever and doesn't fall over when memory fills up.

## TTL: the feature that turns a dictionary into a cache

A cache that never forgets is a memory leak. The thing that makes Redis a cache rather than a second database is that keys can expire on their own. You set a key with a time-to-live, and Redis deletes it for you when the clock runs out.

```text
127.0.0.1:6379> SET session:abc "user42" EX 3600
OK
127.0.0.1:6379> TTL session:abc
(integer) 3598
127.0.0.1:6379> SET session:abc "user42" EX 3600
OK
127.0.0.1:6379> EXPIRE session:abc 60
(integer) 1
127.0.0.1:6379> TTL session:abc
(integer) 60
127.0.0.1:6379> PERSIST session:abc
(integer) 1
127.0.0.1:6379> TTL session:abc
(integer) -1
```

*What just happened:* `EX 3600` set the value with a one-hour life. `TTL` shows seconds remaining. `EXPIRE` reset the countdown to 60 seconds, and `PERSIST` removed it entirely — `TTL -1` means "exists, no expiry" (and `-2` means "key doesn't exist"). That `-1` vs `-2` distinction trips everyone up once; remember `-1` is immortal, `-2` is gone.

One subtle trap: a plain `SET key value` (with no `EX`) *clears any existing TTL*. If you cache a value with an hour TTL and later overwrite it with a bare `SET`, the new value lives forever. Always re-set the expiry when you re-set the value, or use `SET key value KEEPTTL` to preserve it.

## Cache-aside: the pattern you'll write a hundred times

The default caching pattern is **cache-aside** (also called lazy loading), and it's worth burning into muscle memory because it's almost always what you want. The application — not Redis — owns the logic. Redis is a dumb fast box; your code decides what goes in it.

The flow is three steps:

```text
1. Read from cache.   GET product:99
   HIT  → return it. Done. (the fast path, ~99% of reads)
   MISS → continue.

2. Read from the real source (the database).
   SELECT * FROM products WHERE id = 99

3. Write the result into the cache with a TTL, then return it.
   SET product:99 <json> EX 300
```

*What just happened:* on a miss, you pay the database cost once, then the next few minutes of reads for that product come from RAM. The TTL is your staleness budget: 300 seconds means a product edit can take up to five minutes to show up. Shorter TTL = fresher data, more database load. That dial is the whole tradeoff.

In code it's the same shape in any language:

```python runnable
# A tiny in-process stand-in for Redis so this runs anywhere.
cache = {}
db = {99: {"id": 99, "name": "Keyboard", "price": 80}}

def get_product(pid):
    key = f"product:{pid}"
    cached = cache.get(key)          # 1. GET product:99
    if cached is not None:
        return ("HIT", cached)
    row = db[pid]                    # 2. miss → read the real source
    cache[key] = row                 # 3. SET product:99 ... EX 300
    return ("MISS", row)

print(get_product(99))   # cold: reads the db, fills the cache
print(get_product(99))   # warm: served from the cache
```

*What just happened:* the first call is a MISS and fills the cache; the second is a HIT served from memory. Swap the `dict` for a real Redis client and add `EX 300` to the set, and this is production cache-aside. The logic lives in your app — that's the defining trait of the pattern.

> The classic cache-aside failure is the **stale write**: you update the database but forget to invalidate or update the cache, so reads serve the old value until the TTL expires. The lazy fix is a short TTL so staleness self-heals; the precise fix is to `DEL product:99` whenever you write to that row. Most teams do both.

## Eviction: what happens when RAM fills up

TTLs handle keys you *expect* to expire. But what about when you've set no TTL, or set them too long, and Redis hits its memory ceiling? That's eviction, controlled by `maxmemory` and `maxmemory-policy`.

```text
# redis.conf (or via CONFIG SET at runtime)
maxmemory 2gb
maxmemory-policy allkeys-lru
```

*What just happened:* you capped Redis at 2 GB and told it that when full, evict the least-recently-used key from the whole keyspace to make room. Without `maxmemory` set, Redis keeps accepting writes until the OS kills it — set a ceiling on any cache.

The policy names look cryptic but decode cleanly. The prefix is *which keys are eligible*; the suffix is *how to pick among them*:

```text
allkeys-*    every key is a candidate          → use this for a pure cache
volatile-*   only keys that have a TTL set      → use when Redis mixes cache + durable data
*-lru        evict least recently USED
*-lfu        evict least frequently USED        → better when some keys are perennially hot
*-random     evict a random candidate
noeviction   evict nothing; reject writes with an error  (the default)
```

*What just happened:* `allkeys-lru` is the standard choice for a dedicated cache — anything can go, oldest-touched first. The default `noeviction` will start returning errors on writes when full, which surprises people who assumed Redis would quietly drop old keys. If Redis is a cache, change the policy; if it's holding data you can't lose, `noeviction` with monitoring is the honest setting.

## When you outgrow request/response: pub/sub and streams

Sometimes you don't want a value, you want a flow of messages between processes. Redis has two tools for that, and they're easy to confuse.

**Pub/sub** is fire-and-forget broadcast. A publisher sends to a channel; whoever is subscribed *right now* gets it. Nobody listening? The message is gone. No history, no replay.

```text
# terminal 1
127.0.0.1:6379> SUBSCRIBE news
Reading messages... (press Ctrl-C to quit)

# terminal 2
127.0.0.1:6379> PUBLISH news "deploy finished"
(integer) 1

# back in terminal 1, it appears:
1) "message"
2) "news"
3) "deploy finished"
```

*What just happened:* terminal 2's `PUBLISH` returned `1` — the number of subscribers that received it. If terminal 1 hadn't been subscribed at that instant, `PUBLISH` would return `0` and the message would vanish. That's the defining trait: pub/sub has no memory.

**Streams** (`XADD` / `XREAD`) are the opposite — an append-only log that persists messages, lets late consumers replay from any point, and supports consumer groups for work distribution. Reach for a stream when losing a message matters (a job that must run, an event you must process). Reach for pub/sub when it's a live notification and a missed one is fine (a "someone is typing" indicator).

```text
127.0.0.1:6379> XADD orders * item "book" qty 2
"1719750000000-0"
127.0.0.1:6379> XADD orders * item "pen" qty 5
"1719750000001-0"
127.0.0.1:6379> XLEN orders
(integer) 2
```

*What just happened:* `XADD ... *` appended an event and let Redis assign the ID (a timestamp plus a sequence number). Unlike pub/sub, these two events are stored — a consumer that connects later can read them with `XREAD`. That durability is the whole reason to pick a stream over pub/sub.

> **In the wild:** a huge amount of "we need a message queue" is satisfied by a Redis list (`LPUSH` to enqueue, `BRPOP` to block-and-pop) or a stream, and teams reach for Kafka or RabbitMQ before they need to. Start with what's already in your stack; graduate when you actually hit its limits.

Phase 3 is the part people skip and then learn the hard way: what Redis actually promises about your data surviving a restart, and why distributed locks are trickier than the blog posts admit.

```quiz
[
  {
    "q": "You cache a value with `SET k v EX 600`, then later overwrite it with a plain `SET k v2`. What's the TTL now?",
    "choices": [
      "Still 600 seconds, counting down from the original set",
      "Reset to 600 seconds",
      "No expiry — the bare SET cleared the TTL, so v2 lives forever",
      "The key is deleted because SET conflicts with the existing TTL"
    ],
    "answer": 2,
    "explain": "A plain SET replaces the value AND clears any existing TTL. Use SET ... KEEPTTL or re-apply EX to preserve expiry."
  },
  {
    "q": "In the cache-aside pattern, on a cache MISS the application should:",
    "choices": [
      "Return an error and let the client retry",
      "Read from the real source, write the result into the cache with a TTL, then return it",
      "Ask Redis to fetch from the database automatically",
      "Block until another request populates the key"
    ],
    "answer": 1,
    "explain": "Cache-aside puts the logic in the app: on a miss, load from the source, populate the cache with a TTL, and return the value. Redis doesn't know about your database."
  },
  {
    "q": "What is the key difference between Redis pub/sub and streams?",
    "choices": [
      "Pub/sub is faster; streams are slower but use less memory",
      "Streams broadcast to all subscribers; pub/sub sends to one consumer",
      "Pub/sub is fire-and-forget with no history; streams persist messages so late consumers can replay them",
      "Pub/sub supports TTLs; streams do not"
    ],
    "answer": 2,
    "explain": "Pub/sub only reaches subscribers connected at publish time and keeps no history. Streams are an append-only log you can replay and consume in groups."
  }
]
```

[← Phase 1: The mental model](01-the-mental-model.md) | [Overview](_guide.md) | [Phase 3: Production reality →](03-production-reality.md)
