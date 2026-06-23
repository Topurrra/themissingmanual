---
title: "Error Handling, Deep — Wrapping, Inspecting & Recovering"
guide: "go-from-zero"
phase: 13
summary: "Go past 'if err != nil': add context by wrapping with %w, inspect chains with errors.Is and errors.As, design sentinel and custom error types, and learn the one rule for when panic and recover are actually the right tool."
tags: [go, golang, errors, error-wrapping, errors-is, errors-as, sentinel-errors, custom-errors, panic, recover]
difficulty: intermediate
synonyms: ["go error wrapping %w", "go errors.Is errors.As", "go sentinel errors", "go custom error type", "go panic recover when to use", "go error handling best practices"]
updated: 2026-06-22
---

# Error Handling, Deep — Wrapping, Inspecting & Recovering

Back in [Phase 7](07-errors-and-io.md) you learned the foundational truth of Go errors: an error is just a value. You return `(result, error)`, you check `if err != nil`, and you deal with the failure right where it happened. That's enough to write honest, correct Go. But it's the *floor*, not the ceiling.

Here's the problem that shows up the moment your programs get real. An error bubbles up through five function calls and lands in your logs as a bare `not found`. Not found *what*? Found by *whom*? At *which step*? The error is a value, but right now it's a value with no memory of its own journey. This phase is about giving errors a memory — and then giving your code the tools to interrogate that memory later.

The mental model: think of an error as a little package that travels up the call stack. At each level, a function can *wrap* it in a new layer, writing its own note on the outside ("loading config: …") without throwing away what's underneath. By the time it reaches the top, it carries the whole story. Wrapping writes that story; `errors.Is` and `errors.As` read it back.

## Adding context by wrapping with `%w`

You met `%w` briefly in Phase 7. Now we slow down and look at what it actually builds.

📝 **Wrapping** — taking an existing error and enclosing it inside a new one that adds context, while keeping a link back to the original. The result is an **error chain**: a stack of errors where each layer knows the one beneath it. You wrap with `fmt.Errorf` using the `%w` ("wrap") verb.

The distinction that matters: `%v` *formats* an error into a string and forgets it; `%w` *links* the new error to the original so it can be recovered later. Same readable message either way — but only `%w` preserves the chain.

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
*What just happened:* Each function added its own note with `%w` as the error travelled up. The final message reads outside-in, like a breadcrumb trail: the top-level intent (`starting server`), then the sub-step (`loading config`), then the root cause (`permission denied`). Nobody had to manually concatenate strings — each layer wrapped the layer below and the chain assembled itself. And crucially, the original `ErrPermission` is *still in there*, recoverable, not flattened into text. That last part is what makes the next section possible.

💡 **Key point.** A good wrap message describes what *this layer* was trying to do — a verb phrase like `loading config` or `fetching user 42` — not a restatement of the error below it. You're adding a sentence to a story, not repeating the last one. Don't end it with a colon or the error itself; `%w` appends that for you.

## Inspecting wrapped errors: `errors.Is` and `errors.As`

A chain you can read with your eyes is nice. A chain your *code* can read is what makes wrapping powerful. Once an error is wrapped, you can no longer ask "is this the not-found error?" with `==`, because the thing you're holding is the *outer* wrapper, not the original.

⚠️ **Gotcha — `==` only sees the outermost layer.** After `fmt.Errorf("loading config: %w", ErrPermission)`, the value you hold is a brand-new error whose identity is *not* `ErrPermission`. So `err == ErrPermission` is `false`, even though `ErrPermission` is sitting right there one layer down. Comparing wrapped errors with `==` will silently miss the match and send you down the wrong branch. This is the single most common wrapping bug.

The fix is two standard-library functions that walk the *entire* chain for you.

- **`errors.Is(err, target)`** — returns true if `err`, or anything it wraps, *is* the specific sentinel value `target`. Use it to answer "is this (somewhere) a known error?"
- **`errors.As(err, &target)`** — returns true if `err`, or anything it wraps, is of a specific *type*; if so, it fills in `target` so you can read that type's fields. Use it to answer "is this a known *kind* of error, and what's inside it?"

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
*What just happened:* `err == ErrPermission` was `false` — the value we held was the outermost `starting server: …` wrapper, a different object entirely. But `errors.Is` peeled the chain layer by layer, found the original `ErrPermission` at the bottom, and matched it. That's the whole reason `errors.Is` exists: identity through wrapping. Reach for it any time you'd be tempted to write `err == someKnownError`.

## Sentinel errors — a known value to match against

Both examples above lean on a `var ErrPermission = errors.New(...)`. That's a **sentinel error**, and it's worth naming the pattern.

📝 **Sentinel error** — a package-level error value, declared once with `errors.New`, that callers compare against with `errors.Is` to recognize a specific, expected condition. The name conventionally starts with `Err`. The standard library is full of them: `io.EOF`, `sql.ErrNoRows`, `os.ErrNotExist`.

They shine when a failure is a single, well-known *condition* the caller will branch on — "the row wasn't found," "we hit end of file." The caller writes `if errors.Is(err, sql.ErrNoRows)` and handles that case specifically.

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
*What just happened:* `findUser` wrapped the sentinel with call context, and the caller used `errors.Is` to recognize *exactly* the not-found case and respond to it (a 404) while letting any other error fall through to a different branch. The sentinel is the shared vocabulary: the producer publishes `ErrNotFound`, the consumer matches on it.

⚠️ **Gotcha — sentinels are an API promise.** The moment you export `ErrNotFound`, every caller that writes `errors.Is(err, ErrNotFound)` is *coupled* to it. You can't rename or remove it without breaking them, and you can't attach any per-occurrence detail (which user? which id?) because it's one shared, immutable value. Sentinels are perfect for plain yes/no conditions. When the caller needs *structured data* about the failure, you've outgrown them — which is exactly what custom error types are for.

## Custom error types — errors that carry data

A sentinel says "this kind of thing went wrong." A custom error type says "this kind of thing went wrong, and here are the specifics." It's an ordinary struct that satisfies the `error` interface by having an `Error() string` method — so it's a real error you can return, but with fields callers can pull out.

📝 **Custom error type** — a struct that implements `error` (i.e., has an `Error() string` method), letting a single error value carry structured fields (a field name, a code, an offending value). Callers extract it from a chain with `errors.As`.

This is where `errors.As` earns its place. `errors.Is` checks identity against a value; `errors.As` checks for a *type* and hands you the value so you can read its fields.

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
*What just happened:* `ValidationError` is a normal struct, but because it has an `Error()` method it *is* an `error` — so `register` could wrap and return it like any other. At the top, `errors.As(err, &ve)` walked the chain, found a `*ValidationError` underneath the `register:` wrapper, and copied it into `ve`. Now we have the structured detail — `ve.Field` is `"age"` — not just a string we'd have to parse. That's the power split: `errors.Is` for "is it this specific error?", `errors.As` for "is it this *kind* of error, and give me its data."

💡 **Key point.** Note the pointer receiver `(e *ValidationError)` and the `&` everywhere — you return `&ValidationError{...}` and match with `var ve *ValidationError; errors.As(err, &ve)`. Using a pointer type consistently is the idiomatic choice and avoids a subtle mismatch where `errors.As` won't find a value type when you searched for a pointer (or vice versa). Pick pointer, stay pointer.

## `panic` and `recover` — the rare escape hatch

Everything so far has been about *expected* failures — the file might be missing, the input might be garbage, the user might not exist. Go has a *second*, completely separate mechanism for a different category of problem entirely: `panic`.

📝 **`panic`** — stops normal execution immediately, runs any deferred functions as it unwinds the stack, and crashes the program with a stack trace. **`recover`** — callable only inside a deferred function, it catches a panic mid-unwind and lets the program carry on instead of dying.

The reason Go *has* these but tells you to almost never use them comes down to one distinction: errors are for failures you *expected could happen*; panic is for situations that *should be impossible*. A missing file is a Tuesday — return an error. An index that's out of range on a slice you just built, a `nil` pointer you swore was set, a `switch` hitting a `default` that your own code's invariants say can never occur — those are *bugs*, signs the program is in a state its author thought unreachable. There's no sensible "handle it and continue" for a violated assumption, so panic crashes loudly and gives you a stack trace to fix the bug.

⚠️ **Gotcha — don't use panic for normal control flow.** It's tempting, coming from exception-based languages, to `panic` on bad input and `recover` somewhere up top instead of threading `error` returns through your functions. Resist it. Panic skips the explicit, checkable error path Go is built around, it unwinds across function boundaries invisibly (the opposite of "deal with it where it happens"), and — the real teeth — a panic that escapes a goroutine crashes the *entire process*, because `recover` only works in the same goroutine that's unwinding. Errors-as-values is the road; panic is the emergency exit, not a shortcut.

So when is `recover` legitimate? At a **boundary** where one unit of work must not be allowed to take down the whole program. The classic case: a server handling many requests. If one request triggers a panic from a bug deep in a handler, you'd rather fail *that one request* than crash the process and drop everyone else's.

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
*What just happened:* The `"bad"` request panicked — which would normally crash the program on the spot. But `handle` had a deferred function that called `recover()`; during the unwind, `recover()` returned the panic value (instead of `nil`), and we turned it into an ordinary `error` assigned to the named return value `err`. So the panic was *contained* at the request boundary: that one request failed with an error, the loop continued, and the next `"good"` request was handled normally. The program survived. This recover-at-the-boundary pattern is the main place you'll legitimately see `recover` — and even here it's a safety net for bugs, not a handler for expected failures.

💡 **The rule, in one line.** Return an `error` for anything that could reasonably happen; `panic` only for "this should never happen." If you can write a sentence describing when the failure occurs in normal operation, it's an error. If the only honest description is "a bug in my code," it's a panic.

## Recap

1. **Wrap to add context.** `fmt.Errorf("doing X: %w", err)` encloses an error in a new layer while keeping a link to the original, building an **error chain** that reads outside-in. `%w` preserves the chain; `%v` only formats text.
2. **Inspect with `errors.Is`.** It walks the whole chain to match a known **sentinel** value. ⚠️ Never use `==` on a wrapped error — it sees only the outermost layer and silently misses the match.
3. **Extract with `errors.As`.** It walks the chain to find a specific error *type* and fills your variable so you can read its fields — the tool for **custom error types**.
4. **Sentinels vs. custom types.** Use a sentinel (`var ErrX = errors.New(...)`) for a plain known *condition*; use a custom struct error when callers need *structured data* about what went wrong. Sentinels are an API promise; types carry detail.
5. **`panic` is not error handling.** Return errors for expected failures; reserve `panic` for impossible states (bugs). ⚠️ A panic that escapes a goroutine crashes the whole process.
6. **`recover` at a boundary.** A deferred `recover()` can contain a panic at a request/job boundary so one bad unit of work doesn't kill the program — a safety net for bugs, not a control-flow tool.

You now make errors carry their own story and read it back in code. Next we drop below the language itself, into the **runtime** — how the scheduler juggles goroutines onto OS threads, and how Go's memory and garbage collector keep all of this fast.

## Quick check

Test yourself on the two ideas that do the heavy lifting here — wrapping and the panic/error divide:

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
    "explain": "A sentinel is one shared, immutable value — great for a yes/no condition, but it can't carry per-occurrence detail. A custom error type holds fields callers pull out with errors.As. (Both sentinels and custom types wrap fine, so that's not the deciding factor.)"
  },
  {
    "q": "Which situation is the appropriate use of `panic` rather than returning an error?",
    "choices": [
      "An invariant your own code guarantees is violated — a 'this should never happen' bug",
      "A user submitted a malformed form field",
      "A network request timed out",
      "A configuration file the program expects might be missing"
    ],
    "answer": 0,
    "explain": "panic is for impossible states — bugs where an assumption the author believed unreachable was violated. Malformed input, timeouts, and missing files are all expected, normal failures; those are 'Tuesdays' and should be returned as errors and checked with `if err != nil`."
  }
]
```

---

[← Phase 12: Concurrency Patterns](12-concurrency-patterns.md) · [Guide overview](_guide.md) · [Phase 14: The Runtime: Scheduler, Memory & GC →](14-runtime-scheduler-and-memory.md)
