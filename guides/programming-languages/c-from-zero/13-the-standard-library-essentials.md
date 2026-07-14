---
title: "The Standard Library Essentials"
guide: "c-from-zero"
phase: 13
summary: "What's actually in the C standard library beyond malloc and printf - string.h, ctype.h, stdlib.h, math.h - and why C ships so little compared to languages with a 'batteries included' stdlib."
tags: [c, standard-library, string.h, stdlib.h, ctype.h, math.h, libc]
difficulty: intermediate
synonyms: ["c standard library functions", "string.h functions explained", "strcpy vs strncpy", "how to use qsort in c", "c ctype.h functions", "atoi vs strtol", "c standard library cheat sheet", "what functions does c have built in"]
updated: 2026-07-14
---

# The Standard Library Essentials

## The mental model: C gives you almost nothing, on purpose

If you came from Python or JavaScript, this phase might feel thin. Those languages ship with string
formatting, regex, JSON parsing, and HTTP clients built in. C ships with none of that. What C gives you
is a small set of header files - `<string.h>`, `<stdlib.h>`, `<ctype.h>`, `<math.h>`, and a few others -
that wrap the handful of operations that are either impossible to write correctly yourself (safe memory
copying with overlap handling) or so common that everyone would otherwise reinvent them slightly
differently (checking if a character is a digit).

This is not an oversight. C was designed in the 1970s to be the language you use to build everything
else - operating systems, other languages' runtimes, embedded firmware. A big stdlib means big
assumptions about what your program needs (a heap, a filesystem, threads), and those assumptions don't
hold on a microcontroller with 2KB of RAM. So the standard library stays small, and the header files you
already know the shape of - `#include`, declare-in-header-define-elsewhere, from [Phase
8](08-header-files-and-the-preprocessor.md) - are exactly how it's delivered: they're just headers
declaring functions that live in a library called **libc**, which your linker attaches automatically.

You already met part of the standard library without calling it that: `printf` and `scanf` from
`<stdio.h>` in [Phase 1](01-install-and-first-program.md), and `malloc`/`free` from `<stdlib.h>` in
[Phase 10](10-dynamic-memory-malloc-and-free.md). This phase fills in the rest of what you'll reach for
in nearly every real program: working with strings, classifying characters, converting between text and
numbers, and basic math.

## `<string.h>`: because arrays don't know their own length

Recall from [Phase 6](06-arrays-and-strings.md) that a C string is just a `char` array ending in `'\0'`,
and the array itself carries no length information. Every operation you'd want to do on a string -
measure it, copy it, compare it, search it - has to walk the bytes looking for that terminator. `<string.h>`
is a set of functions that do that walking correctly, so you don't write a subtly-wrong version yourself
every time.

```c
#include <stdio.h>
#include <string.h>

int main(void) {
    char src[] = "hello";
    char dst[20];

    printf("length: %zu\n", strlen(src));       // 5 (not counting '\0')

    strcpy(dst, src);                            // copies including '\0'
    printf("copied: %s\n", dst);

    strcat(dst, ", world");                      // appends onto dst
    printf("joined: %s\n", dst);

    printf("equal: %d\n", strcmp(dst, src) == 0); // 0 -> not equal (they differ)

    char *found = strstr(dst, "world");
    printf("found at: %s\n", found ? found : "(not found)");

    return 0;
}
```
```console
$ ./a.out
length: 5
copied: hello
joined: hello, world
equal: 0
found at: world
```

`strlen` returns `size_t` (an unsigned type sized to hold any array length on your platform), which is
why the format specifier is `%zu`, not `%d`. `strcmp` returns `0` for equal strings and a nonzero value
otherwise, which trips people up constantly, since it *reads* like a boolean but works backwards from one.

**The danger you need to know about.** `strcpy` and `strcat` do not check whether `dst` is big enough.
If `src` is longer than the destination buffer, they'll write past the end of it, which is undefined
behavior ([Phase 14](14-undefined-behavior-and-common-footguns.md) covers exactly why that's catastrophic,
not just wrong). The fix is the `n`-suffixed versions that take an explicit size limit:

```c
char dst[8];
strncpy(dst, "this string is way too long", sizeof(dst) - 1);
dst[sizeof(dst) - 1] = '\0';   // strncpy doesn't guarantee a terminator - add it yourself
```

That last line matters: unlike `strcpy`, `strncpy` will *not* null-terminate `dst` if the source doesn't
fit, so you always add the terminator by hand after calling it. This is the kind of sharp edge that makes
people write their own string-handling helpers on top of `<string.h>` rather than calling it raw every
time - a completely reasonable thing to do once you understand what's underneath.

Three more you'll use constantly for raw memory rather than text: `memcpy(dst, src, n)` copies `n` bytes
(faster than `strcpy` when you already know the length and the data isn't necessarily text), `memset(ptr,
value, n)` fills `n` bytes with a byte value (handy for zeroing a buffer: `memset(buf, 0, sizeof(buf))`),
and `memmove(dst, src, n)` is `memcpy`'s safe sibling when the source and destination might overlap.

## `<ctype.h>`: classifying and converting characters

Every "is this character a letter" check you'd otherwise hand-roll with comparisons is here, and it's
worth using these instead of writing your own, because the raw comparisons are easy to get subtly wrong
across locales and character sets:

```c
#include <ctype.h>
#include <stdio.h>

int main(void) {
    char c = 'A';
    printf("isalpha: %d\n", isalpha(c));   // nonzero (true)
    printf("isdigit: %d\n", isdigit(c));   // 0 (false)
    printf("lower: %c\n", tolower(c));     // a
    return 0;
}
```

The common ones: `isalpha`, `isdigit`, `isalnum`, `isspace`, `isupper`/`islower`, and the converters
`toupper`/`tolower`. They all take an `int` and return nonzero for true, `0` for false, matching C's
"no real boolean" convention from [Phase 2](02-syntax-variables-and-types.md). There's a subtle rule
about *how* you feed them a character: on platforms where `char` is signed, a byte with the high bit set
(anything past plain ASCII) becomes a negative `int`, and passing a negative value that isn't `EOF` is
undefined behavior. The safe habit is to cast through `unsigned char` first, e.g.
`isalpha((unsigned char)c)`. Plain ASCII like `'A'` is always fine, so the demo above doesn't need it.

## `<stdlib.h>`: conversions, sorting, and exiting

You've already used `malloc`/`free` from here. Three more essentials:

**Text-to-number conversion.** `atoi("42")` gives you `42` as an `int`, fast and simple - but it has no
way to tell you the string wasn't a valid number; garbage input silently becomes `0`. `strtol` (string to
long) is the version you should reach for when the input might be wrong, because it reports failure:

```c
#include <stdlib.h>
#include <stdio.h>

int main(void) {
    char *end;
    long n = strtol("42abc", &end, 10);   // base 10
    printf("parsed: %ld, stopped at: \"%s\"\n", n, end);
    return 0;
}
```
```console
$ ./a.out
parsed: 42, stopped at: "abc"
```

`end` points at the first character `strtol` couldn't parse. If `end` points at the same place `str`
does, nothing was parsed at all - that's your "this wasn't a number" signal that `atoi` can't give you.

**Sorting anything.** `qsort` sorts an array of *any* type by taking a comparison function you write,
since C has no generics to write one sort that works for every type:

```c
int compare_ints(const void *a, const void *b) {
    int x = *(const int *)a;
    int y = *(const int *)b;
    return (x > y) - (x < y);   // negative, zero, or positive
}

int nums[] = {5, 2, 8, 1};
qsort(nums, 4, sizeof(int), compare_ints);
// nums is now {1, 2, 5, 8}
```

The `void *` parameters are why [Phase 5](05-pointers-i-the-mental-model.md)'s pointer mental model
matters here: `qsort` doesn't know or care what type it's sorting, so it hands your comparator raw
addresses, and you cast them back to the real type before comparing. (You'll often see the shorter
`return x - y;` in textbooks. It works for small values but can overflow for large or mixed-sign
`int`s, which is undefined behavior - `(x > y) - (x < y)` is the same idea without the trap.)

**Leaving the program early.** `exit(0)` terminates the program immediately from anywhere in the call
tree, running any registered cleanup and flushing open buffered files first. A plain `return` only hands
control back to the calling function - it ends the whole program only when you're already in `main`, where
`return n` behaves just like `exit(n)` (same cleanup, same flushing).

## `<math.h>`: the floating-point functions

`sqrt`, `pow`, `floor`, `ceil`, `fabs`, and the trig functions (`sin`, `cos`, `tan`) all live here and
operate on `double`. One platform gotcha worth knowing: on Linux/GCC, math functions live in a separate
library, so you compile with `-lm` (`gcc prog.c -lm -o prog`) or the linker won't find them - a good
early exposure to the idea that "in the standard" and "linked by default" aren't always the same thing.

## Why this phase matters more than it looks

The real skill here isn't memorizing function signatures - it's the reflex to check `<string.h>` or
`<stdlib.h>` *before* writing your own string-length loop or your own number parser. C's standard library
is small enough to actually learn, and every function in it exists because someone already hit the edge
cases you'd hit writing it yourself. Reach for it first.

## Quick check

Test yourself on the sharp edges that trip people up most:

```quiz
[
  {
    "q": "You use `strcpy(dst, src)` where `src` is longer than `dst`'s buffer. What happens?",
    "choices": [
      "strcpy detects the overflow and truncates src to fit",
      "It writes past the end of dst, which is undefined behavior",
      "The compiler rejects the code at build time",
      "src is silently split across two calls"
    ],
    "answer": 1,
    "explain": "strcpy never checks the destination's size, so overflow just writes past the buffer's end; use strncpy plus a manual terminator when the input might not fit."
  },
  {
    "q": "`strcmp(a, b)` returns `0`. What does that tell you?",
    "choices": [
      "a and b are different strings",
      "a and b are equal",
      "The comparison failed",
      "a is empty"
    ],
    "answer": 1,
    "explain": "strcmp returns 0 for equal strings and nonzero otherwise, which reads like a boolean but works backwards from one."
  },
  {
    "q": "Why is `strtol` a better choice than `atoi` when the input might not be a valid number?",
    "choices": [
      "atoi is slower, so it skips validation to save time",
      "atoi has no way to report where parsing stopped or failed; strtol writes that position into the `end` pointer you pass it",
      "atoi only works on negative numbers",
      "strtol re-checks the string twice for accuracy"
    ],
    "answer": 1,
    "explain": "atoi just returns 0 on anything unparseable, indistinguishable from an actual 0; strtol's end pointer tells you exactly where it stopped, so you can tell 'partially parsed' from 'totally invalid' from 'clean number'."
  }
]
```

---

[← Phase 12: Pointers II](12-pointers-ii-arithmetic-double-and-function-pointers.md) · [Phase 14: Undefined Behavior & Common Footguns →](14-undefined-behavior-and-common-footguns.md)
