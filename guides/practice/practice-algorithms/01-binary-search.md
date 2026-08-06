---
title: "Binary search"
guide: practice-algorithms
phase: 1
summary: "Find a target in a sorted list by halving the search range each step, returning its index or -1."
tags: [algorithms, binary-search, searching, python]
difficulty: beginner
synonyms:
  - binary search python
  - search a sorted list
  - binary search index or -1
  - logarithmic search
updated: 2026-08-06
---

# Binary search

When a list is already sorted, you never need to scan it from front to back.
Binary search looks at the middle element, and because the list is sorted it
learns which half the target must be in - so it throws the other half away.
Repeat that on the half that is left and the search range shrinks by half every
step, finding any value in a million-item list in about twenty comparisons.

Keep two bounds, `lo` and `hi`, that mark the part of the list still worth
checking. Compare the middle value to the target: equal means you found it,
too small means the answer is to the right (move `lo` up), too big means it is
to the left (move `hi` down). When `lo` passes `hi`, the range is empty and the
value is not there.

**Your task:** write `binary_search(items, target)`, where `items` is a list
sorted in ascending order. Return the index of `target`, or `-1` if it is not
in the list.

**You'll practice:**

- Narrowing a search range with two moving bounds
- Handling the not-found and empty-list cases cleanly

```lesson
{
  "language": "python",
  "starterCode": "# Return the index of target in the sorted list items, or -1 if it is not present.\ndef binary_search(items, target):\n    pass",
  "solution": "def binary_search(items, target):\n    lo, hi = 0, len(items) - 1\n    while lo <= hi:\n        mid = (lo + hi) // 2\n        if items[mid] == target:\n            return mid\n        if items[mid] < target:\n            lo = mid + 1\n        else:\n            hi = mid - 1\n    return -1",
  "hints": [
    "The list is already sorted. Keep two bounds, lo and hi, and look at the middle element each step.",
    "If the middle value is too small, move lo to mid + 1; if it is too big, move hi to mid - 1.",
    "When lo passes hi you have checked everything and the target is not there - return -1."
  ],
  "tests": [
    {
      "name": "finds a value in the middle",
      "code": "assert binary_search([1, 3, 5, 7, 9], 5) == 2, 'binary_search([1,3,5,7,9], 5) should be 2'"
    },
    {
      "name": "returns -1 when the value is absent",
      "code": "assert binary_search([1, 3, 5, 7, 9], 4) == -1, 'binary_search([1,3,5,7,9], 4) should be -1'"
    },
    {
      "name": "finds the first element",
      "code": "assert binary_search([1, 3, 5, 7, 9], 1) == 0, 'binary_search([1,3,5,7,9], 1) should be 0'"
    },
    {
      "name": "finds the last element",
      "code": "assert binary_search([1, 3, 5, 7, 9], 9) == 4, 'binary_search([1,3,5,7,9], 9) should be 4'"
    },
    {
      "name": "handles an empty list",
      "code": "assert binary_search([], 5) == -1, 'binary_search([], 5) should be -1'"
    }
  ]
}
```
