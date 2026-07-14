---
title: "Error Handling, Deep - Wrapping, Inspecting & Recovering"
guide: "go-from-zero"
phase: 13
summary: "Go past 'if err != nil': add context by wrapping with %w, inspect chains with errors.Is and errors.As, design sentinel and custom error types, and learn the one rule for when panic and recover are actually the right tool."
tags: [go, golang, errors, error-wrapping, errors-is, errors-as, sentinel-errors, custom-errors, panic, recover]
difficulty: intermediate
synonyms: ["go error wrapping %w", "go errors.Is errors.As", "go sentinel errors", "go custom error type", "go panic recover when to use", "go error handling best practices"]
updated: 2026-06-22
---

# Error Handling, Deep - Wrapping, Inspecting & Recovering

Back in [Phase 7](07-errors-and-io.md) you learned the foundational truth of Go errors: an error is just a value. Return `(result, error)`, check `if err != nil`, deal with the failure right where it happened. That's enough to write clean, correct Go - but it's the *floor*, not the ceiling.

Here's the problem once programs get real. An error bubbles up through five function calls and lands in your logs as a bare `not found`. Not found *what*? By *whom*? At *which step*? The error has no memory of its own journey. This phase gives errors a memory, and your code the tools to interrogate it later.

The mental model: an error is a package that travels up the call stack. At each level, a function can *wrap* it in a new layer, writing its own note on the outside ("loading config: …") without discarding what's underneath, so by the top it carries the whole story. Wrapping writes it; `errors.Is` and `errors.As` read it back.

## Adding context by wrapping with `%w`

You met `%w` briefly in Phase 7 - now let's look at what it actually builds.

📝 **Wrapping** - enclosing an existing error inside a new one that adds context, while keeping a link back to the original. The result is an **error chain**: a stack of errors where each layer knows the one beneath it, built with `fmt.Errorf` using the `%w` ("wrap") verb.

The distinction that matters: `%v` *formats* an error into a string and forgets it; `%w` *links* the new error to the original so it can be recovered later. Same readable message, but only `%w` preserves the chain.

```go
package main

import (
	"errors"
	"fmt"
)

var ErrPermission = errors.New("permission denied")

func readSecret() error {
	return ErrPermission // the low-level failure
}

func loadConfig() error {
	if err := readSecret(); err != nil {
		return fmt.Errorf("loading config: %w", err) // wrap it
	}
	return nil
}

func startServer() error {
	if err := loadConfig(); err != nil {
		return fmt.Errorf("starting server: %w", err) // wrap again
	}
	return nil
}

func main() {
	err := startServer()
	fmt.Println(err)
}
```
```console
$ go run main.go
starting server: loading config: permission denied
```
*What just happened:* Each function added its own note with `%w` as the error travelled up, reading outside-in like a breadcrumb trail: top-level intent (`starting server`), sub-step (`loading config`), root cause (`permission denied`) - no manual string concatenation, each layer wrapped the one below. Crucially, the original `ErrPermission` is *still in there*, recoverable, not flattened into text - what makes the next section possible.

💡 **Key point.** A good wrap message describes what *this layer* was trying to do - `loading config`, `fetching user 42` - not a restatement of the error below it. Don't end it with a colon or the error itself; `%w` appends that for you.

## Inspecting wrapped errors: `errors.Is` and `errors.As`

A chain you can read with your eyes is nice; a chain your *code* can read is what makes wrapping powerful. Once wrapped, you can no longer ask "is this the not-found error?" with `==`, because you're holding the *outer* wrapper, not the original.

⚠️ **Gotcha - `==` only sees the outermost layer.** After `fmt.Errorf("loading config: %w", ErrPermission)`, the value you hold is a brand-new error whose identity is *not* `ErrPermission`, so `err == ErrPermission` is `false` even though `ErrPermission` sits one layer down. Comparing wrapped errors with `==` silently misses the match - the single most common wrapping bug.

The fix: two standard-library functions that walk the *entire* chain for you.

- **`errors.Is(err, target)`** - returns true if `err`, or anything it wraps, *is* the specific sentinel value `target`. Use it to answer "is this (somewhere) a known error?"
- **`errors.As(err, &target)`** - returns true if `err`, or anything it wraps, is of a specific *type*; if so, it fills in `target` so you can read that type's fields. Use it to answer "is this a known *kind* of error, and what's inside it?"

Here's `errors.Is` matching through the same three-layer chain from above:

```go
package main

import (
	"errors"
	"fmt"
)

var ErrPermission = errors.New("permission denied")

func startServer() error {
	return fmt.Errorf("starting server: %w",
		fmt.Errorf("loading config: %w", ErrPermission))
}

func main() {
	err := startServer()

	fmt.Println("== check:  ", err == ErrPermission)      // outer wrapper, not equal
	fmt.Println("Is check:  ", errors.Is(err, ErrPermission)) // walks the chain
}
```
```console
$ go run main.go
== check:   false
Is check:   true
```
*What just happened:* `err == ErrPermission` was `false` - the outermost wrapper, a different object entirely. But `errors.Is` peeled the chain layer by layer, found `ErrPermission` at the bottom, and matched it. That's the whole reason `errors.Is` exists: identity through wrapping. Reach for it any time you'd write `err == someKnownError`.

## Sentinel errors - a known value to match against

Both examples above lean on `var ErrPermission = errors.New(...)` - a **sentinel error**, worth naming as a pattern.

📝 **Sentinel error** - a package-level error value, declared once with `errors.New`, that callers compare against with `errors.Is` to recognize a specific, expected condition. The name conventionally starts with `Err`; the standard library is full of them: `io.EOF`, `sql.ErrNoRows`, `os.ErrNotExist`.

They shine when a failure is a single, well-known *condition* the caller will branch on - "the row wasn't found," "we hit end of file" - via `if errors.Is(err, sql.ErrNoRows)`.

```go
package main

import (
	"errors"
	"fmt"
)

var ErrNotFound = errors.New("user not found")

func findUser(id int) error {
	if id != 1 {
		return fmt.Errorf("findUser(%d): %w", id, ErrNotFound)
	}
	return nil
}

func main() {
	err := findUser(99)
	if errors.Is(err, ErrNotFound) {
		fmt.Println("handle gracefully: show a 404")
	} else if err != nil {
		fmt.Println("some other failure:", err)
	}
}
```
```console
$ go run main.go
handle gracefully: show a 404
```
*What just happened:* `findUser` wrapped the sentinel with call context, and the caller used `errors.Is` to recognize *exactly* the not-found case and respond (a 404) while letting other errors fall through. The sentinel is shared vocabulary: the producer publishes `ErrNotFound`, the consumer matches on it.

⚠️ **Gotcha - sentinels are an API promise.** Once you export `ErrNotFound`, every caller writing `errors.Is(err, ErrNotFound)` is *coupled* to it - you can't rename or remove it without breaking them, and you can't attach per-occurrence detail (which user? which id?) since it's one shared, immutable value. Sentinels suit plain yes/no conditions; when the caller needs *structured data*, you've outgrown them - what custom error types are for.

## Custom error types - errors that carry data

A sentinel says "this kind of thing went wrong." A custom error type says "here are the specifics" - an ordinary struct satisfying the `error` interface via an `Error() string` method, a real error you can return but with fields callers can pull out.

📝 **Custom error type** - a struct implementing `error` (an `Error() string` method), letting a single error value carry structured fields (a field name, a code, an offending value). Callers extract it from a chain with `errors.As`.

`errors.Is` checks identity against a value; `errors.As` checks for a *type* and hands you the value so you can read its fields.

```go
package main

import (
	"errors"
	"fmt"
)

// A struct that is also an error.
type ValidationError struct {
	Field string
	Msg   string
}

func (e *ValidationError) Error() string {
	return fmt.Sprintf("validation failed on %q: %s", e.Field, e.Msg)
}

func register(age int) error {
	if age < 0 {
		return fmt.Errorf("register: %w",
			&ValidationError{Field: "age", Msg: "must not be negative"})
	}
	return nil
}

func main() {
	err := register(-5)

	var ve *ValidationError
	if errors.As(err, &ve) { // pull the concrete type out of the chain
		fmt.Println("field that failed:", ve.Field)
		fmt.Println("full message:     ", err)
	}
}
```
```console
$ go run main.go
field that failed: age
full message:      register: validation failed on "age": must not be negative
```
*What just happened:* `ValidationError`'s `Error()` method makes it an `error`, so `register` wrapped and returned it like any other. `errors.As(err, &ve)` walked the chain, found a `*ValidationError` underneath, and copied it into `ve` - structured detail (`ve.Field` is `"age"`), not just a string to parse. The power split: `errors.Is` for "is it this specific error?", `errors.As` for "is it this *kind*, and give me its data."

💡 **Key point.** Note the pointer receiver and the `&` everywhere - return `&ValidationError{...}`, match with `var ve *ValidationError; errors.As(err, &ve)`. Using a pointer type consistently avoids a subtle mismatch where `errors.As` won't find a value type when you searched for a pointer. Pick pointer, stay pointer.

## `panic` and `recover` - the rare escape hatch

Everything so far has been *expected* failures - a missing file, garbage input, an absent user. Go has a *second*, separate mechanism for a different category of problem: `panic`.

📝 **`panic`** - stops normal execution immediately, runs deferred functions as it unwinds the stack, and crashes the program with a stack trace. **`recover`** - callable only inside a deferred function, catches a panic mid-unwind and lets the program carry on instead of dying.

The reason Go has these but says to almost never use them: errors are for failures you *expected could happen*; panic is for situations that *should be impossible*. A missing file is a Tuesday - return an error. An index out of range on a slice you just built, a `nil` pointer you swore was set, a `switch` hitting a `default` your own invariants say can't occur - those are *bugs*, states the author thought unreachable. There's no sensible "handle it and continue" for a violated assumption, so panic crashes loudly with a stack trace to fix it.

⚠️ **Gotcha - don't use panic for normal control flow.** Coming from exception-based languages it's tempting to `panic` on bad input and `recover` up top instead of threading `error` returns through. Resist it: panic skips the explicit, checkable error path Go is built around, unwinds invisibly across function boundaries, and - the real teeth - a panic escaping a goroutine crashes the *entire process*, since `recover` only works in the same goroutine that's unwinding. Errors-as-values is the road; panic is the emergency exit.

So when is `recover` legitimate? At a **boundary** where one unit of work must not take down the whole program - a server handling many requests. If one request panics from a bug deep in a handler, you'd rather fail *that one request* than crash the process for everyone else.

```go
package main

import "fmt"

// handle runs one request and converts any panic into a returned error,
// so a bug in handling one request can't crash the whole server.
func handle(req string) (err error) {
	defer func() {
		if r := recover(); r != nil {
			err = fmt.Errorf("recovered from panic handling %q: %v", req, r)
		}
	}()

	if req == "bad" {
		panic("unexpected nil in handler") // simulate a bug deep in the call stack
	}
	fmt.Printf("handled %q OK\n", req)
	return nil
}

func main() {
	for _, req := range []string{"good", "bad", "good"} {
		if err := handle(req); err != nil {
			fmt.Println("ERROR:", err)
		}
	}
	fmt.Println("server still running")
}
```
```console
$ go run main.go
handled "good" OK
ERROR: recovered from panic handling "bad": unexpected nil in handler
server still running
```
*What just happened:* The `"bad"` request panicked - normally a program-ending event. But `handle`'s deferred `recover()` caught the panic value mid-unwind and turned it into an ordinary `error` assigned to the named return `err`. The panic was *contained* at the request boundary: that request failed, the loop continued, the next `"good"` request ran normally - the program survived. This recover-at-the-boundary pattern is the main legitimate use of `recover`: a safety net for bugs, not a handler for expected failures.

💡 **The rule, in one line.** Return an `error` for anything that could reasonably happen; `panic` only for "this should never happen." A sentence describing when the failure occurs normally means error; "a bug in my code" means panic.

## Recap

1. **Wrap to add context.** `fmt.Errorf("doing X: %w", err)` encloses an error in a new layer while keeping a link to the original, building an **error chain** that reads outside-in. `%w` preserves the chain; `%v` only formats text.
2. **Inspect with `errors.Is`.** Walks the whole chain to match a known **sentinel** value. ⚠️ Never use `==` on a wrapped error - it sees only the outermost layer.
3. **Extract with `errors.As`.** Walks the chain to find a specific error *type* and fills your variable so you can read its fields - the tool for **custom error types**.
4. **Sentinels vs. custom types.** Use a sentinel (`var ErrX = errors.New(...)`) for a plain known *condition*; use a custom struct error when callers need *structured data*. Sentinels are an API promise; types carry detail.
5. **`panic` is not error handling.** Return errors for expected failures; reserve `panic` for impossible states (bugs). ⚠️ A panic that escapes a goroutine crashes the whole process.
6. **`recover` at a boundary.** A deferred `recover()` can contain a panic at a request/job boundary so one bad unit of work doesn't kill the program - a safety net, not a control-flow tool.

You now make errors carry their own story and read it back in code. Next: the **runtime** - how the scheduler juggles goroutines onto OS threads, and how Go's memory and garbage collector keep it all fast.

## Quick check

Test yourself on the two ideas that do the heavy lifting here - wrapping and the panic/error divide:

```quiz
[
  {
    "q": "You have `err := fmt.Errorf(\"loading config: %w\", ErrNotFound)`. Which check correctly detects that `ErrNotFound` is in the chain?",
    "choices": [
      "errors.Is(err, ErrNotFound)",
      "err == ErrNotFound",
      "errors.As(err, ErrNotFound)",
      "err.Error() == ErrNotFound.Error()"
    ],
    "answer": 0,
    "explain": "errors.Is walks the entire chain and matches the sentinel underneath the wrapper. `==` is false because `err` is the outer wrapper, not the original; errors.As is for matching a type (and needs a pointer to a target); comparing message strings is fragile and not how identity works."
  },
  {
    "q": "When should you reach for a custom error type (a struct implementing `error`) instead of a sentinel error?",
    "choices": [
      "When callers need structured data about the failure (a field name, a code) that they extract with errors.As",
      "Whenever an error might be wrapped, since sentinels can't be wrapped",
      "Only inside deferred functions that call recover",
      "When you want the error to be faster to compare than a sentinel"
    ],
    "answer": 0,
    "explain": "A sentinel is one shared, immutable value - great for a yes/no condition, but it can't carry per-occurrence detail. A custom error type holds fields callers pull out with errors.As. (Both sentinels and custom types wrap fine, so that's not the deciding factor.)"
  },
  {
    "q": "Which situation is the appropriate use of `panic` rather than returning an error?",
    "choices": [
      "An invariant your own code guarantees is violated - a 'this should never happen' bug",
      "A user submitted a malformed form field",
      "A network request timed out",
      "A configuration file the program expects might be missing"
    ],
    "answer": 0,
    "explain": "panic is for impossible states - bugs where an assumption the author believed unreachable was violated. Malformed input, timeouts, and missing files are all expected, normal failures; those are 'Tuesdays' and should be returned as errors and checked with `if err != nil`."
  }
]
```

---

[← Phase 12: Concurrency Patterns](12-concurrency-patterns.md) · [Guide overview](_guide.md) · [Phase 14: The Runtime: Scheduler, Memory & GC →](14-runtime-scheduler-and-memory.md)
