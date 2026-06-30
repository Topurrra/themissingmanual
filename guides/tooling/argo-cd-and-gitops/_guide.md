---
title: "Argo CD and GitOps"
guide: argo-cd-and-gitops
phase: 0
summary: "Deployment by pull, not push: GitOps makes a Git repo the source of truth for your cluster, and Argo CD continuously reconciles reality to match it."
tags: [argo cd, gitops, kubernetes, ci/cd, deployment, reconciliation]
category: tooling
group: "CI/CD"
order: 19
difficulty: intermediate
synonyms: [argo cd, argocd, gitops, kubernetes gitops, declarative deployment, continuous delivery kubernetes, git as source of truth, cluster drift, self-healing deploys, argo cd tutorial]
updated: 2026-06-30
---

# Argo CD and GitOps

You ship a change to Kubernetes, and a week later nobody can say for sure what's actually running. Someone hot-patched a replica count by hand, a config map drifted, and the cluster no longer matches anything you can point at. GitOps fixes the trust problem: the desired state of your cluster lives in Git, and a controller named Argo CD watches that repo and quietly drags reality back into line whenever it wanders. This guide gives you the mental model and the muscle memory to run it without surprises.

## How to read this

Read the three phases in order. Phase 1 builds the mental model so the rest stops feeling like magic. Phase 2 is the everyday loop: defining an app, syncing, rolling back. Phase 3 is where it bites - drift, sync waves, secrets, and the failures you'll actually be paged for. If you've never run Kubernetes, skim /guides/kubernetes-without-the-hype first; if "CI vs CD" is fuzzy, /guides/what-cicd-does sets the frame.

## The phases

1. [The pull model: Git as the source of truth](01-the-pull-model.md)
2. [Your daily loop: apps, sync, and rollback](02-daily-loop.md)
3. [When reconciliation bites: drift, waves, and secrets](03-when-it-bites.md)

[Phase 1: The pull model: Git as the source of truth](01-the-pull-model.md) →
