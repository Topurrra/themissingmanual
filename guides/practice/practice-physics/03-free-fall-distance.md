---
title: "Free-fall distance"
guide: practice-physics
phase: 3
summary: "Use d = 0.5 x g x t^2 - the falling-stone formula from the units guide's dimensional-analysis example - to find how far something falls."
tags: [physics, free-fall, gravity, kinematics]
difficulty: beginner
synonyms:
  - free fall distance formula
  - falling object distance calculator
  - gravity kinematics formula
updated: 2026-07-10
---

# Free-fall distance

From [/guides/what-physics-actually-is](/guides/what-physics-actually-is):
dropping a stone, the distance it falls is `d = 0.5 * g * t^2`, where `g` is
9.8 m/s² (gravity's acceleration near Earth's surface) and `t` is the time
falling, in seconds. The guide even checks this formula's units before
trusting it: `m/s^2` times `s^2` cancels down to plain `m` - a distance,
exactly what `d` should be.

The starter expression uses `t = 1` - swap in this lesson's real time.

**Your task:** a stone is dropped from a bridge and falls for 3 seconds
before hitting the water. Using `d = 0.5 * 9.8 * t^2`, how far did it fall,
in meters?

**You'll practice:**

- Substituting a value into an exponent (t^2)
- Reading `0.5 * g * t^2` as one expression, not three separate steps

```lesson
{
  "language": "math",
  "starterCode": "0.5 * 9.8 * 1^2",
  "solution": "0.5 * 9.8 * 3^2",
  "expectedOutput": "44.1",
  "check": "output",
  "hints": [
    "d = 0.5 * g * t^2, with g = 9.8.",
    "The stone falls for t = 3 seconds - that's what gets squared.",
    "The full expression is: 0.5 * 9.8 * 3^2"
  ]
}
```
