---
title: "Install & Your First Program"
guide: "go-from-zero"
phase: 1
summary: "Install the Go toolchain from go.dev, confirm it with go version, write a three-line hello.go, run it with go run — and meet Go's surprise: unused imports and variables are compile errors, not warnings."
tags: [go, install, go-run, hello-world, package-main, compile-error]
difficulty: beginner
synonyms: ["how to install go", "go version command", "first go program", "go run hello.go", "why does go fail on unused import", "package main func main explained"]
updated: 2026-06-19
---

# Install & Your First Program

Every language asks you to do the same two things before anything fun happens: get the tools onto your
machine, and prove they work by running one tiny program. With Go this is genuinely quick, and the very
first program teaches you something surprising about how Go thinks. Let's get there.

## What "installing Go" actually gives you

When people say they "installed Python" they often mean an interpreter that reads your code line by line.
Go is different: it's a **compiled** language. Installing Go gives you a single command-line tool — `go`
— that bundles a compiler (turns your source into a standalone machine-code program), a package manager,
a test runner, a formatter, and more, all in one. You don't assemble a toolchain; you install one program
that *is* the toolchain.

📝 **Terminology.** A **compiler** translates the whole program you wrote into machine code *before* it
runs. The result is a self-contained executable — a file your operating system can run directly, with no
"Go" needed on the machine that runs it. That's why a Go program ships as one binary.

## Install it

Go to the official downloads page — **[go.dev/dl](https://go.dev/dl)** — and grab the installer for your
operating system (Windows `.msi`, macOS `.pkg`, or the Linux tarball). Run it and accept the defaults.
The installer puts the `go` command on your system `PATH`, which is what lets you type `go` in any
terminal and have it found.

⚠️ **Gotcha.** If you've just run the installer and your terminal says `go: command not found` (or
`'go' is not recognized` on Windows), the most common cause is a terminal that was already open before
the install — it doesn't know about the new `PATH` yet. Close it and open a fresh one. The change is
real; the old window just hadn't heard about it.

## Confirm it works with `go version`

Before writing any code, ask Go to introduce itself:
```console
$ go version
go version go1.22.4 linux/amd64
```
*What just happened:* You ran the `go` tool with its `version` sub-command, and it reported which release
is installed and the platform it's built for (`linux/amd64` here — yours will say `windows/amd64`,
`darwin/arm64`, etc., depending on your machine). The exact patch number will differ over time; anything
`go1.22` or newer is perfect for this guide. If you got a version line, you're ready.

## Write your first program

Make a file called `hello.go` in any folder, in any text editor, with exactly this:
```go
package main

import "fmt"

func main() {
	fmt.Println("Hello, Go!")
}
```
*What just happened:* That's a complete Go program. It's only six lines, but every one is doing a
specific job, so let's name them:

- `package main` — Go organizes all code into **packages** (named groups of related code). The package
  named `main` is special: it's the one Go turns into a runnable program. Every program you can *run*
  starts with `package main`.
- `import "fmt"` — pulls in the **`fmt`** package from Go's standard library (the toolbox that ships with
  Go). `fmt` (short for "format") holds the functions for printing text. You import what you want to use.
- `func main() { ... }` — defines a **function** named `main`. This one is also special: it's the
  *entry point*, the single function Go runs when your program starts. Execution begins at the first line
  inside `main` and goes top to bottom.
- `fmt.Println("Hello, Go!")` — calls the `Println` ("print line") function *from* the `fmt` package
  (that's what the dot means: "the `Println` that lives in `fmt`"). It prints the text and moves to a new
  line.

💡 **Key point.** Two things named `main` carry all the magic of "this is a program you can run": the
**package** `main` and the **function** `main` inside it. Together they tell Go "start here." Library
code that other programs import lives in differently-named packages and has no `main` function.

## Run it with `go run`

From the folder containing `hello.go`:
```console
$ go run hello.go
Hello, Go!
```
*What just happened:* `go run` did two things in one step: it **compiled** `hello.go` into a temporary
program and then immediately ran it, showing you the output. It's the fastest way to try code while
you're learning — you don't have to manage an executable file yourself. (In [phase 5](05-modules-and-project-layout.md)
you'll meet `go build`, which keeps the compiled binary instead of throwing it away.)

If you're curious what "running it line by line" looks like here: Go entered `main`, hit the one
`fmt.Println` call, printed the text, reached the closing `}`, and the program ended. That's the whole
life of this program.

## Go's surprise: unused things are *errors*

Here's the thing that catches everyone coming from other languages. In most languages, importing a
package you don't use, or declaring a variable you never read, gets you a warning at worst — the program
still runs. **In Go, both are hard compile errors. Your program will not build.**

Watch what happens if we import `fmt` but never call it:
```go
package main

import "fmt"

func main() {
}
```
```console
$ go run hello.go
./hello.go:3:8: "fmt" imported and not used
```
*What just happened:* The compiler refused to build the program *at all*. It points you straight at the
offending line (`hello.go:3:8` means file `hello.go`, line 3, column 8) and tells you exactly what's
wrong: `"fmt" imported and not used`. No binary was produced. The same thing happens with a variable you
declare and never read (you'll see `declared and not used` — we hit this in [phase 2](02-syntax-values-and-types.md)).

⚠️ **Gotcha.** This *feels* hostile the first few times, especially mid-edit when you've commented out
the one line that used an import. It is not a bug and there's no flag to turn it off — it's a deliberate
language decision.

**Why Go made this choice.** Unused imports and dead variables are how real codebases slowly rot:
mysterious dependencies, leftover names that mislead the next reader. By making them *errors*, Go
guarantees that every import in a file is actually needed and every declared variable is actually used.
The cost is a moment of friction while you learn; the payoff is that Go code stays clean by force, not by
discipline. The fix is always trivial — delete the unused line (or, while debugging, actually use the
thing). Once you've internalized it, it stops registering as friction at all.

## Recap

1. **Go is compiled**; installing it from [go.dev/dl](https://go.dev/dl) gives you one `go` command that
   is the whole toolchain.
2. **`go version`** confirms the install and tells you the release and platform.
3. A runnable program needs **`package main`** and a **`func main()`** — that pair is the entry point.
4. **`import`** pulls in packages like **`fmt`**; you call into them with `package.Function`, e.g.
   `fmt.Println(...)`.
5. **`go run file.go`** compiles and runs in one step — perfect for learning.
6. **Unused imports and unused variables are compile errors in Go**, on purpose, to keep code clean.

Next, we give the program something to work with: named values, the types they come in, and the
zero-value rule that means Go variables are never mysteriously uninitialized.

---

[← Guide overview](_guide.md) · [Phase 2: Syntax, Values & Types →](02-syntax-values-and-types.md)
