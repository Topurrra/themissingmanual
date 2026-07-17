---
title: "Fix the bug: sorting numbers"
guide: practice-typescript
phase: 7
summary: "The code below returns numbers in the wrong order and never throws - find out why .sort() misbehaves and fix it."
tags: [typescript, debugging, sorting, arrays]
difficulty: intermediate
synonyms:
  - typescript sort bug
  - fix array sort typescript
  - javascript sort numbers bug
updated: 2026-07-16
---

# Fix the bug: sorting numbers

So far every lesson in this module asked you to write code against types
that catch mistakes before you run anything. Real work is more often the
opposite: someone else's code is already there, it compiles cleanly, and
it's still wrong. The bug below is exactly that kind of bug - `number[]` is
the right type, TypeScript's checker has nothing to complain about, and the
code runs without throwing. It just returns the wrong array, silently.

The cause is `Array.prototype.sort()`. Called with no comparator, `sort()`
converts every element to a string and compares them character by character
- so `10` sorts before `9`, because `"1"` sorts before `"9"`. No type
annotation catches this: sorting is a runtime behavior, not a type. The only
way to find the bug is to look at what the function actually returned.

**Your task:** run the code, look at the returned array, and fix
`sortAscending` so it returns the numbers in true ascending order.

**You'll practice:**

- Reading actual output instead of trusting that "no error" means "correct"
- Fixing JavaScript/TypeScript's default `sort()` behavior with a numeric comparator

```lesson
{
  "language": "typescript",
  "starterCode": "// This code returns numbers in the wrong order - fix the bug.\nfunction sortAscending(nums: number[]): number[] {\n  return nums.sort();\n}\n\nconst a = sortAscending([10, 9, 1]);\nconst b = sortAscending([5, 40, 3, 22]);",
  "solution": "function sortAscending(nums: number[]): number[] {\n  return nums.sort((x, y) => x - y);\n}\n\nconst a = sortAscending([10, 9, 1]);\nconst b = sortAscending([5, 40, 3, 22]);",
  "hints": ["Log `a` and run it - the array comes back in a strange order. sort() with no arguments doesn't compare numbers the way you'd expect.", "Array.prototype.sort() with no comparator converts every element to a string and compares them character by character - that's why 10 sorts before 9.", "Pass a comparator to sort: nums.sort((x, y) => x - y) sorts ascending numerically instead of alphabetically."],
  "tests": [
    { "name": "sorts double-digit and single-digit numbers correctly", "code": "if (JSON.stringify(a) !== JSON.stringify([1, 9, 10])) throw new Error(`a should be [1, 9, 10], got ${JSON.stringify(a)}`);" },
    { "name": "sorts numbers of varying digit length", "code": "if (JSON.stringify(b) !== JSON.stringify([3, 5, 22, 40])) throw new Error(`b should be [3, 5, 22, 40], got ${JSON.stringify(b)}`);" },
    { "name": "sorts negative numbers correctly", "code": "const r = sortAscending([-5, 2, -100, 7]); if (JSON.stringify(r) !== JSON.stringify([-100, -5, 2, 7])) throw new Error(`sortAscending([-5, 2, -100, 7]) should be [-100, -5, 2, 7], got ${JSON.stringify(r)}`);" }
  ]
}
```
