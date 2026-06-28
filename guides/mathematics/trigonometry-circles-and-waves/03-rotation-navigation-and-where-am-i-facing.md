---
title: "Rotation, Navigation, and Where Am I Facing"
guide: "trigonometry-circles-and-waves"
phase: 3
summary: "Trigonometry is the math of direction. Rotating a sprite, pointing a camera, triangulating a position: all of them use sine and cosine to turn an angle into a coordinate. This phase connects the circle to the graphics, audio, and navigation systems you use every day."
tags: [mathematics, trigonometry, rotation, navigation, graphics, audio, game-dev, beginner-friendly]
difficulty: beginner
synonyms: ["how to rotate with trigonometry", "trigonometry in graphics", "trigonometry in game dev", "GPS and triangulation", "rotation matrices", "polar coordinates"]
updated: 2026-06-28
---

# Rotation, Navigation, and Where Am I Facing

## The compass that taught me everything

You are facing north. You turn 90 degrees to the right. Now you are facing east. If you walked forward, you would move east.

That turn is a rotation. In trigonometry, a rotation is a transformation that takes a point and moves it around a circle by a given angle. The new x coordinate is the old x times cosine of the angle minus the old y times sine of the angle. The new y coordinate is the old x times sine of the angle plus the old y times cosine of the angle.

That is the rotation formula. It is what every graphics card, game engine, and navigation system uses when it turns something.

## Rotating a point around the origin

Suppose you have a point at (3, 4) and you want to rotate it 90 degrees counterclockwise around the origin. The angle is pi/2 radians.

```
new_x = x * cos(theta) - y * sin(theta)
new_y = x * sin(theta) + y * cos(theta)
```

At theta = pi/2, cos(theta) = 0 and sin(theta) = 1. So:

```
new_x = 3 * 0 - 4 * 1 = -4
new_y = 3 * 1 + 4 * 0 = 3
```

The point (3, 4) rotated 90 degrees counterclockwise becomes (-4, 3). It moved from the first quadrant to the second quadrant, exactly as you would expect.

## The rotation matrix

In [Linear Algebra](/guides/linear-algebra-what-happens-if-i-change-this) you learned that a matrix is a recipe for transformation. The rotation matrix is the recipe for rotating every point in a shape by a given angle.

```
[cos(theta)  -sin(theta)]
[sin(theta)   cos(theta)]
```

Multiply this matrix by any point (x, y) and you get the rotated point. The matrix encodes the same formulas as above, just in a compact form.

This is what a graphics card does when it rotates a 3D model. It applies a rotation matrix to every vertex. The CPU computes the matrix once. The GPU multiplies it by thousands of vertices in parallel.

## Polar coordinates: radius and angle

So far we have described points by their x and y coordinates. That is **Cartesian coordinates**. Sometimes it is more natural to describe a point by its distance from the origin and its angle from the positive x-axis. That is **polar coordinates**.

```
x = r * cos(theta)
y = r * sin(theta)
```

`r` is the radius (distance from the origin). `theta` is the angle. Converting from Cartesian to polar:

```
r = sqrt(x^2 + y^2)
theta = atan2(y, x)
```

Polar coordinates are natural for anything that involves rotation or direction: a radar sweep, a orbiting planet, a character turning to face an enemy.

## Triangulation: finding position from angles

Suppose you are lost in a field. You can see two radio towers. You know the position of each tower. You can measure the angle from your position to each tower. Can you find your position?

Yes. This is **triangulation**, and it is how GPS works.

Draw lines from each tower in the direction you measured. Where the lines intersect is your position. The math uses the law of sines, which relates the angles of a triangle to the lengths of its sides. But the core idea is simple: two angles and a known baseline determine a triangle.

In practice, GPS uses three or more satellites and measures the time it takes for a signal to travel, which gives distance instead of angle. The principle is the same: geometry plus trigonometry turns measurements into position.

## See it run

Here is a point being rotated around the origin, and a simple triangulation example.

```python runnable
import math

def rotate_point(x, y, theta):
    new_x = x * math.cos(theta) - y * math.sin(theta)
    new_y = x * math.sin(theta) + y * math.cos(theta)
    return new_x, new_y

# Rotate (3, 4) by 90 degrees counterclockwise
x, y = 3, 4
theta = math.pi / 2
new_x, new_y = rotate_point(x, y, theta)
print(f"Original: ({x}, {y})")
print(f"Rotated 90 deg: ({new_x:.1f}, {new_y:.1f})")

# Rotate the same point by 45 degrees
theta = math.pi / 4
new_x, new_y = rotate_point(x, y, theta)
print(f"Rotated 45 deg: ({new_x:.4f}, {new_y:.4f})")

# Convert Cartesian to polar
r = math.sqrt(x**2 + y**2)
angle = math.atan2(y, x)
print(f"Polar: r = {r:.4f}, theta = {angle:.4f} rad = {math.degrees(angle):.1f} deg")
```

*What just happened:* The `rotate_point` function applied the rotation formula to the point (3, 4). Rotating by 90 degrees (pi/2 radians) moved it to (-4, 3). Rotating by 45 degrees (pi/4 radians) moved it to approximately (-0.7071, 4.9497). The polar conversion showed that the original point is at distance 5 from the origin, at an angle of about 53.13 degrees.

## For builders

Trigonometry is the math of direction, and direction is everywhere in software.

- **Graphics and games** - Rotating a sprite, aiming a turret, orbiting a camera: all use sine and cosine to convert an angle into a direction vector.
- **Audio** - A stereo pan effect uses sine and cosine to split a mono signal between left and right channels based on the angle of the sound source.
- **Navigation and maps** - Bearing and distance between two points on a sphere use spherical trigonometry. The haversine formula, used in GPS and mapping, is trigonometry on the surface of the Earth.
- **Animation** - A pendulum swing, a bouncing ball, a camera shake: all follow sine or cosine patterns. Using trig functions makes the motion smooth and natural.
- **Procedural generation** - Circular patterns, radial gradients, and spiral shapes all use polar coordinates and trig functions.

> The key insight: trigonometry is the math of direction and rotation. Sine and cosine turn an angle into a coordinate. Tangent gives the slope of a direction. Once you can turn "I am facing 30 degrees" into "I am moving in direction (cos(30), sin(30))," you can make anything rotate, orbit, or point.

## What we have built

- **Rotation** turns a point around the origin by a given angle.
- The **rotation matrix** encodes rotation as a 2x2 matrix: `[cos -sin; sin cos]`.
- **Polar coordinates** describe a point by its radius and angle instead of x and y.
- **Triangulation** finds a position from two or more angles and known reference points.
- In code, `math.sin`, `math.cos`, and `math.atan2` compute the trig functions needed for rotation and navigation.
- Trigonometry powers graphics, audio, animation, and GPS.

A quick check before you go:

```quiz
[
  {
    "q": "What does the rotation matrix [cos(theta) -sin(theta); sin(theta) cos(theta)] do?",
    "choices": ["It scales a point by a factor of cos(theta)", "It rotates a point around the origin by angle theta", "It reflects a point across the x-axis", "It translates a point by (cos(theta), sin(theta))"],
    "answer": 1,
    "explain": "The rotation matrix rotates a point around the origin by the angle theta. Multiplying the matrix by a point (x, y) gives the coordinates of the point after rotation."
  },
  {
    "q": "In polar coordinates, what does r represent?",
    "choices": ["The angle from the positive x-axis", "The distance from the origin", "The x coordinate", "The slope of the line from the origin"],
    "answer": 1,
    "explain": "In polar coordinates, r is the radius: the distance from the origin to the point. The angle theta is the direction from the positive x-axis. Together they describe the same point as x and y in Cartesian coordinates."
  },
  {
    "q": "How does GPS use trigonometry?",
    "choices": ["It measures angles to satellites with a protractor", "It measures the time for signals to travel from satellites, converts time to distance, and uses geometry to compute position", "It uses sine waves to transmit data", "It rotates the Earth until the satellite is overhead"],
    "answer": 1,
    "explain": "GPS measures the time it takes for a radio signal to travel from a satellite to your receiver. Since radio waves travel at the speed of light, time translates to distance. With distances to three or more satellites, geometry and trigonometry compute your position on Earth."
  }
]
```

[← Phase 2: Waves, Frequencies, and the Real World](02-waves-frequencies-and-the-real-world.md) · [Guide overview](_guide.md)
