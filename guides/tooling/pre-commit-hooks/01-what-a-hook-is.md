---
title: "What a Hook Actually Is"
guide: pre-commit-hooks
phase: 1
summary: "Catch problems before they're committed: the pre-commit framework runs formatters, linters, and secret scanners automatically on every git commit."
tags: [git, hooks, linting, formatting, code-quality, ci]
difficulty: beginner
synonyms: ["pre-commit framework", "git pre-commit hook", "pre-commit-config.yaml", "run linter on commit", "block bad commits", "auto format on commit", "secret scanner git hook"]
updated: 2026-06-30
---

# What a Hook Actually Is

Here's the reality you're starting from. You make a change, you commit, you push, and *then* a linter somewhere decides it doesn't like your code. The feedback loop is long and it happens far from where the mistake was made. What you want is for the check to run at the exact moment the mistake exists - when you type `git commit` - so you can fix it while the code is still fresh in your head and still on your machine.

That moment-of-commit check is what a *git hook* is. Understanding the plain git mechanism first makes the framework on top of it obvious, so let's start there.

## Git hooks: scripts git runs for you

Git has always been able to run your own scripts at certain points in its lifecycle. These are called hooks, and they live in a folder inside every repo.

```bash
ls .git/hooks/
```

```text
applypatch-msg.sample      pre-commit.sample
commit-msg.sample          pre-push.sample
post-update.sample         prepare-commit-msg.sample
pre-rebase.sample          update.sample
```

*What just happened:* every repo ships with example hooks, all ending in `.sample` so git ignores them. The names *are* the trigger points. The one we care about is `pre-commit`: git runs it right before a commit is finalized. If that script exits with a non-zero status, git aborts the commit.

That last sentence is the whole mental model. A pre-commit hook is a gate. Exit `0`, the commit goes through. Exit non-zero, the commit is blocked and nothing is recorded. So if you put your linter in that script and it finds a problem, the bad commit never happens.

You could write that script by hand. Rename `pre-commit.sample` to `pre-commit`, make it run your linter, done. So why does a whole framework exist?

## Why hand-rolled hooks fall apart

Try to run a real team on raw `.git/hooks/` scripts and you hit three walls fast.

The first is that **`.git/hooks/` is not part of the repo.** Everything inside `.git/` is local to your clone and is never committed or pushed. Write a perfect hook, and your teammate who clones the repo gets... nothing. There's no way to share the hook through git itself, which is the one tool everyone already has.

The second is that **a hook is one script, but you want many checks** - a Python formatter, a YAML validator, a secret scanner, a "did you leave a merge conflict marker in" check. Cramming all of those into one bash script, each with its own install steps and versions, turns into a maintenance pit.

The third is **language and version drift.** Your formatter needs a specific version to behave consistently. If it's installed differently on every machine, "it formats fine on mine" becomes a daily argument. You want the *same* tool at the *same* version for everyone, isolated from whatever else is on the machine.

```text
Raw hook                          The problem it can't solve
------------------------------    ---------------------------------
.git/hooks/pre-commit  (local) →  teammates never get it
one bash script        (rigid) →  many checks, tangled together
"works on my machine"  (drift) →  different tool versions everywhere
```

*What just happened:* each weakness of the raw mechanism maps to exactly one thing the framework provides - sharing, composition, and pinned isolated tools.

## The framework: hooks as managed, shared config

The pre-commit framework (the tool is literally named `pre-commit`) is a thin manager that solves all three. Instead of writing a script, you write a small config file - `.pre-commit-config.yaml` - that *lists* the checks you want. You commit that file. Now it travels with the repo like any other source.

When someone runs one setup command, the framework writes the actual `.git/hooks/pre-commit` script for them, pointed back at the shared config. Each check (called a "hook") is pulled from a repo at a pinned version and installed into its own isolated environment, so everyone runs the identical tool.

```text
.pre-commit-config.yaml   ← you write & COMMIT this (shared)
        │
        │  pre-commit install   (each dev runs once)
        ▼
.git/hooks/pre-commit      ← framework generates this (local)
        │
        │  on every `git commit`
        ▼
runs each hook from a pinned repo, in its own env
```

*What just happened:* you maintain one committed file; the framework turns it into the per-clone machinery. The thing you share is config, not a script, and that's the entire shift in thinking.

> The word "hook" now means two things, and that's worth holding clearly. There's git's `pre-commit` *event* (the moment), and there are the individual *hooks* you list in the config (each formatter or linter). The framework is the bridge: it registers itself on git's event, then runs your list of hooks when the event fires.

## What this buys you

The payoff is a class of mistakes that can't reach the shared history anymore: unformatted code, broken YAML, leftover `print` debugging, a leaked credential. They get caught on the laptop, in the second before the commit, by the same checks for every single person on the team. Nobody waits on CI to learn they left a trailing space.

For builders: this is the local half of a quality strategy. The same checks can run again in CI as a backstop - if [continuous integration](/guides/what-cicd-does) is the net at the end, pre-commit is the catch at the source. Phase 3 covers running both from one config.

```quiz
[
  {
    "q": "What does git do when a pre-commit hook script exits with a non-zero status?",
    "choices": ["Commits anyway and logs a warning", "Aborts the commit", "Retries the hook three times", "Pushes the commit but marks it failed"],
    "answer": 1,
    "explain": "A non-zero exit is the gate slamming shut: git aborts the commit and records nothing."
  },
  {
    "q": "Why can't you simply share a script in .git/hooks/ with your team through git?",
    "choices": ["Hooks must be written in bash", "The .git/ directory is local and never committed or pushed", "GitHub strips hook files on push", "Hooks require admin permissions"],
    "answer": 1,
    "explain": "Everything under .git/ is local to your clone, so a hand-placed hook never travels with the repo."
  },
  {
    "q": "What is the one file you write and commit so the whole team shares the same checks?",
    "choices": [".git/hooks/pre-commit", "pre-commit.toml", ".pre-commit-config.yaml", "hooks.json"],
    "answer": 2,
    "explain": ".pre-commit-config.yaml lists your hooks and is committed, so it travels with the repo."
  }
]
```

[← Overview](_guide.md) | [Phase 2: The Config and the Commit Loop →](02-the-config-and-loop.md)
