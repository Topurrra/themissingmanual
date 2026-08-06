---
title: "Two-sum with a hash map"
guide: practice-algorithms
phase: 3
summary: "Find the two indices whose values add up to a target in a single pass, using a dict to remember what you have seen."
tags: [algorithms, two-sum, hash-map, python]
difficulty: intermediate
synonyms:
  - two sum python
  - two sum hash map
  - find pair that sums to target
  - two sum indices
updated: 2026-08-06
---

# Two-sum with a hash map

Given a list of numbers and a target, find the two whose values add up to that
target. The obvious approach checks every pair - but that is slow, and there is
a much better way that only walks the list once.

The trick is to trade a little memory for speed. As you move through the list,
keep a dict of every value you have already seen and where it was. For each new
number, the partner it needs is `target - number`. If that partner is already
in your dict, you are done - you have both indices. If not, record the current
number and move on. Each value gets looked up in constant time, so the whole
search is a single pass.

**Your task:** write `two_sum(nums, target)` that returns the two **indices**
whose values add up to `target` (in any order), or `None` if no such pair
exists. Assume at most one valid pair.

**You'll practice:**

- Using a dict as a lookup table you build as you go
- Turning a slow all-pairs check into a single-pass scan

```lesson
{
  "language": "python",
  "starterCode": "# Return the two indices whose values add up to target (in any order),\n# or None if no such pair exists.\ndef two_sum(nums, target):\n    pass",
  "solution": "def two_sum(nums, target):\n    seen = {}\n    for i, n in enumerate(nums):\n        complement = target - n\n        if complement in seen:\n            return [seen[complement], i]\n        seen[n] = i\n    return None",
  "hints": [
    "You could check every pair, but that is slow. Instead, as you walk the list, remember each value you have already seen.",
    "For each number, the value you need is target - number. If you have already seen that value, you have your pair.",
    "Store each value in a dict mapping value -> index, so a match gives you both indices in one pass."
  ],
  "tests": [
    {
      "name": "finds a pair that sums to target",
      "code": "assert sorted(two_sum([2, 7, 11, 15], 9)) == [0, 1], 'two_sum([2,7,11,15], 9) should be the indices 0 and 1'"
    },
    {
      "name": "returns None when no pair works",
      "code": "assert two_sum([1, 2, 3], 100) is None, 'two_sum([1,2,3], 100) should be None'"
    },
    {
      "name": "finds the pair in a single pass on a longer list",
      "code": "assert sorted(two_sum([3, 2, 4, 1, 5, 9], 8)) == [0, 4], 'two_sum([3,2,4,1,5,9], 8) should be the indices 0 and 4'"
    }
  ]
}
```
