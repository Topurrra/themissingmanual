---
title: "The Building Blocks: Variables, Types & Operators"
guide: "programming-from-zero"
phase: 2
summary: "Variables are named boxes that hold values; values come in types (numbers, text/strings, booleans); operators do math and comparison - and = means assign while == means compare."
tags: [programming, beginner, python, variables, types, operators, strings, booleans]
difficulty: beginner
synonyms: ["what is a variable", "what are data types", "difference between = and == in python", "what is a string", "what is a boolean", "python operators explained", "assign vs compare"]
updated: 2026-07-10
---

# The Building Blocks: Variables, Types & Operators

In [Phase 1](01-what-a-program-is.md) you handed a fixed piece of text straight to `print`. Real
programs work with values that change - a username, a price, a score, an answer calculated a moment
ago - so the program needs a way to *hold onto* a value and refer to it later.

Three small ideas cover it, and you'll use all three in nearly every program you write: **variables**
(where values live), **types** (what kind of value it is), and **operators** (how you combine values).

## Variables: named boxes for values

**What a variable actually is.** A variable is a name you attach to a value so you can use it later.
Picture a labeled box: you put a value in the box, write a name on the label, and from then on you can
ask for the value by name.

```python runnable
age = 30
print(age)
```
*What just happened:* The first line created a box labeled `age` and put the value `30` inside it. The
second line asked `print` to show whatever is in the box called `age`. The computer looked it up and
displayed:

```console
30
```

Notice `print(age)` has no quotation marks around `age`. That's deliberate, and it's a distinction worth
locking in now:

- `print("age")` shows the literal text **age** (it's a fixed piece of text - see types below).
- `print(age)` shows **what's inside the box** named `age` - here, `30`.

Quotes mean "this exact text." No quotes mean "the value stored under this name."

**Variables can change** - that's why they're called *variable*. Put a new value in the box and it
replaces the old one:

```python runnable
score = 0
print(score)
score = 100
print(score)
```
*What just happened:* `score` started holding `0`, which we printed. Then we put `100` in the same box,
replacing the `0`, and printed again. The box's name stayed the same; its contents changed:

```console
0
100
```

📝 **Terminology.** Putting a value into a variable is called **assignment**, and `=` is the
**assignment operator**. Read `score = 100` as "set `score` to `100`," *not* as "score equals 100" in
the math sense - the difference matters, and you'll see exactly why at the end of this phase.

💡 **Key point.** A variable is just a name pointing at a value. Any bare word in code that isn't in
quotes and isn't a known instruction is almost always a variable - the real question is always "what's
currently inside it?"

## Types: what kind of value it is

Every value has a **type** - a category that tells the computer what the value *is* and what you're
allowed to do with it. You don't declare types in Python; the value's appearance decides its type.
Three types cover most of what a beginner does:

```text
   TYPE        WHAT IT IS                  EXAMPLES
   ─────────   ─────────────────────────   ────────────────────────
   number      a quantity you can do        30      3.14      -7
               math with                    (count, price, score)

   string      a piece of text, in quotes   "hello"   "Ada"   "30"
               (str for short)              (names, messages, labels)

   boolean     a yes/no, true/false value   True      False
               (bool for short)             (is it on? did it pass?)
```

📝 **Terminology.** A **string** is the programming word for "a piece of text" - always written inside
quotes. A **boolean** (named after logician George Boole) is a value that is either `True` or `False`,
nothing else. In Python they're capitalized and written without quotes - special values, not text.

Here's each type living in a variable:

```python runnable
name = "Ada"
age = 30
is_student = True
print(name)
print(age)
print(is_student)
```
*What just happened:* Three boxes, three different types of value - text, a number, and a boolean. The
computer happily holds all three and prints each one:

```console
Ada
30
True
```

**Why the type matters: `"30"` is not `30`.** A number in quotes is text, and the computer treats text
and numbers differently:

```python runnable
print(2 + 2)
print("2" + "2")
```
*What just happened:* On the first line, `2` and `2` are numbers, so `+` adds them: you get `4`. On the
second line, `"2"` and `"2"` are *strings* - text - so `+` glues them together end to end instead of
adding. You get the text `"22"`:

```console
4
22
```

The `+` symbol did two completely different jobs depending on the *type* of the values around it - type
is not a fussy detail, it changes what your instructions actually do. (Gluing strings together with `+`
is common and useful; it's called **concatenation**.)

⚠️ **Gotcha: a number typed by a user usually arrives as a string.** When a program reads input from a
person, it comes in as text, even if the person typed digits. Doing math on it without converting first
is one of the most common beginner stumbles - `"5" + "3"` gives `"53"`, not `8`. Convert with `int("5")`
(whole number) or `float("5.0")` (decimal). Just know the trap exists for now; you'll meet conversions
properly when you start reading real input.

## Operators: doing things with values

**What an operator actually is.** An operator is a symbol that takes one or two values and produces a
new value. You've already met two: `=` (assign) and `+` (add numbers, or glue strings). Two families
you'll use constantly:

### Math operators

These do exactly what you'd expect on numbers:

```python runnable
print(10 + 3)
print(10 - 3)
print(10 * 3)
print(10 / 3)
```
*What just happened:* Addition, subtraction, multiplication (`*`, not `×`), and division (`/`, not `÷`).
Each produces a new number, which we print:

```console
13
7
30
3.3333333333333335
```

That long decimal is real, not a typo - `/` always gives a decimal result, and 10 divided by 3 genuinely
doesn't end. The computer shows as many digits as it stores. (Don't worry about why it stops where it
does; it's a normal quirk of how computers hold decimals.)

Operators work on variables too, not just literal numbers - this is where they earn their keep:

```python runnable
price = 20
quantity = 3
total = price * quantity
print(total)
```
*What just happened:* The computer looked up the value in `price` (`20`) and in `quantity` (`3`),
multiplied them to get `60`, and stored that result in a new box called `total`. Then it printed `total`:

```console
60
```

Read `total = price * quantity` right to left: *first* the computer works out the value on the right
(`price * quantity`), *then* puts that result into the box on the left (`total`). Right side computed
first, then assigned to the left - that order holds for every assignment you'll ever write.

### Comparison operators

These compare two values and produce a **boolean** - `True` or `False`. This is how a program asks
questions about its values (and, in [Phase 3](03-control-flow-and-functions.md), makes decisions):

```text
   ==   equal to?                  5 == 5   →  True
   !=   not equal to?              5 != 3   →  True
   >    greater than?              5 > 3    →  True
   <    less than?                 5 < 3    →  False
   >=   greater than or equal?     5 >= 5   →  True
   <=   less than or equal?        3 <= 5   →  True
```

Watch one in action:

```python runnable
age = 30
print(age > 18)
print(age == 18)
```
*What just happened:* The computer looked up `age` (`30`), compared it, and produced a boolean for each
question. Is 30 greater than 18? Yes. Is 30 equal to 18? No:

```console
True
False
```

A comparison changes nothing - it just answers a question with `True` or `False`, which is the raw
material for every decision a program makes.

## The gotcha that confuses everybody: `=` vs `==`

⚠️ **`=` means *assign*. `==` means *compare*. They are completely different, and mixing them up is the
single most common beginner mistake.** Hold these two side by side:

```python
x = 5        # ASSIGN: put the value 5 into the box named x
x == 5       # COMPARE: ask "is what's in x equal to 5?" → produces True
```
*What just happened:* The first line *does* something - it sets `x` to `5`, silently, printing nothing.
The second line *asks* something - it checks whether `x` equals `5` and produces the boolean `True` (it
doesn't print on its own; you'd wrap it in `print` to see it).

This trips everyone up because in math class, `=` means "is equal to." In programming, plain `=` does
**not** mean that - it means "make this so." To *ask* whether two things are equal, you need the doubled
`==`. Reach for two equals signs to check equality, one to store a value.

🪖 **War story.** Nearly every programmer alive has written `if x = 5` (one equals) when they meant
`if x == 5` (two), then stared at the resulting error or wrong behavior in total confusion. You will do
it too. When a comparison isn't behaving, the very first thing to check is: did I use one `=` where I
needed two? It's such a reliable culprit that it's worth making it your reflex.

## Why this saves you later

Variables, types, and operators are the nouns and verbs of programming. Every program - the simplest
script and the largest app you'll ever see - is built from values held in variables, of some type, being
combined and compared with operators. When you read unfamiliar code, you're mostly tracing values
through boxes. When a program gives a wrong answer, the cause is almost always one of these three: the
wrong value in a box, a value of the wrong type (`"30"` where you needed `30`), or the wrong operator
(`=` where you meant `==`).

## Recap

1. A **variable** is a named box holding a value; `=` **assigns** a value into it, and the value can be
   replaced later.
2. Every value has a **type** - most often a **number**, a **string** (text, in quotes), or a **boolean**
   (`True`/`False`). The type changes what operators do (`2 + 2` is `4`; `"2" + "2"` is `"22"`).
3. **Math operators** (`+ - * /`) make new numbers; in `total = price * quantity` the right side is
   computed first, then stored on the left.
4. **Comparison operators** (`== != > < >= <=`) ask questions and produce a boolean.
5. ⚠️ **`=` assigns, `==` compares.** The most common beginner bug lives right here - check it first when
   a comparison misbehaves.

Now you have values and ways to combine them. Next we give the program a will of its own: the ability to
choose what to do, repeat work, and bundle instructions into reusable tools.

---

[← Phase 1: What a Program Actually Is](01-what-a-program-is.md) · [Phase 3: Making Decisions & Reusing Work →](03-control-flow-and-functions.md)
