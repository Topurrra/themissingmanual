---
title: "Collections"
guide: "go-from-zero"
phase: 3
summary: "Arrays vs slices (the one you'll actually use), growing slices with append, len and cap, key-value maps, and looping over both with range - including the nil-map panic and slice-aliasing surprises that catch everyone once."
tags: [go, slices, arrays, maps, append, range, collections]
difficulty: beginner
synonyms: ["go slice vs array", "how to use append in go", "go map example", "what is len and cap in go", "range loop in go", "nil map panic go", "go slice append surprise"]
updated: 2026-06-19
---

# Collections

So far you've held one value at a time. Real programs deal in *many* - a list of users, a table of
prices, the words in a sentence. Go gives you a few ways to hold collections, and there's one decision
that trips up newcomers: arrays versus slices. We'll clear that up first, because once you know which to
reach for, everything else falls into place.

## Arrays vs slices - the distinction that matters

**What an array actually is.** An **array** in Go is a fixed-size sequence of values, all the same type.
The size is part of the type: `[3]int` is "exactly three integers" - not two, not four. You can't grow
it. This rigidity makes arrays rare in everyday Go.

**What a slice actually is.** A **slice** is a *flexible-length* view onto a sequence of values. It can
grow and shrink, and it's what Go programmers use almost all the time. Think of a slice as "a list that
can change size." Its type has no number: `[]int` is "a list of integers, however many."

📝 **Terminology.** The empty brackets are the tell. **`[3]int`** (number inside) = array, fixed.
**`[]int`** (nothing inside) = slice, flexible. When in doubt, you want the slice.

Here's a slice in action:
```go
package main

import "fmt"

func main() {
	primes := []int{2, 3, 5, 7}
	fmt.Println(primes)
	fmt.Println(primes[0], primes[3])
}
```
```console
$ go run main.go
[2 3 5 7]
7 2
```
*What just happened:* `[]int{2, 3, 5, 7}` created a slice holding four integers. Printing the whole slice
shows it in brackets. `primes[0]` reads the **first** element (Go counts from zero, like most languages),
and `primes[3]` reads the fourth - so we printed `7` then `2`. Indexing past the end (say `primes[4]`)
would crash with an out-of-range error, because there's no fifth element to read.

## Growing a slice with `append`

A slice's whole point is that it can grow. You do that with the built-in `append` function:
```go
package main

import "fmt"

func main() {
	names := []string{"Ada", "Alan"}
	names = append(names, "Grace")
	fmt.Println(names)
}
```
```console
$ go run main.go
[Ada Alan Grace]
```
*What just happened:* `append(names, "Grace")` produced a slice with `"Grace"` added on the end. The part
that surprises people: **you assign the result back to `names`.** `append` doesn't always change the
original in place - it may build a bigger slice and hand it back - so the idiom is *always*
`names = append(names, ...)`. Forget the `names =` and your addition vanishes.

You can append several at once, or even append one slice onto another:
```go
names = append(names, "Linus", "Margaret")
```
*What just happened:* `append` takes the slice first, then any number of new values, and returns the
grown slice. Same rule: capture the result.

## `len` and `cap` - length vs capacity

Two built-in functions tell you about a slice's size:
```go
package main

import "fmt"

func main() {
	s := []int{10, 20, 30}
	fmt.Println(len(s), cap(s))
}
```
```console
$ go run main.go
3 3
```
*What just happened:* `len(s)` is the **length** - how many elements the slice actually holds right now
(3). `cap(s)` is the **capacity** - how many it could hold before Go has to allocate a bigger underlying
block of memory. Early on, **`len` is the one you'll use constantly** (it's how you ask "how many?");
`cap` is an under-the-hood detail you'll mostly ignore until you're optimizing. They start equal here, but
after appends they can differ as Go grows the backing storage in chunks.

## Maps - looking things up by key

A slice is great when you want an ordered list and access things by *position*. A **map** is what you
want when you access things by *name*: it stores **key → value** pairs and lets you look up a value
instantly by its key.

**What it actually is.** A map is a lookup table. `map[string]int` reads as "a map from string keys to
integer values" - for example, names to ages. (Other languages call this a dictionary, hash, or
associative array; same idea.)
```go
package main

import "fmt"

func main() {
	ages := map[string]int{
		"Ada":  36,
		"Alan": 41,
	}
	fmt.Println(ages["Ada"])
	ages["Grace"] = 28
	fmt.Println(ages)
}
```
```console
$ go run main.go
36
map[Ada:36 Alan:41 Grace:28]
```
*What just happened:* We created a map with two entries, looked up `"Ada"` to get `36`, then added a new
entry by assigning to a fresh key (`ages["Grace"] = 28`). Printing the whole map shows all the pairs.
Note Go printed them in a tidy order here, but **maps have no guaranteed order** - don't rely on it (more
on that in the gotcha below).

When you look up a key that might not exist, use the **two-value form** to ask "did it exist?":
```go
age, ok := ages["Nobody"]
fmt.Println(age, ok)
```
```console
0 false
```
*What just happened:* Reading a missing key doesn't crash - it returns the value type's **zero value**
(`0` for an `int`, from [phase 2](02-syntax-values-and-types.md)) and a second boolean, `ok`, that's
`false` when the key was absent. This `value, ok := m[key]` pattern is how you safely tell "the value is
genuinely 0" apart from "the key wasn't there at all."

⚠️ **Gotcha - writing to a nil map panics.** A map variable declared but never *made* is `nil`, and
**writing to a nil map crashes your program at runtime:**
```go
var m map[string]int   // declared, but nil - never made
m["x"] = 1             // panic!
```
```console
panic: assignment to entry in nil map
```
*What just happened:* `var m map[string]int` gives you a `nil` map - the zero value for maps. You can
*read* from it (you'll get zero values), but *writing* to it panics, because there's no actual table
allocated to store into. The fix is to create it first with `make`: `m := make(map[string]int)` (or use a
map literal like above). This is one of the most common first-week Go panics - now you'll recognize it
instantly.

📝 **Terminology.** A **panic** is Go's term for a runtime crash - the program stops with an error message
and a trace. It's the runtime equivalent of an exception. We'll cover handling failure *gracefully* (the
"errors are values" approach) in [phase 7](07-errors-and-io.md).

## Looping over collections with `range`

To visit every element of a slice or every pair in a map, Go gives you `range`:
```go
package main

import "fmt"

func main() {
	names := []string{"Ada", "Alan", "Grace"}
	for i, name := range names {
		fmt.Println(i, name)
	}
}
```
```console
$ go run main.go
0 Ada
1 Alan
2 Grace
```
*What just happened:* `for i, name := range names` walks the slice, and on each pass hands you two things:
`i`, the **index** (position, starting at 0), and `name`, the **value** at that position. We printed both.
This is the standard way to loop a slice. (Don't worry about the `for` keyword yet - Go's single loop is
[phase 4](04-control-flow-and-functions.md); here it's just "do this for each element.")

Often you only want the value, not the index. Use the blank identifier `_` to throw the index away:
```go
for _, name := range names {
	fmt.Println(name)
}
```
*What just happened:* `_` is Go's "I deliberately don't want this" placeholder. Because Go errors on
*unused variables* ([phase 2](02-syntax-values-and-types.md)), you can't just declare an `i` you ignore -
you write `_` to say "discard the index on purpose." Ranging a map works the same way, giving you `key,
value` instead of `index, value`.

## The slice-aliasing surprise

Here's the slice gotcha that bites everyone exactly once. A slice is a *view* onto an underlying block of
data. When you slice a slice, both names can point at the *same* underlying data:
```go
package main

import "fmt"

func main() {
	original := []int{1, 2, 3, 4}
	part := original[0:2]   // a view of the first two elements
	part[0] = 99
	fmt.Println(original)
}
```
```console
$ go run main.go
[99 2 3 4]
```
*What just happened:* `original[0:2]` made a slice `part` that's a *window* onto the first two elements of
`original` - not a copy. So changing `part[0]` also changed `original[0]`; they share the same backing
storage. This is efficient (no copying) but surprising the first time you see one slice change "by
itself."

⚠️ **Gotcha.** When you need an *independent* copy rather than a shared view, make one explicitly with the
built-in `copy`:
```go
clone := make([]int, len(original))
copy(clone, original)
```
*What just happened:* `make([]int, len(original))` created a brand-new slice of the same length, and
`copy` filled it with `original`'s values. Now `clone` has its own storage - changing it leaves
`original` untouched. Reach for this whenever "I changed one and the other changed too" would be a bug.

## Recap

1. **`[]T` is a slice** (flexible, what you'll use); `[N]T` is an array (fixed size, rare).
2. **`append`** grows a slice - always assign the result back: `s = append(s, x)`.
3. **`len`** is how many elements (you'll use it constantly); **`cap`** is the under-the-hood capacity.
4. A **map** (`map[K]V`) stores key→value pairs for instant lookup; use **`value, ok := m[key]`** to
   check if a key exists.
5. **Writing to a nil map panics** - create it first with `make` or a literal.
6. **`range`** loops collections, giving `index, value` for slices and `key, value` for maps; use `_` to
   discard a part you don't need.
7. Slices can **share underlying data** (aliasing) - use `copy` when you need an independent copy.

Next, we get programs to *make decisions* and *organize logic*: Go's one loop, `if` and `switch`, and the
multiple-return-value functions that give Go its distinctive shape.

---

[← Phase 2: Syntax, Values & Types](02-syntax-values-and-types.md) · [Guide overview](_guide.md) · [Phase 4: Control Flow & Functions →](04-control-flow-and-functions.md)
