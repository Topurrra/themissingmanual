---
title: "Helm, From Zero"
guide: helm-from-zero
phase: 0
summary: "The package manager for Kubernetes: charts template your manifests, values parameterize them per environment, and releases are versioned and rollback-able."
tags: [helm, kubernetes, charts, devops, packaging, templating]
category: tooling
group: "Containers & Orchestration"
order: 21
difficulty: intermediate
synonyms: ["what is helm", "helm chart tutorial", "helm install upgrade rollback", "helm vs kustomize", "kubernetes package manager", "helm values.yaml", "helm template gotchas"]
updated: 2026-06-30
---

# Helm, From Zero

You have a Deployment, a Service, a ConfigMap, and an Ingress. Now you need them in dev, staging, and prod - same shape, different image tags, different replica counts, different hostnames. So you copy the YAML three times and pray you remember to change every value in every copy. You won't. Something drifts, and the bug only shows up in prod.

Helm is the way out. A chart is your manifests with the per-environment parts pulled out into a `values.yaml` file. One template, many environments. And every deploy becomes a versioned *release* you can roll back with a single command. This guide gets you from "what even is a chart" to shipping and rolling back with confidence - and knowing when Helm is the wrong tool.

## How to read this

Go in order. Phase 1 builds the mental model: what a chart actually is and the problem it solves, so the commands later feel obvious instead of magic. Phase 2 is the everyday loop - `install`, `upgrade`, `rollback`, values, releases - the stuff you'll run every day. Phase 3 is where it bites: templating gotchas, the `--dry-run` habit that saves you, and the clear-eyed call on Helm vs Kustomize vs plain manifests.

If Kubernetes itself is still fuzzy, read [Kubernetes Without the Hype](/guides/kubernetes-without-the-hype) first - Helm only makes sense once you know what a Deployment and a Service are.

## The phases

1. [The Mental Model: A Chart Is Templated Manifests](01-the-mental-model.md) - what a chart is, why values exist, what a release is.
2. [The Everyday Loop: Install, Upgrade, Rollback](02-the-everyday-loop.md) - the commands you run daily and how releases get tracked.
3. [Where It Bites: Templating Gotchas and When Not to Use Helm](03-where-it-bites.md) - whitespace, dry-runs, and Helm vs Kustomize vs raw YAML.

[Phase 1: The Mental Model: A Chart Is Templated Manifests](01-the-mental-model.md) →
