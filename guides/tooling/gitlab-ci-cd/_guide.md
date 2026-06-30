---
title: "GitLab CI/CD, From Zero"
guide: gitlab-ci-cd
phase: 0
summary: "Pipelines defined in .gitlab-ci.yml: stages, jobs, and runners that build, test, and deploy on every push — with artifacts, caching, and environments."
tags: [gitlab, ci, cd, pipelines, devops, automation]
category: tooling
group: "CI/CD"
order: 17
difficulty: intermediate
synonyms: ["gitlab ci", "gitlab pipelines", ".gitlab-ci.yml", "gitlab runner", "gitlab cd", "ci cd gitlab", "gitlab stages jobs"]
updated: 2026-06-30
---

# GitLab CI/CD, From Zero

You pushed a branch and someone said "wait for the pipeline." A wall of green and red dots appeared, a YAML file you didn't write decided whether your code was allowed to merge, and nobody could explain why the deploy button was grayed out. That confusion is normal, and it clears up fast once you see the shape underneath it. GitLab CI/CD is one file, a handful of ideas, and a machine that runs your commands for you. This guide gets you to the point where you can read any `.gitlab-ci.yml`, write one from scratch, and know what to do when it goes red.

## How to read this

Go in order. Phase 1 builds the mental model: stages, jobs, runners, and the single file that wires them together — read this even if you've copied a pipeline before, because the model is what makes the rest stick. Phase 2 is the everyday toolkit you'll actually type: passing files between jobs, caching dependencies, and controlling when each job runs. Phase 3 is production reality: environments, manual deploy gates, secrets, and the failures that wake people up. Each phase ends with a short quiz so you can check yourself before moving on.

## The phases

1. [Phase 1: The Mental Model — One File, A Pipeline, A Machine](01-the-mental-model.md)
2. [Phase 2: The Everyday Core — Artifacts, Cache, and Rules](02-artifacts-cache-rules.md)
3. [Phase 3: Production Reality — Environments, Gates, and Secrets](03-environments-gates-secrets.md)

[Phase 1: The Mental Model — One File, A Pipeline, A Machine](01-the-mental-model.md) →
