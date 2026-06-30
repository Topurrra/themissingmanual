---
title: "The Graph, and Why Hermetic"
guide: bazel-from-zero
phase: 1
summary: "Google's build system for huge, multi-language repos: hermetic, reproducible builds with aggressive caching and parallelism - and the steep tradeoff that buys."
tags: [bazel, build, monorepo, caching, hermetic, tooling]
difficulty: advanced
synonyms: ["bazel tutorial", "what is bazel", "bazel build system", "bazel monorepo", "bazel vs make", "starlark build", "hermetic builds", "remote cache bazel"]
updated: 2026-06-30
---

# The Graph, and Why Hermetic

Most build tools you've met run a script. Make runs recipes, npm runs lifecycle hooks, a shell script runs commands top to bottom. They do what you tell them, in the order you tell them, and they trust you to know what changed. That trust is exactly where slow, flaky builds come from: the tool can't rebuild only what changed because it doesn't actually know what depends on what.

Bazel starts from the opposite end. Before it runs anything, it builds a picture of your whole project as a graph - every file, every output, every dependency between them. Then it figures out the smallest set of work needed to give you what you asked for. The build commands are almost an afterthought; the graph is the product.

## A build is a graph, not a script

Picture a small service: some library code, a binary that uses it, and a test for the library.

```text
//lib:greet  ──►  //app:server  (binary depends on the library)
     │
     └──────────►  //lib:greet_test  (test depends on the library)
```

*What just happened:* Each box is a **target** - a named thing Bazel can build. The arrows are dependencies. If you change `//lib:greet`, Bazel knows that both `//app:server` and `//lib:greet_test` are downstream and need rebuilding. If you change a file that only `//app:server` reads, the test is untouched and Bazel won't run it.

This is the core mental model: **you don't run builds, you ask for nodes in a graph, and Bazel computes the rest.** Everything else in Bazel - caching, parallelism, the strict rules about inputs - falls out of this one idea. Once the graph exists, Bazel can rebuild any node by rebuilding only its changed ancestors, and run independent nodes at the same time because it knows they can't affect each other.

## Hermetic: declare your inputs or it doesn't count

Here's the part that feels strict at first and turns out to be the whole point.

A normal build action can read anything on your machine - a header in `/usr/include`, an env var, the system clock, a tool that happens to be on your `PATH`. That's why "works on my machine" exists: the build secretly depended on something it never declared, and that something was different on the next machine.

Bazel runs each build action in a sandbox that contains **only the inputs you declared** - nothing else from your filesystem. If your compile step needs a header, that header has to be a declared dependency, or the action literally can't see the file and fails. This is what **hermetic** means: the build's result depends only on its declared inputs, not on hidden state.

```text
declared inputs  ─►  [ sandboxed action ]  ─►  declared outputs
   (sources,                  ▲
    deps, tools)              │
                    nothing else is visible
```

*What just happened:* Because the action can only see what it declared, the same inputs always produce the same outputs - on your laptop, on CI, on a teammate's machine three time zones away. That reproducibility is what makes the cache trustworthy: if the inputs match a previous build, the output is guaranteed identical, so Bazel can hand you the cached result instead of doing the work again.

> Hermeticity is annoying right up until the moment it saves you. The first time you fight Bazel because it "can't find" a tool that's clearly installed, remember: it's not broken, it's refusing to let an undeclared dependency rot your build six months from now.

## Why this scales when scripts don't

Tie the two ideas together. The graph tells Bazel the minimal work; hermeticity makes every result cacheable and shareable. Put those together across a thousand-engineer monorepo and you get the thing Bazel was built for:

- A change to one library rebuilds that library and its dependents - **not the whole repo**.
- Two unrelated targets build **in parallel** because the graph proves they don't interact.
- A result your colleague already built is in a **shared cache**, so you download it instead of compiling it (more on this in Phase 3).
- Tests whose inputs didn't change are **skipped** - Bazel already knows they'd pass identically.

A shell script can't do any of this safely, because it doesn't know the graph and can't trust that an action only touched what it declared. Bazel can, because you paid for that knowledge up front.

## For builders

The same idea shows up in other modern tools - content-addressed caching, dependency graphs, sandboxed actions. If you've used a tool that hashes inputs to skip work, you've met a slice of this. The general principle of describing builds as artifacts and stages lives in [build and release basics](/guides/build-and-release-basics); Bazel is one rigorous, large-scale answer to those same questions.

```quiz
[
  {
    "q": "What is Bazel primarily computing before it runs any build command?",
    "choices": [
      "The fastest shell script to execute top to bottom",
      "A dependency graph of targets, to find the minimal work needed",
      "A list of every file that changed since the last commit",
      "The optimal number of CPU cores to reserve"
    ],
    "answer": 1,
    "explain": "Bazel models the project as a graph of targets and their dependencies, then derives the minimal set of actions to produce what you asked for."
  },
  {
    "q": "What does it mean for a Bazel build action to be hermetic?",
    "choices": [
      "It runs entirely in memory with no disk writes",
      "It is encrypted so other users cannot read the output",
      "Its result depends only on its declared inputs, not hidden system state",
      "It always runs on a remote machine instead of locally"
    ],
    "answer": 2,
    "explain": "A hermetic action sees only its declared inputs in a sandbox, so the same inputs always produce the same outputs - which is what makes caching trustworthy."
  },
  {
    "q": "Why can Bazel safely skip rebuilding a target whose inputs are unchanged?",
    "choices": [
      "It assumes most code rarely changes",
      "Because hermetic actions guarantee identical inputs produce identical outputs",
      "It checks the file modification timestamp and trusts it",
      "It re-runs the build but discards the result quietly"
    ],
    "answer": 1,
    "explain": "Hermeticity means identical declared inputs yield identical outputs, so a cached result is provably the same as rebuilding - no need to redo the work."
  }
]
```

[← Overview](_guide.md) · [Phase 2: BUILD Files and the Daily Loop →](02-build-files-and-the-daily-loop.md)
