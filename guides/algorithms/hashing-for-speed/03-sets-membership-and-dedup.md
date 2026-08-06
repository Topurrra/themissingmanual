---
title: "Sets, Membership & Dedup"
guide: "hashing-for-speed"
phase: 3
summary: "The set as a hash map with keys but no values: O(1) membership tests, de-duplication that keeps first-seen order, finding the first repeat, and the gotchas - unhashable keys like lists, worst-case collision slowdown, and why set iteration order is not guaranteed."
tags: [algorithms, hashing, set, membership, deduplication, gotchas]
difficulty: beginner
synonyms: ["python set membership o(1)", "remove duplicates keep order", "find first duplicate in list", "unhashable type list set", "set vs dict ordering", "hash collision worst case"]
updated: 2026-08-06
---

# Sets, Membership & Dedup

The last piece is the **set**. A set is just a hash map that stores keys and no values - so it inherits the
same `O(1)` average membership test, minus the bookkeeping of associated data. Whenever the only question is
*"have I seen this before?"*, a set is the right tool.

## Membership: "is this in the collection?"

Testing membership against a set is constant time, the same buckets-and-hash idea from Phase 1. Against a
list it would be a linear scan.

```python runnable
banned = {"root", "admin", "guest"}   # a set literal

print("admin" in banned)
print("alice" in banned)
```
```console
True
False
```
*What just happened:* each `in` test hashed the string and checked one bucket - no walking the collection.
For a handful of names it hardly matters, but for a blocklist of a million entries checked on every request,
set-vs-list is the difference between instant and sluggish.

## De-duplication that preserves order

Need the unique items, in the order they first appeared? Walk once, keeping a set of what you've already
emitted. The set answers "seen it?" in `O(1)`; the result list keeps the original order.

```python runnable
def dedupe(items):
    seen = set()
    result = []
    for x in items:
        if x not in seen:
            seen.add(x)
            result.append(x)
    return result

print(dedupe([3, 1, 3, 2, 1, 1, 5]))
```
```console
[3, 1, 2, 5]
```
*What just happened:* the first time each value shows up it's added to both `seen` and `result`; every later
repeat is caught by `x not in seen` and skipped. One pass, order preserved. (If you *don't* care about
order, `list(set(items))` is the one-liner - but it may reorder the elements, for reasons we hit at the
bottom of this phase.)

## Finding the first duplicate

Same set, slightly different question: what's the first value that repeats? Return it the moment you see a
value already in the set.

```python runnable
def first_duplicate(items):
    seen = set()
    for x in items:
        if x in seen:
            return x
        seen.add(x)
    return None

print(first_duplicate([2, 4, 3, 4, 5, 2]))
```
```console
4
```
*What just happened:* `2`, `4`, `3` all go into `seen` as first sightings. The next `4` is already there, so
it's returned immediately - the scan stops early instead of running to the end. `2` also repeats later, but
`4`'s repeat comes first.

## Gotcha 1: keys (and set members) must be hashable

A hash map can only hash things that don't change - so **mutable** values like lists and dicts can't be keys
or set members. Immutable ones (numbers, strings, tuples) are fine.

```python runnable
seen = set()
seen.add((1, 2))          # a tuple is immutable -> hashable, fine
print((1, 2) in seen)

try:
    seen.add([1, 2])      # a list is mutable -> unhashable
    print("added a list?!")
except TypeError:
    print("Cannot add a list: unhashable type")
```
```console
True
Cannot add a list: unhashable type
```
*What just happened:* the tuple `(1, 2)` hashes fine and goes in. Trying to add the list `[1, 2]` raises a
`TypeError` for an unhashable type - because a list can change after insertion, its hash would go stale and
the map could never find it again. The fix when you need a list-like key is to convert it to a tuple first.

## Gotcha 2: the worst case really is O(n)

"`O(1)` average" is a promise about the *typical* case. If many keys collide into the same bucket, the map
degrades toward a linear scan of that bucket. In normal use this never bites - hash functions spread keys
well - but it's why the guarantee is "average," not "always." For adversarial input (a service where users
control keys), it's a real, if rare, concern.

## Gotcha 3: don't rely on set ordering

A Python `dict` preserves **insertion order** (guaranteed since Python 3.7). A `set` does **not** - its
iteration order follows the internal bucket layout, which you shouldn't depend on.

```python runnable
nums = {30, 10, 20, 50, 40}   # a set, not sorted, not insertion-ordered
print(nums)
print(sorted(nums))           # ask explicitly if you want an order
```
```console
{50, 20, 40, 10, 30}
[10, 20, 30, 40, 50]
```
*What just happened:* the set prints in some bucket-driven order that is neither sorted nor the order written
- and that exact ordering is an implementation detail you should never build logic on. When order matters,
be explicit: use `sorted(...)` for sorted output, or the order-preserving `dedupe` from earlier for
first-seen order. (Your printed line for the set above may differ from what's shown here, which is exactly
the point.)

💡 **Key point.** Reach for a **set** when you only need "seen it or not," a **dict** when you need to
associate a value (a count, an index, an object) with each key, and a **list** when order and duplicates both
matter. Picking the right one is most of what makes hash-based code fast *and* correct.

```quiz
[
  {
    "q": "Why can't a Python list be used as a set member or dict key?",
    "choices": ["Lists are too big", "Lists are mutable, so their hash could change and the map could no longer find them - they're unhashable", "Lists are slower than tuples", "It's only a style rule, not enforced"],
    "answer": 1,
    "explain": "Hash-based structures need a stable hash. A mutable list could change after insertion, invalidating its hash, so Python forbids it with `TypeError: unhashable type`."
  },
  {
    "q": "You need the unique items from a list, in the order they first appeared. What's the safest approach?",
    "choices": ["list(set(items)) - it always keeps order", "Walk once with a `seen` set, appending each first-seen item to a result list", "Sort the list, then remove neighbors", "There's no way to preserve order"],
    "answer": 1,
    "explain": "`list(set(...))` may reorder because set iteration order isn't guaranteed. A `seen` set plus a result list keeps O(1) membership checks while preserving first-seen order."
  }
]
```
