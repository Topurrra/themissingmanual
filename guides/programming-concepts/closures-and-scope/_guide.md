---
title: "Closures and Scope"
guide: "closures-and-scope"
phase: 0
summary: "Why a function remembers variables from where it was born: scope, closures, and the captured-variable bugs that bite in every language with first-class functions."
tags: [closures, scope, lexical-scope, capture, callbacks, first-class-functions, javascript, python]
category: programming-concepts
difficulty: intermediate
synonyms: ["what is a closure", "how do closures work", "what is lexical scope", "why do all my callbacks see the last value", "loop variable closure bug", "closure captures variable not value", "private state with closures", "function remembers variable", "scope vs closure"]
order: 12
updated: 2026-07-10
---

# Closures and Scope

You've written a function that returns another function, or passed a callback into a loop, and watched it behave in a way that felt almost spiteful: every button logs the same number, every handler sees the last item instead of its own. The code reads correctly top to bottom, and yet it lies. That moment - when a function clearly *remembers the wrong thing* - is the door into one of the deepest, most useful ideas in programming.

The idea is small once you see it: a function carries a backpack of the variables it was born next to, and it keeps reaching into that backpack long after the surrounding code has finished. That backpack is a **closure**, and the rules for what goes into it are called **scope**. Get these two right and the spiteful bugs stop being mysteries. They become predictable, even obvious - and the same trick that caused the bug becomes the tool you reach for to build private state and clean callbacks.

This guide uses JavaScript and Python for examples because that's where most people first hit this, but the idea is universal: every language with first-class functions - Swift, Go, Rust, C#, Kotlin, Ruby - works the same way underneath.

## How to read this
- **Want the one-sentence version?** A closure is a function plus the variables it captured from the scope where it was *defined* (not where it's *called*). Read [Phase 1](01-scope-and-the-backpack.md) and you'll have the spine of it.
- **Want it to finally click?** Read in order. We build the model (scope), then use it the way you actually will (private state, callbacks), then walk straight into the famous loop bug and its fix.

## The phases
1. **[Scope and the Backpack](01-scope-and-the-backpack.md)** - what lexical scope means, why a function can see the variables around where it was written, and the exact definition of a closure: the function plus its captured environment. The mental model everything else rests on.
2. **[Closures You'll Actually Write](02-closures-you-will-write.md)** - the everyday uses: a counter that keeps private state nothing else can touch, a function that pre-loads an argument, and callbacks that remember their context. Closures stop being a curiosity and become a tool.
3. **[The Loop Bug and Other Gotchas](03-the-loop-bug-and-gotchas.md)** - the classic trap where every callback sees the last value of a loop variable, *why* it happens (capture is by reference, not by snapshot), and the small fixes that solve it in JavaScript and Python - plus the memory gotcha closures can hide.

> This guide is about the *model* - why functions remember and how to reason about it. We stay on the concepts that transfer to every language rather than cataloguing one runtime's edge cases. For the layer underneath - how variables and stack frames actually live in memory - see [What Happens When Code Runs](/guides/what-happens-when-code-runs).

[Phase 1: Scope and the Backpack](01-scope-and-the-backpack.md) →
