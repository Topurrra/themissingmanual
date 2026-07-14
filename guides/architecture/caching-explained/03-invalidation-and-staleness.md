---
title: "The Hard Part - Invalidation & Staleness"
guide: "caching-explained"
phase: 3
summary: "Caches hold copies, so the copy can drift from the truth - that's staleness. This phase covers TTLs, eviction (LRU), write-through vs. cache-aside, and when not to cache at all."
tags: [caching, cache-invalidation, staleness, ttl, eviction, lru, write-through, cache-aside]
difficulty: intermediate
synonyms: ["what is cache invalidation", "why is my cache stale", "what is a ttl", "what is cache eviction", "what is lru", "write-through vs cache-aside", "when not to cache", "why is old data showing", "cache showing wrong data"]
updated: 2026-07-10
---

# The Hard Part - Invalidation & Staleness

Everything so far has been the friendly half of caching: keep a copy, serve it fast. This phase is the half that bites. A user updates their profile and the old name keeps showing. A price changes but checkout shows the old one. You deploy a fix and half your users still see the bug. Every one of these follows from the idea you've held since Phase 1: **the cache holds a copy, but the truth lives elsewhere.** The moment the truth changes, every copy of the old answer becomes a lie waiting to be served.

⚠️ Phil Karlton's famous line - *"There are only two hard things in Computer Science: cache invalidation and naming things"* - is a joke pointing at something real. Keeping a copy is trivial. Knowing *when the copy has gone wrong and must be thrown away* is the hard part, and it's why caching causes as many bugs as it prevents.

## Staleness: when the copy and the truth disagree

**What it actually is.** *Staleness* is when a cache serves a copy that's no longer true, because the underlying data changed but the cached copy didn't. The cache isn't broken - it's doing exactly its job, faithfully serving the answer it was told to remember. It just wasn't told the answer expired.

```text
   Time 1:  DB says name = "Sam"     Cache stores "Sam"     ✓ copy matches truth
   Time 2:  user updates name to "Sammy"  ──► DB now says "Sammy"
            ...but cache still holds "Sam"  ✗ copy now STALE
   Time 3:  request comes in → cache HIT → serves "Sam"     ← the bug
```

*What just happened:* between Time 1 and Time 2 the truth changed in the database, but nothing told the cache. At Time 3 the cache does what a cache does - returns its copy on a hit - and that copy is now wrong. No error, no crash. Just an old answer served confidently. This is the entire category of "why is it showing the old value" bugs.

📝 **Terminology.** *Cache invalidation* is the act of telling a cache "this copy is no longer trustworthy - throw it away (or refresh it)." Good caching is mostly about getting invalidation right, and it's hard because the code that *changes the truth* often lives far from the code that *holds the copy*, and the two have to stay in sync.

## TTL: let copies expire on a timer

**What it actually is.** The simplest way to limit staleness is a *TTL* - "time to live." When you store a copy, you stamp it with a lifespan: "good for 60 seconds." After that, the cache treats the copy as expired - the next request is a miss, the real work runs, and a fresh copy is stored.

```text
   cache.set("user:42:profile", value, ttl = 60s)

   t=0s   store copy        (fresh)
   t=30s  request → HIT     (still within 60s, serve copy)
   t=70s  request → MISS    (past 60s, copy expired → re-fetch the truth)
```

**What it does in real life.** A TTL caps *how stale* a copy can ever be. A 60-second TTL means "I accept showing data up to a minute old, in exchange for not hammering the database every request." There's no universal right number, just the right number *for this data's tolerance for being wrong* - stock prices might tolerate seconds, a "most popular articles" list an hour, a bank balance none at all.

⚠️ **Gotcha.** A long TTL hides bugs in slow motion. You fix data in the database, refresh the page, and it's still wrong - so you assume your fix failed and start debugging code that's already correct. Always ask "is there a TTL between me and the truth?" before concluding a change didn't work.

## Eviction: caches are small, so old copies get pushed out

**What it actually is.** A cache lives in fast, limited space (RAM is smaller and pricier than disk), so when it fills up it must throw something out to make room. *Eviction* is that process - separate from expiry. A TTL removes a copy because it got *old*; eviction removes a copy because the cache is *full*.

**The common strategy: LRU.** The usual rule is *LRU* - "least recently used." When space is needed, evict the copy that hasn't been touched in the longest time, on the bet that what you haven't used lately you're least likely to need next.

```text
   Cache is full. New item needs room. LRU evicts the coldest copy:

   recently used  ←─────────────────────────►  not used in ages
   [ home ][ profile ][ search ][ ... ][ old-report ]
                                              └─ evicted to make room
```

**Why this saves you later.** LRU explains a confusing symptom: a cache that "randomly" misses on data you *did* cache. It wasn't random - that copy was evicted because the cache filled up and it was the coldest thing in there. A mysteriously low hit rate often means the cache is too small for your working set, evicting copies before they get reused - a sizing problem, not a logic bug.

## Two strategies for keeping copies accurate

When the truth changes, *something* has to keep the cache in line. Two patterns cover most real systems.

| | **Cache-aside (lazy)** | **Write-through** |
|---|---|---|
| **Reads** | App checks cache; on a miss, reads the DB and stores the copy | Same - read from cache, fall back to DB |
| **Writes** | App writes the DB, then *deletes* (invalidates) the cached copy | App writes the DB *and* updates the cache in the same step |
| **Next read after a write** | Miss → re-fetches fresh from DB → re-caches | Hit → cache already holds the new value |
| **Strength** | Simple; cache only ever holds things actually requested | Cache and DB stay in sync on every write; fewer stale windows |
| **Weakness** | A window of staleness if invalidation is missed or races a read | More write-time work; you cache things that may never be read |

**Cache-aside** is the most common pattern - the `cache.get` / `cache.set` flow from Phase 1, plus one rule: *when you change the truth, invalidate the copy.* The discipline is remembering that delete-on-write everywhere the data can change. **Write-through** keeps the cache updated as part of writing, so a read right after a write sees the new value - trading extra work on every write for fewer stale moments.

⚠️ **Gotcha.** Neither pattern removes the danger; they relocate it. With cache-aside, the bug is *forgetting to invalidate* - one code path updates the database but doesn't clear the copy, and that field goes stale forever until its TTL (if it has one) saves you. With write-through, a write that updates the DB but fails partway can leave the cache and DB disagreeing. You're choosing which failure shape you'd rather debug.

## When *not* to cache

Sometimes the right amount of caching is none. Skip it (or be very careful) when:

- **The data must always be correct, to the moment.** Account balances, inventory counts at checkout - anywhere a stale value causes real harm.
- **The data is barely reused.** Per-user, per-request, one-off answers (Phase 1's lesson): no repetition, no payoff - only overhead and staleness risk.
- **It changes far more than it's read.** You'll spend more effort invalidating copies than you ever save serving them.
- **The underlying work is already cheap and fast.** Caching something already instant adds a layer to keep accurate for a saving you won't notice. Measure first - and if the slow thing is a database query, [Why Is My Query Slow?](/guides/why-is-my-query-slow) is often the better fix than a cache papering over it.

💡 **Key point.** A cache is a deliberate trade: speed and load relief in exchange for the *risk and effort of keeping copies accurate*. When the data tolerates being a little old and gets read repeatedly, that trade is a clear win. When it must be exact, or is rarely reused, you're paying the cost of caching for none of the benefit. Decide on purpose, not by reflex.

## Recap

1. **Staleness is the core problem:** the cache holds a copy, the truth changes elsewhere, and the now-wrong copy keeps getting served on hits. No crash - just an old answer.
2. **Cache invalidation** - throwing away a copy that's no longer trustworthy - is the genuinely hard part, because the code that changes the truth is often far from the code that holds the copy.
3. **A TTL** caps how stale a copy can get by expiring it on a timer; the right TTL equals how much staleness this data tolerates. Long TTLs hide working fixes - always check for one before assuming a change failed.
4. **Eviction** removes copies because the cache is *full* (commonly **LRU** - drop the coldest); it explains "random" misses on data you thought you cached.
5. **Cache-aside vs. write-through** are the two main ways to keep copies accurate - one invalidates on write, the other updates on write - and each relocates the danger rather than removing it.
6. **Don't cache** data that must be exact, is barely reused, changes more than it's read, or is already fast. Caching is a trade; make it on purpose.

You now hold the whole idea: a cache is a copy of an expensive answer kept somewhere fast (Phase 1), those copies live stacked from the browser to the database (Phase 2), and the real work is keeping each copy true to the truth (Phase 3). That's why the old joke survives - and why, the next time something shows the wrong value, your first thought will be the right one: *which layer is holding a stale copy?*

**Related:** [Why Is My Query Slow?](/guides/why-is-my-query-slow) · [Designing for Scale](/guides/designing-for-scale)

---

[← Phase 2: Where Caches Live](02-where-caches-live.md) · [Guide overview](_guide.md)
