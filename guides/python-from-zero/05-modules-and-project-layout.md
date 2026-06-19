---
title: "Modules & Project Layout"
guide: "python-from-zero"
phase: 5
summary: "Split code across files with import, pull in the standard library, write your own modules, understand the if __name__ == '__main__' guard, and lay out a small project so it stays sane as it grows."
tags: [python, import, modules, standard-library, project-layout, main, packages]
difficulty: beginner
synonyms: ["python import explained", "what is a module in python", "if __name__ == __main__ meaning", "python standard library", "how to structure a python project", "python package layout", "modulenotfounderror python"]
updated: 2026-06-19
---

# Modules & Project Layout

One file is fine for a script. But the moment a program grows past a screen or two, cramming everything
into `main.py` turns it into a haystack. Python's answer is the **module**: every `.py` file is one, and
you pull code from one file into another with `import`. That same mechanism gives you the **standard
library** — a huge toolbox that ships with Python. Once you can split and combine files cleanly, you can
build something real without losing track of it.

## A module is just a `.py` file

**What it actually is.** A **module** is a single Python file. Its functions, variables, and (later)
classes can be *imported* — borrowed — into another file. There's nothing special you do to create one;
writing `greetings.py` already makes a module named `greetings`.

Let's build a tiny two-file program. First, the module:
```python
# greetings.py
def shout(text):
    return text.upper() + "!"

PI = 3.14159
```
*What just happened:* This file defines one function and one variable. On its own it doesn't *do*
anything visible — it's a toolbox waiting to be opened by another file. (The `#` starts a **comment** —
a note for humans that Python ignores.)

## `import` — borrow code from another module

Now a second file that uses it. There are two common styles, and they differ in *how you then refer to
the borrowed names*:
```python
# main.py
import greetings
from greetings import shout

print(greetings.PI)
print(shout("hello"))
```
*What just happened:* `import greetings` brought in the whole module — you reach into it with a dot, like
`greetings.PI`. `from greetings import shout` pulled out *just* that one name, so you can call `shout`
directly without the prefix:
```console
3.14159
HELLO!
```

📝 **Terminology.** `import module` brings in the module as a namespace (use `module.thing`). `from
module import thing` brings a specific name straight into your file (use `thing`). Both run the imported
file once; the difference is only how you spell the names afterward.

⚠️ **`ModuleNotFoundError`.** If Python can't find what you're importing, you get:
```console
ModuleNotFoundError: No module named 'greetings'
```
Two usual causes: the file isn't in the same folder you're running from (Python looks alongside the file
you ran), or you misspelled the name. Note you import `greetings`, **not** `greetings.py` — drop the
extension.

## The standard library — batteries included

**What it actually is.** Python ships with a large collection of ready-made modules called the
**standard library** — math, dates, randomness, file paths, JSON, and far more. You import them exactly
like your own modules, but you don't have to install anything; they're already there.
```python
import math
from random import randint

print(math.sqrt(16))
print(randint(1, 6))
```
*What just happened:* `math.sqrt(16)` returned the square root as a float. `randint(1, 6)` returned a
random whole number from 1 to 6 (a die roll) — yours will vary:
```console
4.0
3
```

💡 **Key point.** "Is there already a module for this?" is the right first question in Python. The
standard library covers an enormous amount, and what it doesn't cover, the wider ecosystem usually does —
that's [Phase 8](08-ecosystem-and-tooling.md). Reach for existing, tested code before writing your own.

## `if __name__ == "__main__"` — run-directly vs imported

This line shows up in nearly every Python file, and it looks cryptic until you see what problem it
solves.

**The problem.** When you `import` a file, Python *runs the whole file* to define its functions and
variables. That's fine for `def`s — but any *top-level* code (a `print`, a call) runs too, the moment
someone imports it. You usually don't want your module's demo or startup code firing just because another
file borrowed one function from it.

**The mechanism.** Python sets a built-in variable, `__name__`, differently depending on how the file is
used: it's `"__main__"` when you **run the file directly**, but the *module's own name* when the file is
**imported**. So you guard "run this only when executed directly" behind a check on it.
```python
# greetings.py
def shout(text):
    return text.upper() + "!"

if __name__ == "__main__":
    print(shout("running directly"))
```
*What just happened:* The `def` always defines the function — whether imported or run directly. The
guarded block runs *only* when this file is the one you launched. Run it directly:
```console
$ python3 greetings.py
RUNNING DIRECTLY!
```
But `import greetings` from another file defines `shout` and *skips* the guarded block entirely, because
`__name__` is `"greetings"`, not `"__main__"`. So importing it stays silent — exactly what you want.

📝 **Terminology.** `__name__` is a variable Python sets for you. Equal to `"__main__"` ⇒ "this file was
run directly." Equal to the module name ⇒ "this file was imported." The `if __name__ == "__main__":`
block is conventionally where a script's *starting point* lives.

## A sane small project layout

As a program grows, group related code into files and put the pieces in sensible places. A clean,
common starting shape for a small project:

```mermaid
flowchart TD
  root[my_project/] --> main[main.py — the entry point]
  root --> pkg[app/ — your package]
  root --> reqs[requirements.txt — dependencies]
  root --> readme[README.md — what & how to run]
  pkg --> init[__init__.py — marks app/ as a package]
  pkg --> greet[greetings.py — a module]
  pkg --> models[models.py — a module]
```

What each piece is for:

- **`main.py`** — the entry point you run (`python3 main.py`). It imports from your package and kicks
  things off inside an `if __name__ == "__main__":` block.
- **`app/`** — a folder holding your real code, split into focused modules (`greetings.py`,
  `models.py`, …). A folder of modules like this is called a **package**.
- **`app/__init__.py`** — an (often empty) file whose presence tells Python "this folder is a package."
  You import from it as `from app.greetings import shout`.
- **`requirements.txt`** — a list of outside libraries your project needs (covered in
  [Phase 8](08-ecosystem-and-tooling.md)).
- **`README.md`** — a plain-text note saying what the project is and how to run it. Your future self
  will thank you.

📝 **Terminology.** A **module** is one `.py` file; a **package** is a folder of modules (marked by
`__init__.py`). "Import from the `app` package" means reach into that folder's files.

⚠️ **Don't over-organize on day one.** A 30-line script doesn't need a package — a single file is
correct. Add structure when the file gets unwieldy, not before. (This is the "no speculative
abstraction" rule from the project's own guidelines.) Start flat; split when it hurts.

## Recap

1. Every `.py` file is a **module**; `import` borrows its code into another file.
2. `import module` ⇒ use `module.thing`; `from module import thing` ⇒ use `thing` directly. Import by
   name, without `.py`.
3. The **standard library** ships with Python — `math`, `random`, and many more — no install needed.
   Check it before writing your own.
4. `if __name__ == "__main__":` runs a block *only when the file is executed directly*, not when it's
   imported. It's where a script's starting point goes.
5. A small project: a `main.py` entry point, an `app/` **package** (folder of modules with
   `__init__.py`), plus `requirements.txt` and a `README.md`. Add structure only when you need it.

You can now organize code across files. Next, we model *things* — objects and the classes that define
them — so your data and the operations on it live together.

---

[← Phase 4: Control Flow & Functions](04-control-flow-and-functions.md) · [Guide overview](_guide.md) · [Phase 6: Objects & Classes →](06-objects-and-classes.md)
