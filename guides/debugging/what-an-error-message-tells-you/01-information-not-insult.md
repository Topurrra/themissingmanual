---
title: "An Error Is Information, Not an Insult"
guide: "what-an-error-message-tells-you"
phase: 1
summary: "An error message is the computer reporting what it tried and why it stopped. Almost every one has the same three parts: the error type, the message, and the location."
tags: [errors, debugging, error-anatomy, beginner, exceptions]
difficulty: beginner
synonyms: ["parts of an error message", "what is an error type", "what does traceback mean", "anatomy of an error", "where is the error in my code"]
updated: 2026-06-19
---

# An Error Is Information, Not an Insult

The first thing to unlearn is the feeling. When red text appears, it *feels* like the computer caught you
doing something stupid. It isn't - it's a machine that hit a step it couldn't complete, reporting back:
"I got this far, then I couldn't continue, and here's the reason." A status update from a very literal
coworker.

Fear makes you skim - you glance at the red, panic, and miss the line that hands you the answer. Calm makes
you read, and errors turn out to be far more structured than they first appear.

## What an error actually is

An error (also called an *exception*, *fault*, or *traceback*) is a message your language or program
prints when it can't do what you asked: a word it couldn't understand, a thing that was missing, an action
it wasn't allowed to take. Rather than guess what you meant, it stops and tells you.

📝 **Terminology.** *Exception* is the word many languages use for "an error that interrupts normal
running." *Traceback* (or *stack trace*) is the list of steps the program was mid-way through when it
failed. Treat them as flavors of the same thing: a report of a failure.

Beginners read an error as a verdict - "I'm bad at this" - instead of data describing the *code's*
situation, not their worth. Every minute you don't panic is a minute you spend reading, and the answer is
almost always sitting right there in the text.

## The anatomy: three parts in almost every error

Errors are readable because they nearly all carry the same three pieces of information. Spot them and any
error stops being a wall and becomes a form you can fill in.

```text
   ┌─────────────────────────────────────────────────────────────┐
   │  1. WHERE it happened      file name + line number            │
   │  2. WHAT TYPE of problem   the error's name/category          │
   │  3. THE MESSAGE            a sentence describing the specifics │
   └─────────────────────────────────────────────────────────────┘
```

1. **The location** - *which file, which line.* The most valuable part, and the one beginners most often
   skip.
2. **The type** - *the category*, like `TypeError`, `SyntaxError`, or `FileNotFoundError`. Narrows your
   search enormously.
3. **The message** - *a human-readable sentence* with the specifics: which name was undefined, which file
   wasn't found, which value was the wrong type.

## A real example, in Python

Say you have a tiny script that tries to add a number to a piece of text:

```console
$ python greet.py
Traceback (most recent call last):
  File "greet.py", line 3, in <module>
    total = "Age: " + 30
            ~~~~~~~~~^~~~
TypeError: can only concatenate str (not "int") to str
```

*What just happened:* Read it from the **bottom up** - that's where the answer almost always is.

- **The type:** `TypeError` - you used a value of the wrong type.
- **The message:** `can only concatenate str (not "int") to str`. You tried to glue a number (`int`) onto a
  string (`str`) with `+`, and Python only glues strings to strings. (📝 *concatenate* means "join end to
  end.")
- **The location:** `File "greet.py", line 3` - it even underlines the exact expression, `"Age: " + 30`,
  with `~~~^~~` so you don't have to hunt.

Without knowing anything else, the error told you: *line 3, you mixed text and a number, turn the number
into text.* The fix writes itself: `"Age: " + str(30)`.

⚠️ **Read errors bottom-to-top.** Python prints the *path it took* first and the *actual failure* last. The
bottom line (type + message) is the headline; the lines above are the trail. New readers start at the top,
drown in file paths, and miss the line that matters. Start at the bottom.

## The same anatomy, in JavaScript

Same idea, different language - the parts don't change, only the formatting:

```console
$ node cart.js
/home/you/shop/cart.js:5
  console.log(cart.total);
                   ^

TypeError: Cannot read properties of undefined (reading 'total')
    at calculate (/home/you/shop/cart.js:5:20)
    at Object.<anonymous> (/home/you/shop/cart.js:9:1)
```

*What just happened:* All three parts are here, just arranged differently:

- **The type:** `TypeError` again - same category, different language.
- **The message:** `Cannot read properties of undefined (reading 'total')` - you tried to read `.total`
  from something that was `undefined`, nothing was there. (This "nothing where I expected something"
  family returns in [Phase 2](02-common-families.md); it's one of the most common errors in programming.)
- **The location:** `cart.js:5:20` - **line 5, column 20**, with `^` pointing at `cart.total`. The `at ...`
  lines are the stack trace; reading long ones is its own skill in
  [Reading a Stack Trace](/guides/reading-a-stack-trace).

💡 **Key point.** Different languages dress their errors differently, but the same three questions are
always being answered: *where, what type, and what specifically?* Train your eye on those three and you
can read an error in a language you've never used before.

## What about errors with no line number?

Not every error points at a line of *your* code - that's information too. A command-line tool might just
print:

```console
$ npm start
sh: vite: command not found
```

*What just happened:* No file and no line, because the problem isn't *inside* your code - a program
(`vite`) the project expects couldn't be found on your system. The same instinct still helps: type
("command not found"), message (`vite`), rough location (during `npm start`). A missing line number itself
signals the trouble is in your *environment*, not your *logic*.

## Recap

1. An error is a **status report**, not a judgment - a step the computer couldn't finish, reported back.
2. Almost every error answers three questions: **where** (file + line), **what type** (the category), and
   **what specifically** (the message).
3. **Read bottom-to-top** in languages like Python: the last line is the headline, the lines above the trail.
4. The anatomy is **the same across languages** - only the formatting changes.
5. **No line number** usually means the problem is in your environment (a missing tool, a bad path), not
   your code's logic.

Next: the handful of error *families* you'll meet over and over, so reading the type already tells you half
of what went wrong.

---

[← Guide overview](_guide.md) · [Phase 2: The Common Error Families →](02-common-families.md)
