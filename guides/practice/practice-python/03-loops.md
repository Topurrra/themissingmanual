---
title: "Loops"
guide: practice-python
phase: 3
summary: "Repeat work with a for loop and range(), building up a result as you go."
tags: [python, loops, for, range]
difficulty: beginner
synonyms:
  - python for loop
  - python range function
  - python loop example
updated: 2026-07-08
---

# Loops

`for i in range(1, n + 1)` runs the loop body once for each integer from `1` up
to (but not including) `n + 1` - so `range(1, 6)` gives `1, 2, 3, 4, 5`. That
`+ 1` trips everyone up at first: `range`'s upper bound is exclusive, so you
add one to actually include `n`.

A common pattern is a running total: start a variable at `0` before the loop,
then add to it on every pass. By the time the loop ends, it holds the answer
you built up one step at a time.

**Your task:** write `total_up_to(n)`, returning the sum of every integer from
`1` to `n`, inclusive, using a loop.

**You'll practice:**

- Looping with `for` and `range()`
- Accumulating a result in a variable

```lesson
{
  "language": "python",
  "starterCode": "# Write total_up_to(n): sum of integers from 1 to n, inclusive.\ndef total_up_to(n):\n    pass",
  "solution": "def total_up_to(n):\n    total = 0\n    for i in range(1, n + 1):\n        total += i\n    return total",
  "hints": ["range(1, n + 1) gives 1, 2, ..., n - range's upper bound is exclusive.", "Start a total at 0 before the loop, then add each i to it.", "total_up_to(5) should be 15 (1+2+3+4+5)."],
  "tests": [
    { "name": "total_up_to(5) is 15", "code": "assert total_up_to(5) == 15, 'total_up_to(5) should be 15'" },
    { "name": "total_up_to(1) is 1", "code": "assert total_up_to(1) == 1, 'total_up_to(1) should be 1'" },
    { "name": "total_up_to(10) is 55", "code": "assert total_up_to(10) == 55, 'total_up_to(10) should be 55'" }
  ]
}
```
