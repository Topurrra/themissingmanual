---
title: "Your First Pipeline (GitHub Actions)"
guide: "your-first-pipeline-github-actions"
phase: 0
summary: "What a GitHub Actions workflow actually is — events trigger jobs made of steps that run on a runner — then a real ci.yml decoded line by line, plus caching, matrices, secrets, and required checks."
tags: [github-actions, ci, cd, ci-cd, automation, yaml, workflow]
category: devops
difficulty: intermediate
order: 5
synonyms: ["how do github actions work", "write a github actions workflow", "ci.yml explained", "github actions tutorial for beginners", "what is a job vs a step in github actions", "set up CI on github"]
updated: 2026-06-19
---

# Your First Pipeline (GitHub Actions)

You've seen the green check mark next to a pull request. You've also seen the red X — usually right when you were sure your change was fine — and felt that small drop in your stomach. Somewhere behind those marks, a machine you've never met ran your tests and made a verdict. This guide is about that machine and the file that tells it what to do.

By the end you'll have a real `.github/workflows/ci.yml` you understand line by line, the mental model to *reason* about any workflow you meet, and enough of the advanced moves — caching, matrices, secrets — to make CI fast and trustworthy instead of a mysterious gatekeeper.

📝 **Terminology.** **CI** is *continuous integration*: every time you push code, an automated build runs your checks (tests, linters, type-checks) so problems surface in minutes, not in someone else's afternoon. GitHub Actions is GitHub's built-in way to run CI (and more). If "what is CI even for" is fuzzy, read [What CI/CD Does](/guides/what-cicd-does) first, then come back here for the *how*.

## How to read this

- **Want it to finally make sense?** Read in order. Phase 1 installs the mental model, Phase 2 builds a real workflow on top of it, Phase 3 makes it fast and safe.
- **Already have a workflow and just need one concept?** Jump straight to [Phase 3: Beyond the Basics](03-beyond-the-basics.md) for caching, matrices, and secrets.

## The phases

1. **[The Anatomy of a Workflow](01-anatomy-of-a-workflow.md)** — the mental model: events trigger workflows, made of jobs, made of steps, that run on a runner. The YAML structure decoded so it stops looking like magic.
2. **[Building It Up](02-building-it-up.md)** — a real `ci.yml` that checks out your code, sets up your language, installs dependencies, and runs your tests — every line explained, with both a passing and a failing run log.
3. **[Beyond the Basics](03-beyond-the-basics.md)** — caching dependencies for speed, a build matrix to test multiple versions, secrets done safely, and required checks that block a bad merge.

> Deliberately deferred to follow-up guides: deployment (the "CD" half — shipping to a server or registry), reusable/composite workflows, and self-hosted runners. This guide gets you a solid *integration* pipeline first; shipping comes once that's rock-solid.
