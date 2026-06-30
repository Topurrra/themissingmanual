---
title: "Derivatives as Right Now Speed"
guide: "calculus-how-things-change"
phase: 1
summary: "A derivative is the answer to 'how fast, right now?' It is the slope of a curve at a single point, the instantaneous velocity of a moving object, and the marginal cost of producing one more unit. This phase builds the intuition before introducing a single formula."
tags: [mathematics, calculus, derivatives, slope, velocity, rates-of-change, beginner-friendly]
difficulty: beginner
synonyms: ["what is a derivative", "derivative explained", "instantaneous speed", "slope of a curve", "marginal cost", "how to approximate a derivative"]
updated: 2026-06-28
---

# Derivatives as Right Now Speed

## The speedometer that taught me everything

You are driving down a highway. The speedometer reads 65 miles per hour. That number is a derivative.

It tells you how fast you are moving *right now*. Not how far you traveled in the last hour. Not how far you will travel in the next hour. Only this instant. That is what a derivative is: the rate of change at a single point in time.

If you press the gas, the speedometer climbs. If you let off, it falls. The speedometer is tracking the derivative of your position with respect to time.

## From average speed to instantaneous speed

Suppose you drive 100 miles in 2 hours. Your average speed is 50 miles per hour. But you probably were not going exactly 50 the whole time. You accelerated, cruised, maybe stopped for coffee.

Average speed is easy: total distance divided by total time. Instantaneous speed is harder. It is the speed at a single moment, and it requires a new idea.

Here is the trick. To find the speed at exactly 1 hour, look at a very short interval around 1 hour - say from 1 hour to 1.0001 hours. Compute the average speed over that tiny interval. As the interval gets smaller, the average speed gets closer and closer to the true instantaneous speed.

The derivative is the limit of that process as the interval shrinks to zero. It is the slope of the tangent line to the curve at that point.

## The slope of a hill

Picture a hill. At the bottom, the hill is flat - the slope is zero. As you climb, the slope gets steeper. At the top, the slope is zero again. On the way down, the slope is negative.

The slope at any point is the derivative of the height function at that point. If the height function is `h(x)`, then the derivative `h'(x)` tells you how steep the hill is at position `x`.

For a straight line, the slope is constant. For a curve, the slope changes from point to point. The derivative is the function that tells you the slope at every point.

## The derivative of a simple function

Consider the function `f(x) = x^2`. This is a parabola. At `x = 0`, the slope is zero (the bottom of the valley). At `x = 1`, the slope is 2. At `x = 2`, the slope is 4.

The derivative of `x^2` is `2x`. That is the rule: to find the slope at any point, double the x value.

```
f(x) = x^2
f'(x) = 2x
```

At `x = 3`, the slope is `2 * 3 = 6`. The curve is rising 6 units for every 1 unit you move to the right.

You do not need to memorize this rule. You need to understand what it means: the derivative of a function is a new function that gives the slope of the original function at every point.

## Marginal cost: the economics of one more

In economics, the **marginal cost** is the cost of producing one more unit. If you have made 100 widgets and you are considering the 101st, the marginal cost is the derivative of the total cost function at 100.

Suppose the total cost of producing `x` widgets is `C(x) = x^2 + 10x + 50`. The marginal cost at `x = 100` is `C'(100) = 2 * 100 + 10 = 210`, so the 101st widget costs about $210. (The exact cost of that one unit, `C(101) - C(100)`, is $211 - the derivative is the instantaneous rate, a fast and very close estimate.)

The derivative turns a question about totals ("how much does 100 widgets cost?") into a question about rates ("how much does one more cost?"). That translation is the whole point of calculus.

## Approximating a derivative from data

In the real world, you often have data points instead of a formula. You can approximate the derivative by computing the slope between two nearby points.

```
f'(x) ≈ (f(x + h) - f(x)) / h
```

The smaller `h` is, the better the approximation. This is called a **finite difference**, and it is how numerical libraries compute derivatives when they do not have an analytic formula.

## See it run

Here is a function and its derivative, computed both by the rule and by finite differences.

```python runnable
def f(x):
    return x ** 2

def derivative_at(x, h=0.0001):
    return (f(x + h) - f(x)) / h

for x in [0, 1, 2, 3, 4]:
    print(f"f({x}) = {f(x)}, f'({x}) ≈ {derivative_at(x):.4f}, exact = {2 * x}")
```

*What just happened:* The function `f(x) = x^2` was evaluated at several points. The `derivative_at` function approximated the derivative using a finite difference with `h = 0.0001`. The results match the exact derivative `2x` to four decimal places. The approximation gets better as `h` gets smaller.

## For builders

Derivatives are not only for math class. They are the engine behind much of modern computing.

- **Machine learning** - Training a neural network is minimizing a loss function. The gradient of the loss function tells you which direction to nudge the parameters to reduce the loss. That nudge is a derivative.
- **Physics simulations** - In a game or physics engine, the position of an object changes over time. The velocity is the derivative of position. The acceleration is the derivative of velocity. Simulating motion means integrating these derivatives over time.
- **Optimization** - Any time you want to find the maximum or minimum of a function - the best learning rate, the cheapest production level, the fastest route - you are looking for where the derivative is zero.
- **Signal processing** - Filters that detect edges in an image or changes in an audio signal are computing derivatives. An edge is a place where pixel intensity changes rapidly, which means the derivative is large.

> The key insight: a derivative is "how fast, right now." It turns a static picture into a movie, a total into a rate, a cost into a marginal cost. Once you see it that way, the formulas stop being magic and start being useful.

## What we have built

- A **derivative** is the rate of change of a function at a single point.
- For `f(x) = x^2`, the derivative is `f'(x) = 2x`.
- The derivative at a point is the slope of the tangent line to the curve at that point.
- **Marginal cost** is the derivative of the total cost function.
- A **finite difference** approximates a derivative from data points: `(f(x + h) - f(x)) / h`.
- In code, derivatives power machine learning, physics simulations, optimization, and signal processing.

A quick check before you move on:

```quiz
[
  {
    "q": "What does the derivative of a function represent?",
    "choices": ["The total change over a long interval", "The rate of change at a single point", "The average value of the function", "The area under the curve"],
    "answer": 1,
    "explain": "The derivative is the rate of change at a single point. For position with respect to time, it is instantaneous velocity. For cost with respect to quantity, it is marginal cost. It is not an average over an interval."
  },
  {
    "q": "If f(x) = x^2, what is f'(3)?",
    "choices": ["3", "6", "9", "12"],
    "answer": 1,
    "explain": "The derivative of x^2 is 2x. At x = 3, f'(3) = 2 * 3 = 6. The slope of the curve y = x^2 at the point (3, 9) is 6."
  },
  {
    "q": "How do you approximate a derivative from data points?",
    "choices": ["Divide the total change by the number of points", "Take the average of all the points", "Compute the slope between two nearby points: (f(x + h) - f(x)) / h", "Find the highest point and subtract the lowest"],
    "answer": 2,
    "explain": "A finite difference approximates the derivative by computing the slope between two points that are very close together. The smaller the distance h, the better the approximation of the true instantaneous rate of change."
  }
]
```

[← Guide overview](_guide.md) · [Phase 2: Optimization and What Is the Best I Can Do →](02-optimization-and-whats-the-best-i-can-do.md)
