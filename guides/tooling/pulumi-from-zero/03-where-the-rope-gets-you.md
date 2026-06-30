---
title: "Where the rope gets you"
guide: pulumi-from-zero
phase: 3
summary: "Infrastructure as actual code: define cloud resources in TypeScript, Python, or Go, with real loops and functions, while Pulumi tracks state like Terraform."
tags: [pulumi, iac, infrastructure-as-code, devops, cloud, typescript, python]
difficulty: intermediate
synonyms: [pulumi tutorial, pulumi vs terraform, infrastructure as code typescript, pulumi python, pulumi state, pulumi stack, iac general purpose language]
updated: 2026-06-30
---

# Where the rope gets you

Phase 1 sold you on the upside: a real language means real loops, functions, and types. This phase is the bill for that power. A general-purpose language can express things infrastructure shouldn't do, and the most common Pulumi surprises come from forgetting that your program describes a desired state - it isn't a script that runs top to bottom the way you read it.

## Outputs aren't values yet

This is the single biggest source of confusion for newcomers. A resource property like a bucket's name or an instance's IP doesn't exist until Pulumi creates the resource. So Pulumi gives you an **Output** - a promise of a future value, not the value itself. You can't treat it like a plain string.

```typescript
const bucket = new aws.s3.Bucket("data");

// WRONG: bucket.id is an Output, not a string.
const url = "https://" + bucket.id + ".example.com";
// → you get "https://Calculating...something or [object Object]", not a URL

// RIGHT: enter the Output to use its eventual value.
const url = pulumi.interpolate`https://${bucket.id}.example.com`;
```

*What just happened:* the first line tried to concatenate an Output as if it were already a string, producing garbage. `pulumi.interpolate` (or `bucket.id.apply(id => ...)`) waits for the real value and computes the URL once it exists. The rule: to use what's *inside* an Output, you go through `.apply` or `interpolate` - you never read it directly.

> If you find yourself logging an Output and seeing `Calculating...` or `[object Object]`, that's the tell. The value isn't ready; you need `.apply`.

## Side effects in your program will burn you

Because it's real code, nothing stops you from calling an API, reading a file, or generating a random value at the top level of your program. But Pulumi may run your program during `preview` and again during `up`, and it expects the program to be a pure description. Side effects make your infrastructure non-deterministic.

```python
import random
import pulumi_aws as aws

# WRONG: a new name every run → Pulumi thinks the resource changed,
# and replaces it every single deploy.
name = f"cache-{random.randint(0, 9999)}"
bucket = aws.s3.Bucket(name)
```

*What just happened:* `random.randint` produced a different name on each run, so Pulumi saw the declaration drift from state and kept replacing the bucket. The fix is to let Pulumi own randomness via a resource built for it (the `random` provider's `RandomId`/`RandomPet`), which stores the value in state so it's stable across runs.

The general rule: keep your program deterministic. Compute things from config and other resources, not from the clock, the filesystem, or live API calls at deploy time.

## State is shared and fragile

Phase 1 called state precious; here's why it bites. State records what you own. Two dangers dominate:

- **Concurrent writes.** Two people (or two CI jobs) running `up` on the same stack at once can corrupt state. Pulumi's managed backends take a lock per stack to prevent this; a plain local-file backend does not.
- **State drift.** Someone changes a resource by hand in the console. Now state and reality disagree, and your next `up` may try to "fix" the manual change or fail.

```console
$ pulumi refresh
     Type              Name      Plan
 ~   aws:s3:Bucket     data      update   [diff: ~tags]

# refresh updates STATE to match the real cloud; it doesn't change your code.
```

*What just happened:* `refresh` reconciled state with the actual cloud, showing that someone had changed the bucket's tags by hand. After a refresh you can decide: update your code to match, or `up` to push your code's version back. The lesson underneath: pick a locking backend for any shared stack, and discourage console edits to managed resources.

## A whole language is more to get wrong

HCL is limited on purpose; that limitation is also a guardrail. Give a team a full language and you'll eventually find a 300-line function generating resources that nobody can follow, a clever abstraction that leaks, or a dependency on some npm package that breaks the build. The power that makes a hard case elegant makes a simple case over-engineered.

```typescript
// Tempting, and usually a mistake: deep cleverness in infra.
const tiers = computeTiersFromSomeHeuristic(loadExternalPlan());
tiers.forEach(t => buildEntireSubsystem(t));   // good luck reviewing the diff
```

*What just happened:* the readable, reviewable property of IaC quietly evaporated - the `preview` diff is now a function of code nobody can trace. Keep infra code boring. Loops and small helpers, yes; a framework, no. The goal is still that a reviewer reads the plan and understands it.

## So when should you reach for Pulumi over HCL?

Lean **Pulumi** when:

- Your team already lives in TypeScript/Python/Go and the cost of learning HCL is real.
- Infrastructure genuinely needs logic: values derived at deploy time, resources generated from dynamic lists, real unit tests over your infra code.
- You want to share infra as normal packages and use your language's tooling (types, IDE, linters).

Lean **HCL/Terraform** when:

- The team or ecosystem is already standardized on it, with established modules.
- Infrastructure is mostly static and flat, where a constrained DSL is a feature, not a limit.
- You want the guardrail of a language that *can't* do clever things.

Both share the same core model - declarative, state, plan-then-apply - so this is a choice of ergonomics and team fit, not of capability. If you want the other side of that comparison, [/guides/infrastructure-as-code-terraform](/guides/infrastructure-as-code-terraform) covers HCL directly.

## In the wild

The teams that stay happy on Pulumi treat the language as a tool for clarity, not a playground: deterministic programs, a locking shared backend, `preview` as a required CI check, and infra code held to the same boring standard as the rest of the repo. The rope is fine. You keep it short.

```quiz
[
  {
    "q": "Why can't you concatenate bucket.id directly into a string?",
    "choices": [
      "Pulumi forbids string operations on resources",
      "bucket.id is an Output - a future value that doesn't exist until the resource is created",
      "The id is always null in TypeScript",
      "You must call pulumi up first, then hard-code the result"
    ],
    "answer": 1,
    "explain": "Resource properties are Outputs: promises of values that exist only after creation. Use pulumi.interpolate or .apply to work with the eventual value."
  },
  {
    "q": "What's wrong with naming a resource using random.randint(...) at the top level of your program?",
    "choices": [
      "Random numbers aren't allowed in Python",
      "It's slower than a fixed name",
      "The name differs every run, so Pulumi sees drift and replaces the resource each deploy",
      "Nothing - it's the recommended way to get unique names"
    ],
    "answer": 2,
    "explain": "Programs should be deterministic descriptions. Side-effecting randomness changes the declaration each run. Use the random provider's resources, which store the value in state."
  },
  {
    "q": "When is HCL/Terraform often the better fit over Pulumi?",
    "choices": [
      "When infrastructure needs heavy deploy-time logic and dynamic generation",
      "When the team is already standardized on it and infra is mostly static and flat",
      "When you want to write unit tests over your infrastructure code",
      "When your team only knows TypeScript and Python"
    ],
    "answer": 1,
    "explain": "A constrained DSL is a feature for static, flat infra and established ecosystems. Pulumi shines when you need real logic or already live in a general-purpose language."
  }
]
```

[← Phase 2: The everyday loop](02-the-everyday-loop.md) | [Overview](_guide.md)
