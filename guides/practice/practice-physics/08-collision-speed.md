---
title: "Collision speed (capstone)"
guide: practice-physics
phase: 8
summary: "Use conservation of momentum to find the shared speed after two vehicles collide and lock together: v = (m1*v1 + m2*v2) / (m1 + m2)."
tags: [physics, momentum, collisions, conservation-laws, capstone, advanced]
difficulty: advanced
synonyms:
  - inelastic collision final velocity
  - conservation of momentum collision problem
  - two cars collide and stick together speed
updated: 2026-07-18
---

# Collision speed (capstone)

Lesson 4 introduced momentum: `p = m*v`, the quantity of motion. Here's why
physicists care so much about it: in a collision, **the total momentum before
equals the total momentum after** - no matter how violent, crumpled, or
noisy the crash is. Energy gets lost to sound, heat, and bent metal, but
momentum survives untouched. That's what makes it a conservation law.

For a collision where the two objects lock together afterward (physicists
call it *perfectly inelastic*), the bookkeeping is one line. Before: each
object carries `m*v`. After: one combined mass moves at one shared speed.
Setting before equal to after and solving for that shared speed:

```text
v = (m1*v1 + m2*v2) / (m1 + m2)
```

Read it as a weighted average: the final speed sits between the two starting
speeds, pulled toward whichever object carries more momentum. This is the
actual formula crash investigators start from when reconstructing accidents.

The starter shows the shape for a moving car hitting an identical parked one
(the answer is exactly half the speed - the momentum spreads over double the
mass). This lesson's vehicles differ in both mass and speed.

**Your task:** a 1,100 kg car moving at 18 m/s rear-ends a 900 kg car moving
at 4 m/s in the same direction; they lock together. What's their shared speed
just after the collision?

**You'll practice:**

- Applying a conservation law: total before = total after
- Computing a mass-weighted average speed

```lesson
{
  "language": "math",
  "starterCode": "(1000*10 + 1000*0) / (1000 + 1000)",
  "solution": "(1100*18 + 900*4) / (1100 + 900)",
  "expectedOutput": "11.7",
  "check": "output",
  "hints": [
    "Total momentum before: 1100*18 from the first car plus 900*4 from the second.",
    "After the crash one combined mass of 1100 + 900 = 2000 kg carries all of it.",
    "The full expression is: (1100*18 + 900*4) / (1100 + 900)"
  ]
}
```
