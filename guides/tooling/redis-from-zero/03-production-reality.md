---
title: "Production reality: persistence, locks, and the sharp edges"
guide: redis-from-zero
phase: 3
summary: "The in-memory data store that does ten jobs: cache, session store, queue, rate limiter, and lock — with data structures, TTLs, and the persistence tradeoff."
tags: [redis, cache, in-memory, data-structures, ttl, pub-sub, persistence, distributed-lock]
difficulty: intermediate
synonyms: ["what is redis", "redis cache tutorial", "redis data types", "redis ttl expire", "rdb vs aof", "redis distributed lock", "cache aside pattern", "redis vs memcached"]
updated: 2026-06-30
---

# Production reality: persistence, locks, and the sharp edges

The honeymoon ends the first time a Redis node restarts and you find out — in production — exactly how much data it was actually keeping safe. Everything in phase 1 lives in RAM, and RAM is gone when the process dies. This phase is the grown-up conversation: what Redis really promises about durability, why distributed locks are harder than they look, and the handful of commands that will freeze your server if you let them.

## The persistence tradeoff: RDB vs AOF

Redis can write your in-memory data to disk so it survives a restart. There are two mechanisms, and the difference is *snapshot* versus *log*.

**RDB (snapshot):** every so often, Redis forks and dumps the entire dataset to a single compact file (`dump.rdb`). Fast to load, small on disk, near-zero overhead while running. The catch is right there in "every so often" — if you snapshot every five minutes and crash at minute four, you lose four minutes of writes.

**AOF (append-only file):** Redis logs every write command to a file as it happens. On restart it replays the log to rebuild state. Far less data loss, but a larger file and some ongoing write overhead.

```text
# redis.conf

# RDB: snapshot if 1+ key changed in the last 900s, or 100+ in 60s, etc.
save 900 1
save 300 100

# AOF: log every write; fsync to disk once per second
appendonly yes
appendfsync everysec
```

*What just happened:* this is the common production setup — both enabled. RDB gives you a fast-loading backup; AOF caps your worst-case loss at roughly one second (`appendfsync everysec`). You *can* set `appendfsync always` for near-zero loss, but it fsyncs on every write and tanks throughput. The honest default most teams run is `everysec`: lose at most a second, keep the speed.

The decode table:

```text
                 RDB snapshot        AOF log
data loss        minutes (last snap) ~1s with everysec
restart speed    fast                slower (replays the log)
file size        small               larger
runtime cost     near zero           small, continuous
```

*What just happened:* RDB optimizes for restart speed and disk size; AOF optimizes for durability. Running both gets you AOF's durability with RDB as a fast-loading fallback.

> **The line to internalize:** even with AOF, Redis is not a database you bet irreplaceable data on. It's a fast store with *configurable* durability, and the fast settings lose data on a crash. If a record absolutely cannot be lost, the source of truth belongs in a real database — Redis holds a copy. Treat persistence as "warm restart" insurance, not as a durability guarantee.

## Distributed locks: the sharp edge everyone cuts themselves on

You'll eventually want to make sure only one process does something at a time across your fleet — run a cron once, not five times; charge a card once, not twice. Redis is the usual reach, and the *naive* version is genuinely dangerous, so let's build up to the safe one.

The wrong way you'll see first:

```text
127.0.0.1:6379> SETNX lock:job1 "worker-A"
(integer) 1
# ... do the work ...
127.0.0.1:6379> DEL lock:job1
```

*What just happened:* `SETNX` ("set if not exists") returned 1, so worker-A "got the lock." The bug: if worker-A crashes before the `DEL`, the lock is held *forever* and the job never runs again. A lock with no expiry is a deadlock waiting for a crash.

The correct primitive sets the value and the TTL atomically, so a crash can't leave the lock stuck:

```text
127.0.0.1:6379> SET lock:job1 "worker-A-uuid-123" NX EX 30
OK
# ... do the work (must finish well under 30s) ...
# release ONLY if we still own it — checked atomically in Lua:
127.0.0.1:6379> EVAL "if redis.call('GET', KEYS[1]) == ARGV[1] then return redis.call('DEL', KEYS[1]) else return 0 end" 1 lock:job1 worker-A-uuid-123
(integer) 1
```

*What just happened:* `SET ... NX EX 30` acquired the lock *and* gave it a 30-second self-destruct in one atomic command — a crash releases it automatically. The release uses a unique token (`worker-A-uuid-123`) and a Lua script so the check-and-delete is atomic. Why the token matters: if worker-A stalled past 30s, the lock expired and worker-B took it; a blind `DEL` from A would then delete *B's* lock. The token check stops you from releasing a lock you no longer own.

But here's the part the tutorials skip: **even this is not a perfect lock.** If worker-A pauses (a long GC, a network hiccup) for longer than the TTL, the lock expires, worker-B starts the job, and now *both* are running — A doesn't know its lock died. On a single Redis node this is the best you get, and it's fine for "mostly once" jobs. For genuine correctness-critical mutual exclusion across nodes, people reach for the Redlock algorithm — and even Redlock is debated by distributed-systems experts.

> The lazy, honest answer: if double-execution would be catastrophic (double-charging a card), don't rely on a Redis lock alone — make the operation **idempotent** (a unique key the database rejects on the second insert) so running it twice is harmless. A Redis lock is a cheap way to *reduce* contention, not a guarantee of exactly-once.

## The commands that freeze your server

Remember from phase 1: one thread, one lane. A slow command blocks every other client. A few are infamous for it.

```text
KEYS *                 scans the ENTIRE keyspace, blocking — never in production
FLUSHALL               wipes everything, synchronously by default
SMEMBERS huge:set      returns a million-element set in one blocking call
HGETALL huge:hash      same problem on a large hash
```

*What just happened:* each of these can stall Redis for seconds on a large dataset while every other request waits. The fixes: use `SCAN` (cursor-based, incremental) instead of `KEYS`; use `SSCAN` / `HSCAN` for large collections; and run `FLUSHALL ASYNC` if you must flush. `SCAN` is the one to wire into your reflexes — `KEYS` in a code review should always get a comment.

```text
127.0.0.1:6379> SCAN 0 MATCH user:* COUNT 100
1) "176"                 # the cursor for the next call (0 means done)
2) 1) "user:42"
   2) "user:7"
```

*What just happened:* `SCAN` returned a cursor (`176`) and a batch of matches. You call it again with that cursor, repeating until it returns `0`. It never blocks the server for long because it walks the keyspace in small chunks — the boring, safe way to iterate keys.

## The mental model, completed

You started with "Redis is a RAM-speed dictionary." Now you know the full shape: a single-threaded, in-memory key-value store whose values are real data structures, that expires keys for caching, evicts under memory pressure, and offers *configurable* — not absolute — durability and locking. Use it as the fast layer in front of your real database, lean on its data types instead of doing the work in your app, set a `maxmemory` and an eviction policy, pick your persistence by how much loss you can tolerate, and never trust a single Redis lock for something that must happen exactly once.

> **For builders:** when Redis itself becomes the bottleneck — too much data for one node, or too many writes — the path is replicas and sharding (Redis Cluster), which is the same scaling story databases face. [Scaling a Database](/guides/scaling-a-database) covers the read-replica and sharding patterns that apply here too.

```quiz
[
  {
    "q": "With `appendfsync everysec` (AOF) and the standard RDB snapshots, what's the realistic worst-case data loss on a crash?",
    "choices": [
      "Zero — AOF guarantees no loss",
      "About one second of writes",
      "Everything since the last RDB snapshot, possibly minutes",
      "All in-memory data, since persistence only runs on shutdown"
    ],
    "answer": 1,
    "explain": "everysec fsyncs the AOF roughly once a second, so a crash loses at most about a second of writes. always is near-zero but much slower; RDB alone could lose minutes."
  },
  {
    "q": "Why does a safe Redis lock release use a unique token checked in a Lua script, instead of a plain DEL?",
    "choices": [
      "DEL is too slow on large keys",
      "So that if your lock already expired and another worker acquired it, you don't delete their lock",
      "Lua scripts run on a separate thread for speed",
      "Because SETNX cannot be combined with EXPIRE"
    ],
    "answer": 1,
    "explain": "If your TTL expired and another worker took the lock, a blind DEL would release THEIR lock. The token check (atomic via Lua) ensures you only delete a lock you still own."
  },
  {
    "q": "Which command should replace `KEYS *` in production, and why?",
    "choices": [
      "SCAN, because it iterates the keyspace incrementally without blocking the single thread for long",
      "FLUSHALL, because it's faster",
      "HGETALL, because it returns everything at once",
      "SUBSCRIBE, because it streams keys"
    ],
    "answer": 0,
    "explain": "KEYS * scans the whole keyspace in one blocking call, freezing every other client. SCAN walks it in small cursor-based batches, so the server stays responsive."
  }
]
```

[← Phase 2: The everyday core](02-the-everyday-core.md) | [Overview](_guide.md)
