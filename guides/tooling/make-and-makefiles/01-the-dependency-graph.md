---
title: "The Dependency Graph in Your Head"
guide: make-and-makefiles
phase: 1
summary: "The 50-year-old build tool that still runs everything: targets, prerequisites, and recipes - a dependency graph that rebuilds only what changed."
tags: [make, makefile, build, automation, task-runner, cli]
difficulty: beginner
synonyms: ["makefile tutorial", "how does make work", "phony targets", "make tab error", "makefile variables", "make vs scripts"]
updated: 2026-06-30
---

# The Dependency Graph in Your Head

Here is the reality Make was born into. You have source files. You run a compiler. It chews on the source and spits out something else - a binary, a bundle, a PDF. Compiling everything takes a while. So when you change one file, you want to rebuild only the things that depend on that file, and leave the rest alone. Doing that bookkeeping by hand is miserable and easy to get wrong.

Make is the machine that does that bookkeeping for you. That is the whole idea. Once you see it as bookkeeping over a graph, every Makefile stops being runes and starts being readable.

## Three words: target, prerequisites, recipe

A Makefile is a list of rules. Every rule has the same shape:

```makefile
target: prerequisites
	recipe
```

- The **target** is the thing you want to exist - usually a file, like `app` or `report.pdf`.
- The **prerequisites** are the things the target is made from - the files it depends on.
- The **recipe** is the shell command that builds the target from the prerequisites.

Read it out loud: "To make `target`, I need `prerequisites`, and here is how." That sentence is the entire model.

```makefile
report.pdf: report.md
	pandoc report.md -o report.pdf
```

*What just happened:* you declared that `report.pdf` is built from `report.md` by running `pandoc`. You have not run anything yet - you have described a relationship.

## The one decision Make makes

When you run `make report.pdf`, Make does not blindly run the recipe. It asks one question: **is the target older than any of its prerequisites?**

It checks file modification timestamps. If `report.md` was modified more recently than `report.pdf` - or if `report.pdf` does not exist yet - the target is stale, so Make runs the recipe. If `report.pdf` is newer than `report.md`, nothing changed that matters, so Make does nothing and tells you so.

```console
$ make report.pdf
pandoc report.md -o report.pdf

$ make report.pdf
make: 'report.pdf' is up to date.
```

*What just happened:* the first run built the PDF because it did not exist. The second run did nothing - `report.pdf` is now newer than `report.md`, so Make saw no work to do. Edit `report.md` and run again, and it rebuilds. That timestamp comparison is the engine of the entire tool.

## It is a graph, not a list

Prerequisites can themselves be targets of other rules. That is what turns a flat list into a graph.

```makefile
site.zip: index.html style.css
	zip site.zip index.html style.css

index.html: index.md
	pandoc index.md -o index.html
```

Ask Make for `site.zip` and it works backward. To build `site.zip` it needs `index.html`. Is `index.html` itself a target with its own prerequisites? Yes - it depends on `index.md`. So Make checks that branch first.

```text
site.zip
├── index.html  ← built from index.md
└── style.css
```

*What just happened:* Make built a small dependency tree in memory, then walked it from the leaves up. It rebuilds `index.html` only if `index.md` changed, then rebuilds `site.zip` only if either prerequisite ended up newer. Change one Markdown file deep in a big project and Make rebuilds exactly the chain it touches - and nothing else. That selective rebuild is why Make scaled to enormous codebases decades before anything fancier existed.

> The order you write rules in does not matter for the graph. Make reads the whole file, builds the graph, then decides what to run. The only special rule is the first one - that is the default target when you run bare `make`.

## Why this beats a shell script

You could write a `build.sh` that runs every command top to bottom. It would work. But it would do *all* the work *every* time, even when nothing changed. On a large project that is the difference between a one-second rebuild and a five-minute one.

Make's superpower is the incremental rebuild: describe the dependencies once, and it figures out the minimum work to bring everything up to date. You declare *relationships*; a plain script encodes a fixed *sequence*. For builds, relationships win - because the right sequence changes depending on what you edited, and Make recomputes it every time from the timestamps.

For builders: this is the same core idea that later tools (Bazel, Ninja, Gradle's incremental compilation) refined and scaled. Learn it here and the rest read like dialects. See [/guides/build-and-release-basics](/guides/build-and-release-basics) for where build tools fit in the bigger release picture.

```quiz
[
  {
    "q": "When you run `make foo`, what determines whether Make runs the recipe?",
    "choices": [
      "It always runs the recipe every time",
      "Whether the target is missing or older than any prerequisite",
      "Whether the recipe has changed since last run",
      "Whether you passed the --force flag"
    ],
    "answer": 1,
    "explain": "Make compares modification timestamps: if the target is missing or older than a prerequisite, it is stale and the recipe runs. Otherwise Make does nothing."
  },
  {
    "q": "In the rule `app: main.c utils.c`, what is `app`?",
    "choices": [
      "A prerequisite",
      "A recipe",
      "The target - the thing to be built",
      "A variable"
    ],
    "answer": 2,
    "explain": "The name before the colon is the target. The names after the colon (main.c utils.c) are its prerequisites."
  },
  {
    "q": "Why is Make often better than a plain build.sh for a large project?",
    "choices": [
      "It runs commands in parallel by default",
      "It rebuilds only what changed, instead of redoing all work every time",
      "It is written in a faster language",
      "It does not need a shell installed"
    ],
    "answer": 1,
    "explain": "A script runs its whole sequence every time. Make uses the dependency graph and timestamps to do the minimum work needed to bring targets up to date."
  }
]
```

[← Overview](_guide.md) | [Phase 2: Targets, Tasks, and Variables →](02-targets-tasks-variables.md)
