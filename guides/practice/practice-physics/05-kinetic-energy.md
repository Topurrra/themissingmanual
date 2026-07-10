---
title: "Kinetic energy (capstone)"
guide: practice-physics
phase: 5
summary: "Use KE = 0.5 x m x v^2, and see for yourself why doubling speed quadruples kinetic energy."
tags: [physics, kinetic-energy, mass, velocity, capstone]
difficulty: intermediate
synonyms:
  - kinetic energy formula
  - kinetic energy calculator
  - why speed is more dangerous than it feels
updated: 2026-07-10
---

# Kinetic energy (capstone)

From [/guides/energy-forces-and-motion](/guides/energy-forces-and-motion):
kinetic energy is the energy of motion, `KE = 0.5 * m * v^2`. The guide calls
out that speed counts double - going twice as fast carries four times the
kinetic energy - and the squared `v` in this formula is exactly why: doubling
`v` doubles `v^2` twice over. It's the same reason high speeds are so much
more dangerous than they feel.

The starter expression uses small numbers - swap in this lesson's real ones.

**Your task:** a 70 kg cyclist is moving at 8 m/s. Using
`KE = 0.5 * m * v^2`, what's their kinetic energy, in joules?

**You'll practice:**

- Substituting real values into KE = 0.5 * m * v^2
- Seeing the squared term's effect: try doubling v in your head and notice the answer more than doubles

```lesson
{
  "language": "math",
  "starterCode": "0.5 * 10 * 2^2",
  "solution": "0.5 * 70 * 8^2",
  "expectedOutput": "2240",
  "check": "output",
  "hints": [
    "KE = 0.5 * m * v^2 - the velocity gets squared, not the whole expression.",
    "Mass is 70 kg, velocity is 8 m/s.",
    "The full expression is: 0.5 * 70 * 8^2"
  ]
}
```
