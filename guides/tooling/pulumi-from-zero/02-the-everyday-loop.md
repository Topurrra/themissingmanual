---
title: "The everyday loop"
guide: pulumi-from-zero
phase: 2
summary: "Infrastructure as actual code: define cloud resources in TypeScript, Python, or Go, with real loops and functions, while Pulumi tracks state like Terraform."
tags: [pulumi, iac, infrastructure-as-code, devops, cloud, typescript, python]
difficulty: intermediate
synonyms: [pulumi tutorial, pulumi vs terraform, infrastructure as code typescript, pulumi python, pulumi state, pulumi stack, iac general purpose language]
updated: 2026-06-30
---

# The everyday loop

Now the day-to-day. You have a folder, you run a couple of commands, resources appear. This phase walks the real rhythm: starting a project, what a stack is, where config and secrets go, and reading the output of `up` so it stops looking like a wall of green text.

## Starting a project

`pulumi new` scaffolds a project from a template. It asks a few questions, drops in starter files, and installs the SDK for your language.

```console
$ mkdir infra && cd infra
$ pulumi new aws-typescript
project name: infra
stack name: dev
aws:region: us-east-1

Created stack 'dev'
Installing dependencies...
```

*What just happened:* you got a runnable project and your first stack, `dev`. The template picked a language (TypeScript), a provider (AWS), and wired up `Pulumi.yaml` plus a `Pulumi.dev.yaml` for that stack's config.

Two files matter most:

```text
Pulumi.yaml         the PROJECT: name, runtime (nodejs/python/go), description
Pulumi.dev.yaml     the STACK:   per-environment config and secrets for "dev"
index.ts            your program: the actual resource declarations
```

*What just happened:* the project file describes the program once; each stack file holds the settings that differ between environments. Same code, different stacks.

## Stacks: one program, many environments

A **stack** is an independent instance of your program with its own state and its own config. `dev`, `staging`, `prod` are three stacks of the *same* code. This is how you avoid copy-pasting infrastructure per environment - you write it once and select a stack.

```console
$ pulumi stack ls
NAME       LAST UPDATE     RESOURCE COUNT
dev*       2 hours ago     7
staging    1 day ago       7
prod       3 days ago      9

$ pulumi stack select prod
```

*What just happened:* `stack ls` listed every stack with its resource count; the `*` marks the one you're on. `stack select prod` switched the active stack, so the next `up` targets production's state and config - not dev's. Always glance at which stack is active before you run anything that mutates.

## Config and secrets

Hard-coding a region or an instance size into your program is the thing you'll regret. Config lets each stack carry its own values. You set them with `pulumi config set` and read them in code.

```console
$ pulumi config set aws:region us-west-2
$ pulumi config set instanceCount 3
$ pulumi config set --secret dbPassword 'S3cr3t!'
```

*What just happened:* the first two went into `Pulumi.dev.yaml` as plain values. The `--secret` flag encrypted `dbPassword` before writing it, so the password never sits in the file as cleartext - it's stored encrypted and only decrypted at deploy time.

Reading config back in your program is ordinary code:

```typescript
import * as pulumi from "@pulumi/pulumi";

const config = new pulumi.Config();
const count = config.requireNumber("instanceCount");   // fails fast if missing
const password = config.requireSecret("dbPassword");   // stays a secret value
```

*What just happened:* `requireNumber` pulled `instanceCount` as a typed number and would error before any deploy if it were absent. `requireSecret` keeps the value marked as secret so Pulumi masks it in logs and stores it encrypted in state.

> Secret values stay encrypted in the stack config and in state, and Pulumi masks them in CLI output. That's strong, but it's not a vault - anyone who can run `pulumi config get --secret` or read decrypted state can see them. Scope who has that access.

## The preview-then-up rhythm

This is the loop you'll run dozens of times a day. Preview to see the plan, then apply.

```console
$ pulumi up
Previewing update (dev)

     Type                  Name           Plan       Info
 +   pulumi:pulumi:Stack   infra-dev      create
 +   ├─ aws:s3:Bucket      data           create
 ~   └─ aws:s3:BucketV2    assets         update     [diff: ~tags]

Resources:
    + 1 to create
    ~ 1 to update
    1 unchanged

Do you want to perform this update? [Use arrows] yes / no
```

*What just happened:* `up` showed the same diff `preview` would, then paused for confirmation. The symbols are worth memorizing: `+` create, `~` update in place, `-` delete, and a `+-` (replace) means the resource must be destroyed and recreated. The `[diff: ~tags]` tells you *which* property changed - here, tags.

Answer `yes` and Pulumi applies, streaming each resource as it completes:

```console
Updating (dev)

 +   aws:s3:Bucket  data    created (1s)
 ~   aws:s3:BucketV2 assets  updated (0.8s)

Outputs:
    dataBucket: "data-9f3c1a0"

Resources:
    + 1 created
    ~ 1 updated

Duration: 6s
```

*What just happened:* resources were created/updated in dependency order, and the `Outputs` block printed values you exported with `export` (TS) or `pulumi.export` (Python). Those outputs are how one stack hands values to a person, a script, or another stack.

In CI you'll skip the prompt with `pulumi up --yes`, and you can run `pulumi preview` as a required check on pull requests so reviewers see the plan before anything merges.

## Tearing down

When a stack has served its purpose:

```console
$ pulumi destroy
$ pulumi stack rm dev
```

*What just happened:* `destroy` deleted every resource the `dev` stack manages (with a preview and confirmation first, same as `up`). `stack rm` then removed the now-empty stack and its state. Order matters - destroy before you remove the stack, or you orphan real resources with no state pointing at them.

## In the wild

A common setup: one Git repo, one Pulumi project, a stack per environment, and `pulumi preview` wired into CI on every PR plus `pulumi up --yes` on merge to the matching branch. Reviewers read the plan in the PR; merging applies it. Same code path for everyone, no console clicking, and the diff is part of the review.

```quiz
[
  {
    "q": "What is a Pulumi stack?",
    "choices": [
      "A separate copy of your program's source code per environment",
      "An independent instance of one program with its own state and config (e.g. dev, staging, prod)",
      "The state backend where resources are stored",
      "A template used by pulumi new"
    ],
    "answer": 1,
    "explain": "Stacks let one program target many environments. Each stack has its own state and its own config values, selected with pulumi stack select."
  },
  {
    "q": "How do you store a database password in stack config without leaving it as cleartext?",
    "choices": [
      "pulumi config set dbPassword '...' and hope nobody opens the file",
      "Put it directly in index.ts as a string constant",
      "pulumi config set --secret dbPassword '...', which encrypts it before writing",
      "Set it as an environment variable only; Pulumi cannot store secrets"
    ],
    "answer": 2,
    "explain": "The --secret flag encrypts the value in the stack config and state, and Pulumi masks it in CLI output. Read it back with requireSecret."
  },
  {
    "q": "In pulumi up output, what does a +- (replace) symbol on a resource mean?",
    "choices": [
      "The resource is updated in place with no downtime",
      "The resource will be destroyed and recreated",
      "The resource is unchanged",
      "The resource's config has a syntax error"
    ],
    "answer": 1,
    "explain": "+ is create, ~ is update in place, - is delete, and +- means a replacement: destroy then recreate. Worth catching in preview before you apply."
  }
]
```

[← Phase 1: What Pulumi actually is](01-what-pulumi-actually-is.md) | [Overview](_guide.md) | [Phase 3: Where the rope gets you →](03-where-the-rope-gets-you.md)
