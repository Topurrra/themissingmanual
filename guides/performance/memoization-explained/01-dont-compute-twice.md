---
title: "Don't compute the same answer twice"
guide: memoization-explained
phase: 1
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

# Don't compute the same answer twice

Take a function that always gives the same output for the same input - no randomness, no reading a clock, no touching a database. Call it `f(5)` and you get a value back; call it again a minute later and you get exactly the same value, guaranteed, because nothing the function depends on has changed. So why did the second call redo all the work to arrive at an answer you already had?

**Memoization** is remembering that answer: the first time you call `f(5)`, you compute it and stash the result in a lookup keyed by the argument, `5`. The next time anything calls `f(5)`, you hand back the stashed value instead of running the function body again - same input, same output, computed once.

> If a function always gives the same answer for the same input, computing that answer twice is pure waste - you're spending time to relearn something you already knew.

## The classic slow example: recursive Fibonacci

The Fibonacci sequence is a textbook example precisely because the naive recursive version is dramatically, needlessly slow - and it's slow for exactly the reason memoization fixes. Each number in the sequence is the sum of the two before it: `fib(n) = fib(n-1) + fib(n-2)`.

```js
function fib(n) {
  if (n <= 1) return n;
  return fib(n - 1) + fib(n - 2);
}
```

*What just happened:* this reads like a direct translation of the math, and it is - but look at what `fib(n - 1)` and `fib(n - 2)` each do internally. `fib(n - 1)` calls `fib(n - 2)` and `fib(n - 3)`, while `fib(n - 2)` calls `fib(n - 3)` and `fib(n - 4)` - so `fib(n - 3)` gets computed by *both* branches, and each of those recomputes its own overlapping subproblems too.

```text
                    fib(5)
                 /          \
            fib(4)          fib(3)
           /      \         /     \
       fib(3)   fib(2)   fib(2)  fib(1)
       /    \    /   \    /   \
   fib(2) fib(1) ...  ...  ...  ...
```

*What just happened:* `fib(3)` appears twice in this tree at depth 2 alone, and `fib(2)` appears three times. Every one of those calls redoes the exact same work as the others with the same argument, and each of those calls re-triggers its own duplicated subcalls. The result is a tree of calls that grows exponentially with `n`, even though there are only `n` distinct answers to compute.

## Watching the blowup

The numbers make the problem concrete. Here's roughly how many times `fib()` gets called, naively, for increasing `n`:

```text
fib(10)  ->            177 calls
fib(20)  ->         21,891 calls
fib(30)  ->      2,692,537 calls
fib(40)  ->    331,160,281 calls
```

*What just happened:* going from `n=10` to `n=40` - four times larger input - turned 177 calls into over 331 million. That's not linear, or even polynomial: naive recursive Fibonacci does roughly `2^n` work for an input of size `n`, yet there are only 41 *distinct* answers between `fib(0)` and `fib(40)`. You're doing 331 million calls to learn 41 numbers you'd only need to learn once each.

## What memoization changes

Now hold onto the fix conceptually, before the mechanics in Phase 2: keep a lookup table from `n` to `fib(n)`. Before computing `fib(n)`, check the table - if it's already there, return it immediately (no recursion, no repeated subtree); if it isn't, compute it the normal way and write the answer into the table before returning.

```text
fib(5) called, not in table -> needs fib(4) and fib(3)
fib(4) called, not in table -> needs fib(3) and fib(2)
fib(3) called, not in table -> needs fib(2) and fib(1)
fib(2) called, not in table -> needs fib(1) and fib(0) -> computes, stores fib(2)
fib(1), fib(0) -> base cases, no computation needed
fib(3) resumes -> already has fib(2) and fib(1) -> computes, stores fib(3)
fib(4) resumes -> already has fib(3) and fib(2) -> computes, stores fib(4)
fib(5) resumes -> already has fib(4) and fib(3) -> computes, stores fib(5)
```

*What just happened:* every distinct value of `n` from 0 to 5 got computed exactly once. The second time anything asks for `fib(3)`, it's a table lookup, not a re-triggered subtree of recursive calls. This turns the `2^n` explosion into something that does roughly `n` total units of work - a change from millions of calls to dozens, for the same input.

## The mental model to keep

One picture: **a function plus a notebook.** Before doing the work, check the notebook for this exact input - if it's written down, read the answer and stop; if not, do the work, then write the answer down before returning it. The notebook is the whole trick - everything in Phase 2 is different ways of building and managing it automatically instead of by hand.

```quiz
[
  {
    "q": "In naive recursive Fibonacci, why does fib(30) end up making millions of calls when there are only 31 distinct answers to compute?",
    "choices": [
      "The function has a bug that causes infinite recursion",
      "The same subproblems (like fib(3) or fib(10)) get recomputed repeatedly across different branches of the call tree",
      "JavaScript recursion is inherently slower than loops",
      "Fibonacci numbers require floating-point precision that slows down each call"
    ],
    "answer": 1,
    "explain": "Overlapping subproblems are the whole issue: fib(n-1) and fib(n-2) both eventually call fib(n-3), fib(n-4), and so on, so the same answer gets rederived over and over."
  },
  {
    "q": "What is the core mechanism of memoization?",
    "choices": [
      "Running the function on a faster machine",
      "Storing a function's result keyed by its arguments, so a repeated call with the same arguments returns the stored result instead of recomputing",
      "Rewriting recursive functions as loops",
      "Compressing the function's return value to save memory"
    ],
    "answer": 1,
    "explain": "Memoization is a lookup: check whether this exact input's answer is already known before doing the work, and store the answer once it's computed."
  },
  {
    "q": "What requirement must a function meet for memoization to give correct results?",
    "choices": [
      "It must be recursive",
      "It must always return the same output for the same input, with no other side effects it depends on or produces",
      "It must run in under one millisecond",
      "It must only take numeric arguments"
    ],
    "answer": 1,
    "explain": "Memoization assumes the same input always deserves the same cached answer. That's only true for pure functions - Phase 2 covers this requirement directly, and Phase 3 covers what breaks when it's violated."
  }
]
```

Watch it animated: [memoization](/explainers/Memoization.dc.html)

[← Overview](_guide.md) | [Phase 2: How to actually implement it →](02-how-to-implement-it.md)
