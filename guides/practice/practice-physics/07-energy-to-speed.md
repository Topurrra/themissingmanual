---
title: "From height to speed"
guide: practice-physics
phase: 7
summary: "Use energy conservation to find how fast something is moving at the bottom of a drop: v = sqrt(2*g*h), no timing equipment required."
tags: [physics, energy-conservation, kinetic-energy, potential-energy, advanced]
difficulty: advanced
synonyms:
  - final speed from height formula
  - v equals square root of 2gh
  - energy conservation speed at bottom
updated: 2026-07-18
---

# From height to speed

Here's a small miracle of physics: to know how fast a skateboarder is moving
at the bottom of a ramp, you don't need a stopwatch, a camera, or the shape
of the ramp. You only need the height.

The reasoning is energy conservation. At the top, the skater has potential
energy `m*g*h` and no speed. At the bottom, all of it has become kinetic
energy `0.5*m*v^2` (lesson 5's formula). Set them equal:

```text
m*g*h = 0.5 * m * v^2
```

The mass appears on both sides - so it cancels. A heavy skater and a light
one hit the bottom at the same speed. Solving for v:

```text
v = sqrt(2 * g * h)
```

Notice what dropped out: the mass, the ramp's shape, the time it took. Energy
bookkeeping skips all of it and goes straight from height to speed. (Real
ramps lose a little to friction, so this is the ideal ceiling - the real
speed comes out slightly lower.)

The starter shows the shape for a 5 m drop. This lesson's ramp is taller.

**Your task:** a skater starts from rest at the top of a 12 m ramp. How fast
are they moving at the bottom, in m/s? (g = 9.8)

**You'll practice:**

- Using energy conservation instead of motion equations
- Reading a derivation where a variable cancels out of both sides

```lesson
{
  "language": "math",
  "starterCode": "sqrt(2 * 9.8 * 5)",
  "solution": "sqrt(2 * 9.8 * 12)",
  "expectedOutput": "15.3362",
  "check": "output",
  "hints": [
    "The mass cancels out of m*g*h = 0.5*m*v^2, so it never appears in the answer.",
    "Solving for v gives v = sqrt(2*g*h), with g = 9.8 and h = 12.",
    "The full expression is: sqrt(2 * 9.8 * 12)"
  ]
}
```
