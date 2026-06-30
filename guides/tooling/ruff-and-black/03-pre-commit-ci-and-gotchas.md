---
title: "Pre-commit, CI, and the gotchas"
guide: ruff-and-black
phase: 3
summary: "Python code quality at speed: Black formats with no options to argue about, and Ruff lints and now formats astonishingly fast, replacing a stack of older tools."
tags: [python, formatting, linting, ruff, black, code-quality, pre-commit]
difficulty: beginner
synonyms: ["ruff vs black", "python formatter", "python linter", "black formatter", "ruff linter", "replace flake8", "isort pyupgrade", "format python on save", "pre-commit python", "fix python style"]
updated: 2026-06-30
---

# Pre-commit, CI, and the gotchas

Your editor formats on save, which is great until a teammate's editor doesn't, or someone commits from a terminal, or a contributor opens a pull request from a setup you've never seen. The save-time fix is for *you*. To keep the whole project clean, you need a gate that runs whether anyone remembered to or not. That's pre-commit and CI, plus the configuration and the few surprises that trip teams up.

## Configure once, in pyproject.toml

Both tools read their settings from `pyproject.toml`, the standard config file for modern Python projects. Keep this small. The most common thing you'll set is line length, and a list of lint rules to enable.

```toml
[tool.black]
line-length = 88

[tool.ruff]
line-length = 88

[tool.ruff.lint]
select = ["E", "F", "I"]   # pycodestyle errors, Pyflakes, import sorting
```

*What just happened:* we set the same line length for both tools (matching them matters, since a mismatch makes them fight over where to wrap), and told Ruff which rule families to run: `E` for style errors, `F` for likely bugs, `I` for import sorting. Black's default line length is 88, so this section is optional; the value is shown to make the match explicit.

> A real footgun: if Black wraps at 88 and Ruff's line-length rule is set to 79, every wrapped line becomes a lint error Black created. Keep the two line lengths identical and this whole class of conflict disappears.

## The gate that doesn't rely on memory: pre-commit

The `pre-commit` framework runs checks automatically before each `git commit`. If a check fails or rewrites a file, the commit stops, so unformatted code physically cannot enter history. You configure it with a `.pre-commit-config.yaml` at your repo root.

```yaml
repos:
  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.6.0
    hooks:
      - id: ruff
        args: [--fix]
      - id: ruff-format
  - repo: https://github.com/psf/black
    rev: 24.8.0
    hooks:
      - id: black
```

*What just happened:* this wires three hooks. `ruff` lints and autofixes, `ruff-format` formats, and `black` formats. In practice you pick *one* formatter, so a team using Black would drop the `ruff-format` hook, and a team on Ruff's formatter would drop the `black` repo. Pin `rev` to a specific version so everyone runs the exact same rules.

```console
$ git commit -m "add user endpoint"
ruff.....................................................................Failed
- hook id: ruff
- files were modified by this hook
Fixing app/api.py
black....................................................................Passed
```

*What just happened:* the commit was blocked because Ruff fixed a file. The fixes are now in your working tree, unstaged. You `git add` them and commit again, and this time the hooks pass. The annoyance of committing twice is the feature: bad code never lands.

## The backstop: CI

Pre-commit only protects people who installed it. CI protects everyone, because it runs on the server for every push and pull request. Here it runs in *check* mode: it never edits anything, it only passes or fails. A red check means "this branch has unformatted or lint-failing code, fix it before merge."

```yaml
# .github/workflows/quality.yml
name: quality
on: [push, pull_request]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
      - run: pip install black ruff
      - run: black --check .
      - run: ruff check .
```

*What just happened:* on every push and pull request, GitHub installs the tools and runs `black --check` and `ruff check`. Note there's no `--fix` and no plain `black .` here. CI must never rewrite code, only judge it; a failing job tells the author to run the fixers locally and push again.

## The gotchas that actually bite

A few surprises come up again and again. Knowing them ahead of time saves an afternoon.

- **Version drift.** Black and Ruff occasionally change how they format as they improve. If a teammate runs a newer version, your "already formatted" code suddenly reformats. The fix is to pin exact versions in both `pyproject.toml` and `.pre-commit-config.yaml` so everyone formats identically.
- **The two formatters disagree at the edges.** Ruff's formatter matches Black very closely but not byte-for-byte in every rare case. Don't run both formatters on the same project; pick one. Running Black and `ruff format` together can leave them flip-flopping a line forever.
- **The first adoption commit is huge.** Turning these on in an existing codebase reformats hundreds of files at once, which buries real changes in `git blame`. Do the reformat as one isolated commit, then add its hash to a `.git-blame-ignore-revs` file so blame skips past it.
- **Suppressing a single line.** When a lint rule is wrong for one specific line, silence only that line with a `# noqa` comment naming the code, like `# noqa: F401`. Reach for this rarely; a blanket `# noqa` that names no code hides every problem on the line, which is how real bugs sneak through.

```python
from .legacy import old_helper  # noqa: F401  # re-exported for backward compat
```

*What just happened:* this import looks unused to Ruff, but it's intentionally re-exported, so the targeted `# noqa: F401` tells Ruff to skip exactly that one rule on exactly that one line, and nothing else.

## In the wild

When you join a team with all of this set up, your day looks like: write code, save (editor formats and fixes), commit (pre-commit catches anything you missed), push (CI confirms it's clean for everyone). Three layers, each a backstop for the one before, and not one of them needs you to remember a style rule. That's the whole payoff: the machines hold the line so the humans can argue about things that matter.

```quiz
[
  {
    "q": "Why does CI run `black --check` and `ruff check` instead of the fixing commands?",
    "choices": [
      "Check mode is faster to install",
      "CI should judge code, never rewrite it; a failure tells the author to fix it locally",
      "The fixing commands do not work on servers",
      "Check mode also runs the tests"
    ],
    "answer": 1,
    "explain": "CI only passes or fails. Rewriting code on the server would hide problems instead of surfacing them."
  },
  {
    "q": "What is the safest way to ignore one specific lint rule on one line?",
    "choices": [
      "Delete the line",
      "Add a bare `# noqa` with no code",
      "Add `# noqa: <code>` naming the exact rule, like `# noqa: F401`",
      "Disable the rule globally in pyproject.toml"
    ],
    "answer": 2,
    "explain": "A targeted `# noqa: F401` silences only that rule on that line; a bare `# noqa` hides everything and lets bugs through."
  },
  {
    "q": "Why should you pin exact tool versions across pyproject.toml and pre-commit?",
    "choices": [
      "To make installs slower but safer",
      "So everyone formats identically and a newer version does not silently reformat the codebase",
      "Because the tools refuse to run without a version",
      "To enable the autofix feature"
    ],
    "answer": 1,
    "explain": "Formatting can change between versions; pinning keeps every contributor producing byte-identical output."
  }
]
```

[← Phase 2](02-the-everyday-workflow.md) | [Overview](_guide.md)
