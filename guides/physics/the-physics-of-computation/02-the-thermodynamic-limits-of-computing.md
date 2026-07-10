---
title: "The Thermodynamic Limits of Computing"
guide: "the-physics-of-computation"
phase: 2
summary: "Chips can't shrink and speed up forever because heat dissipation is a real wall, not an engineering choice - and reversible computing is the theoretical way around it, though nobody has built a practical general-purpose version yet."
tags: [physics, computation, thermodynamics, heat, reversible-computing, landauer, moores-law, chip-design]
difficulty: advanced
synonyms: ["why cant chips get faster forever", "power wall computing", "reversible computing explained", "thermodynamic limits of chips", "why do CPUs generate heat", "end of Moore's Law physics", "adiabatic computing"]
updated: 2026-07-10
---

# The Thermodynamic Limits of Computing

Around 2005, chipmakers quietly stopped chasing higher clock speeds. Desktop CPUs had climbed from megahertz to multiple gigahertz over two decades, then that climb flattened. Chips kept improving - more cores, better architectures, smarter caches - but raw frequency growth hit a ceiling and stayed there. The ceiling had a name: the **power wall**, downstream of the same physics from Phase 1.

## Heat is not a bug you can engineer away

Every transistor switching state dissipates some energy as heat, for reasons that go beyond Landauer's principle - resistive losses in wires, energy needed to charge and discharge capacitance, current that leaks even when a transistor is supposedly off. Pack more transistors into a chip and switch them faster, and the heat generated per square millimeter climbs fast: power density roughly scales with clock frequency times the number of active transistors, while the chip's surface area (which is what actually carries heat away to a heatsink) stays fixed.

That's a losing trade. A modern high-end CPU already dissipates on the order of 100-250 watts from a die smaller than a postage stamp - power density in the same neighborhood as a kitchen hotplate, concentrated on silicon that has to stay under roughly 100°C or the transistors themselves start behaving unreliably and eventually get damaged. Push clock speed further without a fundamentally different transistor or cooling technology, and the result isn't a faster chip. It's a chip that overheats and throttles itself back down, or fails outright.

This is why "just make it smaller and faster" stopped working on its own. Smaller transistors do help - they need less energy to switch, and shorter wires mean less resistive loss - which is exactly why chipmakers kept shrinking transistor features long after clock speeds plateaued. But shrinking has its own wall: at a few nanometers, transistors approach the size of tens of atoms, and quantum effects (electrons tunneling through gates that are supposed to block them) start leaking current even harder. The industry's answer was to go sideways - more cores running in parallel at moderate clock speeds - rather than fight the heat wall head-on. That's an engineering workaround for a physical fact, not a repeal of it.

None of this is Landauer's principle in action yet - today's chips dissipate energy per operation that's many orders of magnitude above the Landauer floor, purely from resistive and switching losses. But it establishes the real wall: heat has to go somewhere, and the amount of silicon available to shed it into is finite. That constraint - dissipated heat must leave the chip - never goes away, whether the inefficiency is today's engineering slack or, eventually, Landauer's actual floor.

## Reversible computing: the theoretical way out

If erasing a bit is what forces a minimum energy cost, then the obvious question is: what if you never erase anything?

This is the idea behind **reversible computing**, first laid out by Charles Bennett (also at IBM, building directly on Landauer's work) in the 1970s-80s. A computation is *logically reversible* if, given the output, you can always reconstruct the input - no information gets thrown away at any step. Ordinary logic gates like AND and OR are not reversible: given the output of an AND gate, you cannot tell which of the input combinations produced it, because two different inputs can map to the same output. That collapse of possibilities is exactly the entropy-lowering, energy-costing move from Phase 1.

Reversible logic replaces those gates with reversible equivalents - the **Toffoli gate** and **Fredkin gate** are the classic examples - that take the same number of output bits as input bits, so no information is ever discarded and the operation could, in principle, be run backward to recover the inputs. Chain reversible gates together and you can build any computation an ordinary computer can, without ever performing a Landauer-costing erasure in the logic itself.

The payoff, if it could be fully realized: a reversible computer's energy dissipation isn't bounded below by k·T·ln 2 per bit the way an erasing computer's is. Run the logic slowly and gently enough (a regime called **adiabatic** switching, by analogy with the thermodynamic sense of adiabatic), and the theoretical energy cost per operation can be pushed arbitrarily close to zero, limited only by how slowly you're willing to run and how good your switches are, not by any law of physics.

## Why nobody has actually built one

Be honest about where this stands: reversible computing is a proven theoretical framework and an active research area, not a technology sitting in a store. A few real obstacles explain why:

- **You still have to erase eventually.** A useful computer takes many inputs and produces one useful output - it needs somewhere to put the intermediate information it didn't erase. Bennett's own scheme handles this by running the computation forward, copying out the answer, then running everything backward to reclaim the circuit's original state - but that "uncompute" step doubles the work.
- **Reversible logic needs more hardware.** Reversible gates typically need extra "garbage" output bits to preserve enough information to invert the operation - more transistors and wiring per logical operation than irreversible logic needs.
- **Adiabatic switching means slow switching.** Approaching zero-dissipation operation means ramping voltages gradually rather than snapping them, which works against raw speed - a real trade-off between beating the Landauer limit and running fast.
- **The non-Landauer losses still dominate.** Today's transistors waste so much energy on resistive and leakage losses, far above the Landauer floor, that reversible logic's theoretical advantage doesn't yet translate into a practical win. Switches efficient enough that Landauer's limit is the *actual* bottleneck don't broadly exist yet.

Small reversible and adiabatic circuits have been built and demonstrated in labs, and reversible logic is used today in a different context: quantum computers are built entirely from reversible gates, because quantum mechanics itself requires it (a topic [/guides/quantum-computing-for-humans](/guides/quantum-computing-for-humans) covers from the quantum side). But a general-purpose, reversible classical CPU that beats ordinary chips on real workloads remains a research goal, not a shipping product.

## The honest bottom line

The power wall is real today, measured in watts and throttled clock speeds. Landauer's limit is real but not yet the binding constraint on any real chip. Reversible computing is a legitimate, physics-respecting escape route from that eventual limit - and also a genuinely hard engineering problem that decades of research haven't fully solved. All three of those statements are true at once, and treating any of them as settled in the other direction - "chips will keep getting faster forever" or "reversible computers are just around the corner" - overstates what's known.

```quiz
[
  {
    "q": "Why did CPU clock speeds plateau around the mid-2000s instead of continuing to climb?",
    "choices": [
      "Software stopped needing faster processors",
      "Power density (heat generated per unit area) climbs with clock speed and transistor count, and a fixed chip surface area can only dissipate so much heat before the chip overheats or fails",
      "Transistors physically cannot switch faster than a few gigahertz",
      "Manufacturers agreed to slow down progress to sell more chips over time"
    ],
    "answer": 1,
    "explain": "Heat generated scales with switching activity, but the area available to carry that heat away to a heatsink is fixed. Past a point, higher clock speed only produces more heat than the chip can shed, so the industry shifted to multiple moderate-speed cores instead of one ever-faster core."
  },
  {
    "q": "What makes a computation 'logically reversible' in Bennett's sense?",
    "choices": [
      "It runs backward in time",
      "It uses less electricity than an irreversible version",
      "Given the output, the input can always be reconstructed - no information is discarded at any step, unlike ordinary AND/OR gates",
      "It only works on quantum computers"
    ],
    "answer": 2,
    "explain": "Ordinary logic gates like AND collapse multiple possible inputs onto the same output, destroying information (and, by Landauer's principle, costing energy). Reversible gates like the Toffoli gate preserve enough output bits to always recover the input, avoiding that Landauer-costing collapse."
  },
  {
    "q": "What is the honest current status of reversible computing?",
    "choices": [
      "It has been fully implemented and already replaced conventional CPUs",
      "It is a proven theoretical framework and active research area that could, in principle, beat the Landauer limit, but no practical general-purpose reversible CPU exists yet due to overhead, extra hardware, and speed trade-offs",
      "It was proven impossible and abandoned decades ago",
      "It only matters for storage devices, not processors"
    ],
    "answer": 1,
    "explain": "Reversible and adiabatic circuits have been demonstrated in labs, and quantum computers use reversible gates out of necessity. But general-purpose reversible classical computing still faces real engineering obstacles - uncompute overhead, extra garbage bits, and a speed-versus-dissipation trade-off - that keep it a research direction rather than shipping technology."
  }
]
```

[← Phase 1: A bit is a physical thing](01-a-bit-is-a-physical-thing.md) · [Guide overview](_guide.md) · [Phase 3: Information theory meets physics →](03-information-theory-meets-physics.md)
