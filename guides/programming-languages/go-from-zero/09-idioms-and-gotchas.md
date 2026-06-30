---
title: "Idioms & Common Gotchas"
guide: "go-from-zero"
phase: 9
summary: "The conventions that make Go feel like Go - small implicitly-satisfied interfaces, struct embedding for composition, 'accept interfaces, return structs,' and defer for cleanup - plus a cheat-card of the gotchas that bite everyone once."
tags: [go, golang, idioms, interfaces, struct-embedding, composition, defer, gotchas, nil-interface, slice-append]
difficulty: intermediate
synonyms: ["go interfaces explained", "go struct embedding", "accept interfaces return structs", "go defer explained", "go nil interface is not nil", "go slice append gotcha", "go loop variable capture", "go zero values", "exported vs unexported go"]
updated: 2026-06-19
---

# Idioms & Common Gotchas

You can write working Go without knowing any of this. But the gap between "compiles and runs" and "looks like Go" is a handful of conventions that, once they click, make the language feel coherent instead of arbitrary. And there's a short list of gotchas - most of them about how Go quietly *shares* memory under the hood - that bite essentially every Go developer exactly once. The kind thing is to show you the trap before you step in it.

The mental model for the idioms: Go prefers *small, composable pieces over big inheritance hierarchies*. Small interfaces. Structs glued together by embedding. Functions that take a narrow interface and hand back a concrete thing. The mental model for the gotchas: *Go does what it says, not what you assumed* - and the assumptions that trip people up are almost always about slices, loops, and `nil`.

## Interfaces: small, and satisfied implicitly

**What it actually is.** An interface is a list of method signatures - a description of behavior, not data. Go's twist: a type satisfies an interface *automatically*, just by having the right methods. There's no `implements` keyword, no declaration linking the type to the interface. If it has the methods, it fits.

**Why this changes how you design.** Because satisfaction is implicit, interfaces in Go are usually *tiny* - often a single method - and they're frequently defined by the *consumer*, not the producer. The most famous is `io.Writer`, which is just:
```go
type Writer interface {
	Write(p []byte) (n int, err error)
}
```
Anything with a `Write([]byte) (int, error)` method *is* an `io.Writer` - a file, a network connection, an in-memory buffer, an HTTP response - without any of them ever mentioning the interface.

**A real example.**
```go
package main

import (
	"fmt"
	"os"
	"strings"
)

func greet(w fmt.Stringer) { // any type with a String() string method fits
	fmt.Println(w.String())
}

type user struct{ name string }

func (u user) String() string { return "user: " + u.name }

func main() {
	greet(user{name: "Ada"}) // user satisfies fmt.Stringer just by having String()

	// And io.Writer in action: the same Fprintln targets a file or a buffer.
	var sb strings.Builder
	fmt.Fprintln(os.Stdout, "to the terminal")
	fmt.Fprintln(&sb, "to a buffer")
	fmt.Print(sb.String())
}
```
```console
$ go run main.go
user: Ada
to the terminal
to a buffer
```
*What just happened:* `user` became a `fmt.Stringer` purely by having a `String()` method - we never declared the relationship. And `fmt.Fprintln` wrote to two completely different destinations (the terminal and an in-memory `strings.Builder`) because both satisfy `io.Writer`. Small interfaces plus implicit satisfaction is why Go code composes so freely: you write to "anything that can be written to," and the caller picks what that is.

## Struct embedding: composition over inheritance

**What it actually is.** Go has no class inheritance. Instead, you *embed* one struct inside another by declaring it without a field name, and the outer struct gets the inner one's fields and methods promoted as if they were its own. It's composition that *reads* like inheritance, without the hierarchy.

**A real example.**
```go
package main

import "fmt"

type Engine struct{ Horsepower int }

func (e Engine) Start() { fmt.Println("vroom") }

type Car struct {
	Engine // embedded - no field name
	Brand  string
}

func main() {
	c := Car{Engine: Engine{Horsepower: 200}, Brand: "Tesla"}
	c.Start()                  // promoted from Engine
	fmt.Println(c.Horsepower)  // promoted field, no c.Engine.Horsepower needed
}
```
```console
$ go run main.go
vroom
200
```
*What just happened:* `Car` embedded `Engine`, so `c.Start()` and `c.Horsepower` worked directly - the `Engine`'s method and field were *promoted* onto `Car`. There's no inheritance here: `Car` *has an* `Engine` and borrows its surface. This is Go's answer to "I want to reuse behavior" - you compose pieces together rather than building a tower of base classes.

## "Accept interfaces, return structs"

**What it actually is.** A widely-followed Go design guideline: make your function *parameters* interfaces (so callers can pass anything that fits), but make your *return values* concrete structs (so callers get the real thing with all its methods).

**Why it works.** Accepting an interface keeps your function flexible - `func Save(w io.Writer, ...)` accepts a file, a buffer, a socket, anything writable. Returning a concrete struct keeps your *output* honest and useful - the caller gets the full type, can see exactly what they have, and you're free to add methods later without breaking an interface contract. It's the "be liberal in what you accept, conservative in what you return" principle, applied to types.

💡 **Key point.** When in doubt: parameter types should be as *small and general* as the function actually needs (often a one-method interface); return types should be the *concrete* struct. Don't define an interface "just in case" for a return - define it where it's *consumed*.

## `defer`: cleanup that can't be forgotten

**What it actually is.** `defer` schedules a function call to run when the *surrounding function* returns - no matter how it returns (normal path, early `return`, or a panic). It's how Go guarantees cleanup sits right next to the thing that needs cleaning up.

**Why it's the idiom for cleanup.** You open something, then immediately `defer` closing it. The two lines live together, so you can't open-without-closing, and you can't forget the close at the bottom of a long function with five early returns. Deferred calls run in *last-in, first-out* order, which is exactly right for nested resources (close the inner thing before the outer).

**A real example.**
```go
package main

import "fmt"

func main() {
	defer fmt.Println("3. cleanup runs last")
	fmt.Println("1. start")
	fmt.Println("2. work")
}
```
```console
$ go run main.go
1. start
2. work
3. cleanup runs last
```
*What just happened:* The `defer` was written *first* but ran *last* - Go held that call until `main` was about to return, then ran it. This is why `defer f.Close()` right after `os.Open` ([Phase 7](07-errors-and-io.md)) is bulletproof: the close is guaranteed to fire on the way out, even if a `return` or panic happens in between. Pair every "open / lock / acquire" with an immediate `defer` of its "close / unlock / release."

## The gotcha cheat-card

These are the traps that get *everyone* once. Skim them now so they're familiar when they happen; the notes below explain the two sharpest.

| Gotcha | What bites you | The fix |
|---|---|---|
| **A nil interface is not nil** | Returning a typed-but-nil pointer as an `error` makes `err != nil` true even though "there's no error" | Return a literal `nil` for the error, never a nil-valued concrete type held in an interface |
| **Slice `append` aliasing** | `append` may return a slice that *shares* the original's backing array, so writing to one silently changes the other | If you need independence, `copy` into a fresh slice (or append to a `nil`/fresh slice) |
| **Range loop variable capture (pre-1.22)** | In Go ≤1.21, goroutines/closures in a `for` loop all captured the *same* loop variable, seeing only its final value | Go **1.22+** fixed this (each iteration gets a fresh variable); on older Go, copy `v := v` inside the loop |
| **Unused imports / variables won't compile** | A leftover import or an unused local is a *compile error*, not a warning | Delete it - or use the blank identifier `_` deliberately for an intentionally-unused import |
| **Exported = Capitalized** | A lowercase name (`doThing`, `count`) is package-private; only `DoThing`, `Count` are visible to other packages | Capitalize the first letter to export; this *is* the visibility rule, there's no `public` keyword |
| **Zero values, not "undefined"** | An uninitialized variable isn't null/garbage - it's the type's *zero value* (`0`, `""`, `false`, `nil` for pointers/slices/maps) | Lean on it (`var count int` is a usable `0`); but ⚠️ a `nil` map can be *read* but panics if you *write* to it - `make` it first |

⚠️ **The nil-interface trap, explained.** This one is genuinely confusing the first time, and it's worth slowing down for:
```go
package main

import "fmt"

type myError struct{}

func (e *myError) Error() string { return "boom" }

func doThing() error {
	var p *myError = nil // a nil pointer...
	return p             // ...returned as an error interface
}

func main() {
	err := doThing()
	fmt.Println(err == nil) // false!  - surprising
}
```
```console
$ go run main.go
false
```
*What just happened:* An interface value carries *two* things: a type and a value. `doThing` returned a `*myError` that was nil - but the interface now holds the *type* `*myError` plus a nil value, and an interface is only equal to `nil` when *both* parts are empty. So `err == nil` is `false` even though the underlying pointer is nil, and the caller's `if err != nil` wrongly thinks there was an error. The fix is to return a *bare* `nil` (`return nil`) when there's no error - never a nil-valued concrete type stuffed into the interface.

⚠️ **Slice append aliasing, explained.** A slice is a small header (pointer, length, capacity) over a backing array. `append` reuses that array when there's spare capacity - which means two slices can quietly point at the same memory:
```go
package main

import "fmt"

func main() {
	a := []int{1, 2, 3}
	b := a[:2]              // b shares a's backing array
	b = append(b, 99)      // capacity to spare → overwrites a[2] in place!
	fmt.Println(a)         // [1 2 99]  - a changed without you touching it
}
```
```console
$ go run main.go
[1 2 99]
```
*What just happened:* `b := a[:2]` made `b` a window onto the same array as `a`, with room left over. `append(b, 99)` had spare capacity, so instead of allocating, it wrote `99` into the slot `a[2]` was using - mutating `a` as a side effect. When you need a slice you can grow without disturbing the original, copy the data into a fresh slice first. This is the slice gotcha; it surfaces as "why did this other variable change?"

📝 **Terminology.** A *zero value* is the default Go gives every variable you don't initialize - `0` for numbers, `""` for strings, `false` for bools, `nil` for pointers, slices, and maps. Go has no "uninitialized garbage" and no separate `null` concept layered on top; the zero value *is* the starting state, and good Go leans on it (an empty `sync.Mutex` is ready to use, a `nil` slice appends fine).

## Recap

1. **Interfaces are small and implicit** - satisfied automatically by having the methods; often one method, often defined by the consumer (`io.Writer`).
2. **Embedding, not inheritance** - compose structs by embedding; fields and methods get promoted.
3. **Accept interfaces, return structs** - flexible inputs, concrete outputs.
4. **`defer` for cleanup** - schedule the close/unlock right next to the open/lock; it runs on every exit path, LIFO.
5. **The cheat-card** - nil interface ≠ nil, slice append aliasing, range-var capture (fixed in 1.22), unused imports/vars are errors, exported = Capitalized, and zero values are real defaults (but don't write to a nil map).

That's idiomatic Go. You can now read other people's Go and write code that looks like it belongs. The last phase is short and honest: where Go actually shines, what to build next, and where to go from here.

---

[← Phase 8: The Ecosystem & Tooling](08-ecosystem-and-tooling.md) · [Guide overview](_guide.md) · [Phase 10: Interfaces in Depth →](10-interfaces-in-depth.md)
