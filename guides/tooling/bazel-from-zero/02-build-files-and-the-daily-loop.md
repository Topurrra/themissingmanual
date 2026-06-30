---
title: "BUILD Files and the Daily Loop"
guide: bazel-from-zero
phase: 2
summary: "Google's build system for huge, multi-language repos: hermetic, reproducible builds with aggressive caching and parallelism — and the steep tradeoff that buys."
tags: [bazel, build, monorepo, caching, hermetic, tooling]
difficulty: advanced
synonyms: ["bazel tutorial", "what is bazel", "bazel build system", "bazel monorepo", "bazel vs make", "starlark build", "hermetic builds", "remote cache bazel"]
updated: 2026-06-30
---

# BUILD Files and the Daily Loop

Phase 1 was the why. This is the part your hands actually do: writing the files that describe the graph, naming the things in it, and running the handful of commands you'll type all day. The good news is that the daily surface area of Bazel is small. Most of your time is spent in two files and three commands.

## Where the graph comes from: BUILD files

Bazel doesn't infer your graph by reading source code. You write it down, in a `BUILD` (or `BUILD.bazel`) file that lives in each directory you want to be a **package**. Inside, you declare targets using **rules** — `cc_binary`, `java_library`, `py_test`, and so on — in a Python-like language called Starlark.

Here's a real package for a small Python app:

```python
# app/BUILD.bazel
py_library(
    name = "greet",
    srcs = ["greet.py"],
)

py_binary(
    name = "server",
    srcs = ["server.py"],
    deps = [":greet"],          # depends on the library above
)

py_test(
    name = "greet_test",
    srcs = ["greet_test.py"],
    deps = [":greet"],
)
```

*What just happened:* You declared three targets in one package. `name` is how you'll refer to each one. `srcs` lists the source files this target owns. `deps` lists the other targets it needs — `:greet` means "the target named greet in this same package." Bazel reads this and now knows the graph: `server` and `greet_test` both point at `greet`. Notice you never wrote a single compile command. The rule (`py_binary`) knows how to build a Python binary; you only supply the pieces.

This is the trade Phase 1 described, made concrete. You spend effort declaring inputs and deps precisely. In return, Bazel can do correct incremental builds, caching, and parallelism — because you told it the truth.

## How to name a target: labels

Every target has a globally unique address called a **label**. You'll read and type these constantly, so the syntax is worth ten seconds:

```text
//app:server
 │    │
 │    └─ target name (from the `name =` in the BUILD file)
 └────── package path from the repo root (the // means "workspace root")
```

*What just happened:* `//app:server` means "the target named `server` in the package at `app/`." The `//` always anchors to the root of your workspace, so the same label means the same thing from anywhere in the repo. Inside the same BUILD file you can shorten it to `:server`. A common shorthand `//app` (no colon) means `//app:app` — the target whose name matches its directory.

## The three commands you'll actually use

Ninety percent of daily Bazel is three verbs.

```console
$ bazel build //app:server
INFO: Analyzed target //app:server (3 packages loaded, 12 targets configured).
INFO: Found 1 target...
Target //app:server up-to-date:
  bazel-bin/app/server
INFO: Elapsed time: 2.1s, Critical Path: 1.8s
INFO: Build completed successfully, 4 total actions
```

*What just happened:* `bazel build` produced the binary and put it under `bazel-bin/`. Run it again with no code changes and it finishes in milliseconds with `0 total actions` — nothing changed, so there was nothing to do. That's the incremental graph working.

```console
$ bazel test //app:greet_test
INFO: Analyzed target //app:greet_test (0 packages loaded, 0 targets configured).
//app:greet_test    PASSED in 0.4s

Executed 1 out of 1 test: 1 test passes.
```

*What just happened:* `bazel test` built the test's dependencies, ran it in a sandbox, and reported the result. Run it again without touching anything and you'll see `(cached) PASSED` — Bazel knows the inputs are identical, so the outcome is guaranteed identical and it skips the run.

```console
$ bazel run //app:server
INFO: Build completed successfully, 1 total action
Serving on http://localhost:8080
```

*What just happened:* `bazel run` builds the target and then executes it, in one step. Use `build` when you only want the artifact, `run` when you want it built and launched.

## Wildcards and querying the graph

You rarely name targets one at a time. Wildcards let you act on whole slices of the graph:

```console
$ bazel test //app/...        # every test under app/, recursively
$ bazel build //...           # build everything in the workspace
```

*What just happened:* `...` means "this package and all packages beneath it." `bazel test //...` is the classic "did I break anything anywhere" command — and because of caching, after the first run it only re-tests what your change actually touched.

When you need to understand the graph itself, `bazel query` answers questions the BUILD files can't at a glance:

```console
$ bazel query "deps(//app:server)"          # everything :server depends on
$ bazel query "rdeps(//..., //app:greet)"   # everything that depends on :greet
```

*What just happened:* `rdeps` (reverse deps) is the one you'll reach for before a risky change: "if I touch `//app:greet`, what else could I break?" The graph that powers the build also answers that question directly.

> A daily habit that pays off: when a build fails with a missing-symbol or missing-file error, your first instinct should be "I forgot a `deps` entry," not "the compiler is broken." Hermeticity means the file is invisible until you declare it. The fix is almost always adding the right label to `deps` or `srcs`.

## For builders

The `WORKSPACE` / `MODULE.bazel` file at your repo root is where external dependencies get declared — pinned versions, fetched and cached the same hermetic way as everything else. You won't touch it daily, but know it's the seam between your code and the outside world. Adding a third-party library means declaring it there once, then referencing its label from your `deps`, never reaching out to a global package install.

```quiz
[
  {
    "q": "In the label //app:server, what does the 'app' part refer to?",
    "choices": [
      "The name of the rule, like py_binary",
      "The package: the directory (from the workspace root) containing the BUILD file",
      "The name of the output binary file on disk",
      "The Bazel command being run"
    ],
    "answer": 1,
    "explain": "A label is //package:target. 'app' is the package path from the workspace root; 'server' is the target's name inside that package's BUILD file."
  },
  {
    "q": "You run `bazel test //app:greet_test` twice with no changes in between. What does the second run do?",
    "choices": [
      "Re-runs the test fully to be safe",
      "Reports it as cached and skips re-running, since inputs are identical",
      "Fails because the result already exists",
      "Rebuilds every target in the workspace first"
    ],
    "answer": 1,
    "explain": "Identical declared inputs guarantee an identical result, so Bazel reports a cached PASSED rather than executing the test again."
  },
  {
    "q": "A build fails because a source file 'cannot be found,' yet the file clearly exists in the directory. What is the most likely cause?",
    "choices": [
      "The compiler is misconfigured",
      "Bazel needs a reboot to refresh its file index",
      "The file is not declared in srcs or deps, so the sandboxed action can't see it",
      "The label uses // instead of a relative path"
    ],
    "answer": 2,
    "explain": "Hermetic actions only see declared inputs. An undeclared file is invisible inside the sandbox; the fix is adding it to srcs or the right deps entry."
  }
]
```

[← Phase 1: The Graph, and Why Hermetic](01-the-graph-and-why-hermetic.md) · [Overview](_guide.md) · [Phase 3: Caching, Cold Starts, and When Not To →](03-caching-cold-starts-and-when-not-to.md)
