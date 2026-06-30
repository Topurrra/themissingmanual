---
title: "pre-commit Hooks"
guide: pre-commit-hooks
phase: 0
summary: "Catch problems before they're committed: the pre-commit framework runs formatters, linters, and secret scanners automatically on every git commit."
tags: [git, hooks, linting, formatting, code-quality, ci]
category: tooling
group: "Code Quality"
order: 45
difficulty: beginner
synonyms: ["pre-commit framework", "git pre-commit hook", "pre-commit-config.yaml", "run linter on commit", "block bad commits", "auto format on commit", "secret scanner git hook"]
updated: 2026-06-30
---

# pre-commit Hooks

You know the feeling: you push, the CI goes red, and the failure is something tiny - a stray trailing space, an unformatted file, a debug `print` you forgot, an AWS key you pasted into a config to test. Five minutes of waiting to learn you broke a rule a machine could have caught in half a second. pre-commit hooks move that check to the moment you commit, on your machine, before the mistake ever leaves your laptop.

This guide is about stopping the bad commit at the door - automatically, the same way for everyone on the team, with one small config file checked into the repo.

## How to read this

Go in order. Phase 1 builds the mental model: what a git hook actually is, and why a *framework* sits on top of it. Phase 2 is the everyday loop: writing `.pre-commit-config.yaml`, installing, and what happens on each commit. Phase 3 is the reality: bypassing, CI enforcement, and the gotchas that bite teams. If you only have ten minutes, read Phase 1 - the rest will make sense once the model clicks.

## The phases

1. [Phase 1: What a Hook Actually Is](01-what-a-hook-is.md) - the mental model: git hooks, and the framework that tames them.
2. [Phase 2: The Config and the Commit Loop](02-the-config-and-loop.md) - `.pre-commit-config.yaml`, installing, and running on staged files.
3. [Phase 3: Bypassing, CI, and the Gotchas](03-bypassing-ci-and-gotchas.md) - fixing vs failing, enforcement, and what breaks in real teams.

[Phase 1: What a Hook Actually Is](01-what-a-hook-is.md) →
