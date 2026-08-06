---
title: "Why Hash Maps Are Fast"
guide: "hashing-for-speed"
phase: 1
summary: "Why a hash map looks up a key in O(1) average time while scanning a list is O(n): the hash function turns a key into a bucket index so you jump straight to where the value lives instead of checking every item."
tags: [algorithms, hashing, hash-map, dictionary, big-o, buckets]
difficulty: beginner
synonyms: ["why are hash maps o(1)", "how does a hash function work", "hash map buckets explained", "list scan vs dictionary lookup", "why dictionary lookup is fast"]
updated: 2026-08-06
---

# Why Hash Maps Are Fast

Before the patterns, the mental model. If you understand *why* a hash map lookup is fast, you'll know exactly
when reaching for one turns a slow program into an instant one - and when it won't help.

## The slow way: scanning a list

Suppose you have a list and you want to know whether some value is in it. With a list, there's no shortcut:
you check the first element, then the next, then the next, until you find it or run out. That's linear time,
`O(n)` - double the list, double the work in the worst case.

```python runnable
def scan_contains(items, target):
    for x in items:          # check every element until a match
        if x == target:
            return True
    return False

nums = [10, 20, 30, 40, 50]
print(scan_contains(nums, 40))
print(scan_contains(nums, 99))
```
```console
True
False
```
*What just happened:* finding `40` took four comparisons; confirming `99` is absent took all five - the loop
had to look at everything to be sure. On a list of a million items, a worst-case lookup is a million
comparisons. Do that lookup inside another loop and you're at a billion operations, the classic accidental
`O(n²)`.

## The fast way: a hash lookup

A hash map skips the scan entirely. Ask a Python `dict` for a key and it jumps more or less straight to the
answer, regardless of how many entries it holds.

```python runnable
prices = {"apple": 30, "banana": 10, "cherry": 50}

print(prices["banana"])         # direct lookup, no scanning
print("cherry" in prices)       # membership test, also direct
print(prices.get("mango", 0))   # missing key -> default instead of error
```
```console
10
True
0
```
*What just happened:* none of these three operations looked at every entry. Each went (on average) straight
to the spot where that key's value lives. That's the whole selling point: lookup, insert, and membership are
all `O(1)` on average - constant time that barely changes as the map grows.

## Why it works: buckets and a hash function

Here's the idea underneath, without the heavy math. A hash map keeps an internal array of slots called
**buckets**. To store a key, it runs the key through a **hash function** - a routine that turns the key into
a number - and uses that number to pick a bucket. To look the key up later, it hashes the key again, lands
on the same bucket, and finds the value already sitting there. No scanning, because the key itself tells you
where to look.

```python runnable
# Python exposes the hash function it uses for dict/set keys:
print(hash("apple"))
print(hash("banana"))

# A toy version of "which bucket?": squash the hash into a small range.
def bucket_index(key, num_buckets):
    return hash(key) % num_buckets

for key in ["apple", "banana", "cherry"]:
    print(key, "->", bucket_index(key, 8))
```
```console
```
*What just happened:* `hash(...)` turns each key into a big integer (the exact numbers vary between Python
runs, which is why the console above is left blank - yours will differ). Taking that integer modulo the
bucket count squashes it into a valid slot index, `0` to `7` here. Real hash maps do exactly this: hash the
key, mod into a bucket, store or fetch there. The lookup cost doesn't depend on how many keys exist, only on
computing one hash - hence `O(1)` on average.

📝 **Terminology.** The words differ by language but the structure is the same: Python calls it a `dict`,
JavaScript a `Map` (or plain object), Java a `HashMap`, C++ an `unordered_map`, Go just `map`, Rust a
`HashMap`. All of them are hash maps: keys hashed into buckets for near-constant-time access.

⚠️ **Gotcha.** "On average" is doing real work in that sentence. When two different keys hash into the *same*
bucket - a **collision** - the map has to store both there and do a tiny local scan to tell them apart. A few
collisions are normal and cheap. A pathological pile-up of collisions is what makes the rare worst case slow,
which we'll come back to in Phase 3.

```quiz
[
  {
    "q": "Why is checking `value in some_list` O(n) but `key in some_dict` O(1) on average?",
    "choices": ["Lists are stored on disk", "A dict hashes the key straight to its bucket, while a list must scan element by element", "Dicts are always smaller than lists", "The `in` keyword is optimized only for dicts"],
    "answer": 1,
    "explain": "A list has no way to know where a value is, so it scans. A dict hashes the key to a bucket and jumps there, independent of size."
  },
  {
    "q": "What is the job of the hash function in a hash map?",
    "choices": ["To sort the keys", "To turn a key into a number that selects which bucket the value goes in", "To compress the stored values", "To count how many keys exist"],
    "answer": 1,
    "explain": "The hash function maps a key to a number; the map uses that number (mod the bucket count) to decide where the key/value lives, enabling direct access."
  }
]
```
