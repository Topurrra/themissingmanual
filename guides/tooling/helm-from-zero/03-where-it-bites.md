---
title: "Where It Bites: Templating Gotchas and When Not to Use Helm"
guide: helm-from-zero
phase: 3
summary: "The package manager for Kubernetes: charts template your manifests, values parameterize them per environment, and releases are versioned and rollback-able."
tags: [helm, kubernetes, charts, devops, packaging, templating]
difficulty: intermediate
synonyms: ["what is helm", "helm chart tutorial", "helm install upgrade rollback", "helm vs kustomize", "kubernetes package manager", "helm values.yaml", "helm template gotchas"]
updated: 2026-06-30
---

# Where It Bites: Templating Gotchas and When Not to Use Helm

The commands are the easy part. What actually costs people hours is the templating layer - Helm renders text, and text-templating YAML has sharp edges. This phase is the stuff nobody tells you up front: the gotchas, the habits that catch them early, and the honest answer to "should I even be using Helm here?"

## Helm templates text, not YAML - and that's the root of most pain

Here's the mental shift that explains nearly every Helm headache. Helm's template engine doesn't understand YAML structure. It does **text substitution** and then hands the resulting string to a YAML parser. So indentation, quoting, and whitespace are your problem, not Helm's.

The most common bite is indentation. Say you want to inject a block of labels:

```yaml
metadata:
  labels:
    {{ .Values.labels }}
```

*What just happened:* This looks reasonable and breaks immediately. `.Values.labels` is a map, and dropping it in raw produces something like `map[app:web tier:frontend]` - not valid YAML. Helm renders text; it won't magically format a map into indented YAML keys for you.

The fix uses two built-in functions, `toYaml` and `nindent`:

```yaml
metadata:
  labels:
    {{- toYaml .Values.labels | nindent 4 }}
```

*What just happened:* `toYaml` converts the map into proper YAML text, and `nindent 4` adds a leading newline and indents every line by 4 spaces so it nests correctly under `labels:`. The `{{-` trims the whitespace before the tag so you don't get a stray blank line. This `toYaml | nindent N` pattern is how you inject any map or list - memorize it, because you'll use it constantly.

## Whitespace control: the dash that saves your YAML

Template tags leave behind whitespace and blank lines that quietly corrupt your output. The `-` inside a tag trims it:

```yaml
spec:
  {{- if .Values.enableMetrics }}
  metricsPort: 9090
  {{- end }}
```

*What just happened:* `{{- if ... }}` trims the whitespace and newline *before* the tag, so when the condition is false you don't get an empty line where the block used to be. Without the dashes, conditional blocks leave ragged blank lines that sometimes parse and sometimes don't. The rule of thumb: put `{{-` on control-flow tags (`if`, `range`, `end`) to keep rendered YAML clean. When indentation looks right but YAML still won't parse, suspect whitespace first.

## Always dry-run before you ship

You already met `helm template` for local rendering. Its cluster-aware cousin is `--dry-run`, and it's the single most valuable habit in Helm:

```console
$ helm upgrade --install web ./myapp --set image.tag=1.4.1 --dry-run
NAME: web
STATUS: pending-upgrade
REVISION: 2
HOOKS:
...
MANIFEST:
---
# Source: myapp/templates/deployment.yaml
...
```

*What just happened:* `--dry-run` renders the chart and runs it through the cluster's validation, but applies **nothing**. You see the exact manifests that would be sent and catch errors - a broken template, an invalid value, a typo'd field - before they touch a running system. Pair it with `helm template` for fast local checks and `--dry-run` for the real pre-flight against the cluster.

A close companion is `helm lint`, which checks the chart for structural problems:

```console
$ helm lint ./myapp
==> Linting ./myapp
1 chart(s) linted, 0 chart(s) failed
```

*What just happened:* `helm lint` catches missing required fields, malformed `Chart.yaml`, and common chart mistakes without rendering against any cluster. It's cheap to run in CI as a first gate - if lint fails, there's no point trying to deploy.

## The values-precedence gotcha

When the same key is set in multiple places, Helm has a clear precedence order, and getting it wrong leads to "why isn't my override working?" The order, from lowest to highest priority:

```text
chart's values.yaml   (lowest - the defaults)
   ↓ overridden by
-f myvalues.yaml      (your environment file)
   ↓ overridden by
--set key=value       (highest - inline overrides win)
```

*What just happened:* Higher-priority sources override lower ones for any shared key. So a `--set image.tag=1.4.1` will beat whatever `image.tag` is in your `-f values-prod.yaml`, which beats the chart default. When an override seems ignored, it's almost always because something higher in this order is also setting that key. Multiple `-f` files apply left to right, with the rightmost winning.

## When Helm is the wrong tool

Helm is not free. The templating layer adds a whole syntax between you and your YAML, and for simple cases that's overhead you don't need. Here's the honest decision guide:

```text
Plain manifests (kubectl apply)
  → one app, one environment, rarely changes. No parameterization needed.

Kustomize (kubectl apply -k)
  → a few environments that differ by patches/overlays, and you want to
    keep editing plain YAML with no templating language to learn.

Helm
  → real parameterization (loops, conditionals), you need release tracking
    and rollback, or you're packaging an app for others to install.
```

*What just happened:* The deciding questions are: do you need templating logic (conditionals, loops), and do you need versioned releases with rollback? If both are "no," Helm's syntax is pure cost - reach for Kustomize or plain manifests. If you need an app to be reusable and configurable by people who didn't write it, Helm's packaging and release model is exactly the right fit.

The key contrast with Kustomize: **Kustomize patches plain YAML with overlays - no templating language, the files stay valid Kubernetes manifests.** Helm templates YAML with a real language - more power, more rope. Neither is "better"; they solve different shapes of problem. Many teams use both: Helm for third-party apps they install (databases, ingress controllers), Kustomize for their own services. They are not mutually exclusive.

> **In the wild:** the strongest case for Helm is installing other people's software. When you pull a chart for a database or monitoring stack, you get a tested, parameterized package and a single command to upgrade or roll it back. For your own handful of services, Kustomize overlays are often the lower-friction choice. Match the tool to whether you're *packaging for others* or *configuring for yourself*.

If you want the broader picture of how these manifests fit into a cluster, [Kubernetes Without the Hype](/guides/kubernetes-without-the-hype) covers the objects Helm is templating, and [Docker Without the Magic](/guides/docker-without-the-magic) covers the images those Deployments actually run.

```quiz
[
  {
    "q": "Why does injecting a map directly with {{ .Values.labels }} usually break the YAML?",
    "choices": [
      "Helm forbids maps in values.yaml",
      "Helm does text substitution, so a raw map renders as an invalid string instead of formatted YAML",
      "Maps must always be passed with --set",
      "The labels key is reserved by Kubernetes"
    ],
    "answer": 1,
    "explain": "Helm renders text and lets a YAML parser read the result, so maps and lists need toYaml plus nindent to become valid indented YAML."
  },
  {
    "q": "If the same key is set in the chart's values.yaml, a -f file, and via --set, which value wins?",
    "choices": [
      "The chart's values.yaml",
      "The -f file",
      "The --set value",
      "Helm errors on the conflict"
    ],
    "answer": 2,
    "explain": "Precedence runs values.yaml < -f < --set, so an inline --set overrides both the file and the chart default."
  },
  {
    "q": "When is plain Kustomize a better fit than Helm?",
    "choices": [
      "When you need loops and conditionals in your manifests",
      "When you want versioned releases with one-command rollback",
      "When environments differ by simple patches and you'd rather not learn a templating language",
      "When packaging an app for strangers to install"
    ],
    "answer": 2,
    "explain": "Kustomize patches plain YAML with overlays and adds no templating language; it shines for a few environments differing by patches. Helm earns its cost when you need real templating logic or release tracking."
  }
]
```

[← Phase 2: The Everyday Loop](02-the-everyday-loop.md) | [Overview](_guide.md)
