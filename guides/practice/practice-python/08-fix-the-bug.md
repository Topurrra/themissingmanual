---
title: "Fix the bug: read the traceback"
guide: practice-python
phase: 8
summary: "The code below throws the moment you run it - read the real traceback to find the off-by-one bug and fix it."
tags: [python, debugging, traceback, errors]
difficulty: intermediate
synonyms:
  - python traceback practice
  - debug python error
  - read a python traceback
updated: 2026-07-10
---

# Fix the bug: read the traceback

So far every lesson asked you to write code from scratch. Real work is more
often the opposite: someone else's code is already there, and it's broken.
The skill that matters is reading the traceback Python hands you - it names
the exact line and the exact exception, if you read it instead of guessing.

The code below throws as soon as you press Run - it isn't waiting for a test
to catch it, the bug crashes it immediately. `IndexError: list index out of
range` means the loop asked for an index that doesn't exist in the list - and
the line number in the traceback points straight at the loop that asked for
it.

**Your task:** run the code, read the traceback, and fix the bug in
`average` so it returns the mean of the numbers in `nums`.

**You'll practice:**

- Reading a traceback instead of guessing where the bug is
- Tracing an `IndexError` back to an off-by-one loop bound

```lesson
{
  "language": "python",
  "starterCode": "# This code throws when you run it - read the traceback and fix the bug.\ndef average(nums):\n    total = 0\n    for i in range(len(nums) + 1):\n        total += nums[i]\n    return total / len(nums)\n\nprint(average([10, 20, 30]))",
  "solution": "def average(nums):\n    total = 0\n    for i in range(len(nums)):\n        total += nums[i]\n    return total / len(nums)\n\nprint(average([10, 20, 30]))",
  "hints": ["Run it first - the traceback names the line and says 'list index out of range'.", "range(len(nums) + 1) goes one step past the last valid index - what's the highest valid index in a list of length len(nums)?", "range(len(nums)) already covers every index from 0 to len(nums) - 1. Drop the + 1."],
  "tests": [
    { "name": "average of three numbers", "code": "assert average([10, 20, 30]) == 20, 'average([10, 20, 30]) should be 20'" },
    { "name": "average of a single number", "code": "assert average([5]) == 5, 'average([5]) should be 5'" },
    { "name": "average of four numbers", "code": "assert average([2, 4, 6, 8]) == 5, 'average([2, 4, 6, 8]) should be 5'" }
  ]
}
```
