---
title: "Testing in CI (What Runs on Every Push)"
guide: "testing-in-ci"
phase: 0
summary: "CI is a server that automatically runs your test suite on every push and pull request, so broken code can't quietly reach main — here's the mental model, what a run actually does, and how to keep it trustworthy."
tags: [testing, ci, continuous-integration, github-actions, automated-testing, flaky-tests]
category: testing
order: 6
difficulty: intermediate
synonyms: ["what is ci testing", "what runs on every push", "what does the green check on a pull request mean", "why do tests run on github", "what is a ci pipeline", "why is my build failing", "what are flaky tests"]
updated: 2026-06-19
---

# Testing in CI (What Runs on Every Push)

You wrote a test. It passes on your machine. You push, open a pull request — and a few minutes later
a little check turns green (or red) next to your branch, run by a computer you've never logged into.
If you've ever wondered *what that check actually is*, who runs it, and why "it passed locally" stops
being good enough on a real team, this guide is for you.

This is the **testing** side of CI: tests as an automatic gate that stands between your code and the
shared `main` branch. We're staying on the test step on purpose — the wider world of building,
packaging, and deploying (CI/CD as a whole) is a separate topic for another day.

## How to read this

- **Just need the gist of that red/green check?** Read [Phase 1](01-what-ci-testing-actually-is.md) —
  it's the whole mental model in one phase.
- **Want it to finally make sense?** Read in order. Phase 1 is the idea, Phase 2 is what a run does
  step by step, Phase 3 is how teams keep the gate honest.

## The phases

1. **[What CI Testing Actually Is](01-what-ci-testing-actually-is.md)** — the mental model: a server runs
   your whole test suite automatically on every push and pull request, so nobody merges broken code.
   Why this beats "it passed on my machine."
2. **[Inside the Pipeline](02-inside-the-pipeline.md)** — what a single CI run actually does: check out
   the code, install dependencies, run lint and tests, report pass or fail. An annotated GitHub Actions
   config and a real run log, focused on the test step.
3. **[Keeping CI Trustworthy](03-keeping-ci-trustworthy.md)** — the one thing that destroys CI's value:
   flaky tests. Why flakiness happens, how to keep the suite fast and reliable, and how required checks
   protect `main`.

> The mechanics of *deploying* what CI builds — environments, release pipelines, rollbacks — are
> deliberately out of scope here. This guide is about tests as a gate, not the full CI/CD machine.

**Related guides:** [Unit, Integration & E2E](/guides/unit-integration-e2e) (the test pyramid that keeps
CI fast) · [Git With Other People](/guides/git-with-other-people) (pull requests, the place these checks
show up).
