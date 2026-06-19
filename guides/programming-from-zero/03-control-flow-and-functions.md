---
title: "Making Decisions & Reusing Work: Control Flow & Functions"
guide: "programming-from-zero"
phase: 3
summary: "if/else lets a program branch on a condition, loops repeat work without copy-paste, and functions bundle instructions into a named, reusable tool you call by name — the most powerful idea a beginner can learn."
tags: [programming, beginner, python, if-else, loops, functions, control-flow]
difficulty: beginner
synonyms: ["how does if else work", "what is a loop in programming", "what is a function", "how to write a function in python", "for loop python beginner", "branching and looping explained"]
updated: 2026-06-19
---

# Making Decisions & Reusing Work: Control Flow & Functions

So far your programs have been a straight line: the computer starts at the top, runs each instruction
once, and reaches the bottom. That's enough to *calculate*, but not enough to *behave*. Real programs do
different things in different situations, repeat work without you copying it out by hand, and reuse the
same logic in many places.

Three ideas unlock all of that, and together they're what turn a list of instructions into a real
program: **`if`/`else`** (choosing), **loops** (repeating), and **functions** (reusing). The last one is
the most important thing you'll learn as a beginner — we've saved it for the end on purpose.

## Making decisions with `if` / `else`

**What `if` actually is.** `if` lets the computer choose. You give it a condition — a question that comes
out `True` or `False` (remember comparison operators from [Phase 2](02-building-blocks.md)) — and a block
of instructions. The computer runs that block **only if** the condition is `True`. If it's `False`, it
skips the block.

```python runnable
temperature = 35
if temperature > 30:
    print("It's hot out. Drink water.")
```
*What just happened:* The computer evaluated the condition `temperature > 30`. Since `temperature` is
`35`, the condition is `True`, so it ran the indented line. Output:

```console
It's hot out. Drink water.
```

If `temperature` had been `20`, the condition would be `False`, the indented line would be skipped, and
the program would print nothing at all.

Two pieces of grammar are doing real work here, and they confuse beginners until someone points them
out:

- **The colon (`:`)** at the end of the `if` line means "here comes the block of instructions that
  belongs to this `if`."
- **The indentation** (the spaces before `print`) is how Python knows which lines are *inside* the `if`.
  Indented lines belong to the `if`; un-indented lines come after it and run regardless.

📝 **Terminology.** This whole family of features — `if`, loops, functions — is called **control flow**,
because it controls the *flow* of execution: which instructions run, in what order, how many times.
Plain top-to-bottom is one path; control flow lets you branch off it.

### `else` and `elif`: the other paths

`if` alone handles "do this when true, otherwise do nothing." Often you want "do this, *otherwise* do
that." That's `else`. And for more than two paths, `elif` ("else if") checks another condition:

```python runnable
score = 72
if score >= 90:
    print("Grade: A")
elif score >= 70:
    print("Grade: B")
else:
    print("Grade: C or below")
```
*What just happened:* The computer checked the conditions top to bottom and took the **first** one that's
`True`, then skipped the rest. `score >= 90`? No (72 is not ≥ 90). `score >= 70`? Yes — so it printed
"Grade: B" and ignored the `else` entirely:

```console
Grade: B
```

That "first match wins, then stop" behavior is the whole point: exactly one of the branches runs, never
two. Order them carefully — if you'd checked `>= 70` before `>= 90`, a 95 would match the `>= 70` branch
first and never reach the A.

## Repeating work with loops

**What a loop actually is.** A loop runs the same block of instructions more than once. Without loops,
printing the numbers 1 through 5 means writing five `print` lines. With a loop, you write the instruction
once and tell the computer how many times to do it.

The most common loop, the `for` loop, walks through a sequence of values, running its block once for each
one:

```python runnable
for number in range(1, 6):
    print(number)
```
*What just happened:* `range(1, 6)` produces the numbers 1, 2, 3, 4, 5 (it starts at the first value and
stops *before* the second — more on that in a second). The loop ran its indented block once per number,
each time putting the current number into the variable `number`. Five passes, five lines of output:

```console
1
2
3
4
5
```

The same colon-and-indentation grammar from `if` applies: the `:` introduces the block, and the indented
lines are what gets repeated.

⚠️ **Gotcha: `range(1, 6)` stops *before* `6`, not at it.** This catches everyone. `range(start, stop)`
includes `start` but excludes `stop` — so `range(1, 6)` gives you 1 through 5, and `range(0, 3)` gives
you 0, 1, 2. If you want the numbers 1 through 10, you write `range(1, 11)`. The "stops before the end"
rule shows up all over programming; meet it now and it'll surprise you less later.

Loops aren't only for counting. Their real value is doing real work many times. Here we add up a list of
numbers:

```python runnable
prices = [10, 25, 5]
total = 0
for price in prices:
    total = total + price
print(total)
```
*What just happened:* We started with `total` at `0`. The loop ran once for each value in `prices`: it
took `10` and set `total` to `0 + 10` = `10`; then `25`, making `total` `35`; then `5`, making it `40`.
After the loop finished, we printed the final `total`:

```console
40
```

📝 **Terminology.** `prices = [10, 25, 5]` is a **list** — an ordered collection of values held in one
variable. Lists are how programs hold "many things," and looping over them is how programs process those
things one by one. (Lists have a lot more to them; that's a topic for
[Data Structures Explained](/guides/data-structures-explained).)

💡 **Key point.** A loop is the cure for copy-paste. Any time you notice you'd be writing nearly the same
line over and over, that's a loop waiting to happen. Write the work once; let the loop repeat it.

## Functions: the most powerful idea you'll learn

Here it is — the idea that does more for a beginner than any other. Stay with this one.

**What a function actually is.** A function is a named, reusable block of instructions. You define it
once, giving it a name and the steps it should perform. Then, anywhere you want those steps to run, you
**call** the function by its name — and the computer jumps to the block, runs it, and comes back. You
already met one: `print` is a function someone else wrote, that you call. Now you'll write your own.

Why does this matter so much? Because it lets you name a piece of work and reuse it without repeating
yourself. Think of a function as a recipe card: written once, followed any number of times, by anyone,
without re-explaining the steps.

```python runnable
def greet():
    print("Hello!")
    print("Welcome to the program.")

greet()
greet()
```
*What just happened:* The `def greet():` block **defined** a function named `greet` — but defining it
doesn't run it; it just teaches the computer the steps. The two `greet()` lines at the bottom **called**
it. Each call ran the function's two `print` lines, so the greeting appeared twice:

```console
Hello!
Welcome to the program.
Hello!
Welcome to the program.
```

📝 **Terminology.** `def` (short for "define") starts a function definition. The name is followed by
parentheses `()` and a colon, and the indented lines beneath are the function's **body** — the
instructions it runs when called. Defining ≠ running: the body only runs when you *call* the function by
writing its name with parentheses.

### Inputs and outputs: parameters and `return`

A function that does the exact same thing every time is useful, but the real power comes from feeding it
**inputs** and getting a **result** back.

- An **input** is a value you hand the function when you call it (an *argument*, like the text you give
  `print`). Inside the function, that value lands in a named slot called a **parameter**.
- A **result** is a value the function hands back to you, using the `return` instruction.

```python runnable
def add(a, b):
    result = a + b
    return result

answer = add(10, 5)
print(answer)
```
*What just happened:* We called `add(10, 5)`. The computer jumped into the function, putting `10` into
the parameter `a` and `5` into `b`. It calculated `a + b` (`15`), stored it in `result`, and `return`
**handed that value back** to the place that called it. Back outside, `add(10, 5)` became `15`, which we
stored in `answer` and printed:

```console
15
```

`return` is the function's way of *answering*. When the computer hits `return`, it stops the function
immediately and sends that value back to whoever called it. A function with `return` can be used anywhere
you'd use a value — you can store it, print it, compare it, or feed it into another function.

⚠️ **Gotcha: `print` and `return` are not the same thing, and confusing them is extremely common.**
`print` puts text on the screen for a *human* to read and hands nothing back to the program. `return`
gives a value back to the *program* so it can keep using it, and puts nothing on the screen. A function
that `print`s its answer but doesn't `return` it can't have its answer used in the next calculation —
the value was shown and then thrown away. When a function "works when I print inside it but breaks when I
try to use the result," this is almost always why.

## Putting it all together

Here's a tiny but complete program that uses every idea from this guide at once. Read it top to bottom,
the way the computer does, and you should be able to follow every line:

```python runnable
def grade_for(score):
    if score >= 90:
        return "A"
    elif score >= 70:
        return "B"
    else:
        return "C or below"

scores = [95, 72, 40]
for score in scores:
    letter = grade_for(score)
    print(score, "->", letter)
```
*What just happened:* We defined a function `grade_for` that takes a `score`, uses `if`/`elif`/`else` to
decide a letter grade, and `return`s it. Then we made a list of three scores and looped over them — for
each one, we called `grade_for`, stored the returned letter, and printed the score next to its grade:

```console
95 -> A
72 -> B
40 -> C or below
```

Look at what's working together: a **variable** holds each score; **types** (numbers, strings, the
booleans the comparisons produce) flow through it; **operators** (`>=`) ask the questions; **`if`/`elif`/
`else`** chooses the path; a **loop** repeats the work for every score; and a **function** bundles the
grading logic so it's written once and reused three times. That's not a toy — that's the shape of real
programs. Bigger ones are this, repeated and combined.

## You can now read most code

Take a breath, because you've crossed a real line. The five ideas you now hold — values in variables,
their types, operators to combine them, control flow to choose and repeat, and functions to reuse — are
the load-bearing structure of *every* program. Languages differ in their punctuation and their
vocabulary, but open almost any codebase and you'll see these same five things arranged in different
patterns.

You won't understand every line of every program yet — there's plenty more (lists and dictionaries in
depth, working with files, organizing big programs with classes). But you can now read a block of code,
trace what it does line by line, and reason about it instead of fearing it. That's the skill. Everything
else is more vocabulary built on this exact grammar.

## Recap

1. **`if` / `elif` / `else`** run a block based on a condition; the **first** true branch wins and the
   rest are skipped. The `:` and indentation define which lines belong to the block.
2. **Loops** (`for ... in ...`) repeat a block once per value — the cure for copy-paste. ⚠️ `range(1, 6)`
   stops *before* 6, giving 1–5.
3. A **function** (`def name():`) is a named, reusable block of instructions you **call** by name;
   defining it doesn't run it.
4. Functions take **inputs** (arguments landing in parameters) and hand back a **result** with `return`.
   ⚠️ `print` shows a value to a human; `return` gives it back to the program — not the same thing.
5. Real programs are these ideas — variables, types, operators, control flow, functions — combined. You
   can now read them.

## Where to go next

- **[What Happens When Code Runs](/guides/what-happens-when-code-runs)** — the next layer down: what the
  computer actually does with your instructions when you press "run."
- **[Data Structures Explained](/guides/data-structures-explained)** — lists, dictionaries, and the other
  ways programs organize many values at once.

---

[← Phase 2: The Building Blocks](02-building-blocks.md) · [Guide overview →](_guide.md)
