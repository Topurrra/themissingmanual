---
title: "Bypassing, CI, and the Gotchas"
guide: pre-commit-hooks
phase: 3
summary: "Catch problems before they're committed: the pre-commit framework runs formatters, linters, and secret scanners automatically on every git commit."
tags: [git, hooks, linting, formatting, code-quality, ci]
difficulty: beginner
synonyms: ["pre-commit framework", "git pre-commit hook", "pre-commit-config.yaml", "run linter on commit", "block bad commits", "auto format on commit", "secret scanner git hook"]
updated: 2026-06-30
---

# Bypassing, CI, and the Gotchas

The loop from Phase 2 works on your machine, for you. Phase 3 is about the rest of reality: the moment you need to bypass a hook, the fact that a local hook is a suggestion and not a wall, and how teams turn it into actual enforcement. This is where pre-commit goes from "nice for me" to "trusted by the team."

## The escape hatch - and why it's a trap door

A local hook can always be skipped. Git itself provides the flag.

```bash
git commit --no-verify -m "wip: debugging prod, fix lint later"
```

```text
[hotfix 9b2e1aa] wip: debugging prod, fix lint later
```

*What just happened:* `--no-verify` (short flag `-n`) told git to skip every hook entirely. The commit landed with zero checks. There are real reasons for this - a 2am hotfix where the linter is the last thing you care about - and it's fine that the escape hatch exists.

The trap is the lesson it teaches: **a local pre-commit hook is advisory, not enforcement.** Anyone can bypass it, on purpose or by forgetting to run `pre-commit install` after cloning. If your team's quality bar lives *only* in local hooks, it isn't really a bar - it's a polite request. That single fact is why the next section exists.

You can also skip *one* hook instead of all of them, which is the sensible middle ground:

```bash
SKIP=ruff git commit -m "intentional pattern ruff flags here"
```

*What just happened:* the `SKIP` environment variable names a hook (by its `id`) to skip while every other hook still runs. Better than `--no-verify`, because you're surgically opting out of one check rather than turning off the whole gate.

## Enforcement lives in CI, not on the laptop

Because local hooks are skippable, the real wall is a server that re-runs the same checks and won't merge until they pass. The beauty of pre-commit is that you don't write a second config for this - CI runs the *exact same* `.pre-commit-config.yaml`.

```yaml
# .github/workflows/lint.yml
name: lint
on: [pull_request]
jobs:
  pre-commit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
      - run: pip install pre-commit
      - run: pre-commit run --all-files
```

*What just happened:* CI installs pre-commit and runs `--all-files` on the pull request. If anyone committed with `--no-verify`, this step fails and blocks the merge. The local hook is now a *convenience* (fast feedback while you work) and CI is the *enforcement* (the thing nobody can skip). Same checks, two places.

```text
LOCAL hook   fast, on your machine, skippable    → convenience
CI run       slower, on a server, unskippable    → enforcement
```

*What just happened:* this split is the mental model to keep. Don't try to make the local hook unbypassable - you can't, and you'd only frustrate people. Make CI the source of truth and let the local hook be the head start. This pairs naturally with the rest of your [CI/CD pipeline](/guides/what-cicd-does).

## The high-value hook: catching secrets

If you add one thing beyond formatters, make it a secret scanner. A leaked API key or password in git history is a genuine emergency - git remembers it forever, even after you delete the line.

```yaml
  - repo: https://github.com/gitleaks/gitleaks
    rev: v8.21.2
    hooks:
      - id: gitleaks
```

```console
$ git commit -m "add config"
gitleaks.................................................................Failed
- hook id: gitleaks
- exit code: 1

Finding:     aws_secret = "AKIA...REDACTED..."
File:        config.py
Secret:      AKIA...REDACTED...
RuleID:      aws-access-token
```

*What just happened:* the scanner found something shaped like an AWS key and aborted the commit before the secret ever entered history. This is the single highest-value check on the list - it turns a credential-rotation fire drill into a five-second "oh, right, move that to an env var." Pair it with a strong [.gitignore](/guides/gitignore-lfs-submodules) so secret-bearing files like `.env` never get staged in the first place.

## Gotchas that actually bite

A handful of real-world snags, each with the fix.

```text
1. Teammate skips the checks entirely
   → They forgot `pre-commit install`. Hooks only fire after that.
     CI is your backstop for exactly this.

2. The pinned versions go stale over months
   → Run `pre-commit autoupdate` to bump every `rev:` to the latest
     release. Review the diff, then commit it.

3. A hook is mysteriously slow on every commit
   → It may be re-checking files it shouldn't. Hooks support `files:`
     and `exclude:` regex to scope what they run on.

4. CI passes but local fails (or vice versa)
   → Different tool versions. The whole point of `rev:` pinning is to
     stop this; make sure CI isn't pip-installing the tool separately.
```

*What just happened:* every one of these traces back to a Phase 1 idea - hooks are local (so they can be missed), and pinning exists to keep environments identical. The fixes are about respecting those facts, not fighting them.

> One mindset note: hooks that are too strict or too slow get bypassed, and a bypassed hook protects nothing. A fast, well-scoped, mostly-auto-fixing config that people actually keep enabled beats a perfect config they route around with `--no-verify` every day. Tune for "people leave it on."

For builders: a healthy setup is three layers - `.gitignore` keeps junk and secrets out of staging, local pre-commit hooks give instant feedback as you work, and CI re-runs the identical config as the unskippable gate. No single layer is trusted alone; together they stop the bad commit at the door and keep it stopped.

```quiz
[
  {
    "q": "What does `git commit --no-verify` do, and what does it reveal about local hooks?",
    "choices": ["Runs hooks twice for safety; hooks are mandatory", "Skips all hooks; local hooks are advisory and can be bypassed", "Verifies the commit signature only", "Forces every hook to auto-fix"],
    "answer": 1,
    "explain": "--no-verify skips every hook, proving local hooks are a convenience, not enforcement."
  },
  {
    "q": "How do you make pre-commit checks genuinely unskippable for a team?",
    "choices": ["Delete the --no-verify flag from git", "Run the same .pre-commit-config.yaml in CI and block merges on failure", "Require admin to commit", "Make the hook exit 0 always"],
    "answer": 1,
    "explain": "CI re-runs the same config on a server nobody can bypass, turning it into real enforcement."
  },
  {
    "q": "Why is a secret-scanning hook considered especially high-value?",
    "choices": ["It makes commits faster", "It auto-formats your code", "It stops a leaked credential before it enters git history, which remembers forever", "It replaces the need for .gitignore"],
    "answer": 2,
    "explain": "Once a secret is in history it stays there even after deletion; catching it pre-commit avoids a rotation emergency."
  }
]
```

[← Phase 2: The Config and the Commit Loop](02-the-config-and-loop.md) | [Overview](_guide.md)
