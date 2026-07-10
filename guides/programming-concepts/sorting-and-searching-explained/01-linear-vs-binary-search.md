---
title: "Linear vs. Binary Search"
guide: "sorting-and-searching-explained"
phase: 1
summary: "Linear search checks every item one by one - simple, works on anything, but gets slower the bigger the data. Binary search exploits sorted order to throw away half the remaining data on every step."
tags: [algorithms, searching, linear-search, binary-search, big-o]
difficulty: beginner
synonyms: ["what is linear search", "what is binary search", "why is binary search faster than linear search", "search algorithm basics", "how to search a sorted list"]
updated: 2026-07-10
---

# Linear vs. Binary Search

Searching sounds trivial - "is this value in here?" - but *how* you search is one of the highest-leverage
choices you'll make in everyday code. There are two fundamentally different strategies, and which one you
can use depends on a single fact: is the data sorted?

## Linear search: check everything

**What it actually is.** Start at the front, look at each item, stop when you find a match (or run out of
items). No assumptions about order - it works on any collection, sorted or not.

```python runnable
def linear_search(items, target):
    for i, value in enumerate(items):
        if value == target:
            return i
    return -1

scores = [91, 47, 68, 12, 85, 33]
print(linear_search(scores, 85))
print(linear_search(scores, 100))
```
```console
4
-1
```
*What just happened:* `linear_search` walks the list from the front, comparing each value to `85` until it
finds it at index `4`. Looking for `100` walks the *entire* list and finds nothing, returning `-1`. Either
way, the cost scales directly with how many items you check - this is the `O(n)` "linear" shape from Big-O:
double the list, and in the worst case you double the work.

💡 **Key point.** Linear search is the only option when the data isn't sorted - you genuinely have no
shortcut, because any item could be the one you want. It's also perfectly fine for small collections; the
cost only bites once `n` gets large.

## Binary search: exploit sorted order

**What it actually is.** If the data is *sorted*, you don't need to check everything. Check the middle item.
If your target is smaller, it can only be in the left half - the entire right half is eliminated in one
comparison. If it's bigger, the left half is eliminated instead. Repeat on the remaining half.

Think of a sorted phone book. You don't start at "Aardvark" and read every name - you flip to the middle,
see you've landed on "M," and know immediately whether "Grace" is to the left or right. Each flip throws away
half of what's left.

```text
   ["Ada","Alan","Bob","Grace","Linus","Margaret","Xu"]   ← looking for "Grace"
    check middle → "Grace" is at or before "Grace"? → keep the LEFT half
   ["Ada","Alan","Bob","Grace"]
    check middle → keep narrowing...
   found in a handful of steps, not seven
```

*What just happened:* every comparison eliminates half the remaining candidates, not just one item. For a
list of a million sorted names, that's about 20 comparisons to find - or rule out - any value. This is the
`O(log n)` "logarithmic" shape: doubling the data adds just *one* more comparison. (See
[Big-O Without the Math Panic](/guides/big-o-without-the-math-panic) if `O(log n)` is new to you.)

⚠️ **Gotcha.** Binary search only works because the data is sorted. Run it on an unsorted list and it will
silently give you wrong answers - it'll happily discard the half your target is actually sitting in, because
it trusts an ordering that isn't there. If your data isn't sorted and you only need to search it once, sorting
first (`O(n log n)`, see Phase 4) plus one binary search is often still cheaper than repeated linear scans -
but if you're searching a fixed list many times, sort it once and reuse that sorted order every time.

## Why this trade-off exists

Linear search needs nothing extra - no sorting, no setup - and it's the only choice for unordered data. Binary
search needs the data sorted *first*, but once it is, every subsequent search is dramatically cheaper. That's
the recurring theme of this whole guide: sorting is an investment that makes every future search cheap.

```quiz
[
  {
    "q": "What does linear search require that binary search doesn't?",
    "choices": ["A sorted collection", "Nothing extra - it works on any order", "A hash map", "A recursive function"],
    "answer": 1,
    "explain": "Linear search checks every item in whatever order they're in - it makes no assumptions, which is also why it can't skip anything."
  },
  {
    "q": "Binary search eliminates how much of the remaining data on each comparison?",
    "choices": ["One item", "About half", "It depends on the data", "All but the last item"],
    "answer": 1,
    "explain": "Comparing against the middle item throws away the half that can't contain the target - that halving is what makes it O(log n)."
  },
  {
    "q": "What happens if you run binary search on an unsorted list?",
    "choices": ["It runs slower but still works", "It throws an error", "It can silently return the wrong answer", "It automatically sorts the list first"],
    "answer": 2,
    "explain": "Binary search trusts the ordering to decide which half to discard - if that ordering isn't real, it can discard the half your target is actually in."
  }
]
```

---

[← Guide overview](_guide.md) · [Phase 2: Binary Search, Implemented →](02-binary-search-implemented.md)
