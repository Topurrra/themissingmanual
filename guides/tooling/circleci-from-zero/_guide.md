---
title: "CircleCI, From Zero"
guide: circleci-from-zero
phase: 0
summary: "Cloud-native CI/CD with config.yml: jobs, workflows, executors, and orbs - fast parallel pipelines without running your own server."
tags: [circleci, ci, cd, pipelines, devops, yaml]
category: tooling
group: "CI/CD"
order: 20
difficulty: intermediate
synonyms: ["circleci tutorial", "circleci config.yml", "circleci workflows", "circleci orbs", "circleci vs github actions", "how does circleci work"]
updated: 2026-06-30
---

# CircleCI, From Zero

You pushed a branch, opened a pull request, and now a little status check is spinning in the corner. Someone set that up months ago, it lives in a file called `.circleci/config.yml`, and when it goes red nobody quite knows why. This guide turns that file from a black box into something you can read, edit, and trust.

CircleCI runs your tests and builds in the cloud every time you push. You describe what should happen in one YAML file; CircleCI rents fresh machines, runs your commands, and reports back. No build server to patch, no Jenkins to babysit at 2am. The cost is that you learn one specific way of describing work - and that's exactly what we'll do here.

## How to read this

Read the phases in order; each one builds the mental model the next assumes. If you've never touched a CI system at all, skim [What CI/CD does](/guides/what-cicd-does) first so the *why* is already in place. If you know GitHub Actions, you already understand the shape of the problem - CircleCI names the pieces differently, and we'll call out the mapping as we go.

## The phases

1. [The four nouns: jobs, executors, steps, workflows](01-the-four-nouns.md) - the mental model of how a CircleCI pipeline is actually built.
2. [Writing a real config: caching, orbs, and fan-out](02-writing-a-real-config.md) - how you use it day to day to get fast, readable pipelines.
3. [When it breaks: flaky tests, slow builds, and managed-CI tradeoffs](03-when-it-breaks.md) - the gotchas, parallelism, and the limits of someone else's infrastructure.

[Phase 1: The four nouns: jobs, executors, steps, workflows](01-the-four-nouns.md) →
