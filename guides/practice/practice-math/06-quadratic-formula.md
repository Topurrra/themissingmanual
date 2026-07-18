---
title: "The quadratic formula"
guide: practice-math
phase: 6
summary: "Use the quadratic formula to find a root of ax^2 + bx + c = 0 - one expression, carefully parenthesized, with a square root inside."
tags: [math, algebra, quadratic-formula, square-roots, advanced]
difficulty: advanced
synonyms:
  - quadratic formula practice
  - solve quadratic equation calculator
  - minus b plus square root of b squared minus 4ac
updated: 2026-07-18
---

# The quadratic formula

Some equations can't be untangled by moving things around - `x^2 - 4x + 2 = 0`
has an `x` squared *and* an `x`, and no amount of shuffling isolates it. The
quadratic formula is the master key for every equation shaped like
`ax^2 + bx + c = 0`:

```text
x = (-b + sqrt(b^2 - 4*a*c)) / (2*a)

a = the number in front of x^2
b = the number in front of x
c = the constant on its own
```

(The full formula has a plus-or-minus before the square root - two roots. We
take the plus branch here: the larger root.)

The part under the square root, `b^2 - 4*a*c`, is called the discriminant -
if it comes out negative, the equation has no real solution, and `sqrt` of a
negative number is exactly where your calculator complains.

The starter shows the shape on `x^2 - 3x + 2 = 0` (a=1, b=-3, c=2), where the
larger root is a clean 2. This lesson's equation doesn't come out clean - the
answer keeps its decimals, so the parentheses have to be exactly right.

**Your task:** find the larger root of `x^2 - 4x + 2 = 0` (a=1, b=-4, c=2).
Careful with the signs: b is -4, so -b is +4.

**You'll practice:**

- Substituting into a formula with a square root and a fraction
- Handling a negative b (two sign flips that cancel - or don't, if you rush)

```lesson
{
  "language": "math",
  "starterCode": "(3 + sqrt(3^2 - 4*1*2)) / (2*1)",
  "solution": "(4 + sqrt(4^2 - 4*1*2)) / (2*1)",
  "expectedOutput": "3.4142",
  "check": "output",
  "hints": [
    "a = 1, b = -4, c = 2. The formula starts with -b, and -(-4) is +4.",
    "The discriminant is b^2 - 4*a*c = 16 - 8 = 8. sqrt(8) is about 2.8284.",
    "The full expression is: (4 + sqrt(4^2 - 4*1*2)) / (2*1)"
  ]
}
```
