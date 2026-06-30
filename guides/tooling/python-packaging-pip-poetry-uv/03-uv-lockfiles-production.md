---
title: "uv, Lockfiles, and Surviving Production"
guide: python-packaging-pip-poetry-uv
phase: 3
summary: "Taming Python environments: virtual environments, pip and requirements, the modern pyproject.toml with Poetry, and uv's blazing resolver - without dependency hell."
tags: [python, packaging, pip, venv, poetry, uv, dependencies, virtualenv]
difficulty: intermediate
synonyms:
  - what is uv python
  - uv vs pip vs poetry
  - uv pip install drop in
  - python pinning vs ranges
  - reproducible python install ci
  - uv lock sync
updated: 2026-06-30
---

# uv, Lockfiles, and Surviving Production

By now the model is solid and Poetry gives you intent plus a lockfile. So why is everyone talking about uv? Two reasons: speed, and the fact that it's a single tool that covers the whole job - environments, installing, locking, and even installing Python itself. This phase shows where uv fits, how to think about pinning vs ranges when it counts, and the gotchas that turn a green CI run into a 2am page.

## uv: the fast resolver that speaks pip and pyproject

uv is a packaging tool written in Rust. The headline is speed - resolving and installing dependencies is dramatically faster than the older Python-based tools, fast enough that you stop waiting and start trusting it for everything. But the reason it caught on so quickly is that it meets you where you already are. It has a `pip`-compatible interface, so you can adopt it without rewriting your habits:

```console
$ uv venv                              # create a virtual environment (like python -m venv)
$ uv pip install -r requirements.txt   # drop-in replacement for `pip install`
$ uv pip compile requirements.in -o requirements.txt   # resolve loose deps into pinned ones
```

*What just happened:* `uv venv` made a virtual environment, and `uv pip install` behaved exactly like pip - same arguments, same `requirements.txt` - only faster. The `uv pip compile` command took a loose input file of what you *want* and produced a fully pinned `requirements.txt` of what you'll *get*, the same intent-vs-result split you saw with lockfiles, in the requirements-file world.

That `pip`-compatible mode is the gentle on-ramp. The fuller mode is the project workflow, which mirrors Poetry's: it owns `pyproject.toml`, generates a `uv.lock`, and manages everything for you.

```console
$ uv init billing-service        # scaffold with a pyproject.toml
$ cd billing-service
$ uv add requests flask          # add deps, install, and update uv.lock in one step
$ uv add --dev pytest            # dev-only dependency group
$ uv sync                        # build the environment to exactly match uv.lock
$ uv run pytest                  # run a command inside the managed environment
```

*What just happened:* every command maps to a Poetry equivalent you already know - `uv add` is `poetry add`, `uv sync` is `poetry install`, `uv run` is `poetry run`. The model didn't change at all: per-project shelf, intent in `pyproject.toml`, exact pins in a lockfile, environment rebuilt from the lock. uv is a faster, more all-in-one implementation of the same ideas. As a bonus, uv can also download and manage Python interpreter versions for you, so the project's `requires-python` becomes something the tool can actually satisfy rather than something you set up by hand.

> Which tool should you reach for? If a repo already uses Poetry and it's working, there's no prize for switching. For a new project, or one drowning in slow installs, uv is the strong default in 2026 - same model, much less waiting. Both are fine; the model is what matters, and it's identical across them.

## Pinning vs ranges: where each belongs

This is the decision that quietly determines whether you sleep through the night. The rule is shaped by *who reads the file*.

- **Version ranges (`>=2.31`, `~=3.0`) belong in `pyproject.toml`.** This file states your true constraints: the minimum versions your code needs, the Python versions you support. Ranges here let the resolver find a compatible set and let you accept upgrades deliberately.
- **Exact pins (`==2.31.0`, plus hashes) belong in the lockfile.** This is what actually gets installed. Exact pins are what make an install *reproducible* - the same bytes today and in six months.

```text
pyproject.toml:  requests>=2.31      ← constraint: "at least this, newer is OK if I re-resolve"
uv.lock:         requests==2.31.0    ← reality: "this exact version, every install, everywhere"
```

*What just happened:* the two files answer two different questions. The range says what's *allowed*; the pin says what's *frozen*. The mistake to avoid is pinning exact versions directly in `pyproject.toml` - that makes future upgrades a manual chore for every package and defeats the resolver. Let ranges live in intent, pins live in the lock.

When you *do* want newer versions, you re-resolve on purpose:

```console
$ uv lock --upgrade            # re-resolve within your ranges, write new pins to the lock
$ uv lock --upgrade-package requests   # upgrade only one package, leave the rest pinned
```

*What just happened:* upgrading is now a deliberate, reviewable event that changes the lockfile in a commit - not something that happens by accident because someone installed on a Tuesday. You see the version bumps in the diff, run your tests, and decide.

## The gotchas that actually bite

**Committing the wrong things.** Commit `pyproject.toml` and the lockfile (`uv.lock` or `poetry.lock`). Never commit the environment folder (`.venv`). Add it to `.gitignore` on day one. Committing `.venv` bloats the repo and, because it contains platform-specific compiled files, breaks on other machines.

**The lockfile drifting from the manifest.** If someone hand-edits `pyproject.toml` and forgets to re-lock, your lock and your intent disagree. In CI, install in a mode that *fails* on drift rather than silently re-resolving:

```console
$ uv sync --frozen        # error out if uv.lock is missing or out of date - do not re-resolve
$ uv sync --locked        # assert the lock is up to date with pyproject.toml, then install
```

*What just happened:* in CI you want the build to *break loudly* if the lockfile doesn't match the manifest, because a silent re-resolution means production could get versions nobody reviewed. The frozen/locked modes turn drift into a failed check instead of a surprise in production.

**Forgetting that the lock is platform-aware.** A good lockfile resolves dependencies across the platforms you target (Linux, macOS, Windows, different Python versions), so the same lock works in CI and on every developer's machine. If you generated a lock that's somehow tied to one platform, an install on another can fail or pull different versions - which is exactly the "works on my machine" failure you adopted lockfiles to kill.

**Assuming "installed" means "imported correctly."** A package can install fine yet fail at runtime because of a conflict the resolver didn't catch, or because two of your dependencies need incompatible versions of a third. A modern resolver (uv, Poetry) tries to find one consistent set and *errors* if it can't - that error is a gift. Don't suppress it by mixing pip and the project tool in the same environment; pick one tool per project so a single resolver owns the whole shelf.

## In the wild

The production-grade setup is boring on purpose: `pyproject.toml` with ranges, a committed cross-platform lockfile, `.venv` git-ignored, and CI that runs `uv sync --frozen` (or the Poetry equivalent) so any drift fails the build before it reaches users. Upgrades happen through an explicit `uv lock --upgrade` commit that someone reviews. Get those four things right and "works on my machine" stops being a phrase anyone says.

```quiz
[
  {
    "q": "Where should exact version pins (e.g. requests==2.31.0) live?",
    "choices": [
      "In pyproject.toml, replacing the ranges",
      "In the lockfile (uv.lock / poetry.lock), generated by the tool",
      "In a separate pins.txt you hand-maintain",
      "Nowhere - pinning is an anti-pattern"
    ],
    "answer": 1,
    "explain": "Ranges express intent in pyproject.toml; exact pins for reproducibility belong in the tool-generated lockfile."
  },
  {
    "q": "Why run `uv sync --frozen` (or `--locked`) in CI?",
    "choices": [
      "It installs packages faster by skipping resolution",
      "It fails the build if the lockfile is missing or out of date instead of silently re-resolving",
      "It upgrades all dependencies to the newest versions",
      "It deletes the lockfile after installing"
    ],
    "answer": 1,
    "explain": "You want drift between manifest and lock to break loudly in CI, not slip unreviewed versions into production."
  },
  {
    "q": "What's the relationship between uv's project commands and Poetry's?",
    "choices": [
      "They use completely different models and can't be compared",
      "uv add/sync/run map to poetry add/install/run - same model, faster implementation",
      "uv only works with requirements.txt, never pyproject.toml",
      "Poetry is for libraries, uv is only for scripts"
    ],
    "answer": 1,
    "explain": "Same underlying model - per-project env, intent in pyproject, pins in a lockfile. uv is a faster, more all-in-one take."
  }
]
```

[← Phase 2](02-pip-requirements-poetry.md) | [Overview](_guide.md)
