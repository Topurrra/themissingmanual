---
title: "Integrals as the Total So Far"
guide: "calculus-how-things-change"
phase: 3
summary: "An integral is the answer to 'what is the total so far?' It adds up a million tiny pieces to compute area under a curve, total distance from speed, or expected value from a probability distribution. This phase connects the integral to profiling data, physics, and the expected value you met in probability."
tags: [mathematics, calculus, integrals, area-under-curve, Riemann-sum, expected-value, accumulation, beginner-friendly]
difficulty: beginner
synonyms: ["what is an integral", "area under the curve", "Riemann sum", "expected value and integrals", "how to compute an integral", "definite vs indefinite integral"]
updated: 2026-06-28
---

# Integrals as the Total So Far

## The odometer that taught me everything

You are driving down a highway. The speedometer tells you how fast you are going right now. That is the derivative. The odometer tells you how far you have traveled in total. That is the integral.

The odometer does not show speed. It shows the accumulated total of all the speeds you have been driving, added up over time. If you drive 60 mph for one hour, you go 60 miles. If you drive 30 mph for the next hour, you go another 30 miles. The odometer reads 90.

But what if your speed is changing every second? What if you accelerate, brake, and accelerate again? The odometer still works. It adds up all the tiny distances you traveled in each tiny slice of time. The integral is the mathematical name for that adding-up process.

## From slices to total

Suppose you want to know the area under a curve. The curve might represent speed over time, profit over quantity, or probability over outcomes. The area is the total.

You can approximate the area by slicing the region into thin rectangles and adding up their areas. Each rectangle has a width (a small slice of the x-axis) and a height (the value of the function at that slice). The area of one rectangle is width times height. The total area is the sum of all the rectangles.

```
Area ≈ sum of (width * height) for each slice
```

As the slices get thinner, the approximation gets better. In the limit, as the width of each slice approaches zero, the sum becomes an **integral**.

```
Integral = limit of the sum as slice width -> 0
```

That limit is what the integral symbol means. The long S shape is a sum. The little numbers at the bottom and top say where to start and stop adding.

## The area under a curve

Consider the function `f(x) = x`. This is a straight line from the origin at a 45 degree angle. The area under this line from `x = 0` to `x = 2` is a triangle with base 2 and height 2.

```
Area = (1/2) * base * height = (1/2) * 2 * 2 = 2
```

The integral gives the same answer:

```
integral from 0 to 2 of x dx = [x^2 / 2] from 0 to 2 = (4 / 2) - (0 / 2) = 2
```

The antiderivative of `x` is `x^2 / 2`. Evaluate it at the upper limit and subtract the value at the lower limit. That is the **fundamental theorem of calculus**: integration and differentiation are inverse operations.

## Expected value: probability as an integral

In [Probability & Statistics](/guides/probability-and-statistics) you learned that expected value is the sum of each value times its probability. For a continuous random variable, the sum becomes an integral.

```
Expected value = integral of (x * probability_density(x)) dx
```

The integral adds up the value `x` weighted by how likely it is, across all possible values. The result is the long-run average you would expect if you repeated the experiment infinitely many times.

This is the same idea as the odometer. Instead of adding up tiny distances, you are adding up tiny probabilities weighted by their outcomes. The integral is the accumulation machine. It works for distance, for area, for probability, and for anything else that adds up.

## Riemann sums: the integral made concrete

A **Riemann sum** is a way to approximate an integral by slicing the region into rectangles and adding their areas. It is the bridge between the intuitive "add up thin slices" idea and the formal integral.

```
Riemann sum = sum of f(x_i) * delta_x for i = 1 to n
```

`x_i` is the position of the i-th slice. `delta_x` is the width of the slice. `f(x_i)` is the height. As `n` gets larger and `delta_x` gets smaller, the Riemann sum approaches the true integral.

This is exactly what a computer does when it computes an integral numerically. It cannot evaluate the limit symbolically, so it chops the region into many thin slices and adds them up. For most practical purposes, a few thousand slices are enough.

## See it run

Here is a Riemann sum approximation of the integral of `x` from 0 to 2, compared to the exact answer.

```python runnable
def f(x):
    return x

def riemann_sum(a, b, n):
    width = (b - a) / n
    total = 0
    for i in range(n):
        x = a + i * width
        total = total + f(x) * width
    return total

exact = 2.0  # integral of x from 0 to 2 is 2
for n in [10, 100, 1000, 10000]:
    approx = riemann_sum(0, 2, n)
    print(f"n = {n:5d}: approx = {approx:.6f}, error = {abs(approx - exact):.6f}")
```

*What just happened:* The `riemann_sum` function sliced the interval from 0 to 2 into `n` equal pieces, evaluated `f(x) = x` at the left edge of each piece, and added up the areas of the resulting rectangles. With `n = 10`, the approximation was 1.800000, with an error of 0.200000. With `n = 10000`, the approximation was 1.999900, with an error of 0.000100. As the number of slices increased, the approximation converged to the exact answer of 2.

## For builders

Integrals are not only for math class. They are the way you compute totals from rates.

- **Profiling and monitoring** - If you have a graph of requests per second over time, the integral of that graph is the total number of requests. Integrating a latency distribution gives you the total time spent waiting.
- **Physics simulations** - If you know the acceleration of an object, integrating once gives velocity, and integrating again gives position. Game engines and physics simulators do this every frame.
- **Probability and statistics** - The expected value of a continuous random variable is an integral. The cumulative distribution function is the integral of the probability density function.
- **Machine learning** - The loss during training is often integrated over time to produce a learning curve. The area under the precision-recall curve is the average precision.
- **Signal processing** - Filters that smooth or integrate a signal are computing running integrals. A moving average is a discrete approximation of an integral.

> The key insight: an integral is "the total so far." It adds up a million tiny pieces to compute a whole. The derivative breaks a whole into rates. The integral builds a whole from rates. They are two sides of the same coin.

## What we have built

- An **integral** adds up a function over an interval to compute a total.
- A **Riemann sum** approximates an integral by slicing the region into thin rectangles and adding their areas.
- The **fundamental theorem of calculus** says integration and differentiation are inverse operations.
- The **expected value** of a continuous random variable is an integral of `x` times the probability density.
- In code, numerical integration uses Riemann sums with many thin slices.
- Integrals compute total distance from speed, total requests from rate, and total probability from density.

A quick check before you go:

```quiz
[
  {
    "q": "What does an integral compute?",
    "choices": ["The rate of change at a single point", "The total accumulation of a function over an interval", "The maximum value of a function", "The slope of a curve"],
    "answer": 1,
    "explain": "An integral adds up a function over an interval to compute a total. For speed over time, it gives total distance. For probability density, it gives total probability. For requests per second, it gives total requests."
  },
  {
    "q": "What is a Riemann sum?",
    "choices": ["A method for solving differential equations", "An approximation of an integral by slicing into thin rectangles and adding their areas", "A type of derivative", "A way to find the maximum of a function"],
    "answer": 1,
    "explain": "A Riemann sum approximates an integral by dividing the interval into slices, computing the area of a rectangle for each slice, and summing them. As the slices get thinner, the approximation approaches the true integral."
  },
  {
    "q": "How are integration and differentiation related?",
    "choices": ["They are unrelated operations", "They are inverse operations: integrating a derivative gives back the original function (up to a constant)", "Integration is always harder than differentiation", "Differentiation is only for polynomials"],
    "answer": 1,
    "explain": "The fundamental theorem of calculus states that integration and differentiation are inverse operations. If you differentiate a function and then integrate the result, you get back the original function (plus a constant). This is why antiderivatives are useful for computing definite integrals."
  }
]
```

[← Phase 2: Optimization and What Is the Best I Can Do](02-optimization-and-whats-the-best-i-can-do.md) · [Guide overview](_guide.md)
