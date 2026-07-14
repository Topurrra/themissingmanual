---
title: "Pointers and References"
guide: pointers-and-references
phase: 0
summary: "A pointer or reference is a variable holding a memory address instead of a value - the idea underneath sharing, mutation, and half the bugs that make you say 'but I didn't touch that variable.'"
tags: [programming-concepts, pointers, references, memory, variables]
category: programming-concepts
order: 14
difficulty: intermediate
synonyms:
  - what is a pointer
  - what is a reference in programming
  - difference between pointer and reference
  - pass by reference vs pass by value
  - why did changing one variable change another
  - null pointer dereference
updated: 2026-07-04
---

# Pointers and References

You change one variable, and a completely different one changes with it. You call a function, hand it your data, and somehow the function edits the original instead of a copy. You dereference something that turns out to be empty and the program dies on a line that looks perfectly innocent. All three of these trace back to the same idea: some variables don't hold a value - they hold *directions to where the value lives*. This guide builds that mental model once, shows you how it shows up differently across languages, and then walks through the gotchas that come from it.

## How to read this

Read it in order. Phase 1 builds the core picture - a box holding an address instead of a value - using nothing language-specific. Phase 2 shows how that one idea gets dressed up differently in different languages: explicit pointers, implicit references, and plain values that don't play this game at all. Phase 3 is the payoff: the three bugs this idea is responsible for, and why each one happens.

## The phases

1. [A box with an address instead of a value](01-a-box-with-an-address.md) - the mental model: values, variables, and what it means for a variable to point somewhere else.
2. [Pointers vs. references across languages](02-pointers-vs-references-across-languages.md) - explicit pointers, implicit references, and true value types, kept language-agnostic.
3. [The classic gotchas](03-the-classic-gotchas.md) - null dereference, dangling pointers, and the shared-reference surprise.

[Phase 1: A box with an address instead of a value](01-a-box-with-an-address.md) →
