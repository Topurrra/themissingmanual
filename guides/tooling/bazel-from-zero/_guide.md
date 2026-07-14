---
title: "Bazel, From Zero"
guide: bazel-from-zero
phase: 0
summary: "Google's build system for huge, multi-language repos: hermetic, reproducible builds with aggressive caching and parallelism - and the steep tradeoff that buys."
tags: [bazel, build, monorepo, caching, hermetic, tooling]
category: tooling
group: "Build & Package Managers"
order: 12
difficulty: advanced
synonyms: ["bazel tutorial", "what is bazel", "bazel build system", "bazel monorepo", "bazel vs make", "starlark build", "hermetic builds", "remote cache bazel"]
updated: 2026-06-30
---

# Bazel, From Zero

You opened a repo, ran the build, and got coffee. Forty minutes later it was still going - and your one-line change rebuilt the entire world. Bazel exists to make that not happen: it knows exactly what each piece depends on, rebuilds only what actually changed, and runs everything it can in parallel. The price is that you have to tell it the truth about your code, in its own language, up front.

This guide is about that bargain. What Bazel is really doing under the hood, how you live with it day to day, and the real question of whether your project is big enough to need it at all.

## How to read this

Go in order. Phase 1 builds the mental model - the dependency graph and why hermeticity is the whole point. Phase 2 is the everyday loop: writing BUILD files, naming targets, running builds and tests. Phase 3 is the reality check - remote caching, the slow cold start, and the projects where Bazel is the wrong tool. If you only have ten minutes, read Phase 1; it's the part that makes everything else click.

## The phases

1. [Phase 1: The Graph, and Why Hermetic](01-the-graph-and-why-hermetic.md) - what Bazel actually models and why declared inputs change everything.
2. [Phase 2: BUILD Files and the Daily Loop](02-build-files-and-the-daily-loop.md) - targets, rules, and the commands you'll run a hundred times a day.
3. [Phase 3: Caching, Cold Starts, and When Not To](03-caching-cold-starts-and-when-not-to.md) - remote cache, the real costs, and choosing the right tool.

[Phase 1: The Graph, and Why Hermetic](01-the-graph-and-why-hermetic.md) →
