---
title: "The Ecosystem & Tooling - Batteries Included"
guide: "go-from-zero"
phase: 8
summary: "Go ships one toolchain that does everything: go build, go run, go test, go vet, and go fmt (which ends formatting debates), go mod for dependencies, a strong standard library, and golangci-lint as the one extra you'll want."
tags: [go, golang, tooling, go-build, go-test, go-fmt, go-vet, go-mod, standard-library, golangci-lint]
difficulty: intermediate
synonyms: ["go toolchain explained", "go build vs go run", "how to test in go", "what does go vet do", "gofmt formatting", "go mod commands", "go standard library", "golangci-lint setup"]
updated: 2026-06-19
---

# The Ecosystem & Tooling - Batteries Included

Picking up a new language usually means a second, miserable project: choosing a build tool, a test runner, a formatter, a linter, a package manager - and making them all agree. Go's answer is one of its best features:

> **The toolbox comes in the box.** Install Go and you already have the build tool, the test runner, the formatter, the vetter, and the dependency manager - one command, `go`, with subcommands.

Each tool is a `go <verb>`, each does one job, and together they're why an unfamiliar Go project is usually trivial to build, test, and read.

## `go run` and `go build` - execute vs. produce

`go run` compiles your code to a temporary binary and runs it immediately - the fast feedback loop while working. `go build` compiles and *keeps* the result: a single, self-contained executable you can ship.

📝 **Terminology.** Go compiles to a single native binary with no separate runtime to install on the target machine - build it once and copy that one file. That's why "deploy a Go service" is often "scp one file," and why Docker images for Go are tiny.

```console
$ go run .
Hello, Missing Manual!

$ go build -o hello .
$ ls -lh hello
-rwxr-xr-x  1 you  staff   2.1M Jun 19 10:22 hello
$ ./hello
Hello, Missing Manual!
```
`go run .` compiled the package in the current directory and ran it on the spot, leaving no file behind - perfect for iterating. `go build -o hello .` did the compile but wrote the result to a file named `hello`, which we then ran directly. The binary is a couple of megabytes because Go statically bundles everything it needs - no dependencies to chase on the server.

## `go fmt` - the end of formatting debates

`go fmt` (which runs the `gofmt` tool) rewrites your code into Go's one true canonical format: tabs, brace placement, spacing, alignment - all non-negotiable. There's nothing to argue over because there are essentially no options.

**Why this is a feature, not a constraint.** Every other language community has burned years on tabs-vs-spaces, brace style, line length. Go ended the war by decree: one format, tool-enforced, so *all* Go code - yours, the standard library's, a stranger's on GitHub - looks the same. Code review stops being about style and starts being about substance. Most editors run `gofmt` on save.

```console
$ cat messy.go
package main
import "fmt"
func main(){
fmt.Println( "hi" )
}

$ gofmt -w messy.go
$ cat messy.go
package main

import "fmt"

func main() {
	fmt.Println("hi")
}
```
The original file had crooked indentation, a cramped `import`, and stray spaces inside the parentheses. `gofmt -w` (`-w` writes changes back to the file) rewrote it into the canonical layout - blank line after the package clause, tab indentation, tidy spacing. One correct answer, and the tool applied it.

💡 **Key point.** Don't hand-format Go and don't argue about style in review - let `gofmt` do it. "Run it through gofmt" is the entire formatting policy of the Go world.

## `go vet` - catches suspicious code the compiler allows

`go vet` is a built-in static analyzer that flags code that compiles fine but is *probably* a bug - the classic example being a `Printf` whose format verbs don't match its arguments.

```console
$ cat main.go
package main

import "fmt"

func main() {
	name := "Ada"
	fmt.Printf("hello %d\n", name) // %d expects an int, but name is a string
}

$ go vet .
# example/hello
./main.go:7:2: fmt.Printf format %d has arg name of wrong type string
```
The code compiled - `Printf` takes any arguments - but it's wrong: `%d` is for integers and `name` is a string, so at runtime you'd get garbled output like `hello %!d(string=Ada)`. `go vet` spotted the mismatch *before* you ran it - the cheap safety net for bugs the compiler is too permissive to reject.

## `go test` - testing is built in

Go's test runner is part of the toolchain. Write tests in files named `*_test.go`, in functions named `TestXxx(t *testing.T)`, and run them with `go test`. No framework to install, no config file.

Given a function and a test beside it:
```go
// math.go
package mathx

func Double(n int) int { return n * 2 }
```
```go
// math_test.go
package mathx

import "testing"

func TestDouble(t *testing.T) {
	got := Double(3)
	if got != 6 {
		t.Errorf("Double(3) = %d; want 6", got)
	}
}
```
```console
$ go test ./...
ok  	example/mathx	0.003s
```
`go test ./...` found every test in the module (`./...` means "this directory and all subdirectories"), compiled them with their packages, ran each `TestXxx`, and reported `ok` because nothing called `t.Errorf`. A test "fails" by reporting through `t` - no assert library, just a plain `if` and `t.Errorf` when reality doesn't match expectations.

📝 **Terminology.** `./...` is Go's wildcard for "the current directory and everything beneath it recursively." You'll use it constantly - `go test ./...`, `go vet ./...`, `go build ./...`.

## `go mod` - dependencies, the modern way

A *module* is the unit Go uses to track your project and its dependencies, defined by a `go.mod` file at the root. `go mod init` creates it, `go get` adds a dependency, and `go mod tidy` syncs `go.mod` to exactly what your code actually imports.

```console
$ go mod init example/hello
go: creating new go.mod: module example/hello

$ go get github.com/google/uuid
go: added github.com/google/uuid v1.6.0

$ go mod tidy
$ cat go.mod
module example/hello

go 1.25

require github.com/google/uuid v1.6.0
```
`go mod init` created a `go.mod` declaring your module's name. `go get` downloaded the `uuid` package, recorded the exact version (`v1.6.0`), and wrote a `go.sum` file with cryptographic checksums so future downloads are verifiably identical. `go mod tidy` reconciled `go.mod` with your real imports - adding what you started using, removing what you stopped. (Project layout and `go.mod` in depth: [Phase 5](05-modules-and-project-layout.md); this is the tooling side.)

💡 **Key point.** `go mod tidy` is the one to run before you commit - it guarantees `go.mod`/`go.sum` exactly match your imports, so a fresh clone builds with no surprises.

## The standard library - more "batteries" than you expect

Go's standard library is unusually broad and production-grade. A real HTTP server, JSON encoding/decoding, cryptography, file and OS access, regular expressions, templating, and the testing tools above - all in the box, no third-party packages required.

An HTTP server in the standard library alone:
```go
package main

import (
	"fmt"
	"net/http"
)

func main() {
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintln(w, "Hello from net/http!")
	})
	http.ListenAndServe(":8080", nil)
}
```
```console
$ go run . &
$ curl localhost:8080
Hello from net/http!
```
With nothing but `net/http`, we registered a handler for `/` and started a real web server on port 8080 - no framework, no dependencies in `go.mod`. The `curl` hit it and got the response. This is why a lot of Go services run on the standard library for a long time before reaching for anything external. (Popular web frameworks built on top of this are signposted in [Phase 18](18-where-to-go-next.md).)

## `golangci-lint` - the one tool worth adding

The toolchain covers almost everything, but the community standard for deeper linting is `golangci-lint` - a fast runner bundling dozens of linters (including `go vet` and the `errcheck` "you ignored an error" check from [Phase 7](07-errors-and-io.md)) behind one command.

```console
$ golangci-lint run ./...
main.go:12:2: Error return value of `f.Close` is not checked (errcheck)
		f.Close()
		^
```
`golangci-lint run ./...` ran its whole battery of linters in one pass and flagged an unchecked error - exactly the silent-failure trap from the errors phase. It's the single external tool most Go teams install; everything else they need already shipped with Go. (Install from the official instructions at golangci-lint.run - versions and install methods change, so check the source rather than copying a command that may be stale.)

## Recap

1. **`go run` / `go build`** - run on the spot vs. produce a single self-contained binary you can ship.
2. **`go fmt`** - one canonical format, enforced; it ends style debates so review is about substance.
3. **`go vet`** - flags compiles-but-probably-wrong code (like `Printf` verb mismatches).
4. **`go test ./...`** - built-in test runner; tests are `TestXxx(t *testing.T)` in `*_test.go`, no framework needed.
5. **`go mod`** - `init`, `get`, and especially `tidy` to keep dependencies exactly matching your imports.
6. **Standard library + `golangci-lint`** - batteries like `net/http` and `encoding/json` are built in; `golangci-lint` is the one external tool most teams add.

You've got the language and the toolbox. What's left is a handful of conventions and gotchas that bite everyone once.

---

[← Phase 7: Errors & I/O](07-errors-and-io.md) · [Phase 9: Idioms & Common Gotchas →](09-idioms-and-gotchas.md)
