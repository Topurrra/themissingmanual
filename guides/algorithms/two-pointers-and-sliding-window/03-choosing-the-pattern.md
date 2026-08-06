---
title: "Choosing the Pattern"
guide: "two-pointers-and-sliding-window"
phase: 3
summary: "How to recognize which pattern a problem wants - converging two pointers vs the sliding window - from the signals in the problem statement, plus the gotchas that trip people up: unsorted input, the wrong loop bound, and forgetting to shrink the window."
tags: [algorithms, two-pointers, sliding-window, problem-solving, gotchas]
difficulty: beginner
synonyms: ["when to use two pointers vs sliding window", "how to recognize sliding window problems", "two pointer gotchas", "sliding window mistakes", "which algorithm pattern to use"]
updated: 2026-08-06
---

# Choosing the Pattern

You've seen both motions. The hard part in practice isn't writing them - it's looking at a brand-new problem
and realizing *"oh, this is a two-pointer problem"* before you waste time on a nested loop. This phase is
about the signals, and about the mistakes that make a correct-looking solution quietly wrong.

## The signals

**Reach for converging two pointers when:**

- The input is **sorted** (or you're allowed to sort it first), and
- You're looking at the **relationship between two ends** - a pair that sums to something, the closest pair,
  or squeezing inward (reverse, palindrome).

**Reach for a sliding window when:**

- You want the best (longest, shortest, max-sum) **contiguous** run - a subarray or substring, and
- The window has a clear rule for when to **grow** (keep taking) and when to **shrink** (a constraint broke,
  like a repeat or a sum going over a limit).

The word "contiguous" is the loudest hint for a window: subarrays and substrings are contiguous, so a
question about the best run of adjacent elements is almost always a window. If the problem instead lets you
pick elements from anywhere and the data is sorted, it's usually converging pointers.

⚠️ **Gotcha.** A window only works when growing the range moves the result in one predictable direction
(longer window → bigger sum, for non-negative numbers). If the array has **negative numbers**, "max sum of
any subarray" is *not* a plain sliding-window problem - a longer window can lower the sum, so the shrink
rule breaks down. (That specific problem has its own classic answer, Kadane's algorithm.)

## Gotcha 1: two-pointer pair-sum needs sorted input

This is the mistake everyone makes once. The pair-sum logic from Phase 1 leans entirely on sorted order.
Feed it an unsorted array and it happily returns the wrong answer - no error, just a lie.

```python runnable
def has_pair_with_sum(nums, target):
    lo, hi = 0, len(nums) - 1
    while lo < hi:
        current = nums[lo] + nums[hi]
        if current == target:
            return (lo, hi)
        elif current < target:
            lo += 1
        else:
            hi -= 1
    return None

# 5 + 4 = 9 clearly exists here, but the list is NOT sorted:
print(has_pair_with_sum([5, 1, 4, 3], 9))
```
```console
None
```
*What just happened:* the pair `5 + 4 = 9` is right there, but the algorithm never finds it. Starting at
`5` and `3` (sum `8`, too small), it moves `lo` right - past the `5` it needed - and the pointers cross
before the real pair is ever considered. The fix is to sort first (`nums = sorted(nums)`), remembering that
sorting changes the indices, so if you need *original* positions, pair each value with its index before
sorting or switch to the hash-map approach from the [Hashing for Speed](/guides/hashing-for-speed) guide.

## Gotcha 2: the loop bound (`<` vs `<=`)

Converging pointers almost always want `while lo < hi`. Using `<=` lets the two pointers land on the *same*
index, which for pair-sum means adding an element to itself - inventing a pair that doesn't exist.

```python runnable
def buggy_pair(nums, target):
    lo, hi = 0, len(nums) - 1
    while lo <= hi:                 # bug: should be <
        if nums[lo] + nums[hi] == target:
            return (lo, hi)
        elif nums[lo] + nums[hi] < target:
            lo += 1
        else:
            hi -= 1
    return None

# No two distinct elements here sum to 8, so the real answer is "no pair"... but:
print(buggy_pair([1, 4, 6], 8))
```
```console
(1, 1)
```
*What just happened:* with `<=`, the pointers both settle on index `1` (value `4`), and `4 + 4 = 8` matches
the target - so it reports the "pair" `(1, 1)`. But that's one element counted twice, not two elements. The
strict `lo < hi` from Phase 1 never allows the pointers to land on the same index, so it correctly returns
`None` here.

## Gotcha 3: forgetting to shrink the window

A sliding window that only ever *grows* isn't a window - it's just a running total over the whole array. The
shrink step (moving the left edge, or subtracting the leaving element) is what keeps the window valid. Leave
it out of the "longest substring without repeats" and the window keeps a duplicate inside it, over-counting
the length. If your window answer is always suspiciously close to the full input size, a missing shrink is
the first thing to check.

💡 **Key point.** Both patterns share one promise: **every pointer moves forward only.** The moment you find
yourself wanting to move a pointer *backward* to recheck something, that's the signal you've picked the
wrong pattern (or need an auxiliary structure like a hash map) - not that you should add a backward step.

```quiz
[
  {
    "q": "A problem asks for the longest contiguous substring meeting some condition. Which pattern fits best?",
    "choices": ["Converging two pointers", "A sliding window", "Binary search", "Neither - it needs nested loops"],
    "answer": 1,
    "explain": "\"Longest contiguous run meeting a condition\" is the classic sliding-window signature: grow while the condition holds, shrink when it breaks."
  },
  {
    "q": "You run the Phase 1 pair-sum function on an unsorted array and it returns None even though a valid pair exists. What's wrong?",
    "choices": ["The target is too large", "The two-pointer pair-sum logic requires sorted input", "You should use `<=` instead of `<`", "The array is too small"],
    "answer": 1,
    "explain": "The \"too small → move right, too big → move left\" decision only holds when values are sorted. On unsorted data it skips past the answer."
  },
  {
    "q": "What single property do both the two-pointer and sliding-window patterns rely on for their O(n) speed?",
    "choices": ["The input is always numeric", "Every pointer only ever moves forward, so no element is reprocessed many times", "They both sort the data first", "They use recursion instead of loops"],
    "answer": 1,
    "explain": "Forward-only pointers mean each element is handled a constant number of times, which is what makes the whole pass linear."
  }
]
```
