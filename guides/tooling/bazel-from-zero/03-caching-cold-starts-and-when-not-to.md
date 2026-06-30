---
title: "Bazel, From Zero"
guide: bazel-from-zero
phase: 3
summary: "Google's build system for huge, multi-language repos: hermetic, reproducible builds with aggressive caching and parallelism — and the steep tradeoff that buys."
tags: [bazel, build, monorepo, caching, hermetic, tooling]
difficulty: advanced
synonyms: ["bazel tutorial", "what is bazel", "bazel build system", "bazel monorepo", "bazel vs make", "starlark build", "hermetic builds", "remote cache bazel"]
updated: 2026-06-30
---

# Caching, Cold Starts, and When Not To

You've got the model and the daily loop. Now the part nobody tells you until you're three months in: where Bazel's promised speed actually comes from, where it bites back, and the most important engineering call of all — whether your project should be using Bazel at all. The honest answer is that for a lot of projects, it shouldn't.

## The remote cache: building once for the whole team

Phase 1 said hermeticity makes results shareable. This is where that pays off. Because a hermetic action's output is fully determined by its inputs, Bazel can name each action by a hash of its inputs and store the result in a **remote cache** that the whole team and CI share.

```text
your change ─► Bazel hashes each action's inputs
                       │
            ┌──────────┴───────────┐
       hash hit                hash miss
            │                       │
   download result          run action locally,
   from remote cache        upload result for others
```

*What just happened:* When you build a target a colleague (or CI) already built from the same inputs, Bazel computes the same hash, finds it in the shared cache, and **downloads the output instead of compiling it.** On a big repo this is the difference between a fresh checkout taking an hour and taking two minutes. This is also why teams adopt Bazel: not for the local loop, but for the shared one.

The bigger sibling is **remote execution** — Bazel ships the sandboxed actions themselves to a farm of build machines and runs hundreds in parallel, far beyond your laptop's core count. Both features are optional and need a backend (self-hosted or a vendor). Plain Bazel without them still caches locally and parallelizes across your own cores.

> Remote caching only works if your builds are genuinely hermetic. One action that secretly reads the system clock or an undeclared file will poison the cache — someone downloads a "matching" result that's actually wrong. The strictness Bazel forces on you in Phase 1 is the entry fee for this feature. There's no cheating it.

## The costs nobody puts on the brochure

Bazel is not free, and the bill comes due in specific places. Name them so they don't ambush you.

- **The cold start is brutal.** A clean build with an empty cache builds the world from scratch. Bazel's speed is incremental and shared; the very first build on a fresh machine with no remote cache can be slower than the simple tool you came from.
- **You maintain the graph by hand.** Every new file, new dependency, new third-party library means editing a BUILD file. Forget a `deps` entry and the build breaks until you fix it. Tools like `gazelle` can generate BUILD files for some languages, but it's still upkeep that a `go build` or `npm install` never asked of you.
- **The ecosystem fights you at the edges.** Many libraries and IDEs assume the native tool of their language. Getting your editor, debugger, and that one weird dependency to play nicely with Bazel is real, recurring work — especially for languages where Bazel's rules are less mature.
- **It's a steep learning curve for the whole team.** Starlark, labels, configurations, toolchains, the `WORKSPACE`/`MODULE.bazel` seam — this is a lot of surface for every engineer to absorb, not a tool one person installs and forgets.

```console
$ bazel build //... --config=remote   # warm cache, large repo
INFO: 4213 processes: 4102 remote cache hit, 111 internal.
INFO: Elapsed time: 38.6s
```

*What just happened:* Out of 4,213 actions, 4,102 were served straight from the remote cache and never re-run. That ratio is Bazel at its best — and it only exists because someone paid the setup and discipline costs above. With no shared cache, those 4,102 actions would have run locally.

## When Bazel is worth it, and when it's overkill

This is the decision that matters more than any flag. Bazel earns its complexity under a specific shape of problem:

**Reach for Bazel when:**
- You have a **large monorepo** where full rebuilds are painfully slow and most changes touch a small slice.
- You build **multiple languages** in one repo and want one consistent build and test story across them.
- A **team or CI** can share a remote cache, so the per-build win multiplies across many people.
- **Reproducibility is a hard requirement** — regulated builds, supply-chain integrity, "this exact binary, byte for byte."

**Skip Bazel when:**
- It's a **single-language project** and that language's native tool (Cargo, Go, npm, Maven) already does incremental builds well. You'd be adding a second build system on top of a good one.
- The repo is **small or solo** — there's no shared cache to amortize the setup, and cold starts dominate. The complexity buys you nothing.
- Your team **can't or won't invest** in learning and maintaining it. A build system everyone fights is slower in human time than a simple one everyone understands.

> The trap is adopting Bazel because a famous company uses it. They have ten thousand engineers, a hundred-million-line repo, and a team whose whole job is the build. If your reality doesn't look like that, the native tool you already have is very likely the right call. Bazel solves a scale problem; if you don't have the scale problem, you've bought the cost without the benefit.

## In the wild

The pattern to copy from Bazel even if you never adopt it: **make your build's inputs explicit and your outputs reproducible.** That principle — declared inputs, content-hashed caching, isolated build steps — shows up across modern tooling and underpins the broader ideas in [build and release basics](/guides/build-and-release-basics). Bazel is the maximalist version of a good habit. You can practice the habit at any scale; you only need the maximalist tool when the scale demands it.

```quiz
[
  {
    "q": "What makes Bazel's remote cache trustworthy across a whole team?",
    "choices": [
      "Every developer runs identical hardware",
      "Hermetic actions are keyed by an input hash, so a cache hit is provably the same result",
      "Bazel re-verifies each downloaded artifact by rebuilding it",
      "The cache is encrypted end to end"
    ],
    "answer": 1,
    "explain": "Hermeticity makes an action's output fully determined by its inputs, so it can be hashed and shared safely. A non-hermetic action would poison the cache."
  },
  {
    "q": "Which situation is the WEAKEST fit for adopting Bazel?",
    "choices": [
      "A large multi-language monorepo with slow full rebuilds",
      "A team sharing a remote cache across CI and developers",
      "A small single-language project whose native tool already does incremental builds well",
      "A regulated project requiring byte-for-byte reproducible builds"
    ],
    "answer": 2,
    "explain": "For a small single-language project with a good native tool, Bazel adds setup and maintenance cost with no shared-cache or scale benefit to offset it."
  },
  {
    "q": "Why can a fresh checkout's first Bazel build sometimes be slower than a simpler tool?",
    "choices": [
      "Bazel intentionally throttles the first run",
      "With an empty cache there is nothing to reuse, so it builds the world from scratch",
      "Hermetic sandboxing is always slower than non-sandboxed builds",
      "It must download the entire Bazel source code first"
    ],
    "answer": 1,
    "explain": "Bazel's speed comes from incremental and shared caching. A cold start with no cache has nothing to skip, so it pays the full build cost up front."
  }
]
```

[← Phase 2: BUILD Files and the Daily Loop](02-build-files-and-the-daily-loop.md) · [Overview](_guide.md)
