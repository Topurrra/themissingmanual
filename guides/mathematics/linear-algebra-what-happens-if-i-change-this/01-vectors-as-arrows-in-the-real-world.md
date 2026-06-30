---
title: "Vectors as Arrows in the Real World"
guide: "linear-algebra-what-happens-if-i-change-this"
phase: 1
summary: "A vector is nothing more than an arrow: it has a direction and a length. Adding vectors is combining movements. By the end, you will have built the mental model that makes every later idea in linear algebra feel obvious."
tags: [mathematics, linear-algebra, vectors, direction, magnitude, beginner-friendly]
difficulty: beginner
synonyms: ["what is a vector", "vector explained", "vector addition", "what is magnitude and direction", "vectors in programming"]
updated: 2026-06-28
---

# Vectors as Arrows in the Real World

## The walk that teaches you everything

Stand up. Face north. Walk three blocks. Turn right. Walk four blocks. Stop.

Where are you relative to where you started?

You did not need a calculator. You already know: you are five blocks away, in a direction that is slightly east of northeast. Your brain performed vector addition.

That is what this phase is about. Not symbols. Not formulas. The simple, physical fact that movements combine, and that the combination has a direction and a distance.

## What a vector is

A **vector** is an arrow. That is the whole idea.

The arrow has two properties:
- **Direction** - which way it points.
- **Magnitude** - how long it is.

In math we write a vector as a list of numbers inside parentheses, like this:

```
(3, 4)
```

But do not let the parentheses scare you. That is a way of writing "three units in the first direction, four units in the second direction." On a city grid, it might mean "three blocks east, four blocks north." In a game, it might mean "move three pixels right, four pixels down."

The numbers are called **components**. The first component is the east-west part. The second is the north-south part. If you had a 3D game, there would be a third component for up-down.

## Adding vectors: combining movements

Here is the part your brain already knows. If you walk vector A, then walk vector B, the result is the same as walking a single vector C that goes from your start to your final position.

```
A = (3, 4)     # three east, four north
B = (1, -2)    # one east, two south
C = A + B      # combine them
```

To add vectors, you add matching components:

```
C = (3 + 1, 4 + (-2)) = (4, 2)
```

Four east, two north. That is where you end up. The math is writing down what your legs already did.

## Scaling a vector: walking faster or slower

Sometimes you want the same direction but a different length. That is **scaling**.

If you double a vector, you walk twice as far in the same direction:

```
2 * (3, 4) = (6, 8)
```

If you halve it, you walk half as far:

```
0.5 * (3, 4) = (1.5, 2)
```

The number you multiply by is called a **scalar**. A scalar is a regular number that stretches or shrinks the arrow without turning it.

## The vector that does nothing

Every direction has a special vector: the one with length zero. It points nowhere and goes nowhere.

```
(0, 0)
```

Add it to any vector and nothing changes:

```
(3, 4) + (0, 0) = (3, 4)
```

This is the **zero vector**. It is the "do nothing" button of the vector world.

## See it run

Here is a character moving on a 2D grid. The position is a vector. Each move adds a new vector to it.

```python runnable
# A character starts at (0, 0)
position = [0, 0]

# Move east 3, north 4
move1 = [3, 4]
position = [position[0] + move1[0], position[1] + move1[1]]
print("After move 1:", position)

# Move east 1, south 2
move2 = [1, -2]
position = [position[0] + move2[0], position[1] + move2[1]]
print("After move 2:", position)

# Scale a movement: walk the same direction but twice as far
scaled_move = [2 * move1[0], 2 * move1[1]]
print("Scaled move (double):", scaled_move)
```

*What just happened:* The character started at `[0, 0]`. After the first move it was at `[3, 4]`. After the second move it was at `[4, 2]`. Then we took the first move and doubled it to `[6, 8]` - same direction, twice the distance. Every line is adding or scaling vectors.

## For builders

If you write code, you already use vectors. You do not call them that.

- **2D and 3D positions** in a game or UI are vectors. A character at `(x, y)` is a vector from the origin.
- **Velocities** are vectors. "Move 3 pixels per frame right and 2 pixels per frame down" is a velocity vector `(3, 2)`.
- **Colors** in RGB are vectors. `(255, 128, 0)` is a direction and intensity in color space.
- **Forces** in a physics simulation are vectors. Gravity pulls down `(0, -9.8)`. Wind pushes right `(2, 0)`.

The operations you already write - adding positions to velocities, scaling a force by a time step - are vector addition and scalar multiplication. The name is new. The work is not.

## What we have built

- A **vector** is an arrow with direction and magnitude, written as a list of components like `(3, 4)`.
- **Adding vectors** combines movements: add matching components.
- **Scaling a vector** stretches or shrinks it without turning it: multiply every component by the same scalar.
- The **zero vector** `(0, 0)` changes nothing when added.
- In code, positions, velocities, forces, and colors are all vectors in disguise.

A quick check before you move on:

```quiz
[
  {
    "q": "You walk 2 blocks east and 3 blocks north, then 1 block east and 2 blocks south. What is your final position relative to the start?",
    "choices": ["(3, 5)", "(3, 1)", "(1, 5)", "(1, 1)"],
    "answer": 1,
    "explain": "Add the east-west components: 2 + 1 = 3. Add the north-south components: 3 + (-2) = 1. Final position is (3, 1) - three east, one north."
  },
  {
    "q": "What does scaling a vector by 0.5 do?",
    "choices": ["It turns the vector 90 degrees", "It halves the length while keeping the same direction", "It makes the vector negative", "It adds a new component"],
    "answer": 1,
    "explain": "Multiplying a vector by a scalar stretches or shrinks it. 0.5 cuts the length in half without changing the direction."
  },
  {
    "q": "Which of these is NOT a vector in the sense we have defined?",
    "choices": ["A velocity of (5, -3) pixels per frame", "A color of (255, 128, 0) in RGB", "The number 42", "A force of (0, -9.8) meters per second squared"],
    "answer": 2,
    "explain": "A single number with no direction is a scalar, not a vector. The others all have multiple components that describe direction and magnitude in some space."
  }
]
```

[← Guide overview](_guide.md) · [Phase 2: Matrices as Recipes for Transformation →](02-matrices-as-recipes-for-transformation.md)
