---
title: "Python Packaging: pip, venv, Poetry, uv"
guide: python-packaging-pip-poetry-uv
phase: 2
summary: "Taming Python environments: virtual environments, pip and requirements, the modern pyproject.toml with Poetry, and uv's blazing resolver — without dependency hell."
tags: [python, packaging, pip, venv, poetry, uv, dependencies, virtualenv]
difficulty: intermediate
synonyms:
  - pip install requirements.txt
  - pip freeze explained
  - what is pyproject.toml
  - poetry add dependency
  - poetry lock file
  - requirements.txt vs pyproject.toml
updated: 2026-06-30
---

# The Daily Driver: pip, requirements, and Poetry

You've got the model: each project gets its own shelf, and you keep the *recipe* in git. This phase is about writing that recipe well. We'll start where almost everyone starts — `pip` and a `requirements.txt` — see exactly where that recipe falls short, and then move to `pyproject.toml` with Poetry, which fixes the gaps without changing the model underneath.

## pip and requirements.txt: the honest baseline

Inside an activated environment, `pip install` puts a package on the shelf. To make that repeatable, you write down what you installed. The classic way is a plain text file:

```text
# requirements.txt
requests
flask
```

```console
(.venv) $ pip install -r requirements.txt
```

*What just happened:* pip read the file line by line and installed each named package — and, quietly, the latest compatible version of each, *plus* every library those packages themselves depend on. That last part matters: `flask` pulls in a half-dozen other packages you never named.

Now the gap. Your file says `flask` with no version. Install it today and you get one version; install it next year and you get a newer one that might behave differently. The recipe isn't reproducible — it's a wish. The common patch is `pip freeze`:

```console
(.venv) $ pip freeze > requirements.txt
```

```text
# requirements.txt after freeze
certifi==2024.2.2
charset-normalizer==3.3.2
click==8.1.7
flask==3.0.2
requests==2.31.0
...
```

*What just happened:* `pip freeze` dumped *every* package on the shelf with its exact version — including all the indirect dependencies you never asked for. Now the install is reproducible. But you've created a new problem: this flat list can't tell you which packages you actually chose (`flask`, `requests`) and which are just along for the ride. When you want to remove `flask`, you can't know which of those other lines are safe to delete. There's no record of *intent*, only of *result*.

That's the core limitation of `requirements.txt`: it's a single flat list that conflates "what I want" with "what that dragged in," and on its own it doesn't separate your runtime needs from your test-only tools either.

> `requirements.txt` is not dead — it's a fine, dependency-light format for simple scripts, container builds, and deployment targets that expect it. The trouble starts when a project grows and you need to reason about *why* each package is there.

## pyproject.toml: declaring intent

The modern Python recipe is a file called `pyproject.toml`. It's a standardized config file (defined across several PEPs) that declares what your project *is* and what it *directly* depends on — your intent, separate from the resolved result.

```toml
# pyproject.toml
[project]
name = "billing-service"
version = "0.1.0"
requires-python = ">=3.10"
dependencies = [
    "requests>=2.31",
    "flask>=3.0",
]
```

*What just happened:* you declared the two libraries you actually chose, with version *floors* (`>=`), and which Python versions the project supports. Nothing about `certifi` or `click` — those are consequences, recorded elsewhere, not intent. This is the recipe a human reads to understand the project.

But `pyproject.toml` declares intent; it doesn't, by itself, *pin* the exact resolved versions for reproducibility, and standard tooling won't manage the environment for you. That's the job a project manager fills. Poetry is the long-established one.

## Poetry: intent plus a lockfile, in one tool

Poetry reads and writes `pyproject.toml`, creates and manages the virtual environment for you, resolves the full dependency tree, and — the key part — records the exact resolution in a `poetry.lock` file.

```console
$ poetry new billing-service        # scaffold a project, or `poetry init` in an existing one
$ cd billing-service
$ poetry add requests flask         # adds to pyproject.toml AND installs AND updates the lock
$ poetry add --group dev pytest     # a dev-only dependency, kept out of production installs
```

*What just happened:* `poetry add` did three things at once — wrote the dependency into `pyproject.toml`, installed it into a managed virtual environment, and updated `poetry.lock` with the precise versions of everything in the resolved tree. The `--group dev` flag put `pytest` in a separate bucket, so your production install can skip test tooling entirely. That dependency-group split is exactly the "which packages are along for the ride / which are test-only" problem that flat `requirements.txt` couldn't express.

The lockfile is the payoff. `pyproject.toml` says "Flask 3.x or newer"; `poetry.lock` says "this exact build of Flask 3.0.2, and these exact 14 other packages, with these hashes." Two files, two jobs:

```text
pyproject.toml   →  human intent, version RANGES, hand-edited, committed
poetry.lock      →  machine resolution, exact PINS + hashes, tool-generated, committed
```

*What just happened:* the split solves the `requirements.txt` confusion cleanly. You read and edit the ranges; the tool owns the pins. Commit both. To reproduce the exact environment anywhere, one command reads the lock:

```console
$ poetry install        # builds the environment from poetry.lock — identical every time
$ poetry run pytest     # run a command inside the managed environment, no manual activate
```

*What just happened:* `poetry install` rebuilt the shelf to match the lockfile exactly — same versions on your machine, your teammate's, and CI. `poetry run` executed a command inside that environment without you having to activate it. This is the literal cure for "works on my machine": everyone resolves to the same locked versions instead of each grabbing whatever is newest that day.

## In the wild

A healthy repo commits `pyproject.toml` and the lockfile, and git-ignores `.venv`. A new contributor clones, runs one install command, and gets a byte-for-byte reproduction of everyone else's dependencies. The flow is: edit ranges in `pyproject.toml` (or via `poetry add`), let the tool re-resolve and re-lock, commit both files. Nobody hand-edits the lockfile, and nobody commits the environment.

```quiz
[
  {
    "q": "What's the main weakness of a flat requirements.txt produced by `pip freeze`?",
    "choices": [
      "It can't pin exact versions",
      "It mixes packages you chose with their indirect dependencies, losing the record of intent",
      "It only works on Linux",
      "It installs packages globally"
    ],
    "answer": 1,
    "explain": "Freeze records the result, not the intent — you can't tell which lines you wanted vs. which were dragged in."
  },
  {
    "q": "What's the division of labor between pyproject.toml and poetry.lock?",
    "choices": [
      "pyproject.toml is for production, poetry.lock is for development",
      "pyproject.toml holds human intent and version ranges; poetry.lock holds the exact resolved pins",
      "They're duplicates kept in sync for backup",
      "poetry.lock replaces pyproject.toml once you ship"
    ],
    "answer": 1,
    "explain": "You edit ranges in pyproject.toml; the tool generates exact pins + hashes in the lockfile. Commit both."
  },
  {
    "q": "What does `poetry add --group dev pytest` accomplish?",
    "choices": [
      "Installs pytest globally for all projects",
      "Adds pytest as a dev-only dependency so production installs can skip it",
      "Removes pytest from the lockfile",
      "Pins every dependency to its latest version"
    ],
    "answer": 1,
    "explain": "Dependency groups separate test/dev tooling from runtime deps — something flat requirements.txt can't express."
  }
]
```

[← Phase 1](01-why-environments-exist.md) | [Overview](_guide.md) | [Phase 3: uv, Lockfiles, and Surviving Production →](03-uv-lockfiles-production.md)
