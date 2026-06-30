---
title: "Make and Makefiles"
guide: make-and-makefiles
phase: 0
summary: "The 50-year-old build tool that still runs everything: targets, prerequisites, and recipes — a dependency graph that rebuilds only what changed."
tags: [make, makefile, build, automation, task-runner, cli]
category: tooling
group: "Build & Package Managers"
order: 11
difficulty: beginner
synonyms: ["makefile tutorial", "how does make work", "phony targets", "make tab error", "makefile variables", "make vs scripts"]
updated: 2026-06-30
---

# Make and Makefiles

You typed `make` once, it printed a wall of compiler noise, and you nodded like you understood. Then someone handed you a project where `make test` and `make build` were the whole workflow, and a stray space gave you `missing separator. Stop.` with no clue why. Make feels like ancient runes, but underneath it is one small, sharp idea you can hold in your head. This guide hands you that idea, then the everyday moves, then the traps that bite everyone once.

## How to read this

Read the three phases in order. Phase 1 is the mental model — the one picture that makes every Makefile readable. Phase 2 is the daily driver: writing targets, using Make as a task runner, and the variables that keep recipes clean. Phase 3 is where it breaks: the infamous tab, stale builds, and the production reality of why this tool outlived almost everything around it. Type the examples. A Makefile you ran beats one you skimmed.

## The phases

1. [Phase 1: The Dependency Graph in Your Head](01-the-dependency-graph.md) — what Make actually is and why it exists
2. [Phase 2: Targets, Tasks, and Variables](02-targets-tasks-variables.md) — how you really use it day to day
3. [Phase 3: The Tab, Stale Builds, and Why It Endures](03-gotchas-and-why-it-endures.md) — where it bites and why it survived

[Phase 1: The Dependency Graph in Your Head](01-the-dependency-graph.md) →
