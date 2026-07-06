---
title: "Syntax, Values & Types"
guide: "python-from-zero"
phase: 2
summary: "Python uses indentation as structure (not braces), variables are names pointing at values, the core types are int/float/str/bool/None, f-strings format text, and typing is dynamic - plus the = vs == and integer-vs-float-division traps."
tags: [python, types, variables, indentation, f-strings, syntax, int, float, str, bool, none]
difficulty: beginner
synonyms: ["python indentation explained", "python variables and types", "what is none in python", "python f-string", "python int vs float division", "= vs == in python", "dynamic typing python"]
updated: 2026-06-19
---

# Syntax, Values & Types

Most languages use curly braces `{}` and semicolons to mark code blocks. Python uses something you can't
see: **whitespace**. Getting it wrong produces mysterious errors until you know the rule, so it's worth
meeting head-on - then we'll cover the handful of value types Python is built from.

## The big surprise: indentation *is* structure

**What it actually is.** In Python, a line's *indentation* - how many spaces it's pushed in from the
left - groups lines into a block. Where other languages write `{ ... }`, Python says "these lines are
indented under that line, so they belong to it." Indentation isn't decoration; it's the grammar.

A block of code that runs only when a condition is true (`if` proper is [Phase
4](04-control-flow-and-functions.md) - focus on the *shape* for now):
```python runnable
temperature = 30
if temperature > 25:
    print("It's warm")
    print("Wear a t-shirt")
print("Done checking")
```
*What just happened:* The line ending in `:` opens a block. The two **indented** lines run only when
`temperature > 25`; the last `print`, back at the left margin, is outside the block and always runs.
Since 30 > 25, all three lines print:
```console
It's warm
Wear a t-shirt
Done checking
```

📝 **Terminology.** The `:` and the indented lines under it form a **block** (also called a *suite*).
Standard is **4 spaces** per level - don't mix tabs and spaces, and let your editor insert four on Tab.

⚠️ **`IndentationError` and `TabError`.** Because spacing *is* the structure, getting it wrong is a real
error, not a style nitpick. Indent a line that shouldn't be, or mix tabs with spaces, and Python refuses
to run:
```console
  File "warm.py", line 3
    print("It's warm")
    ^
IndentationError: unexpected indent
```
This confuses everyone at first. Fix: make every line in the block start at the same column, spaces
only - set your editor to "insert spaces for tabs" and it'll handle this for you.

💡 **Key point.** You don't indent because it looks nice - the indentation *is* how you tell Python which
lines belong together. Read it the way you'd read braces in other languages.

## Variables - names pointing at values

**What it actually is.** A variable is a *name* attached to a value so you can refer to it later. Create
one with `=` - read it as "let this name refer to this value," not as math equality.
```python runnable
name = "Ada"
age = 36
print(name)
print(age)
```
*What just happened:* `name = "Ada"` made `name` refer to the text `"Ada"`; `age = 36` made `age` refer
to `36`. Each `print` looked up what the name points at and showed it:
```console
Ada
36
```

Re-point a name at a new value any time - that's the whole idea of a *variable*:
```python runnable
score = 10
score = score + 5
print(score)
```
*What just happened:* `score + 5` was computed first using the *current* value of `score` (10), giving
15; then `score =` re-pointed the name at that value, so it prints `15`. The name didn't "change" - you
pointed it somewhere new.

## The core types

Every value in Python has a **type** - what kind of thing it is. You'll use five constantly. Ask any
value its type with the built-in `type()`:
```python runnable
print(type(36))
print(type(3.14))
print(type("hello"))
print(type(True))
print(type(None))
```
*What just happened:* `type()` reports each value's type:
```console
<class 'int'>
<class 'float'>
<class 'str'>
<class 'bool'>
<class 'NoneType'>
```

What each is *for*:

- **`int`** - a whole number, no decimal point: `36`, `0`, `-7`. No size limit; grows as large as memory
  allows.
- **`float`** - a number *with* a decimal point: `3.14`, `2.0`, `-0.5`. Short for *floating-point*, how
  computers store fractional numbers.
- **`str`** - a **string**: text in quotes. `"hello"`, `'Ada'`. Single or double both work; pick one and
  be consistent.
- **`bool`** - a **boolean**: `True` or `False` (capitalized - Python is picky). The type of any yes/no
  answer, like a comparison's result.
- **`None`** - a special value meaning "nothing here / no value yet." Its type is `NoneType`; there's
  only ever one `None`. You'll meet it as the default result of functions that don't return anything.

📝 **Terminology.** A **string** is a sequence of characters - text. The quotes aren't part of the
value; they just tell Python "the text starts here and ends there."

## Dynamic typing - names don't have a fixed type

**What it actually is.** Some languages require declaring "this variable holds an integer," and it can
*only* ever hold integers. Python doesn't work that way: a name can point at one type now and a
different type later - the *value* has a type, the *name* is just a label.
```python runnable
x = 42
print(type(x))
x = "now I'm text"
print(type(x))
```
*What just happened:* `x` first pointed at an `int`, then got re-pointed at a `str`. Python allows this
freely, so it prints two different types:
```console
<class 'int'>
<class 'str'>
```
This is called **dynamic typing**: flexible and quick to write, but nothing stops you from putting the
wrong kind of value in a name - you only find out when something breaks later. Keep each variable
holding one *kind* of thing to avoid most of that pain.

## f-strings - putting values into text

You'll constantly build strings out of fixed text plus values. The clean, modern way is an **f-string**:
a string prefixed with `f`, where anything inside `{ }` is replaced by that expression's value.
```python runnable
name = "Ada"
age = 36
print(f"{name} is {age} years old")
```
*What just happened:* The `f` before the quote marks an f-string. Python evaluated `{name}` and `{age}`
and dropped their values straight into the text:
```console
Ada is 36 years old
```
Any expression can go inside the braces, not only a bare name:
```python runnable
price = 4
print(f"Two coffees cost {price * 2} dollars")
```
*What just happened:* Python computed `price * 2` (8) and slotted the result in:
```console
Two coffees cost 8 dollars
```

💡 **Key point.** Reach for f-strings whenever you mix text and values - readable, fast, modern. (Older
code uses `"%s" % x` or `.format()`; you'll see those around but don't need to write them.)

## Two number traps that bite beginners

⚠️ **`=` vs `==` - assignment vs comparison.** A single `=` *assigns* (points a name at a value); a
double `==` *compares* two values and returns a boolean. Mixing them up is a common early mistake:
```python runnable
x = 5
print(x == 5)
print(x == 6)
```
*What just happened:* `x = 5` assigned. `x == 5` asked "is x equal to 5?" - `True` - and `x == 6` asked
the same about 6 - `False`:
```console
True
False
```
Say it in your head as you type: `=` is "set to," `==` is "is equal to?"

⚠️ **Integer vs float division - `/` always gives a float.** `/` *always* produces a `float`, even when
the numbers divide evenly. For whole-number division, use `//`:
```python runnable
print(7 / 2)
print(8 / 2)
print(7 // 2)
print(7 % 2)
```
*What just happened:* `/` gave floats (note `4.0`, not `4`). `//` did *floor division* - divide, discard
the remainder, giving a whole number. `%` (*modulo*) gave the **remainder**:
```console
3.5
4.0
3
1
```
This surprises people coming from languages where `/` on two integers stays an integer - in Python, `/`
always means a decimal. Use `//` for the whole part, `%` for what's left over (handy for "is this number
even?" - `n % 2 == 0`).

## Recap

1. **Indentation is structure.** A `:` opens a block; indented lines under it belong to it. Use 4
   spaces, never tabs - getting it wrong is a real `IndentationError`.
2. A **variable** is a name pointing at a value; `=` means "let this name refer to," re-pointable any
   time.
3. Five everyday types: **`int`** (whole), **`float`** (decimal), **`str`** (text), **`bool`**
   (`True`/`False`), **`None`** (no value). `type(x)` tells you which.
4. Python is **dynamically typed** - a name can hold and change type. Flexible, but keep each name to
   one *kind* of thing.
5. **f-strings** (`f"{name} is {age}"`) slot values into text; reach for them by default.
6. `=` assigns, `==` compares. `/` always yields a `float`; use `//` for whole-number division, `%` for
   the remainder.

Next: the lists, tuples, dicts, and sets you'll use to hold collections of things.

---

[← Phase 1: Install & Your First Program](01-install-and-first-program.md) · [Guide overview](_guide.md) · [Phase 3: Collections →](03-collections.md)
