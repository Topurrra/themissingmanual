---
title: "Undefined Behavior & Common Footguns"
guide: "c-from-zero"
phase: 14
summary: "Why does C code sometimes work perfectly on your machine and then crash or misbehave the moment you change compilers, flags, or platforms - and what is undefined behavior actually doing under the hood?"
tags: [c, undefined-behavior, ub, buffer-overflow, use-after-free, integer-overflow, sanitizers, debugging]
difficulty: advanced
synonyms: ["what is undefined behavior in c", "c undefined behavior examples", "why does my c code work sometimes", "signed integer overflow c", "use after free c", "buffer overflow c explained", "c compiler optimized away my check", "address sanitizer c", "common c bugs", "c footguns"]
updated: 2026-07-14
---
# Undefined Behavior & Common Footguns

Here's a sentence that should worry you a little: a C program can compile cleanly, run correctly a thousand times in a row, and still be completely broken. Not "broken in an edge case you haven't tested" - broken in a way the language itself refuses to define the meaning of. This phase is about that gap, because it's the single biggest thing separating someone who writes C from someone who understands it.

## What "undefined behavior" actually is

**What it actually is.** The C standard describes what correct programs must do. For a large set of situations - reading an uninitialized variable, indexing past the end of an array, signed integer overflow, dereferencing a null or freed pointer - the standard says nothing at all about what happens. Not "it crashes." Not "it returns garbage." It says: *the compiler may assume this never happens, and if it does happen anyway, literally anything is permitted as the result.* That's what "undefined behavior" (UB) means: not "undefined" like "unspecified detail," but "outside the contract entirely."

**Why this exists.** C was designed to be fast, and fast means the compiler doesn't insert runtime checks you didn't ask for. Instead of the language guaranteeing "out-of-bounds access throws an exception" (which costs a check on every access), C says "don't do that - and because you promised not to, I won't spend any instructions checking for it." The compiler takes your promise at face value and optimizes as if UB is impossible. That's the trade C makes for speed: zero-cost as long as you hold up your end.

**Why this bites people.** "Undefined" doesn't mean "predictably bad." It can mean the code works fine today, works fine on your laptop, and then a compiler upgrade or a new optimization level makes it print nonsense or delete a security check you were relying on. UB isn't a runtime event you can catch - it's a broken promise the compiler was never watching for, because you told it (by writing valid-looking C) that you wouldn't break it.

## The classic list, with real examples

### 1. Reading an uninitialized variable

```c
#include <stdio.h>

int main(void) {
    int x;              // no initializer - x holds garbage
    if (x > 0) {         // reading x here is UB
        printf("positive\n");
    } else {
        printf("not positive\n");
    }
    return 0;
}
```
Locals aren't zeroed for you (Phase 2 covered this - unlike globals, which *are* zeroed). `x` is whatever bit pattern happened to be sitting on the stack. Reading it before you write to it is UB, not "reads zero" or "reads garbage" - the compiler is allowed to assume it never happens and reason accordingly, which can produce output that looks impossible to explain from the source alone.

### 2. Out-of-bounds array access

```c
int scores[5] = {90, 85, 77, 60, 95};
printf("%d\n", scores[5]);   // valid indices are 0..4 - this is UB
```
There's no bounds check in C (Phase 6). `scores[5]` reads whatever memory happens to sit right after the array - maybe another variable, maybe unmapped memory that segfaults, maybe nothing visibly wrong at all. All three are "correct" outcomes of UB.

### 3. Signed integer overflow

```c
#include <limits.h>
#include <stdio.h>

int main(void) {
    int x = INT_MAX;
    int y = x + 1;        // signed overflow - UB, NOT wraparound
    printf("%d\n", y);
    return 0;
}
```
This one surprises people the most. Unsigned overflow *is* defined (it wraps, Phase 2) - but signed overflow is UB. Compilers exploit this aggressively. A real, well-documented case: a security check like `if (x + 1 < x)` (meant to detect overflow) can be silently deleted by the optimizer, because the compiler is allowed to assume `x + 1 < x` is *never* true for a signed `int` - overflow "can't happen," so the whole branch is dead code from its point of view. The check you wrote to catch overflow gets erased *because* it relied on overflow occurring.

### 4. Use-after-free and dangling pointers

```c
#include <stdlib.h>
#include <stdio.h>

int main(void) {
    int *p = malloc(sizeof(int));
    *p = 42;
    free(p);
    printf("%d\n", *p);   // p is dangling - UB
    return 0;
}
```
`free(p)` (Phase 10) doesn't erase memory or nullify `p` - it just tells the allocator "this block is available again." `*p` after that reads memory that might already belong to something else, or might still look right *this run* and wrong the next. This is the same category of bug as the stack-vs-heap dangling pointer from Phase 11, just reached via `free` instead of a returned local's address.

### 5. Buffer overflows (writing, not just reading)

```c
#include <string.h>

char name[8];
strcpy(name, "This string is way too long");  // overflows name - UB
```
`strcpy` (Phase 13) has no idea how big `name` is - it copies until it hits `'\0'`, writing straight past the buffer's end. This overwrites whatever memory comes next: other variables, a saved return address, anything. This exact mistake is the root cause of a large fraction of historical security vulnerabilities. The fix is `snprintf` (or `strncpy`) with an explicit size, or better, tracking buffer capacity everywhere you write. One catch: `strncpy` does not guarantee a terminating `'\0'` - if the source is as long as the size you pass, it fills the buffer and leaves it unterminated, which just turns a write overflow into a later out-of-bounds read. That's why `snprintf`, which always terminates, is the safer default.

### 6. Double free and freeing unowned memory

```c
int *p = malloc(sizeof(int));
free(p);
free(p);        // double free - UB, often corrupts the allocator itself
```
The allocator keeps its own bookkeeping in memory near your blocks. Freeing the same pointer twice can corrupt that bookkeeping, making a *later, unrelated* `malloc` crash - which makes this bug notoriously hard to trace back to its real cause.

## Why "it worked when I ran it" proves nothing

UB is not "the program crashes." Crashing would be easy - you'd see it immediately. The dangerous cases are the ones that *look* fine: the garbage value in an uninitialized variable happens to be zero this run, the freed memory hasn't been reused yet, the out-of-bounds read lands on padding nobody cares about. Change the compiler, the optimization level, the surrounding code, or the platform, and the same source can start doing something different - not because anything "changed," but because you were never guaranteed the old behavior in the first place. Treat "it ran correctly" as *no evidence at all* that a program without UB is UB-free.

## Catching UB before it catches you

You can't spot most of this by reading code carefully forever - use tools built for exactly this:

- **Compile with warnings on:** `gcc -Wall -Wextra -Wpedantic` catches a surprising amount (uninitialized reads, type mismatches, format string errors) at compile time, for free.
- **AddressSanitizer:** `gcc -fsanitize=address -g prog.c -o prog` instruments the binary to catch buffer overflows, use-after-free, and double-free *the instant they happen*, with a stack trace pointing at the exact line - instead of silently corrupting memory and crashing somewhere unrelated later.
- **UndefinedBehaviorSanitizer:** `gcc -fsanitize=undefined -g prog.c -o prog` catches signed overflow, null dereferences, and misaligned access at the moment they occur.
- **Valgrind** (Phase 9): catches uninitialized reads and memory leaks by running your program under a full memory-tracking emulator - slower, but thorough.

Run your test suite under `-fsanitize=address,undefined` regularly. It turns "undefined behavior" from a ghost that appears months later into a normal, debuggable crash with a line number.

## Recap

1. **Undefined behavior means "outside the language's contract."** The compiler is allowed to assume it never happens and optimize on that assumption - it does not mean "predictably bad" or "crashes."
2. C skips runtime checks (bounds, initialization, overflow) for speed, on the promise that *you* keep code within the rules. UB is what happens when that promise breaks.
3. The classics: uninitialized reads, out-of-bounds access, signed integer overflow, use-after-free, buffer overflows, double free. Every one of them can "work" by accident and fail unpredictably later.
4. "It ran fine" is not proof of correctness. Compile with `-Wall -Wextra` always, and run tests under `-fsanitize=address,undefined` (or Valgrind) to catch UB the moment it happens instead of months later.

## Quick check

Test yourself on the idea that makes UB dangerous - that it's not "predictably bad," it's outside the language's contract entirely:

```quiz
[
  {
    "q": "A program with undefined behavior runs correctly every time you test it. What does that prove?",
    "choices": [
      "Nothing - UB can still misbehave under a different compiler, flag, or platform",
      "The UB is harmless and won't cause problems later",
      "The compiler already checked for UB and found none",
      "The code no longer contains UB, since it ran correctly"
    ],
    "answer": 0,
    "explain": "The standard makes no guarantee for UB, so a clean run today is not evidence of anything - the same source can behave differently the moment the compiler, optimization level, or surrounding code changes."
  },
  {
    "q": "Why can a compiler legally delete a security check like `if (x + 1 < x)` that's meant to catch signed integer overflow?",
    "choices": [
      "Signed overflow is UB, so the compiler is allowed to assume `x + 1 < x` is never true and treat the branch as dead code",
      "The compiler detects the bug and 'fixes' the code for you",
      "`if` statements comparing the same variable are always removed as an optimization",
      "It only happens with `-O0`, so raising optimization level would prevent it"
    ],
    "answer": 0,
    "explain": "Unsigned overflow wraps and is defined, but signed overflow is UB - so the compiler can assume it never happens, which means a check that only triggers via overflow can be optimized away entirely."
  },
  {
    "q": "After `free(p)`, what has actually happened to `p` and the memory it pointed to?",
    "choices": [
      "The memory is marked available for reuse, but `p` still holds the old address and the memory itself isn't erased or zeroed",
      "The memory is immediately zeroed out and `p` is set to NULL",
      "`p` becomes a compile error the next time it's used",
      "The memory is safe to read from but not write to"
    ],
    "answer": 0,
    "explain": "`free` only tells the allocator the block is available again - it doesn't nullify the pointer or clear the memory, which is exactly why a dangling `*p` can look fine one run and read garbage the next."
  }
]
```

---

[← Phase 13: The Standard Library Essentials](13-the-standard-library-essentials.md) · [Phase 15: Where to Go Next →](15-where-to-go-next.md)
