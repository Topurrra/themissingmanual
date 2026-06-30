---
title: "Pulumi, From Zero"
guide: pulumi-from-zero
phase: 1
summary: "Infrastructure as actual code: define cloud resources in TypeScript, Python, or Go, with real loops and functions, while Pulumi tracks state like Terraform."
tags: [pulumi, iac, infrastructure-as-code, devops, cloud, typescript, python]
difficulty: intermediate
synonyms: [pulumi tutorial, pulumi vs terraform, infrastructure as code typescript, pulumi python, pulumi state, pulumi stack, iac general purpose language]
updated: 2026-06-30
---

# What Pulumi actually is

You've probably created cloud resources by hand at least once: clicked through a console, made a bucket, set a permission, forgot which checkbox you ticked. A week later nobody can say what's actually deployed or why. Infrastructure as Code fixes that by putting the answer in a file you can read, review, and replay. Pulumi's particular move is that the file is written in a language you already know.

## The one idea: a program that describes a desired end state

Here's the mental model to carry through everything else. Your Pulumi program does **not** run commands like "go make a bucket." It *declares* what should exist. You write code that constructs resource objects, Pulumi looks at what you declared, compares it to what's already out there, and figures out the create/update/delete steps to close the gap.

That word *declares* is the whole thing. Your program is a description, not a script. Running it twice with no changes does nothing the second time, because the description still matches reality.

```typescript
import * as aws from "@pulumi/aws";

// This is a DECLARATION, not a command.
// "There should be a bucket named like this, set up this way."
const logs = new aws.s3.Bucket("app-logs", {
    tags: { team: "platform" },
});

export const bucketName = logs.id;
```

*What just happened:* constructing `new aws.s3.Bucket(...)` didn't create anything yet. It registered your intent with Pulumi. The actual create happens later, when you run `pulumi up` and Pulumi reconciles this declaration against the real cloud.

## The part that's different from Terraform: it's real code

If you've seen Terraform, this is declarative too. The difference is the *language*. Terraform uses HCL, a domain-specific language built only for this. Pulumi uses a general-purpose language — TypeScript, Python, Go, C#, Java — running on its normal runtime.

That means the things you already do in code, you do here. Need ten buckets? A loop. Need to compute a name from two values? A function. Need a type checked before you deploy? Your language's type system does it.

```python
import pulumi_aws as aws

# A real for-loop. No special meta-syntax to learn.
environments = ["dev", "staging", "prod"]

buckets = {}
for env in environments:
    buckets[env] = aws.s3.Bucket(f"data-{env}",
        tags={"env": env})
```

*What just happened:* a plain Python `for` loop created three bucket declarations, named `data-dev`, `data-staging`, and `data-prod`. There's no new looping construct to memorize — it's the same loop you'd write in any other Python program.

Compare that to HCL, where you'd reach for `for_each` and a `toset(...)` expression. Neither is wrong; the Pulumi version is the language you already think in. That's the entire pitch in one example.

## State: how it remembers what it built

A declaration alone isn't enough. To know whether to create, update, or delete, Pulumi needs to remember what it made last time. That memory is the **state** — a record mapping each resource in your program to the real cloud resource it manages, including its current properties.

```text
your program          state file              real cloud
------------          ----------              ----------
"app-logs" bucket  →  id: app-logs-a1b2c3  →  s3://app-logs-a1b2c3
                      tags: {team: ...}        (actual bucket)
```

*What just happened:* the state sits between your code and the cloud as the source of truth for "what I manage." When you run a command, Pulumi reads state, reads your program, and diffs the two. This is the same model Terraform uses; if you know `terraform.tfstate`, you know the concept.

State lives somewhere — by default the Pulumi Cloud service (a free tier exists), or a backend you control like an S3 bucket, a GCS bucket, or even a local file. The backend is a choice, not a lock-in.

> Treat state as precious and shared. It is the only thing that knows which real resources your code owns. Lose it or let two people write it at once and Pulumi can lose track of resources or try to recreate things that already exist. Phase 3 returns to this.

## The flow you'll actually use

Three verbs carry most of the work, and they mirror the mental model exactly:

- `pulumi preview` — diff only. "Here's what I *would* change." No mutations.
- `pulumi up` — apply the diff. Create, update, delete to match your program.
- `pulumi destroy` — tear down everything in this stack.

```console
$ pulumi preview
Previewing update (dev)

     Type                 Name          Plan
 +   pulumi:pulumi:Stack  app-dev       create
 +   └─ aws:s3:Bucket     app-logs      create

Resources:
    + 2 to create
```

*What just happened:* `preview` showed a plan with `+ 2 to create` and changed nothing. The `+` marks creations, much like `terraform plan`. You read this before every `up` so there are no surprises — it's the "measure twice" step.

## For builders

The "real language" idea pays off most when infrastructure has logic in it: derive a config from an environment, generate resources from a list pulled at runtime, share a helper across projects as a normal package. If your infra is mostly static and flat, the advantage is smaller — and the extra power becomes extra rope, which is exactly what phase 3 is about.

If Pulumi's state and diff model feels familiar, that's because it shares DNA with [/guides/infrastructure-as-code-terraform](/guides/infrastructure-as-code-terraform). And if "what's a bucket, a VPC, an IAM role" is the fuzzy part, [/guides/cloud-platforms-explained](/guides/cloud-platforms-explained) fills that in.

```quiz
[
  {
    "q": "What does constructing a resource object (e.g. new aws.s3.Bucket(...)) actually do when the program runs?",
    "choices": [
      "Immediately creates the bucket in the cloud",
      "Registers a declaration of intent that Pulumi reconciles later during up",
      "Writes directly to the state file and stops",
      "Sends an HTTP request to the cloud provider's console"
    ],
    "answer": 1,
    "explain": "Pulumi programs declare desired state. The real create/update/delete happens during pulumi up, when Pulumi diffs the declaration against state and the cloud."
  },
  {
    "q": "What is the main thing that distinguishes Pulumi from Terraform's HCL?",
    "choices": [
      "Pulumi does not use a state file",
      "Pulumi is imperative and runs commands step by step",
      "Pulumi uses a general-purpose language with real loops, functions, and types",
      "Pulumi can only target AWS"
    ],
    "answer": 2,
    "explain": "Both are declarative and both keep state. Pulumi's distinguishing trait is using TypeScript/Python/Go/etc. instead of a purpose-built DSL."
  },
  {
    "q": "Why does Pulumi need a state file?",
    "choices": [
      "To remember which real cloud resources its program manages, so it can diff and decide create/update/delete",
      "To store your cloud credentials",
      "To cache the provider plugin binaries",
      "It does not; state is optional and unused"
    ],
    "answer": 0,
    "explain": "State maps each resource in your program to the real resource it manages. Without it, Pulumi can't tell what already exists or what it owns."
  }
]
```

[← Overview](_guide.md) | [Phase 2: The everyday loop →](02-the-everyday-loop.md)
