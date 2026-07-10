---
title: "List comprehension rewrite"
guide: practice-python
phase: 10
summary: "Take a working for-loop that builds a list and rewrite it as a one-line list comprehension producing the identical result."
tags: [python, list-comprehension, loops, refactoring]
difficulty: beginner
synonyms:
  - python list comprehension practice
  - rewrite for loop as list comprehension
  - python one-line list comprehension
  - refactor python loop
updated: 2026-07-10
---

# List comprehension rewrite

You've already used a list comprehension to filter a list (phase 4). This time
you're starting from the other direction: the function below already works -
it's a plain `for` loop that builds up a list with `.append()` - and your job
is to rewrite its body as a single-line list comprehension that returns the
exact same result.

A list comprehension can filter *and* transform in one expression:
`[expr for x in items if condition]` computes `expr` for every `x` that
passes `condition`, collecting the results into a new list - the loop,
the `if`, and the `.append()` all folded into one line.

**Your task:** rewrite `even_squares(n)` below so its body is a single list
comprehension instead of a `for` loop, still returning the square of every
even number from `1` to `n` (inclusive), in order.

**You'll practice:**

- Combining a transform and a filter in one list comprehension
- Recognizing a loop-plus-append pattern that a comprehension replaces

```lesson
{
  "language": "python",
  "starterCode": "# Rewrite even_squares(n) below as a one-line list comprehension -\n# same result: the square of every even number from 1 to n, in order.\ndef even_squares(n):\n    result = []\n    for i in range(1, n + 1):\n        if i % 2 == 0:\n            result.append(i * i)\n    return result",
  "solution": "def even_squares(n):\n    return [i * i for i in range(1, n + 1) if i % 2 == 0]",
  "hints": ["A list comprehension can filter and transform at once: [expr for x in items if condition].", "expr here is i * i, items is range(1, n + 1), and condition is i % 2 == 0.", "even_squares(10) should be [4, 16, 36, 64, 100]."],
  "tests": [
    { "name": "squares the even numbers up to 10", "code": "assert even_squares(10) == [4, 16, 36, 64, 100], 'even_squares(10) should be [4, 16, 36, 64, 100]'" },
    { "name": "returns an empty list when there's no even number in range", "code": "assert even_squares(1) == [], 'even_squares(1) should be []'" },
    { "name": "works for a smaller n", "code": "assert even_squares(6) == [4, 16, 36], 'even_squares(6) should be [4, 16, 36]'" }
  ]
}
```
