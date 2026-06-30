---
title: "kubectl, Day to Day"
guide: kubectl-day-to-day
phase: 0
summary: "The Kubernetes commands you actually use: get/describe/logs/exec to see what's happening, apply to change it, and the debugging loop when a pod won't start."
tags: [kubectl, kubernetes, containers, devops, debugging, cli]
category: tooling
group: "Containers & Orchestration"
order: 22
difficulty: intermediate
synonyms: ["kubectl commands", "kubectl cheat sheet", "kubectl get pods", "kubectl describe", "kubectl logs", "crashloopbackoff", "imagepullbackoff", "kubectl debugging", "kubectl day to day", "how to use kubectl"]
updated: 2026-06-30
---

# kubectl, Day to Day

You don't need to understand all of Kubernetes to be useful with it. You need maybe ten commands, the discipline to read what they tell you, and a debugging loop you can run half-asleep. Most days you are not architecting clusters; you are asking "what is this thing doing right now?" and "why won't it start?" — and answering those is a small, learnable skill.

This guide is the daily driver, not the theory. If a pod is stuck and Slack is getting loud, the commands here are what you reach for.

## How to read this

Read it in order the first time; after that, treat it as a lookup. Phase 1 builds the mental model: kubectl is a typewriter to the cluster's API, and almost everything is a variation on one verb-plus-resource shape. Phase 2 is the handful of commands you'll run hourly. Phase 3 is the debugging loop — the exact sequence for a pod that won't come up. Type the commands as you go; reading them is not the same as feeling them.

If you've never met the moving parts (pods, deployments, namespaces), skim [/guides/kubernetes-without-the-hype](/guides/kubernetes-without-the-hype) first so the nouns aren't a mystery.

## The phases

1. [The mental model: kubectl talks to one API](01-the-mental-model.md)
2. [The commands you actually run](02-the-everyday-commands.md)
3. [When a pod won't start: the debugging loop](03-when-pods-wont-start.md)

[Phase 1: The mental model: kubectl talks to one API](01-the-mental-model.md) →
