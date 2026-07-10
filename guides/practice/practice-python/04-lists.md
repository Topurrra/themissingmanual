---
title: "Lists"
guide: practice-python
phase: 4
summary: "Filter a list down with a list comprehension instead of a manual loop and append."
tags: [python, lists, list-comprehension]
difficulty: beginner
synonyms:
  - python list comprehension
  - filter a list python
  - python lists
updated: 2026-07-08
---

# Lists

A list comprehension builds a new list in one line: `[x for x in items if
condition]` reads almost like the English sentence it describes - "x, for each
x in items, where condition holds." It replaces the loop-plus-`append` pattern
you'd otherwise write by hand.

You can drop the `if` entirely to transform every item instead of filtering
them (`[x * 2 for x in items]`), but this lesson is about keeping some items
and dropping others, so the condition is the part that matters.

**Your task:** given the list `scores`, write `passing(scores)`, returning a
new list with only the scores that are `60` or above.

**You'll practice:**

- Filtering a list with a list comprehension
- Writing a condition inside the comprehension

```lesson
{
  "language": "python",
  "starterCode": "scores = [55, 72, 90, 48, 63, 100, 59]\n\n# Write passing(scores): list of scores that are 60 or above.\ndef passing(scores):\n    pass",
  "solution": "scores = [55, 72, 90, 48, 63, 100, 59]\n\ndef passing(scores):\n    return [s for s in scores if s >= 60]",
  "hints": ["A list comprehension looks like [x for x in items if condition].", "The condition here is s >= 60.", "passing(scores) should return [72, 90, 63, 100]."],
  "tests": [
    { "name": "passing keeps only scores >= 60", "code": "assert passing(scores) == [72, 90, 63, 100], 'passing(scores) should be [72, 90, 63, 100]'" },
    { "name": "passing works on a new list", "code": "assert passing([10, 60, 61, 59]) == [60, 61], 'passing should keep scores >= 60'" }
  ]
}
```
