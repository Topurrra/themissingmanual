---
title: "Errors & I/O — Exceptions and Files"
guide: "python-from-zero"
phase: 7
summary: "Exceptions are Python's way of saying 'I can't continue' — here's try/except/finally, raise, reading and writing files with `with open(...)`, and why Python prefers asking forgiveness over asking permission."
tags: [python, exceptions, error-handling, files, io, try-except, eafp]
difficulty: intermediate
synonyms: ["python try except explained", "how to handle errors in python", "how to read a file in python", "what does with open do", "python raise exception", "what is eafp", "python finally block"]
updated: 2026-06-19
---

# Errors & I/O — Exceptions and Files

Two things happen in every real program: things go wrong, and data has to come from or go to the outside
world — usually a file. Python ties these together more than you'd expect, because reading a file is one
of the most common places things *do* go wrong (the file's missing, the disk is full, the data's
garbage). So we'll cover both in one phase.

The mental shift here is small but important. A beginner sees an error and thinks "my program crashed."
A Python programmer sees an error and thinks "an *exception* was raised, and I get to decide what happens
next." Errors aren't the end of the story — they're a signal you can catch.

## What an exception actually is

**What it actually is.** An **exception** is Python's way of stopping a piece of code dead and shouting
"I can't do what you asked." When you divide by zero, open a file that isn't there, or index past the end
of a list, Python *raises* an exception. If nobody catches it, it travels up and crashes the program,
printing a traceback.

📝 **Raise** — to trigger an exception. **Traceback** — the stack of "where it happened" lines Python
prints when an uncaught exception crashes the program. (Reading those is a skill of its own — see
[What an Error Message Tells You](/guides/what-an-error-message-tells-you).)

```python runnable
print(10 / 0)
```
```console
$ python boom.py
Traceback (most recent call last):
  File "boom.py", line 1, in <module>
    print(10 / 0)
          ~~~^~~
ZeroDivisionError: division by zero
```
*What just happened:* Dividing by zero is undefined, so Python raised a `ZeroDivisionError`. Nobody
caught it, so it bubbled all the way up and crashed the program, printing where it happened and why. The
*last* line — `ZeroDivisionError: division by zero` — is the actual problem.

## try / except — catch what you can handle

**What it actually is.** `try` marks a block "this might fail." `except` says "if *this kind* of failure
happens, do this instead of crashing." You catch only the specific failures you know how to deal with.

```python runnable
def safe_divide(a, b):
    try:
        return a / b
    except ZeroDivisionError:
        return "can't divide by zero"

print(safe_divide(10, 2))
print(safe_divide(10, 0))
```
```console
$ python divide.py
5.0
can't divide by zero
```
*What just happened:* The first call ran the `try` block cleanly and returned `5.0`. The second raised
`ZeroDivisionError` inside the `try`, so Python jumped straight to the matching `except` and returned the
friendly message instead of crashing. Control "fell into" the handler the moment the error fired.

⚠️ **Gotcha — never write a bare `except:`.** It's tempting to write `except:` with no error type to
"catch everything." Don't. A bare `except` swallows *every* exception — including `KeyboardInterrupt`
(you pressing Ctrl-C) and genuine bugs like a typo'd variable name — and hides them behind whatever you
do next. You'll spend an afternoon wondering why your program ignores Ctrl-C and silently does the wrong
thing. **Always name the exceptions you actually expect:**

```python
# BAD — hides every error, including bugs and Ctrl-C
try:
    risky()
except:
    pass

# GOOD — catch only what you understand
try:
    risky()
except (ValueError, KeyError) as err:
    print(f"handling: {err}")
```
*What just happened:* The good version catches `ValueError` and `KeyError` — the two failures you
anticipated — and binds the exception object to `err` so you can inspect it. Anything else still crashes
loudly, which is exactly what you want for bugs you didn't foresee.

## finally — code that runs no matter what

**What it actually is.** A `finally` block runs whether the `try` succeeded, failed, or raised something
you didn't catch. It's for cleanup that *must* happen — closing a connection, releasing a lock — even on
the way out the door.

```python
def read_first_line(path):
    f = open(path)
    try:
        return f.readline()
    finally:
        f.close()        # runs even if readline() blows up
        print("file closed")
```
*What just happened:* No matter what `readline()` does — return a line, or raise mid-read — `f.close()`
runs before the function actually returns or the error propagates. `finally` is your guarantee that the
file won't be left open. (In a moment, `with` will do this for you automatically — but it's worth seeing
the manual version once so you know what `with` is buying you.)

## raise — throw your own exception

**What it actually is.** You don't only *catch* exceptions; you `raise` them when *your* code hits a
situation it can't accept. Raising a clear error early beats returning a nonsense value that explodes
three functions later.

```python runnable
def withdraw(balance, amount):
    if amount > balance:
        raise ValueError(f"can't withdraw {amount} from {balance}")
    return balance - amount

print(withdraw(100, 30))
print(withdraw(100, 500))
```
```console
$ python bank.py
70
Traceback (most recent call last):
  ...
ValueError: can't withdraw 500 from 100
```
*What just happened:* The first call was fine. The second hit the guard and *raised* a `ValueError` with
a message that says exactly what went wrong. Now the caller can `try/except` it — or, if they don't, the
crash points straight at the real problem instead of a mysterious negative balance somewhere downstream.

## Reading and writing files with `with open(...)`

**What it actually is.** `open(path)` hands you a file object. `with` is a **context manager**: it
guarantees the file is closed when the block ends — even if an exception fires inside it. This is the
`finally`-cleanup from earlier, done for you.

📝 **Context manager** — anything you use with `with`. It sets something up on the way in and tears it
down on the way out, automatically. Files are the classic example.

**Writing:**
```python
with open("notes.txt", "w") as f:    # "w" = write (creates/overwrites)
    f.write("first line\n")
    f.write("second line\n")
# file is automatically closed here
```
*What just happened:* `"w"` opened `notes.txt` for writing, truncating it if it already existed. We wrote
two lines (the `\n` is the newline — `write` doesn't add one for you). When the `with` block ended,
Python flushed and closed the file. No `f.close()` needed.

**Reading it back:**
```python
with open("notes.txt") as f:         # no mode = read ("r") by default
    for line in f:                   # iterate line by line
        print(line.rstrip())         # rstrip() drops the trailing newline
```
```console
$ python files.py
first line
second line
```
*What just happened:* Opening with no mode defaults to read. Looping over a file object yields one line
at a time — memory-friendly even for huge files, because it doesn't load the whole thing at once. We
`rstrip()` each line to drop the `\n` that `print` would otherwise double up.

⚠️ **Gotcha — `"w"` erases the file.** Opening with `"w"` truncates the file to empty *before* you write
a single byte. If you meant to *add* to a file, use `"a"` (append). Reach for `"w"` only when you truly
want to start fresh. This one has eaten real data; check the mode before you run it.

## EAFP — "ask forgiveness, not permission"

**What it actually is.** There are two styles for handling things that might fail. *Look before you leap*
(LBYL) checks first: "does this file exist? then open it." *Easier to Ask Forgiveness than Permission*
(EAFP) just tries it and catches the failure. Python culture strongly prefers **EAFP** — it reads
cleaner and avoids a sneaky bug.

```python
# LBYL — check first (Python tends to avoid this)
import os
if os.path.exists("config.txt"):
    with open("config.txt") as f:
        data = f.read()
else:
    data = ""

# EAFP — just try it (the Pythonic way)
try:
    with open("config.txt") as f:
        data = f.read()
except FileNotFoundError:
    data = ""
```
*What just happened:* Both end with `data` set. But the LBYL version has a hidden flaw: the file could be
*deleted in the instant between* `exists()` returning `True` and `open()` running — and then it crashes
anyway. The EAFP version has no such gap; it attempts the real operation and handles the one failure it
cares about. Trying-and-catching is more honest about what your program actually does.

> 💡 **Key point.** When something might not work, the Pythonic instinct is *try it and catch the
> specific failure* — not interrogate the world first and hope nothing changes underneath you.

## Recap

1. An **exception** is Python saying "I can't continue." Uncaught, it crashes with a traceback whose
   *last line* names the real problem.
2. **`try` / `except`** catches failures you know how to handle — name them; **never** use a bare
   `except:`.
3. **`finally`** runs no matter what — for cleanup that must happen.
4. **`raise`** throws your own exception when your code hits something it can't accept.
5. **`with open(...)`** reads and writes files and closes them automatically; mind that `"w"` overwrites
   and `"a"` appends.
6. **EAFP** — try the operation and catch the specific error — is the Pythonic style, and it dodges the
   race condition that "check first" quietly has.

You can now handle the messy edges. Next: the tooling that turns a script into a real project — package
installs, virtual environments, formatters, and tests.

---

[← Phase 6: Objects & Classes](06-objects-and-classes.md) · [Guide overview](_guide.md) · [Phase 8: The Ecosystem & Tooling →](08-ecosystem-and-tooling.md)
