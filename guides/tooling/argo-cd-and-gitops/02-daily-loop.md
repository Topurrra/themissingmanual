---
title: "Argo CD and GitOps"
guide: argo-cd-and-gitops
phase: 2
summary: "Deployment by pull, not push: GitOps makes a Git repo the source of truth for your cluster, and Argo CD continuously reconciles reality to match it."
tags: [argo cd, gitops, kubernetes, ci/cd, deployment, reconciliation]
difficulty: intermediate
synonyms: [argo cd, argocd, gitops, kubernetes gitops, declarative deployment, continuous delivery kubernetes, git as source of truth, cluster drift, self-healing deploys, argo cd tutorial]
updated: 2026-06-30
---

# Your daily loop: apps, sync, and rollback

You've got the mental model. Now the practical question: what do you actually touch day to day? Almost less than you'd expect. The whole point of GitOps is that your normal workflow is editing files and merging pull requests — Argo CD does the rest. But you'll lean on a handful of concepts and commands often enough that they should become reflex. This phase walks the loop you'll run dozens of times a week.

## The Application is the unit of work

In Argo CD, the thing you manage is an **Application**. It's a small piece of config that answers three questions: *where does the desired state live, what's in it, and where does it go?*

- **source** — the Git repo, a path inside it, and a revision (a branch, tag, or commit).
- **destination** — the cluster and namespace to deploy into.
- **syncPolicy** — whether Argo CD applies changes automatically or waits for you.

Here's a minimal one as YAML, which itself usually lives in Git:

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: payments
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/acme/infra.git
    targetRevision: main          # track this branch
    path: apps/payments           # folder of manifests in the repo
  destination:
    server: https://kubernetes.default.svc
    namespace: payments
  syncPolicy:
    automated:
      prune: true                 # delete resources removed from Git
      selfHeal: true              # undo manual cluster edits
```

*What just happened:* this tells Argo CD to watch `apps/payments` on the `main` branch and keep the `payments` namespace matching it — automatically, including deleting things you remove from Git (`prune`) and reverting manual edits (`selfHeal`).

Notice the Application is *itself* a Kubernetes resource. That leads to a common pattern: one root Application that points at a folder of other Applications, so adding a new app to the cluster is — you guessed it — a Git commit. That's the "app of apps" pattern, and it's how teams scale to dozens of services without clicking around a UI.

## The sync: making the cluster match Git

A **sync** is the act of applying Git's desired state to the cluster. With `automated` syncPolicy, Argo CD syncs on its own whenever it detects a new commit (it polls the repo on an interval, or reacts instantly if you wire up a webhook). With manual policy, you trigger it yourself — useful when you want a human to press the button on prod.

The everyday CLI rhythm:

```console
$ argocd app get payments
Name:        payments
Health:      Healthy
Sync Status: OutOfSync  (main is 1 commit ahead)

$ argocd app sync payments
Syncing... apps/payments
  Deployment/payments  configured
  Service/payments     unchanged

$ argocd app get payments
Sync Status: Synced
Health:      Healthy
```

*What just happened:* `get` showed the cluster was a commit behind Git. `sync` applied that commit, changing only what differed (the Deployment), and left untouched what already matched (the Service). The status flipped to Synced.

Two status fields ride along and you read both constantly:

- **Sync Status** — does the cluster match Git? (Synced / OutOfSync)
- **Health** — are the running resources actually OK? (Healthy / Progressing / Degraded)

They're independent, and the difference matters. A freshly-applied Deployment can be **Synced** (Git applied successfully) but **Progressing** or **Degraded** because the new pods are crash-looping. Synced means "Git was applied"; Health means "the result is working." Watch both — Synced-but-Degraded is exactly the state a broken deploy lives in.

## The deploy flow, end to end

Putting it together, here's how a real change rides to production:

```text
1. Build:   CI builds image  acme/payments:v1.4.2
2. Promote: CI commits to infra repo, bumping the image tag in apps/payments
3. Detect:  Argo CD sees the new commit on main  → OutOfSync
4. Sync:    Argo CD applies it (auto, or you click)  → rolling update
5. Verify:  Health goes Progressing → Healthy
```

*What just happened:* CI's only job is steps 1–2 — build the image and write the new tag into Git. From step 3 on, Argo CD owns the deploy. Your CI system never touched the cluster; it touched a file.

> Keep image tags immutable and specific. Pin `acme/payments:v1.4.2` (or a digest), never `:latest`. If Git says `:latest`, two syncs can produce two different clusters from the same commit — which quietly destroys the "Git is the source of truth" guarantee. See /guides/what-cicd-does for where tag promotion fits in the pipeline.

## Rollback: deploy in reverse

Something's wrong in prod. In a push world you'd scramble for the previous tag. Here, rollback is the same loop pointed backward — and you have two clean ways to do it.

The GitOps-pure way is to revert the commit. Argo CD reconciles the cluster to the reverted state, and your Git history stays honest about what happened:

```console
$ git revert a1b2c3d        # undo the bad deploy commit
$ git push
# Argo CD detects the new commit and syncs the cluster back
```

*What just happened:* the revert creates a *new* commit that undoes the bad one. The cluster follows Git back to the good state, and the revert is recorded — your history shows both the break and the fix.

Argo CD also keeps a deploy history and can roll back directly, handy when prod is on fire and you want speed before tidiness:

```console
$ argocd app history payments
ID  DATE                 REVISION
3   2026-06-30 14:02     a1b2c3d (bad)
2   2026-06-29 09:10     9f8e7d6 (good)

$ argocd app rollback payments 2
Rolled back to revision 9f8e7d6
```

*What just happened:* Argo CD re-applied the manifests from history entry 2, instantly. But note the catch: the live cluster now matches an *old* commit while `main` still points at the bad one, so the app reads OutOfSync. Use this to stop the bleeding, then revert in Git to make the source of truth agree again. The Git revert is the durable fix; the CLI rollback is the fire extinguisher.

## In the wild

Most teams structure the infra repo so each environment is a folder or branch (`apps/payments` for staging, a separate path or repo for prod), and "promoting" a release means copying the tested image tag from one to the other in a reviewed PR. The deploy, the promotion, and the rollback all become the one operation you already know how to review: a change to a file in Git.

```quiz
[
  {
    "q": "What does an Argo CD Application define?",
    "choices": [
      "The CI pipeline steps for building an image",
      "A source (repo/path/revision), a destination (cluster/namespace), and a sync policy",
      "The Dockerfile for a service",
      "The list of developers allowed to deploy"
    ],
    "answer": 1,
    "explain": "An Application maps a Git source to a cluster destination and says how to sync them — it's the unit Argo CD reconciles."
  },
  {
    "q": "An app shows Sync Status: Synced but Health: Degraded. What does that mean?",
    "choices": [
      "Git failed to apply to the cluster",
      "Git was applied successfully, but the running resources are unhealthy (e.g. pods crash-looping)",
      "The repo URL is wrong",
      "Argo CD is offline"
    ],
    "answer": 1,
    "explain": "Sync Status and Health are independent. Synced means Git was applied; Degraded means the result isn't working."
  },
  {
    "q": "Why is pinning an immutable image tag (not :latest) important in GitOps?",
    "choices": [
      "It makes pulls faster",
      "It's required by Kubernetes",
      "With :latest, the same Git commit can produce different clusters on different syncs, breaking the source-of-truth guarantee",
      "It reduces the size of the manifest"
    ],
    "answer": 2,
    "explain": "If Git says :latest, two syncs of the same commit may run different images — so Git no longer fully determines cluster state."
  }
]
```

[← Phase 1: The pull model](01-the-pull-model.md) | [Overview](_guide.md) | [Phase 3: When reconciliation bites →](03-when-it-bites.md)
