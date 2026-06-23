---
title: "The Ecosystem & Tooling"
guide: "python-from-zero"
phase: 8
summary: "pip installs packages, virtual environments keep projects from poisoning each other, requirements.txt/pyproject.toml record what you depend on, and black/ruff/pytest keep your code clean and tested — the everyday toolbox, explained."
tags: [python, pip, venv, virtual-environment, pytest, black, ruff, pyproject, requirements]
difficulty: intermediate
synonyms: ["what is pip", "how to use python virtual environment", "what is venv", "what is requirements.txt", "what is pyproject.toml", "how to run pytest", "what is black and ruff python"]
updated: 2026-06-19
---

# The Ecosystem & Tooling

You can write Python forever with nothing but the standard library. But the moment you want to talk to a
web API, parse a spreadsheet, or run a test suite, you'll reach for code other people wrote — and that's
where the tooling around the language matters as much as the language itself.

This phase is the everyday toolbox: how to install packages, how to stop those packages from turning your
machine into a junk drawer, and the three tools (a formatter, a linter, a test runner) that separate
"a script that works on my laptop" from "a project a team can live in." None of it is hard once you see
what each piece is *for*.

## pip — the package installer

**What it actually is.** **pip** is Python's package installer. It downloads libraries from **PyPI** (the
Python Package Index, a giant public repository) and makes them importable in your code.

📝 **Package** — a reusable library someone published (e.g. `requests` for HTTP, `rich` for pretty
terminal output). **PyPI** — the official place pip downloads them from.

```console
$ python -m pip install requests
Collecting requests
  Downloading requests-2.32.3-py3-none-any.whl (64 kB)
Installing collected packages: requests
Successfully installed requests-2.32.3
```
*What just happened:* pip fetched the `requests` library (and its dependencies) from PyPI and installed
it where Python can find it. Now `import requests` works in your code. We wrote `python -m pip` rather
than bare `pip` on purpose — that form guarantees you're using the pip that belongs to *this* Python,
not some other one lurking on your `PATH`.

## Virtual environments — one isolated box per project

**The problem it solves.** Say project A needs `requests` version 2.20 and project B needs 2.32. If you
install packages globally, those two projects fight over one shared pile of libraries, and upgrading one
project silently breaks the other. This is called "dependency hell," and it is exactly as fun as it
sounds.

**What it actually is.** A **virtual environment** (venv) is a private, throwaway folder holding its own
copy of Python and its own packages, isolated from every other project and from the system Python.
Each project gets its own box; what you install in one can't touch another.

```console
$ python -m venv .venv
$ source .venv/bin/activate        # macOS/Linux
(.venv) $ python -m pip install requests
```
On Windows the activation line is different:
```console
> python -m venv .venv
> .venv\Scripts\activate
(.venv) > python -m pip install requests
```
*What just happened:* `python -m venv .venv` created a folder named `.venv` containing a fresh, empty
Python. `activate` switched your shell to use it — notice the `(.venv)` prefix on the prompt, your sign
that you're inside the box. Now `pip install` drops packages *into `.venv` only*. Delete the folder and
the environment is gone, harming nothing else. To leave, run `deactivate`.

> 💡 **Key point.** Make a virtual environment for *every* project, the moment you start it. It's the
> single habit that prevents the most common, most baffling "it worked yesterday" failures. The `.venv`
> folder is disposable — never commit it to Git.

⚠️ **Gotcha — installing into the wrong place.** If you `pip install` and forget to activate first, the
package lands in your global Python (or fails with a permissions error), and your project won't see it.
The `(.venv)` prompt prefix is the thing to check. No prefix, no isolation.

## Recording dependencies — requirements.txt and pyproject.toml

**The problem it solves.** Your `.venv` lives only on your machine. A teammate (or a server, or
future-you on a new laptop) needs to recreate the *same* set of packages. You record them in a file.

**`requirements.txt`** — the simple, classic format: one package per line, usually with a pinned version.

```console
$ python -m pip freeze > requirements.txt
$ cat requirements.txt
certifi==2024.7.4
charset-normalizer==3.3.2
idna==3.7
requests==2.32.3
urllib3==2.2.2
```
*What just happened:* `pip freeze` printed every installed package with its exact version, and `>` saved
that list to `requirements.txt`. Anyone can now recreate your environment with
`pip install -r requirements.txt` and get the identical versions — no guessing, no drift.

**`pyproject.toml`** — the modern, richer format. It's a single config file that describes your project
*and* its dependencies (and configures your tools, below), defined by a Python standard. A minimal one:

```toml
[project]
name = "my-app"
version = "0.1.0"
dependencies = [
    "requests>=2.32",
]
```
*What just happened:* This declares the project's name, version, and that it depends on `requests` 2.32
or newer. Modern tooling reads this one file instead of scattering config across many. For a first
project, `requirements.txt` is perfectly fine; `pyproject.toml` is where things head as a project grows.

📝 **Pinning** — recording an *exact* version (`requests==2.32.3`) so installs are reproducible.
`>=2.32` is a *range* — looser, picks up newer compatible releases. Pin for apps you deploy; ranges are
common for libraries.

## The quality tools — black, ruff, pytest at a glance

These three are the ones you'll meet on almost every serious Python project. Install them into your venv
(`pip install black ruff pytest`).

### black — the formatter

**What it actually is.** **black** is an *opinionated* code formatter. It rewrites your file into one
consistent style — spacing, line breaks, quotes — so nobody on the team argues about formatting ever
again. It makes the decisions; you stop thinking about them.

```console
$ black app.py
reformatted app.py

All done! ✨ 🍰 ✨
1 file reformatted.
```
*What just happened:* black rewrote `app.py` in place to match its canonical style. Messy indentation and
inconsistent quotes became uniform. You don't configure much — that's the point; black's whole pitch is
"no options to bikeshed over."

### ruff — the linter

**What it actually is.** A **linter** reads your code without running it and flags likely problems:
unused imports, undefined names, suspicious patterns. **ruff** is a very fast one that has become the
common choice.

```console
$ ruff check app.py
app.py:1:8: F401 [*] `os` imported but unused
app.py:14:5: F821 undefined name `reqeusts`
Found 2 errors.
```
*What just happened:* ruff caught two things *before you ran the code*: an `import os` you never used, and
a typo'd `reqeusts` (should be `requests`) that would've crashed at runtime. A linter turns a class of
bugs into instant feedback instead of a confusing traceback later.

📝 **Formatter vs. linter** — a formatter changes how code *looks* (style); a linter warns about what
code *does* (likely bugs and smells). They're complementary, not competing.

### pytest — the test runner

**What it actually is.** **pytest** runs your tests. You write plain functions named `test_*` that
`assert` what should be true; pytest finds them, runs them, and reports pass/fail. (The *why* of testing
is its own topic — see [Why Test At All](/guides/why-test-at-all).)

```python
# test_math.py
def add(a, b):
    return a + b

def test_add():
    assert add(2, 3) == 5
    assert add(-1, 1) == 0
```
```console
$ pytest
========================= test session starts =========================
collected 1 item

test_math.py .                                                  [100%]

========================== 1 passed in 0.01s ==========================
```
*What just happened:* pytest discovered `test_add` (it looks for `test_*` functions automatically), ran
it, and the `assert`s held — so it printed a green dot and `1 passed`. Break the math and that dot becomes
an `F` with a clear diff of expected-vs-actual. No boilerplate test class required; plain functions and
`assert` are enough.

## Recap

1. **pip** installs packages from PyPI; prefer `python -m pip` so you hit the right Python.
2. A **virtual environment** (`python -m venv .venv` + activate) gives each project its own isolated box
   of packages — make one per project, every time, and never commit `.venv`.
3. **requirements.txt** (`pip freeze`) and **pyproject.toml** record your dependencies so anyone can
   recreate the environment.
4. **black** formats, **ruff** lints, **pytest** runs tests — the everyday trio that keeps a project
   clean, correct, and pleasant to work in.

You now have a project that installs, isolates, and tests cleanly. Next, the part that makes code feel
*Pythonic* — the idioms locals use, and the gotchas that bite everyone exactly once.

---

[← Phase 7: Errors & I/O](07-errors-and-io.md) · [Guide overview](_guide.md) · [Phase 9: Idioms & Common Gotchas →](09-idioms-and-gotchas.md)
