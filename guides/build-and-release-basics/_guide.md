---
title: "Build & Release Basics"
guide: "build-and-release-basics"
phase: 0
summary: "How source code becomes a thing you can actually ship: what a build produces, why you version and freeze artifacts, and how the same artifact moves from dev to staging to prod."
tags: [build, release, artifacts, versioning, environments, devops]
category: devops
difficulty: beginner
synonyms: ["what does building code mean", "how does code get deployed", "what is a build artifact", "what is semantic versioning", "what is staging vs production", "why does it work in staging but break in prod"]
updated: 2026-06-19
order: 3
---

# Build & Release Basics

You wrote some code. It runs on your laptop. And then someone asks you to "ship it" or "push it to prod" — and suddenly there's talk of *builds* and *artifacts* and *staging* and *promoting a release*, and none of it was in the tutorial that taught you the language. That gap is normal, and it's not your fault: nobody hands you the manual for the journey from "code on my machine" to "a running thing other people use."

This guide closes that gap. By the end you'll understand what a build actually produces, why you give releases version numbers and then freeze them, and how the very same built thing travels from your machine to staging to production without being rebuilt at each stop. None of it is magic — it's a small set of ideas that, once you see them, make the whole pipeline obvious.

## How to read this
- **Want it to finally make sense?** Read in order — each phase builds on the last, starting from what a build even *is*.
- **Just need the one idea that explains the most pain?** Phase 3 covers why "works in staging, breaks in prod" happens, and the rule that prevents it.

## The phases
1. **[What "Building" Actually Produces](01-what-building-produces.md)** — turning source code into a runnable, shippable *artifact*, and why a clean, repeatable build matters.
2. **[Versions & Artifacts](02-versions-and-artifacts.md)** — giving a release a version number, freezing the artifact so it never changes, and where built artifacts live.
3. **[Environments & Promotion](03-environments-and-promotion.md)** — dev, staging, and prod; promoting the *same* artifact through them instead of rebuilding; and keeping config separate from code.

> This guide stops at the moment you have an artifact ready to move through environments. *Who* pushes the buttons, and how to make all of this automatic, is the next guide: [What CI/CD Does](/guides/what-cicd-does).
