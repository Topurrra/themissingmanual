---
title: "Information Theory Meets Physics"
guide: "the-physics-of-computation"
phase: 3
summary: "Shannon entropy and thermodynamic entropy are the same formula, not a loose analogy - and that identity is why Landauer's principle works and why every real computer answers to physical law."
tags: [physics, computation, shannon-entropy, boltzmann-entropy, information-theory, landauer, thermodynamics]
difficulty: advanced
synonyms: ["Shannon entropy vs thermodynamic entropy", "is information entropy the same as physical entropy", "why is entropy used in information theory", "Boltzmann entropy formula", "information theory and thermodynamics connection", "physical limits of computers"]
updated: 2026-07-06
---

# Information Theory Meets Physics

In 1948, Claude Shannon needed a word for how much uncertainty a message resolves, and he asked John von Neumann what to call it. Von Neumann's answer, as the story goes: call it entropy - the formula is identical to Boltzmann's, and "nobody knows what entropy really is, so you'll win every argument."

It's a good story, and better than a joke. The two entropies are not merely similar in spirit, decorated with the same word by coincidence or convenience. They are the same mathematical object, applied to two different questions, and that identity is not a curiosity sitting off to the side of this guide - it's the reason everything in Phases 1 and 2 is true.

## Two entropies, one formula

Boltzmann's thermodynamic entropy, from [/guides/heat-energy-and-entropy](/guides/heat-energy-and-entropy), counts microstates: `S = k log W`, where `W` is the number of microscopic arrangements consistent with a system's observable state, and `k` is Boltzmann's constant, which fixes the units to joules per kelvin.

Shannon's information entropy measures the uncertainty in a message or a random variable: `H = -Σ p(x) log p(x)`, summed over every possible outcome `x`, where `p(x)` is that outcome's probability. A fair coin flip has two equally likely outcomes and `H = log 2`. A coin that always lands heads has `H = 0` - no uncertainty, no information gained by watching it.

Set aside the constant `k` (it only exists to convert an entropy count into joules-per-kelvin units, a bookkeeping choice with no content) and Boltzmann's formula is the special case of Shannon's where every one of the `W` microstates is equally likely: `p(x) = 1/W` for each, and Shannon's sum collapses exactly to `log W`. Boltzmann entropy isn't "like" Shannon entropy. It's Shannon entropy, evaluated on the uniform distribution over microstates, with a unit conversion applied.

This isn't numerology. Both formulas answer the identical underlying question: *given what you know about a system's macroscopic state, how many distinguishable configurations remain, and how surprised should you be to learn which one it actually is?* Ask that question about a gas and you get thermodynamic entropy. Ask it about a coin flip, a compressed file, or a bit in a register, and you get Shannon entropy. Same question, same math, different subject matter.

## Why this makes Landauer's principle work

This identity is the reason Phase 1's claim - that erasing a bit has a real thermodynamic energy cost - isn't a metaphor borrowed from physics to make a point about computers. It's a direct consequence.

A bit with an unknown value has two equally likely microstates (0 or 1), so its Shannon entropy is `log 2`. Because Shannon entropy and thermodynamic entropy are the same quantity, that bit's *physical* microstate count also carries `log 2` worth of entropy, in the literal Boltzmann sense - the same sense that applies to a box of gas. Erasing the bit forces it to one definite state, dropping its entropy to `log 1 = 0`. That drop is not "entropy" in some figurative computing sense standing in for a physical idea. It is thermodynamic entropy, full stop, and the second law governs it exactly as it governs a gas that's been compressed into a smaller volume. The dropped entropy has to reappear somewhere else - as heat in the environment - because the underlying law doesn't know or care whether the microstates it's counting belong to gas molecules or to a transistor's charge state.

If Shannon entropy and Boltzmann entropy were only analogous rather than identical, Landauer's principle would have no right to be literally true. It would be a suggestive metaphor, the kind of thing said in a talk and forgotten by the next slide. It's not a metaphor, because there's only one entropy underneath both names, and that's precisely why the k·T·ln 2 bound from Phase 1 is a real, measurable number of joules and not a rhetorical flourish.

## The myth worth killing here

The popular version of this story often runs backward: "information is a kind of energy" or "bits are made of entropy," phrasings that sound profound and explain nothing. Information isn't energy, and a bit isn't made of entropy. What's true and precise is narrower and more useful: *the number of physical microstates available to a system is the same mathematical quantity whether you're counting them to describe a gas's temperature or to describe what a message could have said.* Entropy is the accounting method, shared by both domains because both domains are, underneath, about counting possibilities consistent with partial knowledge. Erasing a bit lowers that count exactly the way compressing a gas does, which is why it costs energy exactly the way compressing a gas does.

## Why this matters practically, not only philosophically

Zoom out to what this guide has actually established across three phases: a bit is a physical state (Phase 1), erasing it has a real energy floor because doing so is a genuine thermodynamic entropy decrease (Phase 1, sharpened here), heat dissipation from switching real transistors is a hard wall current chip design runs straight into (Phase 2), and reversible computing is a legitimate but unfinished attempt to route around the erasure cost specifically, rather than the switching losses (Phase 2).

None of that is a story about current silicon being immature. It's a story about what computation *is*. Every computer that will ever be built - optical, biological, superconducting, quantum, or something not yet invented - manipulates physical systems, and physical systems answer to thermodynamics whether or not their designers were thinking about it. A future computer might get breathtakingly close to the Landauer floor, might dissipate heat a million times more efficiently than today's chips, might use reversible logic throughout. It cannot erase a bit for less than k·T·ln 2, because that number isn't a property of transistors. It's a property of what erasure *means*, expressed in the one formula that thermodynamics and information theory turned out to share all along.

```quiz
[
  {
    "q": "What is the actual relationship between Shannon (information) entropy and Boltzmann (thermodynamic) entropy?",
    "choices": [
      "They are unrelated ideas that happen to share a name by historical accident",
      "They are the same mathematical formula - Boltzmann's is the special case of Shannon's formula applied to equally likely microstates, with a unit-converting constant attached",
      "Shannon entropy measures energy, while Boltzmann entropy measures probability",
      "Boltzmann entropy is a metaphor inspired by Shannon's earlier, unrelated information theory"
    ],
    "answer": 1,
    "explain": "Shannon's H = -Σ p(x) log p(x) reduces exactly to Boltzmann's S = k log W when every one of the W microstates is equally likely. They are the identical formula, evaluated on the same kind of question - how many distinguishable possibilities remain - applied to different subject matter."
  },
  {
    "q": "Why does the Shannon/Boltzmann identity matter for Landauer's principle specifically?",
    "choices": [
      "It doesn't - Landauer's principle stands on its own, independent of information theory",
      "It means the entropy drop from erasing a bit is literal thermodynamic entropy, not a figurative comparison - so the second law applies to it exactly as it applies to a compressed gas, making the energy cost a real physical bound rather than a metaphor",
      "It proves that information itself is a form of energy",
      "It shows that Shannon entropy only applies to communication, not to physical hardware"
    ],
    "answer": 1,
    "explain": "Because Shannon entropy and Boltzmann entropy are the same quantity, a bit's uncertainty (log 2) is genuine thermodynamic entropy. Erasing it is a real entropy decrease that the second law must charge for elsewhere as heat - which is exactly what makes Landauer's k*T*ln 2 bound a measurable physical fact rather than a suggestive analogy."
  },
  {
    "q": "What is the precise, defensible claim connecting information and physics - as opposed to the vaguer popular version?",
    "choices": [
      "\"Bits are made of energy\" - a literal physical equivalence between data and power",
      "\"Information is entropy\" - a rebranding that adds no new content",
      "The number of physical microstates consistent with what's known about a system is the same mathematical quantity whether counted for a gas or for a message, so operations that reduce that count (like erasure) cost energy for identical reasons in both cases",
      "Information theory and thermodynamics are entirely separate fields that should not be compared"
    ],
    "answer": 2,
    "explain": "The precise claim is about shared mathematics applied to a shared underlying question (how many possibilities remain, given partial knowledge), not a claim that information literally is energy or that the two fields were always describing identical things in every respect."
  }
]
```

[← Phase 2: The thermodynamic limits of computing](02-the-thermodynamic-limits-of-computing.md) · [Guide overview](_guide.md)
