---
title: "When it backfires"
guide: memoization-explained
phase: 3
summary: "How caching a pure function's return value by its arguments lets you skip redoing the same expensive work twice, and where that trick quietly breaks."
tags: [performance, memoization, caching, functions, recursion]
difficulty: intermediate
synonyms:
  - what is memoization
  - memoization vs caching
  - functools lru_cache
  - useMemo explained
  - cache function results by arguments
  - why is recursive fibonacci slow
updated: 2026-07-10
---

# When it backfires

Memoization trades memory for time - you spend space storing answers so you never spend time recomputing them. That trade is excellent right up until the memory side stops being free, or until the function you cached wasn't safe to cache in the first place. Both failure modes are quiet: nothing crashes or throws an error, things just get slowly worse, or silently wrong.

## Unbounded memory growth

The notebook from Phase 1 has to live somewhere, and if nothing ever removes entries from it, it grows for as long as the program runs. A function memoized with no limit, called with a constantly widening range of arguments, builds a cache that never shrinks.

```text
day 1:  cache has entries for inputs seen so far -> a few thousand
day 30: cache still holds every entry from day 1, plus everything since
day 90: cache is enormous, most entries haven't been looked up in weeks
```

*What just happened:* nothing here is a bug in the traditional sense - every entry in that cache is a correct, validly computed answer. The problem is that the cache has no concept of "this entry is probably never getting asked for again," so it holds onto all of it, forever, using memory that could otherwise be freed. Left running long enough, this is a slow memory leak with a caching mechanism as the vehicle.

This is exactly why real memoization tools bound themselves. `functools.lru_cache(maxsize=128)` keeps at most 128 entries - once it's full, adding a new one evicts the **least recently used** entry to make room. That's what the "LRU" in the name means: it's a cache with an eviction policy built in, precisely so it doesn't grow without limit.

```python
@lru_cache(maxsize=128)   # bounded - old, unused entries get evicted
def expensive(n):
    ...

@lru_cache(maxsize=None)  # unbounded - every entry lives forever
def risky(n):
    ...
```

*What just happened:* `maxsize=None` is a legitimate choice when you know the space of possible arguments is small and fixed - Fibonacci of `n` up to, say, 90 has at most 91 possible cache entries, ever. It's a dangerous default when the arguments come from open-ended input, like user IDs or search queries, where the number of distinct inputs can keep growing indefinitely.

> A cache with no eviction policy isn't really a cache. It's a growing pile of memory with lookup syntax.

## Memoizing something that isn't actually pure

Phase 2 named purity as the hard requirement. Here's what actually happens when that requirement is quietly violated - not a crash, but a wrong answer delivered with total confidence.

```python
@lru_cache(maxsize=None)
def get_price(product_id):
    return database.lookup_price(product_id)   # reads live data
```

*What just happened at first:* `get_price(42)` runs, hits the database, gets back `19.99`, and caches it. Every subsequent call to `get_price(42)` returns `19.99` from the cache - fast, and correct, for now.

*What happens next:* the product's price changes in the database - a sale ends, a price update ships. `get_price(42)` is called again, but it does not go back to the database: it returns `19.99` from the cache, because as far as the memoization wrapper is concerned, `42` is `42` and the cached answer is still sitting right there. The function keeps returning the stale price for as long as the process runs, with no error, no warning, and nothing in the logs to suggest anything is wrong - worse than a crash, because a crash gets noticed and fixed, while a silently stale cached value just ships to customers.

The fix isn't a trick - it's recognizing that `get_price` was never actually pure, so it was never a valid memoization candidate. The real options are: don't memoize it, memoize a genuinely pure sub-piece of it if one exists, or reach for something built to handle values that intentionally change over time - which is the next distinction.

## How this differs from general-purpose caching

Memoization and "a cache" are related but not the same thing, and conflating them is where a lot of the confusion above comes from.

```text
memoization:        per-function, per-process, tied to one pure function's
                     arguments, usually lives only as long as that process
                     runs, no built-in concept of "this value expired"

general cache
(e.g. Redis):        shared across processes and machines, explicit
                     time-to-live (TTL) so entries expire on purpose,
                     built for values that are *expected* to change,
                     with explicit invalidation when they do
```

*What just happened:* memoization has no concept of time passing - it assumes the answer for a given input is eternally true, because that's exactly what purity guarantees. A general-purpose cache like Redis is built for the opposite assumption: the underlying data *will* change, so every entry gets a TTL (an expiration time) and the application explicitly invalidates entries when it knows the underlying data changed. `get_price` from the example above belongs in a system like that - a cache with a TTL of a few minutes, or explicit invalidation when a price updates - not in a memoization wrapper that never expires anything.

The dividing line: memoization is for computation you want to avoid repeating on unchanging pure math. A shared cache is for data you're willing to serve slightly stale, on purpose, for a bounded window, with a plan for when it goes stale.

[← Phase 2: How to actually implement it](02-how-to-implement-it.md) | [Overview](_guide.md)
