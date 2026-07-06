---
title: "Control Flow & Functions"
guide: "python-from-zero"
phase: 4
summary: "Make programs decide with if/elif/else, repeat with for and while loops, and package reusable logic with def - parameters, defaults, and return values - plus truthiness and the classic mutable-default-argument trap."
tags: [python, if, else, loops, for, while, functions, def, return, truthiness, default-arguments]
difficulty: beginner
synonyms: ["python if elif else", "python for loop explained", "python while loop", "how to write a function in python", "python default argument", "mutable default argument python", "python return value", "what is truthiness in python"]
updated: 2026-06-19
---

# Control Flow & Functions

So far your programs run straight down, every line once. Real programs *make choices* ("if logged in,
show the dashboard") and *repeat work* ("for each order, send an email"), and once you've written useful
logic, you want to *name it and reuse it* instead of copy-pasting. Deciding, repeating, and packaging -
control flow and functions - are where code starts to feel powerful.

Remember the indentation rule from [Phase 2](02-syntax-values-and-types.md): `:` opens a block and the
indented lines beneath belong to it. Every structure here uses it.

## `if` / `elif` / `else` - making a decision

**What it actually is.** An `if` runs a block *only when* a condition is true. Add `elif` ("else if") for
more conditions, and `else` for "none of the above." Python checks top to bottom, runs the **first**
matching block, then skips the rest.
```python runnable
score = 72
if score >= 90:
    print("A")
elif score >= 80:
    print("B")
elif score >= 70:
    print("C")
else:
    print("F")
```
*What just happened:* Python checked `score >= 90` (false), then `>= 80` (false), then `>= 70` (true),
ran that block, and stopped without reaching `else`:
```console
C
```
As a picture - Python falls through the checks until one matches:

```mermaid
flowchart TD
  start([score = 72]) --> a{score >= 90?}
  a -- yes --> A[print A]
  a -- no --> b{score >= 80?}
  b -- yes --> B[print B]
  b -- no --> c{score >= 70?}
  c -- yes --> C[print C]
  c -- no --> E[print F]
```

📝 **Terminology.** A **condition** is any expression evaluating to `True` or `False` - usually a
comparison like `>=`, `==`, `!=` (not equal), `<`, `>`. The block under `if` runs when it's `True`.

## Truthiness - what counts as "true"

**What it actually is.** Python lets you use *any* value as a condition, not only `True`/`False` - it
asks "is this *truthy* or *falsy*?" The falsy values are "empty or nothing"; almost everything else is
truthy.
```python runnable
print(bool(0), bool(""), bool([]), bool(None))
print(bool(42), bool("hi"), bool([1, 2]))
```
*What just happened:* `bool()` shows how Python judges each value as a condition: zero, the empty
string, the empty list, and `None` are all **falsy**; a nonzero number, non-empty string, and non-empty
list are **truthy**:
```console
False False False False
True True True
```
This enables natural checks - instead of `if len(items) > 0:`, write:
```python runnable
items = []
if items:
    print("There are items")
else:
    print("The list is empty")
```
*What just happened:* The empty list is falsy, so the `else` ran:
```console
The list is empty
```

💡 **Key point.** "Empty or zero or nothing" is falsy; everything else truthy. `if my_list:` reads as
"if the list has anything in it" - clean and Pythonic.

## `for` - do something for each item

**What it actually is.** A `for` loop walks a collection, running its block *once per item*, each handed
to a name you choose.
```python runnable
for fruit in ["apple", "banana", "cherry"]:
    print(fruit)
```
*What just happened:* The loop took each item in turn, pointed `fruit` at it, and ran the block - three
items, three runs:
```console
apple
banana
cherry
```
To repeat a fixed number of times, loop over `range(n)`, which produces `0` up to (but not including)
`n`:
```python runnable
for i in range(3):
    print(i)
```
*What just happened:* `range(3)` yielded `0`, `1`, `2` - stopping *before* 3, the same "stop is
exclusive" rule as slicing:
```console
0
1
2
```

## `while` - repeat until a condition turns false

**What it actually is.** A `while` loop repeats its block *as long as* a condition stays true. Reach for
it when you don't know in advance how many times you'll loop - you loop until something changes.
```python runnable
n = 3
while n > 0:
    print(n)
    n = n - 1
```
*What just happened:* The loop ran while `n > 0`, printing `n` then shrinking it by 1 each pass, until it
hit 0 and the condition went false:
```console
3
2
1
```

⚠️ **The infinite loop.** A `while` only stops when its condition becomes false, so *something inside the
loop must move it toward false*. Drop the `n = n - 1` line above and `n` stays 3 forever, printing without
end. If a program ever "hangs," suspect an infinite loop; press **Ctrl-C** to stop it.

## Functions - name a piece of logic and reuse it

**What it actually is.** A **function** is a named, reusable block of instructions: *define* it once with
`def`, then *call* it whenever needed, with different inputs each time - how you avoid copy-pasting logic.
```python runnable
def greet(name):
    return f"Hello, {name}!"

print(greet("Ada"))
print(greet("Linus"))
```
*What just happened:* `def greet(name):` defined a function taking one **parameter**, `name`; `return`
hands a value back. Each call supplied a different name, giving two different results:
```console
Hello, Ada!
Hello, Linus!
```

📝 **Terminology.** A **parameter** is the name in the definition (`name`); an **argument** is the actual
value passed when calling (`"Ada"`). `return` sends a value back out of the function.

**Defaults** let a parameter be optional by giving it a fallback value:
```python runnable
def greet(name, greeting="Hello"):
    return f"{greeting}, {name}!"

print(greet("Ada"))
print(greet("Ada", "Hi"))
```
*What just happened:* Without a `greeting` argument, it falls back to `"Hello"`; supply one and yours
wins:
```console
Hello, Ada!
Hi, Ada!
```

**`return` vs printing - a crucial difference.** A function that *prints* shows text but hands back
nothing usable; one that *returns* gives a value you can store and work with. No `return` means it hands
back `None`:
```python runnable
def show(x):
    print(x)

result = show(5)
print(result)
```
*What just happened:* `show(5)` printed `5`, but with no `return`, the call evaluated to `None` - stored
in `result` and printed on the second line:
```console
5
None
```
To *use* a function's output later, it must `return` it, not just `print` it - printing is for humans,
returning is for feeding the rest of your program.

## The classic trap: mutable default arguments

This one bites *experienced* developers too, so it's worth meeting head-on.

**What goes wrong.** Give a parameter a **mutable** default (like a list), and it's created **once**,
when the function is defined - then *shared across every call*, never fresh, which is almost never what
you want.
```python runnable
def add_item(item, basket=[]):
    basket.append(item)
    return basket

print(add_item("apple"))
print(add_item("banana"))
```
*What just happened:* You'd expect each call to start with an empty basket. Instead both share the
*same* default list, so the second call sees the first call's leftovers:
```console
['apple']
['apple', 'banana']
```
That `['apple', 'banana']` on the second line is the bug - `"apple"` shouldn't be there. The shared
default silently accumulates across calls.

**The fix** - a pattern to adopt every time: default to `None`, then create a fresh value *inside* the
function.
```python runnable
def add_item(item, basket=None):
    if basket is None:
        basket = []
    basket.append(item)
    return basket

print(add_item("apple"))
print(add_item("banana"))
```
*What just happened:* Now each call with no basket gets a brand-new list, so they don't bleed together:
```console
['apple']
['banana']
```

⚠️ **Never use a mutable default (`[]`, `{}`, `set()`) directly.** Default to `None` and build the real
value inside the function. Memorize this - it's a genuine sharp edge, coming straight from the aliasing
idea in [Phase 3](03-collections.md): the default list is one shared object.

## Recap

1. **`if` / `elif` / `else`** runs the *first* matching block. Conditions are expressions evaluating to
   `True`/`False`.
2. **Truthiness:** empty/zero/`None` are falsy, everything else truthy - so `if my_list:` means "if it
   has items."
3. **`for`** loops once per item (use `range(n)` for a count); **`while`** loops until its condition goes
   false - make sure something moves it there.
4. **`def`** defines a function; **parameters** name its inputs, **`return`** hands a value back.
   **Defaults** make parameters optional.
5. `return` gives a usable value; a function with no `return` yields `None`.
6. **Never use a mutable default argument.** Default to `None` and build the list/dict inside the
   function.

Next: importing code, the standard library, writing your own modules, and laying out a real project.

---

[← Phase 3: Collections](03-collections.md) · [Guide overview](_guide.md) · [Phase 5: Modules & Project Layout →](05-modules-and-project-layout.md)
