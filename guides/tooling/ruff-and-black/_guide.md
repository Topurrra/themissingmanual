---
title: "Ruff and Black"
guide: ruff-and-black
phase: 0
summary: "Python code quality at speed: Black formats with no options to argue about, and Ruff lints and now formats astonishingly fast, replacing a stack of older tools."
tags: [python, formatting, linting, ruff, black, code-quality, pre-commit]
category: tooling
group: "Code Quality"
order: 43
difficulty: beginner
synonyms: ["ruff vs black", "python formatter", "python linter", "black formatter", "ruff linter", "replace flake8", "isort pyupgrade", "format python on save", "pre-commit python", "fix python style"]
updated: 2026-06-30
---

# Ruff and Black

You have spent real minutes of your life arguing about where a comma goes, or watching a pull request collect nits about blank lines while the actual logic went unreviewed. Style debates are a tax on attention, and your team keeps paying it. Black ends the debate by formatting your code one fixed way, and Ruff catches the real bugs and bad habits faster than you can blink. Together they turn "is this code clean?" into a question a machine answers in milliseconds.

## How to read this

Read these in order. Phase 1 builds the mental model: why a formatter and a linter are two different jobs, and why handing them to tools beats handing them to humans. Phase 2 is the everyday workflow: the commands you run, what autofix does, and how the editor does it for you. Phase 3 is production reality: pre-commit, CI, configuration that won't fight you, and the gotchas that bite teams.

If you have never set up a Python project before, skim [/guides/python-from-zero](/guides/python-from-zero) first so the project structure here feels familiar.

## The phases

1. [What a formatter and a linter actually do](01-formatter-vs-linter.md)
2. [The everyday workflow](02-the-everyday-workflow.md)
3. [Pre-commit, CI, and the gotchas](03-pre-commit-ci-and-gotchas.md)

[Phase 1: What a formatter and a linter actually do](01-formatter-vs-linter.md) →
