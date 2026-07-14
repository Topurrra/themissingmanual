---
title: "Install, Compiling & Your First Program"
guide: "c-from-zero"
phase: 1
summary: "Install a C compiler, understand what compiling actually does (source to object code to executable), and write, compile, and run your first C program with gcc or clang."
tags: [c, gcc, clang, install, hello-world, compiling, toolchain]
difficulty: beginner
synonyms: ["how to install c compiler", "gcc vs clang", "how does compiling work", "first c program", "hello world in c", "how to compile a c file", "what is gcc", "c programming getting started"]
updated: 2026-07-14
---

# Install, Compiling & Your First Program

C is the language most other languages are built on top of, or at least built to explain themselves
against. Python's interpreter is written in C. Your operating system's kernel is written in C. When people
say a language is "fast" or "low-level," C is usually the yardstick. Learning it doesn't just teach you a
language - it teaches you what's actually happening underneath the languages you already know.

That reputation comes with a warning label: C doesn't stop you from shooting yourself in the foot. It won't
check array bounds for you, it won't garbage-collect your memory, and it will happily compile code that
crashes or does something quietly wrong. That's not this phase's problem to solve (we'll get there, all the
way through to [Phase 14: Undefined Behavior & Common Footguns](14-undefined-behavior-and-footguns.md)) -
but it's worth naming up front, because it explains why C feels different from languages you may have
tried before. You are closer to the machine here, on purpose.

This phase gets you set up: a working compiler, a real understanding of what "compiling" means, and one
program you wrote, built, and ran yourself.

## The mental model: what a compiler actually does

**What it actually is.** C is a *compiled* language. That means the code you write in a `.c` file isn't
what runs - it gets translated, ahead of time, into a separate file full of raw machine instructions that
your CPU can execute directly. The program that does this translation is called a **compiler**. Two
compilers are used everywhere: **GCC** (the GNU Compiler Collection) and **Clang** (built on LLVM). They're
different programs with the same job, and for everything in this guide either one works the same way.

This is a genuinely different model from languages you may already know. If you've used Python or
JavaScript, you're used to an *interpreter* reading your source code line by line while the program runs.
C has no such thing at runtime. By the time your program starts, the translation is already done and
finished - there's no compiler anywhere in sight, just machine code running directly on the CPU.

**Why this matters.** It's the reason C programs start instantly and run at full hardware speed: there's no
translation step happening while the program executes, because it already happened. It's also why a
compile *error* stops you cold before the program ever runs at all - the compiler is reading the whole
program up front and refusing to produce an executable if it doesn't make sense.

📝 **Terminology.** **Source code** is the `.c` file you write. **Compiling** turns source code into
**machine code** - instructions in the CPU's native language. The result is an **executable** (or
**binary**) - a file you can run directly. **GCC** and **Clang** are compilers; you'll see both names in
the wild and either is fine to learn on.

## Install a compiler

Which command to run depends on your OS.

**macOS.** Apple ships Clang through its developer tools. Open a terminal and run:

```console
$ xcode-select --install
```

A dialog will prompt you to install the "Command Line Tools." Accept it - you don't need full Xcode, just
this smaller package, and it includes `clang`, `make`, and other tools you'll use throughout this guide.

**Linux.** Install GCC through your distribution's package manager:

```console
$ sudo apt install build-essential        # Debian/Ubuntu
$ sudo dnf install gcc                    # Fedora
```

`build-essential` on Debian-based systems pulls in `gcc`, `make`, and standard headers together - the
whole toolchain in one install.

**Windows.** The simplest path is **MSYS2**, which gives you a real GCC toolchain that behaves like the
Linux/macOS one (matching the terminal examples throughout this guide). Download it from
[msys2.org](https://www.msys2.org), run the installer, then from the MSYS2 terminal it opens:

```console
$ pacman -S mingw-w64-ucrt-x86_64-gcc
```

Close that terminal and use the "MSYS2 UCRT64" terminal from your Start menu from now on - it's the one
with GCC on its `PATH`. (The alternative path, Visual Studio's `cl.exe` compiler, works too, but its
command-line flags differ from what this guide uses.)

## Confirm it worked

One command tells you the compiler is installed and reachable:

```console
$ gcc --version
gcc (Ubuntu 13.2.0-4ubuntu3) 13.2.0
```

*What just happened:* `gcc` printed its version, meaning it's installed and on your `PATH` - the list of
places your terminal looks for commands. If you installed Clang instead, run `clang --version`. Either
output is fine; what matters is you get a version number back instead of a "command not found" error.

⚠️ **Gotcha.** If you just installed and get `command not found`, close and reopen your terminal. Installers
add the compiler to your `PATH`, but a terminal window that was already open doesn't know that until it
restarts.

## Write your first program

Create a new file called `hello.c` in any folder you like, with exactly this content:

```c
#include <stdio.h>

int main(void) {
    printf("Hello, world!\n");
    return 0;
}
```

Every line here is doing real work, so let's take them one at a time before you run anything:

- **`#include <stdio.h>`** pulls in declarations for the standard input/output functions - `printf` among
  them. C's standard library isn't built into the language itself; you ask for the pieces you need. This
  gets a full phase of its own in [Phase 8: Header Files & the Preprocessor](08-header-files-and-preprocessor.md).
- **`int main(void)`** defines `main`, the one function every C program must have - it's where execution
  begins. `int` is the type of value `main` hands back to the operating system when it finishes. `void`
  here means "takes no arguments."
- **`printf("Hello, world!\n")`** prints the string, and `\n` is an escape sequence for a newline character
  - it can't be typed directly inside the quotes, so `\n` stands in for it.
- **`return 0;`** hands `0` back to the operating system, the conventional way for a program to say "I
  finished successfully." Any other number signals some kind of failure - your shell can check this after
  the program exits.

## Compile it

```console
$ gcc hello.c -o hello
```

*What just happened:* Nothing printed - and that's a good sign. `gcc` read `hello.c`, translated it to
machine code, and wrote the result to a file named `hello` (`-o hello` means "output to this filename"; if
you omit `-o`, GCC defaults to a less friendly `a.out`). Silence means the compiler had nothing to
complain about.

Look at what appeared in your folder:

```console
$ ls
hello  hello.c
```

`hello` is a new file - your executable. It's not text anymore; it's machine code, meaningless if you open
it in an editor, but exactly what your CPU needs to run the program directly.

## Run it

```console
$ ./hello
Hello, world!
```

*What just happened:* `./hello` tells your shell "run the executable named `hello` sitting right here in
this folder" (the `./` is necessary on Linux/macOS - unlike some systems, they don't automatically look in
the current folder for commands, as a deliberate safety measure). Your CPU executed the machine code
directly - no compiler involved at this step at all, because compiling already happened.

## See it catch a mistake

Compiling isn't just a formality - it's the compiler reading your entire program and refusing to produce
an executable if something's structurally wrong. Try deleting the semicolon after the `printf` line and
compiling again:

```c
#include <stdio.h>

int main(void) {
    printf("Hello, world!\n")
    return 0;
}
```

```console
$ gcc hello.c -o hello
hello.c: In function 'main':
hello.c:5:5: error: expected ';' before 'return'
    5 |     return 0;
      |     ^~~~~~
      |     ;
```

*What just happened:* No executable was written this time - the compiler caught the missing semicolon and
told you exactly where it expected one, pointing at the line right after the mistake (C error messages
often point slightly *after* the actual problem, since the compiler doesn't realize something's missing
until it hits the next token). Clang words this a little differently and points at the end of the broken
line itself (`error: expected ';' after expression`, with the caret right after the `)`) rather than the
next line, but either way the reported spot is a signpost to look near, not always the exact character.
This is worth internalizing early: a compile error means the compiler refused to guess what you meant. Put
the semicolon back before moving on.

## Two commands you'll use constantly

- **`gcc file.c -o name`** - compile `file.c` into an executable called `name`. You'll type a version of
  this every time you change your code.
- **`./name`** - run the executable you just built. On Windows with MSYS2, the same commands work
  unchanged in the UCRT64 terminal.

There's no equivalent to `cargo run` or `python file.py` here that compiles and runs in one step - in C,
compiling and running are always two separate, explicit commands. That separation is the whole model: build
the machine code once, then execute it, as many times as you like, with no compiler involved on the second
step. Once your programs grow past a single file, typing the full `gcc` command by hand gets old fast -
[Phase 9: Build Tooling](09-build-tooling-makefiles-and-debugging.md) shows you how to automate it.

## Recap

1. **C is compiled, not interpreted** - your `.c` source gets translated ahead of time into machine code by
   a compiler (GCC or Clang), producing an executable that runs directly on the CPU.
2. **Install** the compiler for your OS: Xcode Command Line Tools (macOS), `build-essential` (Linux), or
   MSYS2 (Windows).
3. **`gcc file.c -o name`** compiles; **`./name`** runs the result. Two separate steps, always.
4. **`#include`** pulls in library declarations; **`main`** is where every C program starts; **`return 0`**
   signals success to the operating system.
5. A compile error means the compiler found something structurally wrong and refused to guess - read it as
   a pointer to exactly where to look, even if it points slightly after the real mistake.

You have a working compiler and a program you wrote, built, and ran by hand. Next: what those pieces inside
`main` actually are - variables, C's types, and how they differ from what you may already know.

## Quick check

Test yourself on the idea that separates C from languages you may already know - that compiling and running
are two distinct steps, not one:

```quiz
[
  {
    "q": "You're used to running Python with `python file.py`. Why doesn't C have an equivalent single command that runs a `.c` file directly?",
    "choices": [
      "C source is translated into machine code by the compiler ahead of time, so by the time the program runs there's no interpreter left to hand source code to",
      "C compilers are too slow to run a program immediately after reading it",
      "C programs don't have a `main` function to start from",
      "gcc requires an internet connection to execute a program"
    ],
    "answer": 0,
    "explain": "An interpreter reads and runs source line by line as the program executes; C's translation already happened before the program starts, so compiling and running are always two separate, explicit commands."
  },
  {
    "q": "You run `gcc hello.c -o hello` and nothing prints to the terminal. What does that silence mean?",
    "choices": [
      "The compile failed silently and no executable was written",
      "The compiler succeeded - it only prints when it has something to complain about",
      "The compiler is still working and you need to wait longer",
      "You forgot to add a flag that makes gcc report success"
    ],
    "answer": 1,
    "explain": "gcc has nothing to say when a compile goes fine; silence is the normal, successful outcome, and the new executable file is the proof it worked."
  },
  {
    "q": "You delete a semicolon and the compiler points its error at the line *after* the one you broke. What does that tell you about reading C compile errors?",
    "choices": [
      "The compiler is unreliable and often blames the wrong line",
      "The compiler doesn't realize a required token is missing until it reaches the next one, so the reported line can land just past the real mistake",
      "Only the last line of a file can ever contain an error",
      "The error means the file wasn't saved before compiling"
    ],
    "answer": 1,
    "explain": "The compiler reads forward and only notices something's missing once it hits the next token, so treat the reported line as a pointer to look near, not always the exact spot."
  }
]
```

---

[← Guide overview](_guide.md) · [Phase 2: Syntax, Variables & Types →](02-syntax-variables-and-types.md)
