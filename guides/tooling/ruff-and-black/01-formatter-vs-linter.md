---
title: "Ruff and Black"
guide: ruff-and-black
phase: 1
summary: "Python code quality at speed: Black formats with no options to argue about, and Ruff lints and now formats astonishingly fast, replacing a stack of older tools."
tags: [python, formatting, linting, ruff, black, code-quality, pre-commit]
difficulty: beginner
synonyms: ["ruff vs black", "python formatter", "python linter", "black formatter", "ruff linter", "replace flake8", "isort pyupgrade", "format python on save", "pre-commit python", "fix python style"]
updated: 2026-06-30
---

# What a formatter and a linter actually do

You open a teammate's file and the indentation is four spaces here, two there. Strings are single-quoted on one line and double-quoted on the next. There's an import at the top nobody uses anymore. None of this is *wrong* exactly, but reading it costs you energy, and reviewing it drags you into nitpicks instead of logic. That friction is the problem these two tools exist to remove, and they remove it in two genuinely different ways.

## Two jobs that get confused for one

People lump "code quality tools" together, but a formatter and a linter answer different questions.

A **formatter** answers *how should this code look?* It rewrites whitespace, line breaks, and quote style so the layout is consistent. It does not care whether your code is correct. It only cares that it looks the same as everyone else's.

A **linter** answers *is something wrong or risky here?* It reads your code and flags an unused import, a variable you assigned but never used, a comparison that's always false, a bare `except` that swallows every error. It's a careful reviewer who never gets tired.

```text
formatter  ->  "this LOOKS consistent"   (style, layout)
linter     ->  "this might be WRONG"     (bugs, smells, dead code)
```

*What just happened:* we drew the line that the rest of this guide rests on. Black is the formatter. Ruff is the linter (and, more recently, also a formatter). Keeping the two jobs straight is the whole mental model.

## Black: the end of the style argument

Black's defining choice is that it has almost no options. You don't configure how it formats; you accept how it formats. The only knob most teams ever touch is line length.

This sounds limiting until you've lived it. When there are no options, there is nothing to argue about. Every file in every project formatted by Black looks the same, so your eyes stop tripping on layout and your reviews stop drowning in style comments. Black's own slogan captures the trade: any color you like, as long as it's black.

```python
# before Black
d = {'a':1,'b':2,
  'c':3}

# after Black
d = {"a": 1, "b": 2, "c": 3}
```

*What just happened:* Black normalized the quotes to double, added the spaces after the colons, and collapsed the dict onto one line because it fit. You didn't decide any of that. That's the point.

> The value of Black is not that its style is the best possible style. It's that it's *one* style, applied without you thinking about it. Consistency beats taste here.

## Ruff: a linter so fast you forget it's running

Before Ruff, a typical Python project ran a small zoo of tools: `flake8` for style and basic errors, `isort` to sort imports, `pyupgrade` to modernize old syntax, plus a handful of flake8 plugins. Each was a separate dependency, a separate config, a separate pass over your files.

Ruff is written in Rust and reimplements the rules from that whole zoo in a single tool. It runs so fast that on most projects it finishes before you notice it started, often a sub-second pass where the old stack took many seconds. Because it's one tool, it's one install and one config section instead of five.

```console
$ ruff check .
app/models.py:3:1: F401 [*] `os` imported but unused
app/views.py:42:5: F841 [*] Local variable `result` is assigned to but never used
Found 2 errors.
[*] 2 fixable with the `--fix` option.
```

*What just happened:* Ruff scanned the project, found an unused import (`F401`) and an unused variable (`F841`), and told you both are auto-fixable. The `F` codes come straight from Pyflakes, one of the tools Ruff absorbed, so if you knew the old codes, you already know Ruff's.

## How they fit together

The honest question is: if Ruff also formats now, why mention Black at all? Because Ruff's formatter was deliberately built to match Black's style. They produce nearly identical output, so a team can run Black today and switch to Ruff's formatter later (or the reverse) without a giant reformatting diff. You'll meet both names in real codebases for years, and they play the same tune.

A common setup is Black for formatting plus Ruff for linting. An increasingly common setup is Ruff for both, dropping Black entirely. Either is fine. What matters is that *something* formats and *something* lints, automatically, so humans stop doing it by hand.

## In the wild

Most large open-source Python projects you'll clone already have one of these wired in. You'll see a `[tool.black]` or `[tool.ruff]` section in `pyproject.toml`, and a pre-commit hook that runs them before any commit lands. When you contribute, the project's automation formats and lints your change for you, which is why your pull request gets reviewed on its ideas instead of its commas.

```quiz
[
  {
    "q": "What is the core difference between a formatter and a linter?",
    "choices": [
      "A formatter checks for bugs; a linter fixes whitespace",
      "A formatter changes how code looks; a linter flags whether something is wrong",
      "They do the same job with different speeds",
      "A linter only works on imports; a formatter works on everything"
    ],
    "answer": 1,
    "explain": "A formatter governs layout and style; a linter detects likely errors, dead code, and risky patterns."
  },
  {
    "q": "Why does Black have almost no configuration options?",
    "choices": [
      "It is unfinished and options are coming later",
      "So there is nothing to argue about and every project looks the same",
      "Because configuration would slow it down",
      "Because it only supports one Python version"
    ],
    "answer": 1,
    "explain": "Black's value is one consistent style applied without debate, not a style tuned to your taste."
  },
  {
    "q": "What older tools does Ruff replace in a single fast pass?",
    "choices": [
      "pytest and tox",
      "pip and virtualenv",
      "flake8, isort, pyupgrade, and similar linters",
      "Black and mypy only"
    ],
    "answer": 2,
    "explain": "Ruff reimplements the rules of flake8 (and plugins), isort, pyupgrade, and more in one Rust tool."
  }
]
```

[← Overview](_guide.md) | [Phase 2: The everyday workflow](02-the-everyday-workflow.md) →
