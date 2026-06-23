---
title: "Modules & Project Layout"
guide: "go-from-zero"
phase: 5
summary: "Turn a folder into a module with go mod init, split code into packages, learn why a capital first letter makes an identifier public, import your own and others' packages, know go build vs go run, and lay out a small project sanely."
tags: [go, modules, packages, go-mod, exported, imports, go-build, project-layout]
difficulty: beginner
synonyms: ["go mod init explained", "go packages tutorial", "why capital letter exported go", "go build vs go run", "go project structure for beginners", "how to import own package in go"]
updated: 2026-06-19
---

# Modules & Project Layout

One file is fine for learning. A real program is many files, often using code other people wrote, and it
needs a way to say "this project depends on *that* library, at *this* version." That's what **modules**
and **packages** are for. Get these two ideas straight and your project stops being a pile of `.go` files
and becomes something you can grow, share, and build into a single shippable binary.

## Packages vs modules — two words people mix up

These get confused constantly, so let's pin them down before any commands.

📝 **Terminology.**
- A **package** is a folder of `.go` files that belong together and share a name (you've already used the
  `fmt` package and written `package main`). It's the unit of *code organization* — one folder, one
  package.
- A **module** is a whole *project*: a collection of packages versioned and released together, with one
  file (`go.mod`) recording its name and its dependencies. It's the unit of *distribution and
  versioning*.

In short: **a module is your project; packages are the folders inside it.** A tiny program is one module
with one package; a big one is one module with many.

## `go mod init` — create the module

Start a project by making a folder and initializing a module in it:
```console
$ mkdir greeter
$ cd greeter
$ go mod init example.com/greeter
go: creating new go.mod: module example.com/greeter
```
*What just happened:* `go mod init example.com/greeter` created a file called `go.mod` that marks this
folder as a module named `example.com/greeter`. That name is the module's **import path** — the unique
address other code uses to import it. The convention is a URL-like path (often where the code lives, e.g.
`github.com/you/greeter`); for a local-only project, anything unique like `example.com/greeter` is fine.

Peek at the file it made:
```console
$ cat go.mod
module example.com/greeter

go 1.22
```
*What just happened:* `go.mod` is small and human-readable. It records the module's name and the Go
version it targets. When you add third-party libraries later, their names and versions get listed here
too — this file is the single source of truth for "what does my project depend on." You rarely edit it by
hand; the `go` tool keeps it updated.

## Exported = Capitalized — Go's whole visibility rule

Most languages use keywords like `public` and `private` to control what other code can see. **Go uses
capitalization instead, and that's the entire rule:**

> An identifier (a function, type, or variable name) that starts with a **Capital letter** is
> **exported** — visible to other packages. One that starts with a **lowercase letter** is **unexported**
> — private to its own package.

That's it. No keywords. Let's see it. Make a package folder `greeting` with a file `greeting.go`:
```go
package greeting

import "fmt"

// Hello is exported — capital H — so other packages can call it.
func Hello(name string) string {
	return fmt.Sprintf("Hello, %s!", greetingPrefix(name))
}

// greetingPrefix is unexported — lowercase g — private to this package.
func greetingPrefix(name string) string {
	return name
}
```
*What just happened:* Two functions in package `greeting`. `Hello` starts with a capital `H`, so any other
package that imports `greeting` can call `greeting.Hello(...)`. `greetingPrefix` starts lowercase, so it's
an internal helper — invisible outside this package, even though it's right there in the file.
(`fmt.Sprintf` is like `Printf` but *returns* the formatted string instead of printing it.)

💡 **Key point.** When you read Go and see `thing.DoStuff()`, the capital `D` is *why* you're allowed to
call it. Capitalize to make something part of your package's public surface; keep it lowercase to keep it
an implementation detail you're free to change later. This is also a design nudge: making something public
is a one-letter decision you make on purpose.

## Importing your own package

Now use that package from your program. In the module root, a `main.go`:
```go
package main

import (
	"fmt"

	"example.com/greeter/greeting"
)

func main() {
	fmt.Println(greeting.Hello("Ada"))
}
```
```console
$ go run .
Hello, Ada!
```
*What just happened:* The `import (...)` block (the parentheses let you import several packages at once)
brings in both the standard-library `fmt` and *your own* `greeting` package, addressed by its full path:
the module name `example.com/greeter` plus the folder `greeting`. Then `greeting.Hello("Ada")` calls the
exported function. Note we ran `go run .` (a dot, "this whole package") rather than naming a single file —
once a project has multiple files, `.` tells Go to build the package in the current folder, all of it
together.

⚠️ **Gotcha.** The import path is **module name + folder path**, not just the folder name. With module
`example.com/greeter` and folder `greeting/`, the import is `"example.com/greeter/greeting"`. Importing
just `"greeting"` won't resolve. And the *package name* (`package greeting`) is what you type to use it
(`greeting.Hello`); keeping the folder name and package name the same avoids confusion.

## `go build` vs `go run`

You've been using `go run`, which compiles and runs in one disposable step — ideal while iterating. When
you want the actual *program* — a standalone executable you can keep, ship, or deploy — use `go build`:
```console
$ go build
$ ls
go.mod  greeter  greeting  main.go
$ ./greeter
Hello, Ada!
```
*What just happened:* `go build` compiled the whole module into a single executable file named after the
module's last path segment (`greeter` here; `greeter.exe` on Windows) and left it in the folder. Running
`./greeter` ran that file directly — no `go` involved. That one binary is self-contained: you can copy it
to another machine of the same OS and it just runs, with no Go installed there. **`go run` = try it now;
`go build` = produce the thing you ship.**

## A sane small layout

You don't need an elaborate folder structure to start — resist the urge to over-organize a small project.
A clean starting shape for a program with a bit of internal code:

```mermaid
flowchart TD
  Mod["greeter/ (module: example.com/greeter)"]
  Mod --> GoMod["go.mod — name + dependencies"]
  Mod --> Main["main.go — package main, the entry point"]
  Mod --> Pkg["greeting/ — package greeting"]
  Pkg --> PkgFile["greeting.go — Hello (exported)"]
```

*Reading the layout:* the module root holds `go.mod` and your `package main` (the runnable entry point),
and each subfolder is one package of supporting code, grouped by what it does. As the project grows you
add more package folders the same way — each a self-contained unit with a clear public surface (the
capitalized names) and private internals (everything lowercase). Start flat; split into packages only when
a real grouping emerges. Premature folders are just friction.

## Looking ahead to concurrency

You now have everything you need to write and organize real Go: values and types, collections, control
flow, multiple-return functions, and a project structured into a module and packages. That's the whole
foundation — and it sets up the feature Go is actually famous for.

So far every program has done **one thing at a time**, top to bottom. But the reason companies reach for
Go — the reason it powers Docker, Kubernetes, and a huge slice of the cloud — is how gracefully it does
*many* things at once: handling thousands of network connections, processing work in parallel, keeping a
server responsive under load. That's **concurrency**, and Go's tools for it (`goroutines` and `channels`)
are the next phase. Everything you've built so far was the runway. Phase 6 is the takeoff.

## Recap

1. A **package** is a folder of related code; a **module** is the whole project, defined by `go.mod`.
2. **`go mod init <path>`** creates the module and its `go.mod` (the record of name + dependencies).
3. **Exported = Capitalized.** Capital-first identifiers are public to other packages; lowercase-first are
   private — that's Go's entire visibility rule.
4. **Import your own packages** by `module-name/folder-path`, and run multi-file packages with `go run .`.
5. **`go run`** compiles-and-runs disposably; **`go build`** produces a standalone executable to ship.
6. **Start flat**, split into package folders only when a real grouping appears.

Next: goroutines and channels — doing many things at once, safely. The reason Go exists.

---

[← Phase 4: Control Flow & Functions](04-control-flow-and-functions.md) · [Guide overview](_guide.md) · [Phase 6: Goroutines & Channels →](06-goroutines-and-channels.md)
