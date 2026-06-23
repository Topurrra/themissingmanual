---
title: "What a CI/CD Pipeline Actually Does"
guide: "what-cicd-does"
phase: 0
summary: "CI/CD is the automated path from a commit to production: every change is built and tested automatically, and releases become small, frequent, and safe to roll back."
tags: [cicd, continuous-integration, continuous-delivery, continuous-deployment, devops, automation]
category: devops
order: 4
difficulty: intermediate
synonyms: ["what is ci/cd", "what does a ci/cd pipeline do", "continuous integration vs continuous delivery", "continuous delivery vs continuous deployment", "what are pipeline stages", "how does automated deployment work"]
updated: 2026-06-19
---

# What a CI/CD Pipeline Actually Does

You keep hearing "the pipeline" — the pipeline is green, the pipeline broke, wait for the pipeline before
you merge. Somewhere out there, every time you push, machines build your code, run your tests, and maybe
ship it to real users, and nobody ever sat you down and explained what's actually happening in there. This
guide is that sit-down. By the end, "CI/CD" stops being office noise and becomes a thing you can reason
about: what each letter means, what the stages do, and why teams trust an automated path from your laptop
to production.

## How to read this

- **Want it to finally make sense?** Read in order. Each phase builds the mental model one piece at a time:
  first CI, then CD, then why the whole thing is worth the trouble.
- **Just need to settle one argument?** Phase 2 has the table that untangles continuous *delivery* from
  continuous *deployment* — the two things everyone mixes up.

## The phases

1. **[CI: Continuous Integration](01-continuous-integration.md)** — every change is automatically built and
   tested the moment you push, so problems surface in minutes instead of at release. The red/green gate.
2. **[CD: Delivery vs Deployment](02-delivery-vs-deployment.md)** — the two meanings of "CD," the stages a
   pipeline runs (build → test → deploy), and the deploy strategies (blue-green, canary, rolling) at a
   gentle level.
3. **[Why It's Worth It](03-why-its-worth-it.md)** — small frequent releases, fast feedback, rollback
   confidence — and the one honest catch: a pipeline is only as trustworthy as the tests inside it.

> This guide is the *map*. When you want to build a real one, the follow-up
> [Your First Pipeline with GitHub Actions](/guides/your-first-pipeline-github-actions) walks you through an
> actual working pipeline, file by file.
