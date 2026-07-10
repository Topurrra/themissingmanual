---
title: "How to actually implement it"
guide: memoization-explained
phase: 2
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

# How to actually implement it

The notebook from Phase 1 — check before computing, write down after — can be built by hand, but you'll rarely need to. Most languages give you a ready-made wrapper that turns any pure function into a memoized one with a single line. Here's the by-hand version first, so the wrapper isn't a black box, then the standard tools.

## Building the notebook by hand

The notebook is a lookup keyed by arguments — a map, dictionary, or object, depending on your language. Wrap the function so every call checks the map first.

```js
function memoizedFib(n, cache = {}) {
  if (n in cache) return cache[n];        // check the notebook
  if (n <= 1) return n;

  const result = memoizedFib(n - 1, cache) + memoizedFib(n - 2, cache);
  cache[n] = result;                       // write down the answer
  return result;
}
```

*What just happened:* `cache` is the notebook, keyed by `n`. The first line checks it — if this `n` has already been solved, return the stored answer immediately, no further recursion; if it's missing, the function does the real work and writes the answer into the cache before returning. Every distinct `n` gets computed exactly once, no matter how many times it's asked for across the whole call tree.

The argument becomes the key. If a function takes multiple arguments, the key is typically all of them combined — often as a string like `"3,7"` for arguments `3` and `7`, since most map/dictionary types need a single hashable key rather than a raw list of arguments.

## Decorators and higher-order functions

Writing the cache-check-and-store logic by hand for every function you want to memoize gets repetitive fast, and it clutters the function's real logic with bookkeeping. The standard move is to let a **decorator** (Python) or a **higher-order function** (JavaScript and most other languages) do that wrapping for you — you write the plain function, and a small piece of reusable code adds the caching behavior around it.

Python's standard library ships this as `functools.lru_cache`:

```python
from functools import lru_cache

@lru_cache(maxsize=None)
def fib(n):
    if n <= 1:
        return n
    return fib(n - 1) + fib(n - 2)
```

*What just happened:* the function body is exactly the naive, slow-looking version from Phase 1 — no cache dictionary, no manual lookup. The `@lru_cache` line above it does all of that automatically: every call gets checked against an internal cache keyed by its arguments before the function body ever runs, so you get the notebook behavior without writing the notebook logic yourself. ("LRU" stands for least-recently-used, which matters for Phase 3.)

React's `useMemo` is the same underlying idea applied to a specific problem: avoiding an expensive recalculation on every render.

```jsx
const sortedItems = useMemo(() => {
  return expensiveSort(items);
}, [items]);
```

*What just happened:* `expensiveSort(items)` only re-runs when `items` changes between renders — that's the array on the second line, called the dependency list. If the component re-renders for an unrelated reason (a different piece of state changed) and `items` is the same reference it was last time, React hands back the previously computed `sortedItems` instead of re-sorting. Same principle as `lru_cache`, adapted to "the arguments" meaning "the values in this dependency list" rather than literal function parameters.

## The hard requirement: purity

None of this works correctly unless the function is **pure** — the same input always produces the same output, and the function has no side effects it relies on or creates. This isn't a style preference; it's the load-bearing assumption memoization is built on.

```text
pure (safe to memoize):
  function square(n) { return n * n; }
  -> square(4) is always 16, forever, no matter what else is happening

not pure (unsafe to memoize):
  function getDiscount(userId) { return database.lookupDiscount(userId); }
  -> the database row for userId can change between calls
```

*What just happened:* `square` only depends on its argument, so caching `square(4) = 16` is always correct — there's no way for that answer to become wrong later. `getDiscount` looks like a function with one argument, but its real answer depends on the database row behind the scenes, which can change independently of `userId` — memoizing it would mean returning a discount that used to be true, silently, forever, even after the real value changed. The function signature doesn't tell you which category something falls into; you have to know what it depends on.

> A memoized function is only as trustworthy as the purity of the function underneath it. Cache a pure function and you get free speed with no downside. Cache an impure one and you get a fast, confidently wrong answer.

## The mental model to keep

Memoizing a function is really two decisions bundled into one line of code: "wrap this in a cache" and "I am asserting this function is pure." The wrapper — hand-rolled, `@lru_cache`, or `useMemo` — handles the mechanics; the notebook idea from Phase 1 is all that's happening underneath, and you're responsible for the assertion. Phase 3 covers what happens when that assertion turns out to be false, and the other ways this technique backfires even when the function genuinely is pure.

[← Phase 1: Don't compute the same answer twice](01-dont-compute-twice.md) | [Overview](_guide.md) | [Phase 3: When it backfires →](03-when-it-backfires.md)
