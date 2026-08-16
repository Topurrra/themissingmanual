---
title: "Bit Manipulation, Properly"
guide: "embedded-c-from-zero"
phase: 3
summary: "Set, clear, toggle, and test individual bits in C with the four canonical patterns - x |= (1 << n), x &= ~(1 << n), x ^= (1 << n), and x & (1 << n). Masks, read-modify-write, and the operator-precedence gotcha that bites every embedded programmer."
tags: [embedded-c, bitwise, bit-manipulation, masks, registers, avr, intermediate]
difficulty: intermediate
synonyms: ["how to set a bit in c", "how to clear a bit in c", "how to toggle a bit in c", "how to check if a bit is set in c", "what does 1 << n mean", "bit masking in c", "bitwise operations embedded c", "read modify write register", "why use bitwise operators in embedded"]
updated: 2026-08-16
---
# Bit Manipulation, Properly

This is the daily bread of embedded work. A hardware register is a row of eight (or sixteen, or thirty-two) tiny switches packed into one number, and each switch controls something physical: a pin's direction, whether an interrupt is armed, the speed of a timer. You will spend your career flipping one of those switches without disturbing the seven next to it. The four patterns in this phase are how you do that, and once they are in your fingers you will read hardware code that used to look like line noise.

Here is the mental model to hold onto: **you almost never assign a whole register a value. You change specific bits and leave the rest exactly as they were.** Everything below is built to do that safely.

## The one trick behind all four: `1 << n`

`1 << n` means "take the number 1 and shift it left by `n` positions." It builds a **mask**: a number that is all zeros except for a single 1 sitting in position `n`.

```c
1 << 0   ==  0b00000001
1 << 3   ==  0b00001000
1 << 5   ==  0b00100000
```

That lone 1 is the switch you want to touch. The four operations below all combine that mask with your register using a bitwise operator, and the operator you pick decides whether the bit gets forced on, forced off, flipped, or read.

## The four operations

**Set** a bit (force it to 1): `reg |= (1 << n)`

OR-ing with the mask puts a 1 in position `n`. Every other bit is OR-ed with a 0, and `anything | 0` is unchanged, so the rest stay exactly as they were.

**Clear** a bit (force it to 0): `reg &= ~(1 << n)`

`~(1 << n)` is the mask flipped inside out: all ones except a single 0 in position `n`. AND-ing with it forces bit `n` to 0 (because `anything & 0` is 0) while every other bit is AND-ed with a 1 and survives untouched.

**Toggle** a bit (flip whatever it is): `reg ^= (1 << n)`

XOR with a 1 flips a bit; XOR with a 0 leaves it alone. So the mask flips only position `n`. This is how you blink an LED: toggle the same bit over and over.

**Test** a bit (is it 1?): `if (reg & (1 << n))`

AND with the mask keeps only bit `n` and zeros everything else. The result is nonzero when the bit is set and zero when it is not, which is exactly what an `if` wants.

Here is a before-and-after view of each one acting on a single byte:

| Operation | Start | Mask | Result |
|---|---|---|---|
| Set bit 2 | `00000000` | `00000100` | `00000100` |
| Clear bit 2 | `00000100` | `00000100` | `00000000` |
| Toggle bit 5 | `00000000` | `00100000` | `00100000` |
| Test bit 5 | `00100000` | `00100000` | nonzero (set) |

## Read-modify-write: what `|=` really does

`reg |= (1 << 2)` is not one step, it is three. The compiler expands it to: **read** the current value of `reg`, **modify** it by OR-ing in the mask, then **write** the result back.

```mermaid
flowchart LR
  A["Read current reg"] -->|value in CPU| B["OR in the mask"]
  B -->|new value| C["Write back to reg"]
```

That read step is the whole point. It is what preserves the bits you are not touching. If you instead wrote `reg = (1 << 2)`, you would throw away every other bit and set the register to a bare `00000100`. Beginners reach for plain `=` and wonder why turning on one pin turned off three others. The answer is that `=` overwrites; `|=`, `&=`, and `^=` preserve.

## A worked example

This runs on your normal PC (bit math is the same everywhere), so you can watch the byte change. The helper prints all eight bits so you can see which switch moved.

```c
#include <stdio.h>
#include <stdint.h>

void print_byte(uint8_t x) {
    for (int i = 7; i >= 0; i--) {
        putchar((x & (1 << i)) ? '1' : '0');
    }
    putchar('\n');
}

int main(void) {
    uint8_t reg = 0;        // eight switches, all off

    reg |= (1 << 2);        // set bit 2
    print_byte(reg);

    reg |= (1 << 5);        // set bit 5, leaving bit 2 alone
    print_byte(reg);

    reg &= ~(1 << 2);       // clear bit 2, leaving bit 5 alone
    print_byte(reg);

    reg ^= (1 << 5);        // toggle bit 5 (turns it off)
    print_byte(reg);

    reg ^= (1 << 5);        // toggle bit 5 again (back on)
    print_byte(reg);

    if (reg & (1 << 5)) {
        printf("bit 5 is set\n");
    }
    return 0;
}
```
```console
$ gcc bits.c -o bits && ./bits
00000100
00100100
00100000
00000000
00100000
bit 5 is set
```

*What just happened:* setting bit 5 did not disturb bit 2, and clearing bit 2 did not disturb bit 5. Each operation reached into the byte and moved exactly one switch. That independence is the entire reason these patterns exist, and it is what lets you configure one pin of a port without breaking the others.

💡 **Key point.** When you see `reg |= (1 << PIN)` in a datasheet example or someone's driver code, read it out loud as "set the PIN bit of reg, leave the rest." You now know the other three on sight too.

## The gotcha that gets everyone

The bitwise operators have **lower** precedence than `==`. That single fact causes one of the most common embedded bugs there is:

```c
if (status & FLAG == 0) { ... }   // WRONG
```

You meant "is the FLAG bit clear?" But because `==` binds tighter than `&`, C reads it as `status & (FLAG == 0)`. If `FLAG` is nonzero, `FLAG == 0` is `0`, so the whole thing becomes `status & 0`, which is always `0`, so the branch never runs. The code compiles clean and fails silently.

⚠️ **Gotcha.** Always parenthesize a bit test: write `if ((status & FLAG) == 0)`. When in doubt, wrap the mask expression in parentheses. Compilers will not warn you about the precedence version by default, and a logic analyzer will not either - it looks like your hardware is broken when your parentheses are.

One more, for wide registers: `1 << n` uses a plain `int` for the `1`, so shifting by the width of an `int` or more (`1 << 32` on a 32-bit `int`) is undefined behavior, and `1 << 31` sets the sign bit, which is also trouble. On an 8-bit AVR register you will never shift past 7, so it does not bite there, but for a 32-bit peripheral register (as on ARM) write the mask as `1UL << n` to keep it unsigned and well defined.

## Recap

1. `1 << n` builds a **mask**: all zeros except a single 1 in position `n`.
2. **Set** with `reg |= (1 << n)`, **clear** with `reg &= ~(1 << n)`, **toggle** with `reg ^= (1 << n)`, **test** with `reg & (1 << n)`.
3. These change one bit and leave the rest alone. Plain `reg = ...` overwrites everything - almost never what you want on hardware.
4. `reg |= mask` is a **read-modify-write**: read the register, change bits, write it back. The read is what preserves the untouched bits.
5. Bitwise operators bind looser than `==`. Parenthesize every bit test: `if ((reg & MASK) == 0)`.
6. For registers wider than 16 bits, use `1UL << n` so the shift stays unsigned and defined.

Every register access in the next two phases is one of these four moves. Get comfortable here and the hardware code stops looking like magic.

### Check yourself

```quiz
[
  {
    "q": "You want to turn on bit 3 of a register without changing any other bit. Which line does it?",
    "choices": [
      "reg = (1 << 3);",
      "reg |= (1 << 3);",
      "reg &= (1 << 3);",
      "reg ^= (1 << 3);"
    ],
    "answer": 1,
    "explain": "OR-ing with a single-bit mask forces that bit to 1 and leaves the rest untouched.",
    "why": [
      "Plain assignment overwrites the whole register, clearing every other bit.",
      null,
      "AND with a single-bit mask clears all the OTHER bits to 0.",
      "XOR toggles bit 3, so it only ends up set if it happened to be 0 first."
    ]
  },
  {
    "q": "What is wrong with `if (status & FLAG == 0)`?",
    "choices": [
      "Nothing, it correctly checks whether FLAG is clear",
      "== binds tighter than &, so it parses as status & (FLAG == 0) and misbehaves",
      "You cannot use == together with bitwise operators at all",
      "It should use || instead of &"
    ],
    "answer": 1,
    "explain": "== has higher precedence than &, so this reads as status & (FLAG == 0). Wrap the mask test in parentheses: (status & FLAG) == 0."
  },
  {
    "q": "Why is `reg |= (1 << 2);` called a read-modify-write?",
    "choices": [
      "It reads the current value of reg, ORs in the new bit, then writes the result back",
      "It reads from one register and writes to a different one",
      "It modifies the value twice before writing",
      "It only writes and never reads"
    ],
    "answer": 0,
    "explain": "Compound assignment expands to: read reg, OR it with the mask, store the result. The read is what preserves the bits you are not touching."
  }
]
```
