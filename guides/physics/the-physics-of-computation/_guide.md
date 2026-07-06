---
title: "The Physics of Computation"
guide: "the-physics-of-computation"
phase: 0
summary: "A bit is a physical thing, not an abstraction - and that fact sets hard, measured limits on every computer that will ever exist, from your laptop to whatever comes after silicon."
tags: [physics, computation, landauer, thermodynamics, entropy, reversible-computing, information-theory, advanced]
category: physics
order: 8
difficulty: advanced
synonyms: ["physics of computing", "physical limits of computation", "Landauer's principle explained", "why chips generate heat", "reversible computing explained", "Shannon entropy vs thermodynamic entropy", "energy cost of computing", "thermodynamics of information"]
updated: 2026-07-06
---

# The Physics of Computation

Your computer feels like pure logic - symbols pushed around according to rules, no physics required. That feeling is wrong in a load-bearing way. Every bit your machine holds is a real physical state: a voltage on a wire, a trapped charge, a magnetic domain pointed one way instead of another. Every operation on that bit costs real energy, some of it unavoidably. Computation isn't running on top of physics. It's made of physics, all the way down.

This guide takes that seriously and follows it to conclusions most programmers never see stated plainly: there is a minimum energy cost to erasing information, and it's not an engineering shortfall, it's a law. Chips can't shrink and speed up forever because heat has nowhere to go. And the reason all of this works - the reason information behaves like a thermodynamic quantity at all - is that Shannon's entropy and Boltzmann's entropy are, underneath the different words, the same formula.

## How to read this

This is an advanced guide - it assumes you're comfortable with how computers represent and process information, and it leans on the entropy foundation built in [/guides/heat-energy-and-entropy](/guides/heat-energy-and-entropy) (read at least its second and third phases first if entropy-as-counting-microstates is new to you). No new math is required beyond what that guide already used; where a formula shows up, it's there to make a claim checkable, not to gatekeep it.

## The phases

1. [A bit is a physical thing](01-a-bit-is-a-physical-thing.md) - what a bit actually is inside real hardware, and why erasing one has a minimum, measured energy cost (Landauer's principle, properly this time).
2. [The thermodynamic limits of computing](02-the-thermodynamic-limits-of-computing.md) - why chips hit a real heat wall, and reversible computing: the theoretical escape hatch nobody has fully built.
3. [Information theory meets physics](03-information-theory-meets-physics.md) - Shannon entropy and thermodynamic entropy turn out to be the same equation, and that's the reason the rest of this guide is true.

[Phase 1: A bit is a physical thing](01-a-bit-is-a-physical-thing.md) →
