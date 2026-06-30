---
title: "The Everyday Loop: Install, Upgrade, Rollback"
guide: helm-from-zero
phase: 2
summary: "The package manager for Kubernetes: charts template your manifests, values parameterize them per environment, and releases are versioned and rollback-able."
tags: [helm, kubernetes, charts, devops, packaging, templating]
difficulty: intermediate
synonyms: ["what is helm", "helm chart tutorial", "helm install upgrade rollback", "helm vs kustomize", "kubernetes package manager", "helm values.yaml", "helm template gotchas"]
updated: 2026-06-30
---

# The Everyday Loop: Install, Upgrade, Rollback

You understand the three ideas now: chart, values, release. This phase is the muscle memory — the handful of commands you'll actually run, in the order you'll run them. None of them is complicated. The skill is knowing which one to reach for and what it does to your release history.

## Scaffold a chart

You rarely write a chart from a blank file. `helm create` gives you a working starter chart you trim down:

```console
$ helm create myapp
Creating myapp

$ ls myapp
Chart.yaml  charts  templates  values.yaml
```

*What just happened:* Helm generated the standard chart layout from the last phase, pre-filled with a sample Deployment, Service, and a sensible `values.yaml`. The generated chart is more than most apps need — treat it as a starting point to delete from, not a sacred template. Open `templates/deployment.yaml` and you'll see the same `{{ .Values.* }}` placeholders you already understand.

## Render before you ship: helm template

Before sending anything to a cluster, see what Helm will actually produce. `helm template` renders the chart locally and prints the final YAML — no cluster involved:

```console
$ helm template myapp ./myapp
---
# Source: myapp/templates/service.yaml
apiVersion: v1
kind: Service
metadata:
  name: myapp
...
---
# Source: myapp/templates/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
spec:
  replicas: 1
...
```

*What just happened:* Helm filled in every placeholder using the defaults in `values.yaml` and printed the manifests it would send to Kubernetes — the placeholders are gone, replaced by real values. This is your read-before-you-commit step. If the output looks wrong here, it'll be wrong in the cluster. Get in the habit of running this whenever you change a template.

## Install: create a release

`helm install` renders the chart and applies it to your cluster, recording the result as a named release:

```console
$ helm install web ./myapp
NAME: web
LAST DEPLOYED: Mon Jun 30 09:14:02 2026
NAMESPACE: default
STATUS: deployed
REVISION: 1
```

*What just happened:* `web` is the **release name** you chose — every command from here on refers to this release by that name. `REVISION: 1` is the key line: this is the first version of the release. Helm rendered the templates with the default values, sent the manifests to the cluster, and stored revision 1 in its history.

To install the same chart with different settings, point Helm at a values file or override individual keys on the command line:

```console
$ helm install web-prod ./myapp -f values-prod.yaml --set image.tag=1.4.1
```

*What just happened:* `-f values-prod.yaml` layers a prod-specific values file on top of the chart's defaults; `--set image.tag=1.4.1` overrides one key inline. This is the per-environment story in action: **same chart, different values, different release name.** Values from `-f` and `--set` win over the chart's `values.yaml`, and `--set` wins over `-f` — later sources override earlier ones.

> Keep one values file per environment (`values-dev.yaml`, `values-prod.yaml`) checked into git. Reserve `--set` for one-off overrides and CI-injected values like the image tag. A `--set` that should have been permanent is a value you'll forget you applied.

## See what's running

Two commands answer "what's deployed and is it healthy":

```console
$ helm list
NAME      NAMESPACE  REVISION  STATUS    CHART        APP VERSION
web       default    1         deployed  myapp-0.1.0  1.16.0
web-prod  default    1         deployed  myapp-0.1.0  1.4.1

$ helm status web
NAME: web
STATUS: deployed
REVISION: 1
```

*What just happened:* `helm list` shows every release in the namespace with its current revision and status — your inventory of what Helm manages. `helm status web` zooms into one release. If a release ever shows a status other than `deployed` (like `failed` or `pending-upgrade`), that's your signal something went sideways during the last operation.

## Upgrade: change a release

When you ship a new image tag or tweak a value, you `helm upgrade` the existing release — you do **not** install again:

```console
$ helm upgrade web ./myapp --set image.tag=1.4.1
NAME: web
STATUS: deployed
REVISION: 2
```

*What just happened:* Helm re-rendered the chart with the new tag and applied the diff to the cluster. The crucial detail is `REVISION: 2` — Helm bumped the revision and kept revision 1 in history. Upgrade is the workhorse: nearly every deploy after the first is an upgrade.

A safer habit is `helm upgrade --install` (often written `helm upgrade -i`):

```console
$ helm upgrade --install web ./myapp --set image.tag=1.4.1
```

*What just happened:* This upgrades the release if it exists, or installs it if it doesn't. It's the standard command in CI pipelines because it works whether or not the release is already there — no need to branch on "first deploy versus later deploy." One command for both cases.

## Inspect history and roll back

Helm keeps the revision history, and that history is what makes rollback trivial:

```console
$ helm history web
REVISION  STATUS      CHART        APP VERSION  DESCRIPTION
1         superseded  myapp-0.1.0  1.16.0       Install complete
2         deployed    myapp-0.1.0  1.4.1        Upgrade complete
```

*What just happened:* `superseded` means an older revision that's been replaced; `deployed` is the live one. This is the audit trail — you can see exactly what each revision was and when it landed.

Now suppose revision 2 is broken. You don't dig through git or hand-edit YAML under pressure. You roll back:

```console
$ helm rollback web 1
Rollback was a success! Happy Helming!

$ helm history web
REVISION  STATUS      CHART        APP VERSION  DESCRIPTION
1         superseded  myapp-0.1.0  1.16.0       Install complete
2         superseded  myapp-0.1.0  1.4.1        Upgrade complete
3         deployed    myapp-0.1.0  1.16.0       Rollback to 1
```

*What just happened:* `helm rollback web 1` re-applied the exact state of revision 1 — and recorded it as a **new** revision 3. Notice rollback doesn't delete history or rewind the counter; it moves forward to a state identical to a past one. Run `helm rollback web` with no number and it goes to the immediately previous revision. This is the payoff of the release model: recovery is one command, and the trail stays intact.

## Tear down

When you're done with a release, remove it and everything it created:

```console
$ helm uninstall web
release "web" uninstalled
```

*What just happened:* Helm deleted every resource it created for the `web` release — the Deployment, Service, and so on — in one shot. No hunting down individual objects with `kubectl delete`. Because Helm tracked exactly what it installed, it knows exactly what to remove.

That's the full daily loop: `create` to scaffold, `template` to preview, `install` for the first deploy, `upgrade` (or `upgrade --install`) for every change, `history` and `rollback` when something breaks, `uninstall` to clean up. Six commands cover almost everything you'll do.

> **In the wild:** most teams never run `helm install` by hand after the first day. CI runs `helm upgrade --install` on every merge, with the image tag injected via `--set`. Humans mostly run `helm list`, `helm history`, and the occasional `helm rollback` when a deploy goes wrong.

```quiz
[
  {
    "q": "You changed the image tag and want to apply it to an already-running release. Which command?",
    "choices": [
      "helm install web ./myapp",
      "helm upgrade web ./myapp",
      "helm create web",
      "helm template web ./myapp"
    ],
    "answer": 1,
    "explain": "Existing releases are changed with helm upgrade, which bumps the revision and keeps history. Re-running install would error because the release already exists."
  },
  {
    "q": "What does 'helm rollback web 1' do to the revision history?",
    "choices": [
      "Deletes revisions 2 and 3 and rewinds to revision 1",
      "Edits revision 1 in place",
      "Re-applies revision 1's state and records it as a new revision",
      "Uninstalls the release entirely"
    ],
    "answer": 2,
    "explain": "Rollback moves forward: it creates a new revision identical to the target, preserving the full history rather than rewinding the counter."
  },
  {
    "q": "Why is 'helm upgrade --install' the common choice in CI pipelines?",
    "choices": [
      "It skips the cluster and only renders locally",
      "It installs if the release is absent and upgrades if it exists, so one command handles both",
      "It deletes the release before reinstalling",
      "It is the only command that accepts --set"
    ],
    "answer": 1,
    "explain": "The flag makes the command idempotent across first-deploy and later-deploy, so the pipeline needs no special-casing."
  }
]
```

[← Phase 1: The Mental Model](01-the-mental-model.md) | [Overview](_guide.md) | [Phase 3: Where It Bites: Templating Gotchas and When Not to Use Helm](03-where-it-bites.md) →
