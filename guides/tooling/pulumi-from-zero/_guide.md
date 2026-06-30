---
title: "Pulumi, From Zero"
guide: pulumi-from-zero
phase: 0
summary: "Infrastructure as actual code: define cloud resources in TypeScript, Python, or Go, with real loops and functions, while Pulumi tracks state like Terraform."
tags: [pulumi, iac, infrastructure-as-code, devops, cloud, typescript, python]
category: tooling
group: "Infrastructure as Code"
order: 25
difficulty: intermediate
synonyms: [pulumi tutorial, pulumi vs terraform, infrastructure as code typescript, pulumi python, pulumi state, pulumi stack, iac general purpose language]
updated: 2026-06-30
---

# Pulumi, From Zero

You already know a programming language. You can write a loop, pull a value into a variable, factor a repeated thing into a function. Then you open a Terraform file and all of that goes out the window: a new syntax, `count` and `for_each` instead of loops, string-templated logic that fights you. Pulumi's bet is that you should keep the language you know and aim it at the cloud.

This guide shows you what Pulumi actually is, how the daily loop works (`preview`, `up`, `destroy`), and where giving yourself a full programming language quietly hands you enough rope to hurt yourself.

## How to read this

Read the phases in order the first time. Phase 1 builds the mental model so the commands in phase 2 aren't magic. Phase 3 is the part you'll come back to once you've shipped something and hit a wall. If you've used Terraform, you'll find the ideas familiar and the trade-offs are the interesting part.

## The phases

1. [What Pulumi actually is](01-what-pulumi-actually-is.md) — the mental model: a real language describing a desired state, plus a state file and a diff engine.
2. [The everyday loop](02-the-everyday-loop.md) — projects, stacks, config, and the `preview`/`up`/`destroy` rhythm you'll live in.
3. [Where the rope gets you](03-where-the-rope-gets-you.md) — the gotchas a general-purpose language invites, and when to reach for Pulumi over HCL.

[Phase 1: What Pulumi actually is](01-what-pulumi-actually-is.md) →
