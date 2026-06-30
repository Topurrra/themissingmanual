---
title: "The qubit, and the lie about parallel answers"
guide: "quantum-computing-for-humans"
phase: 1
summary: "A qubit holds a superposition with amplitudes and a phase, and qubits can entangle — but you still get one ordinary answer when you measure, with odds set by those amplitudes."
tags: [physics, quantum, quantum-computing, qubit, superposition, amplitude, mental-model]
difficulty: intermediate
synonyms: ["what is a qubit", "qubit vs bit", "does a quantum computer try all answers at once", "what is an amplitude in quantum computing", "quantum superposition computing", "why measurement gives one answer"]
updated: 2026-06-30
---

# The qubit, and the lie about parallel answers

Before anything else, here is the honest center of this whole topic, the sentence to keep when you forget everything else: **a quantum computer does not try all answers at once and read them all back.** When you measure it, you get exactly one ordinary answer, the same as any normal computer would hand you. What's special is everything that happens *before* you measure — and that's where the real machine lives.

Let's build the mental model from the ground up.

## A classical bit, and then a qubit

A classical bit is the simplest thing in computing: it is 0 or 1. A switch that's off or on. At any instant it is one of those two values, never both, never anything in between. Everything your laptop does is built out of billions of these.

A **qubit** — a quantum bit — is the quantum version. Like the bit, when you finally look at it you read out either 0 or 1. But while it's left alone and unmeasured, a qubit can be in a **superposition**: a blend of 0 and 1 at the same time. You met superposition in [/guides/the-quantum-world-for-humans](/guides/the-quantum-world-for-humans); here it becomes the working material of computation.

The catch — and it's the whole point — is what "blend" means and what it does *not* mean.

## Amplitudes: the blend is weighted, and signed

A superposition is not "half 0 and half 1" in a vague way. The blend has numbers attached. Each possibility — 0 and 1 — carries an **amplitude**, a number that says how strongly that outcome is present in the mix.

Two things make amplitudes different from ordinary probabilities, and both matter enormously:

- **An amplitude can be negative (and more generally, it has a direction we call phase).** A probability is always a plain positive fraction — you can't have a -30% chance of rain. But amplitudes can be positive or negative. Think of each amplitude as a little arrow that can point one way or the other. That sign, or **phase**, is the secret ingredient; without it, a quantum computer would be nothing special. We'll lean on it hard in Phase 2.
- **You never see the amplitudes directly.** When you measure the qubit, the amplitude is converted into a probability — roughly, a bigger amplitude (in size, ignoring its sign) means a bigger chance of that outcome. Then the dice roll, the qubit gives you a single 0 or 1, and the superposition is gone.

Here's the picture, with a qubit leaning toward 0:

```text
  before measuring          measuring
  (a superposition)         (one roll of the dice)

   0  ▓▓▓▓▓▓▓   (big amplitude)        →  most of the time you read:  0
   1  ▓▓        (small amplitude)      →  sometimes you read:         1

  the amplitudes set the odds; the result is still ONE plain answer
```

*What just happened:* the qubit held both possibilities with weights, but the act of measuring collapsed that to a single classical value — and the weights only showed up as the *probability* of which value you got.

## So where does "tries all answers at once" come from?

It comes from a real fact, twisted into a false promise.

The real fact: with **n** qubits, a superposition can carry an amplitude for *every* one of the 2-to-the-n possible combinations at the same time. Three qubits hold all eight patterns (000, 001, 010, … 111) at once. Thirty qubits hold over a billion patterns at once. That is genuinely a vast amount of structure living inside the machine before you measure.

The false promise: that you can therefore read all those answers out. You can't. **One measurement gives you one combination.** All that richness collapses to a single n-bit string, chosen at random according to the amplitudes. If you prepared a big even superposition and measured it, you'd get a random answer — no more useful than rolling dice.

```text
  3 qubits, all 8 patterns present at once (before measuring):

   000  001  010  011  100  101  110  111
    |    |    |    |    |    |    |    |
    └────┴────┴────┴──[ MEASURE ]──┴────┘
                        |
                        ▼
                only ONE of them, e.g.  101
              (the rest are gone forever)
```

*What just happened:* the parallelism is real *inside* the machine, but the exit door is narrow — you leave with one string. The whole art of quantum computing is making sure the string you walk out with is the one you wanted.

## Entanglement links qubits together

One more piece you already met: qubits can be **entangled**. When two qubits are entangled, you can't describe them as two separate little blends; they share one joint state, and their outcomes are correlated. Measure one and the odds for the other shift instantly, in lockstep.

For computing, entanglement is not a party trick — it's the wiring that lets qubits influence each other so the whole register behaves as one connected system. A quantum algorithm needs that connection; isolated qubits can't conspire to produce a useful answer. (And to head off the usual myth: entanglement still can't send a faster-than-light message — that wall is covered in [/guides/the-quantum-world-for-humans](/guides/the-quantum-world-for-humans).)

## The honest summary so far

- A qubit, unmeasured, is a weighted blend of 0 and 1 — and the weights (amplitudes) carry a sign, called phase.
- Many qubits hold an amplitude for every combination at once — real, massive structure.
- Measuring destroys all of it and hands you one ordinary answer, with odds set by the amplitudes.
- Entanglement links qubits into one connected system.

So if measuring only gives one random answer, how is any of this useful? That's the cliffhanger. The answer is **interference**, and it's the entire trick. On to Phase 2.

```quiz
[
  {
    "q": "You prepare 30 qubits in an equal superposition of all billion-plus combinations, then measure. What do you get?",
    "choices": ["All billion answers at once, ready to read", "One random combination, no more useful than dice", "The single correct answer to your problem", "Nothing — measurement fails on that many qubits"],
    "answer": 1,
    "explain": "All the combinations live inside the machine, but one measurement yields one combination at random. The richness inside doesn't help unless an algorithm has steered the odds first."
  },
  {
    "q": "What makes a quantum amplitude different from an ordinary probability?",
    "choices": ["It is always larger than 1", "It can be negative (it carries a sign, or phase), while a probability cannot", "It is measured directly with no dice roll", "It only applies to classical bits"],
    "answer": 1,
    "explain": "Amplitudes can point positive or negative — that sign, or phase, is the ingredient that makes interference possible. Probabilities are always plain positive fractions."
  },
  {
    "q": "Why is 'a quantum computer tries all answers at the same time and reads them all' misleading?",
    "choices": ["Because qubits can't be in superposition at all", "Because the superposition holds many possibilities, but a single measurement collapses it to one ordinary answer", "Because quantum computers are slower than laptops", "Because amplitudes don't exist"],
    "answer": 1,
    "explain": "The parallel structure is real before measurement, but you can only read out one combination. The exciting half of the slogan is true; the 'reads them all' half is the lie."
  }
]
```

[← Overview](_guide.md) | [Phase 2: Interference is the engine →](02-interference-is-the-engine.md)
