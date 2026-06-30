---
title: "The pull model: Git as the source of truth"
guide: argo-cd-and-gitops
phase: 1
summary: "Deployment by pull, not push: GitOps makes a Git repo the source of truth for your cluster, and Argo CD continuously reconciles reality to match it."
tags: [argo cd, gitops, kubernetes, ci/cd, deployment, reconciliation]
difficulty: intermediate
synonyms: [argo cd, argocd, gitops, kubernetes gitops, declarative deployment, continuous delivery kubernetes, git as source of truth, cluster drift, self-healing deploys, argo cd tutorial]
updated: 2026-06-30
---

# The pull model: Git as the source of truth

Think about how most teams deploy before GitOps. A pipeline runs, and at the end it reaches into the cluster and *pushes*: `kubectl apply`, a `helm upgrade`, maybe a hand-typed command at 2am during an incident. The cluster does whatever the last push told it. Now ask the uncomfortable question: what's running right now, and who decided that? Often nobody can answer with certainty. The cluster's state and your repo's state have quietly diverged, and the only way to know is to go poke at the live thing.

GitOps flips the direction. Instead of CI pushing into the cluster, a controller *inside* the cluster pulls from Git and makes the cluster match. The repo stops being a record of intentions and becomes the literal, enforced definition of what runs. That one inversion — pull instead of push — is the whole idea. Everything else in this guide is a consequence of it.

## Desired state vs actual state

Kubernetes is already declarative. You don't tell it "start three pods" — you write a Deployment that says `replicas: 3`, and a controller works to make that true and keep it true. If a pod dies, Kubernetes notices the gap between desired (3) and actual (2) and starts a replacement. That gap-closing behavior has a name: a **reconciliation loop**.

GitOps extends that loop one level up. The desired state is now a set of YAML files in a Git repo. The actual state is the live cluster. Argo CD is the controller that watches both and works to close any gap between them.

```text
   Git repo  ──────────►  Argo CD  ──────────►  Kubernetes cluster
   (desired)              (compares,            (actual)
                           reconciles)
        ▲                                              │
        └──────────────  reads back actual  ◄──────────┘
```

*What just happened:* desired state flows one way (Git → Argo CD → cluster), and Argo CD reads the cluster back to compare. Nothing pushes into the cluster from outside; the controller pulls.

The two states get compared constantly, and the comparison produces a status you'll live by:

- **Synced** — the cluster matches Git. All is well.
- **OutOfSync** — the cluster has drifted from Git, or Git has new commits the cluster hasn't applied yet.

## Push vs pull, side by side

The difference sounds academic until you see what each makes easy.

```text
PUSH (classic CI/CD)
  CI pipeline  ──has cluster credentials──►  kubectl apply  ──►  cluster
  Truth: "whatever the last successful pipeline pushed"

PULL (GitOps)
  Git repo  ◄──watches──  Argo CD (in cluster)  ──reconciles──►  cluster
  Truth: "whatever Git says, enforced continuously"
```

*What just happened:* in push, your CI system holds cluster credentials and is the actor. In pull, the cluster holds a read-only token to Git and is its own actor — credentials never leave the cluster's blast radius.

That credential point matters more than it looks. In a push world, every CI runner that can deploy has keys to prod. In a pull world, Argo CD reads Git (often read-only) and acts from *inside* the cluster, so your CI never needs cluster access at all. CI's job shrinks to "build the image, write the new tag into Git." Deployment becomes a Git commit.

> Mental model: GitOps doesn't add a new way to deploy. It removes deploying as a verb. You change Git; the cluster catches up. "Deploy" becomes "merge."

## Why this is worth the trouble

Three properties fall out of the pull model for free, and they're the reason teams adopt it.

**Auditability.** Every change to production is a Git commit — authored, timestamped, reviewed in a pull request. Want to know who changed the replica count and why? It's `git log`, not a forensic dig through cluster history.

**Rollback is `git revert`.** Because Git is the source of truth, undoing a bad deploy is undoing a commit. You don't hunt for the previous image tag or the old config — you revert the commit, and Argo CD reconciles the cluster back to that state. Same mechanism as deploying, run backwards.

**Drift detection and self-healing.** If someone runs `kubectl edit` by hand, the cluster no longer matches Git. Argo CD sees that as OutOfSync and can flag it — or, if you turn on self-heal, quietly undo it. The cluster can't silently drift away from what's reviewed and recorded.

```text
$ argocd app get payments
Name:        payments
Health:      Healthy
Sync Status: OutOfSync   (someone edited the live Deployment)
```

*What just happened:* a manual edit to the live cluster shows up immediately as OutOfSync. Git still says one thing, the cluster says another, and Argo CD refuses to pretend they agree.

## For builders

You don't need GitOps for a hobby cluster you alone touch. It earns its keep the moment more than one person can change production, or the moment "what's actually running?" becomes a question with a scary answer. The payoff is a single, reviewable, revertible record of your infrastructure — and a controller that won't let reality drift away from it behind your back.

```quiz
[
  {
    "q": "What is the defining inversion that GitOps introduces?",
    "choices": [
      "Manifests are written in JSON instead of YAML",
      "A controller inside the cluster pulls desired state from Git, instead of CI pushing into the cluster",
      "Deployments run twice as fast",
      "Kubernetes is replaced by a simpler scheduler"
    ],
    "answer": 1,
    "explain": "GitOps reverses the direction: an in-cluster controller pulls from Git and reconciles, rather than an external pipeline pushing in."
  },
  {
    "q": "In a GitOps setup, how do you roll back a bad deployment?",
    "choices": [
      "SSH into each node and restart services",
      "Run kubectl rollback against the live cluster",
      "Revert the Git commit; Argo CD reconciles the cluster back to that state",
      "Delete the namespace and recreate it by hand"
    ],
    "answer": 2,
    "explain": "Because Git is the source of truth, rollback is git revert — the same reconciliation mechanism, run against an earlier state."
  },
  {
    "q": "Why does the pull model reduce your production credential exposure?",
    "choices": [
      "It encrypts all YAML automatically",
      "CI no longer needs cluster credentials; the controller acts from inside the cluster and only needs to read Git",
      "It disables kubectl entirely",
      "It moves all secrets into the Git history"
    ],
    "answer": 1,
    "explain": "In pull mode, deployment is a Git commit. The cluster's controller reads Git and acts internally, so external CI never needs cluster keys."
  }
]
```

[← Overview](_guide.md) | [Phase 2: Your daily loop →](02-daily-loop.md)
