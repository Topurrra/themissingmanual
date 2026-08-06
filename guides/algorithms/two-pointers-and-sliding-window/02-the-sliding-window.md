---
title: "The Sliding Window"
guide: "two-pointers-and-sliding-window"
phase: 2
summary: "The sliding window pattern: keep a moving range over an array or string and update a running result as it slides, instead of recomputing from scratch. The fixed window (max sum of k consecutive items) and the variable window (longest substring without repeats)."
tags: [algorithms, sliding-window, arrays, strings, substring, big-o]
difficulty: beginner
synonyms: ["sliding window technique explained", "max sum of k consecutive elements", "longest substring without repeating characters", "fixed vs variable sliding window", "running sum subarray"]
updated: 2026-08-06
---

# The Sliding Window

The sliding window is the same instinct as two pointers - move positions through the array instead of
re-scanning - applied to a **range** rather than a pair. You keep a "window" covering some slice of the
data, and as it slides forward you *update* a running result cheaply instead of recomputing it from
scratch. That difference, update vs recompute, is exactly what turns an `O(n·k)` or `O(n²)` brute force into
a single `O(n)` pass.

There are two flavors: a **fixed** window that stays a constant width, and a **variable** window that grows
and shrinks based on a condition. We'll do one of each.

## Fixed window: max sum of k consecutive items

Given a list of numbers, find the largest sum of any `k` items in a row. The brute-force version re-adds `k`
numbers for every starting position - `O(n·k)`. The window trick: compute the first window's sum once, then
each time you slide one step right, **add the entering number and subtract the leaving one.** That's two
operations per step, no matter how big `k` is.

```python runnable
def max_sum_of_k(nums, k):
    window = sum(nums[:k])        # sum of the first window, computed once
    best = window
    for i in range(k, len(nums)):
        window += nums[i] - nums[i - k]   # add the new item, drop the old one
        best = max(best, window)
    return best

print(max_sum_of_k([2, 1, 5, 1, 3, 2], 3))
```
```console
9
```
*What just happened:* the first window `[2, 1, 5]` sums to `8`. Sliding right, we add `nums[3] = 1` and drop
`nums[0] = 2`, giving `7` for `[1, 5, 1]`. Next add `3`, drop `1` → `9` for `[5, 1, 3]`. Next add `2`, drop
`5` → `6` for `[1, 3, 2]`. The best seen is `9`. Each slide did one addition and one subtraction - never a
fresh re-sum of the whole window.

💡 **Key point.** The whole savings comes from `window += nums[i] - nums[i - k]`. The value leaving the
window on the left is `nums[i - k]` - exactly `k` positions behind the value entering on the right. Get that
index wrong and every sum after the first is garbage.

## Variable window: longest substring without repeats

Now a window that *changes size*. Given a string, find the length of the longest run with no repeated
character. Grow the window to the right one character at a time; when the new character would create a
duplicate, jump the left edge forward past the previous copy so the window is valid again. Track the widest
valid window you ever see.

```python runnable
def longest_unique(s):
    seen = {}          # character -> its most recent index
    start = 0          # left edge of the current window
    best = 0
    for i, ch in enumerate(s):
        if ch in seen and seen[ch] >= start:
            start = seen[ch] + 1      # jump past the earlier copy
        seen[ch] = i
        best = max(best, i - start + 1)
    return best

print(longest_unique("abcabcbb"))
print(longest_unique("bbbbb"))
print(longest_unique("pwwkew"))
```
```console
3
1
3
```
*What just happened:* `i` is the right edge; `start` is the left edge. For `"abcabcbb"`, the window grows to
`"abc"` (length 3), then the second `a` forces `start` past the first `a`, and from then on no window beats
length 3. `"bbbbb"` can never hold more than a single `b`, so the answer is 1. `"pwwkew"` peaks at `"wke"`
(or `"kew"`), length 3. The `seen[ch] >= start` check matters: it only jumps the left edge when the repeat
is *inside the current window*, ignoring stale copies that already fell off the left.

⚠️ **Gotcha.** The dictionary here stores each character's *most recent* index, and we only shrink the
window when the repeat sits at or after `start`. Skip that `>= start` guard and an old, already-discarded
duplicate will yank `start` backward, producing windows that are too long and wrong answers on strings like
`"abba"`.

## Why this is O(n)

In both functions each element is entered by the right edge exactly once, and (in the variable case) left
behind by the `start` edge at most once. Neither pointer ever moves backward. Two forward-only pointers over
`n` elements is `O(n)` total work - even though the variable window has a nested-looking "shrink" step, no
element is processed more than a constant number of times.

```quiz
[
  {
    "q": "In the fixed-window max-sum, what does `window += nums[i] - nums[i - k]` accomplish?",
    "choices": ["Recomputes the whole window from scratch", "Adds the entering element and subtracts the one leaving the window", "Doubles the window size", "Removes duplicates from the window"],
    "answer": 1,
    "explain": "Sliding one step right means one new element enters and one old element (k positions back) leaves. Updating by that difference avoids re-summing the window each step."
  },
  {
    "q": "Why is the sliding window O(n) rather than O(n²), even the variable-size one?",
    "choices": ["It uses recursion", "Both the right edge and the left edge only ever move forward, so each element is handled a constant number of times", "It sorts the input first", "k is always small"],
    "answer": 1,
    "explain": "Neither edge moves backward. Across the whole run each element is entered once and left once, which is linear total work."
  }
]
```
