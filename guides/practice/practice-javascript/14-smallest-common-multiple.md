---
title: "Smallest common multiple"
guide: practice-javascript
phase: 14
summary: "Find the least common multiple of every integer in a range, built from a small recursive gcd() helper."
tags: [javascript, math, gcd, lcm, algorithms]
difficulty: intermediate
synonyms:
  - lcm javascript
  - least common multiple javascript
  - smallest common multiple algorithm
  - gcd function javascript
updated: 2026-07-10
---

# Smallest common multiple

The least common multiple (LCM) of two numbers is the smallest number both
divide evenly into. There's a clean formula for it: `lcm(a, b) = (a * b) /
gcd(a, b)`, where `gcd` is the greatest common divisor - the biggest number
that divides both evenly.

`gcd` itself has a short recursive definition: `gcd(a, b)` is `a` once `b`
hits `0`, and otherwise it's `gcd(b, a % b)`. Once you have that one helper,
finding the LCM of a whole *range* of numbers - not just two - is a loop:
start with the smallest number as your running result, then fold in each
next integer with the same two-number LCM formula.

**Your task:** write `smallestCommonMultiple(arr)`, where `arr` is a
two-number array like `[1, 5]` (in either order), returning the smallest
number evenly divisible by every integer from the smaller to the larger,
inclusive.

**You'll practice:**

- Writing a short recursive helper function
- Folding a two-argument formula over a range with a loop

```lesson
{
  "language": "js",
  "starterCode": "// Write smallestCommonMultiple(arr): given a two-number array like [1, 5],\n// return the smallest number evenly divisible by every integer in that\n// range (inclusive), e.g. smallestCommonMultiple([1, 5]) === 60 (the LCM\n// of 1, 2, 3, 4, and 5). The two numbers can arrive in either order.\nfunction smallestCommonMultiple(arr) {\n\n}",
  "solution": "function gcd(a, b) {\n  return b === 0 ? a : gcd(b, a % b);\n}\n\nfunction smallestCommonMultiple(arr) {\n  const lo = Math.min(...arr);\n  const hi = Math.max(...arr);\n  let result = lo;\n  for (let n = lo + 1; n <= hi; n++) {\n    result = (result * n) / gcd(result, n);\n  }\n  return result;\n}",
  "hints": ["Sort the two numbers first with Math.min/Math.max - the array can arrive as [1, 5] or [5, 1].", "The LCM of two numbers a and b is (a * b) / gcd(a, b) - write a small recursive gcd(a, b) helper first (gcd(a, 0) is a).", "Fold that pairwise LCM over every integer from lo to hi in a loop, carrying the running LCM forward as the new 'a' each time."],
  "tests": [
    { "name": "finds the LCM of a small range", "code": "if (smallestCommonMultiple([1, 5]) !== 60) throw new Error('smallestCommonMultiple([1, 5]) should be 60');" },
    { "name": "works regardless of argument order", "code": "if (smallestCommonMultiple([5, 1]) !== 60) throw new Error('smallestCommonMultiple([5, 1]) should also be 60');" },
    { "name": "finds the LCM of a wider range", "code": "if (smallestCommonMultiple([1, 13]) !== 360360) throw new Error('smallestCommonMultiple([1, 13]) should be 360360');" },
    { "name": "works on a range that does not start at 1", "code": "if (smallestCommonMultiple([2, 10]) !== 2520) throw new Error('smallestCommonMultiple([2, 10]) should be 2520');" }
  ]
}
```
