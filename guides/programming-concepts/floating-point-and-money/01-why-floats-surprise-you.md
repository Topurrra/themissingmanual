---
title: "Why Floats Surprise You"
guide: floating-point-and-money
phase: 1
summary: "A float stores numbers in binary, so most decimal fractions can't be represented exactly - which is why 0.1 plus 0.2 lands a hair off 0.3."
tags: [floating-point, binary, precision, rounding, ieee-754]
difficulty: beginner
synonyms: ["why is 0.1 + 0.2 not 0.3", "what is a float", "how does floating point work", "why does 0.1 round", "binary fractions explained", "0.30000000000000004"]
updated: 2026-06-30
---

# Why Floats Surprise You

Let's start at the exact moment it gets weird. You open any language with a console and type the most innocent sum imaginable:

```console
>>> 0.1 + 0.2
0.30000000000000004
```
*What just happened:* The computer added two numbers you'd bet your lunch were `0.1` and `0.2`, and the answer came out wrong in the fifteenth decimal place. Your instinct says "rounding error," and you're right - but the rounding didn't happen during the *addition*. It happened the moment `0.1` and `0.2` were stored, before the plus sign ever ran.

That distinction is the whole guide. So let's see why storing `0.1` is the problem.

## The one idea: a float is a *binary* fraction

You write numbers in base 10. After the decimal point, each place is a tenth, a hundredth, a thousandth - powers of ten. A computer doesn't have base 10; it has base 2. After the (binary) point, each place is a half, a quarter, an eighth, a sixteenth - powers of *two*.

So a float can only store numbers it can build by adding up halves and quarters and eighths. Some decimals fall right out of that:

```text
0.5   = 1/2              → exact in binary
0.25  = 1/4              → exact in binary
0.75  = 1/2 + 1/4        → exact in binary
```
*What just happened:* These decimals are sums of powers of two, so the computer stores them perfectly. No rounding, no surprise. The trouble starts with the ones that *aren't*.

Try to build `0.1` from halves, quarters, eighths, sixteenths… you never land on it exactly. It's like trying to write `1/3` in base 10: `0.3333…` going on forever. In binary, `0.1` is a *repeating* fraction that never terminates:

```text
0.1 in binary = 0.0001100110011001100110011...  (the 0011 repeats forever)
```
*What just happened:* `0.1` has no exact binary form, the same way `1/3` has no exact decimal form. The computer can't store infinite digits, so it keeps about 15–17 significant decimal digits' worth and **rounds off the rest.** What you store as `0.1` is really `0.1` plus a microscopic error.

💡 **Key point.** The error isn't randomness or a CPU flaw. It's the unavoidable cost of writing a base-10 number in a base-2 box. Most decimals don't fit, so they get rounded to the nearest value the box *can* hold.

## Replaying the surprise, now that it makes sense

Go back to `0.1 + 0.2`. Both numbers got rounded slightly when stored. Add two slightly-off numbers and the errors combine, landing you past `0.3`:

```text
stored 0.1  ≈ 0.1000000000000000055511151231257827...
stored 0.2  ≈ 0.2000000000000000111022302462515654...
their sum   ≈ 0.3000000000000000444089209850062616...
nearest 0.3 ≈ 0.2999999999999999888977697537403718...
```
*What just happened:* The true sum of the two stored values is a hair *above* `0.3`, and it's closer to the float just above `0.3` than to the one just below it. So the result displays as `0.30000000000000004`. Nothing went wrong - every step did exactly what it promised. The inputs were never quite `0.1` and `0.2` to begin with.

Here's a cleaner way to *see* that the stored values aren't what you typed. Ask for more digits than the console normally shows:

```python runnable
print(f"{0.1:.17f}")
print(f"{0.2:.17f}")
print(f"{0.1 + 0.2:.17f}")
print(0.1 + 0.2 == 0.3)
```
*What just happened:* Printed to 17 decimals, `0.1` reveals itself as `0.10000000000000001` and the sum as `0.30000000000000004`. And the equality check prints `False` - because the stored sum and the stored `0.3` are two different nearby floats. The default short display had been politely rounding the lie away for you.

## Why it's built this way (and why that's okay)

It would be fair to ask: if base 10 is what humans use, why not store numbers in base 10? The answer is speed and range. The format almost every language uses for `float`/`double` is **IEEE 754** - a binary layout your CPU has dedicated hardware to add, multiply, and divide blindingly fast. It also covers an enormous range, from subatomic to astronomical, in a fixed 64 bits.

That's a fantastic trade for measuring, simulating, and rendering - places where being off in the 16th digit is invisible and irrelevant. It's a *terrible* trade the moment "off by a hair" means "off by a cent." Which is exactly where we're headed next.

📝 **Terminology.** A *float* (short for *floating-point number*) stores a number as a binary fraction with limited precision. The common 64-bit kind is a *double*. *IEEE 754* is the standard that defines how those bits are laid out. The leftover difference between the number you wanted and the one actually stored is *rounding error.*

> 💬 For why this hardware-friendly trade-off exists at all - and why CPUs care so much about fixed-size, fast number formats - see [How a Computer Actually Works](/guides/cpu-ram-and-storage). And if the base-2 / base-10 fraction idea felt like math you'd rather avoid, [Why Math Isn't Your Enemy](/guides/why-math-isnt-your-enemy) is a gentler on-ramp.

```quiz
[
  {
    "q": "Why does 0.1 + 0.2 produce 0.30000000000000004?",
    "choices": [
      "The CPU has a hardware bug in addition",
      "0.1 and 0.2 can't be stored exactly in binary, so they're rounded before the addition even happens",
      "The plus operator rounds its result up by default",
      "0.3 is a special number that floats can't represent"
    ],
    "answer": 1,
    "explain": "0.1 and 0.2 are repeating fractions in binary, so each is rounded slightly when stored. The addition is exact on those rounded inputs; the inputs were the problem."
  },
  {
    "q": "Which of these decimals CAN be stored exactly as a binary float?",
    "choices": ["0.1", "0.2", "0.75", "0.3"],
    "answer": 2,
    "explain": "0.75 = 1/2 + 1/4, a sum of powers of two, so it's exact. 0.1, 0.2, and 0.3 are repeating binary fractions and get rounded."
  },
  {
    "q": "What is IEEE 754?",
    "choices": [
      "A law requiring decimal money storage",
      "The standard binary layout most languages use for float and double",
      "A rounding mode you can turn off",
      "A base-10 number format built into CPUs"
    ],
    "answer": 1,
    "explain": "IEEE 754 defines how floating-point numbers are stored in bits. It's binary and hardware-friendly, which is exactly why decimal values like 0.1 don't fit."
  }
]
```

[← Guide overview](_guide.md) · [Phase 2: Where It Bites →](02-where-it-bites.md)
