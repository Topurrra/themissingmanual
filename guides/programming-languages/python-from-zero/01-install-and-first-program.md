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

Before you can write Python, your computer needs a copy of the thing that *runs* Python - the
**interpreter**. That's a program that reads your `.py` files and carries out the instructions in them,
one line at a time. Installing it is the part that trips people up most, usually for a boring reason:
the name. So let's get the interpreter installed, prove it's there, and run real code two different
ways.

📝 **Terminology.** The **Python interpreter** is the program named `python` (or `python3`) that
executes your code. When people say "run it in Python," they mean "hand this file to the interpreter."

## Install Python 3

You want **Python 3** (3.12 or newer is great; anything 3.10+ is fine for this guide). Pick your
operating system:

**Windows** - Go to [python.org/downloads](https://www.python.org/downloads/), download the latest
Python 3 installer, and run it. On the very first screen, check the box that says **"Add python.exe to
PATH"** before clicking Install. This one checkbox saves you the single most common beginner headache -
the terminal not finding Python afterward.

**macOS** - macOS ships an old, system-managed Python you shouldn't rely on. Install a fresh one with
[Homebrew](https://brew.sh):
```console
$ brew install python
```
*What just happened:* Homebrew (a package manager for macOS) downloaded and installed an up-to-date
Python 3, wiring up the `python3` command for you. If you don't have Homebrew, the python.org installer
works just as well.

**Linux (Debian/Ubuntu)** - Python 3 is usually already present, but install it explicitly to be sure:
```console
$ sudo apt update
$ sudo apt install python3
```
*What just happened:* `apt` (the system package manager) made sure `python3` is installed. `sudo` runs
the command with admin rights, which installing system software requires.

## Confirm it actually installed

Open a fresh terminal (a new window - important, so it picks up the new PATH) and ask Python its
version:
```console
$ python3 --version
Python 3.12.4
```
*What just happened:* You ran the interpreter with the `--version` flag, which makes it print its
version and exit instead of running any code. Seeing a `Python 3.x.x` line is your proof that the
interpreter is installed and reachable. Your exact number will differ - any 3.x is what you want.

⚠️ **`python` vs `python3` - the name confusion that wastes everyone's first afternoon.** On macOS and
Linux, the command is almost always `python3` (plain `python` may not exist, or may point at an ancient
Python 2). On Windows, the installer typically sets up `python` (and `py`). If one name gives you "command
not found," try the other:
```console
$ python --version
Python 3.12.4
```
For the rest of this guide we'll write `python3`. **On Windows, type `python` (or `py`) wherever you see
`python3`.** Same interpreter, different spelling.

⚠️ **"command not found" / "not recognized."** If *neither* name works, the interpreter is installed but
your terminal doesn't know where to find it - that's the PATH problem. On Windows, the fix is almost
always re-running the installer and checking **"Add python.exe to PATH"** (or choosing "Modify" and
enabling it). Then close every terminal window and open a new one - PATH changes only apply to terminals
opened *afterward*.

## The REPL - a place to try one line at a time

Run `python3` with no file name and you get the **REPL** - an interactive prompt where you type one
line, press Enter, and immediately see the result. It's the fastest way to test an idea.
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
*What just happened:* The `>>>` is the REPL's prompt, waiting for input. You typed `2 + 2`; the
interpreter evaluated it and printed `4` right back - no `print` needed, the REPL shows you the value of
whatever you type. This is your scratchpad: try a snippet, see what it does, throw it away.

📝 **Terminology.** **REPL** stands for **R**ead–**E**val–**P**rint **L**oop: it *reads* your line,
*evaluates* it, *prints* the result, then *loops* back for the next one.

To leave the REPL and return to your normal terminal, type `exit()` and press Enter (or press
**Ctrl-D** on macOS/Linux, **Ctrl-Z** then Enter on Windows):
```console
>>> exit()
$
```
*What just happened:* `exit()` told the interpreter to quit. You're back at your shell's `$` prompt -
the REPL is gone, and so is everything you typed in it. The REPL forgets everything when it closes,
which is exactly why real programs live in files.

## Your first program in a file

A REPL is great for experiments, but real programs are saved files you can run again and re-run. Create
a file called `hello.py` in any folder, with one line in it:
```python runnable
print("Hello, Python!")
```
*What just happened:* This is the same `print` instruction from the REPL, now saved to disk. `print`
displays whatever you put in the parentheses; here, the text in quotes. (If `print` and "argument" are
new ideas, [Programming From Zero, Phase 1](/guides/programming-from-zero) walks through them slowly.)

Now run the file by handing it to the interpreter:
```console
$ python3 hello.py
Hello, Python!
```
*What just happened:* `python3 hello.py` told the interpreter to read `hello.py` and carry out its
instructions, top to bottom. It hit the one `print` line and showed your text. That's a complete Python
program - you wrote it, saved it, and ran it.

⚠️ **`can't open file 'hello.py'`.** If you see something like `python3: can't open file 'hello.py':
[Errno 2] No such file or directory`, your terminal isn't *in* the folder where you saved the file. Use
`cd` to move into that folder first (e.g. `cd Desktop`), then run the command again. The interpreter
looks for the file relative to where your terminal is "standing."

💡 **Key point.** Two ways to run Python, two jobs. The **REPL** (`python3` alone) is for trying one
line at a time and throwing it away. A **file** (`python3 yourfile.py`) is for real, repeatable
programs. You'll live in files; you'll keep the REPL open on the side to test snippets.

## Recap

1. Install **Python 3** - python.org on Windows (check **Add to PATH**), Homebrew on macOS, `apt` on
   Linux.
2. **`python3 --version`** confirms it's installed and reachable. On Windows, use `python` or `py`.
3. The command name is the #1 gotcha: `python3` on macOS/Linux, usually `python` on Windows. "Not
   found" means a PATH problem - reinstall with PATH enabled, open a fresh terminal.
4. The **REPL** (`python3` with no file) runs one line at a time and prints results; `exit()` leaves it.
5. Save real code in a `.py` file and run it with **`python3 yourfile.py`**.

Next, we give Python something to work with: values, the types they come in, and the surprising way
Python uses *indentation* to structure code.

---

[← Guide overview](_guide.md) · [Phase 2: Syntax, Values & Types →](02-syntax-values-and-types.md)
