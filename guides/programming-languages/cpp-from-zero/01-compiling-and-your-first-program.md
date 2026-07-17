---
title: "Compiling & Your First Program"
guide: "cpp-from-zero"
phase: 1
summary: "What actually happens when you turn C++ source into a running program, and how to compile and run your first one."
tags: [cpp, beginner, compiling, toolchain, hello-world, getting-started]
difficulty: beginner
synonyms: ["how to compile c++", "learn c++ from scratch", "c++ hello world", "g++ vs clang", "how does c++ compilation work", "c++ for beginners", "install c++ compiler", "what is a compiler", "c++ from zero"]
updated: 2026-07-14
---
# Compiling & Your First Program

**What it actually is.** C++ is a *compiled* language: before your program can run, a separate program called a compiler translates your `.cpp` source file into machine code your CPU can execute directly. That's different from a language like Python or JavaScript, where an interpreter reads your source and executes it line by line, on the fly, every time you run it. In C++, that translation happens once, ahead of time, and produces a standalone executable file. Run it a thousand times and the compiler never runs again - you're just launching the machine code that was already built.

**Why this exists.** C++ was designed to get out of the way between your code and the hardware. Compiling ahead of time means the CPU never waits on an interpreter to figure out what your code means - it just runs the instructions. That's most of why C++ programs start instantly and run fast: the thinking about *what your code does* happened once, at compile time, not every time the program runs.

This trade shows up immediately once you write code: a compiled language can catch a whole category of mistakes - like a misspelled type or a function called with the wrong number of arguments - *before your program ever runs*, because the compiler has to fully understand your code's structure just to translate it. An interpreter often doesn't discover the same mistake until it stumbles onto that exact line while running. You'll feel this the first time the compiler refuses to build something that "looks fine" - it's not being difficult, it's catching a bug for free.

## Getting a compiler

You need a C++ compiler and, later, a build tool, but for this phase just the compiler. Pick based on your OS:

- **Linux:** `g++` is usually preinstalled or one `apt install build-essential` away.
- **macOS:** install Xcode Command Line Tools (`xcode-select --install`), which gives you `clang++`.
- **Windows:** install [MSYS2](https://www.msys2.org/) for `g++`, or Visual Studio's "Desktop development with C++" workload for MSVC's `cl`. This guide uses `g++`-style commands; the ideas transfer directly to any compiler.

Check it's there:

```console
$ g++ --version
g++ (GCC) 15.1.0
```

If that prints a version number, you're set. If it says "command not found," the install didn't put the compiler on your `PATH` - worth fixing before moving on, since every phase from here assumes a working compiler.

## Your first program

Create a file named `main.cpp`:

```cpp
#include <iostream>

int main() {
    std::cout << "Hello, C++!" << std::endl;
    return 0;
}
```

Compile and run it:

```console
$ g++ main.cpp -o hello -std=c++20
$ ./hello
Hello, C++!
```

*What just happened:* `g++ main.cpp -o hello` told the compiler "read `main.cpp`, produce an executable named `hello`." `-std=c++20` tells it which version of the C++ standard to compile against (more on why that matters in a moment). Nothing printed during compilation because nothing went wrong - a silent compile is a successful one. Then `./hello` actually ran the machine code that got produced.

Let's take the program apart line by line, because every piece here is a concept you'll use in every C++ file you ever write:

- **`#include <iostream>`** pulls in the declarations for input/output facilities - specifically `std::cout`, the object you write text to. C++ doesn't build I/O into the language itself; it's a library, and you have to explicitly ask for it. This line runs *before* compilation proper, in a step called preprocessing (more below).
- **`int main()`** is the function every C++ program starts running from. Returning `int` is how your program reports its exit status to whatever launched it - `0` conventionally means "everything succeeded." If you omit `return 0;` from `main` specifically, the compiler inserts it for you (a special-case rule that applies only to `main`), but writing it explicitly is good habit and required in every other function.
- **`std::cout << "Hello, C++!" << std::endl;`** writes text to standard output. `std::cout` is an object representing "the console"; `<<` is the *stream insertion operator*, read as "send this into that stream." `std::endl` sends a newline and flushes the output buffer. The `std::` prefix means "look inside the `std` namespace" - the container that holds everything the C++ standard library provides, keeping its names from colliding with yours. You'll see `std::` constantly; namespaces are how C++ avoids everyone's `vector` or `string` clashing with everyone else's.

## What the compiler actually does to your file

Knowing the four stages makes compiler errors far less mysterious, because each stage fails in its own recognizable way:

1. **Preprocessing.** Lines starting with `#`, like `#include`, run first and are pure text substitution - `#include <iostream>` literally pastes the contents of the `iostream` header into your file before anything else happens. There's no C++ understanding here yet, just text manipulation.
2. **Compiling.** The preprocessed text is parsed, type-checked, and turned into assembly/object code for one file at a time. This is where "cannot convert `int` to `std::string`"-style errors come from - the compiler now understands your code's meaning, not just its text.
3. **Assembling.** The assembly output is turned into an object file (`.o` on Linux/macOS, `.obj` on Windows) - machine code, but not yet a runnable program.
4. **Linking.** The linker stitches your object file(s) together with the library code they depend on (like the implementation of `std::cout`) into one final executable. This is where "undefined reference to `foo`" errors come from: the compiler understood a name existed, but nothing anywhere actually defines it.

For now, `g++ main.cpp -o hello` runs all four stages in one command. Once programs span multiple files (phase 5 territory in most guides, but not this one), you'll separate compiling and linking into distinct steps - but the four stages are always happening, whether you see them or not.

## Which standard version, and why it matters

That `-std=c++20` flag matters more than it looks. C++ isn't one fixed language - it's revised by an international standards committee roughly every three years (C++11, 14, 17, 20, 23...), and each revision adds real language features, not just library additions. Leave the flag off and your compiler silently falls back to whatever its own default is, which varies by compiler and version - a common source of "it compiles on my machine but not yours." Pick a standard explicitly and stay consistent across a project. This guide targets C++17/20 idioms throughout, so `-std=c++20` (or `-std=c++17` if your compiler is older) is a safe default to reach for from here on.

## A worked example: reading input

One more small program, this time reading from the user, since almost everything you build will need to:

```cpp
#include <iostream>
#include <string>

int main() {
    std::string name;
    std::cout << "What's your name? ";
    std::cin >> name;
    std::cout << "Hello, " << name << "!" << std::endl;
    return 0;
}
```

```console
$ g++ main.cpp -o greet -std=c++20
$ ./greet
What's your name? Ada
Hello, Ada!
```

*What just happened:* `std::cin` is the input counterpart to `std::cout` - `>>`, the *stream extraction operator*, pulls a value out of it into `name`. `std::cin >> name` reads one whitespace-delimited "word" at a time; type `Ada Lovelace` and `name` would only capture `Ada`. That's not a bug to work around yet - just something to notice, because it'll matter once you're reading full lines in a later phase.

## Two errors you'll definitely see soon

Recognizing these now saves you a confused afternoon later:

```console
$ g++ main.cpp -o hello -std=c++20
main.cpp:2:10: error: 'cout' is not a member of 'std'
    std::cout << "Hello, C++!" << std::endl;
         ^
```
This means you forgot `#include <iostream>` - the compiler has no idea what `std::cout` is because you never asked for its declaration.

```console
$ g++ main.cpp -o hello -std=c++20
main.cpp:4:44: error: expected ';' before 'return'
```
A missing semicolon. C++ statements end with `;`. Notice the error *names* `return` - the next statement - even though the fix belongs on the line above: the compiler only noticed the missing `;` once it reached the following token. When an error points at a token that looks perfectly fine, suspect the end of the line just before it.

## Recap

1. C++ compiles ahead of time into a standalone executable - no interpreter runs your program, which is a big part of why it's fast and catches errors before runtime.
2. Compilation is four stages: preprocessing (text substitution), compiling (parsing + type-checking), assembling (machine code), and linking (stitching in library code) - most compiler errors map cleanly onto one of these.
3. `#include`, `std::`, `std::cout`/`std::cin`, and `main`'s `return 0` are the five things every C++ file has, and now you know what each one is actually doing.
4. Always pick a `-std=` flag explicitly instead of trusting your compiler's default.

Compiling ahead of time is only half the story of why C++ feels so different from languages you may already know. The bigger half is what phase 2 covers: C++ isn't "C plus some extra syntax" - it's a genuinely different way of thinking about programs, built around objects and RAII instead of just functions and manual memory management.

### Check yourself

Test yourself on the ideas this phase depends on - what compiling ahead of time actually buys you, and where in the pipeline different errors come from:

```quiz
[
  {
    "q": "Why does a C++ program you've already compiled start up faster than an equivalent script run by an interpreter?",
    "choices": [
      "The compiler already turned the source into machine code once, so running it is just executing instructions, not translating them on the fly",
      "Compiled executables are always smaller files than source code",
      "C++ programs don't use a CPU the way interpreted languages do",
      "The compiler removes all function calls before producing the executable"
    ],
    "answer": 0,
    "explain": "Compiling is a one-time translation step; every later run just executes the already-produced machine code, with no translation work happening at run time."
  },
  {
    "q": "You get `error: 'cout' is not a member of 'std'`. Which stage caught this, and what does that tell you?",
    "choices": [
      "Compiling - the compiler understood your code's structure well enough to know `std::cout` was never declared, most likely a missing `#include <iostream>`",
      "Preprocessing - `#include` lines are checked for typos before anything else runs",
      "Linking - the executable was built but couldn't find the `cout` symbol at load time",
      "Assembling - the assembler doesn't recognize `cout` as valid machine code"
    ],
    "answer": 0,
    "explain": "This is a compiling-stage error: the compiler knows what `std::cout` would mean but never saw it declared, which almost always means the `#include` that provides it is missing."
  },
  {
    "q": "You leave off the `-std=` flag entirely. What actually happens?",
    "choices": [
      "The compiler silently falls back to whatever its own default standard version is, which can differ across compilers and versions",
      "Compilation fails immediately with an error demanding a standard version",
      "The compiler automatically detects and uses the newest C++ standard it supports",
      "It compiles as plain C instead of C++"
    ],
    "answer": 0,
    "explain": "Without an explicit `-std=`, you get whatever default your specific compiler ships with - a common source of code that compiles on one machine but not another."
  }
]
```

---

[Phase 2: From C to C++: What Changed →](02-from-c-to-c-what-changed.md)
