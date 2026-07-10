---
title: "How a Neural Network Is Structured"
guide: how-a-neural-network-is-structured
phase: 0
summary: "The structural anatomy of a neural network — layers, weights, biases, activation functions, and how one prediction flows through it — without touching how training works."
tags: [ai-ml, neural-networks, deep-learning, activation-functions]
category: ai-ml
order: 12
difficulty: intermediate
synonyms:
  - what is a neural network made of
  - how are neural network layers structured
  - what does a neuron actually compute
  - what is an activation function
  - what is a forward pass
updated: 2026-07-10
---

# How a Neural Network Is Structured

You've seen the diagram a hundred times: circles connected by lines, arranged in columns, labeled "input," "hidden," "output." But a diagram of dots and arrows doesn't tell you what's actually sitting inside each dot, or what happens to a number as it travels along one of those lines. This guide is entirely about that structure — what a neural network is built from, piece by piece, and how a single prediction moves through it start to finish. It deliberately stops short of *training* — how those connections get tuned is its own guide, and learning both at once is how this topic turns into mush. Here, we're just opening the case and looking at the parts.

## The phases

1. [Neurons, layers, and what "network" means](01-neurons-and-layers.md) — the layered picture: input, hidden, and output layers, and what one neuron structurally is.
2. [Weights, biases, and activation functions](02-weights-and-activations.md) — what a neuron actually computes, and why non-linearity is non-negotiable.
3. [The forward pass](03-the-forward-pass.md) — how one prediction flows through the whole structure, end to end.

[Phase 1: Neurons, layers, and what "network" means →](01-neurons-and-layers.md)
