---
title: "How many years to reach a target"
guide: practice-math
phase: 7
summary: "Flip a growth formula around with logarithms: given a starting value, a growth rate, and a target, compute how many years it takes to get there."
tags: [math, logarithms, exponential-growth, advanced]
difficulty: advanced
synonyms:
  - how long to double at growth rate
  - solve for time exponential growth
  - logarithm growth years formula
updated: 2026-07-18
---

# How many years to reach a target

Compound growth (lesson 5) answers "start with this, grow at this rate - how
much after t years?" The reverse question comes up just as often: "how *long*
until it reaches a target?" A city planner asking when the population hits the
water system's limit, an investor asking when a portfolio doubles.

The forward formula is `target = start * (1 + r)^t`. To pull `t` down out of
the exponent, you need the logarithm - the tool whose whole job is answering
"what exponent produced this?":

```text
t = log(target / start) / log(1 + r)
```

Read it as: "how many factors of (1+r) fit inside the total growth
(target/start)?" The `log` function here is the natural logarithm - which one
you use doesn't matter as long as top and bottom use the same one, because
the ratio cancels the choice out.

The answer is almost never a whole number of years - that's fine. 15.9 years
means "during the 16th year."

**Your task:** a city of 50,000 people grows 3% per year. How many years
until it reaches 80,000? Use `log(target/start) / log(1 + r)`.

**You'll practice:**

- Using logarithms to solve for an exponent
- Working with a formula where the answer is deliberately not a round number

```lesson
{
  "language": "math",
  "starterCode": "log(2) / log(1.05)",
  "solution": "log(80000/50000) / log(1.03)",
  "expectedOutput": "15.9006",
  "check": "output",
  "hints": [
    "target/start is 80000/50000 = 1.6 - the city needs to grow by a factor of 1.6.",
    "The growth factor per year is 1 + 0.03 = 1.03, so the bottom of the fraction is log(1.03).",
    "The full expression is: log(80000/50000) / log(1.03)"
  ]
}
```
