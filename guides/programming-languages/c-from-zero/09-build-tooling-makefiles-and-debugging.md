---
title: "Build Tooling: Makefiles & Debugging"
guide: "c-from-zero"
phase: 9
summary: "How do real C projects build without retyping a giant gcc command every time, and how do you find a bug when printf isn't enough? Makefiles automate the build; a debugger like gdb lets you pause a running program and look inside it."
tags: [c, make, makefile, gdb, debugging, build-tools, compiler-flags, tooling]
difficulty: intermediate
synonyms: ["how to write a makefile", "makefile explained", "why use make instead of gcc", "c debugging with gdb", "gdb tutorial for beginners", "gdb breakpoints example", "compiling multiple c files together", "makefile dependencies explained", "how to debug a segfault in c", "gcc -g flag what does it do"]
updated: 2026-07-14
---
# Build Tooling: Makefiles & Debugging

So far every program in this guide has been one file, compiled with one `gcc` command you typed by hand. That works for a fifty-line program. It stops working the moment your project has ten source files, each depending on a couple of headers, and you're tired of remembering the exact incantation - which files to list, which flags, which order - every single time you change one line.

It also stops working the moment a bug doesn't show itself through `printf`. You've been debugging by scattering print statements through your code, rebuilding, and staring at the output. That's a real technique and you'll use it forever, but it has a ceiling: it only shows you what you thought to print, at the moment you thought to print it. Sometimes you need to pause the program mid-crash and actually look around.

This phase covers both, because they're really the same problem: **you've outgrown typing raw commands, and you need better tools than your eyes.**

## What `make` actually is

**The mental model.** A Makefile is a list of *targets* - things you want to produce - each with the *files it depends on* and the *shell commands that produce it*. When you run `make`, it doesn't blindly rebuild everything. It checks file timestamps: if a target's output already exists and is newer than everything it depends on, `make` skips it. Change one `.c` file, and `make` recompiles only that file (and re-links), not the whole project. That's the entire value proposition: **stop rebuilding what hasn't changed, and stop retyping what you already told the computer once.**

Here's the shape of a rule:

```makefile
target: dependencies
	command
```

That indentation before `command` **must be a real tab character**, not spaces. This is the single most common reason a Makefile mysteriously fails - `make: *** missing separator. Stop.` means you typed spaces where `make` demands a tab.

A minimal Makefile for a small project:

```makefile
CC = gcc
CFLAGS = -Wall -Wextra -g

myapp: main.o helpers.o
	$(CC) $(CFLAGS) -o myapp main.o helpers.o

main.o: main.c helpers.h
	$(CC) $(CFLAGS) -c main.c

helpers.o: helpers.c helpers.h
	$(CC) $(CFLAGS) -c helpers.c

clean:
	rm -f myapp main.o helpers.o
```

*What just happened:* `myapp` depends on two `.o` files; each `.o` depends on its `.c` file and the shared header. Run `make` and it builds bottom-up: compile `main.c` to `main.o`, compile `helpers.c` to `helpers.o`, link both into `myapp`. Edit only `helpers.c` and run `make` again - it recompiles `helpers.o` and re-links, but leaves `main.o` alone, because `main.c` didn't change. `clean` is a target with no real output file; it's just a name for "run this command," which is why it's called a *phony* target.

```console
$ make
gcc -Wall -Wextra -g -c main.c
gcc -Wall -Wextra -g -c helpers.c
gcc -Wall -Wextra -g -o myapp main.o helpers.o
$ make
make: 'myapp' is up to date.
$ touch helpers.c
$ make
gcc -Wall -Wextra -g -c helpers.c
gcc -Wall -Wextra -g -o myapp main.o helpers.o
```

`CC` and `CFLAGS` are variables - by convention `CC` is the compiler and `CFLAGS` the flags, and `make` treats them specially, but you're free to add your own. The two flags in `CFLAGS` here matter enough to call out on their own:

- **`-Wall -Wextra`**: turns on a broad set of the compiler's most useful warnings (not literally all of them - flags like `-Wconversion` and `-Wshadow` stay off unless you ask). C will happily compile code with a use-before-init, a mismatched type, or a comparison that can never be true - warnings catch these *before* they become the kind of bug you spend an afternoon hunting. Treat warnings as bugs waiting to happen. Real projects often add `-Werror` too, which turns every warning into a hard build failure.
- **`-g`**: embeds debug information (variable names, line numbers) into the binary. Without it, a debugger can only show you raw memory addresses. With it, a debugger can show you `x = 12` on `main.c:7`. You want `-g` on every build until you ship.

For anything past a toy project, people reach for [CMake](https://cmake.org) instead of hand-writing Makefiles - it generates the actual build files for you and handles cross-platform quirks Make doesn't. But CMake generates *a* Makefile under the hood, so understanding targets and dependencies here is what makes CMake's output legible later, not wasted effort.

## What a debugger actually is

**The mental model.** A debugger doesn't run your program differently - it runs the exact same binary, but it can *pause* it at any instruction, show you the value of every variable at that instant, and let you step forward one line at a time. `printf` debugging asks you to guess in advance what you'll need to know. A debugger lets you ask questions *after* the program is already broken, while it's still broken, instead of rebuilding and re-guessing.

The standard C debugger on Linux is **gdb**; on macOS you'll more often reach for **lldb**, which has near-identical commands. Compile with `-g`, then:

```console
$ gcc -g -Wall -Wextra -o myapp main.c
$ gdb ./myapp
```

Inside gdb, the moves you'll use constantly:

| Command | What it does |
|---|---|
| `break main.c:12` | Set a breakpoint - pause execution right before line 12 runs |
| `run` | Start the program (stops at the first breakpoint it hits) |
| `next` | Run the current line, step *over* function calls |
| `step` | Run the current line, step *into* function calls |
| `print x` | Show the current value of variable `x` |
| `backtrace` | Show the call stack - which function called which, all the way up |
| `continue` | Resume running until the next breakpoint or exit |

Say you have a function that computes a bad value somewhere in a loop:

```c
int sum_squares(int *arr, int n) {
    int total = 0;
    for (int i = 0; i <= n; i++) {   // bug: should be i < n
        total += arr[i] * arr[i];
    }
    return total;
}
```

Instead of guessing where it goes wrong, you'd set a breakpoint inside the loop and watch `i` and `arr[i]` on each pass:

```console
(gdb) break 4
(gdb) run
(gdb) print i
$1 = 0
(gdb) print arr[i]
$2 = 3
(gdb) continue
...
(gdb) print i
$3 = 5
```

When `i` reaches `5` on a 5-element array (valid indices `0`-`4`), you're staring directly at the off-by-one instead of inferring it from a crash message. That's the whole value of a debugger: it turns "the program produced a wrong number somewhere" into "I watched exactly where the number went wrong."

One more habit worth building now: when a program crashes with a segfault, running it under gdb and typing `run` then `backtrace` after the crash shows you the exact line and call chain that caused it - far faster than adding print statements and recompiling until you corner it. You'll lean on this constantly once pointers and dynamic memory enter the picture in the next few phases.

## Recap

1. A **Makefile** describes targets, their dependencies, and the commands that build them - `make` only rebuilds what's stale, based on file timestamps.
2. Rule bodies must be indented with a real **tab**, not spaces.
3. `-Wall -Wextra` catches real bugs at compile time; `-g` embeds the debug info a debugger needs.
4. A **debugger** pauses your actual running binary so you can inspect variables and step through code, instead of guessing what to `printf` in advance.
5. `break`, `run`, `next`/`step`, `print`, and `backtrace` cover the vast majority of real debugging sessions.

## Quick check

Test yourself on the two ideas that matter most here - why `make` only rebuilds what's stale, and what a debugger gives you that `printf` can't:

```quiz
[
  {
    "q": "In the Makefile mental model, why does running `make` a second time (with no files changed) skip rebuilding `myapp`?",
    "choices": [
      "make compares each target's timestamp to its dependencies' timestamps, and skips a target that's already newer than everything it depends on",
      "make remembers the exact shell command it ran last time and refuses to run it twice",
      "make hashes the contents of every file and skips any whose hash is unchanged",
      "make always rebuilds only the first target listed in the Makefile"
    ],
    "answer": 0,
    "explain": "make's entire value proposition is timestamp comparison, not content hashing or command memoization: if a target is already newer than everything it depends on, there's nothing to do."
  },
  {
    "q": "A Makefile rule body must be indented with:",
    "choices": [
      "Any consistent whitespace - spaces or tabs, as long as it's the same throughout the file",
      "Two spaces, matching common style guides for other languages",
      "A literal tab character - spaces produce a `missing separator` error"
    ],
    "answer": 2,
    "explain": "make treats the indentation before a command as a syntax marker, not cosmetic whitespace, and only a real tab satisfies it."
  },
  {
    "q": "You're chasing a bug where a loop reads one element past the end of an array. What's the core advantage of stepping through it in gdb instead of adding more printf calls?",
    "choices": [
      "gdb lets you inspect any variable's value at the moment execution is paused, instead of only seeing values you thought to print in advance",
      "gdb automatically rewrites the loop to fix off-by-one errors",
      "gdb runs the compiled binary faster than running it directly"
    ],
    "answer": 0,
    "explain": "printf only shows what you decided to log ahead of time; a debugger pauses the actual running binary so you can ask questions after you already know something went wrong."
  }
]
```

---

[← Phase 8: Header Files & the Preprocessor](08-header-files-and-preprocessor.md) · [Phase 10: Dynamic Memory: malloc & free →](10-dynamic-memory-malloc-and-free.md)
