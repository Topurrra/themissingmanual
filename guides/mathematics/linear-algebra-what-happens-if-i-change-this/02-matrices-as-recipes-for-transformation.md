---
title: "Matrices as Recipes for Transformation"
guide: "linear-algebra-what-happens-if-i-change-this"
phase: 2
summary: "A matrix is a compact way to say 'stretch this,' 'rotate that,' or 'skew everything.' Matrix multiplication is the act of applying one transformation after another. By the end, a matrix will look like a recipe card, not a wall of numbers."
tags: [mathematics, linear-algebra, matrices, transformations, scaling, rotation, beginner-friendly]
difficulty: beginner
synonyms: ["what is a matrix", "matrix multiplication explained", "linear transformation", "how to rotate with matrices", "scaling and shearing"]
updated: 2026-06-28
---

# Matrices as Recipes for Transformation

## The photo filter that taught me everything

Open any photo app. Tap "rotate 90 degrees." The picture turns. Tap "black and white." The colors vanish. Tap "vignette." The edges darken.

Each of those taps runs a tiny piece of linear algebra. The app takes every pixel in the photo, treats its position as a vector, and applies a transformation to it. The transformation is stored as a matrix.

That is what this phase is about. Not the symbols first. The idea first: a matrix is a recipe. It says "here is how to change every point in a shape."

## From vector to point

In Phase 1 we treated vectors as movements. The same math works when we treat vectors as **positions**.

A point on a screen is a vector from the top-left corner. The point at the top-left is `(0, 0)`. The point 100 pixels to the right and 50 down is `(100, 50)`.

If we apply a transformation to that point, we get a new point. The transformation is the matrix.

## The simplest transformation: scaling

Suppose you want to make everything twice as wide but keep the same height. That is a **scaling** transformation.

The matrix for "double the width, keep the height" looks like this:

```
[2  0]
[0  1]
```

Do not memorize it. Read it as two instructions:
- The first row says "for the new x coordinate, take 2 times the old x and 0 times the old y."
- The second row says "for the new y coordinate, take 0 times the old x and 1 times the old y."

Apply it to the point `(100, 50)`:

```
new_x = 2 * 100 + 0 * 50 = 200
new_y = 0 * 100 + 1 * 50 = 50
```

The point moved from `(100, 50)` to `(200, 50)`. It got twice as far from the left edge, but stayed at the same height. That is exactly what "double the width" means.

## Rotation: turning the whole world

Now you want to rotate everything 90 degrees clockwise around the origin.

The matrix for that is:

```
[ 0  1]
[-1  0]
```

Read it the same way:
- new_x = 0 * old_x + 1 * old_y
- new_y = -1 * old_x + 0 * old_y

Apply it to `(100, 50)`:

```
new_x = 0 * 100 + 1 * 50 = 50
new_y = -1 * 100 + 0 * 50 = -100
```

The point `(100, 50)` became `(50, -100)`. It moved from the lower-right quadrant to the lower-left quadrant. That is a 90 degree clockwise turn.

## Combining transformations: matrix multiplication

Here is the part that feels like magic. Suppose you want to scale (doubling the width) and *then* rotate 90 degrees. You can do it in two steps, or combine the two matrices into one.

The combined matrix is the **product** of the two matrices, and the order matters: scale then rotate is different from rotate then scale. The rule to remember: the transformation you apply **first** goes on the **right**. So "scale, then rotate" is `Rotate * Scale`.

```
Scale:  [2  0]     Rotate: [ 0  1]
        [0  1]             [-1  0]

Scale then rotate = Rotate * Scale:
[ 0*2 + 1*0    0*0 + 1*1]   [ 0   1]
[-1*2 + 0*0   -1*0 + 0*1] = [-2   0]
```

The result is a new matrix that does both operations in one shot. Apply it to `(100, 50)`:

```
new_x =  0 * 100 + 1 * 50 =  50
new_y = -2 * 100 + 0 * 50 = -200
```

This matches doing the two steps by hand: scaling `(100, 50)` to `(200, 50)`, then rotating that to `(50, -200)`. Matrix multiplication is the notation for "do this transformation, then that one."

## Shearing: the transformation nobody talks about

Scaling stretches equally in all directions from an axis. Rotation turns around a point. **Shearing** slides one axis based on the other.

The matrix for "slide right based on height" is:

```
[1  1]
[0  1]
```

Apply it to `(100, 50)`:

```
new_x = 1 * 100 + 1 * 50 = 150
new_y = 0 * 100 + 1 * 50 = 50
```

The point moved right by an extra 50 pixels because its y coordinate was 50. A rectangle would lean. That is shear. It is what makes italic text look slanted.

## See it run

Here is a tiny transformation engine. It defines three matrices and applies them to a point.

```python runnable
def apply_matrix(matrix, point):
    # matrix is a 2x2 list of lists, point is [x, y]
    new_x = matrix[0][0] * point[0] + matrix[0][1] * point[1]
    new_y = matrix[1][0] * point[0] + matrix[1][1] * point[1]
    return [new_x, new_y]

point = [100, 50]

scale = [[2, 0], [0, 1]]
rotate = [[0, 1], [-1, 0]]
shear = [[1, 1], [0, 1]]

print("Original:", point)
print("Scaled 2x:", apply_matrix(scale, point))
print("Rotated 90 deg clockwise:", apply_matrix(rotate, point))
print("Sheared:", apply_matrix(shear, point))
```

*What just happened:* The function `apply_matrix` takes a 2x2 matrix and a point, then computes the new point by the rule we described. Scaling doubled the x coordinate. Rotation swapped x and y and negated the new y. Shear added the y value to the x value. Each matrix is a different recipe. The same function runs them all.

## For builders

You encounter these transformations constantly, even if you never write a matrix by hand.

- **CSS transforms** - `scale(2)`, `rotate(90deg)`, `skewX(20deg)` are exactly the scaling, rotation, and shear matrices we built. The browser does the matrix math for you.
- **Image processing** - resizing a photo is scaling. Rotating a thumbnail is rotation. The "lens correction" that straightens tilted photos is a combination of rotation and shear.
- **2D and 3D graphics** - every vertex in a game world is a vector. Every model view matrix is a recipe for where that vertex should appear on screen.
- **Data visualization** - mapping data coordinates to pixel coordinates is a linear transformation. The axes you see on a chart are the result of scaling and translating the data space.

> The key insight: a matrix is not a mysterious grid of numbers. It is a set of instructions. "For each point, compute its new position this way." Once you read it that way, the symbols stop being noise and start being a recipe card.

## What we have built

- A **matrix** is a compact way to write a transformation: how to turn every point in a shape into a new point.
- **Scaling** stretches or shrinks along an axis.
- **Rotation** turns everything around a center point.
- **Shear** slides one axis based on the value of another.
- **Matrix multiplication** combines transformations: do A, then do B, and the product matrix does both.
- The order of multiplication matters: scale then rotate is not the same as rotate then scale.

A quick check before you move on:

```quiz
[
  {
    "q": "What does a matrix represent in the way we have been using it?",
    "choices": ["A list of unrelated numbers", "A recipe for transforming every point in a shape", "A way to store data in a database", "A type of vector with more components"],
    "answer": 1,
    "explain": "A matrix encodes a transformation: for each input point, it computes a new output point. Scaling, rotation, and shear are all examples of transformations written as matrices."
  },
  {
    "q": "If you scale by 2 and then rotate 90 degrees, is that the same as rotating 90 degrees and then scaling by 2?",
    "choices": ["Yes, matrix multiplication is always commutative", "No, the order of transformations matters", "Yes, but only for square matrices", "No, but only for rotation matrices"],
    "answer": 1,
    "explain": "Matrix multiplication is not commutative. Scale then rotate produces a different result than rotate then scale, because the operations act on the coordinate system in a different order."
  },
  {
    "q": "What does the shear matrix [1 1; 0 1] do to a point?",
    "choices": ["It doubles the x coordinate", "It adds the y coordinate to the x coordinate, slanting the shape", "It rotates the point 45 degrees", "It reflects the point across the y axis"],
    "answer": 1,
    "explain": "The shear matrix [1 1; 0 1] computes new_x = 1*x + 1*y and new_y = 0*x + 1*y. The x value gets the y value added to it, which slants or shears the shape."
  }
]
```

[← Phase 1: Vectors as Arrows in the Real World](01-vectors-as-arrows-in-the-real-world.md) · [Guide overview](_guide.md) · [Phase 3: Why This Is Everywhere →](03-why-this-is-everywhere.md)
