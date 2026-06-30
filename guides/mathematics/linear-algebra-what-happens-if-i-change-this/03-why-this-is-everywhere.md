---
title: "Why This Is Everywhere"
guide: "linear-algebra-what-happens-if-i-change-this"
phase: 3
summary: "Vectors and matrices are not abstract exercises. They are the machinery behind Google search, Netflix recommendations, every photo filter, and every neural network. This phase connects the arrows and recipes you have learned to the systems you use every day."
tags: [mathematics, linear-algebra, applications, pagerank, neural-networks, recommendations, beginner-friendly]
difficulty: beginner
synonyms: ["applications of linear algebra", "how is linear algebra used", "PageRank explained", "neural networks and linear algebra", "recommendation systems math"]
updated: 2026-06-28
---

# Why This Is Everywhere

## The pattern you already know

In Phase 1 you learned that a vector is an arrow. In Phase 2 you learned that a matrix is a recipe for transforming arrows. Now you are going to see those same arrows and recipes running the world.

The pattern is always the same:
1. Take a bunch of things (people, web pages, products, pixels).
2. Represent each thing as a vector.
3. Use matrices to transform those vectors in a way that reveals something useful.

That is Google search. That is Netflix recommending your next show. That is the filter that makes your photo look like it was taken on a film camera. That is the neural network that recognizes cats in pictures.

## PageRank: how Google started

In the late 1990s, the web was a mess of pages linking to other pages. The question was: which pages are important?

Larry Page and Sergey Brin realized that a link from one page to another is a vote. But not all votes are equal. A vote from an important page should count more than a vote from an unimportant one.

So they built a vector. Each web page got a score - its importance. Then they built a matrix that said "if page A links to page B, pass some of A's importance to B." They applied that matrix over and over, like water flowing through pipes, until the scores settled down.

The result was PageRank. The math is linear algebra: a vector of importance scores, and a matrix of links. The transformation says "redistribute importance along the links." Run it enough times and you have a ranked list of the web.

You do not need to implement PageRank to use the insight. Every time you search for something and the "right" answer appears near the top, you are seeing linear algebra at work.

## Recommendation systems: what you might like

Netflix, Spotify, and Amazon all face the same problem: they have millions of users and millions of items, and they need to guess what you want before you know you want it.

One approach: represent each user as a vector of preferences, and each movie or song as a vector of features. Then the "match score" between a user and an item is a simple operation on two vectors.

If the user vector is `(5, 2, 0, 4)` meaning "I love action, I like comedy, I hate horror, I love sci-fi" and the movie vector is `(4, 1, 0, 5)` meaning "this is an action-comedy with no horror and lots of sci-fi," then the system can compute how well they align.

The matrix enters when you have many users and many items. The whole collection can be organized into a giant matrix, and the task of finding the best matches becomes a transformation problem.

The result: "Because you liked Inception, you might enjoy Interstellar." That sentence is linear algebra wearing a product manager's vocabulary.

## Photo filters: matrices in your pocket

Open your phone's camera app. Tap a filter. The photo changes.

What happened under the hood? The app took every pixel in the image, treated its color as a vector in red-green-blue space, and multiplied it by a matrix.

- The "sepia" filter uses a matrix that reduces blue, boosts red, and adds a little green.
- The "black and white" filter uses a matrix that averages the three color channels into one.
- The "vignette" darkens the edges by scaling down vectors that are far from the center.

Each filter is a 3x3 matrix. The operation is the same matrix multiplication you practiced in Phase 2, applied to millions of pixels in parallel. Your phone does this in milliseconds because the hardware is built for it.

## Neural networks: layers of linear algebra

A neural network sounds exotic. At its core, it is stacks of linear transformations with a tiny bit of non-linear magic sprinkled between them.

Each "layer" in a neural network takes a vector of inputs, multiplies it by a matrix (the layer's weights), adds a bias vector, and passes the result through a simple non-linear function. Then the next layer does the same thing. Then the next.

When a neural network recognizes a cat in a photo, it is doing this:
1. The raw pixels become a vector.
2. The first layer transforms that vector into a space where edges and textures are highlighted.
3. The second layer transforms that into a space where shapes are highlighted.
4. The final layer transforms that into a space where "cat" and "not cat" are far apart.

Every transformation is a matrix multiplication. The "learning" is the process of finding the right matrices. The inference - actually recognizing the cat - is applying the matrices to the input vector.

You do not need to build a neural network to appreciate this. You need to know that the intimidating phrase "deep learning" is mostly linear algebra with a little bit of nonlinearity on top.

## For builders

This is the part where you stop seeing linear algebra as a school subject and start seeing it as a tool in your workshop.

- **Game development** - Every 2D or 3D game is vectors (positions, velocities) and matrices (camera transforms, model rotations). If you have ever used a game engine, you have used linear algebra.
- **Data science** - PCA, the technique that reduces a thousand columns of data to the few that matter most, is linear algebra. So is the regression that finds the line of best fit.
- **Computer graphics** - Shaders run matrix math on every pixel, every frame. The GPU is essentially a linear algebra engine.
- **Robotics and simulation** - Forward kinematics, inverse kinematics, rigid body transforms: all matrices multiplying vectors.
- **Audio processing** - An audio signal is a vector of samples over time. Filters, equalization, and compression are all linear transformations.

> The next time you see a 3x3 grid of numbers in a library or a spec sheet, do not skip past it. That is a recipe. Ask yourself: what transformation does it apply? The answer is usually simpler than it looks.

## What we have built

- A **vector** is an arrow with direction and magnitude. It represents a position, a movement, a color, or a force.
- A **matrix** is a recipe for transforming vectors: scaling, rotating, shearing.
- **Matrix multiplication** combines recipes: do A, then do B.
- **PageRank** is a vector of importance scores transformed by a matrix of links.
- **Recommendation systems** match user vectors to item vectors using matrix operations.
- **Photo filters** are 3x3 matrices applied to color vectors.
- **Neural networks** are stacks of matrix multiplications with a little nonlinearity.

You started this guide with the question "what happens if I change this?" Linear algebra is the most precise answer ever invented to that question. Change the input vector, apply the matrix, read the output vector. That is it. That is the whole thing.

A quick check before you go:

```quiz
[
  {
    "q": "In PageRank, what do the vector and the matrix represent?",
    "choices": ["The vector is the list of web pages, and the matrix is the list of search queries", "The vector holds importance scores for each page, and the matrix encodes which pages link to which", "The vector is the browser history, and the matrix is the ad click data", "The vector is the page content, and the matrix is the ranking algorithm"],
    "answer": 1,
    "explain": "PageRank uses a vector of importance scores (one per page) and a matrix of links. The matrix transformation redistributes importance along the links, and repeating it converges to a stable ranking."
  },
  {
    "q": "A photo filter that makes an image black and white is best described as what?",
    "choices": ["A scalar that reduces the image size", "A matrix that transforms each pixel's color vector", "A vector that adds gray to every pixel", "A sorting algorithm that reorders the pixels"],
    "answer": 1,
    "explain": "A black and white filter is a matrix that takes each pixel's RGB vector and transforms it into a single intensity value. It is the same matrix multiplication you practiced, applied to millions of pixels."
  },
  {
    "q": "Why is a neural network mostly linear algebra?",
    "choices": ["Because it stores data in matrices", "Because each layer multiplies the input vector by a weight matrix, and the whole network is a stack of such multiplications", "Because it was invented by mathematicians", "Because it only works on linear data"],
    "answer": 1,
    "explain": "Each layer in a neural network multiplies the input vector by a weight matrix, adds a bias, and applies a small non-linear function. The heavy lifting is matrix multiplication. The 'learning' is finding the right matrices."
  }
]
```

[← Phase 2: Matrices as Recipes for Transformation](02-matrices-as-recipes-for-transformation.md) · [Guide overview](_guide.md)
