---
title: "Errors & I/O — Errors Are Values"
guide: "go-from-zero"
phase: 7
summary: "In Go an error is an ordinary value you check with 'if err != nil', return up the call stack, wrap with %w, and inspect using errors.Is and errors.As — plus reading files with os and bufio, and why panic/recover is the rare exception."
tags: [go, golang, errors, error-handling, errors-is, errors-as, panic, recover, io, files, bufio]
difficulty: intermediate
synonyms: ["go error handling", "if err != nil explained", "go wrap error with %w", "errors.Is vs errors.As", "go panic recover", "read a file in go", "go bufio scanner example", "why does go not have exceptions"]
updated: 2026-06-19
---

# Errors & I/O — Errors Are Values

If you're coming from a language with exceptions, Go's error handling will feel either refreshing or relentless, and usually both. There's no `try`/`catch`. There's no invisible stack-unwinding that whisks a failure off to some handler three floors up. Instead, Go makes a deliberate, slightly stubborn choice:

> **An error is just a value.** A function that can fail returns one, right alongside its result, and you deal with it then and there.

That's the whole mental model. An error isn't a special control-flow event — it's data. The function hands you back "here's the answer, and here's what went wrong (or `nil` if nothing did)." This is why you'll see `if err != nil` everywhere in Go code: it's not boilerplate the language forgot to remove, it's the language insisting you look at the failure at the exact spot it happened, while you still have the context to do something useful about it. Once that clicks, Go's error handling stops feeling like nagging and starts feeling like honesty.

## The `if err != nil` pattern

**What it actually is.** By convention, a Go function that can fail returns its result *and* an `error` as its last return value. You check the error immediately; if it's not `nil`, something went wrong.

📝 **Terminology.** `error` is a built-in interface — anything with an `Error() string` method is an error. The zero value of an error is `nil`, which means "no error." So `err != nil` literally reads as "an error is present."

**A real example.** `strconv.Atoi` turns a string into an int, and it can fail (the string might not be a number):
```go
package main

import (
	"fmt"
	"strconv"
)

func main() {
	n, err := strconv.Atoi("42")
	if err != nil {
		fmt.Println("could not parse:", err)
		return
	}
	fmt.Println("parsed:", n)
}
```
```console
$ go run main.go
parsed: 42
```
*What just happened:* `Atoi` returned two values: the parsed number `42` and an error. We checked `err` right away; it was `nil`, so we trusted `n` and printed it. Had we passed `"oops"` instead, `err` would have been non-nil (`strconv.Atoi: parsing "oops": invalid syntax`) and we'd have taken the error branch. The result and the error come back *together*, and you decide what to do with the failure on the spot.

⚠️ **Gotcha — ignoring the error.** Go lets you discard a return value with `_`, and the single most common Go mistake is doing that to the error:
```go
n, _ := strconv.Atoi(userInput) // DON'T: if userInput is garbage, n is silently 0
```
*What just happened:* You threw the error away. If `userInput` was `"abc"`, `Atoi` returned `0` for `n` *and* a non-nil error explaining why — but you ignored the error, so now you're holding `0` as if the parse succeeded. The bug surfaces much later, far from the cause, as a mysterious zero. The whole point of errors-as-values is that you *see* them; `_` on an error throws that away. (The `errcheck` linter, part of `golangci-lint` in the next phase, catches exactly this.)

## Returning errors from your own functions

**What it actually is.** When *your* function can fail, you follow the same convention: return `(result, error)`. If something downstream fails, you typically pass that error back up; if you detect a problem yourself, you create one with `errors.New` or `fmt.Errorf`.

**A real example.**
```go
package main

import (
	"errors"
	"fmt"
)

func half(n int) (int, error) {
	if n%2 != 0 {
		return 0, errors.New("number is odd")
	}
	return n / 2, nil
}

func main() {
	for _, n := range []int{8, 7} {
		h, err := half(n)
		if err != nil {
			fmt.Printf("half(%d): %v\n", n, err)
			continue
		}
		fmt.Printf("half(%d) = %d\n", n, h)
	}
}
```
```console
$ go run main.go
half(8) = 4
half(7): number is odd
```
*What just happened:* `half` returned `(result, nil)` on success and `(0, an error)` on failure. The caller checked `err` each time: for `8` it printed the result, for `7` it printed the error and moved on. Notice the failed case still returns a real `int` (`0`) — Go requires *all* return values, so the convention is to return a zero/empty result alongside a non-nil error, and the caller knows not to trust the result when the error is set.

## Wrapping errors with `%w`

**What it actually is.** When you pass an error up the stack, a bare "file not found" tells you *what* but not *where in your program* it happened. Wrapping adds your context while keeping the original error intact underneath. You do it with `fmt.Errorf` and the special `%w` verb.

**Why this matters.** `%w` doesn't just stuff the old message into a new string — it *links* the new error to the original so tools can still dig the original out later (that's the `errors.Is`/`errors.As` trick below). You get a readable chain: high-level context on the outside, root cause on the inside.

**A real example.**
```go
package main

import (
	"errors"
	"fmt"
)

var errNotFound = errors.New("not found")

func loadUser(id int) error {
	return fmt.Errorf("loadUser(%d): %w", id, errNotFound)
}

func main() {
	err := loadUser(7)
	fmt.Println(err)
}
```
```console
$ go run main.go
loadUser(7): not found
```
*What just happened:* `fmt.Errorf` built a new error message — `loadUser(7): not found` — but the `%w` verb also kept a hidden pointer to the original `errNotFound`. So the message reads top-down (your context first, root cause last), and the original error is still recoverable. Use `%w` (which wraps) when callers might need to inspect the cause; use plain `%v` (which just formats the text) when you only need it readable.

## Inspecting errors: `errors.Is` and `errors.As`

**What it actually is.** Because errors are values — and wrapping forms a chain — you often need to ask two questions about an error you received: *"is this (anywhere in the chain) a specific known error?"* and *"is this (anywhere in the chain) a specific error type, and can I get at its fields?"* Those are `errors.Is` and `errors.As`.

- **`errors.Is(err, target)`** — true if `err`, or anything it wraps, *is* that sentinel value. Use it to compare against a known error like `errNotFound` or `os.ErrNotExist`. (Don't use `==` — that only checks the outermost error and misses wrapped ones.)
- **`errors.As(err, &target)`** — true if `err`, or anything it wraps, is of a given *type*; if so it fills `target` so you can read the type's fields.

**A real example.**
```go
package main

import (
	"errors"
	"fmt"
)

var errNotFound = errors.New("not found")

func loadUser(id int) error {
	return fmt.Errorf("loadUser(%d): %w", id, errNotFound)
}

func main() {
	err := loadUser(7)
	if errors.Is(err, errNotFound) {
		fmt.Println("yes, this was a not-found error")
	}
}
```
```console
$ go run main.go
yes, this was a not-found error
```
*What just happened:* Even though `err`'s text was the wrapped `loadUser(7): not found`, `errors.Is` walked down the chain, found the original `errNotFound` underneath, and matched it. A plain `err == errNotFound` would have returned false here — the outer wrapper isn't equal to the sentinel — which is exactly why `errors.Is` exists. Reach for `errors.As` (with a pointer to a variable of the error type) when you need not just "is it this kind" but the structured data inside it.

## Reading files: `os` and `bufio`

**What it actually is.** File and stream handling lives mostly in the `os` and `bufio` packages, and every operation returns an error you check. For a whole small file, `os.ReadFile` gives you the bytes in one call. For reading a file line by line (without loading it all into memory), `bufio.Scanner` is the standard tool.

**A real example — read a file line by line.**
```go
package main

import (
	"bufio"
	"fmt"
	"os"
)

func main() {
	f, err := os.Open("notes.txt")
	if err != nil {
		fmt.Println("open failed:", err)
		return
	}
	defer f.Close() // always runs, even on early return

	scanner := bufio.NewScanner(f)
	for scanner.Scan() { // advances to the next line; false at EOF
		fmt.Println("line:", scanner.Text())
	}
	if err := scanner.Err(); err != nil { // check for a read error
		fmt.Println("scan failed:", err)
	}
}
```
```console
$ cat notes.txt
buy milk
call dentist
$ go run main.go
line: buy milk
line: call dentist
```
*What just happened:* `os.Open` returned the open file and an error; we checked the error, then immediately set up `defer f.Close()` so the file gets closed no matter how the function exits (covered as an idiom in [Phase 9](09-idioms-and-gotchas.md)). `bufio.NewScanner` wrapped the file; `scanner.Scan()` returned `true` for each line and `false` at end-of-file, and `scanner.Text()` gave us the line's contents. Crucially, after the loop we called `scanner.Err()` — because `Scan()` returns `false` both for a clean end-of-file *and* for a read error, and only `scanner.Err()` tells the two apart.

⚠️ **Gotcha.** `scanner.Scan()` returning `false` does **not** mean "success." It means "stop looping" — which could be a normal EOF *or* a real I/O error. Always check `scanner.Err()` after the loop, or a disk error mid-read will look exactly like a clean finish.

## `panic` and `recover` — the rare exception

**What it actually is.** `panic` *is* Go's exception-like mechanism: it stops normal flow, unwinds the stack running deferred functions, and crashes the program with a stack trace. `recover` (only meaningful inside a `defer`) can catch a panic and stop the unwind. Go has these — it just wants you to almost never use them for ordinary errors.

**When it's appropriate.** Use `panic` for *truly unrecoverable* programmer errors — an impossible state, a violated invariant, a config so broken the program can't sensibly start. Use ordinary error values for everything that's a normal, expected failure (file missing, bad input, network down). The dividing line: "is this a bug, or a Tuesday?" Bugs may panic; Tuesdays return an error.

**A real example.**
```go
package main

import "fmt"

func safeDivide(a, b int) (result int, err error) {
	defer func() {
		if r := recover(); r != nil {
			err = fmt.Errorf("recovered from: %v", r)
		}
	}()
	return a / b, nil // dividing by zero panics
}

func main() {
	_, err := safeDivide(10, 0)
	fmt.Println("err:", err)
}
```
```console
$ go run main.go
err: recovered from: runtime error: integer divide by zero
```
*What just happened:* `10 / 0` triggered a runtime panic, which would normally crash the program. But the deferred function ran during the unwind, called `recover()` (which returned the panic value instead of `nil`), and assigned a normal error to the named return value `err`. So the panic was converted back into an ordinary error the caller could check. This pattern — recover at a boundary, turn the panic into an error — is the main legitimate use of `recover`, and even then it's reserved for guarding against bugs, not handling expected failures.

⚠️ **Gotcha.** Don't use `panic`/`recover` as cheap exceptions to avoid writing `if err != nil`. A panic that escapes a goroutine crashes the *entire* program — `recover` only works in the same goroutine that's unwinding. Errors-as-values is the path; panic is the emergency exit.

## Recap

1. **Errors are values** — a fallible function returns `(result, error)`; you check `if err != nil` right there, where you have the context to act.
2. **Return them** — pass downstream errors up; create your own with `errors.New` / `fmt.Errorf`. Return a zero result alongside a non-nil error.
3. **Wrap with `%w`** — `fmt.Errorf("doing X: %w", err)` adds your context while keeping the original error recoverable.
4. **Inspect with `errors.Is` / `errors.As`** — match a sentinel anywhere in the chain (`Is`), or pull out a specific error *type* and its fields (`As`). Don't use `==`.
5. **I/O** — `os.Open` + `bufio.Scanner` reads line by line; `defer f.Close()`; always check `scanner.Err()` after the loop.
6. **`panic`/`recover`** — Go's real exceptions, reserved for unrecoverable bugs, not everyday failures. ⚠️ Never ignore an error with `_`.

You now write code that runs concurrently and fails honestly. Next we step back from the language to the *toolbox* around it — the batteries-included commands (`go build`, `go test`, `go fmt`) that make Go projects so low-fuss to work in.

---

[← Phase 6: Goroutines & Channels](06-goroutines-and-channels.md) · [Phase 8: The Ecosystem & Tooling →](08-ecosystem-and-tooling.md)
