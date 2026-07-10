---
title: "Arrays: map, filter, and reduce"
guide: practice-javascript
phase: 4
summary: "Transform an array with map, narrow it with filter, and collapse it to one value with reduce."
tags: [javascript, arrays, map, filter, reduce]
difficulty: beginner
synonyms:
  - javascript array map
  - javascript array filter
  - javascript array reduce
  - transform array javascript
updated: 2026-07-10
---

# Arrays: map, filter, and reduce

`array.map(fn)` builds a new array by running `fn` on every item and keeping
whatever it returns - same length in and out, values transformed.
`array.filter(fn)` builds a new array by keeping only the items where `fn`
returns true - same values, fewer of them. Neither touches the original array.

Both take an arrow function: `n => n * 2` doubles, `n => n % 2 === 0` checks
for even. You'll reach for this pair constantly - it replaces most of the loops
you'd otherwise write to transform or narrow down a list.

Sometimes you don't want a new array at all - you want one value out of it, like
a total. `array.reduce((acc, n) => acc + n, 0)` walks the array once, carrying
an accumulator (`acc`, starting at `0`) forward and adding each item to it -
exactly how you'd total up a list without writing your own loop.

**Your task:** given the array `nums`, create `doubled` (every number doubled),
`evens` (only the even numbers), and `total` (the sum of every number in `nums`).

**You'll practice:**

- Transforming an array with `.map()`
- Narrowing an array with `.filter()`
- Collapsing an array to one value with `.reduce()`

```lesson
{
  "language": "js",
  "starterCode": "const nums = [1, 2, 3, 4, 5, 6];\n\n// Create doubled: each number in nums, doubled.\n// Create evens: only the even numbers from nums.\n// Create total: the sum of every number in nums.\n",
  "solution": "const nums = [1, 2, 3, 4, 5, 6];\n\nconst doubled = nums.map((n) => n * 2);\nconst evens = nums.filter((n) => n % 2 === 0);\nconst total = nums.reduce((acc, n) => acc + n, 0);",
  "hints": ["map transforms every item - what expression doubles a number?", "filter keeps only items where the function returns true - n % 2 === 0 is true when n is even.", "nums.reduce((acc, n) => acc + n, 0) starts acc at 0 and adds each number to it as it walks the array."],
  "tests": [
    { "name": "doubled has each number doubled", "code": "if (JSON.stringify(doubled) !== JSON.stringify([2, 4, 6, 8, 10, 12])) throw new Error('doubled should be [2, 4, 6, 8, 10, 12]');" },
    { "name": "evens keeps only even numbers", "code": "if (JSON.stringify(evens) !== JSON.stringify([2, 4, 6])) throw new Error('evens should be [2, 4, 6]');" },
    { "name": "total sums every number", "code": "if (total !== 21) throw new Error('total should be 21 (1+2+3+4+5+6)');" }
  ]
}
```
