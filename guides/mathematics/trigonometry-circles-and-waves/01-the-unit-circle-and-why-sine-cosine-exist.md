---
title: "The Unit Circle and Why Sine/Cosine Exist"
guide: "trigonometry-circles-and-waves"
phase: 1
summary: "Trigonometry starts with a point moving around a circle. The height of that point is sine. The horizontal position is cosine. This phase explains why those functions exist, how to read the unit circle, and why radians are the natural way to measure angles."
tags: [mathematics, trigonometry, unit-circle, sine, cosine, radians, angles, beginner-friendly]
difficulty: beginner
synonyms: ["what is sine and cosine", "unit circle explained", "what are radians", "trigonometry basics", "sine and cosine for beginners"]
updated: 2026-06-28
---

# The Unit Circle and Why Sine/Cosine Exist

## The point that taught me everything

Imagine a point moving around a circle. The circle has radius 1 and is centered at the origin. The point starts at the rightmost edge, at position (1, 0). It moves counterclockwise.

At any moment, the point has an x coordinate and a y coordinate. The x coordinate is the **cosine** of the angle. The y coordinate is the **sine** of the angle.

That is it. That is the whole definition. Sine and cosine are not mysterious functions invented to make your life difficult. They are the coordinates of a point moving around a circle. If you can picture a point on a circle, you already understand sine and cosine.

## The unit circle

The **unit circle** is a circle with radius 1 centered at the origin (0, 0). Its equation is:

```
x^2 + y^2 = 1
```

Every point on the circle satisfies this equation. The point (1, 0) is on the circle because 1^2 + 0^2 = 1. The point (0, 1) is on the circle because 0^2 + 1^2 = 1. The point (sqrt(2)/2, sqrt(2)/2) is on the circle because (sqrt(2)/2)^2 + (sqrt(2)/2)^2 = 1/2 + 1/2 = 1.

When a point moves around the unit circle, its x and y coordinates trace out the cosine and sine functions.

## Angles and radians

An angle measures how far the point has rotated around the circle. There are two common units: degrees and radians.

A full circle is 360 degrees. It is also 2 pi radians. So:

```
360 degrees = 2 * pi radians
180 degrees = pi radians
90 degrees = pi / 2 radians
```

Radians are the natural unit for trigonometry because they measure angle by arc length. On the unit circle, the arc length is exactly equal to the angle in radians. A quarter turn is pi/2 radians, and the arc length is pi/2. A half turn is pi radians, and the arc length is pi.

Most programming languages use radians for their trig functions. If you have degrees, convert by multiplying by pi/180.

## Sine and cosine as coordinates

As the point moves around the unit circle, its coordinates change. Here are the key positions:

```
Angle 0:          (1, 0)       -> cos(0) = 1,  sin(0) = 0
Angle pi/2:       (0, 1)       -> cos(pi/2) = 0, sin(pi/2) = 1
Angle pi:         (-1, 0)      -> cos(pi) = -1, sin(pi) = 0
Angle 3*pi/2:     (0, -1)      -> cos(3*pi/2) = 0, sin(3*pi/2) = -1
Angle 2*pi:       (1, 0)       -> cos(2*pi) = 1, sin(2*pi) = 0
```

The cosine is the x coordinate. The sine is the y coordinate. As the angle increases, the point moves around the circle, and the coordinates oscillate between -1 and 1.

That oscillation is the wave. Every sine wave is a point moving around a circle, projected onto one axis.

## Tangent: the slope of the radius

The **tangent** of an angle is the slope of the line from the origin to the point on the unit circle.

```
tan(theta) = sin(theta) / cos(theta)
```

When the cosine is zero (at pi/2 and 3*pi/2), the tangent is undefined. The line is vertical, and vertical lines have infinite slope.

Tangent grows faster than sine and cosine. It shoots off to infinity as the angle approaches pi/2 from the left, and it comes from negative infinity as the angle approaches pi/2 from the right.

## The Pythagorean identity

Because the point is always on the unit circle, its coordinates always satisfy x^2 + y^2 = 1. Substitute cosine for x and sine for y:

```
cos^2(theta) + sin^2(theta) = 1
```

This is the **Pythagorean identity**. It is not a theorem you have to prove. It is the equation of the circle, restated in trig functions. It is always true, for every angle, because the point is always on the circle.

## See it run

Here is a point moving around the unit circle, with its sine and cosine values printed at key angles.

```python runnable
import math

angles = [0, math.pi/6, math.pi/4, math.pi/3, math.pi/2, math.pi, 3*math.pi/2, 2*math.pi]
print("Angle (rad) | cos(x) | sin(x)")
print("-" * 35)
for angle in angles:
    c = math.cos(angle)
    s = math.sin(angle)
    print(f"{angle:10.4f} | {c:7.4f} | {s:7.4f}")
```

*What just happened:* The code computed cosine and sine for several key angles using Python's `math` module. At angle 0, cosine is 1 and sine is 0. At pi/2, cosine is 0 and sine is 1. At pi, cosine is -1 and sine is 0. The values oscillate between -1 and 1 as the angle goes around the circle, exactly as the unit circle predicts.

## For builders

Sine and cosine are not only for math class. They are the functions behind most visual and audio software.

- **Graphics and animation** - A character moving in a circle, a camera orbiting a target, a pulsing glow effect: all use sine and cosine to convert an angle into x and y coordinates.
- **Audio synthesis** - A pure musical note is a sine wave. Combining sine waves of different frequencies creates complex sounds. The Fourier transform decomposes any sound into its component sine waves.
- **Signal processing** - Filters, equalizers, and modems all use sine and cosine to represent and manipulate signals.
- **Game development** - Projectile motion, orbital mechanics, and camera shakes often use trig functions to compute positions and angles.
- **Data visualization** - Radar charts, polar plots, and circular progress indicators all rely on converting angles to coordinates with sine and cosine.

> The key insight: sine and cosine are the coordinates of a point moving around a circle. That single idea explains why they oscillate between -1 and 1, why they are 90 degrees out of phase, and why they appear in every repeating phenomenon.

## What we have built

- The **unit circle** is a circle of radius 1 centered at the origin.
- **Cosine** is the x coordinate of a point on the unit circle.
- **Sine** is the y coordinate of a point on the unit circle.
- **Radians** measure angle by arc length. A full circle is 2*pi radians.
- **Tangent** is the slope of the radius: sin(theta) / cos(theta).
- The **Pythagorean identity** (cos^2 + sin^2 = 1) is the equation of the unit circle.
- In code, `math.sin` and `math.cos` compute sine and cosine from an angle in radians.

A quick check before you move on:

```quiz
[
  {
    "q": "On the unit circle, what does cosine of an angle represent?",
    "choices": ["The y coordinate of the point", "The x coordinate of the point", "The distance from the origin", "The slope of the tangent line"],
    "answer": 1,
    "explain": "Cosine is the x coordinate of the point on the unit circle at the given angle. Sine is the y coordinate. Together they describe the position of the point as it moves around the circle."
  },
  {
    "q": "How many radians are in a full circle?",
    "choices": ["360", "180", "2 * pi", "pi / 2"],
    "answer": 2,
    "explain": "A full circle is 360 degrees, which equals 2 * pi radians. Radians measure angle by arc length on the unit circle, so a full revolution (the circumference) is 2 * pi * 1 = 2 * pi."
  },
  {
    "q": "What is the Pythagorean identity?",
    "choices": ["sin(theta) + cos(theta) = 1", "sin^2(theta) + cos^2(theta) = 1", "tan(theta) = sin(theta) / cos(theta)", "cos(2*theta) = cos^2(theta) - sin^2(theta)"],
    "answer": 1,
    "explain": "The Pythagorean identity states that sin^2(theta) + cos^2(theta) = 1 for any angle theta. It comes directly from the equation of the unit circle: x^2 + y^2 = 1, with x = cos(theta) and y = sin(theta)."
  }
]
```

[← Guide overview](_guide.md) · [Phase 2: Waves, Frequencies, and the Real World →](02-waves-frequencies-and-the-real-world.md)
