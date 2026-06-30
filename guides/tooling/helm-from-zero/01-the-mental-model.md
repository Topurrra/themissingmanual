---
title: "The Mental Model: A Chart Is Templated Manifests"
guide: helm-from-zero
phase: 1
summary: "The package manager for Kubernetes: charts template your manifests, values parameterize them per environment, and releases are versioned and rollback-able."
tags: [helm, kubernetes, charts, devops, packaging, templating]
difficulty: intermediate
synonyms: ["what is helm", "helm chart tutorial", "helm install upgrade rollback", "helm vs kustomize", "kubernetes package manager", "helm values.yaml", "helm template gotchas"]
updated: 2026-06-30
---

# The Mental Model: A Chart Is Templated Manifests

Let's start with the pain, because that's where Helm earns its keep. You've got a working app on Kubernetes - a Deployment, a Service, maybe an Ingress. It runs in dev. Now you need it in staging and prod too.

The manifests are nearly identical across environments. What changes is small: the image tag, the number of replicas, the hostname, a memory limit. So the obvious move is to copy the YAML into three folders and hand-edit the differences.

That works for about a week. Then you bump the image tag in dev and prod but forget staging. Or you add an environment variable to one copy and not the others. The three copies drift, and the worst part is you don't find out until something behaves differently in prod than it did in dev. You've turned "deploy my app" into "keep three near-identical piles of YAML in sync by hand," which is a job no human does reliably.

## The one idea: pull the differences into a values file

Here's the whole mental model. A Helm **chart** is your Kubernetes manifests with the parts-that-change pulled out into placeholders, plus a `values.yaml` file that fills those placeholders in.

Instead of three copies of a Deployment, you have **one template** and **one set of values per environment**. The template never changes between environments. Only the values do.

Think of it the way you already think of a function. The template is the function body. The values are the arguments. You don't copy-paste a function for every caller - you call it with different arguments. Helm brings that same idea to YAML.

Here's a normal Kubernetes Deployment, the kind you'd write by hand:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
spec:
  replicas: 2
  template:
    spec:
      containers:
        - name: web
          image: myapp:1.4.0
```

*What just happened:* That's a fine manifest, but `replicas: 2` and `image: myapp:1.4.0` are baked in. To run it in prod with 5 replicas and a different tag, you'd copy the whole file and edit two lines - the exact drift trap we're trying to escape.

Now here's the same thing as a chart template:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ .Release.Name }}-web
spec:
  replicas: {{ .Values.replicaCount }}
  template:
    spec:
      containers:
        - name: web
          image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
```

*What just happened:* The hard-coded numbers became `{{ .Values.something }}` placeholders. The `{{ }}` is Helm's template syntax - at install time, Helm replaces each one with a value. `.Values` reads from your `values.yaml`; `.Release.Name` is the name you give this particular deployment. The shape is identical to the plain manifest; the changeable parts are now inputs.

And the `values.yaml` that feeds it:

```yaml
replicaCount: 2
image:
  repository: myapp
  tag: "1.4.0"
```

*What just happened:* This is the defaults file. The keys here line up with the `.Values.*` references in the template. For prod, you'd keep the same template and supply a different values file with `replicaCount: 5` and `tag: "1.4.1"`. Same body, different arguments.

> The single biggest unlock with Helm is this split: **structure lives in templates, configuration lives in values.** Once a piece of YAML differs between environments, it belongs in `values.yaml`, not hard-coded in the template.

## What's actually in a chart

A chart is a directory with a specific layout. You don't have to memorize it - `helm create` scaffolds it for you - but knowing the four pieces that matter makes everything else click:

```text
mychart/
  Chart.yaml          # name, version, description - the chart's identity card
  values.yaml         # default values that fill the templates
  templates/          # the templated manifests
    deployment.yaml
    service.yaml
  charts/             # other charts this one depends on (subcharts)
```

*What just happened:* `Chart.yaml` is metadata about the chart itself (its name and version). `values.yaml` holds the defaults. `templates/` is where your manifests-with-placeholders live - Helm renders every file in here. `charts/` holds dependencies, which you can ignore until you actually need one. That's the whole structure.

One naming distinction that trips people up: `Chart.yaml` has a `version` (the version of the *chart*) and an `appVersion` (the version of the *app inside it*). They're different things. The chart version goes up when you change the templates; the app version tracks the software you're deploying. Keeping them straight saves confusion later.

## A release is a versioned, named install

Here's the second big idea, and it's the one that makes Helm feel safe.

When you `helm install` a chart, you give that installation a name - say `web-prod`. Helm renders the templates with your values, sends the resulting manifests to Kubernetes, and **records what it sent** as a *release*. A release is a named, versioned snapshot of "this chart, with these values, applied at this time."

When you change a value and run `helm upgrade web-prod`, Helm renders again and records release **revision 2**. The old revision doesn't vanish - Helm remembers it. So when revision 2 turns out to be broken, `helm rollback web-prod 1` puts you back exactly where you were.

```text
revision 1  →  myapp:1.4.0, 2 replicas   (helm install)
revision 2  →  myapp:1.4.1, 2 replicas   (helm upgrade)   ← broken!
revision 3  →  myapp:1.4.0, 2 replicas   (helm rollback web-prod 1)
```

*What just happened:* Each deploy is a numbered revision, and Helm keeps the history. A rollback isn't a frantic re-edit of YAML under pressure - it's one command that re-applies a known-good past revision. This is the difference between "we deployed a bad version" being a five-minute fix versus a midnight incident.

That's the entire foundation. A **chart** is templated manifests plus default values. A **values file** parameterizes the chart per environment. A **release** is a named, versioned install you can upgrade and roll back. Everything in the next phase is the commands that drive these three ideas.

> **For builders:** the values-vs-template split is the same instinct as keeping config out of code and in environment variables. You wouldn't hard-code a database URL in your source; don't hard-code a replica count in a manifest you reuse across environments.

```quiz
[
  {
    "q": "In Helm's mental model, what belongs in values.yaml versus in a template?",
    "choices": [
      "Everything goes in values.yaml; templates are optional",
      "Structure goes in templates; the parts that change per environment go in values",
      "Templates hold the values; values.yaml holds the structure",
      "Both must contain identical copies of every manifest"
    ],
    "answer": 1,
    "explain": "Templates hold the fixed shape of your manifests; values hold the per-environment differences like image tag and replica count."
  },
  {
    "q": "What is a Helm 'release'?",
    "choices": [
      "A published version of a chart on a public repository",
      "The act of running 'helm create'",
      "A named, versioned record of a chart installed with specific values",
      "Another word for the values.yaml file"
    ],
    "answer": 2,
    "explain": "A release is a named install whose revisions Helm tracks, which is exactly what makes rollback possible."
  },
  {
    "q": "Why does copying manifests per environment cause problems?",
    "choices": [
      "Kubernetes rejects duplicate YAML files",
      "The copies drift out of sync because changes don't propagate to every copy",
      "Helm refuses to install more than one copy",
      "YAML cannot be copied between folders"
    ],
    "answer": 1,
    "explain": "Hand-edited copies inevitably drift; one template plus per-environment values keeps the shared structure in a single place."
  }
]
```

[← Overview](_guide.md) | [Phase 2: The Everyday Loop: Install, Upgrade, Rollback](02-the-everyday-loop.md) →
