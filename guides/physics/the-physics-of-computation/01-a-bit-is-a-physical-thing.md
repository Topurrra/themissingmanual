---
title: "A Bit Is a Physical Thing"
guide: "the-physics-of-computation"
phase: 1
summary: "A bit is never just an abstraction - it's a voltage, a charge, or a magnetic domain, and changing or erasing it costs real, measurable energy. Landauer's principle sets the floor."
tags: [physics, computation, bits, landauer, entropy, thermodynamics, hardware]
difficulty: advanced
synonyms: ["what is a bit physically", "Landauer's principle explained", "energy cost of erasing a bit", "why does deleting data cost energy", "physical representation of information", "minimum energy to erase information"]
updated: 2026-07-10
---

# A Bit Is a Physical Thing

Ask a programmer what a bit is and you'll hear "a 0 or a 1." True, but incomplete in a way that hides something important. A 0 or 1 written on a whiteboard is a symbol. A 0 or 1 inside your laptop is a physical arrangement of matter and energy - and that arrangement is where the real story starts.

In a modern chip, a bit is a packet of electric charge sitting on a tiny capacitor, or the presence/absence of voltage on a transistor gate. On a hard drive, it's the magnetic orientation of a nanoscale grain - pointing "up" for 1, "down" for 0. On a DVD, it's the presence or absence of a physical pit etched into a reflective layer. Different hardware, same underlying move: pick some physical property that can sit in one of two (or more) distinguishable states, and let that state stand for information.

This isn't an implementation detail you can abstract away and forget. It's the whole reason computation has a physical cost at all. Software treats bits as free to copy, move, and discard. Physics disagrees.

## Why physical states cost energy to change

Distinguishing "definitely a 1" from "definitely a 0" requires those two states to be separated by an energy barrier large enough that random thermal jostling doesn't flip one into the other by accident. Room-temperature matter is never still - atoms vibrate, electrons jitter, and a charge stored on too small or too shallow a well will randomly leak away. Engineers pick a barrier height well above the ambient thermal energy (roughly the product of Boltzmann's constant and temperature) specifically so a stored bit stays put.

Getting a bit to cross that barrier on purpose - writing a new value, flipping a magnetic domain - takes energy, for the same reason pushing a ball up a hill takes energy: you're moving the system away from where it would otherwise settle. That's ordinary engineering. The physics gets more interesting, and less optional, when you ask about the opposite of writing: erasing.

## Erasure is special

Suppose a bit currently holds an unknown value - it could be 0, it could be 1, and from your position you genuinely don't know which. Now you erase it: you force it to a known state, say 0, regardless of what it held before.

Look at what happened to the possibilities. Before, the bit had two accessible physical configurations, either one consistent with what you know. After, it has exactly one. You didn't only move a charge around - you threw away a distinction. Two physically possible microstates collapsed into one.

That is a drop in entropy, in the exact sense used in [/guides/heat-energy-and-entropy](/guides/heat-energy-and-entropy): entropy counts the number of microscopic arrangements consistent with what you know about a system, and erasure takes that count from two down to one, for every bit erased. The second law of thermodynamics does not allow entropy to drop for free, anywhere, ever. If the bit's entropy fell, something else's entropy has to rise by at least as much - and in practice that means heat gets dumped into the surrounding environment.

## Landauer's principle, stated properly

This is **Landauer's principle**, and it deserves to be stated as the hard limit it is, not a curiosity: **erasing one bit of information requires dissipating a minimum amount of energy as heat**, equal to Boltzmann's constant times the absolute temperature times the natural log of 2 (k·T·ln 2). Rolf Landauer derived this at IBM in 1961, and it survived every attempt to find a loophole - including the one built specifically to break it, Maxwell's demon, whose failure is the subject of Phase 3 of the entropy guide.

A few things about this limit that matter to a builder, not just a physicist:

- **It's about erasure, not computation in general.** Copying a bit, or applying a *reversible* operation (one where you could run the process backward and recover the input) carries no Landauer cost. The cost attaches specifically to the logical operations that destroy information - overwriting a register, resetting a flip-flop, and (crucially) the AND/OR/NAND gates that make up ordinary logic, which take two input bits and produce one output bit, throwing away the information needed to tell which input pair you started from.
- **It's not theoretical.** Table-top experiments - trapped colloidal particles in laser tweezers, nanomagnetic memory cells - have measured energy dissipation during erasure landing right at the Landauer bound as temperature and switching speed are dialed in. This is measured physics, the same way the speed of light is measured physics.
- **It's astronomically small.** At room temperature, k·T·ln 2 works out to roughly 3 × 10⁻²¹ joules per bit. A modern CPU erasing billions of bits per second is still dissipating a Landauer-limit energy budget many orders of magnitude below a single watt. Your laptop's fan is not spinning because of Landauer's principle - real transistors are wildly less efficient than this limit for engineering reasons, not fundamental ones.

That last point is worth sitting with. Landauer's principle isn't why your computer gets hot today. It's the floor underneath all the engineering slack that current chips still have - and, as later phases show, the floor that no amount of future engineering can ever push through.

## Why this isn't just philosophy

It's tempting to file this under "interesting but irrelevant" - after all, no current chip is anywhere near the Landauer limit. But the principle does real work in a few places right now:

- It resolved a century-old paradox (Maxwell's demon) by proving that information storage and erasure are physical processes with a physical price tag, closing what looked like a free lunch.
- It's the reason "erasing information" and "generating entropy" are not two different things that happen to correlate - they're the same event looked at from two angles, one from information theory, one from thermodynamics. Phase 3 makes that identity precise.
- It sets the actual, non-negotiable floor that any future computing technology - optical, biological, quantum, whatever comes after silicon - has to respect. Better engineering can approach the floor. Nothing can go under it.

A bit, then, is never "just information." It's a physical state with a location, an energy barrier, and a thermodynamic bill that comes due the moment you erase it.

Check what actually sticks:

```quiz
[
  {
    "q": "In real hardware, what is a bit physically?",
    "choices": [
      "A purely mathematical symbol with no physical form",
      "A physical state of matter or energy - a voltage, a trapped charge, a magnetic domain - chosen to have two distinguishable configurations",
      "A property that only exists while software is actively reading it",
      "An agreed-upon convention that has no bearing on hardware design"
    ],
    "answer": 1,
    "explain": "Every bit is realized as some physical property with (at least) two stable, distinguishable states - charge on a capacitor, magnetic domain orientation, presence of a pit on a disc. The abstraction of '0 or 1' rides on top of a real physical difference."
  },
  {
    "q": "Why does erasing a bit (forcing it to a known value) have a minimum energy cost, while copying a bit does not?",
    "choices": [
      "Erasing physically destroys atoms, while copying does not",
      "Copying is always slower, so it dissipates less power",
      "Erasing collapses two possible physical microstates into one, lowering entropy inside the bit - a drop the second law requires to be paid for elsewhere as heat; reversible operations like copying don't destroy that information",
      "There is no real difference - both cost the same minimum energy"
    ],
    "answer": 2,
    "explain": "Landauer's principle applies specifically to logically irreversible operations - ones where you cannot run the process backward and recover the input, like erasure or a two-input-to-one-output logic gate. Copying preserves enough information to reverse it, so it carries no Landauer cost."
  },
  {
    "q": "Why doesn't Landauer's principle explain why your laptop's fan spins today?",
    "choices": [
      "Landauer's principle has never been experimentally confirmed",
      "The Landauer limit (k·T·ln 2 per bit) is many orders of magnitude smaller than the energy real transistors actually dissipate, so today's heat comes from engineering inefficiency, not the fundamental floor",
      "Laptops don't erase any bits during normal operation",
      "The principle only applies to magnetic storage, not transistors"
    ],
    "answer": 1,
    "explain": "The Landauer bound at room temperature is about 3 x 10^-21 joules per bit - vastly below what current transistors dissipate per operation. Real chips run hot because of resistive and switching losses far above the fundamental limit, not because they're bumping into it."
  }
]
```

[Guide overview](_guide.md) · [Phase 2: The thermodynamic limits of computing →](02-the-thermodynamic-limits-of-computing.md)
