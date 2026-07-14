---
title: "From Gates to a Computer"
guide: "boolean-algebra-and-logic-gates"
phase: 3
summary: "Wire a few gates together and they start to add: a half-adder from XOR and AND, a full adder that chains, and the jump from 'adds bits' to the arithmetic unit inside a CPU."
tags: [logic, half-adder, full-adder, cpu, hardware]
difficulty: beginner
synonyms: ["how does a computer add", "what is a half adder", "what is a full adder", "how do gates make a cpu", "binary addition with gates", "what is an ALU"]
updated: 2026-07-10
---

# From Gates to a Computer

You've built a real toolkit: [true and false](/guides/what-logic-actually-is), then AND/OR/NOT as
[an algebra you can combine them with](/guides/propositional-logic), then those operations made
physical as gates in Phase 2. This phase is the payoff - wire a handful of gates together and
watch them do something none of them can do alone: **arithmetic**.

## The question driving this phase

AND, OR, and NOT are about truth - true/false in, true/false out. Addition is about *numbers*:
`2 + 3 = 5`. Those feel like two different worlds. So how does a machine that only knows true and
false add numbers? Nobody snuck a calculator inside - there's no "+" component hiding in the
silicon, only gates. The answer is one of the most satisfying ideas in computing, and you already
have every piece you need.

## Binary addition, recapped

Computers count in binary - only `0` and `1`. Adding two single bits has exactly four cases:

```text
0 + 0 = 0
0 + 1 = 1
1 + 0 = 1
1 + 1 = 10   ← two! doesn't fit in one bit
```

The first three are calm. `1 + 1` is two, and two in binary is `10` - it doesn't fit in a single
bit, so it spills. That spill is the whole game: when a column overflows, the extra `1` moves to
the next column over, the same move you make in decimal (`7 + 5 = 12`, write the `2`, carry the
`1`). So adding two bits produces *two* answers: a **sum** bit (what you write down) and a
**carry** bit (what spills into the next column). Hold onto those two words - we're about to build
a circuit for each.

## The half-adder

One table for both outputs. Inputs `A` and `B`; outputs `sum` and `carry`:

```text
 A   B  | sum  carry
---------+-----------
 0   0  |  0     0
 0   1  |  1     0
 1   0  |  1     0
 1   1  |  0     1
```

Look at each output column on its own. The **sum** column is `0, 1, 1, 0` - `1` when exactly one
input is `1`, `0` when the inputs match. That's precisely XOR:

```text
sum = A XOR B
```

The **carry** column is `0, 0, 0, 1` - `1` only when *both* inputs are `1`. That's AND:

```text
carry = A AND B
```

That's the payoff of the whole guide: no new device, no arithmetic bolted onto the hardware. Two
gates you already knew - one XOR, one AND - wired to the same two inputs, and the pair *adds*.

This circuit is the **half-adder**:

```mermaid
flowchart LR
  A[A] --> X[XOR]
  B[B] --> X
  A --> N[AND]
  B --> N
  X --> S[sum]
  N --> C[carry]
```

Two inputs fan out to two gates; two outputs come back. That's all it is.

> Why "half"? It can produce a carry *out*, but has no way to accept a carry coming *in* from the
> column to its right. To chain columns together, we need to fix that.

## The full adder

Past a single bit, each column deals with three things: bit `A`, bit `B`, and the carry that
arrived from the column to its right. A **full adder** handles all three - it takes `A`, `B`, and
a **carry-in**, and produces a **sum** and a **carry-out**. You can build one from two half-adders
and an OR gate: fold the carry-in into the mix and ask "did *either* stage produce a carry?" -
that's the OR.

Line up one full adder per bit. The carry-out of each feeds the carry-in of its left-hand neighbor
- exactly how you carry the `1` by hand, column by column:

```text
  bit:    3     2     1     0
        [FA] ← [FA] ← [FA] ← [FA] ← carry starts at 0
         |     |     |     |
        sum3  sum2  sum1  sum0
```

That's a **ripple-carry adder** - the carry ripples leftward through the chain. Want to add 8-bit
numbers? Chain eight full adders. 64-bit? Chain sixty-four. A machine that adds whole numbers is a
row of the same tiny circuit, repeated.

## The leap, plainly put

With small variations on the same gates you can also subtract (addition with a flipped sign), and
run AND, OR, and NOT across whole numbers at once. Bundle those operations with logic that picks
*which* one to run, and you've built an **ALU** - an Arithmetic Logic Unit, the part of a
processor that does the math.

An ALU is not a computer, though: it computes an answer the instant its inputs arrive and forgets
it just as fast - no memory, no sense of time. Two more ingredients get you the rest of the way:

- A **memory element** - a small loop of gates called a *latch* that holds a single bit after the
  input goes away. Stack enough of these and you get registers and RAM: somewhere to keep numbers
  between steps.
- A **clock** - a steady tick that says "now," so operations happen in order instead of all at
  once, and a held bit updates only when you want it to.

Add **control logic** - gates that read an instruction and decide what the ALU should do and which
bits go where - and the skeleton of a computer is in front of you: do math (ALU), remember results
(latches), take turns (clock), follow instructions (control). That paragraph is a sketch, not a
build - a real CPU is millions to billions of gates, and each of those four pieces is a deep topic
on its own. But the leap that might have looked like magic, from true/false to a working machine,
is now a list of named, understandable parts. None is a miracle. All are gates.

## For builders

When you write `a + b` in any language, that line ultimately becomes adder hardware doing the
column-by-column carry you just traced. The bitwise operators (`&`, `|`, `^`, `~`) are even more
direct - they *are* AND, OR, XOR, and NOT applied across every bit of a number in one shot. The
same world you've been reasoning about on paper runs underneath your code.

## The whole journey

1. **True and false** - the two values everything is built from.
2. **Algebra over them** - AND, OR, NOT, and reliable rules for combining them.
3. **Gates** - those operations made physical, in voltage and silicon.
4. **Arithmetic** - gates wired together until they add, subtract, and beyond.

Each layer was a short, fair step; stacked up, they reach from a single bit to the machine on your
desk. From here it's down into the silicon - how a gate is carved from transistors, how memory and
clocks are built for real. That's a hardware story, but it's the physics underneath the logic you
now understand. You've finished the logic. The foundation is solid, and it's yours.

## Open-ended exercise

A half-adder takes two single-bit inputs (A and B) and produces two outputs: Sum and
Carry. The Sum is `A XOR B` and the Carry is `A AND B`. Now imagine chaining two
half-adders (plus an OR gate) to make a **full-adder** that also takes a carry-in from
a previous stage. Sketch the gate-level diagram for a full-adder, labeling each gate
and showing how the carry propagates. The goal is to see how a multi-bit adder - and
ultimately a CPU's arithmetic unit - is just gates all the way down.

A quick check before you go:

```quiz
[
  {
    "q": "In a half-adder, which gate produces the sum bit?",
    "choices": ["AND", "OR", "XOR", "NOT"],
    "answer": 2,
    "explain": "The sum is 1 when exactly one input is 1 and 0 when they match - that's XOR. So sum = A XOR B."
  },
  {
    "q": "In a half-adder, which gate produces the carry bit?",
    "choices": ["AND", "XOR", "OR", "NOT"],
    "answer": 0,
    "explain": "The carry is 1 only when both inputs are 1 (because 1 + 1 overflows a single bit). That's exactly AND, so carry = A AND B."
  },
  {
    "q": "What's the big idea this phase demonstrates?",
    "choices": [
      "Computers contain a hidden special 'plus' component separate from logic",
      "Plain logic gates wired together can perform arithmetic",
      "Arithmetic and logic are unrelated and need different hardware",
      "Only XOR gates can do any useful computation"
    ],
    "answer": 1,
    "explain": "No special adder part is hiding in the chip. Ordinary AND/OR/NOT/XOR gates, wired up the right way, produce arithmetic - that's how true/false becomes math."
  }
]
```

[← Phase 2: Logic Gates: Logic Made Physical](02-logic-gates-logic-made-physical.md) · [Guide overview](_guide.md)
