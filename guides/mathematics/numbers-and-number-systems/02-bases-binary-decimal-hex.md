---
title: "Bases: Binary, Decimal, Hex"
guide: "numbers-and-number-systems"
phase: 2
summary: "A base is how many digits you count with before carrying. Decimal uses ten, binary two, hex sixteen. Positional notation explains all three — and why computers store binary and humans read it as hex."
tags: [mathematics, binary, hexadecimal, base-conversion, positional-notation]
difficulty: beginner
synonyms: ["what is binary", "decimal to binary", "what is hexadecimal", "convert binary to decimal", "why do computers use binary", "what does 0x mean"]
updated: 2026-06-25
---

# Bases: Binary, Decimal, Hex

You already count in base ten — you've done it your whole life without calling it
that. This phase shows you that base ten is one choice among many. Once you see the
pattern underneath it, binary and hex stop being cryptic computer trivia and become
the same idea in different clothes.

If numbers still feel like they're out to get you, the calmer framing in
[Why Math Isn't Your Enemy](/guides/why-math-isnt-your-enemy) pairs well with
this. Nothing here requires it, though.

## Positional notation: the idea under every number system

Look at the decimal number `234`. You read it instantly as "two hundred
thirty-four," but notice *how* the meaning is built. The same digit means different
amounts depending on **where** it sits:

```text
  234
  │││
  ││└─ 4 in the ones place    →  4 × 1   = 4
  │└── 3 in the tens place    →  3 × 10  = 30
  └─── 2 in the hundreds place →  2 × 100 = 200
                                 ─────────────
                                  total   = 234
```

Each place is a **power of ten**:

```text
234 = 2×10² + 3×10¹ + 4×10⁰
    = 2×100 + 3×10  + 4×1
```

That number ten is the **base**. Here's the cleanest definition you'll get: the
base is *how many digits you have before you run out and have to carry*. Decimal
has ten digits (0 through 9). Count past 9 and there's no single symbol left, so
you carry: `9` rolls over to `10`.

Why this matters: nothing about positional notation is special to ten. Pick any
base *b*, and the places become powers of *b*. Change the base, keep the
machinery. That one insight unlocks binary and hex.

## Binary (base 2): two digits, powers of two

Binary uses exactly two digits: `0` and `1`. With only two symbols, you carry much
sooner — after `1` you're already out, so `1 + 1 = 10` in binary (which is *two*,
not ten). The places are powers of two instead of powers of ten:

```text
place values:  ... 16   8   4   2   1
                   2⁴  2³  2²  2¹  2⁰
```

Let's convert `1011₂` to decimal. (The little `₂` means "this is base 2," so you
don't mistake it for one thousand eleven.) Read each digit against its place value
and add up the ones that are switched on:

```text
   1    0    1    1     ← binary digits
   8    4    2    1     ← place values
   ─    ─    ─    ─
   8 +  0 +  2 +  1  =  11
```

So `1011₂` equals `11` in decimal. A binary digit is called a **bit**, and a bit
is a yes/no: is this place value included or not?

### Going the other way: decimal to binary by repeated division

To turn a decimal number into binary, repeatedly divide by 2 and write down the
**remainder** each time. The remainders, read bottom-to-top, are the binary
digits. Let's convert `13`:

```text
13 ÷ 2 = 6  remainder 1   ← least significant bit (bottom)
 6 ÷ 2 = 3  remainder 0
 3 ÷ 2 = 1  remainder 1
 1 ÷ 2 = 0  remainder 1   ← most significant bit (top)
```

Read the remainders from bottom to top: `1101`. Check it: `8 + 4 + 0 + 1 = 13`.
It works because each division strips off the smallest place value and asks "is
it odd?" — and odd-or-even is exactly what the bottom bit records.

## Hex (base 16): a compact shorthand for binary

Hexadecimal — "hex" — is base 16. That's a problem at first glance: we only have
ten digit symbols (0–9), and base 16 needs sixteen. The fix is to borrow letters.
After `9`, hex keeps counting with `A` through `F`:

```text
hex:      0 1 2 3 4 5 6 7 8 9 A  B  C  D  E  F
decimal:  0 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15
```

So `A` is ten, `F` is fifteen. The places are powers of sixteen. Convert `2F₁₆` to
decimal:

```text
   2          F
   ↓          ↓
   2×16¹  +  15×16⁰
   = 32   +  15
   = 47
```

So `2F₁₆ = 47`. Going back uses repeated division by 16, the same trick as binary —
but nobody does that by hand, because of the real reason hex exists, which is the
next section.

## Why these bases: hardware, and human eyes

Computers use **binary** because the physical hardware has two stable states. A
transistor is either conducting or not; a wire is either at high voltage or low.
Two clean states map perfectly onto `1` and `0` — no ambiguity, no in-between to
misread. Everything a machine "knows" is built from billions of these on/off
switches, combined by logic gates (the building blocks you'll meet properly in a
hardware guide). Binary isn't a stylistic choice; it's what the silicon can
physically hold.

Humans use **hex** because raw binary is exhausting to read. Eight bits look like
`11111111` — easy to miscount. But here's the magic: **one hex digit is exactly
four bits.** Four bits can represent 0 through 15, and so can one hex digit, so
they line up perfectly. Group a binary string into chunks of four and translate
each chunk to a single hex digit:

```text
1111 1111   ← eight bits, split into two groups of four
  F    F    ← each group → one hex digit
=  FF
```

`11111111₂` is `FF₁₆`. Hex is binary for human eyes: same information, four times
shorter, far harder to miscount.

## See it run

Python understands all three bases directly, which makes it a great place to check
your hand-conversions. Run this:

```python runnable
print(0b1011)        # binary literal -> 11
print(0xFF)          # hex literal    -> 255
print(int("1011", 2))  # parse binary string
print(bin(11))       # decimal -> binary string
print(hex(255))      # decimal -> hex string
```

*What just happened:* The prefix `0b` tells Python "the following digits are
binary," so `0b1011` is evaluated as `8 + 2 + 1 = 11` and prints `11`. The
prefix `0x` means hex, so `0xFF` is `15×16 + 15 = 255` and prints `255`.
`int("1011", 2)` takes the *string* `"1011"` and the base `2`, parsing it as
binary — again `11`. Going the other direction, `bin(11)` converts the decimal
`11` into a binary string and prints `0b1011`, and `hex(255)` converts `255`
into a hex string and prints `0xff` (Python writes hex letters in lowercase).
Notice the round trips: `0b1011` and `bin(11)` are the same number seen from
both sides, and so are `0xFF` and `hex(255)`.

## For builders

A few things you'll bump into constantly once you're writing code:

- **Literals.** Most languages let you write numbers in binary with a `0b`
  prefix and in hex with `0x`. So `0b1010`, `0xFF`, and `255` can all describe
  the same or related values — they're only different spellings.
- **A byte is 8 bits.** It's the standard chunk of memory. One byte holds 256
  distinct values, `0` through `255`.
- **`0xFF` = 255.** Two hex digits cover exactly one byte (4 bits + 4 bits), so
  hex is the natural way to write byte values. `0x00` is 0, `0xFF` is 255.
- **CSS colors are hex.** A color like `#FF8800` is three bytes — red `FF`
  (255), green `88` (136), blue `00` (0) — written as six hex digits. Now you
  can read them: `#FFFFFF` is all channels maxed (white), `#000000` is all off
  (black).

> ⚠️ **Gotcha:** One hex digit is *exactly* four bits — never three, never
> five. That's the whole reason hex is convenient. When you read a binary
> string, mentally chop it into groups of four *from the right*, and each group
> becomes one hex digit. Grouping from the left instead will give you the wrong
> answer if the length isn't a multiple of four.

## Recap

- **Positional notation** gives every digit a place value that's a power of the
  base; the base is how many digits you have before you carry.
- **Binary** is base 2 (digits `0`,`1`; place values are powers of two). Convert
  to decimal by adding the place values that are on; convert from decimal by
  repeated division by 2, reading remainders bottom-up.
- **Hex** is base 16 (digits `0`–`9` then `A`–`F` for 10–15). Its superpower:
  one hex digit equals exactly four bits, so it's a compact, readable shorthand
  for long binary strings.
- Computers store **binary** (two stable hardware states); humans read **hex**
  because it's binary that's four times shorter and easier on the eyes.

Quick check before you move on:

```quiz
[
  {
    "q": "What base is the binary number system?",
    "choices": ["Base 10", "Base 2", "Base 8", "Base 16"],
    "answer": 1,
    "explain": "Binary uses exactly two digits, 0 and 1, so it is base 2. Its place values are powers of two."
  },
  {
    "q": "What is the decimal value of the binary number 1010₂?",
    "choices": ["5", "8", "10", "12"],
    "answer": 2,
    "explain": "Place values from the right are 1, 2, 4, 8. The on bits are the 8 and the 2: 8 + 0 + 2 + 0 = 10."
  },
  {
    "q": "Why do people write binary values in hexadecimal?",
    "choices": [
      "Hex can store larger numbers than binary can",
      "Each hex digit is exactly 4 bits, so hex is a compact, readable shorthand for binary",
      "Computers can only understand hex, not binary",
      "Hex avoids the need for the digit zero"
    ],
    "answer": 1,
    "explain": "One hex digit maps to exactly four bits, so a long binary string becomes four times shorter and far easier to read without changing the underlying value."
  }
]
```

[← Phase 1: The Families of Numbers](01-the-families-of-numbers.md) · [Guide overview](_guide.md) · [Phase 3: Modular Arithmetic: Clock Math →](03-modular-arithmetic-clock-math.md)