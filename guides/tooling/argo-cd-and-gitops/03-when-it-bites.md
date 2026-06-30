---
title: "Argo CD and GitOps"
guide: argo-cd-and-gitops
phase: 3
summary: "Deployment by pull, not push: GitOps makes a Git repo the source of truth for your cluster, and Argo CD continuously reconciles reality to match it."
tags: [argo cd, gitops, kubernetes, ci/cd, deployment, reconciliation]
difficulty: intermediate
synonyms: [argo cd, argocd, gitops, kubernetes gitops, declarative deployment, continuous delivery kubernetes, git as source of truth, cluster drift, self-healing deploys, argo cd tutorial]
updated: 2026-06-30
---

# When reconciliation bites: drift, waves, and secrets

GitOps is calm right up until it isn't. The same reconciliation loop that quietly keeps your cluster correct will, in the wrong situation, fight you, loop forever, or refuse to deploy in the order you needed. None of these are bugs — they're the loop doing exactly what you told it, when what you told it was incomplete. This phase is the set of gotchas that turn a 3am page into a 30-second fix once you've seen them before.

## Self-heal: the feature that fights you

`selfHeal: true` is wonderful — until you're mid-incident and trying to hand-patch the live cluster to test a theory. You `kubectl edit` the Deployment, and seconds later Argo CD reverts your change, because to it, your edit *is* drift. You and the controller are now in a quiet tug-of-war, and the controller never tires.

```console
$ kubectl scale deploy/payments --replicas=10   # emergency scale-up by hand
deployment.apps/payments scaled
# ...moments later, Argo CD reconciles...
$ kubectl get deploy payments
NAME       READY
payments   3/3                                   # back to what Git says
```

*What just happened:* self-heal saw the live replica count (10) diverge from Git (3) and pulled it back. Your manual change evaporated. The fix isn't to disable self-heal in a panic — it's to make the change *in Git*, or temporarily disable auto-sync for that one app:

```console
$ argocd app set payments --sync-policy none   # pause automation
# ...do your manual experiment, then re-enable...
$ argocd app set payments --sync-policy automated
```

The lesson: in a self-heal world, the cluster is read-only to humans. The keyboard you type production changes on is the one that edits Git. Treat any live edit as temporary at best.

## Sync waves: order is not free

A naive sync applies everything in a commit at once. Usually fine. But some resources *must* come up before others: a database migration Job before the app that needs the new schema, a namespace before the things inside it, a CRD before the custom resources that use it. Apply them all at once and the dependents fail because what they need isn't ready yet.

Argo CD orders a sync with **sync waves** — an annotation that sorts resources into ordered groups. Lower waves apply (and become healthy) before higher waves start.

```yaml
metadata:
  annotations:
    argocd.argoproj.io/sync-wave: "1"   # runs before wave 2
```

```text
Wave 0:  Namespace, CRDs            (foundations)
Wave 1:  ConfigMap, Secret, DB Job  (prerequisites)
Wave 2:  Deployment, Service        (the app itself)
```

*What just happened:* Argo CD applies wave 0, waits for it to be healthy, then wave 1, then wave 2. The migration Job (wave 1) finishes before the Deployment (wave 2) starts, so the app never boots against an un-migrated database.

There's a sharp variant: **hooks**, like a `PreSync` Job that must succeed before the rest applies. Use them for things that should run *every* deploy — a migration, a smoke test — not only on first creation. The trap is leaving a hook Job around so it can't recreate; annotate hooks with a delete policy so they clean up, or the next sync stalls on a leftover.

## Pruning: the blast radius of deleting a file

`prune: true` means "if it's gone from Git, delete it from the cluster." That's the correct, tidy behavior — and also a foot-gun. Delete the wrong folder in a refactor, merge it, and Argo CD will faithfully delete the corresponding live resources. The source of truth said remove them, so it removed them.

Two guardrails are worth knowing:

- **Review prune carefully.** A diff that *removes* manifests is a diff that *deletes production resources*. Treat deletions in infra PRs with the same care as a `DROP TABLE`.
- **`Prune=false` on the resource you can't afford to lose.** A PersistentVolumeClaim, for instance, can carry a `Prune=false` annotation so an accidental removal from Git leaves the live volume alone.

```yaml
metadata:
  annotations:
    argocd.argoproj.io/sync-options: Prune=false   # never auto-delete this
```

*What just happened:* even if this resource vanishes from Git, Argo CD will report it as out of sync rather than deleting it — buying you a human decision before data disappears.

## Secrets: the one thing you can't commit raw

Here's the contradiction at the center of GitOps: everything lives in Git, but database passwords and API keys absolutely cannot live in Git in plaintext. A public repo would leak them; even a private one bakes them into history forever. So how do secrets fit the "Git is the source of truth" model?

The answer is to commit secrets *encrypted*, so what's in Git is useless without a key the cluster holds. The common approaches:

- **Sealed Secrets** — you encrypt a secret with a public key into a `SealedSecret` that's safe to commit; only the controller in the cluster can decrypt it. The encrypted blob is your Git-tracked desired state.
- **External Secrets Operator** — Git holds only a *reference* ("fetch `prod/db-password` from Vault/AWS Secrets Manager"), and an operator pulls the real value into the cluster at runtime.

```text
Git (committed, safe):  SealedSecret { encryptedData: AgB7x9...== }
                                   │  Argo CD applies it
                                   ▼
Cluster controller decrypts ──►  Secret { password: <plaintext> }  (never in Git)
```

*What just happened:* the encrypted form is the source of truth in Git and reconciles like any other resource. Decryption happens only inside the cluster, so the secret's plaintext never appears in a commit, a PR, or a repo's history.

> The wrong fix is to apply secrets out-of-band with `kubectl` and leave them out of Git. Now you've reintroduced exactly the drift GitOps exists to kill — a piece of production state that isn't in the source of truth and that self-heal can't protect. Encrypt and commit; don't smuggle.

## Stuck OutOfSync forever

A maddening failure mode: an app that's perpetually OutOfSync no matter how often it syncs. Usually it's not a sync problem at all — it's that something *else* is mutating the resource after Argo CD applies it. A mutating admission webhook injects a sidecar, an autoscaler rewrites the replica count, a defaulting controller adds fields. Argo CD applies Git's version, the other actor changes it back, and the loop never converges.

The fix is to tell Argo CD to *ignore* the field that legitimately differs, so it stops counting a managed difference as drift:

```yaml
spec:
  ignoreDifferences:
    - group: apps
      kind: Deployment
      jsonPointers:
        - /spec/replicas        # an autoscaler owns this; don't fight it
```

*What just happened:* Argo CD now reconciles everything *except* `replicas`, leaving that field to the autoscaler. The endless OutOfSync tug-of-war stops because the two actors no longer claim ownership of the same field.

This is the deeper lesson of running GitOps in production: the reconciliation loop assumes Argo CD is the *only* writer. Wherever something else also writes — autoscalers, webhooks, operators — you have to draw an explicit boundary, or the loop spins forever trying to win a fight it was never meant to be in. If your cluster's foundations feel shaky underneath all this, /guides/kubernetes-without-the-hype is the place to firm them up.

```quiz
[
  {
    "q": "You hand-edit a live Deployment during an incident and Argo CD keeps reverting it. Why?",
    "choices": [
      "The cluster is out of disk space",
      "selfHeal treats your manual edit as drift and reconciles the cluster back to Git",
      "Your kubectl context is wrong",
      "Argo CD has crashed and is restarting"
    ],
    "answer": 1,
    "explain": "With selfHeal on, any divergence from Git — including your manual edit — is drift, so Argo CD pulls it back. Change Git, or pause auto-sync."
  },
  {
    "q": "A migration Job must finish before the app Deployment starts. What ensures that order?",
    "choices": [
      "Listing the Job first in the YAML file",
      "Sync waves (or a PreSync hook) — lower waves apply and become healthy before higher waves",
      "Running two separate Applications",
      "Setting prune: false on the Deployment"
    ],
    "answer": 1,
    "explain": "Sync waves sort resources into ordered groups; Argo CD waits for each wave to be healthy before starting the next."
  },
  {
    "q": "How do secrets fit the 'everything in Git' model without leaking?",
    "choices": [
      "Commit them in plaintext but only to a private repo",
      "Apply them with kubectl and keep them out of Git",
      "Commit them encrypted (e.g. Sealed Secrets), or commit only a reference the cluster resolves at runtime",
      "Base64-encode them, which is encryption"
    ],
    "answer": 2,
    "explain": "Git holds the encrypted form or a reference; the cluster decrypts or fetches the real value, so plaintext never lands in a commit."
  }
]
```

[← Phase 2: Your daily loop](02-daily-loop.md) | [Overview](_guide.md)
