---
title: "Pytest, From Zero"
guide: pytest-from-zero
phase: 0
summary: "Python testing that gets out of your way: plain assert, fixtures for setup and teardown, parametrize for table-driven tests, and a rich plugin ecosystem."
tags: [pytest, python, testing, fixtures, parametrize]
category: tooling
group: "Testing Tools"
order: 35
difficulty: intermediate
synonyms: ["pytest tutorial", "pytest fixtures explained", "pytest vs unittest", "pytest parametrize", "conftest.py what is it", "pytest monkeypatch", "how to test python code", "pytest assert introspection"]
updated: 2026-06-30
---

# Pytest, From Zero

You wrote some Python that works, and now you want a safety net so the next change doesn't quietly break it. You looked at the standard library's `unittest`, saw `self.assertEqual` and class boilerplate everywhere, and quietly closed the tab. Pytest is the tool most Python people actually reach for: you write `assert x == y`, run one command, and get a failure message that tells you exactly what went wrong. This guide takes you from zero to writing tests you'll keep.

## How to read this

Read the phases in order the first time. Phase 1 builds the mental model: what pytest is, how it finds your tests with zero config, and why plain `assert` is the whole pitch. Phase 2 is the day-to-day: fixtures for setup and teardown, `parametrize` for running one test against many inputs, and marks for selecting what runs. Phase 3 is the harder edges: `conftest.py`, faking the outside world with `monkeypatch`, and the traps that waste an afternoon. If you already write pytest tests and want the gotchas, skim 1 and 2 and slow down on 3.

## The phases

1. [The mental model: plain assert and zero-config discovery](01-the-mental-model.md) - what pytest is, how it finds tests, and why `assert` beats `self.assertEqual`.
2. [The everyday core: fixtures, parametrize, and marks](02-fixtures-parametrize-marks.md) - dependency-injected setup, table-driven tests, and selecting what runs.
3. [Production reality: conftest, monkeypatch, and the gotchas](03-conftest-monkeypatch-gotchas.md) - sharing fixtures, faking the outside world, and the traps that bite.

[Phase 1: The mental model: plain assert and zero-config discovery](01-the-mental-model.md) →
