---
title: "Syntax, Values & Types"
guide: "python-from-zero"
phase: 2
summary: "Python uses indentation as structure (not braces), variables are names pointing at values, the core types are int/float/str/bool/None, f-strings format text, and typing is dynamic — plus the = vs == and integer-vs-float-division traps."
tags: [python, types, variables, indentation, f-strings, syntax, int, float, str, bool, none]
difficulty: beginner
synonyms: ["python indentation explained", "python variables and types", "what is none in python", "python f-string", "python int vs float division", "= vs == in python", "dynamic typing python"]
updated: 2026-06-19
---

# Syntax, Values & Types

Most languages use curly braces `{}` and semicolons to mark where blocks of code begin and end. Python
throws those out and uses something you can't see: **whitespace**. That's the first genuine surprise,
and it's worth meeting head-on before anything else, because getting it wrong produces errors that feel
mysterious until you understand the rule. After that, we'll cover the handful of value types everything
in Python is built from.

## The big surprise: indentation *is* structure

**What it actually is.** In Python, the *indentation* of a line — how many spaces it's pushed in from
the left — is what groups lines into a block. Where other languages write `{ ... }`, Python says "these
lines are indented under that line, so they belong to it." The indentation isn't decoration; it's the
grammar.

Here's a block of code that runs only when a condition is true (we'll cover `if` properly in
[Phase 4](04-control-flow-and-functions.md) — focus on the *shape* for now):
```python
temperature = 30
if temperature > 25:
    print("It's warm")
    print("Wear a t-shirt")
print("Done checking")
```
*What just happened:* The line ending in `:` opens a block. The two **indented** lines beneath it are
*inside* that block — they run only when `temperature > 25`. The last `print`, back at the left margin,
is *outside* the block, so it always runs. Since 30 is greater than 25, all three lines print:
```console
It's warm
Wear a t-shirt
Done checking
```

📝 **Terminology.** The `:` and the indented lines under it form a **block** (also called a *suite*).
The standard is **4 spaces** per level of indentation. Don't mix tabs and spaces — pick spaces and let
your editor insert four when you press Tab.

⚠️ **`IndentationError` and `TabError`.** Because spacing *is* the structure, getting it wrong is a real
error, not a style nitpick. Indent a line that shouldn't be, or mix tabs with spaces, and Python
refuses to run:
```console
  File "warm.py", line 3
    print("It's warm")
    ^
IndentationError: unexpected indent
```
This confuses *everyone* at first. The fix is almost always: make every line in the same block start at
the exact same column, using spaces only. Any decent editor highlights this for you once you set it to
"insert spaces for tabs."

💡 **Key point.** In Python, you don't indent because it looks nice — you indent because the indentation
*is* how you tell Python which lines belong together. Read indentation the way you'd read braces in
other languages.

## Variables — names pointing at values

**What it actually is.** A variable is a *name* you attach to a value so you can refer to it later. You
create one with `=` — read it as "let this name refer to this value," not as math equality.
```python
name = "Ada"
age = 36
print(name)
print(age)
```
*What just happened:* `name = "Ada"` made the name `name` refer to the text `"Ada"`; `age = 36` made
`age` refer to the number `36`. Then each `print` looked up what the name points at and showed it:
```console
Ada
36
```

You can re-point a name at a new value any time — that's the whole idea of a *variable*:
```python
score = 10
score = score + 5
print(score)
```
*What just happened:* The right side `score + 5` was computed first using the *current* value of `score`
(10), giving 15. Then `score =` re-pointed the name at that new value. So it prints `15`. The name
didn't "change"; you pointed it somewhere new.

## The core types

Every value in Python has a **type** — what kind of thing it is. You'll use five constantly. You can
ask any value its type with the built-in `type()`:
```python
print(type(36))
print(type(3.14))
print(type("hello"))
print(type(True))
print(type(None))
```
*What just happened:* `type()` reports the type of each value. The output names each one:
```console
<class 'int'>
<class 'float'>
<class 'str'>
<class 'bool'>
<class 'NoneType'>
```

Here's what each is *for*:

- **`int`** — a whole number, with no decimal point: `36`, `0`, `-7`. Integers in Python have no size
  limit; they grow as large as your memory allows.
- **`float`** — a number *with* a decimal point: `3.14`, `2.0`, `-0.5`. The "float" is short for
  *floating-point*, the standard way computers store fractional numbers.
- **`str`** — a **string**: text, written in quotes. `"hello"`, `'Ada'`. Single or double quotes both
  work; pick one and be consistent.
- **`bool`** — a **boolean**: either `True` or `False` (capitalized — Python is picky). This is the type
  of every yes/no answer, like the result of a comparison.
- **`None`** — a special value meaning "nothing here / no value yet." Its type is `NoneType`, and there
  is only ever one `None`. You'll meet it as the default "result" of functions that don't return
  anything.

📝 **Terminology.** A **string** is a sequence of characters — text. The quotes aren't part of the
value; they just tell Python "the text starts here and ends there."

## Dynamic typing — names don't have a fixed type

**What it actually is.** In some languages you must declare "this variable holds an integer" and it can
*only* ever hold integers. Python doesn't work that way. A name can point at a value of one type now and
a different type later — the *value* has a type, but the *name* is just a label.
```python
x = 42
print(type(x))
x = "now I'm text"
print(type(x))
```
*What just happened:* `x` first pointed at an `int`, then we re-pointed it at a `str`. Python allows
this freely, so it prints two different types:
```console
<class 'int'>
<class 'str'>
```
This is called **dynamic typing**. It's flexible and quick to write, but it has a cost: nothing stops
you from accidentally putting the wrong kind of value in a name, and you'll only find out when something
breaks later. Keep your variables holding one *kind* of thing, and you avoid most of that pain.

## f-strings — putting values into text

You'll constantly want to build a string out of fixed text plus some values. The clean, modern way is an
**f-string**: a string prefixed with the letter `f`, where anything inside `{ }` is replaced by the
value of that expression.
```python
name = "Ada"
age = 36
print(f"{name} is {age} years old")
```
*What just happened:* The `f` before the quote marks this as an f-string. Python evaluated `{name}` and
`{age}`, dropping their values straight into the text:
```console
Ada is 36 years old
```
You can put any expression inside the braces, not only a bare name:
```python
price = 4
print(f"Two coffees cost {price * 2} dollars")
```
*What just happened:* Python computed `price * 2` (which is 8) and slotted the result in:
```console
Two coffees cost 8 dollars
```

💡 **Key point.** Reach for f-strings whenever you mix text and values. They're readable, they're fast,
and they're what Python code looks like today. (Older code uses `"%s" % x` or `.format()` — you'll see
those around, but you don't need to write them.)

## Two number traps that bite beginners

⚠️ **`=` vs `==` — assignment vs comparison.** A single `=` *assigns* (points a name at a value). A
double `==` *compares* two values and gives back a boolean. Mixing them up is one of the most common
early mistakes:
```python
x = 5
print(x == 5)
print(x == 6)
```
*What just happened:* `x = 5` assigned. Then `x == 5` *asked* "is x equal to 5?" — `True` — and
`x == 6` asked the same about 6 — `False`:
```console
True
False
```
Say it in your head as you type: `=` is "set to," `==` is "is equal to?"

⚠️ **Integer vs float division — `/` always gives a float.** Plain division with `/` *always* produces
a `float`, even when the numbers divide evenly. If you want whole-number division, use `//`:
```python
print(7 / 2)
print(8 / 2)
print(7 // 2)
print(7 % 2)
```
*What just happened:* `/` gave you floats (note `4.0`, not `4`). `//` did *floor division* — divide and
throw away the remainder, giving a whole number. `%` (the *modulo* operator) gave the **remainder** of
the division:
```console
3.5
4.0
3
1
```
This surprises people coming from languages where `/` on two integers stays an integer. In Python, the
moment you write `/`, expect a decimal. Use `//` when you specifically want the whole part, and `%` when
you want what's left over (handy for "is this number even?" — `n % 2 == 0`).

## Recap

1. **Indentation is structure.** A `:` opens a block; the indented lines under it belong to it. Use 4
   spaces, never mixed with tabs — getting it wrong is a real `IndentationError`.
2. A **variable** is a name pointing at a value; `=` means "let this name refer to," and you can
   re-point it any time.
3. The five everyday types: **`int`** (whole), **`float`** (decimal), **`str`** (text), **`bool`**
   (`True`/`False`), and **`None`** (no value). `type(x)` tells you which.
4. Python is **dynamically typed** — a name can hold any type, and change type. Flexible, but keep each
   name to one *kind* of thing.
5. **f-strings** (`f"{name} is {age}"`) slot values into text; reach for them by default.
6. `=` assigns, `==` compares. `/` always yields a `float`; use `//` for whole-number division and `%`
   for the remainder.

Next, we group values together: the lists, tuples, dicts, and sets you'll use to hold collections of
things.

---

[← Phase 1: Install & Your First Program](01-install-and-first-program.md) · [Guide overview](_guide.md) · [Phase 3: Collections →](03-collections.md)
