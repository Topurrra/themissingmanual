---
title: "Binary Search, Implemented"
guide: "sorting-and-searching-explained"
phase: 2
summary: "The real binary search algorithm on a sorted array - the iterative version, its O(log n) complexity, and the off-by-one bugs (wrong midpoint, wrong bound update) that trip up almost everyone the first time."
tags: [algorithms, binary-search, off-by-one, big-o, complexity]
difficulty: beginner
synonyms: ["binary search algorithm code", "binary search python implementation", "binary search off by one bug", "iterative binary search", "how to implement binary search"]
updated: 2026-07-10
---

# Binary Search, Implemented

Phase 1 gave you the idea: keep halving. This phase writes it as real, correct code - and walks through the
exact bugs that catch people the first time they implement it themselves.

## The iterative version

Keep two pointers, `lo` and `hi`, marking the range you still need to search. Each step checks the middle;
if it's not a match, you shrink the range to whichever half could still contain the target.

```python runnable
def binary_search(items, target):
    lo, hi = 0, len(items) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if items[mid] == target:
            return mid
        elif items[mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return -1

names = ["Ada", "Alan", "Grace", "Linus", "Margaret", "Xu"]
print(binary_search(names, "Linus"))
print(binary_search(names, "Bob"))
```
```console
3
-1
```
*What just happened:* `lo` and `hi` start at the two ends of the list. Each loop checks `items[mid]`: an
exact match returns immediately; too small means the target must be to the right, so `lo` moves past `mid`;
too big means it must be to the left, so `hi` moves before `mid`. The loop keeps shrinking the range until
either it finds the target or `lo` crosses `hi` - meaning the range is empty and the target isn't present.

## The complexity: O(log n)

Every iteration cuts the range roughly in half, so the loop runs about `log₂(n)` times before it either
finds the target or the range empties out. For a million items, that's about 20 iterations - not a million.
That's the entire reason binary search exists: turning a search that gets slower as data grows into one that
barely notices.

## The classic off-by-one gotchas

Binary search is short, which is exactly why small mistakes are easy to make and hard to spot. Three to
watch for:

⚠️ **Wrong loop condition: `<` instead of `<=`.** If you write `while lo < hi:` instead of `while lo <= hi:`,
you'll miss the case where the target is exactly at the last remaining index - a single-element range
(`lo == hi`) never gets checked, and a valid target can be reported as missing.

⚠️ **Forgetting to move past `mid`.** If a mismatch sets `lo = mid` (instead of `mid + 1`) or `hi = mid`
(instead of `mid - 1`), the range never shrinks on that side, and the loop can spin forever comparing the
same middle value over and over.

⚠️ **Midpoint overflow (mostly a lower-level-language concern).** `(lo + hi) // 2` is fine in Python - integers
don't overflow - but in languages with fixed-size integers (C, Java), `lo + hi` can itself overflow before
the division happens, for large enough indices. The safer, equivalent form is `lo + (hi - lo) // 2`. Worth
knowing even in Python, since it's the version you'll see in other languages' standard libraries.

```python runnable
# a broken variant: forgets to move past mid on a miss
def broken_search(items, target):
    lo, hi = 0, len(items) - 1
    steps = 0
    while lo <= hi and steps < 5:   # capped so this demo doesn't actually hang
        steps += 1
        mid = (lo + hi) // 2
        if items[mid] == target:
            return mid, steps
        elif items[mid] < target:
            lo = mid            # bug: should be mid + 1
        else:
            hi = mid - 1
    return -1, steps

print(broken_search([1, 2, 3, 4, 5], 5))
```
```console
(-1, 5)
```
*What just happened:* because `lo = mid` never actually moves past the checked index, the search keeps
re-checking a range that never shrinks on the low side. The demo caps it at 5 steps so it terminates and
shows you the failure instead of hanging - a real, unbounded version of this bug is an infinite loop.

## Recursive version, briefly

The same idea also reads naturally as recursion (see
[Recursion, Finally](/guides/recursion-finally-clicks) if that's new to you): shrink the range, and hand the
smaller range to a call of yourself, trusting it to handle the rest.

```python runnable
def binary_search_recursive(items, target, lo=0, hi=None):
    if hi is None:
        hi = len(items) - 1
    if lo > hi:
        return -1
    mid = (lo + hi) // 2
    if items[mid] == target:
        return mid
    elif items[mid] < target:
        return binary_search_recursive(items, target, mid + 1, hi)
    else:
        return binary_search_recursive(items, target, lo, mid - 1)

print(binary_search_recursive([1, 3, 5, 7, 9, 11], 7))
```
```console
3
```
Both versions do the same work in the same `O(log n)` time - the iterative form avoids the (small, but real)
overhead of extra function calls, which is why it's the more common choice in practice.

```quiz
[
  {
    "q": "Why does binary search run in O(log n) instead of O(n)?",
    "choices": ["It checks fewer items by luck", "Each comparison halves the remaining search range", "It skips every other item", "It only works on small lists"],
    "answer": 1,
    "explain": "Halving the range every step means the number of steps grows only with log₂(n), not n itself."
  },
  {
    "q": "What bug does forgetting to set `lo = mid + 1` (using `lo = mid` instead) cause?",
    "choices": ["It searches the wrong half entirely", "The range never shrinks on that side, risking an infinite loop", "It only affects the very first comparison", "Nothing - the result is still correct"],
    "answer": 1,
    "explain": "If lo stays at mid instead of moving past it, the same middle index can be re-checked forever without the range ever narrowing."
  },
  {
    "q": "Why is `lo + (hi - lo) // 2` sometimes preferred over `(lo + hi) // 2`?",
    "choices": ["It's faster in Python", "It avoids integer overflow in languages with fixed-size integers", "It rounds differently and is more accurate", "It works for unsorted lists too"],
    "answer": 1,
    "explain": "In languages without Python's arbitrary-precision integers, lo + hi can overflow before the division happens for large indices; the rewritten form avoids that."
  }
]
```

---

[← Phase 1: Linear vs. Binary Search](01-linear-vs-binary-search.md) · [Guide overview](_guide.md) · [Phase 3: Bubble Sort →](03-bubble-sort.md)
