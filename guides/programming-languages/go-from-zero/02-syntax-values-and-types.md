---
title: "Syntax, Values & Types"
guide: "go-from-zero"
phase: 2
summary: "Declare values with var and the := shortcut, understand Go's static typing and basic types, rely on zero values so nothing is ever uninitialized, and print with Println and Printf - plus the two gotchas that trip up newcomers."
tags: [go, variables, types, zero-values, var, short-declaration, printf]
difficulty: beginner
synonyms: ["var vs := in go", "go data types", "what is a zero value in go", "go static typing explained", "go fmt.Printf format verbs", "go declared and not used error"]
updated: 2026-06-19
---

# Syntax, Values & Types

Real programs hold values - a name, a count, a price - and do things with them. In Go, every value has a
**type**, and the language is strict about it in a way that feels heavy at first but becomes a safety net
fast.

## What "statically typed" actually means

Go is **statically typed**: every variable has a fixed type, known and checked when your code is
*compiled*, before it ever runs. A variable holding a number can never later hold text - the compiler
verifies this up front.

Coming from Python or JavaScript, you might expect a variable to be a box you can drop anything into. In
Go it's a box with a *shape* - number-shaped, text-shaped - and the compiler checks everything you put in
fits. Bugs like "I thought this was a number but it was the text `'42'`" can't survive to runtime; they're
caught while you build.

📝 **Terminology.** A **type** is the kind of value something is - an integer, a piece of text, a
true/false. **Static** means "checked at compile time" (vs. *dynamic*, "checked while running"). Go
checks early, so the running program never has to wonder what type something is.

## `var` - the explicit way to declare a value

The full, spelled-out way to create a variable uses the `var` keyword:
```go
package main

import "fmt"

func main() {
	var name string = "Ada"
	var age int = 36
	fmt.Println(name, "is", age)
}
```
```console
$ go run main.go
Ada is 36
```
`var name string = "Ada"` reads left to right as "declare a variable called `name`, of type `string`
(text), and set it to `"Ada"`." Same for `age`, of type `int`. `fmt.Println` printed all three pieces with
a space between each - the types are written right there, so there's no ambiguity about what each box
holds.

Go can usually figure the type out from the value, so you can drop it and let the compiler *infer* it:
```go
var name = "Ada"   // Go sees "Ada" is text, so name is a string
var age = 36       // Go sees 36 is a whole number, so age is an int
```
`name` is still a `string`, `age` still an `int` - you just didn't spell it out. The variable is no less
typed; the compiler inferred it.

## `:=` - the short declaration you'll use most

Inside a function, Go gives you an even shorter form that *declares and assigns at once*:
```go
package main

import "fmt"

func main() {
	name := "Ada"
	age := 36
	fmt.Println(name, "is", age)
}
```
`name := "Ada"` is the **short variable declaration**. The `:=` means "create a new variable and set it" -
Go infers the type from the value, exactly like `var name = "Ada"` but more compact. This is the form
you'll see and write most in real Go code.

⚠️ **Gotcha - `:=` only works inside functions.** At the top level of a file, you *must* use `var`.
Writing `count := 0` outside a function is a compile error: `:=` is shorthand for a local working
variable, and the top level is for declaring package-level things, `var`'s job. Rule of thumb:
**inside `func` → `:=`; outside → `var`.**

## The basic types you'll actually use

These cover almost everything early on:

- **`int`** - a whole number, positive or negative (`-3`, `0`, `42`). Your default for counting.
- **`float64`** - a number with a decimal point (`3.14`, `-0.5`). The `64` is bits of precision; the
  normal choice for fractional numbers.
- **`string`** - text, written in double quotes (`"hello"`). 
- **`bool`** - a truth value, either `true` or `false`. Named after George Boole.

There are more (smaller and larger integers, an unsigned variety, a single-character `rune`), but reach
for those only with a specific reason. `int`, `float64`, `string`, and `bool` will take you a long way.

## Zero values - why Go variables are never "undefined"

In some languages, a variable you declare but don't set holds garbage, or a `null`/`undefined` that blows
up the moment you touch it. **Go refuses to leave a variable empty.** Every type has a defined **zero
value**, and a freshly declared variable starts there automatically.

```go
package main

import "fmt"

func main() {
	var count int
	var price float64
	var label string
	var ready bool
	fmt.Println(count, price, label, ready)
}
```
```console
$ go run main.go
0 0  false
```
Four variables, none set, yet all start at sensible, predictable values: `int` at `0`, `float64` at `0`,
`string` at `""` (the blank gap between `0` and `false` in the output), `bool` at `false`. Nothing is
"undefined" - you can read any of them immediately without a crash.

💡 **Key point.** The zero value rule means **there is no uninitialized-variable surprise in Go.** Declare
`var count int` and you *know* it's `0` - a whole class of "why is this null?" bugs never happens. Worth
memorizing: numbers → `0`, strings → `""`, bools → `false`. (We'll meet `nil` - the zero value for a few
special types - in [phase 3](03-collections.md); it follows the same rule.)

## The other unused-thing error: `declared and not used`

You met unused *imports* in [phase 1](01-install-and-first-program.md). Variables have the same rule:
declare one and never read it, and Go won't compile.
```go
package main

func main() {
	total := 100
}
```
```console
$ go run main.go
./main.go:4:2: declared and not used: total
```
`total` was never used, so the compiler stopped and pointed at it (`main.go:4:2`). Fix: use the variable
(print it, return it, calculate with it) or delete the line - same philosophy as unused imports.

## Printing properly with `Println` and `Printf`

You've been using `fmt.Println`, which prints its arguments with spaces between them and a trailing
newline - great for quick output. For *control* over the format, reach for `fmt.Printf` ("print
formatted"):
```go
package main

import "fmt"

func main() {
	name := "Ada"
	age := 36
	fmt.Printf("%s is %d years old.\n", name, age)
}
```
```console
$ go run main.go
Ada is 36 years old.
```
`Printf` takes a *format string* with **verbs** - placeholders starting with `%` - filled in by the values
that follow, in order. `%s` means "put a string here," `%d` means "put a whole number (a *decimal*
integer) here," and `\n` is the newline character (`Printf`, unlike `Println`, doesn't add one for you).
Verbs worth knowing now:

- `%s` - a string
- `%d` - an integer
- `%f` - a float (`%.2f` rounds to 2 decimal places)
- `%v` - *any* value in its default form (the helpful catch-all when you're not sure)
- `%t` - a boolean (`true`/`false`)

⚠️ **Gotcha.** Mismatched verbs don't crash Go - it prints a visible complaint right in the output, like
`%!d(string=Ada)`, meaning "you asked for a `%d` integer but handed me the string `Ada`." Ugly on
purpose, so you spot the mismatch instantly instead of shipping wrong output.

## Recap

1. Go is **statically typed**: every variable has a fixed type, checked when you compile.
2. **`var name type = value`** is the explicit declaration; drop the type to let Go **infer** it.
3. **`:=`** declares-and-assigns in one step and is what you'll use most - but **only inside functions**;
   use `var` at the top level.
4. The everyday types: **`int`, `float64`, `string`, `bool`**.
5. **Zero values** mean nothing is ever uninitialized: numbers `0`, strings `""`, bools `false`.
6. **Unused variables are compile errors** (`declared and not used`), just like unused imports.
7. **`fmt.Println`** for quick output; **`fmt.Printf`** with verbs (`%s %d %f %v %t`) for formatted
   output.

Next: from single values to *collections* - arrays, the slices you'll actually use, and maps for looking
things up by name.

---

[← Phase 1: Install & Your First Program](01-install-and-first-program.md) · [Guide overview](_guide.md) · [Phase 3: Collections →](03-collections.md)
