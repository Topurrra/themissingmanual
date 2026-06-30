---
title: "Targets, Tasks, and Variables"
guide: make-and-makefiles
phase: 2
summary: "The 50-year-old build tool that still runs everything: targets, prerequisites, and recipes - a dependency graph that rebuilds only what changed."
tags: [make, makefile, build, automation, task-runner, cli]
difficulty: beginner
synonyms: ["makefile tutorial", "how does make work", "phony targets", "make tab error", "makefile variables", "make vs scripts"]
updated: 2026-06-30
---

# Targets, Tasks, and Variables

Here is the twist that surprises people: most Makefiles you meet in the wild are not compiling C. They are running tasks. `make test`, `make build`, `make deploy`, `make lint`. The dependency-graph engine from Phase 1 turns out to be a clean, language-agnostic command runner, and that is how the modern world actually uses it. This phase is the daily driver: writing those task targets, keeping recipes readable with variables, and the small set of moves you will reach for every day.

## Make as a task runner

A target does not have to produce a file. You can write a rule whose whole job is to *do something*:

```makefile
test:
	pytest tests/

lint:
	ruff check .

run:
	python app.py
```

```console
$ make test
pytest tests/
======== 42 passed in 1.2s ========
```

*What just happened:* `make test` ran the recipe. There is no file named `test`, so Make sees no `test` file on disk, concludes the target is "missing," and runs the recipe every time. That accidental behavior is exactly what a task runner wants - but it has a sharp edge, which is why phony targets exist (next section).

The win over typing the raw commands: discoverability and muscle memory. Every project speaks the same dialect. New to a repo? Try `make test`, `make build`, `make run`. One vocabulary across every language and stack. That consistency is half of why Make refuses to die.

## Phony targets: tell Make these are not files

There is a trap hiding in the task-runner pattern. Suppose someone creates a file or folder named `test` in your project. Now `make test` sees that the `test` "target" exists and is newer than its (zero) prerequisites - so it decides everything is up to date and **refuses to run your tests**.

```console
$ touch test
$ make test
make: 'test' is up to date.
```

*What just happened:* the stray file named `test` fooled Make's timestamp logic. Make thought the target was already built. This is a real, confusing bug that bites people.

The fix is `.PHONY`. It tells Make "this target is a task name, not a file - never check the disk for it, always run the recipe."

```makefile
.PHONY: test lint run

test:
	pytest tests/

lint:
	ruff check .

run:
	python app.py
```

*What just happened:* declaring the targets phony makes Make skip the file check entirely. The recipes now always run, regardless of what files happen to exist. **Rule of thumb:** any target that is a verb (a task) rather than a noun (a file) should be listed in `.PHONY`.

## Variables: name things once

Repetition in a Makefile is a bug waiting to happen. Variables fix that. Define with `=` or `:=`, expand with `$(NAME)`.

```makefile
PYTHON := python3
SRC := src/
TESTS := tests/

.PHONY: test format

test:
	$(PYTHON) -m pytest $(TESTS)

format:
	$(PYTHON) -m black $(SRC) $(TESTS)
```

*What just happened:* the interpreter and the directories live in one place each. Change `PYTHON := python3` to `PYTHON := python3.12` once and every recipe follows. Note `$(PYTHON)` with parentheses - a bare `$P` would mean the variable `P` followed by a literal `YTHON`, which is a classic silent mistake.

> `:=` expands the right-hand side **once, immediately**. Plain `=` is lazy - it re-expands every time the variable is used, which can surprise you when the value references other variables that change. When in doubt, reach for `:=`. It is the predictable one.

## Automatic variables: stop repeating the target name

When a rule builds a file, you often need to name the target and its prerequisites inside the recipe. Make gives you shorthands so you never hardcode them:

- `$@` - the target (the thing being built)
- `$<` - the first prerequisite
- `$^` - all prerequisites, space-separated

```makefile
app: main.o utils.o
	gcc -o $@ $^

%.o: %.c
	gcc -c $< -o $@
```

*What just happened:* in the first rule, `$@` is `app` and `$^` is `main.o utils.o`. In the pattern rule `%.o: %.c`, the `%` matches any stem - so `main.o` is built from `main.c` with `$<` as `main.c` and `$@` as `main.o`. One rule covers every `.c` file. Automatic variables keep recipes short and stop the copy-paste errors that come from typing filenames twice.

## A real, small Makefile

Putting the pieces together - this is roughly what you will see at the top of countless repos:

```makefile
.PHONY: install test lint build clean

install:
	pip install -e .

test: install
	pytest

lint:
	ruff check .

build: test
	python -m build

clean:
	rm -rf dist/ build/ *.egg-info
```

*What just happened:* the graph still does real work even with task targets. `make build` lists `test` as a prerequisite, and `test` lists `install` - so `make build` runs install, then tests, then the build, in that order, automatically. You declared the *dependencies between tasks* and Make sequenced them. That is the Phase 1 engine quietly running underneath a friendly task vocabulary.

In the wild: a habit worth stealing is making the first target a `help` that lists the others, so a newcomer running bare `make` gets a menu instead of a surprise. For the shell mechanics behind these recipes - quoting, pipes, exit codes - see [/guides/the-terminal-and-shell](/guides/the-terminal-and-shell).

```quiz
[
  {
    "q": "Why should task targets like `test` and `build` be listed in `.PHONY`?",
    "choices": [
      "It makes the recipes run faster",
      "It stops a same-named file on disk from fooling Make into skipping the recipe",
      "It is required syntax for any target",
      "It enables parallel execution"
    ],
    "answer": 1,
    "explain": "Without .PHONY, a file named `test` would make Make think the target is up to date and skip the recipe. .PHONY tells Make the target is a task, not a file."
  },
  {
    "q": "In the rule `app: main.o utils.o` with recipe `gcc -o $@ $^`, what does `$^` expand to?",
    "choices": [
      "app",
      "main.o",
      "main.o utils.o",
      "the first prerequisite only"
    ],
    "answer": 2,
    "explain": "`$^` is all prerequisites space-separated, so `main.o utils.o`. `$@` is the target (app) and `$<` is the first prerequisite (main.o)."
  },
  {
    "q": "What is the practical difference between `:=` and `=` when defining a variable?",
    "choices": [
      "`:=` is for numbers, `=` is for strings",
      "`:=` expands its value once immediately; `=` re-expands lazily on each use",
      "They are identical",
      "`=` is deprecated and errors in modern Make"
    ],
    "answer": 1,
    "explain": "`:=` evaluates the right-hand side once at definition time. Plain `=` is recursively expanded every time the variable is referenced, which can surprise you."
  }
]
```

[← Phase 1: The Dependency Graph](01-the-dependency-graph.md) | [Overview](_guide.md) | [Phase 3: The Tab, Stale Builds, and Why It Endures →](03-gotchas-and-why-it-endures.md)
