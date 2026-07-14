---
title: "Install & Your First Program"
guide: "go-from-zero"
phase: 1
summary: "Install the Go toolchain from go.dev, confirm it with go version, write a tiny hello.go, run it with go run - and meet Go's surprise: unused imports and variables are compile errors, not warnings."
tags: [go, install, go-run, hello-world, package-main, compile-error]
difficulty: beginner
synonyms: ["how to install go", "go version command", "first go program", "go run hello.go", "why does go fail on unused import", "package main func main explained"]
updated: 2026-06-19
---

# Install & Your First Program

Every language asks the same two things first: get the tools onto your machine, and prove they work with
one tiny program. With Go this is quick, and the first program already teaches you something surprising.

## What "installing Go" actually gives you

"Installing Python" usually means an interpreter that reads code line by line. Go is different: it's a
**compiled** language. Installing Go gives you a single command-line tool - `go` - that bundles a
compiler (turns your source into a standalone machine-code program), a package manager, a test runner, a
formatter, and more. One program *is* the toolchain.

📝 **Terminology.** A **compiler** translates the whole program into machine code *before* it runs. The
result is a self-contained executable - a file your OS can run directly, with no "Go" needed on the
machine that runs it. That's why a Go program ships as one binary.

## Install it

Go to the official downloads page - **[go.dev/dl](https://go.dev/dl)** - and grab the installer for your
OS (Windows `.msi`, macOS `.pkg`, or the Linux tarball). Run it and accept the defaults. The installer
puts the `go` command on your system `PATH`, so any terminal can find it.

⚠️ **Gotcha.** `go: command not found` (or `'go' is not recognized` on Windows) right after installing
usually means your terminal was already open before the install and hasn't picked up the new `PATH`.
Close it and open a fresh one.

## Confirm it works with `go version`

Before writing any code, ask Go to introduce itself:
```console
$ go version
go version go1.25.0 linux/amd64
```
The `version` sub-command reports the installed release and platform (`linux/amd64` here - yours may say
`windows/amd64`, `darwin/arm64`, etc.). The patch number will differ over time; anything `go1.22` or newer
works. A version line means you're ready.

## Write your first program

Make a file called `hello.go` in any folder, in any text editor, with exactly this:
```go
package main

import "fmt"

func main() {
	fmt.Println("Hello, Go!")
}
```
That's a complete Go program. Five lines of code, each with a specific job:

- `package main` - Go organizes all code into **packages** (named groups of related code). The package
  named `main` is special: it's the one Go turns into a runnable program. Every program you can *run*
  starts with `package main`.
- `import "fmt"` - pulls in the **`fmt`** package from Go's standard library (the toolbox that ships with
  Go). `fmt` (short for "format") holds the functions for printing text. You import what you want to use.
- `func main() { ... }` - defines a **function** named `main`. This one is also special: it's the
  *entry point*, the single function Go runs when your program starts, top to bottom from the first line.
- `fmt.Println("Hello, Go!")` - calls the `Println` ("print line") function *from* the `fmt` package
  (the dot means "the `Println` that lives in `fmt`"). It prints the text and moves to a new line.

💡 **Key point.** Two things named `main` carry all the magic of "this is a program you can run": the
**package** `main` and the **function** `main` inside it. Together they tell Go "start here." Library
code lives in differently-named packages and has no `main` function.

## Run it with `go run`

From the folder containing `hello.go`:
```console
$ go run hello.go
Hello, Go!
```
`go run` **compiled** `hello.go` into a temporary program and immediately ran it, showing the output.
It's the fastest way to try code while learning - no executable file to manage yourself. (In
[phase 5](05-modules-and-project-layout.md) you'll meet `go build`, which keeps the binary instead of
throwing it away.)

Line by line: Go entered `main`, hit the `fmt.Println` call, printed the text, reached the closing `}`,
and the program ended.

## Go's surprise: unused things are *errors*

In most languages, importing a package you don't use, or declaring a variable you never read, gets a
warning at worst - the program still runs. **In Go, both are hard compile errors. Your program will not
build.**

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
The compiler refused to build the program *at all*, pointing straight at the offending line
(`hello.go:3:8` means file `hello.go`, line 3, column 8) with the exact problem: `"fmt" imported and not
used`. No binary was produced. Same story for a variable you declare and never read (you'll see `declared
and not used` - covered in [phase 2](02-syntax-values-and-types.md)).

⚠️ **Gotcha.** This *feels* hostile the first few times, especially mid-edit when you've commented out
the line that used an import. It's not a bug and there's no flag to turn it off - it's deliberate.

**Why Go made this choice.** Unused imports and dead variables are how real codebases slowly rot:
mysterious dependencies, leftover names that mislead the next reader. Making them *errors* guarantees
every import is needed and every variable is used. The fix is always trivial - delete the unused line, or
actually use the thing. Once internalized, it stops registering as friction.

## Recap

1. **Go is compiled**; installing it from [go.dev/dl](https://go.dev/dl) gives you one `go` command that
   is the whole toolchain.
2. **`go version`** confirms the install and tells you the release and platform.
3. A runnable program needs **`package main`** and a **`func main()`** - that pair is the entry point.
4. **`import`** pulls in packages like **`fmt`**; you call into them with `package.Function`, e.g.
   `fmt.Println(...)`.
5. **`go run file.go`** compiles and runs in one step - perfect for learning.
6. **Unused imports and unused variables are compile errors in Go**, on purpose, to keep code clean.

Next: named values, their types, and the zero-value rule - Go variables are never mysteriously
uninitialized.

---

[← Guide overview](_guide.md) · [Phase 2: Syntax, Values & Types →](02-syntax-values-and-types.md)
