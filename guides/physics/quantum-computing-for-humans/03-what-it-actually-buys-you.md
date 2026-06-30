---
title: "What it actually buys you, and the sober reality"
guide: "quantum-computing-for-humans"
phase: 3
summary: "Where quantum computing has real advantage - Shor's factoring threatens RSA, Grover's gives a square-root speedup - the many problems it doesn't help, and why decoherence and error correction keep today's machines noisy."
tags: [physics, quantum, quantum-computing, shor, grover, error-correction, nisq, reality]
difficulty: intermediate
synonyms: ["what can quantum computers actually do", "shor's algorithm explained", "grover's algorithm explained", "will quantum computers break encryption", "post-quantum cryptography", "quantum error correction explained", "what is decoherence", "nisq machines", "quantum computing hype debunked"]
updated: 2026-06-30
---

# What it actually buys you, and the sober reality

You now have the real mental model: interference, not parallel-universe brute force. That model is the only honest way to answer the question everyone actually asks - *so what can this thing do?* The answer has two halves, and you need both. There are a few places where quantum computing offers a genuine, dramatic advantage. There are vastly more places where it offers nothing. And even where the advantage is real, the hardware to claim it is not here yet. We'll take the wins, then the limits, then the hardware reality - no hype at any step.

## The real wins

Two algorithms come up again and again, because they're the clearest cases where interference can be arranged to do something classical computers can't match.

### Shor's algorithm: factoring, and the threat to encryption

Some math problems are easy to do forward and brutally hard to undo. Multiplying two large prime numbers is quick; taking the giant result and recovering the two primes - **factoring** - is so slow on classical computers that for big enough numbers it would take longer than anyone can wait. Much of today's public-key cryptography, including **RSA**, rests its security on exactly that slowness. (If "primes" and "why factoring is hard" are fuzzy, [/guides/number-theory-the-secret-life-of-integers](/guides/number-theory-the-secret-life-of-integers) lays the groundwork.)

**Shor's algorithm** uses quantum interference to factor large numbers dramatically faster than any known classical method. It's the poster child for quantum advantage, and it's a real one: a large enough quantum computer running Shor's algorithm would break RSA and several of its cousins.

That's why you hear about **post-quantum cryptography**: new encryption schemes built on math problems that Shor's algorithm (and quantum computers generally) don't appear to speed up. The response to the threat is already underway - the world is migrating to these quantum-resistant schemes ahead of the hardware that would break the old ones.

*What just happened:* the famous "quantum breaks encryption" headline is true, but specific. It's not that quantum computers break *all* security - it's that one algorithm undermines the *particular* kind of cryptography that depends on factoring being slow, and we already have replacements.

### Grover's algorithm: a square-root speedup for searching

Suppose you're hunting for one entry in a giant unsorted pile and you have no shortcut - classically you might have to check, on average, about half of everything. **Grover's algorithm** uses interference to find it faster, needing roughly the **square root** of the number of checks instead.

Square root is a real, useful speedup - for a list of a trillion, the square root is a million, which is enormous. But notice what it is *not*: it's not the explosive, exponential-class leap that Shor's gives for factoring. It's a meaningful gear change, not a different universe. Honest framing matters here, because Grover's is often oversold as "instant search." It isn't instant; it's quadratically faster.

```text
  classical unsorted search:  about  N   checks
  Grover's (quantum):         about  √N  checks

  N = 1,000,000,000,000  →  classical ~ a trillion
                            Grover's  ~ a million
  real and large - but a square-root gain, not magic
```

## The much larger set of problems it does NOT speed up

This is the half the hype always skips, and it's the half that keeps you honest.

A quantum computer only helps when someone can design an interference pattern that concentrates amplitude on the right answer for that problem. For most everyday computing, no such pattern is known - and for many problems there's good reason to believe none exists. Concretely:

- **Most ordinary software gets zero benefit.** Running a spreadsheet, serving a web page, rendering video, training most of the software you use daily - quantum computing does nothing for these. They aren't the kind of problem interference can grab.
- **A square-root speedup, where it applies at all, is often not worth it.** Quantum hardware is slow and finicky per operation; a mere quadratic gain can be eaten alive by that overhead.
- **Many famously hard problems are not known to fall.** The hardest optimization problems - the ones people most *wish* quantum would crush - mostly don't have a known dramatic quantum speedup. Quantum computing is a sharp specialized tool, not a universal accelerator.

The accurate one-liner: **a quantum computer is not a faster computer. It's a different kind of computer that wins big on a narrow set of problems and ties or loses on everything else.**

## The sober hardware reality

Even for the problems where the advantage is real, there's a gap between the algorithm on paper and the machine on the bench. Three facts define that gap.

**Decoherence.** A qubit's superposition is fragile. The faintest leak of information to the outside world - a stray vibration, a hint of heat, a passing magnetic nudge - and the delicate amplitudes scramble. That loss is called **decoherence**, and it's the central enemy. Qubits must be isolated obsessively (often chilled to near absolute zero) and even then they hold their state for only a brief window before the quantum-ness drains away.

**Error rates.** Because of decoherence and imperfect control, today's quantum operations are *noisy* - each gate has a real chance of going slightly wrong. Errors accumulate as a computation gets longer, which puts a hard ceiling on how much useful work a raw machine can do before the answer turns to mush.

**Quantum error correction, and its steep price.** The fix is **quantum error correction**: spread the information of one reliable, idealized qubit - a **logical qubit** - across many noisy real ones - **physical qubits** - so errors can be detected and undone. It works in principle. But the overhead is brutal: it can take a great many physical qubits to build a single trustworthy logical qubit.

```text
  what an algorithm wants:        what hardware gives:

   [logical qubit]      built from     [phys][phys][phys]
   stable, reliable    ◄───────────    [phys][phys][phys]   noisy
                                        [phys][phys] ...     many of them
```

*What just happened:* the qubit counts in headlines are almost always *physical* qubits - the noisy kind. The qubits an algorithm like Shor's actually needs are *logical* qubits, and each one costs many physical qubits to build. That gap is why "we have N qubits" doesn't translate into "we can run the famous algorithms."

**NISQ: where we actually are.** Today's machines are described as **NISQ** - Noisy Intermediate-Scale Quantum. *Noisy*, because they don't yet have full error correction. *Intermediate-scale*, because they have enough qubits to be interesting but not enough error-corrected ones to break RSA or solve a problem of real commercial value that a classical computer can't. They're genuine, valuable research instruments. They are not the world-changing machines of the headlines - not yet.

## The honest takeaway

- Real, dramatic advantage exists for a **narrow** set of problems - Shor's factoring (exponential-class, threatening RSA-style crypto) and Grover's search (a square-root speedup).
- The world is already moving to **post-quantum cryptography** to stay ahead of the factoring threat.
- For **most** computing, quantum offers no speedup at all. It's a specialized tool, not a faster everything-machine.
- The hardware is held back by **decoherence** and **error rates**, demanding **error correction** that costs many physical qubits per logical qubit, which is why today's **NISQ** machines can't yet run the famous algorithms at threatening scale.

Keep both halves of the story and you'll never be fooled by a headline again. A quantum computer is a real, deep, genuinely strange machine - an interference engine that wins big in a few places and stays quiet everywhere else. The wonder is real. The magic box was never real. That's the whole guide.

```quiz
[
  {
    "q": "What is the accurate scope of the 'quantum breaks encryption' threat?",
    "choices": ["Quantum computers instantly break all forms of encryption", "Shor's algorithm undermines cryptography (like RSA) that relies on factoring being slow, and post-quantum schemes already address it", "Quantum computers can only break passwords, not encryption", "Encryption is unaffected by quantum computing in any way"],
    "answer": 1,
    "explain": "The threat is specific: Shor's factoring breaks factoring-based public-key crypto. Quantum-resistant (post-quantum) schemes exist precisely to replace it."
  },
  {
    "q": "How does Grover's speedup compare to Shor's?",
    "choices": ["Grover's is exponential, Shor's is square-root", "Grover's gives a square-root speedup for search - real and large, but not the exponential-class leap Shor's gives for factoring", "They give identical speedups", "Neither offers any real speedup"],
    "answer": 1,
    "explain": "Grover's turns about N checks into about √N - a genuine quadratic gain, not the dramatic exponential-class advantage of Shor's. Calling Grover's 'instant search' oversells it."
  },
  {
    "q": "Why doesn't a headline qubit count tell you the machine can run Shor's algorithm?",
    "choices": ["Headlines exaggerate the numbers tenfold", "Those are noisy physical qubits, but algorithms need error-corrected logical qubits, each costing many physical qubits to build", "Shor's algorithm needs only one qubit", "Qubit counts have nothing to do with algorithms"],
    "answer": 1,
    "explain": "Decoherence and noise force quantum error correction: many physical qubits per logical qubit. Today's NISQ machines have physical qubits but not nearly enough logical ones."
  }
]
```

[← Phase 2: Interference is the engine](02-interference-is-the-engine.md) | [Overview](_guide.md)
