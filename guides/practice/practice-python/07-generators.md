---
title: "Generators"
guide: practice-python
phase: 7
summary: "Write a generator function with yield that produces values one at a time instead of building a whole list up front."
tags: [python, generators, yield, lazy-evaluation]
difficulty: intermediate
synonyms:
  - python yield keyword
  - python generator function
  - lazy sequence python
updated: 2026-07-10
---

# Generators

A normal function returns once and hands back one value. A generator function
uses `yield` instead of `return`, and can hand back many values, one at a
time, pausing exactly where it left off between each one. Calling it doesn't
run the body at all yet - it returns a generator object, and the code only
runs as each value is pulled out.

That laziness is the whole point: `list(squares(1000000))` on a normal
function builds a million-item list in memory before you get anything back;
a generator hands you the first value immediately and computes the rest only
if you keep asking. `list(some_generator())` or a `for` loop will pull every
value out and collect them, same as any other iterable.

**Your task:** write a generator function `squares(n)` that yields the square
of each integer from `1` to `n`, in order, one at a time, using `yield`
instead of building and returning a list.

**You'll practice:**

- Writing a generator function with `yield`
- Understanding that calling it returns a lazy generator, not a list

```lesson
{
  "language": "python",
  "starterCode": "# Write squares(n): a generator that yields 1*1, 2*2, ..., n*n, one at a time.\ndef squares(n):\n    pass",
  "solution": "def squares(n):\n    for i in range(1, n + 1):\n        yield i * i",
  "hints": ["Loop with for i in range(1, n + 1): and yield i * i on each pass - no return needed.", "yield is what makes this a generator - using return [i * i for ...] instead would defeat the point of the lesson.", "list(squares(4)) should be [1, 4, 9, 16]."],
  "tests": [
    { "name": "collects all the squares in order", "code": "assert list(squares(4)) == [1, 4, 9, 16], 'list(squares(4)) should be [1, 4, 9, 16]'" },
    { "name": "works for n = 1", "code": "assert list(squares(1)) == [1], 'list(squares(1)) should be [1]'" },
    { "name": "produces values lazily one at a time", "code": "assert next(squares(5)) == 1, 'next(squares(5)) should give the first value, 1, without computing the rest'" },
    { "name": "squares is a generator function, not a list-builder", "code": "import types\nassert isinstance(squares(2), types.GeneratorType), 'squares(n) should be written with yield so calling it returns a generator, not a list'" }
  ]
}
```
