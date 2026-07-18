---
title: "Projectile range"
guide: practice-physics
phase: 6
summary: "Compute how far a launched projectile lands using R = v^2 * sin(2*angle) / g - including converting the angle from degrees to radians inside the expression."
tags: [physics, projectile-motion, trigonometry, advanced]
difficulty: advanced
synonyms:
  - projectile range formula
  - how far does a projectile travel
  - v squared sin 2 theta over g
updated: 2026-07-18
---

# Projectile range

Launch something at an angle - a football, a water-balloon, a long jump - and
physics can tell you exactly where it lands. For a launch over flat ground
(ignoring air resistance), the range formula is:

```text
R = v^2 * sin(2 * angle) / g

v     = launch speed, in m/s
angle = launch angle above the ground
g     = 9.8 m/s^2
```

The `sin(2 * angle)` is the interesting part: it peaks when `2 * angle` is
90 degrees, which is why 45 degrees is the maximum-range angle - and why a
35-degree launch and a 55-degree launch land in the same spot.

One practical trap: `sin()` here expects **radians**, not degrees. A degree
angle has to be converted inside the expression by multiplying by `PI/180`.
Forget the conversion and `sin(70)` quietly computes the sine of 70 *radians* -
a completely different (and wrong) number, with no error to warn you.

The starter shows the shape for a 10 m/s launch at 45 degrees. This lesson's
launch is faster and flatter.

**Your task:** a ball is launched at 20 m/s, at 35 degrees above the ground.
How far away does it land? (g = 9.8)

**You'll practice:**

- Substituting into a formula with a trig function
- Converting degrees to radians inline with * PI/180

```lesson
{
  "language": "math",
  "starterCode": "10^2 * sin(2*45*PI/180) / 9.8",
  "solution": "20^2 * sin(2*35*PI/180) / 9.8",
  "expectedOutput": "38.3548",
  "check": "output",
  "hints": [
    "v = 20 and the angle is 35 degrees - the formula doubles the angle before taking the sine.",
    "sin() works in radians: write the angle as 2*35*PI/180, not just 70.",
    "The full expression is: 20^2 * sin(2*35*PI/180) / 9.8"
  ]
}
```
