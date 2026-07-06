---
title: "Why Go, and a Compiling Project"
guide: "cli-tool-go"
phase: 1
summary: "Create the til module with go mod init, read command-line arguments from os.Args, and compile your first self-contained binary with go build."
tags: [go, go-mod, os-args, setup, go-build]
difficulty: intermediate
synonyms:
  - go mod init tutorial
  - os.Args go
  - compile go program
  - go build binary
  - start a go cli project
updated: 2026-07-06
---

# Why Go, and a Compiling Project

Every phase of this project ends with a program you can run. This first one is short on features and long on foundation: a Go module, a `main.go` that can see its own command-line arguments, and a compiled binary sitting in your folder. Once you've watched `go build` turn source code into a single executable file, the rest of the project is filling that file with behavior.

Open a terminal. Let's make the project.

## Check your Go

First, confirm the toolchain is there:

```console
$ go version
go version go1.24.4 windows/amd64
```

*What just happened:* Go printed its version and your platform - the `windows/amd64` part is your operating system and CPU architecture, a pair you'll meet again in phase 6 when you cross-compile for *other* platforms. Your version and platform will differ from mine; anything 1.22 or newer is fine. If the command isn't found, install Go from go.dev/dl and reopen your terminal.

## Create the module

Make a folder and initialize a module in it:

```console
$ mkdir til
$ cd til
$ go mod init til
go: creating new go.mod: module til
```

*What just happened:* `go mod init til` created a file called `go.mod` that declares "this folder is a Go module named `til`." The module name is how Go identifies your project - for a library you'd use a full path like `github.com/you/til` so others can import it, but for a personal tool a short name works. Open the file and look:

```text
module til

go 1.24.4
```

That's the entire project configuration. When a project has dependencies, they're listed here too - ours never will, because everything we need ships with Go.

📝 **Terminology:** a **module** is Go's unit of versioning and dependency tracking (the folder with `go.mod`); a **package** is a folder of `.go` files that compile together. Our module contains exactly one package: `main`, the special package name that means "this compiles to an executable."

## The first main.go

Create `main.go` next to `go.mod`:

```go
package main

import (
	"fmt"
	"os"
)

func main() {
	fmt.Println("til - a tiny \"today I learned\" log")
	fmt.Println("you passed:", os.Args[1:])
}
```

Two lines of real content, and one of them is the key to this whole project.

**`os.Args` is the raw command line.** It's a slice of strings holding everything the user typed, split on spaces. Index 0 is the program's own name; everything after that is what the user passed. Every CLI you've ever used - `git`, `docker`, `npm` - starts from exactly this slice. There's no magic underneath; subcommands and flags are all parsed out of these strings, and in the next phase you'll do that parsing yourself.

We print `os.Args[1:]` - everything *except* the program name - to see what arrives.

## Run it

`go run` compiles and runs in one step, which is the fast loop you'll use while developing:

```console
$ go run . add "my first note"
til - a tiny "today I learned" log
you passed: [add my first note]
```

*What just happened:* the `.` means "the package in the current folder." Go compiled `main.go` to a temporary binary, ran it, and passed along everything after the `.`. Notice what the slice looks like: `add` and `my first note` arrived as **two** elements, not four - your shell kept the quoted string together before Go ever saw it. That's why you quote multi-word arguments, and it's why `os.Args` is a `[]string` and not one long string.

⚠️ **Gotcha:** run `go run . add my first note` without the quotes and you'll get `[add my first note]` printed the same way - but it's now *four* elements, and later phases would treat `my` as the note and lose the rest. The shell splits on spaces; quotes are how you tell it not to. If a note ever comes out truncated, this is the first thing to check.

## Build the binary

`go run` is for development. The real artifact comes from:

```console
$ go build
$ ls
go.mod  main.go  til.exe
```

*What just happened:* `go build` compiled the package into an executable named after the module - `til.exe` on Windows, plain `til` on macOS and Linux. No output on success is normal; Go is quiet when things work.

Run it directly:

```console
$ ./til add "hello"
til - a tiny "today I learned" log
you passed: [add hello]
```

(On Windows PowerShell that's `.\til add "hello"` - the `./` or `.\` prefix means "the one in this folder," since the folder isn't on your PATH. Yet. Phase 6 fixes that.)

That file is the entire program. It's a few megabytes because Go packs the runtime and every library the program uses inside it - and that's the trade Go makes deliberately: a bigger file, in exchange for **no installation step ever**. You could email `til.exe` to a colleague on Windows right now and it would run. No Go toolchain, no dependencies, nothing to set up. Compare that with shipping a Python script, and you understand why so much command-line tooling moved to Go.

💡 **Key point:** `go run .` while developing, `go build` when you want the artifact. Both compile the same way; the only difference is whether the binary sticks around.

## What you have now

A Go module, a program that can read its command line, and proof that it compiles to a single self-contained binary. It doesn't *do* anything with `add` yet - `os.Args` is still raw, unparsed text. Next phase we give those strings meaning: a real subcommand dispatcher and the `flag` package, which is the skeleton every serious CLI hangs off.

Quick check before you move on:

```quiz
[
  {
    "q": "What does go build produce for a CLI project like this one?",
    "choices": [
      "A folder of compiled files plus a runtime the target machine must install",
      "One self-contained executable that runs without Go installed",
      "Bytecode that needs the Go toolchain present to execute"
    ],
    "answer": 1,
    "explain": "Go statically compiles your code, its dependencies, and the runtime into a single binary. The machine running it never needs Go."
  },
  {
    "q": "What is os.Args[0]?",
    "choices": [
      "The first argument the user typed after the program name",
      "The name/path of the program itself",
      "Always an empty string"
    ],
    "answer": 1,
    "explain": "Index 0 is the program's own name; user-supplied arguments start at index 1. That's why we print os.Args[1:]."
  },
  {
    "q": "You run: go run . add my first note (no quotes). How does the note text arrive?",
    "choices": [
      "As one string, because Go rejoins the words",
      "As three separate elements, because the shell split on spaces",
      "It causes a compile error"
    ],
    "answer": 1,
    "explain": "The shell splits unquoted input on whitespace before the program starts. Quoting keeps multi-word arguments as a single element."
  }
]
```
