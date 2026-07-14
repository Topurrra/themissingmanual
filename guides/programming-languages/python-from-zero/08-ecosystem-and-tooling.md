---
title: "The Ecosystem & Tooling"
guide: "python-from-zero"
phase: 8
summary: "pip installs packages, virtual environments keep projects from poisoning each other, requirements.txt/pyproject.toml record what you depend on, and black/ruff/pytest keep your code clean and tested - the everyday toolbox, explained."
tags: [python, pip, venv, virtual-environment, pytest, black, ruff, pyproject, requirements]
difficulty: intermediate
synonyms: ["what is pip", "how to use python virtual environment", "what is venv", "what is requirements.txt", "what is pyproject.toml", "how to run pytest", "what is black and ruff python"]
updated: 2026-06-19
---

# The Ecosystem & Tooling

You can write Python forever with nothing but the standard library, but the moment you want to talk to a
web API, parse a spreadsheet, or run a test suite, you'll reach for code other people wrote - and that's
where tooling matters as much as the language itself.

This phase is the everyday toolbox: installing packages, keeping them from turning your machine into a
junk drawer, and the three tools (formatter, linter, test runner) that separate "a script that works on
my laptop" from "a project a team can live in."

## pip - the package installer

**What it actually is.** **pip** is Python's package installer: it downloads libraries from **PyPI** (the
Python Package Index, a giant public repository) and makes them importable in your code.

📝 **Package** - a reusable library someone published (e.g. `requests` for HTTP, `rich` for pretty
terminal output). **PyPI** - the official place pip downloads them from.

```console
$ python -m pip install requests
Collecting requests
  Downloading requests-2.32.3-py3-none-any.whl (64 kB)
Installing collected packages: requests
Successfully installed requests-2.32.3
```
*What just happened:* pip fetched `requests` (and its dependencies) from PyPI and installed it where
Python can find it - now `import requests` works. `python -m pip`, not bare `pip`, guarantees you're
using the pip belonging to *this* Python, not another one lurking on your `PATH`.

## Virtual environments - one isolated box per project

**The problem it solves.** Say project A needs `requests` 2.20 and project B needs 2.32. Install packages
globally and the two fight over one shared pile of libraries - upgrading one silently breaks the other.
This is "dependency hell," exactly as fun as it sounds.

**What it actually is.** A **virtual environment** (venv) is a private, throwaway folder holding its own
copy of Python and its own packages, isolated from every other project and the system Python. Each
project gets its own box; what you install in one can't touch another.

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
*What just happened:* `python -m venv .venv` created a folder containing a fresh, empty Python.
`activate` switched your shell to use it - the `(.venv)` prompt prefix is your sign you're inside the
box. Now `pip install` drops packages *into `.venv` only*; delete the folder and the environment is
gone, harming nothing else. To leave, run `deactivate`.

> 💡 **Key point.** Make a virtual environment for *every* project, the moment you start it - the single
> habit that prevents the most common, most baffling "it worked yesterday" failures. The `.venv` folder
> is disposable - never commit it to Git.

⚠️ **Gotcha - installing into the wrong place.** Forget to activate before `pip install`, and the package
lands in your global Python (or fails with a permissions error) - your project won't see it. Check the
`(.venv)` prefix: no prefix, no isolation.

## Recording dependencies - requirements.txt and pyproject.toml

**The problem it solves.** Your `.venv` lives only on your machine, but a teammate (or server, or
future-you on a new laptop) needs to recreate the *same* set of packages - so you record them in a file.

**`requirements.txt`** - the simple, classic format: one package per line, usually with a pinned version.

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
that list to `requirements.txt`. Anyone can recreate your environment with
`pip install -r requirements.txt` and get identical versions - no guessing, no drift.

**`pyproject.toml`** - the modern, richer format: a single config file, defined by a Python standard,
that describes your project *and* its dependencies (and configures your tools, below). A minimal one:

```toml
[project]
name = "my-app"
version = "0.1.0"
dependencies = [
    "requests>=2.32",
]
```
*What just happened:* This declares the project's name, version, and its dependency on `requests` 2.32+.
Modern tooling reads this one file instead of scattering config across many. `requirements.txt` is fine
for a first project; `pyproject.toml` is where things head as it grows.

📝 **Pinning** - recording an *exact* version (`requests==2.32.3`) so installs are reproducible; `>=2.32`
is a looser *range* that picks up newer compatible releases. Pin for apps you deploy; ranges are common
for libraries.

📝 **You'll increasingly see `uv`.** By 2026 many teams reach for [uv](https://docs.astral.sh/uv/), a
single fast tool that bundles the install/venv/lockfile steps above (it replaces `pip` and `venv` with
`uv add`, `uv run`, and a `uv.lock`). Learn `pip` and `venv` first - they're the universal baseline every
Python install has - then `uv` is an easy step up once these click.

## The quality tools - black, ruff, pytest at a glance

These three show up on almost every serious Python project. Install them into your venv
(`pip install black ruff pytest`).

### black - the formatter

**What it actually is.** **black** is an *opinionated* code formatter: it rewrites your file into one
consistent style - spacing, line breaks, quotes - so nobody on the team argues about formatting again. It
makes the decisions; you stop thinking about them.

```console
$ black app.py
reformatted app.py

All done! ✨ 🍰 ✨
1 file reformatted.
```
*What just happened:* black rewrote `app.py` in place to match its canonical style - messy indentation
and inconsistent quotes became uniform. You don't configure much; that's the point, its whole pitch is
"no options to bikeshed over."

### ruff - the linter

**What it actually is.** A **linter** reads your code without running it and flags likely problems:
unused imports, undefined names, suspicious patterns. **ruff** is a very fast one, now the common choice.

```console
$ ruff check app.py
app.py:1:8: F401 [*] `os` imported but unused
app.py:14:5: F821 Undefined name `reqeusts`
Found 2 errors.
```
*What just happened:* ruff caught two things *before running the code*: an unused `import os`, and a
typo'd `reqeusts` (should be `requests`) that would've crashed at runtime - instant feedback instead of a
confusing traceback later.

📝 **Formatter vs. linter** - a formatter changes how code *looks* (style); a linter warns about what
code *does* (likely bugs and smells). Complementary, not competing.

### pytest - the test runner

**What it actually is.** **pytest** runs your tests: write plain functions named `test_*` that `assert`
what should be true, and pytest finds, runs, and reports pass/fail on them. (The *why* of testing is its
own topic - see [Why Test At All](/guides/why-test-at-all).)

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
it, and the `assert`s held, printing a green dot and `1 passed`. Break the math and that dot becomes an
`F` with a clear diff of expected-vs-actual. No boilerplate test class required; plain functions and
`assert` are enough.

## Recap

1. **pip** installs packages from PyPI; prefer `python -m pip` so you hit the right Python.
2. A **virtual environment** (`python -m venv .venv` + activate) gives each project its own isolated box
   of packages - make one per project, every time, and never commit `.venv`.
3. **requirements.txt** (`pip freeze`) and **pyproject.toml** record your dependencies so anyone can
   recreate the environment.
4. **black** formats, **ruff** lints, **pytest** runs tests - the everyday trio that keeps a project
   clean, correct, and pleasant to work in.

Next: the part that makes code feel *Pythonic* - the idioms locals use, and the gotchas that bite
everyone exactly once.

---

[← Phase 7: Errors & I/O](07-errors-and-io.md) · [Guide overview](_guide.md) · [Phase 9: Idioms & Common Gotchas →](09-idioms-and-gotchas.md)
