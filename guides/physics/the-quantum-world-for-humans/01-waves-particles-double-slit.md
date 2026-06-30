---
title: "Waves, particles, and the double slit"
guide: "the-quantum-world-for-humans"
phase: 1
summary: "What is actually true about the quantum world, minus the mysticism: superposition, uncertainty, and entanglement, explained without lying to you."
tags: [physics, quantum, superposition, uncertainty, entanglement, mental-model]
difficulty: intermediate
synonyms: ["double slit experiment explained", "wave particle duality", "what is a quantum", "why do electrons make interference", "is light a wave or particle"]
updated: 2026-06-30
---

# Waves, particles, and the double slit

Here's the honest starting point: your intuition was built by a world of medium-sized things — balls, water, chairs. That intuition is excellent for that world and it quietly fails for very small things. The quantum world doesn't break logic. It breaks the *assumption* that very small things behave like tiny versions of baseballs. Once you let go of that one assumption, most of the "weirdness" stops being contradiction and starts being a new, learnable pattern.

We're going to anchor the whole guide on a single experiment, because it's the cleanest place to watch the assumption fail. It's called the double-slit experiment, and physicist Richard Feynman called it the one experiment that holds the heart of the mystery. We'll build it up one piece at a time.

## Two ways things can behave

Before the strange part, fix two ordinary pictures in your head.

A **particle** is a little lump. It goes through one hole or the other. If you fire a stream of paint pellets at a wall with two gaps, you get two stripes of paint behind the gaps — one stripe per gap. Lumps don't blend.

```text
Particles (paint pellets) through two slits:

  source  ░░  wall   →   screen
          ░░             ▓▓        ← stripe behind top slit
          ░░             ▓▓        ← stripe behind bottom slit

Two slits → two stripes. Simple addition.
```

*What just happened:* with lumps, two open slits give you two piles, exactly where you'd expect. Nothing surprising — this is the "tiny baseball" intuition working fine.

A **wave** is a spread-out ripple. It goes through *both* gaps at once, and the two ripples that come out the far side overlap. Where two crests meet, they add up (bright/loud); where a crest meets a trough, they cancel (dark/silent). That alternating pattern of reinforce-and-cancel is called **interference**, and it's the unmistakable fingerprint of a wave.

```text
Waves (water, sound, light) through two slits:

  source  ))) ░░  →  ║ ║ ║ ║ ║   ← bright/dark/bright/dark... bands
              ░░       interference: crests add, crests+troughs cancel

Two slits → many bands, not two. This can't be plain addition.
```

*What just happened:* a wave through two slits doesn't give two piles. It gives a striped pattern of many bands, because the two emerging ripples interfere. The pattern is *more* than the sum of the two slits taken alone — that's the tell.

So far, two clean categories. Lumps make piles. Waves make interference bands. Now we break it.

## The experiment that ruins the tidy story

Take electrons — about as "particle-like" as anything you can name, with a definite mass and charge. Fire them one at a time at a screen with two slits. One electron leaves the gun, hits the screen, makes a single dot. Then the next. Then the next. Each arrival is a single dot, like a single pellet. Good — particles.

But let the dots pile up over thousands of electrons, and ask what picture they draw.

```text
Electrons, fired ONE at a time, dots accumulating over time:

  10 electrons:   . .   .  .    .   .   . .     (looks random)
  500 electrons:  .:. :: . :.: . :.: .: .::.    (hmm, some grouping?)
  50,000:         ║ ║ ║ ║ ║ ║ ║ ║ ║ ║ ║ ║      (interference bands!)
```

*What just happened:* each electron arrives as one dot (particle-like), yet the *collection* of dots builds up the striped interference pattern (wave-like). A single electron, sent through alone, somehow lands as if it had passed through both slits and interfered — with itself.

This is the real result, reproduced for decades, with electrons, neutrons, atoms, and even large molecules. It is not a trick of crowding, because the electrons go through one at a time and never meet each other. The tidy "lump or ripple" split has failed.

## The move that saves you: drop "it must be one or the other"

The mistake is the question "is the electron *really* a wave or *really* a particle?" Nature's answer is: it's neither of those everyday things, and it was never obligated to be. An electron is a **quantum object**. It has a wave-like aspect that governs *where it's likely to land*, and a particle-like aspect in *how it's detected* (always one whole dot, never half a dot).

The working mental model — the one professionals actually use — is this:

> Each electron is described by a spread-out *wave of possibility* that passes through both slits and interferes with itself. That wave doesn't tell you where the electron is. It tells you the **probability** of finding the electron at each spot when it hits the screen. Bright bands = high probability. Dark bands = near-zero probability.

```text
The wave is a probability map, not a thing made of electron-stuff:

  high │   ╱╲      ╱╲      ╱╲     ← electrons land here a lot
  prob │  ╱  ╲    ╱  ╲    ╱  ╲
       │ ╱    ╲  ╱    ╲  ╱    ╲
   low └─────────────────────────  ← electrons (almost) never land here
```

*What just happened:* the wave isn't a physical ripple of electron material smeared across space. It's a map of odds. Any single electron lands at one spot (a dot), but *which* spot is governed by the wave's probabilities — so over many electrons the dots trace out the wave's shape. Particle on arrival, wave in the bookkeeping of where it's likely to arrive.

Notice what we did *not* say. We did not say the electron splits into two. We did not say it's "in two places at once" like a sci-fi clone. We said: there's a single electron, and its possibilities pass through both slits and combine. That distinction is the whole reason this guide exists, and the next phase makes it sharp.

> **The honest caveat.** *Why* a definite single dot appears at all — what exactly "happens" when the wave of possibility meets the detector — is the part physicists genuinely still argue about (it's called the measurement problem). What's *not* in dispute is the recipe: the wave gives the probabilities, the detector gives one dot, and the math predicts the bands to staggering precision. The mystery is real, but it's narrow and specific — not a license for anything-goes.

For builders: this isn't abstract. The probability-wave picture is exactly what makes a quantum computer's "qubit" different from a bit. A bit is a definite dot. A qubit carries the wave-of-possibility structure, and getting interference to line up the right way is how a quantum algorithm gets its edge. You're learning the actual primitive, not a metaphor.

```quiz
[
  {
    "q": "In the double-slit experiment with electrons fired one at a time, what does each individual electron do when it hits the screen?",
    "choices": ["It spreads out into a faint band", "It lands as a single dot", "It splits into two dots, one per slit", "It cancels itself out and leaves no mark"],
    "answer": 1,
    "explain": "Every electron is detected as one whole dot. The interference pattern only appears after many dots accumulate."
  },
  {
    "q": "What does the wave in the quantum mental model actually represent?",
    "choices": ["A physical ripple made of electron material", "The probability of finding the electron at each location", "The electron's temperature", "Two separate electrons traveling together"],
    "answer": 1,
    "explain": "The wave is a map of odds — where the electron is likely to be found — not a substance spread across space."
  },
  {
    "q": "Why does the tidy 'is it a wave or a particle?' question fail for an electron?",
    "choices": ["Because electrons are too small to measure at all", "Because it arrives as one dot yet the dots build an interference pattern, so neither everyday category fits", "Because electrons randomly switch between being waves and particles", "Because the experiment is impossible to perform"],
    "answer": 1,
    "explain": "It shows particle-like detection and wave-like statistics at once. It's a quantum object — it was never obligated to be one of our everyday categories."
  }
]
```

[← Overview](_guide.md) | [Phase 2: Superposition and uncertainty →](02-superposition-and-uncertainty.md)
