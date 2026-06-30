---
title: "ESLint and Prettier"
guide: eslint-and-prettier
phase: 0
summary: "Stop arguing about code style: Prettier formats automatically, ESLint catches real bugs and bad patterns, and together they end the bikeshedding."
tags: [eslint, prettier, linting, formatting, javascript, code-quality, tooling]
category: tooling
group: "Code Quality"
order: 42
difficulty: beginner
synonyms: ["eslint vs prettier", "eslint prettier setup", "javascript linter formatter", "prettier config", "eslint flat config", "how to set up eslint", "lint on save", "pre-commit lint format"]
updated: 2026-06-30
---

# ESLint and Prettier

You've felt the pull-request comment that says "missing semicolon" and the other one that says "this `==` should be `===`." One of those is a waste of everyone's time and one of those is a real bug. This guide draws the line between the two: Prettier formats your code so nobody argues about whitespace again, and ESLint hunts the patterns that actually break things. Set them up once and your team stops bikeshedding for good.

## How to read this

Read it in order the first time. Phase 1 builds the mental model of two tools with two different jobs, because almost every painful ESLint+Prettier setup comes from confusing those jobs. Phase 2 is the day-to-day: configs, autofix, the commands you'll actually run. Phase 3 is enforcement and the gotchas that bite real teams. If you already have a working setup and only want it to stop fighting itself, skim Phase 1 then go straight to Phase 3.

## The phases

1. [Two tools, two jobs](01-two-tools-two-jobs.md) — the mental model: formatting versus linting, and why they're separate.
2. [Config and autofix](02-config-and-autofix.md) — how you really use them: config files, fixing on save, the everyday commands.
3. [Enforcement and gotchas](03-enforcement-and-gotchas.md) — editor, pre-commit, CI, and the conflicts that waste an afternoon.

[Phase 1: Two tools, two jobs](01-two-tools-two-jobs.md) →
