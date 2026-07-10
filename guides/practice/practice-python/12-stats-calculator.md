---
title: "Stats calculator: mean and variance"
guide: practice-python
phase: 12
summary: "Write mean(nums) and variance(nums) - the population variance - using nothing but sum, len, and a generator expression."
tags: [python, statistics, mean, variance]
difficulty: intermediate
synonyms:
  - python mean function
  - python variance calculation
  - population variance python
  - calculate statistics python
updated: 2026-07-10
---

# Stats calculator: mean and variance

The mean is the plain average: add everything up, divide by how many there
are - `sum(nums) / len(nums)`. No `import` needed; `sum` and `len` are
built-ins.

Variance measures how spread out the numbers are around that mean. The
**population variance** - the simpler of the two variance formulas, and the
one this lesson uses - is the average of the squared distance from each
number to the mean: for every `x` in `nums`, compute `(x - mean) ** 2`, then
average those. Squaring keeps distances positive (so numbers below the mean
don't cancel out ones above it) and exaggerates the numbers that are furthest
from it.

**Your task:** write `mean(nums)`, returning the arithmetic mean of the
numbers in `nums`. Then write `variance(nums)`, returning the population
variance - the average of `(x - mean(nums)) ** 2` across every `x` in `nums`.

**You'll practice:**

- Computing an average with `sum` and `len`
- Building the variance formula from a generator expression and a call to
  your own `mean`

```lesson
{
  "language": "python",
  "starterCode": "# Write mean(nums): the arithmetic mean (average) of the numbers in nums.\ndef mean(nums):\n    pass\n\n# Write variance(nums): the population variance - the average of\n# (x - mean(nums)) ** 2 across every x in nums.\ndef variance(nums):\n    pass",
  "solution": "def mean(nums):\n    return sum(nums) / len(nums)\n\ndef variance(nums):\n    m = mean(nums)\n    return sum((x - m) ** 2 for x in nums) / len(nums)",
  "hints": ["mean(nums) is just sum(nums) / len(nums).", "variance can call mean(nums) to get m, then average (x - m) ** 2 over every x.", "sum((x - m) ** 2 for x in nums) / len(nums) - a generator expression, no brackets needed."],
  "tests": [
    { "name": "mean of a simple list", "code": "assert mean([1, 2, 3]) == 2.0, 'mean([1, 2, 3]) should be 2.0'" },
    { "name": "mean of a classic stats example", "code": "assert mean([2, 4, 4, 4, 5, 5, 7, 9]) == 5.0, 'mean([2, 4, 4, 4, 5, 5, 7, 9]) should be 5.0'" },
    { "name": "variance of that same example", "code": "assert variance([2, 4, 4, 4, 5, 5, 7, 9]) == 4.0, 'variance([2, 4, 4, 4, 5, 5, 7, 9]) should be 4.0'" },
    { "name": "variance of identical numbers is 0", "code": "assert variance([10, 10, 10]) == 0.0, 'variance([10, 10, 10]) should be 0.0 - no spread at all'" },
    { "name": "variance matches the formula on a small list", "code": "assert variance([1, 2, 3]) == 2 / 3, 'variance([1, 2, 3]) should be 2/3'" }
  ]
}
```
