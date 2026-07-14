---
title: "Functions, Overloading & Default Arguments"
guide: "cpp-from-zero"
phase: 4
summary: "How C++ functions go beyond C's one-name-one-signature rule: overloading lets several functions share a name, and default arguments let a single function cover several call shapes - so what does the compiler actually do to pick the right one?"
tags: [cpp, functions, overloading, default-arguments, overload-resolution]
difficulty: beginner
synonyms: ["c++ function overloading", "c++ default arguments", "overload resolution c++", "how does c++ pick which overload to call", "c++ function overloading vs templates", "why can c not overload functions", "ambiguous overload c++", "default parameter rules c++"]
updated: 2026-07-14
---
# Functions, Overloading & Default Arguments

In C, a function name is a single, unique thing. You can only ever have one `area`. If you need to compute
area for an `int` rectangle and a `double` rectangle, you write two functions with two names -
`area_int` and `area_double` - because the linker resolves function calls by name alone, and it will
reject two functions sharing one. [C From Zero's phase on functions](/guides/c-from-zero/04-functions-and-program-structure)
covers that world: one name, one signature, forever.

C++ throws that restriction out. **A function name in C++ is not required to be unique - the *signature*
is what has to be unique.** You can write several functions called `area`, as long as each one takes a
different set of parameter types, and the compiler will figure out which one you meant at every call site.
This is called **overloading**, and it's the first genuinely new idea in this guide (phase 2 covered syntax
changes; this is a change in what the *language* lets you express). Understanding *how* the compiler
decides which overload to run - not just that it can - is the actual goal of this phase, because get it
wrong and you'll be staring at call sites wondering why the "obviously correct" function didn't run.

## Overloading: same name, different job

Here's the motivating example, rewritten from the two-function C version into one overloaded C++ name:

```cpp
#include <iostream>

int area(int width, int height) {
    return width * height;
}

double area(double width, double height) {
    return width * height;
}

int main() {
    std::cout << area(3, 4) << "\n";        // calls the int version -> 12
    std::cout << area(3.5, 4.0) << "\n";    // calls the double version -> 14
}
```

Both functions are named `area`. The compiler looks at the *types of the arguments you passed* and picks
the function whose parameter types match best. `area(3, 4)` passes two `int`s, so it calls the `int`
overload. `area(3.5, 4.0)` passes two `double`s, so it calls the `double` overload. You never wrote
`area_int` or `area_double` - one name, two jobs, and the call site reads naturally either way.

📝 **Terminology.** The **signature** of a function is its name plus its parameter types (the return type
does *not* count - you cannot overload two functions that differ only in return type). Overloading means:
same name, different signature. The compiler tells overloads apart internally through **name mangling** -
it encodes the parameter types into the symbol the linker actually sees, so `area(int,int)` and
`area(double,double)` become two distinct linker symbols even though your source code spells them the
same way. That's the mechanism C's linker lacks, and why C can't do this.

## How the compiler picks: overload resolution

When you call an overloaded function, the compiler runs a process called **overload resolution**. For
each candidate function with that name, it checks whether your arguments could work, and ranks how good
the match is. Roughly, from best to worst:

1. **Exact match** - the argument type is already exactly the parameter type (or a trivial reference/const
   adjustment).
2. **Promotion** - a small, "safe" widening, like `char` to `int` or `float` to `double`.
3. **Conversion** - anything else the compiler is willing to do implicitly, like `int` to `double`.

The compiler picks the candidate with the best rank. If two candidates tie for best, or none of them are
viable, you get a compile error instead of a guess - C++ never silently picks a "close enough" overload
when it's genuinely unsure.

```cpp
void show(int x)    { std::cout << "int: " << x << "\n"; }
void show(double x) { std::cout << "double: " << x << "\n"; }

int main() {
    show(5);      // exact match on int -> "int: 5"
    show(5.0);    // exact match on double -> "double: 5"
    show(5.0f);   // float -> promotes to double (no float overload exists) -> "double: 5"
    // show('a');    // char -> promotes to int -> "int: 97" would compile
}
```

⚠️ **The ambiguous call trap.** `show(5.0f)` above resolves cleanly because float-to-double is a
promotion, and a promotion outranks any conversion. But some calls have no single best match. Using the
same two overloads, `show(5L)` - passing a `long` - is ambiguous: `long`-to-`int` and `long`-to-`double`
are both *conversions* of equal rank, so neither overload is better than the other, and the compiler
refuses to guess:

```console
error: call of overloaded 'show(long int)' is ambiguous
```

The fix is never to hope the compiler picks right - it's to either add the exact overload you need
(`show(long)`), or cast explicitly at the call site (`show(static_cast<int>(x))`) so there's only one
possible match. Ambiguity errors are the compiler refusing to gamble with your intent; read them as "you
need to be more specific," not as a bug in the compiler.

💡 **Key point.** Overload resolution looks only at parameter *types*, never at what the function *does*
or what name would read best to a human. Two overloads that do wildly different things but happen to share
a name and similar-looking parameter types is a trap you set for future readers (including future you).
Reserve overloading for functions that do conceptually the *same* thing on different types - like `area`
above, or `std::max(int,int)` and `std::max(double,double)` in the standard library - not for unrelated
operations that happen to want the same verb.

## Default arguments: one function, several call shapes

C++ also lets a function supply a default value for trailing parameters, so callers can omit them:

```cpp
#include <iostream>

void greet(std::string name, std::string greeting = "Hello") {
    std::cout << greeting << ", " << name << "!\n";
}

int main() {
    greet("Ava");                 // "Hello, Ava!"
    greet("Ava", "Good morning"); // "Good morning, Ava!"
}
```

`greeting` has a default, so `greet("Ava")` is really `greet("Ava", "Hello")` with the second argument
filled in for you. This is a lighter-weight alternative to overloading when the "extra" version of a
function isn't a different *type* of parameter, just an optional one - notice we didn't need to write a
second `greet` function that hard-codes `"Hello"`.

Two rules govern default arguments, and both exist to keep a call site unambiguous:

- **Defaults must be trailing.** Once a parameter has a default, every parameter after it must have one
  too. `void f(int a = 1, int b)` does not compile - the compiler couldn't tell, in `f(5)`, whether `5` was
  meant for `a` or `b` if `a` were allowed to be skipped instead.
- **Declare the default once.** If a function has both a declaration (say, in a header) and a definition,
  the default argument goes in the declaration the caller actually sees - usually the header - not in
  both places with (potentially) different values.

```cpp
// header
void log_message(const std::string& text, int level = 1);

// source file - no default repeated here
void log_message(const std::string& text, int level) {
    std::cout << "[" << level << "] " << text << "\n";
}
```

⚠️ **Overloading + defaults can collide.** If you overload `log_message(const std::string&)` *and* give
`log_message(const std::string&, int level = 1)` a default, then `log_message("hi")` becomes ambiguous -
both candidates can satisfy that call with zero extra arguments. Pick one mechanism per situation: use
overloading when the parameter *types* genuinely differ, use a default argument when you just want to make
one trailing parameter optional. Mixing both for the same gap invites exactly this kind of collision.

## How arguments actually get passed

One more piece belongs here before the next phase goes deep on it: by default, C++ function parameters are
**passed by value**, exactly like C - the function gets its own copy, and changes inside the function don't
touch the caller's variable. That's unchanged from C. What *is* new is that C++ also gives you **references**
(`std::string&` instead of `std::string`) as a cleaner alternative to C's pointer-based "pass a pointer so the
function can modify the original." You saw a reference parameter above (`const std::string& text`) without
it being explained - that's deliberate; [Phase 5: References vs Pointers](05-references-vs-pointers.md) is
entirely about what that `&` means and why C++ programmers reach for it constantly.

## Recap

1. **Overloading:** several functions can share a name in C++ as long as their parameter types (their
   *signature*) differ - impossible in C, where the linker needs one name per function.
2. **Overload resolution** ranks candidates by how well argument types match: exact match beats promotion
   beats conversion; ties or no viable match are compile errors, not guesses.
3. **Ambiguous calls** happen when two overloads become equally good matches - fix them by adding the exact
   overload needed or casting explicitly at the call site, never by hoping the compiler picks right.
4. **Default arguments** let trailing parameters be optional (`greeting = "Hello"`); defaults must be
   trailing, and are declared once, in the declaration the caller sees.
5. Don't mix overloading and default arguments to cover the same gap in parameter count - it's a classic
   way to make a call site ambiguous.
6. Parameters are still passed by value like C by default; C++'s `&` reference parameters are the modern
   alternative to C's pointer-passing trick, covered fully next phase.

## Quick check

Test yourself on the idea that makes this phase click - what actually makes two overloads distinct, and how the compiler breaks ties:

```quiz
[
  {
    "q": "You write `int area(int w, int h)` and `double area(int w, int h)` - same parameters, different return type. What happens?",
    "choices": [
      "It compiles fine - the compiler picks whichever version the caller assigns the result to",
      "It fails to compile - return type alone doesn't make a valid overload, only the parameter types (the signature) do",
      "It compiles, but only the `int` version is ever callable"
    ],
    "answer": 1,
    "explain": "The signature is name plus parameter types; return type isn't part of it, so two functions differing only in return type are a duplicate definition, not an overload."
  },
  {
    "q": "Given `void show(int x)` and `void show(double x)`, what does `show(5.0f)` call?",
    "choices": [
      "show(int) - the float gets truncated to fit",
      "show(double) - float to double is a promotion, which ranks better than a conversion to int",
      "Neither - a plain float argument is always a compile error"
    ],
    "answer": 1,
    "explain": "float to double is a promotion (safe widening), which beats the conversion float would need to become int, so overload resolution picks show(double)."
  },
  {
    "q": "Which of these default-argument declarations fails to compile?",
    "choices": [
      "void f(int a, int b = 1)",
      "void f(int a = 1, int b)",
      "void f(int a = 1, int b = 2)"
    ],
    "answer": 1,
    "explain": "Defaults must be trailing - once a parameter has a default, every parameter after it needs one too, otherwise a call like f(5) couldn't tell if 5 was meant for a or b."
  }
]
```

---

[← Phase 3: Types, Variables & Control Flow](03-types-variables-and-control-flow.md) · [Phase 5: References vs Pointers →](05-references-vs-pointers.md)
