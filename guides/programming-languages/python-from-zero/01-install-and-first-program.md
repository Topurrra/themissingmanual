---
title: "Install & Your First Program"
guide: "python-from-zero"
phase: 1
summary: "Install Python 3 on Windows, macOS, or Linux, confirm it works with python3 --version, try the interactive REPL, then write and run a hello.py file with python3 hello.py."
tags: [python, install, repl, hello-world, python3, setup]
difficulty: beginner
synonyms: ["how to install python", "python3 not found", "run a python file", "python repl explained", "python vs python3", "my first python program"]
updated: 2026-06-19
---

# Install & Your First Program

To write Python, your computer needs the **interpreter** - the program that reads `.py` files and
executes them line by line. Installing it trips people up most, usually over a boring reason: the name.
Let's install it, prove it's there, and run real code two ways.

📝 **Terminology.** The **Python interpreter** is the program named `python` (or `python3`) that
executes your code. When people say "run it in Python," they mean "hand this file to the interpreter."

## Install Python 3

You want **Python 3** (3.12 or newer is great; anything 3.10+ is fine for this guide). Pick your
operating system:

**Windows** - Go to [python.org/downloads](https://www.python.org/downloads/), download the latest
Python 3 installer, and run it. On the very first screen, check **"Add python.exe to PATH"** before
clicking Install - that one checkbox prevents the most common beginner headache: the terminal not
finding Python afterward.

**macOS** - macOS ships an old, system-managed Python you shouldn't rely on. Install a fresh one with
[Homebrew](https://brew.sh):
```console
$ brew install python
```
*What just happened:* Homebrew installed an up-to-date Python 3 and wired up the `python3` command. No
Homebrew? The python.org installer works just as well.

**Linux (Debian/Ubuntu)** - Python 3 is usually already present, but install it explicitly to be sure:
```console
$ sudo apt update
$ sudo apt install python3
```
*What just happened:* `apt` (the system package manager) ensured `python3` is installed; `sudo` grants
the admin rights that installing system software requires.

## Confirm it actually installed

Open a fresh terminal (a new window, so it picks up the updated PATH) and ask Python its version:
```console
$ python3 --version
Python 3.12.4
```
*What just happened:* `--version` makes the interpreter print its version and exit instead of running
code. A `Python 3.x.x` line proves it's installed and reachable - your exact number may differ.

⚠️ **`python` vs `python3` - the name confusion that wastes everyone's first afternoon.** On macOS and
Linux, the command is almost always `python3` (plain `python` may not exist, or may point at an ancient
Python 2). On Windows, the installer typically sets up `python` (and `py`). If one name gives "command
not found," try the other:
```console
$ python --version
Python 3.12.4
```
This guide writes `python3` throughout. **On Windows, type `python` (or `py`) wherever you see
`python3`** - same interpreter, different spelling.

⚠️ **"command not found" / "not recognized."** If *neither* name works, the interpreter is installed but
your terminal can't find it - a PATH problem. On Windows, re-run the installer, check **"Add python.exe
to PATH"** (or choose "Modify" and enable it), then open a new terminal - PATH changes only apply to
terminals opened *afterward*.

## The REPL - a place to try one line at a time

Run `python3` with no file name to get the **REPL** - an interactive prompt where you type one line,
press Enter, and immediately see the result. It's the fastest way to test an idea.
```console
$ python3
Python 3.12.4 (main, Jun  6 2024, 18:26:44) [Clang 15.0.0] on darwin
Type "help", "copyright", "credits" or "license" for more information.
>>> 2 + 2
4
>>> print("hi from the REPL")
hi from the REPL
>>>
```
*What just happened:* `>>>` is the REPL's prompt. You typed `2 + 2`; the interpreter evaluated it and
printed `4` back - no `print` needed, the REPL shows the value of whatever you type. It's a scratchpad:
try a snippet, see what it does, throw it away.

📝 **Terminology.** **REPL** stands for **R**ead–**E**val–**P**rint **L**oop: it *reads* your line,
*evaluates* it, *prints* the result, then *loops* back for the next one.

To leave the REPL and return to your normal terminal, type `exit()` and press Enter (or press
**Ctrl-D** on macOS/Linux, **Ctrl-Z** then Enter on Windows):
```console
>>> exit()
$
```
*What just happened:* `exit()` told the interpreter to quit; you're back at your shell's `$` prompt. The
REPL forgets everything on close - exactly why real programs live in files.

## Your first program in a file

A REPL is great for experiments, but real programs are saved files you can run again. Create a file
called `hello.py` in any folder, with one line in it:
```python runnable
print("Hello, Python!")
```
*What just happened:* The same `print` instruction from the REPL, now saved to disk. `print` displays
whatever's in the parentheses - here, the text in quotes. (New to `print` and "argument"? [Programming
From Zero, Phase 1](/guides/programming-from-zero) walks through them slowly.)

Now run the file by handing it to the interpreter:
```console
$ python3 hello.py
Hello, Python!
```
*What just happened:* `python3 hello.py` read the file and ran its instructions top to bottom, hit the
`print` line, and showed your text - a complete Python program, written, saved, and run.

⚠️ **`can't open file 'hello.py'`.** Seeing `python3: can't open file 'hello.py': [Errno 2] No such file
or directory` means your terminal isn't *in* the folder where you saved the file. `cd` into that folder
(e.g. `cd Desktop`) and run the command again - the interpreter looks for files relative to where your
terminal is "standing."

💡 **Key point.** Two ways to run Python, two jobs. The **REPL** (`python3` alone) tries one line at a
time and throws it away. A **file** (`python3 yourfile.py`) is for real, repeatable programs. You'll
live in files, keeping the REPL open on the side for quick tests.

## Recap

1. Install **Python 3** - python.org on Windows (check **Add to PATH**), Homebrew on macOS, `apt` on
   Linux.
2. **`python3 --version`** confirms it's installed and reachable. On Windows, use `python` or `py`.
3. The command name is the #1 gotcha: `python3` on macOS/Linux, usually `python` on Windows. "Not
   found" means a PATH problem - reinstall with PATH enabled, open a fresh terminal.
4. The **REPL** (`python3` with no file) runs one line at a time and prints results; `exit()` leaves it.
5. Save real code in a `.py` file and run it with **`python3 yourfile.py`**.

Next: values, the types they come in, and Python's use of *indentation* to structure code.

---

[← Guide overview](_guide.md) · [Phase 2: Syntax, Values & Types →](02-syntax-values-and-types.md)
