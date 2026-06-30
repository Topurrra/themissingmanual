---
title: "Python Packaging: pip, venv, Poetry, uv"
guide: python-packaging-pip-poetry-uv
phase: 0
summary: "Taming Python environments: virtual environments, pip and requirements, the modern pyproject.toml with Poetry, and uv's blazing resolver - without dependency hell."
tags: [python, packaging, pip, venv, poetry, uv, dependencies, virtualenv]
category: tooling
group: "Build & Package Managers"
order: 10
difficulty: intermediate
synonyms:
  - how do python virtual environments work
  - pip vs poetry vs uv
  - requirements.txt vs pyproject.toml
  - fix works on my machine python
  - what is uv python
  - python dependency management
  - pin python dependencies lockfile
updated: 2026-06-30
---

# Python Packaging: pip, venv, Poetry, uv

You ran `pip install` once, it worked, and then six months later a different project needed a different version of the same library and everything caught fire. Or a teammate cloned your repo, ran your code, and got an error you've never seen. That's not bad luck - it's the predictable result of treating one shared Python install as if it belonged to every project at once. This guide gives you the model and the tools to make "works on my machine" mean "works on every machine."

## How to read this

Read it in order the first time. Phase 1 is the mental model - *why* isolated environments exist, and why the global install is the trap. Don't skip it even if you've used `pip` for years; the model is the part that makes everything else stop being magic. Phase 2 is the daily driver: pip, requirements files, and the move to `pyproject.toml` with Poetry. Phase 3 is uv, lockfiles done right, pinning strategy, and the gotchas that bite in production.

If you're brand new to Python itself, start with [/guides/python-from-zero](/guides/python-from-zero) and come back here when you're ready to share code with other people or machines.

## The phases

1. [Why Environments Exist (and the Global-Install Trap)](01-why-environments-exist.md) - the mental model: isolation, the `site-packages` problem, what a virtual environment really is.
2. [The Daily Driver: pip, requirements, and Poetry](02-pip-requirements-poetry.md) - installing, freezing, and the jump to `pyproject.toml` with dependency groups and a lockfile.
3. [uv, Lockfiles, and Surviving Production](03-uv-lockfiles-production.md) - uv's fast resolver, pinning vs ranges, reproducible installs, and the gotchas.

[Phase 1: Why Environments Exist (and the Global-Install Trap)](01-why-environments-exist.md) →
