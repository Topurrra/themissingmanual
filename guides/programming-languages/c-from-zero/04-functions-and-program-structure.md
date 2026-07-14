---
title: "Functions & Program Structure"
guide: "c-from-zero"
phase: 4
summary: "How do you break a C program into pieces, and why does C insist you declare a function before you can call it?"
tags: [c, functions, pass-by-value, function-prototypes, program-structure, scope]
difficulty: beginner
synonyms: ["c function syntax", "how to write a function in c", "c pass by value explained", "c function prototype vs definition", "implicit declaration of function warning", "c function return type", "structuring a c program", "c function parameters copy"]
updated: 2026-07-14
---
# Functions & Program Structure

You've already written functions without calling them that - `main` is one. Phase 3 gave you the tools to make decisions and repeat work *inside* a function. This phase is about the next size up: how you split a program into named, reusable pieces, and one C-specific rule that trips up almost everyone coming from a language that doesn't have it - **C reads your file top to bottom, and it needs to know a function exists before you call it.**

## What a function actually is

**What it actually is.** A function is a named block of code with its own tiny workspace: a set of parameters it receives, local variables that live only while it runs, and (usually) a value it hands back when it's done. Calling a function is a detour - your program jumps to the function's code, runs it, and jumps back to right after the call, carrying the return value with it.

**Why this exists.** Without functions, every program is one long list of instructions, and any logic you need twice you have to retype twice - and fix twice when it has a bug. A function names a piece of logic once. From then on you refer to the *name*, not the mechanics, which is exactly what "goes to the store" means to you without re-explaining what a store is.

Here's the shape:

```c
return_type function_name(parameter_type parameter_name, ...) {
    // body
    return value;   // only if return_type isn't void
}
```

A concrete one:

```c
int square(int n) {
    return n * n;
}
```

Read that signature like a sentence: "`square` takes an `int` named `n`, and gives back an `int`." The name, the inputs, and the output are all part of the contract - anyone calling `square` knows exactly what to hand it and what they'll get.

## Declaring, defining, and calling

In C, "declaring" a function (telling the compiler it exists and what its signature is) and "defining" it (writing its body) are two different things that are easy to conflate at first. The version above is a **definition** - it has a body, so it's both a declaration and a definition at once.

To *use* a function, you call it by name with arguments in parentheses:

```c
#include <stdio.h>

int square(int n) {
    return n * n;
}

int main(void) {
    int result = square(5);
    printf("%d\n", result);   // 25
    return 0;
}
```
```console
$ gcc squares.c -o squares && ./squares
25
```

*What just happened:* `square(5)` jumped into `square` with `n` set to `5`, ran `return n * n;`, and handed `25` back to the spot that called it. `result` now holds `25`, just like any other `int`.

## Parameters are copies: pass by value

**What it actually is.** When you call `square(5)`, C doesn't hand `square` a live connection to whatever variable you passed - it copies the value into `n`. `n` is a brand-new local variable that happens to start with the same value. Anything `square` does to `n` has zero effect on the caller's variable.

**Why this matters.** This is the single most common surprise for beginners, so let's watch it happen:

```c
#include <stdio.h>

void try_to_double(int x) {
    x = x * 2;
    printf("inside try_to_double: x = %d\n", x);
}

int main(void) {
    int num = 10;
    try_to_double(num);
    printf("back in main: num = %d\n", num);
    return 0;
}
```
```console
$ gcc double.c -o double && ./double
inside try_to_double: x = 20
back in main: num = 10
```

*What just happened:* `x` inside `try_to_double` is a completely separate variable from `num`. Doubling `x` doubles `x` - `num` back in `main` never even knew the function ran. This is **pass by value**: every argument you pass to a C function is copied.

This isn't a limitation you have to route around forever - it's the rule that makes reading code predictable: a function can never surprise you by silently rewriting a variable you passed it, unless you explicitly hand it a pointer to that variable. That's exactly what Phase 5 (Pointers I) is about, and this is precisely the problem pointers solve. File that feeling away - you'll want it back in one phase.

## Return values, and functions that return nothing

A function returns at most **one** value, and its type has to match the `return_type` in the signature:

```c
double average(int a, int b) {
    return (a + b) / 2.0;
}
```

If a function doesn't hand anything back - it just does something, like printing - its return type is `void`:

```c
void greet(const char *name) {
    printf("Hello, %s!\n", name);
    // no return statement needed, or a bare `return;` to exit early
}
```

`void` isn't "nothing happened" - it's the type-level promise "don't try to use this call as a value," which is why `int x = greet("Sam");` won't compile.

## The rule that catches everyone: declare before you call

C reads your file top to bottom. When it reaches a function call, it needs to already know that function's signature - what it returns, what it takes - to check your call is correct. If `main` is at the top of your file and it calls a function defined further down, the compiler hasn't seen that function yet:

```c
#include <stdio.h>

int main(void) {
    printf("%d\n", square(5));   // square isn't known yet!
    return 0;
}

int square(int n) {
    return n * n;
}
```

Older compilers would silently guess and often get it wrong; modern `gcc`/`clang` reject this outright:

```console
$ clang oops.c -o oops
oops.c:4:20: error: call to undeclared function 'square'; ISO C99 and later do not
support implicit function declarations [-Wimplicit-function-declaration]
    4 |     printf("%d\n", square(5));
      |                    ^
```

The fix is a **function prototype**: the signature alone, with a semicolon instead of a body, placed above where it's first used. It's a promise to the compiler that the full definition is coming:

```c
#include <stdio.h>

int square(int n);   // prototype: "trust me, this exists"

int main(void) {
    printf("%d\n", square(5));   // now the compiler can check the call
    return 0;
}

int square(int n) {              // the real definition, anywhere after
    return n * n;
}
```

This single rule is *why* C programs get structured the way they do: put `main` last (it usually calls everything else), or put prototypes up top so order stops mattering. Phase 8 (Header Files & the Preprocessor) takes this further - it shows you how prototypes get collected into `.h` files so multiple `.c` files can share them, which is how real C programs are organized across files instead of one giant one.

## Structuring a small program

Put it together and a real pattern emerges: `main` becomes a short list of calls to well-named functions, and the details live inside each one.

```c
#include <stdio.h>

int square(int n);
int cube(int n);
void print_result(const char *label, int value);

int main(void) {
    int n = 4;
    print_result("square", square(n));
    print_result("cube", cube(n));
    return 0;
}

int square(int n) {
    return n * n;
}

int cube(int n) {
    return n * n * n;
}

void print_result(const char *label, int value) {
    printf("%s is %d\n", label, value);
}
```
```console
$ gcc shapes.c -o shapes && ./shapes
square is 16
cube is 64
```

*What just happened:* the prototypes at the top let `main` call functions defined below it. Reading `main` now reads like a summary of the program - "compute the square, print it; compute the cube, print it" - and each function's own logic is off doing one clear job. This is the shape almost every C program grows into: small functions, a `main` that orchestrates them, and prototypes bridging the gap between "where it's used" and "where it's defined."

## Recap

1. A function packages a name, parameters, and (usually) a return type around a block of code you can call from anywhere.
2. **C passes arguments by value** - every argument is copied into the function's local parameter; changes inside a function never reach the caller's variable. Pointers (Phase 5) are how you opt out of this on purpose.
3. `void` marks a function that returns nothing; a return type otherwise has to match what you actually `return`.
4. **C compiles top to bottom** and needs a function's signature before you call it - a **prototype** (`int square(int n);`) declares it early so the definition can live anywhere after.
5. Real C programs read like a short `main` calling well-named helper functions, with prototypes up top making the call order independent of the definition order.

## Quick check

Test yourself on the two ideas that trip people up most: what a function call actually copies, and why order matters when C reads your file.

```quiz
[
  {
    "q": "In `try_to_double(num)`, the function doubles its parameter `x` but `num` back in `main` is unchanged. Why?",
    "choices": [
      "`x` is a separate local variable that started with a copy of `num`'s value - changing `x` never touches `num`",
      "`try_to_double` has a bug and forgot to return the new value",
      "`num` is declared `const`, so it can't be changed",
      "C only copies values for `int`, not for other types"
    ],
    "answer": 0,
    "explain": "C passes arguments by value: every call copies the argument into the parameter, so the function works on its own private variable."
  },
  {
    "q": "A `main` at the top of the file calls `square(5)`, but `square` is defined further down with no prototype above `main`. What happens?",
    "choices": [
      "The compiler rejects it - it hasn't seen `square`'s signature yet and can't check the call",
      "It compiles and runs fine, since C looks through the whole file before running anything",
      "It compiles but crashes at runtime when `square` is reached",
      "It only fails if `square` returns something other than `int`"
    ],
    "answer": 0,
    "explain": "C reads your file top to bottom, so a function's signature (a prototype or full definition) has to appear before any call to it."
  },
  {
    "q": "What does declaring a function `void` actually promise?",
    "choices": [
      "That the function returns nothing, so its call can't be used as a value",
      "That the function takes no parameters",
      "That the function ran successfully with no errors",
      "That the function is faster than one with a return type"
    ],
    "answer": 0,
    "explain": "`void` is a type-level statement about the return: there is no value to hand back, so `int x = greet(...);` won't compile."
  }
]
```

---

[← Phase 3: Control Flow](03-control-flow.md) · [Phase 5: Pointers I - The Mental Model →](05-pointers-i-the-mental-model.md)
