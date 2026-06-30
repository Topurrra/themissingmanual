---
title: "The everyday workflow"
guide: ruff-and-black
phase: 2
summary: "Python code quality at speed: Black formats with no options to argue about, and Ruff lints and now formats astonishingly fast, replacing a stack of older tools."
tags: [python, formatting, linting, ruff, black, code-quality, pre-commit]
difficulty: beginner
synonyms: ["ruff vs black", "python formatter", "python linter", "black formatter", "ruff linter", "replace flake8", "isort pyupgrade", "format python on save", "pre-commit python", "fix python style"]
updated: 2026-06-30
---

# The everyday workflow

Now the keyboard. You have a Python project and you want clean, consistent code without thinking about it. There are really only a few commands you'll ever run by hand, and after that the editor does it for you on every save. Let's walk the loop you'll actually live in.

## Installing them

Both tools install with `pip`. Put them in your dev dependencies, not your runtime ones, since your shipped code doesn't need them.

```bash
pip install black ruff
```

*What just happened:* you now have two command-line programs, `black` and `ruff`, on your path. Nothing changed in your code yet; these tools never run unless you ask them to.

## Formatting with Black

Point Black at a file or a directory and it rewrites them in place.

```console
$ black .
reformatted app/views.py
reformatted app/models.py
All done! ✨ 🍰 ✨
2 files reformatted, 14 files left unchanged.
```

*What just happened:* Black walked the current directory, reformatted the two files that didn't match its style, and left the rest alone. Run it again right now and it'll report zero changes, because Black is idempotent: formatting already-formatted code does nothing.

When you only want to *know* whether code is formatted, without touching it, use `--check`. This is what you run in automation.

```console
$ black --check .
would reformat app/views.py
Oh no! 💥 💔 💥
1 file would reformat.
```

*What just happened:* `--check` made no edits. It exited with a non-zero status and told you one file is out of shape. A passing exit code means "everything is already formatted," which is the gate your CI will use.

## Linting with Ruff, and the autofix that saves your day

`ruff check` reports problems. Add `--fix` and it repairs the ones it safely can.

```console
$ ruff check .
app/models.py:3:1: F401 [*] `os` imported but unused
app/utils.py:1:1: I001 [*] Import block is un-sorted or un-formatted
Found 2 errors.
[*] 2 fixable with the `--fix` option.

$ ruff check --fix .
Found 2 errors (2 fixed, 0 remaining).
```

*What just happened:* the first run found an unused import and an out-of-order import block (`I001` is the import-sorting rule Ruff inherited from isort). The second run, with `--fix`, deleted the dead import and sorted the imports for you. Only rules marked `[*]` get fixed; the rest are left for you to decide.

> Not every lint warning is safe to auto-fix. Ruff fixes the ones with an obvious, behavior-preserving correction (sorting imports, deleting an unused import) and leaves judgment calls (an unused variable that might be a real oversight) for you to read.

## The two of them in one go

A by-hand cleanup is two commands. Run the formatter first, then the linter, because Ruff's autofix can change line layout and you want Black to have the final word on layout.

```bash
black .
ruff check --fix .
```

*What just happened:* Black settled the layout, then Ruff fixed lint problems and re-sorted imports. Your working tree is now clean by both tools' standards. If you'd rather use Ruff for formatting too, the equivalent is `ruff format .` followed by `ruff check --fix .`.

## Let the editor do it on save

Typing those commands gets old fast. The real workflow is to format and fix automatically every time you save a file, so you never think about it again. In VS Code, that's a few lines of settings using the Ruff and Black extensions.

```json
{
  "editor.formatOnSave": true,
  "[python]": {
    "editor.defaultFormatter": "ms-python.black-formatter",
    "editor.codeActionsOnSave": {
      "source.fixAll.ruff": "explicit",
      "source.organizeImports.ruff": "explicit"
    }
  }
}
```

*What just happened:* `formatOnSave` runs Black on every save, and the two `codeActionsOnSave` entries run Ruff's autofix and import-sorting at the same moment. You write messy code, hit save, and it lands clean. This is where these tools stop being commands and become invisible.

## For builders

The reason the format-then-lint order matters is that both tools touch the same lines. If Ruff removes an unused import, the surrounding blank lines may shift; Black then settles those. Running them in a fixed order, and running each until it's stable, is what keeps your diffs small and predictable instead of one tool undoing the other's work.

```quiz
[
  {
    "q": "What does `black --check .` do?",
    "choices": [
      "Reformats every file in place",
      "Reports whether files would change and exits non-zero if any would, without editing",
      "Sorts imports only",
      "Installs Black if it is missing"
    ],
    "answer": 1,
    "explain": "`--check` makes no edits; it just reports and sets the exit code, which is what CI relies on."
  },
  {
    "q": "Why does Ruff only auto-fix some of the problems it finds?",
    "choices": [
      "It is a paid feature for the rest",
      "It only fixes problems whose correction is safe and behavior-preserving",
      "It can only fix one file at a time",
      "The unfixed ones are not real errors"
    ],
    "answer": 1,
    "explain": "Ruff fixes rules marked `[*]` that have an obvious safe correction, and leaves judgment calls to you."
  },
  {
    "q": "When running both by hand, which order is recommended and why?",
    "choices": [
      "Ruff then Black, because Ruff is faster",
      "Black then Ruff, so the formatter and then the linter's fixes settle the layout cleanly",
      "Order does not matter at all",
      "Only ever run one of them"
    ],
    "answer": 1,
    "explain": "Format first, then lint-fix, because both touch the same lines and a fixed order keeps diffs small and stable."
  }
]
```

[← Phase 1](01-formatter-vs-linter.md) | [Overview](_guide.md) | [Phase 3: Pre-commit, CI, and the gotchas](03-pre-commit-ci-and-gotchas.md) →
