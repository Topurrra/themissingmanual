---
title: "Recursion, Finally"
guide: recursion-finally-clicks
phase: 0
summary: "The mental model that makes recursion stop being scary: a base case, a step toward it, and trust — plus when it blows the stack and how to avoid it."
tags: [recursion, base-case, call-stack, stack-overflow, iteration, algorithms]
category: programming-concepts
group: ""
order: 13
difficulty: beginner
synonyms: ["how does recursion work", "what is a base case", "recursive function explained", "stack overflow recursion", "recursion vs iteration", "function that calls itself"]
updated: 2026-06-30
---

# Recursion, Finally

You have read the definition five times. "A function that calls itself." You nod, you write one, and your brain quietly screams: *if it calls itself, when does it ever stop?* It feels like staring into two mirrors facing each other. That dizziness is normal, and it goes away the moment you have the right mental model instead of a clever phrase.

This guide gives you that model. Recursion is two small parts and one act of trust. Once those click, the trick that looked like magic turns into something you can read, write, and reason about on purpose.

## How to read this

Read the phases in order; each one builds the next. Phase 1 is the model — do not skip it, because everything else rests on it. Type the examples out yourself. Recursion is one of those topics where reading along feels fine and then your fingers freeze on a blank file; the cure is to write the small ones by hand until the shape feels obvious.

## The phases

1. [The mental model: stop, shrink, trust](01-the-mental-model.md) — what recursion actually is and why your brain fights it.
2. [Writing recursion that works](02-writing-recursion-that-works.md) — the everyday patterns and how to build one without losing the thread.
3. [When it breaks: the stack, and when to use a loop instead](03-when-it-breaks.md) — stack overflow, depth limits, and recursion versus iteration in real code.

[Phase 1: The mental model: stop, shrink, trust](01-the-mental-model.md) →
